import React from 'react';
import { GeneratedAudio } from '../types';
import { Play, Square, Trash2, Download } from 'lucide-react';

interface AudioHistoryItemProps {
  item: GeneratedAudio;
  isPlaying: boolean;
  onPlay: (item: GeneratedAudio) => void;
  onStop: () => void;
  onDelete: (id: string) => void;
  onDownload: (item: GeneratedAudio) => void;
}

const AudioHistoryItem: React.FC<AudioHistoryItemProps> = ({ item, isPlaying, onPlay, onStop, onDelete, onDownload }) => {
  const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isPlaying ? 'bg-brand-900/10 border-brand-500/30' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={() => isPlaying ? onStop() : onPlay(item)}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-brand-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200 truncate pr-4" title={item.text}>
            {item.text}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="text-brand-400">{item.voiceName}</span>
            <span>•</span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <button 
          onClick={() => onDownload(item)}
          className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors"
          title="Download Audio"
        >
          <Download size={18} />
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default AudioHistoryItem;