/* script.js — Dijo Studios | Text‑scramble loader + Barba transitions + pop‑up scale‑in */
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
   2. CUSTOM CURSOR (single dot, instant follow, ripple on hover)
═══════════════════════════════════════════════ */
let cursorDot;

function initCustomCursor() {
  const oldDot = document.querySelector('.cursor-dot');
  if (oldDot) oldDot.remove();

  cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);

  document.addEventListener('mousemove', (e) => {
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) scale(1)`;
  });

  attachCursorHoverEvents();
}

function attachCursorHoverEvents() {
  const interactive = document.querySelectorAll('a, button, .btn, .gallery-card, .brand-tag, .logo-container, .upload-zone, .clear-btn, [role="button"], input, textarea, .nav-links a');
  interactive.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (cursorDot) cursorDot.classList.add('ripple');
    });
    el.addEventListener('mouseleave', () => {
      if (cursorDot) cursorDot.classList.remove('ripple');
    });
  });
}

/* ═══════════════════════════════════════════════
   3. LOADER (original text scramble)
═══════════════════════════════════════════════ */
function initLoader(onComplete) {
  lenis.stop();
  const loader = document.createElement('div');
  loader.id = 'site-loader';
  loader.innerHTML = '<span class="loader-text" id="loader-text">Dijo Studios</span>';
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';
  const txt = document.getElementById('loader-text');
  const pulseAnim = gsap.to(txt, {
    color: '#D4AF37',
    textShadow: '0 0 35px rgba(212,175,55,0.5)',
    duration: 0.7, repeat: -1, yoyo: true, ease: 'power1.inOut'
  });
  const TARGET = 'DIJO STUDIOS';
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';
  const FRAME_MS = 80, STAGGER = 120, SPINS = 12;
  txt.innerHTML = TARGET.split('').map(ch =>
    ch === ' '
      ? '<span class="lch" style="display:inline-block;width:0.35em">&nbsp;</span>'
      : `<span class="lch" data-final="${ch}">${ch}</span>`
  ).join('');
  const letterSpans = txt.querySelectorAll('span.lch[data-final]');
  let lettersLanded = 0;
  gsap.from(txt, { opacity: 0, scale: 0.92, duration: 0.5, ease: 'power2.out' });
  letterSpans.forEach((span, i) => {
    const finalChar = span.dataset.final;
    let frame = 0;
    setTimeout(() => {
      const iv = setInterval(() => {
        if (frame < SPINS) {
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        } else {
          clearInterval(iv);
          span.textContent = finalChar;
          lettersLanded++;
          if (lettersLanded === letterSpans.length) {
            setTimeout(() => {
              pulseAnim.kill();
              gsap.to(loader, {
                opacity: 0, duration: 0.6, ease: 'power2.inOut',
                onComplete: () => {
                  loader.remove();
                  document.body.style.overflow = '';
                  lenis.start();
                  if (onComplete) onComplete();
                }
              });
              loader.classList.add('hide');
            }, 1500);
          }
        }
        frame++;
      }, FRAME_MS);
    }, i * STAGGER);
  });
  setTimeout(() => {
    if (!loader.parentNode || loader.classList.contains('hide')) return;
    pulseAnim.kill();
    gsap.to(loader, {
      opacity: 0, duration: 0.6, ease: 'power2.inOut',
      onComplete: () => {
        loader.remove();
        document.body.style.overflow = '';
        lenis.start();
        if (onComplete) onComplete();
      }
    });
    loader.classList.add('hide');
  }, 10000);
}

/* ═══════════════════════════════════════════════
   4. GLOBAL INITIALIZATION
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initGlobalEvents();
  initNavScramble();
  initCustomCursor();

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
    initLoader(() => initPageSpecifics(namespace));
  } else {
    initPageSpecifics(namespace);
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

/* ═══════════════════════════════════════════════
   5. BARBA.JS PAGE TRANSITIONS (with pop‑up scale‑in)
═══════════════════════════════════════════════ */
function initBarba() {
  barba.init({
    prevent: ({ el }) => el.closest('.logo-container') !== null,
    transitions: [{
      name: 'fade-transition',
      leave(data) {
        return gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut'
        });
      },
      enter(data) {
        lenis.scrollTo(0, { immediate: true });
        gsap.set(data.next.container, { opacity: 0 });
        return gsap.fromTo(data.next.container,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => {
              initPageSpecifics(data.next.namespace);
              const wrapper = data.next.container;
              if (wrapper) wrapper.classList.add('new-page');
              setTimeout(() => {
                if (wrapper) wrapper.classList.remove('new-page');
              }, 800);
            }
          }
        );
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
   6. PAGE-SPECIFIC INITIALIZATION
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

  if (namespace === 'portfolio' || namespace === 'home') {
    initStaticGallery();
    if (namespace === 'portfolio') {
      initPortfolioEffects();
    } else {
      // Home: attach mouse-follow only, no floating parallax (breaks CSS masonry columns)
      destroyFloatingParallax();
      document.querySelectorAll('.gallery-card').forEach(card => applyMouseFollowToCard(card));
    }
  }
}

function initAnimations() {
  // A. Headings: Mask Reveal + Color Wave
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

  // B. SplitType Mask Reveal for Paragraphs
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

  // C. General Element Reveals
  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (['p', 'h1', 'h2'].includes(el.tagName.toLowerCase())) return;
    gsap.fromTo(el, { opacity: 0, y: 48 }, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
    });
  });

  // D. Stats & Brands
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

  // E. Image parallax (skip gallery cards — breaks masonry column layout)
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
   7. PORTFOLIO ENHANCEMENTS (floating parallax + mouse follow)
═══════════════════════════════════════════════ */
function initPortfolioEffects() {
  destroyFloatingParallax();
  destroyMouseFollow();
  const cards = document.querySelectorAll('.gallery-card');
  cards.forEach((card, idx) => {
    applyFloatingParallaxToCard(card, idx);
    applyMouseFollowToCard(card);
  });
}

function destroyFloatingParallax() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    if (card._fpTrigger) {
      card._fpTrigger.kill();
      delete card._fpTrigger;
    }
    card.style.transform = '';
  });
}

function applyFloatingParallaxToCard(card, index) {
  if (card._fpTrigger) return;
  const patterns = [40, -28, 52, -35, 22, -45, 30];
  const rangeY = patterns[index % patterns.length];
  const trigger = ScrollTrigger.create({
    trigger: card,
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.8,
    onUpdate: (self) => {
      const yOffset = self.progress * rangeY;
      card.style.transform = `translateY(${yOffset}px)`;
    }
  });
  card._fpTrigger = trigger;
}

function destroyMouseFollow() {
  document.querySelectorAll('.gallery-card').forEach(card => {
    if (card._mouseMoveHandler) {
      card.removeEventListener('mousemove', card._mouseMoveHandler);
      card.removeEventListener('mouseleave', card._mouseLeaveHandler);
      delete card._mouseMoveHandler;
      delete card._mouseLeaveHandler;
    }
    card.style.removeProperty('--img-shift-x');
    card.style.removeProperty('--img-shift-y');
  });
}

function applyMouseFollowToCard(card) {
  if (card._mouseMoveHandler) return;
  const img = card.querySelector('img');
  if (!img) return;
  const onMouseMove = (e) => {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let shiftX = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    let shiftY = ((e.clientY - centerY) / (rect.height / 2)) * 6;
    shiftX = Math.min(Math.max(shiftX, -8), 8);
    shiftY = Math.min(Math.max(shiftY, -6), 6);
    card.style.setProperty('--img-shift-x', `${shiftX}px`);
    card.style.setProperty('--img-shift-y', `${shiftY}px`);
  };
  const onMouseLeave = () => {
    card.style.setProperty('--img-shift-x', '0px');
    card.style.setProperty('--img-shift-y', '0px');
  };
  card.addEventListener('mousemove', onMouseMove);
  card.addEventListener('mouseleave', onMouseLeave);
  card._mouseMoveHandler = onMouseMove;
  card._mouseLeaveHandler = onMouseLeave;
}

function attachPortfolioEffectsToNewCard(card) {
  if (!document.querySelector('[data-barba-namespace="portfolio"]')) return;
  const allCards = Array.from(document.querySelectorAll('.gallery-card'));
  const newIndex = allCards.indexOf(card);
  if (newIndex !== -1 && !card._fpTrigger) {
    applyFloatingParallaxToCard(card, newIndex);
    applyMouseFollowToCard(card);
  }
}

/* ═══════════════════════════════════════════════
   8. UTILITY FUNCTIONS (nav scramble, counters, uploader)
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

/* ═══════════════════════════════════════════════
   LIGHTBOX CONTROLS
═══════════════════════════════════════════════ */
let _lbIndex = 0;

function openLightbox(index) {
  _lbIndex = index;
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!lb || !img) return;
  img.src = GALLERY_IMAGES[_lbIndex];
  if (counter) counter.textContent = `${_lbIndex + 1} / ${GALLERY_IMAGES.length}`;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

function shiftSlide(dir) {
  _lbIndex = (_lbIndex + dir + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
  const img = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!img) return;
  img.classList.add('switching');
  setTimeout(() => {
    img.src = GALLERY_IMAGES[_lbIndex];
    if (counter) counter.textContent = `${_lbIndex + 1} / ${GALLERY_IMAGES.length}`;
    img.classList.remove('switching');
  }, 200);
}

document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') shiftSlide(-1);
  if (e.key === 'ArrowRight') shiftSlide(1);
});

const GALLERY_IMAGES = [
  'images/Dijo-Studios-Food-894.jpg',  'images/Dijo-Studios-Food-911.jpg',  'images/Dijo-Studios-Food-923.jpg',
  'images/Dijo-Studios-Food-927.jpg',  'images/Dijo-Studios-Food-892.jpg',  'images/Dijo-Studios-Food-893.jpg',
  'images/Dijo-Studios-Food-895.jpg',  'images/Dijo-Studios-Food-896.jpg',  'images/Dijo-Studios-Food-897.jpg',
  'images/Dijo-Studios-Food-898.jpg',  'images/Dijo-Studios-Food-899.jpg',  'images/Dijo-Studios-Food-900.jpg',
  'images/Dijo-Studios-Food-901.jpg',  'images/Dijo-Studios-Food-902.jpg',  'images/Dijo-Studios-Food-903.jpg',
  'images/Dijo-Studios-Food-904.jpg',  'images/Dijo-Studios-Food-905.jpg',  'images/Dijo-Studios-Food-906.jpg',
  'images/Dijo-Studios-Food-907.jpg',  'images/Dijo-Studios-Food-908.jpg',  'images/Dijo-Studios-Food-909.jpg',
  'images/Dijo-Studios-Food-910.jpg',  'images/Dijo-Studios-Food-912.jpg',  'images/Dijo-Studios-Food-913.jpg',
  'images/Dijo-Studios-Food-914.jpg',  'images/Dijo-Studios-Food-915.jpg',  'images/Dijo-Studios-Food-916.jpg',
  'images/Dijo-Studios-Food-917.jpg',  'images/Dijo-Studios-Food-918.jpg',  'images/Dijo-Studios-Food-919.jpg',
  'images/Dijo-Studios-Food-920.jpg',  'images/Dijo-Studios-Food-921.jpg',  'images/Dijo-Studios-Food-922.jpg',
  'images/Dijo-Studios-Food-924.jpg',  'images/Dijo-Studios-Food-925.jpg',  'images/Dijo-Studios-Food-926.jpg',
  'images/Dijo-Studios-Food-928.jpg',  'images/Dijo-Studios-Food-929.jpg',  'images/Dijo-Studios-Food-930.jpg',
  'images/Dijo-Studios-Food-931.jpg',  'images/Dijo-Studios-Food-932.jpg',  'images/Dijo-Studios-Food-933.jpg',
  'images/Dijo-Studios-Food-934.jpg',  'images/Dijo-Studios-Food-935.jpg',  'images/Dijo-Studios-Food-936.jpg',
  'images/Dijo-Studios-Food-937.jpg',  'images/Dijo-Studios-Food-938.jpg',  'images/Dijo-Studios-Food-939.jpg',
  'images/Dijo-Studios-Food-940.jpg',  'images/Dijo-Studios-Food-941.jpg',  'images/Dijo-Studios-Food-942.jpg',
  'images/Dijo-Studios-Food-943.jpg',  'images/Dijo-Studios-Food-944.jpg',  'images/Dijo-Studios-Food-945.jpg',
  'images/Dijo-Studios-Food-946.jpg',  'images/Dijo-Studios-Food-947.jpg',  'images/Dijo-Studios-Food-948.jpg',
  'images/Dijo-Studios-Food-949.jpg'
];

function initStaticGallery() {
  const gallery = document.getElementById('gallery');
  if (!gallery || gallery.children.length > 0) return;
  GALLERY_IMAGES.forEach((src, i) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.dataset.index = i;
    card.innerHTML = `<img src="${src}" alt="Dijo Studios Food Photography ${892 + i}" loading="lazy"/>
      <div class="card-overlay">
        <div class="card-icon">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
        <span class="card-label">View</span>
      </div>`;
    card.addEventListener('click', () => openLightbox(i));
    gallery.appendChild(card);
  });
  ScrollTrigger.refresh();
}
