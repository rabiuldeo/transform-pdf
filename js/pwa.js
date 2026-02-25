/**
 * TransformPDF — PWA Install Manager
 * Handles install prompt, offline detection, update notification
 * Developer: Rabiul Hasan | rabiulhasan613@gmail.com
 */

'use strict';

const PWAManager = (() => {
  let _deferredPrompt = null;
  let _isInstalled = false;

  function init() {
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[SW] Registered:', reg.scope);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              _showUpdateBanner();
            }
          });
        });
      }).catch(err => console.warn('[SW] Registration failed:', err));
    }

    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _deferredPrompt = e;
      _showInstallBanner();
    });

    // Installed
    window.addEventListener('appinstalled', () => {
      _isInstalled = true;
      _hideInstallBanner();
      UI.Toast.show('🎉 অ্যাপ সফলভাবে ইনস্টল হয়েছে!', 'success');
    });

    // Online/offline
    window.addEventListener('online', () => {
      UI.Toast.show('🌐 ইন্টারনেট সংযোগ পাওয়া গেছে', 'success');
      document.getElementById('offlineBanner')?.classList.remove('show');
    });
    window.addEventListener('offline', () => {
      UI.Toast.show('📵 অফলাইন মোড — মূল ফিচার কাজ করবে', 'warning');
      document.getElementById('offlineBanner')?.classList.add('show');
    });

    // Bind install button
    document.getElementById('installBtn')?.addEventListener('click', triggerInstall);
    document.getElementById('installBannerBtn')?.addEventListener('click', triggerInstall);
    document.getElementById('installBannerClose')?.addEventListener('click', _hideInstallBanner);
  }

  function _showInstallBanner() {
    setTimeout(() => {
      document.getElementById('installBanner')?.classList.add('show');
    }, 3000);
  }

  function _hideInstallBanner() {
    document.getElementById('installBanner')?.classList.remove('show');
  }

  function _showUpdateBanner() {
    document.getElementById('updateBanner')?.classList.add('show');
    document.getElementById('updateBtn')?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  async function triggerInstall() {
    if (!_deferredPrompt) {
      UI.Toast.show('এই ব্রাউজারে ইনস্টল সাপোর্ট নেই', 'info');
      return;
    }
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    _deferredPrompt = null;

    if (outcome === 'accepted') {
      _hideInstallBanner();
    }
  }

  function isInstalled() { return _isInstalled || window.matchMedia('(display-mode: standalone)').matches; }

  return { init, triggerInstall, isInstalled };
})();

window.PWAManager = PWAManager;
