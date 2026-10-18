import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Check, 
  Info, 
  ShieldCheck, 
  Loader2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Lock, 
  Scale, 
  CornerDownRight 
} from 'lucide-react';
import { api } from '../services/api';

/**
 * Grammarly-style Interactive Requirement Text Component
 * Highlights defects in red, provisional items in amber, and provides click-to-open inspection popovers.
 */
export default function InteractiveText({ 
  text, 
  requirementId,
  status = 'FLAGGED_TBD',
  signOff = {},
  issues = [],
  identifiedTbds = [],
  qualityScore = null,
  projectDomain = 'Engineering Standard',
  role = 'product_manager',
  onAcceptSuggestion,
  onSignOff
}) {
  const [activeSpanId, setActiveSpanId] = useState(null);
  const containerRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveSpanId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveSpanId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!text) return null;

  // 1. Build all highlighted spans
  const spans = [];
  const claimedIndices = new Set();

  const isOverlap = (start, end) => {
    for (let i = start; i < end; i++) {
      if (claimedIndices.has(i)) return true;
    }
    return false;
  };

  const claimSpan = (start, end) => {
    for (let i = start; i < end; i++) claimedIndices.add(i);
  };

  // A. Match TBD placeholders: [TBD: ...] or [TBD]
  const tbdRegex = /\[TBD(?::\s*[^\]]+)?\]/gi;
  let match;
  while ((match = tbdRegex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (!isOverlap(start, end)) {
      claimSpan(start, end);
      const isProvisional = status === 'PROVISIONAL_PM' || match[0].includes('=');
      const cleanParam = match[0].replace(/^\[TBD:?/, '').replace(/\]$/, '').trim();

      // Find matched TBD default
      const matchedTbd = identifiedTbds.find(t => 
        t.parameter_name?.toLowerCase() === cleanParam.toLowerCase() ||
        cleanParam.toLowerCase().includes(t.parameter_name?.toLowerCase() || '')
      );

      spans.push({
        id: `tbd-${start}`,
        start,
        end,
        text: match[0],
        type: isProvisional ? 'provisional' : 'tbd',
        color: isProvisional ? 'amber' : 'red',
        paramName: cleanParam,
        title: isProvisional ? 'Provisional Parameter' : 'Unbound Parameter Placeholder',
        suggestedValue: matchedTbd?.suggested_value || (isProvisional && signOff?.pm_target_val ? signOff.pm_target_val : null),
        rationale: matchedTbd?.rationale || (isProvisional ? 'Proposed PM parameter awaiting engineering verification.' : 'Contractual limit requires concrete quantifiable threshold.'),
        confidence: matchedTbd?.confidence || 'HIGH'
      });
    }
  }

  // A2. Match explicit provisional PM target parameter in text if status is PROVISIONAL_PM
  if (status === 'PROVISIONAL_PM') {
    let targetSpan = null;
    const rawVal = signOff?.pm_target_val ? signOff.pm_target_val.trim() : '';
    const lowerText = text.toLowerCase();

    // 1. Direct match with rawVal if provided
    if (rawVal) {
      const lowerVal = rawVal.toLowerCase();
      const pos = lowerText.indexOf(lowerVal);
      if (pos !== -1 && !isOverlap(pos, pos + lowerVal.length)) {
        targetSpan = { start: pos, end: pos + lowerVal.length, val: text.slice(pos, pos + lowerVal.length) };
      } else {
        // 2. Token match: extract key informative words from rawVal (e.g., "red" from "i want the toy to be red")
        const stopwords = new Set(['i', 'want', 'the', 'to', 'be', 'a', 'an', 'shall', 'should', 'is', 'it', 'for', 'with', 'that', 'this', 'we', 'need', 'must', 'can', 'our']);
        const tokens = rawVal.toLowerCase().split(/[\s,.;:!?]+/).filter(w => !stopwords.has(w) && w.length >= 2);
        for (const token of tokens) {
          const tPos = lowerText.indexOf(token);
          if (tPos !== -1 && !isOverlap(tPos, tPos + token.length)) {
            targetSpan = { start: tPos, end: tPos + token.length, val: text.slice(tPos, tPos + token.length) };
            break;
          }
        }
      }
    }

    // 3. Fallback: match specific predicate or attribute after "shall be" or "shall" (e.g., "red")
    if (!targetSpan) {
      const shallBeMatch = /\bshall\s+(?:be\s+)?([a-zA-Z0-9_°%#-]+)/i.exec(text);
      if (shallBeMatch && shallBeMatch[1]) {
        const valWord = shallBeMatch[1];
        const valPos = text.toLowerCase().lastIndexOf(valWord.toLowerCase());
        if (valPos !== -1 && !isOverlap(valPos, valPos + valWord.length)) {
          targetSpan = { start: valPos, end: valPos + valWord.length, val: text.slice(valPos, valPos + valWord.length) };
        }
      }
    }

    if (targetSpan) {
      claimSpan(targetSpan.start, targetSpan.end);
      spans.push({
        id: `prov-val-${targetSpan.start}`,
        start: targetSpan.start,
        end: targetSpan.end,
        text: text.slice(targetSpan.start, targetSpan.end),
        type: 'provisional',
        color: 'amber',
        paramName: 'pm_specification',
        title: 'Provisional PM Parameter',
        suggestedValue: targetSpan.val,
        rationale: signOff?.hardware_rationale || `PM proposed concrete parameter '${targetSpan.val}'. Awaiting Lead Systems Engineer baseline approval.`,
        confidence: 'HIGH'
      });
    }
  }

  // Domain-adaptive heuristic for ambiguities and qualitative defects
  const getAmbiguitySuggestedValue = (quote) => {
    const q = (quote || '').toLowerCase().trim();
    if (!q) return null;
    const map = {
      'quickly': '< 250 ms',
      'fast': '< 100 ms',
      'slowly': '> 2000 ms',
      'immediately': 'within 100 ms',
      'instantly': '< 50 ms',
      'minimal power': '<= 15 mW',
      'low power': '<= 25 mW',
      'minimal': '<= 5%',
      'high reliability': '>= 99.99% MTBF',
      'reliable': '>= 99.9% uptime',
      'periodically': 'every 1000 ms',
      'frequently': 'at frequency >= 10 Hz',
      'regularly': 'every 500 ms',
      'normal conditions': '20°C to 25°C, 1 atm',
      'nominal': 'nominal ± 5% tolerance',
      'normal': 'within nominal ± 10%',
      'safe distance': '>= 1.5 meters',
      'safe': 'fail-safe state within 250 ms',
      'excessive': '> 110% rated maximum',
      'critical': 'critical limit threshold',
      'super snappy': '<= 50 ms latency, 60 FPS',
      'snappy': '<= 50 ms latency',
      'responsive': '<= 100 ms response',
      'not laggy': 'frame rate >= 60 FPS',
      'user-friendly': '<= 3 user interactions',
      'securely': 'AES-256-GCM encryption',
      'secure': 'TLS 1.3 with AES-256',
      'where feasible': '[Mandatory compliance: remove escape clause]',
      'as appropriate': '[Specify deterministic trigger criteria]',
      'if possible': '[Unconditional verification obligation]',
      'when needed': '[Define explicit triggering event]'
    };
    for (const [key, val] of Object.entries(map)) {
      if (q.includes(key) || key.includes(q)) return val;
    }
    const clean = q.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    return clean ? `[TBD: ${clean}_limit]` : '<= 100 ms';
  };

  // B. Match Flaw Cards from requirement.issues
  issues.forEach((issue, idx) => {
    const quote = issue.evidence_quote;
    if (quote && quote.trim()) {
      const lowerText = text.toLowerCase();
      const lowerQuote = quote.toLowerCase().trim();
      let pos = 0;
      while ((pos = lowerText.indexOf(lowerQuote, pos)) !== -1) {
        const start = pos;
        const end = start + lowerQuote.length;
        if (!isOverlap(start, end)) {
          claimSpan(start, end);
          const isMinor = issue.severity?.toUpperCase() === 'MINOR';
          const suggestedVal = issue.suggested_value || getAmbiguitySuggestedValue(quote);
          spans.push({
            id: `flaw-${idx}-${start}`,
            start,
            end,
            text: text.slice(start, end),
            type: 'flaw',
            color: isMinor ? 'amber' : 'red',
            paramName: quote,
            title: `${issue.issue_type || 'Defect'} (${issue.severity || 'Major'})`,
            explanation: issue.explanation || 'Requirement statement contains non-verifiable or ambiguous terms.',
            suggestedAction: issue.suggested_action || 'Parameterize with falsifiable numeric metric and boundary tolerance.',
            suggestedValue: suggestedVal,
            rationale: issue.explanation || `Resolved flaw '${quote}'.`,
            confidence: isMinor ? 'MEDIUM' : 'HIGH'
          });
          break; // Match first occurrence per card
        }
        pos += lowerQuote.length;
      }
    }
  });

  // C. Match specific rubric deductions from receipt if not already claimed (e.g. 'quickly', 'normal limits')
  if (qualityScore && qualityScore.receipt) {
    qualityScore.receipt.forEach((line, rIdx) => {
      const quoteMatch = line.match(/'([^']+)'/);
      if (quoteMatch && quoteMatch[1]) {
        const quote = quoteMatch[1];
        const lowerText = text.toLowerCase();
        const lowerQuote = quote.toLowerCase();
        const start = lowerText.indexOf(lowerQuote);
        if (start !== -1) {
          const end = start + lowerQuote.length;
          if (!isOverlap(start, end)) {
            claimSpan(start, end);
            const penaltyMatch = line.match(/\[([A-Za-z]+)\s+([-\d.]+)\s*pts\]/);
            const dimension = penaltyMatch ? penaltyMatch[1] : 'Rubric';
            const penalty = penaltyMatch ? penaltyMatch[2] : '-5.0';
            const suggestedVal = getAmbiguitySuggestedValue(quote);
            spans.push({
              id: `rubric-${rIdx}-${start}`,
              start,
              end,
              text: text.slice(start, end),
              type: 'rubric_flaw',
              color: 'red',
              paramName: quote,
              title: `${dimension} Deduction (${penalty} pts)`,
              explanation: line.replace(/^\[[^\]]+\]\s*/, ''),
              suggestedAction: `Refine '${quote}' with falsifiable quantitative parameters conforming to ISO 29148.`,
              suggestedValue: suggestedVal,
              rationale: `Resolved rubric flaw '${quote}' (${penalty} pts penalty).`,
              confidence: 'MEDIUM'
            });
          }
        }
      }
    });
  }

  // Sort spans strictly by start index
  spans.sort((a, b) => a.start - b.start);

  // 2. Build final segmented DOM
  const elements = [];
  let currentIndex = 0;

  spans.forEach((span) => {
    // Plain text before span
    if (span.start > currentIndex) {
      elements.push(
        <span key={`text-${currentIndex}`}>
          {text.slice(currentIndex, span.start)}
        </span>
      );
    }

    const isActive = activeSpanId === span.id;

    // Render Grammarly-style Interactive Chip
    elements.push(
      <span 
        key={span.id}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            setActiveSpanId(isActive ? null : span.id);
          }}
          className={span.color === 'red' ? 'grammarly-highlight-red' : 'grammarly-highlight-amber'}
          style={{
            backgroundColor: span.color === 'red' ? '#FEF2F2' : '#FFFBEB',
            color: span.color === 'red' ? '#B91C1C' : '#B45309',
            borderBottom: span.color === 'red' ? '2px dashed #EF4444' : '2px dashed #F59E0B',
            padding: '1px 5px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: span.type === 'tbd' || span.type === 'provisional' ? 'var(--font-mono)' : 'inherit',
            fontSize: span.type === 'tbd' || span.type === 'provisional' ? '12.5px' : 'inherit',
            boxShadow: isActive ? (span.color === 'red' ? '0 0 0 2px rgba(239,68,68,0.25)' : '0 0 0 2px rgba(245,158,11,0.25)') : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            margin: '0 2px'
          }}
          title="Click to inspect Grammarly flaw & suggested fix"
        >
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: span.color === 'red' ? '#EF4444' : '#F59E0B',
              display: 'inline-block',
              flexShrink: 0
            }} 
          />
          <span>{span.text}</span>
        </span>

        {/* Click-to-Open Popover Card */}
        {isActive && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '340px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E0D5',
              borderRadius: '10px',
              padding: '12px 14px',
              boxShadow: 'var(--shadow-popover)',
              zIndex: 1000,
              color: '#181715',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              textAlign: 'left',
              lineHeight: 1.4,
              cursor: 'default'
            }}
          >
            {/* Popover Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #F0ECE4', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: span.color === 'red' ? '#B91C1C' : '#B45309' }}>
                {span.color === 'red' ? <AlertTriangle size={13} /> : <Sparkles size={13} />}
                <span>{span.title}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSpanId(null);
                }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: '#8A857C' }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Explanation / Content */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', color: '#78716C', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Flagged Token:
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#181715', fontSize: '12px', background: '#F9F6F0', padding: '3px 6px', borderRadius: '4px', margin: '3px 0' }}>
                {span.text}
              </div>
              <div style={{ fontSize: '11.5px', color: '#44403C', marginTop: '4px' }}>
                {span.explanation || span.rationale}
              </div>
            </div>

            {/* Suggested Default / Action from Qualcomm AI 100 */}
            {(span.suggestedValue || span.suggestedAction) && (
              <div style={{ background: span.color === 'red' ? '#FEF2F2' : '#FFFBEB', border: '1px solid', borderColor: span.color === 'red' ? '#FCA5A5' : '#FDE68A', borderRadius: '6px', padding: '8px 10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: span.color === 'red' ? '#991B1B' : '#92400E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} />
                  <span>AI Recommended Resolution:</span>
                </div>
                {span.suggestedValue && (
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#181715', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {span.suggestedValue}
                  </div>
                )}
                {span.suggestedAction && (
                  <div style={{ fontSize: '11px', color: '#57534E', marginTop: '2px' }}>
                    {span.suggestedAction}
                  </div>
                )}
              </div>
            )}

            {/* Inline Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(span.type === 'tbd' || span.type === 'flaw' || span.type === 'rubric_flaw') && span.suggestedValue && onAcceptSuggestion && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const val = span.suggestedValue || 'Validated limit';
                    const rat = span.rationale || `Grounded in ${projectDomain} specification for '${span.paramName}'.`;
                    onAcceptSuggestion(span.paramName, val, rat);
                    setActiveSpanId(null);
                  }}
                  className="btn-subtle-black"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Sparkles size={12} />
                  <span>Apply Suggested Value to PM Proposal ({span.suggestedValue})</span>
                </button>
              )}

              {span.type === 'provisional' && role === 'systems_engineer' && onSignOff && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSignOff('lock_baseline');
                    setActiveSpanId(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: '#047857',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Lock size={12} />
                  <span>Approve & Lock Baseline</span>
                </button>
              )}

              {span.type === 'provisional' && role !== 'systems_engineer' && (
                <div style={{ fontSize: '11px', color: '#B45309', background: '#FEF3C7', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', fontWeight: 600 }}>
                  Provisional: Switch to Lead Systems Engineer to sign off.
                </div>
              )}
            </div>
          </div>
        )}
      </span>
    );

    currentIndex = span.end;
  });

  // Plain text after last span
  if (currentIndex < text.length) {
    elements.push(
      <span key={`text-${currentIndex}`}>
        {text.slice(currentIndex)}
      </span>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        lineHeight: '1.7', 
        fontSize: '14.5px', 
        color: '#181715',
        position: 'relative'
      }}
    >
      {elements}
    </div>
  );
}
