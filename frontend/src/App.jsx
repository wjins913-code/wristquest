import { useState } from 'react';
import XPBar from './components/XPBar.jsx';
import Home from './components/Home.jsx';
import Survey from './components/Survey.jsx';
import TypingTest from './components/TypingTest.jsx';
import MouseTracking from './components/MouseTracking.jsx';
import Results from './components/Results.jsx';
import StageBreak from './components/StageBreak.jsx';
import StageTransition from './components/StageTransition.jsx';

const XP_REWARD = { survey: 120, typing: 160, mouse: 200 };

export default function App() {
  const [stage, setStage] = useState('home');
  const [xp, setXp] = useState(0);
  const [breakStage, setBreakStage] = useState(null); // which stage just finished
  const [scores, setScores] = useState({ pain: 0, function: 0, stability: 0 });
  const [raw, setRaw] = useState({ survey: null, typing: null, mouse: null });

  const goHome = () => {
    setStage('home');
    setXp(0);
    setScores({ pain: 0, function: 0, stability: 0 });
    setRaw({ survey: null, typing: null, mouse: null });
    setBreakStage(null);
  };

  const finishSurvey = ({ score, raw: surveyRaw }) => {
    setScores((s) => ({ ...s, pain: score }));
    setRaw((r) => ({ ...r, survey: surveyRaw }));
    setXp((x) => x + XP_REWARD.survey);
    setBreakStage({ key: 'survey', score, xp: XP_REWARD.survey });
  };

  const finishTyping = ({ score, raw: typingRaw }) => {
    setScores((s) => ({ ...s, function: score }));
    setRaw((r) => ({ ...r, typing: typingRaw }));
    setXp((x) => x + XP_REWARD.typing);
    setBreakStage({ key: 'typing', score, xp: XP_REWARD.typing });
  };

  const finishMouse = ({ score, raw: mouseRaw }) => {
    setScores((s) => ({ ...s, stability: score }));
    setRaw((r) => ({ ...r, mouse: mouseRaw }));
    setXp((x) => x + XP_REWARD.mouse);
    setBreakStage({ key: 'mouse', score, xp: XP_REWARD.mouse });
  };

  const continueFromBreak = () => {
    const finished = breakStage?.key;
    setBreakStage(null);
    if (finished === 'survey') setStage('typing');
    else if (finished === 'typing') setStage('mouse');
    else if (finished === 'mouse') setStage('results');
  };

  // The XP bar shows the *active* stage. While the break is showing, treat the next stage as active visually.
  const xpStage = breakStage
    ? breakStage.key === 'survey'
      ? 'typing'
      : breakStage.key === 'typing'
        ? 'mouse'
        : 'results'
    : stage;

  return (
    <div className="min-h-full">
      <XPBar currentStage={xpStage} xp={xp} />

      {breakStage ? (
        <StageBreak
          stage={breakStage.key}
          score={breakStage.score}
          xpEarned={breakStage.xp}
          onContinue={continueFromBreak}
        />
      ) : (
        <StageTransition stageKey={stage}>
          {stage === 'home' && <Home onStart={() => setStage('survey')} />}
          {stage === 'survey' && <Survey onComplete={finishSurvey} />}
          {stage === 'typing' && <TypingTest onComplete={finishTyping} />}
          {stage === 'mouse' && <MouseTracking onComplete={finishMouse} />}
          {stage === 'results' && (
            <Results scores={scores} raw={raw} onRestart={goHome} />
          )}
        </StageTransition>
      )}

      <footer className="py-8 text-center text-xs text-ink/40">
        🩺 WristQuest — 의학적 진단을 대체하지 않습니다. 통증이 지속되면 전문의와 상담하세요.
      </footer>
    </div>
  );
}
