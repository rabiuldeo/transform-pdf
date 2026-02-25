/**
 * TransformPDF — UI Components Manager
 * Toasts, Lightbox, Gallery, Progress, Modals
 * Developer: Rabiul Hasan | rabiulhasan613@gmail.com
 */

'use strict';

const UI = (() => {

  /* ════════════════════════════════
     TOAST SYSTEM
  ════════════════════════════════ */
  const Toast = (() => {
    const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    function show(message, type = 'info', duration = APP_CONFIG.toastDuration) {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `
        <span class="toast__icon">${ICONS[type] || ICONS.info}</span>
        <span class="toast__msg">${message}</span>
        <button class="toast__close" aria-label="বন্ধ করুন">✕</button>
        <div class="toast__bar"></div>
      `;

      toast.querySelector('.toast__close').addEventListener('click', () => _dismiss(toast));
      container.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => toast.classList.add('toast--in'));

      const timer = setTimeout(() => _dismiss(toast), duration);
      toast._timer = timer;

      return toast;
    }

    function _dismiss(toast) {
      clearTimeout(toast._timer);
      toast.classList.remove('toast--in');
      toast.classList.add('toast--out');
      setTimeout(() => toast.remove(), 350);
    }

    return { show };
  })();

  /* ════════════════════════════════
     LIGHTBOX
  ════════════════════════════════ */
  const Lightbox = (() => {
    let _images = [];
    let _idx = 0;
    let _lb, _img, _counter, _zoomLevel = 1;

    function _update() {
      const im = _images[_idx];
      if (!im) return;
      _img.src = im.dataUrl;
      _img.alt = `পেজ ${im.pageNum}`;
      _counter.textContent = `পেজ ${im.pageNum} · ${_idx + 1} / ${_images.length} · ${im.ext.toUpperCase()} · ${im.width}×${im.height}px`;
      _zoomLevel = 1;
      _img.style.transform = '';
    }

    function _navigate(dir) {
      _idx = (_idx + dir + _images.length) % _images.length;
      _img.style.opacity = '0';
      setTimeout(() => { _update(); _img.style.opacity = '1'; }, 150);
    }

    function _zoom(delta) {
      _zoomLevel = Math.max(0.5, Math.min(3, _zoomLevel + delta));
      _img.style.transform = `scale(${_zoomLevel})`;
    }

    function init() {
      _lb = document.getElementById('lightbox');
      _img = document.getElementById('lbImage');
      _counter = document.getElementById('lbCounter');

      document.getElementById('lbClose')?.addEventListener('click', close);
      document.getElementById('lbPrev')?.addEventListener('click', () => _navigate(-1));
      document.getElementById('lbNext')?.addEventListener('click', () => _navigate(1));
      document.getElementById('lbZoomIn')?.addEventListener('click', () => _zoom(0.25));
      document.getElementById('lbZoomOut')?.addEventListener('click', () => _zoom(-0.25));
      document.getElementById('lbReset')?.addEventListener('click', () => _zoom(0));
      document.getElementById('lbDownload')?.addEventListener('click', () => {
        const im = _images[_idx];
        if (im) _downloadOne(im);
      });

      // Backdrop click
      _lb?.addEventListener('click', (e) => { if (e.target === _lb) close(); });

      // Keyboard
      document.addEventListener('keydown', (e) => {
        if (!_lb?.classList.contains('lb--open')) return;
        const map = {
          Escape: close,
          ArrowLeft: () => _navigate(-1),
          ArrowRight: () => _navigate(1),
          Equal: () => _zoom(0.25),
          Minus: () => _zoom(-0.25),
        };
        map[e.key]?.();
      });

      // Touch swipe
      let touchStartX = 0;
      _img?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
      _img?.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) _navigate(diff > 0 ? 1 : -1);
      });
    }

    function open(images, startIdx = 0) {
      _images = images;
      _idx = startIdx;
      _lb.classList.add('lb--open');
      document.body.style.overflow = 'hidden';
      _update();
    }

    function close() {
      _lb.classList.remove('lb--open');
      document.body.style.overflow = '';
    }

    return { init, open, close };
  })();

  /* ════════════════════════════════
     GALLERY
  ════════════════════════════════ */
  const Gallery = (() => {
    let _view = 'grid';
    let _allImages = [];
    const _container = () => document.getElementById('gallery');

    function _buildGridItem(img, idx) {
      const item = document.createElement('article');
      item.className = 'g-item';
      item.style.animationDelay = (idx * APP_CONFIG.animationStaggerMs) + 'ms';
      item.setAttribute('role', 'img');
      item.setAttribute('aria-label', `পেজ ${img.pageNum}`);

      item.innerHTML = `
        <div class="g-item__thumb">
          <img class="g-item__img" src="${img.dataUrl}" alt="পেজ ${img.pageNum}" loading="lazy">
          <div class="g-item__overlay">
            <button class="g-item__ov-btn" data-action="preview" title="প্রিভিউ">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <button class="g-item__ov-btn" data-action="download" title="ডাউনলোড">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
          <div class="g-item__badge">${img.ext.toUpperCase()}</div>
        </div>
        <footer class="g-item__footer">
          <span class="g-item__page">পেজ ${img.pageNum}</span>
          <span class="g-item__meta">${img.width}×${img.height}</span>
        </footer>
      `;

      item.querySelector('[data-action="preview"]').addEventListener('click', () => Lightbox.open(_allImages, idx));
      item.querySelector('[data-action="download"]').addEventListener('click', () => _downloadOne(img));
      item.addEventListener('dblclick', () => Lightbox.open(_allImages, idx));

      return item;
    }

    function _buildListItem(img, idx) {
      const item = document.createElement('article');
      item.className = 'g-item g-item--list';
      item.style.animationDelay = (idx * 30) + 'ms';
      item.innerHTML = `
        <div class="g-list__thumb">
          <img src="${img.dataUrl}" alt="পেজ ${img.pageNum}" loading="lazy">
        </div>
        <div class="g-list__info">
          <div class="g-list__page">পেজ ${img.pageNum}</div>
          <div class="g-list__meta">${img.ext.toUpperCase()} · ${img.width}×${img.height}px · ~${_fmtBytes(img.sizeEstimate)}</div>
        </div>
        <div class="g-list__actions">
          <button class="btn btn--sm btn--outline" data-action="preview">🔍 দেখুন</button>
          <button class="btn btn--sm btn--primary" data-action="download">⬇ সেভ</button>
        </div>
      `;
      item.querySelector('[data-action="preview"]').addEventListener('click', () => Lightbox.open(_allImages, idx));
      item.querySelector('[data-action="download"]').addEventListener('click', () => _downloadOne(img));
      return item;
    }

    function addImage(img, idx) {
      _allImages[idx] = img;
      const item = _view === 'list' ? _buildListItem(img, idx) : _buildGridItem(img, idx);
      _container()?.appendChild(item);

      // Trigger animation
      requestAnimationFrame(() => item.classList.add('g-item--visible'));
    }

    function rebuild() {
      clear();
      _allImages.forEach((img, i) => {
        const item = _view === 'list' ? _buildListItem(img, i) : _buildGridItem(img, i);
        _container()?.appendChild(item);
        setTimeout(() => item.classList.add('g-item--visible'), i * 40);
      });
    }

    function setView(v) {
      _view = v;
      const g = _container();
      if (!g) return;
      g.className = 'gallery' + (v === 'list' ? ' gallery--list' : '');
      rebuild();
      document.getElementById('viewGrid')?.classList.toggle('active', v === 'grid');
      document.getElementById('viewList')?.classList.toggle('active', v === 'list');
    }

    function clear() {
      _allImages = [];
      const g = _container();
      if (g) g.innerHTML = '';
    }

    function clearKeepImages() {
      const g = _container();
      if (g) g.innerHTML = '';
      _allImages.forEach((img, i) => {
        const item = _view === 'list' ? _buildListItem(img, i) : _buildGridItem(img, i);
        _container()?.appendChild(item);
        setTimeout(() => item.classList.add('g-item--visible'), i * 40);
      });
    }

    function getImages() { return [..._allImages]; }

    return { addImage, rebuild, setView, clear, getImages };
  })();

  /* ════════════════════════════════
     PROGRESS
  ════════════════════════════════ */
  const Progress = (() => {
    const STEPS = ['লোডিং', 'রেন্ডারিং', 'ফিল্টার', 'এনকোডিং', 'সম্পন্ন'];

    function show() { document.getElementById('progressSection')?.classList.add('show'); }
    function hide() { document.getElementById('progressSection')?.classList.remove('show'); }

    function update({ pct, pageNum, total }) {
      const bar = document.getElementById('progressBar');
      const pctEl = document.getElementById('progressPct');
      const label = document.getElementById('progressLabel');

      if (bar) bar.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
      if (label) label.textContent = `পেজ ${pageNum} / ${total} প্রসেস হচ্ছে...`;

      // Update steps
      const stepIdx = Math.floor((pct / 100) * (STEPS.length - 1));
      document.querySelectorAll('.p-step').forEach((el, i) => {
        el.className = 'p-step' + (i < stepIdx ? ' done' : i === stepIdx ? ' active' : '');
      });
    }

    function buildSteps() {
      const container = document.getElementById('progressSteps');
      if (!container) return;
      container.innerHTML = STEPS.map((s, i) =>
        `<div class="p-step" data-idx="${i}"><span class="p-step__dot"></span>${s}</div>`
      ).join('');
    }

    function complete() {
      update({ pct: 100, pageNum: '—', total: '—' });
      document.querySelectorAll('.p-step').forEach(el => el.className = 'p-step done');
    }

    return { show, hide, update, buildSteps, complete };
  })();

  /* ════════════════════════════════
     HELPERS
  ════════════════════════════════ */
  function _fmtBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function _downloadOne(img) {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = `পেজ-${img.pageNum}.${img.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    Toast.show(`⬇ পেজ ${img.pageNum} ডাউনলোড হচ্ছে`, 'success');
  }

  function show(id) { document.getElementById(id)?.classList.add('show'); }
  function hide(id) { document.getElementById(id)?.classList.remove('show'); }
  function setAttr(id, attr, val) { document.getElementById(id)?.setAttribute(attr, val); }
  function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
  function fmtBytes(b) { return _fmtBytes(b); }

  return {
    Toast,
    Lightbox,
    Gallery,
    Progress,
    show,
    hide,
    setAttr,
    setText,
    fmtBytes,
  };
})();

window.UI = UI;
