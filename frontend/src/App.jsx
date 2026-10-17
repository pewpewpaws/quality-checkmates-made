import React, { useState, useEffect, useCallback } from 'react';
import GeminiBackground from './components/GeminiBackground';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainStudio from './components/MainStudio';
import {
  fetchProjects,
  fetchProject,
  createProject,
  fetchRequirements,
  createRequirement,
} from './services/api';

/**
 * Main Application Component (Antigravity 2.0 Web Frontend)
 * Implements:
 * - Interactive Google Gemini mobile fluid iridescent background
 * - Top Navigation with 1-Click Persona Switcher (PM <-> Lead Eng <-> Executive)
 * - Collapsible Left Sidebar with Project Workspaces and isolated Requirement Trees
 * - Center Cockpit Studio (Deep Inspector, Chat Copilot, Document Ingest, Conflict Radar)
 * - Squircle continuous curvature geometry throughout
 */
export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState('default_project');
  const [activeProject, setActiveProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [userRole, setUserRole] = useState('product_manager'); // 'product_manager' | 'systems_engineer' | 'executive'
  const [liveMode, setLiveMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load: Fetch Projects
  const loadProjects = useCallback(async () => {
    try {
      const projList = await fetchProjects();
      setProjects(projList);
      if (projList.length > 0 && !activeProjectId) {
        setActiveProjectId(projList[0].project_id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [activeProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 2. Load Requirements & Project Details whenever activeProjectId or userRole changes
  const loadActiveProjectAndRequirements = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const [projData, reqData] = await Promise.all([
        fetchProject(activeProjectId).catch(() => null),
        fetchRequirements(activeProjectId, userRole).catch(() => []),
      ]);

      setActiveProject(projData);
      setRequirements(reqData);

      // Select first requirement by default if none selected or if previous is not in list
      if (reqData.length > 0) {
        setSelectedReqId((prev) => {
          const exists = reqData.some((r) => r.id === prev);
          return exists ? prev : reqData[0].id;
        });
      } else {
        setSelectedReqId(null);
      }
    } catch (err) {
      console.error('Failed to load active project data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, userRole]);

  useEffect(() => {
    loadActiveProjectAndRequirements();
  }, [loadActiveProjectAndRequirements]);

  // 3. Handlers
  const handleRequirementUpdated = (updated) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleRequirementDeleted = (deletedId) => {
    setRequirements((prev) => prev.filter((r) => r.id !== deletedId));
    setSelectedReqId((prev) => {
      if (prev === deletedId) {
        const remaining = requirements.filter((r) => r.id !== deletedId);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return prev;
    });
    loadProjects();
  };

  const handleAddRequirement = async (newReq) => {
    try {
      const created = await createRequirement(newReq, userRole);
      setRequirements((prev) => [created, ...prev]);
      setSelectedReqId(created.id);
      loadProjects(); // refresh counts
    } catch (err) {
      alert(`Failed to add requirement: ${err.message}`);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const created = await createProject(projectData, userRole);
      await loadProjects();
      setActiveProjectId(created.project_id);
    } catch (err) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  const handleAdoptRequirement = async (suggestedReq) => {
    try {
      const payload = {
        ...suggestedReq,
        project_id: activeProjectId,
        status: 'FLAGGED_TBD',
      };
      const created = await createRequirement(payload, userRole);
      setRequirements((prev) => [created, ...prev]);
      setSelectedReqId(created.id);
      loadProjects();
    } catch (err) {
      alert(`Failed to adopt requirement: ${err.message}`);
    }
  };

  const handleIngestRequirements = async (newReqs) => {
    try {
      for (const req of newReqs) {
        req.project_id = activeProjectId;
        await createRequirement(req, userRole);
      }
      await loadActiveProjectAndRequirements();
      await loadProjects();
    } catch (err) {
      alert(`Failed to ingest requirements: ${err.message}`);
    }
  };

  const selectedRequirement = requirements.find((r) => r.id === selectedReqId);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Interactive Google Gemini Fluid Background */}
      <GeminiBackground />

      {/* Top Navigation Bar */}
      <Header
        activeProject={activeProject}
        activeProjectId={activeProjectId}
        requirements={requirements}
        userRole={userRole}
        setUserRole={setUserRole}
        liveMode={liveMode}
        setLiveMode={setLiveMode}
      />

      {/* Main Workspace Cockpit (Sidebar + Center Studio) */}
      <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 62px)', position: 'relative', zIndex: 10 }}>
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          requirements={requirements}
          selectedReqId={selectedReqId}
          setSelectedReqId={setSelectedReqId}
          onAddRequirement={handleAddRequirement}
          onCreateProject={handleCreateProject}
          userRole={userRole}
        />

        <MainStudio
          activeProjectId={activeProjectId}
          activeProject={activeProject}
          requirements={requirements}
          selectedReqId={selectedReqId}
          selectedRequirement={selectedRequirement}
          userRole={userRole}
          onRequirementUpdated={handleRequirementUpdated}
          onRequirementDeleted={handleRequirementDeleted}
          onAdoptRequirement={handleAdoptRequirement}
          onIngestRequirements={handleIngestRequirements}
        />
      </div>
    </div>
  );
}
