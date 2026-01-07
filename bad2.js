// Simple login validation and remember-me handling
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  const remember = document.getElementById('remember');
  const errorBox = document.getElementById('error');

  // Prefill if remembered
  try{
    const saved = localStorage.getItem('bad2-remember');
    if (saved) {
      const obj = JSON.parse(saved);
      if (obj.email) emailInput.value = obj.email;
      remember.checked = true;
    }
  } catch(e){/* ignore */}

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    errorBox.classList.remove('show');
    errorBox.textContent = '';

    const email = emailInput.value.trim();
    const pass = passInput.value;

    if (!email) return showError('الرجاء إدخال البريد الإلكتروني');
    if (!validateEmail(email)) return showError('الرجاء إدخال بريد إلكتروني صحيح');
    if (!pass) return showError('الرجاء إدخال كلمة المرور');

    // Demo credential check (replace with real auth)
    const demoEmail = 'student@example.com';
    const demoPass = '1234';

    if (email === demoEmail && pass === demoPass) {
      // remember me
      if (remember.checked) {
        localStorage.setItem('bad2-remember', JSON.stringify({email: email}));
      } else {
        localStorage.removeItem('bad2-remember');
      }
      // redirect to courses page
      window.location.href = 'bad3.html';
    } else {
      showError('بيانات غير صحيحة. جرب: student@example.com / 1234');
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.add('show');
  }

  function validateEmail(email) {
    // simple regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
