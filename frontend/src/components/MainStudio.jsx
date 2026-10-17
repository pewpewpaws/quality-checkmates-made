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
  onRequirementDeleted,
  onAdoptRequirement,
  onIngestRequirements,
}) {
  const [activeTab, setActiveTab] = useState('studio');

  const tabs = [
    { id: 'studio', label: 'Inspector', icon: '📋', badge: selectedRequirement?.id || null },
    { id: 'chat', label: 'Copilot Chat', icon: '💬' },
    { id: 'ingest', label: 'Ingest Documents', icon: '📥' },
    { id: 'conflict', label: 'Conflict Radar', icon: '⚡' },
  ];

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 44px)',
        zIndex: 30,
        overflow: 'hidden',
        padding: '8px 16px 12px',
        position: 'relative',
        background: 'var(--bg-app)',
      }}
    >
      {/* Notion View Switcher Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
          marginBottom: '10px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', gap: '2px' }}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '500',
                  background: 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  borderRadius: '3px 3px 0 0',
                  transition: 'color 0.1s ease',
                }}
                className="notion-tab-btn"
              >
                <span style={{ fontSize: '13px' }}>{t.icon}</span>
                {t.label}
                {t.badge && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '1px 5px',
                      marginLeft: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-secondary)',
                      borderRadius: '3px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '500',
                    }}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Workspace:</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '600' }}>
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
            onRequirementDeleted={onRequirementDeleted}
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
