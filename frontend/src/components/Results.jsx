import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { calculateOverall, gradeFor } from '../utils/scoring';
import { questsForGrade } from '../utils/quests';
import { saveAssessment } from '../utils/api';
import Confetti from './Confetti.jsx';

export default function Results({ scores, raw, onRestart }) {
  const overall = useMemo(
    () => calculateOverall(scores.pain, scores.function, scores.stability),
    [scores]
  );
  const grade = useMemo(() => gradeFor(overall), [overall]);
  const quests = useMemo(() => questsForGrade(grade.letter), [grade.letter]);

  const [revealed, setRevealed] = useState({ pain: 0, function: 0, stability: 0, overall: 0 });
  const [savedId, setSavedId] = useState(null);
  const [savingErr, setSavingErr] = useState(null);
  const [copied, setCopied] = useState(false);

  // Animated reveal of scores
  useEffect(() => {
    const targets = {
      pain: scores.pain,
      function: scores.function,
      stability: scores.stability,
      overall,
    };
    const start = performance.now();
    const dur = 1100;
    let raf;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setRevealed({
        pain: Math.round(targets.pain * eased),
        function: Math.round(targets.function * eased),
        stability: Math.round(targets.stability * eased),
        overall: Math.round(targets.overall * eased),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scores, overall]);

  // Save to backend once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await saveAssessment({
          pain_score: scores.pain,
          function_score: scores.function,
          stability_score: scores.stability,
          overall_score: overall,
          grade: grade.letter,
          survey_data: raw.survey,
          typing_data: raw.typing,
          mouse_data: raw.mouse,
        });
        if (!cancelled) setSavedId(res.id ?? null);
      } catch (e) {
        if (!cancelled) setSavingErr(e.message ?? String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const radarData = [
    { axis: 'Pain · 통증', value: scores.pain, fullMark: 100 },
    { axis: 'Function · 기능', value: scores.function, fullMark: 100 },
    { axis: 'Stability · 안정', value: scores.stability, fullMark: 100 },
  ];

  const onShare = async () => {
    const summary = `🎮 WristQuest Result
Grade: ${grade.letter} ${grade.emoji} (${grade.title} / ${grade.titleKo})
Overall: ${overall}/100
- Pain · 통증: ${Math.round(scores.pain)}
- Function · 기능: ${Math.round(scores.function)}
- Stability · 안정: ${Math.round(scores.stability)}
${grade.blurb}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 relative">
      <Confetti />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`card relative overflow-hidden bg-gradient-to-br ${grade.bg} text-white`}
      >
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="chip bg-white/25 text-white">🏆 Wrist Health Grade</span>
            <div className="mt-2 flex items-end gap-4">
              <motion.div
                initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.2 }}
                className="font-display text-7xl md:text-8xl font-extrabold drop-shadow-lg"
              >
                {grade.letter}
              </motion.div>
              <div className="pb-2">
                <div className="text-xl font-display font-bold">
                  {grade.title} {grade.emoji}
                </div>
                <div className="text-white/85">{grade.titleKo}</div>
              </div>
            </div>
            <p className="mt-3 text-white/90">{grade.blurb}</p>
            <div className="mt-5 flex items-end gap-3">
              <div className="font-display text-6xl font-extrabold leading-none">
                {revealed.overall}
              </div>
              <div className="pb-2 font-bold text-white/80">/ 100</div>
            </div>
          </div>

          <div className="h-64 md:h-72 bg-white/15 rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.4)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: 'white', fontSize: 12, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.3)"
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#ffffff"
                  fill="#ffffff"
                  fillOpacity={0.45}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        <ScoreCard
          label="Pain · 통증"
          score={revealed.pain}
          color="#FF6584"
          icon="❤️‍🩹"
        />
        <ScoreCard
          label="Function · 기능"
          score={revealed.function}
          color="#6C63FF"
          icon="⌨️"
        />
        <ScoreCard
          label="Stability · 안정"
          score={revealed.stability}
          color="#43D9A2"
          icon="🎯"
        />
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between mb-3">
          <h3 className="font-display text-xl font-bold">
            🗺️ Personalized Quests · 추천 운동
          </h3>
          <span className="chip bg-primary/10 text-primary">
            {quests.length} quests for Grade {grade.letter}
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((q, i) => (
            <motion.div
              key={q.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
              className="quest-card relative"
            >
              <div className="absolute top-3 right-3 chip bg-gradient-to-r from-warning to-accent text-white">
                +{q.xp} XP
              </div>
              <div className="text-3xl">{q.icon}</div>
              <h4 className="mt-2 font-display font-bold">{q.name}</h4>
              <div className="text-sm text-primary font-semibold">{q.nameKo}</div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-ink/70">
                <div className="rounded-lg bg-cloud px-2 py-1">
                  <span className="text-ink/40">Sets</span> · {q.sets}
                </div>
                <div className="rounded-lg bg-cloud px-2 py-1">
                  <span className="text-ink/40">Reps</span> · {q.reps}
                </div>
              </div>
              <p className="mt-3 text-sm text-ink/60 italic">{q.illustration}</p>
            </motion.div>
          ))}
        </div>
        {grade.letter === 'C' && (
          <div className="mt-4 rounded-2xl border-2 border-accent/40 bg-accent/10 p-4">
            <div className="font-display font-bold text-accent">🏥 전문의 상담 권장</div>
            <p className="text-sm text-ink/70 mt-1">
              현재 점수는 전문가 진단이 필요한 수준입니다. 정형외과 또는 수부 전문의 상담을 권장드려요.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-3 justify-between card !py-5">
        <div className="text-sm text-ink/70">
          {savedId ? (
            <>
              ✅ 결과가 저장되었습니다 ·{' '}
              <span className="font-mono text-primary">#{savedId}</span>
            </>
          ) : savingErr ? (
            <>⚠️ 저장 실패: {savingErr}</>
          ) : (
            <>💾 저장 중…</>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={onShare} className="btn-secondary">
            {copied ? '📋 복사됨!' : '🔗 Share Result · 결과 공유'}
          </button>
          <button onClick={onRestart} className="btn-primary">
            🔁 Retake Test · 다시 도전
          </button>
        </div>
      </section>
    </div>
  );
}

function ScoreCard({ label, score, color, icon }) {
  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-ink/50">{label}</span>
      </div>
      <div className="mt-3 font-display font-extrabold text-4xl" style={{ color }}>
        {score}
        <span className="text-ink/30 text-lg font-bold ml-1">/100</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-cloud overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
