/* script.js */
document.addEventListener('DOMContentLoaded', () => {
  // Active nav highlight
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage || (currentPage === '' && link.getAttribute('href') === 'index.html')) {
      link.classList.add('active');
    }
  });

  // 🔹 Home Page Reload Loading Screen (Shows every time homepage loads)
  const isHomePage = (currentPage === '' || currentPage === 'index.html');
  
  if (isHomePage) {
    const loader = document.createElement('div');
    loader.id = 'site-loader';
    loader.innerHTML = '<span class="loader-text">0%</span>';
    document.body.prepend(loader);
    document.body.style.overflow = 'hidden';

    let percent = 0;
    const txt = loader.querySelector('.loader-text');
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

    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hide');
        setTimeout(() => {
          loader.remove();
          document.body.style.overflow = '';
        }, 600); // Matches CSS fade transition
      }, 3000); // Holds "Dijo Studios" for exactly 3 seconds
    });

    // Safety fallback (prevents stuck screens on very slow connections)
    setTimeout(() => {
      if (!loader.classList.contains('hide')) {
        loader.classList.add('hide');
        setTimeout(() => {
          loader.remove();
          document.body.style.overflow = '';
        }, 600);
      }
    }, 10000);
  }

  // 🔹 Scroll Reveal Animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

  // 🔹 Portfolio Uploader
  setupUploader('drop-zone', 'file-input', 'gallery', 'dijoImages');

  // 🔹 About Page Count-Up
  animateCounters();
});

function setupUploader(zoneId, inputId, galleryId, storageKey) {
  const dropZone = document.getElementById(zoneId);
  const fileInput = document.getElementById(inputId);
  const gallery = document.getElementById(galleryId);
  const clearBtn = document.getElementById('clear-btn');
  if (!dropZone || !gallery) return;

  ['dragenter','dragover','dragleave','drop'].forEach(e => dropZone.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); }));
  ['dragenter','dragover'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.add('dragover')));
  ['dragleave','drop'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.remove('dragover')));

  dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));
  if (clearBtn) clearBtn.addEventListener('click', () => { gallery.innerHTML = ''; localStorage.removeItem(storageKey); });
  loadSavedImages(storageKey);
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      const target = document.getElementById('gallery');
      if(target) target.appendChild(img);
      let images = JSON.parse(localStorage.getItem('dijoImages') || '[]');
      images.push(e.target.result);
      localStorage.setItem('dijoImages', JSON.stringify(images));
    };
    reader.readAsDataURL(file);
  });
}
function loadSavedImages(key) {
  const images = JSON.parse(localStorage.getItem(key) || '[]');
  const target = key === 'dijoImages' ? document.getElementById('gallery') : null;
  if(!target) return;
  images.forEach(src => { const el = document.createElement('img'); el.src = src; target.appendChild(el); });
}

function animateCounters() {
  const yearsEl = document.getElementById('years-count');
  const brandsEl = document.getElementById('brands-count');
  if (!yearsEl || !brandsEl) return;

  const statsSection = yearsEl.closest('.stats');
  let animated = false;

  const callback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        runCounter(yearsEl, 5, 2000);
        runCounter(brandsEl, 25, 2000);
        animated = true;
      }
    });
  };
  new IntersectionObserver(callback, { threshold: 0.5 }).observe(statsSection);
}

function runCounter(element, end, duration) {
  let start = 0;
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
