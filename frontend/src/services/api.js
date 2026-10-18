/**
 * API client for Requirement Quality Copilot
 * Connects to FastAPI backend and Qualcomm Cloud AI 100 endpoints.
 */

const API_BASE = '/api';

export const api = {
  // Projects
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
    return res.json();
  },

  async getProject(projectId) {
    const res = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!res.ok) throw new Error(`Failed to fetch project ${projectId}: ${res.statusText}`);
    return res.json();
  },

  async createProject(payload, role = 'product_manager') {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create project');
    }
    return res.json();
  },

  // Requirements
  async getRequirements(projectId = 'default_project', role = 'product_manager') {
    const res = await fetch(`${API_BASE}/requirements?project_id=${encodeURIComponent(projectId)}`, {
      headers: { 'X-User-Role': role }
    });
    if (!res.ok) throw new Error(`Failed to fetch requirements: ${res.statusText}`);
    return res.json();
  },

  async createRequirement(reqData, role = 'product_manager') {
    const res = await fetch(`${API_BASE}/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify(reqData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create requirement');
    }
    return res.json();
  },

  async getRequirement(id) {
    const res = await fetch(`${API_BASE}/requirements/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch requirement ${id}`);
    return res.json();
  },

  async updateRequirement(id, data, role = 'product_manager') {
    const res = await fetch(`${API_BASE}/requirements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update requirement');
    }
    return res.json();
  },

  async signOff(id, actionPayload, role = 'product_manager') {
    const res = await fetch(`${API_BASE}/requirements/${id}/sign-off`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify(actionPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to sign off');
    }
    return res.json();
  },

  // AI Pipelines
  async runXRay(requirementId, text = null) {
    const res = await fetch(`${API_BASE}/analysis/xray`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement_id: requirementId, text })
    });
    if (!res.ok) throw new Error('Failed to run X-Ray flaw detection');
    return res.json();
  },

  async runDuel(requirementId, text = null) {
    const res = await fetch(`${API_BASE}/analysis/duel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement_id: requirementId, text })
    });
    if (!res.ok) throw new Error('Failed to generate interpretation duel');
    return res.json();
  },

  async runRewrite(requirementId, text = null) {
    const res = await fetch(`${API_BASE}/analysis/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement_id: requirementId, text })
    });
    if (!res.ok) throw new Error('Failed to generate rewrite suggestions');
    return res.json();
  },

  async runBlueprint(requirementId, text = null) {
    const res = await fetch(`${API_BASE}/analysis/blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement_id: requirementId, text })
    });
    if (!res.ok) throw new Error('Failed to generate verification blueprint');
    return res.json();
  },

  // Document Ingestion
  async parseText(text, category = 'Functional', projectId = 'default_project', role = 'product_manager') {
    const res = await fetch(`${API_BASE}/parse/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify({ text, category, project_id: projectId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to parse text');
    }
    return res.json();
  },

  async parseFile(file, category = 'Functional', projectId = 'default_project', role = 'product_manager') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('project_id', projectId);

    const res = await fetch(`${API_BASE}/parse/file`, {
      method: 'POST',
      headers: {
        'X-User-Role': role
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to parse file');
    }
    return res.json();
  },

  // Conversational Copilot Drafting & Chat
  async sendChatMessage(message, projectId = 'default_project', history = [], saveToStore = false, role = 'product_manager') {
    const res = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify({
        project_id: projectId,
        message,
        conversation_history: history,
        save_to_store: saveToStore
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send chat message');
    }
    return res.json();
  },

  async uploadContextDocument(title, category = 'Architecture', projectId = 'default_project', file = null, text = null, role = 'product_manager') {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('project_id', projectId);
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);

    const res = await fetch(`${API_BASE}/chat/context/document`, {
      method: 'POST',
      headers: {
        'X-User-Role': role
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload context document');
    }
    return res.json();
  },

  async chatDraft(userPrompt, projectId = 'default_project', role = 'product_manager') {
    const res = await fetch(`${API_BASE}/chat/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify({ prompt: userPrompt, project_id: projectId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to draft requirement');
    }
    return res.json();
  },

  // Export URLs
  getExportCsvUrl(projectId) {
    return `${API_BASE}/requirements/export/csv?project_id=${encodeURIComponent(projectId)}`;
  },

  getExportPdfUrl(projectId) {
    return `${API_BASE}/requirements/export/pdf?project_id=${encodeURIComponent(projectId)}`;
  },

  // Health
  async getHealth() {
    const res = await fetch('/health');
    if (!res.ok) throw new Error('Backend offline');
    return res.json();
  }
};
