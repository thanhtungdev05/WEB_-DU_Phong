/* Helper dung chung cho cac trang bang: Add / Delete dong nhap lieu (ban gia lap) */
(function(){
  // cac ham dung san xuat 1 o input
  window.cText = function(v,ph){ return '<input type="text" value="'+(v||'')+'" placeholder="'+(ph||'')+'">'; };
  window.cNum  = function(v,ph){ return '<input type="text" value="'+(v||'')+'" placeholder="'+(ph||'')+'" style="max-width:140px">'; };
  window.cMac  = function(v){ return '<input type="text" list="macs" value="'+(v||'')+'" placeholder="xx:xx:xx:xx:xx:xx">'; };
  window.cSel  = function(v,opts){ return '<select>'+opts.map(function(o){return '<option '+(o===v?'selected':'')+'>'+o+'</option>';}).join('')+'</select>'; };
  window.cChk  = function(v){ return '<label class="sw"><input type="checkbox" '+(v?'checked':'')+'><span class="slider"></span></label>'; };
  window.cTime = function(v){ return '<input type="text" value="'+(v||'00:00')+'" placeholder="hh:mm" style="max-width:110px">'; };
  window.cDays = function(v){ var d=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return '<div style="display:flex;flex-wrap:wrap;gap:2px 10px;min-width:230px">'+d.map(function(x){return '<label style="white-space:nowrap;font-size:12px"><input type="checkbox"> '+x+'</label>';}).join('')+'</div>'; };

  // khoi tao 1 bang: cols = mang ham () -> HTML o ; span = so cot (gom Operate)
  window.simTable = function(cols, span){
    window.simAdd = function(vals){
      vals = vals || [];
      var tb = document.getElementById('tb');
      var e = document.getElementById('empty'); if(e) e.remove();
      var tr = document.createElement('tr');
      var html = cols.map(function(fn,i){ return '<td>'+fn(vals[i])+'</td>'; }).join('');
      html += '<td><button type="button" class="btn undo btn-sm" onclick="simDel(this)">Delete</button></td>';
      tr.innerHTML = html;
      tb.appendChild(tr);
    };
    window.simDel = function(b){
      b.closest('tr').remove();
      var tb = document.getElementById('tb');
      if(!tb.querySelector('tr')) tb.innerHTML = '<tr id="empty"><td colspan="'+span+'" class="empty">No data</td></tr>';
    };
  };
  window.simApply = function(){
    var n = document.querySelectorAll('#tb tr').length - (document.getElementById('empty')?1:0);
    console.log('[simTable] Da luu '+n+' muc.');
  };
})();
