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
        height: '44px',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        fontSize: '13px',
      }}
    >
      {/* Notion Breadcrumb Trail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '3px 6px',
            borderRadius: '4px',
            transition: 'background 0.12s ease',
          }}
          className="notion-breadcrumb-item"
        >
          <span style={{ fontSize: '15px' }}>📋</span>
          <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
            Quality Copilot
          </span>
        </div>

        <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>/</span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '13px' }}>
            {activeProjectId.includes('bms') ? '⚡' : activeProjectId.includes('flight') ? '✈' : activeProjectId.includes('med') ? '✚' : '📁'}
          </span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeProject?.project_name || activeProjectId}
          </span>
        </div>
      </div>

      {/* Middle Stats: Notion Tag Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          className="badge-chip"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {total} reqs
        </span>

        <span className="badge-chip badge-locked">
          {lockPct}% locked
        </span>

        {tbd > 0 && (
          <span className="badge-chip badge-tbd">
            {tbd} TBD
          </span>
        )}

        {userRole === 'systems_engineer' && provisional > 0 && (
          <span
            className="badge-chip badge-provisional"
            style={{ fontWeight: '600', padding: '3px 8px' }}
            title="Requirements awaiting Lead Systems Engineer technical sign-off"
          >
            📋 {provisional} To Sign Off
          </span>
        )}
      </div>

      {/* Right Controls: Persona Switcher, Export, Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
