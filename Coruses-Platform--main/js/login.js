document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const remember = document.getElementById('remember');
  const loginError = document.getElementById('error');
  const signupError = document.getElementById('signupError');
  const usersStorageKey = 'courses-users';
  const demoEmail = 'student@example.com';
  const demoPassword = '1234';
  const passwordIterations = 310000;

  document.getElementById('showSignup').addEventListener('click', () => {
    loginForm.hidden = true;
    signupForm.hidden = false;
    document.getElementById('signupName').focus();
  });

  document.getElementById('showLogin').addEventListener('click', () => {
    signupForm.hidden = true;
    loginForm.hidden = false;
    emailInput.focus();
  });

  try {
    const saved = localStorage.getItem('bad2-remember');
    if (saved) {
      const { email } = JSON.parse(saved);
      if (email) {
        emailInput.value = email;
        remember.checked = true;
      }
    }
  } catch {
    showError(loginError, 'تعذّر قراءة بيانات التذكّر المحفوظة. امسح بيانات الموقع وحاول مجددًا.');
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearError(loginError);

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    if (!email || !validateEmail(email)) return showError(loginError, 'أدخل بريدًا إلكترونيًا صحيحًا.');
    if (!password) return showError(loginError, 'أدخل كلمة المرور.');

    try {
      let user;
      if (email === demoEmail && password === demoPassword) {
        user = { name: 'طالب', email: demoEmail };
      } else {
        const users = readUsers();
        const account = users.find(candidate => candidate.email === email);
        if (!account || !await verifyPassword(password, account)) {
          return showError(loginError, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        }
        user = { name: account.name, email: account.email };
      }

      if (remember.checked) {
        localStorage.setItem('bad2-remember', JSON.stringify({ email }));
      } else {
        localStorage.removeItem('bad2-remember');
      }
      sessionStorage.setItem('courses-current-user', JSON.stringify(user));
      window.location.href = 'courses.html';
    } catch (error) {
      showError(loginError, error.message || 'تعذّر تسجيل الدخول. تحقق من مساحة التخزين وحاول مجددًا.');
    }
  });

  signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    clearError(signupError);

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const confirmation = document.getElementById('signupPasswordConfirm').value;

    if (name.length < 2) return showError(signupError, 'اكتب اسمًا مكوّنًا من حرفين على الأقل.');
    if (!validateEmail(email)) return showError(signupError, 'أدخل بريدًا إلكترونيًا صحيحًا.');
    if (password.length < 8) return showError(signupError, 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
    if (password !== confirmation) return showError(signupError, 'كلمتا المرور غير متطابقتين.');
    if (email === demoEmail) return showError(signupError, 'هذا البريد مخصص للحساب الجاهز. اختر بريدًا آخر.');

    try {
      const users = readUsers();
      if (users.some(user => user.email === email)) {
        return showError(signupError, 'يوجد حساب مسجل بهذا البريد الإلكتروني.');
      }

      const credentials = await createPasswordRecord(password);
      users.push({ name, email, ...credentials });
      localStorage.setItem(usersStorageKey, JSON.stringify(users));
      sessionStorage.setItem('courses-current-user', JSON.stringify({ name, email }));
      window.location.href = 'courses.html';
    } catch (error) {
      showError(signupError, error.message || 'تعذّر إنشاء الحساب. تحقق من مساحة التخزين وحاول مجددًا.');
    }
  });

  function readUsers() {
    const stored = localStorage.getItem(usersStorageKey);
    if (!stored) return [];
    const users = JSON.parse(stored);
    if (!Array.isArray(users)) throw new Error('بيانات الحسابات المحفوظة غير صالحة.');
    return users;
  }

  async function createPasswordRecord(password) {
    if (!crypto.subtle) throw new Error('المتصفح لا يدعم حماية كلمة المرور المطلوبة.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return {
      salt: bytesToHex(salt),
      passwordHash: await derivePasswordHash(password, salt, passwordIterations),
      passwordIterations
    };
  }

  async function verifyPassword(password, account) {
    if (!crypto.subtle || !account.salt || !account.passwordHash
      || !Number.isInteger(account.passwordIterations)
      || account.passwordIterations < 100000
      || account.passwordIterations > 1000000) return false;
    return await derivePasswordHash(password, hexToBytes(account.salt), account.passwordIterations) === account.passwordHash;
  }

  async function derivePasswordHash(password, salt, iterations) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      material,
      256
    );
    return bytesToHex(new Uint8Array(hash));
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function hexToBytes(hex) {
    if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('بيانات الحساب المحفوظة غير صالحة.');
    return new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
  }

  function clearError(element) {
    element.textContent = '';
    element.classList.remove('show');
  }
});
