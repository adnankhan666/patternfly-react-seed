import * as React from 'react';
import Prism from 'prismjs';
// Import Prism CSS theme
// Note: CSS is loaded via webpack config in production
// import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import { Button } from '@patternfly/react-core';
import { CopyIcon, CheckIcon } from '@patternfly/react-icons';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FunctionComponent<CodeBlockProps> = React.memo(({
  code,
  language = 'javascript',
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = React.useState(false);
  const codeRef = React.useRef<HTMLElement>(null);

  // Highlight code on mount and when code/language changes
  React.useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // Copy code to clipboard
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [code]);

  // Get language display name
  const getLanguageDisplayName = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'JavaScript',
      ts: 'TypeScript',
      tsx: 'TypeScript',
      py: 'Python',
      python: 'Python',
      json: 'JSON',
      bash: 'Bash',
      sh: 'Shell',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      markdown: 'Markdown',
    };
    return languageMap[lang] || lang.toUpperCase();
  };

  return (
    <div className="code-block-container" style={{ position: 'relative', marginBottom: '16px' }}>
      {/* Code block header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#2d3748',
          borderTopLeftRadius: '6px',
          borderTopRightRadius: '6px',
          borderBottom: '1px solid #4a5568',
        }}
      >
        <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: 500 }}>
          {getLanguageDisplayName(language)}
        </span>
        <Button
          variant="plain"
          onClick={handleCopy}
          icon={copied ? <CheckIcon /> : <CopyIcon />}
          aria-label={copied ? 'Copied' : 'Copy code'}
          style={{ color: copied ? '#48bb78' : '#a0aec0', padding: '4px 8px' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Code block content */}
      <pre
        className={showLineNumbers ? 'line-numbers' : ''}
        style={{
          margin: 0,
          backgroundColor: '#1a202c',
          borderBottomLeftRadius: '6px',
          borderBottomRightRadius: '6px',
          padding: '16px',
          overflow: 'auto',
          maxHeight: '500px',
        }}
      >
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
