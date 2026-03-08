'use client';

import { EventLogEntry } from '../lib/types';

interface EventLogProps {
  entries: EventLogEntry[];
  onClear: () => void;
}

const TYPE_COLORS: Record<EventLogEntry['type'], string> = {
  gesture: 'text-emerald-400',
  translate_start: 'text-blue-400',
  translate_done: 'text-blue-300',
  interrupt: 'text-amber-400',
  tts: 'text-violet-400',
  input: 'text-cyan-400',
};

export default function EventLog({ entries, onClear }: EventLogProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Event Log</h2>
        <button
          onClick={onClear}
          disabled={entries.length === 0}
          className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-600 disabled:opacity-40"
        >
          Clear Log
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-3">
        {entries.length === 0 ? (
          <p className="text-sm italic text-zinc-500">No events yet...</p>
        ) : (
          <div className="flex flex-col gap-1">
            {entries.map((entry, i) => {
              const time = new Date(entry.timestamp).toLocaleTimeString();
              return (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="shrink-0 text-zinc-600 font-mono">{time}</span>
                  <span className={`shrink-0 font-medium uppercase ${TYPE_COLORS[entry.type]}`}>
                    {entry.type.replace('_', ' ')}
                  </span>
                  <span className="text-zinc-400 truncate">{entry.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
