import React from 'react';
import { VoiceName, VoiceOption } from '../types';
import { Mic, Check } from 'lucide-react';

interface VoiceCardProps {
  voice: VoiceOption;
  selected: boolean;
  onSelect: (voice: VoiceName) => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ voice, selected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(voice.name)}
      className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 w-full text-left group
        ${selected 
          ? 'bg-brand-900/40 border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
        }
      `}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className={`p-2 rounded-lg ${selected ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
          <Mic size={18} />
        </div>
        {selected && <Check size={18} className="text-brand-400" />}
      </div>
      
      <h3 className="text-sm font-semibold text-white mb-0.5">{voice.name}</h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
          {voice.gender}
        </span>
      </div>
      <p className="text-xs text-slate-400 line-clamp-2">{voice.description}</p>
    </button>
  );
};

export default VoiceCard;
