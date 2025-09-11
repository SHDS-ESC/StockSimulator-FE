import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { TradeRealtimeWidget } from "./UnifiedChart";

export default function StockLive() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const s = String(symbol || '').toUpperCase();
  const [price, setPrice] = useState(null);
  const [prevClose, setPrevClose] = useState(null);
  const [err, setErr] = useState(null);

  const change = useMemo(() => {
    if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(prevClose))) return null;
    return Number(price) - Number(prevClose);
  }, [price, prevClose]);
  const changePct = useMemo(() => {
    if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(prevClose)) || Number(prevClose) === 0) return null;
    return (Number(price) / Number(prevClose) - 1) * 100;
  }, [price, prevClose]);

  useEffect(() => {
    let timer = null;
    const API = import.meta.env.VITE_QUOTE_API;
    if (!API || !s) { setErr('API 미설정 또는 심볼 없음'); setPrice(null); setPrevClose(null); return; }
    const fetchOnce = async () => {
      try {
        let url = API;
        if (url.includes('{symbol}')) {
          url = url.replace('{symbol}', encodeURIComponent(s));
        } else if (url.includes('?')) {
          url = `${url}&symbol=${encodeURIComponent(s)}`;
        } else {
          url = `${url}?symbol=${encodeURIComponent(s)}`;
        }
        // 불필요한 Content-Type 헤더를 제거하여 CORS preflight를 방지
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        // 다양한 포맷 대응 (finnhub, alphavantage, 임의 백엔드 등)
        let cur = null, prev = null;
        if (data && typeof data === 'object') {
          if (Number.isFinite(Number(data.c)) || Number.isFinite(Number(data.pc))) { // finnhub
            cur = Number(data.c);
            prev = Number(data.pc);
          } else if (data['Global Quote']) { // alpha vantage
            cur = Number(data['Global Quote']['05. price']);
            prev = Number(data['Global Quote']['08. previous close']);
          } else if (Number.isFinite(Number(data.price)) || Number.isFinite(Number(data.prevClose))) {
            cur = Number(data.price); prev = Number(data.prevClose);
          } else if (data.quote) {
            cur = Number(data.quote.price); prev = Number(data.quote.prevClose);
          }
        }
        if (Number.isFinite(cur)) setPrice(cur); else setPrice(null);
        if (Number.isFinite(prev)) setPrevClose(prev); else setPrevClose(null);
        setErr(null);
      } catch (e) {
        setErr('가격을 불러오지 못했습니다.');
      }
    };
    fetchOnce();
    timer = setInterval(fetchOnce, 5000);
    return () => { if (timer) clearInterval(timer); };
  }, [s]);
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
          <strong style={{ fontSize: 18 }}>{s || 'LIVE'}</strong>
          <button className="btn" onClick={() => navigate(-1)}>뒤로</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">현재가</span>
          <strong>{Number.isFinite(Number(price)) ? Number(price).toFixed(2) : '-'}</strong>
          <span className="muted">전일대비</span>
          <span style={{ color: (change ?? 0) >= 0 ? '#26a69a' : '#ef5350' }}>
            {Number.isFinite(Number(change)) ? `${change.toFixed(2)} (${Number(changePct).toFixed(2)}%)` : '-'}
          </span>
          {err && <span className="muted">{err}</span>}
        </div>
      </div>
      <div style={{ height: 600 }}>
        <TradeRealtimeWidget symbol={s} />
      </div>
    </div>
  );
}


