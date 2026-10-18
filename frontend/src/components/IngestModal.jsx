import React, { useState } from 'react';
import { X, Upload, FileText, Sparkles, Check } from 'lucide-react';
import { api } from '../services/api';

export default function IngestModal({ 
  isOpen, 
  onClose, 
  projectId, 
  role, 
  onIngestSuccess 
}) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Safety Critical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleParse = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.parseText(text, category, projectId, role);
      if (onIngestSuccess) {
        onIngestSuccess(res.requirements);
      }
      onClose();
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to parse text document.');
    } finally {
      setLoading(false);
    }
  };

  const sampleSpecs = [
    {
      label: 'Sample BMS Telemetry',
      text: `REQ-BMS-101: The battery controller shall periodically transmit cell voltages to the BMS master.\nREQ-BMS-102: The thermal protection circuit must quickly shut down contactors if critical heat is reached.`
    },
    {
      label: 'Sample Avionics Slew',
      text: `REQ-AERO-201: The pitch trim motor shall slew within [TBD: latency_ms] after stick deflection.\nREQ-AERO-202: The flight management computer should maintain stable glidepath under turbulent conditions.`
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(24, 23, 21, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="cream-card"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: 'var(--shadow-popover)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-3mm)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0ECE4', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} className="text-stone-800" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#181715' }}>
              Ingest Specification Document
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#8A857C' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
            {error}
          </div>
        )}

        {/* Quick Samples */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#8A857C', fontWeight: 600, textTransform: 'uppercase' }}>
            Quick Insert:
          </span>
          {sampleSpecs.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(s.text)}
              className="btn-subtle-cream"
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleParse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#55524B', marginBottom: '4px', textTransform: 'uppercase' }}>
              Category Tag
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Flight Dynamics, Battery Safety, Occlusion Control"
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
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
              Requirements Text (Numbered lists, REQ tags, or raw text)
            </label>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="REQ-001: The system shall..."
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid #E5E0D5',
                backgroundColor: '#FAF8F5',
                outline: 'none',
                color: '#181715',
                fontFamily: 'var(--font-mono)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #F0ECE4', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-subtle-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="btn-subtle-black"
            >
              <Sparkles size={14} />
              <span>{loading ? 'Auditing on Qualcomm AI 100...' : 'Parse & Audit Requirements'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
