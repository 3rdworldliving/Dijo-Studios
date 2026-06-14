/* script.js — Dijo Studios | Snake‑reveal gallery + spotlight headline */
/* ═══════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
═══════════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.25,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════
   2. CUSTOM CURSOR
═══════════════════════════════════════════════ */
let cursorDot;
let _cursorHandler = null;

function initCustomCursor() {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  // Remove old listener to prevent accumulation on barba transitions
  if (_cursorHandler) {
    document.removeEventListener('mousemove', _cursorHandler);
    _cursorHandler = null;
  }
  const oldDot = document.querySelector('.cursor-dot');
  if (oldDot) oldDot.remove();
  cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);
  // Use left/top for positioning so CSS transform handles centering (-50%,-50%) + scale (ripple).
  // Previously, setting style.transform in JS overrode the CSS translate(-50%,-50%), causing
  // the dot to be offset from the cursor, AND the .ripple class had no effect (inline style wins).
  _cursorHandler = (e) => {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  };
  document.addEventListener('mousemove', _cursorHandler);
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
   3. CINEMATIC CONCENTRIC EXPLODING LOADER
═══════════════════════════════════════════════ */
function initLoader(onComplete) {
  // Pause the smooth scrolling system during the animation
  if (typeof lenis !== 'undefined') lenis.stop();
  
  // Create the visual elements on your page automatically
  const loader = document.createElement('div');
  loader.id = 'site-loader';
  loader.innerHTML = `
    <div class="loader-layer layer-bg"></div>
    <div class="loader-layer layer-accent"></div>
    <div class="loader-layer layer-core"></div>
    <div class="loader-content-wrap">
      <span id="loader-text">DIJO STUDIOS</span>
    </div>
  `;
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  const txt = document.getElementById('loader-text');
  const TARGET = 'DIJO STUDIOS';
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';
  const FRAME_MS = 70, STAGGER = 90, SPINS = 10;

  // Split your text into individual letters for the slot-machine scramble effect
  txt.innerHTML = TARGET.split('').map(ch =>
    ch === ' '
      ? '<span class="lch" style="display:inline-block;width:0.35em">&nbsp;</span>'
      : `<span class="lch" data-final="${ch}">${ch}</span>`
  ).join('');

  const letterSpans = txt.querySelectorAll('span.lch[data-final]');
  let lettersLanded = 0;

  // Smooth text fade in
  gsap.fromTo(txt, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' });

  // Run the premium text scrambling slot-machine effect
  letterSpans.forEach((span, i) => {
    const finalChar = span.dataset.final;
    let frame = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        if (frame < SPINS) {
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          span.style.color = 'var(--highlight)'; // Retain gold accent color during the random frame cycle
        } else {
          clearInterval(iv);
          span.textContent = finalChar;
          span.style.color = ''; // Returns to base css class color rule (var(--highlight))
          lettersLanded++;
          
          // When all letters finish scrambling, trigger the ring explosion reveal
          if (lettersLanded === letterSpans.length) {
            setTimeout(() => {
              triggerExplosionReveal();
            }, 1000);
          }
        }
        frame++;
      }, FRAME_MS);
    }, i * STAGGER);
  });

  // Smoothly expand the concentric color circles outward to reveal the page
  function triggerExplosionReveal() {
    gsap.to(txt, {
      opacity: 0,
      scale: 1.05,
      duration: 0.4,
      ease: 'power2.inOut'
    });

    const tl = gsap.timeline({
      onComplete: () => {
        loader.remove();
        document.body.style.overflow = '';
        if (typeof lenis !== 'undefined') lenis.start(); // Turn smooth scrolling back on
        if (onComplete) onComplete();
      }
    });

    tl.to('.layer-core', {
      scale: 0,
      duration: 1.1,
      ease: 'cubic-bezier(0.85, 0, 0.15, 1)'
    }, "+=0.1")
    .to('.layer-accent', {
      scale: 0,
      duration: 1.1,
      ease: 'cubic-bezier(0.85, 0, 0.15, 1)'
    }, "-=0.95")
    .to('.layer-bg', {
      scale: 0,
      duration: 1.1,
      ease: 'cubic-bezier(0.85, 0, 0.15, 1)'
    }, "-=0.95");
  }

  // Safety backup timer to make sure your site always reveals even if an error occurs
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
  // Dynamic copyright year
  document.querySelectorAll('.copyright-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  const header = document.querySelector('header');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    if (!header) return;
    const scrollingDown = scroll > lastY && scroll > 80;
    header.style.transform = scrollingDown ? 'translateY(-100%)' : 'translateY(0)';
    lastY = scroll;
  });

  const nsElement = document.querySelector('[data-barba-namespace]');
  const namespace = nsElement ? nsElement.dataset.barbaNamespace : 'other';
  const hasPlayedLoader = sessionStorage.getItem('dijo_loader_played');

  if (!hasPlayedLoader) {
    sessionStorage.setItem('dijo_loader_played', 'true');
    initLoader(() => {
      initPageSpecifics(namespace);
      initLogoScramble();
    });
  } else {
    initPageSpecifics(namespace);
    initLogoScramble();
  }

  initBarba();
});

function initGlobalEvents() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }
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
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath || (currentPath === '/' && linkPath.includes('index.html')) || currentPath.endsWith(linkPath)) {
      link.classList.add('active');
    }
  });
}

/* ── Logo scramble micro‑animation ──
   Plays a brief slot-machine scramble on the ".logo-text" span
   the first time the header becomes visible. Much shorter than
   the loader scramble — just 3 spins per letter, quick stagger. */
let _logoScrambled = false;

function initLogoScramble() {
  if (_logoScrambled) return;
  const logoText = document.querySelector('.logo-text');
  if (!logoText) return;
  _logoScrambled = true;

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const original = logoText.textContent.trim();
  const letters = original.split('');

  // Wrap each character in a span
  logoText.innerHTML = letters.map((ch, i) => {
    if (ch === '.') return '<span class="letter" data-char="." style="color:var(--highlight)">.</span>';
    return `<span class="letter" data-char="${ch}">${ch}</span>`;
  }).join('');

  const spans = logoText.querySelectorAll('span.letter');
  spans.forEach((span, i) => {
    const targetChar = span.dataset.char;
    if (targetChar === '.') return; // Skip the gold dot
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
   5. BARBA TRANSITIONS
═══════════════════════════════════════════════ */
function initBarba() {

  // ── Build overlay once, reuse every transition ──
  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  overlay.innerHTML = `
    <div class="pt-circle pt-c1"></div>
    <div class="pt-circle pt-c2"></div>
    <div class="pt-circle pt-c3"></div>`;
  document.body.appendChild(overlay);

  const [c1, c2, c3] = overlay.querySelectorAll('.pt-circle');
  // Start all circles collapsed
  gsap.set([c1, c2, c3], { scale: 0 });

  barba.init({
    prevent: ({ el }) => el.closest('.logo-container') !== null,
    sync: true, // ← leave MUST finish before enter begins — prevents flash
    transitions: [{
      name: 'circle-wipe',

      async leave(data) {
        overlay.style.pointerEvents = 'all';

        // Three circles expand in cascade, covering the screen
        const tl = gsap.timeline();
        tl.to(c1, { scale: 1, duration: 0.55, ease: 'power2.inOut' }, 0)
          .to(c2, { scale: 1, duration: 0.55, ease: 'power2.inOut' }, 0.08)
          .to(c3, { scale: 1, duration: 0.55, ease: 'power2.inOut' }, 0.16);

        await tl;
        // Old page hidden the moment it is fully covered
        gsap.set(data.current.container, { opacity: 0 });
      },

      async enter(data) {
        // New page sits hidden under the dark cover while it loads
        gsap.set(data.next.container, { opacity: 0 });
        lenis.scrollTo(0, { immediate: true });

        // Hold the cover long enough for the new page to render (0.35s)
        await gsap.delayedCall(0.35, () => {});

        // Make new page visible underneath before circles retract
        gsap.set(data.next.container, { opacity: 1 });

        // Three circles retract in reverse cascade, revealing new page
        const tl = gsap.timeline({
          onComplete: () => {
            overlay.style.pointerEvents = 'none';
            initPageSpecifics(data.next.namespace);
          }
        });
        tl.to(c3, { scale: 0, duration: 0.55, ease: 'power2.inOut' }, 0)
          .to(c2, { scale: 0, duration: 0.55, ease: 'power2.inOut' }, 0.08)
          .to(c1, { scale: 0, duration: 0.55, ease: 'power2.inOut' }, 0.16);

        await tl;
      }
    }]
  });

  barba.hooks.after((data) => {
    const nextUrl = data.next.url.path;
    const linksWrap = document.querySelector('.nav-links');
    if (linksWrap) {
      linksWrap.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
        const linkPath = new URL(link.href).pathname;
        if (linkPath === nextUrl || (nextUrl === '/' && linkPath.includes('index.html'))) {
          link.classList.add('active');
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
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 100);

  if (namespace === 'home') {
    initHeadlineSpotlight();
    initStaticGallery();
    // Home IS the portfolio — apply full gallery effects
    initPortfolioEffects();
  }
}

/* ═══════════════════════════════════════════════
   7. SPOTLIGHT HEADLINE
═══════════════════════════════════════════════ */
function initHeadlineSpotlight() {
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
        gsap.from(split.words, {
          yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.04
        });
        gsap.to(split.chars, {
          color: '#D4AF37', duration: 0.35, stagger: { each: 0.03, yoyo: true, repeat: 1 }, delay: 0.2
        });
      }
    });
  });

  const textElements = document.querySelectorAll('section p:not(.stat-box p):not(.upload-zone p)');
  textElements.forEach(textEl => {
    gsap.set(textEl, { opacity: 1 });
    const split = new SplitType(textEl, { types: 'lines, words' });
    split.lines.forEach(line => gsap.set(line, { overflow: 'hidden' }));
    gsap.from(split.words, {
      yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.025,
      scrollTrigger: { trigger: textEl, start: 'top 90%' }
    });
  });

  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (['p', 'h1', 'h2'].includes(el.tagName.toLowerCase())) return;
    gsap.fromTo(el, { opacity: 0, y: 48 }, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });

  const statBoxes = gsap.utils.toArray('.stat-box');
  if (statBoxes.length) {
    gsap.fromTo(statBoxes,
      { opacity: 0, y: 40, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: '.stats', start: 'top 82%' }
      }
    );
  }
  const brandTags = gsap.utils.toArray('.brand-tag');
  if (brandTags.length) {
    gsap.fromTo(brandTags,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07,
        scrollTrigger: { trigger: '.brands', start: 'top 88%' }
      }
    );
  }

  gsap.utils.toArray('section img:not(.logo-img)').forEach(img => {
    if (img.closest('.gallery-card')) return;
    gsap.to(img, {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  });

  animateCounters();
  const footer = document.querySelector('footer');
  if (footer) {
    gsap.fromTo(footer,
      { opacity: 0 },
      {
        opacity: 1, duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: footer, start: 'top 95%' }
      }
    );
  }
}

/* ═══════════════════════════════════════════════
   9. PORTFOLIO EFFECTS
═══════════════════════════════════════════════ */
function initPortfolioEffects() {
  destroyInnerParallax();
  destroyMouseFollow();
  const cards = document.querySelectorAll('.gallery-card');
  cards.forEach((card, idx) => {
    applyInnerParallaxToCard(card, idx);
    applyMouseFollowToCard(card);
  });
}

/* Single source of truth for the image transform.
   Combines parallax offset, mouse-follow shift, and animated scale
   into one transform string. Every effect calls this after updating
   its value on the card, so the image always reflects all three. */
function updateCardImg(card) {
  const img = card.querySelector('img');
  if (!img) return;
  const shiftX   = card._mouseShiftX  || 0;
  const shiftY   = card._mouseShiftY  || 0;
  const parallaxY = card._parallaxY   || 0;
  const scale    = card._scaleObj ? card._scaleObj.value : 1.1;
  img.style.transform = `translate(${shiftX}px, ${shiftY + parallaxY}px) scale(${scale.toFixed(4)})`;
}

function destroyInnerParallax() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    if (card._fpTrigger) {
      card._fpTrigger.kill();
      delete card._fpTrigger;
    }
    card._parallaxY = 0;
    const img = card.querySelector('img');
    if (img) img.style.transform = '';
  });
}

/* Inner-image parallax: shifts only the <img> inside each card, never the
   card itself. This keeps the CSS Grid layout perfectly intact — no overlap,
   no gap inconsistencies. The image is scaled up slightly (1.1) so it has
   room to parallax-shift within the overflow:hidden card without edges. */
function applyInnerParallaxToCard(card, index) {
  if (card._fpTrigger) return;
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
    onUpdate: (self) => {
      card._parallaxY = self.progress * rangeY;
      updateCardImg(card);
    }
  });
  card._fpTrigger = trigger;
}

function destroyMouseFollow() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    if (card._mouseMoveHandler) {
      card.removeEventListener('mousemove', card._mouseMoveHandler);
      card.removeEventListener('mouseleave', card._mouseLeaveHandler);
      card.removeEventListener('mouseenter', card._mouseEnterHandler);
      delete card._mouseMoveHandler;
      delete card._mouseLeaveHandler;
      delete card._mouseEnterHandler;
    }
    card._mouseShiftX = 0;
    card._mouseShiftY = 0;
    // Kill any running GSAP scale tween
    if (card._scaleTween) { card._scaleTween.kill(); delete card._scaleTween; }
    if (card._scaleObj) card._scaleObj.value = 1.1;
  });
}

function applyMouseFollowToCard(card) {
  if (card._mouseMoveHandler) return;
  const img = card.querySelector('img');
  if (!img) return;
  card._mouseShiftX = 0;
  card._mouseShiftY = 0;
  // Scale object: GSAP tweens this for a smooth hover zoom
  if (!card._scaleObj) card._scaleObj = { value: 1.1 };

  const onMouseEnter = () => {
    // Smoothly zoom in from 1.1 → 1.22 over 0.35s
    if (card._scaleTween) card._scaleTween.kill();
    card._scaleTween = gsap.to(card._scaleObj, {
      value: 1.22,
      duration: 0.35,
      ease: 'power2.out',
      onUpdate: () => updateCardImg(card)
    });
  };

  const onMouseMove = (e) => {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let shiftX = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    let shiftY = ((e.clientY - centerY) / (rect.height / 2)) * 6;
    shiftX = Math.min(Math.max(shiftX, -8), 8);
    shiftY = Math.min(Math.max(shiftY, -6), 6);
    card._mouseShiftX = shiftX;
    card._mouseShiftY = shiftY;
    updateCardImg(card);
  };

  const onMouseLeave = () => {
    card._mouseShiftX = 0;
    card._mouseShiftY = 0;
    // Smoothly zoom out from current scale → 1.1 over 0.4s
    if (card._scaleTween) card._scaleTween.kill();
    card._scaleTween = gsap.to(card._scaleObj, {
      value: 1.1,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => updateCardImg(card)
    });
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
    return {
      card,
      top: rect.top - containerRect.top,
      left: rect.left - containerRect.left,
      bottom: rect.bottom - containerRect.top,
    };
  });

  const rows = [];
  rects.forEach(r => {
    let added = false;
    for (let row of rows) {
      if (Math.abs(row.y - r.top) < 30) {
        row.cards.push(r);
        added = true;
        break;
      }
    }
    if (!added) {
      rows.push({ y: r.top, cards: [r] });
    }
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
  gsap.set(cards, { opacity: 0, scale: 0.8 });
  gsap.to(ordered, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    stagger: 0.07,
    ease: "back.out(1)",
    clearProps: "transform"
  });
  snakeOrderedCards = ordered;
  snakeOrderedSrcs = ordered.map(card => card.dataset.src);
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

/* Generate SEO-friendly alt text from the image filename.
   "Dijo-Studios-Food-Moja-Cafe-Heritage-Day.webp"
   → "Moja Cafe Heritage Day — Food Photography by Dijo Studios, Johannesburg" */
function altTextFromSrc(src) {
  const filename = src.split('/').pop();                // "Dijo-Studios-Food-Moja-Cafe-Heritage-Day.webp"
  const name = filename.replace(/\.\w+$/, '');          // strip extension
  const desc = name
    .replace(/^Dijo-Studios-Food[-_ ]?/i, '')           // strip brand prefix
    .replace(/[-_]/g, ' ')                              // hyphens/underscores → spaces
    .replace(/\s+/g, ' ')                               // collapse whitespace
    .trim();
  if (!desc) return 'Food photography by Dijo Studios, Johannesburg';
  return `${desc.charAt(0).toUpperCase() + desc.slice(1)} — Food Photography by Dijo Studios, Johannesburg`;
}

function makeCard(src, globalIndex) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.dataset.src = src;
  const alt = altTextFromSrc(src);
  card.innerHTML = `<img src="${src}" alt="${alt}" loading="lazy"/>
    <div class="card-overlay">
      <div class="card-icon">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </div>
      <span class="card-label">View</span>
    </div>`;
  card.addEventListener('click', () => {
    const idx = snakeOrderedCards.indexOf(card);
    if (idx !== -1) openLightbox(idx);
    else openLightbox(0);
  });
  // Preload full-res image on hover so lightbox opens instantly
  card.addEventListener('mouseenter', () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = src;
    link.as = 'image';
    link.dataset.preload = '1';
    document.head.appendChild(link);
    // Clean up after a few seconds to avoid head bloat
    setTimeout(() => { if (link.parentNode) link.remove(); }, 10000);
  }, { once: true });
  return card;
}

let _lbIndex = 0;
const _isMobile = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

function openLightbox(index) {
  if (!snakeOrderedSrcs.length) return;
  _lbIndex = Math.min(Math.max(index, 0), snakeOrderedSrcs.length - 1);
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!lb || !img) return;
  img.src = snakeOrderedSrcs[_lbIndex];
  if (counter) counter.textContent = `${_lbIndex + 1} / ${snakeOrderedSrcs.length}`;
  lb.classList.add('open');
  if (_isMobile()) {
    lb.style.overflowY = 'auto';
  } else {
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) { lb.classList.remove('open'); lb.style.overflowY = ''; }
  document.body.style.overflow = '';
}

function shiftSlide(dir) {
  if (!snakeOrderedSrcs.length) return;
  _lbIndex = (_lbIndex + dir + snakeOrderedSrcs.length) % snakeOrderedSrcs.length;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!img) return;
  img.classList.add('switching');
  setTimeout(() => {
    img.src = snakeOrderedSrcs[_lbIndex];
    if (counter) counter.textContent = `${_lbIndex + 1} / ${snakeOrderedSrcs.length}`;
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
    if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
      shiftSlide(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
})();

/* ── Lightbox pinch‑to‑zoom (mobile + trackpad) ── */
(function initLightboxPinchZoom() {
  let scale = 1, panX = 0, panY = 0;
  let lastDist = 0, lastCenterX = 0, lastCenterY = 0;
  let isPinching = false;

  function getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getCenter(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  function applyTransform(img) {
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  function resetZoom() {
    const img = document.getElementById('lb-img');
    if (!img) return;
    scale = 1; panX = 0; panY = 0;
    img.classList.remove('zoomed');
    img.style.transform = '';
    img.style.maxWidth = '';
    img.style.maxHeight = '';
  }

  // Two-finger pinch gesture
  document.addEventListener('touchstart', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    if (e.touches.length === 2) {
      isPinching = true;
      lastDist = getDistance(e.touches[0], e.touches[1]);
      const c = getCenter(e.touches[0], e.touches[1]);
      lastCenterX = c.x;
      lastCenterY = c.y;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isPinching || e.touches.length < 2) return;
    e.preventDefault();
    const img = document.getElementById('lb-img');
    if (!img) return;

    const dist = getDistance(e.touches[0], e.touches[1]);
    const center = getCenter(e.touches[0], e.touches[1]);
    const deltaScale = dist / lastDist;
    scale = Math.min(Math.max(scale * deltaScale, 1), 5);

    if (scale > 1) {
      // Pan with fingers
      panX += center.x - lastCenterX;
      panY += center.y - lastCenterY;
      img.classList.add('zoomed');
    } else {
      panX = 0; panY = 0;
      img.classList.remove('zoomed');
    }

    applyTransform(img);
    lastDist = dist;
    lastCenterX = center.x;
    lastCenterY = center.y;
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      isPinching = false;
      if (scale <= 1) resetZoom();
    }
  }, { passive: true });

  // Double-tap to toggle zoom (mobile)
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    const img = document.getElementById('lb-img');
    if (!img) return;

    const now = Date.now();
    if (now - lastTap < 300 && e.changedTouches.length === 1) {
      if (scale > 1) {
        resetZoom();
      } else {
        scale = 2.5;
        const rect = img.getBoundingClientRect();
        const tapX = e.changedTouches[0].clientX - rect.left;
        const tapY = e.changedTouches[0].clientY - rect.top;
        panX = rect.width / 2 - tapX;
        panY = rect.height / 2 - tapY;
        img.classList.add('zoomed');
        applyTransform(img);
      }
    }
    lastTap = now;
  }, { passive: true });

  // Ctrl+scroll to zoom (desktop trackpad)
  document.addEventListener('wheel', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('open')) return;
    if (!e.ctrlKey) return;
    e.preventDefault();
    const img = document.getElementById('lb-img');
    if (!img) return;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale = Math.min(Math.max(scale * delta, 1), 5);
    if (scale > 1) {
      img.classList.add('zoomed');
    } else {
      img.classList.remove('zoomed');
      panX = 0; panY = 0;
    }
    applyTransform(img);
  }, { passive: false });

  // Reset zoom when lightbox closes or image changes
  const origClose = window.closeLightbox;
  window.closeLightbox = function() {
    resetZoom();
    origClose();
  };
  const origShift = window.shiftSlide;
  window.shiftSlide = function(dir) {
    resetZoom();
    origShift(dir);
  };
})();

function initStaticGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  if (gallery.children.length > 0) return;

  const priority = GALLERY_IMAGES.slice(0, 4);
  const rest = shuffleArray(GALLERY_IMAGES.slice(4));

  // Featured images go first — they land across the 4 columns as the top row
  priority.forEach((src, i) => {
    const card = makeCard(src, i);
    card.classList.add('featured-card');
    // Featured images are above the fold; load eagerly
    const img = card.querySelector('img');
    if (img) img.removeAttribute('loading');
    gallery.appendChild(card);
  });

  rest.forEach((src, i) => {
    const card = makeCard(src, i + 4);
    gallery.appendChild(card);
  });

  // Initial masonry layout pass (featured cards get fixed spans immediately)
  layoutMasonry();

  // Recalculate spans as each image loads
  gallery.querySelectorAll('.gallery-card img, .featured-card img').forEach(img => {
    if (img.complete) {
      layoutMasonry();
    } else {
      img.addEventListener('load', layoutMasonry, { once: true });
    }
  });

  setTimeout(() => {
    layoutMasonry();
    const allCards = [...document.querySelectorAll('.gallery-card, .featured-card')];
    ScrollTrigger.create({
      trigger: gallery,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        layoutMasonry();
        snakeReveal(allCards);
      }
    });
  }, 100);
}

/* ── CSS Grid masonry: calculate grid-row-end span for each card ── */
const MASONRY_ROW_HEIGHT = 1;   // must match grid-auto-rows in CSS (1px for minimal rounding error)
const MASONRY_GAP = 5;          // must match gap in CSS

function layoutMasonry() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  // Detect column count and actual gap from computed style (gap differs on mobile)
  const computed = getComputedStyle(gallery);
  const cols = computed.gridTemplateColumns.split(' ').length;
  const colWidth = gallery.getBoundingClientRect().width / cols;
  const gap = parseFloat(computed.rowGap) || MASONRY_GAP;

  gallery.querySelectorAll('.gallery-card, .featured-card').forEach(card => {
    const img = card.querySelector('img');
    if (!img) return;

    // All cards (featured + regular): span based on natural image aspect ratio × column width
    // No cropping — images display fully at their own proportions
    if (img.complete && img.naturalHeight > 0) {
      const renderedH = (img.naturalHeight / img.naturalWidth) * colWidth;
      const span = Math.ceil((renderedH + gap) / (MASONRY_ROW_HEIGHT + gap));
      card.style.gridRowEnd = `span ${span}`;
    }
  });
}

// Debounced resize → recalculate row spans
let _masonryResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_masonryResizeTimer);
  _masonryResizeTimer = setTimeout(layoutMasonry, 200);
});

/* ═══════════════════════════════════════════════
   12. UTILITIES
═══════════════════════════════════════════════ */
function initNavScramble() {
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
  const obj = { years: 0, brands: 0 };
  ScrollTrigger.create({
    trigger: yearsEl.closest('.stats'),
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        years: 5, brands: 25, duration: 2, ease: 'power2.out',
        onUpdate: () => {
          yearsEl.textContent = Math.floor(obj.years);
          brandsEl.textContent = Math.floor(obj.brands);
        }
      });
    }
  });
}

/* ── IMAGE PROTECTION ── */
(function protectImages() {
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.gallery-card, .lb-img-wrap, #lightbox') || e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
      return false;
    }
  });
  document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.target.style.webkitUserSelect = 'none';
      e.target.style.userSelect = 'none';
    }
  });
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (key === 's' || key === 'u')) {
      e.preventDefault();
      return false;
    }
  });
})();
