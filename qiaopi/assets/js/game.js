/* ==========================================================
   《侨批归途》游戏引擎
   纯原生 JavaScript · 无外部依赖
   ========================================================== */
(function () {
  'use strict';

  const D = window.QP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const IMG = D.IMG;
  const SAVE_KEY = 'qiaopi_gui_tu_v1';
  const TRUE_ENDING = 'root';

  const CH = D.CHAPTERS;
  const CARDS = D.CARDS;
  const PUZ = D.PUZZLES;

  /* 章节与卡片的对应 */
  const CH_CARDS = {
    ch1: ['ship', 'ticket'],
    ch2: ['tin', 'ledger'],
    ch3: ['post', 'flower'],
    ch4: ['tower', 'root']
  };

  /* 幕间插图 */
  const AFTER_META = {
    ch1: { img: 'letter_03', cap: '箱中之物' },
    ch2: { img: 'stamps', cap: '寄出的银信' },
    ch3: { img: 'seal_objects', cap: '火漆与印记' },
    ch4: { img: 'tower_exhibit', cap: '碉楼封顶' },
    ch4b: { img: 'ancestral_hall', cap: '族谱 · 空着的一行' }
  };

  /* 幕间插图（用光影较完整的照片，避免展板文字透出） */
  const INTERLUDE_IMG = ['ship_sail', 'gold_rush', 'shop_street', 'qimingli'];

  /* 序 */
  const PROLOGUE = [
    {
      img: 'letter_02', tag: '序 · 银信', doc: true,
      lines: [
        ['p', '侨批，是海外华侨寄回家乡的汇款与家书。一封信里夹着银元，也夹着一句"平安勿念"。'],
        ['p', '在没有电话、没有网络的年代，一封侨批走一趟要两三个月。它替人报平安、替人寄钱、替人把说不出口的话说完。'],
        ['p', '2013 年，侨批档案入选联合国教科文组织《世界记忆名录》。']
      ]
    },
    {
      img: 'map_world', tag: '序 · 侨乡',
      lines: [
        ['p', '广东江门，人称"中国侨都"。祖籍江门的华侨华人与港澳台同胞 530 多万人，分布在全球 145 个国家和地区。'],
        ['p', '台山、新会、开平、恩平、鹤山——五邑大地上的每一座碉楼、每一条骑楼街，都曾靠一封封侨批撑起来。'],
        ['p', '这是一个虚构的故事。可故事里的每一封信，都真的有人写过。']
      ]
    },
    {
      img: 'wall_root', tag: '序 · 寻根',
      lines: [
        ['p', '你是陈启山。故事从 1901 年广海湾的一只旧木箱开始。'],
        ['p', '箱子里锁着父亲半生的血汗，箱面上刻着一句侨批局的老行话。'],
        ['quote', '「拆开它，你就上路了。」']
      ]
    }
  ];

  /* ---------------- 状态 ---------------- */
  const fresh = () => ({
    v: 1,
    chapter: 0,
    done: [],
    stats: { qin: 0, yong: 0, yi: 0 },
    cards: ['qiaopi'],
    hints: 0,
    wrong: 0,
    choices: [],
    ending: null,
    elapsed: 0,
    t0: 0,
    soundOn: true,
    viewedAlbum: false,
    trail: [],
    started: false
  });

  let S = fresh();
  let flow = { chap: 0, step: 0, steps: [], total: 0 };
  let currentScreen = 'title';
  let unlockQueue = [];
  let unlockOpen = false;
  let albumTag = '全部';
  let pendingChoice = null;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
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
      localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    } catch (e) { /* 隐私模式或 file:// 受限时静默降级 */ }
  }

  function resetAll() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    S = fresh();
    S.t0 = Date.now();
    save();
  }

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
    function now() { const c = ac(); return c ? c.currentTime : 0; }
    function tone(freq, dur, type, vol, delay) {
      const c = ac(); if (!c || !S.soundOn) return;
      const t = now() + (delay || 0);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
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
      src.connect(f); f.connect(g); g.connect(c.destination);
      src.start();
    }
    return {
      unlock() { const c = ac(); if (c && c.state === 'suspended') c.resume(); },
      click() { tone(660, 0.05, 'square', 0.015); },
      tap() { tone(420, 0.07, 'triangle', 0.03); },
      ok() { tone(523.25, 0.18, 'triangle', 0.045); tone(659.25, 0.22, 'triangle', 0.04, 0.08); tone(783.99, 0.4, 'sine', 0.035, 0.16); },
      bad() { tone(150, 0.16, 'sawtooth', 0.03); tone(110, 0.22, 'sawtooth', 0.025, 0.05); },
      stamp() { noise(0.16, 0.09, 700); tone(90, 0.22, 'sine', 0.08); },
      page() { noise(0.12, 0.03, 2400); },
      chime() { tone(392, 0.5, 'sine', 0.03); tone(587.33, 0.7, 'sine', 0.026, 0.12); tone(783.99, 0.9, 'sine', 0.02, 0.3); }
    };
  }());

  /* ---------------- 基础工具 ---------------- */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('is-on'), 2200);
  }
  function setBackdrop(name) {
    $('#bgPhoto').style.backgroundImage = name ? `url("${IMG(name)}")` : 'none';
  }
  function linesHTML(lines) {
    return (lines || []).map(([k, t]) => {
      const cls = k === 'quote' ? ' class="quote"' : k === 'small' ? ' class="small"' : '';
      return `<p${cls}>${esc(t)}</p>`;
    }).join('');
  }
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function figHTML(img, cap, tag, opts) {    const o = opts || {};
    const cls = 'figure' + (o.doc ? ' figure--doc' : '') + (o.tall ? ' figure--tall' : '');
    return `<figure class="${cls}">
      <img src="${IMG(img)}" alt="${esc(cap || '')}" loading="lazy" decoding="async">
      ${tag ? `<span class="figure__tag">${esc(tag)}</span>` : ''}
      ${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}
    </figure>`;
  }

  /* ---------------- 顶栏 / 导航 ---------------- */
  function renderDots() {
    const box = $('#barDots');
    box.innerHTML = CH.map((c, i) => {
      const done = S.done.indexOf(c.id) >= 0;
      const active = currentScreen === 'chapter' && flow.chap === i && !done;
      return `<span class="dot${done ? ' is-done' : ''}${active ? ' is-active' : ''}"></span>`;
    }).join('');
  }

  function setBar(title, sub) {
    $('#barTitle').textContent = title;
    $('#barSub').textContent = sub || '';
    renderDots();
  }

  function show(name) {
    currentScreen = name;
    $$('.screen').forEach(s => s.removeAttribute('data-active'));
    const el = $('#screen-' + name);
    if (el) el.setAttribute('data-active', '');
    $('#topbar').hidden = name === 'title';
    // 章节内才显示“上一关 / 重玩本关”
    ['ccPrev', 'ccRestart'].forEach(function (id) {
      const b = document.getElementById(id);
      if (b) b.hidden = name !== 'chapter';
    });
    $('#foot').hidden = name === 'title';
    $('#btnBack').style.visibility = name === 'hub' || name === 'title' ? 'hidden' : 'visible';
    if (name !== 'title') {
      if (name === 'hub') setBar('侨批归途', '· 章节');
      else if (name === 'cards') setBar('侨批归途', '· 记忆卡册');
      else if (name === 'album') setBar('侨批归途', '· 侨乡影集');
      else if (name === 'codex') setBar('侨批归途', '· 侨史小课堂');
      else if (name === 'about') setBar('侨批归途', '· 关于');
      else if (name === 'trail') setBar('侨批归途', '· 侨乡寻访');
      renderDots();
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    Sfx.page();
  }

  function back() {
    if (currentScreen === 'chapter') {
      openModal({
        title: '离开这一篇？',
        text: '当前进度会保留在本篇开头。谜题需要重新解一次。',
        actions: [
          { label: '继续解谜', cls: 'btn--ghost' },
          { label: '回到章节', cls: '', fn: () => { renderHub(); show('hub'); } }
        ]
      });
      return;
    }
    if (currentScreen === 'ending') { renderHub(); show('hub'); return; }
    renderHub(); show('hub');
  }

  /* ---------------- 弹层 ---------------- */
  function openModal(o) {
    $('#modalImg').hidden = !o.img;
    if (o.img) { $('#modalImg').src = IMG(o.img); $('#modalImg').alt = o.title || ''; }
    $('#modalTag').textContent = o.tag || '';
    $('#modalTitle').textContent = o.title || '';
    $('#modalText').innerHTML = o.html || (o.text ? `<p>${esc(o.text).replace(/\n/g, '<br>')}</p>` : '');
    const foot = $('#modalFoot');
    foot.innerHTML = '';
    (o.actions || [{ label: '知道了' }]).forEach((a, i) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.cls || '') + (i === 0 && !a.cls ? '' : '');
      b.textContent = a.label;
      b.addEventListener('click', () => {
        Sfx.click();
        closeModal();
        if (a.fn) a.fn();
      });
      foot.appendChild(b);
    });
    $('#modal').hidden = false;
  }
  function closeModal() { $('#modal').hidden = true; }

  /* ---------------- 卡片 ---------------- */
  function cardById(id) { return CARDS.filter(c => c.id === id)[0]; }

  function queueCards(ids) {
    (ids || []).forEach(id => {
      if (!cardById(id)) return;
      if (S.cards.indexOf(id) < 0) { S.cards.push(id); unlockQueue.push(id); }
    });
    save();
    updateCounts();
    if (!unlockOpen) nextUnlock();
  }

  function nextUnlock() {
    const id = unlockQueue.shift();
    if (!id) { $('#unlock').hidden = true; unlockOpen = false; return; }
    const c = cardById(id);
    unlockOpen = true;
    $('#unlockImg').src = IMG(c.img);
    $('#unlockImg').alt = c.title;
    $('#unlockKicker').textContent = '记忆卡 · ' + c.no;
    $('#unlockTitle').textContent = c.title;
    $('#unlockText').textContent = c.text;
    $('#unlock').hidden = false;
    Sfx.chime();
  }

  function updateCounts() {
    const n = S.cards.length;
    $('#toolCards').textContent = n + ' / ' + CARDS.length;
    $('#cardsCount').textContent = n + ' / ' + CARDS.length;
    const tt = $('#toolTrail');
    if (tt) tt.textContent = (S.trail || []).length + ' / ' + D.TRAIL.length;
  }

  /* ---------- 侨乡寻访（线上线下打卡） ---------- */
  function renderTrail() {
    const got = S.trail || [];
    $('#trailCount').textContent = got.length + ' / ' + D.TRAIL.length;
    $('#trailList').innerHTML = D.TRAIL.map((t) => {
      const on = got.indexOf(t.id) >= 0;
      return `<div class="trail-card${on ? ' is-on' : ''}">
        <div class="trail-thumb" style="background-image:url('${IMG(t.img)}')"></div>
        <div class="trail-body">
          <div class="trail-name">${esc(t.name)}<span>${esc(t.place)}</span></div>
          <p>${esc(t.text)}</p>
          <div class="trail-state">${on ? '已点亮 · 口令 ' + esc(t.code) : '未点亮 · 到现场找口令'}</div>
        </div>
      </div>`;
    }).join('');
    updateCounts();
  }

  function checkTrailCode() {
    const input = $('#trailInput');
    const msg = $('#trailMsg');
    if (!input || !msg) return;
    const v = (input.value || '').trim().toUpperCase();
    if (!v) { msg.textContent = '先输入口令。'; return; }
    const hit = D.TRAIL.filter((t) => t.code.toUpperCase() === v)[0];
    if (!hit) { Sfx.bad(); msg.textContent = '没有找到这个口令，再看看折页或文具上的编号。'; return; }
    if (S.trail.indexOf(hit.id) >= 0) { msg.textContent = '「' + hit.name + '」已经点亮过了。'; return; }
    S.trail.push(hit.id);
    save(); Sfx.ok();
    input.value = '';
    msg.textContent = '点亮「' + hit.name + '」——这处侨乡，你来过了。';
    renderTrail();
  }

  /* ==========================================================
     标题 / 章节枢纽
     ========================================================== */
  function renderTitle() {
    const has = S.done.length > 0 || S.choices.length > 0 || S.ending;
    $('#btnResume').hidden = !has;
    $('#btnHubFromTitle').hidden = !has;
    $('#btnStart').textContent = has ? '重新开始' : '拆开这封信';
  }

  function renderHub() {
    $('#hubProgress').textContent = S.done.length + ' / ' + CH.length;
    const list = $('#chapterList');
    list.innerHTML = CH.map((c, i) => {
      const done = S.done.indexOf(c.id) >= 0;
      const unlocked = i === 0 || S.done.indexOf(CH[i - 1].id) >= 0 || done;
      const state = done ? '已阅' : unlocked ? '待入' : '未启';
      return `<button class="chapter-card${done ? ' is-done' : ''}" data-chap="${i}" ${unlocked ? '' : 'disabled'}>
        <span class="chapter-card__thumb" style="background-image:url('${IMG(c.thumb)}')"></span>
        <span class="chapter-card__body">
          <span class="chapter-card__no">${esc(c.label)} · ${esc(c.en)}</span>
          <span class="chapter-card__title">${esc(c.title)}</span>
          <span class="chapter-card__sub">${esc(c.lead.kicker)}</span>
        </span>
        <span class="chapter-card__state">${state}</span>
      </button>`;
    }).join('');
    updateCounts();
    const allDone = S.done.length === CH.length;
    $('#btnHubReplay').hidden = !allDone;
    $('#hubNote').innerHTML = allDone
      ? '<b>四篇已完</b>　你可以翻阅记忆卡册与侨乡影集，或重新走一遍，试试不用提示、一次答对。'
      : '<b>玩法</b>　每一篇包含一段剧情与一道谜题。谜题线索藏在信纸、账簿与砖墙里——慢慢看，不必急。';
  }

  /* ==========================================================
     章节流程
     ========================================================== */
  function buildSteps(ch) {
    const steps = [];
    let n = 0;
    const seqTotal = 1 + ch.scenes.length;
    n++;
    steps.push({ type: 'lead', data: ch.lead, n, total: seqTotal });
    ch.scenes.forEach(sc => {
      n++;
      steps.push({ type: 'scene', data: sc, n, total: seqTotal });
    });
    steps.push({ type: 'puzzle', key: ch.puzzle });
    if (ch.after) steps.push({ type: 'lines', lines: ch.after, meta: AFTER_META[ch.id] });
    if (ch.puzzle2) {
      steps.push({ type: 'puzzle', key: ch.puzzle2 });
      if (ch.after2) steps.push({ type: 'lines', lines: ch.after2, meta: AFTER_META[ch.id + 'b'] });
    }
    steps.push({ type: 'choice', choice: ch.choice, ch });
    return steps;
  }

  function startChapter(i, quiet) {
    const ch = CH[i];
    if (!ch) return;
    flow = { chap: i, step: 0, steps: buildSteps(ch), total: 0 };
    S.chapter = i;
    S.started = true;
    if (!S.t0) S.t0 = Date.now();
    save();
    if (!quiet) Sfx.unlock();
    show('chapter');
    setBar(ch.label + ' · ' + ch.title);
    setBackdrop(ch.lead.img || ch.thumb);
    renderStep();
  }

  let lastAdvance = 0;
  function nextStep() {
    // 防连点：连续点击“继续/开始”时，避免一次点击跳两步、直接跳到下一个界面
    const now = Date.now();
    if (now - lastAdvance < 320) return;
    lastAdvance = now;
    flow.step++;
    if (flow.step >= flow.steps.length) { finishChapter(); return; }
    renderStep();
  }

  function finishChapter() {
    const ch = CH[flow.chap];
    if (S.done.indexOf(ch.id) < 0) S.done.push(ch.id);
    save();
    if (flow.chap + 1 < CH.length) {
      renderInterlude(flow.chap + 1);
    } else {
      finishGame();
    }
  }

  function renderInterlude(nextIdx) {
    const next = CH[nextIdx];
    const prev = CH[nextIdx - 1];
    $('#chapBody').innerHTML = `
      <div class="interlude">
        <div class="interlude__img" style="background-image:url('${IMG(INTERLUDE_IMG[nextIdx - 1] || next.thumb)}')"></div>
        <div class="interlude__grade"></div>
        <div class="interlude__inner">
          <div class="interlude__kicker">篇 终 · ${esc(prev.label)}</div>
          <h1 class="interlude__title">${esc(prev.title)} · 完</h1>
          <div class="interlude__rule"></div>
          <p class="interlude__next">下一页<br><b>${esc(next.title)}</b><br><span style="opacity:.72">${esc(next.lead.kicker)}</span></p>
          <button class="btn" id="btnNextChap" data-next="${nextIdx}">进入${esc(next.label)}</button>
        </div>
      </div>`;
    const btn = $('#btnNextChap');
    btn.addEventListener('click', () => { Sfx.click(); startChapter(nextIdx); });
    setBackdrop(next.lead.img || next.thumb);
    renderDots();
  }

  /* 每一步都换一个干净的容器，避免旧谜题的事件监听残留 */
  function freshBody() {
    const old = $('#chapBody');
    const nb = document.createElement('div');
    nb.id = 'chapBody';
    if (old && old.parentNode) old.parentNode.replaceChild(nb, old);
    return nb;
  }

  function renderStep() {
    const st = flow.steps[flow.step];
    const ch = CH[flow.chap];
    const box = freshBody();
    if (!st) { finishChapter(); return; }

    if (st.type === 'lead') {
      const d = st.data;
      box.innerHTML = `
        <div class="chapter-head">
          <div class="chapter-head__no">${esc(ch.label)} · ${esc(ch.en)}</div>
          <h1 class="chapter-head__title">${esc(ch.title)}</h1>
          <div class="chapter-head__sub">${esc(ch.lead.kicker)}</div>
          <div class="chapter-head__line"></div>
        </div>
        ${figHTML(d.img || ch.thumb, d.tag, '', { tall: true })}
        <div class="story">${linesHTML(d.lines)}</div>
        ${continueBar('开始', st)}
      `;
      setBackdrop(d.img || ch.thumb);
    } else if (st.type === 'scene') {
      const d = st.data;
      box.innerHTML = `
        ${figHTML(d.img, d.cap, d.tag, { doc: d.doc, tall: d.tall })}
        <div class="story">${linesHTML(d.lines)}</div>
        ${continueBar('继续', st)}
      `;
      setBackdrop(d.img);
    } else if (st.type === 'lines') {
      const m = st.meta || {};
      box.innerHTML = `
        <div class="rubric" style="padding-left:26px">篇 间</div>
        ${figHTML(m.img || ch.thumb, m.cap, '', {})}
        <div class="story">${linesHTML(st.lines)}</div>
        ${continueBar('继续', st)}
      `;
      if (m.img) setBackdrop(m.img);
    } else if (st.type === 'puzzle') {
      mountPuzzle(st.key, box);
      return;
    } else if (st.type === 'choice') {
      queueCards(CH_CARDS[ch.id]);
      renderChoice(st);
      return;
    }
    bindNext();
  }

  function continueBar(label, st) {
    const pip = st && st.total ? `<span class="progress-pip">${st.n} / ${st.total}</span>` : '';
    const ch = CH[flow.chap];
    const letterBtn = st && st.type === 'lead' && ch && ch.letter
      ? `<button class="btn btn--ghost btn--small" id="btnLetter">读一封旧信</button>` : '';
    return `<div class="continue-bar">
      ${pip}
      <div class="spacer"></div>
      ${letterBtn}
      <button class="btn" id="btnNext">${esc(label)}</button>
    </div>`;
  }

  function bindNext() {
    const b = $('#btnNext');
    if (b) b.addEventListener('click', () => { Sfx.tap(); nextStep(); });
    const lb = $('#btnLetter');
    if (lb) lb.addEventListener('click', () => {
      const ch = CH[flow.chap];
      if (!ch || !ch.letter) return;
      Sfx.page();
      openModal({
        tag: '旧 信 · ' + esc(ch.label),
        title: ch.letter.title,
        text: ch.letter.text,
        actions: [{ label: '收 好' }]
      });
    });
  }

  /* ==========================================================
     谜题挂载
     ========================================================== */
  function puzzleHead(no, title) {
    return `<div class="chapter-head" style="padding-bottom:0">
      <div class="chapter-head__no">谜题 ${no}</div>
      <h1 class="chapter-head__title" style="font-size:27px">${esc(title)}</h1>
      <div class="chapter-head__line"></div>
    </div>`;
  }

  function puzzleShell(no, title, body, foot) {
    return `<div class="pad pad--tight">
      ${puzzleHead(no, title)}
      <div class="puzzle">
        <div class="puzzle__head"><h3>解谜</h3><span>${esc(title)}</span></div>
        <div class="puzzle__body">${body}</div>
        ${foot || ''}
      </div>
      <div class="hint-line" id="pHint"></div>
    </div>`;
  }

  function api(solve) {
    let done = false;
    let hinted = false;
    return {
      solve() {
        if (done) return;
        done = true;
        Sfx.ok();
        setTimeout(solve, 420);
      },
      hint(text) {
        if (!hinted) { S.hints++; save(); }
        hinted = true;
        const el = $('#pHint');
        if (el) { el.textContent = '提示：' + text; el.classList.add('is-on'); }
      },
      wrong() { S.wrong++; save(); Sfx.bad(); }
    };
  }

  function mountPuzzle(key, box) {
    const ch = CH[flow.chap];
    const solve = () => nextStep();
    if (key === 'cipher') {
      // 开箱之后，再核一遍船票与契约上的数字，才进入下一段
      mountCipher(box, api(() => {
        const b2 = freshBody();
        mountTicket(b2, api(() => nextStep()));
      }));
    }
    else if (key === 'ledger') mountLedger(box, api(solve));
    else if (key === 'letter') mountLetter(box, api(solve));
    else if (key === 'tower') mountTower(box, api(solve));
    else if (key === 'lineage') mountLineage(box, api(solve));
    else nextStep();
    setBackdrop(ch.thumb);
  }

  /* ---------- 谜题一：密信译码 ---------- */
  function mountCipher(box, api) {
    const P = PUZ.cipher;
    // 每局随机：50 字里取 10 个，随机配 0-9；再随机取 4 个数字作密码
    const chars = shuffled(P.pool).slice(0, 10);
    const digits = shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const table = chars.map((ch, i) => ({ ch: ch, n: digits[i] }));
    const pick = shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const code = pick.join('');
    const marks = pick.map((d) => table.filter((t) => t.n === d)[0].ch);

    const slots = [null, null, null, null];
    let cursor = 0;

    const tableHTML = table.map((t) =>
      `<button class="bronze__key" data-ch="${t.ch}" data-n="${t.n}">${t.ch}<small>${t.n}</small></button>`
    ).join('');

    const markHTML = marks.map((ch, i) =>
      `${['①', '②', '③', '④'][i]} <span class="code-char">${ch}</span>`).join('　');

    box.innerHTML = puzzleShell('01', '密信译码', `
      <div class="letter-paper">
        <div class="lp-head"><span>${esc(P.head[0])}</span><span>${esc(P.head[1])}</span></div>
        <div class="lp-body">${P.lines.map((l) => esc(l)).join('<br>')}
<br>${markHTML}
<br>${esc(P.tail)}</div>
        <div class="lp-sign">${esc(P.sign)}</div>
      </div>
      <div class="bronze">
        <div class="bronze__title"><span>旧木箱 · 铜牌</span><span>十个字 · 各记一数</span></div>
        <div class="bronze__grid">${tableHTML}</div>
      </div>
      <div class="lock" id="lockSlots"></div>
      <div class="lock__hint" style="text-align:center;margin-top:10px">按 ①②③④ 的次序，在铜牌上依次点出对应的字</div>
    `, `<div class="puzzle__foot">
        <button class="btn btn--ghost btn--small" data-a="kit">文 具</button>
        <button class="btn btn--ghost btn--small" data-a="hint">提示</button>
        <button class="btn btn--small" data-a="check">开 锁</button>
      </div>
      <div class="msg" id="pMsg" style="padding:0 18px 16px"></div>`);

    const slotsBox = $('#lockSlots');
    const msg = $('#pMsg');

    function draw() {
      slotsBox.innerHTML = slots.map((s2, i) => s2 === null
        ? `<span class="lock__slot is-empty" data-i="${i}">▢</span>`
        : `<span class="lock__slot is-filled" data-i="${i}">${s2.n}</span>`).join('');
    }
    draw();

    slotsBox.addEventListener('click', (e) => {
      const t = e.target.closest('[data-i]');
      if (!t) return;
      const i = +t.dataset.i;
      if (slots[i] === null) return;
      slots[i] = null;
      cursor = slots.indexOf(null);
      if (cursor < 0) cursor = 3;
      Sfx.click();
      draw();
    });

    box.addEventListener('click', (e) => {
      const key = e.target.closest('.bronze__key');
      if (key) {
        const idx = slots.indexOf(null);
        if (idx < 0) { toast('四个字位已经满了，点方框可清除'); return; }
        slots[idx] = { ch: key.dataset.ch, n: key.dataset.n };
        cursor = slots.indexOf(null);
        Sfx.tap();
        draw();
        if (slots.indexOf(null) < 0) {
          setTimeout(() => { const bb = $('[data-a="check"]'); if (bb) bb.focus(); }, 60);
        }
        return;
      }
      const act = e.target.closest('[data-a]');
      if (!act) return;
      if (act.dataset.a === 'hint') { api.hint(P.hint); return; }
      if (act.dataset.a === 'check') {
        if (slots.indexOf(null) >= 0) { msg.textContent = '还有字位空着。'; return; }
        const val = slots.map((s2) => s2.n).join('');
        if (val === code) {
          msg.className = 'msg is-ok';
          msg.textContent = '锁簧弹开了。';
          api.solve();
        } else {
          api.wrong();
          msg.className = 'msg';
          msg.textContent = '锁簧纹丝不动。再核一遍次序。';
          const els = $$('.lock__slot', slotsBox);
          els.forEach((el) => el.classList.add('is-bad'));
          setTimeout(() => {
            els.forEach((el) => el.classList.remove('is-bad'));
            if (slots.map((s2) => (s2 ? s2.n : '')).join('') === val) {
              slots.fill(null);
              draw();
            }
          }, 900);
        }
      }
    });
  }

  /* ---------- 谜题一·补：船票与契约（三套题随机） ---------- */
  function mountTicket(box, api) {
    const P = PUZ.ticket;
    const V = P.variants[Math.floor(Math.random() * P.variants.length)];
    const vars = { fare: P.fare, wage: P.wage, no: P.no, day: P.day, date: P.date };
    const ans = V.answers(vars);
    const q = V.q.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);

    box.innerHTML = puzzleShell('01', '船票与契约', `
      <div class="letter-paper">
        <div class="lp-head"><span>出洋船票 · 存根</span><span>${esc(P.date)}</span></div>
        <div class="lp-body">
          票号 No.${esc(P.no)}　三等舱<br>
          票价 ${P.fare} 银元　·　招工馆代垫<br><br>
          ${esc(q)}
        </div>
        <div class="lp-sign">广海湾 · 招工馆</div>
      </div>
      <div class="ledger" style="margin-top:14px">
        <table class="ledger">
          ${V.asks.map((ask, i) => `<tr><td>${esc(ask)}</td><td><input type="text" inputmode="numeric" maxlength="2" id="tk${i}" aria-label="第 ${i + 1} 空"></td></tr>`).join('')}
        </table>
      </div>
    `, `<div class="puzzle__foot">
        <button class="btn btn--ghost btn--small" data-a="kit">文 具</button>
        <button class="btn btn--ghost btn--small" data-a="hint">提示</button>
        <button class="btn btn--small" data-a="check">核 对</button>
      </div>
      <div class="msg" id="tkMsg" style="padding:0 18px 16px"></div>`);

    setBackdrop('ticket');
    const msg = $('#tkMsg');
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-a]');
      if (!act) return;
      if (act.dataset.a === 'hint') { api.hint(V.hint || P.hint); return; }
      const vals = V.asks.map((_, i) => Number(($('#tk' + i) || {}).value));
      if (vals.some((v) => !v)) { msg.textContent = '每个空都要填。'; return; }
      if (vals.every((v, i) => v === ans[i])) {
        msg.className = 'msg is-ok';
        msg.textContent = '契约成立：三年工，换一张船票。';
        V.asks.forEach((_, i) => { const el = $('#tk' + i); if (el) el.disabled = true; });
        api.solve();
      } else {
        api.wrong();
        msg.className = 'msg';
        msg.textContent = '招工馆的人摇了摇头：再算一遍。';
      }
    });
  }

  /* ---------- 谜题二：侨汇账簿 ---------- */
  function mountLedger(box, api) {
    // 每月随机收入、寄回、开销；结余由公式推出，再挖三个空
    const mn = ['正月', '二月', '三月', '四月'];
    let prev = 0;
    const gen = [];
    for (let i = 0; i < 4; i++) {
      const inc = 10 + Math.floor(Math.random() * 7);   // 10–16
      const send = 5 + Math.floor(Math.random() * 5);   // 5–9
      const cost = 2 + Math.floor(Math.random() * 4);   // 2–5
      const left = prev + inc - send - cost;
      gen.push({ m: mn[i], prev: prev, inc: inc, send: send, cost: cost, left: left });
      prev = left;
    }
    const blanks = [[1, 'send'], [2, 'cost'], [3, 'inc']];
    const answers = blanks.map((x) => gen[x[0]][x[1]]);
    const blankSet = {};
    blanks.forEach((x, i) => { blankSet[x[0] + x[1]] = i; });

    let bi = 0;
    const cell = (v, r, key) => {
      const id = blankSet[r + key];
      if (id === undefined) return `<td>${v}</td>`;
      return `<td class="blank"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" data-b="${id}" aria-label="待补数字"></td>`;
    };
    const rows = gen.map((r, i) => `<tr>
      <td>${esc(r.m)}</td>
      <td>${r.prev}</td>
      ${cell(r.inc, i, 'inc')}
      ${cell(r.send, i, 'send')}
      ${cell(r.cost, i, 'cost')}
      <td>${r.left}</td>
    </tr>`).join('');

    box.innerHTML = puzzleShell('02', '侨汇账簿', `
      <table class="ledger">
        <thead><tr><th>月份</th><th>上月<br>结余</th><th>收入</th><th>寄回<br>唐山</th><th>开销</th><th>结余</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="ledger-note">账簿里被墨渍涂掉了三个数字。<b>结余 ＝ 上月结余 ＋ 收入 − 寄回 − 开销</b>。单位：叻币。</p>
    `, `<div class="puzzle__foot">
        <button class="btn btn--ghost btn--small" data-a="kit">文 具</button>
        <button class="btn btn--ghost btn--small" data-a="hint">提示</button>
        <button class="btn btn--small" data-a="check">核 账</button>
      </div>
      <div class="msg" id="pMsg" style="padding:0 18px 16px"></div>`);

    const inputs = $$('input[data-b]', box);
    const msg = $('#pMsg');

    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-a]');
      if (!act) return;
      if (act.dataset.a === 'hint') { api.hint('结余 ＝ 上月结余 ＋ 收入 − 寄回 − 开销。先算二月，再算三月，最后倒推四月。'); return; }
      const vals = inputs.map((inp) => inp.value.trim());
      if (vals.some((v) => v === '')) { msg.textContent = '三处空格都要填上。'; return; }
      const ok = vals.every((v, i) => Number(v) === answers[i]);
      if (ok) {
        msg.className = 'msg is-ok';
        msg.textContent = '账平了。';
        inputs.forEach((i) => { i.disabled = true; });
        api.solve();
      } else {
        api.wrong();
        msg.className = 'msg';
        msg.textContent = '账簿不平。再算一遍。';
        inputs.forEach((inp, i) => {
          if (Number(inp.value) !== answers[i]) {
            inp.classList.add('is-bad');
            setTimeout(() => inp.classList.remove('is-bad'), 900);
          }
        });
      }
    });
  }

  /* ---------- 谜题三：家书次序 + 火漆 ---------- */
  function mountLetter(box, api) {
    const P = PUZ.letter;
    const order = P.order;
    let pool = order.map((t, i) => ({ t, id: i }));
    // 打乱，但保证不是原序
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (pool.every((p, i) => p.id === i)) [pool[0], pool[1]] = [pool[1], pool[0]];
    let picked = [];

    box.innerHTML = puzzleShell('03', '家书六句', `
      <p class="ledger-note" style="margin-top:0;margin-bottom:12px">黄阿婆要写一封侨批给吉隆坡的儿子。纸已铺好，请按侨批的次序，把六句话放进信里。</p>
      <div class="slots" id="slots"></div>
      <div class="pool">
        <div class="pool__label">备 选 句</div>
        <div id="pool"></div>
      </div>
    `, `<div class="puzzle__foot">
        <button class="btn btn--ghost btn--small" data-a="kit">文 具</button>
        <button class="btn btn--ghost btn--small" data-a="hint">提示</button>
        <button class="btn btn--small" data-a="check" id="btnCheck" disabled>写 好 了</button>
      </div>
      <div class="msg" id="pMsg" style="padding:0 18px 16px"></div>`);

    const slotsEl = $('#slots');
    const poolEl = $('#pool');
    const msg = $('#pMsg');
    const checkBtn = $('#btnCheck');

    function draw() {
      slotsEl.innerHTML = picked.length
        ? picked.map((p, i) => `<div class="chip is-placed" data-picked="${i}"><span class="chip__idx">${i + 1}</span><span>${esc(p.t)}</span></div>`).join('')
        : '<div class="slots__empty">— 信 纸 —</div>';
      poolEl.innerHTML = pool.map((p, i) => `<button class="chip" data-pool="${i}"><span class="chip__idx">·</span><span>${esc(p.t)}</span></button>`).join('');
      checkBtn.disabled = picked.length !== order.length;
    }
    draw();

    poolEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pool]');
      if (!b) return;
      const i = +b.dataset.pool;
      picked.push(pool[i]);
      pool.splice(i, 1);
      Sfx.tap();
      draw();
    });

    slotsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-picked]');
      if (!b) return;
      const i = +b.dataset.picked;
      const item = picked[i];
      picked.splice(i, 1);
      pool.push(item);
      Sfx.click();
      draw();
    });

    let sealed = false;

    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-a]');
      if (act) {
        if (act.dataset.a === 'hint') { api.hint(P.hint); return; }
        if (act.dataset.a === 'check') {
          const same = picked.every((p, i) => p.id === i);
          if (same) {
            msg.className = 'msg is-ok';
            msg.textContent = '六句各归其位。现在，封上这封信。';
            checkBtn.disabled = true;
            checkBtn.textContent = '已写好';
            showWax();
          } else {
            api.wrong();
            msg.className = 'msg';
            msg.textContent = '次序不对。侨批的抬头、报平安、汇款、嘱咐、落款，各有其位。';
            const firstBad = picked.findIndex((p, i) => p.id !== i);
            const chip = slotsEl.querySelector(`[data-picked="${firstBad}"]`);
            if (chip) {
              chip.classList.add('is-wrong');
              setTimeout(() => chip.classList.remove('is-wrong'), 600);
            }
          }
        }
        return;
      }
    });

    function showWax() {
      const foot = box.querySelector('.puzzle__foot');
      foot.innerHTML = `<div class="wax-wrap" style="flex:1">
        <button class="wax" id="waxBtn" aria-label="按下火漆封印">
          <span class="wax__ring"></span>
          <span class="wax__idle">按 下 火 漆<br>封 印 此 信</span>
          <span class="wax__disc"></span>
        </button>
        <div class="wax-note" id="waxNote">点击火漆，为这封信封口</div>
      </div>`;
      const wax = $('#waxBtn');
      const note = $('#waxNote');
      wax.addEventListener('click', () => {
        if (sealed) return;
        sealed = true;
        wax.classList.add('is-holding');
        note.textContent = '火漆正在熔封……';
        Sfx.tap();
        setTimeout(() => {
          wax.classList.remove('is-holding');
          wax.classList.add('is-done');
          note.textContent = '印已封好。';
          Sfx.stamp();
          setTimeout(() => api.solve(), 900);
        }, 1150);
      });
    }
  }

  /* ---------- 谜题四：碉楼营造 ---------- */
  function mountTower(box, api) {
    const P = PUZ.tower;
    const parts = shuffled(P.parts);
    let picked = null;
    const slots = P.slots.map(s => ({ ...s, filled: null }));

    box.innerHTML = puzzleShell('04', '碉楼图样', `
      <p class="ledger-note" style="margin-top:0;margin-bottom:12px">泥水匠画了图样，把四个位置空着。先从下面的构件里选一件，再点它该在的位置。</p>
      <div class="tower" id="towerSlots"></div>
      <div class="parts" id="parts"></div>
    `, `<div class="puzzle__foot">
        <button class="btn btn--ghost btn--small" data-a="kit">文 具</button>
        <button class="btn btn--ghost btn--small" data-a="hint">提示</button>
      </div>
      <div class="msg" id="pMsg" style="padding:0 18px 16px"></div>`);

    const slotsEl = $('#towerSlots');
    const partsEl = $('#parts');
    const msg = $('#pMsg');

    function draw() {
      slotsEl.innerHTML = slots.map((s, i) => `<button class="tower__slot${s.filled ? ' is-filled' : ''}" data-slot="${i}">
        <span><b>${esc(s.name)}</b><small>${s.filled ? esc(s.filled.name) : esc(s.req)}</small></span>
      </button>`).join('');
      partsEl.innerHTML = parts.map((p, i) => {
        const used = slots.some(s => s.filled && s.filled.id === p.id);
        return `<button class="part${used ? ' is-used' : ''}${picked && picked.id === p.id ? ' is-picked' : ''}" data-part="${i}">
          <b>${String.fromCharCode(65 + i)}</b><span>${esc(p.desc)}</span>
        </button>`;
      }).join('');
    }
    draw();

    partsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-part]');
      if (!b) return;
      picked = parts[+b.dataset.part];
      msg.textContent = '已选「' + picked.name + '」，点它该在的位置。';
      Sfx.tap();
      draw();
    });

    slotsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slot]');
      if (!b) return;
      const i = +b.dataset.slot;
      const s = slots[i];
      if (s.filled) return;
      if (!picked) { msg.textContent = '先在下面选一件构件。'; return; }
      if (s.id !== picked.id) {
        api.wrong();
        msg.className = 'msg';
        msg.textContent = '「' + picked.name + '」放这里不合适。想想它原本的用处。';
        b.classList.add('is-bad');
        setTimeout(() => b.classList.remove('is-bad'), 600);
        return;
      }
      s.filled = picked;
      picked = null;
      msg.className = 'msg is-ok';
      msg.textContent = '「' + s.filled.name + '」安置妥当。';
      Sfx.ok();
      draw();
      if (slots.every(x => x.filled)) setTimeout(() => api.solve(), 700);
    });

    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-a]');
      if (act && act.dataset.a === 'hint') api.hint(P.hint);
    });
  }

  /* ---------- 谜题五：族谱归位 ---------- */
  function mountLineage(box, api) {
    const P = PUZ.lineage;
    const letters = shuffled(P.letters);
    let picked = null;
    const solved = {};

    box.innerHTML = puzzleShell('05', '族谱寻根', `
      <p class="ledger-note" style="margin-top:0;margin-bottom:12px">四封旧批，收批的人都不在了。看抬头与落款，把它们放回族谱对应的位置。</p>
      <div class="lineage" id="lineageRows"></div>
      <div class="letters-grid" id="lettersGrid"></div>
    `, `<div class="puzzle__foot">
        <button class="btn btn--ghost btn--small" data-a="kit">文 具</button>
        <button class="btn btn--ghost btn--small" data-a="hint">提示</button>
      </div>
      <div class="msg" id="pMsg" style="padding:0 18px 16px"></div>`);

    const rowsEl = $('#lineageRows');
    const gridEl = $('#lettersGrid');
    const msg = $('#pMsg');

    function draw() {
      rowsEl.innerHTML = P.roles.map(r => {
        const l = P.letters.filter(x => x.id === r.id)[0];
        const done = !!solved[r.id];
        return `<div class="lineage__row">
          <div class="lineage__role">${esc(r.name)}</div>
          <button class="lineage__slot${done ? ' is-filled' : ''}" data-role="${r.id}">${done ? esc(l.text) : '待 归 位'}</button>
        </div>`;
      }).join('');
      gridEl.innerHTML = letters.map((l, i) => {
        const used = !!solved[l.id];
        return `<button class="mini-letter${used ? ' is-used' : ''}${picked && picked.id === l.id ? ' is-picked' : ''}" data-letter="${i}">
          <b>${esc(l.from)}</b>${esc(l.text)}
        </button>`;
      }).join('');
    }
    draw();

    gridEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-letter]');
      if (!b) return;
      picked = letters[+b.dataset.letter];
      msg.textContent = '已选这封批，点它该在的位置。';
      Sfx.tap();
      draw();
    });

    rowsEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-role]');
      if (!b) return;
      const role = b.dataset.role;
      if (solved[role]) return;
      if (!picked) { msg.textContent = '先选一封信。'; return; }
      if (picked.id !== role) {
        api.wrong();
        msg.className = 'msg';
        msg.textContent = picked.id === 'none'
          ? '这封是表弟写的，不属于这一格。'
          : '称谓对不上。再看一眼抬头和落款。';
        b.classList.add('is-bad');
        setTimeout(() => b.classList.remove('is-bad'), 600);
        return;
      }
      solved[role] = true;
      picked = null;
      msg.className = 'msg is-ok';
      msg.textContent = '归位了。';
      Sfx.ok();
      draw();
      if (Object.keys(solved).length === P.roles.length) setTimeout(() => api.solve(), 700);
    });

    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-a]');
      if (act && act.dataset.a === 'hint') api.hint(P.hint);
    });
  }

  /* ==========================================================
     抉择
     ========================================================== */
  function renderChoice(st) {
    const c = st.choice;
    $('#chapBody').innerHTML = `
      <div class="choice-head">
        <div class="rubric" style="margin-top:0">抉 择</div>
        <p class="choice-q">${esc(c.q)}</p>
        <p class="story small" style="padding:0;color:#8a7452">${esc(c.hint)}</p>
      </div>
      <div class="choice-list">
        ${c.options.map((o, i) => `<button class="choice" data-opt="${i}">
          <b>${esc(o.t)}</b><span>${esc(o.d)}</span>
        </button>`).join('')}
      </div>
      <div class="pad pad--tight" style="padding-top:0"><p class="story small" style="padding:0">选择会被记下，并影响结局。没有对错。</p></div>
    `;
    $$('.choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const o = c.options[+btn.dataset.opt];
        Sfx.stamp();
        S.choices.push({ ch: CH[flow.chap].id, t: o.t });
        Object.keys(o.stat || {}).forEach(k => { S.stats[k] = (S.stats[k] || 0) + o.stat[k]; });
        save();
        renderChoiceResult(o);
      });
    });
  }

  function renderChoiceResult(o) {
    $('#chapBody').innerHTML = `
      <div class="choice-result">
        <div class="ritual">你 选 择 了</div>
        <p>${esc(o.result)}</p>
        <div class="gain">${esc(o.gain)}</div>
      </div>
      <div class="continue-bar">
        <div class="spacer"></div>
        <button class="btn" id="btnChoiceNext">继续</button>
      </div>
    `;
    $('#btnChoiceNext').addEventListener('click', () => {
      Sfx.tap();
      flow.step = flow.steps.length;
      finishChapter();
    });
  }

  /* ==========================================================
     结局
     ========================================================== */
  function pickEnding() {
    if (S.hints === 0 && S.wrong === 0) return TRUE_ENDING;
    const { qin, yong, yi } = S.stats;
    if (yi >= qin && yi >= yong) return 'yi';
    if (qin >= yong) return 'qin';
    return 'yong';
  }

  function finishGame() {
    const key = pickEnding();
    const e = D.ENDINGS[key];
    S.ending = key;
    S.done = CH.map(c => c.id);
    S.started = false;
    queueCards(['pen']);
    save();
    renderEnding(e);
    show('ending');
    setBar('结局 · ' + e.title);
    setBackdrop(e.img);
    Sfx.chime();
  }

  function renderEnding(e) {
    const perfect = e.key === TRUE_ENDING;
    const mins = Math.max(1, Math.round(S.elapsed / 60000));
    const total = Math.max(4, S.stats.qin + S.stats.yong + S.stats.yi);
    const bar = (label, v) => `<div class="stat-row"><span>${label}</span>
      <span class="stat-bar"><i data-w="${Math.round(Math.min(1, v / Math.max(4, total * 0.6)) * 100)}"></i></span>
      <b>${v}</b></div>`;

    $('#endBody').innerHTML = `
      <div class="ending-hero">
        <div class="ending-hero__img" style="background-image:url('${IMG(e.img)}')"></div>
        <div class="ending-hero__grade"></div>
        <div class="ending-hero__inner">
          <div class="ending-tag">${esc(e.tag)}</div>
          <h1 class="ending-title">${esc(e.title)}<small>${esc(e.en)}</small></h1>
        </div>
      </div>
      <div class="ending-body">${e.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="ending-body" style="padding-top:0"><p class="final">${esc(e.final)}</p></div>
      <div class="stat-block">
        <h4>心 境</h4>
        ${bar('亲情', S.stats.qin)}
        ${bar('开拓', S.stats.yong)}
        ${bar('家国', S.stats.yi)}
      </div>
      <div class="score-grid">
        <div class="score-cell"><b>${S.done.length}</b><span>篇</span></div>
        <div class="score-cell"><b>${S.cards.length}/${CARDS.length}</b><span>记忆卡</span></div>
        <div class="score-cell"><b>${mins}</b><span>分钟</span></div>
      </div>
      ${perfect
        ? `<div class="pad pad--tight" style="padding-top:0"><div class="hub-note" style="margin:0"><b>真结局</b>　全程未用提示、一次答对。你在父亲的信里，找到了那句没说完的话。</div></div>`
        : `<div class="pad pad--tight" style="padding-top:0"><div class="hub-note" style="margin:0"><b>还有一条路</b>　全程不使用提示、不答错任何一题，可解锁隐藏的真结局。</div></div>`}
      <div class="ending-actions">
        <button class="btn" id="btnShare">生成我的归途卡</button>
        <div class="btn-row">
          <button class="btn btn--ghost btn--small" id="btnEndCards">记忆卡册</button>
          <button class="btn btn--ghost btn--small" id="btnEndAlbum">侨乡影集</button>
        </div>
        <button class="btn btn--ghost btn--small" id="btnEndReplay">重新走一遍</button>
      </div>
    `;
    setTimeout(() => {
      $$('.stat-bar i', $('#endBody')).forEach(i => { i.style.width = i.dataset.w + '%'; });
    }, 200);

    $('#btnShare').addEventListener('click', () => shareCard(e));
    $('#btnEndCards').addEventListener('click', () => { renderCards(); show('cards'); });
    $('#btnEndAlbum').addEventListener('click', () => { renderAlbum(); show('album'); });
    $('#btnEndReplay').addEventListener('click', () => {
      openModal({
        title: '重新走一遍？',
        text: '当前进度、卡片与影集记录会被清空。',
        actions: [
          { label: '再想想', cls: 'btn--ghost' },
          { label: '重新开始', fn: () => { resetAll(); renderTitle(); show('title'); } }
        ]
      });
    });
  }

  /* ---------------- 归途卡（Canvas） ---------------- */
  function shareCard(e) {
    const W = 900, H = 1280;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) { toast('当前浏览器不支持生成图片'); return; }

    const img = new Image();
    img.onload = () => {
      try {
        draw(img);
        cv.toBlob((blob) => {
          if (!blob) { fallback(); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = '侨批归途-' + e.title + '.png';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
          toast('归途卡已生成，可保存分享');
        }, 'image/png');
      } catch (err) { fallback(); }
    };
    img.onerror = fallback;
    img.src = IMG(e.img);

    function fallback() {
      const txt = '《侨批归途》· ' + e.title + '\n' + e.final + '\n亲情 ' + S.stats.qin + ' · 开拓 ' + S.stats.yong + ' · 家国 ' + S.stats.yi;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => toast('文案已复制，可粘贴分享'), () => toast('图片生成失败，请直接截图分享'));
      } else { toast('图片生成失败，请直接截图分享'); }
    }

    function draw(image) {
      // 背景
      ctx.fillStyle = '#14120f';
      ctx.fillRect(0, 0, W, H);
      const ir = image.width / image.height, tr = W / H;
      let dw, dh;
      if (ir > tr) { dh = H; dw = dh * ir; } else { dw = W; dh = dw / ir; }
      ctx.drawImage(image, (W - dw) / 2, (H - dh) / 2, dw, dh);
      // 压暗
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(10,8,6,0.85)');
      g.addColorStop(0.35, 'rgba(10,8,6,0.28)');
      g.addColorStop(1, 'rgba(10,8,6,0.94)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // 纸色框
      ctx.strokeStyle = 'rgba(212,180,106,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(46, 46, W - 92, H - 92);

      ctx.textAlign = 'center';
      // 标题
      ctx.fillStyle = '#d4b46a';
      ctx.font = '500 24px "Songti SC", "STSong", serif';
      ctx.fillText('侨 批 归 途', W / 2, 130);
      ctx.fillStyle = 'rgba(247,239,221,0.55)';
      ctx.font = '16px "PingFang SC", sans-serif';
      ctx.fillText('云端侨乡剧情解谜 · 江门五邑', W / 2, 166);

      // 结局
      ctx.fillStyle = 'rgba(247,239,221,0.9)';
      ctx.font = '500 92px "Songti SC", "STSong", serif';
      ctx.fillText(e.title, W / 2, H - 420);
      ctx.fillStyle = 'rgba(212,180,106,0.85)';
      ctx.font = '18px "PingFang SC", sans-serif';
      ctx.fillText(e.en, W / 2, H - 380);

      // 分隔线
      ctx.strokeStyle = 'rgba(212,180,106,0.4)';
      ctx.beginPath(); ctx.moveTo(W / 2 - 60, H - 350); ctx.lineTo(W / 2 + 60, H - 350); ctx.stroke();

      // 结语
      ctx.fillStyle = 'rgba(247,239,221,0.86)';
      ctx.font = '26px "Songti SC", "STSong", serif';
      wrap(e.final, W / 2, H - 300, W - 200, 44);

      // 心境
      ctx.fillStyle = 'rgba(247,239,221,0.5)';
      ctx.font = '18px "PingFang SC", sans-serif';
      ctx.fillText('亲 情 ' + S.stats.qin + '　开 拓 ' + S.stats.yong + '　家 国 ' + S.stats.yi, W / 2, H - 170);
      ctx.fillStyle = 'rgba(247,239,221,0.32)';
      ctx.font = '14px "PingFang SC", sans-serif';
      ctx.fillText('侨批 · 银信 · 世界记忆名录', W / 2, H - 120);
    }

    function wrap(text, cx, y, maxW, lh) {
      let line = '';
      let yy = y;
      for (const chr of text) {
        const test = line + chr;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, cx, yy);
          line = chr; yy += lh;
        } else { line = test; }
      }
      if (line) ctx.fillText(line, cx, yy);
    }
  }

  /* ==========================================================
     卡册 / 影集 / 课堂
     ========================================================== */
  function renderCards() {
    const grid = $('#cardGrid');
    grid.innerHTML = CARDS.map(c => {
      const has = S.cards.indexOf(c.id) >= 0;
      return `<button class="mcard${has ? '' : ' is-locked'}" data-card="${c.id}">
        <span class="mcard__img" style="background-image:url('${has ? IMG(c.img) : IMG('letter_01')}')"></span>
        <span class="mcard__body">
          <span class="mcard__no">${esc(c.no)}</span>
          <b>${has ? esc(c.title) : '？？？'}</b>
          <span>${has ? esc(c.text) : '完成剧情后解锁'}</span>
        </span>
      </button>`;
    }).join('');
    updateCounts();
    $$('.mcard', grid).forEach(b => {
      b.addEventListener('click', () => {
        const c = cardById(b.dataset.card);
        if (S.cards.indexOf(c.id) < 0) { toast('这张卡还没有解锁'); return; }
        openModal({ img: c.img, tag: c.no + ' · ' + c.tag, title: c.title, text: c.text });
      });
    });
    if (!S.viewedAlbum) { /* noop */ }
  }

  function renderAlbum() {
    const tags = ['全部'].concat(Array.from(new Set(D.ALBUM.map(a => a.tag))));
    $('#albumFilter').innerHTML = tags.map(t =>
      `<button class="filter-chip${t === albumTag ? ' is-on' : ''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
    const items = D.ALBUM.filter(a => albumTag === '全部' || a.tag === albumTag);
    $('#albumGrid').innerHTML = items.map(a => `<button class="album-cell" data-img="${a.f}" data-cap="${esc(a.cap)}">
      <img loading="lazy" src="${IMG(a.f)}" alt="${esc(a.cap)}">
      <span>${esc(a.cap)}</span>
    </button>`).join('');
    $$('.filter-chip').forEach(b => b.addEventListener('click', () => {
      albumTag = b.dataset.tag; Sfx.click(); renderAlbum();
    }));
    $$('.album-cell').forEach(b => b.addEventListener('click', () => {
      openModal({
        img: b.dataset.img,
        tag: '侨乡影集 · 实地拍摄',
        title: b.dataset.cap,
        text: '照片由团队在江门五邑实地调研拍摄，收录于《实景影像素材库》。'
      });
    }));
    if (!S.viewedAlbum) { S.viewedAlbum = true; save(); }
  }

  function renderCodex() {
    $('#codexList').innerHTML = D.CODEX.map(c => `<div class="codex-item">
      <h4>${esc(c.h)}</h4><p>${c.p}</p></div>`).join('');
  }

  /* ==========================================================
     序章
     ========================================================== */
  function startPrologue() {
    flow = { chap: 0, step: 0, steps: [], total: 0 };
    show('chapter');
    setBar('序 · 一封侨批');
    let i = 0;
    const total = PROLOGUE.length;
    const draw = () => {
      const sc = PROLOGUE[i];
      $('#chapBody').innerHTML = `
        <div class="chapter-head">
          <div class="chapter-head__no">序 · PROLOGUE</div>
          <h1 class="chapter-head__title" style="font-size:26px">一封侨批</h1>
          <div class="chapter-head__line"></div>
        </div>
        ${figHTML(sc.img, sc.tag, '', { doc: sc.doc })}
        <div class="story">${linesHTML(sc.lines)}</div>
        <div class="continue-bar">
          <span class="progress-pip">${i + 1} / ${total}</span>
          <div class="spacer"></div>
          <button class="btn" id="btnP">${i + 1 < total ? '继续' : '出 海'}</button>
        </div>`;
      setBackdrop(sc.img);
      $('#btnP').addEventListener('click', () => {
        Sfx.tap();
        i++;
        if (i < total) draw();
        else { S.started = true; S.t0 = Date.now(); save(); startChapter(0, true); }
      });
    };
    draw();
  }

  /* ==========================================================
     初始化
     ========================================================== */
  /* ---------------- 背景音乐（Web Audio 合成，无音频文件） ---------------- */
  const Bgm = (function () {
    let ctx = null, master = null, timer = null, on = false, padNodes = [];
    // 五声音阶：G3 A3 C4 D4 E4 G4
    const SCALE = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00];

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0;          // 淡入
      master.connect(ctx.destination);
      return ctx;
    }

    function startPad() {
      // 两个低音三角波，过低通，做一条很轻的“底噪”
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

  /* 实体解谜文具与线上谜题的对应说明 */
  const KIT_TIPS = [
    { k: '密信', t: '铜牌对照表', d: '翻开套装里的铜牌卡，十个字各记一数。线上铜牌与它同序，只是每局重新排过。' },
    { k: '船票', t: '钢尺与算纸', d: '用钢尺比着算纸列式：先算总数，再算余数。招工馆的账，差一两银子都上不了船。' },
    { k: '账簿', t: '放大镜', d: '用放大镜贴住墨渍边缘，能看见笔下压出的凹痕——那就是被涂掉的数字。' },
    { k: '家书', t: '信纸与火漆', d: '按套装信纸的格线排次序；排对了，再用火漆印章封口。' },
    { k: '碉楼', t: '构件卡', d: '把四张构件卡摊开，对照碉楼图样的位置——燕子窝在上，拱券在门，卷草在女儿墙。' },
    { k: '族谱', t: '放大镜与族谱页', d: '用放大镜看抬头与落款的称谓：膝下、吾儿、胞兄、贤侄，各有其人。' }
  ];

  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-a="kit"]');
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      const head = b.closest('.puzzle') && b.closest('.puzzle').querySelector('.puzzle__head h3');
      const title = head ? head.textContent : '';
      const hit = KIT_TIPS.filter((x) => title.indexOf(x.k) >= 0)[0] || KIT_TIPS[0];
      openModal({
        tag: '解谜文具 · ' + hit.t,
        title: '这一关，用得上它',
        text: hit.d + '\n\n（实体套装里的「' + hit.t + '」，就是为这一关准备的。）',
        actions: [{ label: '知道了' }]
      });
    }, true);
    document.addEventListener('click', function () { if (S.soundOn) Bgm.start(); }, { once: true });
    $('#btnStart').addEventListener('click', () => {
      Sfx.unlock();
      if (S.done.length || S.choices.length || S.ending) {
        openModal({
          title: '重新开始？',
          text: '上一局的进度、卡片与结局记录会被清空。',
          actions: [
            { label: '继续上次', cls: 'btn--ghost', fn: () => { renderHub(); show('hub'); } },
            { label: '重新开始', fn: () => { resetAll(); startPrologue(); } }
          ]
        });
      } else {
        resetAll();
        startPrologue();
      }
    });
    $('#btnResume').addEventListener('click', () => { Sfx.unlock(); renderHub(); show('hub'); });
    $('#btnHubFromTitle').addEventListener('click', () => { renderHub(); show('hub'); });
    $('#chapterList').addEventListener('click', (e) => {
      const b = e.target.closest('[data-chap]');
      if (!b || b.disabled) return;
      const i = +b.dataset.chap;
      if (S.done.indexOf(CH[i].id) >= 0) {
        toast('这一篇已经读过了');
        return;
      }
      startChapter(i);
    });
    $$('.tool').forEach(b => b.addEventListener('click', () => {
      Sfx.click();
      const go = b.dataset.go;
      if (go === 'cards') { renderCards(); show('cards'); }
      if (go === 'album') { renderAlbum(); show('album'); }
      if (go === 'codex') { renderCodex(); show('codex'); }
      if (go === 'trail') { renderTrail(); show('trail'); }
    }));
    $('#btnBonus') && $('#btnBonus').addEventListener('click', () => {
      openModal({
        tag: '番外 · 四季盲盒',
        title: '四时的纹样',
        html: D.BONUS.map((b) => `<div class="bonus-item">
          <div class="bonus-season">${b.season}</div>
          <div class="bonus-body"><b>${esc(b.title)}</b><p>${esc(b.text)}</p></div>
        </div>`).join(''),
        actions: [{ label: '收 下' }]
      });
    });
    $('#trailBtn') && $('#trailBtn').addEventListener('click', checkTrailCode);
    $('#trailInput') && $('#trailInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); checkTrailCode(); }
    });
    $('#btnAbout').addEventListener('click', () => show('about'));
    $('#btnHubReplay').addEventListener('click', () => {
      openModal({
        title: '重新走一遍？',
        text: '当前进度、卡片与影集记录会被清空。',
        actions: [
          { label: '再想想', cls: 'btn--ghost' },
          { label: '重新开始', fn: () => { resetAll(); startPrologue(); } }
        ]
      });
    });
    const ccPrev = $('#ccPrev'), ccRestart = $('#ccRestart');
    if (ccPrev) ccPrev.addEventListener('click', () => {
      if (currentScreen !== 'chapter') return;
      Sfx.click();
      if (flow.chap > 0) startChapter(flow.chap - 1);
      else { renderHub(); show('hub'); }
    });
    if (ccRestart) ccRestart.addEventListener('click', () => {
      if (currentScreen !== 'chapter') return;
      Sfx.click();
      if (!flow.steps || !flow.steps.length) { startPrologue(); toast('序章重新开始'); }
      else { startChapter(flow.chap); toast('本关重新开始'); }
    });
    $('#btnBack').addEventListener('click', back);
    $('#btnSound').addEventListener('click', () => {
      S.soundOn = !S.soundOn;
      save();
      updateSoundIcon();
      if (S.soundOn) { Sfx.click(); Bgm.start(); } else { Bgm.stop(); }
      toast(S.soundOn ? '声音已开启' : '声音已关闭');
    });
    $('#modalClose').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    $('#unlockBtn').addEventListener('click', () => { Sfx.click(); nextUnlock(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); }
      if (e.key === 'Enter' || e.key === ' ') {
        const active = document.activeElement;
        const tag = active && active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') return;
        if (!$('#unlock').hidden) { nextUnlock(); return; }
        const next = $('#btnNext') || $('#btnP') || $('#btnChoiceNext') || $('#btnNextChap');
        if (next && !next.hidden) { e.preventDefault(); next.click(); }
      }
    });
  }

  function updateSoundIcon() {
    const svg = $('#soundIcon');
    if (!svg) return;
    if (S.soundOn) {
      svg.innerHTML = '<path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>';
    } else {
      svg.innerHTML = '<path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>';
    }
  }

  let booted = false;
  function init() {
    if (booted) return;
    booted = true;
    const saved = load();
    if (saved) S = saved;
    updateSoundIcon();
    renderTitle();
    renderHub();
    bindGlobal();
    setBackdrop('hero_tower');
    if (!S.t0) S.t0 = Date.now();

    // 若上次退出时在某一幕，提供继续入口
    if (S.done.length && !S.ending) {
      $('#btnResume').hidden = false;
    }
    // 结局后回到标题，可查看卡册
    show('title');
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
}());
