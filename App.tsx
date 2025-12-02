import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceName, VOICE_OPTIONS, GeneratedAudio } from './types';
import { generateSpeech } from './services/geminiService';
import VoiceCard from './components/VoiceCard';
import AudioHistoryItem from './components/AudioHistoryItem';
import { Sparkles, Loader2, Volume2, History, AlertCircle } from 'lucide-react';

const MAX_CHARS = 1000;

export default function App() {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Kore);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  
  // Audio element ref for playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    audioRef.current.onended = () => setCurrentPlayingId(null);
    audioRef.current.onpause = () => setCurrentPlayingId(null);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { url } = await generateSpeech(text, selectedVoice);
      
      const newAudio: GeneratedAudio = {
        id: Date.now().toString(),
        text: text.trim(),
        voice: selectedVoice,
        blobUrl: url,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newAudio, ...prev]);
      // Auto-play the newest generated audio
      playAudio(newAudio);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate speech. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = useCallback((item: GeneratedAudio) => {
    if (!audioRef.current) return;
    
    if (audioRef.current.src !== item.blobUrl) {
      audioRef.current.src = item.blobUrl;
    }
    
    audioRef.current.play().then(() => {
      setCurrentPlayingId(item.id);
    }).catch(e => {
      console.error("Playback failed", e);
      setCurrentPlayingId(null);
    });
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentPlayingId(null);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (currentPlayingId === id) {
      pauseAudio();
    }
    setHistory(prev => {
      const itemToDelete = prev.find(item => item.id === id);
      if (itemToDelete) {
        URL.revokeObjectURL(itemToDelete.blobUrl); // Clean up memory
      }
      return prev.filter(item => item.id !== id);
    });
  }, [currentPlayingId, pauseAudio]);

  const charCount = text.length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-brand-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Volume2 className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VoxGen AI
            </h1>
          </div>
          <a 
            href="https://ai.google.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-brand-300 hover:bg-slate-700 transition-colors"
          >
            Powered by Gemini
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Text Input Area */}
            <div className="space-y-3">
              <label htmlFor="text-input" className="block text-sm font-medium text-slate-400">
                Enter Text
              </label>
              <div className="relative group">
                <textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Type something amazing here..."
                  className="w-full h-48 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none shadow-inner"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-medium bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700/50">
                  {charCount} / {MAX_CHARS}
                </div>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-400">
                Select Voice
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VOICE_OPTIONS.map((voice) => (
                  <VoiceCard 
                    key={voice.name}
                    voice={voice}
                    selected={selectedVoice === voice.name}
                    onSelect={setSelectedVoice}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                ${isGenerating || !text.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Generating Audio...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Speech
                </>
              )}
            </button>
          </div>

          {/* Right Column: Output & History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 text-slate-200 pb-2 border-b border-slate-800">
              <History size={20} className="text-brand-400" />
              <h2 className="text-lg font-semibold">Generation History</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 px-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="text-slate-600" size={32} />
                </div>
                <h3 className="text-slate-400 font-medium mb-1">No audio generated yet</h3>
                <p className="text-sm text-slate-600">Enter text and click Generate to start speaking.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((item) => (
                  <AudioHistoryItem
                    key={item.id}
                    item={item}
                    isPlaying={currentPlayingId === item.id}
                    onPlay={playAudio}
                    onPause={pauseAudio}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
