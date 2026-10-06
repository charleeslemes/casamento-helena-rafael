/* =========================================================
   Helena & Rafael — interações
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- LOADER ---------------- */
  const loader = $('.loader');
  const count = $('.loader__count');
  let loaded = false;
  window.addEventListener('load', () => (loaded = true));
  requestAnimationFrame(() => loader.classList.add('is-ready'));

  const start = performance.now();
  const MIN = reduced ? 300 : 1800;
  (function tick(now) {
    const t = clamp((now - start) / MIN);
    const target = loaded ? t : Math.min(t, 0.9);
    count.textContent = Math.round(ease(target) * 100) + '%';
    if (target < 1) return requestAnimationFrame(tick);
    setTimeout(() => {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      setTimeout(() => loader.remove(), 1800);
    }, 350);
  })(start);

  /* ---------------- MENU ---------------- */
  const menuBtn = $('.header__menu');
  const menu = $('#menu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', !open);
  };
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------------- REVEAL ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
    { rootMargin: '0px 0px -10% 0px' }
  );
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------------- SCROLL SCENES ---------------- */
  const hero = $('.hero');
  const heroSticky = $('.hero__sticky');
  const discover = $('.discover__sticky');
  const track = $('.stepper__track');
  const layers = $$('.stepper__layer');
  const texts = $$('.stepper__text');
  const bullets = $$('.stepper__bullets button');
  const gWrap = $('.gallery__track-wrap');
  const gRow = $('.gallery__row');
  const parallax = $$('[data-parallax]');
  const parallaxImgs = $$('[data-parallax-img]');

  // progresso de uma seção "sticky" (0 no topo, 1 quando termina)
  const stickyProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };
  // progresso de um elemento atravessando a viewport
  const viewProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((innerHeight - r.top) / (r.height + innerHeight));
  };

  let activeStep = -1;
  const setStep = (i) => {
    if (i === activeStep) return;
    activeStep = i;
    texts.forEach((t, k) => {
      t.classList.toggle('is-active', k === i);
      t.classList.toggle('is-past', k < i);
    });
    bullets.forEach((b, k) => {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-selected', k === i);
    });
  };
  bullets.forEach((b, i) =>
    b.addEventListener('click', () => {
      const stops = [0.05, 0.5, 0.95];
      const top = track.offsetTop + stops[i] * (track.offsetHeight - innerHeight);
      window.scrollTo({ top, behavior: 'smooth' });
    })
  );

  function update() {
    const vw = innerWidth;
    const vh = innerHeight;
    const mobile = vw < 900;

    /* HERO — arco que se expande até a tela cheia */
    {
      const p = stickyProgress(hero);
      const e = ease(range(p, 0, 0.75));
      const s0 = mobile ? vw * 0.16 : vw * 0.36;
      const t0 = mobile ? vh * 0.16 : vh * 0.15;
      const b0 = mobile ? vh * 0.36 : vh * 0.24;
      const s = lerp(s0, 0, e);
      const r = lerp((vw - s0 * 2) / 2, 0, e);
      const st = heroSticky.style;
      st.setProperty('--t', lerp(t0, 0, e) + 'px');
      st.setProperty('--b', lerp(b0, 0, e) + 'px');
      st.setProperty('--s', s + 'px');
      st.setProperty('--r', r + 'px');
      st.setProperty('--scale', lerp(1.25, 1, e));
      st.setProperty('--p', p);
      st.setProperty('--shade', range(p, 0.3, 0.8));
      st.setProperty('--title', ease(range(p, 0.5, 0.85)));
    }

    /* DISCOVER — textos se afastam, imagem cresce */
    {
      const p = viewProgress(discover);
      discover.style.setProperty('--dp', (p - 0.5) * 2);
      discover.style.setProperty('--fig', lerp(0.82, 1.06, p));
      discover.style.setProperty('--figy', lerp(-14, 0, p) + '%');
    }

    /* STEPPER — revelação por máscara */
    {
      const p = stickyProgress(track);
      const r1 = ease(range(p, 0.18, 0.42));
      const r2 = ease(range(p, 0.6, 0.84));
      [null, r1, r2].forEach((r, i) => {
        const layer = layers[i];
        if (r !== null) layer.style.setProperty('--clip', (1 - r) * 100 + '%');
        const local = i === 0 ? range(p, 0, 0.42) : range(p, i === 1 ? 0.18 : 0.6, 1);
        layer.style.setProperty('--ls', lerp(1.15, 1, local));
      });
      setStep(p < 0.3 ? 0 : p < 0.72 ? 1 : 2);
    }

    /* GALERIA — scroll horizontal */
    {
      const p = stickyProgress(gWrap);
      const max = gRow.scrollWidth - vw;
      gRow.style.setProperty('--gx', -max * ease(p) + 'px');
    }

    /* PARALLAX */
    parallax.forEach((el) => {
      const amt = +el.dataset.parallax || 60;
      const p = viewProgress(el);
      el.querySelector('img').style.setProperty('--py', (0.5 - p) * amt + 'px');
    });
    parallaxImgs.forEach((img) => {
      const p = viewProgress(img.parentElement);
      img.style.setProperty('--py', (0.5 - p) * 120 + 'px');
    });
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ---------------- CONTAGEM REGRESSIVA ---------------- */
  const target = new Date('2027-04-17T16:30:00-03:00').getTime();
  const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const countdown = () => {
    let diff = Math.max(0, target - Date.now()) / 1000;
    const d = Math.floor(diff / 86400); diff -= d * 86400;
    const h = Math.floor(diff / 3600); diff -= h * 3600;
    const m = Math.floor(diff / 60);
    const s = Math.floor(diff - m * 60);
    cd.d.textContent = pad(d, 3);
    cd.h.textContent = pad(h);
    cd.m.textContent = pad(m);
    cd.s.textContent = pad(s);
  };
  countdown();
  setInterval(countdown, 1000);

  /* ---------------- COPIAR PIX ---------------- */
  $$('[data-copy]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const text = $(btn.dataset.copy).textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copiado ✓';
      } catch {
        btn.textContent = 'Selecione e copie';
      }
      setTimeout(() => (btn.textContent = 'Copiar'), 2200);
    })
  );

  /* ---------------- RSVP ---------------- */
  const form = $('#rsvp-form');
  const status = $('.form__status', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('input[required]', form).forEach((input) => {
      if (input.type === 'radio') return;
      const valid = input.checkValidity();
      input.closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    const presenca = form.querySelector('input[name="presenca"]:checked');
    if (!ok || !presenca) {
      status.textContent = !presenca && ok ? 'Conta pra gente se você vem 🙂' : 'Preencha seu nome e um e-mail válido.';
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    // Sem backend: salva localmente. Integre aqui com Formspree, Google Forms, etc.
    const list = JSON.parse(localStorage.getItem('rsvp') || '[]');
    list.push({ ...data, enviadoEm: new Date().toISOString() });
    localStorage.setItem('rsvp', JSON.stringify(list));

    const nome = data.nome.split(' ')[0];
    status.textContent =
      data.presenca === 'sim'
        ? `Obrigado, ${nome}! Mal podemos esperar para celebrar com você.`
        : `Obrigado por avisar, ${nome}. Você estará no nosso coração.`;
    form.reset();
  });
})();
