import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StartProjectHero from './components/StartProjectHero';
import RequirementDetail from './components/RequirementDetail';
import WorkspaceOverview from './components/WorkspaceOverview';
import ChatAndIngestTab from './components/ChatAndIngestTab';
import IngestModal from './components/IngestModal';
import ClickSpark from './components/ClickSpark';
import DotGrid from './components/DotGrid';
import { api } from './services/api';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [role, setRole] = useState('product_manager'); // 'product_manager' | 'systems_engineer' | 'executive'
  
  // Navigation View: 'overview' | 'chat' | 'detail'
  const [activeView, setActiveView] = useState('overview');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showStartProject, setShowStartProject] = useState(true);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Initial Load: Projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // 2. Fetch Requirements when currentProjectId or role changes
  useEffect(() => {
    if (currentProjectId) {
      loadRequirements(currentProjectId, role);
    }
  }, [currentProjectId, role]);

  const loadRequirements = async (pid, activeRole, autoSelect = false) => {
    setLoading(true);
    try {
      const data = await api.getRequirements(pid, activeRole);
      const reqList = data || [];
      setRequirements(reqList);
      if (reqList.length > 0) {
        setSelectedReqId(prev => {
          if (prev) {
            const stillExists = reqList.find(r => r.id === prev);
            if (stillExists) return prev;
          }
          return autoSelect ? reqList[0].id : null;
        });
      } else {
        setSelectedReqId(null);
      }
    } catch (err) {
      console.error('Error loading requirements:', err);
      setRequirements([]);
      setSelectedReqId(null);
    } finally {
      setLoading(false);
    }
  };

  // Switch project -> invite user with Overview screen
  const handleSelectProject = (pid) => {
    setCurrentProjectId(pid);
    setShowStartProject(false);
    setSelectedReqId(null);
    setActiveView('overview');
    loadRequirements(pid, role, false);
  };

  // Select requirement -> switch to Detail view
  const handleSelectRequirement = (id) => {
    setSelectedReqId(id);
    setShowStartProject(false);
    setActiveView('detail');
  };

  // Switch view tabs
  const handleSelectView = (view) => {
    setActiveView(view);
    if (view === 'overview') {
      setSelectedReqId(null);
    }
  };

  // Create project handler
  const handleCreateProject = async (newProjData) => {
    try {
      const created = await api.createProject(newProjData, role);
      await loadProjects();
      setCurrentProjectId(created.project_id);
      setShowStartProject(false);
      setSelectedReqId(null);
      setActiveView('overview');
    } catch (err) {
      alert(`Could not create project: ${err.message}`);
    }
  };

  // When a requirement is updated via sign-off or edit
  const handleRequirementUpdated = (updatedReq) => {
    setRequirements(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
  };

  // When new specs are ingested from modal or chat
  const handleIngestSuccess = (newReqs) => {
    loadRequirements(currentProjectId, role);
    if (newReqs && newReqs.length > 0) {
      setSelectedReqId(newReqs[0].id);
      setActiveView('detail');
      setShowStartProject(false);
    }
  };

  const handleRequirementsIngested = (newReqs) => {
    loadRequirements(currentProjectId, role);
  };

  // Chat history persistence per workspace (survives tab switches and browser refresh)
  const [chatHistories, setChatHistories] = useState(() => {
    try {
      const saved = localStorage.getItem('copilot_chat_histories');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleUpdateChatMessages = (pid, newMessages) => {
    if (!pid) return;
    setChatHistories(prev => {
      const updated = { ...prev, [pid]: newMessages };
      try {
        localStorage.setItem('copilot_chat_histories', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist chat history:', e);
      }
      return updated;
    });
  };

  const handleClearChat = (pid) => {
    if (!pid) return;
    setChatHistories(prev => {
      const updated = { ...prev };
      delete updated[pid];
      try {
        localStorage.setItem('copilot_chat_histories', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not clear chat history in localStorage:', e);
      }
      return updated;
    });
  };

  const currentProject = projects.find(p => p.project_id === currentProjectId) || null;
  const currentRequirement = requirements.find(r => r.id === selectedReqId) || null;

  return (
    <ClickSpark
      sparkColor="#fff"
      shape="line"
      sparkCount={8}
      sparkSize={14}
      sparkRadius={30}
      duration={500}
    >
      <div className="app-shell" style={{ position: 'relative' }}>
        {/* Left Sidebar */}
        <Sidebar
          projects={projects}
          currentProjectId={currentProjectId}
          onSelectProject={handleSelectProject}
          requirements={requirements}
          selectedReqId={selectedReqId}
          onSelectRequirement={handleSelectRequirement}
          onOpenNewProject={() => {
            setSelectedReqId(null);
            setShowStartProject(true);
          }}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeView={activeView}
          onSelectView={handleSelectView}
        />

        {/* Main Canvas */}
        <div className="main-canvas" style={{ position: 'relative' }}>
          {/* Main Background DotGrid from React Bits */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              overflow: 'hidden'
            }}
          >
            <DotGrid
              baseColor="#E8E2D4"
              activeColor="#6E6252"
              shape="circle"
              dotSize={4.5}
              gap={19}
              proximity={140}
              strength={1}
              bounce={0.6}
              tension={0.4}
              returnDuration={0.8}
              shockRadius={320}
              shockStrength={5}
              swell={0.8}
              stretch={0.5}
              glow={0.3}
              fade={0}
              intro={true}
            />
          </div>

          {/* Top Header */}
          <Header
            currentProject={currentProject}
            projects={projects}
            onSelectProject={handleSelectProject}
            role={role}
            onRoleChange={setRole}
            onOpenNewProject={() => {
              setSelectedReqId(null);
              setShowStartProject(true);
            }}
            onOpenIngest={() => setIsIngestModalOpen(true)}
          />

          {/* Center Content Viewport */}
          <main className="content-viewport" style={{ position: 'relative', zIndex: 1 }}>
            {showStartProject || !currentProjectId ? (
              <StartProjectHero
                projects={projects}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onOpenIngest={() => setIsIngestModalOpen(true)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                {/* Workspace Top View Navigation Bar */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #E5E0D5',
                  paddingBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleSelectView('overview')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: activeView === 'overview' ? '#181715' : '#E5E0D5',
                        backgroundColor: activeView === 'overview' ? '#181715' : '#FFFFFF',
                        color: activeView === 'overview' ? '#FAF8F5' : '#57534E',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>📊 Workspace Overview</span>
                    </button>

                    <button
                      onClick={() => handleSelectView('chat')}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: activeView === 'chat' ? '#181715' : '#E5E0D5',
                        backgroundColor: activeView === 'chat' ? '#181715' : '#FFFFFF',
                        color: activeView === 'chat' ? '#FAF8F5' : '#57534E',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>💬 AI Copilot & Ingest</span>
                    </button>

                    {selectedReqId && (
                      <button
                        onClick={() => handleSelectView('detail')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: activeView === 'detail' ? '#181715' : '#E5E0D5',
                          backgroundColor: activeView === 'detail' ? '#181715' : '#FFFFFF',
                          color: activeView === 'detail' ? '#FAF8F5' : '#57534E',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>📋 Requirement {selectedReqId}</span>
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#78716C', fontFamily: 'var(--font-mono)' }}>
                    Workspace: <strong style={{ color: '#181715' }}>{currentProject?.project_id}</strong>
                  </div>
                </div>

                {/* View Switcher */}
                {activeView === 'overview' && (
                  <WorkspaceOverview
                    project={currentProject}
                    requirements={requirements}
                    onSelectRequirement={handleSelectRequirement}
                    onOpenChat={() => handleSelectView('chat')}
                    onOpenIngest={() => setIsIngestModalOpen(true)}
                    role={role}
                  />
                )}

                {activeView === 'chat' && (
                  <ChatAndIngestTab
                    project={currentProject}
                    role={role}
                    chatMessages={chatHistories[currentProjectId] || null}
                    onUpdateChatMessages={(msgs) => handleUpdateChatMessages(currentProjectId, msgs)}
                    onClearChat={() => handleClearChat(currentProjectId)}
                    onRequirementsIngested={handleRequirementsIngested}
                    onSelectRequirement={handleSelectRequirement}
                    onBackToOverview={() => handleSelectView('overview')}
                  />
                )}

                {activeView === 'detail' && (
                  <RequirementDetail
                    requirement={currentRequirement || requirements[0]}
                    project={currentProject}
                    role={role}
                    onRequirementUpdated={handleRequirementUpdated}
                    onBackToOverview={() => handleSelectView('overview')}
                  />
                )}
              </div>
            )}
          </main>
        </div>

        {/* Document Ingest Modal */}
        <IngestModal
          isOpen={isIngestModalOpen}
          onClose={() => setIsIngestModalOpen(false)}
          projectId={currentProjectId}
          role={role}
          onIngestSuccess={handleIngestSuccess}
        />
      </div>
    </ClickSpark>
  );
}
