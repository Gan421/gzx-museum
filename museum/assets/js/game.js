/* ==========================================================
   《根在侨乡 · 博物馆漫游》游戏引擎
   ========================================================== */
(function () {
  'use strict';

  const D = window.MD;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const IMG = D.IMG;
  const SAVE = 'gzx_museum_v1';
  const TOTAL = 15;


  /* ---------------- 展板门框图形 ---------------- */
  const STELE_CROWN = `
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
      <path fill="currentColor" d="M0 100V36h30V12h80v24h50V4h80v32h50V12h80v24h30v64z"/>
      <g fill="#0b1518" opacity="0.55">
        <path d="M66 100V72a13 13 0 0 1 26 0v28z"/>
        <path d="M146 100V72a13 13 0 0 1 26 0v28z"/>
        <path d="M228 100V72a13 13 0 0 1 26 0v28z"/>
        <path d="M308 100V72a13 13 0 0 1 26 0v28z"/>
      </g>
      <path fill="rgba(255,255,255,.22)" d="M0 36h30v-4H0zM110 36h50v-4h-50zM240 36h50v-4h-50zM370 36h30v-4h-30z"/>
    </svg>`;

  const STELE_ART = {
    ship: `
      <svg viewBox="0 0 320 70" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="rgba(198,228,255,.85)" stroke-width="1.2">
          <path d="M30 56c30-6 230-6 260 0l-12 9H42z" fill="rgba(198,228,255,.12)"/>
          <path d="M160 52V10"/>
          <path d="M160 14l44 12-44 10z" fill="rgba(198,228,255,.16)"/>
          <path d="M160 16l-40 12 40 10z" fill="rgba(198,228,255,.1)"/>
          <path d="M0 66h320" opacity=".3"/>
          <path d="M58 62c12-4 24-4 36 0M226 62c12-4 24-4 36 0" opacity=".45"/>
        </g>
      </svg>`,
    rail: `
      <svg viewBox="0 0 320 70" preserveAspectRatio="none" aria-hidden="true">
        <g fill="none" stroke="rgba(198,228,255,.8)" stroke-width="1.2">
          <path d="M20 64h280"/>
          <path d="M30 58h260" opacity=".55"/>
          <path d="M40 70l40-22 30 12 34-20 30 16 36-24 40 18 30-14" opacity=".45"/>
          <path d="M0 70h320" opacity=".25"/>
        </g>
      </svg>`
  };

  function steleCrown() {
    return `<div class="stele__crown">${STELE_CROWN}</div>`;
  }

  /* ---------------- 关卡表 ---------------- */
  const LEVELS = [
    { id: 'gate', name: '馆前', zone: '馆外', dot: null, bg: 'front', bright: true },
    { id: 'hall', name: '大厅', zone: '大厅', dot: { x: 0.53, y: 0.57 }, bg: 'hall', bright: true },
    { id: 'portal', name: '侨乡入口', zone: '序厅', dot: { x: 0.19, y: 0.57 }, bg: 'portal' },
    { id: 'history', name: '海外移民简史', zone: '远赴重洋', dot: { x: 0.13, y: 0.43 }, bg: 'migration' },
    { id: 'sail', name: '顺风下南洋', zone: '远赴重洋', dot: { x: 0.13, y: 0.43 }, bg: 'route_map' },
    { id: 'maps', name: '侨影遍天下', zone: '远赴重洋', dot: { x: 0.13, y: 0.43 }, bg: 'world_map' },
    { id: 'ruins', name: '广海遗存', zone: '远赴重洋', dot: { x: 0.13, y: 0.43 }, bg: 'ruin_temple' },
    { id: 'part1', name: '第一部分', zone: '远赴重洋', dot: { x: 0.13, y: 0.43 }, bg: 'part1' },
    { id: 'years', name: '五邑沿革', zone: '远赴重洋', dot: { x: 0.13, y: 0.43 }, bg: 'years' },
    { id: 'part2', name: '第二部分', zone: '拼搏海外', dot: { x: 0.30, y: 0.32 }, bg: 'part2' },
    { id: 'tin', name: '琉琅妹淘锡', zone: '拼搏海外', dot: { x: 0.30, y: 0.32 }, bg: 'tin' },
    { id: 'railway', name: '修建美洲铁路', zone: '拼搏海外', dot: { x: 0.30, y: 0.32 }, bg: 'railway' },
    { id: 'chinatown', name: '唐人街', zone: '融通中外', dot: { x: 0.66, y: 0.37 }, bg: 'chinatown', bright: true },
    { id: 'laundry', name: '华昌洗衣店', zone: '融通中外', dot: { x: 0.66, y: 0.37 }, bg: 'laundry', bright: true },
    { id: 'school', name: '中华侨民学校', zone: '融通中外', dot: { x: 0.66, y: 0.37 }, bg: 'school' },
    { id: 'ending', name: '参观结束', zone: '根在侨乡', dot: null, bg: 'hall' }
  ];

  /* ---------------- 状态 ---------------- */
  const fresh = () => ({
    v: 1, level: 0, done: [], spots: {}, games: {},
    elapsed: 0, t0: 0, soundOn: true, started: false
  });
  let S = fresh();
  let activeKit = null;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || o.v !== 1) return null;
      return Object.assign(fresh(), o, { t0: 0 });
    } catch (e) { return null; }
  }
  function save() {
    try {
      const now = Date.now();
      if (S.t0) { S.elapsed += now - S.t0; S.t0 = now; }
      localStorage.setItem(SAVE, JSON.stringify(S));
    } catch (e) { /* ignore */ }
  }
  function reset() {
    try { localStorage.removeItem(SAVE); } catch (e) { /* ignore */ }
    S = fresh(); S.t0 = Date.now(); save();
  }

  /* ---------------- 工具 ---------------- */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('is-on'), ms || 2000);
  }
  function flash() {
    const f = $('#flash');
    f.classList.remove('is-on');
    void f.offsetWidth;
    f.classList.add('is-on');
  }
  function modal(o) {
    $('#modalImg').hidden = !o.img;
    if (o.img) { $('#modalImg').src = IMG(o.img); $('#modalImg').alt = o.title || ''; }
    $('#modalTag').textContent = o.tag || '';
    $('#modalTitle').textContent = o.title || '';
    $('#modalText').innerHTML = o.html || (o.text ? o.text.split('\n').map(p => `<p>${esc(p)}</p>`).join('') : '');
    const foot = $('#modalFoot');
    foot.innerHTML = '';
    (o.actions || [{ label: '继续' }]).forEach((a) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || '');
      b.textContent = a.label;
      b.addEventListener('click', () => {
        Sfx.click(); closeModal();
        if (a.fn) a.fn();
      });
      foot.appendChild(b);
    });
    $('#modal').hidden = false;
  }
  function closeModal() { $('#modal').hidden = true; }

  /* ---------------- 音效 ---------------- */
  const Sfx = (function () {
    let ctx = null;
    function ac() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; }
      return ctx;
    }
    function tone(f, dur, type, vol, delay) {
      const c = ac(); if (!c || !S.soundOn) return;
      const t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol || 0.04, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, cutoff) {
      const c = ac(); if (!c || !S.soundOn) return;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff || 1200;
      const g = c.createGain(); g.gain.value = vol || 0.05;
      src.connect(f); f.connect(g); g.connect(c.destination); src.start();
    }
    return {
      unlock() { const c = ac(); if (c && c.state === 'suspended') c.resume(); },
      click() { tone(640, 0.05, 'square', 0.012); },
      tap() { tone(420, 0.07, 'triangle', 0.028); },
      ok() { tone(523.25, 0.16, 'triangle', 0.04); tone(659.25, 0.2, 'triangle', 0.035, 0.08); tone(783.99, 0.34, 'sine', 0.03, 0.16); },
      bad() { tone(155, 0.14, 'sawtooth', 0.026); tone(110, 0.2, 'sawtooth', 0.022, 0.05); },
      stamp() { noise(0.14, 0.08, 700); tone(95, 0.2, 'sine', 0.07); },
      coin() { tone(880, 0.09, 'triangle', 0.03); tone(1174.66, 0.12, 'triangle', 0.025, 0.06); },
      chime() { tone(392, 0.5, 'sine', 0.028); tone(587.33, 0.65, 'sine', 0.024, 0.12); tone(783.99, 0.85, 'sine', 0.018, 0.3); },
      page() { noise(0.1, 0.025, 2400); }
    };
  }());

  /* ---------------- HUD / 地图 ---------------- */
  function updateHUD(L, i) {
    $('#hudName').textContent = L.id === 'gate' ? '根在侨乡' : L.name;
    $('#hudZone').textContent = L.id === 'gate' ? D.MUSEUM.name : L.zone + ' · ' + D.MUSEUM.name;
    $('#hudBar').style.width = Math.round((i / (LEVELS.length - 1)) * 100) + '%';
    const mm = $('#minimap');
    if (L.dot) {
      mm.classList.remove('is-hidden');
      $('#mmZone').textContent = L.zone;
      [[$('#mmDot'), $('#mmRing'), mm], [$('#mmDotBig'), $('#mmRingBig'), $('#mapBig')]].forEach(item => {
        const [dot, ring] = item;
        if (!dot) return;
        dot.style.left = (L.dot.x * 100) + '%';
        dot.style.top = (L.dot.y * 100) + '%';
        ring.style.left = (L.dot.x * 100) + '%';
        ring.style.top = (L.dot.y * 100) + '%';
      });
      $('#mmCount').textContent = i + ' / ' + TOTAL;
    } else {
      mm.classList.add('is-hidden');
    }
  }

  function setBg(name, bright) {
    const el = $('#bgPhoto');
    el.style.backgroundImage = `url("${IMG(name)}")`;
    el.classList.toggle('is-bright', !!bright);
  }

  /* ---------------- 过渡 ---------------- */
  function go(i, opts) {
    i = Math.max(0, Math.min(LEVELS.length - 1, i));
    if (activeKit) { activeKit.destroy(); activeKit = null; }
    S.level = i;
    if (!S.t0) S.t0 = Date.now();
    const L = LEVELS[i];
    updateHUD(L, i);
    setBg(L.bg, L.bright);
    document.body.classList.toggle('stele-mode', ['portal', 'part1', 'part2'].indexOf(L.id) >= 0);
    const stage = $('#stage');
    stage.innerHTML = '';
    const root = document.createElement('section');
    root.className = 'level';
    root.dataset.id = L.id;
    stage.appendChild(root);
    MOUNT[L.id](root, api);
    if (!opts || !opts.keepScroll) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }
    updateCtrl();
    save();
  }

  const api = {
    complete() {
      const L = LEVELS[S.level];
      if (S.done.indexOf(L.id) < 0) { S.done.push(L.id); save(); updateCtrl(); }
    },
    next() {
      api.complete();
      flash();
      const nx = S.level + 1;
      setTimeout(() => go(nx), 240);
    },
    goTo(i) { go(i); },
    toast, modal,
    score(kind) {
      S.games[kind] = (S.games[kind] || 0) + 1;
      save();
    }
  };

  function updateCtrl() {
    const L = LEVELS[S.level];
    const done = L && S.done.indexOf(L.id) >= 0;
    const next = $('#ctrlNext');
    const label = $('#ctrlNextLabel');
    if (!next) return;
    next.classList.toggle('is-locked', !done);
    label.textContent = done ? '下一关' : '未通关';
    const prev = $('#ctrlPrev');
    if (prev) prev.disabled = S.level <= 0;
    const bar = $('#ctrlbar');
    if (bar) bar.classList.toggle('is-hidden', S.level === 0);
  }

  /* ---------------- 拖拽工具 ---------------- */
  function makeDrag(root, opts) {
    if (activeKit) activeKit.destroy();
    const chipSel = opts.chipSel;
    const zoneSel = opts.zoneSel;
    let picked = null;
    let drag = null;

    function ghostFrom(chip) {
      const html = opts.ghost ? opts.ghost(chip) : chip.outerHTML;
      const g = document.createElement('div');
      g.className = 'drag-ghost';
      g.innerHTML = html;
      document.body.appendChild(g);
      return g;
    }
    function onDown(e) {
      const chip = e.target.closest(chipSel);
      if (!chip || chip.classList.contains('is-used')) return;
      e.preventDefault();
      drag = { chip, x: e.clientX, y: e.clientY, moved: false, ghost: null };
    }
    function onMove(e) {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 7) {
        drag.moved = true;
        drag.ghost = ghostFrom(drag.chip);
      }
      if (drag.ghost) {
        drag.ghost.style.left = e.clientX + 'px';
        drag.ghost.style.top = e.clientY + 'px';
      }
    }
    function onUp(e) {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.ghost) d.ghost.remove();
      if (!d.moved) {
        togglePick(d.chip);
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zone = el && el.closest(zoneSel);
      if (zone) {
        opts.onDrop(d.chip, zone);
        clearPick();
      }
    }
    function togglePick(chip) {
      if (picked === chip) { clearPick(); return; }
      clearPick();
      picked = chip;
      chip.classList.add('is-picked');
      Sfx.tap();
    }
    function clearPick() {
      if (picked) picked.classList.remove('is-picked');
      picked = null;
    }
    function onClick(e) {
      const zone = e.target.closest(zoneSel);
      if (zone && picked) {
        opts.onDrop(picked, zone);
        clearPick();
      }
    }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('click', onClick);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);

    const kit = {
      destroy() {
        root.removeEventListener('pointerdown', onDown);
        root.removeEventListener('click', onClick);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
    };
    activeKit = kit;
    return kit;
  }

  /* ==========================================================
     0 · 馆前
     ========================================================== */
  function levelGate(root) {
    root.classList.add('level--gate');
    root.innerHTML = `
      <div class="gate">
        <div class="gate__inner">
          <div class="gate__kicker">中国侨都华侨华人博物馆 · 云端漫游</div>
          <h1 class="gate__title">根在侨乡</h1>
          <div class="gate__sub">一 座 馆 &nbsp;·&nbsp; 一 条 动 线 &nbsp;·&nbsp; 十 五 站</div>
          <p class="gate__quote">从广海湾的一张船票，<br>到世界 145 个国家的乡音。</p>
          <button class="btn btn--gold pulse-btn gate__enter" id="enterBtn">进 入 博 物 馆</button>
          <div class="gate__hint">建议竖屏 · 全程约 15 分钟</div>
          <a class="gate__link" href="../qiaopi/">另一个游戏 · 侨批归途 ›</a>
        </div>
      </div>`;
    $('#enterBtn').addEventListener('click', () => {
      Sfx.unlock(); Sfx.chime();
      flash();
      S.started = true; S.t0 = Date.now();
      if (S.done.indexOf('gate') < 0) S.done.push('gate');
      save();
      setTimeout(() => go(1), 320);
    });
  }

  /* ==========================================================
     1 · 大厅 四字谜
     ========================================================== */
  function levelHall(root) {
    const ANSWER = ['根', '在', '侨', '乡'];
    const KEYS = ['根', '在', '侨', '乡', '侨', '批', '银', '信', '家', '国',
      '情', '怀', '海', '丝', '路', '归', '心', '船', '票', '梦'];
    let pool = shuffle(KEYS);
    let slots = [];
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 一 站 · 大 厅</div>
        <h2 class="level__title">大厅的四个字</h2>
        <p class="level__sub">整座馆的主题，就写在正前方这面墙上。</p>
      </div>
      <div class="level__body">
        <figure class="scene-card scene-card--slim">
          <img src="${IMG('hall')}" alt="根在侨乡主厅">
          <figcaption>主厅 · 根在侨乡</figcaption>
        </figure>
        <div class="panel" style="margin-top:12px">
          <p class="note" style="margin-top:0">看墙上的四个字，按顺序点出来。</p>
          <div class="chars" id="slots"></div>
          <div class="keys" id="keys"></div>
          <div class="msg" id="msg"></div>
        </div>
      </div>`;
    const slotsEl = $('#slots'), keysEl = $('#keys'), msg = $('#msg');

    function draw() {
      slotsEl.innerHTML = Array.from({ length: 4 }, (_, i) =>
        slots[i] ? `<span class="char-slot is-filled">${esc(slots[i])}</span>`
          : `<span class="char-slot is-empty">${['一', '二', '三', '四'][i]}</span>`).join('');
      keysEl.innerHTML = pool.map((k, i) =>
        `<button class="key" data-k="${i}">${k}</button>`).join('');
    }
    draw();

    keysEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      if (slots.length >= 4) return;
      slots.push(pool[+b.dataset.k]);
      Sfx.tap();
      draw();
      if (slots.length === 4) setTimeout(check, 260);
    });

    slotsEl.addEventListener('click', () => {
      if (!slots.length) return;
      slots.pop(); Sfx.click(); draw();
    });

    function check() {
      const ok = slots.every((c, i) => c === ANSWER[i]);
      if (!ok) {
        Sfx.bad();
        msg.textContent = '不是这四个字。再看一眼墙。';
        $$('.char-slot').forEach(el => el.classList.add('is-bad'));
        setTimeout(() => { slots = []; msg.textContent = ''; draw(); }, 700);
        return;
      }
      Sfx.ok();
      msg.className = 'msg is-ok';
      msg.textContent = '根在侨乡。';
      api.complete();
      setTimeout(() => {
        modal({
          img: 'hall2', tag: '馆 情', title: '中国侨都华侨华人博物馆',
          text: D.MUSEUM.brief + '\n' + D.MUSEUM.brief2,
          actions: [{ label: '继续参观', fn: api.next }]
        });
      }, 500);
    }
  }

    /* ==========================================================
     2 · 侨乡入口（黑洞传送门）（展板门框 + 黑洞）
     ========================================================== */
  function levelPortal(root) {
    const P = D.PORTAL;
    root.innerHTML = `
      <div class="level__head level__head--compact">
        <div class="overline">第 二 站 · 序 厅</div>
      </div>
      <div class="stele stele--gold">
        ${steleCrown()}
        <div class="stele__frame">
          <div class="stele__band">
            <span class="band-cn">${esc(P.chapter)}</span>
            <span class="band-en">${esc(P.chapterEn)}</span>
          </div>
          <div class="stele__title"><h2>${esc(P.title)}</h2></div>
          <div class="stele__panel stele__panel--portal">
            <div class="portal-hole" id="portalHot" role="button" aria-label="穿过传送门">
              <span class="portal-hole__core"></span>
              <span class="portal-hole__swirl"></span>
              <span class="portal-hole__ring"></span>
              <span class="portal-hole__hint">穿 过</span>
            </div>
            <div class="portal-cap">根在侨乡 · 主展厅<span>MAIN EXHIBITION ENTRANCE</span></div>
          </div>
        </div>
        <div class="stele__base"></div>
      </div>
      <p class="portal-note">${esc(P.hint)}</p>`;

    $('#portalHot').addEventListener('click', () => {
      api.complete();
      Sfx.stamp();
      const layer = document.createElement('div');
      layer.className = 'zoom-layer';
      // 只保留推镜：用一层纯黑径向遮罩，不再叠任何图片
      layer.style.background = 'radial-gradient(circle at 62% 62%, #000 0%, #05070a 42%, rgba(5,7,10,0) 72%)';
      layer.style.transformOrigin = '62% 62%';
      document.body.appendChild(layer);
      let t0 = performance.now();
      (function anim(now) {
        const p = Math.min(1, (now - t0) / 1250);
        const e = p * p;
        layer.style.transform = `scale(${1 + e * 2.2})`;
        layer.style.opacity = String(1 - p * 0.2);
        if (p < 1) requestAnimationFrame(anim);
        else {
          flash();
          setTimeout(() => { layer.remove(); api.next(); }, 240);
        }
      }(t0));
    });
  }

/* ==========================================================
     3 · 海外移民简史
     ========================================================== */
  function levelHistory(root) {
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 三 站 · 序 厅</div>
        <h2 class="level__title">一部移民史</h2>
        <p class="level__sub">从秦汉到近现代，中国人走向海洋的脚步，从未停过。</p>
      </div>
      <div class="level__body">
        <figure class="scene-card">
          <img src="${IMG('migration')}" alt="中国古代海外移民展板">
          <figcaption>序厅展板 · 中国古代海外移民</figcaption>
        </figure>
        <div class="panel" style="margin-top:12px">
          <p>中国人出洋，不是从近代才开始的。秦汉已有海路，宋元形成规模，明朝至鸦片战争前进入成熟期，近现代则是高峰。</p>
          <p>五邑，正站在这条海上走廊的门口。</p>
          <p class="note">下一站，从这里出海。</p>
          <button class="btn btn--block" id="nextBtn" style="margin-top:12px">登 船</button>
        </div>
      </div>`;
    $('#nextBtn').addEventListener('click', api.next);
    api.complete();
  }

  /* ==========================================================
     4 · 顺风下南洋（Canvas 航行小游戏）
     ========================================================== */
  function levelSail(root) {
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 四 站 · 远 赴 重 洋</div>
        <h2 class="level__title">顺风下南洋</h2>
        <p class="level__sub">1901 年，广海湾。你的船要穿过礁石与风浪，驶向石叻。</p>
      </div>
      <div class="level__body">
        <div class="game-shell">
          <div class="game-hud"><span>航程 <b id="pct">0%</b></span><span class="hearts" id="hearts">♥♥♥</span></div>
          <div class="progress"><i id="bar"></i></div>
          <div class="canvas-wrap"><canvas id="cv"></canvas></div>
          <div class="canvas-note">按住屏幕左右拖动，或使用 ← → 键</div>
        </div>
      </div>`;

    const cv = $('#cv');
    const W = 360, H = 460;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.aspectRatio = W + ' / ' + H;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    let shipX = W / 2, targetX = W / 2;
    let objs = [], t = 0, prog = 0, hearts = 3, over = false, raf = 0, last = 0, spawn = 0;
    let keyL = false, keyR = false;
    let paused = false;

    function reset() {
      shipX = targetX = W / 2; objs = []; t = 0; prog = 0; hearts = 3; over = false; last = 0; spawn = 0;
      $('#pct').textContent = '0%';
      $('#bar').style.width = '0%';
      $('#hearts').textContent = '♥♥♥';
    }

    function pointer(e) {
      const r = cv.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width) * W;
      targetX = Math.max(22, Math.min(W - 22, targetX));
    }
    cv.addEventListener('pointerdown', (e) => { try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } pointer(e); });
    cv.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') pointer(e); });
    function keydown(e) { if (e.key === 'ArrowLeft') keyL = true; if (e.key === 'ArrowRight') keyR = true; }
    function keyup(e) { if (e.key === 'ArrowLeft') keyL = false; if (e.key === 'ArrowRight') keyR = false; }
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    function drawShip(x, y) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.35, 1.35);
      const tilt = Math.max(-0.18, Math.min(0.18, (targetX - shipX) * 0.01));
      ctx.rotate(tilt);
      // 船身
      ctx.fillStyle = '#3b2a1c';
      ctx.beginPath();
      ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-14, 12, 0, 13); ctx.quadraticCurveTo(15, 12, 21, 0);
      ctx.lineTo(16, -4); ctx.lineTo(-16, -4); ctx.closePath(); ctx.fill();
      // 桅与帆
      ctx.strokeStyle = '#d9c9a4'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -34); ctx.stroke();
      ctx.fillStyle = '#e8d6ae';
      ctx.beginPath(); ctx.moveTo(2, -32); ctx.quadraticCurveTo(18, -22, 2, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c9b58a';
      ctx.beginPath(); ctx.moveTo(-2, -30); ctx.quadraticCurveTo(-14, -20, -2, -11); ctx.closePath(); ctx.fill();
      // 灯
      ctx.fillStyle = 'rgba(255,214,120,0.9)';
      ctx.beginPath(); ctx.arc(0, -36, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawRock(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.fillStyle = '#5b5a51';
      ctx.beginPath();
      ctx.moveTo(-16, 10); ctx.lineTo(-10, -10); ctx.lineTo(2, -16); ctx.lineTo(14, -4); ctx.lineTo(12, 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(2, -16); ctx.lineTo(4, -6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function drawStorm(o) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.fillStyle = 'rgba(90,110,130,0.55)';
      [[-12, 2, 14], [0, -6, 16], [13, 3, 13]].forEach(([x, y, r]) => {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = 'rgba(200,220,255,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(-2, 16); ctx.lineTo(6, 18); ctx.stroke();
      ctx.restore();
    }

    function loop(now) {
      if (!cv.isConnected) { cancelAnimationFrame(raf); return; }
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (paused || over) { raf = requestAnimationFrame(loop); return; }
      t += dt;
      prog = Math.min(100, (t / 24) * 100);
      if (keyL) targetX -= 260 * dt;
      if (keyR) targetX += 260 * dt;
      targetX = Math.max(22, Math.min(W - 22, targetX));
      shipX += (targetX - shipX) * Math.min(1, dt * 8);
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(0.42, 0.95 - t * 0.02);
        const kind = Math.random() < 0.42 ? 'storm' : 'rock';
        objs.push({ x: 26 + Math.random() * (W - 52), y: -30, kind, vy: 125 + Math.random() * 55 + t * 3 });
      }
      objs.forEach(o => { o.y += o.vy * dt; });
      // 碰撞
      if (!over) {
        for (const o of objs) {
          if (o.hit) continue;
          if (Math.abs(o.x - shipX) < 26 && Math.abs(o.y - (H - 52)) < 30) {
            o.hit = true; hearts = Math.max(0, hearts - 1);
            $('#hearts').textContent = '♥'.repeat(hearts) + '♡'.repeat(3 - hearts);
            Sfx.bad();
            if (hearts <= 0) { over = true; lose(); }
          }
        }
      }
      objs = objs.filter(o => o.y < H + 40);
      // 背景
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1b4b5a'); g.addColorStop(0.55, '#0f3038'); g.addColorStop(1, '#061a20');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // 月光
      const mg = ctx.createRadialGradient(W * 0.76, 70, 4, W * 0.76, 70, 150);
      mg.addColorStop(0, 'rgba(226,196,124,0.30)');
      mg.addColorStop(1, 'rgba(226,196,124,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      // 波浪
      ctx.strokeStyle = 'rgba(180,220,235,0.10)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = ((i * 90 + t * 40) % (H + 120)) - 60;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin((x + i * 40) / 40 + t) * 4);
        ctx.stroke();
      }
      objs.forEach(o => o.kind === 'rock' ? drawRock(o) : drawStorm(o));
      drawShip(shipX, H - 52);
      // HUD
      $('#pct').textContent = Math.round(prog) + '%';
      $('#bar').style.width = prog + '%';
      if (prog >= 100 && !over) { over = true; win(); }
      raf = requestAnimationFrame(loop);
    }

    function stop() { cancelAnimationFrame(raf); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); }

    function win() {
      stop(); Sfx.chime(); api.score('sail'); api.complete();
      const box = document.createElement('div');
      box.className = 'panel';
      box.style.marginTop = '12px';
      box.innerHTML = `<div class="result-box">
        <h3>到 港 了</h3>
        <div class="big">石 叻</div>
        <p>风浪没有把你的船打回去。上岸那天，你把湿透的船票摊在石头上晒干——那是你唯一的凭证。</p>
        <button class="btn btn--block" id="sailNext" style="margin-top:14px">上 岸</button>
      </div>`;
      root.querySelector('.game-shell').appendChild(box);
      $('#sailNext').addEventListener('click', api.next);
      $('#sailNext').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function lose() {
      stop(); Sfx.bad();
      const box = document.createElement('div');
      box.className = 'panel';
      box.style.marginTop = '12px';
      box.innerHTML = `<div class="result-box">
        <h3>船 沉 了</h3>
        <p>海上的风浪，从不为谁让路。再试一次。</p>
        <button class="btn btn--block" id="sailRetry" style="margin-top:14px">再 来 一 次</button>
      </div>`;
      root.querySelector('.game-shell').appendChild(box);
      $('#sailRetry').addEventListener('click', () => {
        box.remove(); reset(); last = 0; Sfx.tap();
        raf = requestAnimationFrame(loop);
        window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
      });
    }

    reset();
    raf = requestAnimationFrame(loop);
    if (window.__md) {
      window.__md.sailWin = win;
      window.__md.sailLose = lose;
    }
  }

  /* ==========================================================
     5 · 两张地图寻点
     ========================================================== */
  function levelMaps(root) {
    /* 世界点位：每局从 23 个里随机抽 8 个，并尽量保证地域分散 */
    function pickWorld(n) {
      const byRegion = {};
      D.WORLD_SPOTS.forEach((sp) => { (byRegion[sp.region] = byRegion[sp.region] || []).push(sp); });
      const regions = shuffle(Object.keys(byRegion));
      const out = [];
      // 每个区域先来一个
      regions.forEach((r) => { if (out.length < n) out.push(shuffle(byRegion[r])[0]); });
      // 不够再补，每区最多 2 个
      let guard = 0;
      while (out.length < n && guard++ < 300) {
        const r = regions[Math.floor(Math.random() * regions.length)];
        const rest = byRegion[r].filter((sp) => out.indexOf(sp) < 0);
        if (rest.length && out.filter((sp) => sp.region === r).length < 2) {
          out.push(rest[Math.floor(Math.random() * rest.length)]);
        }
      }
      return shuffle(out);
    }

    const tabs = [
      { id: 'world', label: '世界华侨分布', img: 'map_world_clean', spots: pickWorld(8), cap: '世界华侨华人分布' },
      { id: 'wuyi', label: '五邑移民路线', img: 'map_wuyi_clean', spots: D.WUYI_SPOTS, cap: '五邑华侨移民路线' }
    ];
    if (!S.spots.maps) S.spots.maps = { world: [], wuyi: [] };
    // 丢弃上一局抽到、这一局没出现过的点位，避免计数错乱
    ['world', 'wuyi'].forEach((k) => {
      S.spots.maps[k] = (S.spots.maps[k] || []).filter((id) => tabs.filter((t) => t.id === k)[0].spots.some((sp) => sp.id === id));
    });
    let tab = 0;

    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 五 站 · 远 赴 重 洋</div>
        <h2 class="level__title">侨影遍天下</h2>
        <p class="level__sub">地图上没有标记。凭记忆与判断，点出五邑人去过的地方。</p>
      </div>
      <div class="level__body">
        <div class="tabbar" id="tabs"></div>
        <div class="mapwrap" id="mapwrap">
          <img id="mapImg" src="${IMG(tabs[0].img)}" alt="地图">
          <div id="spots"></div>
        </div>
        <div class="map-status">
          <span>已发现 <b id="foundN">0</b> / <b id="totalN">0</b> 处</span>
          <span id="leftN">还剩 0 处</span>
        </div>
        <div class="panel found-card" id="card">
          <p class="note" style="margin-top:0">点地图上你判断的位置。点偏了，会告诉你该往哪个方向找。</p>
        </div>
        <div class="btnrow">
          <button class="btn btn--ghost btn--sm" id="hintBtn">给点提示</button>
          <button class="btn btn--sm" id="mapNext" disabled>下一站</button>
        </div>
      </div>`;

    const wrap = $('#mapwrap'), spotsBox = $('#spots'), card = $('#card');

    function foundList() { return S.spots.maps[tabs[tab].id]; }
    function allFound() { return tabs.every(tb => S.spots.maps[tb.id].length >= tb.spots.length); }

    function render() {
      $('#tabs').innerHTML = tabs.map((tb, i) =>
        `<button class="tab${i === tab ? ' is-on' : ''}" data-tab="${i}">${tb.label}<br><span style="font-size:9px;opacity:.6">${S.spots.maps[tb.id].length}/${tb.spots.length}</span></button>`).join('');
      const tb = tabs[tab];
      $('#mapImg').src = IMG(tb.img);
      const found = foundList();
      spotsBox.innerHTML = tb.spots.map(sp => {
        const isFound = found.indexOf(sp.id) >= 0;
        return `<button class="spot${isFound ? ' is-found' : ''}" data-sp="${sp.id}"
          style="left:${sp.x * 100}%;top:${sp.y * 100}%">
          <span class="spot-label">${esc(sp.name)}</span></button>`;
      }).join('');
      const total = tabs.reduce((n, t2) => n + t2.spots.length, 0);
      const got = tabs.reduce((n, t2) => n + S.spots.maps[t2.id].length, 0);
      $('#foundN').textContent = got;
      $('#totalN').textContent = total;
      $('#leftN').textContent = allFound() ? '全部找齐' : '还剩 ' + (total - got) + ' 处';
      $('#mapNext').disabled = !allFound();
      $('#mapNext').textContent = allFound() ? '下一站' : '找齐后继续';
      if (allFound()) api.complete();
      save();
    }

    function showCard(sp, isNew) {
      card.innerHTML = `
        <div class="spotcard">
          <div class="spotcard__head">
            <span class="spotcard__name">${esc(sp.name)}</span>
            <span class="spotcard__pop">${esc(sp.pop)}</span>
          </div>
          <div class="spotcard__title">${esc(sp.title)}</div>
          <p class="spotcard__text">${esc(sp.origin)}</p>
          <p class="spotcard__note">${esc(sp.text)}</p>
          ${isNew ? '<span class="spotcard__new">新发现</span>' : ''}
          ${sp.longread ? `<button class="spotcard__more" type="button" data-longread="${sp.longread}">读长文</button>` : ''}
        </div>`;
    }

    root.addEventListener('click', (e) => {
      const tb = e.target.closest('[data-tab]');
      if (tb) { tab = +tb.dataset.tab; Sfx.page(); render(); return; }
      const spEl = e.target.closest('[data-sp]');
      if (spEl) {
        e.stopPropagation();
        const id = spEl.dataset.sp;
        const data = tabs[tab].spots.filter(x => x.id === id)[0];
        const found = foundList();
        if (found.indexOf(id) < 0) { found.push(id); Sfx.coin(); api.score('spot'); showCard(data, true); render(); }
        else showCard(data, false);
        return;
      }
      if (e.target.closest('#mapwrap')) {
        const r = wrap.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        const found = foundList();
        const rest = tabs[tab].spots.filter(s => found.indexOf(s.id) < 0);
        if (!rest.length) return;
        let best = null, bd = 9;
        rest.forEach(s => { const d = Math.hypot((s.x - nx) * r.width, (s.y - ny) * r.height); if (d < bd) { bd = d; best = s; } });
        if (!best) return;
        if (bd < 55) { toast('很近了，再偏一点就是「' + best.name + '」。'); }
        else {
          const dx = best.x - nx, dy = best.y - ny;
          let dir = '';
          if (dy < -0.05) dir += '北'; else if (dy > 0.05) dir += '南';
          if (dx > 0.05) dir += '东'; else if (dx < -0.05) dir += '西';
          toast(dir ? '这里没有。往' + dir + '方向找找。' : '这里没有，换个区域看看。');
        }
        Sfx.bad();
      }
    });

    $('#hintBtn').addEventListener('click', () => {
      const found = foundList();
      const rest = tabs[tab].spots.filter(x => found.indexOf(x.id) < 0);
      if (!rest.length) { toast('这一张已经找齐了。'); return; }
      const pick = rest[Math.floor(Math.random() * rest.length)];
      const el = spotsBox.querySelector(`[data-sp="${pick.id}"]`);
      toast('提示：' + pick.name + '，在' + (pick.hint || '这一带') + '。');
      if (el) {
        el.classList.add('is-near');
        setTimeout(() => el.classList.remove('is-near'), 3000);
      }
    });

    $('#mapNext').addEventListener('click', () => { if (allFound()) api.next(); });

    render();
  }

  /* ==========================================================
     6 · 广海遗存 配对
     ========================================================== */
  function levelRuins(root) {
    const items = shuffle(D.RUINS);
    const done = {};
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 六 站 · 远 赴 重 洋</div>
        <h2 class="level__title">广海遗存</h2>
        <p class="level__sub">四张老照片，四处遗址。把照片拖到正确的名字上。</p>
      </div>
      <div class="level__body">
        <div class="ruin-slots" id="slots"></div>
        <div class="panel" style="margin-top:12px">
          <p class="note" style="margin-top:0">先把照片拖到上面的格子里；手机上也可以先点照片，再点格子。</p>
          <div class="ruin-grid" id="cards"></div>
          <div class="msg" id="msg"></div>
        </div>
      </div>`;

    const slotsEl = $('#slots'), cardsEl = $('#cards'), msg = $('#msg');

    function render() {
      slotsEl.innerHTML = D.RUINS.map(r => {
        const filled = done[r.id];
        return `<div class="ruin-slot${filled ? ' is-filled' : ''}" data-slot="${r.id}">
          ${filled ? `<img src="${IMG(r.img)}" alt="">` : ''}
          <div>
            <div>${esc(r.name)}</div>
            <small>${esc(filled ? r.note : '待 配 对')}</small>
            ${filled && r.detail ? `<p class="ruin-detail">${esc(r.detail)}</p>` : ''}
            ${filled && r.longread ? `<button class="spotcard__more" type="button" data-longread="${r.longread}">读长文</button>` : ''}
          </div>
        </div>`;
      }).join('');
      cardsEl.innerHTML = items.map(r =>
        `<div class="ruin-card${done[r.id] ? ' is-used' : ''}" data-key="${r.id}">
          <img src="${IMG(r.img)}" alt="遗址照片" draggable="false">
        </div>`).join('');
    }
    render();

    function onDrop(chip, zone) {
      const key = chip.dataset.key, slot = zone.dataset.slot;
      if (!key || !slot) return;
      if (key === slot) {
        done[slot] = true; Sfx.ok(); msg.className = 'msg is-ok'; msg.textContent = '对了：' + D.RUINS.filter(r => r.id === slot)[0].name;
        render();
        if (Object.keys(done).length === 4) {
          api.complete();
          setTimeout(() => {
            modal({
              tag: '广 海 卫 城', title: '四处遗存，一段海防史',
              text: '城门与城墙、天后宫、烽火台、摩崖石刻——四处遗存拼在一起，才是完整的广海卫城。\n它们比侨批更早，却讲着同一件事：人为什么要走向海，又为什么总要回来。',
              actions: [{ label: '继续参观', fn: api.next }]
            });
          }, 500);
        }
      } else {
        Sfx.bad(); msg.className = 'msg'; msg.textContent = '这张不是「' + D.RUINS.filter(r => r.id === slot)[0].name + '」。';
        zone.classList.add('is-bad');
        setTimeout(() => zone.classList.remove('is-bad'), 600);
      }
    }
    makeDrag(root, { chipSel: '.ruin-card', zoneSel: '.ruin-slot', onDrop });
  }

    /* ==========================================================
     7 / 9 · 展板门框（第一部分 / 第二部分）
     ========================================================== */
  function levelPart(root, data, station) {
    root.innerHTML = `
      <div class="level__head level__head--compact">
        <div class="overline">${esc(station)}</div>
      </div>
      <div class="stele stele--${data.theme || 'teal'}">
        ${steleCrown()}
        <div class="stele__frame">
          <div class="stele__band">
            <span class="band-cn">${esc(data.chapter)}</span>
            <span class="band-en">${esc(data.chapterEn)}</span>
          </div>
          <div class="stele__title"><h2>${esc(data.title)}</h2></div>
          <div class="stele__panel">
            <div class="panel-en">${esc(data.en)}</div>
            <p class="panel-cn">${esc(data.cn)}</p>
            <p class="panel-eng">${esc(data.eng)}</p>
            <div class="panel-art">${STELE_ART[data.art] || ''}</div>
          </div>
        </div>
        <div class="stele__base"></div>
      </div>
      <button class="btn stele__next" id="steleNext">继 续 前 行</button>`;
    $('#steleNext').addEventListener('click', () => {
      const el = root.querySelector('.stele');
      if (el && !el.classList.contains('is-leaving')) {
        el.classList.add('is-leaving');
        Sfx.stamp();
        setTimeout(() => api.next(), 430);
      }
    });
    api.complete();
  }
  function levelPart1(root) { levelPart(root, D.PART1, '第 七 站 · 远 赴 重 洋'); }
  function levelPart2(root) { levelPart(root, D.PART2, '第 九 站 · 拼 搏 海 外'); }

/* ==========================================================
     8 · 五邑沿革（年表拖拽）
     ========================================================== */
  function levelYears(root) {
    const chips = shuffle(D.DYNASTIES);
    const placed = {};
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 八 站 · 远 赴 重 洋</div>
        <h2 class="level__title">五邑沿革</h2>
        <p class="level__sub">八个朝代，八个年份。把年份放回年表上它原来的位置。</p>
      </div>
      <div class="level__body">
        <div class="tl" id="tl">
          <div class="tl__head"><span>五 邑 沿 革 年 表</span><span>← 左右滑动 →</span></div>
          <div class="tl__cols" id="cols"></div>
          <div class="tl__rail"></div>
        </div>
        <div class="panel" style="margin-top:12px">
          <div class="note" style="margin-top:0">年份池（每次进入顺序都会打乱）</div>
          <div class="year-pool" id="pool"></div>
          <div class="msg" id="msg"></div>
        </div>
      </div>`;
    const colsEl = $('#cols'), poolEl = $('#pool'), msg = $('#msg');

    function render() {
      colsEl.innerHTML = D.DYNASTIES.map(d => {
        const y = placed[d.id];
        return `<div class="tl-col">
          <div class="tl-col__dot"></div>
          <div class="tl-col__dyn">${esc(d.dyn)}</div>
          <div class="tl-col__desc">${esc(d.desc || '')}</div>
          <div class="tl-col__year${y ? ' is-filled' : ''}" data-slot="${d.id}">${y ? esc(y) : '拖 入'}</div>
        </div>`;
      }).join('');
      poolEl.innerHTML = chips.map(c =>
        `<div class="year-chip${Object.values(placed).indexOf(c.year) >= 0 ? ' is-used' : ''}" data-year="${esc(c.year)}">${esc(c.year)}</div>`).join('');
    }
    render();

    function onDrop(chip, zone) {
      const year = chip.dataset.year;
      const id = zone.dataset.slot;
      const target = D.DYNASTIES.filter(d => d.id === id)[0];
      if (year === target.year) {
        placed[id] = year; Sfx.ok(); msg.className = 'msg is-ok';
        msg.textContent = target.dyn + ' · ' + target.note;
        render();
        if (Object.keys(placed).length === D.DYNASTIES.length) {
          api.complete();
          setTimeout(() => {
            modal({
              tag: '沿 革', title: '从夏商周到新中国',
              text: '公元前 214 年，秦定岭南，设南海郡，五邑自此纳入中原版图；420 年、581 年、960 年……每一个年份，都是这片土地的一次转身。\n到了 1912 年、1949 年，出海的人带回来的，已经不只是银元。',
              actions: [{ label: '继续', fn: api.next }]
            });
          }, 450);
        }
      } else {
        Sfx.bad(); msg.className = 'msg'; msg.textContent = year + ' 不属于' + target.dyn + '。';
        zone.classList.add('is-bad');
        setTimeout(() => zone.classList.remove('is-bad'), 600);
      }
    }
    makeDrag(root, { chipSel: '.year-chip', zoneSel: '.tl-col__year', onDrop });
  }

  /* ==========================================================
     10 · 琉琅妹淘锡
     ========================================================== */
  function levelTin(root) {
    let step = 0;
    let digs = 0, washes = 0, lastDir = 0, got = 0, ore = 0;
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 十 站 · 拼 搏 海 外</div>
        <h2 class="level__title">琉琅妹淘锡</h2>
        <p class="level__sub">${esc(D.TIN.role)}　·　近打谷锡矿</p>
      </div>
      <div class="level__body">
        <div class="tin-art">
          <svg viewBox="0 0 640 180" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2b3f46"/><stop offset="1" stop-color="#0e2026"/>
              </linearGradient>
              <linearGradient id="thill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3f5147"/><stop offset="1" stop-color="#1d2b27"/>
              </linearGradient>
            </defs>
            <rect width="640" height="180" fill="url(#tsky)"/>
            <circle cx="520" cy="42" r="20" fill="#e2c47c" opacity="0.5"/>
            <path d="M0 120 L120 60 L230 120 Z" fill="url(#thill)"/>
            <path d="M150 130 L300 54 L450 130 Z" fill="url(#thill)" opacity="0.85"/>
            <path d="M400 132 L520 76 L640 132 Z" fill="url(#thill)" opacity="0.7"/>
            <rect y="120" width="640" height="60" fill="#141f1c"/>
            <g stroke="#6b5a3f" stroke-width="5">
              <line x1="120" y1="128" x2="120" y2="62"/><line x1="230" y1="128" x2="230" y2="62"/>
              <line x1="106" y1="64" x2="244" y2="64"/>
            </g>
            <g stroke="#8a7654" stroke-width="2" opacity="0.75">
              <line x1="106" y1="80" x2="244" y2="80"/><line x1="106" y1="96" x2="244" y2="96"/>
            </g>
            <g transform="translate(300,86)">
              <ellipse cx="0" cy="64" rx="26" ry="6" fill="#0a1210" opacity="0.6"/>
              <path d="M-14 62 L-10 26 L10 26 L14 62 Z" fill="#3a4b4a"/>
              <path d="M-12 26 L0 8 L12 26 Z" fill="#7d6b4a"/>
              <circle cx="0" cy="14" r="8" fill="#c9a97f"/>
              <path d="M-18 10 L0 0 L18 10 Z" fill="#9c8455"/>
            </g>
            <g transform="translate(470,110)">
              <rect x="-28" y="0" width="56" height="26" rx="3" fill="#3b3a33"/>
              <rect x="-28" y="0" width="56" height="6" fill="#57544a"/>
              <circle cx="-16" cy="30" r="7" fill="#1b1d1a"/><circle cx="16" cy="30" r="7" fill="#1b1d1a"/>
            </g>
          </svg>
        </div>
        <div class="panel">
          <div class="tin-hud" id="tinHud">
            <span class="tin-pip is-on"></span><span class="tin-pip"></span><span class="tin-pip"></span>
          </div>
          <p class="note" style="margin-top:0">${esc(D.TIN.intro)}</p>
          <div class="tin-stage" id="tinStage"></div>
        </div>
      </div>`;

    const stage = $('#tinStage');
    const hud = $('#tinHud');
    function setStep(n) { $$('.tin-pip', hud).forEach((el, i) => el.classList.toggle('is-on', i <= n)); }
    function head() {
      const st = D.TIN.steps[step];
      return `<div class="overline" style="margin-bottom:8px">${esc(st.title)}</div>
        <p style="margin:0 0 8px;font-size:13.5px;line-height:1.9;color:#3a3126">${esc(st.desc)}</p>
        ${st.know ? `<p class="tin-know" style="margin:0 0 10px"><b>小知识</b>${esc(st.know)}</p>` : ''}`;
    }

    function drawDig() {
      setStep(0);
      stage.innerHTML = `${head()}
        <div class="tin-scene"><div class="ore-pile" id="pile"></div></div>
        <div class="ore-bar"><i id="oreBar"></i></div>
        <div class="ore-label" id="oreLab">${esc(D.TIN.steps[0].tip)}　0 / 10</div>`;
      $('#pile').addEventListener('click', () => {
        digs++; Sfx.tap();
        $('#oreBar').style.width = (digs / 10 * 100) + '%';
        $('#oreLab').textContent = D.TIN.steps[0].tip + '　' + digs + ' / 10';
        if (digs >= 10) { Sfx.ok(); setTimeout(() => { step = 1; drawWash(); }, 350); }
      });
    }

    function drawWash() {
      setStep(1);
      stage.innerHTML = `${head()}
        <div class="sieve-wrap">
          <div class="sieve" id="sieve"><div class="mud" id="mud"></div><span>淘 洗 盆</span></div>
        </div>
        <div class="ore-bar"><i id="oreBar"></i></div>
        <div class="ore-label" id="oreLab">${esc(D.TIN.steps[1].tip)}　0 / 6</div>`;
      const sieve = $('#sieve'), mud = $('#mud');
      let dragging = false, startX = 0, lastSign = 0, done = false;

      function setX(x) {
        sieve.style.transform = `translateX(${x}px) rotate(${x * 0.05}deg)`;
        // 只有越过中线两侧、幅度足够，才算“冲了一下”
        const sign = Math.abs(x) > 16 ? Math.sign(x) : 0;
        if (sign && lastSign && sign !== lastSign) {
          washes++;
          Sfx.tap();
          const n = Math.min(washes, 6);
          $('#oreBar').style.width = (n / 6 * 100) + '%';
          $('#oreLab').textContent = D.TIN.steps[1].tip + '　' + n + ' / 6';
          mud.style.opacity = String(Math.max(0, 1 - n / 6));
          if (washes >= 6) fin();
        }
        if (sign) lastSign = sign;
      }

      function fin() {
        if (done) return;
        done = true;
        Sfx.ok();
        dragging = false;
        sieve.style.transition = 'transform .2s ease-out';
        sieve.style.transform = '';
        setTimeout(() => { step = 2; drawPick(); }, 420);
      }

      sieve.addEventListener('pointerdown', (e) => {
        if (done) return;
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        startX = e.clientX;
        lastSign = 0;
        sieve.style.transition = 'none';
        try { sieve.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });

      sieve.addEventListener('pointermove', (e) => {
        if (!dragging || done) return;
        e.preventDefault();
        const dx = e.clientX - startX;
        if (Math.abs(dx) < 8) return;          // 轻点、抖动都不算
        setX(Math.max(-80, Math.min(80, dx)));
      });

      const end = () => {
        if (!dragging) return;
        dragging = false;
        // 松手回中，下一次拖拽从中线重新开始
        sieve.style.transition = 'transform .24s cubic-bezier(.22,.61,.36,1)';
        sieve.style.transform = '';
      };
      sieve.addEventListener('pointerup', end);
      sieve.addEventListener('pointercancel', end);
      sieve.addEventListener('pointerleave', end);
    }

    function drawPick() {
      setStep(2);
      const grains = [];
      const tinIdx = new Set(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5).map(x => x));
      for (let i = 0; i < 9; i++) {
        grains.push({ sand: !tinIdx.has(i), x: 14 + Math.random() * 72, y: 12 + Math.random() * 76, gone: false });
      }
      stage.innerHTML = `${head()}
        <div class="grains" id="grains"></div>
        <div class="tin-count" id="tc">已拾 0 / 5 颗</div>`;
      const box = $('#grains');
      box.innerHTML = grains.map((g, i) =>
        `<div class="grain${g.sand ? ' is-sand' : ''}" data-g="${i}" style="left:${g.x}%;top:${g.y}%"></div>`).join('');
      box.addEventListener('click', (e) => {
        const el = e.target.closest('[data-g]');
        if (!el) return;
        const i = +el.dataset.g;
        const g = grains[i];
        if (g.gone) return;
        if (g.sand) {
          Sfx.bad(); el.style.transform = 'scale(0.7)'; setTimeout(() => el.style.transform = '', 200);
          toast('那是沙石，不是锡米。');
          return;
        }
        g.gone = true; got++; el.classList.add('is-gone'); Sfx.coin();
        $('#tc').textContent = '已拾 ' + got + ' / 5 颗';
        if (got >= 5) {
          Sfx.chime();
          api.complete();
          setTimeout(() => {
            modal({
              tag: '称 重', title: '今日得锡三斤',
              text: '你把五颗锡米交到账房。称重、记账、装袋——这一天，换回来半袋米。\n矿上的日子，就是这样一天一天淘出来的。\n\n' + (D.TIN.ending || ''),
              actions: [{ label: '离开矿场', fn: api.next }]
            });
          }, 500);
        }
      });
    }

    drawDig();
  }

  /* ==========================================================
     11 · 修建美洲铁路（俯视图）
     ========================================================== */
  /* 铁路关：地形图标、构件图标、铺好后的标记 */
  const TER_GICO = { plain: '≡', mount: '▲', valley: '⌄', river: '≈', cliff: '◣' };
  const STRUCT = { plain: '路', mount: '隧', valley: '栈', river: '桥', cliff: '墙' };
  const PICO = { roadbed: '▤', tunnel: '◯', trestle: '⌇', bridge: '≋', retaining: '▨' };

  function levelRail(root) {
    /* ---- 1. 每次进入随机生成线路与地形分布 ---- */
    const TERRAINS = D.RAIL.terrains;
    const tById = {};
    TERRAINS.forEach((t) => { tById[t.id] = t; });
    const ids = TERRAINS.map((t) => t.id);
    // 九段：五种地形至少各一段，其余随机重复
    let seq = ids.slice();
    while (seq.length < 9) seq.push(ids[Math.floor(Math.random() * ids.length)]);
    seq = shuffle(seq);

    // 点位：从左到右，纵向随机起伏，保证不重叠
    const pts = [{ x: 24, y: 214 }];
    const x0 = 64, x1 = 372;
    let y = 118;
    for (let i = 0; i < seq.length; i++) {
      const x = x0 + (x1 - x0) * i / (seq.length - 1);
      y += (Math.random() * 2 - 1) * 40;
      y = Math.max(66, Math.min(196, y));
      pts.push({ x: Math.round(x), y: Math.round(y) });
    }
    const NODES = seq.map((tid, i) => ({
      id: 'n' + i, terrain: tid, x: pts[i + 1].x, y: pts[i + 1].y,
      label: tById[tid].name, icon: TER_GICO[tid] || '·'
    }));
    const D_PATH = 'M' + pts.map((p) => `${p.x} ${p.y}`).join(' L');

    /* 每种地形画一小段景物，让随机线路也有画面 */
    function scenery(tid, x, y) {
      if (tid === 'mount') {
        return `<g fill="#22484a" stroke="#3d6f6d" stroke-width="1">
          <path d="M${x - 26} ${y + 20} L${x - 10} ${y - 12} L${x + 6} ${y + 20} Z"/>
          <path d="M${x - 2} ${y + 20} L${x + 12} ${y - 4} L${x + 26} ${y + 20} Z" fill="#1b3a3c"/></g>`;
      }
      if (tid === 'valley') {
        return `<path d="M${x - 28} ${y - 8} Q${x} ${y + 30} ${x + 28} ${y - 8}" fill="none" stroke="#3d6f6d" stroke-width="2"/>
          <path d="M${x - 6} ${y + 4} L${x - 6} ${y + 26} M${x + 6} ${y + 4} L${x + 6} ${y + 26}" stroke="#2a5457" stroke-width="1.5"/>`;
      }
      if (tid === 'river') {
        return `<path d="M${x - 30} ${y - 26} Q${x - 8} ${y - 2} ${x + 2} ${y + 22} Q${x + 10} ${y + 40} ${x + 30} ${y + 50}"
          stroke="url(#riverg)" stroke-width="11" fill="none" opacity="0.8" stroke-linecap="round"/>`;
      }
      if (tid === 'cliff') {
        return `<path d="M${x - 30} ${y + 18} L${x - 14} ${y + 18} L${x - 14} ${y} L${x + 2} ${y} L${x + 2} ${y - 18} L${x + 18} ${y - 18}"
          stroke="#7a5a3a" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
      }
      return `<g stroke="#3a5c4a" stroke-width="1" opacity="0.55">
        <path d="M${x - 24} ${y + 16} h20 M${x - 18} ${y + 8} h18 M${x - 10} ${y + 24} h20"/></g>`;
    }

    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 十 一 站 · 拼 搏 海 外</div>
        <h2 class="level__title">修建美洲铁路</h2>
        <p class="level__sub">俯视图。九段线路，五种地形，分布每次都不一样。把构件放到对应地形上，再发车。</p>
      </div>
      <div class="level__body">
        <div class="railmap">
          <svg viewBox="0 0 400 250" class="railmap__svg" aria-label="铁路线路图">
            <defs>
              <linearGradient id="mapbg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#14323a"/><stop offset="1" stop-color="#08171d"/>
              </linearGradient>
              <linearGradient id="riverg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#2f7f92"/><stop offset="1" stop-color="#12414f"/>
              </linearGradient>
            </defs>
            <rect width="400" height="250" fill="url(#mapbg)"/>
            <g opacity="0.22" stroke="#8fc3c9" fill="none" stroke-width="0.8">
              <path d="M0 40 C60 30 120 55 180 40 S300 20 400 40"/>
              <path d="M0 78 C70 66 130 92 200 74 S320 56 400 78"/>
              <path d="M0 230 C70 218 140 240 210 224 S330 206 400 230"/>
            </g>
            ${NODES.map((n) => scenery(n.terrain, n.x, n.y)).join('')}
            <path id="railPath" d="${D_PATH}" fill="none" stroke="#5c5344" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>
            <path id="railLit" d="${D_PATH}" fill="none" stroke="#e2c47c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"
              stroke-dasharray="0 9999" opacity="0.95"/>
            <g id="railNodes">
              ${NODES.map((n) => `<g class="rnode" data-slot="${n.id}" transform="translate(${n.x},${n.y})">
                <circle r="12"></circle>
                <text class="rnode__ico" y="4">${n.icon}</text>
                <text class="rnode__label" y="24">${n.label}</text>
              </g>`).join('')}
            </g>
            <g id="railTrain" transform="translate(24,214)">
              <rect x="-10" y="-6" width="20" height="12" rx="3" fill="#e2c47c"/>
              <rect x="-4" y="-3" width="8" height="7" rx="1.5" fill="#0b1a20"/>
            </g>
            <circle cx="24" cy="214" r="3.5" fill="#8fc3c9"/>
            <circle cx="${pts[pts.length - 1].x}" cy="${pts[pts.length - 1].y}" r="3.5" fill="#8fc3c9"/>
          </svg>
        </div>
        <div class="panel" style="margin-top:12px">
          <div class="note" style="margin-top:0">构件箱 · 一种构件可以用在多处；先点构件，再点地形</div>
          <div class="part-pool" id="pool"></div>
          <div class="msg" id="msg"></div>
          <button class="btn btn--block" id="run" disabled style="margin-top:14px">发 车</button>
        </div>
      </div>`;

    const poolEl = $('#pool'), msg = $('#msg'), run = $('#run');
    const railLit = $('#railLit');
    const placed = {};

    function render() {
      poolEl.innerHTML = D.RAIL.parts.map((p) =>
        `<div class="part-chip" data-part="${p.id}">
          <span class="part-chip__ico">${PICO[p.id] || '·'}</span>${esc(p.name)}
        </div>`).join('');
      NODES.forEach((n) => {
        const g = root.querySelector(`.rnode[data-slot="${n.id}"]`);
        if (!g) return;
        const built = placed[n.id];
        g.classList.toggle('is-built', !!built);
        g.querySelector('.rnode__ico').textContent = built ? STRUCT[n.terrain] : n.icon;
        g.querySelector('.rnode__label').textContent = built ? built.name : n.label;
      });
      const k = Object.keys(placed).length;
      run.disabled = k !== NODES.length;
      run.textContent = k === NODES.length ? '发 车' : '还差 ' + (NODES.length - k) + ' 处';
    }
    render();

    function onDrop(chip, zone) {
      const pid = chip.dataset.part, sid = zone.dataset.slot;
      const node = NODES.filter((n) => n.id === sid)[0];
      const p = D.RAIL.parts.filter((x) => x.id === pid)[0];
      const t = tById[node.terrain];
      if (t.need === p.name) {
        placed[sid] = p; Sfx.ok(); msg.className = 'msg is-ok';
        msg.textContent = t.name + ' · 用' + p.name + '，稳了。';
        render();
        if (Object.keys(placed).length === NODES.length) msg.textContent = '全线铺通。可以发车了。';
      } else {
        Sfx.bad(); msg.className = 'msg';
        msg.textContent = '「' + p.name + '」不适合' + t.name + '。';
        zone.classList.add('is-bad');
        setTimeout(() => zone.classList.remove('is-bad'), 600);
      }
    }
    makeDrag(root, { chipSel: '.part-chip', zoneSel: '.rnode', onDrop });

    run.addEventListener('click', () => {
      if (run.disabled) return;
      run.disabled = true;
      Sfx.stamp();
      const path = $('#railPath');
      const len = path.getTotalLength();
      const train = $('#railTrain');
      const t0 = performance.now();
      const dur = 3400;
      (function move(now) {
        const p = Math.min(1, (now - t0) / dur);
        const d = len * p;
        railLit.setAttribute('stroke-dasharray', d + ' 9999');
        const pt = path.getPointAtLength(d);
        const pt2 = path.getPointAtLength(Math.min(len, d + 1));
        const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
        train.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${ang})`);
        if (p < 1) requestAnimationFrame(move);
        else {
          Sfx.chime();
          api.score('railway');
          api.complete();
          modal({
            tag: '华 工 · 1869', title: '通车了',
            text: '1863—1869 年，约 1.2 万名华工参与太平洋铁路修建，占工人总数的八成以上。最艰险的西段几乎全靠华工：他们在悬崖上吊着绳索凿孔装药，在零下几十度的暴风雪里铺轨，枕木下埋着同伴的尸骨。\n铁路通车，美国东西两岸从此连成一体，横贯大陆的旅程从数月缩短到一周，而华工的名字却长期被抹去。直到今天，内华达山脉的“最后一颗道钉”纪念地，仍刻着他们的贡献。\n恭喜你，为这条铁路铺下了属于自己的一段。',
            actions: [{ label: '离开铁路', fn: api.next }]
          });
        }
      }(t0));
    });
  }

  /* ==========================================================
     12 · 唐人街
     ========================================================== */
  function levelChinatown(root) {
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 十 二 站 · 融 通 中 外</div>
        <h2 class="level__title">唐人街</h2>
        <p class="level__sub">牌坊下两条街。向左，向右。</p>
      </div>
      <div class="chinatown">
        <div class="ct-actions">
          <button class="btn btn--dark" id="left">向 左 走<small>左侧临街铺面</small></button>
          <button class="btn btn--dark" id="right">向 右 走<small>右侧临街铺面</small></button>
        </div>
      </div>`;
    function pick(side) {
      Sfx.tap();
      api.complete();
      modal({
        tag: side === 'left' ? '向 左' : '向 右',
        title: side === 'left' ? '左边：洗衣店的蒸汽' : '右边：还是洗衣店的蒸汽',
        text: side === 'left'
          ? '左边这条街，晾衣绳从二楼一直拉到对面。蒸汽、肥皂味、炭火熨斗——华昌洗衣店就在这里。'
          : '你向右走，绕过牌坊，又看见一块“華昌洗衣店”的招牌。唐人街不大，走一圈还是回到这里。',
        actions: [{ label: '推门进去', fn: api.next }]
      });
    }
    $('#left').addEventListener('click', () => pick('left'));
    $('#right').addEventListener('click', () => pick('right'));
  }

  /* ==========================================================
     13 · 华昌洗衣店（熨烫）
     ========================================================== */
  function levelLaundry(root) {
    const spots = [];
    for (let g = 0; g < 3; g++) {
      for (let k = 0; k < 2; k++) {
        spots.push({ g, x: 24 + k * 42 + Math.random() * 10, y: 30 + Math.random() * 34, done: false });
      }
    }
    let cleared = 0;

    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 十 三 站 · 融 通 中 外</div>
        <h2 class="level__title">华昌洗衣店</h2>
        <p class="level__sub">${esc(D.LAUNDRY.intro)}</p>
      </div>
      <div class="level__body">
        <div class="panel" style="margin-bottom:12px">
          <div class="overline" style="margin-bottom:6px">店 里 的 一 天</div>
          <p style="margin:0">${esc(D.LAUNDRY.story || '')}</p>
        </div>
        <div class="shop">
          <div class="shop__title"><span>WAHCHONG · 工 作 台</span><span>熨平 <b id="lp">0 / 6</b></span></div>
          <div class="workbench" id="bench"></div>
        </div>
        <div class="panel" style="margin-top:12px">
          <p class="note" style="margin-top:0">${esc(D.LAUNDRY.tip)}</p>
          <div class="btnrow"><button class="btn" id="lnNext" disabled>熨 好 了</button></div>
        </div>
        <div class="iron-cursor" id="iron">
          <svg viewBox="0 0 64 64" fill="none">
            <path d="M10 44h44l-6-14H22c-7 0-12 5-12 14z" fill="#4b5b60" stroke="#c9a24a" stroke-width="2"/>
            <path d="M18 30V18h20c8 0 13 5 15 12" stroke="#c9a24a" stroke-width="2" fill="none"/>
            <path d="M12 46h42" stroke="#f3ead8" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>`;

    const bench = $('#bench'), iron = $('#iron'), lp = $('#lp');

    const shirtSvg = `<svg viewBox="0 0 100 128" preserveAspectRatio="none">
      <path d="M32 14 L20 22 L12 44 L24 50 L26 118 L74 118 L76 50 L88 44 L80 22 L68 14 L58 22 L50 26 L42 22 Z"
        fill="#fbf7ee" stroke="#d9cdb6" stroke-width="1.4"/>
      <path d="M42 22 L50 34 L58 22" fill="none" stroke="#d9cdb6" stroke-width="1.2"/>
      <line x1="50" y1="36" x2="50" y2="112" stroke="#e3d9c6" stroke-width="1"/>
    </svg>`;

    bench.innerHTML = spots.map((s, i) => {
      if (i % 2 === 0) {
        return `<div class="garment" data-g="${s.g}">${shirtSvg}
          <div class="wrinkle" data-w="${i}" style="left:${spots[i].x}%;top:${spots[i].y}%"></div>
          <div class="wrinkle" data-w="${i + 1}" style="left:${spots[i + 1].x}%;top:${spots[i + 1].y}%"></div>
        </div>`;
      }
      return '';
    }).join('');

    function updateIron(e) {
      iron.style.left = e.clientX + 'px';
      iron.style.top = e.clientY + 'px';
      let hit = null;
      $$('.wrinkle').forEach(w => {
        if (w.classList.contains('is-done')) return;
        const r = w.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (Math.hypot(e.clientX - cx, e.clientY - cy) < 34) hit = w;
      });
      if (hit) {
        hit.classList.add('is-done');
        steamAt(hit);
        Sfx.page();
        cleared++; lp.textContent = cleared + ' / 6';
        if (cleared >= 6) {
          Sfx.chime();
          api.complete();
          $('#lnNext').disabled = false;
          $('#lnNext').textContent = '打 烊';
          toast('六道皱褶都熨平了。');
        }
      }
    }
    function steamAt(el) {
      const r = el.getBoundingClientRect();
      const s = document.createElement('div');
      s.className = 'steam';
      s.style.position = 'fixed';
      s.style.left = (r.left + r.width / 2) + 'px';
      s.style.top = (r.top + r.height / 2) + 'px';
      s.style.zIndex = 130;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 800);
    }

    /* 熨斗：只有按住鼠标（或手指）时才移动与熨烫，松开即停 */
    let pressing = false;
    function pressStart(e) {
      if (e.button !== undefined && e.button !== 0) return;
      pressing = true;
      iron.classList.add('is-on');
      try { bench.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      updateIron(e);
    }
    function pressMove(e) {
      if (!pressing) return;
      e.preventDefault();
      updateIron(e);
    }
    function pressEnd() {
      if (!pressing) return;
      pressing = false;
      iron.classList.remove('is-on');
    }
    bench.addEventListener('pointerdown', pressStart);
    bench.addEventListener('pointermove', pressMove);
    window.addEventListener('pointerup', pressEnd);
    window.addEventListener('pointercancel', pressEnd);

    $('#lnNext').addEventListener('click', () => {
      modal({
        tag: '洗 衣 店 · 打 烊', title: '一件衬衫，三道工序',
        text: '19 世纪末，洗衣业是许多华人在海外最早立足的行当。热水、搓板、炭火熨斗，一天要烫几十件。\n熨平的不只是衣裳，也是一家人的生计。\n\n' + (D.LAUNDRY.ending || ''),
        actions: [{ label: '去学校', fn: api.next }]
      });
    });
  }

  /* ==========================================================
     14 · 中华侨民学校（两个小游戏）
     ========================================================== */
  function levelSchool(root) {
    let stage = 'intro';
    root.innerHTML = `
      <div class="level__head">
        <div class="overline">第 十 四 站 · 融 通 中 外</div>
        <h2 class="level__title">中华侨民学校</h2>
        <p class="level__sub">${esc(D.SCHOOL.intro)}</p>
      </div>
      <div class="level__body" id="schoolBody"></div>
      <div class="level__body" id="lessonBody"></div>`;
    const body = $('#schoolBody'), lesson = $('#lessonBody');

    function intro() {
      body.innerHTML = `
        <figure class="scene-card">
          <img src="${IMG('school')}" alt="中华侨民学校">
          <figcaption>中华侨民学校 · 教室门口</figcaption>
        </figure>
        <div class="panel" style="margin-top:12px">
          <p>${esc(D.SCHOOL.intro)}</p>
          <p class="note">${esc(D.SCHOOL.less1Text)}</p>
          <button class="btn btn--block" id="lesson1" style="margin-top:12px">第 一 课 · 铁 路</button>
        </div>`;
      $('#lesson1').addEventListener('click', () => { stage = 'dodge'; body.innerHTML = ''; startDodge(); });
    }

    /* ---- 第一课：躲避落石（左右按钮） ---- */
    function startDodge() {
      lesson.innerHTML = `
        <div class="game-shell">
          <div class="game-hud"><span>${esc(D.SCHOOL.less1)}</span><span class="hearts" id="dh">♥♥♥</span></div>
          <div class="progress"><i id="dbar"></i></div>
          <div class="canvas-wrap"><canvas id="dcv"></canvas></div>
          <div class="dodge-ctrl">
            <button class="dodge-btn" id="dLeft" aria-label="向左"><span>◀</span>向 左</button>
            <button class="dodge-btn" id="dRight" aria-label="向右">向 右<span>▶</span></button>
          </div>
        </div>`;
      const cv = $('#dcv');
      const W = 360, H = 380;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.aspectRatio = W + ' / ' + H;
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);

      const lanes = [W * 0.2, W * 0.5, W * 0.8];
      let lane = 1, rocks = [], t = 0, hp = 3, over = false, raf = 0, last = 0, spawn = 0;
      const goal = 20;

      function draw() {
        ctx.fillStyle = '#0d1b21'; ctx.fillRect(0, 0, W, H);
        lanes.forEach((x, i) => {
          ctx.strokeStyle = i === lane ? 'rgba(201,162,74,0.65)' : 'rgba(243,234,216,0.10)';
          ctx.lineWidth = i === lane ? 3 : 2;
          ctx.beginPath(); ctx.moveTo(x, 54); ctx.lineTo(x, H - 40); ctx.stroke();
          ctx.strokeStyle = 'rgba(243,234,216,0.07)'; ctx.lineWidth = 1;
          for (let y = 54; y < H - 40; y += 18) { ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.stroke(); }
        });
        const px = lanes[lane], py = H - 52;
        ctx.fillStyle = 'rgba(201,162,74,0.18)';
        ctx.beginPath(); ctx.arc(px, py + 12, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9a24a';
        ctx.fillRect(px - 17, py, 34, 17);
        ctx.fillStyle = '#e8d6ae';
        ctx.beginPath(); ctx.arc(px, py - 5, 6, 0, Math.PI * 2); ctx.fill();

        rocks.forEach(r => {
          const rx = lanes[r.lane];
          ctx.fillStyle = r.hit ? 'rgba(200,80,60,0.45)' : '#8d887a';
          ctx.beginPath();
          ctx.moveTo(rx - 13, r.y + 10); ctx.lineTo(rx - 7, r.y - 9); ctx.lineTo(rx + 8, r.y - 12);
          ctx.lineTo(rx + 14, r.y + 7); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.beginPath();
          ctx.moveTo(rx - 7, r.y - 9); ctx.lineTo(rx + 8, r.y - 12); ctx.lineTo(rx + 2, r.y - 2);
          ctx.closePath(); ctx.fill();
        });
      }

      function loop(now) {
        if (!cv.isConnected) { cancelAnimationFrame(raf); return; }
        if (!last) last = now;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!over) {
          t += dt;
          spawn -= dt;
          if (spawn <= 0) {
            spawn = Math.max(0.36, 0.8 - t * 0.015);
            rocks.push({ lane: Math.floor(Math.random() * 3), y: -20, vy: 190 + t * 6, hit: false });
          }
          rocks.forEach(r => {
            r.y += r.vy * dt;
            if (!r.hit && r.lane === lane && r.y > H - 68 && r.y < H - 28) {
              r.hit = true; hp--; Sfx.bad();
              $('#dh').textContent = '♥'.repeat(Math.max(0, hp)) + '♡'.repeat(3 - Math.max(0, hp));
              if (hp <= 0) end(false);
            }
          });
          rocks = rocks.filter(r => r.y < H + 30);
          $('#dbar').style.width = Math.min(100, t / goal * 100) + '%';
          if (t >= goal) end(true);
        }
        draw();
        raf = requestAnimationFrame(loop);
      }

      function turn(d) {
        if (over) return;
        const prev = lane;
        lane = Math.max(0, Math.min(2, lane + d));
        if (lane !== prev) Sfx.tap();
      }
      $('#dLeft').addEventListener('click', () => turn(-1));
      $('#dRight').addEventListener('click', () => turn(1));

      function end(win) {
        over = true; cancelAnimationFrame(raf);
        Sfx[win ? 'chime' : 'bad']();
        lesson.insertAdjacentHTML('beforeend', `<div class="panel" style="margin-top:12px"><div class="result-box">
          <h3>${win ? '抵 达 营 地' : '小 车 翻 了'}</h3>
          <p>${win ? '落石没有拦住你。铁路就是这样一段一段铺过去的。' : '再来一次，这次注意看石头落在哪条轨道。'}</p>
          <button class="btn btn--block" id="dodgeNext" style="margin-top:14px">${win ? '下 一 课' : '再 来 一 次'}</button>
        </div></div>`);
        $('#dodgeNext').addEventListener('click', () => {
          if (win) { api.score('dodge'); startMatch(); }
          else { lesson.innerHTML = ''; startDodge(); }
        });
      }

      raf = requestAnimationFrame(loop);
    }

    /* ---- 第二课：老照片配对 ---- */
    function startMatch() {
      const deck = shuffle(D.PEOPLE.concat(D.PEOPLE)).map((p, i) => ({ ...p, uid: i }));
      const total = D.PEOPLE.length;
      let flipped = [], cleared = 0, busy = false;

      lesson.innerHTML = `
        <div class="game-shell">
          <div class="match-hud">
            <span>${esc(D.SCHOOL.less2)}</span>
            <span>还剩 <b id="mLeft">${total}</b> 对</span>
          </div>
          <div class="mem-grid" id="memGrid"></div>
          <div class="canvas-note">翻开两张，找出同一个人。配对成功，就能看到他的故事。</div>
          <div class="panel mem-info" id="memInfo" style="margin-top:12px">
            <p class="note" style="margin-top:0">配对成功后，这里会出现人物的介绍。</p>
          </div>
        </div>`;

      const grid = $('#memGrid');
      grid.innerHTML = deck.map((c, i) =>
        `<button class="mem-card" data-i="${i}">
          <span class="mem-card__back"><i>?</i></span>
          <span class="mem-card__face"><img src="${IMG(c.img)}" alt="${esc(c.name)}"><b>${esc(c.name)}</b></span>
        </button>`).join('');

      // 开局预览 1.8 秒
      setTimeout(() => {
        Array.prototype.forEach.call(grid.querySelectorAll('.mem-card'), (c) => c.classList.add('is-flipped'));
        setTimeout(() => {
          Array.prototype.forEach.call(grid.querySelectorAll('.mem-card'), (c) => c.classList.remove('is-flipped'));
        }, 1800);
      }, 260);

      function showInfo(p) {
        $('#memInfo').innerHTML = `
          <div class="mem-person">
            <img src="${IMG(p.img)}" alt="${esc(p.name)}">
            <div>
              <div class="mem-person__name">${esc(p.name)}<span>${esc(p.dates)}</span></div>
              <div class="mem-person__from">${esc(p.from)}</div>
              <p>${esc(p.note)}</p>
            </div>
          </div>`;
      }

      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.mem-card');
        if (!card || busy) return;
        const i = +card.dataset.i;
        if (card.classList.contains('is-cleared') || card.classList.contains('is-flipped')) return;
        card.classList.add('is-flipped');
        Sfx.tap();
        flipped.push(i);
        if (flipped.length < 2) return;

        const a = flipped[0], b = flipped[1];
        const ca = deck[a], cb = deck[b];
        if (ca.img === cb.img) {
          busy = true;
          setTimeout(() => {
            const ea = grid.querySelector(`[data-i="${a}"]`), eb = grid.querySelector(`[data-i="${b}"]`);
            ea.classList.add('is-cleared'); eb.classList.add('is-cleared');
            Sfx.coin();
            cleared++;
            $('#mLeft').textContent = total - cleared;
            showInfo(ca);
            // 居中弹出详细人物卡，确保玩家读到
            modal({
              tag: '校 友 · ' + (ca.dates || ''),
              title: ca.name + '　' + (ca.from || ''),
              text: (ca.note || '') + (ca.bio ? '\n' + ca.bio : ''),
              actions: [{ label: '记 住 了' }]
            });
            flipped = []; busy = false;
            if (cleared === total) win();
          }, 480);
        } else {
          busy = true;
          setTimeout(() => {
            grid.querySelector(`[data-i="${a}"]`).classList.remove('is-flipped');
            grid.querySelector(`[data-i="${b}"]`).classList.remove('is-flipped');
            flipped = []; busy = false;
            Sfx.bad();
          }, 900);
        }
      });

      function win() {
        Sfx.chime();
        api.score('match');
        api.complete();
        const g = document.querySelector('#memGrid');
        if (g) g.classList.add('is-done');
        lesson.insertAdjacentHTML('beforeend', `<div class="panel" style="margin-top:12px"><div class="result-box">
          <h3>两 节 课 都 上 完 了</h3>
          <p>落石、铁轨、老照片——这些就是华侨的故事。<br>下课。</p>
          <button class="btn btn--block" id="schoolNext" style="margin-top:14px">走 出 校 门</button>
        </div></div>`);
        $('#schoolNext').addEventListener('click', api.next);
        $('#schoolNext').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    intro();
    if (window.__md) {
      window.__md.startDodge = () => { body.innerHTML = ''; startDodge(); };
      window.__md.startMatch = () => { body.innerHTML = ''; startMatch(); };
      window.__md.schoolWin = () => api.complete();
    }
  }

  /* ==========================================================
     15 · 结束
     ========================================================== */
  function levelEnding(root) {
    const mins = Math.max(1, Math.round(S.elapsed / 60000));
    const spots = S.spots.maps ? (S.spots.maps.world.length + S.spots.maps.wuyi.length) : 0;
    const games = Object.keys(S.games).length;
    const gallery = ['front', 'hall', 'portal', 'route_map', 'world_map', 'ruin_temple', 'years', 'chinatown', 'laundry', 'school', 'rail_red', 'wall_fame1', 'wall_fame2'];
    root.innerHTML = `
      <div class="ending">
        <div class="cert">
          <div class="cert__seal">根在侨乡</div>
          <div class="cert__kicker">${esc(D.ENDING.kicker)}</div>
          <h2>${esc(D.ENDING.title)}</h2>
          <div class="cert__en">ROOTED IN QIAOXIANG</div>
          <div class="cert__body">${D.ENDING.body.split('\n').map(p => `<p style="margin:0 0 8px">${esc(p)}</p>`).join('')}</div>
          <div class="cert__stats">
            <div><b>${S.done.length}</b><span>完成站点</span></div>
            <div><b>${spots}</b><span>发现地点</span></div>
            <div><b>${mins}</b><span>参观分钟</span></div>
          </div>
          <div style="font-family:var(--sans);font-size:10px;color:#8a7452;margin-top:14px;letter-spacing:.1em">
            已通过 ${games} 个互动 · ${esc(D.ENDING.sign)}
          </div>
        </div>
        <div class="gallery">${gallery.map(g => `<img src="${IMG(g)}" alt="" loading="lazy">`).join('')}</div>
        <div class="btnrow" style="margin-top:16px">
          <button class="btn btn--ghost" id="againBtn">再 走 一 遍</button>
          <button class="btn" id="hallBtn">回 到 大 厅</button>
        </div>
      </div>`;
    Sfx.chime();
    api.complete();
    $('#againBtn').addEventListener('click', () => {
      modal({
        title: '重新开始？', text: '进度、发现地点与记录会被清空。',
        actions: [
          { label: '再想想', cls: 'btn--ghost' },
          { label: '重新开始', fn: () => { reset(); go(0); } }
        ]
      });
    });
    $('#hallBtn').addEventListener('click', () => go(1));
  }

  /* ---------------- 关卡挂载表 ---------------- */
  const MOUNT = {
    gate: levelGate,
    hall: levelHall,
    portal: levelPortal,
    history: levelHistory,
    sail: levelSail,
    maps: levelMaps,
    ruins: levelRuins,
    part1: levelPart1,
    years: levelYears,
    part2: levelPart2,
    tin: levelTin,
    railway: levelRail,
    chinatown: levelChinatown,
    laundry: levelLaundry,
    school: levelSchool,
    ending: levelEnding
  };

  /* ---------------- 全局交互 ---------------- */
  let booted = false;
  /* ---------------- 背景音乐（与《侨批归途》同一套合成音） ---------------- */
  const Bgm = (function () {
    let ctx = null, master = null, timer = null, on = false, padNodes = [];
    const SCALE = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00];

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      return ctx;
    }

    function startPad() {
      const g = ctx.createGain();
      g.gain.value = 0.05;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 320;
      [98.0, 146.83].forEach((hz) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = hz;
        o.connect(f);
        o.start();
        padNodes.push(o);
      });
      f.connect(g); g.connect(master);
    }

    function pluck() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const f0 = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() < 0.3 ? 2 : 1);
      const o = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f0;
      o2.type = 'triangle'; o2.frequency.value = f0 * 2.01;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g); o2.connect(g); g.connect(master);
      o.start(t); o2.start(t); o.stop(t + 2.3); o2.stop(t + 2.3);
    }

    function tick() {
      if (!on) return;
      pluck();
      timer = setTimeout(tick, 2600 + Math.random() * 2800);
    }

    function start() {
      if (on) return;
      if (!ensure()) return;
      on = true;
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.setTargetAtTime(0.2, ctx.currentTime, 1.4);
      if (!padNodes.length) startPad();
      timer = setTimeout(tick, 900);
    }

    function stop() {
      if (!on || !ctx) return;
      on = false;
      clearTimeout(timer);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    }

    return { start: start, stop: stop, isOn: function () { return on; } };
  })();

  function init() {
    document.addEventListener('click', function () { if (S.soundOn) Bgm.start(); }, { once: true });
    if (booted) return;
    booted = true;
    const saved = load();
    if (saved) S = saved;
    if (!S.t0) S.t0 = Date.now();

    $('#btnBack').addEventListener('click', () => {
      if (S.level <= 0) { toast('已经在入口了。'); return; }
      Sfx.page();
      go(S.level - 1);
    });
    $('#ctrlPrev').addEventListener('click', () => {
      if (S.level <= 0) return;
      Sfx.page();
      go(S.level - 1);
    });
    $('#ctrlRestart').addEventListener('click', () => {
      const L = LEVELS[S.level];
      if (L.id === 'ending') {
        reset(); go(0); return;
      }
      if (L.id === 'maps' && S.spots.maps) S.spots.maps = { world: [], wuyi: [] };
      const keep = S.done.indexOf(L.id) >= 0;
      if (keep) { /* 重玩不撤销已完成 */ }
      Sfx.page();
      go(S.level);
      toast('本关已重新开始。');
    });
    $('#ctrlNext').addEventListener('click', () => {
      if (S.level >= LEVELS.length - 1) { toast('已经是最后一站了。'); return; }
      if (S.done.indexOf(LEVELS[S.level].id) < 0) {
        Sfx.bad();
        toast('请先完成本关，才能进入下一关。');
        return;
      }
      Sfx.tap();
      go(S.level + 1);
    });
    $('#btnSound').addEventListener('click', () => {
      S.soundOn = !S.soundOn; save(); updateSoundIcon();
      if (S.soundOn) { Sfx.click(); Bgm.start(); } else { Bgm.stop(); }
      toast(S.soundOn ? '声音已开启' : '声音已关闭');
    });
    $('#minimap').addEventListener('click', () => {
      $('#mapModal').hidden = false;
      const dot = $('#mmDot'), big = $('#mmDotBig');
      if (dot && big) {
        big.style.left = dot.style.left; big.style.top = dot.style.top;
        const r = $('#mmRingBig'); if (r) { r.style.left = dot.style.left; r.style.top = dot.style.top; }
      }
      $('#mapLabel').textContent = LEVELS[S.level].zone + ' · 你在这里';
    });
    $('#mapModalClose').addEventListener('click', () => { $('#mapModal').hidden = true; });
    $('#mapModal').addEventListener('click', (e) => { if (e.target.id === 'mapModal') $('#mapModal').hidden = true; });
    $('#modalClose').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

    // 滚动时缩小地图
    window.addEventListener('scroll', () => {
      $('#minimap').classList.toggle('is-mini', window.scrollY > 120);
    }, { passive: true });

    updateSoundIcon();
    go(S.level || 0, { keepScroll: true });

    /* 调试入口：#dev 时可跳关 */
    if (location.hash === '#dev' || location.search.indexOf('dev=1') >= 0) {
      window.__md = {
        go: (i) => go(i),
        state: () => S,
        levels: LEVELS
      };
    }
  }

  function updateSoundIcon() {
    const svg = $('#soundIcon');
    if (!svg) return;
    svg.innerHTML = S.soundOn
      ? '<path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'
      : '<path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>';
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
}());
