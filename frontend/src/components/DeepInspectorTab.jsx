import React, { useState } from 'react';
import {
  runXray,
  runDuel,
  runRewrite,
  runBlueprint,
  signOffRequirement,
  calculateRubricScore,
  updateRequirement,
} from '../services/api';

/**
 * DeepInspectorTab Component (Active Requirement Studio)
 * Features:
 * - In-text [TBD] chip highlighting & clickable verbatim evidence quotes
 * - 100-Point Rubric breakdown with itemized math receipts
 * - Dual-Key Governance sign-off gate (PM Provisional -> Lead Eng Sign-off)
 * - X-Ray Issue cards
 * - Interpretation Duel showdown
 * - Intent-Locked Rewriter diff
 * - Verification Blueprint test cases
 */
export default function DeepInspectorTab({
  requirement,
  activeProjectId,
  userRole,
  onRequirementUpdated,
}) {
  const [activeDeckTab, setActiveDeckTab] = useState('xray'); // 'xray' | 'duel' | 'rewrite' | 'blueprint'
  const [isRunningAI, setIsRunningAI] = useState(false);

  // Sign-off form states
  const [pmValue, setPmValue] = useState(requirement?.sign_off?.pm_target_val || '');
  const [hwRationale, setHwRationale] = useState(requirement?.sign_off?.hardware_rationale || '');
  const [isSigning, setIsSigning] = useState(false);

  // Quick edit mode
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState(requirement?.text || '');

  if (!requirement) {
    return (
      <div
        className="glass-panel squircle-md"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '32px' }}>📋</span>
        <div style={{ fontSize: '14px', fontWeight: '600' }}>Select a requirement from the left sidebar to inspect</div>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          Inspect 100-point rubric deductions, X-Ray flaws, and execute dual-key sign-offs
        </div>
      </div>
    );
  }

  const isLocked = requirement.status === 'LOCKED_BASELINE';
  const isProv = requirement.status === 'PROVISIONAL_PM';
  const isTbd = requirement.status === 'FLAGGED_TBD';

  // 1. Dual-Key Sign-off actions
  const handleDualKeyAction = async (action) => {
    setIsSigning(true);
    try {
      const payload = {
        action,
        pm_author: userRole === 'product_manager' ? 'PM Author' : requirement.sign_off?.pm_author || 'PM Author',
        pm_target_val: pmValue || requirement.sign_off?.pm_target_val,
        tech_lead_approver: userRole === 'systems_engineer' ? 'Lead Systems Engineer' : requirement.sign_off?.tech_lead_approver,
        hardware_rationale: hwRationale || requirement.sign_off?.hardware_rationale,
      };

      const updated = await signOffRequirement(requirement.id, payload, activeProjectId, userRole);
      onRequirementUpdated(updated);
    } catch (err) {
      alert(`Sign-off transition failed: ${err.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  // 2. Trigger AI Analysis
  const handleTriggerXray = async () => {
    setIsRunningAI(true);
    try {
      const res = await runXray(requirement.text, activeProjectId);
      const updatedReq = {
        ...requirement,
        issues: res.issues || [],
        quality_score: res.rubric_score || requirement.quality_score,
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setActiveDeckTab('xray');
    } catch (err) {
      alert(`X-Ray failed: ${err.message}`);
    } finally {
      setIsRunningAI(false);
    }
  };

  const handleTriggerDuel = async () => {
    setIsRunningAI(true);
    try {
      const firstFlaw = requirement.issues?.[0]?.evidence_quote || 'periodically';
      const flawType = requirement.issues?.[0]?.issue_type || 'Ambiguity';
      const res = await runDuel(requirement.text, firstFlaw, flawType);
      const updatedReq = {
        ...requirement,
        duel: res,
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setActiveDeckTab('duel');
    } catch (err) {
      alert(`Interpretation Duel failed: ${err.message}`);
    } finally {
      setIsRunningAI(false);
    }
  };

  const handleTriggerRewrite = async () => {
    setIsRunningAI(true);
    try {
      const res = await runRewrite(requirement.text, activeProjectId);
      const updatedReq = {
        ...requirement,
        rewrite_suggestion: res,
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setActiveDeckTab('rewrite');
    } catch (err) {
      alert(`Rewrite failed: ${err.message}`);
    } finally {
      setIsRunningAI(false);
    }
  };

  const handleTriggerBlueprint = async () => {
    setIsRunningAI(true);
    try {
      const res = await runBlueprint(requirement.text);
      const updatedReq = {
        ...requirement,
        verification_plan: res,
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setActiveDeckTab('blueprint');
    } catch (err) {
      alert(`Blueprint generation failed: ${err.message}`);
    } finally {
      setIsRunningAI(false);
    }
  };

  const handleSaveTextEdit = async () => {
    if (!editedText.trim()) return;
    try {
      const score = await calculateRubricScore(editedText);
      const updatedReq = {
        ...requirement,
        text: editedText.trim(),
        quality_score: score,
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setIsEditingText(false);
    } catch (err) {
      alert(`Save edit failed: ${err.message}`);
    }
  };

  const scoreObj = requirement.quality_score;
  const overallScore = scoreObj ? Math.round(scoreObj.overall) : 0;

  // Highlight [TBD: ...] tokens in text
  const renderHighlightedText = (text) => {
    const parts = text.split(/(\[TBD:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[TBD:') && part.endsWith(']')) {
        return (
          <span key={i} className="tbd-token-chip" title="Unresolved Parameter (Zero Fabrication)">
            ⚠️ {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '14px', paddingRight: '4px' }}>
      {/* 1. Header & Lifecycle Status */}
      <div
        className="glass-panel squircle-md"
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: `4px solid ${isLocked ? '#10b981' : isProv ? '#f59e0b' : '#ef4444'}`,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              {requirement.id}
            </span>
            <span
              className={`badge-chip squircle-xs ${isLocked ? 'badge-locked' : isProv ? 'badge-provisional' : 'badge-tbd'}`}
            >
              {isLocked ? '🟢 LOCKED_BASELINE' : isProv ? '🟡 PROVISIONAL_PM' : '🔴 FLAGGED_TBD'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              v{requirement.version}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Category: <strong style={{ color: '#ffffff' }}>{requirement.category || 'General'}</strong> • Section: <strong style={{ color: '#ffffff' }}>{requirement.section || 'General'}</strong>
          </div>
        </div>

        {/* AI Action Quick Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleTriggerXray}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
            title="Scan for Ambiguity & ground verbatim evidence"
          >
            ⚡ X-Ray
          </button>
          <button
            onClick={handleTriggerDuel}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
            title="Stage 2 competing interpretations"
          >
            ⚔️ Duel
          </button>
          <button
            onClick={handleTriggerRewrite}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
            title="Intent-Locked EARS rewrite"
          >
            ✍️ Rewrite
          </button>
          <button
            onClick={handleTriggerBlueprint}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px' }}
            title="Generate test cases & falsifiable criteria"
          >
            🧪 Blueprint
          </button>
        </div>
      </div>

      {/* 2. Interactive Requirement Text Box */}
      <div className="glass-panel squircle-md" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px', color: 'var(--text-muted)' }}>
            ACTIVE CONTRACTUAL STATEMENT
          </span>
          {userRole !== 'executive' && (
            <button
              onClick={() => {
                if (isEditingText) handleSaveTextEdit();
                else setIsEditingText(true);
              }}
              className="btn-squircle"
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                background: isEditingText ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                color: isEditingText ? '#34d399' : 'var(--text-muted)',
              }}
            >
              {isEditingText ? '✓ Save Edit' : '✏️ Edit'}
            </button>
          )}
        </div>

        {isEditingText ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="input-squircle"
            style={{ width: '100%', height: '80px', fontSize: '13px', lineHeight: '1.5' }}
          />
        ) : (
          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#ffffff',
              padding: '6px 0',
            }}
          >
            {renderHighlightedText(requirement.text)}
          </div>
        )}
      </div>

      {/* 3. Deterministic 100-Point Rubric Card */}
      <div className="glass-panel squircle-md" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
              Deterministic Rubric Scorecard
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Computed outside the LLM • Itemized Mathematical Receipts
            </div>
          </div>

          <div
            className="squircle-sm"
            style={{
              padding: '6px 14px',
              background: overallScore >= 80 ? 'rgba(16, 185, 129, 0.2)' : overallScore >= 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
              {overallScore}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>

        {/* 5 Category Meters */}
        {scoreObj && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Clarity', val: scoreObj.clarity, max: 25 },
              { label: 'Verifiability', val: scoreObj.verifiability, max: 25 },
              { label: 'Completeness', val: scoreObj.completeness, max: 20 },
              { label: 'Atomicity', val: scoreObj.atomicity, max: 15 },
              { label: 'Consistency', val: scoreObj.consistency, max: 15 },
            ].map((cat, i) => (
              <div key={i} className="glass-card squircle-sm" style={{ padding: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                  {cat.val} <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>/{cat.max}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(cat.val / cat.max) * 100}%`,
                      background: cat.val === cat.max ? '#10b981' : cat.val > cat.max * 0.6 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mathematical Deductions Trace */}
        {scoreObj?.receipt && scoreObj.receipt.length > 0 && (
          <details style={{ marginTop: '8px' }}>
            <summary style={{ fontSize: '11px', color: '#38bdf8', cursor: 'pointer', fontWeight: '600' }}>
              ▶ View Itemized Mathematical Deduction Receipt ({scoreObj.receipt.length} steps)
            </summary>
            <div
              className="squircle-sm"
              style={{
                marginTop: '6px',
                padding: '10px',
                background: 'rgba(0,0,0,0.45)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
              }}
            >
              {scoreObj.receipt.map((step, idx) => (
                <div key={idx} style={{ color: step.includes('-') ? '#f87171' : '#94a3b8' }}>
                  {step}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* 4. Dual-Key Governance Gate */}
      <div
        className="glass-panel squircle-md"
        style={{
          padding: '16px',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          background: 'rgba(30, 24, 15, 0.55)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🔐</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>
                Dual-Key Governance Gate
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Product Manager sets target parameter ➔ Lead Systems Engineer signs off hardware limits
              </div>
            </div>
          </div>
        </div>

        {/* PM Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              👔 Step 1: PM Target Value
            </label>
            <input
              type="text"
              placeholder="e.g. <= 200ms or 55°C limit"
              value={pmValue}
              onChange={(e) => setPmValue(e.target.value)}
              disabled={userRole !== 'product_manager'}
              className="input-squircle"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              🛠️ Step 2: Lead Engineer Technical Rationale
            </label>
            <input
              type="text"
              placeholder="e.g. Validated against CAN-FD 500kbps bus budget"
              value={hwRationale}
              onChange={(e) => setHwRationale(e.target.value)}
              disabled={userRole !== 'systems_engineer'}
              className="input-squircle"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Action Buttons based on User Role */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {userRole === 'product_manager' && (
            <button
              onClick={() => handleDualKeyAction('provisional_pm')}
              disabled={isSigning || !pmValue.trim()}
              className="btn-squircle btn-warning"
              style={{ fontSize: '12px' }}
            >
              🟡 Set Provisional PM Baseline
            </button>
          )}

          {userRole === 'systems_engineer' && (
            <button
              onClick={() => handleDualKeyAction('lock_baseline')}
              disabled={isSigning || !hwRationale.trim()}
              className="btn-squircle btn-success"
              style={{ fontSize: '12px' }}
            >
              🟢 Grant Technical Sign-Off & Lock Baseline
            </button>
          )}

          {userRole === 'executive' && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Executive Lens: Read-Only Baseline View.
            </div>
          )}
        </div>
      </div>

      {/* 5. AI Feature Deck (Tabs: X-Ray, Duel, Rewrite, Blueprint) */}
      <div className="glass-panel squircle-md" style={{ padding: '16px' }}>
        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '14px' }}>
          {[
            { id: 'xray', label: `⚡ X-Ray Issues (${requirement.issues?.length || 0})` },
            { id: 'duel', label: '⚔️ Interpretation Duel' },
            { id: 'rewrite', label: '✍️ Intent-Locked Rewriter' },
            { id: 'blueprint', label: '🧪 Verification Blueprint' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDeckTab(tab.id)}
              className="btn-squircle"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: activeDeckTab === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: activeDeckTab === tab.id ? '#38bdf8' : 'var(--text-muted)',
                border: activeDeckTab === tab.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Deck Content */}
        {activeDeckTab === 'xray' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!requirement.issues || requirement.issues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
                No X-Ray flaws detected yet. Click "⚡ X-Ray" above to scan with Llama-3.3-70B.
              </div>
            ) : (
              requirement.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="glass-card squircle-sm"
                  style={{
                    padding: '12px',
                    borderLeft: `3px solid ${issue.severity === 'HIGH' ? '#ef4444' : '#f59e0b'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge-chip badge-tbd squircle-xs" style={{ fontSize: '10px' }}>
                        {issue.severity}
                      </span>
                      <strong style={{ fontSize: '12px', color: '#ffffff' }}>{issue.issue_type}</strong>
                    </div>

                    <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      offset: [{issue.start_offset ?? '?'}:{issue.end_offset ?? '?'}]
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                    Flaw Quote: <code style={{ color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '2px 5px', borderRadius: '4px' }}>"{issue.evidence_quote}"</code>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {issue.explanation}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34d399' }}>
                    💡 Action: {issue.suggested_action}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeDeckTab === 'duel' && (
          <div>
            {!requirement.duel ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
                No Interpretation Duel staged yet. Click "⚔️ Duel" above to trigger Llama-3.1-8B cascade.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Trigger Quote: <strong style={{ color: '#f87171' }}>"{requirement.duel.flaw_quote}"</strong>
                  </div>
                  <span className="badge-chip badge-chip-cyan squircle-xs">
                    Contrast Divergence: {Math.round((requirement.duel.contrast_score || 1.0) * 100)}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="glass-card squircle-sm" style={{ padding: '12px', borderLeft: '3px solid #38bdf8' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>
                      Interpretation A: {requirement.duel.card_a?.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#ffffff', marginBottom: '6px' }}>
                      "{requirement.duel.card_a?.stance}"
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {requirement.duel.card_a?.architectural_impact}
                    </div>
                  </div>

                  <div className="glass-card squircle-sm" style={{ padding: '12px', borderLeft: '3px solid #a855f7' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#a855f7', marginBottom: '4px' }}>
                      Interpretation B: {requirement.duel.card_b?.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#ffffff', marginBottom: '6px' }}>
                      "{requirement.duel.card_b?.stance}"
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {requirement.duel.card_b?.architectural_impact}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeDeckTab === 'rewrite' && (
          <div>
            {!requirement.rewrite_suggestion ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
                No Intent-Locked rewrite generated yet. Click "✍️ Rewrite" above.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Systems Engineering Rationale: {requirement.rewrite_suggestion.rationale}
                </div>

                <div
                  className="glass-card squircle-sm"
                  style={{
                    padding: '12px',
                    background: 'rgba(5, 150, 105, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', marginBottom: '4px' }}>
                    PROPOSED EARS STATEMENT (100% Zero Fabrication)
                  </div>
                  <div style={{ fontSize: '13px', color: '#ffffff', lineHeight: '1.5' }}>
                    {renderHighlightedText(requirement.rewrite_suggestion.revised)}
                  </div>
                </div>

                {/* Suggested Defaults Chips */}
                {requirement.rewrite_suggestion.identified_tbds?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      💡 Smart Suggested Defaults (1-Click PM Confirmation)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {requirement.rewrite_suggestion.identified_tbds.map((tbd, i) => (
                        <button
                          key={i}
                          onClick={() => setPmValue(tbd.suggested_value)}
                          className="btn-squircle squircle-pill"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                          }}
                        >
                          {tbd.parameter_name}: <strong>{tbd.suggested_value}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeDeckTab === 'blueprint' && (
          <div>
            {!requirement.verification_plan ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '12px' }}>
                No Verification Blueprint generated yet. Click "🧪 Blueprint" above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Verification Method: <strong style={{ color: '#ffffff' }}>{requirement.verification_plan.verification_method}</strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="glass-card squircle-sm" style={{ padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', marginBottom: '3px' }}>
                      ✓ Nominal Test: {requirement.verification_plan.positive_test_case?.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Stimulus: {requirement.verification_plan.positive_test_case?.stimulus}
                    </div>
                  </div>

                  <div className="glass-card squircle-sm" style={{ padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#f87171', marginBottom: '3px' }}>
                      ✗ Boundary Test: {requirement.verification_plan.negative_boundary_test_case?.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Stimulus: {requirement.verification_plan.negative_boundary_test_case?.stimulus}
                    </div>
                  </div>
                </div>

                {/* Acceptance Criteria Table */}
                {requirement.verification_plan.acceptance_criteria && (
                  <div className="glass-card squircle-sm" style={{ padding: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                      Falsifiable PASS / FAIL Thresholds
                    </div>
                    {Object.entries(requirement.verification_plan.acceptance_criteria).map(([k, v], i) => (
                      <div key={i} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                        <strong style={{ color: '#38bdf8' }}>{v}</strong>
                      </div>
                    ))}
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
