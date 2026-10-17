import React from 'react';

/**
 * Clean Notion Canvas Background
 * Pure distraction-free matte workspace canvas (#191919) honoring Notion's aesthetic.
 */
export default function GeminiBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'var(--bg-app)',
      }}
    />
  );
}
