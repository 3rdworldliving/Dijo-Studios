/* script.js — Dijo Studios | Final Stability, One-Row Loader & Hold Logic */

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
   2. GLOBAL INITIALIZATION
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initGlobalEvents();
  initNavScramble();
  
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
      const isOpen = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
      if (isOpen) {
        navLinks.querySelectorAll('a').forEach(link => startScramble(link));
      }
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }
  document.querySelectorAll('.logo-container').forEach(logo => {
    logo.addEventListener('click', () => sessionStorage.removeItem('dijo_loader_played'));
  });
}

/* ═══════════════════════════════════════════════
   3. BARBA.JS PAGE TRANSITIONS
═══════════════════════════════════════════════ */
function initBarba() {
  barba.init({
    prevent: ({ el }) => el.closest('.logo-container') !== null,
    transitions: [{
      name: 'fade-transition',
      leave(data) { return gsap.to(data.current.container, { opacity: 0, duration: 0.4 }); },
      enter(data) {
        lenis.scrollTo(0, { immediate: true });
        return gsap.fromTo(data.next.container, { opacity: 0 }, {
          opacity: 1, 
          duration: 0.6, 
          onComplete: () => {
            initPageSpecifics(data.next.namespace);
          }
        });
      }
    }]
  });

  barba.hooks.after((data) => {
    const nextUrl = data.next.url.path;
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.classList.remove('active');
      const linkPath = new URL(link.href).pathname;
      if (linkPath === nextUrl || (nextUrl === '/' && linkPath.includes('index.html'))) link.classList.add('active');
    });
    initNavScramble(); 
    ScrollTrigger.refresh();
  });
}

/* ═══════════════════════════════════════════════
   4. PAGE-SPECIFIC INITIALIZATION
═══════════════════════════════════════════════ */
function initPageSpecifics(namespace) {
  ScrollTrigger.getAll().forEach(t => t.kill());
  document.querySelectorAll('.line, .word, .char').forEach(el => { if (el.parentNode) el.outerHTML = el.textContent; });
  initAnimations();
  setTimeout(() => { ScrollTrigger.refresh(); }, 200);

  if (namespace === 'portfolio') {
    setupUploader('drop-zone', 'file-input', 'gallery', 'dijoImages');
  }
}

function initAnimations() {
  gsap.set('.reveal-up, h1, h2, section p', { opacity: 1 });

  document.querySelectorAll('h1, h2').forEach(heading => {
    if (heading.closest('#site-loader')) return;
    const split = new SplitType(heading, { types: 'lines, words, chars' });
    split.lines.forEach(line => gsap.set(line, { overflow: 'hidden' }));

    ScrollTrigger.create({
      trigger: heading, start: 'top 90%', once: true,
      onEnter: () => {
        gsap.from(split.words, { yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.04 });
        gsap.to(split.chars, { color: '#D4AF37', duration: 0.35, stagger: { each: 0.03, yoyo: true, repeat: 1 }, delay: 0.2 });
      }
    });
  });

  document.querySelectorAll('section p:not(.stat-box p)').forEach(textEl => {
    const split = new SplitType(textEl, { types: 'lines, words' });
    split.lines.forEach(line => gsap.set(line, { overflow: 'hidden' }));
    gsap.from(split.words, { yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.025, scrollTrigger: { trigger: textEl, start: 'top 90%' } });
  });

  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (['p', 'h1', 'h2'].includes(el.tagName.toLowerCase())) return;
    gsap.fromTo(el, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  animateCounters();
}

/* ═══════════════════════════════════════════════
   5. UTILITY FUNCTIONS (One-Row Loader + Hold)
═══════════════════════════════════════════════ */
function initLoader(onComplete) {
  lenis.stop();

  const loader = document.createElement('div');
  loader.id = 'site-loader';
  loader.innerHTML = '<span class="loader-text" id="loader-text">DIJO STUDIOS</span>';
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  const txt = document.getElementById('loader-text');
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';

  const pulseAnim = gsap.to(txt, {
    color: '#D4AF37',
    textShadow: '0 0 35px rgba(212,175,55,0.5)',
    duration: 0.7,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });

  // Prepare letters for slot machine
  const TARGET = 'DIJO STUDIOS';
  txt.innerHTML = TARGET.split('').map((ch) =>
    ch === ' '
      ? '<span class="lch" style="display:inline-block;width:0.3em">&nbsp;</span>'
      : `<span class="lch" data-final="${ch}">${ch}</span>`
  ).join('');

  const letterSpans = txt.querySelectorAll('span.lch[data-final]');
  let lettersLanded = 0;

  gsap.from(txt, { opacity: 0, y: 10, duration: 0.6, ease: 'power2.out' });

  letterSpans.forEach((span, i) => {
    const finalChar = span.dataset.final;
    let frame = 0;
    const spins = 8; 

    setTimeout(() => {
      const iv = setInterval(() => {
        if (frame < spins) {
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        } else {
          clearInterval(iv);
          span.textContent = finalChar;
          lettersLanded++;

          // After scramble settles, wait 1.5s then trigger cinematic exit
          if (lettersLanded === letterSpans.length) {
            setTimeout(() => {
              pulseAnim.kill();
              gsap.to(loader, {
                opacity: 0,
                scale: 1.05, 
                duration: 0.8,
                ease: 'power2.inOut',
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
      }, 35);
    }, i * 40); 
  });
}

function initNavScramble() {
  const linksWrap = document.querySelector('.nav-links');
  if (!linksWrap || window.innerWidth < 768) return;
  const newWrap = linksWrap.cloneNode(true);
  linksWrap.parentNode.replaceChild(newWrap, linksWrap);
  newWrap.querySelectorAll('a').forEach(link => {
    link.addEventListener('mouseenter', () => startScramble(link));
    link.addEventListener('mouseleave', () => stopScramble(link));
  });
}

function startScramble(el) {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';
  const original = el.dataset.original || el.textContent.trim();
  el.dataset.original = original;
  if (!el.querySelector('span.letter')) el.innerHTML = original.split('').map(ch => ch === ' ' ? ' ' : `<span class="letter" data-char="${ch}">${ch}</span>`).join('');
  el.querySelectorAll('span.letter').forEach((span, i) => {
    const targetChar = span.dataset.char;
    let frame = 0, spins = 4 + i * 2;
    if (span._interval) clearInterval(span._interval);
    span._interval = setInterval(() => {
      if (frame < spins) span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
      else { clearInterval(span._interval); span.textContent = targetChar; }
      frame++;
    }, 38);
  });
}

function stopScramble(el) {
  el.querySelectorAll('span.letter').forEach(span => {
    if (span._interval) clearInterval(span._interval);
    span.textContent = span.dataset.char;
  });
}

function animateCounters() {
  const yearsEl = document.getElementById('years-count');
  const brandsEl = document.getElementById('brands-count');
  if (!yearsEl || !brandsEl) return;
  const obj = { years: 0, brands: 0 };
  ScrollTrigger.create({
    trigger: yearsEl.closest('.stats'), start: 'top 80%', once: true,
    onEnter: () => gsap.to(obj, { years: 5, brands: 25, duration: 2, onUpdate: () => { yearsEl.textContent = Math.floor(obj.years); brandsEl.textContent = Math.floor(obj.brands); } })
  });
}

function setupUploader(zoneId, inputId, galleryId, storageKey) {
  const dropZone = document.getElementById(zoneId);
  if (!dropZone) return;
  const fileInput = document.getElementById(inputId);
  dropZone.addEventListener('click', () => fileInput && fileInput.click());
}
