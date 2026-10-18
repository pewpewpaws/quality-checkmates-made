import React, { useState } from 'react';
import { 
  FolderGit2, 
  Sparkles, 
  MessageSquare, 
  FileUp, 
  FileDown, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Search, 
  ChevronRight,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Award
} from 'lucide-react';
import StarBorder from './StarBorder';
import { api } from '../services/api';

export default function WorkspaceOverview({
  project,
  requirements = [],
  onSelectRequirement,
  onOpenChat,
  onOpenExecutiveSuite,
  onOpenIngest,
  role
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A857C' }}>
        <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid #E5E0D5', borderTopColor: '#181715', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
        <div style={{ fontSize: '13px', fontWeight: 500 }}>Loading workspace overview...</div>
      </div>
    );
  }

  // Calculate high-fidelity metrics
  const totalReqs = requirements.length;
  const scoredReqs = requirements.filter(r => r.quality_score && (r.quality_score.overall !== undefined || r.quality_score.composite_score !== undefined));
  
  const avgScore = scoredReqs.length > 0
    ? (scoredReqs.reduce((sum, r) => sum + (r.quality_score.overall ?? r.quality_score.composite_score ?? 0), 0) / scoredReqs.length)
    : 0;
  const roundedAvgScore = Math.round(avgScore * 10) / 10;

  const tbdCount = requirements.filter(r => r.status === 'FLAGGED_TBD').length;
  const provisionalCount = requirements.filter(r => r.status === 'PROVISIONAL_PM').length;
  const lockedCount = requirements.filter(r => r.status === 'LOCKED_BASELINE').length;

  const totalFlaws = requirements.reduce((acc, r) => acc + (r.issues ? r.issues.length : 0), 0);

  // Filter requirements for the table preview
  const filteredReqs = requirements.filter(r => {
    const matchesSearch = 
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3mm)', maxWidth: '1020px', margin: '0 auto', width: '100%', paddingBottom: '32px' }}>
      
      {/* 1. Hero Workspace Card */}
      <div 
        className="cream-card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '14px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
          border: '1px solid #E5E0D5',
          borderRadius: '12px',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#78716C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engineering Workspace
              </span>
              <span style={{ fontSize: '11px', color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {project.domain || 'Systems Engineering'}
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#181715', letterSpacing: '-0.02em', margin: 0 }}>
              {project.project_name}
            </h1>
            <p style={{ fontSize: '13px', color: '#55524B', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
              {project.description || 'Enterprise requirement specification workspace with Qualcomm Cloud AI 100 verification pipeline.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {role === 'executive' ? (
              <StarBorder
                as="button"
                onClick={onOpenExecutiveSuite}
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
                style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Award size={14} />
                <span>Executive Master Test Suite</span>
              </StarBorder>
            ) : (
              <StarBorder
                as="button"
                onClick={onOpenChat}
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
                style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageSquare size={14} />
                <span>AI Copilot & Ingest</span>
              </StarBorder>
            )}

            <a
              href={api.getExportPdfUrl(project.project_id)}
              download={`${project.project_id}_specification.pdf`}
              className="btn-subtle-cream"
              style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              title="Download Publication-Grade Specification PDF"
            >
              <FileDown size={14} />
              <span>Export PDF</span>
            </a>

            <a
              href={api.getExportCsvUrl(project.project_id)}
              download={`${project.project_id}_baseline.csv`}
              className="btn-subtle-cream"
              style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              title="Download RFC 4180 CSV Baseline"
            >
              <FileSpreadsheet size={14} />
              <span>CSV</span>
            </a>
          </div>
        </div>

        {/* Workspace Charter Accordion / Callout */}
        {project.context && (
          <div style={{ background: '#F5F1E9', border: '1px solid #EBE4D8', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#44403C' }}>
            <div style={{ fontWeight: 600, color: '#181715', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} className="text-stone-700" />
              <span>Architecture Charter & Grounding Context</span>
            </div>
            <div>{project.context.description || project.context.domain}</div>
            {project.context.documents && project.context.documents.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {project.context.documents.map((d, i) => (
                  <span key={i} style={{ fontSize: '10.5px', background: '#FFFFFF', border: '1px solid #D6CEBE', padding: '2px 6px', borderRadius: '4px', color: '#57534E' }}>
                    📄 {d.title} ({d.category})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Key Metrics & Health Scorecard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {/* Metric 1: Total Requirements */}
        <div className="cream-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>
            Total Statements
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#181715', fontFamily: 'var(--font-mono)' }}>
            {totalReqs}
          </div>
          <div style={{ fontSize: '11px', color: '#57534E' }}>
            Atomic requirements in workspace
          </div>
        </div>

        {/* Metric 2: Average Rubric Score */}
        <div className="cream-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>
            Baseline Quality Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 800, 
              fontFamily: 'var(--font-mono)',
              color: roundedAvgScore >= 80 ? '#047857' : roundedAvgScore >= 60 ? '#B45309' : '#B91C1C'
            }}>
              {roundedAvgScore}
            </span>
            <span style={{ fontSize: '12px', color: '#8A857C' }}>/ 100</span>
          </div>
          <div style={{ fontSize: '11px', color: roundedAvgScore >= 80 ? '#047857' : '#B45309', fontWeight: 600 }}>
            {roundedAvgScore >= 80 ? 'Pitch-Ready Baseline' : 'Needs Parameterization'}
          </div>
        </div>

        {/* Metric 3: Governance Pipeline */}
        <div className="cream-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>
            Dual-Key Governance
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span 
              className="badge-status badge-tbd" 
              style={{ fontSize: '11px', padding: '3px 7px' }}
              title="FLAGGED_TBD: Unresolved parameter placeholders"
            >
              {tbdCount} TBD
            </span>
            <span 
              className="badge-status badge-provisional" 
              style={{ fontSize: '11px', padding: '3px 7px' }}
              title="PROVISIONAL_PM: Proposed target, pending Lead Systems Engineer sign-off"
            >
              {provisionalCount} Prov
            </span>
            <span 
              className="badge-status badge-locked" 
              style={{ fontSize: '11px', padding: '3px 7px' }}
              title="LOCKED_BASELINE: Formally signed-off with falsifiable test blueprint"
            >
              {lockedCount} Lock
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#57534E', marginTop: '2px' }}>
            {lockedCount} / {totalReqs} locked to baseline
          </div>
        </div>

        {/* Metric 4: Flaw Extraction */}
        <div className="cream-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#78716C', textTransform: 'uppercase' }}>
            Defects & Ambiguities
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: totalFlaws > 0 ? '#B45309' : '#047857', fontFamily: 'var(--font-mono)' }}>
            {totalFlaws}
          </div>
          <div style={{ fontSize: '11px', color: '#57534E' }}>
            Extracted on Qualcomm AI 100
          </div>
        </div>
      </div>

      {/* 3. Ingestion & AI Copilot Action Hero Banner */}
      <div 
        style={{ 
          background: '#FAF8F5', 
          border: '1px dashed #D6CEBE', 
          borderRadius: '10px', 
          padding: '16px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#181715', color: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#181715' }}>
              Conversational Copilot & Document Ingestion
            </span>
            <span style={{ fontSize: '12px', color: '#57534E' }}>
              Type requirements in plain English, or upload PDF, TXT, CSV specs to parse atomic requirements with automatic Qualcomm AI flaw extraction.
            </span>
          </div>
        </div>

        <button
          onClick={onOpenChat}
          className="btn-subtle-cream"
          style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          <span>Open Chat & Ingest</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 4. Requirements Matrix Table Preview */}
      <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} className="text-stone-700" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#181715' }}>
              Requirements Directory ({filteredReqs.length})
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#8A857C' }} />
              <input
                type="text"
                placeholder="Search statements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  fontSize: '11.5px',
                  border: '1px solid #E5E0D5',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#181715',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'FLAGGED_TBD', label: 'TBD' },
                { id: 'PROVISIONAL_PM', label: 'Provisional' },
                { id: 'LOCKED_BASELINE', label: 'Locked' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: statusFilter === f.id ? '#181715' : '#E5E0D5',
                    backgroundColor: statusFilter === f.id ? '#181715' : '#FFFFFF',
                    color: statusFilter === f.id ? '#FAF8F5' : '#57534E',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredReqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: '#8A857C', fontSize: '13px' }}>
            No requirements match this filter. Use the AI Copilot to generate or ingest new requirements.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #EBE4D8' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#F7F3EC', borderBottom: '1px solid #E5E0D5', color: '#78716C', textTransform: 'uppercase', fontSize: '10.5px', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Requirement Statement</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Score</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600 }}>Governance State</th>
                  <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReqs.map(req => {
                  const reqScore = req.quality_score?.overall ?? req.quality_score?.composite_score ?? null;
                  const displayReqScore = reqScore !== null ? Math.round(reqScore * 10) / 10 : null;

                  return (
                    <tr 
                      key={req.id}
                      onClick={() => onSelectRequirement(req.id)}
                      style={{ 
                        borderBottom: '1px solid #F0ECE4',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                        backgroundColor: '#FFFFFF'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F5'}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#181715', whiteSpace: 'nowrap' }}>
                        {req.id}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#57534E', whiteSpace: 'nowrap' }}>
                        <span style={{ background: '#F4EFEA', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                          {req.category || 'Functional'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#292524', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.text}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {displayReqScore !== null ? (
                          <span style={{ 
                            fontSize: '11.5px', 
                            fontWeight: 700, 
                            fontFamily: 'var(--font-mono)',
                            color: displayReqScore >= 80 ? '#047857' : displayReqScore >= 60 ? '#B45309' : '#B91C1C' 
                          }}>
                            {displayReqScore} / 100
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#A8A29E' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {req.status === 'FLAGGED_TBD' && (
                          <span className="badge-status badge-tbd" style={{ fontSize: '10.5px' }}>FLAGGED TBD</span>
                        )}
                        {req.status === 'PROVISIONAL_PM' && (
                          <span className="badge-status badge-provisional" style={{ fontSize: '10.5px' }}>PROVISIONAL</span>
                        )}
                        {req.status === 'LOCKED_BASELINE' && (
                          <span className="badge-status badge-locked" style={{ fontSize: '10.5px' }}>LOCKED BASELINE</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRequirement(req.id);
                          }}
                          className="btn-subtle-cream"
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
