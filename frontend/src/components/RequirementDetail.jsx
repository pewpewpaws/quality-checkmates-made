import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown,
  Scale,
  GitBranch,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import InteractiveText from './InteractiveText';
import { api } from '../services/api';

export default function RequirementDetail({ 
  requirement, 
  project, 
  role, 
  onRequirementUpdated 
}) {
  const [activeTab, setActiveTab] = useState('xray'); // 'xray' | 'rewrite' | 'duel' | 'blueprint'
  const [pmValueInput, setPmValueInput] = useState('');
  const [hardwareRationale, setHardwareRationale] = useState('');
  const [isSigningOff, setIsSigningOff] = useState(false);
  const [isRunningAi, setIsRunningAi] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Tab results caches
  const [duelData, setDuelData] = useState(requirement?.interpretation_duel || null);
  const [blueprintData, setBlueprintData] = useState(requirement?.verification_blueprint || null);
  const [rewriteData, setRewriteData] = useState(null);

  // Sync state when requirement prop changes
  useEffect(() => {
    setDuelData(requirement?.interpretation_duel || null);
    setBlueprintData(requirement?.verification_blueprint || null);
    setRewriteData(null);
    setPmValueInput(requirement?.sign_off?.pm_target_val || '');
    setHardwareRationale(requirement?.sign_off?.hardware_rationale || '');
  }, [requirement?.id]);

  if (!requirement) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A857C' }}>
        Select a requirement from the sidebar to inspect quality score and dual-key governance.
      </div>
    );
  }

  const score = requirement.quality_score;
  const compositeScore = score?.composite_score ?? 0;
  const issues = requirement.issues || [];
  const signOff = requirement.sign_off || {};

  // Handle applying suggested value from TbdPopover directly into PM proposal
  const handleAcceptTbdSuggestion = (paramName, value, rationale) => {
    setPmValueInput(value);
    setHardwareRationale(rationale);
  };

  // Sign-off action handler
  const handleSignOff = async (actionType) => {
    setIsSigningOff(true);
    try {
      const payload = {
        action: actionType,
        pm_target_val: pmValueInput || signOff.pm_target_val || 'Validated threshold',
        pm_author: role === 'PRODUCT_MANAGER' ? 'Product Manager' : signOff.pm_author,
        hardware_rationale: hardwareRationale || signOff.hardware_rationale || 'Bench tested and verified compliant.'
      };

      const updated = await api.signOff(requirement.id, payload, role);
      if (onRequirementUpdated) {
        onRequirementUpdated(updated);
      }
    } catch (err) {
      alert(`Sign-off error: ${err.message}`);
    } finally {
      setIsSigningOff(false);
    }
  };

  // AI Pipeline triggers
  const handleRunDuel = async () => {
    setIsRunningAi(true);
    try {
      const res = await api.runDuel(requirement.id);
      setDuelData(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsRunningAi(false);
    }
  };

  const handleRunBlueprint = async () => {
    setIsRunningAi(true);
    try {
      const res = await api.runBlueprint(requirement.id);
      setBlueprintData(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsRunningAi(false);
    }
  };

  const handleRunRewrite = async () => {
    setIsRunningAi(true);
    try {
      const res = await api.runRewrite(requirement.id);
      setRewriteData(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsRunningAi(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3mm)', maxWidth: '980px', margin: '0 auto', width: '100%' }}>
      {/* 1. Header Card */}
      <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: '#181715' }}>
              {requirement.id}
            </span>
            <span style={{ fontSize: '11.5px', color: '#55524B', background: '#F4EFEA', padding: '2px 8px', borderRadius: '4px' }}>
              {requirement.section || requirement.category || 'System Safety'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Score Pill */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: compositeScore >= 80 ? '#ECFDF5' : compositeScore >= 60 ? '#FFFBEB' : '#FEF2F2',
                border: '1px solid',
                borderColor: compositeScore >= 80 ? '#A7F3D0' : compositeScore >= 60 ? '#FDE68A' : '#FCA5A5',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: compositeScore >= 80 ? '#047857' : compositeScore >= 60 ? '#B45309' : '#B91C1C'
              }}
            >
              <span>Rubric Score: {compositeScore} / 100</span>
            </div>

            {/* Status Badge */}
            {requirement.status === 'FLAGGED_TBD' && (
              <span className="badge-status badge-tbd">🔴 FLAGGED_TBD</span>
            )}
            {requirement.status === 'PROVISIONAL_PM' && (
              <span className="badge-status badge-provisional">🟡 PROVISIONAL_PM</span>
            )}
            {requirement.status === 'LOCKED_BASELINE' && (
              <span className="badge-status badge-locked">🟢 LOCKED_BASELINE</span>
            )}
          </div>
        </div>

        {/* Interactive Statement Text */}
        <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '14px 16px' }}>
          <div style={{ fontSize: '11px', color: '#8A857C', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            Requirement Statement (Interactive TBD Hover)
          </div>
          <InteractiveText
            text={requirement.text}
            projectDomain={project?.domain || 'Engineering Specification'}
            onAcceptSuggestion={handleAcceptTbdSuggestion}
          />
        </div>
      </div>

      {/* 2. 100-Point Rubric Breakdown */}
      {score && (
        <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#181715', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={14} className="text-stone-700" />
              100-Point Rubric Receipt
            </span>
            <button
              onClick={() => setShowReceipt(!showReceipt)}
              style={{ border: 'none', background: 'transparent', fontSize: '11.5px', color: '#55524B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {showReceipt ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>{showReceipt ? 'Hide Receipt' : 'View Itemized Receipt'}</span>
            </button>
          </div>

          {/* 5-Dimension Mini Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {[
              { name: 'Clarity', val: score.clarity, max: 25 },
              { name: 'Verifiability', val: score.verifiability, max: 25 },
              { name: 'Completeness', val: score.completeness, max: 20 },
              { name: 'Atomicity', val: score.atomicity, max: 15 },
              { name: 'Consistency', val: score.consistency, max: 15 }
            ].map(d => (
              <div key={d.name} style={{ background: '#FAF8F5', padding: '6px 8px', borderRadius: '6px', border: '1px solid #EBE6DC' }}>
                <div style={{ fontSize: '10.5px', color: '#8A857C', textTransform: 'uppercase' }}>{d.name}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: d.val === d.max ? '#047857' : '#B45309' }}>
                  {d.val} <span style={{ fontSize: '10px', color: '#8A857C', fontWeight: 400 }}>/ {d.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Expandable Mathematical Receipt */}
          {showReceipt && score.receipt && (
            <div style={{ background: '#FAF8F5', padding: '10px', borderRadius: '6px', border: '1px dashed #DDD7CB', marginTop: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '6px' }}>
                Deterministic Mathematical Receipt:
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '11.5px', color: '#55524B', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {score.receipt.map((item, idx) => (
                  <li key={idx} style={{ fontFamily: 'var(--font-mono)' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3. Dual-Key Governance Sign-off Gate */}
      <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0ECE4', paddingBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#181715', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} className="text-stone-800" />
            Dual-Key Governance Gate
          </span>
          <span style={{ fontSize: '11px', color: '#8A857C' }}>
            Strict Separation of Duties
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3mm)' }}>
          {/* Key 1: PM Proposal */}
          <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#B45309' }}>
                Key 1: PM Target Value
              </span>
              {signOff.pm_author && (
                <span style={{ fontSize: '10.5px', color: '#8A857C' }}>by {signOff.pm_author}</span>
              )}
            </div>

            <input
              type="text"
              placeholder="e.g. <= 10ms or Derate by 50%"
              value={pmValueInput || signOff.pm_target_val || ''}
              onChange={(e) => setPmValueInput(e.target.value)}
              disabled={role !== 'PRODUCT_MANAGER'}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                borderRadius: '5px',
                border: '1px solid #E5E0D5',
                backgroundColor: role === 'PRODUCT_MANAGER' ? '#FFFFFF' : '#F4EFEA',
                outline: 'none',
                color: '#181715'
              }}
            />

            {role === 'PRODUCT_MANAGER' && (
              <button
                onClick={() => handleSignOff('PM_PROPOSE')}
                disabled={isSigningOff || !pmValueInput}
                className="btn-subtle-black"
                style={{ fontSize: '11.5px', padding: '5px 10px', alignSelf: 'flex-start', marginTop: '2px' }}
              >
                Propose Value (→ Provisional)
              </button>
            )}
          </div>

          {/* Key 2: Technical Sign-Off */}
          <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#047857' }}>
                Key 2: Technical Sign-Off
              </span>
              {signOff.tech_lead_approver && (
                <span style={{ fontSize: '10.5px', color: '#8A857C' }}>by {signOff.tech_lead_approver}</span>
              )}
            </div>

            <input
              type="text"
              placeholder="Hardware test bench rationale..."
              value={hardwareRationale || signOff.hardware_rationale || ''}
              onChange={(e) => setHardwareRationale(e.target.value)}
              disabled={role !== 'SYSTEMS_ENGINEER'}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                borderRadius: '5px',
                border: '1px solid #E5E0D5',
                backgroundColor: role === 'SYSTEMS_ENGINEER' ? '#FFFFFF' : '#F4EFEA',
                outline: 'none',
                color: '#181715'
              }}
            />

            {role === 'SYSTEMS_ENGINEER' && (
              <button
                onClick={() => handleSignOff('TECH_LEAD_SIGNOFF')}
                disabled={isSigningOff || requirement.status !== 'PROVISIONAL_PM'}
                className="btn-subtle-black"
                style={{ fontSize: '11.5px', padding: '5px 10px', alignSelf: 'flex-start', marginTop: '2px', backgroundColor: '#047857', borderColor: '#047857' }}
              >
                <CheckCircle2 size={12} /> Sign-Off Baseline (→ Locked)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Analysis Studio Tabs */}
      <div className="cream-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #F0ECE4', paddingBottom: '8px' }}>
          {[
            { id: 'xray', label: `Flaw X-Ray (${issues.length})`, icon: AlertTriangle },
            { id: 'rewrite', label: 'Smart Rewriter', icon: Sparkles },
            { id: 'duel', label: 'Interpretation Duel', icon: GitBranch },
            { id: 'blueprint', label: 'Verification Blueprint', icon: FileCheck }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: active ? '#181715' : 'transparent',
                  borderRadius: '6px',
                  backgroundColor: active ? '#181715' : 'transparent',
                  color: active ? '#FAF8F5' : '#55524B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: X-Ray Flaw Cards */}
        {activeTab === 'xray' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {issues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#047857', fontSize: '13px', fontWeight: 600 }}>
                ✓ No critical flaws identified. Requirement passes baseline audits.
              </div>
            ) : (
              issues.map((issue, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #EBE6DC',
                    backgroundColor: '#FAF8F5',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C' }}>
                        {issue.issue_type}
                      </span>
                      <span style={{ fontSize: '10.5px', background: '#FEE2E2', color: '#B91C1C', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {issue.severity || 'Major'}
                      </span>
                    </div>

                    {issue.evidence_quote && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#8A857C', background: '#EFEAE2', padding: '2px 6px', borderRadius: '4px' }}>
                        Quote: "{issue.evidence_quote}"
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#181715', margin: 0 }}>
                    {issue.explanation}
                  </p>

                  {issue.suggested_action && (
                    <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: 500, marginTop: '2px' }}>
                      Remedy: {issue.suggested_action}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Smart Rewriter */}
        {activeTab === 'rewrite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!rewriteData ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: '#55524B', fontSize: '13px', marginBottom: '12px' }}>
                  Generate contract-preserving rewrites using Qualcomm Llama-3.3-70B with zero-fabrication guarantees.
                </p>
                <button
                  onClick={handleRunRewrite}
                  disabled={isRunningAi}
                  className="btn-subtle-black"
                >
                  <Sparkles size={14} />
                  <span>{isRunningAi ? 'Synthesizing Rewrite...' : 'Generate Intent-Locked Rewrite'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Revised Statement (Preserved [TBD])
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#181715', fontWeight: 500, lineHeight: 1.5 }}>
                    {rewriteData.revised}
                  </div>
                </div>

                {rewriteData.rationale && (
                  <div style={{ fontSize: '12px', color: '#55524B' }}>
                    <strong>Rationale:</strong> {rewriteData.rationale}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Interpretation Duel */}
        {activeTab === 'duel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!duelData ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: '#55524B', fontSize: '13px', marginBottom: '12px' }}>
                  Pit competing interpretations against each other on Qualcomm AI 100 to uncover hidden contractual liabilities.
                </p>
                <button
                  onClick={handleRunDuel}
                  disabled={isRunningAi}
                  className="btn-subtle-black"
                >
                  <GitBranch size={14} />
                  <span>{isRunningAi ? 'Simulating Interpretation Duel...' : 'Simulate Interpretation Duel'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3mm)' }}>
                <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Perspective A (Strict Nominal)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#181715', lineHeight: 1.4 }}>
                    {duelData.interpretation_a}
                  </div>
                </div>

                <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Perspective B (Permissive / Boundary)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#181715', lineHeight: 1.4 }}>
                    {duelData.interpretation_b}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Verification Blueprint */}
        {activeTab === 'blueprint' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!blueprintData ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: '#55524B', fontSize: '13px', marginBottom: '12px' }}>
                  Generate nominal and boundary hardware test cases with falsifiable pass/fail criteria on Llama-3.3-70B.
                </p>
                <button
                  onClick={handleRunBlueprint}
                  disabled={isRunningAi}
                  className="btn-subtle-black"
                >
                  <FileCheck size={14} />
                  <span>{isRunningAi ? 'Synthesizing Test Cases...' : 'Generate Verification Blueprint'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#55524B' }}>
                  <strong>Recommended Method:</strong> {blueprintData.method || 'Hardware-in-the-Loop (HIL) Test'}
                </div>
                {blueprintData.test_cases?.map((tc, idx) => (
                  <div key={idx} style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#181715' }}>
                      {tc.title || `Test Case #${idx + 1}`}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#55524B', marginTop: '2px' }}>
                      {tc.description}
                    </div>
                    {tc.pass_criteria && (
                      <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600, marginTop: '4px' }}>
                        Pass Criterion: {tc.pass_criteria}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
