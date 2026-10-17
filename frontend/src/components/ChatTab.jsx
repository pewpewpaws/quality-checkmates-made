import React, { useState } from 'react';
import { sendChatMessage } from '../services/api';

/**
 * ChatTab Component (Antigravity 2.0 Pro Edition)
 * Grounded conversational requirement formulation with muted, pro-grade styling.
 */
export default function ChatTab({ activeProjectId, activeProject, onAdoptRequirement }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Copilot connected to **${activeProject?.project_name || activeProjectId}**. Enter informal desires or system objectives to generate atomic, verifiable EARS requirements with preserved [TBD] parameters.`,
      suggestedReq: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    'When battery cell temperature exceeds 55°C during DC fast charging, derate current and alert driver.',
    'The sensor hub should alert the flight computer if pitch rate is anomalous.',
    'When fluid occlusion pressure exceeds threshold, halt pump flow within 250ms.',
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
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grounded Charter:</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {activeProject?.project_name}
          </span>
        </div>
        <span
          className="badge-chip squircle-xs"
          style={{ fontSize: '11px', padding: '3px 8px', background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}
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
          gap: '10px',
          paddingRight: '4px',
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
              className={`squircle-sm`}
              style={{
                maxWidth: '85%',
                padding: '12px 16px',
                background: msg.sender === 'user' ? '#1c2638' : 'var(--bg-card)',
                border: msg.sender === 'user' ? '1px solid var(--border-medium)' : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                {msg.sender === 'user' ? 'You' : 'Copilot'}
              </div>

              <div style={{ fontSize: '13.5px', lineHeight: '1.55', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {msg.text}
              </div>

              {/* Actionable Requirement Card */}
              {msg.suggestedReq && (
                <div
                  className="squircle-xs"
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                      {msg.suggestedReq.id || 'SUGGESTED-REQ'}
                    </span>
                    <button
                      onClick={() => onAdoptRequirement(msg.suggestedReq)}
                      className="btn-squircle btn-primary-blue"
                      style={{ padding: '4px 10px', fontSize: '11.5px', fontWeight: '500' }}
                    >
                      + Adopt
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '5px', lineHeight: '1.45' }}>
                    "{msg.suggestedReq.text}"
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {msg.suggestedReq.category || 'General'} • {msg.suggestedReq.section || 'General'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', padding: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--accent-blue)',
              }}
            />
            Formulating EARS requirements on Qualcomm AI 100...
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 0 4px' }}>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="btn-squircle btn-secondary"
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              whiteSpace: 'nowrap',
              color: 'var(--text-secondary)',
            }}
          >
            {p.slice(0, 35)}...
          </button>
        ))}
      </div>

      {/* Chat Input Box */}
      <div style={{ display: 'flex', gap: '6px', paddingTop: '4px' }}>
        <input
          type="text"
          placeholder="Type requirement desire in natural language..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="input-squircle"
          style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputMessage.trim()}
          className="btn-squircle btn-primary-blue"
          style={{ padding: '0 14px', opacity: isLoading || !inputMessage.trim() ? 0.6 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
