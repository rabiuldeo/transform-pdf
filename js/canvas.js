/**
 * TransformPDF — Canvas Background Animator
 * Particle mesh with mouse interaction
 * Developer: Rabiul Hasan | rabiulhasan613@gmail.com
 */

'use strict';

const CanvasAnimator = (() => {
  let canvas, ctx, particles = [], animId = null;
  let mouse = { x: -999, y: -999 };
  let isDark = false;

  const PARTICLE_COUNT = 60;
  const CONNECTION_DIST = 130;
  const MOUSE_ATTRACT_DIST = 160;

  function _createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.6,
      baseAlpha: Math.random() * 0.35 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.006,
      hue: Math.random() > 0.5 ? 200 : 250, // cyan or violet
    };
  }

  function _resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function _draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;

      // Bounce
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // Mouse attraction
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const mdist = Math.hypot(mdx, mdy);
      if (mdist < MOUSE_ATTRACT_DIST) {
        p.vx += (mdx / mdist) * 0.04;
        p.vy += (mdy / mdist) * 0.04;
        // Speed cap
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 1.5) { p.vx = (p.vx / speed) * 1.5; p.vy = (p.vy / speed) * 1.5; }
      }

      const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.pulse));
      const opacity = isDark ? alpha : alpha * 0.6;

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + 0.25 * Math.sin(p.pulse)), 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `hsla(${p.hue}, 80%, 70%, ${opacity})`
        : `hsla(${p.hue}, 70%, 45%, ${opacity})`;
      ctx.fill();

      // Draw connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < CONNECTION_DIST) {
          const lineAlpha = (1 - dist / CONNECTION_DIST) * (isDark ? 0.08 : 0.05);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = isDark
            ? `hsla(${p.hue}, 70%, 70%, ${lineAlpha})`
            : `hsla(${p.hue}, 60%, 40%, ${lineAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    });

    animId = requestAnimationFrame(_draw);
  }

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    _resize();
    particles = Array.from({ length: PARTICLE_COUNT }, _createParticle);

    window.addEventListener('resize', _resize);
    document.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

    window.addEventListener('themechange', (e) => {
      isDark = e.detail.theme === 'dark';
    });
    isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    _draw();
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
  }

  return { init, destroy };
})();

window.CanvasAnimator = CanvasAnimator;
