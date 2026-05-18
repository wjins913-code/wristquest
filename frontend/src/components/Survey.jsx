import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { calculatePainScore } from '../utils/scoring';

const PAIN_QUESTIONS = [
  { id: 'p1', q: 'Pain at rest', ko: '쉬고 있을 때의 통증' },
  { id: 'p2', q: 'Pain during a repeated wrist motion', ko: '손목을 반복 사용할 때의 통증' },
  { id: 'p3', q: 'Pain when lifting a heavy object', ko: '무거운 물건을 들 때의 통증' },
  { id: 'p4', q: 'Worst pain in the past week', ko: '지난 한 주 가장 심했던 통증' },
  { id: 'p5', q: 'How often does pain occur?', ko: '통증이 얼마나 자주 나타나나요?' },
];

const FUNCTION_QUESTIONS = [
  { id: 'f1', q: 'Turn a doorknob', ko: '문 손잡이 돌리기' },
  { id: 'f2', q: 'Cut food with a knife', ko: '칼로 음식 자르기' },
  { id: 'f3', q: 'Fasten buttons', ko: '단추 채우기' },
  { id: 'f4', q: 'Use the wrist for personal care', ko: '개인 위생에 손목 쓰기' },
  { id: 'f5', q: 'Carry a 5kg object', ko: '5kg 정도의 물건 들고 가기' },
];

const PAIN_EMOJI = ['😄', '🙂', '😌', '😐', '😕', '😟', '😣', '😖', '😫', '😩', '😭'];
const FUNC_EMOJI = ['💪', '👍', '✅', '🙂', '😐', '😕', '⚠️', '😣', '😖', '🆘', '🚫'];

const LIFESTYLE_EXERCISE = [
  { value: 'daily', label: '매일 운동', emoji: '🔥' },
  { value: '3-5', label: '주 3-5회', emoji: '💪' },
  { value: '1-2', label: '주 1-2회', emoji: '🙂' },
  { value: 'none', label: '거의 안 함', emoji: '🛋️' },
];

const LIFESTYLE_OCCUPATION = [
  { value: 'office', label: '사무직', emoji: '💼' },
  { value: 'developer', label: '개발자', emoji: '👨‍💻' },
  { value: 'creator', label: '크리에이터', emoji: '🎨' },
  { value: 'student', label: '학생', emoji: '🎓' },
  { value: 'physical', label: '신체노동', emoji: '🔧' },
  { value: 'other', label: '기타', emoji: '✨' },
];

export default function Survey({ onComplete }) {
  const allQuestions = useMemo(
    () => [
      ...PAIN_QUESTIONS.map((q) => ({ ...q, kind: 'pain' })),
      ...FUNCTION_QUESTIONS.map((q) => ({ ...q, kind: 'function' })),
      { id: 'typing', kind: 'lifestyle-slider', q: 'Daily typing hours', ko: '하루 타이핑 시간 (시간)' },
      { id: 'exercise', kind: 'lifestyle-choice', q: 'Exercise frequency', ko: '운동 빈도', options: LIFESTYLE_EXERCISE },
      { id: 'occupation', kind: 'lifestyle-choice', q: 'Occupation type', ko: '직업 유형', options: LIFESTYLE_OCCUPATION },
    ],
    []
  );

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({
    pain: {},
    function: {},
    typingHours: 4,
    exercise: null,
    occupation: null,
  });

  const total = allQuestions.length;
  const current = allQuestions[idx];
  const progress = ((idx + 1) / total) * 100;

  const valueFor = (q) => {
    if (q.kind === 'pain') return answers.pain[q.id] ?? 0;
    if (q.kind === 'function') return answers.function[q.id] ?? 0;
    if (q.id === 'typing') return answers.typingHours;
    if (q.id === 'exercise') return answers.exercise;
    if (q.id === 'occupation') return answers.occupation;
    return null;
  };

  const canAdvance = (() => {
    if (current.kind === 'pain' || current.kind === 'function')
      return valueFor(current) !== null && valueFor(current) !== undefined;
    if (current.id === 'typing') return true;
    return valueFor(current) !== null;
  })();

  const setPain = (id, v) => setAnswers((a) => ({ ...a, pain: { ...a.pain, [id]: v } }));
  const setFn = (id, v) =>
    setAnswers((a) => ({ ...a, function: { ...a.function, [id]: v } }));

  const next = () => {
    if (idx < total - 1) {
      setIdx(idx + 1);
      return;
    }
    finish();
  };

  const back = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  const finish = () => {
    const painArr = PAIN_QUESTIONS.map((q) => answers.pain[q.id] ?? 0);
    const fnArr = FUNCTION_QUESTIONS.map((q) => answers.function[q.id] ?? 0);
    const lifestyle = {
      typingHours: answers.typingHours,
      exercise: answers.exercise ?? 'none',
      occupation: answers.occupation ?? 'other',
    };
    const painScore = calculatePainScore(painArr, fnArr, lifestyle);
    onComplete({
      score: painScore,
      raw: {
        pain: answers.pain,
        function: answers.function,
        lifestyle,
        painArr,
        fnArr,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <span className="chip bg-primary/10 text-primary">📝 Stage 1 · 설문</span>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold">
              Wrist Survey · 손목 설문
            </h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink/50">진행도</div>
            <div className="font-display font-extrabold text-2xl text-primary">
              {idx + 1}
              <span className="text-ink/30 text-lg">/{total}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-3 rounded-full bg-cloud overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="mt-8 min-h-[260px]"
          >
            {(current.kind === 'pain' || current.kind === 'function') && (
              <ScaleQuestion
                question={current}
                value={
                  current.kind === 'pain'
                    ? answers.pain[current.id] ?? 0
                    : answers.function[current.id] ?? 0
                }
                onChange={(v) =>
                  current.kind === 'pain' ? setPain(current.id, v) : setFn(current.id, v)
                }
                touched={
                  current.kind === 'pain'
                    ? current.id in answers.pain
                    : current.id in answers.function
                }
              />
            )}

            {current.kind === 'lifestyle-slider' && (
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Lifestyle · 생활습관
                </p>
                <h3 className="mt-1 font-display font-bold text-xl">
                  {current.q}
                </h3>
                <p className="text-ink/60">{current.ko}</p>

                <div className="mt-8 flex items-center justify-center">
                  <div className="text-5xl font-display font-extrabold text-primary">
                    {answers.typingHours}
                    <span className="text-xl text-ink/40 font-bold ml-1">h</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={answers.typingHours}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, typingHours: Number(e.target.value) }))
                  }
                  className="quest-slider mt-6"
                />
                <div className="mt-2 flex justify-between text-xs text-ink/50">
                  <span>0h 😌</span>
                  <span>7h 💻</span>
                  <span>14h+ 🥵</span>
                </div>
              </div>
            )}

            {current.kind === 'lifestyle-choice' && (
              <ChoiceQuestion
                question={current}
                value={
                  current.id === 'exercise' ? answers.exercise : answers.occupation
                }
                onChange={(v) =>
                  setAnswers((a) => ({
                    ...a,
                    [current.id === 'exercise' ? 'exercise' : 'occupation']: v,
                  }))
                }
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={idx === 0}
            className="btn-secondary"
          >
            ← Back
          </button>
          <button onClick={next} disabled={!canAdvance} className="btn-primary">
            {idx === total - 1 ? '결과 계산 →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScaleQuestion({ question, value, onChange, touched }) {
  const kindLabel = question.kind === 'pain' ? 'Pain · 통증' : 'Function · 기능';
  const emojis = question.kind === 'pain' ? PAIN_EMOJI : FUNC_EMOJI;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {kindLabel}
      </p>
      <h3 className="mt-1 font-display font-bold text-xl">{question.q}</h3>
      <p className="text-ink/60">{question.ko}</p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <span className="text-4xl">{emojis[value] ?? emojis[0]}</span>
        <div>
          <div className="text-5xl font-display font-extrabold text-primary leading-none">
            {touched ? value : '–'}
          </div>
          <div className="text-xs text-ink/50">/ 10</div>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="quest-slider mt-6"
      />
      <div className="mt-2 flex justify-between text-xs text-ink/50">
        <span>0 {question.kind === 'pain' ? '없음' : '쉬움'}</span>
        <span>5</span>
        <span>10 {question.kind === 'pain' ? '극심' : '불가'}</span>
      </div>
    </div>
  );
}

function ChoiceQuestion({ question, value, onChange }) {
  return (
    <div>
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
        Lifestyle · 생활습관
      </p>
      <h3 className="mt-1 font-display font-bold text-xl">{question.q}</h3>
      <p className="text-ink/60">{question.ko}</p>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {question.options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`rounded-2xl p-4 text-left border-2 transition active:scale-95 ${
                active
                  ? 'border-primary bg-primary/10 shadow-quest'
                  : 'border-cloud bg-white hover:border-primary/30'
              }`}
            >
              <div className="text-2xl">{opt.emoji}</div>
              <div className="mt-1 font-semibold text-sm">{opt.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
