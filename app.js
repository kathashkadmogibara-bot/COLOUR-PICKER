/* MOGIBARA COLOR PICKER — color engine + page logic */

/* ---------- conversions ---------- */
function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }

function hsvToRgb(h, s, v){
  h = ((h % 360) + 360) % 360; s = clamp(s,0,100)/100; v = clamp(v,0,100)/100;
  const c = v*s, x = c*(1-Math.abs((h/60)%2-1)), m = v-c;
  let r=0,g=0,b=0;
  if (h<60){r=c;g=x;b=0;} else if (h<120){r=x;g=c;b=0;}
  else if (h<180){r=0;g=c;b=x;} else if (h<240){r=0;g=x;b=c;}
  else if (h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
}
function rgbToHsv(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0;
  if (d!==0){
    if (max===r) h = 60*(((g-b)/d)%6);
    else if (max===g) h = 60*((b-r)/d+2);
    else h = 60*((r-g)/d+4);
  }
  if (h<0) h+=360;
  const s = max===0 ? 0 : d/max;
  return { h: Math.round(h), s: Math.round(s*100), v: Math.round(max*100) };
}
function rgbToHex(r,g,b){
  const h = n => clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
  return '#' + h(r)+h(g)+h(b);
}
function hexToRgb(hex){
  hex = (hex||'').trim().replace(/^#/,'');
  if (hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const num = parseInt(hex,16);
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function rgbToCmyk(r,g,b){
  r/=255; g/=255; b/=255;
  const k = 1-Math.max(r,g,b);
  if (k>=1) return { c:0,m:0,y:0,k:100 };
  const c = (1-r-k)/(1-k), m = (1-g-k)/(1-k), y = (1-b-k)/(1-k);
  return { c:Math.round(c*100), m:Math.round(m*100), y:Math.round(y*100), k:Math.round(k*100) };
}
function cmykToRgb(c,m,y,k){
  c/=100; m/=100; y/=100; k/=100;
  return { r:Math.round(255*(1-c)*(1-k)), g:Math.round(255*(1-m)*(1-k)), b:Math.round(255*(1-y)*(1-k)) };
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0; const l=(max+min)/2; const d = max-min;
  if (d!==0){
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    if (max===r) h = 60*(((g-b)/d)%6);
    else if (max===g) h = 60*((b-r)/d+2);
    else h = 60*((r-g)/d+4);
  }
  if (h<0) h+=360;
  return { h:Math.round(h), s:Math.round(s*100), l:Math.round(l*100) };
}
function hslToRgb(h,s,l){
  h=((h%360)+360)%360; s=clamp(s,0,100)/100; l=clamp(l,0,100)/100;
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  let r=0,g=0,b=0;
  if (h<60){r=c;g=x;b=0;} else if (h<120){r=x;g=c;b=0;}
  else if (h<180){r=0;g=c;b=x;} else if (h<240){r=0;g=x;b=c;}
  else if (h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  return { r:Math.round((r+m)*255), g:Math.round((g+m)*255), b:Math.round((b+m)*255) };
}

/* ---------- named colours (used to find the nearest colour name) ---------- */
const NAMED_COLORS = [
["Black","#000000"],["White","#FFFFFF"],["Red","#FF0000"],["Lime","#00FF00"],["Blue","#0000FF"],
["Yellow","#FFFF00"],["Cyan","#00FFFF"],["Magenta","#FF00FF"],["Silver","#C0C0C0"],["Gray","#808080"],
["Maroon","#800000"],["Olive","#808000"],["Green","#008000"],["Purple","#800080"],["Teal","#008080"],
["Navy","#000080"],["Orange","#FFA500"],["Pink","#FFC0CB"],["Hot Pink","#FF69B4"],["Deep Pink","#FF1493"],
["Crimson","#DC143C"],["Firebrick","#B22222"],["Dark Red","#8B0000"],["Indian Red","#CD5C5C"],
["Light Coral","#F08080"],["Salmon","#FA8072"],["Dark Salmon","#E9967A"],["Light Salmon","#FFA07A"],
["Tomato","#FF6347"],["Coral","#FF7F50"],["Orange Red","#FF4500"],["Dark Orange","#FF8C00"],
["Gold","#FFD700"],["Khaki","#F0E68C"],["Dark Khaki","#BDB76B"],["Peach Puff","#FFDAB9"],
["Moccasin","#FFE4B5"],["Sandy Brown","#F4A460"],["Goldenrod","#DAA520"],["Dark Goldenrod","#B8860B"],
["Chocolate","#D2691E"],["Peru","#CD853F"],["Sienna","#A0522D"],["Brown","#A52A2A"],["Saddle Brown","#8B4513"],
["Tan","#D2B48C"],["Wheat","#F5DEB3"],["Beige","#F5F5DC"],["Ivory","#FFFFF0"],
["Honeydew","#F0FFF0"],["Mint Cream","#F5FFFA"],["Azure","#F0FFFF"],["Alice Blue","#F0F8FF"],
["Lavender","#E6E6FA"],["Lavender Blush","#FFF0F5"],["Misty Rose","#FFE4E1"],["Snow","#FFFAFA"],
["Linen","#FAF0E6"],["Old Lace","#FDF5E6"],["Seashell","#FFF5EE"],["Cornsilk","#FFF8DC"],
["Lemon Chiffon","#FFFACD"],["Light Yellow","#FFFFE0"],["Light Goldenrod","#FAFAD2"],
["Pale Goldenrod","#EEE8AA"],["Yellow Green","#9ACD32"],["Chartreuse","#7FFF00"],["Lawn Green","#7CFC00"],
["Green Yellow","#ADFF2F"],["Spring Green","#00FF7F"],["Medium Spring Green","#00FA9A"],
["Light Green","#90EE90"],["Pale Green","#98FB98"],["Dark Sea Green","#8FBC8F"],["Sea Green","#2E8B57"],
["Medium Sea Green","#3CB371"],["Forest Green","#228B22"],["Dark Green","#006400"],["Lime Green","#32CD32"],
["Olive Drab","#6B8E23"],["Dark Olive Green","#556B2F"],["Medium Aquamarine","#66CDAA"],
["Aquamarine","#7FFFD4"],["Turquoise","#40E0D0"],["Medium Turquoise","#48D1CC"],["Dark Turquoise","#00CED1"],
["Light Sea Green","#20B2AA"],["Cadet Blue","#5F9EA0"],["Dark Cyan","#008B8B"],["Powder Blue","#B0E0E6"],
["Light Blue","#ADD8E6"],["Sky Blue","#87CEEB"],["Light Sky Blue","#87CEFA"],["Deep Sky Blue","#00BFFF"],
["Dodger Blue","#1E90FF"],["Cornflower Blue","#6495ED"],["Steel Blue","#4682B4"],["Royal Blue","#4169E1"],
["Medium Blue","#0000CD"],["Dark Blue","#00008B"],["Midnight Blue","#191970"],["Slate Blue","#6A5ACD"],
["Medium Slate Blue","#7B68EE"],["Dark Slate Blue","#483D8B"],["Light Slate Gray","#778899"],
["Slate Gray","#708090"],["Dark Slate Gray","#2F4F4F"],["Light Steel Blue","#B0C4DE"],
["Thistle","#D8BFD8"],["Plum","#DDA0DD"],["Violet","#EE82EE"],["Orchid","#DA70D6"],
["Medium Orchid","#BA55D3"],["Dark Orchid","#9932CC"],["Dark Violet","#9400D3"],["Blue Violet","#8A2BE2"],
["Medium Purple","#9370DB"],["Rebecca Purple","#663399"],["Indigo","#4B0082"],["Dark Magenta","#8B008B"],
["Pale Violet Red","#DB7093"],["Medium Violet Red","#C71585"],["Rosy Brown","#BC8F8F"],
["Light Pink","#FFB6C1"],["Gainsboro","#DCDCDC"],["Light Gray","#D3D3D3"],["Dark Gray","#A9A9A9"],
["Dim Gray","#696969"],["Charcoal","#36454F"],["Emerald","#50C878"],["Jade","#00A86B"],
["Sapphire","#0F52BA"],["Amber","#FFBF00"],["Ruby","#E0115F"],["Mint","#98FF98"],
["Peach","#FFE5B4"],["Apricot","#FBCEB1"],["Mauve","#E0B0FF"],["Burgundy","#800020"],
["Cerulean","#007BA7"],["Cobalt Blue","#0047AB"],["Mustard","#FFDB58"],["Periwinkle","#CCCCFF"]
];

function nearestColourName(r,g,b){
  let best=null, bestD=Infinity;
  for (const [name, hex] of NAMED_COLORS){
    const c = hexToRgb(hex);
    const d = (c.r-r)**2 + (c.g-g)**2 + (c.b-b)**2;
    if (d<bestD){ bestD=d; best=name; }
  }
  return best;
}

/* ---------- toast + copy ---------- */
function toast(msg){
  let t = document.getElementById('mgToast');
  if (!t){ t = document.createElement('div'); t.id='mgToast'; t.className='mg-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 1400);
}
function copyText(text, label){
  const done = () => toast((label ? label + ' ' : '') + 'Copied!');
  if (navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch(e){}
  document.body.removeChild(ta);
  done();
}

/* ================= page logic ================= */
let state = { h:198, s:95, v:87 };

const hueBlock = document.getElementById('hueBlock');
const svBox = document.getElementById('svBox');
const svHandle = document.getElementById('svHandle');
const hueSlider = document.getElementById('hueSlider');
const nameChip = document.getElementById('nameChip');
const colorName = document.getElementById('colorName');

const el = {
  hex: document.getElementById('hexInput'),
  r: document.getElementById('rInput'), g: document.getElementById('gInput'), b: document.getElementById('bInput'),
  c: document.getElementById('cInput'), m: document.getElementById('mInput'), y: document.getElementById('yInput'), k: document.getElementById('kInput'),
  h: document.getElementById('hInput'), s: document.getElementById('sInput'), v: document.getElementById('vInput'),
  hl: document.getElementById('hlInput'), sl: document.getElementById('slInput'), ll: document.getElementById('llInput'),
};

function setStateFromRgb(r,g,b){ state = rgbToHsv(r,g,b); }

function render(skip){
  const rgb = hsvToRgb(state.h, state.s, state.v);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  hueBlock.style.background = `hsl(${state.h},100%,50%)`;
  svBox.style.backgroundColor = `hsl(${state.h},100%,50%)`;
  svHandle.style.left = (state.s)+'%';
  svHandle.style.top = (100-state.v)+'%';
  hueSlider.value = state.h;

  nameChip.style.background = hex;
  colorName.textContent = nearestColourName(rgb.r, rgb.g, rgb.b);

  if (skip!=='hex') el.hex.value = hex.toUpperCase();
  if (skip!=='rgb'){ el.r.value = rgb.r; el.g.value = rgb.g; el.b.value = rgb.b; }
  if (skip!=='cmyk'){ el.c.value=cmyk.c; el.m.value=cmyk.m; el.y.value=cmyk.y; el.k.value=cmyk.k; }
  if (skip!=='hsv'){ el.h.value=state.h; el.s.value=state.s; el.v.value=state.v; }
  if (skip!=='hsl'){ el.hl.value=hsl.h; el.sl.value=hsl.s; el.ll.value=hsl.l; }

  document.title = `${hex.toUpperCase()} · Mogibara Colour Picker`;
}

/* ---- SV box drag (fixed: no longer scrolls the page) ---- */
let dragging = false;
function svFromEvent(e){
  const rect = svBox.getBoundingClientRect();
  const point = e.touches ? e.touches[0] : e;
  const x = clamp((point.clientX-rect.left)/rect.width, 0, 1);
  const y = clamp((point.clientY-rect.top)/rect.height, 0, 1);
  state.s = Math.round(x*100);
  state.v = Math.round((1-y)*100);
  render();
}
svBox.addEventListener('mousedown', e=>{ e.preventDefault(); dragging=true; svFromEvent(e); });
window.addEventListener('mousemove', e=>{ if(dragging) svFromEvent(e); });
window.addEventListener('mouseup', ()=> dragging=false);
svBox.addEventListener('touchstart', e=>{ e.preventDefault(); dragging=true; svFromEvent(e); }, {passive:false});
svBox.addEventListener('touchmove', e=>{ if(dragging){ e.preventDefault(); svFromEvent(e); } }, {passive:false});
window.addEventListener('touchend', ()=> dragging=false);

hueSlider.addEventListener('input', ()=>{ state.h = Number(hueSlider.value); render(); });

/* ---- text field edits: update live as you type ---- */
el.hex.addEventListener('input', ()=>{
  const rgb = hexToRgb(el.hex.value);
  if (rgb){ setStateFromRgb(rgb.r, rgb.g, rgb.b); render('hex'); }
});
function rgbFieldChange(){
  const r = clamp(parseInt(el.r.value)||0,0,255), g = clamp(parseInt(el.g.value)||0,0,255), b = clamp(parseInt(el.b.value)||0,0,255);
  setStateFromRgb(r,g,b); render('rgb');
}
[el.r, el.g, el.b].forEach(i=>i.addEventListener('input', rgbFieldChange));

function cmykFieldChange(){
  const c = clamp(parseInt(el.c.value)||0,0,100), m = clamp(parseInt(el.m.value)||0,0,100), y = clamp(parseInt(el.y.value)||0,0,100), k = clamp(parseInt(el.k.value)||0,0,100);
  const rgb = cmykToRgb(c,m,y,k);
  setStateFromRgb(rgb.r, rgb.g, rgb.b); render('cmyk');
}
[el.c, el.m, el.y, el.k].forEach(i=>i.addEventListener('input', cmykFieldChange));

function hsvFieldChange(){
  state = { h: clamp(parseInt(el.h.value)||0,0,360), s: clamp(parseInt(el.s.value)||0,0,100), v: clamp(parseInt(el.v.value)||0,0,100) };
  render('hsv');
}
[el.h, el.s, el.v].forEach(i=>i.addEventListener('input', hsvFieldChange));

function hslFieldChange(){
  const hh = clamp(parseInt(el.hl.value)||0,0,360), ss = clamp(parseInt(el.sl.value)||0,0,100), ll = clamp(parseInt(el.ll.value)||0,0,100);
  const rgb = hslToRgb(hh,ss,ll);
  setStateFromRgb(rgb.r, rgb.g, rgb.b); render('hsl');
}
[el.hl, el.sl, el.ll].forEach(i=>i.addEventListener('input', hslFieldChange));

/* ---- copy buttons ---- */
document.querySelectorAll('[data-copy]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.copy;
    const rgb = hsvToRgb(state.h, state.s, state.v);
    let text='', label='';
    if (type==='hex'){ text = rgbToHex(rgb.r,rgb.g,rgb.b).toUpperCase(); label='HEX'; }
    if (type==='rgb'){ text = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`; label='RGB'; }
    if (type==='cmyk'){ const c=rgbToCmyk(rgb.r,rgb.g,rgb.b); text = `cmyk(${c.c}%, ${c.m}%, ${c.y}%, ${c.k}%)`; label='CMYK'; }
    if (type==='hsv'){ text = `hsv(${state.h}, ${state.s}%, ${state.v}%)`; label='HSV'; }
    if (type==='hsl'){ const l=rgbToHsl(rgb.r,rgb.g,rgb.b); text = `hsl(${l.h}, ${l.s}%, ${l.l}%)`; label='HSL'; }
    copyText(text, label);
  });
});

/* ---- init (optional ?hex=RRGGBB from Surprise Me / library) ---- */
(function init(){
  const hex = new URLSearchParams(location.search).get('hex');
  if (hex){ const rgb = hexToRgb(hex); if (rgb) setStateFromRgb(rgb.r, rgb.g, rgb.b); }
  render();
})();
