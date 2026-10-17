import React, { useEffect, useRef } from 'react';

/**
 * GeminiBackground
 * Interactive, GPU-accelerated fluid iridescent organic glow canvas
 * modeled after the Google Gemini mobile app background.
 * Features 60 FPS organic harmonic breathing + pointer-reactive spring physics.
 */
export default function GeminiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Viewport dimensions
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates with spring inertia
    const mouse = {
      x: width * 0.5,
      y: height * 0.4,
      targetX: width * 0.5,
      targetY: height * 0.4,
      vx: 0,
      vy: 0,
    };

    const ripples = [];

    const handlePointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handlePointerDown = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: Math.min(width, height) * 0.45,
        alpha: 0.35,
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);

    // 4 Organic Fluid Blobs (Gemini Palette)
    const blobs = [
      {
        baseX: 0.35,
        baseY: 0.35,
        radius: 0.38,
        colorStart: 'rgba(26, 115, 232, 0.45)', // Gemini Blue
        colorEnd: 'rgba(26, 115, 232, 0)',
        speedX: 0.0008,
        speedY: 0.0011,
        phase: 0,
      },
      {
        baseX: 0.65,
        baseY: 0.4,
        radius: 0.42,
        colorStart: 'rgba(138, 43, 226, 0.40)', // Violet Indigo
        colorEnd: 'rgba(138, 43, 226, 0)',
        speedX: 0.0012,
        speedY: 0.0007,
        phase: Math.PI * 0.5,
      },
      {
        baseX: 0.5,
        baseY: 0.65,
        radius: 0.36,
        colorStart: 'rgba(0, 242, 254, 0.32)', // Cyan Aquamarine
        colorEnd: 'rgba(0, 242, 254, 0)',
        speedX: 0.0009,
        speedY: 0.0013,
        phase: Math.PI,
      },
      {
        baseX: 0.75,
        baseY: 0.7,
        radius: 0.32,
        colorStart: 'rgba(255, 107, 107, 0.22)', // Soft Coral Glow
        colorEnd: 'rgba(255, 107, 107, 0)',
        speedX: 0.0014,
        speedY: 0.0009,
        phase: Math.PI * 1.5,
      },
    ];

    let time = 0;

    const render = () => {
      time += 1;

      // Smooth mouse spring physics
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Clear with dark obsidian base
      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, width, height);

      // Add additive screen blending for organic liquid light
      ctx.globalCompositeOperation = 'screen';

      // 1. Draw animated fluid blobs
      blobs.forEach((blob, i) => {
        const oscX = Math.sin(time * blob.speedX + blob.phase) * (width * 0.12);
        const oscY = Math.cos(time * blob.speedY + blob.phase) * (height * 0.12);

        // Subtle pull towards pointer position
        const pullFactor = 0.15;
        const pointerPullX = (mouse.x - width * 0.5) * pullFactor;
        const pointerPullY = (mouse.y - height * 0.5) * pullFactor;

        const x = blob.baseX * width + oscX + pointerPullX;
        const y = blob.baseY * height + oscY + pointerPullY;
        const r = blob.radius * Math.min(width, height) * (1 + 0.08 * Math.sin(time * 0.002 + i));

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 10));
        gradient.addColorStop(0, blob.colorStart);
        gradient.addColorStop(0.5, blob.colorStart.replace(/[\d\.]+\)$/, '0.15)'));
        gradient.addColorStop(1, blob.colorEnd);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Dynamic Pointer Fluid Halo
      const pointerHaloRadius = Math.min(width, height) * 0.28;
      const pointerGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        pointerHaloRadius
      );
      pointerGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)'); // Qualcomm Cyan
      pointerGrad.addColorStop(0.6, 'rgba(138, 43, 226, 0.12)');
      pointerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = pointerGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, pointerHaloRadius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Render Ripples
      for (let j = ripples.length - 1; j >= 0; j--) {
        const rip = ripples[j];
        rip.radius += 4;
        rip.alpha *= 0.94;

        if (rip.alpha < 0.01 || rip.radius > rip.maxRadius) {
          ripples.splice(j, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(56, 189, 248, ${rip.alpha * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';

      // Subtle noise texture overlay simulation via translucent vignette
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.35,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(7, 9, 14, 0)');
      vignette.addColorStop(1, 'rgba(7, 9, 14, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.92,
      }}
    />
  );
}
