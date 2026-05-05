/* script.js — Dijo Studios | Upgraded with Lenis + GSAP + SplitType */

/* ═══════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
   ─ Makes the entire page glide instead of jump
═══════════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.25,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

// Hook Lenis into GSAP's ticker so they stay in sync
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ═══════════════════════════════════════════════
   2. GSAP + SCROLLTRIGGER SETUP
═══════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════
   3. DOM READY
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── Active nav highlight ──
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (
      link.getAttribute('href') === currentPage ||
      (currentPage === '' && link.getAttribute('href') === 'index.html')
    ) link.classList.add('active');
  });

  // ── Hamburger mobile menu ──
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

  // ── Sliding nav indicator (larevoltosa.es technique) ──
  initNavIndicator();
  // Header fades down when scrolling down, reappears when scrolling up
  let lastY = 0;
  const header = document.querySelector('header');
  lenis.on('scroll', ({ scroll }) => {
    if (!header) return;
    const scrollingDown = scroll > lastY && scroll > 80;
    header.style.transform = scrollingDown ? 'translateY(-100%)' : 'translateY(0)';
    lastY = scroll;
  });

  // ── Home Page Loader ──
  const isHomePage = currentPage === '' || currentPage === 'index.html';
  if (isHomePage) {
    initLoader(() => {
      // Run all animations only after loader finishes
      initAnimations();
    });
  } else {
    initAnimations();
  }

  // ── Portfolio Uploader ──
  setupUploader('drop-zone', 'file-input', 'gallery', 'dijoImages');

});

/* ═══════════════════════════════════════════════
   4. ALL GSAP ANIMATIONS
   Called after loader dismisses (home) or immediately (other pages)
═══════════════════════════════════════════════ */
function initAnimations() {

  /* ── A. Slot machine character scramble ──
     Each letter in h1/h2 cycles through random characters
     before snapping to its final value — left to right stagger.
     Triggered when the heading scrolls into view. */
  document.querySelectorAll('h1, h2').forEach(heading => {
    if (heading.closest('#site-loader')) return;

    ScrollTrigger.create({
      trigger: heading,
      start: 'top 88%',
      onEnter: () => scrambleText(heading),
      once: true,
    });
  });

  /* ── B. GSAP Scroll Reveals (replaces CSS .reveal-up) ──
     All elements with .reveal-up animate in on scroll,
     with a stagger when multiple siblings are grouped */
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 48 },
      {
        opacity: 1, y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  });

  /* ── C. Stat boxes: stagger in as a group ── */
  const statBoxes = gsap.utils.toArray('.stat-box');
  if (statBoxes.length) {
    gsap.fromTo(statBoxes,
      { opacity: 0, y: 40, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: '.stats',
          start: 'top 82%',
          toggleActions: 'play none none none',
        }
      }
    );
  }

  /* ── D. Brand tags: stagger in ── */
  const brandTags = gsap.utils.toArray('.brand-tag');
  if (brandTags.length) {
    gsap.fromTo(brandTags,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.07,
        scrollTrigger: {
          trigger: '.brands',
          start: 'top 88%',
          toggleActions: 'play none none none',
        }
      }
    );
  }

  /* ── E. Image parallax ──
     Images drift at a slower speed than the scroll,
     creating a 3D depth effect */
  gsap.utils.toArray('section img:not(.logo-img)').forEach(img => {
    gsap.to(img, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      }
    });
  });

  /* ── F. Horizontal marquee speed-up on scroll ──
     Marquee accelerates as user scrolls past it */
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    let speed = 20; // base animation duration in seconds
    ScrollTrigger.create({
      trigger: '.marquee-wrapper',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: self => {
        // Faster when scrolling quickly, normal when still
        const velocity = Math.abs(self.getVelocity()) / 1000;
        const newDuration = Math.max(6, 20 - velocity * 2);
        marquee.style.animationDuration = newDuration + 's';
      },
    });
  }

  /* ── G. About page counters with GSAP ── */
  animateCounters();

  /* ── H. Footer fade in ── */
  const footer = document.querySelector('footer');
  if (footer) {
    gsap.fromTo(footer,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: footer,
          start: 'top 95%',
          toggleActions: 'play none none none',
        }
      }
    );
  }
}

/* ═══════════════════════════════════════════════
   5. LOADER
═══════════════════════════════════════════════ */
function initLoader(onComplete) {
  // Pause Lenis during loader so user can't scroll behind it
  lenis.stop();

  const loader = document.createElement('div');
  loader.id = 'site-loader';
  loader.innerHTML = '<span class="loader-text">0%</span>';
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  let percent  = 0;
  const txt    = loader.querySelector('.loader-text');
  let switched = false;

  const iv = setInterval(() => {
    percent += Math.floor(Math.random() * 10) + 5;
    if (!switched) {
      if (percent >= 90) {
        percent = 90;
        txt.textContent = 'Dijo Studios';
        switched = true;
        clearInterval(iv);
      } else {
        txt.textContent = `${percent}%`;
      }
    }
  }, 80);

  const dismissLoader = () => {
    if (!loader.parentNode || loader.classList.contains('hide')) return;

    // Animate the loader text out with GSAP before hiding
    gsap.to(loader, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        loader.remove();
        document.body.style.overflow = '';
        lenis.start(); // Resume smooth scroll
        if (onComplete) onComplete();
      }
    });

    loader.classList.add('hide');
  };

  window.addEventListener('load', () => setTimeout(dismissLoader, 3000));
  setTimeout(dismissLoader, 10000); // safety fallback
}

/* ═══════════════════════════════════════════════
   6. PORTFOLIO UPLOADER
═══════════════════════════════════════════════ */
function setupUploader(zoneId, inputId, galleryId, storageKey) {
  const dropZone  = document.getElementById(zoneId);
  const fileInput = document.getElementById(inputId);
  const gallery   = document.getElementById(galleryId);
  const clearBtn  = document.getElementById('clear-btn');
  if (!dropZone || !gallery) return;

  ['dragenter','dragover','dragleave','drop'].forEach(e =>
    dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); })
  );
  ['dragenter','dragover'].forEach(e =>
    dropZone.addEventListener(e, () => dropZone.classList.add('dragover'))
  );
  ['dragleave','drop'].forEach(e =>
    dropZone.addEventListener(e, () => dropZone.classList.remove('dragover'))
  );

  dropZone.addEventListener('drop',  e => handleFiles(e.dataTransfer.files, storageKey));
  dropZone.addEventListener('click', () => fileInput && fileInput.click());
  if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files, storageKey));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Remove all photos from your portfolio?')) return;
      gallery.innerHTML = '';
      try { localStorage.removeItem(storageKey); } catch(e) { console.warn('Storage error:', e); }
    });
  }

  loadSavedImages(storageKey);
}

function handleFiles(files, storageKey) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      addImageToGallery(e.target.result);
      try {
        const images = JSON.parse(localStorage.getItem(storageKey) || '[]');
        images.push(e.target.result);
        localStorage.setItem(storageKey, JSON.stringify(images));
      } catch(err) {
        console.warn('Could not save image:', err);
      }
    };
    reader.readAsDataURL(file);
  });
}

function addImageToGallery(src) {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.innerHTML = `
    <img src="${src}" alt="Portfolio image" loading="lazy"/>
    <div class="card-overlay">
      <div class="card-icon">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </div>
      <span class="card-label">View</span>
    </div>`;

  // GSAP entrance animation for newly added card
  gsap.fromTo(card,
    { opacity: 0, scale: 0.94, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' }
  );

  // Gold ripple on click
  card.addEventListener('click', e => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = Math.max(card.offsetWidth, card.offsetHeight);
    const rect = card.getBoundingClientRect();
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
    card.appendChild(r);
    r.addEventListener('animationend', () => r.remove());

    const allImgs = Array.from(document.querySelectorAll('.gallery-card img'));
    openLightbox(allImgs.indexOf(card.querySelector('img')));
  });

  gallery.appendChild(card);
}

function loadSavedImages(key) {
  try {
    JSON.parse(localStorage.getItem(key) || '[]').forEach(src => addImageToGallery(src));
  } catch(e) {
    console.warn('Could not load saved images:', e);
  }
}

/* ═══════════════════════════════════════════════
   7. LIGHTBOX
═══════════════════════════════════════════════ */
let lbImages = [];
let lbIndex  = 0;

function openLightbox(index) {
  lbImages = Array.from(document.querySelectorAll('.gallery-card img')).map(i => i.src);
  if (!lbImages.length) return;
  lbIndex = index;
  showSlide(lbIndex, false);

  const lb = document.getElementById('lightbox');
  lb.classList.add('open');

  // Animate the image wrap in with GSAP
  gsap.fromTo(lb.querySelector('.lb-img-wrap'),
    { opacity: 0, scale: 0.88, y: 30 },
    { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }
  );

  lenis.stop(); // pause smooth scroll while lightbox is open
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  gsap.to(lb.querySelector('.lb-img-wrap'), {
    opacity: 0, scale: 0.92, y: 20, duration: 0.3, ease: 'power2.in',
    onComplete: () => {
      lb.classList.remove('open');
      lenis.start();
      document.body.style.overflow = '';
    }
  });
}

function shiftSlide(dir) {
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  showSlide(lbIndex, true);
}

function showSlide(index, animate) {
  const img     = document.getElementById('lb-img');
  const counter = document.getElementById('lb-counter');
  if (!img) return;
  if (animate) {
    gsap.to(img, { opacity: 0, x: -20, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        img.src = lbImages[index];
        gsap.fromTo(img, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
      }
    });
  } else {
    img.src = lbImages[index];
  }
  if (counter) counter.textContent = `${index + 1} / ${lbImages.length}`;
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') shiftSlide(1);
  if (e.key === 'ArrowLeft')  shiftSlide(-1);
});

/* ═══════════════════════════════════════════════
   8. ABOUT COUNTERS (now powered by GSAP)
═══════════════════════════════════════════════ */
function animateCounters() {
  const yearsEl  = document.getElementById('years-count');
  const brandsEl = document.getElementById('brands-count');
  if (!yearsEl || !brandsEl) return;

  const statsSection = yearsEl.closest('.stats');
  if (!statsSection) return;

  const obj = { years: 0, brands: 0 };

  ScrollTrigger.create({
    trigger: statsSection,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.to(obj, {
        years: 5, brands: 25,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          yearsEl.textContent  = Math.floor(obj.years);
          brandsEl.textContent = Math.floor(obj.brands);
        },
        onComplete: () => {
          yearsEl.textContent  = 5;
          brandsEl.textContent = 25;
        }
      });
    }
  });
}

/* ═══════════════════════════════════════════════
   9. SLIDING NAV INDICATOR
   The gold line that travels between nav links
   on hover — exactly like larevoltosa.es
═══════════════════════════════════════════════ */
function initNavIndicator() {
  const indicator = document.getElementById('navIndicator');
  const linksWrap = document.querySelector('.nav-links');
  if (!indicator || !linksWrap) return;

  // Only show on desktop (indicator hidden on mobile where hamburger is used)
  if (window.innerWidth < 768) return;

  const links      = linksWrap.querySelectorAll('a');
  const activeLink = linksWrap.querySelector('a.active') || links[0];

  // Set GSAP starting state — invisible, zero width
  gsap.set(indicator, { opacity: 0, width: 0, x: 0 });

  // Core function: move indicator to match a given link's position + width
  function slideTo(el) {
    const wrapRect = linksWrap.getBoundingClientRect();
    const elRect   = el.getBoundingClientRect();
    gsap.to(indicator, {
      x:       elRect.left - wrapRect.left,
      width:   elRect.width,
      opacity: 1,
      duration: 0.38,
      ease:    'power3.out',
    });
  }

  // Snap back to the active link (or fade out if none)
  function snapToActive() {
    if (activeLink) {
      slideTo(activeLink);
    } else {
      gsap.to(indicator, { opacity: 0, duration: 0.25, ease: 'power2.out' });
    }
  }

  // Fade indicator in when mouse enters the nav link group
  linksWrap.addEventListener('mouseenter', () => {
    gsap.to(indicator, { opacity: 1, duration: 0.2 });
  });

  // Each link: slide the indicator AND trigger scramble on hover
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      slideTo(link);
      scrambleText(link);
    });
  });

  // When mouse leaves the nav, slide back to active page link
  linksWrap.addEventListener('mouseleave', snapToActive);

  // On window resize, recalculate indicator position
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      gsap.set(indicator, { opacity: 0 });
    } else if (activeLink) {
      slideTo(activeLink);
    }
  });
}

/* ═══════════════════════════════════════════════
   10. SLOT MACHINE TEXT SCRAMBLE
   Each letter cycles through random characters
   before snapping to the real letter — one by one
   from left to right, like a slot machine landing.
═══════════════════════════════════════════════ */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';

function scrambleText(el) {
  // Store original text and guard against re-triggering mid-animation
  const original = el.dataset.original || el.textContent.trim();
  el.dataset.original = original;
  if (el._scrambling) return;
  el._scrambling = true;

  const letters  = original.split('');
  const duration = 38;   // ms per frame
  const stagger  = 55;   // ms delay before each letter starts settling

  // Build span-per-letter structure on first run
  if (!el.querySelector('span.letter')) {
    el.innerHTML = letters.map(ch =>
      ch === ' '
        ? ' '
        : `<span class="letter" data-char="${ch}">${ch}</span>`
    ).join('');
  }

  const spans = el.querySelectorAll('span.letter');

  spans.forEach((span, i) => {
    const targetChar = span.dataset.char;
    let   frame      = 0;
    // How many random frames before this letter "lands"
    // Letters further right spin for longer — slot machine cascade
    const spins = 4 + i * 2;

    // Clear any previous interval on this span
    if (span._interval) clearInterval(span._interval);

    // Start spinning after stagger delay
    setTimeout(() => {
      span._interval = setInterval(() => {
        if (frame < spins) {
          // Still spinning — show random char
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          span.style.color = 'var(--highlight)'; // gold while spinning
        } else {
          // Land on the real character
          clearInterval(span._interval);
          span._interval = null;
          span.textContent  = targetChar;
          span.style.color  = '';        // back to normal colour
          span.style.opacity = '1';

          // When the last letter lands, mark animation done
          if (i === spans.length - 1) {
            el._scrambling = false;
          }
        }
        frame++;
      }, duration);
    }, i * stagger);
  });
}
