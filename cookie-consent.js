/* =====================================================================
   CLINICBRAIN — Cookie Consent (shared, self-contained)
   Works on both the simple (root) and premium (premium/) templates.
   - Injects its own styles + banner, no dependencies.
   - Stores choice in localStorage ("clinic_cookie_consent").
   - Categories: necessary (locked) / functional / statistics / marketing.
   - Gates third-party embeds: any element with data-consent-src is loaded
     only after consent for its data-consent-category (default "functional");
     until then a placeholder with an enable button is shown.
   - Re-open settings anytime via a link with [data-cookie-settings] or
     window.openCookieSettings().
   Links assume a sibling "legal/" folder (true for root AND premium/).
   ===================================================================== */
(function(){
  "use strict";
  var KEY = "clinic_cookie_consent", VER = 1;
  var CATS = [
    {id:"functional", label:"Λειτουργικά", desc:"Απομνημόνευση προτιμήσεων & ενσωματώσεις (π.χ. χάρτης)."},
    {id:"statistics", label:"Στατιστικά", desc:"Ανώνυμη μέτρηση επισκεψιμότητας."},
    {id:"marketing",  label:"Marketing",  desc:"Στοχευμένο περιεχόμενο / διαφήμιση."}
  ];

  function read(){
    try{ var v = JSON.parse(localStorage.getItem(KEY)); return (v && v._v===VER) ? v : null; }
    catch(e){ return null; }
  }
  function save(obj){
    obj._v = VER; obj.ts = new Date().toISOString();
    try{ localStorage.setItem(KEY, JSON.stringify(obj)); }catch(e){}
  }

  /* ---- accent: match the page theme if available ---- */
  function accent(){
    var cs = getComputedStyle(document.documentElement);
    var a = (cs.getPropertyValue('--accent') || cs.getPropertyValue('--primary') || '').trim();
    return a || '#0f766e';
  }

  /* ---- styles ---- */
  function injectStyles(){
    if(document.getElementById('cc-styles')) return;
    var ac = accent();
    var css = ''+
    '.cc-root,.cc-root *{box-sizing:border-box}'+
    '.cc-overlay{position:fixed;inset:0;background:rgba(15,15,15,.45);z-index:99998;opacity:0;pointer-events:none;transition:opacity .3s}'+
    '.cc-root.open .cc-overlay{opacity:1;pointer-events:auto}'+
    '.cc-card{position:fixed;z-index:99999;left:50%;bottom:22px;transform:translateX(-50%) translateY(20px);'+
      'width:min(620px,calc(100% - 28px));background:#fff;color:#1c1c1c;border-radius:16px;'+
      'box-shadow:0 24px 70px rgba(0,0,0,.28);padding:24px 24px 20px;opacity:0;pointer-events:none;'+
      'transition:opacity .35s,transform .35s;font-family:system-ui,"Segoe UI",sans-serif;line-height:1.55;user-select:none}'+
    '.cc-root.open .cc-card{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}'+
    '.cc-card h2{margin:0 0 8px;font-size:18px;font-weight:700}'+
    '.cc-card p{margin:0 0 16px;font-size:13.5px;color:#444}'+
    '.cc-card a{color:'+ac+';text-decoration:underline;text-underline-offset:2px}'+
    '.cc-actions{display:flex;flex-wrap:wrap;gap:10px}'+
    '.cc-btn{flex:1 1 auto;min-width:130px;cursor:pointer;border-radius:999px;padding:12px 18px;font-size:13.5px;'+
      'font-weight:700;border:1px solid '+ac+';transition:.2s;font-family:inherit}'+
    '.cc-btn.primary{background:'+ac+';color:#fff}.cc-btn.primary:hover{filter:brightness(.92)}'+
    '.cc-btn.ghost{background:#fff;color:'+ac+'}.cc-btn.ghost:hover{background:#f3f3f3}'+
    '.cc-link{background:none;border:none;color:#666;text-decoration:underline;cursor:pointer;font-size:12.5px;padding:6px 2px;font-family:inherit}'+
    '.cc-prefs{display:none;margin:4px 0 16px;border-top:1px solid #eee;padding-top:12px}'+
    '.cc-root.prefs .cc-prefs{display:block}'+
    '.cc-row{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f0f0f0}'+
    '.cc-row:last-child{border-bottom:none}'+
    '.cc-row .t{flex:1}.cc-row .t b{display:block;font-size:13.5px}.cc-row .t span{font-size:12px;color:#666}'+
    '.cc-sw{position:relative;width:42px;height:24px;flex:none;margin-top:2px}'+
    '.cc-sw input{opacity:0;width:0;height:0}'+
    '.cc-sl{position:absolute;inset:0;background:#ccc;border-radius:999px;transition:.2s;cursor:pointer}'+
    '.cc-sl::before{content:"";position:absolute;height:18px;width:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}'+
    '.cc-sw input:checked + .cc-sl{background:'+ac+'}'+
    '.cc-sw input:checked + .cc-sl::before{transform:translateX(18px)}'+
    '.cc-sw input:disabled + .cc-sl{background:'+ac+';opacity:.55;cursor:not-allowed}'+
    '.cc-ph{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;'+
      'background:repeating-linear-gradient(45deg,#f4f4f4,#f4f4f4 12px,#ececec 12px,#ececec 24px);color:#444;'+
      'font-family:system-ui,sans-serif;z-index:5}'+
    '.cc-ph p{margin:0 0 12px;font-size:13px;max-width:280px}'+
    '.cc-ph-btn{cursor:pointer;border:none;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:700;background:'+ac+';color:#fff;font-family:inherit}'+
    '@media (max-width:560px){.cc-btn{flex:1 1 100%}}';
    var s = document.createElement('style'); s.id='cc-styles'; s.textContent=css;
    document.head.appendChild(s);
  }

  /* ---- third-party gating ---- */
  function activate(el){
    var src = el.getAttribute('data-consent-src');
    if(src) el.setAttribute('src', src);
    el.removeAttribute('data-consent-src');
    var p = el.parentNode, ph = p && p.querySelector('.cc-ph');
    if(ph) ph.remove();
  }
  function placeholder(el){
    var p = el.parentNode; if(!p || p.querySelector('.cc-ph')) return;
    if(getComputedStyle(p).position === 'static') p.style.position='relative';
    var d = document.createElement('div'); d.className='cc-ph';
    d.innerHTML = '<div><p>Το περιεχόμενο αυτό (π.χ. Google Maps) απαιτεί cookies τρίτων.</p>'+
                  '<button type="button" class="cc-ph-btn">Ενεργοποίηση</button></div>';
    d.querySelector('.cc-ph-btn').addEventListener('click', openSettings);
    p.appendChild(d);
  }
  function applyGating(){
    var c = read();
    document.querySelectorAll('[data-consent-src]').forEach(function(el){
      var cat = el.getAttribute('data-consent-category') || 'functional';
      if(c && c[cat]) activate(el); else placeholder(el);
    });
  }

  /* ---- banner ---- */
  var root, prefInputs = {};
  function build(){
    injectStyles();
    root = document.createElement('div'); root.className='cc-root';
    var rows = CATS.map(function(c){
      return '<div class="cc-row"><div class="t"><b>'+c.label+'</b><span>'+c.desc+'</span></div>'+
        '<label class="cc-sw"><input type="checkbox" data-cat="'+c.id+'"><span class="cc-sl"></span></label></div>';
    }).join('');
    root.innerHTML =
      '<div class="cc-overlay" data-cc-close></div>'+
      '<div class="cc-card" role="dialog" aria-label="Ρυθμίσεις cookies">'+
        '<h2>🍪 Σεβόμαστε το απόρρητό σας</h2>'+
        '<p>Χρησιμοποιούμε αναγκαία cookies για τη λειτουργία του ιστοτόπου και — με τη συγκατάθεσή σας — '+
          'cookies για λειτουργικότητα, στατιστικά και marketing. Δείτε την '+
          '<a href="legal/cookies.html">Πολιτική Cookies</a> και την '+
          '<a href="legal/privacy.html">Πολιτική Απορρήτου</a>.</p>'+
        '<div class="cc-prefs">'+
          '<div class="cc-row"><div class="t"><b>Αναγκαία</b><span>Πάντα ενεργά — απαραίτητα για τη βασική λειτουργία.</span></div>'+
            '<label class="cc-sw"><input type="checkbox" checked disabled><span class="cc-sl"></span></label></div>'+
          rows+
        '</div>'+
        '<div class="cc-actions">'+
          '<button type="button" class="cc-btn primary" data-cc="all">Αποδοχή όλων</button>'+
          '<button type="button" class="cc-btn ghost" data-cc="reject">Απόρριψη</button>'+
          '<button type="button" class="cc-btn ghost" data-cc="save" style="display:none">Αποθήκευση επιλογών</button>'+
        '</div>'+
        '<div style="text-align:center;margin-top:8px"><button type="button" class="cc-link" data-cc="toggle">Προσαρμογή επιλογών</button></div>'+
      '</div>';
    document.body.appendChild(root);

    CATS.forEach(function(c){ prefInputs[c.id] = root.querySelector('input[data-cat="'+c.id+'"]'); });

    root.querySelector('[data-cc="all"]').addEventListener('click', function(){ decide(true); });
    root.querySelector('[data-cc="reject"]').addEventListener('click', function(){ decide(false); });
    root.querySelector('[data-cc="save"]').addEventListener('click', saveCustom);
    root.querySelector('[data-cc="toggle"]').addEventListener('click', togglePrefs);
    root.querySelector('[data-cc-close]').addEventListener('click', function(){ if(read()) close(); });
  }

  function open(){ root.classList.add('open'); }
  function close(){ root.classList.remove('open'); root.classList.remove('prefs'); syncToggleUI(false); }
  function togglePrefs(){
    var on = !root.classList.contains('prefs');
    root.classList.toggle('prefs', on); syncToggleUI(on);
  }
  function syncToggleUI(prefsOn){
    root.querySelector('[data-cc="all"]').style.display = '';
    root.querySelector('[data-cc="reject"]').style.display = prefsOn ? 'none' : '';
    root.querySelector('[data-cc="save"]').style.display = prefsOn ? '' : 'none';
    root.querySelector('[data-cc="toggle"]').textContent = prefsOn ? 'Απόκρυψη επιλογών' : 'Προσαρμογή επιλογών';
  }

  function decide(all){
    var o = {necessary:true};
    CATS.forEach(function(c){ o[c.id] = !!all; });
    save(o); close(); applyGating();
  }
  function saveCustom(){
    var o = {necessary:true};
    CATS.forEach(function(c){ o[c.id] = !!(prefInputs[c.id] && prefInputs[c.id].checked); });
    save(o); close(); applyGating();
  }

  function openSettings(e){
    if(e && e.preventDefault) e.preventDefault();
    var c = read();
    CATS.forEach(function(cat){ if(prefInputs[cat.id]) prefInputs[cat.id].checked = !!(c && c[cat.id]); });
    root.classList.add('prefs'); syncToggleUI(true); open();
  }
  window.openCookieSettings = openSettings;

  /* ---- init ---- */
  function init(){
    build();
    document.querySelectorAll('[data-cookie-settings]').forEach(function(a){
      a.addEventListener('click', openSettings);
    });
    applyGating();
    if(!read()) open();           // first visit → show banner
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
