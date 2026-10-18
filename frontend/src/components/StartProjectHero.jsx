import React, { useState } from 'react';
import { Sparkles, ArrowRight, FolderPlus, FileUp, Shield, Cpu, Layers } from 'lucide-react';
import ScrambledText from './ScrambledText';
import StarBorder from './StarBorder';

export default function StartProjectHero({ 
  onCreateProject, 
  onSelectProject, 
  onOpenIngest,
  projects = []
}) {
  const [projectName, setProjectName] = useState('');
  const [domain, setDomain] = useState('Automotive Safety (ISO 26262)');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsSubmitting(true);
    const slug = 'proj-' + projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    try {
      await onCreateProject({
        project_id: slug,
        project_name: projectName.trim(),
        domain: domain,
        description: description.trim() || `Isolated engineering workspace for ${projectName.trim()}.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-3mm)'
      }}
    >
      {/* Hero Header with ScrambledText Animation from React Bits */}
      <div 
        className="cream-card" 
        style={{ 
          padding: '28px 24px', 
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E0D5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F4EFEA', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, color: '#181715' }}>
          <Sparkles size={13} style={{ color: '#D97706' }} />
          <span>Qualcomm Cloud AI 100 Acceleration</span>
        </div>

        {/* Integrated ScrambledText from React Bits */}
        <div style={{ margin: '8px 0', fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: '#181715' }}>
          <ScrambledText
            effect="scramble"
            radius={90}
            duration={1.0}
            speed={0.4}
            scrambleChars=".:_="
            intro={true}
            clickBurst={true}
          >
            Start Your New Project
          </ScrambledText>
        </div>

        <p style={{ color: '#55524B', fontSize: '14px', maxWidth: '580px', lineHeight: 1.5, margin: 0 }}>
          Create an isolated workspace or load a mission-critical domain specification to audit requirements with zero-fabrication guarantees and dual-key sign-off.
        </p>
      </div>

      {/* Grid with 3mm Space Rhythm */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-3mm)' }}>
        {/* Card 1: Create New Project Form */}
        <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3mm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F0ECE4', paddingBottom: '8px' }}>
            <FolderPlus size={16} className="text-stone-800" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#181715' }}>
              Create Custom Workspace
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '4px', textTransform: 'uppercase' }}>
                Project Title
              </label>
              <input
                type="text"
                placeholder="e.g. Next-Gen Electric Powertrain ECU"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #E5E0D5',
                  backgroundColor: '#FAF8F5',
                  outline: 'none',
                  color: '#181715'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '4px', textTransform: 'uppercase' }}>
                Engineering Safety Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #E5E0D5',
                  backgroundColor: '#FAF8F5',
                  outline: 'none',
                  color: '#181715'
                }}
              >
                <option value="Automotive Safety (ISO 26262 / ASIL-D)">Automotive Safety (ISO 26262 / ASIL-D)</option>
                <option value="Aerospace Avionics (DO-178C / Level-A)">Aerospace Avionics (DO-178C / Level-A)</option>
                <option value="Medical Devices (IEC 62304 / Class III)">Medical Devices (IEC 62304 / Class III)</option>
                <option value="Industrial IoT & Rail Automation">Industrial IoT & Rail Automation</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '4px', textTransform: 'uppercase' }}>
                Safety Charter / Context
              </label>
              <textarea
                rows={2}
                placeholder="Boundaries, latency caps, or target hardware specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E0D5',
                  backgroundColor: '#FAF8F5',
                  outline: 'none',
                  color: '#181715',
                  resize: 'none'
                }}
              />
            </div>

            <StarBorder
              as="button"
              type="submit"
              disabled={isSubmitting || !projectName.trim()}
              color="#ffffff"
              trailColor="#ffffff"
              duration={4}
              direction="clockwise"
              stars={1}
              trailLength={0.3}
              thickness={1}
              radius={8}
              glow={0.6}
              hover="lap"
              sparkle={false}
              clickPulse
              theme="dark"
              backgroundColor="#181715"
              textColor="#FAF8F5"
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: '4px',
                padding: '9px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting || !projectName.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              <FolderPlus size={14} />
              <span>{isSubmitting ? 'Initializing...' : 'Initialize Workspace'}</span>
            </StarBorder>
          </form>
        </div>

        {/* Card 2: Quick Demo Preloaded Workspaces */}
        <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3mm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #F0ECE4', paddingBottom: '8px' }}>
            <Layers size={16} className="text-stone-800" />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#181715' }}>
              Explore Preloaded Baselines
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            {projects.map((p) => (
              <div
                key={p.project_id}
                onClick={() => onSelectProject(p.project_id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E0D5',
                  backgroundColor: '#FAF8F5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F4EFEA';
                  e.currentTarget.style.borderColor = '#181715';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAF8F5';
                  e.currentTarget.style.borderColor = '#E5E0D5';
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#181715' }}>
                    {p.project_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#55524B' }}>
                    {p.domain}
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: '#8A857C' }} />
              </div>
            ))}
          </div>

          {/* Ingest Specs shortcut */}
          <button
            onClick={onOpenIngest}
            className="btn-subtle-cream"
            style={{ justifyContent: 'center', padding: '8px 12px' }}
          >
            <FileUp size={14} />
            <span>Parse & Ingest Document Instead</span>
          </button>
        </div>
      </div>
    </div>
  );
}
