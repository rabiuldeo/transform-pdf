/**
 * TransformPDF — Application Controller
 * Main entry point — orchestrates all modules
 * Developer: Rabiul Hasan | rabiulhasan613@gmail.com
 */

'use strict';

const App = (() => {

  /* ── State ── */
  let _fileInfo = null;
  let _convertedImages = [];
  let _convertElapsed = '0';

  /* ════════════════════════════════
     BOOT
  ════════════════════════════════ */
  function init() {
    ThemeManager.init();
    CanvasAnimator.init('bgCanvas');
    UI.Lightbox.init();
    PWAManager.init();

    _bindEvents();
    _bindSettings();
    _buildDPIPresets();
    _initCounterAnimation();

    // Intro fade
    document.getElementById('mainContent')?.classList.add('content--ready');
    UI.Toast.show('👋 স্বাগতম! PDF ফাইল আপলোড করুন', 'info');
  }

  /* ════════════════════════════════
     EVENT BINDING
  ════════════════════════════════ */
  function _bindEvents() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', ThemeManager.toggle);

    // File input
    document.getElementById('fileInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) _handleFile(file);
    });

    // Upload zone
    const zone = document.getElementById('uploadZone');
    zone?.addEventListener('click', () => document.getElementById('fileInput')?.click());
    zone?.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag--over'); });
    zone?.addEventListener('dragleave', () => zone.classList.remove('drag--over'));
    zone?.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag--over');
      const file = e.dataTransfer.files[0];
      if (file?.type === 'application/pdf') _handleFile(file);
      else UI.Toast.show('❌ শুধুমাত্র PDF ফাইল গ্রহণযোগ্য', 'error');
    });

    // CTA Buttons
    document.getElementById('convertBtn')?.addEventListener('click', _startConvert);
    document.getElementById('resetBtn')?.addEventListener('click', _reset);
    document.getElementById('downloadZipBtn')?.addEventListener('click', _downloadZip);
    document.getElementById('copyStatsBtn')?.addEventListener('click', _copyStats);
    document.getElementById('downloadAllJpgBtn')?.addEventListener('click', () => _downloadAllFormat('jpg'));

    // View toggle
    document.getElementById('viewGrid')?.addEventListener('click', () => UI.Gallery.setView('grid'));
    document.getElementById('viewList')?.addEventListener('click', () => UI.Gallery.setView('list'));

    // Scroll reveal
    _initScrollReveal();
  }

  /* ════════════════════════════════
     SETTINGS BINDING
  ════════════════════════════════ */
  function _bindSettings() {
    // Format chips
    document.querySelectorAll('[data-format]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        PDFConverter.setSettings({ format: btn.dataset.format });
      });
    });

    // Background chips
    document.querySelectorAll('[data-bg]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-bg]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        PDFConverter.setSettings({ background: btn.dataset.bg });
      });
    });

    // Color mode select
    document.getElementById('colorMode')?.addEventListener('change', (e) => {
      PDFConverter.setSettings({ colorMode: e.target.value });
    });

    // DPI slider
    const dpiRange = document.getElementById('dpiRange');
    dpiRange?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      PDFConverter.setSettings({ dpi: val });
      _syncSlider('dpi', val, 72, 300);
      UI.setText('dpiValue', val + ' DPI');
    });

    // Quality slider
    const qualRange = document.getElementById('qualRange');
    qualRange?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      PDFConverter.setSettings({ quality: val });
      _syncSlider('qual', val, 60, 100);
      UI.setText('qualValue', val + '%');
    });

    // Page range
    document.getElementById('pageFrom')?.addEventListener('change', (e) => {
      PDFConverter.setSettings({ pageFrom: parseInt(e.target.value) || 1 });
    });
    document.getElementById('pageTo')?.addEventListener('change', (e) => {
      PDFConverter.setSettings({ pageTo: parseInt(e.target.value) || null });
    });
  }

  function _syncSlider(id, val, min, max) {
    const pct = ((val - min) / (max - min)) * 100;
    document.getElementById(id + 'Fill')?.style && (document.getElementById(id + 'Fill').style.width = pct + '%');
    document.getElementById(id + 'Thumb')?.style && (document.getElementById(id + 'Thumb').style.left = pct + '%');
  }

  function _buildDPIPresets() {
    const container = document.getElementById('dpiPresets');
    if (!container) return;
    APP_CONFIG.dpi.presets.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        const range = document.getElementById('dpiRange');
        if (range) { range.value = p.value; range.dispatchEvent(new Event('input')); }
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      container.appendChild(btn);
    });
  }

  /* ════════════════════════════════
     FILE HANDLING
  ════════════════════════════════ */
  async function _handleFile(file) {
    _convertedImages = [];
    UI.Gallery.clear();
    _hideResults();

    try {
      const info = await PDFConverter.loadPDF(file);
      _fileInfo = { ...info, file };

      // Update file info bar
      UI.show('fileMetaBar');
      UI.setText('metaFileName', file.name);
      UI.setText('metaFileDate', _formatDate());
      UI.setText('metaPageCount', info.pageCount + ' পেজ');
      UI.setText('metaFileSize', UI.fmtBytes(file.size));

      const pageTo = document.getElementById('pageTo');
      if (pageTo) { pageTo.placeholder = info.pageCount; pageTo.max = info.pageCount; }
      const pageFrom = document.getElementById('pageFrom');
      if (pageFrom) pageFrom.max = info.pageCount;

      UI.show('actionBar');
      UI.Toast.show(`✅ "${_truncate(file.name, 30)}" — ${info.pageCount} পেজ লোড হয়েছে`, 'success');

      // Scroll to action
      document.getElementById('actionBar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      const msgs = {
        INVALID_FILE: 'শুধুমাত্র PDF ফাইল গ্রহণযোগ্য',
        FILE_TOO_LARGE: `ফাইল সাইজ সর্বোচ্চ ${APP_CONFIG.limits.maxFileSizeMB}MB`,
      };
      UI.Toast.show('❌ ' + (msgs[err.message] || 'PDF লোড ব্যর্থ'), 'error');
    }
  }

  /* ════════════════════════════════
     CONVERSION
  ════════════════════════════════ */
  async function _startConvert() {
    if (PDFConverter.isConverting()) return;

    _convertedImages = [];
    UI.Gallery.clear();
    _hideResults();

    UI.show('progressSection');
    UI.Progress.buildSteps();
    UI.Progress.show();

    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
      convertBtn.disabled = true;
      convertBtn.innerHTML = `<span class="btn__spinner"></span> রূপান্তর হচ্ছে...`;
    }

    await PDFConverter.convert({
      onProgress: ({ pct, pageNum, total }) => {
        UI.Progress.update({ pct, pageNum, total });
      },
      onPageDone: (img, idx) => {
        _convertedImages.push(img);
        UI.Gallery.addImage(img, idx);
      },
      onComplete: ({ elapsed, total }) => {
        _convertElapsed = elapsed;
        UI.Progress.complete();

        setTimeout(() => {
          UI.Progress.hide();
          document.getElementById('progressSection')?.classList.remove('show');

          if (convertBtn) {
            convertBtn.disabled = false;
            convertBtn.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> আবার রূপান্তর করুন`;
          }

          // Show results header
          UI.show('resultsHeader');
          UI.setText('resultCount', total + 'টি ছবি');
          document.getElementById('downloadZipBtn').style.display = 'flex';
          document.getElementById('copyStatsBtn').style.display = 'flex';
          document.getElementById('downloadAllJpgBtn').style.display = 'flex';

          UI.Toast.show(`🎉 ${total}টি ছবি তৈরি — ${elapsed} সেকেন্ড`, 'success');

          // Scroll to gallery
          document.getElementById('resultsHeader')?.scrollIntoView({ behavior: 'smooth' });
        }, 700);
      },
      onError: (msg) => {
        UI.Progress.hide();
        document.getElementById('progressSection')?.classList.remove('show');
        if (convertBtn) { convertBtn.disabled = false; convertBtn.innerHTML = 'আবার চেষ্টা করুন'; }
        UI.Toast.show('❌ ' + msg, 'error');
      },
    });
  }

  /* ════════════════════════════════
     DOWNLOAD
  ════════════════════════════════ */
  async function _downloadZip() {
    const images = _convertedImages;
    if (!images.length) return;

    UI.Toast.show('📦 ZIP তৈরি হচ্ছে...', 'info');

    if (typeof JSZip === 'undefined') {
      await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    }

    const zip = new JSZip();
    images.forEach(img => {
      zip.file(`পেজ-${img.pageNum}.${img.ext}`, img.dataUrl.split(',')[1], { base64: true });
    });

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fname = _fileInfo ? _fileInfo.name.replace('.pdf', '') : 'converted';
    a.href = url;
    a.download = `${fname}-images.zip`;
    a.click();
    URL.revokeObjectURL(url);
    UI.Toast.show('✅ ZIP ডাউনলোড শুরু হয়েছে', 'success');
  }

  async function _downloadAllFormat(forceFmt) {
    const images = UI.Gallery.getImages();
    if (!images.length) return;
    images.forEach((img, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = img.dataUrl;
        a.download = `পেজ-${img.pageNum}.${img.ext}`;
        a.click();
      }, i * 200);
    });
    UI.Toast.show(`⬇ সব ছবি ডাউনলোড হচ্ছে...`, 'info');
  }

  function _copyStats() {
    const images = _convertedImages;
    const s = PDFConverter.getSettings();
    const text = [
      '═══════════════════════',
      '    TransformPDF রিপোর্ট',
      '═══════════════════════',
      `ফাইল   : ${_fileInfo?.name || '—'}`,
      `মোট পেজ : ${images.length}`,
      `ফরম্যাট  : ${s.format.toUpperCase()}`,
      `DPI     : ${s.dpi}`,
      `মান     : ${s.quality}%`,
      `রঙ মোড  : ${s.colorMode}`,
      `সময়    : ${_convertElapsed} সেকেন্ড`,
      '───────────────────────',
      `তৈরি   : TransformPDF`,
      `ডেভেলপার: ${APP_CONFIG.developer.name}`,
      `যোগাযোগ : ${APP_CONFIG.developer.phone}`,
      '═══════════════════════',
    ].join('\n');

    navigator.clipboard.writeText(text)
      .then(() => UI.Toast.show('📋 স্ট্যাটস কপি হয়েছে', 'success'))
      .catch(() => UI.Toast.show('কপি ব্যর্থ হয়েছে', 'error'));
  }

  /* ════════════════════════════════
     RESET
  ════════════════════════════════ */
  function _reset() {
    PDFConverter.reset();
    UI.Gallery.clear();
    _convertedImages = [];
    _fileInfo = null;

    UI.hide('fileMetaBar');
    UI.hide('actionBar');
    UI.hide('progressSection');
    UI.hide('resultsHeader');

    document.getElementById('fileInput').value = '';
    document.getElementById('convertBtn').disabled = false;
    document.getElementById('convertBtn').innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg> রূপান্তর শুরু করুন`;
    ['downloadZipBtn','copyStatsBtn','downloadAllJpgBtn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    UI.Toast.show('🔄 রিসেট হয়েছে', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ════════════════════════════════
     UTILITIES
  ════════════════════════════════ */
  function _hideResults() {
    UI.hide('resultsHeader');
    const ids = ['downloadZipBtn','copyStatsBtn','downloadAllJpgBtn'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  }

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function _truncate(str, max) {
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  function _formatDate() {
    return new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function _initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        let start = 0;
        const duration = 1600;
        const step = () => {
          start += 16;
          const progress = Math.min(start / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  function _initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  return { init };
})();

// Boot on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
