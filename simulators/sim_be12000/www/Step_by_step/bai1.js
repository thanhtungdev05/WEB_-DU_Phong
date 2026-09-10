// ============================================================================
// File: bai1.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra cho Bài 1: Cấu hình PPPoE (WAN) trên BE12000
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    if (labId === '1') {

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var selectors = [
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
            if (e.target && e.target.matches("[id^='Btn_apply_internet']")) {
                var errors = [];

                var getVal = function (idPrefix) {
                    var el = document.querySelector("[id^='" + idPrefix + "']");
                    return el ? el.value : "";
                };

                var getRadioChecked = function (namePrefix) {
                    var el = document.querySelector("input[name^='" + namePrefix + "']:checked");
                    return el ? el.value : "";
                };

                if (getVal("WANCName") !== "") errors.push("Hàng \"Connection Name:\" giá trị đúng là Rỗng, khuyến nghị giá trị đúng Rỗng.");
                if (getVal("mode") !== "route") errors.push("Hàng \"Type:\" giá trị đúng là \"Routing\", khuyến nghị giá trị đúng là \"Routing\".");
                if (getVal("ServList") !== "1") errors.push("Hàng \"Service List:\" giá trị đúng là \"INTERNET\", khuyến nghị giá trị đúng là \"INTERNET\".");
                if (getVal("MTU") !== "1492") errors.push("Hàng \"MTU:\" giá trị đúng là \"1492\", khuyến nghị giá trị đúng là \"1492\".");
                if (getVal("linkMode") !== "PPP") errors.push("Hàng \"Link Type:\" giá trị đúng là PPP, khuyến nghị giá trị đúng là PPP.");
                if (getVal("TransType") !== "PPPoE") errors.push("Hàng \"PPP Transfer Type:\" giá trị đúng là PPPoE, khuyến nghị giá trị đúng là PPPoE.");
                if (getVal("UserName") !== "hnfdl-123456-789") errors.push("Hàng \"Username:\" giá trị đúng là hnfdl-123456-789, khuyến nghị giá trị đúng là hnfdl-123456-789.");
                if (getVal("Password") !== "d123456") errors.push("Hàng \"Password\" giá trị đúng là d123456, khuyến nghị giá trị đúng là d123456.");
                if (getVal("AuthType") !== "PAP,CHAP,MS-CHAP") errors.push("Hàng \"Authentication Type:\" giá trị đúng là \"Auto\", khuyến nghị giá trị đúng là Auto.");
                if (getVal("ConnTrigger") !== "AlwaysOn") errors.push("Hàng \"Connection Mode:\" giá trị đúng là \"Always On\", khuyến nghị giá trị đúng là \"Always On\".");
                if (getVal("IpMode") !== "IPv4") errors.push("Hàng \"IP Version:\" giá trị đúng là \"IPv4\", khuyến nghị giá trị đúng là \"IPv4\".");
                if (getRadioChecked("IsNAT") !== "1") errors.push("Hàng \"IP NAT:\" giá trị đúng là On vào ô Checkbox, khuyến nghị On vào ô Checkbox.");
                if (getRadioChecked("VlanEnable") !== "0") errors.push("Hàng \"IP VLAN:\" giá trị đúng là Off vào ô Checkbox, khuyến nghị off vào ô Checkbox.");

                if (errors.length > 0) {
                    alert("BẠN ĐÃ CẤU HÌNH SAI:\n\n" + errors.join("\n"));
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';

                    // Sửa lại tham số "device" trên URL của trang gốc TRƯỚC khi hiện alert, để khi
                    // tracking_api.js reload trang gốc thì quay đúng về trang mặc định của BE12000,
                    // thay vì rơi về thiết bị đang lỡ nằm sẵn trên URL từ trước.
                    // Giá trị phải khớp "id" trong modules/BE12000/config.json (ONT_BE12000).
                    try {
                        const topUrl = new URL(window.top.location.href);
                        topUrl.searchParams.set('device', 'ONT_BE12000');
                        window.top.history.replaceState(null, '', topUrl.toString());
                    } catch (err) { }

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình PPPoE trên thiết bị Internet Hub ONT BE12000");

                    // Tự báo cáo hoàn thành đúng tên thiết bị ra trang gốc (tracking_api.js sẽ ghi
                    // log Firebase đúng tên), thay vì để cơ chế dự phòng "Camera Xuyên Tường" bắt
                    // alert và ghi nhầm tên thiết bị thành "Hệ thống Lab".
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
                    window.location.href = "learning.html?lab=1";
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
                { selector: "[id^='UserName']", text: "Bước 1: Nhập Username: hnfdl-123456-789", placement: "right", done: false },
                { selector: "[id^='Password']", text: "Bước 2: Nhập Password: d123456", placement: "right", done: false },
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
