/* script.js — Dijo Studios */

document.addEventListener('DOMContentLoaded', () => {

  // ── Active nav highlight ──
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (
      link.getAttribute('href') === currentPage ||
      (currentPage === '' && link.getAttribute('href') === 'index.html')
    ) {
      link.classList.add('active');
    }
  });

  // ── FIX 1: Hamburger mobile menu toggle ──
  // Was completely missing — mobile nav never opened or closed
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    // Close menu when any nav link is tapped
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // ── Home Page Loader (runs every time index.html loads) ──
  const isHomePage = (currentPage === '' || currentPage === 'index.html');
  if (isHomePage) initLoader();

  // ── Scroll Reveal Animation ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

  // ── Portfolio Uploader ──
  setupUploader('drop-zone', 'file-input', 'gallery', 'dijoImages');

  // ── About Page Count-Up ──
  animateCounters();

});

// ─── LOADER ─────────────────────────────────────────────
function initLoader() {
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
    loader.classList.add('hide');
    setTimeout(() => {
      loader.remove();
      document.body.style.overflow = '';
    }, 600);
  };

  window.addEventListener('load', () => setTimeout(dismissLoader, 3000));
  setTimeout(dismissLoader, 10000); // safety fallback
}

// ─── PORTFOLIO UPLOADER ──────────────────────────────────
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

  dropZone.addEventListener('drop',   e => handleFiles(e.dataTransfer.files, storageKey));
  dropZone.addEventListener('click',  () => fileInput && fileInput.click());
  if (fileInput) fileInput.addEventListener('change', () => handleFiles(fileInput.files, storageKey));

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Remove all photos from your portfolio?')) return;
      gallery.innerHTML = '';
      // FIX 2: wrapped in try/catch — was crashing in Safari private/incognito mode
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
      // FIX 2: wrapped in try/catch — crashes when storage is full or in private mode
      try {
        const images = JSON.parse(localStorage.getItem(storageKey) || '[]');
        images.push(e.target.result);
        localStorage.setItem(storageKey, JSON.stringify(images));
      } catch(err) {
        console.warn('Could not save image — storage may be full or unavailable:', err);
      }
    };
    reader.readAsDataURL(file);
  });
}

function addImageToGallery(src) {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Portfolio image';
  gallery.appendChild(img);
}

function loadSavedImages(key) {
  // FIX 2: wrapped in try/catch — crashes in private/incognito mode
  try {
    const images = JSON.parse(localStorage.getItem(key) || '[]');
    images.forEach(src => addImageToGallery(src));
  } catch(e) {
    console.warn('Could not load saved images:', e);
  }
}

// ─── ABOUT COUNTERS ──────────────────────────────────────
function animateCounters() {
  const yearsEl  = document.getElementById('years-count');
  const brandsEl = document.getElementById('brands-count');
  if (!yearsEl || !brandsEl) return; // safe exit on non-about pages

  const statsSection = yearsEl.closest('.stats');
  if (!statsSection) return;

  let animated = false;
  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        runCounter(yearsEl,  5,  2000);
        runCounter(brandsEl, 25, 2000);
        animated = true;
      }
    });
  }, { threshold: 0.5 }).observe(statsSection);
}

function runCounter(element, end, duration) {
  // FIX 3: removed unused `let start = 0` variable
  let startTime = null;
  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    element.textContent = Math.floor(progress * end);
    if (progress < 1) requestAnimationFrame(step);
    else element.textContent = end;
  };
  requestAnimationFrame(step);
}
