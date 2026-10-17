import React, { useEffect, useRef } from 'react';

/**
 * GeminiBackground (Muted Atmospheric Edition)
 * Subdued, pro-grade ambient fluid canvas with low saturation and gentle harmonic breathing.
 * Provides a sophisticated dark depth without distracting from high-density IDE data.
 */
export default function GeminiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = {
      x: width * 0.5,
      y: height * 0.4,
      targetX: width * 0.5,
      targetY: height * 0.4,
    };

    const handlePointerMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('pointermove', handlePointerMove);

    // Muted, Low-Saturation Organic Blobs (Deep Space / Slate Tones)
    const blobs = [
      {
        baseX: 0.3,
        baseY: 0.35,
        radius: 0.45,
        colorStart: 'rgba(28, 48, 80, 0.22)',   // Muted Navy Slate
        colorEnd: 'rgba(12, 14, 18, 0)',
        speedX: 0.0006,
        speedY: 0.0008,
        phase: 0,
      },
      {
        baseX: 0.7,
        baseY: 0.45,
        radius: 0.5,
        colorStart: 'rgba(40, 32, 68, 0.18)',   // Muted Deep Indigo
        colorEnd: 'rgba(12, 14, 18, 0)',
        speedX: 0.0007,
        speedY: 0.0005,
        phase: Math.PI * 0.5,
      },
      {
        baseX: 0.5,
        baseY: 0.7,
        radius: 0.42,
        colorStart: 'rgba(22, 52, 62, 0.16)',   // Muted Teal Slate
        colorEnd: 'rgba(12, 14, 18, 0)',
        speedX: 0.0005,
        speedY: 0.0009,
        phase: Math.PI,
      },
    ];

    let time = 0;

    const render = () => {
      time += 1;

      mouse.x += (mouse.targetX - mouse.x) * 0.035;
      mouse.y += (mouse.targetY - mouse.y) * 0.035;

      // Solid dark base
      ctx.fillStyle = '#0c0e12';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'screen';

      blobs.forEach((blob, i) => {
        const oscX = Math.sin(time * blob.speedX + blob.phase) * (width * 0.08);
        const oscY = Math.cos(time * blob.speedY + blob.phase) * (height * 0.08);

        const pointerPullX = (mouse.x - width * 0.5) * 0.08;
        const pointerPullY = (mouse.y - height * 0.5) * 0.08;

        const x = blob.baseX * width + oscX + pointerPullX;
        const y = blob.baseY * height + oscY + pointerPullY;
        const r = blob.radius * Math.min(width, height) * (1 + 0.04 * Math.sin(time * 0.0015 + i));

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 10));
        gradient.addColorStop(0, blob.colorStart);
        gradient.addColorStop(0.7, blob.colorStart.replace(/[\d\.]+\)$/, '0.04)'));
        gradient.addColorStop(1, blob.colorEnd);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle mouse pointer aura
      const pointerHaloRadius = Math.min(width, height) * 0.22;
      const pointerGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        pointerHaloRadius
      );
      pointerGrad.addColorStop(0, 'rgba(56, 139, 253, 0.08)');
      pointerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = pointerGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, pointerHaloRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
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
        opacity: 0.85,
      }}
    />
  );
}
