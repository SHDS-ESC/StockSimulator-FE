import React from "react";

const WatchlistPanel = ({ watchlist, onSymbolSelect }) => {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row wrap" style={{ gap: 8 }}>
        <span className="muted">관심 종목</span>
        <div className="row wrap" style={{ gap: 8 }}>
          {watchlist.map((t) => (
            <button key={t} className="btn" onClick={() => onSymbolSelect(t)}>
              {t}
            </button>
          ))}
          {watchlist.length === 0 && <span className="muted">관심 종목이 없습니다.</span>}
        </div>
      </div>
    </div>
  );
};

export default WatchlistPanel;
