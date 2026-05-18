// Scoring helpers shared across stages.

export function calculatePainScore(painAnswers, functionAnswers, lifestyle) {
  // PRWE: pain (5 items, 0-10) and function (5 items, 0-10). Total 0-100 raw.
  // Higher raw = more pain. We invert so the displayed score is "wrist health".
  const painSum = painAnswers.reduce((a, b) => a + b, 0); // 0-50
  const funcSum = functionAnswers.reduce((a, b) => a + b, 0); // 0-50
  const prweRaw = painSum + funcSum; // 0-100, higher = worse

  // Lifestyle penalty (0-20) — long typing, no exercise, heavy-use occupation.
  const typingPenalty = Math.min(10, Math.max(0, (lifestyle.typingHours - 2) * 1.2));
  const exercisePenalty = { daily: 0, '3-5': 2, '1-2': 5, none: 8 }[lifestyle.exercise] ?? 4;
  const occupationPenalty = {
    office: 4,
    developer: 6,
    creator: 5,
    student: 3,
    physical: 7,
    other: 3,
  }[lifestyle.occupation] ?? 3;
  const lifestylePenalty = Math.min(20, typingPenalty + exercisePenalty + occupationPenalty * 0.5);

  const combined = prweRaw * 0.85 + lifestylePenalty * 0.75;
  const health = Math.max(0, Math.min(100, 100 - combined));
  return Math.round(health);
}

export function calculateFunctionScore({ wpm, errorRate, intervalStdDev }) {
  // WPM target band: 30-80. Above 80 caps. Below 10 floors.
  const wpmComponent = Math.max(0, Math.min(100, ((wpm - 10) / 70) * 100));
  const errorComponent = Math.max(0, 100 - errorRate * 4); // 25% error => 0
  // Lower std dev = smoother typing. 80ms = great, 300ms = poor.
  const variancePoints = Math.max(0, 100 - Math.max(0, intervalStdDev - 60) * 0.55);

  const score = wpmComponent * 0.45 + errorComponent * 0.35 + variancePoints * 0.2;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateStabilityScore({ avgReactionMs, avgClickOffset, tracePathDeviation, traceCompletion }) {
  // Reaction: 350ms great, 900ms poor.
  const reactionPts = Math.max(0, Math.min(100, 100 - Math.max(0, avgReactionMs - 350) * 0.22));
  // Click offset: 0px perfect, 80px poor.
  const accuracyPts = Math.max(0, Math.min(100, 100 - avgClickOffset * 1.25));
  // Path deviation: 5px great, 40px poor.
  const tracePts = Math.max(0, Math.min(100, 100 - Math.max(0, tracePathDeviation - 5) * 2.8));
  // Completion is 0..1.
  const completionPts = traceCompletion * 100;

  const score =
    reactionPts * 0.3 + accuracyPts * 0.3 + tracePts * 0.3 + completionPts * 0.1;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function calculateOverall(pain, fn, stability) {
  return Math.round(pain * 0.35 + fn * 0.35 + stability * 0.3);
}

export function gradeFor(overall) {
  if (overall >= 90) {
    return {
      letter: 'S',
      title: 'Wrist Warrior',
      titleKo: '손목 전사',
      emoji: '💪',
      color: '#6C63FF',
      bg: 'from-[#A29BFF] to-[#6C63FF]',
      blurb: '완벽에 가까운 손목 상태! 이대로 유지하세요.',
    };
  }
  if (overall >= 75) {
    return {
      letter: 'A',
      title: 'Steady Handler',
      titleKo: '안정적인 손',
      emoji: '🙌',
      color: '#43D9A2',
      bg: 'from-[#7CE7C0] to-[#43D9A2]',
      blurb: '아주 좋아요! 가벼운 관리만 유지하면 충분합니다.',
    };
  }
  if (overall >= 60) {
    return {
      letter: 'B',
      title: 'Caution Zone',
      titleKo: '주의 구간',
      emoji: '⚠️',
      color: '#FFD166',
      bg: 'from-[#FFE099] to-[#FFB347]',
      blurb: '경고등이 켜졌어요. 강화 루틴으로 손목을 단단히!',
    };
  }
  return {
    letter: 'C',
    title: 'Rest & Recover',
    titleKo: '회복이 필요해요',
    emoji: '🏥',
    color: '#FF6584',
    bg: 'from-[#FF9AAB] to-[#FF6584]',
    blurb: '휴식과 회복이 필요한 시점입니다. 전문의 상담을 권장드려요.',
  };
}
