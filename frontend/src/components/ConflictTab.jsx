import React, { useState } from 'react';
import { detectConflicts, checkSemanticDuplicates } from '../services/api';

/**
 * ConflictTab Component
 * Conflict Radar & Semantic Vector Duplicate Clustering for active project.
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '14px', paddingRight: '4px' }}>
      {/* Banner */}
      <div
        className="glass-card squircle-sm"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '3px solid var(--accent-purple)',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
            Systemic Integrity Radar for: {activeProject?.project_name || activeProjectId}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Qualcomm Cloud AI 100 deep reasoning (Llama-3.3-70B) & Dense Embeddings (bge-large)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleScanConflicts}
            disabled={isScanningConflicts}
            className="btn-squircle btn-primary"
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            {isScanningConflicts ? 'Scanning...' : '📡 Run Conflict Radar'}
          </button>
          <button
            onClick={handleScanDuplicates}
            disabled={isScanningDuplicates}
            className="btn-squircle btn-secondary"
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            {isScanningDuplicates ? 'Scanning...' : '🧬 Vector Duplicate Check'}
          </button>
        </div>
      </div>

      {/* 1. Conflict Radar Results Deck */}
      <div className="glass-panel squircle-md" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
            Contradiction Radar {conflictResult ? `(${conflictResult.total_conflicts_found} detected)` : ''}
          </span>
          {conflictResult && (
            <span
              className={`badge-chip squircle-xs ${conflictResult.total_conflicts_found > 0 ? 'badge-tbd' : 'badge-locked'}`}
            >
              {conflictResult.total_conflicts_found > 0 ? '⚠️ Contradictions Found' : '✓ Clean Specification'}
            </span>
          )}
        </div>

        {!conflictResult ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '12px' }}>
            Click "📡 Run Conflict Radar" above to analyze all statements in {activeProjectId} for timing, resource, or logical clashes.
          </div>
        ) : conflictResult.conflicts?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#34d399', fontSize: '12px' }}>
            ✓ No mutual contradictions or timing mismatches detected across {activeProjectId} requirements!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {conflictResult.conflicts.map((c, i) => (
              <div
                key={i}
                className="glass-card squircle-sm"
                style={{ padding: '12px', borderLeft: '3px solid #ef4444' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge-chip badge-tbd squircle-xs">{c.severity}</span>
                    <strong style={{ fontSize: '12px', color: '#ffffff' }}>{c.conflict_type}</strong>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {c.req_id_a} ⚡ {c.req_id_b}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#ffffff', marginBottom: '4px' }}>
                  <strong>Clash:</strong> {c.explanation}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '6px 0', fontSize: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>{c.req_id_a}:</strong> "{c.conflicting_quote_a}"
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>{c.req_id_b}:</strong> "{c.conflicting_quote_b}"
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>
                  💡 Reconciliation: {c.reconciliation_suggestion}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Semantic Vector Duplicate Results Deck */}
      <div className="glass-panel squircle-md" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
            Semantic Near-Duplicate Clusters {duplicateResult ? `(${duplicateResult.length} matches)` : ''}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            BAAI/bge-large-en-v1.5 (1024-dim Cosine Similarity)
          </span>
        </div>

        {!duplicateResult ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '12px' }}>
            Click "🧬 Vector Duplicate Check" above to compute neural cosine similarity across requirement embeddings.
          </div>
        ) : duplicateResult.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#34d399', fontSize: '12px' }}>
            ✓ No redundant or duplicate requirements found in this project workspace.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {duplicateResult.map((d, i) => (
              <div key={i} className="glass-card squircle-sm" style={{ padding: '12px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    {d.req_id_a} ↔ {d.req_id_b}
                  </span>
                  <span className="badge-chip badge-provisional squircle-xs">
                    {Math.round(d.similarity_score * 100)}% Cosine Match ({d.match_type})
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {d.explanation}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', marginTop: '6px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>{d.req_id_a}:</strong> "{d.text_a}"
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                    <strong style={{ color: '#38bdf8' }}>{d.req_id_b}:</strong> "{d.text_b}"
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
