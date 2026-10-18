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
  ArrowRight, 
  PlusCircle, 
  FileCheck,
  Cpu,
  X,
  FileSpreadsheet
} from 'lucide-react';
import StarBorder from './StarBorder';
import { api } from '../services/api';

export default function ChatAndIngestTab({
  project,
  role,
  chatMessages = null,
  onUpdateChatMessages,
  onClearChat,
  onRequirementsIngested,
  onSelectRequirement,
  onBackToOverview
}) {
  const getDefaultWelcome = () => ({
    role: 'assistant',
    content: `👋 Connected to Qualcomm Cloud AI 100 Copilot for **${project?.project_name || 'Active Workspace'}**.\n\nType a plain-language requirement objective below, or click the **📎 paperclip** (or drag & drop a PDF/TXT/CSV file) to ingest specifications directly into this workspace.`,
    generatedReqs: null,
    contextGrounding: null
  });

  const [messages, setMessages] = useState(() => {
    return chatMessages && chatMessages.length > 0 ? chatMessages : [getDefaultWelcome()];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync when workspace project changes
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      setMessages(chatMessages);
    } else {
      setMessages([getDefaultWelcome()]);
    }
  }, [project?.project_id]);

  const updateAndNotifyMessages = (updater) => {
    setMessages(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onUpdateChatMessages) {
        onUpdateChatMessages(next);
      }
      return next;
    });
  };

  // Attached File State for the Input Bar
  const [attachedFile, setAttachedFile] = useState(null); // File object
  const [docCategory, setDocCategory] = useState('Functional');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Dynamic domain-adaptive starter prompts
  const getDomainPrompts = () => {
    const domain = (project?.domain || '').toLowerCase();
    const name = (project?.project_name || '').toLowerCase();
    const combined = `${domain} ${name}`;

    if (combined.includes('toy') || combined.includes('kid') || combined.includes('consumer')) {
      return [
        'The product shall have a unit Bill of Materials (BOM) cost not exceeding [TBD: max_bom_usd].',
        'When dropped from [TBD: drop_height_meters], the toy enclosure shall remain intact with no sharp edges.',
        'Audio speech synthesis latency shall not exceed [TBD: speech_latency_ms] after button press.'
      ];
    }
    if (combined.includes('bms') || combined.includes('battery') || combined.includes('automotive') || combined.includes('ev')) {
      return [
        'When battery cell temperature exceeds 55°C during DC fast charging, derate current within 250ms.',
        'When CAN bus telemetry heartbeat is lost for more than [TBD: timeout_ms], enter safe derate state.',
        'The BMS shall continuously monitor isolation resistance between high-voltage bus and chassis ground.'
      ];
    }
    if (combined.includes('med') || combined.includes('health') || combined.includes('pump')) {
      return [
        'When fluid occlusion pressure exceeds threshold, halt pump flow within 250ms and sound alarm.',
        'Bolus delivery accuracy shall remain within [TBD: volume_tolerance_percent] across full flow range.',
        'Audible clinical alarm sound pressure shall exceed [TBD: min_alarm_spl_db] at 1 meter distance.'
      ];
    }
    if (combined.includes('fleet') || combined.includes('telematics') || combined.includes('iot')) {
      return [
        'Vehicle telematics gateway shall buffer CAN frames locally during cellular disconnection.',
        'All telemetry dispatched over LTE shall be encrypted using AES-256 with key rotation.',
        'When cellular connection restores, queued telemetry shall flush within [TBD: flush_window_sec].'
      ];
    }
    return [
      'When anomalous operating conditions occur, the system shall transition to safe state within [TBD: max_latency_ms].',
      'The controller shall record all state transitions to persistent non-volatile memory.',
      'Operational command verification shall reject unauthorized packets and increment fault telemetry.'
    ];
  };

  const quickPrompts = getDomainPrompts();

  // Send Message or Ingest Attached File
  const handleSend = async (textToSend = null) => {
    const text = textToSend !== null ? textToSend : inputMessage;
    const fileToIngest = attachedFile;

    if (!text.trim() && !fileToIngest) return;
    if (isLoading) return;

    // Reset input states
    setInputMessage('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    const pid = project?.project_id || 'default_project';

    // CASE 1: Document File Ingestion via Chat Bar
    if (fileToIngest) {
      const userMsg = {
        role: 'user',
        content: `📎 Ingesting specification document: **${fileToIngest.name}** (${(fileToIngest.size / 1024).toFixed(1)} KB)${text.trim() ? `\n\n${text}` : ''}`,
        fileAttached: fileToIngest.name
      };
      updateAndNotifyMessages(prev => [...prev, userMsg]);

      try {
        const parseRes = await api.parseFile(fileToIngest, docCategory, pid, role);
        const count = parseRes.total_parsed || (parseRes.requirements ? parseRes.requirements.length : 0);

        if (onRequirementsIngested) {
          onRequirementsIngested(parseRes.requirements || []);
        }

        const assistantMsg = {
          role: 'assistant',
          content: `📥 **Document Ingestion Completed**: Parsed and enriched **${count} atomic requirements** from \`${fileToIngest.name}\` (Category: ${docCategory}).\n\nAutomatic Qualcomm AI 100 flaw extraction and 100-point deterministic rubric scoring have been applied.`,
          generatedReqs: parseRes.requirements || [],
          contextGrounding: `Ingested from ${fileToIngest.name}`
        };
        updateAndNotifyMessages(prev => [...prev, assistantMsg]);
      } catch (err) {
        updateAndNotifyMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Ingestion failed: ${err.message}`,
            generatedReqs: null,
            contextGrounding: null
          }
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // CASE 2: Conversational Prompt Formulation
    const userMsg = { role: 'user', content: text };
    updateAndNotifyMessages(prev => [...prev, userMsg]);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage(
        text,
        pid,
        history,
        false,
        role
      );

      const assistantMsg = {
        role: 'assistant',
        content: res.agent_reply || 'Synthesized requirement candidate grounded in project context.',
        generatedReqs: res.generated_requirements || [],
        contextGrounding: res.context_grounding || null
      };

      updateAndNotifyMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      updateAndNotifyMessages(prev => [
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

  // Add individual synthesized requirement from chat into workspace (Keep action)
  const handleKeepCandidate = async (reqItem, msgIdx, reqIdx) => {
    try {
      const pid = project?.project_id || 'default_project';
      const payload = {
        id: reqItem.id && !reqItem.id.startsWith('CANDIDATE-') && !reqItem.id.startsWith('REQ-CHAT-') ? reqItem.id : undefined,
        text: reqItem.text,
        category: reqItem.category || 'Functional',
        section: reqItem.section || 'Chat Ingestion',
        status: reqItem.status || 'PROVISIONAL_PM',
        project_id: pid,
        sign_off: reqItem.sign_off || {
          pm_author: 'Product Manager',
          pm_target_val: reqItem.sign_off?.pm_target_val || 'red',
          state: reqItem.status || 'PROVISIONAL_PM'
        },
        rewrite_suggestion: reqItem.rewrite_suggestion || null,
        quality_score: reqItem.quality_score || null,
        issues: reqItem.issues || []
      };

      const created = await api.createRequirement(payload, role);
      if (onRequirementsIngested) {
        onRequirementsIngested([created]);
      }

      // Mark candidate card as KEPT with persistent ID in message stream
      updateAndNotifyMessages(prev => {
        const next = [...prev];
        if (next[msgIdx] && next[msgIdx].generatedReqs && next[msgIdx].generatedReqs[reqIdx]) {
          const reqsCopy = [...next[msgIdx].generatedReqs];
          reqsCopy[reqIdx] = {
            ...reqsCopy[reqIdx],
            actionStatus: 'KEPT',
            savedReqId: created.id,
            id: created.id,
            status: created.status
          };
          next[msgIdx] = { ...next[msgIdx], generatedReqs: reqsCopy };
        }
        return next;
      });
    } catch (err) {
      alert(`Could not add requirement: ${err.message}`);
    }
  };

  // Reject candidate requirement
  const handleRejectCandidate = (msgIdx, reqIdx) => {
    updateAndNotifyMessages(prev => {
      const next = [...prev];
      if (next[msgIdx] && next[msgIdx].generatedReqs && next[msgIdx].generatedReqs[reqIdx]) {
        const reqsCopy = [...next[msgIdx].generatedReqs];
        reqsCopy[reqIdx] = {
          ...reqsCopy[reqIdx],
          actionStatus: 'REJECTED'
        };
        next[msgIdx] = { ...next[msgIdx], generatedReqs: reqsCopy };
      }
      return next;
    });
  };

  // Undo reject candidate requirement
  const handleUndoRejectCandidate = (msgIdx, reqIdx) => {
    updateAndNotifyMessages(prev => {
      const next = [...prev];
      if (next[msgIdx] && next[msgIdx].generatedReqs && next[msgIdx].generatedReqs[reqIdx]) {
        const reqsCopy = [...next[msgIdx].generatedReqs];
        reqsCopy[reqIdx] = {
          ...reqsCopy[reqIdx],
          actionStatus: null
        };
        next[msgIdx] = { ...next[msgIdx], generatedReqs: reqsCopy };
      }
      return next;
    });
  };

  // Clear entire chat history for this workspace
  const handleClearSession = () => {
    if (window.confirm('Clear conversation history for this workspace?')) {
      if (onClearChat) {
        onClearChat();
      }
      setMessages([getDefaultWelcome()]);
    }
  };

  // Drag & drop handlers for full-canvas document ingestion
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        maxWidth: '980px', 
        margin: '0 auto', 
        width: '100%', 
        height: 'calc(100vh - 128px)',
        position: 'relative'
      }}
    >
      {/* Full-canvas Drag & Drop Overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            border: '2px dashed #B45309',
            borderRadius: '12px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#B45309'
          }}
        >
          <FileUp size={36} className="animate-bounce" />
          <div style={{ fontSize: '16px', fontWeight: 700 }}>
            Drop specification file to ingest
          </div>
          <div style={{ fontSize: '12px', color: '#78716C' }}>
            Supports PDF, TXT, CSV, or Markdown specifications
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Status Strip */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '6px 4px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#181715' }}>
            <Cpu size={14} className="text-amber-600" />
            <span>Qualcomm Cloud AI 100 Copilot</span>
          </div>
          <span style={{ fontSize: '10.5px', background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
            {project?.project_name || 'Active Workspace'}
          </span>
          <span style={{ fontSize: '11px', color: '#78716C' }}>
            ({project?.domain || 'Systems Engineering'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {messages.length > 1 && (
            <button
              onClick={handleClearSession}
              className="btn-subtle-cream"
              title="Clear conversation history for this workspace"
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#78716C' }}
            >
              <span>🧹 Clear Chat</span>
            </button>
          )}

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="btn-subtle-cream"
              style={{ padding: '4px 10px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>← Back to Overview</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Messages Stream */}
      <div 
        className="cream-card" 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: '#FFFFFF',
          border: '1px solid #E5E0D5',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
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
            {/* Sender Tag */}
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

            {/* Bubble Container */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                lineHeight: 1.5,
                background: m.role === 'user' ? '#181715' : '#FAF8F5',
                color: m.role === 'user' ? '#FAF8F5' : '#181715',
                border: m.role === 'user' ? '1px solid #181715' : '1px solid #EBE4D8',
                boxShadow: 'var(--shadow-card)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {m.content}
            </div>

            {/* Generated Requirement Cards */}
            {m.generatedReqs && m.generatedReqs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                {m.generatedReqs.map((req, rIdx) => {
                  const isKept = req.actionStatus === 'KEPT';
                  const isRejected = req.actionStatus === 'REJECTED';

                  return (
                    <div
                      key={rIdx}
                      style={{
                        background: isRejected ? '#FBF9F7' : isKept ? '#F0FDF4' : '#FFFFFF',
                        border: '1px solid',
                        borderColor: isRejected ? '#E7E0D8' : isKept ? '#86EFAC' : '#EBE4D8',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        opacity: isRejected ? 0.65 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
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

                        {/* PM Governance Decision Controls: Keep vs Reject */}
                        {isKept ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              color: '#047857', 
                              background: '#D1FAE5', 
                              padding: '3px 8px', 
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={12} />
                              <span>✓ In Workspace ({req.savedReqId || req.id})</span>
                            </span>
                            {onSelectRequirement && (
                              <button
                                onClick={() => onSelectRequirement(req.savedReqId || req.id)}
                                className="btn-subtle-cream"
                                style={{ padding: '3px 8px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <span>Inspect</span>
                                <ArrowRight size={11} />
                              </button>
                            )}
                          </div>
                        ) : isRejected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              color: '#991B1B', 
                              background: '#FEE2E2', 
                              padding: '3px 8px', 
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <X size={12} />
                              <span>✕ Rejected by PM</span>
                            </span>
                            <button
                              onClick={() => handleUndoRejectCandidate(idx, rIdx)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#78716C', 
                                textDecoration: 'underline', 
                                fontSize: '10.5px', 
                                cursor: 'pointer',
                                padding: '2px 4px'
                              }}
                            >
                              Undo
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleRejectCandidate(idx, rIdx)}
                              title="Reject candidate requirement"
                              style={{
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '5px',
                                border: '1px solid #FECACA',
                                background: '#FFF1F2',
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <X size={11} />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() => handleKeepCandidate(req, idx, rIdx)}
                              title="Keep and add as formal requirement into workspace"
                              style={{
                                padding: '3px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '5px',
                                border: '1px solid #181715',
                                background: '#181715',
                                color: '#FAF8F5',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <CheckCircle2 size={11} className="text-emerald-400" />
                              <span>Keep (Add to Workspace)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ 
                        fontSize: '12px', 
                        color: isRejected ? '#78716C' : '#292524', 
                        fontFamily: 'var(--font-mono)', 
                        background: isRejected ? '#F5F1EB' : '#FAF8F5', 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #EFEAE2',
                        textDecoration: isRejected ? 'line-through' : 'none'
                      }}>
                        {req.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Real-time Qualcomm AI Loading State with animated shimmer */}
        {isLoading && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: '#FAF8F5',
              border: '1px solid #EBE4D8',
              borderRadius: '8px',
              padding: '10px 14px',
              maxWidth: '420px',
              color: '#181715', 
              fontSize: '12px' 
            }}
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#181715', color: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={14} className="text-amber-400 animate-spin" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 600 }}>Qualcomm Cloud AI 100</span>
              <span style={{ fontSize: '11px', color: '#78716C' }}>Synthesizing requirements with Llama-3.3-70B...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Domain-Adaptive Starter Prompts */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              background: '#FFFFFF',
              border: '1px solid #E5E0D5',
              borderRadius: '6px',
              color: '#57534E',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#181715';
              e.currentTarget.style.color = '#181715';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E0D5';
              e.currentTarget.style.color = '#57534E';
            }}
          >
            <span>✨</span>
            <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p}</span>
          </button>
        ))}
      </div>

      {/* Unified Chat & Ingestion Input Bar */}
      <div 
        className="cream-card" 
        style={{ 
          padding: '10px 14px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '8px',
          background: '#FFFFFF',
          border: '1px solid #E5E0D5',
          borderRadius: '12px',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        {/* Attached Document Ingestion Chip (if a file is selected) */}
        {attachedFile && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: '#FAF8F5',
              border: '1px solid #E5E0D5',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11.5px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px' }}>📄</span>
              <span style={{ fontWeight: 600, color: '#181715' }}>{attachedFile.name}</span>
              <span style={{ color: '#78716C', fontSize: '10.5px' }}>({(attachedFile.size / 1024).toFixed(1)} KB)</span>
              
              {/* Category Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                <span style={{ color: '#78716C', fontSize: '10.5px' }}>Category:</span>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '10.5px',
                    borderRadius: '4px',
                    border: '1px solid #D6CEBE',
                    background: '#FFFFFF',
                    color: '#181715',
                    outline: 'none'
                  }}
                >
                  <option value="Functional">Functional</option>
                  <option value="Safety">Safety Critical</option>
                  <option value="Performance">Performance</option>
                  <option value="Thermal">Thermal</option>
                  <option value="Interface">Interface</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setAttachedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', color: '#8A857C' }}
              title="Remove file"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input Text Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.csv,.pdf,.md"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAttachedFile(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-subtle-cream"
            style={{ 
              padding: '6px 8px',
              backgroundColor: attachedFile ? '#181715' : 'transparent',
              color: attachedFile ? '#FAF8F5' : '#57534E',
              borderColor: attachedFile ? '#181715' : '#E5E0D5'
            }}
            title="Attach Specification Document (PDF, TXT, CSV)"
          >
            <Paperclip size={15} />
          </button>

          <input
            type="text"
            placeholder={attachedFile ? "Add instruction (optional) and press Ingest Specs..." : "Ask Copilot or type a requirement... (or attach PDF/TXT/CSV)"}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
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
            onClick={() => handleSend()}
            disabled={isLoading || (!inputMessage.trim() && !attachedFile)}
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
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : attachedFile ? (
              <Upload size={13} />
            ) : (
              <Send size={13} />
            )}
            <span>{isLoading ? 'Processing...' : attachedFile ? 'Ingest Specs' : 'Send'}</span>
          </StarBorder>
        </div>
      </div>

    </div>
  );
}
