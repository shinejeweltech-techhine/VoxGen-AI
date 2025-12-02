import React, { useState, useEffect, useRef } from 'react';
import { GeneratedAudio } from './types';
import { getAvailableVoices, speakText, stopSpeaking } from './services/geminiService'; // Actually TTS service now
import { downloadAudioBlob, generateFilename } from './services/audioUtils';
import AudioHistoryItem from './components/AudioHistoryItem';
import { Volume2, History, AlertCircle, Play, Square, Settings2, Globe, Download, Save, Mic } from 'lucide-react';

const MAX_CHARS = 5000;

export default function App() {
  const [text, setText] = useState('');
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Load voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      const voices = await getAvailableVoices();
      setAllVoices(voices);

      // Extract unique languages
      const langs = Array.from(new Set(voices.map(v => v.lang))).sort();
      setAvailableLangs(langs);

      // Try to find default language (User's browser lang or English)
      const browserLang = navigator.language;
      const hasBrowserLang = langs.find(l => l.includes(browserLang));
      
      // Default selection logic
      if (hasBrowserLang) {
        setSelectedLang(hasBrowserLang);
      } else if (langs.includes('en-US')) {
        setSelectedLang('en-US');
      } else if (langs.length > 0) {
        setSelectedLang(langs[0]);
      }
    };

    loadVoices();
  }, []);

  // Update selected voice when language changes or voices load
  useEffect(() => {
    if (!selectedLang) return;

    const voicesInLang = allVoices.filter(v => v.lang === selectedLang);
    if (voicesInLang.length > 0) {
      // Prefer default voice for that language
      const defaultVoice = voicesInLang.find(v => v.default) || voicesInLang[0];
      setSelectedVoice(defaultVoice);
    } else {
      setSelectedVoice(null);
    }
  }, [selectedLang, allVoices]);

  const addToHistory = (txt: string, voiceName: string) => {
    const existing = history.find(h => h.text === txt.trim() && h.voiceName === voiceName);
    if (!existing) {
      const newEntry: GeneratedAudio = {
        id: Date.now().toString(),
        text: txt.trim(),
        voiceName: voiceName,
        timestamp: Date.now()
      };
      setHistory(prev => [newEntry, ...prev]);
    }
  };

  const handleSpeak = () => {
    if (!text.trim()) return;

    // If currently speaking this exact text, stop it
    if (isSpeaking && !playingId && !isRecording) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    // Stop any previous playback
    stopSpeaking();
    setPlayingId(null);
    setIsRecording(false);

    setIsSpeaking(true);
    
    speakText(
      text, 
      selectedVoice, 
      () => setIsSpeaking(false), // onEnd
      (e) => {
        console.error(e);
        setIsSpeaking(false);
      }
    );

    addToHistory(text, selectedVoice?.name || 'Default');
  };

  const handleExport = async (textToSpeak: string, voiceName?: string) => {
    if (!textToSpeak.trim()) return;
    
    const voiceToUse = voiceName 
      ? allVoices.find(v => v.name === voiceName) || selectedVoice 
      : selectedVoice;

    // Instructions
    const confirmMsg = "To download the audio file, we need to record it from your browser.\n\n" + 
                       "1. Click OK.\n" + 
                       "2. Select the 'This Tab' tab (or 'Chrome Tab').\n" + 
                       "3. Make sure 'Share system audio' is CHECKED.\n" + 
                       "4. Click 'Share'.";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      // Stop any current playback
      stopSpeaking();
      setPlayingId(null);
      setIsSpeaking(false);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" }, 
        audio: { 
          suppressLocalAudioPlayback: false, // Let user hear it
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false 
        },
        // @ts-ignore - non-standard but supported in Chrome
        preferCurrentTab: true, 
        selfBrowserSurface: "include",
        systemAudio: "include"
      } as any);

      // Check for audio track
      if (stream.getAudioTracks().length === 0) {
        alert("Audio was not shared. Please ensure 'Share system audio' is checked.");
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      setIsRecording(true);
      setIsSpeaking(true);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        downloadAudioBlob(blob, generateFilename(textToSpeak));
        
        // Cleanup
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        setIsSpeaking(false);
      };

      // Start recording then speaking
      mediaRecorder.start();
      
      // Delay slightly to ensure recorder is ready
      setTimeout(() => {
        speakText(
          textToSpeak,
          voiceToUse,
          () => {
             if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          },
          (err) => {
             console.error(err);
             if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          }
        );
      }, 500);

      addToHistory(textToSpeak, voiceToUse?.name || 'Default');

    } catch (err) {
      console.error("Export error:", err);
      setIsRecording(false);
      setIsSpeaking(false);
    }
  };

  const handleHistoryPlay = (item: GeneratedAudio) => {
    stopSpeaking();
    setPlayingId(item.id);
    setIsSpeaking(true);

    const originalVoice = allVoices.find(v => v.name === item.voiceName) || selectedVoice;

    speakText(
      item.text,
      originalVoice,
      () => {
        setIsSpeaking(false);
        setPlayingId(null);
      },
      () => {
        setIsSpeaking(false);
        setPlayingId(null);
      }
    );
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setIsRecording(false);
    setPlayingId(null);
  };

  const handleDelete = (id: string) => {
    if (playingId === id) {
      handleStop();
    }
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const charCount = text.length;
  
  // Filter voices based on selected language
  const filteredVoices = allVoices.filter(v => v.lang === selectedLang);

  // Helper to get friendly language name
  const getLangName = (code: string) => {
    try {
      const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
      return languageNames.of(code) || code;
    } catch (e) {
      return code;
    }
  };

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
              VoxGen (Offline)
            </h1>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
            Client-Side Only
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-7 space-y-6">
            
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
                  placeholder="Type something here to convert to speech..."
                  className="w-full h-48 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none shadow-inner"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-medium bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700/50">
                  {charCount} / {MAX_CHARS}
                </div>
              </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <Globe size={16} />
                  Language
                </label>
                <div className="relative">
                  <select 
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer"
                  >
                    {availableLangs.map(lang => (
                      <option key={lang} value={lang}>
                        {getLangName(lang)} ({lang})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <Settings2 size={16} />
                  Voice
                </label>
                <div className="relative">
                  <select 
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const voice = allVoices.find(v => v.name === e.target.value);
                      if (voice) setSelectedVoice(voice);
                    }}
                    disabled={filteredVoices.length === 0}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    {filteredVoices.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name.replace(/Microsoft|Google|Android/g, '').trim()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

            </div>

            {/* Warning if no voices */}
            {allVoices.length === 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-900/20 border border-amber-900/50 rounded-lg text-amber-200 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>No system voices detected. Please check your browser settings.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSpeak}
                disabled={!text.trim() || allVoices.length === 0 || isRecording}
                className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                  ${!text.trim() || allVoices.length === 0 || isRecording
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isSpeaking && !playingId
                      ? 'bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20'
                      : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0'
                  }
                `}
              >
                {isSpeaking && !playingId ? (
                  <>
                    <Square size={20} fill="currentColor" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    Speak
                  </>
                )}
              </button>

              <button
                onClick={() => handleExport(text)}
                disabled={!text.trim() || allVoices.length === 0 || isSpeaking}
                className={`py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg border
                  ${!text.trim() || allVoices.length === 0 || isSpeaking
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    : isRecording
                      ? 'bg-red-500 border-red-400 text-white animate-pulse'
                      : 'bg-slate-800 border-slate-600 text-brand-300 hover:bg-slate-700 hover:text-brand-200 hover:border-slate-500'
                  }
                `}
                title="Save as Audio File"
              >
                {isRecording ? (
                   <>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    Recording...
                   </>
                ) : (
                   <>
                    <Save size={20} />
                    <span className="hidden sm:inline">Save Audio</span>
                   </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-2 text-slate-200 pb-2 border-b border-slate-800">
              <History size={20} className="text-brand-400" />
              <h2 className="text-lg font-semibold">History</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 px-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="text-slate-600" size={32} />
                </div>
                <h3 className="text-slate-400 font-medium mb-1">No history yet</h3>
                <p className="text-sm text-slate-600">Enter text and click Speak to start.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((item) => (
                  <AudioHistoryItem
                    key={item.id}
                    item={item}
                    isPlaying={playingId === item.id}
                    onPlay={handleHistoryPlay}
                    onStop={handleStop}
                    onDelete={() => handleDelete(item.id)}
                    onDownload={(i) => handleExport(i.text, i.voiceName)}
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