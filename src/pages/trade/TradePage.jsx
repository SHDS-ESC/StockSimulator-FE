import { useState, useEffect } from "react";
import { TradeRealtimeWidget } from "./UnifiedChart";

function TickerPicker({ tickers, query, setQuery, onPick }) {
  const filtered = (() => {
    const q = String(query || '').trim().toUpperCase()
    const base = (tickers || []).map(t => ({ ticker: t, name: t }))
    return !q ? base : base.filter(it => (
      String(it.ticker).toUpperCase().includes(q) || String(it.name || '').toUpperCase().includes(q)
    ))
  })()
  return (
    <div className="row wrap" style={{ gap: 10 }}>
      <strong style={{ fontSize: 18 }}>Stock Chart</strong>
      <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="티커 검색" />
      <div className="row wrap" style={{ gap: 8 }}>
        {filtered.map(it => (
          <button key={it.ticker} className="btn" onClick={() => onPick(it.ticker)}>{it.ticker}</button>
        ))}
      </div>
    </div>
  )
}

export default function TradePage() {
  const [symbol, setSymbol] = useState("");
  const [tickers, setTickers] = useState([]);
  const [query, setQuery] = useState("");

  // 티커 목록 초기화
  useEffect(() => {
    setTickers(["AAPL","MSFT","NVDA","AMZN","TSLA","GOOGL","META","QQQ","SPY","KO"]);
  }, []);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <TickerPicker tickers={tickers} query={query} setQuery={setQuery} onPick={(t) => setSymbol(t)} />
      </div>

      <div style={{ marginTop: 8 }}>
        <TradeRealtimeWidget symbol={symbol || 'AAPL'} />
      </div>
    </div>
  );
}

