/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TelemetryLog } from '../types';

interface TelemetryLogsProps {
  logs: TelemetryLog[];
}

export const TelemetryLogs: React.FC<TelemetryLogsProps> = ({ logs }) => {
  const getLogColorStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-rose-400';
      case 'success':
        return 'text-emerald-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-slate-300';
    }
  };

  const getLogBadgeBgStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'info':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default:
        return 'bg-white/5 text-slate-300 border border-white/10';
    }
  };

  return (
    <div className="mt-5 bg-[#0d1327]/45 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col h-44 shrink-0 select-none overflow-hidden">
      <div className="flex justify-between items-center pb-2.5 mb-2.5 border-b border-white/5 shrink-0">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>
          Canlı Dijital İkiz Telemetri Logları
        </h3>
        <span className="text-[10px] font-mono text-pink-400 bg-pink-500/5 px-2.5 py-0.5 rounded-full border border-pink-500/10 shadow-inner">
          {logs.length} Aktif Telemetri Kaydı
        </span>
      </div>

      <ul 
        className="flex-1 overflow-y-auto space-y-2.5 pr-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
            Telemetri dinleniyor, simülasyonu başlatın...
          </div>
        ) : (
          logs.map((log) => {
            // format simulated time to HH:MM:SS
            const seconds = log.timestamp;
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            return (
              <li 
                key={log.id} 
                className="flex items-start gap-3.5 text-xs border-b border-white/[0.02] last:border-0 pb-1.5 last:pb-0"
              >
                <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded shrink-0">
                  [{timeStr}]
                </span>
                <span className={`font-semibold shrink-0 text-[10px] px-1.5 py-0.5 rounded uppercase ${getLogBadgeBgStyle(log.type)}`}>
                  {log.type}
                </span>
                <span className={`font-medium flex-1 ${getLogColorStyle(log.type)}`}>
                  {log.message}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};
