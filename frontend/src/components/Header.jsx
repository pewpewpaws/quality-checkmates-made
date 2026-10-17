import React, { useState } from 'react';
import { getExportCsvUrl, getExportPdfUrl } from '../services/api';

/**
 * Header Component (Antigravity 2.0 Pro Edition)
 * Refined, muted top bar with crisp 1px borders, subtle status indicators,
 * and seamless persona switching.
 */
export default function Header({
  activeProject,
  activeProjectId,
  requirements = [],
  userRole,
  setUserRole,
  liveMode,
  setLiveMode,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const total = requirements.length;
  const locked = requirements.filter((r) => r.status === 'LOCKED_BASELINE').length;
  const provisional = requirements.filter((r) => r.status === 'PROVISIONAL_PM').length;
  const tbd = requirements.filter((r) => r.status === 'FLAGGED_TBD').length;
  const lockPct = total > 0 ? Math.round((locked / total) * 100) : 0;

  const handleExport = (type) => {
    setShowExportMenu(false);
    const url = type === 'csv'
      ? getExportCsvUrl(activeProjectId, userRole)
      : getExportPdfUrl(activeProjectId, userRole);
    window.open(url, '_blank');
  };

  return (
    <header
      style={{
        zIndex: 50,
        height: '52px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      {/* Brand & Qualcomm AI 100 Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          className="squircle-xs"
          style={{
            width: '28px',
            height: '28px',
            background: '#1b2230',
            border: '1px solid #283347',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#388bfd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            Requirement Quality Copilot
          </span>
          <span
            className="badge-chip squircle-xs"
            style={{
              background: 'var(--accent-blue-subtle)',
              color: 'var(--accent-blue)',
              border: '1px solid var(--accent-blue-border)',
              fontSize: '11px',
              padding: '2px 8px',
              fontWeight: '500',
            }}
          >
            Qualcomm Cloud AI 100
          </span>
        </div>
      </div>

      {/* Middle Stats Bar (Active Project Scope) */}
      <div
        className="squircle-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '6px 16px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12.5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Project:</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
            {activeProject?.project_name || activeProjectId}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> <span style={{ color: 'var(--text-muted)' }}>reqs</span>
          </span>
          <span style={{ color: 'var(--text-green)', fontWeight: '500' }}>
            <strong>{lockPct}%</strong> locked
          </span>
          {tbd > 0 && (
            <span style={{ color: 'var(--text-red)', fontWeight: '500' }}>
              <strong>{tbd}</strong> TBD
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: Persona Switcher, Export, Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Offline / Live Toggle */}
        <button
          onClick={() => setLiveMode(!liveMode)}
          className="btn-squircle"
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: '500',
            background: liveMode ? 'var(--accent-green-subtle)' : 'var(--accent-amber-subtle)',
            color: liveMode ? 'var(--text-green)' : 'var(--text-amber)',
            border: `1px solid ${liveMode ? 'var(--accent-green-border)' : 'var(--accent-amber-border)'}`,
          }}
          title="Toggle Qualcomm Cloud AI 100 Live / Fast Offline Mock"
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: liveMode ? 'var(--text-green)' : 'var(--text-amber)',
            }}
          />
          {liveMode ? 'Cloud AI100' : 'Offline'}
        </button>

        {/* Persona Switcher Dropdown */}
        <select
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
          className="input-squircle"
          style={{
            fontSize: '12px',
            fontWeight: '500',
            padding: '5px 10px',
            cursor: 'pointer',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="product_manager">👔 Product Manager</option>
          <option value="systems_engineer">🛠️ Lead Systems Engineer</option>
          <option value="executive">🎖️ Senior Executive</option>
        </select>

        {/* Export Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-squircle btn-secondary"
            style={{ padding: '5px 12px', fontSize: '12px', fontWeight: '500' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {showExportMenu && (
            <div
              className="glass-panel squircle-sm"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '210px',
                padding: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 100,
                border: '1px solid var(--border-medium)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px', fontWeight: '700', letterSpacing: '0.4px' }}>
                EXPORT SPECIFICATION
              </div>

              <button
                onClick={() => handleExport('csv')}
                className="btn-squircle"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.target.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <span style={{ fontSize: '14px' }}>📊</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>Export CSV</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>DOORS / Jira format</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="btn-squircle"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.target.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <span style={{ fontSize: '14px' }}>📄</span>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: '600' }}>Export PDF Specification</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>ReportLab certified baseline</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
