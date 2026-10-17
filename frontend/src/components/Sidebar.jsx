import React, { useState } from 'react';

/**
 * Sidebar Component (Antigravity 2.0 Pro Edition)
 * Clean, muted IDE file tree layout with squircle geometry and per-project isolation.
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

  const [newProjName, setNewProjName] = useState('');
  const [newProjId, setNewProjId] = useState('');
  const [newProjDomain, setNewProjDomain] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  const [newReqId, setNewReqId] = useState('');
  const [newReqText, setNewReqText] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('General');
  const [newReqSection, setNewReqSection] = useState('Section 1.0');

  const filteredRequirements = requirements.filter((req) => {
    if (statusFilter === 'FLAGGED_TBD' && req.status !== 'FLAGGED_TBD') return false;
    if (statusFilter === 'PROVISIONAL_PM' && req.status !== 'PROVISIONAL_PM') return false;
    if (statusFilter === 'LOCKED_BASELINE' && req.status !== 'LOCKED_BASELINE') return false;

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
      style={{
        width: '300px',
        minWidth: '300px',
        height: 'calc(100vh - 52px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* 1. Projects Section */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
            WORKSPACES
          </span>
          {userRole !== 'executive' && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="btn-squircle btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '500' }}
              title="Create New Workspace"
            >
              + New
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                  padding: '7px 9px',
                  background: isActive ? 'var(--bg-card-selected)' : 'transparent',
                  border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', opacity: 0.85 }}>
                    {proj.project_id.includes('bms') ? '⚡' : proj.project_id.includes('flight') ? '✈' : proj.project_id.includes('med') ? '✚' : '📁'}
                  </span>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: isActive ? '600' : '500' }}>
                      {proj.project_name}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '500',
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
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
            REQUIREMENTS
          </span>
          {userRole !== 'executive' && (
            <button
              onClick={() => {
                setNewReqId(`REQ-${activeProjectId.slice(0, 3).toUpperCase()}-${String(requirements.length + 1).padStart(3, '0')}`);
                setShowNewReqModal(true);
              }}
              className="btn-squircle btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '500' }}
              title="Add Statement"
            >
              + Add
            </button>
          )}
        </div>

        {/* Live Search */}
        <input
          type="text"
          placeholder="Filter requirements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-squircle"
          style={{ width: '100%', fontSize: '12px', padding: '6px 9px', marginBottom: '8px' }}
        />

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['ALL', 'FLAGGED_TBD', 'PROVISIONAL_PM', 'LOCKED_BASELINE'].map((st) => {
            const isSelected = statusFilter === st;
            const label = st === 'ALL' ? 'All' : st === 'FLAGGED_TBD' ? 'TBD' : st === 'PROVISIONAL_PM' ? 'Prov' : 'Locked';
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className="btn-squircle squircle-pill"
                style={{
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: isSelected ? 'var(--border-medium)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--border-glass)' : '1px solid transparent',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Requirements List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filteredRequirements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
            No requirements match criteria.
          </div>
        ) : (
          filteredRequirements.map((req) => {
            const isSelected = req.id === selectedReqId;
            const isLocked = req.status === 'LOCKED_BASELINE';
            const isProv = req.status === 'PROVISIONAL_PM';

            const statusClass = isLocked ? 'badge-locked' : isProv ? 'badge-provisional' : 'badge-tbd';
            const statusLabel = isLocked ? 'Locked' : isProv ? 'Prov' : 'TBD';
            const scoreVal = req.quality_score?.overall;

            return (
              <div
                key={req.id}
                onClick={() => setSelectedReqId(req.id)}
                style={{
                  padding: '7px 9px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(255, 255, 255, 0.085)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
                  transition: 'background 0.1s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
                className="notion-sidebar-row"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '13px', opacity: 0.85 }}>📄</span>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: isSelected ? '600' : '500',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {req.id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {scoreVal !== undefined && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {Math.round(scoreVal)}
                      </span>
                    )}
                    <span
                      className={`badge-chip ${statusClass}`}
                      style={{ fontSize: '9.5px', padding: '1px 5px' }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.35',
                    paddingLeft: '20px',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {req.text}
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
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div className="glass-panel squircle-md" style={{ width: '380px', padding: '18px', border: '1px solid var(--border-medium)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Create Project Workspace
            </h3>
            <form onSubmit={handleCreateProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
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
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Highway Pilot ADAS"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Domain Standard
                </label>
                <input
                  type="text"
                  placeholder="e.g. Automotive ISO 26262"
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="btn-squircle btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-squircle btn-primary-blue">
                  Create
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
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div className="glass-panel squircle-md" style={{ width: '420px', padding: '18px', border: '1px solid var(--border-medium)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Add Requirement ({activeProjectId})
            </h3>
            <form onSubmit={handleCreateReqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    ID
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
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
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
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                  Requirement Text (Preserve [TBD: ...])
                </label>
                <textarea
                  placeholder="The system shall..."
                  value={newReqText}
                  onChange={(e) => setNewReqText(e.target.value)}
                  className="input-squircle"
                  style={{ width: '100%', height: '70px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewReqModal(false)}
                  className="btn-squircle btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-squircle btn-primary-blue">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
