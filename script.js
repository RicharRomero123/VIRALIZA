document.addEventListener('DOMContentLoaded', function() {
    // --- ⭐⭐⭐ CONFIGURACIÓN IMPORTANTE ⭐⭐⭐ ---
    const CLOUDINARY_CLOUD_NAME = 'daassyisd';
    const CLOUDINARY_UPLOAD_PRESET = 'Presenten_react';
    
    // --- ELEMENTOS DEL DOM ---
    const mainContent = document.getElementById('main-content');
    const formPage = document.getElementById('form-page');
    const successPage = document.getElementById('success-page');
    const canceledPage = document.getElementById('canceled-page');
    const allPages = [mainContent, formPage, successPage, canceledPage];
    const confirmationModal = document.getElementById('confirmation-modal');
    const selectPlanButtons = document.querySelectorAll('.select-plan-button');
    const prePaymentForm = document.getElementById('pre-payment-form');
    const verifyUsernameBtn = document.getElementById('verify-username-btn');
    const editDetailsBtn = document.getElementById('edit-details-btn');
    const confirmAndPayBtn = document.getElementById('confirm-and-pay-btn');
    const backToHomeButtons = document.querySelectorAll('.back-to-home-btn');
    const backToMainBtn = document.querySelector('.back-to-main');
    const navLinks = document.querySelectorAll('.nav-link');
    const homeLinks = document.querySelectorAll('.nav-link-home');

    let currentPlan = null;
    const paymentLinks = {
        esencial: { price: 25, url: 'https://mpago.la/1e7iqK6' },
        premium: { price: 95, url: 'https://mpago.la/1szeruX' }
    };

    function showPage(pageId) {
        allPages.forEach(page => { if(page) page.style.display = 'none'; });
        const pageToShow = document.getElementById(pageId);
        if (pageToShow) {
            pageToShow.style.display = pageToShow.classList.contains('page-container') ? 'flex' : 'block';
        }
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const headerOffset = document.querySelector('.header')?.offsetHeight || 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });
    
    homeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('main-content');
        });
    });

    selectPlanButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentPlan = this.closest('.plan-card').dataset.plan;
            const planData = paymentLinks[currentPlan];
            document.getElementById('form-title').textContent = `Configurar Cuenta ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}`;
            const lastPostUrlGroup = document.getElementById('last-post-url-group');
            lastPostUrlGroup.style.display = (currentPlan === 'premium') ? 'block' : 'none';
            document.getElementById('last-post-url').required = (currentPlan === 'premium');
            document.getElementById('form-submit-button').textContent = `Continuar a la Confirmación`;
            document.getElementById('hidden-plan-input').value = `Plan ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} (S/ ${planData.price})`;
            prePaymentForm.reset();
            document.getElementById('username-status').textContent = '';
            document.getElementById('profile-pic-preview').style.display = 'none';
            showPage('form-page');
        });
    });

    if(backToMainBtn) backToMainBtn.addEventListener('click', () => showPage('main-content'));
    
    backToHomeButtons.forEach(button => {
        button.addEventListener('click', () => {
            history.pushState("", document.title, window.location.pathname + window.location.search);
            showPage('main-content');
        });
    });

    verifyUsernameBtn.addEventListener('click', function() {
        const usernameInput = document.getElementById('tiktok-username');
        const username = usernameInput.value;
        const statusEl = document.getElementById('username-status');
        if (!username || !username.startsWith('@') || username.length < 3) {
            statusEl.textContent = '❌ Formato inválido. Debe empezar con @.';
            statusEl.className = 'error';
            return;
        }
        statusEl.textContent = 'Verificando...';
        statusEl.className = 'loading';
        setTimeout(() => {
            statusEl.textContent = `✅ ¡Buen nombre! ${username} parece estar disponible.`;
            statusEl.className = 'success';
        }, 1500);
    });

    const profilePicInput = document.getElementById('profile-pic');
    profilePicInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('profile-pic-preview').src = e.target.result;
                document.getElementById('profile-pic-preview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    async function uploadImageToCloudinary(file) {
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            alert("Error de configuración: Faltan datos de Cloudinary en el script.js.");
            return null;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        try {
            const response = await fetch(url, { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error.message);
            return data.secure_url;
        } catch (error) {
            console.error('Error detallado al subir la imagen a Cloudinary:', error);
            alert(`Hubo un error al subir la foto: ${error.message}. Asegúrate que tu Upload Preset sea "Unsigned".`);
            return null;
        }
    }

    prePaymentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const usernameStatus = document.getElementById('username-status');
        if (!usernameStatus.textContent || !usernameStatus.classList.contains('success')) {
            alert('Por favor, verifica un nombre de usuario disponible para continuar.');
            return;
        }
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.classList.add('button-loading');

        const imageFile = profilePicInput.files[0];
        let imageUrl = '';
        if (imageFile) {
            imageUrl = await uploadImageToCloudinary(imageFile);
            if (!imageUrl) {
                submitButton.disabled = false;
                submitButton.classList.remove('button-loading');
                return;
            }
        }
        document.getElementById('profile-pic-url').value = imageUrl;
        
        const form = event.target;
        const formData = new FormData(form);
        formData.delete('profile_pic_file');
        try {
            const response = await fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
            if (response.ok) {
                const data = Object.fromEntries(formData.entries());
                showConfirmationModal(data);
            } else {
                alert('Hubo un error al enviar tus datos. Revisa la consola (F12) y asegúrate de haber confirmado tu email en Formspree.');
            }
        } catch (error) {
            console.error('Error de red:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.classList.remove('button-loading');
        }
    });

    function showConfirmationModal(data) {
        const planData = paymentLinks[currentPlan];
        document.getElementById('modal-summary-plan').textContent = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
        document.getElementById('modal-summary-price').textContent = `S/ ${planData.price.toFixed(2)} PEN`;
        document.getElementById('modal-summary-email').textContent = data.email;
        document.getElementById('modal-summary-phone').textContent = data.phone;
        document.getElementById('modal-summary-username').textContent = data.username;
        const postUrlContainer = document.getElementById('modal-summary-post-url-container');
        if (currentPlan === 'premium' && data.last_post_url) {
            document.getElementById('modal-summary-post-url').textContent = data.last_post_url;
            postUrlContainer.style.display = 'block';
        } else { postUrlContainer.style.display = 'none'; }
        confirmationModal.style.display = 'flex';
    }

    editDetailsBtn.addEventListener('click', () => { confirmationModal.style.display = 'none'; });
    confirmAndPayBtn.addEventListener('click', () => { window.location.href = paymentLinks[currentPlan].url; });
    
    function handleRedirect() {
        const hash = window.location.hash;
        if (hash === '#pago_exitoso') showPage('success-page');
        else if (hash === '#pago_cancelado') showPage('canceled-page');
        else showPage('main-content');
    }
    
    window.addEventListener('hashchange', handleRedirect);
    handleRedirect();
});