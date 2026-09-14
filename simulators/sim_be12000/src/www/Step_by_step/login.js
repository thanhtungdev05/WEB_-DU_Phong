document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'guide') {
        // Inject CSS
        var style = document.createElement('style');
        style.innerHTML = `
            .input-wrapper { position: relative; display: inline-block; }
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
                top: 50%;
                left: 100%;
                margin-left: 8px;
                transform: translateY(-50%);
            }
            .guide-tooltip::after {
                content: '';
                position: absolute;
                border: 4px solid transparent;
                right: 100%;
                top: 50%;
                transform: translateY(-50%);
                border-right-color: rgba(220, 38, 38, 0.92);
            }
        `;
        document.head.appendChild(style);

        // Inject tooltips and wrappers
        function addTooltip(inputId, text) {
            var input = document.getElementById(inputId);
            if (input && input.parentElement) {
                // To avoid double wrapping if script runs twice
                if (input.parentElement.classList.contains('input-wrapper')) return;
                
                var wrapper = document.createElement('div');
                wrapper.className = 'input-wrapper';
                input.parentElement.insertBefore(wrapper, input);
                wrapper.appendChild(input);

                var tooltip = document.createElement('div');
                tooltip.className = 'guide-tooltip';
                tooltip.innerText = text;
                wrapper.appendChild(tooltip);
            }
        }

        addTooltip('Frm_Username', 'Nhập admin');
        addTooltip('Frm_Password', 'Nhập admin');
    }
});
