/**
 * app.js — Network Simulator Portal Logic
 */

(function () {
  'use strict';

  // Đảm bảo các router dùng frameset đọc được thông tin quyền người dùng trên window.top
  window._IS_FTC_PORTAL = true;
  window.XCurrentUser = 2;
  window.XWebTimeout = 86400; // 24 giờ cho môi trường phòng lab thực hành
  window.WebProject = 'general';
  window.num_lan = 4;
  window.num_wifi = 4;
  window.num_5g_wifi = 4;
  window.num_usb = 1;
  window.WebPotsNumber = 0;
  window.XHasWifi = 1;
  window.XHas80211acWifi = 1;
  window.CurMainMenu = 0;
  window.CurSubMenu = 'devinfo';

  // ── State ────────────────────────────────────────────────────────
  let currentDeviceId = null;
  let currentLessonId = null;
  let _currentLesson = null;  // lesson object hiện tại (dùng cho clearFields)
  let currentMode = 'guide'; // 'guide' (có popups) hoặc 'practice' (không có popups)
  let guideSyncInterval = null;

  // ── Tracking State ───────────────────────────────────────────────
  // Lưu thông tin phiên thực hành hiện tại để gửi Tracking API khi kết thúc
  let _trackingSession = null; // { device, lesson, mode, startedAt }
  let _currentUser = null;    // { technician_id, name, email } — lấy từ API auth/session
  let _lastTrackingPayload = null; // Giữ nguyên payload/idempotency key khi retry lỗi mạng
  let _catalogDeviceIds = new Set();
  let _catalogLabIds = new Set();
  let _catalogLabNames = new Map();
  let _catalogLabOrder = new Map();
  let _guestGuideMode = false;
  let databaseAvailabilityRequest = null;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Practice Timer State ────────────────────────────────────────
  let _practiceTimerInterval = null; // setInterval ID cho đồng hồ realtime
  let _practiceStartTime = null;     // Date object lúc bắt đầu thực hành
  let _lastSubmitDurationSec = 0;    // Thời gian khi nộp bài (dùng cho tracking)
  let _lastEvalResult = null;        // Kết quả chấm điểm gần nhất (dùng cho nút modal)

  // ── DOM Refs ─────────────────────────────────────────────────────
  const sidebar = document.getElementById('sidebar');
  const btnCollapse = document.getElementById('btn-collapse');
  const deviceSelect = document.getElementById('device-select');
  const navList = document.getElementById('nav-list');
  const breadcrumb = document.getElementById('breadcrumb');
  const statusText = document.getElementById('status-text');
  const heroScreen = document.getElementById('hero-screen');
  const lessonScreen = document.getElementById('lesson-screen');
  const loadingOverlay = document.getElementById('loading-overlay');

  // Lesson card elements
  const lcTitle = document.getElementById('lc-title');
  const lcSubtitle = document.getElementById('lc-subtitle');
  const lcInstr = document.getElementById('lc-instructions');
  const btnGuide = document.getElementById('btn-guide');
  const btnPrac = document.getElementById('btn-practice');

  // Practice screen elements
  const practiceScreen = document.getElementById('practice-screen');
  const deviceIframe = document.getElementById('device-iframe');
  const iframeLoading = document.getElementById('iframe-loading');
  const btnBackLesson = document.getElementById('btn-back-lesson');
  const btnOpenNewTab = document.getElementById('btn-open-new-tab');
  const btnSubmitLab = document.getElementById('btn-submit-lab');
  const practiceTimer = document.getElementById('practice-timer');
  const serverWarning = document.getElementById('server-warning');
  const practiceModeLabel = document.getElementById('practice-mode-label');
  const practiceLessonTitle = document.getElementById('practice-lesson-title');

  // Grading Modal elements
  const gradingModal = document.getElementById('grading-modal');
  const gradingBackdrop = document.getElementById('grading-backdrop');
  const btnModalRetry = document.getElementById('btn-modal-retry');
  const btnModalClose = document.getElementById('btn-modal-close');
  const gmIcon = document.getElementById('gm-icon');
  const gmTitle = document.getElementById('gm-title');
  const gmSubtitle = document.getElementById('gm-subtitle');
  const gmMetaDevice = document.getElementById('gm-meta-device');
  const gmMetaLesson = document.getElementById('gm-meta-lesson');
  const gmMetaMode = document.getElementById('gm-meta-mode');
  const gmMetaTime = document.getElementById('gm-meta-time');
  const gmStatusBox = document.getElementById('gm-status-box');
  const gmStatusTitle = document.getElementById('gm-status-title');
  const gmStatusDesc = document.getElementById('gm-status-desc');
  const gmChecklistBody = document.getElementById('gm-checklist-body');
  const gmSaveStatus = document.getElementById('gm-save-status');

  // Track current iframe URL
  let currentIframeUrl = '';
  let trackingSaveInFlight = false;
  let currentUserRequest = null;
  let sessionHeartbeatInterval = null;
  const SESSION_HEARTBEAT_INTERVAL_MS = 20 * 60 * 1000;
  const SESSION_HEARTBEAT_LAST_SUCCESS_KEY = 'ftc-session-heartbeat-last-success-v1';
  const SESSION_HEARTBEAT_LEASE_KEY = 'ftc-session-heartbeat-lease-v1';
  const SESSION_HEARTBEAT_LEASE_MS = 30 * 1000;
  const sessionHeartbeatOwner = globalThis.crypto?.randomUUID?.()
    || `portal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function normalizeDeviceId(id) {
    if (!id) return '';
    const clean = String(id).trim().replace(/^DEV_/i, '').toLowerCase();
    if (clean === 'ax3000cv2') return 'ax3000c';
    return clean;
  }

  function normalizeLabId(id) {
    if (!id) return '';
    let clean = String(id).trim().toLowerCase();
    clean = clean.replace(/^lab_ax3000c_(\d+)/i, 'lab_ax3000cv2_$1');
    return clean;
  }

  function databaseDeviceToPortalId(device) {
    const rawId = typeof device === 'string' ? device : (device.device_id || device.id || '');
    return normalizeDeviceId(rawId);
  }

  function isNoConfigDevice() {
    if (currentDeviceId === 'be15000' || currentDeviceId === 'ONT_be15000') return true;
    if (_currentLesson && _currentLesson.noConfig === true) return true;
    const dev = DEVICES.find(d => d.id === currentDeviceId);
    if (dev && dev.noConfig === true) return true;
    return false;
  }

  function isSaveRequiredDevice(deviceId) {
    if (!deviceId) return false;
    const id = String(deviceId).trim().toLowerCase();
    return id === 'ax3000c' || id === 'ax3000hv2' || id === 'ax3000s' ||
           id === 'ont_be6500c' || id === 'be6500c' || id === 'be12000' ||
           id === 'vigor2927' || id === 'mikrotik_hexs' || id === 'ac1000cv2';
  }

  function populateDeviceDropdown(devices) {
    deviceSelect.replaceChildren();
    devices.forEach(device => {
      const opt = document.createElement('option');
      opt.value = device.id;
      opt.textContent = device.name;
      deviceSelect.appendChild(opt);
    });
    deviceSelect.disabled = devices.length === 0;
  }

  function synchronizePortalCatalog(catalogDevices) {
    _catalogLabNames = new Map();
    _catalogLabOrder = new Map();
    catalogDevices.forEach(function (device) {
      (Array.isArray(device.labs) ? device.labs : []).forEach(function (lab, index) {
        const labId = normalizeLabId(lab.lab_id);
        const labName = String(lab.lab_name || '').trim();
        if (labId && labName) _catalogLabNames.set(labId, labName);
        if (labId) _catalogLabOrder.set(labId, index);
      });
    });
    const moduleLabIds = new Set();
    DEVICES.forEach(function (device) {
      (device.categories || []).forEach(function (category) {
        (category.lessons || []).forEach(function (lesson) {
          const lessonId = normalizeLabId(lesson.id);
          moduleLabIds.add(lessonId);
          const catalogName = _catalogLabNames.get(lessonId);
          if (catalogName) lesson.title = catalogName;
        });
      });
    });
    _catalogLabNames.forEach(function (_name, labId) {
      if (!moduleLabIds.has(labId)) {
        console.warn(`[Catalog] Bài lab ${labId} đang hoạt động nhưng chưa có module portal.`);
      }
    });
    return _catalogLabNames;
  }

  function buildVisibleCatalogDevices(catalogDevices) {
    const registry = new Map(DEVICES.map(function (device) {
      return [normalizeDeviceId(device.id), device];
    }));
    const visibleDevices = [];

    catalogDevices.forEach(function (catalogDevice) {
      const catalogId = databaseDeviceToPortalId(catalogDevice);
      const device = registry.get(catalogId);
      if (!device) {
        console.warn(`[Catalog] Thiết bị ${catalogDevice.device_id || catalogId} đang hoạt động nhưng chưa có module portal.`);
        return;
      }
      const catalogName = String(catalogDevice.device_name || '').trim();
      if (catalogName) device.name = catalogName;
      visibleDevices.push(device);
    });
    return visibleDevices;
  }

  function selectInitialCatalogDevice(visibleDevices) {
    const urlParams = new URLSearchParams(window.location.search);
    const reqDevice = urlParams.get('device');
    const reqLab = urlParams.get('lab');
    const reqMode = urlParams.get('mode');
    let initialDev = null;
    if (reqDevice) {
      const normReq = normalizeDeviceId(reqDevice);
      initialDev = visibleDevices.find(function (device) {
        return normalizeDeviceId(device.id) === normReq;
      });
    }
    if (!initialDev && visibleDevices.length > 0) {
      initialDev = visibleDevices[0];
    }
    if (initialDev) {
      selectDevice(initialDev.id, reqLab, reqMode);
      return;
    }
    currentDeviceId = null;
    navList.innerHTML = '<div class="empty-state"><p>Chưa có thiết bị luyện tập đang hoạt động.</p></div>';
    showHero();
    setBreadcrumb(['Chưa có bài luyện tập']);
  }

  function loadStaticGuestGuideCatalog() {
    _catalogDeviceIds = new Set();
    _catalogLabIds = new Set();
    _catalogLabNames = new Map();
    _catalogLabOrder = new Map();

    DEVICES.forEach(function (device) {
      _catalogDeviceIds.add(normalizeDeviceId(device.id));
      let deviceLabOrder = 0;
      (device.categories || []).forEach(function (category) {
        (category.lessons || []).forEach(function (lesson) {
          const labId = normalizeLabId(lesson.id);
          if (!labId) return;
          _catalogLabIds.add(labId);
          _catalogLabNames.set(labId, String(lesson.title || lesson.id || ''));
          _catalogLabOrder.set(labId, deviceLabOrder++);
        });
      });
    });

    const visibleDevices = DEVICES.slice();
    populateDeviceDropdown(visibleDevices);
    selectInitialCatalogDevice(visibleDevices);
  }

  function catalogCacheKey() {
    const fingerprint = String((window.CATALOG_FINGERPRINT || '')).trim();
    return /^[a-f0-9]{8,64}$/.test(fingerprint) ? fingerprint : 'no-version';
  }

  function loadLearningCatalog() {
    const url = '/api/index.php/learning/catalog?v=' + catalogCacheKey();
    return fetch(url, { credentials: 'include' })
      .then(function (response) {
        if (!response.ok) throw new Error('Không thể tải danh sách bài luyện tập.');
        return response.json();
      })
      .then(function (data) {
        const catalogDevices = Array.isArray(data.devices) ? data.devices : [];
        _catalogDeviceIds = new Set(catalogDevices.map(databaseDeviceToPortalId));
        _catalogLabIds = new Set(synchronizePortalCatalog(catalogDevices).keys());
        const visibleDevices = buildVisibleCatalogDevices(catalogDevices);
        populateDeviceDropdown(visibleDevices);
        selectInitialCatalogDevice(visibleDevices);
      });
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    const loadingOption = document.createElement('option');
    loadingOption.textContent = 'Đang tải bài luyện tập...';
    deviceSelect.replaceChildren(loadingOption);
    deviceSelect.disabled = true;

    // Bind events
    deviceSelect.addEventListener('change', () => {
      if (!confirmLeavePracticeSession()) {
        deviceSelect.value = currentDeviceId;
        return;
      }
      if (practiceScreen && practiceScreen.classList.contains('visible')) {
        backToLesson();
      }
      selectDevice(deviceSelect.value);
    });
    btnCollapse.addEventListener('click', toggleSidebar);

    // Practice screen events
    if (btnBackLesson) {
      btnBackLesson.addEventListener('click', () => {
        if (!confirmLeavePracticeSession()) return;
        backToLesson();
      });
    }
    window.addEventListener('beforeunload', (e) => {
      if (practiceScreen && practiceScreen.classList.contains('visible') &&
          currentMode === 'practice' &&
          _trackingSession && !_trackingSession.finalized) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    if (btnOpenNewTab) btnOpenNewTab.addEventListener('click', () => {
      if (currentIframeUrl) window.open(currentIframeUrl, '_blank', 'noopener');
    });
    if (btnSubmitLab) btnSubmitLab.addEventListener('click', submitLab);
    const btnGuideErrors = document.getElementById('btn-guide-errors');
    if (btnGuideErrors) {
      btnGuideErrors.addEventListener('click', () => {
        const device = DEVICES.find(d => d.id === currentDeviceId);
        const lesson = getCurrentLesson();
        if (device && lesson) {
          const evalResult = evaluateLesson(device, lesson);

          // Lấy thời gian thực để hiển thị trên bảng báo lỗi
          let elapsed = 0;
          if (typeof _practiceStartTime !== 'undefined' && _practiceStartTime) {
            elapsed = Math.floor((new Date() - _practiceStartTime) / 1000);
          }

          // Show modal but don't record to DB (since it's Guide mode preview)
          showGradingModal(evalResult, device, lesson, currentMode, elapsed);
        }
      });
    }

    // ── Grading Modal Events ──────────────────────────────────────────

    // 1. Click backdrop (viền đen ngoài bảng điểm)
    if (gradingBackdrop) gradingBackdrop.addEventListener('click', () => {
      if (trackingSaveInFlight) return;
      // KHÓA màn hình nếu CHƯA ĐẠT ở chế độ Thực hành (khi đã thực sự nộp bài chính thức)
      if (_lastEvalResult && !_lastEvalResult.passed && currentMode === 'practice') return;

      // Nếu ĐẠT: Đóng và quay về danh sách bài học
      if (_lastEvalResult && _lastEvalResult.passed) {
        hideGradingModal();
        backToLesson();
      } else {
        // Nếu CHƯA ĐẠT hoặc xem lỗi sai: Ẩn bảng để KTV tự sửa lỗi
        hideGradingModal();
      }
    });

    // 2. Nút "Quay lại làm từ đầu" / "Đóng & Sửa lỗi" (Hiển thị khi CHƯA ĐẠT)
    if (btnModalRetry) btnModalRetry.addEventListener('click', () => {
      if (currentMode === 'guide' || !_lastEvalResult) {
        // Chế độ Hướng dẫn hoặc khi xem lỗi sai: Đóng bảng để KTV thao tác tiếp, giữ nguyên giao diện thiết bị
        hideGradingModal();
      } else {
        // Chế độ Thực hành (sau khi nộp bài thất bại): Reset toàn bộ, đuổi ra ngoài danh sách bài học
        hideGradingModal();
        backToLesson();
      }
    });

    // 3. Nút "Hoàn tất & Quay lại" (Hiển thị khi ĐẠT)
    if (btnModalClose) btnModalClose.addEventListener('click', () => {
      hideGradingModal();
      backToLesson();
    });

    // Handle messages from simulator frames
    window.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'REQUEST_GUIDE_POPUPS') {
        if (currentMode === 'guide') {
          applyGuidePopups();
        } else {
          clearGuidePopups();
        }
      }
      // Nhận tín hiệu Save thành công từ simulator AX3000H v2 (qua postMessage cross-origin)
      if (event.data && event.data.type === 'FTC_SAVE_SUCCESS') {
        window._hasClickedSaveInGuide = true;
        // Delay nhỏ để frame đã load xong và đặt document._ftcIsSaved = true trước khi đọc
        setTimeout(function () {
          try {
            const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
            let savedWin = null;
            for (const doc of allDocs) {
              if (doc._ftcIsSaved || (doc.location && doc.location.search && doc.location.search.includes('save_success=1'))) {
                doc._ftcIsSaved = true;
                savedWin = doc.defaultView || doc.parentWindow;
                break;
              }
            }
            // Nếu không tìm thấy frame cụ thể, dùng contentWindow của iframe
            if (!savedWin) savedWin = deviceIframe.contentWindow;
            if (typeof window.onSimulatorSave === 'function') {
              window.onSimulatorSave(savedWin);
            }
          } catch (e) { }
        }, 50);
      }

    });

    // When iframe loads, trigger popups if in guide mode + clear fields
    deviceIframe.addEventListener('load', () => {
      iframeLoading.classList.add('hidden');
      if (currentMode === 'guide') {
        setTimeout(applyGuidePopups, 100);
        setTimeout(applyGuidePopups, 350);
        setTimeout(applyGuidePopups, 800);
        setTimeout(applyGuidePopups, 1500);
      } else {
        clearGuidePopups();
      }
      // Xóa trắng các field được khai báo trong clearFields của bài học
      setTimeout(clearLessonFields, 300);
      setTimeout(clearLessonFields, 900);

      // Gọi hook phục hồi dữ liệu nếu bài học có định nghĩa
      if (_currentLesson && typeof _currentLesson.onSimLoad === 'function') {
        setTimeout(() => { _currentLesson.onSimLoad(deviceIframe.contentWindow); }, 400);
        setTimeout(() => { _currentLesson.onSimLoad(deviceIframe.contentWindow); }, 1000);
      }
    });

    // ── Hiệu ứng phản hồi thị giác khi bấm Apply / Save (Screen & Button Flash) ──
    function triggerSaveFlashEffect(targetDoc, triggerBtn) {
      const now = Date.now();
      if (window._lastSaveFlashTime && (now - window._lastSaveFlashTime < 500)) return;
      window._lastSaveFlashTime = now;

      try {
        // 1. Nháy toàn bộ khung thiết bị deviceIframe 1 lần (100% -> 35% -> 100%)
        if (deviceIframe) {
          deviceIframe.style.transition = 'opacity 0.12s ease-in-out';
          deviceIframe.style.opacity = '0.35';
          setTimeout(function () {
            if (deviceIframe) {
              deviceIframe.style.opacity = '1';
              setTimeout(function () {
                if (deviceIframe) deviceIframe.style.transition = '';
              }, 150);
            }
          }, 120);
        }

        // 2. Nháy nội dung bên trong document con nếu có
        if (targetDoc && targetDoc.body && targetDoc.body !== document.body) {
          targetDoc.body.style.transition = 'opacity 0.12s ease-in-out';
          targetDoc.body.style.opacity = '0.35';
          setTimeout(function () {
            if (targetDoc && targetDoc.body) {
              targetDoc.body.style.opacity = '1';
              setTimeout(function () {
                if (targetDoc && targetDoc.body) targetDoc.body.style.transition = '';
              }, 150);
            }
          }, 120);
        }

        // 3. Phản hồi lún nhẹ và bừng sáng trên nút bấm
        if (triggerBtn) {
          triggerBtn.style.transition = 'transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease';
          triggerBtn.style.transform = 'scale(0.95)';
          triggerBtn.style.filter = 'brightness(1.25)';
          triggerBtn.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.6)';
          setTimeout(function () {
            triggerBtn.style.transform = '';
            triggerBtn.style.filter = '';
            triggerBtn.style.boxShadow = '';
            setTimeout(function () {
              triggerBtn.style.transition = '';
            }, 150);
          }, 200);
        }
      } catch (e) { }
    }

    // Periodic sync interval while practice screen is active
    if (!guideSyncInterval) {
      guideSyncInterval = setInterval(() => {
        if (practiceScreen.classList.contains('visible')) {
          // Xóa trắng trường của bài học cho cả Hướng dẫn và Thực hành khi load trang mới
          clearLessonFields();

            if (currentMode === 'guide') {
              applyGuidePopups();
            }

          // Theo dõi sự kiện click vào nút Save/Apply trong iframe (chạy cho cả Hướng dẫn và Thực hành)
          try {
            const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
            allDocs.forEach(doc => {
              // Liên tục Tắt gợi ý mật khẩu/tự động điền (Autocomplete/Saved Info) bằng phương pháp mạnh (readonly hack)
              try {
                const skipAutofillHack = (currentDeviceId === 'ONT_be6500c' || currentDeviceId === 'be6500c' ||
                    currentDeviceId === 'ONT_be12000' || currentDeviceId === 'be12000' ||
                    currentDeviceId === 'ONT_be15000' || currentDeviceId === 'be15000');
                if (!skipAutofillHack) {
                  doc.querySelectorAll('form:not([data-autofill-disabled]), input:not([data-autofill-disabled])').forEach(el => {
                    el.setAttribute('data-autofill-disabled', 'true');
                    el.setAttribute('autocomplete', 'off'); // Chuẩn chung
                    el.setAttribute('data-lpignore', 'true'); // Chặn LastPass
                    el.setAttribute('data-form-type', 'other');

                    if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password' || el.type === 'number')) {
                      // Bỏ qua các ô vốn dĩ đã bị khóa (readonly / disabled) từ mã HTML gốc
                      if (el.hasAttribute('readonly') || el.hasAttribute('disabled')) {
                        return;
                      }

                      // Cài cắm cạm bẫy readonly: Edge/Chrome sẽ không hiện popup Saved Info trên ô readonly.
                      // Khi người dùng thực sự bấm vào hoặc tab vào, ta mới gỡ readonly ra.
                      el.setAttribute('readonly', 'readonly');

                      const removeReadonly = function () {
                        if (el.hasAttribute('readonly')) {
                          el.removeAttribute('readonly');
                        }
                      };

                      el.addEventListener('focus', removeReadonly);
                      el.addEventListener('click', removeReadonly);
                      el.addEventListener('mousedown', removeReadonly);

                      // Khôi phục readonly khi rời chuột/focus để đảm bảo chặn triệt để
                      el.addEventListener('blur', function () {
                        if (el.value === '') {
                          el.setAttribute('readonly', 'readonly');
                        }
                      });
                    }
                  });
                }
              } catch (e) { }

              if (!doc._ftcSaveListenerAttached) {

                // Ràng buộc đăng nhập thiết bị bắt buộc nhập admin / admin
                const loc = (doc.location && doc.location.href) ? doc.location.href.toLowerCase() : '';
                const hsh = (doc.location && doc.location.hash) ? doc.location.hash.toLowerCase() : '';
                const isMainPage = hsh.includes('#/home') || hsh.includes('#/network') || hsh.includes('#/system') || hsh.includes('#/status') || hsh.includes('#/device');
                const isLogin = !isMainPage && (loc.includes('login') || hsh.includes('login') || doc.querySelector('.login-fpt, form[action*="login"]'));

                if (isLogin) {
                  const checkLoginFields = function (e, triggerEl) {
                    // Cố gắng tìm các ô nhập liệu user/pass trên trang (lấy mọi input không bị ẩn)
                    const inputs = Array.from(doc.querySelectorAll('input')).filter(i => i.type !== 'hidden' && i.style.display !== 'none' && !i.disabled);
                    let isOk = false;

                    let hasAdminPass = false;
                    let hasAdminUser = false;
                    let hasPasswordType = false;

                    inputs.forEach(i => {
                      if (i.type === 'password') {
                        hasPasswordType = true;
                        if (i.value.trim() === 'admin') hasAdminPass = true;
                      } else if (i.tagName === 'INPUT' && (i.type === 'text' || !i.type)) {
                        if (i.value.trim() === 'admin') hasAdminUser = true;
                      }
                    });

                    // Xác định hợp lệ:
                    if (hasPasswordType) {
                      if (inputs.length > 1) {
                        if (hasAdminPass && hasAdminUser) isOk = true;
                      } else {
                        if (hasAdminPass) isOk = true;
                      }
                    } else {
                      if (inputs.length >= 2 && inputs[0].value.trim() === 'admin' && inputs[1].value.trim() === 'admin') {
                        isOk = true;
                      } else if (inputs.length === 1 && inputs[0].value.trim() === 'admin') {
                        isOk = true;
                      }
                    }

                    if (!isOk && inputs.length > 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation();
                      alert("Tên đăng nhập hoặc mật khẩu không chính xác! (Gợi ý: admin / admin)");
                      return false;
                    }
                    return true;
                  };

                  doc.addEventListener('click', function (e) {
                    let el = e.target;
                    // Bỏ qua nếu click vào các ô nhập liệu văn bản/mật khẩu
                    if (el && el.tagName === 'INPUT' && el.type !== 'submit' && el.type !== 'button') {
                      return;
                    }

                    while (el && el !== doc && el !== doc.body) {
                      // Dừng nếu duyệt lên tới form/table/container lớn
                      if (el.tagName === 'FORM' || el.tagName === 'TABLE' || el.tagName === 'BODY' || el.tagName === 'HTML') {
                        break;
                      }

                      const txt = (el.value || el.textContent || el.innerText || '').toLowerCase().trim();
                      const cls = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';
                      const id = (el.id || '').toLowerCase();
                      const isSubmitInput = el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') &&
                        (txt.includes('login') || txt.includes('log in') || txt.includes('đăng nhập') || id.includes('login') || cls.includes('login') || cls.includes('submit'));
                      const isButton = (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'SPAN') &&
                        (txt.includes('login') || txt.includes('log in') || txt.includes('đăng nhập') || id.includes('login') || cls.includes('login') || cls.includes('btn-primary') || cls.includes('submit'));

                      if (isSubmitInput || isButton) {
                        if (!checkLoginFields(e, el)) return false;
                        break;
                      }
                      el = el.parentNode;
                    }
                  }, true);

                  doc.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                      if (!checkLoginFields(e, e.target)) return false;
                    }
                  }, true);
                }

                // Bắt trước thao tác bấm nút Save/Apply ngay từ pointerdown/mousedown để tránh blur/change của input xóa cờ
                const markSaveInteraction = function (e) {
                  let el = e.target;
                  while (el && el !== doc) {
                    const laNutLuuMikrotik = (currentDeviceId === 'mikrotik_hexs') && (function () {
                      try {
                        const anchor = (el.tagName === 'A') ? el : (el.closest ? el.closest('a') : null);
                        if (!anchor) return false;
                        const text = (anchor.textContent || '').trim().toLowerCase();
                        return text === 'ok' || text === 'apply';
                      } catch (error) { return false; }
                    })();
                    const laNutLuuAc1000cv2 = (currentDeviceId === 'ac1000cv2' || currentDeviceId === 'sim_ac1000cv2') && (function () {
                      try {
                        const anchor = (el.tagName === 'A') ? el : (el.closest ? el.closest('a') : null);
                        if (!anchor) return false;
                        if (anchor.id && (anchor.id === 'btn_apply' || anchor.id.startsWith('btn_apply'))) return true;
                        const text = (anchor.textContent || '').trim().toLowerCase();
                        return text === 'apply' || text === 'save' || text === 'add';
                      } catch (error) { return false; }
                    })();
                    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' ||
                        (el.getAttribute && el.getAttribute('role') === 'button') || laNutLuuMikrotik || laNutLuuAc1000cv2) {
                      const btnVal = (el.value || el.textContent || '').trim().toLowerCase();
                      const isSaveOrApply = laNutLuuMikrotik ||
                        laNutLuuAc1000cv2 ||
                        btnVal.includes('save') ||
                        btnVal.includes('apply') || 
                        btnVal.includes('submit') || 
                        btnVal.includes('lưu') || 
                        ((currentDeviceId === 'vigor2927') && (btnVal === 'ok' || el.name === 'submit')) ||
                        ((currentLessonId === 'ONT_be6500c-bai6' || currentLessonId === 'be6500c-bai6' || currentLessonId === 'be6500c-bai5' || currentLessonId === 'LAB_AC1000F_06' || currentLessonId === 'LAB_AC1000HI_06' || currentLessonId === 'ac1000cv2-bai6' || currentLessonId === 'LAB_AC1000CV2_06') && (btnVal === 'add' || el.name === 'AddBtn' || el.name === 'Add1')) ||
                        (el.type === 'submit' && el.tagName === 'INPUT');
                      if (isSaveOrApply) {
                        doc._ftcLastSaveInteraction = Date.now();
                        // Lưu giữ giá trị password thực tế trước khi router (như ZTE BE12000) mask thành tabs
                        try {
                          doc.querySelectorAll('input[type="password"], .SpecialPassword, #Password, input[id*="Password"], input[id*="Passwd"]').forEach(function (inp) {
                            const v = inp.value;
                            if (typeof v === 'string' && v.replace(/[\t\s]/g, '') !== '') {
                              inp._ftcRealValue = v;
                              inp.dataset.ftcRealValue = v;
                            }
                          });
                        } catch (err) { }
                        break;
                      }
                    }
                    el = el.parentNode;
                  }
                };
                doc.addEventListener('pointerdown', markSaveInteraction, true);
                doc.addEventListener('mousedown', markSaveInteraction, true);

                // Sự kiện click nút Save/Apply
                doc.addEventListener('click', function (e) {
                  let el = e.target;
                  while (el && el !== doc) {
                    const laNutLuuMikrotik = (currentDeviceId === 'mikrotik_hexs') && (function () {
                      try {
                        const anchor = (el.tagName === 'A') ? el : (el.closest ? el.closest('a') : null);
                        if (!anchor) return false;
                        const text = (anchor.textContent || '').trim().toLowerCase();
                        return text === 'ok' || text === 'apply';
                      } catch (error) { return false; }
                    })();
                    const laNutLuuAc1000cv2 = (currentDeviceId === 'ac1000cv2' || currentDeviceId === 'sim_ac1000cv2') && (function () {
                      try {
                        const anchor = (el.tagName === 'A') ? el : (el.closest ? el.closest('a') : null);
                        if (!anchor) return false;
                        if (anchor.id && (anchor.id === 'btn_apply' || anchor.id.startsWith('btn_apply'))) return true;
                        const text = (anchor.textContent || '').trim().toLowerCase();
                        return text === 'apply' || text === 'save' || text === 'add';
                      } catch (error) { return false; }
                    })();
                    if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || laNutLuuMikrotik || laNutLuuAc1000cv2) {
                      const btnVal = (el.value || el.textContent || '').trim().toLowerCase();
                      const isOntBai6 = (currentLessonId === 'ONT_be6500c-bai6' || currentLessonId === 'be6500c-bai6' || currentLessonId === 'be6500c-bai5');
                      const isPortFwdAdd = (currentLessonId === 'LAB_AC1000F_06' || currentLessonId === 'LAB_AC1000HI_06' || currentLessonId === 'ac1000cv2-bai6' || currentLessonId === 'LAB_AC1000CV2_06');

                      // Nút "Add New" trên thanh công cụ dùng để mở modal thêm mới, KHÔNG phải nút lưu cấu hình
                      const isAddNewBtn = btnVal === 'add new' || el.classList.contains('sim-them') || (isOntBai6 && btnVal === 'add' && !el.closest('.MuiDialog-root, .MuiPaper-root') && !el.classList.contains('dlg-luu'));

                      const isExcludedAction = isAddNewBtn ||
                        (btnVal === 'add' && !isOntBai6 && !isPortFwdAdd) ||
                        btnVal === 'delete' || btnVal === 'undo' || btnVal === 'cancel' || btnVal === 'reset';

                      if (currentDeviceId === 'vigor2927') {
                        const href = (el.getAttribute && el.getAttribute('href') || '').toLowerCase();
                        const onclick = (el.getAttribute && el.getAttribute('onclick') || '').toLowerCase();
                        if (btnVal.includes('details page') || (el.name && el.name.toLowerCase().startsWith('btndtpage')) ||
                            href.includes('gotodetailset') || onclick.includes('gotodetailset') ||
                            href.includes('fid=2117') || onclick.includes('fid=2117') ||
                            href.includes('fid=4041') || onclick.includes('fid=4041')) {
                          doc._ftcIsClickingDetailsPage = true;
                          doc._ftcIsSaved = false;
                          window._hasClickedSaveInGuide = false;
                          return;
                        }
                      }

                      if (!isExcludedAction) {
                        const isVigorOk = (currentDeviceId === 'vigor2927') &&
                          (btnVal === 'ok' || el.id === 'btn-pppoe-ok' || el.id === 'btn-ipbmac-ok' ||
                           (el.name && el.name.toLowerCase() === 'btnok') || el.name === 'submit');
                        const isAx3000sApply = (el.id === 'button_apply') ||
                          (el.name && el.name.toLowerCase() === 'button_apply') ||
                          (el.classList && el.classList.contains('btn-apply'));
                        const isSaveOrApply = laNutLuuMikrotik ||
                          laNutLuuAc1000cv2 ||
                          isAx3000sApply ||
                          btnVal.includes('save') ||
                          btnVal.includes('apply') || 
                          btnVal.includes('submit') || 
                          btnVal.includes('lưu') || 
                          btnVal.includes('áp dụng') ||
                          isVigorOk ||
                          (isOntBai6 && (el.classList.contains('dlg-luu') || el.closest('.MuiDialogActions-root') || btnVal === 'add')) ||
                          (isPortFwdAdd && (btnVal === 'add' || el.name === 'AddBtn' || el.name === 'Add1')) ||
                          (el.type === 'submit' && el.tagName === 'INPUT');

                        if (isSaveOrApply) {
                          const isAx3000sBai2_2g = (currentLessonId === 'LAB_AX3000S_02') && 
                            (
                              Boolean(doc.querySelector && (doc.querySelector('[id="11n_BandWidth"]') || doc.getElementById('11n_BandWidth') || (function(){ try { return doc.querySelector('#11n_BandWidth'); } catch(e){ return null; } })())) ||
                              (doc.location && ((doc.location.href && doc.location.href.toLowerCase().includes('wlanbasicsetting2g')) || (doc.location.hash && doc.location.hash.toLowerCase().includes('wlanbasicsetting2g')))) ||
                              (doc.defaultView && doc.defaultView.location && doc.defaultView.location.hash && doc.defaultView.location.hash.toLowerCase().includes('wlanbasicsetting2g')) ||
                              Boolean(doc.querySelector && doc.querySelector('.skpage-title') && doc.querySelector('.skpage-title').textContent.includes('2.4G'))
                            );

                          doc._ftcLastSaveInteraction = Date.now();
                          doc._ftcIsSaved = true;
                          window._hasClickedSaveInGuide = true;
                          if (currentDeviceId === 'mikrotik_hexs') {
                            window._ftcMkChanTooltip = true;
                            setTimeout(function () { window._ftcMkChanTooltip = false; }, 200);
                          }
                          if (isAx3000sBai2_2g) {
                            doc._ftc2gSaved = true;
                            window._ftc2gSaved = true;
                            // Snapshot các giá trị 2.4G vào session cache ngay thời điểm click Save
                            try {
                              const ssidEl = doc.querySelector('#Txt_SSID, input[name="Txt_SSID"]');
                              const keyEl = doc.querySelector('#Pwd_WpaPsk, input[name="Pwd_WpaPsk"]');
                              const bwEl = doc.querySelector('#Sel_BandWidth, select[name="Sel_BandWidth"]');
                              if (!window._sessionRuleCache) window._sessionRuleCache = {};
                              window._sessionRuleCacheScope = 'ax3000s:LAB_AX3000S_02';
                              if (ssidEl) {
                                const sVal = (ssidEl.value || '').trim();
                                window._sessionRuleCache['wifi_ssid'] = { actualValue: sVal, isSaved: true, isMatch: (sVal === 'FPT Telecom') };
                              }
                              if (keyEl) {
                                const kVal = (keyEl.value || '').trim();
                                window._sessionRuleCache['wifi_key'] = { actualValue: kVal, isSaved: true, isMatch: (kVal === '19006600') };
                              }
                              if (bwEl) {
                                const bVal = (bwEl.value || '').trim();
                                window._sessionRuleCache['wifi_bw'] = { actualValue: bVal, isSaved: true, isMatch: (bVal === '20Mhz') };
                              }
                            } catch (e) { }

                            let statusMsg = doc.getElementById('ftc-ax3000s-save-status');
                            if (!statusMsg) {
                              statusMsg = doc.createElement('span');
                              statusMsg.id = 'ftc-ax3000s-save-status';
                              statusMsg.style.cssText = 'color:#15803d;font-weight:bold;font-size:13px;margin-left:12px;vertical-align:middle;';
                              if (el.parentNode) el.parentNode.insertBefore(statusMsg, el.nextSibling);
                            }
                            statusMsg.textContent = ' Đã lưu cấu hình Wi-Fi 2.4G thành công!';
                            setTimeout(function () { if (statusMsg) statusMsg.textContent = ''; }, 3500);
                          }
                          // Lưu giữ giá trị password thực tế trước khi router (như ZTE BE12000) mask thành tabs
                          try {
                            doc.querySelectorAll('input[type="password"], .SpecialPassword, #Password, input[id*="Password"], input[id*="Passwd"]').forEach(function (inp) {
                              const v = inp.value;
                              if (typeof v === 'string' && v.replace(/[\t\s]/g, '') !== '') {
                                inp._ftcRealValue = v;
                                inp.dataset.ftcRealValue = v;
                              }
                            });
                          } catch (err) { }
                          triggerSaveFlashEffect(doc, el);

                          if (currentDeviceId === 'ac1000cv2' || currentDeviceId === 'sim_ac1000cv2') {
                            try {
                              const anchor = (el.tagName === 'A') ? el : (el.closest ? el.closest('a') : null);
                              if (anchor && e && e.preventDefault) e.preventDefault();
                              if (!window._sessionRuleCache) window._sessionRuleCache = {};
                              const cacheKey = `ac1000cv2:${currentLessonId || 'ac1000cv2-bai1'}`;
                              window._sessionRuleCacheScope = cacheKey;
                              if (_trackingSession && !_trackingSession.ruleCache) _trackingSession.ruleCache = {};

                              const pPath = (doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';

                              // Bài 1: WAN PPPoE
                              const userEl = doc.querySelector('#ppp_user, input[name="ppp_user"]');
                              const passEl = doc.querySelector('#ppp_pass, input[name="ppp_pass"]');
                              if (userEl) {
                                const uVal = (userEl.value || '').trim();
                                window._sessionRuleCache['ppp_user'] = {
                                  actualValue: uVal,
                                  isSaved: true,
                                  isMatch: (uVal === 'sgfdl-210208-218')
                                };
                                if (_trackingSession) _trackingSession.ruleCache['ppp_user'] = window._sessionRuleCache['ppp_user'];
                              }
                              if (passEl) {
                                const pVal = (passEl.value || '').trim();
                                window._sessionRuleCache['ppp_pass'] = {
                                  actualValue: pVal,
                                  isSaved: true,
                                  isMatch: (pVal === 'fpt12345')
                                };
                                if (_trackingSession) _trackingSession.ruleCache['ppp_pass'] = window._sessionRuleCache['ppp_pass'];
                              }

                              // Bài 2: Wi-Fi 2.4G & 5G
                              const ssidEl = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
                              const keyEl = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
                              const sListEl = doc.querySelector('#ssid_list, select[name="ssid_list"]');
                              const modeEl = doc.querySelector('#select_security_mode, select[name="select_security_mode"], #security_mode, select[name="security_mode"]');

                              if (pPath.includes('wifi5ssid') && ssidEl) {
                                const sVal = (ssidEl.value || '').trim();
                                window._sessionRuleCache['wifi5_ssid'] = {
                                  actualValue: sVal,
                                  isSaved: true,
                                  isMatch: (sVal === 'FPT Telecom')
                                };
                                if (_trackingSession) _trackingSession.ruleCache['wifi5_ssid'] = window._sessionRuleCache['wifi5_ssid'];

                                const oos5 = {
                                  ssid_idx: (sListEl && sListEl.value && sListEl.value !== '0' && sListEl.value !== 'SSID 1') ? String(sListEl.value).trim() : null,
                                  isSaved: true
                                };
                                window._sessionRuleCache['wifi5_out_of_scope'] = oos5;
                                if (_trackingSession) _trackingSession.ruleCache['wifi5_out_of_scope'] = oos5;
                              } else if (pPath.includes('wifissid') && ssidEl) {
                                const sVal = (ssidEl.value || '').trim();
                                window._sessionRuleCache['wifi24_ssid'] = {
                                  actualValue: sVal,
                                  isSaved: true,
                                  isMatch: (sVal === 'FPT Telecom')
                                };
                                if (_trackingSession) _trackingSession.ruleCache['wifi24_ssid'] = window._sessionRuleCache['wifi24_ssid'];

                                const oos24 = {
                                  ssid_idx: (sListEl && sListEl.value && sListEl.value !== '0' && sListEl.value !== 'SSID 1') ? String(sListEl.value).trim() : null,
                                  isSaved: true
                                };
                                window._sessionRuleCache['wifi24_out_of_scope'] = oos24;
                                if (_trackingSession) _trackingSession.ruleCache['wifi24_out_of_scope'] = oos24;
                              }

                              if (pPath.includes('wifi5secu')) {
                                const modeVal = modeEl ? (modeEl.value || '').trim() : '';
                                const modeText = modeEl && modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeVal;
                                const isUnsafe = (modeVal === '4' || modeVal === '5' || /open|wep/i.test(modeText));
                                const sec5 = {
                                  modeVal: modeVal,
                                  modeText: modeText,
                                  isUnsafe: isUnsafe,
                                  isSaved: true
                                };
                                window._sessionRuleCache['wifi5_sec_mode'] = sec5;
                                if (_trackingSession) _trackingSession.ruleCache['wifi5_sec_mode'] = sec5;

                                const kVal = keyEl ? (keyEl.value || '').trim() : '';
                                const finalKeyVal = isUnsafe ? '' : kVal;
                                window._sessionRuleCache['wifi5_key'] = {
                                  actualValue: finalKeyVal,
                                  isSaved: true,
                                  isMatch: (!isUnsafe && finalKeyVal === '19006600')
                                };
                                if (_trackingSession) _trackingSession.ruleCache['wifi5_key'] = window._sessionRuleCache['wifi5_key'];
                                window._ftcAc1000cv2FinalApplyClicked = true;
                              } else if (pPath.includes('wifisecu')) {
                                const modeVal = modeEl ? (modeEl.value || '').trim() : '';
                                const modeText = modeEl && modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeVal;
                                const isUnsafe = (modeVal === '4' || modeVal === '5' || /open|wep/i.test(modeText));
                                const sec24 = {
                                  modeVal: modeVal,
                                  modeText: modeText,
                                  isUnsafe: isUnsafe,
                                  isSaved: true
                                };
                                window._sessionRuleCache['wifi24_sec_mode'] = sec24;
                                if (_trackingSession) _trackingSession.ruleCache['wifi24_sec_mode'] = sec24;

                                const kVal = keyEl ? (keyEl.value || '').trim() : '';
                                const finalKeyVal = isUnsafe ? '' : kVal;
                                window._sessionRuleCache['wifi24_key'] = {
                                  actualValue: finalKeyVal,
                                  isSaved: true,
                                  isMatch: (!isUnsafe && finalKeyVal === '19006600')
                                };
                                if (_trackingSession) _trackingSession.ruleCache['wifi24_key'] = window._sessionRuleCache['wifi24_key'];
                              }

                              // Bài 3: Wi-Fi phụ (IoT / Khách)
                              const isBai3 = (currentLessonId === 'ac1000cv2-bai3' || currentLessonId === 'LAB_AC1000CV2_03');
                              if (isBai3) {
                                const sListEl = doc.querySelector('#ssid_list, select[name="ssid_list"]');
                                const sListVal = sListEl ? String(sListEl.value).trim() : '';
                                if (pPath.includes('wifissid')) {
                                  if (sListEl) {
                                    window._sessionRuleCache['wifi_iot_index'] = {
                                      actualValue: sListVal,
                                      isSaved: true,
                                      isMatch: (sListVal === '1' || sListVal === 'SSID 2')
                                    };
                                    if (_trackingSession) _trackingSession.ruleCache['wifi_iot_index'] = window._sessionRuleCache['wifi_iot_index'];
                                  }
                                  const enEl = doc.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
                                  const isEn = Boolean(enEl && enEl.checked);
                                  window._sessionRuleCache['wifi_iot_enable'] = {
                                    actualValue: isEn ? '1' : '0',
                                    isSaved: true,
                                    isMatch: isEn
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['wifi_iot_enable'] = window._sessionRuleCache['wifi_iot_enable'];

                                  if (ssidEl) {
                                    const sVal = (ssidEl.value || '').trim();
                                    window._sessionRuleCache['wifi_iot_ssid'] = {
                                      actualValue: sVal,
                                      isSaved: true,
                                      isMatch: (sVal === 'FPT Telecom-IoT')
                                    };
                                    if (_trackingSession) _trackingSession.ruleCache['wifi_iot_ssid'] = window._sessionRuleCache['wifi_iot_ssid'];
                                  }
                                } else if (pPath.includes('wifisecu')) {
                                  if (sListEl && sListVal === '1') {
                                    window._sessionRuleCache['wifi_iot_index'] = {
                                      actualValue: sListVal,
                                      isSaved: true,
                                      isMatch: true
                                    };
                                    if (_trackingSession) _trackingSession.ruleCache['wifi_iot_index'] = window._sessionRuleCache['wifi_iot_index'];
                                  }
                                  if (keyEl) {
                                    const kVal = (keyEl.value || '').trim();
                                    window._sessionRuleCache['wifi_iot_key'] = {
                                      actualValue: kVal,
                                      isSaved: true,
                                      isMatch: (kVal === 'fpt12345' || kVal === '19006600')
                                    };
                                    if (_trackingSession) _trackingSession.ruleCache['wifi_iot_key'] = window._sessionRuleCache['wifi_iot_key'];
                                    window._ftcAc1000cv2FinalApplyClicked = true;
                                  }
                                }
                              }

                              // Bài 4: Cấu hình DNS thủ công (LAN)
                              const isBai4 = (currentLessonId === 'ac1000cv2-bai4' || currentLessonId === 'LAB_AC1000CV2_04') || pPath.includes('lan');
                              if (isBai4 && pPath.includes('lan')) {
                                const ovwrt0 = doc.querySelector('#dns_ovwrt0, input[name="dns_overwrite"][value="1"]');
                                const isOvwrt = Boolean(ovwrt0 && ovwrt0.checked);
                                window._sessionRuleCache['dns_overwrite'] = {
                                  actualValue: isOvwrt ? '1' : '0',
                                  isSaved: true,
                                  isMatch: isOvwrt
                                };
                                if (_trackingSession) _trackingSession.ruleCache['dns_overwrite'] = window._sessionRuleCache['dns_overwrite'];

                                const p1El = doc.querySelector('#dns_primary, input[name="dns_primary"]');
                                if (p1El) {
                                  const p1Val = (p1El.value || '').trim();
                                  window._sessionRuleCache['dns_primary'] = {
                                    actualValue: p1Val,
                                    isSaved: true,
                                    isMatch: (p1Val === '8.8.8.8')
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['dns_primary'] = window._sessionRuleCache['dns_primary'];
                                }

                                const p2El = doc.querySelector('#dns_secondary, input[name="dns_secondary"]');
                                if (p2El) {
                                  const p2Val = (p2El.value || '').trim();
                                  window._sessionRuleCache['dns_secondary'] = {
                                    actualValue: p2Val,
                                    isSaved: true,
                                    isMatch: (p2Val === '8.8.4.4')
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['dns_secondary'] = window._sessionRuleCache['dns_secondary'];
                                }
                              }

                              // Bài 5: Cấu hình địa chỉ mạng LAN & DHCP
                              const isBai5 = (currentLessonId === 'ac1000cv2-bai5' || currentLessonId === 'LAB_AC1000CV2_05');
                              if (isBai5 && pPath.includes('lan')) {
                                const lanIpEl = doc.querySelector('#lan_ip, input[name="lan_ip"]');
                                if (lanIpEl) {
                                  const lanIpVal = (lanIpEl.value || '').trim();
                                  window._sessionRuleCache['lan_ip'] = {
                                    actualValue: lanIpVal,
                                    isSaved: true,
                                    isMatch: (lanIpVal === '192.168.10.1' || lanIpVal === '192.168.1.1')
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['lan_ip'] = window._sessionRuleCache['lan_ip'];
                                }

                                const lanMaskEl = doc.querySelector('#lan_mask, input[name="lan_mask"]');
                                if (lanMaskEl) {
                                  const lanMaskVal = (lanMaskEl.value || '').trim();
                                  window._sessionRuleCache['lan_mask'] = {
                                    actualValue: lanMaskVal,
                                    isSaved: true,
                                    isMatch: (lanMaskVal === '255.255.255.0')
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['lan_mask'] = window._sessionRuleCache['lan_mask'];
                                }

                                const dhcpEnEl = doc.querySelector('#dhcp_enable0, input[name="dhcp_enable"][value="1"]');
                                const isDhcpEn = Boolean(dhcpEnEl && dhcpEnEl.checked);
                                window._sessionRuleCache['dhcp_enable'] = {
                                  actualValue: isDhcpEn ? '1' : '0',
                                  isSaved: true,
                                  isMatch: isDhcpEn
                                };
                                if (_trackingSession) _trackingSession.ruleCache['dhcp_enable'] = window._sessionRuleCache['dhcp_enable'];

                                const startIpEl = doc.querySelector('#start_ip, #startip, input[name="start_ip"], input[name="startip"]');
                                if (startIpEl) {
                                  const startIpVal = (startIpEl.value || '').trim();
                                  window._sessionRuleCache['dhcp_start'] = {
                                    actualValue: startIpVal,
                                    isSaved: true,
                                    isMatch: (startIpVal === '192.168.10.2' || startIpVal === '192.168.1.2')
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['dhcp_start'] = window._sessionRuleCache['dhcp_start'];
                                }

                                const endIpEl = doc.querySelector('#end_ip, #endip, input[name="end_ip"], input[name="endip"]');
                                if (endIpEl) {
                                  const endIpVal = (endIpEl.value || '').trim();
                                  window._sessionRuleCache['dhcp_end'] = {
                                    actualValue: endIpVal,
                                    isSaved: true,
                                    isMatch: (endIpVal === '192.168.10.254' || endIpVal === '192.168.1.254')
                                  };
                                  if (_trackingSession) _trackingSession.ruleCache['dhcp_end'] = window._sessionRuleCache['dhcp_end'];
                                }
                              }
                            } catch (e) { }

                            let statusMsg = doc.getElementById('ftc-ac1000cv2-save-status');
                            if (!statusMsg) {
                              statusMsg = doc.createElement('span');
                              statusMsg.id = 'ftc-ac1000cv2-save-status';
                              statusMsg.style.cssText = 'color:#15803d;font-weight:bold;font-size:13px;margin-left:12px;vertical-align:middle;';
                              if (el.parentNode) el.parentNode.insertBefore(statusMsg, el.nextSibling);
                            }
                            statusMsg.textContent = ' Đã lưu cấu hình thành công!';
                            setTimeout(function () { if (statusMsg) statusMsg.textContent = ''; }, 3500);
                          }

                          if (currentDeviceId === 'vigor2927') {
                            let statusMsg = doc.getElementById('ftc-save-status');
                            if (!statusMsg) {
                              statusMsg = doc.createElement('span');
                              statusMsg.id = 'ftc-save-status';
                              statusMsg.style.cssText = 'color:#15803d;font-weight:bold;font-size:13px;margin-left:12px;vertical-align:middle;';
                              if (el.parentNode) el.parentNode.insertBefore(statusMsg, el.nextSibling);
                            }
                            statusMsg.textContent = ' Đã lưu cấu hình thành công!';
                            setTimeout(function () { if (statusMsg) statusMsg.textContent = ''; }, 3000);
                          }

                          window._hasClickedSaveInGuide = true;
                          setTimeout(function () {
                            try { if (typeof window.onSimulatorSave === 'function') window.onSimulatorSave(doc.defaultView || doc.parentWindow); } catch(ex) { console.warn('[FTC] onSimulatorSave error:', ex); }
                          }, (isOntBai6 || isPortFwdAdd) ? 350 : 50);
                        }
                      }
                    }
                    el = el.parentNode;
                  }
                }, true);

                // AC1000C V2: Chặn submit reload toàn trang, lưu dữ liệu nền và cập nhật session
                if ((currentDeviceId === 'ac1000cv2' || currentDeviceId === 'sim_ac1000cv2') && !doc._ftcAc1000cv2SubmitAttached) {
                  doc.addEventListener('submit', function (event) {
                    const form = event.target;
                    event.preventDefault();
                    doc._ftcIsSaved = true;
                    window._hasClickedSaveInGuide = true;

                    try {
                      if (!window._sessionRuleCache) window._sessionRuleCache = {};
                      const cacheKey = `ac1000cv2:${currentLessonId || 'ac1000cv2-bai1'}`;
                      window._sessionRuleCacheScope = cacheKey;
                      if (_trackingSession && !_trackingSession.ruleCache) _trackingSession.ruleCache = {};

                      const pPath = (doc.location && doc.location.pathname) ? doc.location.pathname.toLowerCase() : '';

                      // Bài 1: WAN PPPoE
                      const userEl = doc.querySelector('#ppp_user, input[name="ppp_user"]');
                      const passEl = doc.querySelector('#ppp_pass, input[name="ppp_pass"]');
                      if (userEl) {
                        const uVal = (userEl.value || '').trim();
                        window._sessionRuleCache['ppp_user'] = {
                          actualValue: uVal,
                          isSaved: true,
                          isMatch: (uVal === 'sgfdl-210208-218')
                        };
                        if (_trackingSession) _trackingSession.ruleCache['ppp_user'] = window._sessionRuleCache['ppp_user'];
                      }
                      if (passEl) {
                        const pVal = (passEl.value || '').trim();
                        window._sessionRuleCache['ppp_pass'] = {
                          actualValue: pVal,
                          isSaved: true,
                          isMatch: (pVal === 'fpt12345')
                        };
                        if (_trackingSession) _trackingSession.ruleCache['ppp_pass'] = window._sessionRuleCache['ppp_pass'];
                      }

                      // Bài 2: Wi-Fi 2.4G & 5G
                      const ssidEl = doc.querySelector('#ssid_network_name, input[name="ssid_network_name"]');
                      const keyEl = doc.querySelector('#security_wpa_key, input[name="security_wpa_key"]');
                      const sListEl = doc.querySelector('#ssid_list, select[name="ssid_list"]');
                      const modeEl = doc.querySelector('#select_security_mode, select[name="select_security_mode"], #security_mode, select[name="security_mode"]');

                      if (pPath.includes('wifi5ssid') && ssidEl) {
                        const sVal = (ssidEl.value || '').trim();
                        window._sessionRuleCache['wifi5_ssid'] = {
                          actualValue: sVal,
                          isSaved: true,
                          isMatch: (sVal === 'FPT Telecom')
                        };
                        if (_trackingSession) _trackingSession.ruleCache['wifi5_ssid'] = window._sessionRuleCache['wifi5_ssid'];

                        const oos5 = {
                          ssid_idx: (sListEl && sListEl.value && sListEl.value !== '0' && sListEl.value !== 'SSID 1') ? String(sListEl.value).trim() : null,
                          isSaved: true
                        };
                        window._sessionRuleCache['wifi5_out_of_scope'] = oos5;
                        if (_trackingSession) _trackingSession.ruleCache['wifi5_out_of_scope'] = oos5;
                      } else if (pPath.includes('wifissid') && ssidEl) {
                        const sVal = (ssidEl.value || '').trim();
                        window._sessionRuleCache['wifi24_ssid'] = {
                          actualValue: sVal,
                          isSaved: true,
                          isMatch: (sVal === 'FPT Telecom')
                        };
                        if (_trackingSession) _trackingSession.ruleCache['wifi24_ssid'] = window._sessionRuleCache['wifi24_ssid'];

                        const oos24 = {
                          ssid_idx: (sListEl && sListEl.value && sListEl.value !== '0' && sListEl.value !== 'SSID 1') ? String(sListEl.value).trim() : null,
                          isSaved: true
                        };
                        window._sessionRuleCache['wifi24_out_of_scope'] = oos24;
                        if (_trackingSession) _trackingSession.ruleCache['wifi24_out_of_scope'] = oos24;
                      }

                      if (pPath.includes('wifi5secu')) {
                        const modeVal = modeEl ? (modeEl.value || '').trim() : '';
                        const modeText = modeEl && modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeVal;
                        const isUnsafe = (modeVal === '4' || modeVal === '5' || /open|wep/i.test(modeText));
                        const sec5 = {
                          modeVal: modeVal,
                          modeText: modeText,
                          isUnsafe: isUnsafe,
                          isSaved: true
                        };
                        window._sessionRuleCache['wifi5_sec_mode'] = sec5;
                        if (_trackingSession) _trackingSession.ruleCache['wifi5_sec_mode'] = sec5;

                        const kVal = keyEl ? (keyEl.value || '').trim() : '';
                        const finalKeyVal = isUnsafe ? '' : kVal;
                        window._sessionRuleCache['wifi5_key'] = {
                          actualValue: finalKeyVal,
                          isSaved: true,
                          isMatch: (!isUnsafe && finalKeyVal === '19006600')
                        };
                        if (_trackingSession) _trackingSession.ruleCache['wifi5_key'] = window._sessionRuleCache['wifi5_key'];
                        window._ftcAc1000cv2FinalApplyClicked = true;
                      } else if (pPath.includes('wifisecu')) {
                        const modeVal = modeEl ? (modeEl.value || '').trim() : '';
                        const modeText = modeEl && modeEl.options && modeEl.selectedIndex >= 0 ? modeEl.options[modeEl.selectedIndex].text : modeVal;
                        const isUnsafe = (modeVal === '4' || modeVal === '5' || /open|wep/i.test(modeText));
                        const sec24 = {
                          modeVal: modeVal,
                          modeText: modeText,
                          isUnsafe: isUnsafe,
                          isSaved: true
                        };
                        window._sessionRuleCache['wifi24_sec_mode'] = sec24;
                        if (_trackingSession) _trackingSession.ruleCache['wifi24_sec_mode'] = sec24;

                        const kVal = keyEl ? (keyEl.value || '').trim() : '';
                        const finalKeyVal = isUnsafe ? '' : kVal;
                        window._sessionRuleCache['wifi24_key'] = {
                          actualValue: finalKeyVal,
                          isSaved: true,
                          isMatch: (!isUnsafe && finalKeyVal === '19006600')
                        };
                        if (_trackingSession) _trackingSession.ruleCache['wifi24_key'] = window._sessionRuleCache['wifi24_key'];
                      }

                      // Bài 3: Wi-Fi phụ (IoT / Khách)
                      const isBai3 = (currentLessonId === 'ac1000cv2-bai3' || currentLessonId === 'LAB_AC1000CV2_03');
                      if (isBai3) {
                        const sListEl = doc.querySelector('#ssid_list, select[name="ssid_list"]');
                        const sListVal = sListEl ? String(sListEl.value).trim() : '';
                        if (pPath.includes('wifissid')) {
                          if (sListEl) {
                            window._sessionRuleCache['wifi_iot_index'] = {
                              actualValue: sListVal,
                              isSaved: true,
                              isMatch: (sListVal === '1' || sListVal === 'SSID 2')
                            };
                            if (_trackingSession) _trackingSession.ruleCache['wifi_iot_index'] = window._sessionRuleCache['wifi_iot_index'];
                          }
                          const enEl = doc.querySelector('#ssid_enable, input[name="ssid_state"][value="1"]');
                          const isEn = Boolean(enEl && enEl.checked);
                          window._sessionRuleCache['wifi_iot_enable'] = {
                            actualValue: isEn ? '1' : '0',
                            isSaved: true,
                            isMatch: isEn
                          };
                          if (_trackingSession) _trackingSession.ruleCache['wifi_iot_enable'] = window._sessionRuleCache['wifi_iot_enable'];

                          if (ssidEl) {
                            const sVal = (ssidEl.value || '').trim();
                            window._sessionRuleCache['wifi_iot_ssid'] = {
                              actualValue: sVal,
                              isSaved: true,
                              isMatch: (sVal === 'FPT Telecom-IoT')
                            };
                            if (_trackingSession) _trackingSession.ruleCache['wifi_iot_ssid'] = window._sessionRuleCache['wifi_iot_ssid'];
                          }
                        } else if (pPath.includes('wifisecu')) {
                          if (sListEl && sListVal === '1') {
                            window._sessionRuleCache['wifi_iot_index'] = {
                              actualValue: sListVal,
                              isSaved: true,
                              isMatch: true
                            };
                            if (_trackingSession) _trackingSession.ruleCache['wifi_iot_index'] = window._sessionRuleCache['wifi_iot_index'];
                          }
                          if (keyEl) {
                            const kVal = (keyEl.value || '').trim();
                            window._sessionRuleCache['wifi_iot_key'] = {
                              actualValue: kVal,
                              isSaved: true,
                              isMatch: (kVal === 'fpt12345' || kVal === '19006600')
                            };
                            if (_trackingSession) _trackingSession.ruleCache['wifi_iot_key'] = window._sessionRuleCache['wifi_iot_key'];
                            window._ftcAc1000cv2FinalApplyClicked = true;
                          }
                        }
                      }

                      // Bài 4: Cấu hình DNS thủ công (LAN)
                      const isBai4 = (currentLessonId === 'ac1000cv2-bai4' || currentLessonId === 'LAB_AC1000CV2_04') || pPath.includes('lan');
                      if (isBai4 && pPath.includes('lan')) {
                        const ovwrt0 = doc.querySelector('#dns_ovwrt0, input[name="dns_overwrite"][value="1"]');
                        const isOvwrt = Boolean(ovwrt0 && ovwrt0.checked);
                        window._sessionRuleCache['dns_overwrite'] = {
                          actualValue: isOvwrt ? '1' : '0',
                          isSaved: true,
                          isMatch: isOvwrt
                        };
                        if (_trackingSession) _trackingSession.ruleCache['dns_overwrite'] = window._sessionRuleCache['dns_overwrite'];

                        const p1El = doc.querySelector('#dns_primary, input[name="dns_primary"]');
                        if (p1El) {
                          const p1Val = (p1El.value || '').trim();
                          window._sessionRuleCache['dns_primary'] = {
                            actualValue: p1Val,
                            isSaved: true,
                            isMatch: (p1Val === '8.8.8.8')
                          };
                          if (_trackingSession) _trackingSession.ruleCache['dns_primary'] = window._sessionRuleCache['dns_primary'];
                        }

                        const p2El = doc.querySelector('#dns_secondary, input[name="dns_secondary"]');
                        if (p2El) {
                          const p2Val = (p2El.value || '').trim();
                          window._sessionRuleCache['dns_secondary'] = {
                            actualValue: p2Val,
                            isSaved: true,
                            isMatch: (p2Val === '8.8.4.4')
                          };
                          if (_trackingSession) _trackingSession.ruleCache['dns_secondary'] = window._sessionRuleCache['dns_secondary'];
                        }
                      }

                      // Bài 5: Cấu hình địa chỉ mạng LAN & DHCP
                      const isBai5 = (currentLessonId === 'ac1000cv2-bai5' || currentLessonId === 'LAB_AC1000CV2_05');
                      if (isBai5 && pPath.includes('lan')) {
                        const lanIpEl = doc.querySelector('#lan_ip, input[name="lan_ip"]');
                        if (lanIpEl) {
                          const lanIpVal = (lanIpEl.value || '').trim();
                          window._sessionRuleCache['lan_ip'] = {
                            actualValue: lanIpVal,
                            isSaved: true,
                            isMatch: (lanIpVal === '192.168.1.1')
                          };
                          if (_trackingSession) _trackingSession.ruleCache['lan_ip'] = window._sessionRuleCache['lan_ip'];
                        }

                        const lanMaskEl = doc.querySelector('#lan_mask, input[name="lan_mask"]');
                        if (lanMaskEl) {
                          const lanMaskVal = (lanMaskEl.value || '').trim();
                          window._sessionRuleCache['lan_mask'] = {
                            actualValue: lanMaskVal,
                            isSaved: true,
                            isMatch: (lanMaskVal === '255.255.255.0')
                          };
                          if (_trackingSession) _trackingSession.ruleCache['lan_mask'] = window._sessionRuleCache['lan_mask'];
                        }

                        const dhcpEnEl = doc.querySelector('#dhcp_enable0, input[name="dhcp_enable"][value="1"]');
                        const isDhcpEn = Boolean(dhcpEnEl && dhcpEnEl.checked);
                        window._sessionRuleCache['dhcp_enable'] = {
                          actualValue: isDhcpEn ? '1' : '0',
                          isSaved: true,
                          isMatch: isDhcpEn
                        };
                        if (_trackingSession) _trackingSession.ruleCache['dhcp_enable'] = window._sessionRuleCache['dhcp_enable'];

                        const startIpEl = doc.querySelector('#start_ip, #startip, input[name="start_ip"], input[name="startip"]');
                        if (startIpEl) {
                          const startIpVal = (startIpEl.value || '').trim();
                          window._sessionRuleCache['dhcp_start'] = {
                            actualValue: startIpVal,
                            isSaved: true,
                            isMatch: (startIpVal === '192.168.1.2')
                          };
                          if (_trackingSession) _trackingSession.ruleCache['dhcp_start'] = window._sessionRuleCache['dhcp_start'];
                        }

                        const endIpEl = doc.querySelector('#end_ip, #endip, input[name="end_ip"], input[name="endip"]');
                        if (endIpEl) {
                          const endIpVal = (endIpEl.value || '').trim();
                          window._sessionRuleCache['dhcp_end'] = {
                            actualValue: endIpVal,
                            isSaved: true,
                            isMatch: (endIpVal === '192.168.1.254')
                          };
                          if (_trackingSession) _trackingSession.ruleCache['dhcp_end'] = window._sessionRuleCache['dhcp_end'];
                        }
                      }
                    } catch (e) { }

                    try {
                      const pName = (doc.getElementById('XWebPageName') && doc.getElementById('XWebPageName').value) || 'wan';
                      const act = form.action || ("/GponForm/" + pName + "_XForm");
                      const formData = new FormData(form);
                      const params = new URLSearchParams();
                      for (const pair of formData.entries()) {
                        params.append(pair[0], pair[1]);
                      }
                      fetch(act, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: params.toString()
                      }).catch(function() {});
                    } catch (e) { }

                    let statusMsg = doc.getElementById('ftc-ac1000cv2-save-status');
                    if (!statusMsg) {
                      statusMsg = doc.createElement('span');
                      statusMsg.id = 'ftc-ac1000cv2-save-status';
                      statusMsg.style.cssText = 'color:#15803d;font-weight:bold;font-size:13px;margin-left:12px;vertical-align:middle;';
                      const applyBtn = doc.getElementById('btn_apply') || doc.getElementById('btn_apply2') || doc.querySelector('.apply_btn') || form.querySelector('button, input[type="submit"]');
                      if (applyBtn && applyBtn.parentNode) applyBtn.parentNode.insertBefore(statusMsg, applyBtn.nextSibling);
                    }
                    if (statusMsg) {
                      statusMsg.textContent = ' Đã lưu cấu hình thành công!';
                      setTimeout(function () { if (statusMsg) statusMsg.textContent = ''; }, 3500);
                    }

                    try {
                      if (typeof window.onSimulatorSave === 'function') {
                        window.onSimulatorSave(doc.defaultView || doc.parentWindow);
                      }
                    } catch (error) { }
                  }, true);
                  doc._ftcAc1000cv2SubmitAttached = true;
                }

                // Vigor2927 dùng nhiều form CGI: giữ điều hướng giữa các trang nhưng chặn reload khi lưu cấu hình.
                if (currentDeviceId === 'vigor2927') {
                  try {
                    const win = doc.defaultView || doc.parentWindow;
                    if (win) {
                      win.confirm = function () { return true; };
                      win.alert = function (message) { console.log('[Vigor Alert]', message); };
                    }
                  } catch (error) { }
                  const isLogin = doc.location && (doc.location.href.includes('weblogin') || doc.location.href.includes('login'));
                  if (!isLogin && !doc._ftcVigorSubmitAttached) {
                    doc.addEventListener('submit', function (event) {
                      const form = event.target;
                      const action = (form && form.action) ? form.action.toLowerCase() : '';
                      if (action.includes('wlogin') || action.includes('login')) return;
                      const fid = form && form.elements && form.elements.fid ? String(form.elements.fid.value) : '';
                      const iAct = form && form.elements && form.elements.iAct ? String(form.elements.iAct.value) : '';
                      if (doc._ftcIsClickingDetailsPage || (fid === '2117' && iAct === '0') || fid === '102' ||
                          (fid === '2087' && iAct === '0') || fid === '4041') {
                        doc._ftcIsClickingDetailsPage = false;
                        doc._ftcIsSaved = false;
                        window._hasClickedSaveInGuide = false;
                        if (form.action && !form.action.includes('/sim_vigor2927/') && form.action.includes('/cgi-bin/')) {
                          form.action = form.action.replace('/cgi-bin/', '/sim_vigor2927/cgi-bin/');
                        }
                        return;
                      }
                      event.preventDefault();
                      window._hasClickedSaveInGuide = true;
                      doc._ftcIsSaved = true;
                      try {
                        if (typeof window.onSimulatorSave === 'function') {
                          window.onSimulatorSave(doc.defaultView || doc.parentWindow);
                        }
                      } catch (error) { }
                    }, true);
                    doc._ftcVigorSubmitAttached = true;
                  }
                }

                function isEventOnAx3000s2g(e, d) {
                  if (currentLessonId !== 'LAB_AX3000S_02') return true;
                  const targetEl = e.target;
                  const isInput2g = Boolean(targetEl && (
                    targetEl.id === 'Txt_SSID' || targetEl.name === 'Txt_SSID' ||
                    targetEl.id === 'Pwd_WpaPsk' || targetEl.name === 'Pwd_WpaPsk' ||
                    targetEl.id === 'Sel_BandWidth' || targetEl.name === 'Sel_BandWidth'
                  ));
                  try {
                    const is5gTarget = Boolean(targetEl.closest && (targetEl.closest('[id="11n_BandWidth5G"]') || (targetEl.closest('.modset') && d.querySelector && d.querySelector('.skpage-title')?.textContent.includes('5G'))));
                    if (is5gTarget) return false;
                    const has5gBlock = Boolean(d.querySelector && (d.querySelector('[id="11n_BandWidth5G"]') || d.getElementById('11n_BandWidth5G')));
                    const has2gBlock = Boolean(d.querySelector && (d.querySelector('[id="11n_BandWidth"]') || d.getElementById('11n_BandWidth')));
                    if (has5gBlock && !has2gBlock) return false;
                  } catch (e) { }
                  const title = d.querySelector && d.querySelector('.skpage-title');
                  if (title && title.textContent.includes('5G')) return false;
                  const hash = (d.defaultView && d.defaultView.location && d.defaultView.location.hash) || '';
                  if (hash.includes('wlanBasicSetting5g')) return false;
                  return true;
                }

                // Đánh dấu người dùng đã chạm vào ô nhập liệu để tránh bị clear tự động
                // Đồng thời hủy bỏ trạng thái "Đã Save" nếu người dùng sửa lại dữ liệu
                doc.addEventListener('keydown', function (e) {
                  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                    e.target._ftcUserModified = true;
                  }
                  if (e.isTrusted) {
                    if (isEventOnAx3000s2g(e, doc)) {
                      window._hasSuccHintStored = false;
                      window._hasClickedSaveInGuide = false;
                      doc._ftcIsSaved = false;
                      doc._ftc2gSaved = false;
                      window._ftc2gSaved = false;
                    }
                  }
                }, true);
                doc.addEventListener('input', function (e) {
                  if (e.target) {
                    e.target._ftcUserModified = true;
                    if (e.isTrusted && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                      const val = e.target.value;
                      if (typeof val === 'string' && val.replace(/[\t\s]/g, '') !== '') {
                        e.target._ftcRealValue = val;
                        e.target.dataset.ftcRealValue = val;
                      }
                    }
                  }
                  if (e.isTrusted) {
                    if (isEventOnAx3000s2g(e, doc)) {
                      window._hasSuccHintStored = false;
                      window._hasClickedSaveInGuide = false;
                      doc._ftcIsSaved = false;
                      doc._ftc2gSaved = false;
                      window._ftc2gSaved = false;
                    }
                  }
                }, true);
                doc.addEventListener('change', function (e) {
                  if (e.target) {
                    e.target._ftcUserModified = true;
                    if (e.isTrusted && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                      const val = e.target.value;
                      if (typeof val === 'string' && val.replace(/[\t\s]/g, '') !== '') {
                        e.target._ftcRealValue = val;
                        e.target.dataset.ftcRealValue = val;
                      }
                    }
                  }
                  if (e.isTrusted) {
                    // Nếu đã lưu 2.4G thành công, không hủy cờ lưu khi phát sinh sự kiện change thông thường
                    if (currentLessonId === 'LAB_AX3000S_02' && (doc._ftc2gSaved || window._ftc2gSaved)) {
                      return;
                    }
                    // Nếu sự kiện change phát sinh do người dùng vừa click nút Save/Apply (blur khỏi input trong vòng 1.5s), không hủy cờ Save
                    if (doc._ftcLastSaveInteraction && (Date.now() - doc._ftcLastSaveInteraction < 1500)) {
                      return;
                    }
                    if (isEventOnAx3000s2g(e, doc)) {
                      window._hasSuccHintStored = false;
                      window._hasClickedSaveInGuide = false;
                      doc._ftcIsSaved = false;
                      doc._ftc2gSaved = false;
                      window._ftc2gSaved = false;
                    }
                  }
                }, true);

                // Đồng bộ vị trí tooltip tức thì khi cuộn trang
                if (!doc._ftcScrollBound) {
                  doc._ftcScrollBound = true;
                  const win = doc.defaultView || window;
                  if (win) {
                    win.addEventListener('scroll', function () {
                      if (currentMode === 'guide') applyGuidePopups();
                    }, { passive: true });
                  }
                }

                // === BẮT LỖI TƯƠNG TÁC CHÍNH XÁC TUYỆT ĐỐI (Dành riêng cho SPAs) ===
                if (!doc._ftcOriginalValues) doc._ftcOriginalValues = {};

                const captureBeforeEdit = function (e) {
                  if (!e.isTrusted) return; // Chỉ bắt người dùng thật
                  let el = e.target;
                  // Nếu click vào thẻ label bọc input, lấy input bên trong
                  if (el.tagName === 'LABEL') {
                    const input = el.querySelector('input, select, textarea');
                    if (input) el = input;
                  }
                  // Hỗ trợ bắt component Material-UI (MUI) khi click vào container, textfield, radio, checkbox, select
                  if (el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA') {
                    const muiContainer = el.closest ? el.closest('.MuiInputBase-root, .MuiRadio-root, .MuiSwitch-root, .MuiCheckbox-root, .MuiFormControl-root, label') : null;
                    if (muiContainer) {
                      const nestedInput = muiContainer.querySelector('input, select, textarea');
                      if (nestedInput) el = nestedInput;
                    }
                  }
                  if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
                    // Bỏ qua các trường thuộc trang hoặc form đăng nhập (login)
                    const loc = (doc.location && doc.location.href) ? doc.location.href.toLowerCase() : '';
                    const hsh = (doc.location && doc.location.hash) ? doc.location.hash.toLowerCase() : '';
                    const isLoginPage = loc.includes('login') || hsh.includes('login');
                    const isLoginField = isLoginPage ||
                      (el.closest && el.closest('.login, .login-fpt, .login-form, .login-box, form[action*="login"], #login, [class*="login"]')) ||
                      el.id === 'username' || el.id === 'password' ||
                      (el.name && (el.name.toLowerCase() === 'username' || el.name.toLowerCase() === 'password')) ||
                      (el.placeholder && (el.placeholder.toLowerCase().includes('username') || el.placeholder.toLowerCase().includes('password')));
                    if (isLoginField) return;

                    if (!el.dataset.ftcId) el.dataset.ftcId = 'ftc_' + Math.random().toString(36).substr(2, 9);
                    const uid = el.dataset.ftcId;
                    // Lưu lại giá trị của field NGAY TRƯỚC KHI người dùng kịp thay đổi nó
                    if (doc._ftcOriginalValues[uid] === undefined) {
                      doc._ftcOriginalValues[uid] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
                    }
                  }
                };

                // Mousedown, Pointerdown và Focusin kích hoạt ngay trước khi giá trị kịp thay đổi
                doc.addEventListener('pointerdown', captureBeforeEdit, true);
                doc.addEventListener('mousedown', captureBeforeEdit, true);
                doc.addEventListener('focusin', captureBeforeEdit, true);
                // =================================================================

                doc._ftcSaveListenerAttached = true;
              }
            });
          } catch (e) { }

          if (currentMode === 'guide') {
            applyGuidePopups();
          } else {
            clearGuidePopups();
          }

          // Tự động kiểm tra hoàn thành để mở nút Nộp bài hoặc hiển thị nút Lỗi sai
          const device = DEVICES.find(d => d.id === currentDeviceId);
          const lesson = getCurrentLesson();
          if (device && lesson) {
            let hasSuccHint = false;
            // Quét tìm thông báo thành công "Your data have been stored!" trên thiết bị
            const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
            if (window._hasSuccHintStored) {
              hasSuccHint = true;
            } else {
              for (const d of allDocs) {
                try {
                  if (d.location && d.location.search && d.location.search.includes('save_success=1')) {
                    if (d._ftcIsSaved !== false) {
                      d._ftcIsSaved = true;
                      window._hasClickedSaveInGuide = true;
                    }
                  }
                  if (d._ftcHasSuccHint) { hasSuccHint = true; break; }
                  const hints = d.querySelectorAll('.succHint');
                  for (const h of hints) {
                    // Bắt buộc thẻ thông báo phải đang thực sự HIỂN THỊ (không bị style display: none)
                    const isVis = (h.offsetWidth > 0 || h.offsetHeight > 0) && h.style.display !== 'none';
                    if (isVis) {
                      const txt = (h.textContent || '').toLowerCase();
                      if (txt.includes('your data') || txt.includes('been stored')) {
                        hasSuccHint = true;
                        d._ftcHasSuccHint = true;
                        break;
                      }
                    }
                  }
                  if (hasSuccHint) break;
                } catch (e) { }
              }
            }

            if (hasSuccHint) {
              window._hasSuccHintStored = true;
              window._hasClickedSaveInGuide = true;
            }

            const evalResult = evaluateLesson(device, lesson);
            let btnGuideErrors = document.getElementById('btn-guide-errors');
            const noConfig = isNoConfigDevice();

            if (currentMode === 'practice') {
              // ⚡ CHẾ ĐỘ THỰC HÀNH:
              // 1. Nút "Xem lỗi sai" LUÔN LUÔN ẨN (không tiết lộ lỗi trước khi nộp bài)
              if (btnGuideErrors) {
                btnGuideErrors.style.display = 'none';
              }
              // 2. Nút "Nộp bài & Chấm điểm" LUÔN KHẢ DỤNG để học viên nộp bài bất kỳ lúc nào (đúng hay sai đều nộp được)
              if (btnSubmitLab) {
                btnSubmitLab.disabled = false;
                btnSubmitLab.style.opacity = '1';
                btnSubmitLab.style.cursor = 'pointer';
                btnSubmitLab.style.animation = 'submitBtnPulse 2.5s infinite';
              }
            } else {
              // 💡 CHẾ ĐỘ HƯỚNG DẪN:
              const trangDangLamSach = evalResult
                ? ((typeof evalResult.trangHienTaiDat === 'boolean')
                  ? evalResult.trangHienTaiDat : evalResult.passed)
                : false;

              // Thiết bị không yêu cầu cấu hình (như BE15000) hoặc ĐÃ BẤM SAVE/APPLY VÀ ĐẠT:
              if (noConfig || (window._hasClickedSaveInGuide && (hasSuccHint || (evalResult && evalResult.passed)))) {
                // Nút Nộp bài SÁNG LÊN
                if (btnSubmitLab) {
                  btnSubmitLab.disabled = false;
                  btnSubmitLab.style.opacity = '1';
                  btnSubmitLab.style.cursor = 'pointer';
                  btnSubmitLab.style.animation = 'submitBtnPulse 2.5s infinite';
                }
                // Nút Lỗi sai ẨN ĐI
                if (btnGuideErrors) {
                  btnGuideErrors.style.display = 'none';
                }
              } else {
                // Chưa đạt hoặc chưa bấm Save trong Hướng dẫn:
                if (btnGuideErrors) {
                  const isMultiStepIncomplete = Boolean(evalResult && evalResult.daVaoTrangCuoi === false);
                  const hasMissingSteps = (!trangDangLamSach) || (!evalResult.passed && !isMultiStepIncomplete);
                  if (window._hasClickedSaveInGuide && evalResult && hasMissingSteps) {
                    // Đã bấm Save/Apply mà cấu hình SAI: Nút lỗi sai SÁNG LÊN để trợ giúp học tập
                    btnGuideErrors.style.display = 'flex';
                    btnGuideErrors.disabled = false;
                    btnGuideErrors.style.opacity = '1';
                    btnGuideErrors.style.cursor = 'pointer';
                    btnGuideErrors.style.background = '#fee2e2';
                    btnGuideErrors.style.color = '#ef4444';
                    btnGuideErrors.style.borderColor = '#fca5a5';
                    btnGuideErrors.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
                  } else {
                    btnGuideErrors.style.display = 'none';
                  }
                }

                // Nút Nộp bài MỜ/TẮT trong Hướng dẫn
                if (btnSubmitLab) {
                  btnSubmitLab.disabled = true;
                  btnSubmitLab.style.opacity = '0.5';
                  btnSubmitLab.style.cursor = 'not-allowed';
                  btnSubmitLab.style.animation = 'none';
                }
              }
            }
          }
        }
      }, 400);
    }

    // Show system ready after short delay
    setTimeout(() => {
      if (statusText) {
        statusText.textContent = _guestGuideMode
          ? 'Guest Guide Mode · Không lưu tiến độ'
          : 'System Ready';
      }
    }, 1200);

    // Tải thông tin người dùng hiện tại từ API để dùng cho Tracking
    fetchCurrentUser();
  }

  function redirectToLogin() {
    const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
    if (isLocalHost) {
      window.location.replace('/api/index.php/dev/bypass?next=' + encodeURIComponent(window.location.origin + '/portal.html'));
    } else {
      window.location.replace('/login/index.html');
    }
  }

  function renderUserProfile() {
    const section = document.getElementById('user-profile-section');
    if (!section) return;

    if (_guestGuideMode) {
      section.innerHTML = `
        <div class="auth-container">
          <div class="auth-user-info">
            <div class="auth-avatar">G</div>
            <div class="auth-details">
              <span class="auth-name">Khách</span>
              <span class="auth-role">Hướng dẫn ngoại tuyến · không lưu tiến độ</span>
            </div>
          </div>
        </div>
      `;
    } else if (_currentUser) {
      const initials = (_currentUser.name || 'K').substring(0, 2).toUpperCase();
      const roleLabel = _currentUser.role_name
        || ({ KTV: 'Kỹ thuật viên', ADMIN: 'Quản trị viên', DEV: 'Nhà phát triển' }[_currentUser.role])
        || _currentUser.job_title
        || 'Kỹ thuật viên';
      section.innerHTML = `
        <div class="auth-container">
          <div class="auth-user-info">
            <div class="auth-avatar">${initials}</div>
            <div class="auth-details">
              <span class="auth-name" title="${escapeHTML(_currentUser.name)}">${escapeHTML(_currentUser.name)}</span>
              <span class="auth-role" title="${escapeHTML(roleLabel)}">${escapeHTML(roleLabel)}</span>
            </div>
          </div>
          <button class="btn-auth btn-logout" id="btn-iam-logout" title="Đăng xuất">Đăng xuất</button>
        </div>
      `;
      const btnIamLogout = document.getElementById('btn-iam-logout');
      if (btnIamLogout) {
        btnIamLogout.addEventListener('click', function () {
          fetch('/api/index.php/auth/logout', { method: 'POST', credentials: 'include' })
            .then(function () {
              window.location.href = '/login/index.html';
            });
        });
      }
    } else {
      section.innerHTML = `
        <div class="auth-container">
          <button class="btn-auth btn-login" id="btn-iam-login">Đăng nhập IAM</button>
        </div>
      `;
      const btnIamLogin = document.getElementById('btn-iam-login');
      if (btnIamLogin) {
        btnIamLogin.addEventListener('click', function () {
          redirectToLogin();
        });
      }
    }
  }

  // ── Fetch Current User (for Tracking) ───────────────────────────
  /**
   * Lấy thông tin user đang đăng nhập từ API auth/session.
   * Kết quả được cache vào _currentUser để dùng khi gửi Tracking API.
   * Nếu chưa đăng nhập, tự động chuyển hướng về trang login.
   */
  function applyCurrentUser(u) {
    _currentUser = u ? {
      technician_id: u.user_id || u.id || 'UNKNOWN',
      employee_id: u.employee_id || u.employeeId || '',
      name: u.displayName || u.display_name || u.email || 'KTV',
      email: u.email || '',
      role: String(u.role || 'KTV').toUpperCase(),
      role_name: u.roleName || u.role_name || '',
      is_admin: Boolean(u.isAdmin ?? u.is_admin ?? u.permissions?.admin),
      can_export_reports: Boolean(u.canExportReports ?? u.can_export_reports ?? u.permissions?.exportReports),
      job_title: u.job_title || u.jobTitle || ''
    } : null;
    renderUserProfile();
    return _currentUser;
  }

  function requestCurrentUserSession() {
    if (currentUserRequest) return currentUserRequest;
    currentUserRequest = fetch('/api/index.php/auth/session', {
      credentials: 'include',
      cache: 'no-store'
    })
      .then(function (res) {
        if (res.ok) return res.json();
        return res.json().catch(function () { return {}; }).then(function (payload) {
          const error = new Error(`Không kiểm tra được phiên đăng nhập (HTTP ${res.status}).`);
          error.status = res.status;
          error.code = payload && payload.error ? payload.error.code : '';
          throw error;
        });
      })
      .then(function (data) {
        const user = applyCurrentUser(data && data.user ? data.user : null);
        if (user) markSessionHeartbeatSuccess();
        return user;
      })
      .finally(function () {
        currentUserRequest = null;
      });
    return currentUserRequest;
  }

  function isDatabaseUnavailableForGuestMode(error) {
    if (error && error.code === 'db-connect-error') return Promise.resolve(true);
    if (databaseAvailabilityRequest) return databaseAvailabilityRequest;

    databaseAvailabilityRequest = fetch('/api/index.php/health', {
      credentials: 'omit',
      cache: 'no-store'
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (payload) {
          return Boolean(payload && payload.error && payload.error.code === 'db-connect-error');
        });
      })
      .catch(function () {
        // A generic API/network failure must not silently become an auth bypass.
        return false;
      })
      .finally(function () {
        databaseAvailabilityRequest = null;
      });
    return databaseAvailabilityRequest;
  }

  function activateGuestGuideMode() {
    if (_guestGuideMode) return;
    _guestGuideMode = true;
    _currentUser = null;
    if (sessionHeartbeatInterval) {
      clearInterval(sessionHeartbeatInterval);
      sessionHeartbeatInterval = null;
    }
    renderUserProfile();
    if (statusText) statusText.textContent = 'Guest Guide Mode · Không lưu tiến độ';
    loadStaticGuestGuideCatalog();
  }

  function enterGuestModeOrRedirect(error) {
    return isDatabaseUnavailableForGuestMode(error).then(function (databaseUnavailable) {
      if (databaseUnavailable) {
        activateGuestGuideMode();
        return null;
      }
      redirectToLogin();
      return null;
    });
  }

  function markSessionHeartbeatSuccess() {
    try {
      localStorage.setItem(SESSION_HEARTBEAT_LAST_SUCCESS_KEY, String(Date.now()));
    } catch (error) {
      console.debug('[Auth] Không thể chia sẻ thời điểm heartbeat giữa các tab.', error);
    }
  }

  function sessionHeartbeatDue() {
    try {
      const lastSuccess = Number(localStorage.getItem(SESSION_HEARTBEAT_LAST_SUCCESS_KEY) || 0);
      return !Number.isFinite(lastSuccess) || Date.now() - lastSuccess >= SESSION_HEARTBEAT_INTERVAL_MS;
    } catch (error) {
      return true;
    }
  }

  function claimSessionHeartbeatLease() {
    if (!sessionHeartbeatDue()) return false;
    try {
      const now = Date.now();
      const current = JSON.parse(localStorage.getItem(SESSION_HEARTBEAT_LEASE_KEY) || 'null');
      if (current?.owner !== sessionHeartbeatOwner && Number(current?.expiresAt) > now) return false;
      localStorage.setItem(SESSION_HEARTBEAT_LEASE_KEY, JSON.stringify({
        owner: sessionHeartbeatOwner,
        expiresAt: now + SESSION_HEARTBEAT_LEASE_MS
      }));
      return JSON.parse(localStorage.getItem(SESSION_HEARTBEAT_LEASE_KEY) || 'null')?.owner
        === sessionHeartbeatOwner;
    } catch (error) {
      return true;
    }
  }

  function releaseSessionHeartbeatLease() {
    try {
      const current = JSON.parse(localStorage.getItem(SESSION_HEARTBEAT_LEASE_KEY) || 'null');
      if (current?.owner === sessionHeartbeatOwner) localStorage.removeItem(SESSION_HEARTBEAT_LEASE_KEY);
    } catch (error) {
      // A short lease expiry remains the fallback when storage is unavailable.
    }
  }

  function refreshSessionHeartbeat() {
    if (document.visibilityState === 'hidden' || !_currentUser) return;
    if (!claimSessionHeartbeatLease()) return;
    requestCurrentUserSession().then(function (user) {
      if (!user && sessionHeartbeatInterval) {
        clearInterval(sessionHeartbeatInterval);
        sessionHeartbeatInterval = null;
      }
    }).catch(function (error) {
      console.warn('[Auth] Chưa thể gia hạn phiên đăng nhập:', error);
    }).finally(function () {
      releaseSessionHeartbeatLease();
    });
  }

  function startSessionHeartbeat() {
    if (!sessionHeartbeatInterval) {
      sessionHeartbeatInterval = setInterval(refreshSessionHeartbeat, SESSION_HEARTBEAT_INTERVAL_MS);
    }
    if (document.body.dataset.sessionHeartbeatBound !== 'true') {
      document.body.dataset.sessionHeartbeatBound = 'true';
      window.addEventListener('focus', refreshSessionHeartbeat);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') refreshSessionHeartbeat();
      });
    }
  }

  function loadCatalogWithOfflineFallback() {
    return loadLearningCatalog().catch(function (error) {
      console.warn('[Catalog] Không thể tải danh sách bài luyện tập:', error);
      return isDatabaseUnavailableForGuestMode(error).then(function (databaseUnavailable) {
        if (databaseUnavailable) {
          activateGuestGuideMode();
          return;
        }
        _catalogDeviceIds = new Set();
        _catalogLabIds = new Set();
        _catalogLabNames = new Map();
        _catalogLabOrder = new Map();
        currentDeviceId = null;
        populateDeviceDropdown([]);
        const errorState = document.createElement('div');
        errorState.className = 'empty-state';
        const message = document.createElement('p');
        message.textContent = 'Không thể tải danh sách bài luyện tập đang hoạt động.';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn btn-secondary';
        retry.textContent = 'Thử lại';
        retry.addEventListener('click', function () {
          retry.disabled = true;
          retry.textContent = 'Đang tải...';
          loadCatalogWithOfflineFallback();
        });
        errorState.append(message, retry);
        navList.replaceChildren(errorState);
        showHero();
        setBreadcrumb(['Chưa tải được danh mục']);
      });
    });
  }

  function fetchCurrentUser() {
    return requestCurrentUserSession()
      .then(function (user) {
        if (!user) {
          return enterGuestModeOrRedirect();
        }
        if (user.is_admin) {
          const btnDashboard = document.getElementById('btn-dashboard');
          if (btnDashboard) {
            btnDashboard.style.display = '';
            btnDashboard.onclick = function () {
              window.location.href = '/dashboard-authen/';
            };
          }
        }
        startSessionHeartbeat();
        return loadCatalogWithOfflineFallback().then(function () {
          return _guestGuideMode ? null : user;
        });
      })
      .catch(function (error) {
        console.warn('[Tracking] Không thể lấy thông tin user từ API:', error);
        return enterGuestModeOrRedirect(error);
      });
  }

  // ── Device Selection ─────────────────────────────────────────────
  function selectDevice(deviceId, targetLabId = null, autoMode = null) {
    const normDevId = normalizeDeviceId(deviceId);
    if (!_catalogDeviceIds.has(normDevId)) return;

    const device = DEVICES.find(d => normalizeDeviceId(d.id) === normDevId);
    if (!device) return;

    currentDeviceId = device.id;
    currentLessonId = null;
    window._sessionRuleCache = {};
    window._sessionRuleCacheScope = null;
    window._hasClickedSaveInGuide = false;
    window._hasSuccHintStored = false;
    resetDeviceSession(device.id);

    // Sync dropdown
    deviceSelect.value = device.id;

    // Render nav list
    renderNavList(device);

    // Automatically select requested or first lesson if available
    const allAllowedLessons = (device.categories?.flatMap(category => category.lessons || []) || [])
      .filter(lesson => {
        const normLab = normalizeLabId(lesson.id);
        return _catalogLabIds.has(normLab);
      })
      .sort((left, right) => (_catalogLabOrder.get(normalizeLabId(left.id)) ?? Number.MAX_SAFE_INTEGER)
        - (_catalogLabOrder.get(normalizeLabId(right.id)) ?? Number.MAX_SAFE_INTEGER));

    let chosenLesson = null;
    if (targetLabId) {
      const normTarget = normalizeLabId(targetLabId);
      chosenLesson = allAllowedLessons.find(l => {
        const lid = normalizeLabId(l.id);
        return lid === normTarget
          || lid.replace(/^lab_/i, '') === normTarget.replace(/^lab_/i, '')
          || lid.endsWith(normTarget)
          || normTarget.endsWith(lid);
      });
    }
    if (!chosenLesson && allAllowedLessons.length > 0) {
      chosenLesson = allAllowedLessons[0];
    }
    if (chosenLesson) {
      const lessonItem = navList.querySelector(`[data-lesson-id="${chosenLesson.id}"]`) || navList.querySelector('.nav-item');
      selectLesson(device, chosenLesson, lessonItem);
      if (lessonItem && typeof lessonItem.scrollIntoView === 'function') {
        lessonItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (autoMode === 'practice' && btnPrac) {
        setTimeout(() => btnPrac.click(), 100);
      } else if (autoMode === 'guide' && btnGuide) {
        setTimeout(() => btnGuide.click(), 100);
      }
    } else {
      showHero();
      setBreadcrumb([device.name]);
    }
  }

  // ── Render Nav ───────────────────────────────────────────────────
  function renderNavList(device) {
    navList.innerHTML = '';

    if (!device.categories || device.categories.length === 0) {
      navList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p>Chưa có bài học nào<br>cho thiết bị này.</p>
        </div>`;
      return;
    }

    device.categories.forEach(cat => {
      const lessons = (cat.lessons || []).filter(lesson => {
        const normLab = normalizeLabId(lesson.id);
        return _catalogLabIds.has(normLab);
      }).sort((left, right) => (_catalogLabOrder.get(normalizeLabId(left.id)) ?? Number.MAX_SAFE_INTEGER)
        - (_catalogLabOrder.get(normalizeLabId(right.id)) ?? Number.MAX_SAFE_INTEGER));
      if (!lessons.length) return;
      // Category title
      const catTitle = document.createElement('div');
      catTitle.className = 'nav-category-title';
      catTitle.textContent = cat.title;
      navList.appendChild(catTitle);

      // Lessons
      lessons.forEach((lesson, idx) => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.dataset.lessonId = lesson.id;

        // Parse "Bài X - " for the number
        const match = lesson.title.match(/^(Bài\s*\d+)\s*[-—]\s*(.+)$/i);
        const numPart = match ? match[1] : `${idx + 1}`;
        const labelPart = match ? match[2] : lesson.title;

        item.innerHTML = `
          <span class="nav-num">${numPart}</span>
          <span class="nav-label" title="${lesson.title}">- ${labelPart}</span>`;

        item.addEventListener('click', () => {
          if (!confirmLeavePracticeSession()) return;
          if (practiceScreen && practiceScreen.classList.contains('visible')) {
            backToLesson();
          }
          selectLesson(device, lesson, item);
        });
        navList.appendChild(item);
      });
    });
  }

  // ── Lesson Selection ─────────────────────────────────────────────
  function selectLesson(device, lesson, itemEl) {
    currentLessonId = lesson.id;
    window._sessionRuleCache = {};
    window._sessionRuleCacheScope = null;
    window._hasClickedSaveInGuide = false;
    window._hasSuccHintStored = false;
    window._ftc2gSaved = false;
    resetDeviceSession(device.id);

    // Update nav active state
    navList.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    itemEl.classList.add('active');

    // Breadcrumb
    setBreadcrumb([device.name, 'Học Tập', lesson.title]);

    // Render lesson card
    renderLessonCard(lesson);

    // Switch view to show lesson card
    showLesson();

    // Auto collapse sidebar on mobile portrait so content is immediately visible
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
    }
  }

  // ── Render Lesson Card ───────────────────────────────────────────
  function renderLessonCard(lesson) {
    lcTitle.textContent = lesson.title.toUpperCase();
    lcSubtitle.textContent = lesson.subtitle;

    // Build instruction list
    lcInstr.innerHTML = '';
    lesson.instructions.forEach(instr => {
      const div = document.createElement('div');
      div.className = 'instruction-item';
      div.innerHTML = instr;
      lcInstr.appendChild(div);
    });

    // 💡 Hướng dẫn — mở giao diện thiết bị và BẬT POPUP HƯỚNG DẪN TỪNG BƯỚC
    const device = DEVICES.find(d => d.id === currentDeviceId);
    btnGuide.onclick = () => {
      if (!_currentUser && !_guestGuideMode) {
        redirectToLogin();
        return;
      }
      currentMode = 'guide';
      const loginUrl = device.loginUrl + (device.loginUrl.includes('?') ? '&' : '?') + 'lab=' + encodeURIComponent(lesson.id) + '&mode=guide&_t=' + Date.now();
      openInFrame(device, lesson, loginUrl, '💡 Hướng dẫn', true);
    };

    // ⚡ Thực hành — mở trang login của thiết bị và TẮT POPUP (bắt buộc học viên login vào)
    btnPrac.onclick = () => {
      if (!_currentUser && !_guestGuideMode) {
        redirectToLogin();
        return;
      }
      currentMode = 'practice';
      const loginUrl = device.loginUrl + (device.loginUrl.includes('?') ? '&' : '?') + 'lab=' + encodeURIComponent(lesson.id) + '&mode=practice&_t=' + Date.now();
      openInFrame(device, lesson, loginUrl, '⚡ Thực hành', false);
    };
  }

  // ── Open In Frame ────────────────────────────────────────────────
  function openInFrame(device, lesson, url, modeLabel, enableGuide) {
    if (!device || !url) return;

    currentIframeUrl = url;
    currentMode = enableGuide ? 'guide' : 'practice';

    // Thiết lập cookie current_sim cho Master Dispatcher
    const simId = device.folder || ('sim_' + device.id);
    document.cookie = 'current_sim=' + simId + ';path=/;SameSite=Lax';

    // Update practice topbar info
    if (practiceModeLabel) {
      practiceModeLabel.textContent = modeLabel + ':';
      practiceModeLabel.className = 'practice-badge ' + (enableGuide ? 'guide' : 'practice');
    }
    if (practiceLessonTitle) practiceLessonTitle.textContent = lesson.title;

    // Always hide server warning banner
    if (serverWarning) {
      serverWarning.style.display = 'none';
    }

    const popups = getLessonPopups(device.id, lesson);

    // Save popups to localStorage
    if (enableGuide && popups && popups.length > 0) {
      localStorage.setItem('ftc_guide_popups', JSON.stringify(popups));
      localStorage.setItem('ftc_guide_enabled', '1');
    } else {
      localStorage.setItem('ftc_guide_enabled', '0');
      localStorage.removeItem('ftc_guide_popups');
    }

    // Reset session storage & local storage chống lưu cache các phiên trước cho 3 thiết bị mới và thiết bị cũ
    try {
      localStorage.removeItem('BE12000_state');
      localStorage.removeItem('labStartTime');
      localStorage.removeItem('labStartSession');
      sessionStorage.removeItem('BE12000_session');
      sessionStorage.removeItem('BE12000_loginToken');
      sessionStorage.removeItem('sid');
      sessionStorage.removeItem('be6500c_sid');
      sessionStorage.removeItem('tech_support_sid');
      sessionStorage.removeItem('ftc_ac1000f_wan_PPPUsername');
      sessionStorage.removeItem('ftc_ac1000f_wan_PPPPassword');
      localStorage.removeItem('ftc_sim_wifi24');
      localStorage.removeItem('ftc_sim_wifi5g');
    } catch (e) { }

    // Lưu lesson hiện tại để dùng cho clearFields
    _currentLesson = lesson;
    window._currentLesson = lesson;

    // Reset cờ theo dõi click Save cho phiên hướng dẫn mới
    window._hasClickedSaveInGuide = false;
    window._hasSuccHintStored = false;

    // ── Ghi nhận thời điểm BẮT ĐẦU phiên thực hành (Tracking) ──
    const targetDevId = (device && device.id) ? device.id : currentDeviceId;
    const targetLabId = (lesson && lesson.id) ? lesson.id : currentLessonId;
    window._sessionRuleCache = {};
    window._sessionRuleCacheScope = `${targetDevId}:${targetLabId}`;
    _trackingSession = {
      device: device,
      lesson: lesson,
      mode: enableGuide ? 'Hướng dẫn' : 'Thực hành',
      startedAt: new Date().toISOString(),
      submissionId: crypto.randomUUID ? crypto.randomUUID() : ('sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)),
      ruleCache: {},
      cachedUnexpectedErrors: []
    };
    const sessionToReserve = _trackingSession;
    _trackingSession.startSettled = sessionToReserve.mode !== 'Thực hành';
    _trackingSession.startPromise = sessionToReserve.mode === 'Thực hành'
      ? reserveTrackingTimerStart(sessionToReserve)
        .finally(function () { sessionToReserve.startSettled = true; })
      : Promise.resolve(true);
    _lastTrackingPayload = null;

    // ── Khởi động đồng hồ realtime trên toolbar ──
    startPracticeTimer();

    // Reset iframe loading state
    iframeLoading.classList.remove('hidden');
    deviceIframe.src = 'about:blank';

    // Thiết lập trạng thái ban đầu cho nút Nộp bài và nút Lỗi sai
    const noConfigInit = isNoConfigDevice();
    if (btnSubmitLab) {
      if (currentMode === 'practice' || noConfigInit) {
        btnSubmitLab.disabled = false;
        btnSubmitLab.style.opacity = '1';
        btnSubmitLab.style.cursor = 'pointer';
        btnSubmitLab.style.animation = 'submitBtnPulse 2.5s infinite';
      } else {
        btnSubmitLab.disabled = true;
        btnSubmitLab.style.opacity = '0.5';
        btnSubmitLab.style.cursor = 'not-allowed';
        btnSubmitLab.style.animation = 'none';
      }
    }
    const btnGuideErrorsInit = document.getElementById('btn-guide-errors');
    if (btnGuideErrorsInit) {
      btnGuideErrorsInit.style.display = 'none';
    }
    window._hasClickedSaveInGuide = false;
    window._hasSuccHintStored = false;
    const resetPromise = resetDeviceSession(currentDeviceId);

    // Switch to practice screen
    showPractice();

    // Auto collapse sidebar on mobile
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
    }

    // Load URL into iframe
    Promise.resolve(resetPromise).finally(() => {
      setTimeout(() => {
        // Force reload even if only hash changes, after the current user's
        // simulator state has been reset.
        const urlObj = new URL(url, window.location.origin);
        urlObj.searchParams.set('_t', Date.now());
        deviceIframe.src = urlObj.toString();
      }, 80);
    });
  }

  // ── View Switchers ───────────────────────────────────────────────
  function showHero() {
    heroScreen.style.display = 'flex';
    lessonScreen.classList.remove('visible');
    practiceScreen.classList.remove('visible');
  }

  function showLesson() {
    heroScreen.style.display = 'none';
    practiceScreen.classList.remove('visible');
    lessonScreen.classList.remove('visible');
    void lessonScreen.offsetWidth;
    lessonScreen.classList.add('visible');
    lessonScreen.scrollTop = 0;
  }

  function showPractice() {
    heroScreen.style.display = 'none';
    lessonScreen.classList.remove('visible');
    practiceScreen.classList.remove('visible');
    void practiceScreen.offsetWidth;
    practiceScreen.classList.add('visible');
  }

  function resetDeviceSession(deviceId) {
    const targetDev = deviceId || currentDeviceId;
    window._hasSuccHintStored = false;
    window._hasClickedSaveInGuide = false;
    window._ftcMkChanTooltip = false;
    window._FTC_MK_BAI1 = null;
    window._sessionRuleCache = {};
    window._sessionRuleCacheScope = null;
    window._ftc2gSaved = false;

    if (typeof window.vg2927Bai6Reset === 'function') {
      try { window.vg2927Bai6Reset(); } catch (error) { }
    }
    window._FTC_VG2927_BAI6 = null;
    window._FTC_VG2927_BAI6_LASTPAGE = null;
    window._FTC_VG2927_BAI6_SCOPE = null;
    window._ftcHasClickedAdd = false;
    window._ftcLastAddFrom = null;
    window._ftcLastAddTo = null;
    window._ftcLastAddMode = null;
    window._ftcLastAddTx = null;
    window._ftcLastAddTxUnit = null;
    window._ftcLastAddRx = null;
    window._ftcLastAddRxUnit = null;
    window._ftcLastAddIp = null;
    window._ftcLastAddMac = null;

    if (!targetDev) return Promise.resolve();

    let simFolder = '';
    let devResetUrl = null;
    if (typeof DEVICES !== 'undefined' && Array.isArray(DEVICES)) {
      const dev = DEVICES.find(d => normalizeDeviceId(d.id) === normalizeDeviceId(targetDev));
      if (dev && dev.folder) simFolder = dev.folder;
      if (dev && dev.resetSessionUrl) devResetUrl = dev.resetSessionUrl;
    }
    if (!simFolder) {
      simFolder = 'sim_' + targetDev;
    }

    try {
      localStorage.removeItem('ftc_sim_wifi24');
      localStorage.removeItem('ftc_sim_wifi5g');
      localStorage.removeItem('BE12000_state');
      localStorage.removeItem('labStartTime');
      localStorage.removeItem('labStartSession');
      sessionStorage.removeItem('BE12000_session');
      sessionStorage.removeItem('BE12000_loginToken');
      sessionStorage.removeItem('sid');
      sessionStorage.removeItem('be6500c_sid');
      sessionStorage.removeItem('tech_support_sid');
      sessionStorage.removeItem('vg_session');
      sessionStorage.removeItem('vg2927_sid');
      sessionStorage.removeItem('ftc_ac1000f_wan_PPPUsername');
      sessionStorage.removeItem('ftc_ac1000f_wan_PPPPassword');
    } catch (e) { }

    const normDev = normalizeDeviceId(targetDev);
    const resetEndpoints = new Set(['/' + simFolder + '/api/reset']);
    if (normDev === 'ont_be6500c') {
      resetEndpoints.add('/sim_ONT_be6500c/api/reset');
      resetEndpoints.add('/ont_be6500c/api/reset');
    } else if (normDev === 'be6500c') {
      resetEndpoints.add('/sim_be6500c/api/reset');
      resetEndpoints.add('/sim_ONT_be6500c/api/reset');
    } else if (normDev === 'be12000') {
      resetEndpoints.add('/sim_be12000/api/reset');
    } else if (normDev === 'be15000') {
      resetEndpoints.add('/sim_be15000/api/reset');
    } else if (normDev === 'vigor2927') {
      resetEndpoints.add('/sim_vigor2927/api/reset');
    } else if (normDev === 'mikrotik_hexs') {
      resetEndpoints.add('/sim_mikrotik_hexs/api/reset');
      resetEndpoints.add('/sim_mikrotik_hexs/ftc_dat_lai');
    }
    if (devResetUrl) {
      resetEndpoints.add(devResetUrl);
    }

    const resetPromises = Array.from(resetEndpoints).map(function (endpoint) {
      const resetUrl = endpoint + '?_t=' + Date.now();
      try {
        return fetch(resetUrl, {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'X-FTC-Simulator-Reset': 'current-session' }
        }).then(function (response) {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return true;
        }).catch(function () {
          return fetch(resetUrl, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
          }).then(function (response) { return response.ok; }).catch(function () { return false; });
        });
      } catch (error) {
        console.warn(`[Simulator] Không thể gửi yêu cầu đặt lại phiên ${endpoint}:`, error);
        return Promise.resolve(false);
      }
    });

    return Promise.allSettled(resetPromises).then(function () { return true; });
  }

  function confirmLeavePracticeSession() {
    if (practiceScreen && practiceScreen.classList.contains('visible') &&
        currentMode === 'practice' &&
        _trackingSession && !_trackingSession.finalized) {
      return confirm('Bài thực hành chưa được nộp!\nNếu bạn rời đi bây giờ, phiên thực hành sẽ được tính là bỏ dở (chưa đạt).\n\nBạn có chắc chắn muốn rời khỏi bài thực hành không?');
    }
    return true;
  }

  function backToLesson() {
    if (trackingSaveInFlight) return;
    resetDeviceSession(currentDeviceId);
    // Reset đồng hồ và session tracking
    const sessionToClose = _trackingSession;
    const elapsedSec = stopPracticeTimer();
    if (sessionToClose && sessionToClose.mode === 'Thực hành' && !sessionToClose.finalized) {
      finalizeAbandonedTrackingSession(sessionToClose, elapsedSec);
    }
    resetPracticeTimer();
    _trackingSession = null;
    _lastTrackingPayload = null;
    _lastEvalResult = null;
    _lastSubmitDurationSec = 0;
    window._hasClickedSaveInGuide = false;
    window._hasSuccHintStored = false;
    window._ftcAc1000cv2FinalApplyClicked = false;
    window._sessionRuleCache = null;
    window._sessionRuleCacheScope = null;

    deviceIframe.src = '';
    currentIframeUrl = '';
    clearGuidePopups();
    showLesson();
  }

  // ── Clear Fields On Load ──────────────────────────────────────────
  /**
   * Xóa trắng các input field được khai báo trong lesson.clearFields[].
   * Chạy sau mỗi lần iframe load hoặc định kỳ để học viên phải tự nhập giá trị.
   */
  function clearLessonFields() {
    const activeDevId = typeof currentDeviceId !== 'undefined' ? currentDeviceId : (window.currentDeviceId || '');
    const activeLesId = typeof currentLessonId !== 'undefined' ? currentLessonId : (window.currentLessonId || '');
    const isAc1000cV2MultiStep = (activeDevId === 'ac1000cv2' || activeDevId === 'sim_ac1000cv2') && (
      activeLesId === 'ac1000cv2-bai2' || activeLesId === 'LAB_AC1000CV2_02' ||
      activeLesId === 'ac1000cv2-bai3' || activeLesId === 'LAB_AC1000CV2_03'
    );
    if (window._hasClickedSaveInGuide && activeLesId !== 'LAB_AX3000S_02' && !isAc1000cV2MultiStep) return;
    if (!_currentLesson) return;

    // Nếu lesson có hàm customClear riêng thì chạy hàm đó
    if (typeof _currentLesson.customClear === 'function') {
      try { _currentLesson.customClear(); } catch (e) { console.error(e); }
    }

    try {
      const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
      const isAnyDocSaved = allDocs.some(d => {
        try {
          return Boolean(
            d._ftcIsSaved === true ||
            (d.location && d.location.search && d.location.search.includes('save_success=1')) ||
            (d._ftcLastSaveInteraction && (d._ftcIsSaved === true || (d.location && d.location.search && d.location.search.includes('save_success=1')))) ||
            (currentLessonId === 'LAB_AX3000S_02' && (d._ftc2gSaved === true || window._ftc2gSaved === true))
          );
        } catch (e) { return false; }
      });
      if ((isAnyDocSaved || (currentLessonId === 'LAB_AX3000S_02' && window._ftc2gSaved === true)) && !isAc1000cV2MultiStep) {
        window._hasClickedSaveInGuide = true;
        allDocs.forEach(d => {
          if (d.location && d.location.search && d.location.search.includes('save_success=1')) {
            d._ftcIsSaved = true;
          }
        });
        return;
      }
    } catch (e) { }

    if (!Array.isArray(_currentLesson.clearFields) || _currentLesson.clearFields.length === 0) return;
    try {
      const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
      allDocs.forEach(doc => {
        if (
          (currentLessonId === 'LAB_AX3000S_02' && (doc._ftc2gSaved || window._ftc2gSaved)) ||
          doc._ftcIsSaved === true ||
          (doc.location && doc.location.search && doc.location.search.includes('save_success=1')) ||
          (doc._ftcLastSaveInteraction && (doc._ftcIsSaved || (doc.location && doc.location.search && doc.location.search.includes('save_success=1'))))
        ) {
          return;
        }
        _currentLesson.clearFields.forEach(selector => {
          try {
            doc.querySelectorAll(selector).forEach(el => {
              if (el.dataset.ftcCleared || el._ftcUserModified) return;
              if (el === doc.activeElement) {
                el.dataset.ftcCleared = 'true';
                return;
              }

              // Bỏ qua việc xóa trường SSID/Mật khẩu trên trang 5G để KTV có thể nhìn thấy dữ liệu phản chiếu từ 2.4G
              const is5GPage = (doc.defaultView && doc.defaultView.location.hash.includes('wlanBasicSetting5g')) ||
                Boolean(doc.querySelector && (doc.querySelector('[id="11n_BandWidth5G"]') || doc.getElementById('11n_BandWidth5G') || (function(){ try { return doc.querySelector('#11n_BandWidth5G'); } catch(e){ return null; } })())) ||
                Boolean(doc.querySelector && doc.querySelector('.skpage-title') && doc.querySelector('.skpage-title').textContent.includes('5G'));
              if (is5GPage && (selector.includes('Txt_SSID') || selector.includes('Pwd_WpaPsk'))) {
                return;
              }

              if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                if (el.type === 'radio' || el.type === 'checkbox') {
                  el.checked = false;
                } else if (el.tagName === 'SELECT') {
                  el.selectedIndex = 0;
                } else {
                  el.value = '';
                }
              } else if (el.classList.contains('item')) {
                el.remove();
              }
              el.dataset.ftcCleared = 'true';
            });
          } catch (e) { }
        });
      });
    } catch (e) { }
  }


  // ── Grading & Evaluation Engine ──────────────────────────────────
  window.ftcLayCheDo = function () { return currentMode; };

  function evaluateLesson(device, lesson) {
    if (!lesson) return null;
    const evaluatedLessonId = lesson.id || '';

    const activeLessonId = (lesson && lesson.id) || (typeof currentLessonId !== 'undefined' ? currentLessonId : '');
    const activeDeviceId = (device && device.id) ? device.id : (typeof currentDeviceId !== 'undefined' ? currentDeviceId : '');

    function getLabelForElement(el, doc) {
    if (el.labels && el.labels.length > 0) return el.labels[0].textContent.trim().replace(/:$/, '');
    if (el.id) {
      const label = doc.querySelector(`label[for="${el.id}"]`);
      if (label) return label.textContent.trim().replace(/:$/, '');
    }
    const tr = el.closest ? el.closest('tr') : null;
    if (tr) {
      const th = tr.querySelector('th, td.head, td.label, .dt');
      if (th && th !== el.parentElement) return th.textContent.trim().replace(/:$/, '');
      const firstTd = tr.querySelector('td');
      if (firstTd && firstTd !== el.closest('td')) return firstTd.textContent.trim().replace(/:$/, '');
    }
    const dl = el.closest ? el.closest('dl') : null;
    if (dl) {
      const dt = dl.querySelector('dt, .dt');
      if (dt) return dt.textContent.trim().replace(/:$/, '');
    }
    let parent = el.parentElement;
    let depth = 0;
    while (parent && parent !== doc.body && depth < 4) {
      const prev = parent.previousElementSibling;
      if (prev && (prev.tagName === 'LABEL' || prev.className.includes('label') || prev.className.includes('title') || prev.className.includes('dt'))) {
        return prev.textContent.trim().replace(/:$/, '');
      }
      const labelEl = parent.querySelector('label, .label, .dt, .title, .head');
      if (labelEl && labelEl !== el && !labelEl.contains(el)) {
        return labelEl.textContent.trim().replace(/:$/, '');
      }
      parent = parent.parentElement;
      depth++;
    }
    let fallback = el.id || el.name || el.placeholder;
    if (fallback) return fallback.replace(/_/g, ' ');
    return 'Trường ẩn/Không xác định';
  }

  function evaluateAutoBaseline(allDocs, rules, lesson) {
    let unexpectedErrors = [];

    allDocs.forEach(doc => {
      if (doc._ftcOriginalValues) {
        Object.keys(doc._ftcOriginalValues).forEach(uid => {
          const originalValue = doc._ftcOriginalValues[uid];
          const el = doc.querySelector(`[data-ftc-id="${uid}"]`);
          if (el) {
            // Bỏ qua các trường thuộc trang hoặc form đăng nhập router
            const isLoginField = (el.closest && el.closest('.login, .login-fpt, .login-form, .login-box, form[action*="login"], #login, [class*="login"]')) ||
              el.id === 'username' || el.id === 'password' ||
              (el.name && (el.name.toLowerCase() === 'username' || el.name.toLowerCase() === 'password')) ||
              (el.placeholder && (el.placeholder.toLowerCase().includes('username') || el.placeholder.toLowerCase().includes('password'))) ||
              (el.value === 'admin' && (originalValue === '' || originalValue === null || originalValue === undefined));
            if (isLoginField) return;

            // Bỏ qua các trường được cho phép hoặc nằm trong guidePopups (hướng dẫn từng bước của bài học)
            const effectiveLesson = lesson || (typeof _currentLesson !== 'undefined' ? _currentLesson : null);
            const guideList = (effectiveLesson && Array.isArray(effectiveLesson.guidePopups)) ? effectiveLesson.guidePopups : [];
            const allowedSelectors = [
              ...(effectiveLesson && Array.isArray(effectiveLesson.allowedSelectors) ? effectiveLesson.allowedSelectors : []),
              ...(effectiveLesson && effectiveLesson.grading && Array.isArray(effectiveLesson.grading.allowedSelectors) ? effectiveLesson.grading.allowedSelectors : []),
              ...guideList.map(g => g.selector).filter(Boolean)
            ];
            const isAllowedByLesson = allowedSelectors.some(sel => {
              try {
                const matchedList = Array.from(doc.querySelectorAll(sel));
                if (matchedList.includes(el)) return true;
                // Tự động cho phép input đi kèm với component dropdown/select (ví dụ MUI Select)
                return matchedList.some(m => {
                  if (m.contains && m.contains(el)) return true;
                  if (el.name && m.id && m.id.includes(el.name)) return true;
                  if (el.name && m.getAttribute && m.getAttribute('aria-labelledby') && m.getAttribute('aria-labelledby').includes(el.name)) return true;
                  const mParent = m.closest ? m.closest('.MuiFormControl-root, .form-group, tr, td') : null;
                  return mParent && mParent.contains(el);
                });
              } catch (e) { return false; }
            });
            if (isAllowedByLesson) return;

            // Bỏ qua radio/select điều khiển bật/tắt chế độ phụ trợ như DNS Relay, DHCP, Wi-Fi IoT / WiFi5 enable, SSID broadcast
            const isAuxToggle = (el.name && (
              el.name.toLowerCase() === 'dnstyperadio' ||
              el.name.toLowerCase() === 'dhcptyperadio' ||
              el.name.toLowerCase().includes('enable_wifi') ||
              el.name.toLowerCase().includes('wifi5') ||
              el.name.toLowerCase().includes('essid_hide')
            )) ||
            (el.id && (
              el.id.toLowerCase().includes('dnsrelay') ||
              el.id.toLowerCase().includes('dhcp') ||
              el.id.toLowerCase().includes('wifi5_enable') ||
              el.id.toLowerCase().includes('enable_wifi')
            ));
            if (isAuxToggle) return;

            // Kiểm tra xem input này có thuộc về các bước yêu cầu (rules) không?
            const isExpected = (rules || []).some(r => {
              try {
                const matchedList = Array.from(doc.querySelectorAll(r.selector));
                if (matchedList.includes(el)) return true;
                return matchedList.some(m => {
                  if (m.contains && m.contains(el)) return true;
                  if (el.name && m.id && m.id.includes(el.name)) return true;
                  if (el.name && m.getAttribute && m.getAttribute('aria-labelledby') && m.getAttribute('aria-labelledby').includes(el.name)) return true;
                  const mParent = m.closest ? m.closest('.MuiFormControl-root, .form-group, tr, td') : null;
                  return mParent && mParent.contains(el);
                });
              } catch (e) { return false; }
            });

            // Nếu KHÔNG nằm trong rule, nhưng lại bị sửa giá trị khác gốc
            if (!isExpected) {
              const currentValue = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
              if (String(currentValue) !== String(originalValue)) {
                // Bỏ qua đánh giá radio bị tắt để tránh 1 lần click sinh 2 lỗi trùng lặp
                if (el.type === 'radio' && !el.checked) return;

                let labelText = getLabelForElement(el, doc);
                let formattedOriginal = '';
                let formattedCurrent = '';

                if (el.type === 'checkbox' || el.type === 'radio') {
                  formattedOriginal = (originalValue === true || String(originalValue) === 'true') ? 'Bật/Enable' : 'Tắt/Disable';
                  formattedCurrent = currentValue ? 'Bật/Enable' : 'Tắt/Disable';
                } else if (el.tagName === 'SELECT') {
                  try {
                    let optOrig = el.querySelector(`option[value="${originalValue}"]`);
                    let optCurr = el.querySelector(`option[value="${currentValue}"]`);
                    formattedOriginal = optOrig ? optOrig.textContent.trim() : originalValue;
                    formattedCurrent = optCurr ? optCurr.textContent.trim() : currentValue;
                  } catch (e) {
                    formattedOriginal = originalValue;
                    formattedCurrent = currentValue;
                  }
                } else {
                  formattedOriginal = originalValue || 'Trống';
                  formattedCurrent = currentValue || 'Trống';
                }

                unexpectedErrors.push({
                  label: labelText,
                  expected: formattedOriginal,
                  actual: formattedCurrent
                });
              }
            }
          }
        });
      }
    });

    // Đồng bộ lỗi thao tác thừa theo phiên nếu có (giữ nguyên lỗi nếu học viên chuyển sang trang khác)
    if (_trackingSession) {
      if (unexpectedErrors.length > 0) {
        _trackingSession.cachedUnexpectedErrors = unexpectedErrors;
      } else {
        const hasFormFields = allDocs.some(d => {
          try {
            return (rules || []).some(r => d.querySelector(r.selector) !== null);
          } catch(e) { return false; }
        });
        if (hasFormFields) {
          _trackingSession.cachedUnexpectedErrors = [];
        }
      }
    }
    if (unexpectedErrors.length === 0 && _trackingSession && Array.isArray(_trackingSession.cachedUnexpectedErrors) && _trackingSession.cachedUnexpectedErrors.length > 0) {
      unexpectedErrors = _trackingSession.cachedUnexpectedErrors;
    }

    // Lọc triệt để loại bỏ các trường đăng nhập admin/admin, dnsTypeRadio, dhcpTypeRadio, wifi5/IoT toggle khỏi danh sách lỗi thao tác thừa
    unexpectedErrors = unexpectedErrors.filter(err => {
      const lbl = (err.label || '').toLowerCase();
      const act = (err.actual || '').toLowerCase();
      if ((lbl.includes('username') || lbl.includes('password') || lbl.includes('tài khoản') || lbl.includes('mật khẩu')) && (act === 'admin' || act === '')) {
        return false;
      }
      if (lbl.includes('dns relay') || lbl.includes('dnstyperadio') || lbl.includes('chế độ dns') || lbl.includes('dns mode')) {
        return false;
      }
      if (lbl.includes('dns') && (act === 'manual' || act === 'auto' || act === 'bật/enable' || act === 'tắt/disable')) {
        return false;
      }
      if (lbl === 'dhcp' || lbl === 'dhcp server' || lbl.includes('dhcptyperadio')) {
        return false;
      }
      if (lbl.includes('2.4g wifi') || lbl.includes('5g wifi') || lbl.includes('wifi5') || lbl.includes('wifi 5') || lbl.includes('enable_wifi') || lbl.includes('ssid broadcast')) {
        return false;
      }
      return true;
    });

    return unexpectedErrors;
  }

  if (lesson.grading && typeof lesson.grading.customGrading === 'function') {
      const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
      const customResult = lesson.grading.customGrading(allDocs);
      if (customResult && Array.isArray(customResult.details)) {
        const effectiveRules = (lesson.grading && Array.isArray(lesson.grading.rules)) ? lesson.grading.rules : [];
        // Chỉ áp dụng bộ lọc "thao tác ngoài phạm vi" khi bài có khai báo grading.rules.
        // Bài dùng customGrading mà không có rules (AC1000F/AC1000HI bài 2-6) sẽ coi mọi
        // ô học viên nhập là ngoài phạm vi và bị ép passed = false.
        const unexpErrors = effectiveRules.length > 0
          ? evaluateAutoBaseline(allDocs, effectiveRules, lesson)
          : [];
        if (unexpErrors && unexpErrors.length > 0) {
          unexpErrors.forEach(err => {
            const alreadyHas = customResult.details.some(d => d.name && (d.name.includes(err.label) || d.name === err.label));
            if (!alreadyHas) {
              customResult.details.push({
                id: 'err_unexp_' + (err.label || '').replace(/\s+/g, '_').toLowerCase(),
                name: 'Thao tác ngoài phạm vi: ' + (err.label || 'Trường không xác định'),
                expected: err.expected || 'Giữ nguyên',
                actual: err.actual || 'Đã bị sửa',
                passed: false,
                message: 'Cố tình thay đổi thông số "' + (err.label || '') + '" ngoài yêu cầu bài học'
              });
              customResult.passed = false;
              customResult.totalRules = (customResult.totalRules || customResult.details.length) + 1;
              customResult.score = Math.max(0, Math.round(((customResult.passedCount || 0) / customResult.totalRules) * 100));
            }
          });
        }
      }
      return customResult;
    }

    let rules = (lesson.grading && lesson.grading.rules && lesson.grading.rules.length > 0)
      ? lesson.grading.rules
      : [];

    // Loại bỏ hoàn toàn ràng buộc "Chế độ DNS" / "DNS Mode" / "manual" nếu còn sót lại ở bài 4 ONT BE6500C / BE6500C
    if (lesson.id === 'ONT_be6500c-bai4' || lesson.id === 'be6500c-bai4' ||
        ((activeDeviceId === 'ONT_be6500c' || activeDeviceId === 'be6500c') && lesson.id && lesson.id.includes('bai4'))) {
      rules = rules.filter(r => {
        const n = (r.name || '').toLowerCase();
        const id = (r.id || '').toLowerCase();
        const exp = (r.expected || '').toString().toLowerCase();
        return !n.includes('chế độ dns') && !n.includes('dns mode') && id !== 'dns_mode' && exp !== 'manual';
      });
    }

    // Tự động đọc đáp án từ tooltips nếu chưa định nghĩa rules riêng
    if (rules.length === 0) {
      const deviceTooltipsVar = `TOOLTIPS_${device.id.toUpperCase()}`;
      if (window[deviceTooltipsVar] && window[deviceTooltipsVar][lesson.id]) {
        const tooltips = window[deviceTooltipsVar][lesson.id];
        tooltips.forEach(step => {
          if (step.expected !== undefined) {
            rules.push({
              selector: step.selector,
              expected: step.expected,
              type: step.checkType || 'text_exact',
              label: step.text.split(':')[0] || 'Kiểm tra'
            });
          }
        });
      }
    }

    if (rules.length === 0) {
      if (isNoConfigDevice()) {
        return {
          passed: true,
          gradable: true,
          score: 100,
          passedCount: 1,
          totalRules: 1,
          details: [
            {
              id: 'default',
              name: 'Thao tác cấu hình',
              expected: 'Hoàn tất theo yêu cầu đề bài',
              actual: 'Đã hoàn thành',
              passed: true,
              message: 'Đã hoàn thành các bước yêu cầu'
            }
          ]
        };
      }
      return {
        gradable: false,
        passed: false,
        score: 0,
        passedCount: 0,
        totalRules: 0,
        details: []
      };
    }

    const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
    let passedCount = 0;
    const details = [];

    // Kiểm tra xem trên trang có banner "Your data have been stored!" hay không
    let hasStoredNotification = false;
    if (window._hasSuccHintStored) {
      hasStoredNotification = true;
    } else {
      for (const d of allDocs) {
        try {
          if (d._ftcHasSuccHint) { hasStoredNotification = true; break; }
          const hints = d.querySelectorAll('.succHint');
          for (const h of hints) {
            const isVis = (h.offsetWidth > 0 || h.offsetHeight > 0) && h.style.display !== 'none';
            if (isVis) {
              const txt = (h.textContent || '').toLowerCase();
              if (txt.includes('your data') || txt.includes('been stored')) {
                hasStoredNotification = true;
                d._ftcHasSuccHint = true;
                break;
              }
            }
          }
          if (hasStoredNotification) break;
        } catch (e) { }
      }
    }
    if (hasStoredNotification) {
      window._hasSuccHintStored = true;
      window._hasClickedSaveInGuide = true;
    }

    function gradingDisplayValue(rule, value) {
      if (rule.valueLabels && Object.prototype.hasOwnProperty.call(rule.valueLabels, value)) {
        return rule.valueLabels[value];
      }
      return value;
    }

    rules.forEach(rule => {
      let actualValue = '';
      let elementFound = false;
      let isSaved = hasStoredNotification;
      let isMatch = false;

      // Khai báo trước vòng lặp: nhánh "fallback về session cache" bên dưới đọc
      // effectiveDeviceId/currentLessonKey, nếu khai báo sau sẽ rơi vào TDZ.
      const effectiveDeviceId = (device && device.id) ? device.id : currentDeviceId;
      const currentLessonKey = `${effectiveDeviceId}:${evaluatedLessonId}`;

      const expectedVal = Array.isArray(rule.expected)
        ? rule.expected.join(' hoặc ')
        : ((rule.trim !== false) ? String(rule.expected).trim() : String(rule.expected));

      // Tìm element trong tất cả accessible frames (hỗ trợ cả các trang có nhiều instances/hàng cấu hình)
      for (const doc of allDocs) {
        try {
          let els = Array.from(doc.querySelectorAll(rule.selector));
          if (els.length > 0) {
            // Cho bài 2 AX3000S: Ràng buộc wifi_bw chỉ áp dụng cho băng tần 2.4G,
            // bỏ qua dropdown bandwidth của trang 5G để không bị xung đột với 80Mhz mặc định của 5G.
            if (evaluatedLessonId === 'LAB_AX3000S_02' && rule.id === 'wifi_bw') {
              els = els.filter(el => {
                let is5g = false;
                try {
                  if (el.closest && (el.closest('[id="11n_BandWidth5G"]') || (function(){ try { return el.closest('#11n_BandWidth5G'); } catch(e){ return null; } })())) {
                    is5g = true;
                  }
                } catch (e) { }
                try {
                  if (!is5g && el.querySelector && el.querySelector('option[value="80Mhz"]')) {
                    is5g = true;
                  }
                } catch (e) { }
                try {
                  if (!is5g) {
                    const isInside2g = Boolean(el.closest && (el.closest('[id="11n_BandWidth"]') || (function(){ try { return el.closest('#11n_BandWidth'); } catch(e){ return null; } })()));
                    if (!isInside2g) {
                      const has5gBlock = Boolean(doc.querySelector && (doc.querySelector('[id="11n_BandWidth5G"]') || doc.getElementById('11n_BandWidth5G') || (function(){ try { return doc.querySelector('#11n_BandWidth5G'); } catch(e){ return null; } })()));
                      const has5gTitle = Boolean(doc.querySelector && doc.querySelector('.skpage-title') && doc.querySelector('.skpage-title').textContent.includes('5G'));
                      if (has5gBlock || has5gTitle) is5g = true;
                    }
                  }
                } catch (e) { }
                return !is5g;
              });
              if (els.length === 0) continue;
            }

            elementFound = true;
            const isDocSaved = doc._ftcIsSaved || (doc.location && doc.location.search && doc.location.search.includes('save_success=1') && doc._ftcIsSaved !== false);
            const isSessionSaved = (window._hasClickedSaveInGuide === true && doc._ftcIsSaved !== false);
            const isAx3000s2gSaved = evaluatedLessonId === 'LAB_AX3000S_02' && Boolean(doc._ftc2gSaved || window._ftc2gSaved);
            if (isDocSaved || isSessionSaved || isAx3000s2gSaved) isSaved = true;

            // Tìm xem có phần tử nào khớp với expectedVal không
            let chosenEl = els[0];
            for (const candEl of els) {
              let candVal = '';
              if (candEl.type === 'checkbox' || candEl.type === 'radio') {
                candVal = candEl.checked ? (candEl.value || 'true') : 'false';
              } else {
                let rawVal = candEl.value !== undefined ? candEl.value : (candEl.textContent || '');
                // Xử lý đặc biệt cho các ô password bị router (như ZTE BE12000) mask thành chuỗi toàn khoảng trắng/tabs "\t\t\t\t\t\t"
                if (candEl.type === 'password' || (candEl.classList && candEl.classList.contains('SpecialPassword')) || (candEl.id && candEl.id.toLowerCase().includes('password'))) {
                  const isMaskedOnly = (typeof rawVal === 'string') && (rawVal.replace(/[\t\s]/g, '') === '');
                  if (isMaskedOnly) {
                    if (candEl._ftcRealValue) {
                      rawVal = candEl._ftcRealValue;
                    } else if (candEl.dataset && candEl.dataset.ftcRealValue) {
                      rawVal = candEl.dataset.ftcRealValue;
                    } else if (candEl.getAttribute && candEl.getAttribute('data-ftc-real-value')) {
                      rawVal = candEl.getAttribute('data-ftc-real-value');
                    }
                  }
                }
                candVal = (rule.trim !== false) ? String(rawVal).trim() : String(rawVal);
              }
              const compVal = (rule.trim !== false) ? String(candVal).trim() : String(candVal);

              let candidateMatch = false;
              if (rule.type === 'text_exact') {
                candidateMatch = compVal === expectedVal;
              } else if (rule.type === 'case_insensitive') {
                candidateMatch = compVal.toLowerCase() === expectedVal.toLowerCase();
              } else if (rule.type === 'contains') {
                candidateMatch = compVal.includes(expectedVal);
              } else if (rule.type === 'any_of') {
                const choices = Array.isArray(rule.expected)
                  ? rule.expected.map(v => String(v).trim())
                  : String(rule.expected).split(',').map(v => v.trim());
                candidateMatch = choices.some(v => compVal === v);
              } else if (rule.type === 'element_exists') {
                candidateMatch = true;
              } else {
                candidateMatch = compVal === expectedVal;
              }

              if (candidateMatch) {
                chosenEl = candEl;
                actualValue = compVal;
                isMatch = true;
                break;
              }
            }

            if (!isMatch) {
              // Nếu chưa khớp, ưu tiên lấy radio/checkbox đang được chọn (checked), hoặc phần tử đã được nhập liệu (khác rỗng), hoặc phần tử cuối
              const activeRadio = els.find(e => (e.type === 'checkbox' || e.type === 'radio') && e.checked);
              const nonEmptyEl = activeRadio || els.find(e => {
                let v = (e.value || '').trim();
                if (v === '' && (e._ftcRealValue || (e.dataset && e.dataset.ftcRealValue))) {
                  v = (e._ftcRealValue || e.dataset.ftcRealValue).trim();
                }
                return v !== '';
              }) || els[els.length - 1];
              if (nonEmptyEl) {
                chosenEl = nonEmptyEl;
                if (chosenEl.type === 'checkbox' || chosenEl.type === 'radio') {
                  actualValue = chosenEl.checked ? (chosenEl.value || 'true') : 'false';
                } else {
                  let rawVal = chosenEl.value !== undefined ? chosenEl.value : (chosenEl.textContent || '');
                  if (chosenEl.type === 'password' || (chosenEl.classList && chosenEl.classList.contains('SpecialPassword')) || (chosenEl.id && chosenEl.id.toLowerCase().includes('password'))) {
                    const isMaskedOnly = (typeof rawVal === 'string') && (rawVal.replace(/[\t\s]/g, '') === '');
                    if (isMaskedOnly) {
                      if (chosenEl._ftcRealValue) {
                        rawVal = chosenEl._ftcRealValue;
                      } else if (chosenEl.dataset && chosenEl.dataset.ftcRealValue) {
                        rawVal = chosenEl.dataset.ftcRealValue;
                      } else if (chosenEl.getAttribute && chosenEl.getAttribute('data-ftc-real-value')) {
                        rawVal = chosenEl.getAttribute('data-ftc-real-value');
                      }
                    }
                  }
                  actualValue = (rule.trim !== false) ? String(rawVal).trim() : String(rawVal);
                }
              }
            }

            // Fallback: nếu giá trị đọc từ input rỗng nhưng trước đó đã lưu thành công vào session cache
            if (!isMatch && (!actualValue || actualValue === '')) {
              const isScopeValid = (window._sessionRuleCacheScope === currentLessonKey) || Boolean(
                window._sessionRuleCacheScope === `${effectiveDeviceId}_${activeLessonId}` ||
                ((effectiveDeviceId === 'ac1000cv2' || effectiveDeviceId === 'sim_ac1000cv2') && window._sessionRuleCacheScope && window._sessionRuleCacheScope.includes('ac1000cv2'))
              );
              const cached = isScopeValid && (
                (_trackingSession && _trackingSession.ruleCache && _trackingSession.ruleCache[rule.id]) ||
                (window._sessionRuleCache && window._sessionRuleCache[rule.id])
              );
              if (cached && cached.actualValue && cached.isMatch) {
                actualValue = cached.actualValue;
                isSaved = true;
                isMatch = true;
              }
            }
            break;
          }
        } catch (e) { }
      }

      // Nếu không tìm thấy element trong các frame hiện hành (do học viên đã chuyển trang khác như LAN, Wi-Fi...)
      // thì kiểm tra xem rule này đã từng được nhập và lưu thành công trong phiên làm việc hiện tại hay chưa (Session Cache)
      if (!elementFound) {
        const isScopeValid = (window._sessionRuleCacheScope === currentLessonKey);
        const cached = isScopeValid && (
          (_trackingSession && _trackingSession.ruleCache && _trackingSession.ruleCache[rule.id]) ||
          (window._sessionRuleCache && window._sessionRuleCache[rule.id])
        );
        if (cached) {
          elementFound = true;
          actualValue = cached.actualValue;
          isSaved = cached.isSaved;
          isMatch = cached.isMatch;
        } else if (evaluatedLessonId === 'LAB_AX3000S_02') {
          // Fallback cho AX3000S bài 2: nếu đã bấm lưu 2.4G và simulator lưu vào SIM.RADIOS[0]
          for (const d of allDocs) {
            try {
              const sim = (d.defaultView && d.defaultView.SIM) || (window.SIM);
              if (sim && sim.RADIOS && sim.RADIOS[0]) {
                const r = sim.RADIOS[0];
                if (rule.id === 'wifi_bw' && r.bandwidth) {
                  elementFound = true;
                  actualValue = r.bandwidth;
                  isMatch = (r.bandwidth === expectedVal);
                  isSaved = Boolean(window._ftc2gSaved || d._ftc2gSaved || d._ftcIsSaved);
                  break;
                } else if (rule.id === 'wifi_ssid' && r.ssid) {
                  elementFound = true;
                  actualValue = r.ssid;
                  isMatch = (r.ssid === expectedVal);
                  isSaved = Boolean(window._ftc2gSaved || d._ftc2gSaved || d._ftcIsSaved);
                  break;
                } else if (rule.id === 'wifi_key' && r.password) {
                  elementFound = true;
                  actualValue = r.password;
                  isMatch = (r.password === expectedVal);
                  isSaved = Boolean(window._ftc2gSaved || d._ftc2gSaved || d._ftcIsSaved);
                  break;
                }
              }
            } catch (e) { }
          }
        }
      }

      // Nếu thiết bị có thông báo "Your data have been stored!" (BE12000), ghi nhận trạng thái đã lưu
      if (hasStoredNotification) {
        isSaved = true;
      }

      if (isMatch) {
        // Bắt buộc trang chứa phần tử phải được bấm Save/Apply thành công
        if (isSaveRequiredDevice(effectiveDeviceId) && !isSaved) {
          isMatch = false;
        }
      }

      // Cập nhật hoặc đồng bộ bộ nhớ đệm phiên (Session Cache):
      // - Nếu phần tử tìm thấy và đã được lưu thành công: lưu vào cache để dùng khi học viên chuyển trang khác
      // - Nếu phần tử tìm thấy trên trang đang mở nhưng chưa được lưu (bị sửa đổi): xóa khỏi cache để tránh dùng lại giá trị cũ
      if (elementFound) {
        if (isSaved) {
          if (!window._sessionRuleCache || window._sessionRuleCacheScope !== currentLessonKey) {
            window._sessionRuleCache = {};
            window._sessionRuleCacheScope = currentLessonKey;
          }
          window._sessionRuleCache[rule.id] = {
            actualValue: actualValue,
            isSaved: isSaved,
            isMatch: isMatch
          };
          if (_trackingSession) {
            if (!_trackingSession.ruleCache) _trackingSession.ruleCache = {};
            _trackingSession.ruleCache[rule.id] = {
              actualValue: actualValue,
              isSaved: isSaved,
              isMatch: isMatch
            };
          }
        } else {
          const isActuallyInDom = allDocs.some(d => {
            try {
              if (evaluatedLessonId === 'LAB_AX3000S_02' && rule.id === 'wifi_bw') {
                const sel = d.querySelector(rule.selector);
                if (!sel) return false;
                let is5g = false;
                try {
                  if (sel.closest && (sel.closest('[id="11n_BandWidth5G"]') || (function(){ try { return sel.closest('#11n_BandWidth5G'); } catch(e){ return null; } })())) {
                    is5g = true;
                  }
                } catch (e) { }
                try {
                  if (!is5g && sel.querySelector && sel.querySelector('option[value="80Mhz"]')) {
                    is5g = true;
                  }
                } catch (e) { }
                try {
                  if (!is5g) {
                    const isInside2g = Boolean(sel.closest && (sel.closest('[id="11n_BandWidth"]') || (function(){ try { return sel.closest('#11n_BandWidth'); } catch(e){ return null; } })()));
                    if (!isInside2g) {
                      const has5gBlock = Boolean(d.querySelector && (d.querySelector('[id="11n_BandWidth5G"]') || d.getElementById('11n_BandWidth5G') || (function(){ try { return d.querySelector('#11n_BandWidth5G'); } catch(e){ return null; } })()));
                      if (has5gBlock) is5g = true;
                    }
                  }
                } catch (e) { }
                return !is5g;
              }
              return d.querySelector(rule.selector) !== null;
            } catch (e) { return false; }
          });
          if (isActuallyInDom) {
            const isAc1000Saved = (effectiveDeviceId === 'ac1000cv2' || effectiveDeviceId === 'sim_ac1000cv2') && window._hasClickedSaveInGuide;
            if (!isAc1000Saved) {
              if (window._sessionRuleCache && window._sessionRuleCacheScope === currentLessonKey) {
                delete window._sessionRuleCache[rule.id];
              }
              if (_trackingSession && _trackingSession.ruleCache) delete _trackingSession.ruleCache[rule.id];
            }
          }
        }
      }

      if (isMatch) {
        passedCount++;
      }

      let msg = '';
      if (isMatch) {
        msg = 'Chính xác';
      } else {
        if (isSaveRequiredDevice(effectiveDeviceId) && elementFound && !isSaved) {
          msg = 'Chưa bấm Save để lưu cấu hình';
        } else {
          msg = `Mong muốn: "${gradingDisplayValue(rule, expectedVal)}", Thực tế: "${gradingDisplayValue(rule, actualValue) || 'Trống'}"`;
        }
      }

      let displayExpected = rule.displayExpected || gradingDisplayValue(rule, expectedVal);
      let displayActual = gradingDisplayValue(rule, actualValue);
      if (rule.selector && rule.selector.includes('dhcpTypeRadio')) {
        if (actualValue === '1' || actualValue === 'true') displayActual = 'Bật/Enable';
        else if (actualValue === '0' || actualValue === 'false') displayActual = 'Tắt/Disable';
        else if (actualValue === '2') displayActual = 'Relay';
      }

      details.push({
        id: rule.id,
        name: rule.name,
        expected: displayExpected,
        actual: (isSaveRequiredDevice(effectiveDeviceId) && elementFound && !isSaved) ? `${displayActual} (Chưa lưu)` : (displayActual || '(Chưa nhập / Chưa tìm thấy)'),
        passed: isMatch,
        message: msg
      });
    });

    // === BỘ LỌC AUTO-BASELINE (TÌM THAO TÁC THỪA) ===
    let unexpectedErrors = evaluateAutoBaseline(allDocs, rules, lesson);

    // Cập nhật kết quả passed: Chỉ pass khi đủ rule VÀ không có thao tác thừa
    const criteria = rules;
    const hasUnexpected = unexpectedErrors.length > 0;
    const passed = (passedCount === criteria.length) && !hasUnexpected;

    let finalTotalRules = rules.length + unexpectedErrors.length;

    // Đẩy TẤT CẢ lỗi thao tác thừa vào danh sách details
    unexpectedErrors.forEach(err => {
      details.push({
        id: 'unexpected_change_' + Math.random(),
        name: err.label,
        expected: err.expected,
        actual: err.actual,
        passed: false,
        message: 'Thao tác thừa ngoài yêu cầu'
      });
    });
    // ===============================================

    return {
      passed: passed,
      passedCount: passedCount,
      totalRules: finalTotalRules,
      details: details
    };
  }

  function submitLab() {
    const device = DEVICES.find(d => d.id === currentDeviceId);
    const lesson = getCurrentLesson();
    if (!device || !lesson) return;

    // Dừng đồng hồ và lấy thời gian chính xác
    const durationSec = stopPracticeTimer();

    // Chấm điểm
    const evalResult = evaluateLesson(device, lesson);

    // Lưu kết quả tạm để nút modal dùng khi cần thiết
    _lastEvalResult = evalResult;
    _lastSubmitDurationSec = durationSec;

    if (!evalResult || evalResult.gradable === false) {
      setTrackingSaveStatus('warning', 'Bài thực hành chưa có đủ tiêu chí chấm nên kết quả không được ghi nhận.');
      showGradingModal(evalResult, device, lesson, currentMode, durationSec);
      return;
    }

    // =========================================================================
    // [GỬI TEAM DATA] LƯU Ý VỀ LUỒNG TRACKING API 
    // - Vị trí: Tracking được gọi ngay khi KTV ấn nút "Nộp Bài" (submitLab).
    // - Phân luồng: 
    //   + Chế độ Hướng dẫn (guide): CHỈ gửi log khi ĐẠT 100% (passed = true). 
    //     Các lần KTV nộp thử bị Rớt (FAIL) sẽ bị bỏ qua để tránh rác DB.
    //   + Chế độ Thực hành (practice): LUÔN gửi log (Cả PASS và FAIL) ngay lúc bấm.
    // =========================================================================
    setTrackingSaveStatus('', '');
    if (_guestGuideMode) {
      setTrackingSaveStatus('warning', 'Chế độ khách chỉ chấm tại trình duyệt; kết quả và tiến độ không được lưu.');
      showGradingModal(evalResult, device, lesson, currentMode, durationSec);
      return;
    }
    if (currentMode === 'practice' || (currentMode === 'guide' && evalResult.passed)) {
      const savePromise = sendTrackingTimer(evalResult, durationSec);
      Promise.resolve(savePromise).finally(function () {
        showGradingModal(evalResult, device, lesson, currentMode, durationSec);
      });
    } else {
      setTrackingSaveStatus('warning', 'Lần thử ở chế độ Hướng dẫn chưa đạt nên không được ghi vào tiến độ.');
      showGradingModal(evalResult, device, lesson, currentMode, durationSec);
    }
  }

  function showGradingModal(res, device, lesson, mode, durationSec) {
    if (!gradingModal) return;

    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (gmMetaDevice) gmMetaDevice.textContent = (device && device.name) ? device.name : 'Thiết bị';
    if (gmMetaLesson) gmMetaLesson.textContent = (lesson && lesson.title) ? lesson.title : 'Bài học';
    if (gmMetaMode) gmMetaMode.textContent = mode === 'guide' ? '💡 Hướng dẫn' : '⚡ Thực hành';
    if (gmMetaTime) gmMetaTime.textContent = timeStr;

    if (res.passed) {
      if (gmIcon) gmIcon.textContent = '🎉';
      if (gmTitle) gmTitle.textContent = 'KẾT QUẢ: ĐẠT YÊU CẦU';
      if (isNoConfigDevice()) {
        if (gmSubtitle) gmSubtitle.textContent = 'Đã ghi nhận khảo sát thiết bị ONT BE15000 thành công!';
        if (gmStatusBox) gmStatusBox.className = 'gm-status-box';
        if (gmStatusTitle) gmStatusTitle.textContent = '✔ ĐÃ HOÀN THÀNH XEM THIẾT BỊ';
        if (gmStatusDesc) gmStatusDesc.textContent = 'Đã lưu kết quả khảo sát thiết bị ONT BE15000 vào hệ thống dashboard.';
      } else {
        if (gmSubtitle) gmSubtitle.textContent = 'Chúc mừng bạn đã cấu hình chính xác bài thực hành!';
        if (gmStatusBox) gmStatusBox.className = 'gm-status-box';
        if (gmStatusTitle) gmStatusTitle.textContent = '✔ ĐẠT TOÀN BỘ TIÊU CHÍ (100%)';
        if (gmStatusDesc) gmStatusDesc.textContent = 'Cấu hình hoàn toàn trùng khớp với thông số kỹ thuật chuẩn của FPT Telecom.';
      }
      // ĐẠT: hiện nút "Hoàn tất", ẩn nút "Quay lại làm từ đầu"
      if (btnModalClose) btnModalClose.style.display = '';
      if (btnModalRetry) btnModalRetry.style.display = 'none';
    } else {
      if (gmIcon) gmIcon.textContent = '⚠️';
      if (gmTitle) gmTitle.textContent = 'KẾT QUẢ: CHƯA ĐẠT';
      if (gmSubtitle) gmSubtitle.textContent = 'Một số thông số cấu hình chưa đúng với yêu cầu đề bài.';
      if (gmStatusBox) gmStatusBox.className = 'gm-status-box failed';
      if (gmStatusTitle) gmStatusTitle.textContent = `✖ CHƯA ĐẠT (${res.passedCount}/${res.totalRules} tiêu chí đúng)`;

      if (mode === 'guide' || !_lastEvalResult) {
        if (gmStatusDesc) gmStatusDesc.textContent = 'Vui lòng kiểm tra lại các lỗi bên dưới, đóng bảng này và sửa lỗi.';
        if (btnModalRetry) {
          btnModalRetry.style.display = '';
          btnModalRetry.innerHTML = '<span>✖ Đóng & Sửa lỗi</span>';
        }
      } else {
        if (gmStatusDesc) gmStatusDesc.textContent = 'Vui lòng quay lại và thực hiện lại bài thực hành từ đầu.';
        if (btnModalRetry) {
          btnModalRetry.style.display = '';
          btnModalRetry.innerHTML = '<span>↩ Quay lại làm từ đầu</span>';
        }
      }
      if (btnModalClose) btnModalClose.style.display = 'none';
    }

    // Render danh sách checklist — chỉ hiện tiêu chí SAI, giữ header phân biệt phần
    if (gmChecklistBody) {
      gmChecklistBody.innerHTML = '';
      const checklistSection = gmChecklistBody.closest('table, .gm-checklist-wrap, section');

      // Lọc ra các tiêu chí thực sự (bỏ header) bị sai
      const failedRealItems = res.details.filter(item => !item._isHeader && !item.passed);

      if (failedRealItems.length === 0) {
        // Tất cả đúng: ẩn bảng
        if (checklistSection) checklistSection.style.display = 'none';
      } else {
        if (checklistSection) checklistSection.style.display = '';

        // Xác định section nào có lỗi (kể cả hint & item thực)
        const has24GFail = failedRealItems.some(i => i.id.startsWith('2.4G_') || i.id === '_24g_hint');
        const has5GFail = failedRealItems.some(i => i.id.startsWith('5G_') || i.id === '_5g_hint');

        res.details.forEach(item => {
          // Header row: chỉ vẽ nếu section đó có lỗi
          if (item._isHeader) {
            const shouldShow = (item.id === '_header_24g' && has24GFail) ||
              (item.id === '_header_5g' && has5GFail);
            if (!shouldShow) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td colspan="4" style="background:#1e293b;color:#94a3b8;font-weight:700;
                font-size:11px;letter-spacing:1px;padding:6px 10px;text-align:center;">
                ${escapeHTML(item.name)}
              </td>
            `;
            gmChecklistBody.appendChild(tr);
            return;
          }
          // Hint row (trang chưa mở): hiển thị dạng cảnh báo nổi bật
          if (item.id === '_24g_hint' || item.id === '_5g_hint') {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td colspan="4" style="background:#7c2d12;color:#fed7aa;font-size:12px;
                padding:6px 10px;font-style:italic;">
                ⚠ ${escapeHTML(item.expected)}
              </td>
            `;
            gmChecklistBody.appendChild(tr);
            return;
          }
          // Tiêu chí thường: chỉ vẽ nếu sai
          if (item.passed) return;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${escapeHTML(item.name)}</strong></td>
            <td><code class="gm-code-val">${escapeHTML(item.expected)}</code></td>
            <td><code class="gm-code-val" style="color:#b91c1c; font-weight:700;">${escapeHTML(item.actual)}</code></td>
            <td><span class="gm-badge-fail">✖ Sai</span></td>
          `;
          gmChecklistBody.appendChild(tr);
        });
      }
    }

    gradingModal.style.display = 'flex';
    gradingModal.setAttribute('aria-hidden', 'false');
    window.requestAnimationFrame(() => {
      const target = btnModalClose && btnModalClose.style.display !== 'none' ? btnModalClose : btnModalRetry;
      target?.focus();
    });
  }

  function hideGradingModal() {
    if (gradingModal) {
      gradingModal.style.display = 'none';
      gradingModal.setAttribute('aria-hidden', 'true');
    }
  }

  // ── Tracking API ─────────────────────────────────────────────────
  function reserveTrackingTimerStart(session) {
    if (!session || !_currentUser) return Promise.resolve(false);
    const labId = session.lesson && session.lesson.id
      ? session.lesson.id
      : (session.lesson && session.lesson.title ? session.lesson.title : '');
    return fetch('/api/index.php/tracking/timer/start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submission_id: session.submissionId,
        lab_id: labId,
        mode: session.mode,
        started_at: session.startedAt
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (err) {
            const message = err && err.error && err.error.message
              ? err.error.message
              : `Không khởi tạo được phiên (HTTP ${res.status}).`;
            throw new Error(message);
          });
        }
        return res.json();
      })
      .then(function (data) {
        const item = data && data.item ? data.item : {};
        session.attemptNo = item.practice_attempt_no == null ? null : Number(item.practice_attempt_no);
        session.serverSessionId = item.session_id || '';
        return true;
      })
      .catch(function (err) {
        console.warn('[Tracking] Chưa thể giữ số thứ tự phiên; máy chủ sẽ cấp số khi lưu kết quả:', err);
        return false;
      });
  }

  function finalizeAbandonedTrackingSession(session, durationSec) {
    if (!session || !_currentUser) return Promise.resolve(false);
    const labId = session.lesson && session.lesson.id
      ? session.lesson.id
      : (session.lesson && session.lesson.title ? session.lesson.title : '');
    const user = _currentUser;
    const finish = function () {
      return fetch('/api/index.php/tracking/timer', {
        method: 'POST',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: session.submissionId,
          technician_id: user.technician_id,
          name: user.name,
          email: user.email || undefined,
          lab_id: labId,
          mode: session.mode,
          started_at: session.startedAt,
          finished_at: new Date().toISOString(),
          duration_sec: durationSec || 0,
          status: 'abandoned'
        })
      })
        .then(function (response) {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          session.finalized = true;
          return true;
        })
        .catch(function (error) {
          console.warn('[Tracking] Không thể ghi nhận phiên đã dừng:', error);
          return false;
        });
    };
    return Promise.resolve(session.startPromise).then(finish);
  }

  /**
   * Gửi thông tin phiên thực hành lên server qua POST /api/index.php/tracking/timer.
   * Được gọi DUY NHẤT 1 LẦN khi KTV bấm nút trên modal kết quả.
   * @param {object|null} evalResult - Kết quả chấm điểm
   * @param {number} durationSec - Thời gian làm bài (giây), lấy từ đồng hồ đã dừng
   */
  function setTrackingSaveStatus(status, message, recoveryAction) {
    if (!gmSaveStatus) return;
    gmSaveStatus.hidden = !message;
    gmSaveStatus.className = `gm-save-status${status ? ` is-${status}` : ''}`;
    gmSaveStatus.replaceChildren();
    if (!message) return;

    const text = document.createElement('span');
    text.textContent = message;
    gmSaveStatus.appendChild(text);
    if (recoveryAction) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'gm-save-retry';
      retry.textContent = recoveryAction === 'login' ? 'Đăng nhập lại' : 'Thử lưu lại';
      retry.addEventListener('click', function () {
        if (recoveryAction === 'login') {
          redirectToLogin();
          return;
        }
        sendTrackingTimer(_lastEvalResult, _lastSubmitDurationSec, _lastTrackingPayload);
      });
      gmSaveStatus.appendChild(retry);
    }
  }

  function setTrackingActionsDisabled(disabled) {
    [btnModalRetry, btnModalClose].forEach(button => {
      if (button) button.disabled = disabled;
    });
  }

  function sendTrackingTimer(evalResult, durationSec, retryPayload = null, authenticationChecked = false) {
    if (_guestGuideMode) return Promise.resolve(false);
    if (!_trackingSession) return; // Chưa có phiên nào được bắt đầu
    const session = _trackingSession;
    if (session.startPromise && !session.startSettled) {
      return session.startPromise.then(function () {
        return sendTrackingTimer(evalResult, durationSec, retryPayload, authenticationChecked);
      });
    }
    if (trackingSaveInFlight) return;
    if (!authenticationChecked) {
      setTrackingSaveStatus('saving', 'Đang kiểm tra phiên đăng nhập trước khi lưu kết quả...');
      return requestCurrentUserSession()
        .then(function (user) {
          if (!user) {
            setTrackingSaveStatus('error', 'Phiên đăng nhập đã hết hạn. Kết quả chưa được lưu; vui lòng đăng nhập lại.', 'login');
            return false;
          }
          return sendTrackingTimer(evalResult, durationSec, retryPayload, true);
        })
        .catch(function (error) {
          console.warn('[Tracking] Không thể kiểm tra phiên đăng nhập:', error);
          setTrackingSaveStatus('error', 'Chưa thể kiểm tra phiên đăng nhập do lỗi kết nối.', 'retry');
          return false;
        });
    }
    if (!_currentUser) {
      setTrackingSaveStatus('error', 'Phiên đăng nhập đã hết hạn. Kết quả chưa được lưu; vui lòng đăng nhập lại.', 'login');
      return Promise.resolve(false);
    }
    trackingSaveInFlight = true;
    setTrackingActionsDisabled(true);
    setTrackingSaveStatus('saving', 'Đang lưu kết quả và cập nhật tiến độ...');

    const finishedAt = new Date();

    // Lấy tên thiết bị từ device object (ưu tiên device.name, fallback device.id)
    const deviceName = (session.device && session.device.name) ? session.device.name : (session.device && session.device.id ? session.device.id : 'Unknown');

    // Lấy lab_id chính xác từ lesson.id (khớp với data.js)
    const labId = session.lesson && session.lesson.id ? session.lesson.id : (session.lesson && session.lesson.title ? session.lesson.title : 'Unknown');

    // Thông tin KTV từ phiên đăng nhập; server đối chiếu lại danh tính này.
    const user = _currentUser;

    const payload = retryPayload ? { ...retryPayload } : {
      submission_id: session.submissionId,
      technician_id: user.technician_id,
      name: user.name,
      email: user.email || undefined,
      lab_id: labId,
      mode: session.mode,
      device: deviceName,
      started_at: session.startedAt,
      finished_at: finishedAt.toISOString(),
      duration_sec: durationSec || 0
    };

    if (!retryPayload && evalResult) {
      payload.status = evalResult.passed ? 'completed' : 'failed';
      payload.is_passed = evalResult.passed;
      payload.grading_details = evalResult.details;
    }

    // Loại bỏ các field undefined trước khi gửi
    Object.keys(payload).forEach(function (k) {
      if (payload[k] === undefined) delete payload[k];
    });
    if (!retryPayload) _lastTrackingPayload = payload;

    return fetch('/api/index.php/tracking/timer', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (err) {
            const message = err && err.error && err.error.message
              ? err.error.message
              : `Không lưu được kết quả (HTTP ${res.status}).`;
            const requestError = new Error(message);
            requestError.status = res.status;
            requestError.code = err && err.error ? err.error.code : '';
            throw requestError;
          });
        }
        return res.json().then(function (data) {
          console.info('[Tracking] Đã ghi phiên thực hành & chấm điểm:', data);
          const item = data && data.item ? data.item : {};
          session.finalized = true;
          const attemptNote = item.practice_attempt_no
            ? ` Lần thực hành ${item.practice_attempt_no}.`
            : '';
          if (item.normalized_saved === false) {
            setTrackingSaveStatus('success', `Đã lưu kết quả luyện tập.${attemptNote} Bài ngoài phạm vi giao không cộng vào tiến độ lớp.`);
          } else {
            setTrackingSaveStatus('success', item.duplicate
              ? `Kết quả này đã được lưu trước đó.${attemptNote}`
              : `Đã lưu kết quả và cập nhật tiến độ thành công.${attemptNote}`);
          }
        });
      })
      .catch(function (err) {
        console.warn('[Tracking] Không thể gửi dữ liệu tracking:', err);
        if (err.status === 401 || err.code === 'auth/unauthenticated') {
          applyCurrentUser(null);
          setTrackingSaveStatus('error', 'Phiên đăng nhập đã hết hạn. Kết quả chưa được lưu; vui lòng đăng nhập lại.', 'login');
        } else {
          setTrackingSaveStatus('error', `Chưa lưu được kết quả: ${err.message || 'lỗi kết nối.'}`, 'retry');
        }
      })
      .finally(function () {
        trackingSaveInFlight = false;
        setTrackingActionsDisabled(false);
      });
  }

  // ── Practice Timer (Đồng hồ realtime trên toolbar) ──────────────
  /**
   * Bắt đầu đồng hồ đếm thời gian, cập nhật mỗi giây lên #practice-timer.
   */
  function startPracticeTimer() {
    // Dọn interval cũ nếu có
    if (_practiceTimerInterval) clearInterval(_practiceTimerInterval);

    _practiceStartTime = new Date();
    _lastSubmitDurationSec = 0;
    _lastEvalResult = null;

    // Cập nhật text ngay lập tức
    if (practiceTimer) {
      practiceTimer.textContent = '⏱ 00:00';
      practiceTimer.classList.remove('stopped');
      practiceTimer.classList.add('running');
    }

    _practiceTimerInterval = setInterval(function () {
      if (!_practiceStartTime) return;
      const elapsed = Math.floor((new Date() - _practiceStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      if (practiceTimer) {
        practiceTimer.textContent = '⏱ ' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      }

      // Tự động ngắt phiên nếu quá 60 phút (3600 giây)
      if (elapsed >= 3600) {
        alert("Đã hết thời gian thao tác (60 phút). Phiên làm việc sẽ tự động kết thúc và kết quả bị hủy bỏ.");
        backToLesson();
      }
    }, 1000);
  }

  /**
   * Dừng đồng hồ và trả về số giây đã chạy.
   * @returns {number} Số giây từ lúc bắt đầu đến lúc dừng
   */
  function stopPracticeTimer() {
    if (_practiceTimerInterval) {
      clearInterval(_practiceTimerInterval);
      _practiceTimerInterval = null;
    }

    let durationSec = 0;
    if (_practiceStartTime) {
      durationSec = Math.max(0, Math.floor((new Date() - _practiceStartTime) / 1000));
    }

    // Đổi style đồng hồ sang trạng thái "đã dừng"
    if (practiceTimer) {
      practiceTimer.classList.remove('running');
      practiceTimer.classList.add('stopped');
    }

    return durationSec;
  }

  /**
   * Reset đồng hồ về 00:00 và dọn interval.
   */
  function resetPracticeTimer() {
    if (_practiceTimerInterval) {
      clearInterval(_practiceTimerInterval);
      _practiceTimerInterval = null;
    }
    _practiceStartTime = null;

    if (practiceTimer) {
      practiceTimer.textContent = '⏱ 00:00';
      practiceTimer.classList.remove('running', 'stopped');
    }
  }

  // ── Breadcrumb ───────────────────────────────────────────────────
  function setBreadcrumb(parts) {
    if (!parts || parts.length === 0) {
      breadcrumb.innerHTML = '';
      return;
    }

    if (parts.length === 1) {
      breadcrumb.innerHTML =
        `<span>Đang chọn: <b>${parts[0]}</b></span>` +
        `<span style="color:#9ea7ba"> (Vui lòng chọn chức năng bên trái)</span>`;
      return;
    }

    const items = parts.map((p, i) => {
      if (i === parts.length - 1) {
        return `<span class="bc-active">${p}</span>`;
      }
      return `<span>${p}</span>`;
    });
    breadcrumb.innerHTML = items.join('<span class="bc-sep">></span>');
  }

  // ── Sidebar Toggle ───────────────────────────────────────────────
  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
  }

  // ── Dashboard Button (admin only) ──────────────────────────────────
  const btnDashboard = document.getElementById('btn-dashboard');
  if (btnDashboard) {
    btnDashboard.addEventListener('click', function () {
      window.location.href = '/dashboard-authen/';
    });
  }

  // ── Step By Step Guide Popups Logic ──────────────────────────────
  function getLessonPopups(deviceId, lesson) {
    return getLessonPopupsForDoc(deviceId, lesson, null);
  }

  function getLessonPopupsForDoc(deviceId, lesson, doc) {
    if (!deviceId || !lesson) return [];

    const storeKey = 'TOOLTIPS_' + deviceId.toUpperCase();
    const store = window[storeKey];

    // Check xem iframe/doc hiện tại có đang ở màn hình Đăng Nhập (login.asp / #/login) không
    const href = (doc && doc.location && doc.location.href) ? doc.location.href.toLowerCase() : '';
    const hash = (doc && doc.location && doc.location.hash) ? doc.location.hash.toLowerCase() : '';
    const isMainConfigPage = hash.includes('#/home') || hash.includes('#/network') || hash.includes('#/system') || hash.includes('#/status') || hash.includes('#/device');

    const isLoginPage = !isMainConfigPage && (href.includes('login') || hash.includes('login') || (doc && doc.querySelector('.login-fpt, form[action*="login"]')));

    if (isLoginPage && store && store._common_login && store._common_login.length > 0) {
      return store._common_login;
    }

    // Nếu đã đăng nhập vào trang cấu hình bài học: lấy tooltip từ file bài tương ứng (ví dụ: bai1.js)
    if (store && store[lesson.id]) {
      return store[lesson.id];
    }

    // Fallback nếu dùng getStepByStepPopups hoặc lesson.guidePopups
    if (window.getStepByStepPopups) {
      const steps = window.getStepByStepPopups(deviceId, lesson.id);
      if (steps && steps.length > 0) return steps;
    }
    return lesson.guidePopups || [];
  }

  function broadcastToWindowTree(win, msg) {
    if (!win) return;
    try {
      win.postMessage(msg, '*');
    } catch (e) { }
    try {
      if (win.frames && win.frames.length > 0) {
        for (let i = 0; i < win.frames.length; i++) {
          broadcastToWindowTree(win.frames[i], msg);
        }
      }
    } catch (e) { }
  }

  function clearGuidePopups() {
    localStorage.setItem('ftc_guide_enabled', '0');
    localStorage.removeItem('ftc_guide_popups');

    // PostMessage clear to iframe and all subframes
    try {
      if (deviceIframe && deviceIframe.contentWindow) {
        broadcastToWindowTree(deviceIframe.contentWindow, { type: 'CLEAR_GUIDE_POPUPS' });
      }
    } catch (e) { }

    // Direct DOM cleanup if accessible
    try {
      const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
      allDocs.forEach(doc => {
        doc.querySelectorAll('.ftc-guide-bubble, .guide-tooltip-bubble, .guide-tooltip').forEach(el => el.remove());
        doc.querySelectorAll('.ftc-guide-target-highlight').forEach(el => {
          el.classList.remove('ftc-guide-target-highlight');
        });
      });
    } catch (e) { }
  }

  function getCurrentLesson() {
    if (!currentDeviceId || !currentLessonId) return null;
    const device = DEVICES.find(d => d.id === currentDeviceId);
    if (!device || !device.categories) return null;
    for (const cat of device.categories) {
      const found = cat.lessons.find(l => l.id === currentLessonId);
      if (found) return found;
    }
    return null;
  }

  function applyGuidePopups() {
    const dangChanTooltip = (currentDeviceId === 'mikrotik_hexs')
      ? window._ftcMkChanTooltip
      : false;
    if (currentMode !== 'guide' || dangChanTooltip) {
      clearGuidePopups();
      return;
    }

    const device = DEVICES.find(d => d.id === currentDeviceId);
    const lesson = getCurrentLesson();
    if (!lesson) return;

    // Trong chế độ Hướng dẫn, tooltip luôn luôn hiển thị theo đúng vị trí trỏ về

    // 1. Direct DOM injection cho từng document trong iframe (xử lý linh hoạt login vs bài học)
    try {
      const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
      allDocs.forEach(doc => {
        const popups = getLessonPopupsForDoc(currentDeviceId, lesson, doc);
        if (popups && popups.length > 0) {
          injectGuidePopupsIntoDoc(doc, popups);
        } else {
          doc.querySelectorAll('.ftc-guide-bubble').forEach(el => el.remove());
          doc.querySelectorAll('.ftc-guide-target-highlight').forEach(el => el.classList.remove('ftc-guide-target-highlight'));
        }
      });
    } catch (e) { }
  }

  function getAllAccessibleDocuments(rootWin) {
    const docs = [];
    function traverse(win) {
      try {
        if (!win || !win.document) return;

        // Nếu frame này bị ẩn khỏi giao diện (chỉ rộng/cao 0px và parent display none), bỏ qua nó
        if (win.frameElement) {
          try {
            const rect = win.frameElement.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0 && win.frameElement.offsetParent === null) {
              return;
            }
          } catch (e) { }
        }

        docs.push(win.document);
        if (win.frames && win.frames.length > 0) {
          for (let i = 0; i < win.frames.length; i++) {
            try {
              if (win.frames[i] && win.frames[i] !== win) {
                traverse(win.frames[i]);
              }
            } catch (e) { }
          }
        }
      } catch (e) { }
    }
    traverse(rootWin);
    return docs;
  }

  function injectGuidePopupsIntoDoc(doc, popups) {
    if (!doc || !doc.body) return;

    // Inject styles
    if (!doc.getElementById('ftc-guide-injected-style')) {
      const styleTag = doc.createElement('style');
      styleTag.id = 'ftc-guide-injected-style';
      styleTag.textContent = `
        .ftc-guide-bubble {
          position: absolute !important;
          z-index: 2147483647 !important;
          background: #ff0000 !important;
          color: #ffffff !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          padding: 4px 8px !important;
          border-radius: 3px !important;
          box-shadow: 0 2px 8px rgba(255, 0, 0, 0.35) !important;
          white-space: nowrap !important;
          pointer-events: none !important;
          user-select: none !important;
          animation: ftcGuidePopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .ftc-guide-bubble::before {
          content: '' !important;
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          border-style: solid !important;
        }
        .ftc-guide-bubble.pos-right::before {
          top: 50% !important;
          left: -8px !important;
          transform: translateY(-50%) !important;
          border-width: 6px 8px 6px 0 !important;
          border-color: transparent #ff0000 transparent transparent !important;
        }
        .ftc-guide-bubble.pos-left::before {
          top: 50% !important;
          right: -8px !important;
          transform: translateY(-50%) !important;
          border-width: 6px 0 6px 8px !important;
          border-color: transparent transparent transparent #ff0000 !important;
        }
        .ftc-guide-bubble.pos-bottom::before {
          left: var(--arrow-left, 50%) !important;
          top: -8px !important;
          transform: translateX(-50%) !important;
          border-width: 0 6px 8px 6px !important;
          border-color: transparent transparent #ff0000 transparent !important;
        }
        .ftc-guide-bubble.pos-top::before {
          left: var(--arrow-left, 50%) !important;
          bottom: -8px !important;
          transform: translateX(-50%) !important;
          border-width: 8px 6px 0 6px !important;
          border-color: #ff0000 transparent transparent transparent !important;
        }
        @keyframes ftcGuidePopIn {
          0% { opacity: 0; transform: scale(0.88) translateY(3px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      (doc.head || doc.documentElement).appendChild(styleTag);
    }

    function findGuideElements(doc, selectorStr) {
      if (!doc || !selectorStr) return [];
      const parts = selectorStr.split(',').map(s => s.trim()).filter(Boolean);
      const results = [];
      for (const sel of parts) {
        try {
          if (sel.startsWith('text:')) {
            const textToFind = sel.slice(5).trim();
            let marker = doc.querySelector(`.ftc-text-marker[data-text="${textToFind}"]`);
            if (marker && marker.offsetParent !== null) {
              results.push(marker);
              continue;
            }
            const walker = doc.createTreeWalker(doc.body || doc, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
              const index = node.nodeValue.indexOf(textToFind);
              if (index !== -1 && node.parentElement && node.parentElement.offsetParent !== null &&
                  !node.parentElement.closest('.ftc-guide-bubble')) {
                const range = doc.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + textToFind.length);
                marker = doc.createElement('span');
                marker.className = 'ftc-text-marker';
                marker.dataset.text = textToFind;
                marker.style.cssText = 'display:inline;padding:0;margin:0;border:none';
                try {
                  range.surroundContents(marker);
                  results.push(marker);
                } catch (error) {
                  results.push(node.parentElement);
                }
                break;
              }
            }
            continue;
          }

          if (!sel.includes(':contains(') && !sel.includes(':has-text(')) {
            try {
              doc.querySelectorAll(sel).forEach(el => results.push(el));
            } catch (error) {
              console.warn('[findGuideElements] Invalid native selector:', sel, error);
            }
            continue;
          }

          // Không tách khoảng trắng nằm bên trong pseudo selector.
          let segments;
          try {
            segments = sel.match(/(?:[^\s(]+|\([^)]*\))+/g) || sel.split(/\s+/).filter(Boolean);
          } catch (error) {
            segments = sel.split(/\s+/).filter(Boolean);
          }
          let currentContexts = [doc.body || doc];

          for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const match = seg.match(/^(.*?):(contains|has-text)\(["']?(.*?)["']?\)(.*)$/);
            let baseSel = seg;
            let textToMatch = null;

            if (match) {
              baseSel = (match[1] || '*') + (match[4] || '');
              textToMatch = match[3].trim().toLowerCase();
            }

            const nextContexts = [];
            for (const ctx of currentContexts) {
              let elements = [];
              try {
                elements = ctx.querySelectorAll(baseSel);
              } catch (error) {
                try { elements = ctx.querySelectorAll('*'); } catch (fallbackError) { }
              }
              elements.forEach(el => {
                if (textToMatch) {
                  const txt = (el.textContent || el.innerText || '').trim().toLowerCase();
                  if (txt.includes(textToMatch)) {
                    nextContexts.push(el);
                  }
                } else {
                  nextContexts.push(el);
                }
              });
            }
            currentContexts = nextContexts;
            if (currentContexts.length === 0) break;
          }

          currentContexts.forEach(el => {
            if (!results.includes(el)) {
              results.push(el);
            }
          });
        } catch (e) {
          console.error("Error in findGuideElements for selector:", sel, e);
        }
      }
      return results;
    }

    function isPageActiveInTree(rootWin, pageName) {
      if (!rootWin || !pageName) return false;
      const p = pageName.toLowerCase();
      try {
        // Kiểm tra biến global oldpath của simulator
        if (rootWin.oldpath && rootWin.oldpath.toLowerCase().includes(p)) {
          return true;
        }
        const docs = getAllAccessibleDocuments(rootWin);
        for (const d of docs) {
          const h = (d.location && d.location.href) ? d.location.href.toLowerCase() : '';
          const ha = (d.location && d.location.hash) ? d.location.hash.toLowerCase() : '';
          if (h.includes(p) || ha.includes(p)) return true;
          if (p === 'lan' && (h.includes('dhcp') || ha.includes('dhcp'))) return true;
        }
      } catch (e) { }
      return false;
    }

    const href = (doc && doc.location && doc.location.href) ? doc.location.href.toLowerCase() : '';
    const hash = (doc && doc.location && doc.location.hash) ? doc.location.hash.toLowerCase() : '';
    const topHref = (window.location && window.location.href) ? window.location.href.toLowerCase() : '';
    const fullUrl = href + ' ' + hash + ' ' + topHref;

    // Render popups
    popups.forEach((pop, idx) => {
      // Filter by page / hideOnPage if specified
      const targetPage = pop.page || pop.urlIncludes;
      if (targetPage) {
        const pName = targetPage.toLowerCase();
        const active = isPageActiveInTree(deviceIframe.contentWindow, pName) || fullUrl.includes(pName);
        if (!active) {
          const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
          if (oldBubble) oldBubble.remove();
          return;
        }
      }
      const hidePage = pop.hideOnPage || pop.hideOnUrlIncludes;
      if (hidePage) {
        const hName = hidePage.toLowerCase();
        const hidden = isPageActiveInTree(deviceIframe.contentWindow, hName) || fullUrl.includes(hName);
        if (hidden) {
          const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
          if (oldBubble) oldBubble.remove();
          return;
        }
      }

      // Filter by requireSaved (chỉ hiện sau khi đã hoàn thành bấm Lưu / Save)
      if (pop.requireSaved) {
        const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
        const isSaved = Boolean(doc._ftcIsSaved || doc._ftc2gSaved) || 
          allDocs.some(d => Boolean(d._ftcIsSaved || d._ftc2gSaved || (d.location && d.location.search && d.location.search.includes('save_success=1'))));
        if (!isSaved) {
          const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
          if (oldBubble) oldBubble.remove();
          return;
        }
      }

      // Filter by hideWhenSaved (ẩn đi sau khi đã bấm Lưu / Save)
      if (pop.hideWhenSaved) {
        const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
        const isSaved = Boolean(doc._ftcIsSaved || doc._ftc2gSaved) || 
          allDocs.some(d => Boolean(d._ftcIsSaved || d._ftc2gSaved || (d.location && d.location.search && d.location.search.includes('save_success=1'))));
        if (isSaved) {
          const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
          if (oldBubble) oldBubble.remove();
          return;
        }
      }

      if (typeof pop.condition === 'function') {
        let conditionPassed = true;
        try {
          conditionPassed = pop.condition(doc);
        } catch (error) {
          conditionPassed = false;
        }
        if (!conditionPassed) {
          const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
          if (oldBubble) oldBubble.remove();
          return;
        }
      }

      let target = null;
      try {
        const elements = findGuideElements(doc, pop.selector);
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const r = el.getBoundingClientRect();
          if (r.width > 0 || r.height > 0 || el.offsetParent !== null) {
            target = el;
            break;
          }
        }
        if (!target && elements.length > 0) {
          target = elements[0];
        }
      } catch (e) { }

      if (target) {
        const openModal = Array.from(doc.querySelectorAll('.MuiDialog-root, .MuiModal-root, #modal_overlay, .modal-overlay, .modal_overlay, #modal-overlay')).find(m => {
          if (!m) return false;
          if (m.classList.contains('MuiDialog-root') || m.classList.contains('MuiModal-root')) {
            return m.style.display !== 'none' && (m.offsetWidth > 0 || m.offsetHeight > 0 || (m.getClientRects && m.getClientRects().length > 0));
          }
          return m.classList.contains('active') || m.classList.contains('show') || m.style.display === 'flex' || m.style.display === 'block';
        });
        if (openModal && !openModal.contains(target)) {
          target = null;
        }
      }

      if (!target) {
        const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
        if (oldBubble) oldBubble.remove();
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0 && target.offsetParent === null) {
        const oldBubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
        if (oldBubble) oldBubble.remove();
        return;
      }

      let bubble = doc.querySelector(`.ftc-guide-bubble[data-guide-index="${idx}"]`);
      if (!bubble) {
        bubble = doc.createElement('div');
        const pos = pop.position || 'right';
        bubble.className = `ftc-guide-bubble pos-${pos}`;
        bubble.innerHTML = pop.text;
        bubble.dataset.guideIndex = idx;
        doc.body.appendChild(bubble);
      } else if (bubble.innerHTML !== pop.text) {
        bubble.innerHTML = pop.text;
      }

      const win = doc.defaultView || window;
      const bodyStyle = win.getComputedStyle(doc.body);
      const isBodyPositioned = bodyStyle && bodyStyle.position !== 'static';
      const offsetParent = isBodyPositioned ? doc.body : doc.documentElement;
      const parentRect = offsetParent.getBoundingClientRect();

      const targetTop = rect.top - parentRect.top;
      const targetLeft = rect.left - parentRect.left;
      const bWidth = bubble.offsetWidth || 180;
      const bHeight = bubble.offsetHeight || 30;
      const winW = win.innerWidth || doc.documentElement.clientWidth || 1024;
      const winH = win.innerHeight || doc.documentElement.clientHeight || 768;
      let pos = pop.position || 'right';

      // Tắt tự động lật tooltip theo yêu cầu
      /*
      if (!pop.forcePosition && pos === 'right' && (rect.left + rect.width + bWidth + 16) > winW) {
        if (rect.left - bWidth - 12 >= 10) {
          pos = 'left';
        }
      }
      */

      bubble.className = `ftc-guide-bubble pos-${pos}`;

      let calcLeft = 0;
      let calcTop = 0;
      const targetW = (pop.targetWidth !== undefined) ? pop.targetWidth : rect.width;
      const targetH = (pop.targetHeight !== undefined) ? pop.targetHeight : rect.height;

      if (pos === 'right') {
        calcLeft = targetLeft + targetW + 10;
        calcTop = targetTop + (targetH / 2) - (bHeight / 2);
      } else if (pos === 'left') {
        calcLeft = targetLeft - bWidth - 10;
        calcTop = targetTop + (targetH / 2) - (bHeight / 2);
      } else if (pos === 'bottom') {
        calcLeft = targetLeft + (targetW / 2) - (bWidth / 2);
        calcTop = targetTop + targetH + 8;
      } else if (pos === 'top') {
        calcLeft = targetLeft + (targetW / 2) - (bWidth / 2);
        calcTop = targetTop - bHeight - 8;
      }

      // Nếu target đã bị cuộn ra khỏi viewport nhìn thấy (quá đỉnh hoặc quá đáy màn hình), tạm ẩn bubble để không bị kẹt dồn ở top: 5px
      const isTargetVisibleInViewport = (rect.bottom >= 0 && rect.top <= winH);
      if (!isTargetVisibleInViewport) {
        bubble.style.display = 'none';
      } else {
        bubble.style.display = '';
      }

      // Giữ vị trí chính xác sát target, tránh đè lên ô nhập
      if (pop.offsetX) calcLeft += pop.offsetX;
      if (pop.offsetY) calcTop += pop.offsetY;

      calcLeft = Math.max(5, calcLeft);
      if (calcLeft + bWidth > winW - 10) {
        calcLeft = Math.max(5, winW - bWidth - 10);
      }
      const minTop = (pop.minTop !== undefined) ? pop.minTop : ((pop.offsetY && pop.offsetY < 0) ? -100 : 5);
      calcTop = Math.max(minTop, calcTop);

      bubble.style.left = Math.round(calcLeft) + 'px';
      bubble.style.top = Math.round(calcTop) + 'px';

      if (pos === 'bottom' || pos === 'top') {
        const arrowX = (pop.arrowLeft !== undefined)
          ? pop.arrowLeft
          : Math.max(12, Math.min(bWidth - 12, (targetLeft + targetW / 2) - calcLeft));
        bubble.style.setProperty('--arrow-left', Math.round(arrowX) + 'px');
      }
    });

    // Dọn dẹp các bubble thừa khi danh sách popups ngắn hơn
    doc.querySelectorAll('.ftc-guide-bubble').forEach(b => {
      const gIndex = parseInt(b.dataset.guideIndex, 10);
      if (isNaN(gIndex) || gIndex >= popups.length) {
        b.remove();
      }
    });
  }

  // ── Hook cho Simulator Save ──────────────────────────────────────
  window.onSimulatorSave = function (simWin, modalTitle) {
    if (currentDeviceId === 'ax3000gz' && _currentLesson && _currentLesson.id === 'LAB_AX3000GZ_02') {
      if (modalTitle !== 'WLAN SSID Configuration') {
        return;
      }
    }
    triggerSaveFlashEffect(simWin ? simWin.document : null, null);
    window._hasClickedSaveInGuide = true;
    if (currentLessonId === 'LAB_AX3000S_02') {
      const simDoc = simWin ? simWin.document : (deviceIframe ? deviceIframe.contentDocument : null);
      const is2g = (modalTitle === 'wlanBasicSetting2g') || (simDoc && (
        Boolean(simDoc.querySelector && (simDoc.querySelector('[id="11n_BandWidth"]') || simDoc.getElementById('11n_BandWidth') || (function(){ try { return simDoc.querySelector('#11n_BandWidth'); } catch(e){ return null; } })())) ||
        (simDoc.location && ((simDoc.location.href && simDoc.location.href.toLowerCase().includes('wlanbasicsetting2g')) || (simDoc.location.hash && simDoc.location.hash.toLowerCase().includes('wlanbasicsetting2g')))) ||
        Boolean(simDoc.querySelector && simDoc.querySelector('.skpage-title') && simDoc.querySelector('.skpage-title').textContent.includes('2.4G'))
      ));
      if (is2g) {
        if (simDoc) {
          simDoc._ftc2gSaved = true;
          simDoc._ftcIsSaved = true;
          try {
            const sEl = simDoc.querySelector('#Txt_SSID, input[name="Txt_SSID"]');
            const pEl = simDoc.querySelector('#Pwd_WpaPsk, input[name="Pwd_WpaPsk"]');
            const bEl = simDoc.querySelector('#Sel_BandWidth, select[name="Sel_BandWidth"]');
            const lessonKey = 'ax3000s:LAB_AX3000S_02';
            if (!window._sessionRuleCache) window._sessionRuleCache = {};
            window._sessionRuleCacheScope = lessonKey;
            if (sEl && sEl.value) {
              const val = sEl.value.trim();
              window._sessionRuleCache['wifi_ssid'] = { actualValue: val, isSaved: true, isMatch: (val === 'FPT Telecom') };
            }
            if (pEl && pEl.value) {
              const val = pEl.value.trim();
              window._sessionRuleCache['wifi_key'] = { actualValue: val, isSaved: true, isMatch: (val === '19006600') };
            }
            if (bEl && bEl.value) {
              const val = bEl.value.trim();
              window._sessionRuleCache['wifi_bw'] = { actualValue: val, isSaved: true, isMatch: (val === '20Mhz') };
            }
          } catch (e) { }
        }
        window._ftc2gSaved = true;
      }
    }
    if (currentLessonId === 'LAB_AX3000S_05') {
      const simDoc = simWin ? simWin.document : (deviceIframe ? deviceIframe.contentDocument : null);
      if (simDoc) {
        simDoc._ftcIsSaved = true;
        try {
          const ipEl = simDoc.querySelector('#ethIpAddress');
          const maskEl = simDoc.querySelector('#ethSubnetMask');
          const dhcpType2 = simDoc.querySelector('#dhcpSrvType2');
          const startEl = simDoc.querySelector('#dhcpEthStart');
          const endEl = simDoc.querySelector('#dhcpEthEnd');
          const leaseEl = simDoc.querySelector('#dhcpLeasedTime');
          const lessonKey = 'ax3000s:LAB_AX3000S_05';
          if (!window._sessionRuleCache) window._sessionRuleCache = {};
          window._sessionRuleCacheScope = lessonKey;
          if (ipEl && ipEl.value) {
            const v = ipEl.value.trim();
            window._sessionRuleCache['lan_ip'] = { actualValue: v, isSaved: true, isMatch: (v === '192.168.2.1') };
          }
          if (maskEl && maskEl.value) {
            const v = maskEl.value.trim();
            window._sessionRuleCache['lan_subnet'] = { actualValue: v, isSaved: true, isMatch: (v === '255.255.255.0') };
          }
          if (dhcpType2) {
            const isChecked = dhcpType2.checked;
            window._sessionRuleCache['lan_dhcp_enable'] = { actualValue: isChecked ? '1' : '0', isSaved: true, isMatch: isChecked };
          }
          if (startEl && startEl.value) {
            const v = startEl.value.trim();
            window._sessionRuleCache['lan_dhcp_start'] = { actualValue: v, isSaved: true, isMatch: (v === '192.168.2.2') };
          }
          if (endEl && endEl.value) {
            const v = endEl.value.trim();
            window._sessionRuleCache['lan_dhcp_end'] = { actualValue: v, isSaved: true, isMatch: (v === '192.168.2.254') };
          }
          if (leaseEl && leaseEl.value) {
            const v = leaseEl.value.trim();
            window._sessionRuleCache['lan_dhcp_lease'] = { actualValue: v, isSaved: true, isMatch: (v === '120') };
          }
        } catch (e) { }
      }
    }
    if (currentDeviceId === 'mikrotik_hexs') {
      window._ftcMkChanTooltip = true;
      setTimeout(function () { window._ftcMkChanTooltip = false; }, 200);
    }

    if (_currentLesson && typeof _currentLesson.onSimSave === 'function') {
      try {
        _currentLesson.onSimSave(simWin);
      } catch (e) { }
    }

    // Đánh giá tức thì để mở nút Nộp bài (khi đúng) hoặc nút Xem lỗi sai (khi sai) ngay lập tức
    const device = DEVICES.find(d => d.id === currentDeviceId);
    const lesson = getCurrentLesson();
    if (device && lesson) {
      const evalResult = evaluateLesson(device, lesson);
      const btnGuideErrors = document.getElementById('btn-guide-errors');
      const noConfigSaved = isNoConfigDevice();

      const normalizedDeviceId = (currentDeviceId || '').toLowerCase();
      if (normalizedDeviceId === 'ac1000hi' && lesson.id === 'LAB_AC1000HI_06' && evalResult && evalResult.passed) {
        if (btnSubmitLab) {
          btnSubmitLab.disabled = false;
          btnSubmitLab.style.opacity = '1';
        }
        setTimeout(function () { submitLab(); }, 600);
        return;
      }

      if (currentMode === 'practice') {
        // ⚡ Chế độ Thực hành: Nút lỗi sai LUÔN ẨN, Nút Nộp bài LUÔN SÁNG để học viên nộp bài
        if (btnGuideErrors) {
          btnGuideErrors.style.display = 'none';
        }
        if (btnSubmitLab) {
          btnSubmitLab.disabled = false;
          btnSubmitLab.style.opacity = '1';
          btnSubmitLab.style.cursor = 'pointer';
          btnSubmitLab.style.animation = 'submitBtnPulse 2.5s infinite';
        }
      } else {
        // 💡 Chế độ Hướng dẫn:
        const trangDangLamSach = evalResult
          ? ((typeof evalResult.trangHienTaiDat === 'boolean')
            ? evalResult.trangHienTaiDat : evalResult.passed)
          : false;

        if (noConfigSaved || window._hasSuccHintStored || (evalResult && evalResult.passed)) {
          // Cấu hình ĐÚNG hoặc thiết bị không cần cấu hình: Nút Nộp bài SÁNG LÊN, Nút Lỗi sai ẨN/TẮT
          if (btnSubmitLab) {
            btnSubmitLab.disabled = false;
            btnSubmitLab.style.opacity = '1';
            btnSubmitLab.style.cursor = 'pointer';
            btnSubmitLab.style.animation = 'submitBtnPulse 2.5s infinite';
          }
          if (btnGuideErrors) {
            btnGuideErrors.style.display = 'none';
          }
        } else if (trangDangLamSach && (evalResult && evalResult.daVaoTrangCuoi === false)) {
          if (btnGuideErrors) btnGuideErrors.style.display = 'none';
          if (btnSubmitLab) {
            btnSubmitLab.disabled = true;
            btnSubmitLab.style.opacity = '0.5';
            btnSubmitLab.style.cursor = 'not-allowed';
            btnSubmitLab.style.animation = 'none';
          }
        } else {
          // Cấu hình SAI ở Hướng dẫn: Nút Lỗi sai SÁNG LÊN, Nút Nộp bài TẮT/XÁM
          if (btnGuideErrors) {
            btnGuideErrors.style.display = 'flex';
            btnGuideErrors.disabled = false;
            btnGuideErrors.style.opacity = '1';
            btnGuideErrors.style.cursor = 'pointer';
            btnGuideErrors.style.background = '#fee2e2';
            btnGuideErrors.style.color = '#ef4444';
            btnGuideErrors.style.borderColor = '#fca5a5';
            btnGuideErrors.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
          }
          if (btnSubmitLab) {
            btnSubmitLab.disabled = true;
            btnSubmitLab.style.opacity = '0.5';
            btnSubmitLab.style.cursor = 'not-allowed';
            btnSubmitLab.style.animation = 'none';
          }
        }
      }
    }
  };

  // Lắng nghe sự kiện lưu cấu hình từ simulator (hỗ trợ postMessage từ iframe)
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'FTC_SAVE_SUCCESS') {
      window._hasClickedSaveInGuide = true;
      if (e.data.source === 'ax3000s_wlanBasicSetting2g' || currentLessonId === 'LAB_AX3000S_02') {
        window._ftc2gSaved = true;
        if (e.data.data) {
          const lessonKey = 'ax3000s:LAB_AX3000S_02';
          if (!window._sessionRuleCache) window._sessionRuleCache = {};
          window._sessionRuleCacheScope = lessonKey;
          if (e.data.data.ssid) {
            const sVal = String(e.data.data.ssid).trim();
            window._sessionRuleCache['wifi_ssid'] = { actualValue: sVal, isSaved: true, isMatch: (sVal === 'FPT Telecom') };
          }
          if (e.data.data.password) {
            const pVal = String(e.data.data.password).trim();
            window._sessionRuleCache['wifi_key'] = { actualValue: pVal, isSaved: true, isMatch: (pVal === '19006600') };
          }
          if (e.data.data.bandwidth) {
            const bVal = String(e.data.data.bandwidth).trim();
            window._sessionRuleCache['wifi_bw'] = { actualValue: bVal, isSaved: true, isMatch: (bVal === '20Mhz') };
          }
        }
      }
      if (e.data.source === 'ax3000s_lancfgv4' || currentLessonId === 'LAB_AX3000S_05') {
        if (e.data.data) {
          const lessonKey = 'ax3000s:LAB_AX3000S_05';
          if (!window._sessionRuleCache) window._sessionRuleCache = {};
          window._sessionRuleCacheScope = lessonKey;
          const d = e.data.data;
          if (d.ip) window._sessionRuleCache['lan_ip'] = { actualValue: String(d.ip).trim(), isSaved: true, isMatch: (String(d.ip).trim() === '192.168.2.1') };
          if (d.mask) window._sessionRuleCache['lan_subnet'] = { actualValue: String(d.mask).trim(), isSaved: true, isMatch: (String(d.mask).trim() === '255.255.255.0') };
          if (d.dhcpmode !== undefined) window._sessionRuleCache['lan_dhcp_enable'] = { actualValue: String(d.dhcpmode).trim(), isSaved: true, isMatch: (d.dhcpmode == 1) };
          if (d.start) window._sessionRuleCache['lan_dhcp_start'] = { actualValue: String(d.start).trim(), isSaved: true, isMatch: (String(d.start).trim() === '192.168.2.2') };
          if (d.end) window._sessionRuleCache['lan_dhcp_end'] = { actualValue: String(d.end).trim(), isSaved: true, isMatch: (String(d.end).trim() === '192.168.2.254') };
          if (d.lease !== undefined) window._sessionRuleCache['lan_dhcp_lease'] = { actualValue: String(d.lease).trim(), isSaved: true, isMatch: (String(d.lease).trim() === '120') };
        }
      }
      try {
        const allDocs = getAllAccessibleDocuments(deviceIframe.contentWindow);
        allDocs.forEach(d => {
          d._ftcIsSaved = true;
          if (e.data.source === 'ax3000s_wlanBasicSetting2g' || currentLessonId === 'LAB_AX3000S_02') {
            d._ftc2gSaved = true;
          }
        });
      } catch (err) { }
      if (typeof window.onSimulatorSave === 'function') {
        try { window.onSimulatorSave(deviceIframe ? deviceIframe.contentWindow : null, e.data.source || 'wlanBasicSetting2g'); } catch (err) { }
      }
    }
  });

  // ── Boot ─────────────────────────────────────────────────────────
  init();
})();
