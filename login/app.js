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

  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage) {
      sessionStorage.removeItem('ftc_consumed_iam_state');
    }
    if (window.history && typeof window.history.replaceState === 'function' && window.location.search) {
      const loginParams = new URLSearchParams(window.location.search);
      if (loginParams.has('error') || loginParams.has('error_description') || loginParams.has('code') || loginParams.has('state')) {
        loginParams.delete('error');
        loginParams.delete('error_description');
        loginParams.delete('code');
        loginParams.delete('state');
        const cleanQuery = loginParams.toString();
        const cleanUrl = (window.location.pathname || '/login/index.html') + (cleanQuery ? '?' + cleanQuery : '');
        window.history.replaceState({}, document.title || '', cleanUrl);
      }
    }
  } catch (_) {}

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

  if (form && typeof form.addEventListener === 'function') {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError();

      const email = (emailInput && emailInput.value ? emailInput.value : '').trim();
      const displayName = (nameInput && nameInput.value ? nameInput.value : '').trim();

      if (!email) {
        showError('Vui lòng nhập Email của bạn.');
        if (emailInput && typeof emailInput.focus === 'function') emailInput.focus();
        return;
      }

      const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|fpt\.net|fpt\.com)$/i;
      if (!emailPattern.test(email)) {
        showError('Chỉ chấp nhận email có đuôi @gmail.com, @fpt.net hoặc @fpt.com.');
        if (emailInput && typeof emailInput.focus === 'function') emailInput.focus();
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
        .then(function () {
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

  if (iamLoginLink && typeof iamLoginLink.addEventListener === 'function') {
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
