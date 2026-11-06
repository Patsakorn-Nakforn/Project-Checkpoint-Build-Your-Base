
// ตรวจสอบ URL
function isValidUrl(value) {
    try {
        const url = new URL(value);

        const validDomain =
            /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i;

        return (
            ['http:', 'https:'].includes(url.protocol) &&
            validDomain.test(url.hostname)
        );
    } catch {
        return false;
    }
}


// ตรวจสอบวันที่
function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);

    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);

    if (
        year < 1 ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return false;
    }

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0')
    ].join('-');

    return value <= todayString;
}


// ล้างค่า error
function clearErrors(form) {
    form.querySelectorAll('.is-invalid').forEach(input => {
        input.classList.remove('is-invalid');
    });

    form.querySelectorAll('.field-error').forEach(error => {
        error.textContent = '';
    });

    form.querySelector('#error-summary')?.classList.add('d-none');

    const errorList = form.querySelector('#error-list');

    if (errorList) {
        errorList.innerHTML = '';
    }
}


// แสดงค่า error
function showErrors(form, errors) {
    const errorList = form.querySelector('#error-list');
    const summary = form.querySelector('#error-summary');

    Object.entries(errors).forEach(([id, message]) => {
        const input = form.querySelector(`#${id}`);

        if (!input) return;

        input.classList.add('is-invalid');

        const error = input.parentElement.querySelector('.field-error');

        if (error) {
            error.textContent = message;
        }

        if (errorList) {
            const li = document.createElement('li');
            li.textContent = message;
            errorList.appendChild(li);
        }
    });

    if (Object.keys(errors).length > 0) {
        summary?.classList.remove('d-none');
        form.querySelector('.is-invalid')?.focus();
    }
}


// ตรวจสอบข้อมูลผลงาน
function validateItem(form) {
    clearErrors(form);

    const errors = {};

    // ตรวจสอบช่องที่จำเป็นต้องกรอก
    const requiredFields = [
        'portfolio-select',
        'title',
        'type',
        'date',
        'role',
        'description',
        'skills',
        'whatIDid',
        'whatILearned',
        'challenge',
        'nextStep'
    ];

    requiredFields.forEach(id => {
        const input = form.querySelector(`#${id}`);

        if (!input.value.trim()) {
            errors[id] = 'กรุณากรอกข้อมูลช่องนี้';
        }
    });

    //ตรวจสอบความยาวชื่อ
    const title = form.querySelector('#title');

    if (title.value.trim().length > 60) {
        errors.title = 'ชื่อผลงานต้องมีความยาวไม่เกิน 60 ตัวอักษร';
    }


    // ตรวจสอบทักษะ
    const skills = form.querySelector('#skills').value.trim();

    if (!skills) {
        errors.skills = 'กรุณากรอกทักษะอย่างน้อย 1 รายการ';
    } else if (/^\d+$/.test(skills)) {
        errors.skills = 'กรุณากรอกชื่อทักษะเป็นข้อความ';
    }
    
    // ตรวจสอบวันที่
    const date = form.querySelector('#date');

    if (date.value && !isValidDate(date.value)) {
        errors.date = 'วันที่ไม่ถูกต้องหรือเป็นวันที่ในอนาคต';
    }


    // ตรวจสอบ URL หลักฐาน
    const evidenceFields = [
        'evidence1',
        'evidence2',
        'evidence3'
    ];

    let validEvidence = 0;

    evidenceFields.forEach(id => {
        const input = form.querySelector(`#${id}`);
        const value = input.value.trim();

        if (value) {
            if (isValidUrl(value)) {
                validEvidence++;
            } else {
                errors[id] = 'กรุณากรอก URL ที่ถูกต้อง (http/https)';
            }
        }
    });


    // ต้องมีหลักฐานอย่างน้อย 1 URL
    if (validEvidence === 0 &&
        !evidenceFields.some(id => errors[id])) {
        errors.evidence1 = 'กรุณาเพิ่มหลักฐานอย่างน้อย 1 URL';
    }


    // แสดงข้อผิดพลาด
    showErrors(form, errors);

    // คืนค่า true เมื่อไม่มีข้อผิดพลาด
    return Object.keys(errors).length === 0;
}
