document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const remember = document.getElementById('remember');
  const loginError = document.getElementById('error');
  const signupError = document.getElementById('signupError');

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
      const { user } = await request('/api/auth/login', {
        email,
        password,
        remember: remember.checked
      });

      if (remember.checked) {
        localStorage.setItem('bad2-remember', JSON.stringify({ email }));
      } else {
        localStorage.removeItem('bad2-remember');
      }
      sessionStorage.setItem('courses-current-user', JSON.stringify(user));
      window.location.href = 'courses.html';
    } catch (error) {
      showError(loginError, error.message || 'تعذّر الاتصال بالخادم. حاول مجددًا.');
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
    if (password.length < 8 || password.length > 128) return showError(signupError, 'يجب أن تتكون كلمة المرور من 8 إلى 128 حرفًا.');
    if (password !== confirmation) return showError(signupError, 'كلمتا المرور غير متطابقتين.');

    try {
      const { user } = await request('/api/auth/register', { name, email, password });
      sessionStorage.setItem('courses-current-user', JSON.stringify(user));
      window.location.href = 'courses.html';
    } catch (error) {
      showError(signupError, error.message || 'تعذّر الاتصال بالخادم. حاول مجددًا.');
    }
  });

  async function request(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    const result = response.status === 204 ? {} : await response.json();
    if (!response.ok) throw new Error(result.message || 'تعذّر إتمام الطلب.');
    return result;
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
