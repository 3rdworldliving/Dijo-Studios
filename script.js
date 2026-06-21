/* script.js — Dijo Studios | Snake‑reveal gallery + spotlight headline
   Improved: prefers-reduced-motion branching, keyboard a11y (gallery cards
   as buttons, lightbox focus trap), form feedback + honeypot, graceful image
   fallback, aria-expanded/aria-current, self-hosted vendor libs. */

const _isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const _prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
═══════════════════════════════════════════════ */
/* Disable Lenis on touch devices and for reduced-motion users — native
   scrolling is smoother on touch and respects motion preferences. */
let lenis;
if (_isTouchDevice || _prefersReducedMotion) {
  lenis = {
    start(){}, stop(){},
    scrollTo(target, opts) {
      if (typeof target === 'number') window.scrollTo(0, target);
      else if (typeof target === 'string') { const el = document.querySelector(target); if (el) el.scrollIntoView(); }
      else if (target instanceof HTMLElement) target.scrollIntoView();
    },
    on(){}
  };
} else {
  lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });
  gsap.ticker.add(time => lenis.raf(time * 1000));
}

if (_isTouchDevice) {
  gsap.ticker.lagSmoothing(200, 33);
} else {
  gsap.ticker.lagSmoothing(0);
}
gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════
   2. CUSTOM CURSOR
═══════════════════════════════════════════════ */
let cursorDot;
let _cursorHandler = null;

function initCustomCursor() {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  if (_prefersReducedMotion) return; // no custom cursor for motion-sensitive users
  if (_cursorHandler) {
    document.removeEventListener('mousemove', _cursorHandler);
    _cursorHandler = null;
  }
  const oldDot = document.querySelector('.cursor-dot');
  if (oldDot) oldDot.remove();
  cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);
  _cursorHandler = (e) => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  };
  document.addEventListener('mousemove', _cursorHandler);
  // Only now do we hide the native cursor (CSS gates on this class).
  document.documentElement.classList.add('custom-cursor');
  attachCursorHoverEvents();
}

function attachCursorHoverEvents() {
  const interactive = document.querySelectorAll('a, button, .btn, .gallery-card, .brand-tag, .logo-container, .upload-zone, .clear-btn, [role="button"], input, textarea, .nav-links a');
  interactive.forEach(el => {
    el.addEventListener('mouseenter', () => { if (cursorDot) cursorDot.classList.add('ripple'); });
    el.addEventListener('mouseleave', () => { if (cursorDot) cursorDot.classList.remove('ripple'); });
  });
}

/* ═══════════════════════════════════════════════
   3. CINEMATIC LOADER — gold blob reveal
═══════════════════════════════════════════════ */
function initLoader(onComplete) {
  if (typeof lenis !== 'undefined') lenis.stop();

  const loader = document.createElement('div');
  loader.id = 'site-loader';
  loader.innerHTML = `
    <div class="loader-blob"></div>
    <div class="loader-content-wrap">
      <span id="loader-text">DIJO STUDIOS</span>
    </div>
  `;
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  const txt = document.getElementById('loader-text');

  // Reduced motion: static text, brief hold, simple fade out (no scramble, no blob clip animation).
  if (_prefersReducedMotion) {
    gsap.fromTo(txt, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    const blob = loader.querySelector('.loader-blob');
    if (blob) blob.style.display = 'none';
    setTimeout(() => {
      gsap.to(loader, {
        opacity: 0, duration: 0.35, ease: 'power2.out',
        onComplete: () => {
          loader.remove();
          document.body.style.overflow = '';
          if (typeof lenis !== 'undefined') lenis.start();
          if (onComplete) onComplete();
        }
      });
    }, 700);
    return;
  }

  const TARGET = 'DIJO STUDIOS';
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';
  const FRAME_MS = 70, STAGGER = 90, SPINS = 10;

  txt.innerHTML = TARGET.split('').map(ch =>
    ch === ' '
      ? '<span class="lch" style="display:inline-block;width:0.35em">&nbsp;</span>'
      : `<span class="lch" data-final="${ch}">${ch}</span>`
  ).join('');

  const letterSpans = txt.querySelectorAll('span.lch[data-final]');
  let lettersLanded = 0;

  gsap.fromTo(txt, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });

  letterSpans.forEach((span, i) => {
    const finalChar = span.dataset.final;
    let frame = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        if (frame < SPINS) {
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          span.style.color = '#0a0a0a';
        } else {
          clearInterval(iv);
          span.textContent = finalChar;
          span.style.color = '';
          lettersLanded++;
          if (lettersLanded === letterSpans.length) {
            setTimeout(() => { triggerBlobReveal(); }, 1000);
          }
        }
        frame++;
      }, FRAME_MS);
    }, i * STAGGER);
  });

  function triggerBlobReveal() {
    gsap.to(txt, { opacity: 0, scale: 1.05, duration: 0.4, ease: 'power2.inOut' });
    const blob = loader.querySelector('.loader-blob');
    blob.style.clipPath = 'circle(200vmax at 0% 100%)';
    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        document.body.style.overflow = '';
        if (typeof lenis !== 'undefined') lenis.start();
        if (onComplete) onComplete();
      }
    });
    tl.fromTo(blob,
      { clipPath: 'circle(200vmax at 0% 100%)' },
      { clipPath: 'circle(0% at 0% 100%)', duration: 1.1, ease: 'cubic-bezier(0.85, 0, 0.15, 1)' }
    );
  }

  // Safety backup
  setTimeout(() => {
    if (!loader.parentNode) return;
    loader.remove();
    document.body.style.overflow = '';
    if (typeof lenis !== 'undefined') lenis.start();
    if (onComplete) onComplete();
  }, 9000);
}

/* ═══════════════════════════════════════════════
   4. GLOBAL INIT
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initGlobalEvents();
  initNavScramble();
  initCustomCursor();
  setActiveNavLink();
  document.querySelectorAll('.copyright-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const header = document.querySelector('header');
  let lastY = 0;
  if (_isTouchDevice || _prefersReducedMotion) {
    let _rafPending = false;
    window.addEventListener('scroll', () => {
      if (_rafPending) return;
      _rafPending = true;
      requestAnimationFrame(() => {
        if (!header) { _rafPending = false; return; }
        const currentY = window.scrollY;
        const scrollingDown = currentY > lastY && currentY > 80;
        header.style.transform = scrollingDown ? 'translate3d(0,-100%,0)' : 'translate3d(0,0,0)';
        lastY = currentY;
        _rafPending = false;
      });
    }, { passive: true });
  } else {
    lenis.on('scroll', ({ scroll }) => {
      if (!header) return;
      const scrollingDown = scroll > lastY && scroll > 80;
      header.style.transform = scrollingDown ? 'translate3d(0,-100%,0)' : 'translate3d(0,0,0)';
      lastY = scroll;
    });
  }

  const nsElement = document.querySelector('[data-barba-namespace]');
  const namespace = nsElement ? nsElement.dataset.barbaNamespace : 'other';
  const hasPlayedLoader = sessionStorage.getItem('dijo_loader_played');

  // Skip the cinematic loader entirely for reduced-motion users, or if it
  // already played this session.
  if (!hasPlayedLoader && !_prefersReducedMotion) {
    sessionStorage.setItem('dijo_loader_played', 'true');
    initLoader(() => {
      initPageSpecifics(namespace);
      initLogoScramble();
    });
  } else {
    sessionStorage.setItem('dijo_loader_played', 'true');
    initPageSpecifics(namespace);
    initLogoScramble();
  }

  initBarba();
});

function initGlobalEvents() {
  const hamburger = document.getElementById('hamburger');
  if (!hamburger) return;
  // Query .nav-links FRESH on each toggle — initNavScramble clones/replaces
  // .nav-links (to reset hover-scramble listeners), so a closure-captured
  // reference would point at a detached node and the mobile menu would fail
  // to open after a desktop→mobile resize.
  const toggleMenu = (open) => {
    const nav = document.querySelector('.nav-links');
    hamburger.classList.toggle('open', open);
    if (nav) nav.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  hamburger.addEventListener('click', () => toggleMenu(!hamburger.classList.contains('open')));
  // Event delegation: any nav link click closes the mobile menu (survives
  // the nav-links clone performed by initNavScramble).
  document.addEventListener('click', (e) => {
    if (e.target.closest('.nav-links a')) toggleMenu(false);
  });
  document.querySelectorAll('.logo-container').forEach(logo => {
    logo.addEventListener('click', () => {
      sessionStorage.removeItem('dijo_loader_played');
    });
  });
}

function setActiveNavLink() {
  const linksWrap = document.querySelector('.nav-links');
  if (!linksWrap) return;
  const currentPath = window.location.pathname;
  linksWrap.querySelectorAll('a').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath || (currentPath === '/' && linkPath.includes('index.html')) || currentPath.endsWith(linkPath)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ── Logo scramble micro‑animation ── */
let _logoScrambled = false;

function initLogoScramble() {
  if (_logoScrambled) return;
  const logoText = document.querySelector('.logo-text');
  if (!logoText) return;
  _logoScrambled = true;

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const original = logoText.textContent.trim();
  const letters = original.split('');

  logoText.innerHTML = letters.map((ch) => {
    if (ch === '.') return '<span class="letter" data-char="." style="color:var(--highlight)">.</span>';
    return `<span class="letter" data-char="${ch}">${ch}</span>`;
  }).join('');

  if (_prefersReducedMotion) return; // wrapping done (keeps the gold dot); skip the scramble

  const spans = logoText.querySelectorAll('span.letter');
  spans.forEach((span, i) => {
    const targetChar = span.dataset.char;
    if (targetChar === '.') return;
    let frame = 0;
    const spins = 3 + i;
    setTimeout(() => {
      const iv = setInterval(() => {
        if (frame < spins) {
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          span.style.color = 'var(--highlight)';
        } else {
          clearInterval(iv);
          span.textContent = targetChar;
          span.style.color = '';
        }
        frame++;
      }, 45);
    }, i * 40);
  });
}

/* ═══════════════════════════════════════════════
   5. BARBA TRANSITIONS — gold blob clip-path wipe
═══════════════════════════════════════════════ */
function initBarba() {
  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  overlay.innerHTML = `<div class="pt-blob"></div>`;
  document.body.appendChild(overlay);
  const blob = overlay.querySelector('.pt-blob');
  blob.style.clipPath = 'circle(0% at 0% 100%)';

  barba.init({
    prevent: ({ el }) => el.closest('.logo-container') !== null,
    sync: true,
    transitions: [{
      name: 'blob-wipe',

      async leave(data) {
        // Reduced motion: simple opacity crossfade, no blob clip animation.
        if (_prefersReducedMotion) {
          await gsap.to(data.current.container, { opacity: 0, duration: 0.2, ease: 'power2.out' });
          return;
        }
        overlay.style.pointerEvents = 'all';
        await gsap.fromTo(blob,
          { clipPath: 'circle(0% at 0% 100%)' },
          { clipPath: 'circle(200vmax at 0% 100%)', duration: _isTouchDevice ? 0.55 : 0.7, ease: 'cubic-bezier(0.85, 0, 0.15, 1)' }
        );
        gsap.set(data.current.container, { opacity: 0 });
      },

      async enter(data) {
        gsap.set(data.next.container, { opacity: 0 });
        lenis.scrollTo(0, { immediate: true });

        if (_prefersReducedMotion) {
          await gsap.to(data.next.container, { opacity: 1, duration: 0.3, ease: 'power2.out' });
          overlay.style.pointerEvents = 'none';
          initPageSpecifics(data.next.namespace);
          return;
        }

        const holdTime = _isTouchDevice ? 0.2 : 0.3;
        await gsap.delayedCall(holdTime, () => {});
        gsap.set(data.next.container, { opacity: 1 });
        await gsap.fromTo(blob,
          { clipPath: 'circle(200vmax at 0% 100%)' },
          { clipPath: 'circle(0% at 0% 100%)', duration: _isTouchDevice ? 0.55 : 0.7, ease: 'cubic-bezier(0.85, 0, 0.15, 1)' }
        );
        overlay.style.pointerEvents = 'none';
        initPageSpecifics(data.next.namespace);
      }
    }]
  });

  barba.hooks.after((data) => {
    const nextUrl = data.next.url.path;
    const linksWrap = document.querySelector('.nav-links');
    if (linksWrap) {
      linksWrap.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        const linkPath = new URL(link.href).pathname;
        if (linkPath === nextUrl || (nextUrl === '/' && linkPath.includes('index.html'))) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }
    initNavScramble();
    const oldDot = document.querySelector('.cursor-dot');
    if (oldDot) oldDot.remove();
    initCustomCursor();
    ScrollTrigger.refresh();
  });
}


/* ═══════════════════════════════════════════════
   6. PAGE-SPECIFIC INIT
═══════════════════════════════════════════════ */
function initPageSpecifics(namespace) {
  ScrollTrigger.getAll().forEach(t => t.kill());
  document.querySelectorAll('.line, .word, .char').forEach(el => {
    if (el.parentNode) el.outerHTML = el.textContent;
  });
  initAnimations();
  setTimeout(() => { ScrollTrigger.refresh(); }, 100);

  if (namespace === 'home') {
    initHeadlineSpotlight();
    initScrollIndicator();
    initStaticGallery();
    initPortfolioEffects();
  }
  if (namespace === 'contact') {
    initContactForm();
  }
}

/* ═══════════════════════════════════════════════
   7a. SCROLL INDICATOR
═══════════════════════════════════════════════ */
function initScrollIndicator() {
  const indicator = document.querySelector('.scroll-indicator');
  if (!indicator) return;

  indicator.addEventListener('click', () => {
    const gallery = document.querySelector('.gallery-section') || document.getElementById('gallery');
    if (!gallery) return;
    if (_isTouchDevice || _prefersReducedMotion) {
      gallery.scrollIntoView({ behavior: _prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    } else if (typeof lenis !== 'undefined' && lenis.scrollTo) {
      lenis.scrollTo(gallery, { offset: -60, duration: 1.4 });
    } else {
      gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  let _indicatorRaf = false;
  const updateIndicatorVisibility = () => {
    if (_indicatorRaf) return;
    _indicatorRaf = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const shouldHide = scrollY > 4;
      indicator.style.opacity = shouldHide ? '0' : '';
      indicator.style.pointerEvents = shouldHide ? 'none' : '';
      document.body.classList.toggle('scrolled-from-top', shouldHide);
      _indicatorRaf = false;
    });
  };

  if (_isTouchDevice || _prefersReducedMotion) {
    window.addEventListener('scroll', updateIndicatorVisibility, { passive: true });
  } else if (typeof lenis !== 'undefined' && lenis.on) {
    lenis.on('scroll', updateIndicatorVisibility);
  }
  updateIndicatorVisibility();
}

/* ═══════════════════════════════════════════════
   7. SPOTLIGHT HEADLINE
═══════════════════════════════════════════════ */
function initHeadlineSpotlight() {
  if (_prefersReducedMotion) return; // hover spotlight is motion; skip
  const container = document.querySelector('.spotlight-headline');
  if (!container) return;
  const highlight = container.querySelector('.highlight-layer');
  if (!highlight) return;

  const updateClipPath = (e) => {
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const radius = 80;
    highlight.style.clipPath = `circle(${radius}px at ${mouseX}px ${mouseY}px)`;
  };

  const showHighlight = () => {
    highlight.classList.add('active');
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    highlight.style.clipPath = `circle(80px at ${centerX}px ${centerY}px)`;
    container.addEventListener('mousemove', updateClipPath);
  };

  const hideHighlight = () => {
    highlight.classList.remove('active');
    highlight.style.clipPath = `circle(0% at 0% 0%)`;
    container.removeEventListener('mousemove', updateClipPath);
  };

  container.addEventListener('mouseenter', showHighlight);
  container.addEventListener('mouseleave', hideHighlight);
}

/* ═══════════════════════════════════════════════
   8. ANIMATIONS
═══════════════════════════════════════════════ */
function initAnimations() {
  // Reduced motion: don't run scroll-driven reveals/transitions. Content is
  // shown by default (CSS overrides .reveal-up opacity). Just finalise counters.
  if (_prefersReducedMotion) {
    animateCounters();
    return;
  }

  if (_isTouchDevice) {
    document.querySelectorAll('h1, h2').forEach(heading => {
      if (heading.closest('#site-loader')) return;
      gsap.fromTo(heading,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 90%', once: true } }
      );
    });
    const textElements = document.querySelectorAll('section p:not(.stat-box p):not(.upload-zone p)');
    textElements.forEach(textEl => {
      gsap.fromTo(textEl,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: textEl, start: 'top 90%' } }
      );
    });
  } else {
    document.querySelectorAll('h1, h2').forEach(heading => {
      if (heading.closest('#site-loader')) return;
      gsap.set(heading, { opacity: 1 });
      const split = new SplitType(heading, { types: 'lines, words, chars' });
      split.lines.forEach(line => gsap.set(line, { overflow: 'hidden' }));
      ScrollTrigger.create({
        trigger: heading,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.from(split.words, { yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.04 });
          gsap.to(split.chars, { color: '#D4AF37', duration: 0.35, stagger: { each: 0.03, yoyo: true, repeat: 1 }, delay: 0.2 });
        }
      });
    });

    const textElements = document.querySelectorAll('section p:not(.stat-box p):not(.upload-zone p)');
    textElements.forEach(textEl => {
      gsap.set(textEl, { opacity: 1 });
      const split = new SplitType(textEl, { types: 'lines, words' });
      split.lines.forEach(line => gsap.set(line, { overflow: 'hidden' }));
      gsap.from(split.words, { yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.025,
        scrollTrigger: { trigger: textEl, start: 'top 90%' } });
    });
  }

  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (['p', 'h1', 'h2'].includes(el.tagName.toLowerCase())) return;
    const yDist = _isTouchDevice ? 30 : 48;
    gsap.fromTo(el, { opacity: 0, y: yDist }, {
      opacity: 1, y: 0, duration: _isTouchDevice ? 0.7 : 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });

  const statBoxes = gsap.utils.toArray('.stat-box');
  if (statBoxes.length) {
    gsap.fromTo(statBoxes,
      { opacity: 0, y: 40, scale: _isTouchDevice ? 1 : 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: _isTouchDevice ? 0.5 : 0.8, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: '.stats', start: 'top 82%' } }
    );
  }
  const brandTags = gsap.utils.toArray('.brand-tag');
  if (brandTags.length) {
    gsap.fromTo(brandTags,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07,
        scrollTrigger: { trigger: '.brands', start: 'top 88%' } }
    );
  }

  if (!_isTouchDevice) {
    gsap.utils.toArray('section img:not(.logo-img)').forEach(img => {
      if (img.closest('.gallery-card')) return;
      gsap.to(img, { yPercent: -12, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
    });
  }

  animateCounters();
  const footer = document.querySelector('footer');
  if (footer) {
    gsap.fromTo(footer, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out',
      scrollTrigger: { trigger: footer, start: 'top 95%' } });
  }
}

/* ═══════════════════════════════════════════════
   9. PORTFOLIO EFFECTS
═══════════════════════════════════════════════ */
function initPortfolioEffects() {
  destroyInnerParallax();
  destroyMouseFollow();
  // Touch + reduced-motion: skip parallax & mouse-follow.
  if (_isTouchDevice || _prefersReducedMotion) return;
  const cards = document.querySelectorAll('.gallery-card');
  cards.forEach((card, idx) => {
    applyInnerParallaxToCard(card, idx);
    applyMouseFollowToCard(card);
  });
}

function updateCardImg(card) {
  const img = card.querySelector('img');
  if (!img) return;
  const shiftX   = card._mouseShiftX  || 0;
  const shiftY   = card._mouseShiftY  || 0;
  const parallaxY = card._parallaxY   || 0;
  const scale    = card._scaleObj ? card._scaleObj.value : 1.1;
  img.style.transform = `translate3d(${shiftX}px, ${shiftY + parallaxY}px, 0) scale(${scale.toFixed(4)})`;
}

function destroyInnerParallax() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    if (card._fpTrigger) { card._fpTrigger.kill(); delete card._fpTrigger; }
    card._parallaxY = 0;
    const img = card.querySelector('img');
    if (img) img.style.transform = '';
  });
}

function applyInnerParallaxToCard(card, index) {
  if (card._fpTrigger) return;
  if (card.classList.contains('img-failed')) return;
  const img = card.querySelector('img');
  if (!img) return;
  card._parallaxY = 0;
  const patterns = [20, -14, 24, -16, 12, -20, 16];
  const rangeY = patterns[index % patterns.length];
  const trigger = ScrollTrigger.create({
    trigger: card,
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.8,
    onUpdate: (self) => { card._parallaxY = self.progress * rangeY; updateCardImg(card); }
  });
  card._fpTrigger = trigger;
}

function destroyMouseFollow() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    if (card._mouseMoveHandler) {
      card.removeEventListener('mousemove', card._mouseMoveHandler);
      card.removeEventListener('mouseleave', card._mouseLeaveHandler);
      card.removeEventListener('mouseenter', card._mouseEnterHandler);
      delete card._mouseMoveHandler; delete card._mouseLeaveHandler; delete card._mouseEnterHandler;
    }
    card._mouseShiftX = 0; card._mouseShiftY = 0;
    if (card._scaleTween) { card._scaleTween.kill(); delete card._scaleTween; }
    if (card._scaleObj) card._scaleObj.value = 1.1;
  });
}

function applyMouseFollowToCard(card) {
  if (card._mouseMoveHandler) return;
  if (card.classList.contains('img-failed')) return;
  const img = card.querySelector('img');
  if (!img) return;
  card._mouseShiftX = 0; card._mouseShiftY = 0;
  if (!card._scaleObj) card._scaleObj = { value: 1.1 };

  const onMouseEnter = () => {
    if (card._scaleTween) card._scaleTween.kill();
    card._scaleTween = gsap.to(card._scaleObj, { value: 1.22, duration: 0.35, ease: 'power2.out', onUpdate: () => updateCardImg(card) });
  };
  const onMouseMove = (e) => {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let shiftX = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    let shiftY = ((e.clientY - centerY) / (rect.height / 2)) * 6;
    shiftX = Math.min(Math.max(shiftX, -8), 8);
    shiftY = Math.min(Math.max(shiftY, -6), 6);
    card._mouseShiftX = shiftX; card._mouseShiftY = shiftY;
    updateCardImg(card);
  };
  const onMouseLeave = () => {
    card._mouseShiftX = 0; card._mouseShiftY = 0;
    if (card._scaleTween) card._scaleTween.kill();
    card._scaleTween = gsap.to(card._scaleObj, { value: 1.1, duration: 0.4, ease: 'power2.out', onUpdate: () => updateCardImg(card) });
  };

  card.addEventListener('mouseenter', onMouseEnter);
  card.addEventListener('mousemove', onMouseMove);
  card.addEventListener('mouseleave', onMouseLeave);
  card._mouseMoveHandler = onMouseMove;
  card._mouseLeaveHandler = onMouseLeave;
  card._mouseEnterHandler = onMouseEnter;
}

/* ═══════════════════════════════════════════════
   10. SNAKE REVEAL + LIGHTBOX ORDER
═══════════════════════════════════════════════ */
let snakeOrderedCards = [];
let snakeOrderedSrcs = [];

function computeSnakeOrder(cards) {
  if (!cards.length) return [];
  const container = document.querySelector('.gallery-wrap') || document.body;
  const rects = cards.map(card => {
    const rect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return { card, top: rect.top - containerRect.top, left: rect.left - containerRect.left, bottom: rect.bottom - containerRect.top };
  });
  const rows = [];
  rects.forEach(r => {
    let added = false;
    for (let row of rows) {
      if (Math.abs(row.y - r.top) < 30) { row.cards.push(r); added = true; break; }
    }
    if (!added) rows.push({ y: r.top, cards: [r] });
  });
  rows.sort((a, b) => a.y - b.y);
  const ordered = [];
  rows.forEach((row, idx) => {
    row.cards.sort((a, b) => a.left - b.left);
    if (idx % 2 === 1) row.cards.reverse();
    ordered.push(...row.cards.map(r => r.card));
  });
  return ordered;
}

function snakeReveal(cards) {
  if (!cards.length) return;
  const ordered = computeSnakeOrder(cards);

  if (_prefersReducedMotion) {
    ordered.forEach(card => {
      card.style.opacity = '1';
      card.style.transform = '';
      card.style.willChange = '';
    });
    snakeOrderedCards = ordered.filter(c => !c.classList.contains('img-failed'));
    snakeOrderedSrcs = snakeOrderedCards.map(c => c.dataset.src);
    return;
  }

  if (_isTouchDevice) {
    const valid = ordered.filter(c => !c.classList.contains('img-failed'));
    gsap.set(cards, { opacity: 0, scale: 0.7 });
    gsap.to(ordered, {
      opacity: 1, scale: 1, duration: 0.55, stagger: 0.025, ease: "power2.out",
      clearProps: "transform,opacity",
      onComplete: () => { ordered.forEach(c => { c.style.willChange = ''; }); }
    });
    snakeOrderedCards = valid;
    snakeOrderedSrcs = valid.map(c => c.dataset.src);
    return;
  }

  ordered.forEach(card => {
    card.style.transform = 'translate3d(0,0,0) scale(0.55)';
    card.style.opacity = '0';
  });

  const galleryEl = document.getElementById('gallery');
  const STAGGER_RANGE = 0.35;

  ScrollTrigger.create({
    trigger: galleryEl,
    start: 'top 85%',
    end: 'top 30%',
    scrub: 0.6,
    once: true,
    onUpdate: (self) => {
      const p = self.progress;
      ordered.forEach((card, i) => {
        const delay = (i / ordered.length) * STAGGER_RANGE;
        const lp = Math.max(0, Math.min(1, (p - delay) / (1 - STAGGER_RANGE)));
        const eased = lp < 0.5 ? 2 * lp * lp : 1 - Math.pow(-2 * lp + 2, 2) / 2;
        const scale = 0.55 + eased * 0.45;
        card.style.transform = `translate3d(0,0,0) scale(${scale.toFixed(4)})`;
        card.style.opacity = eased.toFixed(4);
      });
    },
    onLeave: () => {
      ordered.forEach(card => { card.style.transform = ''; card.style.opacity = ''; card.style.willChange = ''; });
    }
  });

  snakeOrderedCards = ordered.filter(c => !c.classList.contains('img-failed'));
  snakeOrderedSrcs = snakeOrderedCards.map(c => c.dataset.src);
}

/* ═══════════════════════════════════════════════
   11. GALLERY BUILDING
═══════════════════════════════════════════════ */
const GALLERY_IMAGES = [
  /* ── Featured (first 4 — top row of the grid) ── */
  'images/Dijo-Studios-Food-Mojs-Cafe-Gemere.webp',
  'images/Dijo-Studios-Food-Savanna-Zero.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Heritage-Day.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Youth-Day-Cocktails.webp',
  /* ── Remaining gallery images ── */
  'images/Dijo-Studios-Food-Vatkoek-and-Mince.webp',
  'images/Dijo-Studios-Food-whiskey-glass-smoke.webp',
  'images/Dijo-Studios-Food-tasty-gallos-lady-eating-chicken.webp',
  'images/Dijo-Studios-Food-Tasty-Gallos-Guy-Eating-Chicken.webp',
  'images/Dijo-Studios-Food-Steak-and-fries.webp',
  'images/Dijo-Studios-Food-Sol-Beer-by-the-beach.webp',
  'images/Dijo-Studios-Food-Smoothies.webp',
  'images/Dijo-Studios-Food-Polony-and-Cheese-Sandwich.webp',
  'images/Dijo-Studios-Food-Piatto Breakfast.webp',
  'images/Dijo-Studios-Food-Patch-Cocktails-Paloma.webp',
  'images/Dijo-Studios-Food-patch canned cocktails-beach.webp',
  'images/Dijo-Studios-Food-Oros-Hotdog-Lunchbox.webp',
  'images/Dijo-Studios-Food-Newscafe-Cocktails.webp',
  'images/Dijo-Studios-Food-Moja Cafe-Girls-Night-Out.webp',
  'images/Dijo-Studios-Food-Moja Cafe-Braai Platter.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Mastermind2.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Mastermind.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Human-Rights-Day-Lunch-and-Friends.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Heritage-Day-Pig-Trotters.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Heritage-Day-homemade-meal2.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Heritage-Day-homemade-meal.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Heritage-Day-and-Friends.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Dice-and-Cocktails.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Braai-Platter.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Braai-Platter-For-Two.webp',
  'images/Dijo-Studios-Food-Moja-Cafe-Boerie-Roll-and-Chips.webp',
  'images/Dijo-Studios-Food-Kota-Mash-and-Mince.webp',
  'images/Dijo-Studios-Food-Kimchi-Noodles.webp',
  'images/Dijo-Studios-Food-Haus-Cocktails.webp',
  'images/Dijo-Studios-Food-Haus-Cocktails-park.webp',
  'images/Dijo-Studios-Food-Goldi-Vatkoek-and-Polony.webp',
  'images/Dijo-Studios-Food-Goldi-Crumbed-Jumbo-Chicken-Pops.webp',
  'images/Dijo-Studios-Food-Glenfiddich-15.webp',
  'images/Dijo-Studios-Food-garden lunch .webp',
  'images/Dijo-Studios-Food-Fumo-Cocktail.webp',
  'images/Dijo-Studios-Food-Flying-Fish-Seltzer.webp',
  'images/Dijo-Studios-Food-fish-cilantros.webp',
  'images/Dijo-Studios-Food-Dorritos.webp',
  'images/Dijo-Studios-Food-Custard-and-Jelly.webp',
  'images/Dijo-Studios-Food-Crumbed-Jumbo-Chicken-Pops.webp',
  'images/Dijo-Studios-Food-Coca-Cola-Meal.webp',
  'images/Dijo-Studios-Food-Coca-Cola-Cup.webp',
  'images/Dijo-Studios-Food-Cilantros-Wine.webp',
  'images/Dijo-Studios-Food-Cheese-Curls.webp',
  'images/Dijo-Studios-Food-Brooklyn-Brothers-Milkshake-and-Waffles.webp',
  'images/Dijo-Studios-Food-Brooklyn-Brothers-Burger.webp',
  'images/Dijo-Studios-Food-Braai-Lovers-Mocktail.webp',
  'images/Dijo-Studios-Food-Amstel-Radler-on-a-pool-deck.webp',
  'images/Dijo-Studios-Food-Amstel-Radler-01.webp',
  'images/Dijo-Studios-Food-After Party_Woolworths Rainbow Cake.webp',
  'images/Dijo-Studios-Food-949-lamb-chops-cilantros.webp',
];

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Generate SEO-friendly alt text from the image filename. */
function altTextFromSrc(src) {
  const filename = src.split('/').pop();
  const name = filename.replace(/\.\w+$/, '');
  const desc = name
    .replace(/^Dijo-Studios-Food[-_ ]?/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!desc) return 'Food photography by Dijo Studios, Johannesburg';
  return `${desc.charAt(0).toUpperCase() + desc.slice(1)} — Food Photography by Dijo Studios, Johannesburg`;
}

function makeCard(src, globalIndex) {
  const card = document.createElement('div');
  card.className = 'gallery-card is-loading';
  card.dataset.src = src;
  // Keyboard accessibility: each card behaves like a button that opens the
  // lightbox dialog. (Previously a plain <div> with a click handler — unreachable
  // by keyboard / screen readers.)
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-haspopup', 'dialog');
  const alt = altTextFromSrc(src);
  card.setAttribute('aria-label', `View image: ${alt}`);
  card.innerHTML = `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"/>
    <div class="card-overlay">
      <div class="card-icon">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </div>
      <span class="card-label">View</span>
    </div>`;

  const img = card.querySelector('img');
  const markLoaded = () => {
    card.classList.remove('is-loading');
    card.classList.add('is-loaded');
    layoutMasonry();
  };
  if (img.complete && img.naturalWidth > 0) {
    markLoaded();
  } else {
    img.addEventListener('load', markLoaded, { once: true });
  }
  // Graceful fallback: a broken/missing image shows a tasteful placeholder
  // instead of a broken-image icon, and the card is removed from the
  // keyboard/tab order and from the lightbox rotation.
  img.addEventListener('error', () => {
    card.classList.remove('is-loading');
    card.classList.add('img-failed', 'is-loaded');
    card.removeAttribute('role');
    card.setAttribute('tabindex', '-1');
    card.setAttribute('aria-hidden', 'true');
    img.setAttribute('alt', '');
    img.setAttribute('aria-hidden', 'true');
    const label = document.createElement('div');
    label.className = 'img-failed-label';
    label.textContent = 'Dijo Studios';
    card.appendChild(label);
    // Drop from lightbox rotation if already built
    const idx = snakeOrderedCards.indexOf(card);
    if (idx !== -1) {
      snakeOrderedCards.splice(idx, 1);
      snakeOrderedSrcs.splice(idx, 1);
    }
    layoutMasonry();
  }, { once: true });

  const openFromCard = () => {
    if (card.classList.contains('img-failed')) return;
    const idx = snakeOrderedCards.indexOf(card);
    openLightbox(idx !== -1 ? idx : 0);
  };
  card.addEventListener('click', openFromCard);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFromCard(); }
  });

  card.addEventListener('mouseenter', () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = src;
    link.as = 'image';
    link.dataset.preload = '1';
    document.head.appendChild(link);
    setTimeout(() => { if (link.parentNode) link.remove(); }, 10000);
  }, { once: true });
  return card;
}

let _lbIndex = 0;
let _lbLastFocus = null;
let _lbFocusTrapHandler = null;
const _isMobile = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

function _isOpenable(card) { return card && !card.classList.contains('img-failed'); }

function openLightbox(index) {
  if (!snakeOrderedCards.length) return;
  const n = snakeOrderedCards.length;
  let idx = ((index % n) + n) % n;
  // Skip failed cards
  for (let i = 0; i < n; i++) {
    if (_isOpenable(snakeOrderedCards[idx])) break;
    idx = (idx + 1) % n;
  }
  if (!_isOpenable(snakeOrderedCards[idx])) return;
  _lbIndex = idx;

  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!lb || !img) return;

  _setLbImage(idx);

  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  if (counter) counter.textContent = `${_lbIndex + 1} / ${snakeOrderedSrcs.length}`;

  if (_isMobile()) {
    lb.style.overflowY = 'auto';
  } else {
    document.body.style.overflow = 'hidden';
  }

  // Focus management + trap
  _lbLastFocus = document.activeElement;
  requestAnimationFrame(() => {
    const closeBtn = lb.querySelector('.lb-close');
    if (closeBtn) closeBtn.focus();
  });
  _installFocusTrap(lb);
}

function _setLbImage(idx) {
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!img) return;
  // Guard against broken images in the lightbox itself
  img.onerror = null;
  img.src = snakeOrderedSrcs[idx];
  if (counter) counter.textContent = `${idx + 1} / ${snakeOrderedSrcs.length}`;
  // If the lightbox image itself fails, skip to the next openable card.
  let attempts = 0;
  img.onerror = () => {
    if (attempts++ > snakeOrderedCards.length) return;
    shiftSlide(1);
  };
}

function _installFocusTrap(lb) {
  if (_lbFocusTrapHandler) lb.removeEventListener('keydown', _lbFocusTrapHandler);
  _lbFocusTrapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const focusable = lb.querySelectorAll('.lb-close, .lb-prev, .lb-next');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  lb.addEventListener('keydown', _lbFocusTrapHandler);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lb.style.overflowY = '';
    if (_lbFocusTrapHandler) { lb.removeEventListener('keydown', _lbFocusTrapHandler); _lbFocusTrapHandler = null; }
  }
  document.body.style.overflow = '';
  // Return focus to the originating card
  if (_lbLastFocus && typeof _lbLastFocus.focus === 'function') {
    _lbLastFocus.focus();
    _lbLastFocus = null;
  }
}

function shiftSlide(dir) {
  if (!snakeOrderedSrcs.length) return;
  const n = snakeOrderedSrcs.length;
  let next = (_lbIndex + dir + n) % n;
  // Skip failed cards
  for (let i = 0; i < n; i++) {
    if (_isOpenable(snakeOrderedCards[next])) break;
    next = (next + dir + n) % n;
  }
  _lbIndex = next;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  if (!img) return;
  img.classList.add('switching');
  setTimeout(() => {
    _setLbImage(_lbIndex);
    img.classList.remove('switching');
    if (lb && _isMobile()) lb.scrollTop = 0;
  }, 200);
}

document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') shiftSlide(-1);
  if (e.key === 'ArrowRight') shiftSlide(1);
});

(function initLightboxSwipe() {
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) shiftSlide(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

/* ── Lightbox pinch‑to‑zoom (mobile + trackpad) ── */
(function initLightboxPinchZoom() {
  let scale = 1, panX = 0, panY = 0;
  let lastDist = 0, lastCenterX = 0, lastCenterY = 0;
  let lastTouchX = 0, lastTouchY = 0;
  let isPinching = false, isPanning = false;

  function getDistance(t1, t2) { const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY; return Math.sqrt(dx * dx + dy * dy); }
  function getCenter(t1, t2) { return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }; }
  function applyTransform(img) { img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`; }

  function clampPan(img) {
    if (scale <= 1) { panX = 0; panY = 0; return; }
    const rect = img.getBoundingClientRect();
    const w = rect.width / scale, h = rect.height / scale;
    const overflowX = (w * (scale - 1)) / 2;
    const overflowY = (h * (scale - 1)) / 2;
    panX = Math.max(-overflowX, Math.min(overflowX, panX));
    panY = Math.max(-overflowY, Math.min(overflowY, panY));
  }
  function resetZoom() {
    const img = document.getElementById('lb-img');
    if (!img) return;
    scale = 1; panX = 0; panY = 0; isPinching = false; isPanning = false;
    img.classList.remove('zoomed'); img.style.transform = ''; img.style.maxWidth = ''; img.style.maxHeight = '';
  }

  document.addEventListener('touchstart', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    if (e.touches.length === 2) {
      const onImg = [...e.touches].some(t => document.elementFromPoint(t.clientX, t.clientY)?.closest('#lb-img, .lb-img-wrap'));
      if (!onImg) return;
      isPinching = true; isPanning = false;
      lastDist = getDistance(e.touches[0], e.touches[1]);
      const c = getCenter(e.touches[0], e.touches[1]); lastCenterX = c.x; lastCenterY = c.y;
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0];
      const onImg = document.elementFromPoint(t.clientX, t.clientY)?.closest('#lb-img, .lb-img-wrap');
      if (!onImg) return;
      isPanning = true; lastTouchX = t.clientX; lastTouchY = t.clientY;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isPinching && !isPanning) return;
    const img = document.getElementById('lb-img');
    if (!img) return;
    if (isPinching && e.touches.length >= 2) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);
      const deltaScale = dist / (lastDist || dist);
      scale = Math.min(Math.max(scale * deltaScale, 1), 5);
      if (scale > 1) { panX += center.x - lastCenterX; panY += center.y - lastCenterY; img.classList.add('zoomed'); }
      else { panX = 0; panY = 0; img.classList.remove('zoomed'); }
      clampPan(img); applyTransform(img);
      lastDist = dist; lastCenterX = center.x; lastCenterY = center.y;
    } else if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      panX += t.clientX - lastTouchX; panY += t.clientY - lastTouchY;
      clampPan(img); applyTransform(img);
      lastTouchX = t.clientX; lastTouchY = t.clientY;
    }
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) { isPinching = false; isPanning = false; if (scale <= 1) resetZoom(); }
    else if (e.touches.length === 1 && isPinching) {
      isPinching = false;
      if (scale > 1) { isPanning = true; lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY; }
    }
  }, { passive: true });

  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    const img = document.getElementById('lb-img');
    if (!img) return;
    if (isPinching || isPanning) { lastTap = 0; return; }
    const now = Date.now();
    if (now - lastTap < 300 && e.changedTouches.length === 1) {
      if (scale > 1) { resetZoom(); }
      else {
        scale = 2.5;
        const rect = img.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX - rect.left;
        const tapY = e.changedTouches[0].clientY - rect.top;
        panX = (rect.width / 2 - tapX) * scale; panY = (rect.height / 2 - tapY) * scale;
        img.classList.add('zoomed'); clampPan(img); applyTransform(img);
      }
    }
    lastTap = now;
  }, { passive: true });

  document.addEventListener('wheel', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    if (!e.ctrlKey) return;
    e.preventDefault();
    const img = document.getElementById('lb-img');
    if (!img) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.min(Math.max(scale * delta, 1), 5);
    if (scale > 1) img.classList.add('zoomed'); else { img.classList.remove('zoomed'); panX = 0; panY = 0; }
    applyTransform(img);
  }, { passive: false });

  // Reset zoom when lightbox closes or image changes
  const origClose = window.closeLightbox;
  window.closeLightbox = function() { resetZoom(); origClose(); };
  const origShift = window.shiftSlide;
  window.shiftSlide = function(dir) { resetZoom(); origShift(dir); };
})();

function initStaticGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  if (gallery.children.length > 0) return;

  const priority = GALLERY_IMAGES.slice(0, 4);
  const rest = shuffleArray(GALLERY_IMAGES.slice(4));

  priority.forEach((src, i) => {
    const card = makeCard(src, i);
    card.classList.add('featured-card');
    const img = card.querySelector('img');
    if (img) img.removeAttribute('loading');
    gallery.appendChild(card);
  });
  rest.forEach((src, i) => {
    const card = makeCard(src, i + 4);
    gallery.appendChild(card);
  });

  layoutMasonry();
  gallery.querySelectorAll('.gallery-card img, .featured-card img').forEach(img => {
    if (img.complete) layoutMasonry();
    else img.addEventListener('load', layoutMasonry, { once: true });
  });

  setTimeout(() => {
    layoutMasonry();
    const allCards = [...document.querySelectorAll('.gallery-card, .featured-card')];
    if (_prefersReducedMotion) {
      // Show everything immediately
      allCards.forEach(c => { c.style.transform = ''; c.style.opacity = ''; c.style.willChange = ''; });
      snakeReveal(allCards);
      return;
    }
    const initScale = _isTouchDevice ? 0.7 : 0.55;
    allCards.forEach(c => {
      c.style.transform = `translate3d(0,0,0) scale(${initScale})`;
      c.style.opacity = '0';
      c.style.willChange = 'transform, opacity';
    });
    ScrollTrigger.create({
      trigger: gallery,
      start: 'top 85%',
      once: true,
      onEnter: () => { layoutMasonry(); snakeReveal(allCards); }
    });
  }, 100);
}

/* ── CSS Grid masonry: calculate grid-row-end span for each card ── */
const MASONRY_ROW_HEIGHT = 1;
const MASONRY_GAP = 5;
const FALLBACK_ASPECT = 1.25; // 4:5 portrait for failed images

let _masonryRaf = false;
function layoutMasonry() {
  // RAF-batched so the many image 'load' events don't thrash layout.
  if (_masonryRaf) return;
  _masonryRaf = true;
  requestAnimationFrame(() => {
    _masonryRaf = false;
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    const computed = getComputedStyle(gallery);
    const cols = computed.gridTemplateColumns.split(' ').length;
    const colWidth = gallery.getBoundingClientRect().width / cols;
    const gap = parseFloat(computed.rowGap) || MASONRY_GAP;
    gallery.querySelectorAll('.gallery-card, .featured-card').forEach(card => {
      if (card.classList.contains('img-failed')) {
        const span = Math.ceil((colWidth * FALLBACK_ASPECT + gap) / (MASONRY_ROW_HEIGHT + gap));
        card.style.gridRowEnd = `span ${span}`;
        return;
      }
      const img = card.querySelector('img');
      if (!img) return;
      if (img.complete && img.naturalHeight > 0) {
        const renderedH = (img.naturalHeight / img.naturalWidth) * colWidth;
        const span = Math.ceil((renderedH + gap) / (MASONRY_ROW_HEIGHT + gap));
        card.style.gridRowEnd = `span ${span}`;
      }
    });
  });
}

let _masonryResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_masonryResizeTimer);
  _masonryResizeTimer = setTimeout(layoutMasonry, 200);
});

/* ═══════════════════════════════════════════════
   12. CONTACT FORM — async submit + feedback + honeypot
═══════════════════════════════════════════════ */
function initContactForm() {
  const form = document.querySelector('form[action*="formspree"]');
  if (!form || form.dataset.enhanced === '1') return;
  form.dataset.enhanced = '1';

  const status = document.getElementById('form-status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn ? submitBtn.textContent : '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Honeypot: if the hidden field was filled, silently drop (looks like a bot).
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value) {
      if (status) { status.textContent = 'Message sent.'; status.className = 'form-status success'; }
      form.reset();
      return;
    }
    if (status) { status.textContent = 'Sending your message…'; status.className = 'form-status sending'; }
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        if (status) { status.textContent = 'Thank you — your message is on its way. I’ll be in touch shortly.'; status.className = 'form-status success'; }
        form.reset();
      } else {
        let msg = 'Send failed.';
        try { const data = await res.json(); if (data && data.errors && data.errors[0]) msg = data.errors[0].message || msg; } catch (_) {}
        throw new Error(msg);
      }
    } catch (err) {
      if (status) { status.textContent = 'Sorry, something went wrong. Please email mo@dijostudios.co.za directly.'; status.className = 'form-status error'; }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    }
  });
}

/* ═══════════════════════════════════════════════
   13. NAV SCRAMBLE
═══════════════════════════════════════════════ */
function initNavScramble() {
  if (_prefersReducedMotion) return; // skip the hover scramble for motion-sensitive users
  const linksWrap = document.querySelector('.nav-links');
  if (!linksWrap || window.innerWidth < 768) return;
  const newWrap = linksWrap.cloneNode(true);
  linksWrap.parentNode.replaceChild(newWrap, linksWrap);
  newWrap.querySelectorAll('a').forEach(link => {
    link.addEventListener('mouseenter', () => { startScramble(link); });
    link.addEventListener('mouseleave', () => { stopScramble(link); });
  });
}

const CHARS_SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';

function startScramble(el) {
  const original = el.dataset.original || el.textContent.trim();
  el.dataset.original = original;
  const letters = original.split('');
  if (!el.querySelector('span.letter')) {
    el.innerHTML = letters.map(ch => ch === ' ' ? ' ' : `<span class="letter" data-char="${ch}">${ch}</span>`).join('');
  }
  const spans = el.querySelectorAll('span.letter');
  spans.forEach((span, i) => {
    const targetChar = span.dataset.char;
    let frame = 0;
    const spins = 4 + i * 2;
    if (span._interval) clearInterval(span._interval);
    if (span._timeout) clearTimeout(span._timeout);
    span._timeout = setTimeout(() => {
      span._interval = setInterval(() => {
        if (frame < spins) {
          span.textContent = CHARS_SCRAMBLE[Math.floor(Math.random() * CHARS_SCRAMBLE.length)];
          span.style.color = '#D4AF37';
        } else {
          clearInterval(span._interval);
          span.textContent = targetChar;
          span.style.color = '';
        }
        frame++;
      }, 38);
    }, i * 30);
  });
}

function stopScramble(el) {
  const spans = el.querySelectorAll('span.letter');
  spans.forEach(span => {
    if (span._timeout) clearTimeout(span._timeout);
    if (span._interval) clearInterval(span._interval);
    span.textContent = span.dataset.char;
    span.style.color = '';
  });
}

function animateCounters() {
  const yearsEl = document.getElementById('years-count');
  const brandsEl = document.getElementById('brands-count');
  if (!yearsEl || !brandsEl) return;
  if (_prefersReducedMotion) {
    yearsEl.textContent = '5';
    brandsEl.textContent = '25';
    return;
  }
  const obj = { years: 0, brands: 0 };
  ScrollTrigger.create({
    trigger: yearsEl.closest('.stats'),
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        years: 5, brands: 25, duration: 2, ease: 'power2.out',
        onUpdate: () => { yearsEl.textContent = Math.floor(obj.years); brandsEl.textContent = Math.floor(obj.brands); }
      });
    }
  });
}

/* ── IMAGE PROTECTION ──
   Visual deterrent only. Global Ctrl+S / Ctrl+U blocking was REMOVED — it
   harmed normal browsing usability without meaningfully protecting images.
   Right-click and drag are still prevented on gallery/lightbox images. */
(function protectImages() {
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.gallery-card, .lb-img-wrap, #lightbox') || e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') { e.preventDefault(); return false; }
  });
})();
