import React, { useState } from 'react';
import ChatTab from './ChatTab';
import IngestTab from './IngestTab';
import DeepInspectorTab from './DeepInspectorTab';
import ConflictTab from './ConflictTab';

/**
 * MainStudio Component (Antigravity 2.0 Pro Edition)
 * Clean tabbed center workspace with muted surfaces and crisp typography.
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
  const [activeTab, setActiveTab] = useState('studio');

  const tabs = [
    { id: 'studio', label: 'Inspector', badge: selectedRequirement?.id || null },
    { id: 'chat', label: 'Copilot Chat' },
    { id: 'ingest', label: 'Ingest & Parse' },
    { id: 'conflict', label: 'Conflict Radar' },
  ];

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 52px)',
        zIndex: 30,
        overflow: 'hidden',
        padding: '10px 14px 12px',
        position: 'relative',
        background: 'var(--bg-app)',
      }}
    >
      {/* Tab Switcher Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 4px',
          marginBottom: '10px',
          borderBottom: '1px solid var(--border-subtle)',
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
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: isActive ? '600' : '500',
                  background: isActive ? 'var(--bg-card-selected)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                  borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  borderRadius: '6px 6px 0 0',
                }}
              >
                {t.label}
                {t.badge && (
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      marginLeft: '5px',
                      background: 'var(--accent-blue-subtle)',
                      color: 'var(--accent-blue)',
                      borderRadius: '3px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Workspace:</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
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
