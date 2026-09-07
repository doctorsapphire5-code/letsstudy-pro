(function () {
  'use strict';

  // Prevent duplicate loading
  if (window.__LETSSTUDY_ADS_LOADED__) return;
  window.__LETSSTUDY_ADS_LOADED__ = true;

  function loadScript(src, zone) {
    const script = document.createElement('script');

    script.src = src;
    script.async = true;
    script.dataset.zone = zone;

    document.head.appendChild(script);
  }

  // Ad Network 1
  loadScript(
    'https://nap5k.com/tag.min.js',
    '11743645'
  );

  // Ad Network 2 - Vignette
  loadScript(
    'https://n6wxm.com/vignette.min.js',
    '11446753'
  );

})();