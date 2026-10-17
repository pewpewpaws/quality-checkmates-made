import React, { useState } from 'react';
import { getExportCsvUrl, getExportPdfUrl } from '../services/api';

/**
 * Header Component (Antigravity 2.0 Cockpit Top Bar)
 * Features:
 * - Brand with Qualcomm Cloud AI 100 chip status
 * - Active Project stats pill (Total, % Locked, Open TBDs)
 * - 1-Click Persona Switcher (👔 Product Manager <-> 🛠️ Lead Systems Engineer <-> 🎖️ Executive)
 * - 1-Click Export Dropdown (CSV & Publication PDF)
 * - Offline / Live Stage Mode toggle
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

  // Compute live project metrics
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

  const roleLabels = {
    product_manager: {
      name: 'Product Manager',
      icon: '👔',
      badge: 'Author & Provisional Gate',
      color: 'var(--accent-amber)',
    },
    systems_engineer: {
      name: 'Lead Systems Engineer',
      icon: '🛠️',
      badge: 'Technical Sign-off Gate',
      color: 'var(--accent-green)',
    },
    executive: {
      name: 'Senior Executive',
      icon: '🎖️',
      badge: 'Read-Only Baseline Lens',
      color: 'var(--accent-cyan)',
    },
  };

  const currentRole = roleLabels[userRole] || roleLabels.product_manager;

  return (
    <header
      className="glass-panel"
      style={{
        zIndex: 50,
        height: '62px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-glass)',
        position: 'relative',
      }}
    >
      {/* Brand & Qualcomm Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          className="squircle-sm"
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.45)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.3px', color: '#ffffff' }}>
              Requirement Quality Copilot
            </span>
            <span
              className="badge-chip squircle-xs"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontSize: '10px',
                fontWeight: '600',
              }}
            >
              Qualcomm AI 100
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Antigravity 2.0 • Dual-Key Architecture Governance
          </div>
        </div>
      </div>

      {/* Middle Stats Bar (Active Project Scope) */}
      <div
        className="glass-card squircle-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '6px 18px',
          background: 'rgba(15, 23, 42, 0.65)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scope:</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff' }}>
            {activeProject?.project_name || activeProjectId}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
          <span>
            <strong style={{ color: '#ffffff' }}>{total}</strong> <span style={{ color: 'var(--text-muted)' }}>Reqs</span>
          </span>
          <span style={{ color: '#34d399' }}>
            <strong>{lockPct}%</strong> Locked
          </span>
          {tbd > 0 && (
            <span style={{ color: '#f87171' }}>
              <strong>{tbd}</strong> Open TBD
            </span>
          )}
        </div>
      </div>

      {/* Right Controls: Persona Switcher, Export, Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Offline / Live Toggle */}
        <button
          onClick={() => setLiveMode(!liveMode)}
          className="btn-squircle"
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            background: liveMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: liveMode ? '#34d399' : '#fbbf24',
            border: `1px solid ${liveMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
          }}
          title="Toggle Qualcomm Cloud AI 100 Live / Fast Offline Mock"
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: liveMode ? '#10b981' : '#f59e0b',
              boxShadow: `0 0 8px ${liveMode ? '#10b981' : '#f59e0b'}`,
            }}
          />
          {liveMode ? 'Cloud AI100' : 'Offline Stage'}
        </button>

        {/* Persona Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="input-squircle"
            style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '6px 12px',
              cursor: 'pointer',
              background: 'rgba(20, 24, 38, 0.95)',
              border: `1px solid ${currentRole.color}`,
              color: '#ffffff',
            }}
          >
            <option value="product_manager">👔 Product Manager (Author)</option>
            <option value="systems_engineer">🛠️ Lead Systems Engineer (Sign-Off)</option>
            <option value="executive">🎖️ Senior Executive (Baseline Lens)</option>
          </select>
        </div>

        {/* Export Button & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-squircle btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {showExportMenu && (
            <div
              className="glass-panel squircle-md"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                padding: '8px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                zIndex: 100,
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 10px', fontWeight: '600' }}>
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
                  color: 'var(--text-main)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <span>📊</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>Export CSV</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>IBM DOORS / Jira compatible</div>
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
                  color: 'var(--text-main)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.target.style.background = 'transparent')}
              >
                <span>📄</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>Export PDF Specification</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ReportLab certified audit report</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
