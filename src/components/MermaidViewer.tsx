import { useEffect, useState, useCallback, useRef, type KeyboardEvent } from 'react';
import mermaid from 'mermaid';
import type { FishboneData } from '../types/fishbone';
import { Download, Copy, Check, Code2, BarChart2, RefreshCw } from 'lucide-react';

interface MermaidViewerProps {
  data: FishboneData;
  onRawChange?: (raw: string) => void;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  darkMode: true,
});

let renderCounter = 0;

export const generateMermaidString = (data: FishboneData): string => {
  let str = `ishikawa-beta\n  ${data.title || 'Problem Statement'}\n`;

  const appendCauses = (causes: any[], indent: string) => {
    causes.forEach((cause) => {
      if (!cause.text?.trim()) return;
      str += `${indent}${cause.text}\n`;
      if (cause.subCauses && cause.subCauses.length > 0) {
        appendCauses(cause.subCauses, indent + '  ');
      }
    });
  };

  data.categories.forEach((cat) => {
    if (!cat.name?.trim()) return;
    str += `    ${cat.name}\n`;
    appendCauses(cat.causes || [], '      ');
  });

  return str;
};

const MermaidViewer: React.FC<MermaidViewerProps> = ({ data, onRawChange }) => {
  const [svg, setSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'diagram' | 'code'>('diagram');
  const [rawCode, setRawCode] = useState<string>(() => generateMermaidString(data));
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track whether user has manually edited the code — prevents data syncs from overwriting
  const userEditedCode = useRef(false);

  const renderMermaid = useCallback(async (content: string) => {
    setIsRendering(true);
    setCodeError(null);
    const id = `mermaid-render-${++renderCounter}`;
    try {
      const result = await mermaid.render(id, content);
      setSvg(result.svg);
    } catch (err: any) {
      console.warn('Mermaid render error:', err?.message || err);
      setCodeError(err?.message || 'Render error. Check syntax.');
    } finally {
      setIsRendering(false);
    }
  }, []);

  // Sync data → rawCode only when NOT in code mode, and user hasn't taken over editing
  useEffect(() => {
    if (mode === 'code' && userEditedCode.current) return;
    const generated = generateMermaidString(data);
    setRawCode(generated);
    userEditedCode.current = false;
  }, [data, mode]);

  // Render whenever rawCode changes
  useEffect(() => {
    renderMermaid(rawCode);
  }, [rawCode, renderMermaid]);

  const handleRawCodeChange = (val: string) => {
    userEditedCode.current = true;
    setRawCode(val);
    onRawChange?.(val);
  };

  const handleTabKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const INDENT = '  '; // 2 spaces

    if (e.shiftKey) {
      // Shift+Tab: remove up to 2 leading spaces from the current line
      const lineStart = rawCode.lastIndexOf('\n', start - 1) + 1;
      const before = rawCode.slice(lineStart, start);
      const stripped = before.replace(/^ {1,2}/, '');
      const removed = before.length - stripped.length;
      if (removed === 0) return;
      const next = rawCode.slice(0, lineStart) + stripped + rawCode.slice(start);
      setRawCode(next);
      userEditedCode.current = true;
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start - removed;
      });
    } else {
      // Tab: insert 2 spaces at cursor
      const next = rawCode.slice(0, start) + INDENT + rawCode.slice(end);
      setRawCode(next);
      userEditedCode.current = true;
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + INDENT.length;
      });
    }
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fishbone.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Mode Toggle Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(2,4,10,0.4)',
        borderRadius: '16px 16px 0 0',
        backdropFilter: 'blur(8px)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setMode('diagram')}
            className={`tab-btn ${mode === 'diagram' ? 'active' : ''}`}
            style={{ flex: 'unset', padding: '5px 14px', borderRadius: 6, fontSize: 11 }}
          >
            <BarChart2 size={12} style={{ display: 'inline', marginRight: 5 }} />
            Visual
          </button>
          <button
            onClick={() => setMode('code')}
            className={`tab-btn ${mode === 'code' ? 'active' : ''}`}
            style={{ flex: 'unset', padding: '5px 14px', borderRadius: 6, fontSize: 11 }}
          >
            <Code2 size={12} style={{ display: 'inline', marginRight: 5 }} />
            Mermaid Code
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isRendering && <RefreshCw size={12} style={{ color: 'var(--indigo-400)', animation: 'spin 1s linear infinite' }} />}
          <button onClick={copyCode} className={`diagram-action-btn ${copied ? 'success' : ''}`}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={downloadSvg} className="diagram-action-btn">
            <Download size={12} /> SVG
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', borderRadius: '0 0 16px 16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none' }}>
        {/* Diagram View */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
          overflow: 'auto',
          background: 'rgba(2,4,10,0.5)',
          opacity: mode === 'diagram' ? 1 : 0,
          pointerEvents: mode === 'diagram' ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}>
          {svg
            ? <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            : <span style={{ color: 'var(--text-600)', fontSize: 13, fontStyle: 'italic' }}>Generating diagram…</span>
          }
        </div>

        {/* Code View */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          opacity: mode === 'code' ? 1 : 0,
          pointerEvents: mode === 'code' ? 'auto' : 'none',
          transition: 'opacity 0.2s',
        }}>
          <textarea
            ref={textareaRef}
            className="code-mode-editor"
            value={rawCode}
            onChange={(e) => handleRawCodeChange(e.target.value)}
            onKeyDown={handleTabKey}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          {codeError && (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(244,63,94,0.12)',
              borderTop: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--rose-400)',
              fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0
            }}>
              ⚠ {codeError}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MermaidViewer;
