import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { calculateStabilityScore } from '../utils/scoring';

const TARGET_COUNT = 5;
const TARGET_LIFETIME_MS = 1500;
const TARGET_RADIUS = 32; // px

export default function MouseTracking({ onComplete }) {
  const [task, setTask] = useState('intro'); // intro | targets | trace-intro | trace | done
  const [targetIdx, setTargetIdx] = useState(0);
  const [targetPos, setTargetPos] = useState(null);
  const [targetStart, setTargetStart] = useState(null);
  const arenaRef = useRef(null);
  const clicksRef = useRef([]); // { offset, reaction, hit }

  // Path tracing refs
  const canvasRef = useRef(null);
  const pathPointsRef = useRef([]);
  const samplesRef = useRef([]); // {x,y} from user mouse
  const [tracing, setTracing] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);

  // Spawn target — retries until arenaRef is mounted (AnimatePresence delays DOM insertion)
  useEffect(() => {
    if (task !== 'targets') return;
    if (targetIdx >= TARGET_COUNT) {
      setTask('trace-intro');
      return;
    }

    let cleanup = () => {};

    const trySpawn = () => {
      const rect = arenaRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) {
        // Arena not in DOM yet — wait one frame and retry
        const retry = setTimeout(trySpawn, 80);
        cleanup = () => clearTimeout(retry);
        return;
      }
      const pad = TARGET_RADIUS + 12;
      const x = Math.random() * (rect.width - pad * 2) + pad;
      const y = Math.random() * (rect.height - pad * 2) + pad;
      setTargetPos({ x, y });
      setTargetStart(performance.now());
      const expire = setTimeout(() => {
        // Miss — target expired
        clicksRef.current.push({ hit: false, offset: 999, reaction: TARGET_LIFETIME_MS });
        setTargetIdx((i) => i + 1);
      }, TARGET_LIFETIME_MS);
      cleanup = () => clearTimeout(expire);
    };

    trySpawn();
    return () => cleanup();
  }, [task, targetIdx]);

  const onArenaClick = (e) => {
    if (task !== 'targets' || !targetPos || !targetStart) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = cx - targetPos.x;
    const dy = cy - targetPos.y;
    const offset = Math.sqrt(dx * dx + dy * dy);
    const reaction = performance.now() - targetStart;
    const hit = offset <= TARGET_RADIUS + 8;
    clicksRef.current.push({ hit, offset, reaction });
    setTargetIdx((i) => i + 1);
  };

  // ---- Trace task ----
  const PATH_WIDTH = 600;
  const PATH_HEIGHT = 220;

  const buildPath = () => {
    const points = [];
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * PATH_WIDTH;
      const y =
        PATH_HEIGHT / 2 + Math.sin((i / 200) * Math.PI * 2 * 1.5) * (PATH_HEIGHT / 2 - 30);
      points.push({ x, y });
    }
    return points;
  };

  useEffect(() => {
    if (task !== 'trace') return;
    pathPointsRef.current = buildPath();
    samplesRef.current = [];
    drawPath();
    setTraceProgress(0);
  }, [task]);

  const drawPath = () => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const ctx = cnv.getContext('2d');
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    // Soft track
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(108,99,255,0.10)';
    drawLine(ctx, pathPointsRef.current);

    // Ideal path
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6C63FF';
    drawLine(ctx, pathPointsRef.current);

    // User samples
    if (samplesRef.current.length > 1) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#FF6584';
      drawLine(ctx, samplesRef.current);
    }
  };

  function drawLine(ctx, pts) {
    if (pts.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  const onCanvasDown = (e) => {
    if (task !== 'trace') return;
    setTracing(true);
    samplesRef.current = [];
    addSampleFromEvent(e);
  };

  const onCanvasMove = (e) => {
    if (task !== 'trace' || !tracing) return;
    addSampleFromEvent(e);
    drawPath();

    const last = samplesRef.current[samplesRef.current.length - 1];
    const pct = Math.max(0, Math.min(1, last.x / PATH_WIDTH));
    setTraceProgress(pct);
    if (pct >= 0.98) finishTrace();
  };

  const onCanvasUp = () => {
    if (task !== 'trace') return;
    setTracing(false);
    if (samplesRef.current.length > 10) finishTrace();
  };

  const addSampleFromEvent = (e) => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const rect = cnv.getBoundingClientRect();
    const scaleX = cnv.width / rect.width;
    const scaleY = cnv.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    samplesRef.current.push({ x, y });
  };

  const finishTrace = () => {
    if (task !== 'trace') return;
    const samples = samplesRef.current;
    const path = pathPointsRef.current;

    // For each sample, find nearest path point and measure deviation.
    let totalDev = 0;
    let n = 0;
    for (const s of samples) {
      // path is dense, sample by x bucket for speed
      const idx = Math.max(0, Math.min(path.length - 1, Math.round((s.x / PATH_WIDTH) * (path.length - 1))));
      const p = path[idx];
      const dx = s.x - p.x;
      const dy = s.y - p.y;
      totalDev += Math.sqrt(dx * dx + dy * dy);
      n++;
    }
    const avgDev = n > 0 ? totalDev / n : 100;
    const completion = samples.length === 0 ? 0 : Math.min(1, samples[samples.length - 1].x / PATH_WIDTH);

    const clicks = clicksRef.current;
    const reactions = clicks.map((c) => c.reaction);
    const offsets = clicks.map((c) => c.offset);
    const avgReactionMs = reactions.reduce((a, b) => a + b, 0) / Math.max(1, reactions.length);
    const avgClickOffset = offsets.reduce((a, b) => a + b, 0) / Math.max(1, offsets.length);
    const hits = clicks.filter((c) => c.hit).length;

    const score = calculateStabilityScore({
      avgReactionMs,
      avgClickOffset,
      tracePathDeviation: avgDev,
      traceCompletion: completion,
    });

    setTask('done');
    onComplete({
      score,
      raw: {
        clicks,
        hits,
        avgReactionMs: Math.round(avgReactionMs),
        avgClickOffset: Math.round(avgClickOffset),
        traceDeviation: Math.round(avgDev * 10) / 10,
        traceCompletion: Math.round(completion * 100) / 100,
        sampleCount: samples.length,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="chip bg-success/20 text-[#0E8C66]">🖱️ Stage 3 · 마우스</span>
            <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold">
              Mouse Tracking · 마우스 추적
            </h2>
          </div>
          <div className="text-right text-sm text-ink/60">
            {task === 'targets' && (
              <span>
                🎯 Task 1 · {Math.min(targetIdx + 1, TARGET_COUNT)} / {TARGET_COUNT}
              </span>
            )}
            {task === 'trace' && <span>🌊 Task 2 · 경로 추적</span>}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {task === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <h3 className="font-display font-bold text-lg">Task 1 · 움직이는 표적 클릭</h3>
              <p className="text-ink/70 mt-1">
                5개의 표적이 각각 1.5초 동안 나타납니다. 사라지기 전 정중앙을 클릭하세요!
              </p>
              <button className="btn-primary mt-4" onClick={() => setTask('targets')}>
                ▶ Start Task 1
              </button>
            </motion.div>
          )}

          {task === 'targets' && (
            <motion.div
              key="targets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <div
                ref={arenaRef}
                onClick={onArenaClick}
                className="relative w-full h-[340px] md:h-[400px] rounded-3xl bg-gradient-to-br from-cloud to-white border-2 border-dashed border-primary/30 overflow-hidden cursor-crosshair select-none"
              >
                <AnimatePresence>
                  {targetPos && (
                    <motion.div
                      key={`t-${targetIdx}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        left: targetPos.x - TARGET_RADIUS,
                        top: targetPos.y - TARGET_RADIUS,
                        width: TARGET_RADIUS * 2,
                        height: TARGET_RADIUS * 2,
                      }}
                      className="absolute rounded-full bg-gradient-to-br from-accent to-primary shadow-pop flex items-center justify-center"
                    >
                      <div className="w-1/2 h-1/2 rounded-full bg-white/80" />
                      <div className="absolute w-1.5 h-1.5 rounded-full bg-accent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-3 text-sm text-ink/60 text-center">
                표적이 사라지기 전에 클릭! 정확도와 반응 속도가 측정됩니다.
              </p>
            </motion.div>
          )}

          {task === 'trace-intro' && (
            <motion.div
              key="ti"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <h3 className="font-display font-bold text-lg">Task 2 · 경로 따라 그리기</h3>
              <p className="text-ink/70 mt-1">
                보라색 곡선을 마우스로 따라 그려보세요. 떨림과 이탈 정도가 측정됩니다.
              </p>
              <button className="btn-primary mt-4" onClick={() => setTask('trace')}>
                ▶ Start Task 2
              </button>
            </motion.div>
          )}

          {task === 'trace' && (
            <motion.div
              key="trace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6"
            >
              <div className="relative w-full overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-white">
                <canvas
                  ref={canvasRef}
                  width={PATH_WIDTH}
                  height={PATH_HEIGHT}
                  onPointerDown={onCanvasDown}
                  onPointerMove={onCanvasMove}
                  onPointerUp={onCanvasUp}
                  onPointerLeave={onCanvasUp}
                  className="block w-full touch-none cursor-crosshair"
                  style={{ aspectRatio: `${PATH_WIDTH} / ${PATH_HEIGHT}` }}
                />
              </div>
              <div className="mt-3 h-2 rounded-full bg-cloud overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${Math.round(traceProgress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-ink/60 text-center">
                왼쪽 끝에서 시작 → 오른쪽 끝까지 따라가세요.
              </p>
            </motion.div>
          )}

          {task === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl bg-success/15 border border-success/40 p-4"
            >
              <p className="font-bold text-success">✅ 모든 스테이지 완료! 결과를 계산합니다…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
