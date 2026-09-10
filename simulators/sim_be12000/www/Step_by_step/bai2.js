// ============================================================================
// File: bai2.js
// Mô tả: Kịch bản hướng dẫn cho Bài 2: Cấu hình WIFI trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    if (labId === '2') {

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var inputs = document.querySelectorAll("[id^='ESSID:'], [id^='KeyPassphrase:']");
            inputs.forEach(function (el) {
                if (!el.id || clearedFields[el.id]) return;    // ô này đã được xét ở lần xuất hiện đầu tiên
                if (document.activeElement === el) {           // học viên đang nhập dở -> không đụng tới nữa
                    clearedFields[el.id] = true;
                    return;
                }
                // Xét ĐÚNG MỘT LẦN ngay lần đầu nhìn thấy ô:
                //  - có dữ liệu mặc định  -> xóa trắng
                //  - vốn đã rỗng          -> vẫn đánh dấu "đã xử lý"
                // Nhờ vậy vòng lặp không còn nằm chờ để "nuốt" mất dữ liệu học viên nhập lần đầu.
                if (el.value !== "") el.value = "";
                clearedFields[el.id] = true;
            });
        }, 200);

        // ====================================================================
        // PHẦN 0.5: ĐỒNG BỘ DỮ LIỆU TỪ SSID1 SANG CÁC SSID KHÁC (REAL-TIME)
        // Hệ thống FPT dùng dấu hai chấm làm phân tách ID: ESSID:0 = SSID1, ESSID:4 = SSID5
        // ====================================================================
        setInterval(function () {
            var essid1 = document.querySelector("[id='ESSID:0']");
            var pass1 = document.querySelector("[id='KeyPassphrase:0']");
            var enc1 = document.querySelector("[id='EncryptionType:0']");
            if (!essid1 || !pass1 || !enc1) return;

            var essidVal = essid1.value;
            var passVal = pass1.value;
            var encVal = enc1.value;
            if (essidVal === "" && passVal === "") return; // Chưa nhập gì thì thôi

            // Đồng bộ sang SSID2 đến SSID8 (tương ứng index 1 đến 7)
            for (var idx = 1; idx <= 7; idx++) {
                var targetEssid = document.querySelector("[id='ESSID:" + idx + "']");
                if (targetEssid && targetEssid.value !== essidVal && document.activeElement !== targetEssid) {
                    targetEssid.value = essidVal;
                }
                var targetPass = document.querySelector("[id='KeyPassphrase:" + idx + "']");
                if (targetPass && targetPass.value !== passVal && document.activeElement !== targetPass) {
                    targetPass.value = passVal;
                }
                var targetEnc = document.querySelector("[id='EncryptionType:" + idx + "']");
                if (targetEnc && targetEnc.value !== encVal) {
                    targetEnc.value = encVal;
                }
            }
        }, 200);

        // ====================================================================
        // PHẦN 1: KIỂM TRA ĐIỀU KIỆN (VALIDATION) KHI NHẤN APPLY
        // ====================================================================
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id && e.target.id.startsWith('Btn_apply_WLANSSIDConf')) {
                var container = e.target.closest("div[id^='template_WLANSSIDConf']");
                if (!container) return;

                // Container có ID dạng template_WLANSSIDConf_0, template_WLANSSIDConf_4
                var isSSID1 = container.id.endsWith("_0");
                var isSSID5 = container.id.endsWith("_4");

                var errors = [];

                var validateSSID = function (suffix, nameLabel) {
                    var getVal = function (idName) {
                        var el = document.querySelector("[id='" + idName + ":" + suffix + "']");
                        return el ? el.value.trim() : "";
                    };
                    var getRadioChecked = function (idName) {
                        var el = document.querySelector("input[name='" + idName + ":" + suffix + "']:checked");
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
                        errors.push("- Hàng 'Enable' (" + nameLabel + "): Khuyến nghị chọn On.");
                    }
                    if (ssid !== "FPT Telecom") {
                        errors.push("- Hàng 'SSID Name:' (" + nameLabel + "): Khuyến nghị giá trị đúng là 'FPT Telecom'.");
                    }
                    if (hide !== "0") {
                        errors.push("- Hàng 'SSID Hide:' (" + nameLabel + "): Khuyến nghị giá trị đúng là 'Off'.");
                    }
                    var validEncs = ["WPA2-PSK-AES", "WPA3-SAE", "WPA2/WPA3-SAE"];
                    if (validEncs.indexOf(enc) === -1) {
                        errors.push("- Hàng 'Encryption Type:' (" + nameLabel + "): Khuyến nghị giá trị đúng là 'WPA2-PSK-AES' hoặc 'WPA3'.");
                    }
                    if (pass !== "19006600") {
                        errors.push("- Hàng 'WPA Passphrase:' (" + nameLabel + "): Khuyến nghị giá trị đúng là '19006600'.");
                    }
                    if (isolation !== "0") {
                        errors.push("- Hàng 'SSID Isolation:' (" + nameLabel + "): Khuyến nghị giá trị đúng là 'Off'.");
                    }
                    if (maxClients !== "32") {
                        errors.push("- Hàng 'Maximum Clients:' (" + nameLabel + "): Khuyến nghị giá trị đúng là '32'.");
                    }
                };

                if (isSSID1) {
                    // Khi lưu SSID1, chỉ cần validate SSID1
                    validateSSID("0", "2.4GHz");
                    if (errors.length > 0) {
                        alert("BẠN ĐÃ CẤU HÌNH SAI BĂNG TẦN 2.4GHz:\n\n" + errors.join("\n"));
                        e.preventDefault();
                        e.stopPropagation();
                    } else {
                        alert("Đã lưu thành công băng tần 2.4GHz. Nội dung đã tự động đồng bộ sang 5GHz, hãy chuyển sang tab SSID5 (5GHz) để kiểm tra và nhấn Apply nhé!");
                    }
                } else if (isSSID5) {
                    // Khi lưu SSID5 (kết thúc lab), validate cả SSID1 và SSID5
                    validateSSID("0", "2.4GHz");
                    validateSSID("4", "5GHz");
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

                        alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình WIFI trên thiết bị ONT BE12000");

                        try {
                            window.top.postMessage({
                                type: 'LAB_SUCCESS',
                                device: 'ONT BE12000',
                                labName: 'Bài 2-Cấu hình WIFI',
                                message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 2-Cấu hình WIFI trên thiết bị ONT BE12000'
                            }, '*');
                        } catch (err) { }

                        window.location.href = "learning.html?lab=2";
                    }
                } else {
                    alert("Đã lưu thành công.");
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
                { selector: "[id^='Channel']", text: "Để cấu hình mặc định (chỉ điều chỉnh khi có yêu cầu từ KHG)", placement: "right", done: false },
                { selector: "#WLANSSIDConfBar", text: "Mở WLAN SSID Configuration", placement: "top", offsetX: 120, done: false },
                { selector: "[id='ESSID:0']", text: "Bước 1: SSID Name: FPT Telecom", placement: "right", done: false },
                { selector: "[id='EncryptionType:0']", text: "Bước 2: Chọn WPA2-PSK-AES hoặc WPA3", placement: "right", done: false },
                { selector: "[id='KeyPassphrase:0']", text: "Bước 3: WPA Passphrase: 19006600", placement: "right", done: false },
                { selector: "[id='MaxUserNum:0']", text: "Bước 4: Để mặc định nếu KHG không yêu cầu giới hạn client", placement: "right", done: false },
                { selector: "[id='Btn_apply_WLANSSIDConf:0']", text: "Lưu ý: Cấu hình xong băng tần 2.4GHz phải cấu hình tiếp mục SSID5(5GHz) để thiết lập đồng bộ tên/mật khẩu", placement: "top", done: false },
                { selector: "[id='Btn_apply_WLANSSIDConf:4']", text: "Bước 5: Nhấn Apply tại phần SSID5 (5GHz) để hoàn thành bài Lab", placement: "top", done: false }
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
