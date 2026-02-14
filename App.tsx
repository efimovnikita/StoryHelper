import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, StoryConfig, EvaluationResult, WordPair, SentenceAnalysis } from './types';
import { generateNextWord, evaluateStory, analyzeSentence } from './services/mistralService';
import { Button } from './components/Button';
import { Badge } from './components/Badge';
import { BookOpen, Sparkles, CheckCircle, AlertCircle, RefreshCw, PenTool, BrainCircuit, ArrowRight, Send, Loader2, Check, X, Wand2, Search, ArrowUp, ArrowDown, Trash2, ChevronRight, ChevronDown, ChevronUp, Menu, Shuffle, PenLine, Download, Settings, KeyRound, Eraser } from 'lucide-react';

// --- Sub-components for Screens ---

const SetupScreen: React.FC<{ 
  onStart: (config: StoryConfig) => void 
}> = ({ onStart }) => {
  const [theme, setTheme] = useState('');
  const [mode, setMode] = useState<'thematic' | 'random'>('thematic');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const storedKey = localStorage.getItem('mistral_api_key');
    if (storedKey) setApiKey(storedKey);
    
    // Check word history
    const history = localStorage.getItem('mistral_word_history');
    if (history) {
      try {
        setHistoryCount(JSON.parse(history).length);
      } catch (e) {
        console.error("Error reading history", e);
      }
    }
  }, [showSettings]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('mistral_api_key', val);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure? This will make the AI forget which words it has already generated for you.")) {
      localStorage.removeItem('mistral_word_history');
      setHistoryCount(0);
    }
  };

  const handleStart = () => {
    // If thematic, require theme. If random, allow empty theme.
    if (mode === 'random' || theme.trim()) {
      onStart({ theme: mode === 'random' ? '' : theme, mode });
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 animate-slide-up border border-indigo-50 relative">
      {/* Settings Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 text-indigo-600">
          <BookOpen size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Random Story</h1>
        <p className="text-gray-500">Practice your Italian by weaving random words into a story.</p>
      </div>

      <div className="space-y-6">
        
        {/* API Key Settings Slide-out */}
        {showSettings && (
          <div className="animate-slide-up bg-slate-50 border border-slate-200 p-4 rounded-xl mb-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium text-sm">
                <KeyRound size={16} />
                <span>Mistral API Key</span>
              </div>
              <input 
                type="password" 
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your Mistral API key..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1">
                Your key is stored locally in your browser.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <Eraser size={16} />
                    <span>Word Memory</span>
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{historyCount} words</span>
               </div>
               <p className="text-xs text-slate-400 mb-2">
                 The app remembers generated words to avoid repetition.
               </p>
               <button 
                 onClick={handleClearHistory}
                 disabled={historyCount === 0}
                 className="w-full py-2 px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
               >
                 <Trash2 size={14} /> Clear History
               </button>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button
            onClick={() => setMode('thematic')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              mode === 'thematic' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenLine size={16} />
            Thematic
          </button>
          <button
            onClick={() => setMode('random')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              mode === 'random' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shuffle size={16} />
            Random
          </button>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 transition-colors ${mode === 'random' ? 'text-gray-400' : 'text-gray-700'}`}>
            {mode === 'thematic' ? 'What topic do you want to write about?' : 'Topic selection disabled in Random mode'}
          </label>
          <input 
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={mode === 'random'}
            placeholder="e.g. A trip to Rome, Cooking pasta, The moon..."
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
              mode === 'random' 
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900'
            }`}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        <div className="pt-2">
          {mode === 'random' && (
            <p className="text-xs text-gray-500 bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4">
              <span className="font-bold text-indigo-600">Challenge:</span> You will receive completely unrelated words. Your goal is to use lateral thinking to connect them creatively!
            </p>
          )}
          
          <Button 
            fullWidth 
            onClick={handleStart}
            disabled={mode === 'thematic' && !theme.trim()}
          >
            Start Lesson <Sparkles size={18} className="inline ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const GameScreen: React.FC<{ 
  words: WordPair[],
  storyTheme: string,
  mode: 'thematic' | 'random',
  onFinish: (story: string, usedWordCount: number) => void,
  onBack: () => void,
  onWordGenerated: (newWord: WordPair) => void
}> = ({ words, storyTheme, mode, onFinish, onBack, onWordGenerated }) => {
  // History of confirmed sentences
  const [analyzedSentences, setAnalyzedSentences] = useState<SentenceAnalysis[]>([]);
  
  // Current temporary state
  const [currentInput, setCurrentInput] = useState('');
  const [pendingAnalysis, setPendingAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingNextWord, setIsFetchingNextWord] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);

  const currentWord = words[currentIndex];
  
  // Auto-scroll to bottom of story history when new sentence is added
  useEffect(() => {
    if (storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analyzedSentences.length]); // Only scroll on length change (add/delete), not reorder

  // Collapse mobile sidebar when word changes to focus on writing
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentIndex]);

  const handleNextWord = async () => {
    // If we already have the next word in the array (e.g. going back and forth, though UI doesn't allow back currently), just move index.
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => textareaRef.current?.focus(), 100);
      return;
    }

    // Otherwise, generate the next logical word
    setIsFetchingNextWord(true);
    try {
      const storySoFar = analyzedSentences.map(s => s.original).join(' ');
      const usedWords = words.map(w => w.italian);
      
      const newWord = await generateNextWord(storyTheme, storySoFar, usedWords, mode);
      onWordGenerated(newWord);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (error) {
      console.error("Failed to fetch next word", error);
      // Optional: Add toast error here
    } finally {
      setIsFetchingNextWord(false);
    }
  };

  const processSentence = async (text: string) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeSentence(text);
      setPendingAnalysis(result);
    } catch (error) {
      console.error("Failed to analyze", error);
    } finally {
      setIsAnalyzing(false);
      // Keep focus on textarea so user can continue editing if needed
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCurrentInput(val);
    // Note: pendingAnalysis is purposefully NOT cleared here so the user can see suggestions while editing
  };

  const handleDismissAnalysis = () => {
    setPendingAnalysis(null);
    textareaRef.current?.focus();
  };

  const handleApplyCorrection = () => {
    if (pendingAnalysis) {
      const correctedText = pendingAnalysis.segments.map(s => s.text).join('');
      setCurrentInput(correctedText);
      setPendingAnalysis(null);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleConfirmSentence = () => {
    if (!currentInput.trim()) return;

    let analysisToAdd: SentenceAnalysis;

    // Check if the current input matches the analyzed text.
    // If the user modified the text after checking (e.g. fixed errors), we should treat it as a new sentence
    // rather than using the stale analysis of the old text.
    const isAnalysisCurrent = pendingAnalysis && pendingAnalysis.original.trim() === currentInput.trim();

    if (isAnalysisCurrent && pendingAnalysis) {
      analysisToAdd = pendingAnalysis;
    } else {
      analysisToAdd = {
        original: currentInput,
        segments: [{ text: currentInput, isCorrection: false }]
      };
    }

    setAnalyzedSentences(prev => [...prev, analysisToAdd]);
    setCurrentInput('');
    setPendingAnalysis(null);
  };

  const handleMoveSentence = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setAnalyzedSentences(prev => {
        const newArr = [...prev];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        return newArr;
      });
    } else if (direction === 'down' && index < analyzedSentences.length - 1) {
      setAnalyzedSentences(prev => {
        const newArr = [...prev];
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
        return newArr;
      });
    }
  };

  const handleDeleteSentence = (index: number) => {
    setAnalyzedSentences(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinishStory = () => {
    const historyText = analyzedSentences.map(s => s.original).join(' ');
    const fullStory = (historyText + ' ' + currentInput).trim();
    onFinish(fullStory, currentIndex + 1);
  };

  const hasCorrections = pendingAnalysis?.segments.some(s => s.isCorrection);
  
  // Stats calculation
  const statsSentenceCount = analyzedSentences.length;
  const statsWordCount = analyzedSentences.reduce((acc, s) => {
    const text = s.original.trim();
    if (!text) return acc;
    return acc + text.split(/\s+/).length;
  }, 0);

  return (
    <div className="max-w-6xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-fade-in border border-gray-200 relative">
      
      {/* Sidebar: Current Word & Stats */}
      {/* Mobile: Collapsible Top Bar | Desktop: Fixed Sidebar */}
      <div className={`w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 md:h-full z-20 ${isMobileSidebarOpen ? 'h-[70vh] shadow-xl absolute top-0 left-0 right-0' : 'h-auto relative'}`}>
        
        {/* Mobile Header Bar - Always Visible on Mobile */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-50 border-b border-gray-100 sticky top-0 z-30">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
          >
            &larr; Exit
          </button>
          
          <div className="flex flex-col items-center">
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Word {currentIndex + 1}</span>
             <span className="text-xl font-bold text-indigo-700">{currentWord?.italian}</span>
          </div>

          <button 
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className={`p-2 rounded-full transition-colors ${isMobileSidebarOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {isMobileSidebarOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* Content Area - Collapsible on Mobile, Always Visible on Desktop */}
        <div className={`flex-col md:flex h-full overflow-hidden ${isMobileSidebarOpen ? 'flex' : 'hidden'}`}>
           <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">
              
              {/* Desktop Header - Hidden on Mobile */}
              <div className="hidden md:flex w-full items-center justify-between mb-6">
                <button 
                  onClick={onBack}
                  className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  &larr; Exit
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-50 px-2 py-1 rounded">
                  Word {currentIndex + 1}
                </span>
              </div>
              
              {/* Main Word Display (Desktop primarily, but visible in expanded mobile) */}
              <div className="hidden md:block mb-2 text-xs text-gray-400 uppercase tracking-widest font-bold">Target Word</div>
              <div className="hidden md:block text-4xl font-bold text-indigo-700 break-all animate-fade-in mb-1">
                {currentWord?.italian}
              </div>
              
              <div className="text-lg text-gray-500 font-medium italic animate-fade-in mb-6 font-serif">
                {currentWord?.english}
              </div>

              {currentWord?.collocations && currentWord.collocations.length > 0 && (
                <div className="w-full animate-fade-in mb-6">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider text-center">Common Pairs</div>
                  <div className="flex flex-col gap-2">
                    {currentWord.collocations.map((col, idx) => (
                      <div 
                        key={idx} 
                        className="px-3 py-2 bg-white text-gray-600 rounded-lg text-sm border border-gray-200 font-medium shadow-sm"
                      >
                        {col}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Word Chain History */}
              {words.length > 0 && (
                <div className="w-full mt-auto pt-6 pb-2 border-t border-gray-100">
                   <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider text-center">
                     Word Chain
                   </div>
                   <div className="flex flex-wrap gap-x-1 gap-y-2 justify-center items-center">
                      {words.map((w, i) => (
                        <React.Fragment key={i}>
                           <span 
                             className={`text-xs px-2 py-1 rounded-full border transition-all ${
                               i === currentIndex 
                                 ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md' 
                                 : 'bg-white text-gray-500 border-gray-200'
                             }`}
                           >
                             {w.italian}
                           </span>
                           {i < words.length - 1 && (
                             <ChevronRight size={12} className="text-gray-300" />
                           )}
                        </React.Fragment>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <div className="p-6 pt-4 border-t border-gray-200 bg-slate-50 sticky bottom-0">
              <Button 
                onClick={handleNextWord} 
                fullWidth 
                variant="primary"
                disabled={isFetchingNextWord}
                className="flex items-center justify-center gap-2 py-3 text-sm"
              >
                {isFetchingNextWord ? (
                   <>
                     <Loader2 size={16} className="animate-spin" /> Thinking...
                   </>
                ) : (
                   <>
                     Next Word <ArrowRight size={16} />
                   </>
                )}
              </Button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
        
        {/* Story History (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 bg-gray-50/50">
          {analyzedSentences.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 px-4 text-center">
               <BookOpen size={48} className="mb-4 text-gray-100" />
               <p className="text-lg font-medium text-gray-400">Your story starts here.</p>
               <p className="text-sm">Type a sentence using <b>{currentWord?.italian}</b>.</p>
            </div>
          )}
          
          <div className="space-y-3 pb-4">
            {analyzedSentences.map((sentence, sIdx) => (
              <div key={sIdx} className="group relative bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm transition-all hover:shadow-md flex items-start gap-4 animate-fade-in">
                <div className="flex-1 font-serif text-base md:text-lg leading-relaxed text-gray-800">
                  {sentence.segments.map((seg, gIdx) => (
                    <span key={gIdx}>{seg.text}</span>
                  ))}
                </div>
                
                {/* Controls - Updated to single row */}
                <div className="flex items-center gap-2 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pt-1">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button 
                      type="button"
                      onClick={() => handleMoveSentence(sIdx, 'up')}
                      disabled={sIdx === 0}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleMoveSentence(sIdx, 'down')}
                      disabled={sIdx === analyzedSentences.length - 1}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSentence(sIdx);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Sentence"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
             <div ref={storyEndRef} />
          </div>
        </div>

        {/* Input & Correction Zone */}
        <div className="bg-white border-t border-gray-200 p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 flex flex-col gap-4">
          
          {/* Analysis Feedback Panel */}
          {(pendingAnalysis || isAnalyzing) && (
             <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-4 animate-slide-up">
                {isAnalyzing ? (
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Checking grammar...</span>
                  </div>
                ) : pendingAnalysis ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className={`text-xs font-bold uppercase tracking-wider ${hasCorrections ? 'text-orange-500' : 'text-green-600'}`}>
                          {hasCorrections ? 'Suggestion' : 'Perfect'}
                       </span>
                       <div className="flex items-center gap-2">
                          {hasCorrections && (
                            <button 
                              onClick={handleApplyCorrection}
                              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1"
                            >
                              <Wand2 size={12} /> Apply Fix
                            </button>
                          )}
                          <button 
                              onClick={handleDismissAnalysis}
                              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                              title="Close suggestion"
                          >
                              <X size={16} />
                          </button>
                       </div>
                    </div>
                    
                    <div className="font-serif text-lg leading-relaxed mb-1">
                      {pendingAnalysis.segments.map((seg, idx) => (
                        <span 
                          key={idx}
                          className={
                            seg.isCorrection 
                              ? "text-orange-600 bg-orange-50 font-medium px-0.5 rounded border-b-2 border-orange-200" 
                              : "text-gray-400"
                          }
                        >
                          {seg.text}
                        </span>
                      ))}
                    </div>
                    {/* Translation */}
                    {pendingAnalysis.englishTranslation && (
                        <div className="text-sm text-gray-400 italic">
                            {pendingAnalysis.englishTranslation}
                        </div>
                    )}
                  </div>
                ) : null}
             </div>
          )}

          {/* Text Area - Clean, no buttons inside */}
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleConfirmSentence();
              }
            }}
            placeholder={`Write using "${currentWord?.italian}"...`}
            className="w-full h-20 md:h-24 resize-none bg-gray-50 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none p-4 text-base md:text-lg font-serif text-gray-800 placeholder:text-gray-400 transition-all shadow-inner"
            autoFocus
            disabled={isAnalyzing}
          />
            
          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
             <div className="text-xs text-gray-400 hidden sm:block">
               <strong>Enter</strong> to add.
             </div>

             <div className="flex gap-2 w-full sm:w-auto">
                {/* Manual Check Button */}
                <Button
                   onClick={() => processSentence(currentInput)}
                   disabled={!currentInput.trim() || isAnalyzing}
                   variant="secondary"
                   className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 text-sm"
                >
                   <Search size={16} /> Check
                </Button>

                {/* Add Button */}
                <Button 
                  onClick={handleConfirmSentence}
                  disabled={!currentInput.trim() || isAnalyzing}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 transition-all py-2.5 px-4 text-sm ${
                    (pendingAnalysis && !hasCorrections) ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-100 shadow-green-200' : ''
                  }`}
                  variant={pendingAnalysis ? 'primary' : 'primary'} // Keep primary but change color via className above
                >
                  {pendingAnalysis ? <Check size={16} /> : <Send size={16} />}
                  {pendingAnalysis ? "Add" : "Add"}
               </Button>
             </div>
          </div>
          
          <div className="flex justify-between items-center px-1 pt-2 border-t border-gray-100 mt-1">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {statsSentenceCount} Sentences • {statsWordCount} Words
             </div>
             <button 
               onClick={handleFinishStory}
               disabled={analyzedSentences.length === 0}
               className="text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
             >
               Finish Lesson
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewScreen: React.FC<{
  story: string;
  evaluation: EvaluationResult;
  words: WordPair[];
  onRestart: () => void;
}> = ({ story, evaluation, words, onRestart }) => {
  // Defensive check to safely render words even if they are malformed objects
  const safeUsedWords = Array.isArray(evaluation.usedWords) 
    ? evaluation.usedWords.map(w => typeof w === 'object' ? JSON.stringify(w) : String(w))
    : [];
    
  const safeMissingWords = Array.isArray(evaluation.missingWords)
    ? evaluation.missingWords.map(w => typeof w === 'object' ? JSON.stringify(w) : String(w))
    : [];

  const handleDownload = () => {
    const dateStr = new Date().toLocaleString();
    const wordsList = words.map(w => `- ${w.italian} (${w.english})`).join('\n');
    
    const content = `RANDOM STORY - SESSION REVIEW
Date: ${dateStr}

--- TARGET VOCABULARY ---
${wordsList}

--- YOUR STORY ---
${story}

--- FEEDBACK ---
Score: ${evaluation.score}/100
Used Words: ${safeUsedWords.join(', ')}
Missing Words: ${safeMissingWords.join(', ')}

Logic: ${evaluation.logicalConsistency}
Grammar: ${evaluation.grammarFeedback}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-story-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl p-8 animate-slide-up border border-indigo-50 overflow-y-auto max-h-[90vh]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Lesson Complete!</h2>
        <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-4">
           <span className="text-4xl font-bold text-indigo-600">{evaluation.score}</span>
           <span className="text-sm text-gray-500 ml-1">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         <div className="space-y-4">
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wider">Vocabulary Usage</h3>
            
            <div>
               <p className="text-xs text-gray-500 mb-2">Used Words</p>
               <div className="flex flex-wrap gap-2">
                 {safeUsedWords.length > 0 ? safeUsedWords.map((word, i) => (
                    <Badge key={i} text={word} status="used" />
                 )) : <span className="text-sm text-gray-400 italic">No target words used.</span>}
               </div>
            </div>

            <div>
               <p className="text-xs text-gray-500 mb-2">Missing Words</p>
               <div className="flex flex-wrap gap-2">
                 {safeMissingWords.length > 0 ? safeMissingWords.map((word, i) => (
                    <Badge key={i} text={word} status="missing" />
                 )) : <span className="text-sm text-gray-400 italic">All words used! Great job!</span>}
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wider">Feedback</h3>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <div className="flex items-start gap-2 mb-2">
                 <BrainCircuit size={16} className="text-indigo-500 mt-1" />
                 <span className="font-semibold text-gray-800 text-sm">Logic & Flow</span>
               </div>
               <p className="text-sm text-gray-600 leading-relaxed">{evaluation.logicalConsistency}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <div className="flex items-start gap-2 mb-2">
                 <PenTool size={16} className="text-indigo-500 mt-1" />
                 <span className="font-semibold text-gray-800 text-sm">Grammar</span>
               </div>
               <p className="text-sm text-gray-600 leading-relaxed">{evaluation.grammarFeedback}</p>
            </div>
         </div>
      </div>

      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-8">
        <h3 className="text-indigo-900 font-serif font-medium mb-4 flex items-center gap-2">
          <BookOpen size={18} /> Your Story
        </h3>
        <p className="font-serif text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
          {story}
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={handleDownload} variant="secondary">
           <Download size={18} className="mr-2 inline" /> Save Story
        </Button>
        <Button onClick={onRestart}>
           <RefreshCw size={18} className="mr-2 inline" /> Start New Lesson
        </Button>
      </div>
    </div>
  );
};

const App = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [config, setConfig] = useState<StoryConfig | null>(null);
  const [words, setWords] = useState<WordPair[]>([]);
  const [story, setStory] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const handleStart = async (newConfig: StoryConfig) => {
    setConfig(newConfig);
    setGameState(GameState.LOADING);
    
    try {
      // Initial word generation
      const firstWord = await generateNextWord(
        newConfig.theme, 
        "", 
        [], 
        newConfig.mode
      );
      setWords([firstWord]);
      setGameState(GameState.PLAYING);
    } catch (error: any) {
      console.error("Failed to start game", error);
      // If error message mentions API key, show alert with hint
      if (error.message && error.message.includes("API Key")) {
        alert(error.message);
        setGameState(GameState.SETUP);
      } else {
        setGameState(GameState.ERROR);
      }
    }
  };

  const handleWordGenerated = (newWord: WordPair) => {
    setWords(prev => [...prev, newWord]);
  };

  const handleFinishStory = async (finalStory: string, usedWordCount: number) => {
    setStory(finalStory);
    setGameState(GameState.EVALUATING);
    
    try {
      const result = await evaluateStory(
        finalStory, 
        words.map(w => w.italian)
      );
      setEvaluation(result);
      setGameState(GameState.REVIEW);
    } catch (error) {
      console.error("Evaluation failed", error);
      // Fallback evaluation for error handling
      setEvaluation({
        score: 0,
        usedWords: [],
        missingWords: [],
        logicalConsistency: "Error evaluating story.",
        grammarFeedback: "Could not generate feedback.",
        creativityComment: ""
      });
      setGameState(GameState.REVIEW);
    }
  };

  const handleRestart = () => {
    setGameState(GameState.SETUP);
    setConfig(null);
    setWords([]);
    setStory('');
    setEvaluation(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      
      {gameState === GameState.SETUP && (
        <SetupScreen onStart={handleStart} />
      )}

      {gameState === GameState.LOADING && (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">Preparing your lesson...</p>
        </div>
      )}

      {gameState === GameState.PLAYING && config && (
        <GameScreen 
          words={words}
          storyTheme={config.theme}
          mode={config.mode}
          onFinish={handleFinishStory}
          onBack={handleRestart}
          onWordGenerated={handleWordGenerated}
        />
      )}

      {gameState === GameState.EVALUATING && (
        <div className="flex flex-col items-center animate-fade-in text-center max-w-md">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Evaluating your story...</h2>
          <p className="text-gray-500">Checking grammar, vocabulary usage, and creativity.</p>
        </div>
      )}

      {gameState === GameState.REVIEW && evaluation && (
        <ReviewScreen 
          story={story}
          evaluation={evaluation}
          words={words}
          onRestart={handleRestart}
        />
      )}

      {gameState === GameState.ERROR && (
         <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">We couldn't connect to the AI service. Please check your API Key in settings and try again.</p>
            <Button onClick={handleRestart}>Try Again</Button>
         </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-4 text-center text-xs text-gray-400 pointer-events-none">
        Powered by Mistral AI
      </div>
    </div>
  );
};

export default App;