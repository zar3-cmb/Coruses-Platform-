const { createHash, randomBytes, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto');
const { createServer } = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const { promisify } = require('node:util');
const { existsSync, mkdirSync, readFileSync, statSync } = require('node:fs');
const { extname, join, resolve, sep } = require('node:path');

const scrypt = promisify(scryptCallback);
const root = __dirname;
const dataDirectory = join(root, 'data');
mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(join(dataDirectory, 'courses.sqlite'));
database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_salt BLOB NOT NULL,
    password_hash BLOB NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
`);

const port = Number(process.env.PORT || 8000);
const sessionCookie = 'courses_session';
const sessionDuration = 24 * 60 * 60 * 1000;
const rememberedSessionDuration = 30 * sessionDuration;
const rateLimitWindow = 60 * 1000;
const rateLimitMax = 10;
const maxBodyBytes = 16 * 1024;
const rateLimits = new Map();
const dummySalt = randomBytes(16);
const dummyHashPromise = hashPassword('not-a-real-password', dummySalt);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password, salt) {
  return scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  response.end(JSON.stringify(value));
}

function readCookie(request, name) {
  const cookies = request.headers.cookie || '';
  const entry = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : '';
}

function setSessionCookie(response, token, remember, duration) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = remember ? `; Max-Age=${Math.floor(duration / 1000)}` : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookie}=${token}; HttpOnly; SameSite=Lax; Path=/${maxAge}${secure}`
  );
}

function clearSessionCookie(response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${sessionCookie}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`
  );
}

function getUserFromSession(request) {
  const token = readCookie(request, sessionCookie);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;

  const row = database.prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), Date.now());
  return row || null;
}

function issueSession(userId, remember, response) {
  const duration = remember ? rememberedSessionDuration : sessionDuration;
  const token = randomBytes(32).toString('hex');
  database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, Date.now() + duration);
  setSessionCookie(response, token, remember, duration);
}

async function readJsonBody(request) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'نوع الطلب غير مدعوم.');
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) throw new HttpError(413, 'حجم الطلب أكبر من المسموح.');
    chunks.push(chunk);
  }

  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Expected an object.');
    }
    return body;
  } catch {
    throw new HttpError(400, 'بيانات الطلب غير صالحة.');
  }
}

function checkRateLimit(request) {
  const now = Date.now();
  const address = request.socket.remoteAddress || 'unknown';
  let limit = rateLimits.get(address);
  if (!limit || now - limit.startedAt >= rateLimitWindow) {
    limit = { startedAt: now, count: 0 };
    rateLimits.set(address, limit);
  }
  limit.count += 1;

  if (rateLimits.size > 5000) {
    for (const [key, value] of rateLimits) {
      if (now - value.startedAt >= rateLimitWindow) rateLimits.delete(key);
    }
  }
  if (limit.count > rateLimitMax) throw new HttpError(429, 'محاولات كثيرة. انتظر دقيقة ثم حاول مجددًا.');
}

function validateCredentials(name, email, password, requireName) {
  if (requireName && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60)) {
    throw new HttpError(400, 'يجب أن يتراوح الاسم بين حرفين و60 حرفًا.');
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'أدخل بريدًا إلكترونيًا صحيحًا.');
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new HttpError(400, 'يجب أن تتكون كلمة المرور من 8 إلى 128 حرفًا.');
  }
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/auth/me') {
    const user = getUserFromSession(request);
    if (!user) return sendJson(response, 401, { message: 'سجّل الدخول للمتابعة.' });
    return sendJson(response, 200, { user });
  }

  if (request.method === 'POST' && pathname === '/api/auth/logout') {
    const token = readCookie(request, sessionCookie);
    if (/^[a-f0-9]{64}$/.test(token)) {
      database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    }
    clearSessionCookie(response);
    response.writeHead(204, { 'Cache-Control': 'no-store' });
    return response.end();
  }

  if (request.method !== 'POST' || !['/api/auth/register', '/api/auth/login'].includes(pathname)) {
    return sendJson(response, 404, { message: 'المسار غير موجود.' });
  }

  const origin = request.headers.origin;
  if (origin) {
    const protocol = request.socket.encrypted ? 'https' : 'http';
    if (origin !== `${protocol}://${request.headers.host}`) {
      throw new HttpError(403, 'مصدر الطلب غير مسموح.');
    }
  }
  checkRateLimit(request);

  const body = await readJsonBody(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email;
  const password = body.password;

  if (pathname === '/api/auth/register') {
    validateCredentials(body.name, email, password, true);
    const normalizedName = body.name.trim();
    const salt = randomBytes(16);
    const passwordHash = await hashPassword(password, salt);
    const remember = body.remember === true;
    const duration = remember ? rememberedSessionDuration : sessionDuration;

    try {
      database.exec('BEGIN IMMEDIATE');
      const result = database.prepare(`
        INSERT INTO users (name, email, password_salt, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(normalizedName, email, salt, passwordHash, Date.now());
      const userId = Number(result.lastInsertRowid);
      const user = { id: userId, name: normalizedName, email };
      issueSession(userId, remember, response);
      database.exec('COMMIT');
      return sendJson(response, 201, { user });
    } catch (error) {
      database.exec('ROLLBACK');
      if (error.message.includes('UNIQUE constraint failed: users.email')) {
        return sendJson(response, 409, { message: 'يوجد حساب مسجل بهذا البريد الإلكتروني.' });
      }
      throw error;
    }
  }

  validateCredentials(undefined, email, password, false);
  const account = database.prepare(`
    SELECT id, name, email, password_salt, password_hash FROM users WHERE email = ?
  `).get(email);
  const salt = account ? account.password_salt : dummySalt;
  const expectedHash = account ? account.password_hash : await dummyHashPromise;
  const actualHash = await hashPassword(password, salt);
  const passwordMatches = timingSafeEqual(actualHash, expectedHash);

  if (!account || !passwordMatches) {
    return sendJson(response, 401, { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }

  const remember = body.remember === true;
  issueSession(account.id, remember, response);
  return sendJson(response, 200, {
    user: { id: account.id, name: account.name, email: account.email }
  });
}

function getStaticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = decoded === '/' ? '/index.html' : decoded;
  const allowedRootFiles = new Set([
    '/index.html',
    '/courses.html',
    '/login.html',
    '/payment.html',
    '/testimonials.html'
  ]);
  const isAsset = /^\/(css|js)\/[a-zA-Z0-9._-]+\.(css|js)$/.test(requested);
  if (!allowedRootFiles.has(requested) && !isAsset) return null;

  const filePath = resolve(root, `.${requested.replaceAll('/', sep)}`);
  if (!filePath.startsWith(`${root}${sep}`) || !existsSync(filePath) || !statSync(filePath).isFile()) return null;
  return filePath;
}

function serveStatic(request, response, pathname) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }

  let filePath;
  try {
    filePath = getStaticFile(pathname);
  } catch {
    return sendJson(response, 400, { message: 'عنوان الصفحة غير صالح.' });
  }
  if (!filePath) return sendJson(response, 404, { message: 'الصفحة غير موجودة.' });

  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
  response.writeHead(200, {
    'Content-Type': types[extname(filePath)],
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') return response.end();
  response.end(readFileSync(filePath));
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url.pathname);
      return;
    }
    serveStatic(request, response, url.pathname);
  } catch (error) {
    if (error instanceof HttpError) {
      return sendJson(response, error.status, { message: error.message });
    }
    console.error('Request failed:', error);
    if (!response.headersSent) sendJson(response, 500, { message: 'حدث خطأ في الخادم. حاول مرة أخرى.' });
    else response.destroy();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Courses platform server is running at http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      database.close();
      process.exit(0);
    });
  });
}
