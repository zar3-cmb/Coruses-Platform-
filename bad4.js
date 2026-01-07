const testimonialsGrid = document.getElementById('testimonials-grid');
const yearEl = document.getElementById('year');

yearEl.textContent = new Date().getFullYear();

function getRandomInt(min, max) {

    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}


const names = ['أحمد', 'فاطمة', 'محمد', 'سارة', 'يوسف', 'مريم', 'إبراهيم', 'خديجة', 'علي', 'عائشة'];
const courses = ['البرمجة المتقدمة', 'أساسيات التصميم الجرافيكي', 'التسويق الرقمي', 'إدارة المشاريع الاحترافية', 'علوم البيانات والذكاء الاصطناعي', 'اللغة الإنجليزية للأعمال', 'تحليل البيانات'];
const commentsTemplates = [
    "تجربة الكورس كانت رائعة ومفيدة جداً، فريق الدعم كان متعاون للغاية وأنصح الجميع بالاشتراك.",
    "محتوى غني وشامل، استفدت منه كثيراً في مسيرتي المهنية. شكراً للمدربين!",
    "لم أتوقع هذا المستوى من الجودة في الشرح والتنظيم. أنتم الأفضل.",
    "بفضل هذا الكورس حصلت على وظيفة أحلامي. شكراً جزيلاً لفريق العمل.",
    "واجهة سهلة الاستخدام وشروحات واضحة ومباشرة. تقييمي 5 نجوم.",
    "أكثر من رائع، الكورس منظم بشكل ممتاز ويغطي كل الجوانب اللازمة للنجاح.",
    "تفاعلي وورش العمل كانت الجزء المفضل لدي، ساعدتني على تطبيق المفاهيم عملياً.",
    "فريق الدعم الفني يرد بسرعة كبيرة ويحل المشاكل بفاعلية. خدمة عملاء ممتازة.",
    "السعر مقابل القيمة لا يصدق. لقد حصلت على معرفة تساوي أضعاف ما دفعته.",
    "المدرب كان محترفاً جداً وقادراً على تبسيط المعلومات المعقدة. أحسنت!",
    "تجربة تعليمية متكاملة من البداية للنهاية. سعيد جداً باختياري لكم.",
    "المجتمع الطلابي داخل المنصة كان داعماً جداً، تبادل الخبرات كان ممتعاً.",
    "لقد تغيرت نظرتي للمجال بالكامل بعد هذا الكورس. فتح لي آفاق جديدة.",
    "الكورس يستحق كل جنيه دفعته فيه. شكراً على المجهود المبذول.",
    "أنصح به كل شخص يرغب في تطوير مهاراته بسرعة وكفاءة."
];


function createTestimonialCard(name, course, comment, rating, imgIndex) {
    const card = document.createElement('div');
    card.classList.add('testimonial-card');


    let starsHtml = '';
    for (let i = 0; i < Math.floor(rating); i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    if (rating % 1 !== 0) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }

    for (let i = 0; i < (5 - Math.ceil(rating)); i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }

    card.innerHTML = `
        <div class="user-info">
            <img src="i.pravatar.cc{imgIndex}" alt="صورة العميل">
            <h4>${name}</h4>
        </div>
        <div class="rating">
            ${starsHtml}
        </div>
        <p>"${comment}"</p>
        <span class="course-name">كورس: ${course}</span>
    `;

    return card;
}

window.addEventListener('load', () => {

    const numTestimonials = 120; 

    for (let i = 0; i < numTestimonials; i++) {

        const randomName = names[getRandomInt(0, names.length - 1)];
        const randomCourse = courses[getRandomInt(0, courses.length - 1)];
        const randomComment = commentsTemplates[getRandomInt(0, commentsTemplates.length - 1)];

        const randomRating = getRandomInt(40, 50) / 10; 

        const randomImgIndex = getRandomInt(1, 100);

        const card = createTestimonialCard(randomName, randomCourse, randomComment, randomRating, randomImgIndex);
        testimonialsGrid.appendChild(card);
    }

    console.log(`تم توليد وعرض ${numTestimonials} تعليق للعملاء.`);
});
