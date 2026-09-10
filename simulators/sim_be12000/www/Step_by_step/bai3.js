// ============================================================================
// File: bai3.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra thực hành cho Bài 3: Cấu hình WIFI IOT trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    if (labId === '4') {

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var selectors = [
                "[id='ESSID:1']",
                "[id='KeyPassphrase:1']"
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
        // ====================================================================
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'Btn_apply_WLANSSIDConf:1') {
                var container = e.target.closest("div[id^='template_WLANSSIDConf']");
                if (!container) return;

                var errors = [];
                var getVal = function (idName) {
                    var el = container.querySelector("[id='" + idName + ":1']");
                    return el ? el.value.trim() : "";
                };

                var getRadioChecked = function (name) {
                    var el = container.querySelector("input[name='" + name + ":1']:checked");
                    return el ? el.value : "";
                };

                var enabled = getRadioChecked("Enable");
                var ssid = getVal("ESSID");
                var hide = getRadioChecked("ESSIDHideEnable");
                var enc = getVal("EncryptionType");
                var pass = getVal("KeyPassphrase");
                var isolation = getRadioChecked("VapIsolationEnable");
                var maxClients = getVal("MaxUserNum");

                if (enabled !== "1") {
                    errors.push("- Hàng 'SSID2:': Khuyến nghị giá trị đúng là 'On'.");
                }

                if (ssid !== "FPT Telecom-IoT") {
                    errors.push("- Hàng 'SSID Name:': Khuyến nghị giá trị đúng là 'FPT Telecom-IoT'.");
                }

                if (hide !== "0") {
                    errors.push("- Hàng 'SSID Hide:': Khuyến nghị giá trị đúng là 'Off'.");
                }

                if (enc !== "WPA2-PSK-AES") {
                    errors.push("- Hàng 'Encryption Type:': Khuyến nghị giá trị đúng là 'WPA2-PSK-AES'.");
                }

                if (pass !== "19006600") {
                    errors.push("- Hàng 'WPA Passphrase:': Khuyến nghị giá trị đúng là '19006600'.");
                }

                if (isolation !== "0") {
                    errors.push("- Hàng 'SSID Isolation:': Khuyến nghị giá trị đúng là 'Off'.");
                }

                if (maxClients !== "32") {
                    errors.push("- Hàng 'Maximum Clients:': Khuyến nghị giá trị đúng là '32'.");
                }

                if (errors.length > 0) {
                    alert("BẠN ĐÃ CẤU HÌNH SAI:\n\n" + errors.join("\n"));
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';

                    try {
                        const topUrl = new URL(window.top.location.href);
                        topUrl.searchParams.set('device', 'ONT_BE12000');
                        window.top.history.replaceState(null, '', topUrl.toString());
                    } catch (err) { }

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình WIFI IOT trên thiết bị ONT BE12000");

                    try {
                        window.top.postMessage({
                            type: 'LAB_SUCCESS',
                            device: 'ONT BE12000',
                            labName: 'Bài 3-Cấu hình WIFI IOT',
                            message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 3-Cấu hình WIFI IOT trên thiết bị ONT BE12000'
                        }, '*');
                    } catch (err) { }

                    window.location.href = "learning.html?lab=4";
                }
            }
        }, true);

        // ====================================================================
        // PHẦN 2: TOOLTIP HƯỚNG DẪN TỪNG BƯỚC
        // ====================================================================
        if (mode === 'guide') {
            // Inject CSS for tooltips
            var style = document.createElement('style');
            style.innerHTML = `
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
                .guide-tooltip.top {
                    transform: translate(-50%, -100%);
                    margin-top: -8px;
                }
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
                { selector: "#localnet", text: "Chọn Local Network", placement: "bottom", done: false },
                { selector: "#wlanConfig", text: "Chọn WLAN", placement: "bottom", done: false },
                { selector: "#wlanBasic", text: "Chọn WLAN Basic", placement: "bottom", done: false },
                { selector: "#WLANSSIDConfBar", text: "Mở WLAN SSID Configuration", placement: "top", offsetX: 120, done: false },
                { selector: "label[for='Enable1:1']", text: "Bước 1: Chọn On (SSID2 2.4GHz)", placement: "top", done: false },
                { selector: "[id='instName_WLANSSIDConf:1']", text: "Bước 2: Click mở SSID2 để cấu hình", placement: "top", done: false },
                { selector: "[id='ESSID:1']", text: "Bước 3: Đặt tên SSID Name (ví dụ: FPT Telecom-IoT)", placement: "right", done: false },
                { selector: "label[for='ESSIDHideEnable1:1']", text: "Bước 4: Chọn Off của phần SSID Hide (tắt ẩn mạng)", placement: "right", done: false },
                { selector: "[id='EncryptionType:1']", text: "Bước 5: Chọn Encryption Type: WPA2-PSK-AES", placement: "right", done: false },
                { selector: "[id='KeyPassphrase:1']", text: "Bước 6: Nhập WPA Passphrase: 19006600", placement: "right", done: false },
                { selector: "[id='Btn_apply_WLANSSIDConf:1']", text: "Bước 8: Nhấn Apply để lưu cấu hình", placement: "top", done: false }
            ];

            // Function to create and update tooltip
            function createTooltip(step) {
                var tooltip = document.createElement('div');
                tooltip.className = 'guide-tooltip ' + step.placement;
                tooltip.innerHTML = step.text;
                document.body.appendChild(tooltip);

                function updatePos() {
                    var currentEl = document.querySelector(step.selector);
                    if (!currentEl || currentEl.offsetWidth === 0 || currentEl.offsetHeight === 0) {
                        tooltip.style.display = 'none';
                        return;
                    }

                    tooltip.style.display = 'block';
                    var rect = currentEl.getBoundingClientRect();

                    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
                    var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;

                    var leftOffset = step.offsetX !== undefined ? step.offsetX : rect.width / 2;

                    if (step.placement === 'right') {
                        tooltip.style.top = (rect.top + scrollTop + rect.height / 2) + 'px';
                        tooltip.style.left = (rect.right + scrollLeft) + 'px';
                    } else if (step.placement === 'bottom') {
                        tooltip.style.top = (rect.bottom + scrollTop) + 'px';
                        tooltip.style.left = (rect.left + scrollLeft + leftOffset) + 'px';
                    } else if (step.placement === 'top') {
                        tooltip.style.top = (rect.top + scrollTop) + 'px';
                        tooltip.style.left = (rect.left + scrollLeft + leftOffset) + 'px';
                    }
                }

                updatePos();
                window.addEventListener('resize', updatePos);
                window.addEventListener('scroll', updatePos, true);
                setInterval(updatePos, 200);
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
