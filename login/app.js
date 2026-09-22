(function () {
  'use strict';

  const loginButton = document.getElementById('iam-login');
  const label = loginButton.querySelector('.button-label');
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

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
        loginButton.classList.add('is-loading');
        loginButton.setAttribute('aria-busy', 'true');
        label.textContent = 'Đang mở chế độ hướng dẫn cho khách…';
        window.location.replace('/portal.html?guest=database-unavailable');
      })
      .catch(function () {
        // IAM remains the only entry path for generic API/network failures.
      });
  }

  if (isLocalHost) {
    const apiBase = (window.API_BASE_URL || '').replace(/\/+$/, '');
    const portalOrigin = window.location.origin;
    loginButton.href = apiBase + '/api/index.php/dev/bypass?next=' + encodeURIComponent(portalOrigin + '/portal.html');
    label.textContent = 'Vào local (bypass IAM)';
  }

  const defaultLabel = label.textContent;

  enterGuestGuideModeWhenDatabaseIsUnavailable();

  loginButton.addEventListener('click', function () {
    loginButton.classList.add('is-loading');
    loginButton.setAttribute('aria-busy', 'true');
    label.textContent = isLocalHost ? 'Đang vào local…' : 'Đang chuyển đến IAM…';
  });

  window.addEventListener('pageshow', function () {
    loginButton.classList.remove('is-loading');
    loginButton.removeAttribute('aria-busy');
    label.textContent = defaultLabel;
  });
})();
