// ============================================================================
// File: bai1.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra cho Bài 1: Cấu hình PPPoE (WAN) trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    if (labId === '1') {
        // Xóa sạch dữ liệu cấu hình của phiên trước cho Bài 1 BE12000
        try {
            fetch('/sim_be12000/api/reset').catch(function () { });
        } catch (e) { }
        document._ftcHasSuccHint = false;
        if (window.top && window.top !== window) {
            window.top._hasSuccHintStored = false;
            window.top._hasClickedSaveInGuide = false;
        }

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var selectors = [
                "[id^='WANCName']",
                "[id^='UserName']",
                "[id^='Password']"
            ];
            selectors.forEach(function (sel) {
                var el = document.querySelector(sel);
                if (!el) return;
                var key = el.id || sel;
                if (clearedFields[key]) return;                 // ô này đã được xét ở lần xuất hiện đầu tiên
                if (document.activeElement === el) {            // học viên đang nhập dở -> không đụng tới nữa
                    clearedFields[key] = true;
                    return;
                }
                // Xét ĐÚNG MỘT LẦN ngay lần đầu nhìn thấy ô:
                //  - có dữ liệu mặc định  -> xóa trắng
                //  - vốn đã rỗng          -> vẫn đánh dấu "đã xử lý"
                // Nhờ vậy vòng lặp không còn nằm chờ để "nuốt" mất dữ liệu học viên nhập lần đầu.
                if (el.value !== "") el.value = "";
                clearedFields[key] = true;
            });
        }, 200);

        // ====================================================================
        // PHẦN 1: KIỂM TRA ĐIỀU KIỆN (VALIDATION) KHI NHẤN APPLY
        // Chạy cho cả chế độ Hướng dẫn và Thực hành
        // ====================================================================
        document.addEventListener('click', function (e) {
            var btn = e.target && (e.target.closest ? e.target.closest("[id^='Btn_apply_internet'], .Btn_apply") : (e.target.matches && e.target.matches("[id^='Btn_apply_internet'], .Btn_apply") ? e.target : null));
            if (btn) {
                var errors = [];

                var container = (btn && btn.closest) ? btn.closest(".HeadDIV, [id^='template_'], form, table, .collapsibleInstContainer, .InstContent, .AddContent") : null;

                var getVal = function (idPrefix) {
                    if (container) {
                        var el = container.querySelector("[id^='" + idPrefix + "']");
                        if (el && el.value !== undefined && el.value.trim() !== "") return el.value.trim();
                    }
                    var allEls = Array.from(document.querySelectorAll("[id^='" + idPrefix + "']"));
                    var filledEl = allEls.find(function(item) { return item.value && item.value.trim() !== ""; });
                    if (filledEl) return filledEl.value.trim();
                    return allEls[0] ? allEls[0].value.trim() : "";
                };

                var getRadioChecked = function (namePrefix) {
                    if (container) {
                        var el = container.querySelector("input[name^='" + namePrefix + "']:checked");
                        if (el) return el.value;
                    }
                    var checkedEl = document.querySelector("input[name^='" + namePrefix + "']:checked");
                    return checkedEl ? checkedEl.value : "";
                };

                var actualWancName = getVal("WANCName");
                var actualUserName = getVal("UserName");
                var actualPassword = getVal("Password");

                // Lưu lại giá trị password thực tế vào element và document trước khi router ZTE mask thành tabs
                var pwdEl = (container ? container.querySelector("[id^='Password']") : null) || document.querySelector("[id^='Password']");
                if (pwdEl && actualPassword) {
                    pwdEl._ftcRealValue = actualPassword;
                    pwdEl.dataset.ftcRealValue = actualPassword;
                }
                document._ftcRealPassword = actualPassword;

                if (actualWancName !== "FPT") errors.push("Hàng \"Connection Name:\" giá trị đúng là FPT, khuyến nghị giá trị đúng là FPT.");
                if (actualUserName !== "hnfdl-123456-789") errors.push("Hàng \"Username:\" giá trị đúng là hnfdl-123456-789, khuyến nghị giá trị đúng là hnfdl-123456-789.");
                if (actualPassword !== "d123456") errors.push("Hàng \"Password\" giá trị đúng là d123456, khuyến nghị giá trị đúng là d123456.");

                if (errors.length > 0) {
                    document._ftcHasSuccHint = false;
                    document._ftcIsSaved = false;
                    if (window.top && window.top !== window) {
                        window.top._hasSuccHintStored = false;
                        window.top._hasClickedSaveInGuide = true;
                        try {
                            if (typeof window.top.onSimulatorSave === 'function') {
                                window.top.onSimulatorSave(window);
                            }
                        } catch (err) { }
                    }
                    var succHintEl = document.querySelector('.succHint');
                    if (succHintEl) {
                        succHintEl.style.display = 'none';
                    }
                    alert("BẠN ĐÃ CẤU HÌNH SAI:\n\n" + errors.join("\n"));
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                } else {
                    document._ftcHasSuccHint = true;
                    document._ftcIsSaved = true;
                    if (window.top && window.top !== window) {
                        window.top._hasSuccHintStored = true;
                        window.top._hasClickedSaveInGuide = true;
                        try {
                            if (typeof window.top.onSimulatorSave === 'function') {
                                window.top.onSimulatorSave(window);
                            }
                        } catch (err) { }
                    }
                    var succHintEl = document.querySelector('.succHint');
                    if (succHintEl) {
                        succHintEl.style.display = 'block';
                    }

                    // Nếu đang chạy trong khung iframe của Portal
                    if (window.top && window.top !== window) {
                        try {
                            var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';
                            window.top.postMessage({
                                type: 'LAB_SUCCESS',
                                device: 'ONT BE12000',
                                labName: 'Bài 1-Cấu hình PPPoE',
                                message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 1-Cấu hình PPPoE trên thiết bị ONT BE12000'
                            }, '*');
                        } catch (err) { }
                        return;
                    }

                    // Nếu chạy độc lập (không qua Portal)
                    var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';
                    try {
                        const topUrl = new URL(window.top.location.href);
                        topUrl.searchParams.set('device', 'ONT_BE12000');
                        window.top.history.replaceState(null, '', topUrl.toString());
                    } catch (err) { }

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình PPPoE trên thiết bị Internet Hub ONT BE12000");

                    try {
                        window.top.postMessage({
                            type: 'LAB_SUCCESS',
                            device: 'ONT BE12000',
                            labName: 'Bài 1-Cấu hình PPPoE',
                            message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 1-Cấu hình PPPoE trên thiết bị ONT BE12000'
                        }, '*');
                    } catch (err) { }

                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }, true);


        // ====================================================================
        // PHẦN 2: TOOLTIP HƯỚNG DẪN TỪNG BƯỚC
        // Chỉ chạy ở chế độ Hướng dẫn (mode=guide)
        // ====================================================================
        if (mode === 'guide') {
            // Inject CSS for tooltips
            var style = document.createElement('style');
            style.innerHTML = `
                .input-wrapper-guide { position: relative; display: inline-block; }
                .guide-tooltip {
                    position: absolute;
                    background: rgba(220, 38, 38, 0.92);
                    color: #fff;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 11px;
                    line-height: 1.2;
                    font-weight: 500;
                    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
                    z-index: 9999;
                    pointer-events: none;
                    white-space: nowrap;
                }
                /* Tooltip bên phải */
                .guide-tooltip.right {
                    top: 50%;
                    left: 100%;
                    margin-left: 8px;
                    transform: translateY(-50%);
                }
                .guide-tooltip.right::after {
                    content: '';
                    position: absolute;
                    border: 4px solid transparent;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border-right-color: rgba(220, 38, 38, 0.92);
                }
                /* Tooltip bên dưới */
                .guide-tooltip.bottom {
                    top: 100%;
                    left: 50%;
                    margin-top: 8px;
                    transform: translateX(-50%);
                }
                .guide-tooltip.bottom::after {
                    content: '';
                    position: absolute;
                    border: 4px solid transparent;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-bottom-color: rgba(220, 38, 38, 0.92);
                }
                /* Tooltip bên trên */
                .guide-tooltip.top::after {
                    content: '';
                    position: absolute;
                    border: 4px solid transparent;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-top-color: rgba(220, 38, 38, 0.92);
                }
            `;
            document.head.appendChild(style);

            // Define steps
            var steps = [
                { selector: "#internet", text: "Chọn Internet", placement: "bottom", done: false },
                { selector: "#internetConfig", text: "Chọn WAN", placement: "right", done: false },
                { selector: "[id^='WANCName']", text: "Bước 1: Nhập Connection Name: FPT", placement: "right", done: false },
                { selector: "[id^='UserName']", text: "Bước 2: Nhập Username: hnfdl-123456-789", placement: "right", done: false },
                { selector: "[id^='Password']", text: "Bước 3: Nhập Password: d123456", placement: "right", done: false },
                { selector: "[id^='Btn_apply_internet']", text: "Chọn Apply để lưu cấu hình", placement: "top", done: false }
            ];

            // Function to create and update tooltip
            function createTooltip(step) {
                var tooltip = document.createElement('div');
                tooltip.className = 'guide-tooltip ' + step.placement;
                tooltip.innerHTML = step.text;
                document.body.appendChild(tooltip);

                function updatePos() {
                    var currentEl = document.querySelector(step.selector);
                    // Check if element exists and is visible
                    if (!currentEl || currentEl.offsetWidth === 0 || currentEl.offsetHeight === 0) {
                        tooltip.style.display = 'none';
                        return;
                    }

                    tooltip.style.display = 'block';
                    var rect = currentEl.getBoundingClientRect();

                    // Calculate document scroll
                    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;

                    if (step.placement === 'right') {
                        tooltip.style.top = (rect.top + scrollTop + rect.height / 2) + 'px';
                        tooltip.style.left = (rect.right + scrollLeft) + 'px';
                    } else if (step.placement === 'bottom') {
                        tooltip.style.top = (rect.bottom + scrollTop) + 'px';
                        tooltip.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
                    } else if (step.placement === 'top') {
                        tooltip.style.top = (rect.top + scrollTop) + 'px';
                        tooltip.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
                        tooltip.style.transform = 'translate(-50%, -100%)';
                    }
                }

                updatePos();
                window.addEventListener('resize', updatePos);
                window.addEventListener('scroll', updatePos, true);
                setInterval(updatePos, 200); // Poll frequently for layout changes (AJAX, animations)
                step.done = true;
            }

            // MutationObserver to watch for elements being loaded
            var observer = new MutationObserver(function (mutations) {
                steps.forEach(function (step) {
                    if (!step.done && document.querySelector(step.selector)) {
                        createTooltip(step);
                    }
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });

            // Initial check
            steps.forEach(function (step) {
                if (!step.done && document.querySelector(step.selector)) {
                    createTooltip(step);
                }
            });
        }
    }
});
