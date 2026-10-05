// ============================================================================
// File: bai5.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra thực hành cho Bài 5: Cấu hình DHCP trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    var isLab5 = labId === '6' || labId === '5' || labId === 'LAB_BE12000_05' || (window.top && window.top._currentLesson && window.top._currentLesson.id === 'LAB_BE12000_05');

    if (isLab5) {

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // Chỉ xóa ô cuối cùng của mỗi trường IP/Subnet để dễ nhập liệu
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var selectors = [
                "[id='sub_IPAddr3:DHCPBasicCfg']",
                "#sub_SubMask3",
                "[id='sub_MinAddress3:DHCPBasicCfg']",
                "[id='sub_MaxAddress3:DHCPBasicCfg']"
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
                if (el.value !== "") el.value = "";
                clearedFields[key] = true;
            });
        }, 200);

        // ====================================================================
        // PHẦN 1: KIỂM TRA ĐIỀU KIỆN (VALIDATION) KHI NHẤN APPLY
        // ====================================================================
        document.addEventListener('click', function (e) {
            if (e.target && (e.target.id === 'Btn_apply_DHCPBasicCfg' || (e.target.id && e.target.id.startsWith('Btn_apply_DHCPBasicCfg')))) {
                var container = e.target.closest("div[id^='template_DHCPBasicCfg']") || document.querySelector("#template_DHCPBasicCfg") || e.target.closest(".HeadDIV");
                var errors = [];

                var getIP = function (prefix, suffix) {
                    var ipParts = [];
                    for (var i = 0; i < 4; i++) {
                        var el = document.getElementById(prefix + i + (suffix || "")) || (container ? container.querySelector("[id='" + prefix + i + (suffix || "") + "']") : null);
                        ipParts.push(el ? el.value.trim() : "");
                    }
                    return ipParts.join(".");
                };

                // 1. DHCP Server
                var dhcpServerOn = document.getElementById("ServerEnable1") || (container ? container.querySelector("#ServerEnable1") : null);
                if (dhcpServerOn && !dhcpServerOn.checked) {
                    errors.push("- Hàng 'DHCP Server': Cần chọn 'On'.");
                }

                // 2. LAN IP Address
                var lanIP = getIP("sub_IPAddr", ":DHCPBasicCfg");
                if (lanIP !== "192.168.10.1") {
                    errors.push("- Hàng 'LAN IP Address': Khuyến nghị giá trị đúng là '192.168.10.1'. Thực tế: '" + (lanIP || 'Trống') + "'");
                }

                // 3. Subnet Mask
                var subMask = getIP("sub_SubMask", "");
                if (subMask !== "255.255.255.0") {
                    errors.push("- Hàng 'Subnet Mask': Khuyến nghị giá trị đúng là '255.255.255.0'. Thực tế: '" + (subMask || 'Trống') + "'");
                }

                // 4. DHCP Start IP Address
                var startIP = getIP("sub_MinAddress", ":DHCPBasicCfg");
                var startParts = startIP.split(".");
                var startOctet3 = parseInt(startParts[3], 10);
                var validStart = (startIP === "192.168.10.2") || (startParts.length === 4 && startParts[0] === "192" && startParts[1] === "168" && startParts[2] === "10" && !isNaN(startOctet3) && startOctet3 >= 2 && startOctet3 <= 253);
                if (!validStart) {
                    errors.push("- Hàng 'DHCP Start IP Address': Khuyến nghị giá trị đúng là '192.168.10.2'. Thực tế: '" + (startIP || 'Trống') + "'");
                }

                // 5. DHCP End IP Address
                var endIP = getIP("sub_MaxAddress", ":DHCPBasicCfg");
                var endParts = endIP.split(".");
                var endOctet3 = parseInt(endParts[3], 10);
                var validEnd = (endIP === "192.168.10.254" || endIP === "192.168.10.250" || endIP === "192.168.10.200") || (endParts.length === 4 && endParts[0] === "192" && endParts[1] === "168" && endParts[2] === "10" && !isNaN(endOctet3) && endOctet3 > startOctet3 && endOctet3 <= 254);
                if (!validEnd) {
                    errors.push("- Hàng 'DHCP End IP Address': Khuyến nghị giá trị đúng là '192.168.10.254'. Thực tế: '" + (endIP || 'Trống') + "'");
                }

                if (validStart && validEnd && startOctet3 >= endOctet3) {
                    errors.push("- Dải DHCP IP không hợp lệ: Start IP (" + startIP + ") phải nhỏ hơn End IP (" + endIP + ").");
                }

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
                    alert("BẠN ĐÃ CẤU HÌNH SAI:\n\n" + errors.join("\n"));
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    document._ftcIsSaved = true;
                    document._ftcHasSuccHint = true;
                    var succHintEl = (container && container.querySelector('.succHint')) || document.querySelector('.succHint');
                    if (succHintEl) succHintEl.style.display = 'block';

                    if (window.top && window.top !== window) {
                        window.top._hasSuccHintStored = true;
                        window.top._hasClickedSaveInGuide = true;
                        try {
                            if (typeof window.top.onSimulatorSave === 'function') {
                                window.top.onSimulatorSave(window);
                            }
                        } catch (err) { }
                        try {
                            var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';
                            window.top.postMessage({
                                type: 'LAB_SUCCESS',
                                device: 'ONT BE12000',
                                labName: 'Bài 5-Cấu hình DHCP',
                                message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 5-Cấu hình DHCP trên thiết bị ONT BE12000'
                            }, '*');
                        } catch (err) { }

                        alert("Chúc mừng bạn đã hoàn thành cấu hình DHCP! Thông báo lưu thành công đã xuất hiện, hãy bấm nút Nộp bài trên thanh điều hướng để hoàn tất bài học.");
                        return;
                    }

                    var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';

                    try {
                        const topUrl = new URL(window.top.location.href);
                        topUrl.searchParams.set('device', 'ONT_BE12000');
                        window.top.history.replaceState(null, '', topUrl.toString());
                    } catch (err) { }

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình DHCP trên thiết bị ONT BE12000 ");

                    try {
                        window.top.postMessage({
                            type: 'LAB_SUCCESS',
                            device: 'ONT BE12000',
                            labName: 'Bài 5-Cấu hình DHCP',
                            message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 5-Cấu hình DHCP trên thiết bị ONT BE12000'
                        }, '*');
                    } catch (err) { }

                    window.location.href = "learning.html?lab=6";
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
                { selector: "#lanConfig", text: "Chọn LAN", placement: "bottom", done: false },
                { selector: "#lanMgrIpv4", text: "Chọn IPv4", placement: "bottom", done: false },
                { selector: "#DHCPBasicCfgBar", text: "Chọn DHCP Server", placement: "top", offsetX: 120, done: false },
                { selector: "label[for='ServerEnable1']", text: "Bước 1: Chọn On của phần DHCP Server", placement: "top", done: false },
                { selector: "[id='sub_IPAddr3:DHCPBasicCfg']", text: "Bước 2: LAN IP Address : 192.168.10.1", placement: "right", done: false },
                { selector: "#sub_SubMask3", text: "Bước 3: Nhập Subnet Mask : 255.255.255.0", placement: "right", done: false },
                { selector: "[id='sub_MinAddress3:DHCPBasicCfg']", text: "Bước 4: DHCP Start IP Address : 192.168.10.2", placement: "right", done: false },
                { selector: "[id='sub_MaxAddress3:DHCPBasicCfg']", text: "Bước 5: DHCP End IP Address : 192.168.10.254", placement: "right", done: false },
                { selector: "#Btn_apply_DHCPBasicCfg", text: "Bước 6: Nhấn Apply để lưu cấu hình DHCP", placement: "top", done: false }
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
