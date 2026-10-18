import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StartProjectHero from './components/StartProjectHero';
import RequirementDetail from './components/RequirementDetail';
import WorkspaceOverview from './components/WorkspaceOverview';
import ChatAndIngestTab from './components/ChatAndIngestTab';
import ExecutiveVerificationTab from './components/ExecutiveVerificationTab';
import IngestModal from './components/IngestModal';
import ClickSpark from './components/ClickSpark';
import DotGrid from './components/DotGrid';
import { BarChart3, MessageSquare, ShieldCheck, FileText } from 'lucide-react';
import { api } from './services/api';

export default function App() {
  const [projects, setProjects] = useState([]);

  // Persistent Navigation & Workspace State across Browser Refresh
  const [currentProjectId, setCurrentProjectId] = useState(() => {
    return localStorage.getItem('copilot_current_project_id') || null;
  });

  const [showStartProject, setShowStartProject] = useState(() => {
    return !localStorage.getItem('copilot_current_project_id');
  });

  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('copilot_active_view') || 'overview';
  });

  const [selectedReqId, setSelectedReqId] = useState(() => {
    return localStorage.getItem('copilot_selected_req_id') || null;
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem('copilot_role') || 'product_manager';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('copilot_sidebar_collapsed') === 'true';
  });

  const [requirements, setRequirements] = useState([]);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem('copilot_current_project_id', currentProjectId);
    } else {
      localStorage.removeItem('copilot_current_project_id');
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (activeView) {
      localStorage.setItem('copilot_active_view', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    if (selectedReqId) {
      localStorage.setItem('copilot_selected_req_id', selectedReqId);
    } else {
      localStorage.removeItem('copilot_selected_req_id');
    }
  }, [selectedReqId]);

  useEffect(() => {
    if (role) {
      localStorage.setItem('copilot_role', role);
      if (role === 'executive' && activeView === 'chat') {
        setActiveView('executive_verification');
      } else if (role !== 'executive' && activeView === 'executive_verification') {
        setActiveView('overview');
      }
    }
  }, [role, activeView]);

  useEffect(() => {
    localStorage.setItem('copilot_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
  }, [isSidebarCollapsed]);

  // 1. Initial Load: Projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      // Validate saved currentProjectId
      if (currentProjectId && data.length > 0) {
        const found = data.find(p => p.project_id === currentProjectId);
        if (!found) {
          setCurrentProjectId(data[0].project_id);
        }
      }
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
          const savedId = localStorage.getItem('copilot_selected_req_id');
          if (savedId) {
            const foundSaved = reqList.find(r => r.id === savedId);
            if (foundSaved) return savedId;
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
    try {
      localStorage.setItem('copilot_current_project_id', pid);
      localStorage.setItem('copilot_active_view', 'overview');
      localStorage.removeItem('copilot_selected_req_id');
    } catch (e) {}
    loadRequirements(pid, role, false);
  };

  // Select requirement -> switch to Detail view
  const handleSelectRequirement = (id) => {
    setSelectedReqId(id);
    setShowStartProject(false);
    setActiveView('detail');
    try {
      localStorage.setItem('copilot_selected_req_id', id);
      localStorage.setItem('copilot_active_view', 'detail');
    } catch (e) {}
  };

  // Switch view tabs
  const handleSelectView = (view) => {
    setActiveView(view);
    try {
      localStorage.setItem('copilot_active_view', view);
    } catch (e) {}
    if (view === 'overview') {
      setSelectedReqId(null);
      try {
        localStorage.removeItem('copilot_selected_req_id');
      } catch (e) {}
    }
  };

  // Open New Project Hero screen
  const handleOpenNewProject = () => {
    setSelectedReqId(null);
    setShowStartProject(true);
    setCurrentProjectId(null);
    try {
      localStorage.removeItem('copilot_current_project_id');
      localStorage.removeItem('copilot_selected_req_id');
      localStorage.setItem('copilot_active_view', 'overview');
    } catch (e) {}
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
          onOpenNewProject={handleOpenNewProject}
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
            onOpenNewProject={handleOpenNewProject}
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
                      <BarChart3 size={13} />
                      <span>Workspace Overview</span>
                    </button>

                    {role === 'executive' ? (
                      <button
                        onClick={() => handleSelectView('executive_verification')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: activeView === 'executive_verification' ? '#181715' : '#D6CEBE',
                          backgroundColor: activeView === 'executive_verification' ? '#181715' : '#FAF8F5',
                          color: activeView === 'executive_verification' ? '#FAF8F5' : '#181715',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: activeView === 'executive_verification' ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ShieldCheck size={14} />
                        <span>Master Test Cases & Certification</span>
                      </button>
                    ) : (
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
                        <MessageSquare size={13} />
                        <span>AI Copilot & Ingest</span>
                      </button>
                    )}

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
                        <FileText size={13} />
                        <span>Requirement {selectedReqId}</span>
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
                    onOpenExecutiveSuite={() => handleSelectView('executive_verification')}
                    onOpenIngest={() => setIsIngestModalOpen(true)}
                    role={role}
                  />
                )}

                {activeView === 'executive_verification' && role === 'executive' && (
                  <ExecutiveVerificationTab
                    project={currentProject}
                    role={role}
                    onBackToOverview={() => handleSelectView('overview')}
                    onSelectRequirement={handleSelectRequirement}
                  />
                )}

                {activeView === 'chat' && role !== 'executive' && (
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
