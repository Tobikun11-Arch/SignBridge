'use client';

import { useState } from 'react';

interface TagalogBufferProps {
  tokens: string[];
  onRemoveToken: (index: number) => void;
  onEditToken: (index: number, newValue: string) => void;
  onClear: () => void;
  onUndoLast: () => void;
}

export default function TagalogBuffer({
  tokens,
  onRemoveToken,
  onEditToken,
  onClear,
  onUndoLast,
}: TagalogBufferProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(tokens[index]);
  };

  const commitEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      onEditToken(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Tagalog Buffer (Internal)</h2>
        <div className="flex gap-2">
          <button
            onClick={onUndoLast}
            disabled={tokens.length === 0}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-600 disabled:opacity-40"
          >
            Undo Last
          </button>
          <button
            onClick={onClear}
            disabled={tokens.length === 0}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-600 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="min-h-15 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
        {tokens.length === 0 ? (
          <span className="text-sm text-zinc-500 italic">Recognized gestures will appear here...</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tokens.map((token, i) => (
              <div key={i} className="group relative">
                {editingIndex === i ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="w-32 rounded-lg border border-emerald-500 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 outline-none"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(i)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-900/50 px-3 py-1.5 text-sm font-medium text-emerald-300 transition hover:bg-emerald-800/50"
                  >
                    {token}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveToken(i);
                      }}
                      className="ml-1 text-emerald-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                    >
                      &times;
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        Combined: <span className="text-zinc-400">{tokens.join(' ') || '—'}</span>
      </p>
    </div>
  );
}
