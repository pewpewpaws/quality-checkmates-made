import React, { useState } from 'react';
import { sendChatMessage } from '../services/api';

/**
 * ChatTab Component
 * Conversational Requirements Copilot grounded in active project architecture documents.
 * Generates strict EARS statements with zero-fabrication [TBD] preservation and 1-click adoption.
 */
export default function ChatTab({ activeProjectId, activeProject, onAdoptRequirement }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello! I am your Requirement Quality Copilot grounded in **${activeProject?.project_name || activeProjectId}**. Type or paste an informal specification, and I will formulate atomic, verifiable EARS requirements with preserved [TBD] tokens.`,
      suggestedReq: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    'When battery cell temperature exceeds 55°C during DC fast charging, derate charging current and broadcast CAN-FD fault.',
    'The sensor hub should quickly alert the flight computer if pitch rate is anomalous.',
    'When fluid occlusion pressure exceeds safe threshold, halt infusion pump flow within 250ms.',
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await sendChatMessage(text, activeProjectId, history, false);

      const assistantMsg = {
        sender: 'assistant',
        text: res.reply || res.explanation || 'Processed requirement statement.',
        suggestedReq: res.requirement,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error contacting Qualcomm AI 100 Copilot: ${err.message}`,
          suggestedReq: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Active Project Banner */}
      <div
        className="glass-card squircle-sm"
        style={{
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>📐</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Grounded in Charter: <strong style={{ color: '#ffffff' }}>{activeProject?.project_name}</strong>
          </span>
        </div>
        <span
          className="badge-chip squircle-xs"
          style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
        >
          EARS Syntax • Zero Fabrication
        </span>
      </div>

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '6px',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              className={`glass-panel ${msg.sender === 'user' ? 'squircle-md' : 'squircle-lg'}`}
              style={{
                maxWidth: '85%',
                padding: '12px 16px',
                background: msg.sender === 'user'
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.45) 0%, rgba(56, 189, 248, 0.25) 100%)'
                  : 'rgba(20, 24, 38, 0.75)',
                border: msg.sender === 'user'
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                {msg.sender === 'user' ? 'Product Manager' : 'Qualcomm AI Copilot'}
              </div>

              <div style={{ fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>

              {/* Actionable Requirement Card */}
              {msg.suggestedReq && (
                <div
                  className="glass-card squircle-sm"
                  style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {msg.suggestedReq.id || 'SUGGESTED-REQ'}
                    </span>
                    <button
                      onClick={() => onAdoptRequirement(msg.suggestedReq)}
                      className="btn-squircle btn-primary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      + Adopt into Project
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffffff', fontStyle: 'italic', marginBottom: '6px' }}>
                    "{msg.suggestedReq.text}"
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    Category: {msg.suggestedReq.category || 'General'} • Section: {msg.suggestedReq.section || 'General'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px', padding: '10px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#38bdf8',
                animation: 'pulse 1.2s infinite',
              }}
            />
            Qualcomm Cloud AI 100 is formulating grounded EARS requirements...
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 0 6px' }}>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="btn-squircle squircle-pill"
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              border: '1px solid var(--border-subtle)',
            }}
          >
            💬 {p.slice(0, 38)}...
          </button>
        ))}
      </div>

      {/* Chat Input Box */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
        <input
          type="text"
          placeholder="State requirement desire in plain English..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="input-squircle"
          style={{ flex: 1, padding: '10px 14px', fontSize: '13px' }}
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputMessage.trim()}
          className="btn-squircle btn-primary"
          style={{ padding: '0 18px', opacity: isLoading || !inputMessage.trim() ? 0.6 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
