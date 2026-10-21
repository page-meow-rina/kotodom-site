/* ============================================================
   КотоДом — клиентская логика
   ============================================================ */

(() => {
  'use strict';

  /* Настройки формы заявки.
     FORMS_ENDPOINT: необязательный endpoint сервиса форм
     (например, https://formspree.io/f/xxxxxx). Пока пуст —
     заявка отправляется через почтовый клиент (mailto:). */
  const FORMS_ENDPOINT = '';
  const FALLBACK_EMAIL = 'hello@kotodom.ru';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  /* ---------- Шапка: тень при скролле ---------- */
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  /* ---------- Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen);
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  $$('#mobileMenu a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
    });
  });

  /* ---------- CTA на карточках кошек: предвыбор в форме ---------- */
  const catSelect = document.getElementById('f-cat');
  const adoptForm = document.getElementById('adoptForm');

  $$('[data-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const catName = btn.getAttribute('data-cat');

      if (catSelect) {
        for (let i = 0; i < catSelect.options.length; i++) {
          if (catSelect.options[i].value === catName) {
            catSelect.selectedIndex = i;
            break;
          }
        }
      }

      if (adoptForm) {
        adoptForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nameField = document.getElementById('f-name');
        setTimeout(() => { if (nameField) nameField.focus(); }, 600);
      }
    });
  });

  /* ---------- Форма заявки: валидация и отправка ---------- */
  if (adoptForm) {
    const submitBtn = document.getElementById('submitBtn');
    const statusEl = document.getElementById('formStatus');
    const originalLabel = submitBtn.textContent;

    const setStatus = (msg, type) => {
      statusEl.textContent = msg;
      statusEl.className = 'form-status' + (type ? ' ' + type : '');
    };

    const buildMailto = (data) => {
      const subject = encodeURIComponent('Заявка на усыновление: ' + (data.get('cat') || '—'));
      const body = encodeURIComponent(
        'Заявка на усыновление\n\n' +
        'Имя: ' + data.get('name') + '\n' +
        'Телефон: ' + data.get('phone') + '\n' +
        'Email: ' + data.get('email') + '\n' +
        'Кошка: ' + (data.get('cat') || '—') + '\n' +
        'Комментарий: ' + (data.get('comment') || '—')
      );
      return 'mailto:' + FALLBACK_EMAIL + '?subject=' + subject + '&body=' + body;
    };

    adoptForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!adoptForm.checkValidity()) {
        adoptForm.reportValidity();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправляем…';
      setStatus('', '');

      const data = new FormData(adoptForm);

      if (FORMS_ENDPOINT) {
        fetch(FORMS_ENDPOINT, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        })
          .then((res) => {
            if (!res.ok) throw new Error('send failed');
            setStatus('Заявка отправлена! Мы свяжемся с вами в течение дня. ✓', 'success');
            adoptForm.reset();
          })
          .catch(() => {
            setStatus('Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам: +7 (999) 765-43-21.', 'error');
          })
          .then(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          });
      } else {
        // Fallback: почтовый клиент
        window.location.href = buildMailto(data);
        setStatus('Открылось почтовое приложение — нажмите «Отправить», чтобы завершить заявку. ✓', 'success');
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }
})();