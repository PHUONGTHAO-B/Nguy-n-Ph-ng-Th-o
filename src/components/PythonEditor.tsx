import React, { useRef, useState } from 'react';
import { Copy, Check, RotateCcw, ZoomIn, ZoomOut, Terminal, Sparkles } from 'lucide-react';

interface PythonEditorProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  placeholder?: string;
  onReset?: () => void;
  title?: string;
  onRunShortcut?: () => void;
}

export const PythonEditor: React.FC<PythonEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  minHeight = '340px',
  placeholder = '# Nhập mã Python tại đây...',
  onReset,
  title = 'main.py',
  onRunShortcut,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<number>(15);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const lines = value.split('\n');

  const updateCursorPosition = (el: HTMLTextAreaElement) => {
    const start = el.selectionStart;
    const textBefore = el.value.substring(0, start);
    const lineList = textBefore.split('\n');
    setCursorPos({
      line: lineList.length,
      col: lineList[lineList.length - 1].length + 1,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (onRunShortcut) {
        e.preventDefault();
        onRunShortcut();
        return;
      }
    }

    if (readOnly || !onChange) return;

    // Handle Tab key for 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      if (e.shiftKey) {
        const before = value.substring(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const line = value.substring(lineStart, end);
        if (line.startsWith('    ')) {
          const newVal = value.substring(0, lineStart) + line.substring(4) + value.substring(end);
          onChange(newVal);
          setTimeout(() => {
            target.selectionStart = Math.max(lineStart, start - 4);
            target.selectionEnd = Math.max(lineStart, end - 4);
            updateCursorPosition(target);
          }, 0);
        }
      } else {
        const newVal = value.substring(0, start) + '    ' + value.substring(end);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 4;
          updateCursorPosition(target);
        }, 0);
      }
    }

    // Auto-indent on Enter
    if (e.key === 'Enter') {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const beforeCursor = value.substring(0, start);
      const currentLine = beforeCursor.split('\n').pop() || '';

      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : '';

      if (currentLine.trimEnd().endsWith(':')) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newVal = value.substring(0, start) + '\n' + indent + value.substring(target.selectionEnd);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1 + indent.length;
          updateCursorPosition(target);
        }, 0);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertSnippet = (snippet: string) => {
    if (readOnly || !onChange || !textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = value.substring(0, start) + snippet + value.substring(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
      updateCursorPosition(el);
    }, 0);
  };

  return (
    <div className="border border-slate-700/80 rounded-2xl overflow-hidden bg-[#0c121e] shadow-xl flex flex-col font-sans transition-all ring-1 ring-slate-800">
      {/* Editor Header Bar */}
      <div className="bg-[#121b2d] text-slate-300 px-4 py-2.5 flex items-center justify-between text-xs border-b border-slate-700/60 select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f87171] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] inline-block"></span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a263d] rounded-md text-sky-300 font-mono text-xs border border-slate-700/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="font-semibold">{title}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom buttons */}
          <div className="flex items-center bg-[#1a263d] rounded-lg border border-slate-700/60 p-0.5 text-slate-300">
            <button
              type="button"
              onClick={() => setFontSize((f) => Math.max(13, f - 1))}
              title="Thu nhỏ chữ"
              className="p-1 hover:text-white hover:bg-slate-700/60 rounded transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-400">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((f) => Math.min(22, f + 1))}
              title="Phóng to chữ cho phòng máy"
              className="p-1 hover:text-white hover:bg-slate-700/60 rounded transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onReset && !readOnly && (
            <button
              type="button"
              onClick={onReset}
              title="Đặt lại code ban đầu"
              className="px-2.5 py-1 bg-[#1a263d] hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-amber-300 flex items-center gap-1 transition text-xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 bg-[#1a263d] hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-slate-200 flex items-center gap-1 transition text-xs cursor-pointer"
            title="Sao chép code"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Chép'}</span>
          </button>
        </div>
      </div>

      {/* Snippet Helper Bar for Students */}
      {!readOnly && (
        <div className="bg-[#0f172a] px-4 py-1.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 select-none">
          <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" /> Mẫu code:
          </span>
          <button
            type="button"
            onClick={() => insertSnippet('import sys\ndata = sys.stdin.read().split()\n')}
            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded font-mono transition shrink-0 cursor-pointer"
            title="Chèn lệnh đọc nhanh toàn bộ input"
          >
            sys.stdin.read()
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('n = int(input().strip())\n')}
            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded font-mono transition shrink-0 cursor-pointer"
            title="Chèn lệnh nhập 1 số nguyên"
          >
            int(input())
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('a = [int(x) for x in input().split()]\n')}
            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded font-mono transition shrink-0 cursor-pointer"
            title="Chèn lệnh nhập mảng trên 1 dòng"
          >
            [int(x) for x in input().split()]
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('for i in range(n):\n    ')}
            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-sky-300 rounded font-mono transition shrink-0 cursor-pointer"
            title="Chèn vòng lặp for"
          >
            for i in range(n)
          </button>
        </div>
      )}

      {/* Editor Body with Line Numbers */}
      <div
        className="relative flex bg-[#0c121e] text-slate-100 font-mono text-sm overflow-hidden"
        style={{ minHeight }}
      >
        {/* Line Numbers */}
        <div
          className="select-none py-3 px-3 text-right bg-[#090d16] text-slate-600 border-r border-slate-800/80 font-mono shrink-0"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          readOnly={readOnly}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            updateCursorPosition(e.target);
          }}
          onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
          onClick={(e) => updateCursorPosition(e.currentTarget)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full h-full min-h-[320px] p-3.5 bg-transparent text-[#e2e8f0] outline-none resize-none leading-relaxed font-mono selection:bg-blue-600/40"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.6,
            tabSize: 4,
          }}
        />
      </div>

      {/* Modern Status Footer */}
      <div className="bg-[#090d16] text-slate-400 px-4 py-1.5 text-xs flex justify-between items-center border-t border-slate-800/80">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="font-mono text-slate-300">
            Dòng {cursorPos.line}, Cột {cursorPos.col}
          </span>
          <span className="text-slate-600">|</span>
          <span>{lines.length} dòng</span>
          <span className="text-slate-600">|</span>
          <span>{value.length} ký tự</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400 hidden sm:inline">Phím Tab = 4 dấu cách</span>
          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
            Python 3.11
          </span>
        </div>
      </div>
    </div>
  );
};
