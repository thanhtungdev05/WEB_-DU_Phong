// ============================================================================
// File: bai6.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra thực hành cho Bài 6: Cấu hình Port Forwarding trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    if (labId === '13') {

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var selectors = [
                "[id='Alias:0']",
                "[id='sub_RemoteHost3:0']",
                "[id='sub_RemoteHostEndRange3:0']",
                "[id='InternalClient:0']",
                "[id='ExternalPort:0']",
                "[id='ExternalPortEndRange:0']",
                "[id='InternalPort:0']",
                "[id='InternalPortEndRange:0']"
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
            if (e.target && e.target.id && e.target.id.startsWith('Btn_apply_PortForwarding')) {
                var container = e.target.closest("div[id^='template_PortForwarding']");
                if (!container) return;

                var suffix = container.id.split("_").pop(); // Lấy số index "0", "1", ...

                var errors = [];
                var getVal = function (idName) {
                    var el = container.querySelector("[id='" + idName + ":" + suffix + "']");
                    return el ? el.value.trim() : "";
                };

                var getIP = function (prefix) {
                    var ipParts = [];
                    for (var i = 0; i < 4; i++) {
                        var el = container.querySelector("[id='" + prefix + i + ":" + suffix + "']");
                        ipParts.push(el ? el.value.trim() : "");
                    }
                    return ipParts.join(".");
                };

                var name = getVal("Alias");
                var protocol = getVal("Protocol");
                var wanConn = getVal("S_Interface");
                var wanHost = getIP("sub_RemoteHost");
                var wanHostEnd = getIP("sub_RemoteHostEndRange");
                var lanHost = getVal("InternalClient");
                var wanPort = getVal("ExternalPort");
                var wanPortEnd = getVal("ExternalPortEndRange");
                var lanPort = getVal("InternalPort");
                var lanPortEnd = getVal("InternalPortEndRange");

                // 1. Name
                if (name !== "NAT FPT") {
                    errors.push("- Hàng 'Name:': Khuyến nghị giá trị đúng là 'NAT FPT'.");
                }

                // 2. Protocol
                var validProtocols = ["TCP", "UDP", "TCP&UDP"];
                if (validProtocols.indexOf(protocol) === -1) {
                    errors.push("- Hàng 'Protocol:': Khuyến nghị giá trị đúng là 'TCP, UDP hoặc TCP/UDP'.");
                }

                // 3. WAN Connection
                if (wanConn !== "WANAll") {
                    errors.push("- Hàng 'WAN Connection:': Khuyến nghị giá trị đúng là 'Auto'.");
                }

                // 4. WAN Host IP Address
                if (wanHost !== "192.168.1.1" || wanHostEnd !== "192.168.1.1") {
                    errors.push("- Hàng 'WAN Host IP Address:': Khuyến nghị giá trị đúng là '192.168.1.1'.");
                }

                // 5. LAN Host
                if (lanHost !== "192.168.1.100") {
                    errors.push("- Hàng 'LAN Host:': Khuyến nghị giá trị đúng là '192.168.1.100'.");
                }

                // 6. WAN Port
                if (wanPort !== "8080" || wanPortEnd !== "8080") {
                    errors.push("- Hàng 'WAN Port:': Khuyến nghị giá trị đúng là '8080'.");
                }

                // 7. LAN Host Port
                if (lanPort !== "8080" || lanPortEnd !== "8080") {
                    errors.push("- Hàng 'LAN Host Port:': Khuyến nghị giá trị đúng là '8080'.");
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

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình Port Forwarding trên thiết bị ONT BE12000 ");

                    try {
                        window.top.postMessage({
                            type: 'LAB_SUCCESS',
                            device: 'ONT BE12000',
                            labName: 'Bài 6-Cấu hình Port Forwarding',
                            message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 6-Cấu hình Port Forwarding trên thiết bị ONT BE12000'
                        }, '*');
                    } catch (err) { }

                    window.location.href = "learning.html?lab=13";
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
                { selector: "#internet", text: "Truy cập: Internet", placement: "bottom", done: false },
                { selector: "#security", text: "Chọn Security", placement: "bottom", done: false },
                { selector: "#portForwarding", text: "Chọn Port Forwarding", placement: "bottom", done: false },
                { selector: "[id='Alias:0']", text: "Bước 1: Nhập Name: NAT FPT", placement: "right", done: false },
                { selector: "[id='Protocol:0']", text: "Bước 2: Chọn Protocol: TCP, UDP hoặc TCP/UDP", placement: "right", done: false },
                { selector: "[id='sub_RemoteHostEndRange3:0']", text: "Bước 3: Nhập WAN Host IP Address: 192.168.1.1 ", placement: "right", done: false },
                { selector: "[id='InternalClient:0']", text: "Bước 4: Nhập LAN Host: 192.168.1.100", placement: "right", done: false },
                { selector: "[id='ExternalPortEndRange:0']", text: "Bước 5: Nhập WAN Port: 8080 (chỉ vào ô cuối cùng)", placement: "right", done: false },
                { selector: "[id='InternalPortEndRange:0']", text: "Bước 7: Nhập LAN Host Port: 8080 (chỉ vào ô cuối cùng)", placement: "right", done: false },
                { selector: "[id='Btn_apply_PortForwarding:0']", text: "Bước 8: Nhấn Apply để lưu cấu hình", placement: "top", done: false }
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
