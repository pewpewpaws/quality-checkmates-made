import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StartProjectHero from './components/StartProjectHero';
import RequirementDetail from './components/RequirementDetail';
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
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showStartProject, setShowStartProject] = useState(true);
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

  // Switch project
  const handleSelectProject = (pid) => {
    setCurrentProjectId(pid);
    setShowStartProject(false);
    loadRequirements(pid, role, true);
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
            {showStartProject || (!selectedReqId && !loading && requirements.length === 0) ? (
              <StartProjectHero
                projects={projects}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onOpenIngest={() => setIsIngestModalOpen(true)}
              />
            ) : (
              <RequirementDetail
                requirement={currentRequirement || requirements[0]}
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
    </ClickSpark>
  );
}
