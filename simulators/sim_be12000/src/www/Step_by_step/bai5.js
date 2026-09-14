// ============================================================================
// File: bai5.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra thực hành cho Bài 5: Cấu hình địa chỉ IP LAN trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    if (labId === '6') {

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
                // Nhờ vậy vòng lặp không còn nằm chờ để "nuốt" mất dữ liệu học viên nhập lần đầu.
                if (el.value !== "") el.value = "";
                clearedFields[key] = true;
            });
        }, 200);

        // ====================================================================
        // PHẦN 1: KIỂM TRA ĐIỀU KIỆN (VALIDATION) KHI NHẤN APPLY
        // ====================================================================
        document.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'Btn_apply_DHCPBasicCfg') {
                var errors = [];

                var getIP = function (prefix, suffix) {
                    var ipParts = [];
                    for (var i = 0; i < 4; i++) {
                        var el = document.getElementById(prefix + i + (suffix || ""));
                        ipParts.push(el ? el.value.trim() : "");
                    }
                    return ipParts.join(".");
                };

                var isIPEmpty = function (prefix, suffix) {
                    var empty = true;
                    for (var i = 0; i < 4; i++) {
                        var el = document.getElementById(prefix + i + (suffix || ""));
                        if (el && el.value.trim() !== "") {
                            empty = false;
                        }
                    }
                    return empty;
                };

                // 1. DHCP Server
                var dhcpServerOn = document.getElementById("ServerEnable1");
                if (dhcpServerOn && !dhcpServerOn.checked) {
                    errors.push("- Hàng 'DHCP Server:': Khuyến nghị giá trị đúng là 'On'.");
                }

                // 2. LAN IP Address
                if (getIP("sub_IPAddr", ":DHCPBasicCfg") !== "192.168.1.1") {
                    errors.push("- Hàng 'LAN IP Address:': Khuyến nghị giá trị đúng là '192.168.1.1'.");
                }

                // 3. Subnet Mask
                if (getIP("sub_SubMask") !== "255.255.255.0") {
                    errors.push("- Hàng 'Subnet Mask:': Khuyến nghị giá trị đúng là '255.255.255.0'.");
                }

                // 4. DHCP Start IP Address
                if (getIP("sub_MinAddress", ":DHCPBasicCfg") !== "192.168.1.2") {
                    errors.push("- Hàng 'DHCP Start IP Address:': Khuyến nghị giá trị đúng là '192.168.1.2'.");
                }

                // 5. DHCP End IP Address
                if (getIP("sub_MaxAddress", ":DHCPBasicCfg") !== "192.168.1.254") {
                    errors.push("- Hàng 'DHCP End IP Address:': Khuyến nghị giá trị đúng là '192.168.1.254'.");
                }

                // 6. ISP DNS
                var ispDnsOff = document.getElementById("DnsServerSource0");
                if (ispDnsOff && !ispDnsOff.checked) {
                    errors.push("- Hàng 'ISP DNS:': Khuyến nghị giá trị đúng là 'Off'.");
                }

                // 7. Primary DNS
                if (!isIPEmpty("sub_DNSServer1")) {
                    errors.push("- Hàng 'Primary DNS:': Khuyến nghị giá trị đúng là 'Rỗng'.");
                }

                // 8. Secondary DNS
                if (!isIPEmpty("sub_DNSServer2")) {
                    errors.push("- Hàng 'Secondary DNS:': Khuyến nghị giá trị đúng là 'Rỗng'.");
                }

                // 9. Lease Time Mode
                var leaseMode = document.getElementById("LeaseTimeMode");
                if (leaseMode && leaseMode.value !== "selfDefine") {
                    errors.push("- Hàng 'Lease Time Mode': Khuyến nghị giá trị đúng là 'Custom'.");
                }

                // 10. Custom Lease Time
                var leaseTime = document.getElementById("LeaseTimeSelfDefine");
                if (leaseTime && leaseTime.value.trim() !== "86400") {
                    errors.push("- Hàng 'Custom Lease Time:': Khuyến nghị giá trị đúng là '86400'.");
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

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình IP LAN trên thiết bị ONT BE12000 ");

                    try {
                        window.top.postMessage({
                            type: 'LAB_SUCCESS',
                            device: 'ONT BE12000',
                            labName: 'Bài 5-Cấu hình địa chỉ IP LAN',
                            message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 5-Cấu hình địa chỉ IP LAN trên thiết bị ONT BE12000'
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
                { selector: "[id='sub_IPAddr3:DHCPBasicCfg']", text: "Bước 2: LAN IPAddress : 192.168.1.1", placement: "right", done: false },
                { selector: "#sub_SubMask3", text: "Bước 3: Nhập Subnet Mask : 255.255.255.0", placement: "right", done: false },
                { selector: "[id='sub_MinAddress3:DHCPBasicCfg']", text: "Bước 4: DHCP Start IP Address : 192.168.1.2", placement: "right", done: false },
                { selector: "[id='sub_MaxAddress3:DHCPBasicCfg']", text: "Bước 5: DHCP End IP Address : 192.168.1.254", placement: "right", done: false },
                { selector: "#Btn_apply_DHCPBasicCfg", text: "Bước 6: Nhấn Apply để lưu cấu hình", placement: "top", done: false }
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
