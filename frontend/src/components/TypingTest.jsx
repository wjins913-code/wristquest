import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateFunctionScore } from '../utils/scoring';

const SENTENCE =
  'The quick brown fox jumps over the lazy dog near the river bank';
const DURATION_MS = 30_000;

export default function TypingTest({ onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalsRef = useRef([]); // ms between keystrokes
  const lastKeyTimeRef = useRef(null);
  const inputRef = useRef(null);

  const remainingMs = phase === 'running' ? Math.max(0, DURATION_MS - elapsed) : DURATION_MS;
  const seconds = Math.ceil(remainingMs / 1000);

  // Tick
  useEffect(() => {
    if (phase !== 'running') return;
    let raf;
    const tick = () => {
      const e = performance.now() - startTime;
      setElapsed(e);
      if (e >= DURATION_MS) {
        finish(input);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, startTime]);

  const start = () => {
    setInput('');
    intervalsRef.current = [];
    lastKeyTimeRef.current = null;
    setElapsed(0);
    setStartTime(performance.now());
    setPhase('running');
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const finish = (finalInput) => {
    setPhase('done');
    const elapsedSec = Math.min(DURATION_MS, performance.now() - startTime) / 1000;
    const stats = computeStats(finalInput, SENTENCE, intervalsRef.current, elapsedSec);
    const score = calculateFunctionScore(stats);
    onComplete({ score, raw: { ...stats, input: finalInput, sentence: SENTENCE } });
  };

  const onChange = (e) => {
    if (phase !== 'running') return;
    const now = performance.now();
    if (lastKeyTimeRef.current != null) {
      intervalsRef.current.push(now - lastKeyTimeRef.current);
    }
    lastKeyTimeRef.current = now;
    const value = e.target.value;
    setInput(value);
    // Auto-stop when the sentence is fully and correctly typed.
    if (value === SENTENCE) {
      finish(value);
    }
  };

  // Live stats
  const liveStats = useMemo(() => {
    if (!startTime) return { wpm: 0, errors: 0, accuracy: 100 };
    const elapsedSec = Math.max(0.001, elapsed / 1000);
    const wordsTyped = input.trim().length === 0 ? 0 : input.trim().split(/\s+/).length;
    const wpm = (wordsTyped / elapsedSec) * 60;
    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== SENTENCE[i]) errors++;
    }
    const accuracy = input.length === 0 ? 100 : Math.max(0, 100 - (errors / input.length) * 100);
    return { wpm: Math.round(wpm), errors, accuracy: Math.round(accuracy) };
  }, [elapsed, input, startTime]);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="chip bg-warning/30 text-[#9A6B00]">⌨️ Stage 2 · 타이핑</span>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold">
              Typing Analysis · 타이핑 분석
            </h2>
          </div>
          <GameTimer seconds={seconds} active={phase === 'running'} done={phase === 'done'} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="WPM" value={phase === 'ready' ? '–' : liveStats.wpm} color="#6C63FF" />
          <Stat
            label="Accuracy"
            value={phase === 'ready' ? '–' : `${liveStats.accuracy}%`}
            color="#43D9A2"
          />
          <Stat
            label="Errors"
            value={phase === 'ready' ? '–' : liveStats.errors}
            color="#FF6584"
          />
        </div>

        <div className="mt-6 rounded-2xl bg-cloud p-4 md:p-6 leading-relaxed text-lg md:text-xl font-mono select-none">
          <SentenceDisplay input={input} sentence={SENTENCE} />
        </div>

        <AnimatePresence mode="wait">
          {phase === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <p className="text-ink/70">
                30초 동안 위의 문장을 가능한 한 정확하고 빠르게 입력하세요. 시작 버튼을 누르면 타이머가 시작됩니다.
              </p>
              <button onClick={start} className="btn-primary mt-4">
                ▶ Start Typing · 시작
              </button>
            </motion.div>
          )}

          {phase === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={onChange}
                onPaste={(e) => e.preventDefault()}
                autoComplete="off"
                spellCheck="false"
                className="w-full rounded-2xl border-2 border-primary/30 focus:border-primary outline-none px-4 py-3 font-mono text-lg bg-white"
                placeholder="여기에 입력하세요..."
              />
              <div className="mt-3 h-2 rounded-full bg-cloud overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-success via-warning to-accent"
                  style={{ width: `${(elapsed / DURATION_MS) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl bg-success/15 border border-success/40 p-4 text-success-800"
            >
              <p className="font-bold text-success">✅ 측정 완료! 다음 스테이지로 이동합니다…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function computeStats(finalInput, target, intervals, elapsedSec) {
  // Errors counted against the typed portion.
  let errors = 0;
  for (let i = 0; i < finalInput.length; i++) {
    if (finalInput[i] !== target[i]) errors++;
  }
  const typedLen = Math.max(1, finalInput.length);
  const errorRate = (errors / typedLen) * 100;

  const wordsTyped = finalInput.trim().length === 0 ? 0 : finalInput.trim().split(/\s+/).length;
  const wpm = (wordsTyped / Math.max(0.001, elapsedSec)) * 60;

  // Std dev of inter-key intervals
  let intervalStdDev = 0;
  if (intervals.length > 2) {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / intervals.length;
    intervalStdDev = Math.sqrt(variance);
  }

  return {
    wpm: Math.round(wpm * 10) / 10,
    errorRate: Math.round(errorRate * 10) / 10,
    intervalStdDev: Math.round(intervalStdDev),
    errors,
    typedChars: finalInput.length,
    elapsedSec: Math.round(elapsedSec * 10) / 10,
  };
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-white border border-cloud px-4 py-3">
      <div className="text-xs text-ink/50 uppercase tracking-wide">{label}</div>
      <div className="font-display text-2xl font-extrabold mt-1" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function GameTimer({ seconds, active, done }) {
  const danger = seconds <= 5 && active;
  return (
    <motion.div
      animate={danger ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: danger ? Infinity : 0 }}
      className={`px-4 py-2 rounded-2xl font-display font-extrabold text-2xl border-2 ${
        done
          ? 'border-success/40 text-success bg-success/10'
          : danger
            ? 'border-accent text-accent bg-accent/10'
            : 'border-primary/30 text-primary bg-primary/5'
      }`}
    >
      ⏱ {String(seconds).padStart(2, '0')}s
    </motion.div>
  );
}

function SentenceDisplay({ input, sentence }) {
  return (
    <div className="break-words">
      {sentence.split('').map((ch, i) => {
        const typed = input[i];
        let cls = 'text-ink/40';
        if (typed != null) {
          cls = typed === ch ? 'text-primary font-semibold' : 'text-accent underline';
        }
        if (i === input.length) cls += ' bg-primary/10 rounded';
        return (
          <span key={i} className={cls}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}
