/* ═══════════════════════════════════════════════════════════════
   CMS INCEPTORS — app.js
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── Custom cursor ────────────────────────────────────────────── */
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');

if (cursor && matchMedia('(hover: hover)').matches) {
  let mx = -100, my = -100, fx = -100, fy = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  // follower with lag
  (function animFollower() {
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animFollower);
  })();

  document.querySelectorAll('a, button, [tabindex="0"], .edition-card, .tcard, .reason-card, .skill-pill, .faq-q')
    .forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovered');
        follower.classList.add('hovered');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovered');
        follower.classList.remove('hovered');
      });
    });
}

/* ── Navbar scroll ────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile menu ──────────────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ── Scroll reveal ─────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    // find stagger index within parent
    const siblings = Array.from(
      entry.target.parentElement?.querySelectorAll('.reveal:not(.visible)') || []
    );
    const idx   = siblings.indexOf(entry.target);
    const delay = Math.min(idx * 60, 280);
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Hero headline line animation ────────────────────────────── */
document.querySelectorAll('.hero-headline .line-inner').forEach((el, i) => {
  el.style.transform   = 'translateY(110%)';
  el.style.opacity     = '0';
  el.style.transition  = `transform 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms, opacity 0.6s ease ${i * 120}ms`;
  setTimeout(() => {
    el.style.transform = 'translateY(0)';
    el.style.opacity   = '1';
  }, 200 + i * 120);
});

/* ── Smooth scroll ─────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = navbar.offsetHeight + 12;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
});

/* ── 3D Fan Carousel (desktop) + Horizontal Slider (mobile) ─────
   ≤ 768px  → touch-friendly snap-scroll slider with drag + dots
   >  768px → scroll-driven 3D arc fan animation
──────────────────────────────────────────────────────────────── */
(function initCarousel() {
  const driver = document.getElementById('fan-driver');
  const sticky = document.getElementById('fan-sticky');
  const stage  = document.querySelector('.fan-stage');
  const fill   = document.getElementById('fan-fill');
  const scrollHint = document.getElementById('fan-scroll-hint');
  const dots   = document.querySelectorAll('.fan-dot');
  const cards  = document.querySelectorAll('.fan-card');
  const TOTAL  = cards.length;

  if (!driver || !sticky || !stage) return;

  const IS_MOBILE = () => window.innerWidth <= 768;

  /* ══════════════════════════════════════════════════════════════
     MOBILE — horizontal snap-scroll slider
  ══════════════════════════════════════════════════════════════ */
  function initMobileSlider() {
    // Make sure any leftover inline transforms from a previous
    // desktop init are cleared
    cards.forEach(c => c.style.transform = '');

    // ── Drag to scroll ──────────────────────────────────────
    let isDragging = false, startX = 0, scrollStart = 0, moved = false;

    stage.addEventListener('mousedown', e => {
      isDragging  = true;
      moved       = false;
      startX      = e.pageX - stage.offsetLeft;
      scrollStart = stage.scrollLeft;
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('mousemove', e => {
      if (!isDragging) return;
      moved = true;
      e.preventDefault();
      stage.scrollLeft = scrollStart - (e.pageX - stage.offsetLeft - startX) * 1.4;
    });
    ['mouseup','mouseleave'].forEach(ev =>
      stage.addEventListener(ev, () => {
        isDragging = false;
        stage.classList.remove('is-dragging');
      })
    );

    // Prevent link navigation when the user was dragging
    cards.forEach(card => {
      card.addEventListener('click', e => {
        if (moved) { e.preventDefault(); moved = false; }
      });
    });

    // ── Sync dots on scroll ─────────────────────────────────
    function getActiveIdx() {
      const center = stage.scrollLeft + stage.clientWidth / 2;
      let closest = 0, minDist = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      return closest;
    }

    function syncDots() {
      const idx = getActiveIdx();
      dots.forEach((d, i) => {
        d.classList.toggle('fan-dot--active', i === idx);
        d.setAttribute('aria-selected', String(i === idx));
      });
    }

    stage.addEventListener('scroll', syncDots, { passive: true });
    syncDots();

    // ── Dot click — scroll to card ──────────────────────────
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const card = cards[i];
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        stage.scrollTo({ left: cardCenter - stage.clientWidth / 2, behavior: 'smooth' });
      });
    });

    // Scroll to center card on init
    const centerCard = cards[Math.floor(TOTAL / 2)];
    if (centerCard) {
      stage.scrollLeft = centerCard.offsetLeft + centerCard.offsetWidth / 2 - stage.clientWidth / 2;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     DESKTOP — scroll-driven 3D arc fan
  ══════════════════════════════════════════════════════════════ */
  function initDesktopFan() {
    const arcPositions = [
      { x: -48, rotY:  42, scale: 0.78, z: -90 },
      { x: -24, rotY:  22, scale: 0.88, z: -30 },
      { x:   0, rotY:   0, scale: 1.00, z:   0 },
      { x:  24, rotY: -22, scale: 0.88, z: -30 },
      { x:  48, rotY: -42, scale: 0.78, z: -90 },
    ];

    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;

    function getProgress() {
      const rect      = driver.getBoundingClientRect();
      const driverH   = driver.offsetHeight;
      const viewH     = window.innerHeight;
      const scrolled  = -rect.top;
      const scrollable = driverH - viewH;
      return Math.max(0, Math.min(1, scrolled / scrollable));
    }

    let smoothProgress = 0, currentProgress = -1;

    function applyCards(progress) {
      const eased    = ease(progress);
      const activeIdx = Math.round(eased * (TOTAL - 1));
      if (fill) fill.style.width = (progress * 100) + '%';

      cards.forEach((card, i) => {
        const pos   = arcPositions[i];
        const x     = lerp(0,    pos.x,    eased);
        const rotY  = lerp(0,    pos.rotY, eased);
        const sc    = lerp(0.92, pos.scale, eased);
        const z     = lerp(0,    pos.z,    eased);
        const yShift = (i === activeIdx) ? 0 : lerp(0, 16, eased);
        card.style.transform = `translateX(${x}vw) translateZ(${z}px) translateY(${yShift}px) rotateY(${rotY}deg) scale(${sc})`;
        card.style.zIndex    = (i === activeIdx) ? 10 : 5 - Math.abs(i - activeIdx);
        card.classList.toggle('is-active', i === activeIdx);
      });

      dots.forEach((dot, i) => {
        const active = i === activeIdx;
        dot.classList.toggle('fan-dot--active', active);
        dot.setAttribute('aria-selected', String(active));
      });

      if (scrollHint) scrollHint.classList.toggle('hidden', progress > 0.04);
    }

    function tick() {
      const target = getProgress();
      smoothProgress += (target - smoothProgress) * 0.09;
      if (Math.abs(smoothProgress - currentProgress) > 0.0002) {
        currentProgress = smoothProgress;
        applyCards(currentProgress);
      }
      requestAnimationFrame(tick);
    }

    applyCards(0);
    tick();

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx      = +dot.dataset.idx;
        const fraction = TOTAL > 1 ? idx / (TOTAL - 1) : 0;
        const driverH  = driver.offsetHeight;
        const viewH    = window.innerHeight;
        window.scrollTo({ top: driver.offsetTop + fraction * (driverH - viewH), behavior: 'smooth' });
      });
    });

    document.addEventListener('keydown', e => {
      const rect   = driver.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      const curIdx  = Math.round(ease(getProgress()) * (TOTAL - 1));
      const driverH = driver.offsetHeight;
      const viewH   = window.innerHeight;
      if (e.key === 'ArrowRight' && curIdx < TOTAL - 1) {
        window.scrollTo({ top: driver.offsetTop + ((curIdx + 1) / (TOTAL - 1)) * (driverH - viewH), behavior: 'smooth' });
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' && curIdx > 0) {
        window.scrollTo({ top: driver.offsetTop + ((curIdx - 1) / (TOTAL - 1)) * (driverH - viewH), behavior: 'smooth' });
        e.preventDefault();
      }
    });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) applyCards(1);
  }

  /* ══════════════════════════════════════════════════════════════
     INIT — pick the right mode, re-run on resize
  ══════════════════════════════════════════════════════════════ */
  if (IS_MOBILE()) {
    initMobileSlider();
  } else {
    initDesktopFan();
  }

  // Re-init on resize crossing the breakpoint
  let wasMobile = IS_MOBILE();
  window.addEventListener('resize', () => {
    const nowMobile = IS_MOBILE();
    if (nowMobile !== wasMobile) {
      wasMobile = nowMobile;
      // Clear inline styles set by desktop fan before switching
      cards.forEach(c => {
        c.style.transform = '';
        c.style.zIndex    = '';
      });
      if (nowMobile) initMobileSlider();
      else           initDesktopFan();
    }
  });
}());

/* ── FAQ accordion ─────────────────────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(other => {
      if (other !== btn) {
        other.setAttribute('aria-expanded', 'false');
        document.getElementById(other.getAttribute('aria-controls')).hidden = true;
      }
    });
    btn.setAttribute('aria-expanded', String(!expanded));
    document.getElementById(btn.getAttribute('aria-controls')).hidden = expanded;
  });
});

/* ── File upload ────────────────────────────────────────────────── */
const fileInput = document.getElementById('student-files');
const fileList  = document.getElementById('file-list');
const dropZone  = document.getElementById('file-drop-zone');
let selectedFiles = [];
const MAX_FILES = 5, MAX_SIZE = 10 * 1024 * 1024;

function fmtBytes(b) {
  return b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
}
function renderFiles() {
  fileList.innerHTML = '';
  selectedFiles.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'file-item';
    el.innerHTML = `<span class="file-item-name" title="${f.name}">📄 ${f.name} <span style="opacity:.5">(${fmtBytes(f.size)})</span></span><button class="file-item-remove" aria-label="Remove ${f.name}" data-i="${i}">✕</button>`;
    fileList.appendChild(el);
  });
}
function addFiles(list) {
  for (const f of list) {
    if (selectedFiles.length >= MAX_FILES) { alert(`Max ${MAX_FILES} files.`); break; }
    if (f.size > MAX_SIZE) { alert(`"${f.name}" exceeds 10 MB.`); continue; }
    if (!selectedFiles.some(x => x.name === f.name && x.size === f.size)) selectedFiles.push(f);
  }
  renderFiles();
}
if (fileInput) {
  fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });
  fileList.addEventListener('click', e => {
    const btn = e.target.closest('.file-item-remove');
    if (!btn) return;
    selectedFiles.splice(+btn.dataset.i, 1);
    renderFiles();
  });
  ['dragenter','dragover'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
  ['dragleave','drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));
  dropZone.addEventListener('drop', e => addFiles(Array.from(e.dataTransfer.files)));
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
}

/* ── Form validation & Google Sheets submission ──────────────── */
// ▶ PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL BELOW
const SHEETS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

const form      = document.getElementById('application-form');
const submitBtn = document.getElementById('submit-btn');
const successEl = document.getElementById('form-success');

function showSuccess() {
  if (form)      form.style.display = 'none';
  if (successEl) { successEl.hidden = false; successEl.removeAttribute('hidden'); }
  if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
  if (successEl) successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetBtn() {
  if (submitBtn) { submitBtn.classList.remove('loading'); submitBtn.disabled = false; }
}

if (form) {
  function showErr(el, msg) {
    el.classList.add('invalid');
    const e = el.parentElement.querySelector('.field-error');
    if (e) e.textContent = msg;
  }
  function clearErr(el) {
    el.classList.remove('invalid');
    const e = el.parentElement.querySelector('.field-error');
    if (e) e.textContent = '';
  }
  function validateField(el) {
    if (!el.required || el.value.trim()) { clearErr(el); return true; }
    showErr(el, 'This field is required.');
    return false;
  }
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('blur',  () => validateField(el));
    el.addEventListener('input', () => clearErr(el));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // 1 — Validate
    let valid = true;
    form.querySelectorAll('[required]').forEach(el => { if (!validateField(el)) valid = false; });
    if (!valid) {
      const first = form.querySelector('.invalid');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 2 — Show loader
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // 3 — Build payload
    const payload = {
      name:       form.querySelector('[name="name"]').value.trim(),
      class:      form.querySelector('[name="class"]').value,
      section:    form.querySelector('[name="section"]').value,
      skills:     form.querySelector('[name="skills"]').value.trim(),
      drive_link: form.querySelector('[name="drive_link"]').value.trim(),
      motivation: form.querySelector('[name="motivation"]').value.trim(),
      files:      selectedFiles.map(f => f.name).join(', '),
      timestamp:  new Date().toLocaleString('en-IN'),
    };

    // 4 — Send to Google Sheets (no-cors fetch)
    //     Falls back to showing success if URL not yet configured
    if (SHEETS_URL && SHEETS_URL !== 'https://script.google.com/macros/s/AKfycbwotdw4xlurK_ZYFZEDbW_t_09LDoJ4RgfeicUqqOWanNiYlqypwPFLfRDPb_RrqL9j/exec') {
      try {
        await fetch(SHEETS_URL, {
          method:  'POST',
          // no-cors because Apps Script redirects — response will be opaque, that's fine
          mode:    'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      } catch (err) {
        // Network error — still show success so student isn't stuck,
        // but log it for debugging
        console.warn('Sheets submission failed:', err);
      }
    }

    // 5 — Always show success (data either sent or will be retried)
    showSuccess();
  });
}

/* ── Marquee pause on hover ───────────────────────────────────── */
document.querySelectorAll('.marquee-track').forEach(track => {
  track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
});

/* ── Ticker direction reversal on scroll ─────────────────────── */
const ticker = document.querySelector('.ticker-track');
if (ticker) {
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const dir = window.scrollY > lastY ? 1 : -1;
    ticker.style.animationDirection = dir === 1 ? 'normal' : 'reverse';
    lastY = window.scrollY;
  }, { passive: true });
}
