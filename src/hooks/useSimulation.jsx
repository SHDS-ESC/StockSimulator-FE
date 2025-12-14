import { useState, useMemo } from "react";

export const useSimulation = () => {
  const [simCandles, setSimCandles] = useState([]);
  const [simIndex, setSimIndex] = useState(-1);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showEndPreview, setShowEndPreview] = useState(false);

  const currentDate = useMemo(() => {
    const bar = (simIndex >= 0) ? simCandles[simIndex] : null;
    if (!bar?.time) return null;
    const y = bar.time.year, m = bar.time.month, d = bar.time.day;
    if (![y, m, d].every(Number.isFinite)) return null;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }, [simCandles, simIndex]);

  const canAdvance = simCandles && simCandles.length > 0 && simIndex < (simCandles.length - 1);

  const handleEndTurn = () => {
    if (!canAdvance) return;
    setShowEndPreview(true);
  };

  const confirmEndTurn = () => {
    setShowEndPreview(false);
    setSimIndex((i) => {
      const next = i + 1;
      setVisibleCount((c) => Math.max(c, next + 1));
      return next;
    });
  };

  const cancelEndTurn = () => setShowEndPreview(false);

  const updateSimulation = (candles, selYear, selMonth, selDay) => {
    setSimCandles(candles || []);
    const idxFinder = (arr) => {
      if (!Array.isArray(arr)) return -1;
      const target = Date.UTC(selYear, selMonth - 1, selDay, 23, 59, 59) / 1000;
      let lastIdx = -1;
      for (let i = 0; i < arr.length; i++) {
        const t = arr[i]?.time;
        const epoch = (t && typeof t === 'object') ? Date.UTC(t.year, t.month - 1, t.day, 0, 0, 0) / 1000 : Number(t);
        if (Number.isFinite(epoch) && epoch <= target) lastIdx = i;
      }
      if (lastIdx >= 0) return lastIdx;
      const monthOnly = arr.findIndex(c => c?.time && c.time.month === selMonth && c.time.day === 1);
      if (monthOnly >= 0) return monthOnly;
      return arr.findIndex(c => c?.time && c.time.day === 1);
    };
    const startIdx = (candles && candles.length) ? Math.max(0, Math.min(candles.length - 1, idxFinder(candles))) : -1;
    setSimIndex(startIdx);
    if (Array.isArray(candles)) {
      setVisibleCount(startIdx >= 0 ? startIdx + 1 : 0);
    } else {
      setVisibleCount(0);
    }
  };

  return {
    simCandles,
    simIndex,
    visibleCount,
    showEndPreview,
    currentDate,
    canAdvance,
    handleEndTurn,
    confirmEndTurn,
    cancelEndTurn,
    updateSimulation
  };
};
