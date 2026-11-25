// Dark mode toggle
document.addEventListener('DOMContentLoaded', () => {
  const darkModeBtn = document.getElementById('darkModeToggle');
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

  // Courses functionality
  const courses = [
    {id:1,title:'مقدمة في البرمجة بلغة بايثون',category:'programming',desc:'مسار للمبتدئين يغطي الأساسيات مع تدريبات عملية',hours:12,price:'مجانا'},
    {id:2,title:'بناء واجهات احترافية بـ HTML/CSS',category:'design',desc:'تصميم واجهات متجاوبة وحديثة مع أفضل الممارسات',hours:8,price:'50$'},
    {id:3,title:'JavaScript للمبتدئين',category:'programming',desc:'تعامل عملي مع اللغة لبناء تطبيقات تفاعلية',hours:10,price:'40$'},
    {id:4,title:'تصميم تجربة المستخدم (UX)',category:'design',desc:'مفاهيم UX وتصميم رحلات المستخدم الفعّالة',hours:6,price:'35$'},
    {id:5,title:'أساسيات التسويق الرقمي',category:'marketing',desc:'استراتيجيات التسويق عبر الإنترنت وتحليل الأداء',hours:9,price:'45$'},
    {id:6,title:'React عملي لتطبيقات الويب',category:'programming',desc:'بناء تطبيقات متقدمة مع React ومفاهيم الحالة',hours:16,price:'80$'}
  ];

  const grid = document.getElementById('coursesGrid');
  const search = document.getElementById('search');
  const category = document.getElementById('category');
  const toast = document.getElementById('toast');

  function render(list){
    grid.innerHTML='';
    if(list.length===0){grid.innerHTML='<p>لا توجد دورات مطابقة.</p>';return}
    list.forEach(c=>{
      const el = document.createElement('div');
      el.className='card';
      el.innerHTML=`
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
        <div class="meta">
          <span>${c.hours} ساعات</span>
          <div>
            <button class="btn enroll" data-id="${c.id}">${isEnrolled(c.id)?'مسجّل':'سجّل الآن'}</button>
            <span style="margin-inline-start:8px;color:var(--muted)">${c.price}</span>
          </div>
        </div>
      `;
      if(isEnrolled(c.id)){
        el.querySelector('.enroll').classList.add('enrolled');
      }
      grid.appendChild(el);
    });
    attachEnrollHandlers();
  }

  function isEnrolled(id){
    const enrolled = JSON.parse(localStorage.getItem('enrolled-courses')||'[]');
    return enrolled.includes(id);
  }

  function attachEnrollHandlers(){
    document.querySelectorAll('.enroll').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.id);
        toggleEnroll(id, btn);
      });
    });
  }

  function toggleEnroll(id, btn){
    let enrolled = JSON.parse(localStorage.getItem('enrolled-courses')||'[]');
    if(enrolled.includes(id)){
      enrolled = enrolled.filter(x=>x!==id);
      btn.textContent='سجّل الآن';
      btn.classList.remove('enrolled');
      showToast('تم إلغاء التسجيل');
    } else {
      enrolled.push(id);
      btn.textContent='مسجّل';
      btn.classList.add('enrolled');
      showToast('تم التسجيل بنجاح');
    }
    localStorage.setItem('enrolled-courses', JSON.stringify(enrolled));
  }

  function showToast(msg){
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(()=>{toast.style.display='none'},2000);
  }

  function filterAndRender(){
    const q = search.value.trim().toLowerCase();
    const cat = category.value;
    let res = courses.filter(c=>{
      const inCat = cat==='all' || c.category===cat;
      const inQ = !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
      return inCat && inQ;
    });
    render(res);
  }

  search.addEventListener('input', debounce(filterAndRender, 200));
  category.addEventListener('change', filterAndRender);

  // initial render
  filterAndRender();

  // helpers
  function debounce(fn, wait){
    let t;
    return function(){
      clearTimeout(t);
      t = setTimeout(()=>fn.apply(this, arguments), wait);
    }
  }
});
