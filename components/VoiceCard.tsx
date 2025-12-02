import React from 'react';
import { Mic, Check } from 'lucide-react';

interface VoiceCardProps {
  voice: SpeechSynthesisVoice;
  selected: boolean;
  onSelect: (voice: SpeechSynthesisVoice) => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ voice, selected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(voice)}
      className={`relative flex items-center justify-between p-3 rounded-lg border transition-all duration-200 w-full text-left group
        ${selected 
          ? 'bg-brand-900/40 border-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
        }
      `}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`flex-shrink-0 p-1.5 rounded-md ${selected ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
          <Mic size={16} />
        </div>
        <div className="min-w-0">
          <h3 className={`text-sm font-medium truncate ${selected ? 'text-white' : 'text-slate-300'}`}>
            {voice.name}
          </h3>
          <p className="text-xs text-slate-500 truncate">{voice.lang}</p>
        </div>
      </div>
      {selected && <Check size={16} className="text-brand-400 flex-shrink-0 ml-2" />}
    </button>
  );
};

export default VoiceCard;
