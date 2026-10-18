import React, { useState, useEffect } from 'react';
import {
  runXray,
  runDuel,
  runRewrite,
  runBlueprint,
  signOffRequirement,
  calculateRubricScore,
  updateRequirement,
  deleteRequirement,
} from '../services/api';

/**
 * DeepInspectorTab Component (Antigravity 2.0 Pro Edition)
 * High-density engineering inspector with muted colors and crisp receipts.
 */
export default function DeepInspectorTab({
  requirement,
  requirements = [],
  activeProjectId,
  userRole,
  onRequirementUpdated,
  onRequirementDeleted,
}) {
  const [activeDeckTab, setActiveDeckTab] = useState('xray');
  const [isRunningAI, setIsRunningAI] = useState(false);

  const [pmValue, setPmValue] = useState(requirement?.sign_off?.pm_target_val || '');
  const [hwRationale, setHwRationale] = useState(requirement?.sign_off?.hardware_rationale || '');
  const [isSigning, setIsSigning] = useState(false);

  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState(requirement?.text || '');

  // Keep state synchronized whenever active requirement changes
  useEffect(() => {
    if (requirement) {
      setEditedText(requirement.text || '');
      setPmValue(requirement.sign_off?.pm_target_val || '');
      setHwRationale(requirement.sign_off?.hardware_rationale || '');
      setIsEditingText(false);
      setActiveTbdToken(null);
    }
  }, [requirement?.id, requirement?.text]);

  const pendingSignOffCount = (requirements || []).filter((r) => r.status === 'PROVISIONAL_PM').length;

  // Grammarly-Style TBD Inline Resolver State
  const [activeTbdToken, setActiveTbdToken] = useState(null);
  const [customTbdVal, setCustomTbdVal] = useState('');
  const [isResolvingTbd, setIsResolvingTbd] = useState(false);
  const [tbdResolvedMessage, setTbdResolvedMessage] = useState('');

  // Upgraded Mathematical Ledger State
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(true);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const handleCopyReceipt = () => {
    if (!requirement?.quality_score?.receipt) return;
    const textToCopy = [
      `=== MATHEMATICAL DEDUCTION AUDIT RECEIPT ===`,
      `Requirement: ${requirement.id} [${requirement.category || 'General'}]`,
      `Text: "${requirement.text}"`,
      `Final Rubric Score: ${requirement.quality_score.overall}/100`,
      `-------------------------------------------`,
      ...requirement.quality_score.receipt,
      `===========================================`,
    ].join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const parseReceiptStep = (step) => {
    if (step.startsWith('[Baseline Budget]')) {
      return {
        type: 'baseline',
        dim: 'BASELINE',
        pts: '+100.0 pts',
        isDeduction: false,
        text: step.replace('[Baseline Budget]', '').trim(),
        color: '#57c07b',
        bg: 'rgba(87, 192, 123, 0.15)',
        border: 'rgba(87, 192, 123, 0.3)',
      };
    }
    if (step.startsWith('[Summary]')) {
      return {
        type: 'summary',
        dim: 'SUMMARY',
        pts: 'Audit Tally',
        isDeduction: false,
        text: step.replace('[Summary]', '').trim(),
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.12)',
        border: 'rgba(96, 165, 250, 0.25)',
      };
    }

    const match = step.match(/^\[([A-Za-z]+)\s*(-[\d.]+)\s*pts\]\s*(.*)$/);
    if (match) {
      const dim = match[1];
      const pts = match[2];
      const desc = match[3];

      let color = '#f59e0b';
      let bg = 'rgba(245, 158, 11, 0.15)';
      let border = 'rgba(245, 158, 11, 0.3)';

      if (dim === 'Clarity') {
        color = '#f97316';
        bg = 'rgba(249, 115, 22, 0.15)';
        border = 'rgba(249, 115, 22, 0.3)';
      } else if (dim === 'Verifiability') {
        color = '#ec4899';
        bg = 'rgba(236, 72, 153, 0.15)';
        border = 'rgba(236, 72, 153, 0.3)';
      } else if (dim === 'Completeness') {
        color = '#38bdf8';
        bg = 'rgba(56, 189, 248, 0.15)';
        border = 'rgba(56, 189, 248, 0.3)';
      } else if (dim === 'Atomicity') {
        color = '#eab308';
        bg = 'rgba(234, 179, 8, 0.15)';
        border = 'rgba(234, 179, 8, 0.3)';
      } else if (dim === 'Consistency') {
        color = '#ef4444';
        bg = 'rgba(239, 68, 68, 0.15)';
        border = 'rgba(239, 68, 68, 0.3)';
      }

      return {
        type: 'deduction',
        dim: dim.toUpperCase(),
        pts: `${pts} pts`,
        isDeduction: true,
        text: desc,
        color,
        bg,
        border,
      };
    }

    return {
      type: 'note',
      dim: 'AUDIT NOTE',
      pts: 'Info',
      isDeduction: false,
      text: step,
      color: '#9ca3af',
      bg: 'rgba(156, 163, 175, 0.12)',
      border: 'rgba(156, 163, 175, 0.25)',
    };
  };

  const renderReceiptText = (rawText) => {
    const parts = rawText.split(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\[TBD:[^\]]+\])/g);
    return parts.map((chunk, i) => {
      if ((chunk.startsWith("'") && chunk.endsWith("'")) || (chunk.startsWith('"') && chunk.endsWith('"'))) {
        return (
          <code
            key={i}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ff7b72',
              padding: '1px 5px',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '600',
            }}
          >
            {chunk}
          </code>
        );
      }
      if (chunk.startsWith('[TBD:') && chunk.endsWith(']')) {
        return (
          <code
            key={i}
            style={{
              background: 'rgba(235, 87, 87, 0.2)',
              color: '#ff6b6b',
              padding: '1px 5px',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: '700',
              border: '1px solid rgba(235, 87, 87, 0.35)',
            }}
          >
            {chunk}
          </code>
        );
      }
      return chunk;
    });
  };

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
      const res = await runXray(requirement.text, activeProjectId, requirement.id);
      const issuesList = Array.isArray(res) ? res : (res.issues || []);
      const rubric = await calculateRubricScore(requirement.text, issuesList);
      const updatedReq = {
        ...requirement,
        issues: issuesList,
        quality_score: rubric || requirement.quality_score,
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
    setActiveDeckTab('rewrite');
    try {
      const res = await runRewrite(requirement.text, activeProjectId);
      const updatedReq = {
        ...requirement,
        rewrite_suggestion: res,
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setActiveDeckTab('rewrite');
      setTbdResolvedMessage('✓ Intent-Locked EARS rewrite generated by Qualcomm Cloud AI 100');
      setTimeout(() => setTbdResolvedMessage(''), 6000);
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

  const handleStartEdit = () => {
    setEditedText(requirement?.text || '');
    setIsEditingText(true);
  };

  const handleCancelEdit = () => {
    setEditedText(requirement?.text || '');
    setIsEditingText(false);
  };

  const handleSaveTextEdit = async () => {
    if (!editedText.trim()) return;
    try {
      const textTrimmed = editedText.trim();
      const score = await calculateRubricScore(textTrimmed);
      const hasRemainingTbd = textTrimmed.includes('[TBD:') || textTrimmed.includes('[TBD]');
      // Strict Dual-Key Governance:
      // Even if previously locked/green, any text edit demotes status to PROVISIONAL_PM (yellow)
      // or FLAGGED_TBD (red if TBDs remain). Senior Engineer approval is strictly cleared.
      const nextStatus = hasRemainingTbd ? 'FLAGGED_TBD' : 'PROVISIONAL_PM';

      const updatedReq = {
        ...requirement,
        text: textTrimmed,
        quality_score: score,
        status: nextStatus,
        sign_off: {
          ...(requirement.sign_off || { requirement_id: requirement.id }),
          pm_author: requirement.sign_off?.pm_author || (userRole === 'product_manager' ? 'PM Author' : 'Product Manager'),
          pm_target_val: `Contractual statement updated by PM`,
          tech_lead_approver: null,
          hardware_rationale: null,
          signed_off_at: null,
          state: nextStatus,
        },
      };
      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setIsEditingText(false);
      setTbdResolvedMessage(
        hasRemainingTbd
          ? 'Contractual statement updated (Unresolved [TBD] parameters remaining 🔴)'
          : 'Contractual statement updated ➔ Provisional PM 🟡 (Queued for Senior Systems Engineer Sign-Off)'
      );
      setTimeout(() => setTbdResolvedMessage(''), 6000);
    } catch (err) {
      alert(`Save edit failed: ${err.message}`);
    }
  };

  const handleDeleteSelf = async () => {
    if (!window.confirm(`Delete requirement ${requirement.id} from this project?`)) return;
    try {
      await deleteRequirement(requirement.id, activeProjectId, userRole);
      onRequirementDeleted?.(requirement.id);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const scoreObj = requirement.quality_score;
  const overallScore = scoreObj ? Math.round(scoreObj.overall) : 0;

  const getSmartSuggestionsForParam = (paramName) => {
    const p = (paramName || '').toLowerCase().trim();

    // 0. Explicit vague / unquantified terms mapping to formal TBD placeholders & engineering defaults
    if (p === 'periodically') {
      return [
        { value: 'every [TBD: transmission interval in ms]', rationale: 'Convert to contractual [TBD] parameter envelope', confidence: 'RECOMMENDED' },
        { value: 'every 1000ms', rationale: '1 Hz nominal CAN-FD telemetry broadcast rate', confidence: 'HIGH' },
        { value: 'every 5000ms', rationale: '0.2 Hz low-power telematics transmission cycle', confidence: 'MEDIUM' },
      ];
    }
    if (p === 'as appropriate') {
      return [
        { value: 'under [TBD: transmission policy]', rationale: 'Convert to contractual [TBD] policy envelope', confidence: 'RECOMMENDED' },
        { value: 'upon DTC fault trigger or cyclic timer expiry', rationale: 'Deterministic ISO 14229 UDS diagnostic trigger', confidence: 'HIGH' },
        { value: 'when vehicle ignition state is active', rationale: 'Power-mode gated telemetry transmission', confidence: 'MEDIUM' },
      ];
    }
    if (p === 'quickly') {
      return [
        { value: 'within [TBD: response duration in ms]', rationale: 'Convert to contractual [TBD] latency envelope', confidence: 'RECOMMENDED' },
        { value: 'within 10ms', rationale: 'ASIL-D real-time safety response budget', confidence: 'HIGH' },
        { value: 'within 50ms', rationale: 'Standard cyclic task deadline', confidence: 'MEDIUM' },
      ];
    }
    if (p === 'promptly') {
      return [
        { value: 'within [TBD: timeout duration in ms]', rationale: 'Convert to contractual [TBD] deadline', confidence: 'RECOMMENDED' },
        { value: 'within 100ms', rationale: 'Sub-system fault broadcast time ceiling', confidence: 'HIGH' },
      ];
    }
    if (p === 'high reliability') {
      return [
        { value: 'with [TBD: MTBF target or ASIL level]', rationale: 'Convert to contractual [TBD] reliability metric', confidence: 'RECOMMENDED' },
        { value: 'with 99.999% availability (ISO 26262 ASIL-D)', rationale: 'Safety-critical automotive integrity level', confidence: 'HIGH' },
        { value: 'with MTBF exceeding 50,000 operating hours', rationale: 'IEC 60601-1 mission durability benchmark', confidence: 'MEDIUM' },
      ];
    }
    if (p === 'high pressure') {
      return [
        { value: 'when pressure exceeds [TBD: occlusion threshold in kPa]', rationale: 'Convert to contractual [TBD] pressure cutoff', confidence: 'RECOMMENDED' },
        { value: 'when line pressure exceeds 100 kPa ± 10 kPa', rationale: 'IEC 62304 downstream occlusion alarm threshold', confidence: 'HIGH' },
        { value: 'when line pressure exceeds 15 psi', rationale: 'Fluidic barrier physical relief threshold', confidence: 'MEDIUM' },
      ];
    }
    if (p === 'critical') {
      return [
        { value: '[TBD: critical temperature threshold]', rationale: 'Convert to contractual [TBD] thermal limit', confidence: 'RECOMMENDED' },
        { value: 'pack surface temperature exceeds 55°C', rationale: 'BMS thermal runaway derating threshold', confidence: 'HIGH' },
        { value: 'junction temperature exceeds 65°C', rationale: 'Inverter silicon-carbide junction protection cutoff', confidence: 'HIGH' },
      ];
    }
    if (p === 'normal load' || p === 'normal conditions') {
      return [
        { value: 'under [TBD: operating temperature and voltage envelope]', rationale: 'Convert to contractual [TBD] operating conditions', confidence: 'RECOMMENDED' },
        { value: 'between -20°C and +50°C under 350V–450V bus voltage', rationale: 'Standard automotive environmental qualification envelope', confidence: 'HIGH' },
      ];
    }

    // 1. Check if AI Smart Rewriter already provided suggestions in identified_tbds
    const identified = requirement.rewrite_suggestion?.identified_tbds || [];
    const matched = identified.find(
      (t) => t.parameter_name?.toLowerCase() === p || p.includes(t.parameter_name?.toLowerCase())
    );
    if (matched) {
      return [
        {
          value: matched.suggested_value,
          rationale: matched.rationale || 'AI Smart Rewriter recommendation',
          confidence: matched.confidence || 'HIGH',
        },
      ];
    }

    // 2. Domain-grounded Smart Suggested Defaults
    if (p.includes('latency') || p.includes('time') || p.includes('delay') || p.includes('ms')) {
      return [
        { value: '10ms', rationale: 'ISO 26262 ASIL-D high-voltage disconnect threshold', confidence: 'HIGH' },
        { value: '25ms', rationale: 'DO-178C Level-A fly-by-wire cyclic control budget', confidence: 'HIGH' },
        { value: '50ms', rationale: 'CAN-FD nominal cyclic broadcast deadline', confidence: 'MEDIUM' },
      ];
    }
    if (p.includes('temp') || p.includes('heat') || p.includes('deg')) {
      return [
        { value: '55°C', rationale: 'Maximum pack surface temperature during DC fast charge', confidence: 'HIGH' },
        { value: '58°C', rationale: 'BMS thermal safety warning trigger', confidence: 'HIGH' },
        { value: '60°C', rationale: 'Critical thermal runaway derating cutoff', confidence: 'HIGH' },
      ];
    }
    if (p.includes('accuracy') || p.includes('pct') || p.includes('percent') || p.includes('tolerance')) {
      return [
        { value: '± 2.0%', rationale: 'IEC 62304 Class-III micro-bolus volumetric tolerance', confidence: 'HIGH' },
        { value: '± 5.0%', rationale: 'Nominal commercial pump delivery window', confidence: 'MEDIUM' },
        { value: '± 1.0%', rationale: 'Critical pediatric drug infusion tolerance', confidence: 'HIGH' },
      ];
    }
    if (p.includes('pressure') || p.includes('psi') || p.includes('kpa')) {
      return [
        { value: '100 kPa ± 10 kPa', rationale: 'IEC 62304 downstream occlusion threshold', confidence: 'HIGH' },
        { value: '15 psi', rationale: 'Fluidic line safety relief barrier limit', confidence: 'MEDIUM' },
      ];
    }
    if (p.includes('rate') || p.includes('baud') || p.includes('freq') || p.includes('hz')) {
      return [
        { value: '500 kbps nominal, 2 Mbps data', rationale: 'Automotive CAN-FD standard bus profile', confidence: 'HIGH' },
        { value: '100 Hz', rationale: 'High-frequency telemetry sampling rate', confidence: 'MEDIUM' },
      ];
    }
    if (p.includes('runtime') || p.includes('battery') || p.includes('duration') || p.includes('min')) {
      return [
        { value: '120 minutes', rationale: 'IEC 60601-1 continuous life-support battery backup', confidence: 'HIGH' },
        { value: '60 minutes', rationale: 'Standard transport failsafe duration', confidence: 'MEDIUM' },
      ];
    }

    // Default engineering fallbacks
    return [
      { value: '10ms', rationale: 'Safety-critical real-time response threshold', confidence: 'MEDIUM' },
      { value: '50ms', rationale: 'Standard cyclic task deadline', confidence: 'MEDIUM' },
    ];
  };

  const handleResolveTbd = async (targetToken, resolvedValue, rationale) => {
    if (!resolvedValue || !resolvedValue.trim()) return;
    setIsResolvingTbd(true);
    try {
      const valTrimmed = resolvedValue.trim();
      const newText = requirement.text.replace(targetToken, valTrimmed);
      const newScore = await calculateRubricScore(newText);
      const hasRemainingTbd = newText.includes('[TBD:') || newText.includes('[TBD]');

      // Strict Dual-Key Governance:
      // Changing TBD from red to something or from provisioned to a selected value:
      // Keep it strictly yellow (PROVISIONAL_PM) if free of [TBD].
      // If [TBD] tokens remain, it stays red (FLAGGED_TBD).
      // It can NEVER become green (LOCKED_BASELINE) until a senior systems engineer explicitly approves it!
      const nextStatus = hasRemainingTbd ? 'FLAGGED_TBD' : 'PROVISIONAL_PM';

      const updatedReq = {
        ...requirement,
        text: newText,
        quality_score: newScore,
        status: nextStatus,
        sign_off: {
          ...(requirement.sign_off || { requirement_id: requirement.id }),
          pm_author: requirement.sign_off?.pm_author || (userRole === 'product_manager' ? 'PM Author' : 'Product Manager'),
          pm_target_val: `Bound parameter: ${valTrimmed} (${rationale || 'Specified by engineering envelope'})`,
          tech_lead_approver: null, // Reset senior engineer sign-off!
          hardware_rationale: null,
          signed_off_at: null,
          state: nextStatus,
        },
      };

      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setActiveTbdToken(null);
      setCustomTbdVal('');
      setTbdResolvedMessage(
        hasRemainingTbd
          ? `Updated parameter "${valTrimmed}" (Pending further [TBD] resolution 🔴)`
          : `Selected value "${valTrimmed}" ➔ Saved as Provisional PM 🟡 (Awaiting Lead Systems Engineer sign-off to Lock Baseline 🟢)`
      );
      setTimeout(() => setTbdResolvedMessage(''), 6000);
    } catch (err) {
      alert(`Failed to apply parameter: ${err.message}`);
    } finally {
      setIsResolvingTbd(false);
    }
  };

  const handleApplyRewrite = async () => {
    if (!requirement.rewrite_suggestion?.revised) return;
    try {
      const revisedText = requirement.rewrite_suggestion.revised.trim();
      const score = await calculateRubricScore(revisedText);
      const hasRemainingTbd = revisedText.includes('[TBD:') || revisedText.includes('[TBD]');
      const nextStatus = hasRemainingTbd ? 'FLAGGED_TBD' : 'PROVISIONAL_PM';

      const updatedReq = {
        ...requirement,
        text: revisedText,
        quality_score: score,
        status: nextStatus,
        sign_off: {
          ...(requirement.sign_off || { requirement_id: requirement.id }),
          pm_author: requirement.sign_off?.pm_author || (userRole === 'product_manager' ? 'PM Author' : 'Product Manager'),
          pm_target_val: `EARS Statement Applied: ${requirement.rewrite_suggestion.rationale || 'Modal rewrite'}`,
          tech_lead_approver: null,
          hardware_rationale: null,
          signed_off_at: null,
          state: nextStatus,
        },
      };

      const saved = await updateRequirement(requirement.id, updatedReq, userRole);
      onRequirementUpdated(saved);
      setTbdResolvedMessage(
        hasRemainingTbd
          ? 'EARS Statement applied with contractual [TBD] placeholders 🔴'
          : 'EARS Statement applied ➔ Saved as Provisional PM 🟡 (Awaiting Lead Systems Engineer sign-off 🟢)'
      );
      setTimeout(() => setTbdResolvedMessage(''), 6000);
    } catch (err) {
      alert(`Apply rewrite failed: ${err.message}`);
    }
  };

  const renderHighlightedText = (text) => {
    // Known ambiguous terms + issue evidence quotes
    const knownVagueTerms = [
      'periodically',
      'as appropriate',
      'quickly',
      'promptly',
      'high reliability',
      'high pressure',
      'normal load',
      'normal conditions',
      'user-friendly',
      'optimal',
      'robust',
      'reasonable',
      'gracefully',
      'critical',
    ];

    const issueQuotes = (requirement?.issues || [])
      .map((i) => i.evidence_quote?.trim())
      .filter((q) => q && q.length > 2 && q.length < 35 && !q.includes('\n'));

    const combinedTerms = Array.from(new Set([...knownVagueTerms, ...issueQuotes]))
      .sort((a, b) => b.length - a.length)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    const regex = new RegExp(`(\\[TBD:[^\\]]+\\]|\\b(?:${combinedTerms.join('|')})\\b)`, 'gi');
    const parts = text.split(regex);
    let tokenIndex = 0;

    return (
      <span>
        {parts.map((part, i) => {
          if (!part) return null;
          const isTbd = part.startsWith('[TBD:') && part.endsWith(']');
          const isVague = !isTbd && combinedTerms.some((t) => new RegExp(`^${t}$`, 'i').test(part));

          if (isTbd || isVague) {
            const currentTokenIndex = tokenIndex++;
            const paramName = isTbd ? part.slice(5, -1).trim() : part.trim();
            const isOpen = activeTbdToken && activeTbdToken.index === currentTokenIndex;
            const suggestions = getSmartSuggestionsForParam(paramName);

            const chipColor = isTbd ? '#ff6b6b' : '#f59e0b';
            const chipBg = isOpen
              ? (isTbd ? 'rgba(235, 87, 87, 0.35)' : 'rgba(245, 158, 11, 0.35)')
              : (isTbd ? 'rgba(235, 87, 87, 0.16)' : 'rgba(245, 158, 11, 0.16)');
            const chipBorder = isOpen
              ? (isTbd ? '1px solid #ff6b6b' : '1px solid #f59e0b')
              : (isTbd ? '1px solid rgba(235, 87, 87, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)');

            return (
              <span key={i} style={{ position: 'relative', display: 'inline-block', margin: '0 2px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTbdToken(isOpen ? null : { token: part, param: paramName, index: currentTokenIndex, isVague });
                  }}
                  className="tbd-token-chip"
                  style={{
                    cursor: 'pointer',
                    background: chipBg,
                    color: chipColor,
                    border: chipBorder,
                    boxShadow: isOpen ? `0 0 10px ${isTbd ? 'rgba(235, 87, 87, 0.3)' : 'rgba(245, 158, 11, 0.3)'}` : 'none',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.12s ease',
                  }}
                  title={isTbd ? "Click to resolve parameter with Grammarly-style Smart Defaults" : `Unquantified term '${part}': Click to replace with a [TBD] parameter or engineering default`}
                >
                  <span style={{ fontSize: '11px' }}>{isTbd ? '✨' : '⚠️'}</span>
                  <span>{part}</span>
                  <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
                </button>

                {/* Grammarly-Style Floating Card Popover */}
                {isOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '0',
                      zIndex: 1000,
                      width: '350px',
                      background: '#242426',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      borderRadius: '6px',
                      boxShadow: '0 14px 40px rgba(0, 0, 0, 0.75), 0 2px 8px rgba(0, 0, 0, 0.4)',
                      padding: '12px 14px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>{isTbd ? '✨' : '⚠️'}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {isTbd ? 'Resolve TBD:' : 'Unquantified Parameter:'}{' '}
                          <code style={{ color: chipColor, background: 'rgba(255, 255, 255, 0.08)', padding: '1px 5px', borderRadius: '3px' }}>
                            {paramName}
                          </code>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTbdToken(null)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: '1.4' }}>
                      {isTbd
                        ? 'Select a Smart Suggested Default from the engineering envelope, or enter a custom contractual value:'
                        : `'${paramName}' is ambiguous and unquantified. Convert to a formal contractual [TBD] parameter or apply an engineering default:`}
                    </div>

                    {/* Suggested Replacement Chips (Grammarly style 1-click accept) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Smart Suggested Actions
                      </div>
                      {suggestions.map((sug, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => handleResolveTbd(part, sug.value, sug.rationale)}
                          style={{
                            padding: '7px 9px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.10)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.12s ease',
                          }}
                          className="tbd-suggestion-row"
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: '700', color: sug.value.includes('[TBD:') ? '#ff7b72' : '#57c07b', fontFamily: 'var(--font-mono)' }}>
                                {sug.value}
                              </span>
                              <span style={{ fontSize: '9.5px', padding: '1px 4px', background: sug.value.includes('[TBD:') ? 'rgba(235, 87, 87, 0.2)' : 'rgba(46, 133, 81, 0.2)', color: sug.value.includes('[TBD:') ? '#ff7b72' : '#4dab72', borderRadius: '2px' }}>
                                {sug.confidence}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {sug.rationale}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: sug.value.includes('[TBD:') ? '#ff7b72' : '#57c07b', fontWeight: '600', paddingLeft: '8px', whiteSpace: 'nowrap' }}>
                            Apply ↵
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Custom Input Entry */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px' }}>
                        Custom Engineering Parameter / Value
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder={isTbd ? "e.g. 15ms or 55°C" : "e.g. every [TBD: interval] or 1000ms"}
                          value={customTbdVal}
                          onChange={(e) => setCustomTbdVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleResolveTbd(part, customTbdVal, 'Custom user value');
                            }
                          }}
                          className="input-squircle"
                          style={{ flex: 1, fontSize: '12px', padding: '4px 8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleResolveTbd(part, customTbdVal, 'Custom user value')}
                          disabled={!customTbdVal.trim() || isResolvingTbd}
                          className="notion-btn notion-btn-primary"
                          style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: '600' }}
                        >
                          {isResolvingTbd ? '...' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '12px', paddingRight: '6px' }}>
      {/* 0. Senior Systems Engineer Sign-Off Dashboard Banner */}
      {userRole === 'systems_engineer' && (
        <div
          className="glass-panel squircle-sm"
          style={{
            padding: '12px 16px',
            background: pendingSignOffCount > 0 ? 'rgba(217, 119, 6, 0.12)' : 'rgba(34, 197, 94, 0.10)',
            border: `1px solid ${pendingSignOffCount > 0 ? 'rgba(217, 119, 6, 0.35)' : 'rgba(34, 197, 94, 0.25)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🛠️</span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Lead Systems Engineer Sign-Off Queue
                </span>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Dual-Key Technical Authority • Review PM-provisioned requirements to grant final green baseline
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                className="badge-chip"
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 10px',
                  background: pendingSignOffCount > 0 ? 'rgba(217, 119, 6, 0.25)' : 'rgba(34, 197, 94, 0.2)',
                  color: pendingSignOffCount > 0 ? '#fbbf24' : '#4ade80',
                  border: `1px solid ${pendingSignOffCount > 0 ? 'rgba(217, 119, 6, 0.5)' : 'rgba(34, 197, 94, 0.4)'}`,
                }}
              >
                📋 {pendingSignOffCount} Pending Review
              </span>
              <span
                className="badge-chip"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-muted)',
                }}
              >
                {(requirements || []).length} Total Reqs
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
            <div>
              {isProv ? (
                <span style={{ color: '#fbbf24', fontWeight: '500' }}>
                  👉 Current requirement <strong style={{ color: 'var(--text-primary)' }}>{requirement.id}</strong> has been provisioned by PM and is ready for your technical sign-off below.
                </span>
              ) : isLocked ? (
                <span style={{ color: '#4ade80', fontWeight: '500' }}>
                  ✓ Current requirement <strong style={{ color: 'var(--text-primary)' }}>{requirement.id}</strong> has been signed off and locked as a technical baseline.
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  ⏳ Current requirement <strong style={{ color: 'var(--text-primary)' }}>{requirement.id}</strong> is still flagged with unquantified parameters (Red 🔴). PM must provision values first.
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', color: 'var(--text-dim)', fontSize: '11px' }}>
              <span>Locked: {(requirements || []).filter((r) => r.status === 'LOCKED_BASELINE').length} 🟢</span>
              <span>•</span>
              <span>Provisional: {pendingSignOffCount} 🟡</span>
              <span>•</span>
              <span>Flagged TBD: {(requirements || []).filter((r) => r.status === 'FLAGGED_TBD').length} 🔴</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Notion Page Header & Title */}
      <div style={{ padding: '8px 4px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>
              {activeProjectId.includes('bms') ? '⚡' : activeProjectId.includes('flight') ? '✈' : activeProjectId.includes('med') ? '✚' : '📄'}
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {requirement.id}: {requirement.category || 'Functional Requirement'}
            </h1>
          </div>
          {userRole !== 'executive' && (
            <button
              type="button"
              onClick={handleDeleteSelf}
              className="notion-btn notion-btn-danger"
              style={{ fontSize: '11px', padding: '3px 8px', gap: '4px' }}
              title="Delete this requirement from workspace"
            >
              <span>🗑️</span> Delete
            </button>
          )}
        </div>

        {/* 2. Notion Properties Table */}
        <div style={{ display: 'flex', flexDirection: 'column', margin: '10px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '4px 0' }}>
          <div className="notion-property-row">
            <div className="notion-property-name">
              <span>🏷️</span> Status
            </div>
            <div className="notion-property-value">
              <span className={`badge-chip ${isLocked ? 'badge-locked' : isProv ? 'badge-provisional' : 'badge-tbd'}`}>
                {isLocked ? 'LOCKED BASELINE' : isProv ? 'PROVISIONAL PM' : 'FLAGGED TBD'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                v{requirement.version}
              </span>
            </div>
          </div>

          <div className="notion-property-row">
            <div className="notion-property-name">
              <span>📑</span> Section
            </div>
            <div className="notion-property-value">
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{requirement.section || 'General'}</span>
            </div>
          </div>

          <div className="notion-property-row">
            <div className="notion-property-name">
              <span>📊</span> Quality Score
            </div>
            <div className="notion-property-value">
              <span style={{ fontWeight: '600', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>
                {overallScore}/100
              </span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                (Clarity: {scoreObj?.clarity || 0}/25 • Verifiability: {scoreObj?.verifiability || 0}/25 • Completeness: {scoreObj?.completeness || 0}/20)
              </span>
            </div>
          </div>

          <div className="notion-property-row">
            <div className="notion-property-name">
              <span>🔑</span> Dual-Key Gate
            </div>
            <div className="notion-property-value">
              <span style={{ fontSize: '12px', color: isLocked ? 'var(--text-green)' : isProv ? 'var(--text-amber)' : 'var(--text-muted)' }}>
                {isLocked ? `Technical Sign-off: ${requirement.sign_off?.tech_lead_approver || 'Lead Systems Engineer'}` : isProv ? `PM Provisional Value: ${requirement.sign_off?.pm_target_val || 'Pending validation'}` : 'Pending Dual-Key Sign-off'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Notion Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px' }}>
          <button
            onClick={handleTriggerXray}
            disabled={isRunningAI}
            className="notion-btn"
          >
            🔬 Run X-Ray
          </button>
          <button
            onClick={handleTriggerDuel}
            disabled={isRunningAI}
            className="notion-btn"
          >
            ⚔️ Interpretation Duel
          </button>
          <button
            onClick={handleTriggerRewrite}
            disabled={isRunningAI}
            className="notion-btn"
          >
            ✍️ Intent-Locked Rewrite
          </button>
          <button
            onClick={handleTriggerBlueprint}
            disabled={isRunningAI}
            className="notion-btn"
          >
            🧪 Verification Blueprint
          </button>
        </div>
      </div>

      {/* 4. Notion Callout Block for Requirement Statement */}
      <div className="notion-callout">
        <div className="notion-callout-icon">📌</div>
        <div className="notion-callout-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Contractual Statement
            </span>
            {userRole !== 'executive' && !isEditingText && (
              <button
                onClick={handleStartEdit}
                className="notion-btn"
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                ✎ Edit Statement
              </button>
            )}
          </div>

          {/* Unquantified TBD Flag Notification Banner */}
          {requirement.status === 'FLAGGED_TBD' && !isEditingText && (
            <div
              style={{
                marginBottom: '10px',
                padding: '7px 10px',
                background: 'rgba(235, 87, 87, 0.10)',
                border: '1px solid rgba(235, 87, 87, 0.28)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '11.5px',
                color: '#ff7b72',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>⚠️</span>
                <span>
                  <strong>Unquantified Parameters Flagged</strong>:{' '}
                  {requirement.text.includes('[TBD:')
                    ? 'Contains formal [TBD] parameter chip. Click the chip below to resolve.'
                    : 'Ambiguous or unquantified terms detected. Click any highlighted ⚠️ token below to insert [TBD] parameters or apply smart defaults.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerRewrite}
                disabled={isRunningAI}
                className="notion-btn"
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderColor: 'rgba(235, 87, 87, 0.4)',
                  color: '#ff7b72',
                  background: 'rgba(235, 87, 87, 0.15)',
                  whiteSpace: 'nowrap',
                  cursor: isRunningAI ? 'wait' : 'pointer',
                }}
              >
                {isRunningAI ? '⏳ Synthesizing Rewrite...' : '✨ Run Rewriter'}
              </button>
            </div>
          )}

          {isEditingText ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="input-squircle"
                style={{
                  width: '100%',
                  minHeight: '84px',
                  fontSize: '14px',
                  lineHeight: '1.55',
                  padding: '8px 10px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Enter contractual requirement statement (use [TBD: parameter_name] for unquantified metrics)..."
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="notion-btn"
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTextEdit}
                  disabled={!editedText.trim()}
                  className="notion-btn notion-btn-primary"
                  style={{ padding: '4px 12px', fontSize: '11.5px', fontWeight: '600' }}
                >
                  ✓ Save & Provision (Yellow 🟡)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14.5px', lineHeight: '1.65', color: 'var(--text-primary)', fontWeight: '450' }}>
              {renderHighlightedText(requirement.text)}
            </div>
          )}
        </div>
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

        {/* Upgraded Mathematical Deduction Audit Ledger */}
        {scoreObj?.receipt && scoreObj.receipt.length > 0 && (
          <div
            className="squircle-xs"
            style={{
              marginTop: '12px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Ledger Header Bar */}
            <div
              style={{
                padding: '9px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: isLedgerExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div
                onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span style={{ fontSize: '13px' }}>🧾</span>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Mathematical Deduction Ledger
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.07)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {scoreObj.receipt.filter((s) => s.includes('pts]') && !s.includes('Baseline')).length} penalties
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '2px' }}>
                  {isLedgerExpanded ? '▲' : '▼'}
                </span>
              </div>

              {/* Live Equation Chip & Copy Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span style={{ color: '#57c07b' }}>100.0</span>
                  <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>−</span>
                  <span style={{ color: '#ff6b6b' }}>{(100 - scoreObj.overall).toFixed(1)}</span>
                  <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>=</span>
                  <span style={{ color: scoreObj.overall >= 80 ? '#57c07b' : scoreObj.overall >= 60 ? '#f59e0b' : '#ff6b6b', fontWeight: '700' }}>
                    {scoreObj.overall.toFixed(1)} pts
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="notion-btn notion-btn-ghost"
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    height: '24px',
                    gap: '4px',
                  }}
                  title="Copy full itemized mathematical deduction receipt to clipboard"
                >
                  <span>{copiedReceipt ? '✓' : '📋'}</span>
                  <span>{copiedReceipt ? 'Copied!' : 'Copy Receipt'}</span>
                </button>
              </div>
            </div>

            {/* Ledger Rows Body */}
            {isLedgerExpanded && (
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {scoreObj.receipt.length === 2 && scoreObj.overall === 100 ? (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(87, 192, 123, 0.10)',
                      border: '1px solid rgba(87, 192, 123, 0.22)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#57c07b',
                    }}
                  >
                    <span>🛡️</span>
                    <span style={{ fontWeight: '500' }}>
                      Zero Deductions Applied — 100% Contractually Bound (100.0 / 100 pts)
                    </span>
                  </div>
                ) : null}

                {scoreObj.receipt.map((step, idx) => {
                  const parsed = parseReceiptStep(step);
                  const isSummary = parsed.type === 'summary';

                  if (isSummary) {
                    return (
                      <div
                        key={idx}
                        style={{
                          marginTop: '4px',
                          padding: '7px 10px',
                          background: 'rgba(96, 165, 250, 0.08)',
                          border: '1px solid rgba(96, 165, 250, 0.18)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: '700',
                              fontFamily: 'var(--font-mono)',
                              background: 'rgba(96, 165, 250, 0.2)',
                              color: '#60a5fa',
                              padding: '2px 5px',
                              borderRadius: '3px',
                            }}
                          >
                            SUMMARY TALLY
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {parsed.text}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 9px',
                        background: parsed.type === 'baseline' ? 'rgba(87, 192, 123, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${parsed.type === 'baseline' ? 'rgba(87, 192, 123, 0.18)' : 'rgba(255, 255, 255, 0.05)'}`,
                        borderRadius: '4px',
                        display: 'grid',
                        gridTemplateColumns: '32px 115px 80px 1fr',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11.5px',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      {/* Step Number */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        #{String(idx + 1).padStart(2, '0')}
                      </span>

                      {/* Dimension Tag */}
                      <div>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-mono)',
                            background: parsed.bg,
                            color: parsed.color,
                            border: `1px solid ${parsed.border}`,
                            padding: '1.5px 5px',
                            borderRadius: '3px',
                            display: 'inline-block',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {parsed.dim}
                        </span>
                      </div>

                      {/* Delta Points Badge */}
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-mono)',
                            color: parsed.isDeduction ? '#ff6b6b' : '#57c07b',
                            background: parsed.isDeduction ? 'rgba(235, 87, 87, 0.15)' : 'rgba(87, 192, 123, 0.15)',
                            padding: '1.5px 6px',
                            borderRadius: '3px',
                            display: 'inline-block',
                          }}
                        >
                          {parsed.pts}
                        </span>
                      </div>

                      {/* Explanation with Quoted Tokens */}
                      <div
                        style={{
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {renderReceiptText(parsed.text)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Dual-Key Governance Gate</span>
              <span
                className={`badge-chip ${isLocked ? 'badge-locked' : isProv ? 'badge-provisional' : 'badge-tbd'}`}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                {isLocked
                  ? '🟢 LOCKED BASELINE (Technical Sign-Off Complete)'
                  : isProv
                  ? '🟡 PROVISIONAL PM (Awaiting Lead Systems Engineer Sign-Off)'
                  : '🔴 FLAGGED TBD (Parameters Unbound)'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Product Manager provisions contractual values ➔ Lead Systems Engineer validates architecture/hardware constraints & locks baseline
            </div>
          </div>
        </div>

        {/* Role-Specific Governance Panel */}
        {userRole === 'product_manager' && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  👔 Product Manager Authoring Workflow
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  {isProv ? (
                    <span>
                      ✓ You have provisioned all parameters in the contractual statement. This requirement is in the <strong>Lead Systems Engineer queue</strong> for hardware/architecture sign-off.
                    </span>
                  ) : isLocked ? (
                    <span style={{ color: 'var(--text-green)' }}>
                      ✓ Requirement is locked as baseline with Technical Sign-off by <strong>{requirement.sign_off?.tech_lead_approver || 'Lead Systems Engineer'}</strong>. Any edits to the text will demote status back to Provisional PM 🟡.
                    </span>
                  ) : (
                    <span>
                      ⚠️ Unquantified parameters remain (Red 🔴). Click the <strong>red [TBD] chips</strong> or <strong>✎ Edit Statement</strong> above to specify parameters. Saving will queue it as Provisional PM 🟡.
                    </span>
                  )}
                </div>
              </div>

              {!isEditingText && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="notion-btn"
                  style={{ fontSize: '11.5px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                >
                  ✎ Edit Statement
                </button>
              )}
            </div>

            {requirement.sign_off?.signed_off_at && (
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                Sign-off Record: Approver <strong>{requirement.sign_off.tech_lead_approver}</strong> • Rationale: <em>"{requirement.sign_off.hardware_rationale}"</em>
              </div>
            )}
          </div>
        )}

        {userRole === 'systems_engineer' && (
          <div
            style={{
              padding: '12px 14px',
              background: isProv ? 'rgba(217, 119, 6, 0.08)' : isLocked ? 'rgba(34, 197, 94, 0.06)' : 'rgba(235, 87, 87, 0.06)',
              borderRadius: '6px',
              border: `1px solid ${isProv ? 'rgba(217, 119, 6, 0.3)' : isLocked ? 'rgba(34, 197, 94, 0.25)' : 'rgba(235, 87, 87, 0.25)'}`,
              marginBottom: '10px',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              🛠️ Lead Systems Engineer Sign-Off Gate
            </div>

            {isLocked ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-green)' }}>
                  ✓ <strong>Baseline Locked</strong>: Technical sign-off granted by {requirement.sign_off?.tech_lead_approver || 'Lead Systems Engineer'}.
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  Hardware / Architecture Rationale: <em>"{requirement.sign_off?.hardware_rationale || 'Verified against system constraints'}"</em>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleDualKeyAction('provisional_pm')}
                    disabled={isSigning}
                    className="notion-btn"
                    style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--text-muted)' }}
                    title="Demote baseline to Provisional PM if further engineering revision is required"
                  >
                    ↺ Reopen for Review (Demote to Provisional 🟡)
                  </button>
                </div>
              </div>
            ) : isProv ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  PM has provisioned contractual parameters. Verify against hardware timing, memory constraints, and ASIL safety envelopes before locking baseline.
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Hardware / Architecture Sign-Off Rationale *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Validated against CAN-FD bus budget (12.4ms max latency) & ISO 26262 ASIL-D timing envelope"
                    value={hwRationale}
                    onChange={(e) => setHwRationale(e.target.value)}
                    className="input-squircle"
                    style={{ width: '100%', fontSize: '13px', padding: '7px 10px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleDualKeyAction('lock_baseline')}
                    disabled={isSigning || !hwRationale.trim()}
                    className="btn-squircle btn-success"
                    style={{ fontSize: '12px', padding: '6px 16px', fontWeight: '600' }}
                  >
                    {isSigning ? 'Signing Off...' : '✓ Approve & Lock Baseline 🟢'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#ff7b72', lineHeight: '1.45' }}>
                ⚠️ <strong>Sign-off Blocked</strong>: This requirement contains unquantified [TBD] parameters (Red 🔴). The Product Manager must resolve or provision parameters before technical baseline approval can be granted.
              </div>
            )}
          </div>
        )}

        {userRole === 'executive' && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            🎖️ Executive Lens: Read-only governance ledger. Only PM-Approved (🟡) or Locked Baseline (🟢) requirements are presented.
          </div>
        )}
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
            {isRunningAI ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>🔬</div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Extracting Flaws via Llama-3.3-70B on Qualcomm Cloud AI 100...
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Scanning for ambiguities, non-atomic requirements, and unquantified metrics with verbatim evidence grounding
                </div>
              </div>
            ) : !requirement.issues || requirement.issues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No X-Ray flaws detected. Click "🔬 Run X-Ray" above to scan with Llama-3.3-70B.
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
            {isRunningAI ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>⚔️</div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Staging Interpretation Duel on Qualcomm Cloud AI 100...
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Cascading Llama-3.1-8B ➔ Llama-3.3-70B to synthesize competing engineering interpretations & calculate contrast divergence
                </div>
              </div>
            ) : !requirement.duel ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No Interpretation Duel staged yet. Click "⚔️ Interpretation Duel" above.
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
            {isRunningAI ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>✍️</div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Synthesizing Intent-Locked EARS Rewrite on Qualcomm Cloud AI 100...
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Invoking Llama-3.3-70B • Preserving strict [TBD] parameter placeholders • Zero metric fabrication
                </div>
              </div>
            ) : !requirement.rewrite_suggestion ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No Intent-Locked rewrite generated yet. Click "✍️ Intent-Locked Rewrite" above.
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
                  {userRole !== 'executive' && (
                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleApplyRewrite}
                        className="notion-btn notion-btn-primary"
                        style={{ fontSize: '11.5px', padding: '4px 10px', fontWeight: '500' }}
                      >
                        ✓ Apply Proposed EARS Statement
                      </button>
                    </div>
                  )}
                </div>

                {requirement.rewrite_suggestion.identified_tbds?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Smart Suggested Defaults (Click chip to resolve parameter directly in statement):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {requirement.rewrite_suggestion.identified_tbds.map((tbd, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const exactToken = `[TBD: ${tbd.parameter_name}]`;
                            if (requirement.text.includes(exactToken)) {
                              handleResolveTbd(exactToken, tbd.suggested_value, tbd.engineering_rationale);
                            } else {
                              const match = requirement.text.match(/\[TBD:[^\]]+\]/);
                              if (match) {
                                handleResolveTbd(match[0], tbd.suggested_value, tbd.engineering_rationale);
                              } else {
                                handleResolveTbd(`[TBD: ${tbd.parameter_name}]`, tbd.suggested_value, tbd.engineering_rationale);
                              }
                            }
                          }}
                          className="btn-squircle squircle-pill"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            background: 'var(--accent-amber-subtle)',
                            color: 'var(--text-amber)',
                            border: '1px solid var(--accent-amber-border)',
                            cursor: 'pointer',
                          }}
                          title={`Rationale: ${tbd.engineering_rationale || 'Engineering default'}`}
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
            {isRunningAI ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }}>🧪</div>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Synthesizing Verification Blueprint on Qualcomm Cloud AI 100...
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Generating paired nominal/boundary test vectors and falsifiable pass/fail acceptance criteria via Llama-3.3-70B
                </div>
              </div>
            ) : !requirement.verification_plan ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No Verification Blueprint generated yet. Click "🧪 Verification Blueprint" above.
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
