import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Upload, 
  FileText, 
  Sparkles, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Paperclip, 
  FileUp, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  PlusCircle, 
  FileCheck,
  Cpu
} from 'lucide-react';
import StarBorder from './StarBorder';
import { api } from '../services/api';

export default function ChatAndIngestTab({
  project,
  role,
  onRequirementsIngested,
  onSelectRequirement,
  onBackToOverview
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Connected to Qualcomm Cloud AI 100 Copilot for **${project?.project_name || 'Active Workspace'}**.\n\nYou can chat with me in natural language to formulate EARS-compliant requirements, or use the **Document Ingestor** above to upload PDF, TXT, or CSV specifications directly into this workspace.`,
      generatedReqs: null,
      contextGrounding: null
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ingestor State
  const [showIngestor, setShowIngestor] = useState(true);
  const [ingestMode, setIngestMode] = useState('file'); // 'file' | 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [docCategory, setDocCategory] = useState('Functional');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState(null); // { type: 'success' | 'error', message: string, count?: number }

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    'When battery cell temperature exceeds 55°C during DC fast charging, derate current within 250ms.',
    'When CAN bus telemetry heartbeat is lost for more than [TBD: timeout_ms], enter safe derate state.',
    'The BMS shall continuously monitor isolation resistance between high-voltage bus and chassis ground.'
  ];

  // Send Chat Message
  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage(
        text,
        project?.project_id || 'default_project',
        history,
        false, // Don't auto-save; let user click "Add to Workspace"
        role
      );

      const assistantMsg = {
        role: 'assistant',
        content: res.agent_reply || 'Synthesized requirement candidate grounded in project context.',
        generatedReqs: res.generated_requirements || [],
        contextGrounding: res.context_grounding || null
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error contacting Qualcomm Cloud AI 100 Copilot: ${err.message}`,
          generatedReqs: null,
          contextGrounding: null
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Document Ingestion: Extract & Ingest Requirements
  const handleIngestDocument = async (e) => {
    if (e) e.preventDefault();
    if (ingestMode === 'file' && !selectedFile) return;
    if (ingestMode === 'text' && !pastedText.trim()) return;

    setIsIngesting(true);
    setIngestStatus(null);

    try {
      let res;
      const pid = project?.project_id || 'default_project';

      if (ingestMode === 'file') {
        res = await api.parseFile(selectedFile, docCategory, pid, role);
      } else {
        res = await api.parseText(pastedText, docCategory, pid, role);
      }

      const count = res.total_parsed || (res.requirements ? res.requirements.length : 0);
      setIngestStatus({
        type: 'success',
        message: `Successfully extracted and ingested ${count} requirement${count === 1 ? '' : 's'} with Qualcomm AI flaw analysis!`,
        count
      });

      // Notify parent to refresh requirements list in sidebar/store
      if (onRequirementsIngested) {
        onRequirementsIngested(res.requirements || []);
      }

      // Add a notification card to the chat thread
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `📥 **Document Ingestion Completed**: Parsed and enriched **${count} atomic requirements** from \`${selectedFile?.name || 'pasted text'}\` (Category: ${docCategory}). Quality scoring and AI flaw extractions are active.`,
          generatedReqs: res.requirements || [],
          contextGrounding: `Ingested from ${selectedFile?.name || 'Raw Specification Document'}`
        }
      ]);

      // Reset input form
      setSelectedFile(null);
      setPastedText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setIngestStatus({
        type: 'error',
        message: `Ingestion failed: ${err.message}`
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Add individual synthesized requirement from chat into workspace
  const handleAddSynthesizedReq = async (reqItem) => {
    try {
      const pid = project?.project_id || 'default_project';
      // Use parseText with the requirement text to save and score it
      const res = await api.parseText(reqItem.text, reqItem.category || 'Functional', pid, role);
      if (onRequirementsIngested) {
        onRequirementsIngested(res.requirements || []);
      }
      alert(`Requirement added to workspace!`);
    } catch (err) {
      alert(`Could not add requirement: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3mm)', maxWidth: '980px', margin: '0 auto', width: '100%', height: 'calc(100vh - 120px)' }}>
      
      {/* Top Header & Ingestor Bar */}
      <div 
        className="cream-card" 
        style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: '#FFFFFF',
          border: '1px solid #E5E0D5',
          borderRadius: '12px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#181715', color: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileUp size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#181715', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Workspace Document Ingestor</span>
                <span style={{ fontSize: '10.5px', background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                  Active Workspace: {project?.project_name || 'BMS'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#78716C' }}>
                Upload PDF, TXT, CSV specs or paste text to parse atomic requirements with Qualcomm Cloud AI 100.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onBackToOverview && (
              <button
                onClick={onBackToOverview}
                className="btn-subtle-cream"
                style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>← Overview</span>
              </button>
            )}
            <button
              onClick={() => setShowIngestor(!showIngestor)}
              className="btn-subtle-cream"
              style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>{showIngestor ? 'Hide Ingestor' : 'Show Ingestor'}</span>
              {showIngestor ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {/* Collapsible Document Ingestor Controls */}
        {showIngestor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid #F0ECE4' }}>
            {/* Mode & Category Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIngestMode('file')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: ingestMode === 'file' ? '#181715' : '#E5E0D5',
                    backgroundColor: ingestMode === 'file' ? '#181715' : '#FFFFFF',
                    color: ingestMode === 'file' ? '#FAF8F5' : '#57534E',
                    cursor: 'pointer'
                  }}
                >
                  📁 Upload Document File
                </button>
                <button
                  type="button"
                  onClick={() => setIngestMode('text')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: ingestMode === 'text' ? '#181715' : '#E5E0D5',
                    backgroundColor: ingestMode === 'text' ? '#181715' : '#FFFFFF',
                    color: ingestMode === 'text' ? '#FAF8F5' : '#57534E',
                    cursor: 'pointer'
                  }}
                >
                  ✍️ Paste Raw Text
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#78716C', fontWeight: 600 }}>Category:</span>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '5px',
                    border: '1px solid #E5E0D5',
                    backgroundColor: '#FFFFFF',
                    color: '#181715',
                    outline: 'none'
                  }}
                >
                  <option value="Functional">Functional</option>
                  <option value="Safety">System Safety (ISO 26262)</option>
                  <option value="Performance">Performance & Latency</option>
                  <option value="Thermal">Thermal & Environmental</option>
                  <option value="Interface">Interface & Communication</option>
                </select>
              </div>
            </div>

            {/* Input Form based on mode */}
            {ingestMode === 'file' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt,.csv,.pdf,.md"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  style={{
                    fontSize: '11.5px',
                    color: '#57534E',
                    flex: 1,
                    padding: '6px 8px',
                    background: '#FAF8F5',
                    borderRadius: '6px',
                    border: '1px dashed #D6CEBE'
                  }}
                />
                <button
                  type="button"
                  onClick={handleIngestDocument}
                  disabled={!selectedFile || isIngesting}
                  className="btn-subtle-black"
                  style={{ padding: '6px 14px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                >
                  {isIngesting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  <span>{isIngesting ? 'Ingesting...' : 'Ingest & Parse'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  placeholder="Paste multi-line requirements, numbered lists (e.g. 1. The BMS shall...), or raw PRD notes here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '11.5px',
                    borderRadius: '6px',
                    border: '1px solid #E5E0D5',
                    backgroundColor: '#FAF8F5',
                    color: '#181715',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
                <button
                  type="button"
                  onClick={handleIngestDocument}
                  disabled={!pastedText.trim() || isIngesting}
                  className="btn-subtle-black"
                  style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isIngesting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  <span>{isIngesting ? 'Ingesting...' : 'Parse & Ingest Text'}</span>
                </button>
              </div>
            )}

            {/* Ingestion Status Notification */}
            {ingestStatus && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: ingestStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  border: '1px solid',
                  borderColor: ingestStatus.type === 'success' ? '#A7F3D0' : '#FCA5A5',
                  color: ingestStatus.type === 'success' ? '#047857' : '#B91C1C'
                }}
              >
                {ingestStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{ingestStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Messages Log */}
      <div 
        className="cream-card" 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)',
          border: '1px solid #E5E0D5',
          borderRadius: '12px'
        }}
      >
        {messages.map((m, idx) => (
          <div 
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px',
              maxWidth: '85%',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {/* Bubble Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#78716C', padding: '0 4px' }}>
              {m.role === 'user' ? (
                <span>👔 You ({role === 'product_manager' ? 'PM' : 'Systems Lead'})</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#181715' }}>
                  <Cpu size={12} className="text-amber-600" />
                  Qualcomm Cloud AI 100 Copilot
                </span>
              )}
            </div>

            {/* Message Body */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                lineHeight: 1.5,
                background: m.role === 'user' ? '#181715' : '#FFFFFF',
                color: m.role === 'user' ? '#FAF8F5' : '#181715',
                border: m.role === 'user' ? '1px solid #181715' : '1px solid #E5E0D5',
                boxShadow: 'var(--shadow-card)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {m.content}
            </div>

            {/* Generated Requirements Cards */}
            {m.generatedReqs && m.generatedReqs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                {m.generatedReqs.map((req, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #EBE4D8',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#181715' }}>
                          {req.id || `CANDIDATE-${rIdx + 1}`}
                        </span>
                        <span style={{ fontSize: '10px', background: '#F4EFEA', padding: '1px 6px', borderRadius: '4px', color: '#57534E' }}>
                          {req.category || 'Synthesized'}
                        </span>
                        {req.status && (
                          <span className={`badge-status ${req.status === 'FLAGGED_TBD' ? 'badge-tbd' : req.status === 'PROVISIONAL_PM' ? 'badge-provisional' : 'badge-locked'}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {req.status}
                          </span>
                        )}
                      </div>

                      {req.id && onSelectRequirement && (
                        <button
                          onClick={() => onSelectRequirement(req.id)}
                          className="btn-subtle-cream"
                          style={{ padding: '3px 8px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#292524', fontFamily: 'var(--font-mono)', background: '#FAF8F5', padding: '8px 10px', borderRadius: '6px', border: '1px solid #EFEAE2' }}>
                      {req.text}
                    </div>

                    {/* Action button if not yet in store */}
                    {!req.id && (
                      <button
                        onClick={() => handleAddSynthesizedReq(req)}
                        className="btn-subtle-black"
                        style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <PlusCircle size={12} />
                        <span>Add to Workspace Requirements</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8A857C', fontSize: '12px', padding: '8px 4px' }}>
            <Loader2 size={14} className="animate-spin text-amber-600" />
            <span>Qualcomm Cloud AI 100 is formulating formal EARS requirements...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              background: '#FFFFFF',
              border: '1px solid #E5E0D5',
              borderRadius: '6px',
              color: '#57534E',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>✨</span>
            <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div 
        className="cream-card" 
        style={{ 
          padding: '10px 14px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          background: '#FFFFFF',
          border: '1px solid #E5E0D5',
          borderRadius: '10px',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => setShowIngestor(true)}
          className="btn-subtle-cream"
          style={{ padding: '6px 8px' }}
          title="Upload or Ingest Document"
        >
          <Paperclip size={15} />
        </button>

        <input
          type="text"
          placeholder="Ask Copilot or type a plain-language requirement objective... (Press Enter to send)"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '12.5px',
            color: '#181715',
            backgroundColor: 'transparent'
          }}
        />

        <StarBorder
          as="button"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputMessage.trim()}
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
          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          <span>Send</span>
        </StarBorder>
      </div>

    </div>
  );
}
