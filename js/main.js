(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Shop details, from the shop's Druto listing.
     Every phone, WhatsApp and directions link reads from here.
     ------------------------------------------------------------------ */
  const CONFIG = {
    phone: '+917990542134',
    phoneDisplay: '+91 79905 42134',
    whatsapp: '917990542134',
    mapsQuery: '21.7178471406871,73.0367061528276',
  };

  // Menu lives in js/menu-data.js, generated from the shop's live menu.
  const CATS = window.NBS_CATS || [];
  const MENU = (window.NBS_MENU || []).map((m, i) => Object.assign({ id: 'i' + i }, m));

  /* ------------------------------------------------------------------ */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = !reduce && typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const wide = matchMedia('(min-width: 1081px)');
  const waLink = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  const inr = (n) => '₹' + n.toLocaleString('en-IN');

  if (!anim) root.classList.remove('js');
  if (anim) gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------- Contact wiring ---------- */
  $$('[data-wa]').forEach((a) => (a.href = waLink(a.dataset.wa)));
  $$('[data-tel]').forEach((a) => (a.href = 'tel:' + CONFIG.phone));
  $$('[data-tel-text]').forEach((s) => (s.textContent = CONFIG.phoneDisplay));
  $$('[data-dir]').forEach((a) => (a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(CONFIG.mapsQuery)));
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (anim && window.Lenis) {
    lenis = new Lenis({ lerp: 0.11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const lock = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); root.classList.toggle('is-locked', on); };

  /* ---------- Mobile sheet ---------- */
  const menuBtn = $('#menuBtn');
  const setSheet = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.textContent = open ? 'Close' : 'Menu';
    $('#sheet').setAttribute('aria-hidden', !open);
    lock(open);
  };
  menuBtn.addEventListener('click', () => setSheet(!root.classList.contains('menu-open')));

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    e.preventDefault();
    if (id === '#') return;
    if (root.classList.contains('menu-open')) setSheet(false);
    const target = id === '#top' ? 0 : $(id);
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else if (target === 0) scrollTo({ top: 0, behavior: 'smooth' });
    else target && target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ==================================================================
     Menu board
     ================================================================== */
  const tabs = $('#tabs');
  const rows = $('#rows');
  tabs.innerHTML = CATS.map((c, i) =>
    `<button class="tab" role="tab" id="tab-${c.id}" data-cat="${c.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${c.label}</button>`).join('');

  const catOf = (id) => CATS.find((c) => c.id === id) || {};
  const fromPrice = (m) => Math.min(...m.v.map((x) => x[1]));
  const hasVariants = (m) => m.v.length > 1 || !!m.v[0][0];
  const priceLine = (m) => m.v.map(([l, p]) => (l ? `${l} ${inr(p)}` : inr(p))).join(' · ');
  const orderMsg = (m) => `Hi New Bombay Sandwich! I'd like to order: ${m.name} (${priceLine(m)})`;

  const rowHTML = (m) => `
    <li class="row" data-id="${m.id}">
      <button class="row__btn" type="button" aria-expanded="false" aria-controls="more-${m.id}">
        <span class="row__line"><span class="row__name">${m.name}</span><span class="row__dots" aria-hidden="true"></span></span>
        <span class="row__price">${m.v.length > 1 ? '<small>from</small>' : ''}${inr(fromPrice(m))}</span>
        ${hasVariants(m) ? `<span class="row__sub"><span class="txt">${priceLine(m)}</span></span>` : ''}
      </button>
      <div class="row__more" id="more-${m.id}"><div>
        <div class="row__inner">
          <figure class="photo"><img src="assets/img/${m.img}" alt="" loading="lazy"></figure>
          <div>
            <p>${catOf(m.cat).blurb || ''}</p>
            <p><b>${priceLine(m)}</b></p>
            <a class="btn btn--yellow btn--sm" href="${waLink(orderMsg(m))}" target="_blank" rel="noopener">Order this</a>
          </div>
        </div>
      </div></div>
    </li>`;

  const plate = {
    photo: $('.plate__photo'), img: $('#pImg'), price: $('#pPrice'), name: $('#pName'),
    desc: $('#pDesc'), vars: $('#pVars'), order: $('#pOrder'),
  };
  let plateId = null;
  const showPlate = (m) => {
    if (!m || plateId === m.id) return;
    const first = plateId === null;
    const newPhoto = !plate.img.src.endsWith('/' + m.img);
    plateId = m.id;
    plate.img.src = `assets/img/${m.img}`;
    plate.img.alt = '';
    plate.price.textContent = (m.v.length > 1 ? 'from ' : '') + inr(fromPrice(m));
    plate.name.textContent = m.name;
    plate.desc.textContent = catOf(m.cat).blurb || '';
    plate.vars.innerHTML = hasVariants(m) ? m.v.map(([l, p]) => `<span class="var"><b>${inr(p)}</b>${l || 'Regular'}</span>`).join('') : '';
    plate.order.href = waLink(orderMsg(m));
    $$('.row', rows).forEach((r) => r.classList.toggle('is-active', r.dataset.id === m.id));
    if (anim && !first) {
      if (newPhoto) gsap.fromTo(plate.photo, { rotation: 9, scale: 0.86, y: 24 }, { rotation: -3, scale: 1, y: 0, duration: 0.55, ease: 'back.out(2.2)', overwrite: true });
      gsap.fromTo(plate.name, { x: 26 }, { x: 0, duration: 0.45, ease: 'back.out(2)', overwrite: true });
      gsap.fromTo($$('.var', plate.vars), { y: 14, rotation: -4 }, { y: 0, rotation: 0, duration: 0.4, stagger: 0.04, ease: 'back.out(2.5)' });
    }
  };
  const byId = (id) => MENU.find((m) => m.id === id);

  const renderRows = (cat) => {
    const items = MENU.filter((m) => m.cat === cat);
    rows.innerHTML = items.map(rowHTML).join('');
    rows.setAttribute('aria-labelledby', 'tab-' + cat);
    plateId = null;
    showPlate(items[0]);
    // Preload this section's photos so the plate swaps instantly
    [...new Set(items.map((m) => m.img))].forEach((f) => { const i = new Image(); i.src = `assets/img/${f}`; });
    if (anim) gsap.from($$('.row__btn', rows), { x: -40, duration: 0.6, stagger: 0.03, ease: 'back.out(1.8)', clearProps: 'transform' });
    if (anim) ScrollTrigger.refresh();
  };

  const selectTab = (btn) => {
    $$('.tab', tabs).forEach((t) => { const on = t === btn; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    tabs.scrollTo({ left: btn.offsetLeft - tabs.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
    renderRows(btn.dataset.cat);
  };
  tabs.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t && t.getAttribute('aria-selected') !== 'true') selectTab(t); });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const all = $$('.tab', tabs);
    const i = all.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    const n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
    selectTab(n); n.focus();
  });

  // Desktop: hovering or focusing a row fills the plate. Phones/tablets: tap to expand the row.
  rows.addEventListener('pointerover', (e) => {
    if (!wide.matches) return;
    const r = e.target.closest('.row');
    if (r) showPlate(byId(r.dataset.id));
  });
  rows.addEventListener('focusin', (e) => {
    const r = e.target.closest('.row');
    if (r && wide.matches) showPlate(byId(r.dataset.id));
  });
  rows.addEventListener('click', (e) => {
    const b = e.target.closest('.row__btn');
    if (!b) return;
    const r = b.closest('.row');
    if (wide.matches) { showPlate(byId(r.dataset.id)); return; }
    const open = !r.classList.contains('is-open');
    $$('.row.is-open', rows).forEach((o) => { o.classList.remove('is-open'); $('.row__btn', o).setAttribute('aria-expanded', 'false'); });
    r.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
    if (open && anim) {
      gsap.fromTo($('.photo', r), { rotation: 12, scale: 0.7 }, { rotation: -3, scale: 1, duration: 0.6, ease: 'back.out(2)', delay: 0.08 });
      setTimeout(() => ScrollTrigger.refresh(), 480);
    }
  });
  if (CATS.length) renderRows(CATS[0].id);

  /* ==================================================================
     Open / closed status
     ================================================================== */
  $$('.status[data-hours]').forEach((el) => {
    const [o, c] = el.dataset.hours.split('-').map((t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; });
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const isOpen = mins >= o && mins < c;
    el.classList.toggle('is-closed', !isOpen);
    el.textContent = isOpen ? 'Open now' : 'Closed now';
  });

  /* ==================================================================
     The taxi route (drawn to fit its container)
     ================================================================== */
  const route = $('#route');
  const road = $('#road');
  const dash = $('#roadDash');
  const svg = $('#routeSvg');
  const taxi = $('#taxi');
  const stops = $$('.stop', route);
  let roadLen = 0;

  const smooth = (pts) => {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1} ${c2} ${p2}`;
    }
    return d;
  };

  const buildRoad = () => {
    const w = route.clientWidth;
    const h = route.clientHeight;
    const phone = w < 761;
    const f = phone
      ? [[0.5, -0.02], [0.84, 0.1], [0.18, 0.25], [0.82, 0.41], [0.2, 0.57], [0.8, 0.73], [0.24, 0.87], [0.55, 1.02]]
      : [[-0.06, 0.04], [0.26, 0.1], [0.56, 0.05], [0.86, 0.16], [0.9, 0.36], [0.6, 0.46], [0.24, 0.5], [0.09, 0.68], [0.3, 0.85], [0.66, 0.88], [1.08, 0.97]];
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const d = smooth(f.map(([x, y]) => [Math.round(x * w), Math.round(y * h)]));
    road.setAttribute('d', d);
    dash.setAttribute('d', d);
    roadLen = road.getTotalLength();

    stops.forEach((s) => {
      const p = road.getPointAtLength(roadLen * +s.dataset.at);
      const cw = s.offsetWidth;
      const ch = s.offsetHeight;
      let left;
      if (phone) left = p.x < w / 2 ? w - cw - 10 : 10;
      else left = p.x > w / 2 ? p.x - cw - 80 : p.x + 80;
      left = Math.max(10, Math.min(w - cw - 10, left));
      const top = Math.max(0, Math.min(h - ch, p.y - ch / 2));
      s.style.left = left + 'px';
      s.style.top = top + 'px';
    });
  };

  let taxiP = { p: 0 };
  const placeTaxi = () => {
    if (!roadLen) return;
    const L = roadLen * taxiP.p;
    const a = road.getPointAtLength(Math.max(0, L - 2));
    const b = road.getPointAtLength(Math.min(roadLen, L + 2));
    const pt = road.getPointAtLength(L);
    const goingLeft = b.x < a.x;
    let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    if (goingLeft) ang -= 180;
    const tw = taxi.offsetWidth;
    taxi.style.transform = `translate(${pt.x - tw / 2}px, ${pt.y - tw * 0.4}px) rotate(${ang}deg) scaleX(${goingLeft ? -1 : 1})`;
    stops.forEach((s) => s.classList.toggle('is-reached', taxiP.p >= +s.dataset.at - 0.03));
  };

  buildRoad();
  if (!anim) { taxiP.p = 1; placeTaxi(); }
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { buildRoad(); placeTaxi(); if (anim) ScrollTrigger.refresh(); }, 150); });

  /* ==================================================================
     Motion. Everything below needs GSAP and no reduced-motion setting.
     ================================================================== */
  if (!anim) {
    root.classList.remove('prep');
    document.body.classList.remove('is-loading');
    return;
  }

  /* ---------- Hero entry: a whole sandwich drops, the knife cuts it, the halves open ---------- */
  scrollTo(0, 0);
  lenis && lenis.stop();
  const stage = $('#stage');
  const [halfA, halfB] = $$('.hero .half');
  const slice = $('#slice');
  const knife = $('#knife');
  const cutLine = $('.slice__line', slice);
  const crumbs = $$('.crumb', slice);
  const shadow = $('#wholeShadow');
  const letters = $$('.hero__big span');
  const heroLogo = $('.hero__logo');
  const sticker = $('.hero__sticker');
  const heroImg = $('img', halfA);
  const faces = $$('.half__face i');
  const REST = { a: -9, b: 7 };
  const SHADOW_OFF = 'drop-shadow(0px 0px 0px rgba(90,30,0,0))';
  const SHADOW_ON = 'drop-shadow(0px 22px 18px rgba(90,30,0,0.28))';

  const setUpIntro = () => {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const size = halfA.offsetWidth;
    const whole = Math.min(1.22, (Math.min(W, H) * 0.86) / size);
    const cx = W / 2;
    const cy = H / 2;
    // Each half moves from its resting spot to the centre, where the two make one sandwich
    const toCentre = (el) => ({ x: cx - (el.offsetLeft + el.offsetWidth / 2), y: cy - (el.offsetTop + el.offsetHeight / 2) });
    gsap.set([halfA, halfB], { filter: SHADOW_OFF, scale: whole, rotation: -4 });
    gsap.set(halfA, toCentre(halfA));
    gsap.set(halfB, toCentre(halfB));
    gsap.set([slice, shadow], { left: cx - size / 2, top: cy - size / 2, width: size, height: size, scale: whole, rotation: -4, x: 0, y: 0 });
    gsap.set(shadow, { y: 26, scale: whole * 0.86 });

    // Knife tip runs along the diagonal, from the top right corner to the bottom left
    const kw = size * 1.35;
    const kh = (kw * 90) / 400;
    const tip = { x: (6 / 400) * kw, y: (44 / 90) * kh };
    const along = (t) => ({ x: size - t * size - tip.x, y: t * size - tip.y });
    gsap.set(knife, { width: kw, transformOrigin: `${tip.x}px ${tip.y}px`, rotation: -45, ...along(-0.32), visibility: 'hidden' });
    gsap.set(cutLine, { rotation: 135, scaleX: 0, transformOrigin: '0% 50%' });

    gsap.set(faces, { scaleY: 0 });
    gsap.set(crumbs, { x: 0, y: 0, visibility: 'hidden' });
    gsap.set(letters, { visibility: 'hidden' });
    gsap.set(heroLogo, { scale: 0, rotation: 14 });
    gsap.set(sticker, { scale: 0, rotation: -60 });
    gsap.set('.top', { yPercent: -130 });
    gsap.set('.hero__foot > *', { y: () => innerHeight * 0.45 });
    return { size, whole, along, cx };
  };

  const playIntro = () => {
    const g = setUpIntro();
    root.classList.remove('prep');
    const all = [halfA, halfB, slice, shadow];
    // Letters burst outward from the cut
    const fromCut = (i, el) => g.cx - (el.offsetLeft + el.offsetWidth / 2) - el.parentElement.offsetLeft;

    gsap.timeline({ onComplete: afterIntro })
      // 1. The whole sandwich drops onto the counter
      .from(all, { y: '-=' + innerHeight, rotation: '+=28', duration: 0.6, ease: 'power3.in' })
      .to(all, { scaleY: g.whole * 0.9, scaleX: g.whole * 1.05, duration: 0.08, ease: 'power2.out' })
      .to(all, { scaleY: g.whole, scaleX: g.whole, duration: 0.42, ease: 'back.out(3)' })
      .set(shadow, { scaleY: g.whole * 0.86, scaleX: g.whole * 0.86 })
      // 2. Knife comes in from the top right and slices corner to corner
      .set(knife, { visibility: 'visible' }, '+=0.05')
      .to(knife, { ...g.along(1.08), duration: 0.42, ease: 'power3.inOut' })
      .to(cutLine, { scaleX: 1, duration: 0.3, ease: 'power2.inOut' }, '<0.08')
      // 3. The blade hits the counter: a small jolt, crumbs jump
      .add('cut')
      .fromTo(stage, { y: 0 }, { y: 7, duration: 0.05, yoyo: true, repeat: 1, ease: 'power1.out' }, 'cut')
      .set(crumbs, { visibility: 'visible' }, 'cut')
      .fromTo(crumbs, {
        x: (i) => g.size * (0.82 - i * 0.1) - g.size / 2,
        y: (i) => g.size * (0.18 + i * 0.1) - g.size / 2,
        rotation: 0,
      }, {
        x: (i) => '+=' + (i % 2 ? 1 : -1) * gsap.utils.random(40, 110),
        y: (i) => '+=' + ((i % 2 ? 1 : -1) * gsap.utils.random(20, 70) - 50),
        rotation: () => gsap.utils.random(-200, 200),
        duration: 0.35, ease: 'power2.out',
      }, 'cut')
      .to(crumbs, { y: '+=' + innerHeight * 0.6, duration: 0.7, ease: 'power2.in' }, 'cut+=0.35')
      .set(crumbs, { visibility: 'hidden' })
      // 4. Knife carries on out of frame, the cut line closes up behind it
      .to(knife, { ...g.along(2.4), duration: 0.45, ease: 'power2.in' }, 'cut')
      .set(knife, { visibility: 'hidden' }, 'cut+=0.45')
      .to(cutLine, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.25, ease: 'power2.in' }, 'cut+=0.12')
      // 5. The halves open up and BOMBAY comes out of the middle
      .add(() => { document.body.classList.remove('is-loading'); lenis && lenis.start(); }, 'cut+=0.3')
      .to(shadow, { scale: g.whole * 0.4, duration: 0.3, ease: 'power2.in' }, 'cut+=0.1')
      .set(shadow, { visibility: 'hidden' }, 'cut+=0.4')
      .to(halfA, { x: 0, y: 0, scale: 1, rotation: REST.a, filter: SHADOW_ON, duration: 0.95, ease: 'back.out(1.5)' }, 'cut+=0.12')
      .to(halfB, { x: 0, y: 0, scale: 1, rotation: REST.b, filter: SHADOW_ON, duration: 0.95, ease: 'back.out(1.5)' }, 'cut+=0.16')
      .to(faces, { scaleY: 1, duration: 0.35, ease: 'power2.out' }, 'cut+=0.2')
      .set(letters, { visibility: 'visible' }, 'cut+=0.18')
      .fromTo(letters, { x: fromCut, scale: 0.2, rotation: () => gsap.utils.random(-30, 30) },
        { x: 0, scale: 1, rotation: 0, duration: 0.8, stagger: { each: 0.04, from: 'center' }, ease: 'back.out(1.6)' }, 'cut+=0.18')
      .to(heroLogo, { scale: 1, rotation: -4, duration: 0.55, ease: 'back.out(2.4)' }, 'cut+=0.62')
      .to(sticker, { scale: 1, rotation: 8, duration: 0.6, ease: 'back.out(2.2)' }, 'cut+=0.8')
      .to('.top', { yPercent: 0, duration: 0.7, ease: 'back.out(1.4)' }, 'cut+=0.6')
      .to('.hero__foot > *', { y: 0, duration: 0.7, stagger: 0.07, ease: 'back.out(1.4)' }, 'cut+=0.62')
      .set(slice, { visibility: 'hidden' });
  };

  const ready = Promise.race([
    Promise.all([
      heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
      document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
    ]),
    new Promise((r) => setTimeout(r, 3500)),
  ]);
  ready.then(playIntro);

  function afterIntro() {
    gsap.set([halfA, halfB], { clearProps: 'filter' });
    // Hero breaks apart as you scroll away: the halves keep opening, letters scatter
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } })
      .to(halfA, { x: () => -innerWidth * 0.08, y: () => -innerHeight * 0.12, rotation: REST.a - 16, ease: 'none' }, 0)
      .to(halfB, { x: () => innerWidth * 0.08, y: () => innerHeight * 0.32, rotation: REST.b + 14, ease: 'none' }, 0)
      .to(letters, { y: (i) => (i % 2 ? 90 : -60), rotation: (i) => (i % 2 ? 8 : -8), ease: 'none' }, 0)
      .to(heroLogo, { y: 120, rotation: -12, ease: 'none' }, 0);
    ScrollTrigger.refresh();
  }

  /* ---------- Compact bar + floating order button ---------- */
  ScrollTrigger.create({
    trigger: '.hero', start: 'bottom 90px',
    onEnter: () => { $('#bar').classList.add('is-on'); $('.fab').classList.add('is-on'); },
    onLeaveBack: () => { $('#bar').classList.remove('is-on'); $('.fab').classList.remove('is-on'); },
  });

  /* ---------- Routine: lines slide with scroll, photos drift ---------- */
  $$('.routine__line').forEach((l) => {
    const dir = +l.dataset.dir;
    gsap.fromTo(l, { xPercent: dir < 0 ? 0 : -18 }, { xPercent: dir < 0 ? -18 : 0, ease: 'none', scrollTrigger: { trigger: '.routine', start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  });
  $$('[data-speed]').forEach((el) => {
    const s = +el.dataset.speed;
    gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  });

  /* ---------- Build: ingredients fly in and stack, then the press ---------- */
  (() => {
    const stack = $('.build__stack');
    const S = () => stack.offsetWidth;
    const [bread, cuc, tom, tom2, chilli, grill] = $$('.b-item', stack);
    const tag = (n) => $('.t' + n);
    gsap.set([bread, cuc, tom, tom2, chilli, grill], { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set($$('.tag'), { scale: 0 });
    gsap.set('.build__price', { scale: 0, rotation: -25 });
    const pop = { scale: 1, duration: 0.3, ease: 'back.out(3)' };

    gsap.timeline({
      scrollTrigger: { trigger: '#build', start: 'top top', end: '+=2800', pin: '.build__pin', scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
    })
      .fromTo(bread, { y: () => innerHeight, rotation: 50 }, { y: 0, rotation: -8, duration: 1, ease: 'power3.out' })
      .to(tag(1), pop, '-=0.25')
      .fromTo(cuc, { x: () => -innerWidth, rotation: -200 }, { x: () => -S() * 0.1, y: () => -S() * 0.1, rotation: 0, duration: 1, ease: 'power3.out' })
      .to(tag(2), pop, '-=0.25')
      .fromTo(tom, { x: () => innerWidth, y: () => -S() * 0.6, rotation: 220 }, { x: () => S() * 0.17, y: () => S() * 0.1, rotation: 20, duration: 1, ease: 'power3.out' })
      .fromTo(tom2, { x: () => innerWidth * 0.8, y: () => innerHeight * 0.7, rotation: -160 }, { x: () => -S() * 0.17, y: () => S() * 0.2, rotation: -10, duration: 0.9, ease: 'power3.out' }, '<0.15')
      .to(tag(3), pop, '-=0.25')
      .fromTo(chilli, { y: () => -innerHeight, rotation: 300 }, { x: () => S() * 0.03, y: () => -S() * 0.02, rotation: -30, duration: 1, ease: 'power3.out' })
      .to(tag(4), pop, '-=0.25')
      .fromTo(grill, { y: () => -innerHeight * 1.2, rotation: 35 }, { y: 0, rotation: -6, duration: 0.9, ease: 'power3.in' })
      .to(grill, { scaleY: 0.84, scaleX: 1.1, duration: 0.12, ease: 'power2.out' })
      .to(grill, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.35)' })
      .to(tag(5), { scale: 1, duration: 0.35, ease: 'back.out(3)' }, '<')
      .to('.build__price', { scale: 1, rotation: -4, duration: 0.45, ease: 'back.out(2.5)' }, '<0.1')
      .to('.build__title', { scale: 1.06, duration: 0.4, ease: 'none' }, '<')
      .to({}, { duration: 0.5 });
  })();

  /* ---------- Taxi drives the route with your scroll ---------- */
  $$('.taxi .wheel').forEach((w, i) => gsap.set(w, { svgOrigin: i ? '150 75' : '54 75' }));
  gsap.to(taxiP, {
    p: 1, ease: 'none', onUpdate: placeTaxi,
    scrollTrigger: { trigger: route, start: 'top 70%', end: 'bottom 65%', scrub: 0.8 },
  });
  gsap.to($$('.taxi .wheel'), { rotation: 360 * 14, ease: 'none', scrollTrigger: { trigger: route, start: 'top 70%', end: 'bottom 65%', scrub: 0.8 } });
  placeTaxi();

  /* ---------- Footer: ingredients drop onto the wordmark ---------- */
  $$('.drop').forEach((d, i) => {
    gsap.fromTo(d, { y: -320 - i * 60, rotation: -140 + i * 70 }, {
      y: 0, rotation: [12, -18, 24, -10][i], ease: 'bounce.out',
      scrollTrigger: { trigger: '.foot__mark', start: 'top 95%', end: 'top 45%', scrub: 0.6 },
    });
  });

  if (document.fonts) document.fonts.ready.then(() => { buildRoad(); ScrollTrigger.refresh(); });
  addEventListener('load', () => { buildRoad(); ScrollTrigger.refresh(); });
})();
