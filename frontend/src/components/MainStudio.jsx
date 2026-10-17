import React, { useState } from 'react';
import ChatTab from './ChatTab';
import IngestTab from './IngestTab';
import DeepInspectorTab from './DeepInspectorTab';
import ConflictTab from './ConflictTab';

/**
 * MainStudio Component (Center Cockpit)
 * Hosts multi-tab interface:
 * 1. Chat Copilot
 * 2. Ingest & Parse
 * 3. Deep Inspector (Rubric, Dual-Key Gate, X-Ray Flaws)
 * 4. Conflict & Duplicates Radar
 */
export default function MainStudio({
  activeProjectId,
  activeProject,
  requirements = [],
  selectedReqId,
  selectedRequirement,
  userRole,
  onRequirementUpdated,
  onAdoptRequirement,
  onIngestRequirements,
}) {
  const [activeTab, setActiveTab] = useState('studio'); // 'chat' | 'ingest' | 'studio' | 'conflict'

  const tabs = [
    { id: 'studio', label: '🔍 Deep Studio', badge: selectedRequirement?.id || null },
    { id: 'chat', label: '💬 Chat Copilot' },
    { id: 'ingest', label: '📄 Ingest & Parse' },
    { id: 'conflict', label: '📡 Conflict Radar' },
  ];

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 62px)',
        zIndex: 30,
        overflow: 'hidden',
        padding: '12px 18px 16px',
        position: 'relative',
      }}
    >
      {/* Tab Switcher Bar */}
      <div
        className="glass-panel squircle-md"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 6px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="btn-squircle"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: isActive ? '700' : '500',
                  background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(56, 189, 248, 0.25) 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              >
                {t.label}
                {t.badge && (
                  <span
                    className="badge-chip badge-chip-cyan squircle-xs"
                    style={{ fontSize: '9px', padding: '1px 5px', marginLeft: '4px' }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Active Scope:
          </span>
          <span
            className="badge-chip squircle-xs"
            style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
          >
            {activeProjectId}
          </span>
        </div>
      </div>

      {/* Main Tab Area */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'studio' && (
          <DeepInspectorTab
            requirement={selectedRequirement}
            activeProjectId={activeProjectId}
            userRole={userRole}
            onRequirementUpdated={onRequirementUpdated}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            activeProjectId={activeProjectId}
            activeProject={activeProject}
            onAdoptRequirement={(req) => {
              onAdoptRequirement(req);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'ingest' && (
          <IngestTab
            activeProjectId={activeProjectId}
            activeProject={activeProject}
            onIngestRequirements={(reqs) => {
              onIngestRequirements(reqs);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'conflict' && (
          <ConflictTab
            activeProjectId={activeProjectId}
            activeProject={activeProject}
          />
        )}
      </div>
    </main>
  );
}
