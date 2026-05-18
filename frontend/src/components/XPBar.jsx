import { motion } from 'framer-motion';

const STAGES = [
  { key: 'survey', label: 'Survey', labelKo: '설문' },
  { key: 'typing', label: 'Typing', labelKo: '타이핑' },
  { key: 'mouse', label: 'Mouse', labelKo: '마우스' },
  { key: 'results', label: 'Results', labelKo: '결과' },
];

export default function XPBar({ currentStage, xp = 0 }) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);
  const progressPct =
    currentStage === 'home'
      ? 0
      : currentStage === 'results'
        ? 100
        : ((currentIdx + 0.5) / STAGES.length) * 100;

  return (
    <div className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-white/60">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <span className="font-display font-extrabold text-lg text-ink tracking-tight">
            WristQuest
          </span>
        </div>

        <div className="flex-1 hidden md:flex items-center gap-2">
          {STAGES.map((s, i) => {
            const reached = currentStage !== 'home' && i <= currentIdx;
            return (
              <div key={s.key} className="flex-1 flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 stage-pill ${
                    reached
                      ? 'bg-primary text-white'
                      : 'bg-cloud text-primary/60'
                  }`}
                >
                  <span>{i + 1}</span>
                  <span className="hidden lg:inline">{s.labelKo}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="flex-1 h-1 rounded-full bg-cloud overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: reached ? '100%' : '0%' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-quest">
          <span>⭐</span>
          <span>{xp} XP</span>
        </div>
      </div>
      {/* Slim mobile progress bar */}
      <div className="md:hidden h-1 bg-cloud">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
