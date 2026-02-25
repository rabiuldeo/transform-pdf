/**
 * TransformPDF — Configuration & Constants
 * ─────────────────────────────────────────
 * Developer  : Rabiul Hasan
 * WhatsApp   : +8801886828042
 * Email      : rabiulhasan613@gmail.com
 * Version    : 2.0.0
 */

'use strict';

const APP_CONFIG = Object.freeze({
  name: 'TransformPDF',
  version: '2.0.0',
  developer: {
    name: 'রবিউল হাসান',
    nameEn: 'Rabiul Hasan',
    phone: '+8801886828042',
    whatsapp: '+8801886828042',
    email: 'rabiulhasan613@gmail.com',
  },

  pdfjs: {
    workerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  },

  limits: {
    maxFileSizeMB: 50,
    maxFileSizeBytes: 50 * 1024 * 1024,
  },

  defaults: {
    format: 'jpeg',
    dpi: 144,
    quality: 92,
    background: 'white',
    colorMode: 'color',
    pageFrom: 1,
    pageTo: null,
    theme: 'light',
  },

  formats: [
    { id: 'jpeg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
    { id: 'png',  label: 'PNG', mime: 'image/png',  ext: 'png' },
    { id: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp' },
  ],

  dpi: {
    min: 72, max: 300, step: 36,
    presets: [
      { label: 'ওয়েব (72)', value: 72 },
      { label: 'স্ক্রিন (96)', value: 96 },
      { label: 'সাধারণ (144)', value: 144 },
      { label: 'প্রিন্ট (200)', value: 200 },
      { label: 'হাই-রেজ (300)', value: 300 },
    ],
  },

  quality: { min: 60, max: 100, step: 5 },

  colorModes: [
    { id: 'color',     label: '🎨 রঙিন' },
    { id: 'grayscale', label: '⬛ ধূসর' },
    { id: 'sepia',     label: '🟤 সেপিয়া' },
  ],

  toastDuration: 3500,
  animationStaggerMs: 50,
});

// Expose globally
window.APP_CONFIG = APP_CONFIG;
