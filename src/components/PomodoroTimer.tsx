import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

export const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [workTime, setWorkTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);

  const switchMode = useCallback((newMode: 'work' | 'break', duration: number) => {
    setMode(newMode);
    setTimeLeft(duration * 60);
    setIsActive(false);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound or notification here
      if (mode === 'work') {
        switchMode('break', breakTime);
      } else {
        switchMode('work', workTime);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, workTime, breakTime, switchMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft((mode === 'work' ? workTime : breakTime) * 60);
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col items-center gap-4 w-full max-w-xs">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
        {mode === 'work' ? <Brain size={14} className="text-brand-red" /> : <Coffee size={14} className="text-green-500" />}
        <span>{mode === 'work' ? 'Foco' : 'Descanso'}</span>
      </div>

      <div className="text-4xl font-mono font-bold text-white tabular-nums">
        {formatTime(timeLeft)}
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTimer}
          className={cn(
            "p-3 rounded-full transition-all",
            isActive ? "bg-neutral-800 text-white" : "bg-brand-red text-white"
          )}
        >
          {isActive ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <button 
          onClick={resetTimer}
          className="p-3 bg-neutral-800 text-neutral-400 rounded-full hover:text-white transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full mt-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-600 uppercase">Trabalho</label>
          <div className="flex gap-1">
            {[25, 30].map(t => (
              <button 
                key={t}
                onClick={() => { setWorkTime(t); if (mode === 'work') switchMode('work', t); }}
                className={cn(
                  "flex-1 py-1 text-[10px] rounded border transition-all",
                  workTime === t && mode === 'work' ? "bg-brand-red/10 border-brand-red text-brand-red" : "bg-dark-bg border-dark-border text-neutral-500"
                )}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-neutral-600 uppercase">Pausa</label>
          <div className="flex gap-1">
            {[5, 10].map(t => (
              <button 
                key={t}
                onClick={() => { setBreakTime(t); if (mode === 'break') switchMode('break', t); }}
                className={cn(
                  "flex-1 py-1 text-[10px] rounded border transition-all",
                  breakTime === t && mode === 'break' ? "bg-green-500/10 border-green-500 text-green-500" : "bg-dark-bg border-dark-border text-neutral-500"
                )}
              >
                {t}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
