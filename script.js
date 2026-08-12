document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const WHATSAPP_NUMBER = '966500362696';
    const FORM_ENDPOINT = 'https://formspree.io/f/xvgdvqzg';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // قائمة الخدمات والأسعار الحالية كما هي دون تغيير.
    const services = [
        { name: 'مكيف اسبليت', price: 50, unit: 'qty', description: 'غسيل وصيانة الفلاتر', icon: 'https://img.icons8.com/ios/80/ffffff/air-conditioner--v1.png', type: 'calculator', featured: true },
        { name: 'مكيف شباك', price: 35, unit: 'qty', description: 'تنظيف شامل للوحدة', icon: '/shb.png', type: 'calculator', featured: true },
        { name: 'مكيف دولابي', price: 90, unit: 'qty', description: 'تنظيف شامل للمكيف الواقف', icon: '/mkef.png', type: 'calculator', featured: true },
        { name: 'الكنب', price: 20, unit: 'm', description: 'إزالة تامة للبقع والروائح', icon: 'https://img.icons8.com/ios/80/ffffff/sofa.png', type: 'calculator' },
        { name: 'الموكيت', price: 7, unit: 'm2', description: 'تنظيف عميق للموكيت والسجاد', icon: 'https://img.icons8.com/ios/80/ffffff/rug.png', type: 'calculator' },
        { name: 'الجلسة العربي', price: 10, unit: 'm', description: 'نظافة وتعقيم للجلسات', icon: 'https://img.icons8.com/ios/80/ffffff/cushion.png', type: 'calculator' },
        { name: 'ستائر', price: 12.5, unit: 'm2', description: 'تنظيف بالبخار في مكانها', icon: '/star.png', type: 'calculator' },
        { name: 'الخداديات', price: 7.5, unit: 'm', description: 'تنظيف وتعقيم الخداديات', icon: 'https://img.icons8.com/ios/80/ffffff/pillow.png', type: 'calculator' },
        { name: 'الأرضيات', price: 4, unit: 'm2', description: 'تلميع وجلي الأرضيات', icon: '/ard.png', type: 'calculator' },
        { name: 'النوافذ', price: 12.5, unit: 'qty', description: 'تنظيف وتلميع النوافذ', icon: '/nafth.png', type: 'calculator' },
        { name: 'مسابح', price: 350, unit: 'qty', description: 'تنظيف وتعقيم المسابح', icon: 'https://img.icons8.com/ios/80/ffffff/swimming-pool.png', type: 'calculator' },
        { name: 'شقة', description: 'تنظيف شامل للشقق السكنية', icon: 'https://img.icons8.com/ios/80/ffffff/apartment.png', type: 'booking' },
        { name: 'فله', description: 'تنظيف شامل للفلل', icon: '/flah.png', type: 'booking' },
        { name: 'خدمات المساجد', description: 'نظافة وتعقيم لبيوت الله', icon: 'https://img.icons8.com/ios/80/ffffff/mosque.png', type: 'discount', discount: 50 }
    ];

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    const featuredServicesGrid = document.getElementById('featured-services-grid');
    const allServicesGrid = document.getElementById('all-services-grid');
    const bookingServicesGrid = document.getElementById('booking-services-grid');
    let previouslyFocusedElement = null;
    let calculatorEventSent = false;

    function trackEvent(eventName, details = {}) {
        const eventPayload = {
            event: eventName,
            details,
            timestamp: new Date().toISOString()
        };
        window.cleanTimeEventQueue = window.cleanTimeEventQueue || [];
        window.cleanTimeEventQueue.push(eventPayload);
        window.dispatchEvent(new CustomEvent('clean-time:event', { detail: eventPayload }));
    }

    window.cleanTimeTracking = { trackEvent };

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function toEnglishDigits(value) {
        const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
        const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
        return String(value ?? '')
            .replace(/[٠-٩]/g, digit => arabicDigits.indexOf(digit))
            .replace(/[۰-۹]/g, digit => persianDigits.indexOf(digit));
    }

    function normalizeSaudiPhone(value) {
        let phone = toEnglishDigits(value).trim().replace(/[\s()-]/g, '');
        if (/^05\d{8}$/.test(phone)) phone = `+966${phone.slice(1)}`;
        if (/^9665\d{8}$/.test(phone)) phone = `+${phone}`;
        return /^\+9665\d{8}$/.test(phone) ? phone : null;
    }

    function getTodayString() {
        const now = new Date();
        const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 10);
    }

    function isBookableDate(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && value >= getTodayString();
    }

    function createOrderNumber() {
        const now = new Date();
        const datePart = [String(now.getFullYear()).slice(-2), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
        const uniquePart = `${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
        return `CT-${datePart}-${uniquePart}`;
    }

    function buildWhatsAppUrl(data, orderNumber = '') {
        const lines = [
            orderNumber ? `متابعة طلب رقم: #${orderNumber}` : 'طلب حجز جديد من موقع وقت النظافة',
            `الخدمة: ${data.service || 'غير محددة'}`,
            `الموقع: ${data.city || '-'} / ${data.district || '-'}`,
            `الجوال: ${data.phone || '-'}`,
            `التاريخ: ${data.date || '-'}`,
            `الفترة: ${data.period || '-'}`
        ];
        if (data.estimate) lines.push(`السعر التقديري: ${data.estimate} ريال`);
        if (data.notes) lines.push(`ملاحظات: ${data.notes}`);
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    }

    // واجهة صغيرة قابلة للاختبار دون ربط أي أداة تتبع أو مكتبة خارجية.
    window.cleanTimeUtils = Object.freeze({
        normalizeSaudiPhone,
        getTodayString,
        isBookableDate,
        buildWhatsAppUrl
    });

    function initAnimations() {
        const elements = document.querySelectorAll('[data-aos]');
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            elements.forEach(element => element.classList.add('aos-animate'));
            return;
        }
        const lowerContent = document.querySelector('.home-lower-content');
        if (lowerContent) lowerContent.classList.add('reveal-ready');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const delay = Number(entry.target.dataset.aosDelay || 0);
                window.setTimeout(() => entry.target.classList.add('aos-animate'), Math.min(delay, 240));
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
        elements.forEach(element => observer.observe(element));
    }

    function initMobileMenu() {
        const toggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.getElementById('primary-nav');
        if (!toggle || !nav) return;

        const closeMenu = () => {
            nav.classList.remove('menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'فتح قائمة التنقل');
        };

        toggle.addEventListener('click', () => {
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';
            nav.classList.toggle('menu-open', !isOpen);
            toggle.setAttribute('aria-expanded', String(!isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'فتح قائمة التنقل' : 'إغلاق قائمة التنقل');
        });
        nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
        document.addEventListener('click', event => {
            if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) closeMenu();
        });
    }

    function initContactFab() {
        const fab = document.querySelector('.contact-fab');
        if (!fab) return;
        const toggle = fab.querySelector('.contact-fab-toggle');
        const menu = fab.querySelector('.contact-fab-menu');
        const links = Array.from(fab.querySelectorAll('.contact-option'));
        if (!toggle || !menu) return;

        const setOpen = (isOpen, restoreFocus = false) => {
            fab.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', isOpen ? 'إغلاق خيارات التواصل' : 'فتح خيارات التواصل');
            menu.setAttribute('aria-hidden', String(!isOpen));
            links.forEach(link => link.setAttribute('tabindex', isOpen ? '0' : '-1'));
            if (restoreFocus) toggle.focus();
        };

        toggle.addEventListener('click', () => {
            const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
            setOpen(willOpen);
            if (willOpen) {
                trackEvent('contact_menu_open', { page: window.location.pathname });
                links[0]?.focus();
            }
        });
        fab.addEventListener('keydown', event => {
            if (event.key === 'Escape' && fab.classList.contains('is-open')) {
                event.preventDefault();
                setOpen(false, true);
            }
        });
        document.addEventListener('click', event => {
            if (!fab.contains(event.target)) setOpen(false);
        });
        document.addEventListener('contact-fab:close', () => setOpen(false));
        links.forEach(link => link.addEventListener('click', () => setOpen(false)));
    }

    function serviceMeta(service) {
        if (service.type === 'calculator') {
            return '';
        }
        if (service.type === 'discount') return `<span class="service-card-meta"><strong>خصم ${service.discount}%</strong> لخدمات المساجد</span>`;
        return '<span class="service-card-meta">السعر بعد معاينة الموقع</span>';
    }

    function createServiceCard(service, index = 0, showMeta = false) {
        const card = document.createElement('article');
        card.className = `service-card${service.featured ? ' featured' : ''}`;
        card.dataset.aos = 'fade-up';
        card.dataset.aosDelay = String(Math.min(index * 60, 240));

        let buttonText = 'احسب السعر';
        let buttonClass = 'ripple-btn';
        let badge = '';
        if (service.type === 'booking') buttonText = ' موعد';
        if (service.type === 'discount') {
            buttonText = 'اطلب الخصم';
            buttonClass += ' discount-btn';
            badge = `<div class="discount-badge">خصم ${service.discount}%</div>`;
        }

        card.innerHTML = `${badge}
            <div class="service-card-content">
                <img src="${escapeHtml(service.icon)}" alt="" loading="lazy">
                <h3>${escapeHtml(service.name)}</h3>
                <p>${escapeHtml(service.description)}</p>
                ${showMeta ? serviceMeta(service) : ''}
                <button class="${buttonClass}" type="button" data-service-name="${escapeHtml(service.name)}">${buttonText}</button>
            </div>`;
        return card;
    }

    function populateServices() {
        if (featuredServicesGrid) {
            const featuredNames = ['الخداديات', 'الموكيت', 'الكنب', 'الجلسة العربي', 'مكيف دولابي', 'مكيف شباك'];
            featuredNames.map(name => services.find(service => service.name === name)).filter(Boolean)
                .forEach((service, index) => featuredServicesGrid.appendChild(createServiceCard(service, index)));
        }
        if (allServicesGrid && bookingServicesGrid) {
            const calculatorServices = services.filter(service => service.type === 'calculator');
            const bookingServices = services.filter(service => service.type === 'booking' || service.type === 'discount');
            calculatorServices.forEach((service, index) => allServicesGrid.appendChild(createServiceCard(service, index, true)));
            bookingServices.forEach((service, index) => bookingServicesGrid.appendChild(createServiceCard(service, index, true)));
            const calculatorCount = document.getElementById('calculator-services-count');
            const bookingCount = document.getElementById('booking-services-count');
            if (calculatorCount) calculatorCount.textContent = `${calculatorServices.length} خدمة`;
            if (bookingCount) bookingCount.textContent = `${bookingServices.length} خدمات`;
        }
    }

    function openModal() {
        if (!modal) return;
        previouslyFocusedElement = document.activeElement;
        document.dispatchEvent(new Event('contact-fab:close'));
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        window.requestAnimationFrame(() => closeButton?.focus());
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        modalBody.innerHTML = '';
        if (previouslyFocusedElement instanceof HTMLElement) previouslyFocusedElement.focus();
    }

    function serviceOptions() {
        return services.map(service => `<option value="${escapeHtml(service.name)}">${escapeHtml(service.name)}</option>`).join('');
    }

    function calculatorInputs(service) {
        if (service.unit === 'm2') {
            return `<div class="booking-fields">
                ${numberField('width', 'العرض بالمتر', 'مثال: 4')}
                ${numberField('length', 'الطول بالمتر', 'مثال: 5')}
            </div>`;
        }
        if (service.unit === 'm') return numberField('length', 'الطول بالمتر', 'مثال: 7');
        return numberField('quantity', 'العدد', 'أدخل العدد');
    }

    function numberField(id, label, placeholder) {
        return `<div class="input-group">
            <label class="input-label" for="${id}">${label}</label>
            <input class="input-field calculator-input" type="number" inputmode="decimal" id="${id}" placeholder="${placeholder}" min="0" step="0.1">
        </div>`;
    }

    function bookingFormMarkup(service) {
        const fixedService = service?.name || '';
        const serviceField = fixedService
            ? `<div class="input-group full-width"><label class="input-label">الخدمة المطلوبة</label><input class="input-field" value="${escapeHtml(fixedService)}" readonly><input type="hidden" name="service" value="${escapeHtml(fixedService)}"></div>`
            : `<div class="input-group full-width"><label class="input-label" for="booking-service">الخدمة المطلوبة <span class="required-mark">*</span></label><select class="input-field" id="booking-service" name="service" required><option value="">اختر الخدمة</option>${serviceOptions()}</select><p class="field-error" id="service-error"></p></div>`;

        return `<div class="booking-form">
            <h4 id="booking-title">أكمل بيانات الحجز</h4>
            <form id="booking-form-actual" novalidate>
                <div class="booking-fields">
                    ${serviceField}
                    ${textField('city', 'المدينة', 'مثال: المذنب', true)}
                    ${textField('district', 'الحي', 'مثال: السلام', true)}
                    <div class="input-group">
                        <label class="input-label" for="booking-phone">رقم الجوال <span class="required-mark">*</span></label>
                        <input class="input-field" id="booking-phone" type="tel" inputmode="tel" autocomplete="tel" name="phone" placeholder="05XXXXXXXX" required>
                        <p class="field-error" id="phone-error"></p>
                    </div>
                    <div class="input-group">
                        <label class="input-label" for="booking-date">اليوم المطلوب <span class="required-mark">*</span></label>
                        <input class="input-field" id="booking-date" type="date" name="date" min="${getTodayString()}" required>
                        <p class="field-error" id="date-error"></p>
                    </div>
                    <div class="input-group">
                        <label class="input-label" for="booking-period">الفترة المناسبة <span class="required-mark">*</span></label>
                        <select class="input-field" id="booking-period" name="period" required>
                            <option value="">اختر الفترة</option>
                            <option value="صباحًا">صباحًا</option>
                            <option value="ظهرًا">ظهرًا</option>
                            <option value="مساءً">مساءً</option>
                        </select>
                        <p class="field-error" id="period-error"></p>
                    </div>
                    <div class="input-group full-width">
                        <label class="input-label" for="booking-notes">ملاحظة <span class="form-note">(اختيارية)</span></label>
                        <textarea class="input-field" id="booking-notes" name="notes" placeholder="أي تفاصيل تساعدنا على تجهيز الخدمة"></textarea>
                    </div>
                </div>
                <div class="booking-actions">
                    <button type="submit" class="ripple-btn">تأكيد الحجز</button>
                    <a class="whatsapp-fallback hidden" target="_blank" rel="noopener noreferrer" data-track-whatsapp>إرسال الطلب عبر واتساب</a>
                </div>
                <p class="form-status" role="status" aria-live="polite"></p>
            </form>
        </div>`;
    }

    function textField(name, label, placeholder, required = false) {
        const requiredMarkup = required ? ' <span class="required-mark">*</span>' : '';
        return `<div class="input-group">
            <label class="input-label" for="booking-${name}">${label}${requiredMarkup}</label>
            <input class="input-field" id="booking-${name}" type="text" autocomplete="address-level2" name="${name}" placeholder="${placeholder}"${required ? ' required' : ''}>
            <p class="field-error" id="${name}-error"></p>
        </div>`;
    }

    function openBooking(service = null) {
        if (!modalBody) return;
        calculatorEventSent = false;
        if (service?.type === 'calculator') {
            modalBody.innerHTML = `<section class="calculator-form">
                <h3 id="modal-title">حاسبة سعر ${escapeHtml(service.name)}</h3>
                ${calculatorInputs(service)}
                <div class="price-display"><h4>السعر: <span id="price-result">0.00</span> ريال</h4></div>
                <button type="button" class="ripple-btn calculate-book-button hidden">احسب</button>
            </section>
            <hr class="booking-separator hidden">
            <section class="booking-container hidden">${bookingFormMarkup(service)}</section>`;
            setupCalculator(service);
        } else {
            modalBody.innerHTML = `<h3 id="modal-title" class="visually-hidden">نموذج الحجز</h3>${bookingFormMarkup(service)}`;
            setupBookingForm(service);
        }
        openModal();
        trackEvent('booking_open', { service: service?.name || 'غير محددة' });
    }

    function setupCalculator(service) {
        const inputs = Array.from(modalBody.querySelectorAll('.calculator-input'));
        const result = modalBody.querySelector('#price-result');
        const calculateAndBookButton = modalBody.querySelector('.calculate-book-button');
        const bookingContainer = modalBody.querySelector('.booking-container');
        const separator = modalBody.querySelector('.booking-separator');

        const calculate = () => {
            let price = 0;
            if (service.unit === 'm2') price = (Number(document.getElementById('width')?.value) || 0) * (Number(document.getElementById('length')?.value) || 0) * service.price;
            if (service.unit === 'm') price = (Number(document.getElementById('length')?.value) || 0) * service.price;
            if (service.unit === 'qty') price = (Number(document.getElementById('quantity')?.value) || 0) * service.price;
            result.textContent = price.toFixed(2);
            calculateAndBookButton.classList.toggle('hidden', price <= 0);
            if (price > 0 && !calculatorEventSent) {
                calculatorEventSent = true;
                trackEvent('calculator_used', { service: service.name });
            }
        };

        inputs.forEach(input => input.addEventListener('input', calculate));
        calculateAndBookButton.addEventListener('click', () => {
            bookingContainer.classList.remove('hidden');
            separator.classList.remove('hidden');
            calculateAndBookButton.classList.add('hidden');
            setupBookingForm(service);
            bookingContainer.querySelector('input, select')?.focus();
            trackEvent('calculate_and_book_click', { service: service.name, estimate: result.textContent });
        });
    }

    function readFormData(form, service) {
        const values = new FormData(form);
        const selectedService = service?.name || String(values.get('service') || '').trim();
        const normalizedPhone = normalizeSaudiPhone(values.get('phone'));
        return {
            service: selectedService,
            city: String(values.get('city') || '').trim(),
            district: String(values.get('district') || '').trim(),
            phone: normalizedPhone || String(values.get('phone') || '').trim(),
            phoneIsValid: Boolean(normalizedPhone),
            date: String(values.get('date') || ''),
            period: String(values.get('period') || ''),
            notes: String(values.get('notes') || '').trim(),
            estimate: service?.type === 'calculator' ? String(modalBody.querySelector('#price-result')?.textContent || '') : ''
        };
    }

    function setFieldError(form, name, message) {
        const field = form.elements[name];
        const error = form.querySelector(`#${name}-error`);
        if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (error) error.textContent = message;
    }

    function validateBooking(form, data) {
        const errors = {
            service: data.service ? '' : 'اختر الخدمة المطلوبة',
            city: data.city ? '' : 'اكتب اسم المدينة',
            district: data.district ? '' : 'اكتب اسم الحي',
            phone: data.phoneIsValid ? '' : '05XXXXXXXX',
            date: !data.date ? 'اختر اليوم المطلوب' : !isBookableDate(data.date) ? 'لا يمكن اختيار تاريخ سابق' : '',
            period: data.period ? '' : 'اختر الفترة المناسبة'
        };
        Object.entries(errors).forEach(([name, message]) => setFieldError(form, name, message));
        const firstInvalidName = Object.keys(errors).find(name => errors[name]);
        if (firstInvalidName) form.elements[firstInvalidName]?.focus();
        return !firstInvalidName;
    }

    function appendPayload(formPayload, data, orderNumber, service) {
        const fields = {
            'رقم الطلب': orderNumber,
            'الخدمة': data.service,
            'المدينة': data.city,
            'الحي': data.district,
            'الجوال': data.phone,
            'التاريخ': data.date,
            'الفترة': data.period,
            'ملاحظات العميل': data.notes || 'لا توجد',
            '_subject': `حجز جديد #${orderNumber}: ${data.service}`
        };
        if (data.estimate) fields['السعر المقدر'] = `${data.estimate} ريال`;
        if (service?.type === 'discount') fields['الخصم'] = `${service.discount}% لخدمات المساجد`;
        Object.entries(fields).forEach(([key, value]) => formPayload.append(key, value));
    }

    function renderSuccess(data, orderNumber) {
        const whatsappUrl = buildWhatsAppUrl(data, orderNumber);
        modalBody.innerHTML = `<section class="booking-success" aria-live="polite">
            <h3 id="modal-title">تم استلام طلبك بنجاح</h3>
            <p>رقم الطلب</p><strong class="order-number">#${escapeHtml(orderNumber)}</strong>
            <ul class="booking-summary">
                <li><span>الخدمة</span><strong>${escapeHtml(data.service)}</strong></li>
                <li><span>المدينة / الحي</span><strong>${escapeHtml(data.city)} / ${escapeHtml(data.district)}</strong></li>
                <li><span>التاريخ</span><strong>${escapeHtml(data.date)}</strong></li>
                <li><span>الفترة</span><strong>${escapeHtml(data.period)}</strong></li>
            </ul>
            <a class="whatsapp-followup" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" data-track-whatsapp>متابعة الطلب عبر واتساب</a>
        </section>`;
        modalBody.querySelector('.whatsapp-followup')?.focus();
    }

    function setupBookingForm(service) {
        const form = document.getElementById('booking-form-actual');
        if (!form || form.dataset.ready === 'true') return;
        form.dataset.ready = 'true';
        const submitButton = form.querySelector('button[type="submit"]');
        const fallback = form.querySelector('.whatsapp-fallback');
        const status = form.querySelector('.form-status');
        let submitting = false;
        let started = false;

        form.addEventListener('input', event => {
            if (!started) {
                started = true;
                trackEvent('booking_start', { service: service?.name || 'يختارها العميل' });
            }
            if (event.target.name) setFieldError(form, event.target.name, '');
            const currentData = readFormData(form, service);
            fallback.href = buildWhatsAppUrl(currentData);
        });

        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (submitting) return;
            const data = readFormData(form, service);
            fallback.href = buildWhatsAppUrl(data);
            if (!validateBooking(form, data)) return;

            submitting = true;
            submitButton.disabled = true;
            submitButton.setAttribute('aria-busy', 'true');
            submitButton.innerHTML = '<span class="spinner" aria-hidden="true"></span> جاري الإرسال';
            status.textContent = '';
            status.className = 'form-status';

            const orderNumber = createOrderNumber();
            const formPayload = new FormData();
            appendPayload(formPayload, data, orderNumber, service);

            try {
                const response = await fetch(FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: formPayload
                });
                if (!response.ok) throw new Error(`Booking request failed: ${response.status}`);
                trackEvent('booking_submit_success', { service: data.service, orderNumber });
                renderSuccess(data, orderNumber);
            } catch {
                trackEvent('booking_submit_failure', { service: data.service });
                status.textContent = 'تعذر إرسال الطلب الآن، بياناتك ما زالت موجودة ويمكنك إرسالها مباشرة عبر واتساب';
                status.className = 'form-status error';
                fallback.href = buildWhatsAppUrl(data);
                fallback.classList.remove('hidden');
            } finally {
                submitting = false;
                if (submitButton.isConnected) {
                    submitButton.disabled = false;
                    submitButton.removeAttribute('aria-busy');
                    submitButton.textContent = 'تأكيد الحجز';
                }
            }
        });
    }

    function initModalControls() {
        closeButton?.addEventListener('click', closeModal);
        modal?.addEventListener('click', event => {
            if (event.target === modal) closeModal();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
        });
        document.querySelectorAll('[data-booking-trigger]').forEach(button => button.addEventListener('click', () => openBooking()));
        document.addEventListener('click', event => {
            const serviceButton = event.target.closest('[data-service-name]');
            if (serviceButton) {
                const service = services.find(item => item.name === serviceButton.dataset.serviceName);
                if (service) openBooking(service);
            }
            const whatsappLink = event.target.closest('a[href*="wa.me"], [data-track-whatsapp]');
            if (whatsappLink) trackEvent('whatsapp_click', { location: whatsappLink.className || 'link' });
            const contactLink = event.target.closest('[data-contact-channel]');
            if (contactLink) {
                trackEvent('contact_channel_click', {
                    channel: contactLink.dataset.contactChannel,
                    page: window.location.pathname
                });
            }
        });
    }

    function initHomeShowcase() {
        const showcase = document.getElementById('home-showcase');
        if (!showcase) return;
        const slides = Array.from(showcase.querySelectorAll('.showcase-slide'));
        const dots = Array.from(showcase.querySelectorAll('.showcase-dot'));
        const previousButton = showcase.querySelector('.showcase-prev');
        const nextButton = showcase.querySelector('.showcase-next');
        const caption = document.getElementById('showcase-caption');
        const counter = document.getElementById('showcase-counter');
        let currentIndex = 0;
        let autoplayTimer = null;
        let touchStartX = 0;

        const showSlide = newIndex => {
            currentIndex = (newIndex + slides.length) % slides.length;
            slides.forEach((slide, index) => {
                const isActive = index === currentIndex;
                slide.classList.toggle('is-active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));
            });
            dots.forEach((dot, index) => {
                const isActive = index === currentIndex;
                dot.classList.toggle('is-active', isActive);
                if (isActive) dot.setAttribute('aria-current', 'true');
                else dot.removeAttribute('aria-current');
            });
            if (caption) caption.textContent = slides[currentIndex].dataset.title || '';
            if (counter) counter.textContent = `${currentIndex + 1} / ${slides.length}`;
        };

        const stopAutoplay = () => {
            if (autoplayTimer) window.clearInterval(autoplayTimer);
            autoplayTimer = null;
        };
        const startAutoplay = () => {
            stopAutoplay();
            if (!prefersReducedMotion && document.visibilityState !== 'hidden') {
                autoplayTimer = window.setInterval(() => showSlide(currentIndex + 1), 4800);
            }
        };

        previousButton?.addEventListener('click', () => { showSlide(currentIndex - 1); startAutoplay(); });
        nextButton?.addEventListener('click', () => { showSlide(currentIndex + 1); startAutoplay(); });
        dots.forEach((dot, index) => dot.addEventListener('click', () => { showSlide(index); startAutoplay(); }));
        showcase.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') { showSlide(currentIndex - 1); startAutoplay(); }
            if (event.key === 'ArrowRight') { showSlide(currentIndex + 1); startAutoplay(); }
        });
        showcase.addEventListener('touchstart', event => { touchStartX = event.touches[0].clientX; stopAutoplay(); }, { passive: true });
        showcase.addEventListener('touchend', event => {
            const distance = event.changedTouches[0].clientX - touchStartX;
            if (Math.abs(distance) > 45) showSlide(currentIndex + (distance < 0 ? 1 : -1));
            startAutoplay();
        }, { passive: true });
        showcase.addEventListener('mouseenter', stopAutoplay);
        showcase.addEventListener('mouseleave', startAutoplay);
        showcase.addEventListener('focusin', stopAutoplay);
        showcase.addEventListener('focusout', event => {
            if (!showcase.contains(event.relatedTarget)) startAutoplay();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') stopAutoplay();
            else startAutoplay();
        });

        showSlide(0);
        startAutoplay();
    }

    populateServices();
    initMobileMenu();
    initContactFab();
    initModalControls();
    initHomeShowcase();
    initAnimations();
});
