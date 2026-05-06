/* script.js — Dijo Studios | Fixed Barba.js Lifecycle & ScrollTrigger */

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
   3. BARBA.JS PAGE TRANSITIONS
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
        
        // Wait for next frame to ensure DOM is ready
        gsap.set(data.next.container, { opacity: 0 });
        
        return gsap.fromTo(data.next.container, 
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => {
              // Re-run everything once the new page is visible
              initPageSpecifics(data.next.namespace);
            }
          }
        );
      }
    }]
  });

  barba.hooks.after((data) => {
    // Update navigation links active state
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
    
    // Refresh global UI elements
    initNavScramble(); 
    ScrollTrigger.refresh();
  });
}

/* ═══════════════════════════════════════════════
   4. PAGE-SPECIFIC INITIALIZATION
═══════════════════════════════════════════════ */
function initPageSpecifics(namespace) {
  // 1. Clear everything old
  ScrollTrigger.getAll().forEach(t => t.kill());

  // 2. Cleanup SplitType leftovers
  document.querySelectorAll('.line, .word, .char').forEach(el => {
    if (el.parentNode) el.outerHTML = el.textContent;
  });

  // 3. Re-init animations and force refresh
  initAnimations();
  
  // Extra delay to ensure layout is settled
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 100);

  if (namespace === 'portfolio') {
    setupUploader('drop-zone', 'file-input', 'gallery', 'dijoImages');
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
          yPercent: 100, 
          duration: 0.85, 
          ease: 'power3.out', 
          stagger: 0.04
        });

        gsap.to(split.chars, {
          color: '#D4AF37',
          duration: 0.35,
          stagger: { each: 0.03, yoyo: true, repeat: 1 },
          delay: 0.2 
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
    // Skip if handled by text logic
    if (['p', 'h1', 'h2'].includes(el.tagName.toLowerCase())) return;
    
    gsap.fromTo(el, { opacity: 0, y: 48 }, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { 
        trigger: el, 
        start: 'top 88%',
        toggleActions: 'play none none none'
      }
    });
  });

  // D. Stats & Brands
  const statBoxes = gsap.utils.toArray('.stat-box');
  if (statBoxes.length) {
    gsap.fromTo(statBoxes, 
      { opacity: 0, y: 40, scale: 0.96 }, 
      { 
        opacity: 1, y: 0, scale: 1, 
        duration: 0.8, 
        ease: 'power3.out', 
        stagger: 0.12, 
        scrollTrigger: { trigger: '.stats', start: 'top 82%' } 
      }
    );
  }

  const brandTags = gsap.utils.toArray('.brand-tag');
  if (brandTags.length) {
    gsap.fromTo(brandTags, 
      { opacity: 0, y: 20 }, 
      { 
        opacity: 1, y: 0, 
        duration: 0.6, 
        ease: 'power2.out', 
        stagger: 0.07, 
        scrollTrigger: { trigger: '.brands', start: 'top 88%' } 
      }
    );
  }

  // E. Image parallax
  gsap.utils.toArray('section img:not(.logo-img)').forEach(img => {
    gsap.to(img, { 
      yPercent: -12, 
      ease: 'none', 
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1.5 } 
    });
  });

  // F. Marquee
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    ScrollTrigger.create({
      trigger: '.marquee-wrapper', 
      start: 'top bottom', 
      end: 'bottom top',
      onUpdate: self => { 
        marquee.style.animationDuration = Math.max(6, 20 - (Math.abs(self.getVelocity()) / 1000) * 2) + 's'; 
      },
    });
  }

  animateCounters();
  const footer = document.querySelector('footer');
  if (footer) {
    gsap.fromTo(footer, 
      { opacity: 0 }, 
      { 
        opacity: 1, 
        duration: 1.2, 
        ease: 'power2.out', 
        scrollTrigger: { trigger: footer, start: 'top 95%' } 
      }
    );
  }
}

/* ═══════════════════════════════════════════════
   5. UTILITY FUNCTIONS
═══════════════════════════════════════════════ */
function initLoader(onComplete) {
  lenis.stop();

  const loader = document.createElement('div');
  loader.id = 'site-loader';
  // Start with "Dijo Studios" visible immediately — no percentage counter
  loader.innerHTML = '<span class="loader-text" id="loader-text">Dijo Studios</span>';
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  const txt = document.getElementById('loader-text');

  // ── Pulsating gold colour on the whole text (runs throughout) ──
  const pulseAnim = gsap.to(txt, {
    color: '#D4AF37',
    textShadow: '0 0 35px rgba(212,175,55,0.5)',
    duration: 0.7,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });

  // ── Slot machine scramble on each letter ──
  const TARGET   = 'DIJO STUDIOS'; // uppercase so random chars blend naturally
  const CHARS    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';
  const FRAME_MS = 38;   // speed of each random frame
  const STAGGER  = 45;   // ms between each letter starting to settle
  const SPINS    = 7;    // random frames before a letter lands (same for all — simultaneous feel)

  // Build one <span> per character so we can animate individually
  txt.innerHTML = TARGET.split('').map((ch, i) =>
    ch === ' '
      ? '<span class="lch" style="display:inline-block;width:0.35em">&nbsp;</span>'
      : `<span class="lch" data-final="${ch}">${ch}</span>`
  ).join('');

  const letterSpans = txt.querySelectorAll('span.lch[data-final]');
  let lettersLanded = 0;

  // Small entrance: fade + slight scale in before scramble starts
  gsap.from(txt, { opacity: 0, scale: 0.92, duration: 0.5, ease: 'power2.out' });

  // Scramble each letter with stagger — leftmost lands first
  letterSpans.forEach((span, i) => {
    const finalChar = span.dataset.final;
    let frame = 0;

    setTimeout(() => {
      const iv = setInterval(() => {
        if (frame < SPINS) {
          // Still spinning — show random character
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        } else {
          // Land on the real character
          clearInterval(iv);
          span.textContent = finalChar;

          lettersLanded++;

          // When ALL letters have landed — hold 1.5s then dismiss
          if (lettersLanded === letterSpans.length) {
            setTimeout(() => {
              pulseAnim.kill();
              // Fade out loader
              gsap.to(loader, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                  loader.remove();
                  document.body.style.overflow = '';
                  lenis.start();
                  if (onComplete) onComplete();
                }
              });
              loader.classList.add('hide');
            }, 1500); // ← hold "Dijo Studios" for 1.5s after scramble lands
          }
        }
        frame++;
      }, FRAME_MS);
    }, i * STAGGER); // each letter starts settling slightly after the previous
  });

  // Safety fallback — dismiss after 10s no matter what
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

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';

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
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)]; 
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
        years: 5, 
        brands: 25, 
        duration: 2, 
        ease: 'power2.out',
        onUpdate: () => { 
          yearsEl.textContent = Math.floor(obj.years); 
          brandsEl.textContent = Math.floor(obj.brands); 
        }
      });
    }
  });
}

function setupUploader(zoneId, inputId, galleryId, storageKey) {
  const dropZone = document.getElementById(zoneId);
  const fileInput = document.getElementById(inputId);
  const gallery = document.getElementById(galleryId);
  if (!dropZone || !gallery) return;

  dropZone.addEventListener('click', () => fileInput && fileInput.click());
  if (fileInput) fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => addImageToGallery(e.target.result);
      reader.readAsDataURL(file);
    });
  });
  
  try { 
    JSON.parse(localStorage.getItem(storageKey) || '[]').forEach(src => addImageToGallery(src)); 
  } catch(e) {}
}

function addImageToGallery(src) {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.innerHTML = `<img src="${src}" alt="Portfolio image" loading="lazy"/><div class="card-overlay"><div class="card-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div><span class="card-label">View</span></div>`;
  gallery.appendChild(card);
}
