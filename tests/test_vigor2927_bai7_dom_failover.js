const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Đọc nội dung HTML của trang p2_188.html
const p2188Path = path.join(__dirname, '../simulators/sim_vigor2927/src/www/_pages/p2_188.html');
const content = fs.readFileSync(p2188Path, 'utf8');

console.log('================================================================');
console.log('KIỂM THỬ TRỰC TIẾP LOGIC HIỂN THỊ FAILOVER/FAILBACK TRÊN P2_188.HTML');
console.log('================================================================\n');

// 1. Kiểm tra biến khởi tạo iPRWanIf
assert.ok(content.includes('var iPRWanIf = parseInt("3");'), 'iPRWanIf phải là 3 (WAN1) thay vì 0');
console.log('✔ 1. Biến iPRWanIf mặc định đã là 3 (WAN1)');

// 2. Kiểm tra onChgEnable có hỗ trợ multiwanWanIf
assert.ok(content.includes('if(multiwan&&f.interfaceType&&f.interfaceType.value=="WAN")var idx1=bg.getVleFromElmt(f.multiwanWanIf,0)||3;'),
  'onChgEnable phải đọc interface WAN từ multiwanWanIf');
console.log('✔ 2. Hàm onChgEnable đã đọc cổng WAN từ multiwanWanIf');

// 3. Kiểm tra changeMultiwanIf đồng bộ và kích hoạt lại WAN
assert.ok(content.includes('f.iPRWanIf1.value=self.value;if(f.iPREnable&&f.iPREnable.checked)onChgWANInterfaceForAutoAndNAT(self.value);'),
  'changeMultiwanIf phải đồng bộ và cập nhật lại Failover');
console.log('✔ 3. Hàm changeMultiwanIf tự động đồng bộ khi đổi cổng WAN');

// 4. Kiểm tra interfaceUpdate hiển thị autowan khi chọn WAN
assert.ok(content.includes('updateArray.length=0;if(itemType==types[0]){ $scope.showFailoverBlock=true;bg.showElmtByClass(document,"tr","autowan");failoverchk();'),
  'interfaceUpdate phải hiển thị autowan khi chọn WAN');
console.log('✔ 4. Hàm interfaceUpdate đảm bảo autowan luôn hiện khi là WAN');

console.log('\n================================================================');
console.log('TẤT CẢ KIỂM THỬ LOGIC HIỂN THỊ FAILOVER ĐỀU ĐẠT CHUẨN 100%!');
console.log('================================================================');
