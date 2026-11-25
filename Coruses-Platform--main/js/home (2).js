document.addEventListener('DOMContentLoaded', () => {

  const coursesCount = 6;
  const element = document.querySelector('h1');
  
  if (element) {

    const counter = document.createElement('div');
    counter.className = 'course-counter';
    counter.innerHTML = `<p>لدينا <span id="courseNum">0</span>+ دورة متاحة</p>`;
    element.parentNode.insertBefore(counter, element.nextSibling);
    

    animateCounter('courseNum', coursesCount, 2000);
  }
  
  addGreeting();
  
  addSmoothScroll();
  
  addButtonEffects();
});

function animateCounter(elementId, endValue, duration) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  let currentValue = 0;
  const increment = endValue / (duration / 16);
  const timer = setInterval(() => {
    currentValue += increment;
    if (currentValue >= endValue) {
      element.textContent = endValue;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(currentValue);
    }
  }, 16);
}

function addGreeting() {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour < 12) greeting = '🌅 صباح الخير! لنبدأ رحلة التعلم اليوم';
  else if (hour < 18) greeting = '☀️ مساء الخير! استمتع بالتعلم معنا';
  else greeting = '🌙 مساء الخير! وقت مثالي للتعلم';
  
  const greetingDiv = document.createElement('div');
  greetingDiv.className = 'greeting-msg';
  greetingDiv.textContent = greeting;

  document.body.insertBefore(greetingDiv, document.body.firstChild);
  setTimeout(() => greetingDiv.classList.add('show'), 100);
  setTimeout(() => greetingDiv.classList.remove('show'), 4000);
}

function addSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function addButtonEffects() {
  const button = document.querySelector('.button');
  if (!button) return;
  
  button.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.05)';
  });
  
  button.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
  });
}

window.addEventListener('beforeunload', () => {
  let visits = parseInt(localStorage.getItem('pageVisits')) || 0;
  localStorage.setItem('pageVisits', visits + 1);
});

console.log('%cمرحباً بك في منصة الكورسات المجانية', 'font-size: 18px; color: #3b82f6; font-weight: bold;');
console.log('%cننصحك باستكشاف الكورسات المتاحة لتطوير مهاراتك', 'font-size: 14px; color: #6b7280;');
