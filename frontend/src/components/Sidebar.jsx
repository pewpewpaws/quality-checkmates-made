import React, { useState } from 'react';

/**
 * Sidebar Component (Antigravity 2.0 Left Navigation)
 * Features:
 * - Projects List with requirement count indicators
 * - Requirement Explorer strictly isolated to active project
 * - Filter pills (All, TBD, Provisional, Locked)
 * - Live search
 * - Squircle styling and hover micro-animations
 */
export default function Sidebar({
  projects = [],
  activeProjectId,
  setActiveProjectId,
  requirements = [],
  selectedReqId,
  setSelectedReqId,
  onAddRequirement,
  onCreateProject,
  userRole,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewReqModal, setShowNewReqModal] = useState(false);

  // Form states
  const [newProjName, setNewProjName] = useState('');
  const [newProjId, setNewProjId] = useState('');
  const [newProjDomain, setNewProjDomain] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const [newReqId, setNewReqId] = useState('');
  const [newReqText, setNewReqText] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('General');
  const [newReqSection, setNewReqSection] = useState('Section 1.0');

  // Filter requirements by search and status
  const filteredRequirements = requirements.filter((req) => {
    // Status filter
    if (statusFilter === 'FLAGGED_TBD' && req.status !== 'FLAGGED_TBD') return false;
    if (statusFilter === 'PROVISIONAL_PM' && req.status !== 'PROVISIONAL_PM') return false;
    if (statusFilter === 'LOCKED_BASELINE' && req.status !== 'LOCKED_BASELINE') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = req.id?.toLowerCase().includes(q);
      const matchText = req.text?.toLowerCase().includes(q);
      const matchCat = req.category?.toLowerCase().includes(q);
      return matchId || matchText || matchCat;
    }
    return true;
  });

  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    if (!newProjId.trim() || !newProjName.trim()) return;
    onCreateProject({
      project_id: newProjId.trim(),
      project_name: newProjName.trim(),
      domain: newProjDomain.trim() || 'Embedded Systems',
      description: newProjDesc.trim() || 'Custom Project Workspace',
    });
    setNewProjId('');
    setNewProjName('');
    setNewProjDomain('');
    setNewProjDesc('');
    setShowNewProjectModal(false);
  };

  const handleCreateReqSubmit = (e) => {
    e.preventDefault();
    if (!newReqId.trim() || !newReqText.trim()) return;
    onAddRequirement({
      id: newReqId.trim(),
      project_id: activeProjectId,
      text: newReqText.trim(),
      category: newReqCategory.trim(),
      section: newReqSection.trim(),
      status: 'FLAGGED_TBD',
    });
    setNewReqId('');
    setNewReqText('');
    setShowNewReqModal(false);
  };

  return (
    <aside
      className="glass-panel"
      style={{
        width: '320px',
        minWidth: '320px',
        height: 'calc(100vh - 62px)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-glass)',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* 1. Project Workspaces Accordion / Selector */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            PROJECT WORKSPACES
          </span>
          {userRole !== 'executive' && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="btn-squircle"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
              title="Create New Project Workspace"
            >
              + New
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {projects.map((proj) => {
            const isActive = proj.project_id === activeProjectId;
            return (
              <button
                key={proj.project_id}
                onClick={() => setActiveProjectId(proj.project_id)}
                className="btn-squircle"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px' }}>
                    {proj.project_id.includes('bms') ? '🔋' : proj.project_id.includes('flight') ? '✈️' : proj.project_id.includes('med') ? '💉' : '📁'}
                  </span>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '12px', fontWeight: isActive ? '600' : '500', color: isActive ? '#ffffff' : 'var(--text-main)' }}>
                      {proj.project_name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {proj.domain || 'Domain Spec'}
                    </div>
                  </div>
                </div>

                <span
                  className="badge-chip squircle-xs"
                  style={{
                    fontSize: '10px',
                    background: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  }}
                >
                  {proj.total_requirements ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Requirements Explorer Header & Filters */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
            REQUIREMENTS EXPLORER
          </span>
          {userRole !== 'executive' && (
            <button
              onClick={() => {
                setNewReqId(`REQ-${activeProjectId.slice(0, 3).toUpperCase()}-${String(requirements.length + 1).padStart(3, '0')}`);
                setShowNewReqModal(true);
              }}
              className="btn-squircle"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
              title="Add Statement to Active Project"
            >
              + Add
            </button>
          )}
        </div>

        {/* Live Search */}
        <input
          type="text"
          placeholder="Filter by keyword or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-squircle"
          style={{ width: '100%', fontSize: '12px', padding: '6px 10px', marginBottom: '8px' }}
        />

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['ALL', 'FLAGGED_TBD', 'PROVISIONAL_PM', 'LOCKED_BASELINE'].map((st) => {
            const isSelected = statusFilter === st;
            const label = st === 'ALL' ? 'All' : st === 'FLAGGED_TBD' ? '🔴 TBD' : st === 'PROVISIONAL_PM' ? '🟡 Prov' : '🟢 Lock';
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="btn-squircle squircle-pill"
                style={{
                  padding: '3px 8px',
                  fontSize: '10px',
                  background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  border: isSelected ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Scrollable Requirements Tree / List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredRequirements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '12px' }}>
            No requirements match criteria.
          </div>
        ) : (
          filteredRequirements.map((req) => {
            const isSelected = req.id === selectedReqId;
            const isLocked = req.status === 'LOCKED_BASELINE';
            const isProv = req.status === 'PROVISIONAL_PM';

            const statusDotColor = isLocked ? '#10b981' : isProv ? '#f59e0b' : '#ef4444';
            const scoreVal = req.quality_score?.overall;

            return (
              <div
                key={req.id}
                onClick={() => setSelectedReqId(req.id)}
                className="glass-card squircle-md"
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(20, 24, 38, 0.55)',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: statusDotColor,
                        boxShadow: `0 0 6px ${statusDotColor}`,
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: isSelected ? '#38bdf8' : '#ffffff' }}>
                      {req.id}
                    </span>
                  </div>

                  {scoreVal !== undefined && (
                    <span
                      className="badge-chip squircle-xs"
                      style={{
                        fontSize: '10px',
                        background: scoreVal >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: scoreVal >= 80 ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {Math.round(scoreVal)} pts
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.35',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {req.text}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '10px', color: 'var(--text-dim)' }}>
                  <span>{req.category || 'General'}</span>
                  <span>•</span>
                  <span>{req.section || 'Sec 1'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: New Project */}
      {showNewProjectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div className="glass-panel squircle-lg" style={{ width: '420px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#ffffff' }}>
              Create Project Workspace
            </h3>
            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Project ID (slug)
                </label>
                <input
                  type="text"
                  placeholder="e.g. proj-adas"
                  value={newProjId}
                  onChange={(e) => setNewProjId(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Level-3 Highway Pilot ADAS"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Engineering Domain / Standard
                </label>
                <input
                  type="text"
                  placeholder="e.g. Automotive Safety (ISO 26262)"
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Description / Architecture Charter
                </label>
                <textarea
                  placeholder="Operational parameters and system boundaries..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%', height: '70px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="btn-squircle btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-squircle btn-primary">
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Requirement */}
      {showNewReqModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div className="glass-panel squircle-lg" style={{ width: '460px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: '#ffffff' }}>
              Add Requirement to {activeProjectId}
            </h3>
            <form onSubmit={handleCreateReqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Requirement ID
                  </label>
                  <input
                    type="text"
                    value={newReqId}
                    onChange={(e) => setNewReqId(e.target.value)}
                    className="input-squircle"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={newReqCategory}
                    onChange={(e) => setNewReqCategory(e.target.value)}
                    className="input-squircle"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Requirement Text (Preserve [TBD: ...])
                </label>
                <textarea
                  placeholder="The system shall..."
                  value={newReqText}
                  onChange={(e) => setNewReqText(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%', height: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="btn-squircle btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-squircle btn-primary">
                  Save Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
