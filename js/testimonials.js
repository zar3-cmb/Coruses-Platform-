document.addEventListener('DOMContentLoaded', () => {
    const reviewsKey = 'courses-reviews';
    const grid = document.getElementById('testimonials-grid');
    const form = document.getElementById('commentForm');
    const signInPrompt = document.getElementById('signInPrompt');
    const authorLabel = document.getElementById('commentAuthor');
    const message = document.getElementById('commentMessage');
    const emptyState = document.getElementById('emptyReviews');
    const countHeading = document.getElementById('reviewCount');
    document.getElementById('year').textContent = new Date().getFullYear();

    let activeUser;
    try {
        activeUser = JSON.parse(sessionStorage.getItem('courses-current-user') || 'null');
    } catch {
        showMessage('تعذّر قراءة جلسة الدخول. سجّل الدخول مرة أخرى.', true);
    }

    if (activeUser && typeof activeUser.name === 'string' && typeof activeUser.email === 'string') {
        form.hidden = false;
        authorLabel.textContent = `سيظهر رأيك باسم: ${activeUser.name}`;
    } else {
        signInPrompt.hidden = false;
    }

    renderReviews();

    form.addEventListener('submit', event => {
        event.preventDefault();
        clearMessage();

        const course = document.getElementById('commentCourse').value;
        const rating = Number(document.getElementById('commentRating').value);
        const comment = document.getElementById('commentText').value.trim();

        if (!activeUser) return showMessage('سجّل الدخول قبل نشر رأيك.', true);
        if (!course) return showMessage('اختر الكورس الذي تود تقييمه.', true);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return showMessage('اختر تقييمًا من نجمة إلى خمس نجوم.', true);
        if (comment.length < 10 || comment.length > 1000) {
            return showMessage('يجب أن يتراوح الرأي بين 10 و1000 حرف.', true);
        }

        try {
            const reviews = readReviews();
            reviews.unshift({
                id: createReviewId(),
                name: activeUser.name,
                email: activeUser.email,
                course,
                rating,
                comment,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem(reviewsKey, JSON.stringify(reviews));
            form.reset();
            renderReviews();
            showMessage('تم نشر رأيك على هذا الجهاز.', false);
        } catch (error) {
            showMessage(error.message || 'تعذّر حفظ رأيك. تحقق من مساحة التخزين وحاول مجددًا.', true);
        }
    });

    function readReviews() {
        const stored = localStorage.getItem(reviewsKey);
        if (!stored) return [];
        const reviews = JSON.parse(stored);
        if (!Array.isArray(reviews)) throw new Error('بيانات الآراء المحفوظة غير صالحة.');
        return reviews;
    }

    function renderReviews() {
        grid.replaceChildren();
        let reviews;
        try {
            reviews = readReviews();
        } catch (error) {
            emptyState.hidden = false;
            emptyState.textContent = error.message || 'تعذّر تحميل الآراء المحفوظة.';
            countHeading.textContent = 'تعذّر تحميل الآراء';
            return;
        }

        countHeading.textContent = `آراء المتعلمين (${reviews.length})`;
        emptyState.hidden = reviews.length > 0;
        reviews.forEach(review => grid.appendChild(createReviewCard(review)));
    }

    function createReviewCard(review) {
        const card = document.createElement('article');
        card.className = 'testimonial-card';

        const heading = document.createElement('div');
        heading.className = 'review-heading';

        const avatar = document.createElement('span');
        avatar.className = 'review-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = getInitials(review.name);

        const identity = document.createElement('div');
        const name = document.createElement('h3');
        name.textContent = review.name;
        const date = document.createElement('time');
        date.className = 'review-date';
        const parsedDate = new Date(review.createdAt);
        if (!Number.isNaN(parsedDate.getTime())) {
            date.dateTime = parsedDate.toISOString();
            date.textContent = parsedDate.toLocaleDateString('ar');
        }
        identity.append(name, date);
        heading.append(avatar, identity);

        const rating = document.createElement('div');
        rating.className = 'rating';
        rating.setAttribute('role', 'img');
        rating.setAttribute('aria-label', `تقييم ${review.rating} من 5`);
        for (let star = 1; star <= 5; star += 1) {
            const icon = document.createElement('i');
            icon.className = star <= review.rating ? 'fas fa-star' : 'far fa-star';
            icon.setAttribute('aria-hidden', 'true');
            rating.appendChild(icon);
        }

        const text = document.createElement('p');
        text.className = 'review-text';
        text.textContent = review.comment;

        const course = document.createElement('span');
        course.className = 'course-name';
        course.textContent = review.course;

        card.append(heading, rating, text, course);
        return card;
    }

    function getInitials(name) {
        return name.trim().slice(0, 1) || '؟';
    }

    function createReviewId() {
        return typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function showMessage(text, isError) {
        message.textContent = text;
        message.className = isError ? 'form-message error-message' : 'form-message success-message';
    }

    function clearMessage() {
        message.textContent = '';
        message.className = 'form-message';
    }
});
