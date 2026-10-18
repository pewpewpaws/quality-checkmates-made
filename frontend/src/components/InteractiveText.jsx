import React from 'react';
import TbdPopover from './TbdPopover';

/**
 * Parses requirement text and converts [TBD: ...] placeholders into interactive popover chips.
 */
export default function InteractiveText({ text, projectDomain, onAcceptSuggestion, evidenceQuote }) {
  if (!text) return null;

  // Regex to match [TBD: ...] or [TBD]
  const tbdRegex = /(\[TBD(?::\s*[^\]]+)?\])/g;
  const parts = text.split(tbdRegex);

  return (
    <span style={{ lineHeight: '1.6', fontSize: '14.5px', color: '#181715' }}>
      {parts.map((part, index) => {
        if (tbdRegex.test(part)) {
          return (
            <TbdPopover
              key={index}
              tbdString={part}
              projectDomain={projectDomain}
              onAcceptSuggestion={onAcceptSuggestion}
            />
          );
        }

        // If evidenceQuote is present, highlight the exact substring with subtle amber underlay
        if (evidenceQuote && part.includes(evidenceQuote)) {
          const subParts = part.split(evidenceQuote);
          return (
            <React.Fragment key={index}>
              {subParts.map((sub, sIdx) => (
                <React.Fragment key={sIdx}>
                  {sub}
                  {sIdx < subParts.length - 1 && (
                    <mark
                      style={{
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        padding: '1px 3px',
                        borderRadius: '3px',
                        borderBottom: '1.5px solid #F59E0B'
                      }}
                      title={`Flagged Flaw: "${evidenceQuote}"`}
                    >
                      {evidenceQuote}
                    </mark>
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
