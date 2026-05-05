/* script.js — Dijo Studios | Upgraded with Lenis, GSAP, SplitType, and Barba.js */

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
  
  // Header behavior
  let lastY = 0;
  const header = document.querySelector('header');
  lenis.on('scroll', ({ scroll }) => {
    if (!header) return;
    const scrollingDown = scroll > lastY && scroll > 80;
    header.style.transform = scrollingDown ? 'translateY(-100%)' : 'translateY(0)';
    lastY = scroll;
  });

  // Get the current page namespace
  const nsElement = document.querySelector('[data-barba-namespace]');
  const namespace = nsElement ? nsElement.dataset.barbaNamespace : 'other';

  // Check if the loader has already played in this browser session
  const hasPlayedLoader = sessionStorage.getItem('dijo_loader_played');

  if (!hasPlayedLoader) {
    // First time visiting OR logo was clicked
    sessionStorage.setItem('dijo_loader_played', 'true');
    initLoader(() => initPageSpecifics(namespace));
  } else {
    // Already visited, skip loader
    initPageSpecifics(namespace);
  }

  initBarba(); // Start page transition engine
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

  // When the logo is clicked, clear the session storage so the loader plays again
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
    // Tell Barba to ignore the logo link so it does a hard refresh
    prevent: ({ el }) => el.closest('.logo-container') !== null,
    transitions: [{
      name: 'fade-transition',
      leave(data) {
        // Fade out old page
        return gsap.to(data.current.container, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut'
        });
      },
      enter(data) {
        // Scroll to top instantly
        lenis.scrollTo(0, { immediate: true });
        
        // Re-initialize animations and specific scripts for the new page
        initPageSpecifics(data.next.namespace);
        
        // Fade in new page
        return gsap.from(data.next.container, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    }]
  });

  // Update Navigation Active State and Re-run animations after entering a new page
  barba.hooks.after((data) => {
    const nextUrl = data.next.url.path;
    const linksWrap = document.querySelector('.nav-links');
    
    linksWrap.querySelectorAll('a').forEach(link => {
      link.classList.remove('active');
      const linkPath = new URL(link.href).pathname;
      if (linkPath === nextUrl || (nextUrl === '/' && linkPath.includes('index.html'))) {
        link.classList.add('active');
      }
    });
    
    // CRITICAL: Clear all old scroll triggers and refresh for the new content
    ScrollTrigger.getAll().forEach(t => t.kill());
    initPageSpecifics(data.next.namespace);
    initNavScramble(); 
    ScrollTrigger.refresh();
  });
    
    // Re-bind hover events for scrambling on new page
    initNavScramble(); 
  });
}

/* ═══════════════════════════════════════════════
   4. PAGE-SPECIFIC INITIALIZATION
═══════════════════════════════════════════════ */
function initPageSpecifics(namespace) {
  // 1. Kill old scroll triggers so they don't overlap / break
  ScrollTrigger.getAll().forEach(t => t.kill());

  // 2. Start Page Animations
  initAnimations();

  // 3. Namespace specific scripts
  if (namespace === 'portfolio') {
    setupUploader('drop-zone', 'file-input', 'gallery', 'dijoImages');
  }
}

function initAnimations() {
  // A. Headings: Mask Reveal + Color Wave
  document.querySelectorAll('h1, h2').forEach(heading => {
    if (heading.closest('#site-loader')) return;
    
    gsap.set(heading, { opacity: 1 });

    // Split into lines (for mask), words (for sliding up), and chars (for color wave)
    const split = new SplitType(heading, { types: 'lines, words, chars' });
    split.lines.forEach(line => gsap.set(line, { overflow: 'hidden' }));

    ScrollTrigger.create({
      trigger: heading,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        // 1. Smooth mask reveal (sliding up)
        gsap.from(split.words, {
          yPercent: 100, 
          duration: 0.85, 
          ease: 'power3.out', 
          stagger: 0.04
        });

        // 2. Wave of gold color rippling through each character
        gsap.to(split.chars, {
          color: '#D4AF37',
          duration: 0.35,
          stagger: {
            each: 0.03,    // Time between each letter lighting up
            yoyo: true,    // Reverses back to white
            repeat: 1      // Does it once
          },
          delay: 0.2       // Wait slightly for the slide-up to begin
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
  if (statBoxes.length) gsap.fromTo(statBoxes, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.stats', start: 'top 82%' } });

  const brandTags = gsap.utils.toArray('.brand-tag');
  if (brandTags.length) gsap.fromTo(brandTags, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07, scrollTrigger: { trigger: '.brands', start: 'top 88%' } });

  // E. Image parallax
  gsap.utils.toArray('section img:not(.logo-img)').forEach(img => {
    gsap.to(img, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
  });

  // F. Marquee
  const marquee = document.querySelector('.marquee');
  if (marquee) {
    ScrollTrigger.create({
      trigger: '.marquee-wrapper', start: 'top bottom', end: 'bottom top',
      onUpdate: self => { marquee.style.animationDuration = Math.max(6, 20 - (Math.abs(self.getVelocity()) / 1000) * 2) + 's'; },
    });
  }

  // G. Counters & Footer
  animateCounters();
  const footer = document.querySelector('footer');
  if (footer) gsap.fromTo(footer, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: footer, start: 'top 95%' } });
}

/* ═══════════════════════════════════════════════
   5. UTILITY FUNCTIONS (Loader, Uploader, Lightbox)
═══════════════════════════════════════════════ */

function initLoader(onComplete) {
  lenis.stop();
  const loader = document.createElement('div');
  loader.id = 'site-loader';
  loader.innerHTML = '<span class="loader-text">0%</span>';
  document.body.prepend(loader);
  document.body.style.overflow = 'hidden';

  let percent = 0;
  const txt = loader.querySelector('.loader-text');
  let switched = false;

  // Start the continuous gold pulse animation
  const pulseAnim = gsap.to(txt, {
    color: '#D4AF37',
    textShadow: '0 0 25px rgba(212,175,55,0.4)',
    duration: 0.65,
    repeat: -1,      // Infinite loop
    yoyo: true,      // Pulse back and forth
    ease: 'power1.inOut'
  });

  const dismissLoader = () => {
    if (!loader.parentNode || loader.classList.contains('hide')) return;
    
    // Stop the pulse right before fading out
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
  };

  const iv = setInterval(() => {
    percent += Math.floor(Math.random() * 10) + 5;
    if (!switched) {
      if (percent >= 90) {
        percent = 90; 
        txt.textContent = 'Dijo Studios'; 
        switched = true; 
        clearInterval(iv);
        
        // Wait exactly 1.5 seconds (1500ms) after the text changes
        setTimeout(dismissLoader, 1500);
      } else {
        txt.textContent = `${percent}%`;
      }
    }
  }, 80);

  // Safety fallback
  setTimeout(dismissLoader, 8000); 
}

function setupUploader(zoneId, inputId, galleryId, storageKey) {
  const dropZone = document.getElementById(zoneId);
  const fileInput = document.getElementById(inputId);
  const gallery = document.getElementById(galleryId);
  const clearBtn = document.getElementById('clear-btn');
  if (!dropZone || !gallery) return;

  ['dragenter','dragover','dragleave','drop'].forEach(e => dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }));
  ['dragenter','dragover'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.add('dragover')));
  ['dragleave','drop'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.remove('dragover')));

  dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files, storageKey));
  dropZone.addEventListener('click', () => fileInput && fileInput.click());
  if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files, storageKey));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Remove all photos from your portfolio?')) return;
      gallery.innerHTML = '';
      try { localStorage.removeItem(storageKey); } catch(e) {}
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
      } catch(err) {}
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
      <div class="card-icon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>
      <span class="card-label">View</span>
    </div>`;

  gsap.fromTo(card, { opacity: 0, scale: 0.94, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power3.out' });

  card.addEventListener('click', e => {
    const r = document.createElement('span'); r.className = 'ripple';
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
  try { JSON.parse(localStorage.getItem(key) || '[]').forEach(src => addImageToGallery(src)); } catch(e) {}
}

let lbImages = []; let lbIndex = 0;
function openLightbox(index) {
  lbImages = Array.from(document.querySelectorAll('.gallery-card img')).map(i => i.src);
  if (!lbImages.length) return;
  lbIndex = index; showSlide(lbIndex, false);
  const lb = document.getElementById('lightbox'); lb.classList.add('open');
  gsap.fromTo(lb.querySelector('.lb-img-wrap'), { opacity: 0, scale: 0.88, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  lenis.stop(); document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  gsap.to(lb.querySelector('.lb-img-wrap'), {
    opacity: 0, scale: 0.92, y: 20, duration: 0.3, ease: 'power2.in',
    onComplete: () => { lb.classList.remove('open'); lenis.start(); document.body.style.overflow = ''; }
  });
}

function shiftSlide(dir) { lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length; showSlide(lbIndex, true); }

function showSlide(index, animate) {
  const img = document.getElementById('lb-img'); const counter = document.getElementById('lb-counter');
  if (!img) return;
  if (animate) {
    gsap.to(img, { opacity: 0, x: -20, duration: 0.2, ease: 'power2.in',
      onComplete: () => { img.src = lbImages[index]; gsap.fromTo(img, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }); }
    });
  } else { img.src = lbImages[index]; }
  if (counter) counter.textContent = `${index + 1} / ${lbImages.length}`;
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') shiftSlide(1);
  if (e.key === 'ArrowLeft') shiftSlide(-1);
});

function animateCounters() {
  const yearsEl = document.getElementById('years-count'); const brandsEl = document.getElementById('brands-count');
  if (!yearsEl || !brandsEl) return;
  const statsSection = yearsEl.closest('.stats'); if (!statsSection) return;
  const obj = { years: 0, brands: 0 };
  ScrollTrigger.create({
    trigger: statsSection, start: 'top 80%', once: true,
    onEnter: () => {
      gsap.to(obj, { years: 5, brands: 25, duration: 2, ease: 'power2.out',
        onUpdate: () => { yearsEl.textContent = Math.floor(obj.years); brandsEl.textContent = Math.floor(obj.brands); },
        onComplete: () => { yearsEl.textContent = 5; brandsEl.textContent = 25; }
      });
    }
  });
}

/* ═══════════════════════════════════════════════
   6. NAV SCRAMBLE EFFECT
═══════════════════════════════════════════════ */
function initNavScramble() {
  const linksWrap = document.querySelector('.nav-links');
  if (!linksWrap) return;

  if (window.innerWidth < 768) return; 

  // Remove old listeners to avoid memory leaks on page transitions
  const newWrap = linksWrap.cloneNode(true);
  linksWrap.parentNode.replaceChild(newWrap, linksWrap);
  
  // Attach mouseenter and mouseleave to start scramble and abort instantly
  newWrap.querySelectorAll('a').forEach(link => {
    link.addEventListener('mouseenter', () => { startScramble(link); });
    link.addEventListener('mouseleave', () => { stopScramble(link); });
  });
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!&%';

// Runs slot machine effect, stopping automatically after a set amount of spins
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
    const spins = 4 + i * 2; // Fixed number of spins based on letter position

    // Clear previous runs
    if (span._interval) clearInterval(span._interval);
    if (span._timeout) clearTimeout(span._timeout);

    span._timeout = setTimeout(() => {
      span._interval = setInterval(() => {
        if (frame < spins) { 
          // Keep scrambling
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)]; 
          span.style.color = '#D4AF37'; 
        } else { 
          // Naturally settle on the correct letter and stop
          clearInterval(span._interval); 
          span._interval = null; 
          span.textContent = targetChar; 
          span.style.color = ''; 
        }
        frame++;
      }, 38);
    }, i * 30);
  });
}

// Aborts immediately and resets to original text when cursor leaves
function stopScramble(el) {
  const spans = el.querySelectorAll('span.letter');
  
  spans.forEach(span => {
    if (span._timeout) clearTimeout(span._timeout);
    if (span._interval) clearInterval(span._interval);
    span._timeout = null;
    span._interval = null;
    
    // Instantly reset to original character and color
    span.textContent = span.dataset.char; 
    span.style.color = ''; 
  });
}
