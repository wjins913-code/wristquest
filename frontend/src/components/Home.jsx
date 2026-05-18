import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchAssessments } from '../utils/api';
import { gradeFor } from '../utils/scoring';

const STAGE_CARDS = [
  {
    icon: '📝',
    title: 'Stage 1 · Survey',
    titleKo: '설문 평가',
    desc: 'PRWE 기반 손목 통증과 기능을 빠르게 체크합니다.',
    color: 'from-[#A29BFF]/20 to-[#6C63FF]/10',
  },
  {
    icon: '⌨️',
    title: 'Stage 2 · Typing',
    titleKo: '타이핑 분석',
    desc: '30초 타이핑으로 속도·정확도·리듬을 측정합니다.',
    color: 'from-[#FFD166]/30 to-[#FF6584]/10',
  },
  {
    icon: '🖱️',
    title: 'Stage 3 · Mouse',
    titleKo: '마우스 추적',
    desc: '반응속도와 미세 떨림으로 안정성을 측정합니다.',
    color: 'from-[#43D9A2]/25 to-[#6C63FF]/10',
  },
];

export default function Home({ onStart }) {
  const [previous, setPrevious] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAssessments(5)
      .then((data) => setPrevious(Array.isArray(data) ? data : []))
      .catch(() => setPrevious([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative grid md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="chip bg-primary/10 text-primary">
              <span>🎮</span> 손목 건강 게임 평가
            </span>
            <h1 className="mt-3 font-display text-4xl md:text-5xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-warning bg-clip-text text-transparent">
                WristQuest
              </span>
            </h1>
            <p className="mt-2 text-lg font-semibold text-ink">
              3분 만에 끝나는 손목 건강 퀘스트 🎯
            </p>
            <p className="mt-3 text-ink/70 leading-relaxed">
              설문·타이핑·마우스 세 가지 스테이지를 통해
              <br className="hidden md:block" /> 통증·기능·안정성 점수를 받아보고
              맞춤 운동 퀘스트를 받아보세요.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onStart}
                className="btn-primary text-base"
              >
                <span>▶</span> Start Assessment · 평가 시작
              </motion.button>
              <div className="flex items-center gap-2 text-sm text-ink/60">
                <span>⏱️ 약 3분</span>
                <span>·</span>
                <span>🔒 로컬 저장</span>
              </div>
            </div>
          </div>

          <div className="relative h-56 md:h-64">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center text-[160px] md:text-[200px] drop-shadow-xl"
            >
              💪
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-2 left-2 text-3xl"
            >
              ✨
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-3 right-4 text-3xl"
            >
              🏆
            </motion.div>
          </div>
        </div>
      </motion.section>

      <section className="mt-8 grid md:grid-cols-3 gap-4">
        {STAGE_CARDS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            className={`card !p-5 bg-gradient-to-br ${s.color}`}
          >
            <div className="text-4xl">{s.icon}</div>
            <div className="mt-3 font-display font-bold text-lg">{s.title}</div>
            <div className="text-sm font-semibold text-primary/80">{s.titleKo}</div>
            <p className="mt-2 text-sm text-ink/70">{s.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-xl font-bold">
            🗂️ Previous Results · 이전 기록
          </h2>
          {loaded && previous.length === 0 && (
            <span className="text-sm text-ink/50">
              아직 기록이 없어요. 첫 퀘스트를 시작해보세요!
            </span>
          )}
        </div>

        {loaded && previous.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {previous.map((a) => {
              const g = gradeFor(a.overall_score);
              const date = new Date(a.timestamp);
              return (
                <div key={a.id} className="quest-card">
                  <div className="flex items-center justify-between">
                    <span
                      className="chip text-white"
                      style={{ background: g.color }}
                    >
                      Grade {g.letter} {g.emoji}
                    </span>
                    <span className="text-xs text-ink/50">
                      {date.toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="mt-3 text-3xl font-display font-extrabold">
                    {Math.round(a.overall_score)}
                    <span className="text-base text-ink/40 font-bold"> /100</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-ink/70">
                    <Mini label="통증" value={a.pain_score} color="#FF6584" />
                    <Mini label="기능" value={a.function_score} color="#6C63FF" />
                    <Mini label="안정" value={a.stability_score} color="#43D9A2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value, color }) {
  return (
    <div className="rounded-xl bg-cloud px-2 py-1.5">
      <div className="text-[10px] text-ink/50">{label}</div>
      <div className="font-bold" style={{ color }}>
        {Math.round(value)}
      </div>
    </div>
  );
}
