// Payment Page Functionality
document.addEventListener('DOMContentLoaded', () => {
  // Dark Mode Toggle
  const darkModeBtn = document.getElementById('darkModeBtn');
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  
  if (savedDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️';
  }
  
  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeBtn.textContent = isDark ? '☀️' : '🌙';
  });

  const courseItems = document.querySelectorAll('.course-item');
  const selectedCourseInput = document.getElementById('selectedCourse');
  const displayPriceInput = document.getElementById('displayPrice');
  const paymentForm = document.getElementById('paymentForm');
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');
  const cardCVCInput = document.getElementById('cardCVC');
  const toast = document.getElementById('toast');

  let selectedPrice = 0;
  let selectedCourseName = '';

  // Course selection
  courseItems.forEach(item => {
    const selectBtn = item.querySelector('.select-course');
    
    selectBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove previous selection
      courseItems.forEach(c => c.classList.remove('selected'));
      
      // Add selection to current item
      item.classList.add('selected');
      
      // Update form inputs
      selectedCourseName = item.dataset.name;
      selectedPrice = item.dataset.price;
      
      selectedCourseInput.value = selectedCourseName;
      displayPriceInput.textContent = `$${selectedPrice}`;
      
      showToast(`تم اختيار: ${selectedCourseName}`, 'success');
    });
  });

  // Format card number with spaces
  cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = formatted;
  });

  // Format card expiry
  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
  });

  // Only allow numbers for CVC
  cardCVCInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  // Form submission
  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate course selection
    if (!selectedCourseName) {
      showToast('يرجى اختيار كورس أولاً', 'error');
      return;
    }

    // Validate form fields
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const cardNumber = cardNumberInput.value.replace(/\s/g, '');
    const cardExpiry = cardExpiryInput.value;
    const cardCVC = cardCVCInput.value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    if (!fullName) {
      showToast('يرجى إدخال الاسم الكامل', 'error');
      return;
    }

    if (!email || !validateEmail(email)) {
      showToast('يرجى إدخال بريد إلكتروني صحيح', 'error');
      return;
    }

    if (!phone) {
      showToast('يرجى إدخال رقم الهاتف', 'error');
      return;
    }

    if (cardNumber.length < 13) {
      showToast('رقم البطاقة غير صحيح', 'error');
      return;
    }

    if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
      showToast('تاريخ انتهاء البطاقة غير صحيح', 'error');
      return;
    }

    if (cardCVC.length < 3) {
      showToast('كود CVC غير صحيح', 'error');
      return;
    }

    if (!agreeTerms) {
      showToast('يرجى الموافقة على الشروط والأحكام', 'error');
      return;
    }

    // Process payment
    processPayment({
      course: selectedCourseName,
      price: selectedPrice
    });
  });

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function processPayment(data) {
    const btn = paymentForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ جاري معالجة الدفع...';
    btn.disabled = true;

    setTimeout(() => {
      const demoOrderId = Math.random().toString(36).slice(2, 11);
      showToast(`انتهت محاكاة الدفع فقط (${data.course}، $${data.price}). رقم تجريبي: ${demoOrderId}`, 'success');
      
      // Reset form
      paymentForm.reset();
      selectedCourseInput.value = '';
      displayPriceInput.textContent = '$0';
      courseItems.forEach(c => c.classList.remove('selected'));

      btn.textContent = originalText;
      btn.disabled = false;

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = 'courses.html';
      }, 2000);
    }, 1500);
  }

  function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
