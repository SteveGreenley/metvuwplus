(function () {
  'use strict';

  // ===== CONSTANTS =====
  const TYPES = ['rain', 'wind1000', 'wind850', 'wind700', 'wind500', 'wind300', 'wind250'];
  const TYPE_LABELS = {
    rain: 'Rain',
    wind1000: 'Wind 1000mb',
    wind850: 'Wind 850mb',
    wind700: 'Wind 700mb',
    wind500: 'Wind 500mb',
    wind300: 'Wind 300mb',
    wind250: 'Wind 250mb',
  };
  const REGIONS = [
    { id: 'nz', label: 'New Zealand' },
    { id: 'nzni', label: 'North Island' },
    { id: 'nzsi', label: 'South Island' },
    { id: 'ncal', label: 'New Caledonia' },
    { id: 'fiji', label: 'Fiji' },
    { id: 'swpac', label: 'SW Pacific' },
    { id: 'spac', label: 'S Pacific' },
    { id: 'pac', label: 'Pacific Islands' },
    { id: 'samoa', label: 'Samoa' },
    { id: 'tonga', label: 'Tonga' },
    { id: 'cook', label: 'Cook Islands' },
    { id: 'tahiti', label: 'Tahiti' },
    { id: 'hawaii', label: 'Hawaii' },
    { id: 'perth', label: 'Perth WA' },
    { id: 'wa', label: 'Western Australia' },
    { id: 'sa', label: 'South Australia' },
    { id: 'seau', label: 'SE Australia' },
    { id: 'qld', label: 'Queensland' },
    { id: 'nsw', label: 'NSW' },
    { id: 'vic', label: 'Victoria/Tasmania' },
    { id: 'world', label: 'World' },
    { id: 'europe', label: 'Europe' },
    { id: 'uk', label: 'UK' },
    { id: 'japan', label: 'Japan' },
    { id: 'usa', label: 'USA' },
  ];
  const DAYS_OPTIONS = [1, 3, 4, 5, 6, 7, 8, 10];
  const SPEED_STEPS = [300, 500, 800, 1200, 2000];

  // ===== STATE =====
  let thumbnails = [];
  let scaleImageSrc = null;
  let currentIndex = -1;
  let lightboxOpen = false;
  let lightboxIndex = 0;
  let isPlaying = false;
  let playSpeedIndex = 0; // default 400ms
  let playIntervalId = null;

  // ===== PAGE TYPE =====
  const PAGE_TYPE = (() => {
    const path = window.location.pathname;
    if (path.includes('forecast.php')) return 'forecast';
    if (path.includes('satellite'))    return 'satellite';
    if (path.includes('radar'))        return 'radar';
    return null;
  })();

  // ===== PARSE URL PARAMS (forecast only) =====
  const params = new URLSearchParams(window.location.search);
  const currentType   = params.get('type')      || 'rain';
  const currentRegion = params.get('region')    || 'nz';
  const currentDays   = params.get('noofdays')  || '10';

  // ===== SCALE IMAGE DISCOVERY =====
  function discoverScaleImage() {
    if (PAGE_TYPE === 'forecast') {
      for (const img of document.querySelectorAll('img')) {
        const src = img.getAttribute('src') || '';
        if (src.includes('scale') && !src.includes('rainrate')) return img.src;
      }
    } else if (PAGE_TYPE === 'radar') {
      const img = document.querySelector('img[src*="radarscale"]');
      return img ? img.src : null;
    }
    return null;
  }

  // ===== THUMBNAIL DISCOVERY =====
  function discoverThumbnails() {
    if (PAGE_TYPE === 'forecast')  return discoverForecastThumbnails();
    if (PAGE_TYPE === 'satellite') return discoverSatelliteThumbnails();
    if (PAGE_TYPE === 'radar')     return discoverRadarThumbnails();
    return [];
  }

  function discoverForecastThumbnails() {
    const found = [];
    document.querySelectorAll('a > img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src.includes('-thumb-') || src.includes('pageheaders/scale')) return;
      const fullSrc = src.replace(/-thumb-/, '-');
      const hoursMatch = src.match(/-(\d{3})\.gif$/);
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
      found.push({ img, thumbSrc: src, fullSrc, label: formatHoursLabel(hours) });
    });
    return found;
  }

  function discoverSatelliteThumbnails() {
    const found = [];
    document.querySelectorAll('a > img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src.includes('/small/')) return;
      const fullSrc = src.replace('/small/', '/big/');
      found.push({ img, thumbSrc: src, fullSrc, label: formatTimestampLabel(src, /(\d{12})\.jpg/i) });
    });
    return found;
  }

  function discoverRadarThumbnails() {
    const found = [];
    document.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (!src.includes('/images/') || src.includes('pageheaders')) return;
      found.push({ img, thumbSrc: src, fullSrc: src, label: formatRadarLabel(src) });
    });
    return found;
  }

  // ===== LABEL FORMATTERS =====
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatHoursLabel(hours) {
    if (hours < 24) return `+${hours}h`;
    const days = Math.floor(hours / 24);
    const rem  = hours % 24;
    return rem === 0 ? `Day ${days}` : `Day ${days}+${rem}h`;
  }

  function formatTimestampLabel(src, pattern) {
    // Extracts YYYYMMDDHHMM from the src and formats as "1 Jan 09:00 UTC"
    const m = src.match(pattern);
    if (!m) return '';
    const ts  = m[1];
    const day = parseInt(ts.slice(6, 8));
    const mon = MONTHS[parseInt(ts.slice(4, 6)) - 1];
    return `${day} ${mon} ${ts.slice(8, 10)}:${ts.slice(10, 12)} UTC`;
  }

  function formatRadarLabel(src) {
    // ./images/202603230300Z_nl.gif
    const m = src.match(/(\d{8})(\d{4})Z_(\w+)\.gif/i);
    if (!m) return '';
    const day    = parseInt(m[1].slice(6, 8));
    const mon    = MONTHS[parseInt(m[1].slice(4, 6)) - 1];
    const region = m[3].toUpperCase();
    return `${region} — ${day} ${mon} ${m[2].slice(0, 2)}:${m[2].slice(2, 4)} UTC`;
  }

  // ===== VISUAL SELECTION =====
  function selectThumbnail(index, scroll) {
    if (thumbnails.length === 0) return;
    index = ((index % thumbnails.length) + thumbnails.length) % thumbnails.length;
    if (currentIndex >= 0 && currentIndex < thumbnails.length) {
      thumbnails[currentIndex].img.classList.remove('mvp-selected');
    }
    currentIndex = index;
    thumbnails[currentIndex].img.classList.add('mvp-selected');
    if (scroll !== false) {
      thumbnails[currentIndex].img.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ===== TYPE NAVIGATION =====
  function navigateType(direction) {
    const idx = TYPES.indexOf(currentType);
    if (idx === -1) return;
    const newIdx = ((idx + direction) % TYPES.length + TYPES.length) % TYPES.length;
    const newType = TYPES[newIdx];
    const url = buildUrl(newType, currentRegion, currentDays);
    window.location.href = url;
  }

  // ===== REGION NAVIGATION =====
  function navigateRegion(direction) {
    const regionIds = REGIONS.map((r) => r.id);
    const idx = regionIds.indexOf(currentRegion);
    if (idx === -1) return;
    const newIdx = ((idx + direction) % regionIds.length + regionIds.length) % regionIds.length;
    const newRegion = regionIds[newIdx];
    const url = buildUrl(currentType, newRegion, currentDays);
    window.location.href = url;
  }

  function buildUrl(type, region, days) {
    return `/forecast/forecast.php?type=${type}&region=${region}&noofdays=${days}`;
  }

  // ===== LIGHTBOX DOM =====
  function createLightbox() {
    const lb = document.createElement('div');
    lb.id = 'mvp-lightbox';
    lb.innerHTML = `
      <div id="mvp-lightbox-backdrop"></div>
      <div id="mvp-lightbox-container">
        <button id="mvp-lightbox-close" title="Close (Esc)">✕</button>
        <button id="mvp-lightbox-prev" title="Previous (←)">&#8249;</button>
        <button id="mvp-lightbox-next" title="Next (→)">&#8250;</button>
        <div id="mvp-lightbox-img-wrap">
          <div id="mvp-lightbox-img-frame">
            <img id="mvp-lightbox-img" src="" alt="Forecast map" />
            <div id="mvp-lightbox-error">Image not available</div>
          </div>
          <img id="mvp-lightbox-scale" src="" alt="Legend" />
        </div>
        <div id="mvp-lightbox-bar">
          <div id="mvp-lightbox-progress">
            <span id="mvp-lightbox-frame-label"></span>
            <div id="mvp-lightbox-progress-bar"></div>
          </div>
          <button id="mvp-lightbox-play" title="Play/Pause (Space)">▶ Play</button>
          <div id="mvp-lightbox-speed-group">
            <button id="mvp-lightbox-slower" title="Slower (-)">slower</button>
            <span id="mvp-lightbox-speed-label"></span>
            <button id="mvp-lightbox-faster" title="Faster (+)">faster</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(lb);
    if (PAGE_TYPE === 'radar') lb.classList.add('mvp-radar-mode');

    lb.querySelector('#mvp-lightbox-backdrop').addEventListener('click', closeLightbox);
    lb.querySelector('#mvp-lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('#mvp-lightbox-prev').addEventListener('click', () => lightboxNav(-1));
    lb.querySelector('#mvp-lightbox-next').addEventListener('click', () => lightboxNav(1));
    lb.querySelector('#mvp-lightbox-play').addEventListener('click', toggleSlideshow);
    lb.querySelector('#mvp-lightbox-slower').addEventListener('click', () => adjustSpeed(1));
    lb.querySelector('#mvp-lightbox-faster').addEventListener('click', () => adjustSpeed(-1));

    // Build one segment per thumbnail — clicking seeks to that frame.
    const progressBar = lb.querySelector('#mvp-lightbox-progress-bar');
    thumbnails.forEach((t, i) => {
      const seg = document.createElement('div');
      seg.className = 'mvp-progress-seg';
      seg.title = t.label;
      seg.addEventListener('click', () => {
        stopSlideshow();
        updateLightboxImage(i);
        _wasPlayingBeforeScrub = false; // prevent mouseleave from restarting
      });
      // Scrubbing: show this frame immediately on hover.
      seg.addEventListener('mouseenter', () => {
        updateLightboxImage(i);
      });
      progressBar.appendChild(seg);
    });

    // Pause on scrub entry, resume on exit.
    let _wasPlayingBeforeScrub = false;
    progressBar.addEventListener('mouseenter', () => {
      _wasPlayingBeforeScrub = isPlaying;
      stopSlideshow();
    });
    progressBar.addEventListener('mouseleave', () => {
      if (_wasPlayingBeforeScrub) startSlideshow();
    });

    // No load/error handlers here — updateLightboxImage manages visibility
    // via a preload Image object to avoid flicker.
  }

  function openLightbox(index) {
    lightboxOpen = true;
    lightboxIndex = index;
    document.getElementById('mvp-lightbox').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateLightboxImage(index);
    startSlideshow();
  }

  function closeLightbox() {
    lightboxOpen = false;
    stopSlideshow();
    document.getElementById('mvp-lightbox').style.display = 'none';
    document.body.style.overflow = '';
  }

  // Tracks the in-flight preload so a superseded load is ignored.
  let _pendingLoader = null;

  function updateLightboxImage(index) {
    index = ((index % thumbnails.length) + thumbnails.length) % thumbnails.length;
    lightboxIndex = index;
    const t = thumbnails[index];

    // Update progress bar and frame label immediately.
    document.getElementById('mvp-lightbox-frame-label').textContent = t.label;
    document.querySelectorAll('.mvp-progress-seg').forEach((seg, i) => {
      seg.classList.toggle('mvp-progress-past', i < index);
      seg.classList.toggle('mvp-progress-active', i === index);
    });
    updateSpeedLabel();

    // Preload the new image before touching the visible <img>.  The previous
    // frame stays on screen until the new one is ready, eliminating the blank
    // flash caused by hiding the image before the new src has loaded.
    const loader = new Image();
    _pendingLoader = loader;

    loader.onload = () => {
      if (loader !== _pendingLoader) return; // superseded by a later request
      const img = document.getElementById('mvp-lightbox-img');
      const err = document.getElementById('mvp-lightbox-error');
      img.src = t.fullSrc;
      img.style.display = 'block';
      img.style.visibility = '';
      err.style.display = 'none';
      const scale = document.getElementById('mvp-lightbox-scale');
      if (scale && scaleImageSrc) {
        scale.src = scaleImageSrc;
        scale.style.height = img.offsetHeight + 'px';
        scale.style.width = 'auto';
        scale.style.display = 'block';
      }
    };

    loader.onerror = () => {
      if (loader !== _pendingLoader) return;
      const img = document.getElementById('mvp-lightbox-img');
      // Keep display:block so the frame holds its size; just hide the pixels.
      img.style.display = 'block';
      img.style.visibility = 'hidden';
      document.getElementById('mvp-lightbox-error').style.display = 'flex';
    };

    loader.src = t.fullSrc;

    // Preload adjacent frames
    [index - 1, index + 1].forEach((i) => {
      const adj = ((i % thumbnails.length) + thumbnails.length) % thumbnails.length;
      new Image().src = thumbnails[adj].fullSrc;
    });
  }

  function lightboxNav(direction) {
    stopSlideshow();
    updateLightboxImage(lightboxIndex + direction);
  }

  // ===== SLIDESHOW =====
  function toggleSlideshow() {
    if (isPlaying) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  }

  function startSlideshow() {
    isPlaying = true;
    updatePlayButton();
    playIntervalId = setInterval(() => {
      if (lightboxOpen) {
        const next = (lightboxIndex + 1) % thumbnails.length;
        updateLightboxImage(next);
      } else {
        const next = currentIndex >= 0
          ? (currentIndex + 1) % thumbnails.length
          : 0;
        selectThumbnail(next);
      }
    }, SPEED_STEPS[playSpeedIndex]);
  }

  function stopSlideshow() {
    if (!isPlaying) return;
    isPlaying = false;
    clearInterval(playIntervalId);
    playIntervalId = null;
    updatePlayButton();
  }

  function adjustSpeed(direction) {
    const wasPlaying = isPlaying;
    if (wasPlaying) stopSlideshow();
    playSpeedIndex = Math.max(0, Math.min(SPEED_STEPS.length - 1, playSpeedIndex + direction));
    updateSpeedLabel();
    if (wasPlaying) startSlideshow();
  }

  function updatePlayButton() {
    const btn = document.getElementById('mvp-lightbox-play');
    if (!btn) return;
    btn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
  }

  function updateSpeedLabel() {
    const el = document.getElementById('mvp-lightbox-speed-label');
    if (!el) return;
    el.textContent = `${SPEED_STEPS[playSpeedIndex]}ms`;
  }

  // ===== KEYBOARD HANDLER =====
  document.addEventListener('keydown', function (e) {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (lightboxOpen) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          stopSlideshow();
          updateLightboxImage(lightboxIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          stopSlideshow();
          updateLightboxImage(lightboxIndex + 1);
          break;
        case 'Escape':
          e.preventDefault();
          closeLightbox();
          break;
        case ' ':
          e.preventDefault();
          toggleSlideshow();
          break;
        case '+':
        case '=':
          e.preventDefault();
          adjustSpeed(-1);
          break;
        case '-':
          e.preventDefault();
          adjustSpeed(1);
          break;
      }
      return;
    }

    // Main page shortcuts
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        stopSlideshow();
        selectThumbnail(currentIndex <= 0 ? thumbnails.length - 1 : currentIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        stopSlideshow();
        selectThumbnail(currentIndex < 0 ? 0 : (currentIndex + 1) % thumbnails.length);
        break;
      case 'ArrowUp':
        if (PAGE_TYPE === 'forecast') {
          e.preventDefault();
          if (e.shiftKey) navigateRegion(-1); else navigateType(-1);
        }
        break;
      case 'ArrowDown':
        if (PAGE_TYPE === 'forecast') {
          e.preventDefault();
          if (e.shiftKey) navigateRegion(1); else navigateType(1);
        }
        break;
      case 'Enter':
        if (currentIndex >= 0) {
          e.preventDefault();
          openLightbox(currentIndex);
        }
        break;
      case '+':
      case '=':
        e.preventDefault();
        adjustSpeed(-1);
        break;
      case '-':
        e.preventDefault();
        adjustSpeed(1);
        break;
    }
  });

  // ===== SAVE PREFS BUTTON =====
  function createSavePrefsButton() {
    const btn = document.createElement('button');
    btn.id = 'mvp-save-prefs';
    btn.title = 'Save current view as default (opens popup)';
    btn.textContent = '★ Save as default';
    btn.addEventListener('click', () => {
      chrome.storage.sync.set({
        preferredType: currentType,
        preferredRegion: currentRegion,
        preferredDays: currentDays,
        prefsEnabled: true,
      }, () => {
        btn.textContent = '✓ Saved!';
        setTimeout(() => { btn.textContent = '★ Save as default'; }, 2000);
      });
    });
    document.body.appendChild(btn);
  }

  // ===== INIT =====
  function init() {
    thumbnails = discoverThumbnails();
    if (thumbnails.length === 0) return;
    scaleImageSrc = discoverScaleImage();

    // Use a capture-phase listener on document so we intercept thumbnail clicks
    // before any bubble-phase listeners on the page (including those that call
    // window.open). Capture always fires before bubble, regardless of which
    // script registered the bubble listener.
    thumbnails.forEach((t) => { t.img.style.cursor = 'pointer'; });

    document.addEventListener('click', (e) => {
      const img = e.target.closest
        ? e.target.closest('img')
        : (e.target.tagName === 'IMG' ? e.target : null);
      if (!img) return;
      const idx = thumbnails.findIndex((t) => t.img === img);
      if (idx === -1) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      selectThumbnail(idx, false);
      openLightbox(idx);
    }, true); // true = capture phase

    createLightbox();
    if (PAGE_TYPE === 'forecast') createSavePrefsButton();

    // Select first thumbnail to show keyboard nav is active
    selectThumbnail(0, false);
  }

  init();
})();
