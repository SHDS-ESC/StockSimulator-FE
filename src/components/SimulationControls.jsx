import React from "react";

const SimulationControls = ({ 
  symbol, 
  currentDate, 
  canAdvance, 
  onEndTurn, 
  simIndex, 
  simCandles 
}) => {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
        <strong>시뮬레이션</strong>
        <span className="muted">종목: {symbol || '-'}</span>
        <span className="muted">날짜: {currentDate || '-'}</span>
        <button className="btn" onClick={onEndTurn} disabled={!symbol || !canAdvance}>
          다음 날
        </button>
        <span className="muted">
          현재: {simIndex >= 0 && simCandles[simIndex]?.time?.year 
            ? `${simCandles[simIndex].time.year}-${String(simCandles[simIndex].time.month).padStart(2,'0')}-${String(simCandles[simIndex].time.day).padStart(2,'0')}` 
            : '-'}
        </span>
      </div>
    </div>
  );
};

export default SimulationControls;
