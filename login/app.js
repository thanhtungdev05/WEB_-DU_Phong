(function () {
  'use strict';

  const form = document.getElementById('fpt-login-form');
  const emailInput = document.getElementById('fpt-email');
  const nameInput = document.getElementById('fpt-name');
  const submitBtn = document.getElementById('login-submit');
  const submitLabel = submitBtn ? submitBtn.querySelector('.button-label') : null;
  const errorBox = document.getElementById('login-error');
  const iamLoginLink = document.getElementById('iam-login');
  const defaultLabel = submitLabel ? submitLabel.textContent : 'Vào phòng luyện tập';

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.style.display = 'none';
  }

  function getRedirectTarget() {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        return redirect;
      }
    } catch (e) {
      // ignore
    }
    return '/portal.html';
  }

  function enterGuestGuideModeWhenDatabaseIsUnavailable() {
    return fetch('/api/index.php/health', {
      credentials: 'omit',
      cache: 'no-store'
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; });
      })
      .then(function (payload) {
        const errorCode = payload && payload.error ? payload.error.code : '';
        if (errorCode !== 'db-connect-error') return;
        if (submitBtn) {
          submitBtn.classList.add('is-loading');
          submitBtn.setAttribute('aria-busy', 'true');
        }
        if (submitLabel) {
          submitLabel.textContent = 'Đang mở chế độ hướng dẫn cho khách…';
        }
        window.location.replace('/portal.html?guest=database-unavailable');
      })
      .catch(function () {
        // IAM remains the only entry path for generic API/network failures.
      });
  }

  enterGuestGuideModeWhenDatabaseIsUnavailable();

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError();

      const email = (emailInput.value || '').trim();
      const displayName = (nameInput.value || '').trim();

      if (!email) {
        showError('Vui lòng nhập Email FPT của bạn.');
        emailInput.focus();
        return;
      }

      const emailPattern = /^[a-zA-Z0-9._%+-]+@(fpt\.net|fpt\.com)$/i;
      if (!emailPattern.test(email)) {
        showError('Chỉ chấp nhận email FPT có đuôi @fpt.net hoặc @fpt.com.');
        emailInput.focus();
        return;
      }

      if (submitBtn) {
        submitBtn.classList.add('is-loading');
        submitBtn.setAttribute('aria-busy', 'true');
      }
      if (submitLabel) {
        submitLabel.textContent = 'Đang đăng nhập…';
      }

      fetch('/api/index.php/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: email,
          display_name: displayName,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok || !data.ok) {
              const msg = data.error && data.error.message ? data.error.message : 'Đăng nhập không thành công.';
              throw new Error(msg);
            }
            return data;
          });
        })
        .then(function (data) {
          if (submitLabel) {
            submitLabel.textContent = 'Đăng nhập thành công! Đang chuyển hướng…';
          }
          const redirectUrl = getRedirectTarget();
          window.location.href = redirectUrl;
        })
        .catch(function (err) {
          if (submitBtn) {
            submitBtn.classList.remove('is-loading');
            submitBtn.removeAttribute('aria-busy');
          }
          if (submitLabel) {
            submitLabel.textContent = defaultLabel;
          }
          showError(err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
        });
    });
  }

  if (iamLoginLink) {
    iamLoginLink.addEventListener('click', function () {
      const iamLabel = iamLoginLink.querySelector('.button-label');
      if (iamLabel) {
        iamLabel.textContent = 'Đang chuyển đến IAM…';
      }
    });
  }

  window.addEventListener('pageshow', function () {
    if (submitBtn) {
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('aria-busy');
    }
    if (submitLabel) {
      submitLabel.textContent = defaultLabel;
    }
  });
})();
