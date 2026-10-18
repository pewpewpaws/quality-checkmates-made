import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StartProjectHero from './components/StartProjectHero';
import RequirementDetail from './components/RequirementDetail';
import IngestModal from './components/IngestModal';
import { api } from './services/api';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('default_project');
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [role, setRole] = useState('PRODUCT_MANAGER'); // 'PRODUCT_MANAGER' | 'SYSTEMS_ENGINEER' | 'EXECUTIVE'
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showStartProject, setShowStartProject] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load: Projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0 && !currentProjectId) {
        setCurrentProjectId(data[0].project_id);
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

  const loadRequirements = async (pid, activeRole) => {
    setLoading(true);
    try {
      const data = await api.getRequirements(pid, activeRole);
      setRequirements(data);
      // If we had a selected requirement that still exists in data, keep it; otherwise select first or null
      if (selectedReqId) {
        const stillExists = data.find(r => r.id === selectedReqId);
        if (!stillExists && data.length > 0) {
          setSelectedReqId(data[0].id);
        } else if (!stillExists) {
          setSelectedReqId(null);
        }
      } else if (data.length > 0 && !showStartProject) {
        setSelectedReqId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading requirements:', err);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  // Switch project
  const handleSelectProject = (pid) => {
    setCurrentProjectId(pid);
    setShowStartProject(false);
  };

  // Select requirement
  const handleSelectRequirement = (id) => {
    setSelectedReqId(id);
    setShowStartProject(false);
  };

  // Create project handler
  const handleCreateProject = async (newProjData) => {
    try {
      const created = await api.createProject(newProjData, role);
      await loadProjects();
      setCurrentProjectId(created.project_id);
      setShowStartProject(false);
    } catch (err) {
      alert(`Could not create project: ${err.message}`);
    }
  };

  // When a requirement is updated via sign-off or edit
  const handleRequirementUpdated = (updatedReq) => {
    setRequirements(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
  };

  // When new specs are ingested
  const handleIngestSuccess = (newReqs) => {
    loadRequirements(currentProjectId, role);
    if (newReqs && newReqs.length > 0) {
      setSelectedReqId(newReqs[0].id);
      setShowStartProject(false);
    }
  };

  const currentProject = projects.find(p => p.project_id === currentProjectId) || null;
  const currentRequirement = requirements.find(r => r.id === selectedReqId) || null;

  return (
    <div className="app-shell">
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
      />

      {/* Main Canvas */}
      <div className="main-canvas">
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
        <main className="content-viewport">
          {showStartProject || (!selectedReqId && !loading && requirements.length === 0) ? (
            <StartProjectHero
              projects={projects}
              onSelectProject={handleSelectProject}
              onCreateProject={handleCreateProject}
              onOpenIngest={() => setIsIngestModalOpen(true)}
            />
          ) : (
            <RequirementDetail
              requirement={currentRequirement}
              project={currentProject}
              role={role}
              onRequirementUpdated={handleRequirementUpdated}
            />
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
  );
}
