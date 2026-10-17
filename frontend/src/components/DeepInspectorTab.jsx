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
 * DeepInspectorTab Component (Antigravity 2.0 Pro Edition)
 * High-density engineering inspector with muted colors and crisp receipts.
 */
export default function DeepInspectorTab({
  requirement,
  activeProjectId,
  userRole,
  onRequirementUpdated,
}) {
  const [activeDeckTab, setActiveDeckTab] = useState('xray');
  const [isRunningAI, setIsRunningAI] = useState(false);

  const [pmValue, setPmValue] = useState(requirement?.sign_off?.pm_target_val || '');
  const [hwRationale, setHwRationale] = useState(requirement?.sign_off?.hardware_rationale || '');
  const [isSigning, setIsSigning] = useState(false);

  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState(requirement?.text || '');

  if (!requirement) {
    return (
      <div
        className="glass-panel squircle-sm"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '500' }}>No requirement selected</div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
          Select an item from the left sidebar to audit rubric score and dual-key governance
        </div>
      </div>
    );
  }

  const isLocked = requirement.status === 'LOCKED_BASELINE';
  const isProv = requirement.status === 'PROVISIONAL_PM';

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

  const renderHighlightedText = (text) => {
    const parts = text.split(/(\[TBD:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[TBD:') && part.endsWith(']')) {
        return (
          <span key={i} className="tbd-token-chip" title="Parameter [TBD]">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '10px', paddingRight: '4px' }}>
      {/* 1. Header & Status Bar */}
      <div
        className="glass-panel squircle-sm"
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {requirement.id}
            </span>
            <span
              className={`badge-chip squircle-xs ${isLocked ? 'badge-locked' : isProv ? 'badge-provisional' : 'badge-tbd'}`}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {isLocked ? 'LOCKED BASELINE' : isProv ? 'PROVISIONAL PM' : 'FLAGGED TBD'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: '500' }}>
              v{requirement.version}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Category: <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{requirement.category || 'General'}</span> • Section: <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{requirement.section || 'General'}</span>
          </div>
        </div>

        {/* AI Action Quick Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleTriggerXray}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '12px', padding: '5px 10px', fontWeight: '500' }}
          >
            X-Ray
          </button>
          <button
            onClick={handleTriggerDuel}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '12px', padding: '5px 10px', fontWeight: '500' }}
          >
            Duel
          </button>
          <button
            onClick={handleTriggerRewrite}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '12px', padding: '5px 10px', fontWeight: '500' }}
          >
            Rewrite
          </button>
          <button
            onClick={handleTriggerBlueprint}
            disabled={isRunningAI}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '12px', padding: '5px 10px', fontWeight: '500' }}
          >
            Blueprint
          </button>
        </div>
      </div>

      {/* 2. Interactive Requirement Text Box */}
      <div className="glass-panel squircle-sm" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>
            CONTRACTUAL STATEMENT
          </span>
          {userRole !== 'executive' && (
            <button
              onClick={() => {
                if (isEditingText) handleSaveTextEdit();
                else setIsEditingText(true);
              }}
              className="btn-squircle btn-secondary"
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '500' }}
            >
              {isEditingText ? '✓ Save' : 'Edit'}
            </button>
          )}
        </div>

        {isEditingText ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="input-squircle"
            style={{ width: '100%', height: '80px', fontSize: '14px', lineHeight: '1.5' }}
          />
        ) : (
          <div style={{ fontSize: '15px', lineHeight: '1.65', color: 'var(--text-primary)', fontWeight: '450', padding: '4px 0' }}>
            {renderHighlightedText(requirement.text)}
          </div>
        )}
      </div>

      {/* 3. Deterministic 100-Point Rubric Card */}
      <div className="glass-panel squircle-sm" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Deterministic Rubric Scorecard
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Computed outside the LLM • Mathematical Receipts
            </div>
          </div>

          <div
            className="squircle-xs"
            style={{
              padding: '6px 12px',
              background: overallScore >= 80 ? 'var(--accent-green-subtle)' : overallScore >= 60 ? 'var(--accent-amber-subtle)' : 'var(--accent-red-subtle)',
              border: `1px solid ${overallScore >= 80 ? 'var(--accent-green-border)' : overallScore >= 60 ? 'var(--accent-amber-border)' : 'var(--accent-red-border)'}`,
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {overallScore}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>/100</span>
          </div>
        </div>

        {scoreObj && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { label: 'Clarity', val: scoreObj.clarity, max: 25 },
              { label: 'Verifiability', val: scoreObj.verifiability, max: 25 },
              { label: 'Completeness', val: scoreObj.completeness, max: 20 },
              { label: 'Atomicity', val: scoreObj.atomicity, max: 15 },
              { label: 'Consistency', val: scoreObj.consistency, max: 15 },
            ].map((cat, i) => (
              <div key={i} className="glass-card squircle-xs" style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: '500' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {cat.val}<span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '400' }}>/{cat.max}</span>
                </div>
                <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(cat.val / cat.max) * 100}%`,
                      background: cat.val === cat.max ? 'var(--text-green)' : cat.val > cat.max * 0.6 ? 'var(--text-amber)' : 'var(--text-red)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {scoreObj?.receipt && scoreObj.receipt.length > 0 && (
          <details style={{ marginTop: '8px' }}>
            <summary style={{ fontSize: '12px', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: '500' }}>
              Mathematical Deduction Receipt ({scoreObj.receipt.length} steps)
            </summary>
            <div
              className="squircle-xs"
              style={{
                marginTop: '6px',
                padding: '10px 12px',
                background: 'var(--bg-app)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {scoreObj.receipt.map((step, idx) => (
                <div key={idx} style={{ color: step.includes('-') ? 'var(--text-red)' : 'var(--text-muted)', marginBottom: '2px' }}>
                  {step}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* 4. Dual-Key Governance Gate */}
      <div
        className="glass-panel squircle-sm"
        style={{
          padding: '14px 16px',
          border: '1px solid var(--border-medium)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Dual-Key Governance Gate
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              PM target parameter ➔ Lead Systems Engineer hardware sign-off
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Step 1: PM Target Value
            </label>
            <input
              type="text"
              placeholder="e.g. <= 200ms or 55°C limit"
              value={pmValue}
              onChange={(e) => setPmValue(e.target.value)}
              disabled={userRole !== 'product_manager'}
              className="input-squircle"
              style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Step 2: Hardware / Architecture Rationale
            </label>
            <input
              type="text"
              placeholder="e.g. Validated against CAN-FD bus budget"
              value={hwRationale}
              onChange={(e) => setHwRationale(e.target.value)}
              disabled={userRole !== 'systems_engineer'}
              className="input-squircle"
              style={{ width: '100%', fontSize: '13px', padding: '6px 10px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {userRole === 'product_manager' && (
            <button
              onClick={() => handleDualKeyAction('provisional_pm')}
              disabled={isSigning || !pmValue.trim()}
              className="btn-squircle btn-warning"
              style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '500' }}
            >
              Set Provisional PM
            </button>
          )}

          {userRole === 'systems_engineer' && (
            <button
              onClick={() => handleDualKeyAction('lock_baseline')}
              disabled={isSigning || !hwRationale.trim()}
              className="btn-squircle btn-success"
              style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '500' }}
            >
              Sign-Off & Lock Baseline
            </button>
          )}

          {userRole === 'executive' && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Executive View: Read-Only Audit Baseline.
            </div>
          )}
        </div>
      </div>

      {/* 5. AI Analysis Deck Tabs */}
      <div className="glass-panel squircle-sm" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '12px' }}>
          {[
            { id: 'xray', label: `X-Ray Issues (${requirement.issues?.length || 0})` },
            { id: 'duel', label: 'Interpretation Duel' },
            { id: 'rewrite', label: 'Intent-Locked Rewriter' },
            { id: 'blueprint', label: 'Verification Blueprint' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDeckTab(tab.id)}
              className="btn-squircle"
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                background: activeDeckTab === tab.id ? 'var(--bg-card-selected)' : 'transparent',
                color: activeDeckTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                border: activeDeckTab === tab.id ? '1px solid var(--border-medium)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeDeckTab === 'xray' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!requirement.issues || requirement.issues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No X-Ray flaws detected. Click "X-Ray" to scan with Llama-3.3-70B.
              </div>
            ) : (
              requirement.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="glass-card squircle-xs"
                  style={{
                    padding: '12px 14px',
                    borderLeft: `3px solid ${issue.severity === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-amber)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge-chip badge-tbd squircle-xs" style={{ fontSize: '10.5px', padding: '2px 7px' }}>
                        {issue.severity}
                      </span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{issue.issue_type}</strong>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      [{issue.start_offset ?? '?'}:{issue.end_offset ?? '?'}]
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', marginBottom: '5px' }}>
                    Flaw: <code style={{ color: 'var(--text-red)', background: 'var(--accent-red-subtle)', padding: '2px 6px', borderRadius: '4px', fontWeight: '500' }}>"{issue.evidence_quote}"</code>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px', lineHeight: '1.45' }}>
                    {issue.explanation}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-green)', fontWeight: '500' }}>
                    Action: {issue.suggested_action}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeDeckTab === 'duel' && (
          <div>
            {!requirement.duel ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No Interpretation Duel staged yet. Click "Duel" above.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    Flaw: <strong style={{ color: 'var(--text-red)' }}>"{requirement.duel.flaw_quote}"</strong>
                  </div>
                  <span className="badge-chip badge-chip-cyan squircle-xs" style={{ fontSize: '11px', padding: '3px 8px' }}>
                    Contrast: {Math.round((requirement.duel.contrast_score || 1.0) * 100)}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="glass-card squircle-xs" style={{ padding: '12px', borderLeft: '3px solid var(--accent-blue)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-blue)', marginBottom: '5px' }}>
                      Interpretation A: {requirement.duel.card_a?.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.45' }}>
                      "{requirement.duel.card_a?.stance}"
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {requirement.duel.card_a?.architectural_impact}
                    </div>
                  </div>

                  <div className="glass-card squircle-xs" style={{ padding: '12px', borderLeft: '3px solid var(--accent-purple)' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-purple)', marginBottom: '5px' }}>
                      Interpretation B: {requirement.duel.card_b?.title}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.45' }}>
                      "{requirement.duel.card_b?.stance}"
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
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
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No Intent-Locked rewrite generated yet. Click "Rewrite" above.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Rationale: <span style={{ color: 'var(--text-primary)' }}>{requirement.rewrite_suggestion.rationale}</span>
                </div>

                <div
                  className="glass-card squircle-xs"
                  style={{
                    padding: '12px 14px',
                    background: 'var(--accent-green-subtle)',
                    border: '1px solid var(--accent-green-border)',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-green)', marginBottom: '4px' }}>
                    PROPOSED EARS STATEMENT (Preserves [TBD])
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.55', fontWeight: '450' }}>
                    {renderHighlightedText(requirement.rewrite_suggestion.revised)}
                  </div>
                </div>

                {requirement.rewrite_suggestion.identified_tbds?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Smart Suggested Defaults:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {requirement.rewrite_suggestion.identified_tbds.map((tbd, i) => (
                        <button
                          key={i}
                          onClick={() => setPmValue(tbd.suggested_value)}
                          className="btn-squircle squircle-pill"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            background: 'var(--accent-amber-subtle)',
                            color: 'var(--text-amber)',
                            border: '1px solid var(--accent-amber-border)',
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
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No Verification Blueprint generated yet. Click "Blueprint" above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Method: <strong style={{ color: 'var(--text-primary)' }}>{requirement.verification_plan.verification_method}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="glass-card squircle-xs" style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-green)', marginBottom: '4px' }}>
                      ✓ Nominal Test: {requirement.verification_plan.positive_test_case?.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {requirement.verification_plan.positive_test_case?.stimulus}
                    </div>
                  </div>

                  <div className="glass-card squircle-xs" style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-red)', marginBottom: '4px' }}>
                      ✗ Boundary Test: {requirement.verification_plan.negative_boundary_test_case?.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {requirement.verification_plan.negative_boundary_test_case?.stimulus}
                    </div>
                  </div>
                </div>

                {requirement.verification_plan.acceptance_criteria && (
                  <div className="glass-card squircle-xs" style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>
                      Acceptance Criteria
                    </div>
                    {Object.entries(requirement.verification_plan.acceptance_criteria).map(([k, v], i) => (
                      <div key={i} style={{ fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                        <strong style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{v}</strong>
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
