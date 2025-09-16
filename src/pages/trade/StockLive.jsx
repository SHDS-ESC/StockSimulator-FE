import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { TradeRealtimeWidget } from "../../components/UnifiedChart";
import axiosInstance from "../../util/axiosInstance";

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
    if (!s) { setErr('심볼 없음'); setPrice(null); setPrevClose(null); return; }
    const fetchFromRedis = async () => {
      try {
        const res = await axiosInstance.get(`/market/redis/stock/${s}`);
        const data = res?.data;
        if (!data) { setErr('데이터 없음'); return; }
        const cur = parseFloat(String(data.price || '').replace('$',''));
        const chg = parseFloat(String(data.change || '').replace('+',''));
        const prev = Number.isFinite(cur) && Number.isFinite(chg) ? (cur - chg) : null;
        setPrice(Number.isFinite(cur) ? cur : null);
        setPrevClose(Number.isFinite(prev) ? prev : null);
        setErr(null);
      } catch (_) {
        setErr('Redis에서 가격을 불러오지 못했습니다.');
      }
    };
    fetchFromRedis();
    // 자동 갱신은 스케줄러에 맡김: 주기 요청 제거
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


