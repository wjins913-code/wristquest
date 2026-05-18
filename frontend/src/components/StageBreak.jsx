import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Confetti from './Confetti.jsx';

export default function StageBreak({ stage, score, xpEarned, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2400);
    return () => clearTimeout(t);
  }, [onContinue]);

  const messages = {
    survey: {
      title: 'Stage 1 Complete! 🎉',
      ko: '설문 완료!',
      msg: 'Great job! 당신의 손목 이야기를 들었어요. 다음은 타이핑 챌린지입니다.',
      icon: '📝',
    },
    typing: {
      title: 'Stage 2 Complete! ⚡',
      ko: '타이핑 완료!',
      msg: 'Smooth keys! 이제 마지막, 마우스 정밀 컨트롤이 남았어요.',
      icon: '⌨️',
    },
    mouse: {
      title: 'All Stages Complete! 🏆',
      ko: '모든 스테이지 완료!',
      msg: '수고하셨어요! 결과를 분석하고 있어요…',
      icon: '🖱️',
    },
  };
  const m = messages[stage];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center relative">
      <Confetti count={24} />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="card"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2 }}
          className="text-7xl"
        >
          {m.icon}
        </motion.div>
        <h2 className="mt-4 font-display text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {m.title}
        </h2>
        <div className="mt-1 font-semibold text-primary">{m.ko}</div>
        <p className="mt-3 text-ink/70">{m.msg}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="chip bg-primary/10 text-primary">
            Score · {score}
          </div>
          <div className="chip bg-gradient-to-r from-warning to-accent text-white">
            +{xpEarned} XP
          </div>
        </div>
        <div className="mt-6 text-xs text-ink/40">자동으로 다음 단계로 이동합니다…</div>
      </motion.div>
    </div>
  );
}
