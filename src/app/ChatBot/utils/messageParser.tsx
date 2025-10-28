import * as React from 'react';
import { CodeBlock } from '../components';

export interface MessagePart {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

/**
 * Parse message text to identify code blocks in markdown format
 * Supports both ```language and ``` formats
 */
export const parseMessage = (text: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent,
        });
      }
    }

    // Add code block
    const language = match[1] || 'javascript'; // Default to javascript if no language specified
    const code = match[2].trim();
    parts.push({
      type: 'code',
      content: code,
      language,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex).trim();
    if (textContent) {
      parts.push({
        type: 'text',
        content: textContent,
      });
    }
  }

  // If no code blocks were found, return the entire text as a single text part
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: text,
    });
  }

  return parts;
};

/**
 * Render message parts with appropriate formatting
 */
export const renderMessageParts = (text: string): React.ReactNode => {
  const parts = parseMessage(text);

  return parts.map((part, index) => {
    if (part.type === 'code') {
      return (
        <CodeBlock
          key={`code-${index}`}
          code={part.content}
          language={part.language || 'javascript'}
          showLineNumbers={true}
        />
      );
    } else {
      // Render text with basic markdown support
      return (
        <div key={`text-${index}`} style={{ marginBottom: '12px' }}>
          {formatTextWithBasicMarkdown(part.content)}
        </div>
      );
    }
  });
};

/**
 * Format text with basic markdown (bold, italic, inline code)
 */
const formatTextWithBasicMarkdown = (text: string): React.ReactNode => {
  // Split by inline code first (backticks)
  const inlineCodeRegex = /`([^`]+)`/g;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    // Add text before inline code
    if (match.index > lastIndex) {
      const textSegment = text.substring(lastIndex, match.index);
      segments.push(formatBoldItalic(textSegment));
    }

    // Add inline code
    segments.push(
      <code
        key={`inline-${match.index}`}
        style={{
          backgroundColor: '#f3f4f6',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#d97706',
        }}
      >
        {match[1]}
      </code>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push(formatBoldItalic(text.substring(lastIndex)));
  }

  return segments.length > 0 ? segments : formatBoldItalic(text);
};

/**
 * Format bold and italic markdown
 */
const formatBoldItalic = (text: string): React.ReactNode => {
  // Handle **bold**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const parts = text.split(boldRegex);

  return parts.map((part, index) => {
    // Every odd index is bold text (captured group)
    if (index % 2 === 1) {
      return <strong key={`bold-${index}`}>{part}</strong>;
    }

    // Handle *italic* in non-bold text
    const italicRegex = /\*([^*]+)\*/g;
    const italicParts = part.split(italicRegex);

    return italicParts.map((italicPart, italicIndex) => {
      if (italicIndex % 2 === 1) {
        return <em key={`italic-${index}-${italicIndex}`}>{italicPart}</em>;
      }
      return italicPart;
    });
  });
};
