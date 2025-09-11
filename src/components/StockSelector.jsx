import React from "react";
import axiosInstance from "../util/axiosInstance";

const StockSelector = ({ 
  showPicker, 
  setShowPicker, 
  filteredTickers, 
  query, 
  setQuery, 
  onSymbolSelect,
  watchlist,
  toggleWatchlist 
}) => {
  if (!showPicker) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <strong style={{ fontSize: 16 }}>종목 선택</strong>
          <input 
            className="field" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="티커/회사명/섹터/산업 검색" 
            style={{ flex: 1 }} 
          />
          <button className="btn" onClick={() => setShowPicker(false)}>닫기</button>
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto', maxHeight: '60vh' }}>
          <div className="table-head">
            <span>티커</span>
            <span>회사명</span>
            <span>섹터</span>
            <span>산업</span>
            <span>즐겨찾기</span>
          </div>
          {filteredTickers.map((it) => (
            <div key={it.ticker} className="table-row"
                 onClick={() => { 
                   const t = String(it.ticker || '').toUpperCase(); 
                   onSymbolSelect(t); 
                   setShowPicker(false); 
                 }}>
              <span style={{ fontWeight: 600 }}>{it.ticker}</span>
              <span className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.name}
              </span>
              <span className="chip">{it.sector || '-'}</span>
              <span className="chip">{it.industry || '-'}</span>
              <button
                className="btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchlist(it.ticker);
                }}
              >
                {watchlist.includes(it.ticker) ? '★' : '☆'}
              </button>
            </div>
          ))}
          {filteredTickers.length === 0 && (
            <div style={{ padding: 12 }} className="muted">검색 결과 없음</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockSelector;
