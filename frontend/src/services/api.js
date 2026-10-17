/**
 * API Service Client for Requirement Quality Copilot
 * Communicates with FastAPI backend with dynamic Persona RBAC headers (X-User-Role).
 */

const BASE_URL = '';

export async function fetchProjects() {
  const res = await fetch(`${BASE_URL}/api/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.statusText}`);
  return res.json();
}

export async function fetchProject(projectId) {
  const res = await fetch(`${BASE_URL}/api/projects/${projectId}`);
  if (!res.ok) throw new Error(`Failed to fetch project details: ${res.statusText}`);
  return res.json();
}

export async function createProject(payload, role = 'product_manager') {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.statusText}`);
  return res.json();
}

export async function fetchRequirements(projectId = 'default_project', role = 'product_manager') {
  const res = await fetch(`${BASE_URL}/api/requirements?project_id=${encodeURIComponent(projectId)}`, {
    headers: {
      'X-User-Role': role,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch requirements: ${res.statusText}`);
  return res.json();
}

export async function fetchRequirement(reqId, projectId = 'default_project', role = 'product_manager') {
  const res = await fetch(`${BASE_URL}/api/requirements/${encodeURIComponent(reqId)}?project_id=${encodeURIComponent(projectId)}`, {
    headers: {
      'X-User-Role': role,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch requirement: ${res.statusText}`);
  return res.json();
}

export async function createRequirement(payload, role = 'product_manager') {
  const res = await fetch(`${BASE_URL}/api/requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create requirement: ${res.statusText}`);
  return res.json();
}

export async function updateRequirement(reqId, payload, role = 'product_manager') {
  const res = await fetch(`${BASE_URL}/api/requirements/${encodeURIComponent(reqId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update requirement: ${res.statusText}`);
  return res.json();
}

export async function signOffRequirement(reqId, actionPayload, projectId = 'default_project', role = 'product_manager') {
  const res = await fetch(`${BASE_URL}/api/requirements/${encodeURIComponent(reqId)}/sign-off?project_id=${encodeURIComponent(projectId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': role,
    },
    body: JSON.stringify(actionPayload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Sign-off action failed: ${res.statusText}`);
  }
  return res.json();
}

export async function calculateRubricScore(text) {
  const res = await fetch(`${BASE_URL}/api/analysis/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to score: ${res.statusText}`);
  return res.json();
}

export async function runXray(text, projectId = 'default_project', requirementId = null) {
  const payload = { text, project_id: projectId };
  if (requirementId) payload.requirement_id = requirementId;
  const res = await fetch(`${BASE_URL}/api/analysis/xray`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to run X-Ray: ${res.statusText}`);
  return res.json();
}

export async function runDuel(text, flawQuote, flawType = 'Ambiguity') {
  const res = await fetch(`${BASE_URL}/api/analysis/duel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      flaw_quote: flawQuote || text.substring(0, 30),
      flaw_type: flawType,
    }),
  });
  if (!res.ok) throw new Error(`Failed to run Duel: ${res.statusText}`);
  return res.json();
}

export async function runRewrite(text, projectId = 'default_project') {
  const res = await fetch(`${BASE_URL}/api/analysis/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, project_id: projectId }),
  });
  if (!res.ok) throw new Error(`Failed to rewrite: ${res.statusText}`);
  return res.json();
}

export async function runBlueprint(text) {
  const res = await fetch(`${BASE_URL}/api/analysis/blueprint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to generate blueprint: ${res.statusText}`);
  return res.json();
}

export async function detectConflicts(projectId = 'default_project') {
  const res = await fetch(`${BASE_URL}/api/requirements/conflicts?project_id=${encodeURIComponent(projectId)}`);
  if (!res.ok) throw new Error(`Failed to detect conflicts: ${res.statusText}`);
  return res.json();
}

export async function checkSemanticDuplicates(projectId = 'default_project') {
  const res = await fetch(`${BASE_URL}/api/requirements/duplicates/semantic?project_id=${encodeURIComponent(projectId)}`);
  if (!res.ok) throw new Error(`Failed to detect duplicates: ${res.statusText}`);
  return res.json();
}

export async function sendChatMessage(message, projectId = 'default_project', history = [], saveToStore = false) {
  const res = await fetch(`${BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      project_id: projectId,
      save_to_store: saveToStore,
      conversation_history: history,
    }),
  });
  if (!res.ok) throw new Error(`Chat copilot failed: ${res.statusText}`);
  return res.json();
}

export async function parseText(text, category = 'General', projectId = 'default_project') {
  const res = await fetch(`${BASE_URL}/api/parse/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, category, project_id: projectId }),
  });
  if (!res.ok) throw new Error(`Failed to parse text: ${res.statusText}`);
  return res.json();
}

export async function parseFile(file, category = 'General', projectId = 'default_project') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('project_id', projectId);

  const res = await fetch(`${BASE_URL}/api/parse/file`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Failed to parse file: ${res.statusText}`);
  return res.json();
}

export function getExportCsvUrl(projectId, role = 'product_manager') {
  return `${BASE_URL}/api/requirements/export/csv?project_id=${encodeURIComponent(projectId)}`;
}

export function getExportPdfUrl(projectId, role = 'product_manager') {
  return `${BASE_URL}/api/requirements/export/pdf?project_id=${encodeURIComponent(projectId)}`;
}
