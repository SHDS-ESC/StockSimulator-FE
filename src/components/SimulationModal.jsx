import React from "react";

const SimulationModal = ({ 
  showEndPreview, 
  onCancel, 
  onConfirm, 
  simIndex, 
  simCandles 
}) => {
  if (!showEndPreview) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ minWidth: 420 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong>다음 날로 진행</strong>
          <button className="btn" onClick={onCancel}>닫기</button>
        </div>
        <div className="muted" style={{ marginBottom: 8 }}>
          {simIndex >= 0 && simCandles[simIndex]?.time?.year 
            ? `기준일: ${simCandles[simIndex].time.year}-${String(simCandles[simIndex].time.month).padStart(2,'0')}-${String(simCandles[simIndex].time.day).padStart(2,'0')}` 
            : '-'}
        </div>
        <div className="muted" style={{ marginBottom: 10 }}>
          다음 날로 시뮬레이션을 진행하시겠습니까?
        </div>
        <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel}>취소</button>
          <button className="btn brand" onClick={onConfirm}>다음 날로 진행</button>
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;
