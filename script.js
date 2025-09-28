(function(){
  const els = {
    theme: document.getElementById('themeSelect'),
    mood: document.getElementById('moodRange'),
    mode: document.getElementById('modeSelect'),
    harmony: document.getElementById('harmonySelect'),
    contrastList: document.getElementById('contrastList'),
    tokensView: document.getElementById('tokensView'),
    copyCssBtn: document.getElementById('copyCssBtn'),
    downloadJsonBtn: document.getElementById('downloadJsonBtn'),
    shareBtn: document.getElementById('shareBtn'),
    randomBtn: document.getElementById('randomBtn'),
    accessibleBtn: document.getElementById('accessibleBtn'),
    // overrides
    resetOverridesBtn: document.getElementById('resetOverridesBtn'),
    tok: {
      bg: document.getElementById('tok-bg'),
      surface: document.getElementById('tok-surface'),
      text: document.getElementById('tok-text'),
      muted: document.getElementById('tok-muted'),
      primary: document.getElementById('tok-primary'),
      accent: document.getElementById('tok-accent'),
      success: document.getElementById('tok-success'),
      warn: document.getElementById('tok-warn'),
      danger: document.getElementById('tok-danger'),
      border: document.getElementById('tok-border'),
      ring: document.getElementById('tok-ring'),
    },
    val: {
      bg: document.getElementById('val-bg'),
      surface: document.getElementById('val-surface'),
      text: document.getElementById('val-text'),
      muted: document.getElementById('val-muted'),
      primary: document.getElementById('val-primary'),
      accent: document.getElementById('val-accent'),
      success: document.getElementById('val-success'),
      warn: document.getElementById('val-warn'),
      danger: document.getElementById('val-danger'),
      border: document.getElementById('val-border'),
      ring: document.getElementById('val-ring'),
    }
  };

  const state = {
    primary: '#4f46e5',
    theme: 'dark',
    mood: 50,
    mode: 'bold',
    harmony: 'complementary',
    tokens: {},
    overrides: {},
  };

  // Utilities
  function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }
  function hexToRgb(hex){
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    if(!m) return {r:79,g:70,b:229};
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }
  function rgbToHex(r,g,b){
    const to = (n)=> n.toString(16).padStart(2,'0');
    return '#' + to(clamp(Math.round(r),0,255)) + to(clamp(Math.round(g),0,255)) + to(clamp(Math.round(b),0,255));
  }
  function rgbToHsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){ h=s=0; }
    else{
      const d = max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h=(g-b)/d+(g<b?6:0); break;
        case g: h=(b-r)/d+2; break;
        case b: h=(r-g)/d+4; break;
      }
      h/=6;
    }
    return { h: h*360, s: s*100, l: l*100 };
  }
  function hslToRgb(h,s,l){
    h/=360; s/=100; l/=100;
    if(s===0){ const v=l*255; return {r:v,g:v,b:v}; }
    const hue2rgb=(p,q,t)=>{
      if(t<0) t+=1; if(t>1) t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l - q;
    const r = hue2rgb(p,q,h+1/3);
    const g = hue2rgb(p,q,h);
    const b = hue2rgb(p,q,h-1/3);
    return { r: r*255, g: g*255, b: b*255 };
  }
  function lighten(hex, amt){
    const {r,g,b} = hexToRgb(hex);
    const hsl = rgbToHsl(r,g,b);
    hsl.l = clamp(hsl.l + amt, 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(rgb.r,rgb.g,rgb.b);
  }
  function saturate(hex, amt){
    const {r,g,b} = hexToRgb(hex);
    const hsl = rgbToHsl(r,g,b);
    hsl.s = clamp(hsl.s + amt, 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(rgb.r,rgb.g,rgb.b);
  }
  function rotateHue(hex, delta){
    const {r,g,b} = hexToRgb(hex);
    const hsl = rgbToHsl(r,g,b);
    hsl.h = (hsl.h + delta + 360) % 360;
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(rgb.r,rgb.g,rgb.b);
  }
  function relativeLuminance(hex){
    const {r,g,b} = hexToRgb(hex);
    const srgb = [r,g,b].map(v=> v/255).map(v=> v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
    return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
  }
  function contrast(a,b){
    const L1 = relativeLuminance(a);
    const L2 = relativeLuminance(b);
    const bright = Math.max(L1,L2), dark = Math.min(L1,L2);
    return (bright + 0.05) / (dark + 0.05);
  }

  // Palette engines per mode
  const engines = {
    bold(primary, theme, mood, harmony){
      const base = primary;
      const accent = accentFrom(primary, harmony);
      const bg = theme==='dark' ? '#0b1020' : '#f8fafc';
      const surface = theme==='dark' ? '#121826' : '#ffffff';
      const text = theme==='dark' ? '#e6edf3' : '#0f172a';
      const muted = theme==='dark' ? '#9aa5b1' : '#64748b';

      // Mood adjusts saturation/brightness subtly (0..100)
      const punch = (mood-50)/50; // -1..1
      const primaryAdj = saturate(primary, punch*20);
      const accentAdj = saturate(accent, punch*16);

      return { bg, surface, text, muted, primary: primaryAdj, accent: accentAdj,
        success: '#10b981', warn: '#f59e0b', danger: '#ef4444', border: theme==='dark'? '#2b3546':'#e2e8f0', ring: lighten(primaryAdj, theme==='dark'? 10: -10) };
    },
    editorial(primary, theme, mood, harmony){
      const bg = theme==='dark' ? '#0a0f1a' : '#f6f7fb';
      const surface = theme==='dark' ? '#0f1624' : '#ffffff';
      const text = theme==='dark' ? '#e7ecf5' : '#111827';
      const muted = theme==='dark' ? '#9aa5b1' : '#6b7280';
      const accent = desaturateTo(accentFrom(primary, harmony), 22);
      const primarySoft = desaturateTo(primary, 30);
      return { bg, surface, text, muted, primary: primarySoft, accent,
        success: '#22c55e', warn: '#eab308', danger: '#f43f5e', border: theme==='dark'? '#273042':'#e5e7eb', ring: lighten(primarySoft, theme==='dark'? 12: -12) };
    },
    neoglass(primary, theme, mood, harmony){
      const bg = theme==='dark' ? '#0b0f19' : '#eef2ff';
      const surface = theme==='dark' ? '#0f1626b3' : '#ffffffcc';
      const text = theme==='dark' ? '#e6eef7' : '#0f172a';
      const muted = theme==='dark' ? '#9fb0c2' : '#475569';
      const p2 = lighten(primary, theme==='dark'? 8 : -4);
      const accent = rotateHue(primary, 18);
      return { bg, surface, text, muted, primary: p2, accent,
        success: '#34d399', warn: '#f59e0b', danger: '#ef4444', border: theme==='dark'? '#2b3750cc':'#c7d2fe', ring: lighten(p2, theme==='dark'? 10: -10) };
    },
    minimal(primary, theme, mood, harmony){
      const bg = theme==='dark' ? '#0e141f' : '#f9fafb';
      const surface = theme==='dark' ? '#101725' : '#ffffff';
      const text = theme==='dark' ? '#e8eef4' : '#0b1220';
      const muted = theme==='dark' ? '#8f9aa7' : '#6b7280';
      const primaryTrim = desaturateTo(primary, 24);
      const accent = desaturateTo(accentFrom(primary, harmony), 20);
      return { bg, surface, text, muted, primary: primaryTrim, accent,
        success: '#16a34a', warn: '#d97706', danger: '#dc2626', border: theme==='dark'? '#233047':'#e5e7eb', ring: lighten(primaryTrim, theme==='dark'? 10: -10) };
    },
    playful(primary, theme, mood, harmony){
      const bg = theme==='dark' ? '#0b1223' : '#f7fbff';
      const surface = theme==='dark' ? '#0f1830' : '#ffffff';
      const text = theme==='dark' ? '#e8f0ff' : '#0b1220';
      const muted = theme==='dark' ? '#96a8c2' : '#4b5563';
      const primaryPop = saturate(lighten(primary, theme==='dark'? 4: -2), 16);
      const accent = saturate(accentFrom(primary, harmony), 18);
      return { bg, surface, text, muted, primary: primaryPop, accent,
        success: '#22c55e', warn: '#f59e0b', danger: '#ef4444', border: theme==='dark'? '#233053':'#dbeafe', ring: lighten(primaryPop, theme==='dark'? 12: -12) };
    },
    'elegant-dark'(primary, theme, mood, harmony){
      const bg = '#0a0c12';
      const surface = '#0f1320';
      const text = '#e8ecf3';
      const muted = '#99a2b3';
      const primaryGoldish = toGoldish(primary);
      const accent = toGoldish(rotateHue(primary, -22));
      return { bg, surface, text, muted, primary: primaryGoldish, accent,
        success: '#22c55e', warn: '#eab308', danger: '#f87171', border: '#212637', ring: lighten(primaryGoldish, 12) };
    },
  };

  function desaturateTo(hex, targetS){
    const {r,g,b} = hexToRgb(hex); const hsl = rgbToHsl(r,g,b); hsl.s = clamp(targetS, 0, 100);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l); return rgbToHex(rgb.r,rgb.g,rgb.b);
  }
  function accentFrom(primary, harmony){
    if(harmony==='analogous') return rotateHue(primary, 24);
    if(harmony==='split') return rotateHue(primary, 150);
    return rotateHue(primary, 180); // complementary
  }
  function toGoldish(hex){
    // steer towards a warm desaturated gold
    const {r,g,b} = hexToRgb(hex); const hsl = rgbToHsl(r,g,b);
    hsl.h = 42; hsl.s = clamp(hsl.s*0.6 + 18, 0, 60); hsl.l = clamp(hsl.l*0.9 + 6, 0, 70);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l); return rgbToHex(rgb.r,rgb.g,rgb.b);
  }

  function applyTokens(tokens){
    // merge overrides if any
    const merged = { ...tokens, ...state.overrides };
    state.tokens = merged;
    for(const [k,v] of Object.entries(merged)){
      document.documentElement.style.setProperty(`--${k}`, v);
    }
  // expose theme via attribute so CSS can react deterministically (sets --shade)
    document.documentElement.setAttribute('data-theme', state.theme);
    renderTokens(merged);
    renderContrast(merged);
    reflectOverrideInputs(merged);
  }

  function renderTokens(tokens){
    const keys = ['bg','surface','text','muted','primary','accent','success','warn','danger','border','ring'];
    els.tokensView.innerHTML = keys.map(k=>`<div class="token"><span class="swatch" style="background:${tokens[k]}"></span><span class="name">${k}: ${tokens[k]}</span></div>`).join('');
  }

  function renderContrast(tokens){
    const pairs = [
      ['Text on Background', tokens.text, tokens.bg],
      ['Text on Surface', tokens.text, tokens.surface],
      ['Primary Button', '#ffffff', tokens.primary],
      ['Outline Button', tokens.text, tokens.surface],
    ];
    els.contrastList.innerHTML = pairs.map(([name, a, b])=>{
      const ratio = contrast(a,b);
      let cls = 'contrast-pass';
      if(ratio < 4.5) cls = ratio >= 3 ? 'contrast-warn' : 'contrast-fail';
      return `<li class="contrast-item"><span>${name}</span><span class="score ${cls}">${ratio.toFixed(2)}×</span></li>`;
    }).join('');
  }

  function derive(){
    const engine = engines[state.mode] || engines.bold;
    let t = engine(state.primary, state.theme, state.mood, state.harmony);
    // Global mood adjustment to ensure the slider has effect in all modes
    t = applyMood(t, state.theme, state.mood);
    // Guardrails: ensure text contrast
    const textBg = contrast(t.text, t.bg);
    if(textBg < 4.5){
      // darken text or lighten bg a touch until AA
      if(relativeLuminance(t.text) < relativeLuminance(t.bg)){
        t.text = lighten(t.text, -6);
      } else {
        t.bg = lighten(t.bg, 6);
      }
    }
    // Ensure primary button contrast with white text at least AA (2.99 small text? we use 4.5 for safety)
    let tries = 0;
    while(contrast('#ffffff', t.primary) < 4.5 && tries < 8){
      // darken primary stepwise
      t.primary = lighten(t.primary, -4);
      tries++;
    }
    return t;
  }

  function applyMood(tokens, theme, mood){
    const punch = clamp((mood - 50) / 50, -1, 1); // -1..1
    const adj = { ...tokens };
    if(punch !== 0){
      // Mild, universal saturation tweak on primaries so mood always does something
      adj.primary = saturate(adj.primary, punch * 10);
      adj.accent = saturate(adj.accent, punch * 8);
      // Optional: nudge ring to keep in family
      adj.ring = saturate(adj.ring, punch * 6);
    }
    return adj;
  }

  function reflectOverrideInputs(tokens){
    // show current values in text and color pickers
    const keys = Object.keys(els.tok);
    for(const k of keys){
      const v = tokens[k];
      if(!v) continue;
      if(els.tok[k]) els.tok[k].value = toHexInput(v);
      if(els.val[k]) els.val[k].textContent = v.toUpperCase();
    }
  }

  function toHexInput(v){
    // ensure valid #rrggbb for <input type="color">
    if(!v) return '#000000';
    let s = v.trim();
    if(/^#?[0-9a-fA-F]{8}$/.test(s)){
      // strip alpha to fit input[type=color]
      s = s.replace('#','');
      s = '#' + s.slice(0,6);
      return s;
    }
    if(/^#?[0-9a-fA-F]{6}$/.test(s)){
      return s.startsWith('#') ? s : ('#'+s);
    }
    return '#000000';
  }

  // Handlers
  function syncFromUI(){
    // base primary comes from overrides if user set it in Customize Tokens, otherwise keep state.primary
    const overridePrimary = state.overrides.primary;
    if(overridePrimary) state.primary = overridePrimary;
    state.theme = els.theme.value;
    state.mood = parseInt(els.mood.value,10);
    state.mode = els.mode.value;
    state.harmony = els.harmony.value;
    applyTokens(derive());
  }

  // Export
  function buildCss(){
    const t = state.tokens;
    const lines = Object.entries(t).map(([k,v])=>`  --${k}: ${v};`).join('\n');
    return `:root {\n${lines}\n}`;
  }
  async function copyCss(){
    const css = buildCss();
    await navigator.clipboard.writeText(css);
    flash('CSS variables copied');
  }
  function downloadJson(){
    const data = JSON.stringify(state.tokens, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tokens.json';
    a.click();
  }
  function share(){
    const params = new URLSearchParams({
      p: state.primary.replace('#',''), th: state.theme, m: String(state.mood), md: state.mode, ha: state.harmony
    });
    const url = location.origin + location.pathname + '?' + params.toString();
    navigator.clipboard.writeText(url).then(()=> flash('Share link copied'));
  }

  function flash(text){
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position='fixed'; el.style.bottom='16px'; el.style.left='50%'; el.style.transform='translateX(-50%)';
    el.style.background='#111827'; el.style.color='#e5e7eb'; el.style.padding='8px 12px'; el.style.borderRadius='8px'; el.style.border='1px solid #334155';
    document.body.appendChild(el);
    setTimeout(()=>{ el.remove(); }, 1400);
  }

  function randomize(){
    // pick a random base primary and a cohesive configuration
    const hue = Math.floor(Math.random()*360);
    const sat = 55 + Math.random()*25; // 55..80
    const light = 50 + Math.random()*10; // 50..60
    const rgb = hslToRgb(hue, sat, light);
    const hex = rgbToHex(rgb.r,rgb.g,rgb.b);

    state.primary = hex;
    state.theme = Math.random() < 0.5 ? 'light' : 'dark';
    els.theme.value = state.theme;

    const modes = ['bold','editorial','neoglass','minimal','playful','elegant-dark'];
    state.mode = modes[Math.floor(Math.random()*modes.length)];
    els.mode.value = state.mode;

    const harmonies = ['complementary','analogous','split'];
    state.harmony = harmonies[Math.floor(Math.random()*harmonies.length)];
    els.harmony.value = state.harmony;

    state.mood = Math.floor(Math.random()*101);
    els.mood.value = String(state.mood);

    // clear overrides so the engine can generate a cohesive palette
    state.overrides = {};
    applyTokens(derive());
  }

  function makeAccessible(){
    const t = state.tokens;
    // elevate text/bg pair to AA if needed
    while(contrast(t.text, t.bg) < 4.5){
      if(relativeLuminance(t.text) < relativeLuminance(t.bg)) t.text = lighten(t.text, -2);
      else t.bg = lighten(t.bg, 2);
    }
    applyTokens(t);
    flash('Adjusted for WCAG AA');
  }

  // URL state
  function loadFromQuery(){
    const q = new URLSearchParams(location.search);
    if(q.has('p')){
      const hex = '#' + (q.get('p') || '');
      // set base primary from query; clear override so engine derives palette
      state.primary = toHexInput(hex);
      delete state.overrides.primary;
    }
    if(q.has('th')) els.theme.value = q.get('th');
    if(q.has('m')) els.mood.value = q.get('m');
    if(q.has('md')) els.mode.value = q.get('md');
    if(q.has('ha')) els.harmony.value = q.get('ha');
  }

  // Wire up
  els.theme.addEventListener('change', syncFromUI);
  // Mood should have an immediate visible effect; clear primary/accent overrides so the engine can reflect it
  els.mood.addEventListener('input', ()=>{
    state.mood = parseInt(els.mood.value,10);
    delete state.overrides.primary;
    delete state.overrides.accent;
    applyTokens(derive());
  });
  els.mode.addEventListener('change', syncFromUI);
  els.harmony.addEventListener('change', syncFromUI);
  els.copyCssBtn.addEventListener('click', copyCss);
  els.downloadJsonBtn.addEventListener('click', downloadJson);
  els.shareBtn.addEventListener('click', share);
  els.randomBtn.addEventListener('click', randomize);
  els.accessibleBtn.addEventListener('click', makeAccessible);

  // overrides events
  Object.keys(els.tok).forEach(k=>{
    const input = els.tok[k];
    if(!input) return;
    input.addEventListener('input', ()=>{
      const val = input.value;
      state.overrides[k] = val;
      applyTokens(derive());
    });
  });
  if(els.resetOverridesBtn){
    els.resetOverridesBtn.addEventListener('click', ()=>{
      state.overrides = {};
      applyTokens(derive());
    });
  }

  loadFromQuery();
  // initialize state from current UI controls without overriding primary
  state.theme = els.theme.value;
  state.mood = parseInt(els.mood.value,10);
  state.mode = els.mode.value;
  state.harmony = els.harmony.value;
  applyTokens(derive());
})();
