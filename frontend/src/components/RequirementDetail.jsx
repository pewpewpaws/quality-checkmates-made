import React, { useState, useEffect } from 'react';
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
  Loader2,
  Check,
  XCircle
} from 'lucide-react';
import InteractiveText from './InteractiveText';
import StarBorder from './StarBorder';
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

  // Real backend analysis caches
  const [duelData, setDuelData] = useState(requirement?.duel || null);
  const [blueprintData, setBlueprintData] = useState(requirement?.verification_plan || null);
  const [rewriteData, setRewriteData] = useState(requirement?.rewrite_suggestion || null);

  // Sync state when requirement prop changes
  useEffect(() => {
    setDuelData(requirement?.duel || null);
    setBlueprintData(requirement?.verification_plan || null);
    setRewriteData(requirement?.rewrite_suggestion || null);
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

  // Sign-off action handler targeting real backend transitions: provisional_pm or lock_baseline
  const handleSignOff = async (actionType) => {
    setIsSigningOff(true);
    try {
      const payload = {
        action: actionType, // 'provisional_pm' | 'lock_baseline' | 'flag_tbd' | 'reject'
        pm_target_val: pmValueInput || signOff.pm_target_val || 'Validated threshold',
        pm_author: role === 'product_manager' ? 'Product Manager' : (signOff.pm_author || 'Product Manager'),
        tech_lead_approver: role === 'systems_engineer' ? 'Lead Systems Engineer' : (signOff.tech_lead_approver || 'Lead Systems Engineer'),
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

  // Real AI Pipeline triggers on Qualcomm Cloud AI 100
  const handleRunDuel = async () => {
    setIsRunningAi(true);
    try {
      const res = await api.runDuel(requirement.id);
      setDuelData(res);
      if (onRequirementUpdated) {
        onRequirementUpdated({ ...requirement, duel: res });
      }
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
      if (onRequirementUpdated) {
        onRequirementUpdated({ ...requirement, verification_plan: res });
      }
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
      if (onRequirementUpdated) {
        onRequirementUpdated({ ...requirement, rewrite_suggestion: res });
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsRunningAi(false);
    }
  };

  const handleApplyRewrite = async () => {
    if (!rewriteData?.revised) return;
    try {
      const updated = await api.updateRequirement(requirement.id, {
        ...requirement,
        text: rewriteData.revised
      }, role);
      if (onRequirementUpdated) {
        onRequirementUpdated(updated);
      }
    } catch (e) {
      alert(`Could not apply rewrite: ${e.message}`);
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
            requirementId={requirement.id}
            identifiedTbds={rewriteData?.identified_tbds || requirement.rewrite_suggestion?.identified_tbds || []}
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
            State: {requirement.status}
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
              value={pmValueInput}
              onChange={(e) => setPmValueInput(e.target.value)}
              disabled={role !== 'product_manager'}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                borderRadius: '5px',
                border: '1px solid #E5E0D5',
                backgroundColor: role === 'product_manager' ? '#FFFFFF' : '#F4EFEA',
                outline: 'none',
                color: '#181715'
              }}
            />

            {role === 'product_manager' && (
              <StarBorder
                as="button"
                onClick={() => handleSignOff('provisional_pm')}
                disabled={isSigningOff || !pmValueInput.trim()}
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
                style={{ fontSize: '11.5px', padding: '5px 10px', alignSelf: 'flex-start', marginTop: '2px', fontWeight: 600 }}
              >
                {isSigningOff ? 'Provisioning...' : 'Propose Value (→ Provisional)'}
              </StarBorder>
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
              value={hardwareRationale}
              onChange={(e) => setHardwareRationale(e.target.value)}
              disabled={role !== 'systems_engineer'}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                borderRadius: '5px',
                border: '1px solid #E5E0D5',
                backgroundColor: role === 'systems_engineer' ? '#FFFFFF' : '#F4EFEA',
                outline: 'none',
                color: '#181715'
              }}
            />

            {role === 'systems_engineer' && (
              <button
                onClick={() => handleSignOff('lock_baseline')}
                disabled={isSigningOff || requirement.status !== 'PROVISIONAL_PM'}
                className="btn-subtle-black"
                style={{ 
                  fontSize: '11.5px', 
                  padding: '5px 10px', 
                  alignSelf: 'flex-start', 
                  marginTop: '2px', 
                  backgroundColor: requirement.status === 'PROVISIONAL_PM' ? '#047857' : '#9CA3AF', 
                  borderColor: requirement.status === 'PROVISIONAL_PM' ? '#047857' : '#9CA3AF' 
                }}
              >
                <CheckCircle2 size={12} /> {isSigningOff ? 'Signing off...' : 'Sign-Off Baseline (→ Locked)'}
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

        {/* Tab 2: Smart Rewriter with Intent-Lock */}
        {activeTab === 'rewrite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!rewriteData ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ color: '#55524B', fontSize: '13px', marginBottom: '12px' }}>
                  Generate contract-preserving rewrites using Qualcomm Llama-3.3-70B with zero-fabrication guarantees.
                </p>
                <StarBorder
                  as="button"
                  onClick={handleRunRewrite}
                  disabled={isRunningAi}
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
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
                >
                  {isRunningAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>{isRunningAi ? 'Synthesizing Rewrite on Qualcomm AI 100...' : 'Generate Intent-Locked Rewrite'}</span>
                </StarBorder>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>
                      Revised Statement (Preserved [TBD] Placeholders)
                    </span>
                    <StarBorder
                      as="button"
                      onClick={handleApplyRewrite}
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
                      style={{ fontSize: '11.5px', padding: '4px 8px', fontWeight: 600 }}
                    >
                      <Check size={12} /> Apply Rewrite to Requirement
                    </StarBorder>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#181715', fontWeight: 500, lineHeight: 1.5 }}>
                    {rewriteData.revised}
                  </div>
                </div>

                {rewriteData.rationale && (
                  <div style={{ fontSize: '12px', color: '#55524B' }}>
                    <strong>Engineering Rationale:</strong> {rewriteData.rationale}
                  </div>
                )}

                {/* Identified TBDs List */}
                {rewriteData.identified_tbds && rewriteData.identified_tbds.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#181715' }}>
                      Smart Suggested Defaults ({rewriteData.identified_tbds.length}):
                    </div>
                    {rewriteData.identified_tbds.map((tbd, idx) => (
                      <div key={idx} style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '6px', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: '#B91C1C' }}>
                            [TBD: {tbd.parameter_name}] → {tbd.suggested_value}
                          </div>
                          <div style={{ fontSize: '11px', color: '#55524B' }}>
                            {tbd.rationale}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAcceptTbdSuggestion(tbd.parameter_name, tbd.suggested_value, tbd.rationale)}
                          className="btn-subtle-cream"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          Use Value
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Intent-Lock Diff Tokens if available */}
                {rewriteData.intent_lock && (
                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', marginBottom: '4px' }}>
                      Intent-Lock Verification: {rewriteData.intent_lock.passed ? 'PASSED ✓' : 'DRIFT DETECTED ⚠'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#55524B' }}>
                      {rewriteData.intent_lock.audit_summary}
                    </div>
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
                <StarBorder
                  as="button"
                  onClick={handleRunDuel}
                  disabled={isRunningAi}
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
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
                >
                  {isRunningAi ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
                  <span>{isRunningAi ? 'Simulating Interpretation Duel on Qualcomm AI 100...' : 'Simulate Interpretation Duel'}</span>
                </StarBorder>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#55524B' }}>
                  <span>Flaw Trigger: <strong>"{duelData.flaw_quote || requirement.text.slice(0, 30)}"</strong> ({duelData.flaw_type || 'Ambiguity'})</span>
                  <span style={{ fontWeight: 600, color: '#B45309' }}>Contrast Divergence: {(duelData.contrast_score * 100).toFixed(0)}%</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3mm)' }}>
                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                      {duelData.card_a?.title || 'Perspective A (Nominal)'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8A857C', marginBottom: '6px' }}>
                      Stance: {duelData.card_a?.stance}
                    </div>
                    <div style={{ fontSize: '12px', color: '#181715', lineHeight: 1.4, marginBottom: '6px' }}>
                      <strong>Technical Spec:</strong> {duelData.card_a?.technical_spec}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#55524B' }}>
                      <strong>Impact:</strong> {duelData.card_a?.architectural_impact}
                    </div>
                  </div>

                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                      {duelData.card_b?.title || 'Perspective B (Permissive)'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8A857C', marginBottom: '6px' }}>
                      Stance: {duelData.card_b?.stance}
                    </div>
                    <div style={{ fontSize: '12px', color: '#181715', lineHeight: 1.4, marginBottom: '6px' }}>
                      <strong>Technical Spec:</strong> {duelData.card_b?.technical_spec}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#55524B' }}>
                      <strong>Impact:</strong> {duelData.card_b?.architectural_impact}
                    </div>
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
                <StarBorder
                  as="button"
                  onClick={handleRunBlueprint}
                  disabled={isRunningAi}
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
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}
                >
                  {isRunningAi ? <Loader2 size={14} className="animate-spin" /> : <FileCheck size={14} />}
                  <span>{isRunningAi ? 'Synthesizing Test Plan on Qualcomm AI 100...' : 'Generate Verification Blueprint'}</span>
                </StarBorder>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#55524B' }}>
                  <strong>Verification Method:</strong> {blueprintData.verification_method || 'Test'}
                </div>

                {/* Preconditions */}
                {blueprintData.preconditions && blueprintData.preconditions.length > 0 && (
                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '6px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#55524B' }}>Preconditions:</div>
                    <ul style={{ paddingLeft: '16px', fontSize: '11.5px', color: '#55524B', marginTop: '2px' }}>
                      {blueprintData.preconditions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Positive Nominal Test Case */}
                {blueprintData.positive_test_case && (
                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                      Nominal Test: {blueprintData.positive_test_case.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#181715', marginTop: '2px' }}>
                      <strong>Stimulus:</strong> {blueprintData.positive_test_case.stimulus}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#55524B', marginTop: '2px' }}>
                      <strong>Expected:</strong> {blueprintData.positive_test_case.expected_response}
                    </div>
                  </div>
                )}

                {/* Negative Boundary Test Case */}
                {blueprintData.negative_boundary_test_case && (
                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#B91C1C' }}>
                      Boundary Case: {blueprintData.negative_boundary_test_case.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#181715', marginTop: '2px' }}>
                      <strong>Stimulus:</strong> {blueprintData.negative_boundary_test_case.stimulus}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#55524B', marginTop: '2px' }}>
                      <strong>Expected:</strong> {blueprintData.negative_boundary_test_case.expected_response}
                    </div>
                  </div>
                )}

                {/* Falsifiable Pass/Fail Acceptance Criteria */}
                {blueprintData.acceptance_criteria && (
                  <div style={{ background: '#FAF8F5', border: '1px solid #EBE6DC', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#181715', textTransform: 'uppercase' }}>
                      Acceptance Criteria
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#047857' }}>
                      <strong>PASS:</strong> {blueprintData.acceptance_criteria.pass_condition}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#B91C1C' }}>
                      <strong>FAIL:</strong> {blueprintData.acceptance_criteria.fail_condition}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
