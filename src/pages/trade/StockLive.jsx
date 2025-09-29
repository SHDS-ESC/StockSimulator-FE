import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import UnifiedChart, { TradeRealtimeWidget } from "../../components/UnifiedChart";
import axios from "../../util/axiosInstance";
import axiosInstance from "../../util/axiosInstance";
import { Button } from "@/components/ui/button";
import useDateStore from "@/store/useDateStore";
import useLoginStore from "@/store/useLoginStore";
import { HelpCircle } from "lucide-react";
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
      // 0주 거래 방지
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setErrorMessage("수량을 1 이상 입력하세요");
        setErrorDialogOpen(true);
        return;
      }

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

      // 오늘 매수한 종목 로컬 기록 (당일 수익률 0% 표기를 위함)
      try {
        if (type === "BUY") {
          const key = `boughtToday:${isoDate}`;
          const prev = JSON.parse(localStorage.getItem(key) || "[]");
          if (!prev.includes(s)) {
            localStorage.setItem(key, JSON.stringify([...prev, s]));
          }
        }
      } catch (_) {}

      if (type === "BUY") {
        setTrade("매수");
      } else {
        setTrade("매도");
      }
      // 현금 변화량 로컬 누적 저장 (모달/요약 표시용)
      try {
        const delta = (Number(price) || 0) * (Number(quantity) || 0);
        const signed = type === "BUY" ? -delta : delta;
        const keyCash = `cashDelta:${isoDate}`;
        const prevCash = Number(JSON.parse(localStorage.getItem(keyCash) || "0"));
        const nextCash = prevCash + signed;
        localStorage.setItem(keyCash, JSON.stringify(nextCash));
      } catch (_) {}
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
  const [showGuide, setShowGuide] = useState(false);
  const [guideTab, setGuideTab] = useState('ma');
  // 에러 다이얼로그 상태
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleModalClosed = () => {
    setShowModal(false);
    setQuantity(0);
  };

  // 가격/등락률 계산: 과거는 DB 캔들(/db/candles)에서 "요청일 이하"만 사용해 계산, 실시간은 Redis
  useEffect(() => {
    let active = true;

    async function fetchHistorical() {
      if (!s || !isHistorical || !dateKey) return;
      try {
        // 요청일 이전/이하만 포함되도록 범위를 설정해 직접 계산
        const [y, m, d] = String(dateKey).split("-").map(Number);
        if (![y, m, d].every(Number.isFinite)) throw new Error("잘못된 날짜 형식");
        const toEpoch = Math.floor(Date.UTC(y, m - 1, d, 23, 59, 59) / 1000);
        const lookbackDays = 60; // 충분한 범위(주말/휴장 고려)
        const fromEpoch = toEpoch - lookbackDays * 86400;

        const res = await axiosInstance.get('/db/candles', { params: { ticker: s, from: fromEpoch, to: toEpoch } });
        const { status, dates, closes } = res?.data || {};
        if (status !== 'ok' || !Array.isArray(dates) || !Array.isArray(closes) || dates.length === 0) {
          if (!active) return;
          setPrice(null);
          setPrevClose(null);
          setErr('과거 캔들 데이터 없음');
          return;
        }
        // YYYY-MM-DD 문자열과 종가 매핑 후 요청일 이하만 필터
        const pairs = dates.map((dt, i) => ({ dt: String(dt), close: Number(closes[i]) }))
          .filter(v => v.dt && Number.isFinite(v.close))
          .filter(v => v.dt <= dateKey)
          .sort((a, b) => (a.dt < b.dt ? -1 : a.dt > b.dt ? 1 : 0));

        if (pairs.length === 0) {
          if (!active) return;
          setPrice(null);
          setPrevClose(null);
          setErr('요청일 이전 데이터 없음');
          return;
        }
        const last = pairs[pairs.length - 1];
        const prev = pairs.length >= 2 ? pairs[pairs.length - 2] : null;
        if (!active) return;
        setPrice(Number(last.close));
        setPrevClose(prev ? Number(prev.close) : null);
        setErr(null);
      } catch {
        if (!active) return;
        setPrice(null);
        setPrevClose(null);
        setErr("과거 가격을 불러오지 못했습니다.");
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

  // 길게 누르기 가속 증가/감소
  const holdTimerRef = useRef(null);
  const holdDelayRef = useRef(300);
  const holdActiveRef = useRef(false);
  const startHold = (mode) => {
    holdActiveRef.current = true;
    holdDelayRef.current = 300; // 초기 지연
    const tick = () => {
      if (!holdActiveRef.current) return;
      if (mode === 'inc') setQuantity((prev) => prev + 1);
      else setQuantity((prev) => Math.max(0, prev - 1));
      holdDelayRef.current = Math.max(50, holdDelayRef.current - 20); // 점점 빠르게
      holdTimerRef.current = setTimeout(tick, holdDelayRef.current);
    };
    // 첫 증가까지 약간 지연을 줘서 단일 클릭과 구분
    holdTimerRef.current = setTimeout(tick, holdDelayRef.current);
  };
  const stopHold = () => {
    holdActiveRef.current = false;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdDelayRef.current = 300;
  };
  useEffect(() => {
    return () => stopHold();
  }, []);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "nowrap" }}
        >
          <strong style={{ fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>{s || "LIVE"}</strong>
          <button className="btn" onClick={() => navigate(-1)} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
            뒤로
          </button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "nowrap", justifyContent: "space-between" }}>
          <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "nowrap" }}>
            <span className="muted" style={{ whiteSpace: "nowrap" }}>현재가</span>
            <strong style={{ whiteSpace: "nowrap" }}>
              {Number.isFinite(Number(price)) ? Number(price).toFixed(2) : "-"}
            </strong>
            <span style={{
              color: (change ?? 0) >= 0 ? "#26a69a" : "#ef5350",
              whiteSpace: "nowrap",
              fontSize: "14px"
            }}>
              {Number.isFinite(Number(change))
                ? `${(change ?? 0) >= 0 ? '+' : ''}${change.toFixed(2)} (${Number(changePct).toFixed(2)}%)`
                : "-"}
            </span>
            {err && <span className="muted" style={{ fontSize: "12px" }}>{err}</span>}
          </div>

          <button
            onClick={() => setShowGuide(true)}
            title="지표 가이드"
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-600 bg-slate-800 hover:bg-slate-700 text-white inline-flex items-center gap-1.5"
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <HelpCircle size={14} />
            <span>지표 가이드</span>
          </button>
        </div>
      </div>
      {/* 주문 UI는 차트/보조지표 아래로 이동 */}
      <UnifiedChart
        symbol={s}
        defaultMode={isHistorical ? "historical" : "realtime"}
        lockedMode={isHistorical ? "historical" : "realtime"}
        hideModeToggle={true}
        theme="dark"
        initialYear={simDate?.year || undefined}
        initialMonth={simDate?.month || undefined}
        initialDay={simDate?.day || undefined}
        autoLoad={isHistorical}
      />

      {/* 수량 선택 UI - 개선된 디자인 */}
      <div className="card" style={{ marginTop: 12, marginBottom: 8 }}>
        <div className="row" style={{ gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleDecrease}
              onMouseDown={() => startHold('dec')}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={(e) => { e.preventDefault(); startHold('dec'); }}
              onTouchEnd={stopHold}
              className="bg-slate-200 hover:bg-slate-300 text-black text-lg font-bold px-3 py-1 rounded"
            >-</button>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => {
                const v = String(e.target.value ?? "");
                const cleaned = v.replace(/^0+(?=\d)/, "");
                const n = Math.max(0, parseInt(cleaned, 10) || 0);
                setQuantity(n);
              }}
              className="w-20 text-center bg-slate-900 text-white border border-slate-600 rounded px-2 py-1"
            />
            <button
              onClick={handleIncrease}
              onMouseDown={() => startHold('inc')}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={(e) => { e.preventDefault(); startHold('inc'); }}
              onTouchEnd={stopHold}
              className="bg-slate-200 hover:bg-slate-300 text-black text-lg font-bold px-3 py-1 rounded"
            >+</button>
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {[1,5,10,20,50].map((n) => (
              <button key={n} onClick={() => setQuantity((prev) => Math.max(0, Number(prev) + n))} className="px-2 py-1 text-sm bg-slate-800 text-white border border-slate-600 rounded hover:bg-slate-700">{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 주문 버튼 */}
      <div className="flex gap-4 h-[3rem] mb-5">
        <Button
          className="w-full h-full rounded-[0.8rem] text-[20px]"
          variant="destructive"
          disabled={!Number.isFinite(quantity) || quantity <= 0}
          onClick={() => handleUpdateStockAmount("SELL", quantity)}
        >
          매도
        </Button>
        <Button
          className="w-full h-full rounded-[0.8rem] text-[20px]"
          variant="confirm"
          disabled={!Number.isFinite(quantity) || quantity <= 0}
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

      {/* 지표 가이드 모달 */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">보조 지표 가이드</DialogTitle>
          </DialogHeader>

          {/* 탭 네비게이션 */}
          <div className="flex space-x-1 bg-slate-900 rounded-lg p-1">
            {[
              { id: 'ma', name: '이평선' },
              { id: 'volume', name: '거래량' },
              { id: 'rsi', name: 'RSI' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGuideTab(tab.id)}
                className={`flex-1 px-3 py-2 text-xs rounded-md transition-colors ${
                  guideTab === tab.id
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="text-[13px] leading-6 min-h-[200px]">
            {guideTab === 'ma' && (
              <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">이동평균선(MA20/50/200)</h4>
                <p className="text-gray-300 mb-3">
                  단기·중기·장기 추세 지표. 단기선↑ 장기선 돌파는 골든크로스(상승), 하향 돌파는 데드크로스(하락)로 해석합니다.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 text-xs">•</span>
                    <span className="text-gray-300">가격이 MA20 상방: 단기 모멘텀</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 text-xs">•</span>
                    <span className="text-gray-300">정배열(20&gt;50&gt;200): 추세 추종 유리</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-400 text-xs">•</span>
                    <span className="text-gray-300">이격 과도: 되돌림 리스크 주의</span>
                  </div>
                </div>
              </div>
            )}

            {guideTab === 'volume' && (
              <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">거래량</h4>
                <p className="text-gray-300 mb-3">
                  추세 신뢰도 보강. 방향성과 함께 증가한 거래량은 신호의 질을 높여줍니다.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 text-xs">📈</span>
                    <span className="text-gray-300">돌파 + 거래량 급증: 지속 가능성 ↑</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400 text-xs">📊</span>
                    <span className="text-gray-300">반등/반락 + 거래량 감소: 일시적 되돌림</span>
                  </div>
                </div>
              </div>
            )}

            {guideTab === 'rsi' && (
              <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">RSI(14)</h4>
                <p className="text-gray-300 mb-3">
                  70↑ 과매수, 30↓ 과매도. 강한 상승장에서는 70 이상이 계속 유지될 수 있으니, 주가는 오르는데 RSI가 떨어지는 '힘 빠짐 신호'를 주의깊게 봐야 합니다.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 text-xs">30</span>
                    <span className="text-gray-300">30 이하 → 상향 이탈: 반등 신호</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 text-xs">70</span>
                    <span className="text-gray-300">70 이상 → 하향 이탈: 조정 신호</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          <DialogFooter>
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white" onClick={() => setShowGuide(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 에러 다이얼로그 */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
          </DialogHeader>
          <p className="text-center text-lg mt-2">
            {errorMessage}
          </p>
          <DialogFooter>
            <Button className="w-full mt-4" onClick={() => setErrorDialogOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
