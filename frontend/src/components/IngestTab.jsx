import React, { useState } from 'react';
import { parseText, parseFile } from '../services/api';

/**
 * IngestTab Component (Antigravity 2.0 Pro Edition)
 * Multi-format Document Ingestion & Parser with muted pro aesthetics.
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '10px' }}>
      {/* Target Project Callout */}
      <div
        className="glass-card squircle-sm"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Target: {activeProject?.project_name || activeProjectId}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Parsed statements are isolated to this workspace namespace.
          </div>
        </div>
        <span
          className="badge-chip squircle-xs"
          style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', fontSize: '11px', padding: '3px 8px' }}
        >
          EARS Extractor
        </span>
      </div>

      {/* Upload Zone & Quick Preloads */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* File Drag & Drop */}
        <div
          className="glass-panel squircle-sm"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: '1px dashed var(--border-medium)',
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
          <span style={{ fontSize: '24px', marginBottom: '6px', opacity: 0.85 }}>📂</span>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {selectedFile ? selectedFile.name : 'Upload PRD, CSV, TXT, or PDF'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Supports Jira exports, DO-178C specifications, and narrative requirements
          </div>
        </div>

        {/* Quick Preload Templates */}
        <div className="glass-panel squircle-sm" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Preload Sample Specifications
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => {
                setRawText(sampleDatasets.bms);
                setCategory('Automotive BMS');
                handleParseText(sampleDatasets.bms);
              }}
              className="btn-squircle btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: '11px' }}
            >
              800V Powertrain & BMS Statements
            </button>
            <button
              onClick={() => {
                setRawText(sampleDatasets.aero);
                setCategory('Flight Control');
                handleParseText(sampleDatasets.aero);
              }}
              className="btn-squircle btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: '11px' }}
            >
              Aerospace Fly-By-Wire Spec
            </button>
            <button
              onClick={() => {
                setRawText(sampleDatasets.med);
                setCategory('Medical Devices');
                handleParseText(sampleDatasets.med);
              }}
              className="btn-squircle btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: '11px' }}
            >
              Precision Infusion Pump Spec
            </button>
          </div>
        </div>
      </div>

      {/* Direct Text Paste Area */}
      <div className="glass-panel squircle-sm" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Raw Requirements Text
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Default Category:</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-squircle"
              style={{ padding: '4px 8px', fontSize: '12px', width: '140px' }}
            />
          </div>
        </div>

        <textarea
          placeholder="Paste requirements, numbered lists, user stories, or unformatted text..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="input-squircle"
          style={{ width: '100%', height: '100px', resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.45' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => handleParseText()}
            disabled={isParsing || !rawText.trim()}
            className="btn-squircle btn-primary-blue"
            style={{ fontSize: '12px', padding: '6px 14px', fontWeight: '500', opacity: isParsing || !rawText.trim() ? 0.6 : 1 }}
          >
            {isParsing ? 'Parsing...' : 'Extract Statements'}
          </button>
        </div>
      </div>

      {/* Parsing Preview Deck */}
      {parsedResult && (
        <div className="glass-panel squircle-sm" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Extracted: {parsedResult.total_parsed} statements
              </span>
              <span style={{ marginLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                format: <strong style={{ color: 'var(--accent-blue)' }}>{parsedResult.format_detected}</strong>
              </span>
            </div>

            <button
              onClick={handleConfirmIngest}
              className="btn-squircle btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '500' }}
            >
              ✓ Ingest into {activeProjectId}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {parsedResult.requirements.map((req, idx) => (
              <div
                key={idx}
                className="glass-card squircle-xs"
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                      {req.id}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {req.category || 'General'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {req.text}
                  </div>
                </div>

                <span className="badge-chip badge-tbd squircle-xs" style={{ whiteSpace: 'nowrap', fontSize: '10.5px' }}>
                  FLAGGED TBD
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
