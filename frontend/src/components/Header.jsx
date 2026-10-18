import React, { useState } from 'react';
import { 
  FolderGit2, 
  UserCheck, 
  FileDown, 
  Cpu, 
  Plus, 
  Upload, 
  ChevronDown, 
  FileText, 
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import StarBorder from './StarBorder';

export default function Header({ 
  currentProject, 
  projects = [],
  onSelectProject, 
  role, 
  onRoleChange,
  onOpenNewProject,
  onOpenIngest,
  backendStatus = 'online'
}) {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles = [
    { id: 'product_manager', label: 'Product Manager', icon: '👔', desc: 'Authoring & TBD Value Proposals' },
    { id: 'systems_engineer', label: 'Lead Systems Engineer', icon: '🛠️', desc: 'Technical Sign-Off & Baseline Lock' },
    { id: 'executive', label: 'Senior Executive', icon: '🎖️', desc: 'Master Test Cases & Baseline Certification' }
  ];

  const currentRoleObj = roles.find(r => r.id === role) || roles[0];

  return (
    <header className="top-header">
      {/* Left: Project Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="btn-subtle-cream"
            style={{ fontWeight: 600, padding: '6px 12px' }}
          >
            <FolderGit2 size={16} className="text-stone-700" />
            <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentProject ? currentProject.project_name : 'Select Project'}
            </span>
            <ChevronDown size={14} style={{ opacity: 0.6 }} />
          </button>

          {showProjectMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '310px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E0D5',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-popover)',
                zIndex: 100,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', color: '#8A857C', fontWeight: 600, textTransform: 'uppercase' }}>
                Workspaces ({projects.length})
              </div>
              {projects.map((p) => (
                <div
                  key={p.project_id}
                  onClick={() => {
                    onSelectProject(p.project_id);
                    setShowProjectMenu(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: currentProject?.project_id === p.project_id ? '#F4EFEA' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                  onMouseLeave={(e) => {
                    if (currentProject?.project_id !== p.project_id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#181715' }}>
                      {p.project_name}
                    </span>
                    {p.is_locked && <Lock size={12} className="text-stone-500" />}
                  </div>
                  <span style={{ fontSize: '11px', color: '#55524B' }}>
                    {p.domain}
                  </span>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #EFEAE2', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    onOpenNewProject();
                  }}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#181715',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Plus size={14} /> Create New Workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Domain Badge */}
        {currentProject && (
          <span 
            style={{ 
              fontSize: '11.5px', 
              color: '#55524B', 
              background: '#EFEAE2', 
              padding: '3px 8px', 
              borderRadius: '6px',
              fontWeight: 500
            }}
          >
            {currentProject.domain}
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Hardware Status */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            fontSize: '11.5px', 
            padding: '4px 8px', 
            borderRadius: '6px',
            background: '#F4EFEA',
            color: '#181715',
            fontWeight: 500,
            border: '1px solid #E5E0D5'
          }}
          title="Inference Engine: Qualcomm Cloud AI 100 via Cirrascale"
        >
          <Cpu size={13} style={{ color: '#047857' }} />
          <span>Qualcomm AI 100</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
        </div>

        {/* Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="btn-subtle-cream"
            style={{ padding: '6px 10px', fontSize: '12.5px' }}
          >
            <span>{currentRoleObj.icon}</span>
            <span style={{ fontWeight: 600 }}>{currentRoleObj.label}</span>
            <ChevronDown size={13} style={{ opacity: 0.6 }} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '280px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E0D5',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-popover)',
                zIndex: 100,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '11px', color: '#8A857C', fontWeight: 600, textTransform: 'uppercase' }}>
                Governance Persona (RBAC)
              </div>
              {roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    onRoleChange(r.id);
                    setShowRoleMenu(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: role === r.id ? '#F4EFEA' : 'transparent',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                  onMouseLeave={(e) => {
                    if (role !== r.id) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{r.icon}</span>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#181715' }}>{r.label}</div>
                    <div style={{ fontSize: '11px', color: '#8A857C' }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-subtle-cream"
            style={{ padding: '6px 10px' }}
          >
            <FileDown size={14} />
            <span>Export</span>
            <ChevronDown size={13} style={{ opacity: 0.6 }} />
          </button>

          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '210px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E0D5',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-popover)',
                zIndex: 100,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <a
                href={api.getExportPdfUrl(currentProject?.project_id || 'default_project')}
                target="_blank"
                rel="noreferrer"
                download
                onClick={() => setShowExportMenu(false)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#181715',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileText size={15} className="text-red-600" />
                <div>
                  <div style={{ fontWeight: 600 }}>Engineering PDF</div>
                  <div style={{ fontSize: '10.5px', color: '#8A857C' }}>Formal DOORS Specification</div>
                </div>
              </a>

              <a
                href={api.getExportCsvUrl(currentProject?.project_id || 'default_project')}
                target="_blank"
                rel="noreferrer"
                download
                onClick={() => setShowExportMenu(false)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#181715',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4EFEA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FileSpreadsheet size={15} className="text-emerald-700" />
                <div>
                  <div style={{ fontWeight: 600 }}>RFC 4180 CSV</div>
                  <div style={{ fontSize: '10.5px', color: '#8A857C' }}>Jira & ALM Compatibility</div>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <StarBorder
          as="button"
          onClick={onOpenIngest}
          color="#ffffff"
          trailColor="#ffffff"
          duration={4}
          direction="clockwise"
          stars={1}
          trailLength={0.3}
          thickness={1}
          radius={6}
          glow={0.6}
          hover="lap"
          sparkle={false}
          clickPulse
          theme="dark"
          backgroundColor="#181715"
          textColor="#FAF8F5"
          style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 600 }}
        >
          <Upload size={14} />
          <span>Ingest Specs</span>
        </StarBorder>
      </div>
    </header>
  );
}
