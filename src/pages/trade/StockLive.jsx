import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import UnifiedChart, { TradeRealtimeWidget } from "../../components/UnifiedChart";
import axios from "../../util/axiosInstance";
import axiosInstance from "../../util/axiosInstance";
import { Button } from "@/components/ui/button";
import useDateStore from "@/store/useDateStore";
import useLoginStore from "@/store/useLoginStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function StockLive() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const s = String(symbol || "").toUpperCase();
  const [price, setPrice] = useState(null);
  const [prevClose, setPrevClose] = useState(null);
  const [err, setErr] = useState(null);
  const { currentDate, setCurrentDate, showSkipNotice, clearSkipNotice } = useDateStore();
  const { lastProfileId } = useLoginStore();
  const [quantity, setQuantity] = useState(0);
  const [trade, setTrade] = useState("");
  const [executedQty, setExecutedQty] = useState(0); // 거래된 값

  // 매수/매도 로직
  const handleUpdateStockAmount = async (type, quantity) => {
    try {
      const isoDate =
        currentDate instanceof Date
          ? currentDate.toISOString().slice(0, 10)
          : currentDate;
      await axiosInstance.post(
        `offer/update`,
        {
          price: price,
          offerDate: isoDate,
          usersProfileId: lastProfileId,
          stock: s,
          type: type,
          quantity: quantity,
        },
        { withCredentials: true }
      );

      if (type === "BUY") {
        setTrade("매수");
      } else {
        setTrade("매도");
      }
      setExecutedQty(quantity); // ✅ 거래된 수량 저장
      setQuantity(0);
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  };

  // 프로필의 타임라인 정보: HomePage에서 localStorage("newProfile")에 저장됨
  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("newProfile") || "null");
    } catch (_) {
      return null;
    }
  }, [lastProfileId]);

  // 실시간 여부: timelineId === 9 과 동일하게 판단 (Stocks.jsx와 일치)
  const isRealtime = useMemo(() => {
    if (profile?.timelineId != null) {
      return Number(profile.timelineId) === 9;
    }
    return false;
  }, [profile?.timelineId]);
  const isHistorical = !isRealtime;

  // 과거 모드일 때 사용할 시뮬레이션 날짜
  const simDate = useMemo(() => {
    if (!isHistorical) return null;
    const dateToUse = currentDate || profile?.timelineFrom;
    if (!dateToUse) return null;
    const d = new Date(dateToUse);
    if (Number.isNaN(d.getTime())) return null;
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }, [isHistorical, currentDate, profile?.timelineFrom, lastProfileId]);

  const dateKey = useMemo(() => {
    if (!isHistorical || !simDate) return null;
    const y = String(simDate.year);
    const m = String(simDate.month).padStart(2, "0");
    const d = String(simDate.day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [isHistorical, simDate?.year, simDate?.month, simDate?.day]);

  const change = useMemo(() => {
    if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(prevClose)))
      return null;
    return Number(price) - Number(prevClose);
  }, [price, prevClose]);
  const changePct = useMemo(() => {
    if (
      !Number.isFinite(Number(price)) ||
      !Number.isFinite(Number(prevClose)) ||
      Number(prevClose) === 0
    )
      return null;
    return (Number(price) / Number(prevClose) - 1) * 100;
  }, [price, prevClose]);

  const [showModal, setShowModal] = useState(false);

  const handleModalClosed = () => {
    setShowModal(false);
    setQuantity(0);
  };

  // 가격/등락률 계산: 과거는 스냅샷(/db/snapshot)과 동일 소스 사용, 실시간은 Redis
  useEffect(() => {
    let active = true;

    async function fetchHistorical() {
      if (!s || !isHistorical || !dateKey) return;
      try {
        const resp = await axios.get("/db/snapshot", { params: { date: dateKey, symbols: s, page: 1, size: 1 } });
        const rows = Array.isArray(resp?.data?.rows) ? resp.data.rows : [];
        const effectiveDate = String(resp?.data?.effectiveDate || '') || null;
        if (effectiveDate && effectiveDate !== dateKey) {
          showSkipNotice({ from: dateKey, to: effectiveDate, skipped: Number(resp?.data?.skippedDays || 0) });
          setTimeout(() => clearSkipNotice(), 2500);
          setCurrentDate(effectiveDate);
          return;
        }
        const row = rows.find((r) => String(r?.symbol || "").toUpperCase() === s) || rows[0];
        if (!row) {
          if (!active) return;
          setPrice(null);
          setPrevClose(null);
          setErr("스냅샷 데이터 없음");
          return;
          setPrice(null);
          setPrevClose(null);
          setErr("스냅샷 데이터 없음");
          return;
        }
        const cur = parseFloat(String(row.price ?? "").replace("$", ""));
        const chg = parseFloat(String(row.change ?? "").replace("+", ""));
        const prev = Number.isFinite(cur) && Number.isFinite(chg) ? cur - chg : null;
        if (!active) return;
        setPrice(Number.isFinite(cur) ? cur : null);
        setPrevClose(Number.isFinite(prev) ? prev : null);
        setErr(null);
      } catch (_) {
        if (!active) return;
        setPrice(null);
        setPrevClose(null);
        setErr("스냅샷에서 가격을 불러오지 못했습니다.");
      }
    }

    async function fetchRealtime() {
      if (!s || isHistorical) return;
      try {
        const res = await axios.get(`/redis/stock/${s}`);
        const data = res?.data;
        if (!data) {
          setErr("데이터 없음");
          return;
        }
        const cur = parseFloat(String(data.price || "").replace("$", ""));
        const chg = parseFloat(String(data.change || "").replace("+", ""));
        const prev =
          Number.isFinite(cur) && Number.isFinite(chg) ? cur - chg : null;
        if (!active) return;
        setPrice(Number.isFinite(cur) ? cur : null);
        setPrevClose(Number.isFinite(prev) ? prev : null);
        setErr(null);
      } catch (_) {
        if (!active) return;
        setErr("Redis에서 가격을 불러오지 못했습니다.");
      }
    }

    if (isHistorical) fetchHistorical();
    else fetchRealtime();
    return () => {
      active = false;
    };
  }, [s, isHistorical, dateKey]);
  useEffect(() => {
    let timer = null;
    if (!s) {
      setErr("심볼 없음");
      setPrice(null);
      setPrevClose(null);
      return;
    }
    if (isHistorical) {
      // 과거 모드에서는 Redis를 호출하지 않음
      return () => { if (timer) clearInterval(timer); };
    }
    const fetchFromRedis = async () => {
      try {
        const res = await axiosInstance.get(`/redis/stock/${s}`);
        const data = res?.data;
        if (!data) {
          setErr("데이터 없음");
          return;
        }
        const cur = parseFloat(String(data.price || "").replace("$", ""));
        const chg = parseFloat(String(data.change || "").replace("+", ""));
        const prev = Number.isFinite(cur) && Number.isFinite(chg) ? cur - chg : null;
        setPrice(Number.isFinite(cur) ? cur : null);
        setPrevClose(Number.isFinite(prev) ? prev : null);
        setErr(null);
      } catch (_) {
        setErr("Redis에서 가격을 불러오지 못했습니다.");
      }
    };

    fetchFromRedis();

    // 자동 갱신은 스케줄러에 맡김: 주기 요청 제거
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [s, isHistorical]);
  const handleDecrease = () => {
    setQuantity((prev) => Math.max(0, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
 
  };

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", width: "100%" }}
        >
          <strong style={{ fontSize: 18 }}>{s || "LIVE"}</strong>
          <button className="btn" onClick={() => navigate(-1)}>
            뒤로
          </button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">현재가</span>
          <strong>
            {Number.isFinite(Number(price)) ? Number(price).toFixed(2) : "-"}
          </strong>
          <span className="muted">전일대비</span>
          <span style={{ color: (change ?? 0) >= 0 ? "#26a69a" : "#ef5350" }}>
            {Number.isFinite(Number(change))
              ? `${change.toFixed(2)} (${Number(changePct).toFixed(2)}%)`
              : "-"}
          </span>
          {err && <span className="muted">{err}</span>}
        </div>
      </div>
      {/* 주문 UI는 차트/보조지표 아래로 이동 */}
      <UnifiedChart
        symbol={s}
        defaultMode={isHistorical ? "historical" : "realtime"}
        lockedMode={isHistorical ? "historical" : "realtime"}
        hideModeToggle={true}
        initialYear={simDate?.year || undefined}
        initialMonth={simDate?.month || undefined}
        initialDay={simDate?.day || undefined}
        autoLoad={isHistorical}
      />

      {/* 수량 선택 UI - 개선된 디자인 */}
      <div className="card" style={{ marginTop: 12, marginBottom: 8 }}>
        <div className="row" style={{ gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <button onClick={handleDecrease} className="bg-slate-200 hover:bg-slate-300 text-black text-lg font-bold px-3 py-1 rounded">-</button>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 text-center bg-slate-900 text-white border border-slate-600 rounded px-2 py-1"
            />
            <button onClick={handleIncrease} className="bg-slate-200 hover:bg-slate-300 text-black text-lg font-bold px-3 py-1 rounded">+</button>
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {[1,5,10,20,50].map((n) => (
              <button key={n} onClick={() => setQuantity(n)} className="px-2 py-1 text-sm bg-slate-800 text-white border border-slate-600 rounded hover:bg-slate-700">{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 주문 버튼 */}
      <div className="flex gap-4 h-[3rem] mb-5">
        <Button
          className="w-full h-full rounded-[0.8rem] text-[20px]"
          variant="destructive"
          onClick={() => handleUpdateStockAmount("SELL", quantity)}
        >
          매도
        </Button>
        <Button
          className="w-full h-full rounded-[0.8rem] text-[20px]"
          variant="confirm"
          onClick={() => handleUpdateStockAmount("BUY", quantity)}
        >
          매수
        </Button>
      </div>
      
      <Dialog open={showModal} onOpenChange={handleModalClosed}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>구매 완료</DialogTitle>
          </DialogHeader>
          <p className="text-center text-lg mt-2">
            {s} 주식 {executedQty}주 {trade}가 완료되었습니다.
          </p>
          <DialogFooter>
            <Button className="w-full mt-4" onClick={() => setShowModal(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
