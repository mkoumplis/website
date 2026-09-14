/* Online booking: pick a day/slot inside the clinic hours, then send it to the
   appointment calendar inbox as a pre-filled email for the clinic to confirm. */
(function(){
  "use strict";
  var root = document.getElementById('bookingCard');
  if(!root) return;

  var OPEN_DAYS = [1,2,4,5];          // Δευ, Τρί, Πέμ, Παρ
  var START = 17*60, END = 21*60, STEP = 30;
  var EMAIL = 'miltoskoumplis@gmail.com';
  var DAYS = ['Κυρ','Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ'];
  var DAYS_FULL = ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];
  var MONTHS = ['Ιαν','Φεβ','Μαρ','Απρ','Μαΐ','Ιουν','Ιουλ','Αυγ','Σεπ','Οκτ','Νοε','Δεκ'];

  var daysEl = document.getElementById('bkDays');
  var slotsEl = document.getElementById('bkSlots');
  var summary = document.getElementById('bkSummary');
  var errEl = document.getElementById('bkError');
  var doneEl = document.getElementById('bkDone');
  var form = root.querySelector('form');
  var sel = {date:null, time:null};

  function pad(n){ return (n<10?'0':'')+n; }
  function fmt(m){ return pad(Math.floor(m/60))+':'+pad(m%60); }
  function nowMin(){ var n = new Date(); return n.getHours()*60+n.getMinutes(); }
  function isToday(d){ return d.toDateString() === new Date().toDateString(); }
  function dayLabel(d){ return DAYS_FULL[d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
  function label(){ return dayLabel(sel.date)+(sel.time!=null ? ', '+fmt(sel.time) : ''); }

  function press(container, btn){
    container.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-pressed', b===btn ? 'true' : 'false'); });
  }

  function renderSlots(){
    slotsEl.innerHTML = '';
    for(var m=START; m<END; m+=STEP){
      (function(m){
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'bk-slot'; b.textContent = fmt(m);
        b.setAttribute('aria-pressed','false');
        if(isToday(sel.date) && m <= nowMin()) b.disabled = true;
        b.addEventListener('click', function(){ sel.time = m; press(slotsEl, b); update(); });
        slotsEl.appendChild(b);
      })(m);
    }
  }

  function pickDay(d, btn){
    sel.date = d; sel.time = null;
    press(daysEl, btn); renderSlots(); update();
  }

  function update(){
    summary.textContent = sel.time!=null ? 'Επιλογή: '+label() : 'Επιλέξτε ώρα για '+dayLabel(sel.date)+'.';
    errEl.hidden = true;
  }

  function fail(msg, field){
    errEl.textContent = msg; errEl.hidden = false;
    if(field) field.focus();
  }

  // Next 12 open days (today only if a slot is still ahead)
  var d = new Date(); d.setHours(0,0,0,0);
  var first = true;
  for(var count=0; count<12; d.setDate(d.getDate()+1)){
    if(OPEN_DAYS.indexOf(d.getDay()) < 0) continue;
    if(isToday(d) && nowMin() >= END-STEP) continue;
    (function(day){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-day';
      b.setAttribute('aria-label', dayLabel(day));
      b.innerHTML = '<small>'+DAYS[day.getDay()]+'</small><strong>'+day.getDate()+'</strong><small>'+MONTHS[day.getMonth()]+'</small>';
      b.addEventListener('click', function(){ pickDay(day, b); });
      daysEl.appendChild(b);
      if(first){ pickDay(day, b); first = false; }
    })(new Date(d));
    count++;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var f = form.elements;
    if(sel.time == null) return fail('Επιλέξτε ώρα ραντεβού.');
    if(!f.name.value.trim()) return fail('Συμπληρώστε το ονοματεπώνυμό σας.', f.name);
    if(f.phone.value.replace(/\D/g,'').length < 10) return fail('Συμπληρώστε ένα έγκυρο τηλέφωνο.', f.phone);
    if(!f.consent.checked) return fail('Απαιτείται η αποδοχή της Πολιτικής Απορρήτου.', f.consent);

    var name = f.name.value.trim();
    var subject = 'Online ραντεβού: '+label()+' – '+name;
    var body = 'Νέο online ραντεβού από την ιστοσελίδα\n\n'+
      'Ημέρα & ώρα: '+label()+'\n'+
      'Ονοματεπώνυμο: '+name+'\n'+
      'Τηλέφωνο: '+f.phone.value.trim()+'\n'+
      'Email: '+(f.email.value.trim() || '—')+'\n'+
      'Λόγος επίσκεψης: '+f.reason.value+'\n';
    window.location.href = 'mailto:'+EMAIL+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    doneEl.querySelector('b').textContent = label();
    doneEl.hidden = false;
  });
})();
