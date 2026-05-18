import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#6C63FF', '#FF6584', '#43D9A2', '#FFD166', '#A29BFF'];

export default function Confetti({ count = 28 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        distance: 200 + Math.random() * 220,
        size: 6 + Math.random() * 8,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="confetti-dot"
          style={{
            left: `${d.left}%`,
            top: '40%',
            background: d.color,
            width: d.size,
            height: d.size,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: d.distance, opacity: 0, rotate: d.rotate }}
          transition={{ duration: 1.4, delay: d.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
