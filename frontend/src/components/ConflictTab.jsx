import React, { useState } from 'react';
import { detectConflicts, checkSemanticDuplicates } from '../services/api';

/**
 * ConflictTab Component (Antigravity 2.0 Pro Edition)
 * Contradiction Radar & Semantic Vector Duplicate Clustering with muted aesthetics.
 */
export default function ConflictTab({ activeProjectId, activeProject }) {
  const [isScanningConflicts, setIsScanningConflicts] = useState(false);
  const [conflictResult, setConflictResult] = useState(null);

  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);

  const handleScanConflicts = async () => {
    setIsScanningConflicts(true);
    try {
      const res = await detectConflicts(activeProjectId);
      setConflictResult(res);
    } catch (err) {
      alert(`Conflict Radar scan failed: ${err.message}`);
    } finally {
      setIsScanningConflicts(false);
    }
  };

  const handleScanDuplicates = async () => {
    setIsScanningDuplicates(true);
    try {
      const res = await checkSemanticDuplicates(activeProjectId);
      setDuplicateResult(res);
    } catch (err) {
      alert(`Semantic Duplicate scan failed: ${err.message}`);
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '10px', paddingRight: '4px' }}>
      {/* Banner */}
      <div
        className="glass-card squircle-sm"
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Systemic Integrity Radar: {activeProject?.project_name || activeProjectId}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Qualcomm Cloud AI 100 deep reasoning (Llama-3.3-70B) & Dense Embeddings (bge-large)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleScanConflicts}
            disabled={isScanningConflicts}
            className="btn-squircle btn-primary-blue"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {isScanningConflicts ? 'Scanning...' : 'Run Conflict Radar'}
          </button>
          <button
            onClick={handleScanDuplicates}
            disabled={isScanningDuplicates}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {isScanningDuplicates ? 'Scanning...' : 'Vector Duplicates'}
          </button>
        </div>
      </div>

      {/* 1. Conflict Radar Results Deck */}
      <div className="glass-panel squircle-sm" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Contradiction Radar {conflictResult ? `(${conflictResult.total_conflicts_found} detected)` : ''}
          </span>
          {conflictResult && (
            <span
              className={`badge-chip squircle-xs ${conflictResult.total_conflicts_found > 0 ? 'badge-tbd' : 'badge-locked'}`}
              style={{ fontSize: '10px' }}
            >
              {conflictResult.total_conflicts_found > 0 ? 'Contradictions Found' : 'Clean Specification'}
            </span>
          )}
        </div>

        {!conflictResult ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '11px' }}>
            Click "Run Conflict Radar" above to analyze all statements in {activeProjectId} for timing, resource, or operational clashes.
          </div>
        ) : conflictResult.conflicts?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-green)', fontSize: '11px' }}>
            ✓ No mutual contradictions or timing mismatches detected across {activeProjectId} requirements.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conflictResult.conflicts.map((c, i) => (
              <div
                key={i}
                className="glass-card squircle-xs"
                style={{ padding: '10px', borderLeft: '2px solid var(--accent-red)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge-chip badge-tbd squircle-xs" style={{ fontSize: '9px' }}>{c.severity}</span>
                    <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{c.conflict_type}</strong>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
                    {c.req_id_a} ⚡ {c.req_id_b}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  <strong>Clash:</strong> {c.explanation}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '4px 0', fontSize: '10px' }}>
                  <div style={{ background: 'var(--bg-app)', padding: '5px 8px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--accent-blue)' }}>{c.req_id_a}:</strong> "{c.conflicting_quote_a}"
                  </div>
                  <div style={{ background: 'var(--bg-app)', padding: '5px 8px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--accent-blue)' }}>{c.req_id_b}:</strong> "{c.conflicting_quote_b}"
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-green)', marginTop: '3px' }}>
                  Reconciliation: {c.reconciliation_suggestion}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Semantic Vector Duplicate Results Deck */}
      <div className="glass-panel squircle-sm" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Semantic Near-Duplicate Clusters {duplicateResult ? `(${duplicateResult.length} matches)` : ''}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            BAAI/bge-large-en-v1.5 (1024-dim Cosine Similarity)
          </span>
        </div>

        {!duplicateResult ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '11px' }}>
            Click "Vector Duplicates" above to compute neural cosine similarity across requirement embeddings.
          </div>
        ) : duplicateResult.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text-green)', fontSize: '11px' }}>
            ✓ No redundant or duplicate requirements found in this project workspace.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {duplicateResult.map((d, i) => (
              <div key={i} className="glass-card squircle-xs" style={{ padding: '10px', borderLeft: '2px solid var(--accent-amber)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {d.req_id_a} ↔ {d.req_id_b}
                  </span>
                  <span className="badge-chip badge-provisional squircle-xs" style={{ fontSize: '9px' }}>
                    {Math.round(d.similarity_score * 100)}% Cosine Match ({d.match_type})
                  </span>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {d.explanation}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginTop: '4px' }}>
                  <div style={{ background: 'var(--bg-app)', padding: '5px 8px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--accent-blue)' }}>{d.req_id_a}:</strong> "{d.text_a}"
                  </div>
                  <div style={{ background: 'var(--bg-app)', padding: '5px 8px', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--accent-blue)' }}>{d.req_id_b}:</strong> "{d.text_b}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
