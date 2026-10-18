import React, { useState } from 'react';
import StarBorder from './StarBorder';
import { 
  Search, 
  Plus, 
  Folder, 
  FileText, 
  PanelLeftClose, 
  PanelLeftOpen, 
  ShieldAlert, 
  Clock, 
  CheckCircle2,
  Filter,
  BarChart3,
  MessageSquare
} from 'lucide-react';

export default function Sidebar({
  projects = [],
  currentProjectId,
  onSelectProject,
  requirements = [],
  selectedReqId,
  onSelectRequirement,
  onOpenNewProject,
  collapsed,
  onToggleCollapse,
  activeView,
  onSelectView
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = 
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.category && req.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return req.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FLAGGED_TBD':
        return (
          <span 
            className="badge-status badge-tbd" 
            title="TBD: To Be Defined (Unquantified metric placeholder)"
            style={{ fontSize: '9.5px', padding: '2px 6px', whiteSpace: 'nowrap' }}
          >
            TBD • To Be Defined
          </span>
        );
      case 'PROVISIONAL_PM':
        return (
          <span 
            className="badge-status badge-provisional" 
            title="Prov: Provisional (Product Manager target proposed, awaiting engineering sign-off)"
            style={{ fontSize: '9.5px', padding: '2px 6px', whiteSpace: 'nowrap' }}
          >
            Prov • Provisional
          </span>
        );
      case 'LOCKED_BASELINE':
        return (
          <span 
            className="badge-status badge-locked" 
            title="Lock: Locked Baseline (Lead Systems Engineer signed-off with falsifiable test blueprint)"
            style={{ fontSize: '9.5px', padding: '2px 6px', whiteSpace: 'nowrap' }}
          >
            Locked Baseline
          </span>
        );
      default:
        return <span className="badge-status badge-tbd">{status}</span>;
    }
  };

  if (collapsed) {
    return (
      <aside className="left-sidebar collapsed">
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onToggleCollapse}
            className="btn-subtle-cream"
            style={{ padding: '8px', border: 'none', background: 'transparent' }}
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
          <StarBorder
            as="button"
            onClick={onOpenNewProject}
            color="#ffffff"
            trailColor="#ffffff"
            duration={4}
            direction="clockwise"
            stars={1}
            trailLength={0.3}
            thickness={1}
            radius={16}
            glow={0.6}
            hover="lap"
            sparkle={false}
            clickPulse
            theme="dark"
            backgroundColor="#181715"
            textColor="#FAF8F5"
            style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="New Project"
          >
            <Plus size={16} />
          </StarBorder>
          <div style={{ width: '100%', height: '1px', background: '#E5E0D5' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredRequirements.slice(0, 8).map(r => (
              <div
                key={r.id}
                onClick={() => onSelectRequirement(r.id)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedReqId === r.id ? '#181715' : '#EFEAE2',
                  color: selectedReqId === r.id ? '#FAF8F5' : '#181715'
                }}
                title={`${r.id}: ${r.text.slice(0, 60)}...`}
              >
                {r.id.split('-').pop()}
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="left-sidebar">
      {/* Top Header of Sidebar */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5E0D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Folder size={16} className="text-stone-700" />
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: '#181715' }}>
            Workspaces & Requirements
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onOpenNewProject}
            className="btn-subtle-cream"
            style={{ padding: '4px 6px', fontSize: '11px' }}
            title="Start New Project"
          >
            <Plus size={13} />
            <span>New</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="btn-subtle-cream"
            style={{ padding: '5px', border: 'none', background: 'transparent' }}
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      {/* Workspace Quick Views (when a project is selected) */}
      {currentProjectId && onSelectView && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E0D5', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button
            onClick={() => onSelectView('overview')}
            style={{
              padding: '6px 8px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeView === 'overview' ? '#181715' : '#E5E0D5',
              backgroundColor: activeView === 'overview' ? '#181715' : '#FFFFFF',
              color: activeView === 'overview' ? '#FAF8F5' : '#57534E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <BarChart3 size={13} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onSelectView('chat')}
            style={{
              padding: '6px 8px',
              fontSize: '11.5px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: activeView === 'chat' ? '#181715' : '#E5E0D5',
              backgroundColor: activeView === 'chat' ? '#181715' : '#FFFFFF',
              color: activeView === 'chat' ? '#FAF8F5' : '#57534E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={13} />
            <span>Chat & Ingest</span>
          </button>
        </div>
      )}

      {/* Search Input */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E0D5' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#8A857C' }} />
          <input
            type="text"
            placeholder="Search statements or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              fontSize: '12px',
              border: '1px solid #E5E0D5',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              color: '#181715',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>

        {/* Filter Pills with Full Expansions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginTop: '8px' }}>
          {[
            { id: 'ALL', label: 'All', desc: 'All Reqs' },
            { id: 'FLAGGED_TBD', label: 'TBD', desc: 'To Be Defined' },
            { id: 'PROVISIONAL_PM', label: 'Prov', desc: 'Provisional' },
            { id: 'LOCKED_BASELINE', label: 'Lock', desc: 'Locked Baseline' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '5px 8px',
                border: '1px solid',
                borderColor: statusFilter === f.id ? '#181715' : '#E5E0D5',
                borderRadius: '6px',
                backgroundColor: statusFilter === f.id ? '#181715' : '#FFFFFF',
                color: statusFilter === f.id ? '#FAF8F5' : '#181715',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              title={`${f.label} = ${f.desc}`}
            >
              <span style={{ fontSize: '11px', fontWeight: 700 }}>
                {f.label}
              </span>
              <span style={{ fontSize: '9.5px', color: statusFilter === f.id ? '#E5E0D5' : '#78716C', fontWeight: 500, lineHeight: 1.1 }}>
                {f.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requirements List (3mm spacing between items) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3mm)' }}>
        {filteredRequirements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: '#8A857C', fontSize: '12px' }}>
            No requirements match filter.
          </div>
        ) : (
          filteredRequirements.map(req => {
            const isSelected = selectedReqId === req.id;
            const score = req.quality_score?.overall ?? req.quality_score?.composite_score ?? null;
            const displayScore = score !== null ? Math.round(score * 10) / 10 : null;

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequirement(req.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#FFFFFF' : '#F9F6F0',
                  border: '1px solid',
                  borderColor: isSelected ? '#181715' : '#E5E0D5',
                  boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', fontWeight: 600, color: '#181715' }}>
                    {req.id}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {displayScore !== null && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: displayScore >= 80 ? '#047857' : displayScore >= 60 ? '#B45309' : '#B91C1C' }}>
                        {displayScore}
                      </span>
                    )}
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                <div 
                  style={{ 
                    fontSize: '12px', 
                    color: '#55524B', 
                    lineHeight: '1.4', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}
                >
                  {req.text}
                </div>

                {req.category && (
                  <div style={{ fontSize: '10.5px', color: '#8A857C' }}>
                    {req.category}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E0D5', fontSize: '11px', color: '#8A857C', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total: {requirements.length} Requirements</span>
        <span>Dual-Key Governed</span>
      </div>
    </aside>
  );
}
