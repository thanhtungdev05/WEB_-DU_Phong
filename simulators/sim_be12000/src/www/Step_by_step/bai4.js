// ============================================================================
// File: bai4.js
// Mô tả: Kịch bản hướng dẫn và kiểm tra thực hành cho Bài 4: Cấu hình DNS trên BE12000 (dns.html)
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var labId = params.get('lab');
    var mode = params.get('mode');

    var isLab4 = labId === '12' || labId === '4' || labId === 'LAB_BE12000_04' || (window.top && window.top._currentLesson && window.top._currentLesson.id === 'LAB_BE12000_04');

    if (isLab4) {

        // ====================================================================
        // PHẦN 0: XÓA TRẮNG CÁC Ô DỮ LIỆU CÓ SẴN (Cho cả Hướng dẫn & Thực hành)
        // ====================================================================
        var clearedFields = {};
        setInterval(function () {
            var selectors = [
                "#sub_DNSServer10", "#sub_DNSServer11", "#sub_DNSServer12", "#sub_DNSServer13",
                "#sub_DNSServer20", "#sub_DNSServer21", "#sub_DNSServer22", "#sub_DNSServer23"
            ];
            selectors.forEach(function (sel) {
                var el = document.querySelector(sel);
                if (!el) return;
                var key = el.id || sel;
                if (clearedFields[key]) return;                 // ô này đã được xét và xóa trắng thành công

                if (document.activeElement === el) {            // học viên đang nhập dở -> không đụng tới nữa
                    clearedFields[key] = true;
                    return;
                }
                // Chỉ xóa và đánh dấu khi router đã đổ dữ liệu mặc định vào (el.value !== "")
                // Không đánh dấu khi ô còn đang rỗng ("") để tránh race condition trước khi AJAX nạp dữ liệu xong
                if (el.value !== "") {
                    el.value = "";
                    clearedFields[key] = true;
                }
            });
        }, 100);

        // Reset bộ cờ xóa khi học viên chuyển tab/menu để khi form tải lại vẫn được xóa trắng
        document.addEventListener('click', function (e) {
            if (e.target && (e.target.id === 'lanMgrIpv4' || e.target.id === 'DHCPBasicCfgBar' || (e.target.closest && e.target.closest('#DHCPBasicCfgBar')) || e.target.id === 'lanConfig' || e.target.id === 'localnet')) {
                clearedFields = {};
            }
        });

        // ====================================================================
        // PHẦN 1: KIỂM TRA ĐIỀU KIỆN (VALIDATION) KHI NHẤN APPLY
        // ====================================================================
        document.addEventListener('click', function (e) {
            if (e.target && (e.target.id === 'Btn_apply_DHCPBasicCfg' || (e.target.id && e.target.id.startsWith('Btn_apply_DHCPBasicCfg')))) {
                var container = e.target.closest("div[id^='template_DHCPBasicCfg']") || document.querySelector("#template_DHCPBasicCfg") || e.target.closest(".HeadDIV");
                var errors = [];

                var getIP = function (prefix) {
                    var ipParts = [];
                    for (var i = 0; i < 4; i++) {
                        var el = document.getElementById(prefix + i) || (container ? container.querySelector("#" + prefix + i) : null);
                        ipParts.push(el ? el.value.trim() : "");
                    }
                    return ipParts.join(".");
                };

                var dns1 = getIP("sub_DNSServer1");
                var dns2 = getIP("sub_DNSServer2");

                var validDns1 = ["210.245.31.220", "210.245.31.221", "8.8.8.8", "1.1.1.1"];
                var validDns2 = ["8.8.8.8", "8.8.4.4", "210.245.31.221", "210.245.31.220", "1.1.1.1"];

                if (validDns1.indexOf(dns1) === -1) {
                    errors.push("- Hàng 'Primary DNS' (4 octet): Khuyến nghị giá trị đúng là '210.245.31.220' (hoặc '8.8.8.8'). Thực tế: '" + (dns1 || 'Trống') + "'");
                }

                if (validDns2.indexOf(dns2) === -1) {
                    errors.push("- Hàng 'Secondary DNS' (4 octet): Khuyến nghị giá trị đúng là '8.8.8.8' (hoặc '8.8.4.4'). Thực tế: '" + (dns2 || 'Trống') + "'");
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
                                labName: 'Bài 4-Cấu hình DNS',
                                message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 4-Cấu hình DNS trên thiết bị ONT BE12000'
                            }, '*');
                        } catch (err) { }

                        alert("Chúc mừng bạn đã hoàn thành cấu hình DNS! Thông báo lưu thành công đã xuất hiện, hãy bấm nút Nộp bài trên thanh điều hướng để hoàn tất bài học.");
                        return;
                    }

                    var modeText = mode === 'practice' ? 'Thực hành' : 'Hướng dẫn';

                    try {
                        const topUrl = new URL(window.top.location.href);
                        topUrl.searchParams.set('device', 'ONT_BE12000');
                        window.top.history.replaceState(null, '', topUrl.toString());
                    } catch (err) { }

                    alert("Chúc mừng bạn đã hoàn thành bài Lab " + modeText + " Cấu hình DNS trên thiết bị ONT BE12000 ");

                    try {
                        window.top.postMessage({
                            type: 'LAB_SUCCESS',
                            device: 'ONT BE12000',
                            labName: 'Bài 4-Cấu hình DNS',
                            message: 'Hoàn thành Lab ' + (modeText === 'Hướng dẫn' ? 'có hướng dẫn' : 'thực hành') + ' Bài 4-Cấu hình DNS trên thiết bị ONT BE12000'
                        }, '*');
                    } catch (err) { }

                    window.location.href = "learning.html?lab=12";
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
                { selector: "#sub_DNSServer13", text: "Bước 1: Nhập Primary DNS: 210.245.31.220", placement: "right", done: false },
                { selector: "#sub_DNSServer23", text: "Bước 2: Nhập Secondary DNS: 8.8.8.8", placement: "right", done: false },
                { selector: "#Btn_apply_DHCPBasicCfg", text: "Bước 3: Nhấn Apply để lưu cấu hình DNS", placement: "top", done: false }
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
