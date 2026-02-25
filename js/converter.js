/**
 * TransformPDF — PDF Conversion Engine
 * Handles all PDF.js rendering and image processing
 * Developer: Rabiul Hasan | rabiulhasan613@gmail.com
 */

'use strict';

const PDFConverter = (() => {
  // State
  let _pdfDoc = null;
  let _convertedImages = [];
  let _isConverting = false;
  let _startTime = 0;

  // Settings (driven by UI)
  let _settings = {
    format: APP_CONFIG.defaults.format,
    dpi: APP_CONFIG.defaults.dpi,
    quality: APP_CONFIG.defaults.quality,
    background: APP_CONFIG.defaults.background,
    colorMode: APP_CONFIG.defaults.colorMode,
    pageFrom: APP_CONFIG.defaults.pageFrom,
    pageTo: null,
  };

  // Callbacks
  let _onProgress = null;
  let _onPageDone = null;
  let _onComplete = null;
  let _onError = null;

  /* ── Settings API ── */
  function setSettings(updates) {
    Object.assign(_settings, updates);
  }

  function getSettings() {
    return { ..._settings };
  }

  /* ── Load PDF ── */
  async function loadPDF(file) {
    if (!file || file.type !== 'application/pdf') {
      throw new Error('INVALID_FILE');
    }
    if (file.size > APP_CONFIG.limits.maxFileSizeBytes) {
      throw new Error('FILE_TOO_LARGE');
    }

    const arrayBuffer = await file.arrayBuffer();
    _pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    return {
      pageCount: _pdfDoc.numPages,
      name: file.name,
      size: file.size,
    };
  }

  /* ── Apply color filter ── */
  function _applyColorMode(ctx, width, height, mode) {
    if (mode === 'color') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];

      if (mode === 'grayscale') {
        const gray = r * 0.299 + g * 0.587 + b * 0.114;
        data[i] = data[i + 1] = data[i + 2] = gray;
      } else if (mode === 'sepia') {
        data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /* ── Render single page ── */
  async function _renderPage(pageNum) {
    const page = await _pdfDoc.getPage(pageNum);
    const scale = _settings.dpi / 72;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Background
    if (_settings.background === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Color mode
    _applyColorMode(ctx, canvas.width, canvas.height, _settings.colorMode);

    // Get format info
    const fmtInfo = APP_CONFIG.formats.find(f => f.id === _settings.format);
    const dataUrl = canvas.toDataURL(fmtInfo.mime, _settings.quality / 100);

    return {
      pageNum,
      dataUrl,
      ext: fmtInfo.ext,
      mime: fmtInfo.mime,
      width: canvas.width,
      height: canvas.height,
      sizeEstimate: Math.round(dataUrl.length * 0.75), // base64 → bytes estimate
    };
  }

  /* ── Start conversion ── */
  async function convert({ onProgress, onPageDone, onComplete, onError }) {
    if (!_pdfDoc) { onError?.('PDF লোড করা হয়নি'); return; }
    if (_isConverting) return;

    _onProgress = onProgress;
    _onPageDone = onPageDone;
    _onComplete = onComplete;
    _onError = onError;

    _isConverting = true;
    _convertedImages = [];
    _startTime = Date.now();

    const totalPages = _pdfDoc.numPages;
    const from = Math.max(1, _settings.pageFrom || 1);
    const to = Math.min(totalPages, _settings.pageTo || totalPages);

    if (from > to) {
      _onError?.('পেজ পরিসর সঠিক নয়');
      _isConverting = false;
      return;
    }

    const pageNums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    const total = pageNums.length;

    try {
      for (let i = 0; i < total; i++) {
        const pageNum = pageNums[i];
        const pct = Math.round((i / total) * 100);
        _onProgress?.({ pct, current: i + 1, total, pageNum });

        const img = await _renderPage(pageNum);
        _convertedImages.push(img);
        _onPageDone?.(img, i);
      }

      const elapsed = ((Date.now() - _startTime) / 1000).toFixed(1);
      _onComplete?.({
        images: _convertedImages,
        elapsed,
        total: _convertedImages.length,
      });
    } catch (err) {
      console.error('[PDFConverter] Error:', err);
      _onError?.('রূপান্তরে সমস্যা হয়েছে: ' + err.message);
    } finally {
      _isConverting = false;
    }
  }

  /* ── Accessors ── */
  function getImages() { return [..._convertedImages]; }
  function getPageCount() { return _pdfDoc ? _pdfDoc.numPages : 0; }
  function isConverting() { return _isConverting; }

  function reset() {
    _pdfDoc = null;
    _convertedImages = [];
    _isConverting = false;
  }

  return {
    loadPDF,
    convert,
    setSettings,
    getSettings,
    getImages,
    getPageCount,
    isConverting,
    reset,
  };
})();

window.PDFConverter = PDFConverter;
