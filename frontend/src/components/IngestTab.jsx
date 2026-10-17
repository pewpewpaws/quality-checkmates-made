import React, { useState } from 'react';
import { parseText, parseFile } from '../services/api';

/**
 * IngestTab Component
 * Multi-format Document Ingestion & Parser (TXT, CSV, PDF, MD)
 * Extracts numbered lists, REQ tags, and unnumbered paragraphs into atomic statements.
 */
export default function IngestTab({ activeProjectId, activeProject, onIngestRequirements }) {
  const [rawText, setRawText] = useState('');
  const [category, setCategory] = useState('General');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const sampleDatasets = {
    bms: `1. The battery management system shall periodically transmit telemetry data to the central cloud repository as appropriate.
2. The thermal management module should quickly reduce power consumption and warn the driver if temperature is critical.
3. The high-voltage contactor controller shall disconnect the traction battery within 10ms upon detecting an ASIL-D crash trigger.`,
    aero: `REQ-AERO-101: The primary flight control computer shall command elevator pitch trim actuators within [TBD: latency_ms] upon sidestick displacement.
REQ-AERO-102: The stall warning system should activate stick-shaker vibration when angle-of-attack exceeds critical threshold for more than 200ms.
REQ-AERO-103: The triple-redundant autopilot disengage override shall transfer manual authority to pilot controls within 15ms.`,
    med: `1. The infusion controller shall maintain high reliability and shut off pump flow if high pressure is detected.
2. The bolus metering module shall deliver medication within [TBD: bolus_accuracy_pct] of programmed dose.
3. The emergency battery failsafe shall sustain continuous intravenous fluid delivery for at least 120 minutes following AC mains failure.`,
  };

  const handleParseText = async (customText) => {
    const textToUse = customText || rawText;
    if (!textToUse.trim() || isParsing) return;

    setIsParsing(true);
    setParsedResult(null);

    try {
      const res = await parseText(textToUse, category, activeProjectId);
      setParsedResult(res);
    } catch (err) {
      alert(`Parsing failed: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParsedResult(null);

    try {
      const res = await parseFile(file, category, activeProjectId);
      setParsedResult(res);
    } catch (err) {
      alert(`File parse failed: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmIngest = () => {
    if (!parsedResult?.requirements?.length) return;
    onIngestRequirements(parsedResult.requirements);
    setParsedResult(null);
    setRawText('');
    setSelectedFile(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '14px' }}>
      {/* Target Project Scope Callout */}
      <div
        className="glass-card squircle-sm"
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderLeft: '3px solid var(--accent-cyan)',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
            Ingest Documents into: {activeProject?.project_name || activeProjectId}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Parsed statements are isolated strictly to this workspace namespace.
          </div>
        </div>
        <span
          className="badge-chip squircle-xs"
          style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
        >
          EARS Extractor
        </span>
      </div>

      {/* Upload Zone & Quick Preloads */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* File Drag & Drop */}
        <div
          className="glass-panel squircle-md"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: '1px dashed var(--border-glass)',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".txt,.csv,.pdf,.md"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <span style={{ fontSize: '28px', marginBottom: '8px' }}>📂</span>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
            {selectedFile ? selectedFile.name : 'Upload PRD, CSV, TXT, or PDF'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Supports Jira exports, DO-178C specifications, and narrative requirements
          </div>
        </div>

        {/* Quick Preload Templates */}
        <div className="glass-panel squircle-md" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            ⚡ Stage Pitch Quick Preloads
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => {
                setRawText(sampleDatasets.bms);
                setCategory('Automotive BMS');
                handleParseText(sampleDatasets.bms);
              }}
              className="btn-squircle btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            >
              🔋 Preload 800V Powertrain & BMS Statements
            </button>
            <button
              onClick={() => {
                setRawText(sampleDatasets.aero);
                setCategory('Flight Control');
                handleParseText(sampleDatasets.aero);
              }}
              className="btn-squircle btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            >
              ✈️ Preload Aerospace Fly-By-Wire Spec
            </button>
            <button
              onClick={() => {
                setRawText(sampleDatasets.med);
                setCategory('Medical Devices');
                handleParseText(sampleDatasets.med);
              }}
              className="btn-squircle btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: '11px' }}
            >
              💉 Preload Precision Infusion Pump Spec
            </button>
          </div>
        </div>
      </div>

      {/* Direct Text Paste Area */}
      <div className="glass-panel squircle-md" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff' }}>
            Raw Unstructured Requirements Text
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Default Category:</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-squircle"
              style={{ padding: '3px 8px', fontSize: '11px', width: '130px' }}
            />
          </div>
        </div>

        <textarea
          placeholder="Paste requirements, numbered lists, user stories, or unformatted text..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="input-squircle"
          style={{ width: '100%', height: '110px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => handleParseText()}
            disabled={isParsing || !rawText.trim()}
            className="btn-squircle btn-primary"
            style={{ opacity: isParsing || !rawText.trim() ? 0.6 : 1 }}
          >
            {isParsing ? 'Parsing...' : 'Analyze & Extract Requirements'}
          </button>
        </div>
      </div>

      {/* Parsing Preview Deck */}
      {parsedResult && (
        <div className="glass-panel squircle-md" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                Extraction Preview: {parsedResult.total_parsed} Requirements Found
              </span>
              <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Format: <strong style={{ color: '#38bdf8' }}>{parsedResult.format_detected}</strong>
              </span>
            </div>

            <button
              onClick={handleConfirmIngest}
              className="btn-squircle btn-success"
              style={{ padding: '6px 14px' }}
            >
              ✓ Ingest All to {activeProjectId}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {parsedResult.requirements.map((req, idx) => (
              <div
                key={idx}
                className="glass-card squircle-sm"
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {req.id}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {req.category || 'General'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {req.text}
                  </div>
                </div>

                <span className="badge-chip badge-tbd squircle-xs" style={{ whiteSpace: 'nowrap' }}>
                  🔴 FLAGGED_TBD
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
