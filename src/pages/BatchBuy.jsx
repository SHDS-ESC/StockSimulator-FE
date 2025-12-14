import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2, ChevronLeft, X, Loader2 } from "lucide-react";
import useRealtimeStocks from "../hooks/useRealtimeStocks";
import useDateStore from "../store/useDateStore";
import useLoginStore from "../store/useLoginStore";
import axios from "../util/axiosInstance";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function BatchBuy() {
  const navigate = useNavigate();
  const { currentDate } = useDateStore();
  const { lastProfileId } = useLoginStore();
  
  // 프로필 정보 및 실시간 여부 판별 (Stocks.jsx와 동일)
  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("newProfile") || "null");
    } catch (_) {
      return null;
    }
  }, [lastProfileId]);
  
  const isRealtime = useMemo(() => {
    if (profile?.timelineId != null) {
      return Number(profile.timelineId) === 9;
    }
    return false;
  }, [profile?.timelineId]);
  
  const isHistorical = !isRealtime;
  const { stocks } = useRealtimeStocks({ enabled: !isHistorical });

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]); // [{symbol,name,price, qty}]

  // 일괄구매 진행 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [etaText, setEtaText] = useState("--:--");
  const [startedAt, setStartedAt] = useState(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [errors, setErrors] = useState([]); // [{symbol, message}]
  const abortRef = useRef(null);
  
  // 완료 다이얼로그 상태
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  
  // 과거 모드 데이터 (Stocks.jsx와 동일)
  const [histMap, setHistMap] = useState({});
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
    if (!isHistorical) return null;
    const y = String(simDate?.year || "");
    const m = String(simDate?.month || "").padStart(2, "0");
    const d = String(simDate?.day || "").padStart(2, "0");
    if (!y || !m || !d) return null;
    return `${y}-${m}-${d}`;
  }, [isHistorical, simDate?.year, simDate?.month, simDate?.day]);

  // 과거 모드 스냅샷 로드
  useEffect(() => {
    if (!isHistorical || !simDate || !dateKey) return;
    const doFetch = async () => {
      try {
        const resp = await axios.get("/db/snapshot", {
          params: { date: dateKey, page: 1, size: 1000, sort: "name,asc" },
        });
        const arr = Array.isArray(resp?.data?.rows) ? resp.data.rows : [];
        setHistMap({ __rows: arr });
      } catch (_) {
        setHistMap({ __rows: [] });
      }
    };
    doFetch();
  }, [isHistorical, dateKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = isHistorical ? histMap.__rows || [] : stocks || [];
    if (!q) return base;
    return base.filter((s) =>
      String(s.symbol || "").toLowerCase().includes(q) ||
      String(s.name || "").toLowerCase().includes(q)
    );
  }, [stocks, query, isHistorical, histMap.__rows]);

  // 현재가 추출 유틸리티 (Stocks.jsx와 동일)
  const getCurrentPrice = (stock) => {
    if (!stock) return null;
    // 우선 __currentPrice(실시간 계산)를 우선 사용
    if (Number.isFinite(stock.__currentPrice)) return Number(stock.__currentPrice);
    // price가 "$123.45" 또는 숫자로 들어올 수 있음
    const parsed = parseFloat(String(stock?.price ?? "").replace(/[$,]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
    return null;
  };

  const addToCart = (stock) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.symbol === stock.symbol);
      if (exists) return prev;
      const priceNum = getCurrentPrice(stock);
      return [
        ...prev,
        {
          symbol: stock.symbol,
          name: stock.name,
          price: priceNum,
          qty: 1,
        },
      ];
    });
  };

  const removeFromCart = (symbol) => setCart((prev) => prev.filter((i) => i.symbol !== symbol));
  const updateQty = (symbol, delta) => setCart((prev) => prev.map((i) => i.symbol === symbol ? { ...i, qty: Math.max(0, (i.qty || 0) + delta) } : i));
  const setQty = (symbol, qty) => setCart((prev) => prev.map((i) => i.symbol === symbol ? { ...i, qty: Math.max(0, qty) } : i));

  const formatEta = (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) return "--:--";
    const totalSec = Math.ceil(ms / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleBatchBuy = async () => {
    try {
      const isoDate =
        currentDate instanceof Date
          ? currentDate.toISOString().slice(0, 10)
          : currentDate;
      const valid = cart.filter((c) => (c.qty || 0) > 0);
      if (valid.length === 0) {
        setCompletionMessage("장바구니에 수량이 1 이상인 종목을 추가해주세요");
        setCompletionDialogOpen(true);
        return;
      }

      // 진행 상태 초기화
      setIsProcessing(true);
      setProcessedCount(0);
      setTotalCount(valid.length);
      setSuccessCount(0);
      setFailureCount(0);
      setEtaText("--:--");
      setStartedAt(Date.now());
      setCancelRequested(false);
      setErrors([]);
      abortRef.current = new AbortController();

      // 순차 호출 + 진행률 업데이트
      for (let idx = 0; idx < valid.length; idx += 1) {
        if (cancelRequested) break;
        const item = valid[idx];
        const quantity = Number(item.qty || 0);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          setProcessedCount((v) => v + 1);
          continue;
        }
        const priceVal = item.price;
        if (!Number.isFinite(priceVal)) {
          setFailureCount((v) => v + 1);
          setErrors((prev) => [...prev, { symbol: item.symbol, message: "현재가를 불러오지 못했습니다" }]);
          setProcessedCount((v) => v + 1);
          const elapsed = Date.now() - (startedAt || Date.now());
          const done = Math.max(1, idx + 1);
          const remain = Math.max(0, valid.length - done);
          setEtaText(formatEta((elapsed / done) * remain));
          continue;
        }

        try {
          await axios.post(
            `offer/update`,
            {
              price: priceVal,
              offerDate: isoDate,
              usersProfileId: lastProfileId,
              stock: item.symbol,
              type: "BUY",
              quantity: quantity,
            },
            { withCredentials: true, signal: abortRef.current?.signal }
          );

          // 로컬 기록
          try {
            const key = `boughtToday:${isoDate}`;
            const prev = JSON.parse(localStorage.getItem(key) || "[]");
            if (!prev.includes(item.symbol)) {
              localStorage.setItem(key, JSON.stringify([...prev, item.symbol]));
            }
          } catch (_) {}

          setSuccessCount((v) => v + 1);
        } catch (e) {
          // 취소 여부
          const isCanceled = e?.name === "CanceledError" || e?.code === "ERR_CANCELED";
          if (isCanceled || cancelRequested) {
            break;
          }
          setFailureCount((v) => v + 1);
          setErrors((prev) => [...prev, { symbol: item.symbol, message: "요청에 실패했습니다" }]);
        } finally {
          setProcessedCount((v) => v + 1);
          const elapsed = Date.now() - (startedAt || Date.now());
          const done = Math.max(1, idx + 1);
          const remain = Math.max(0, valid.length - done);
          setEtaText(formatEta((elapsed / done) * remain));
        }
      }

      setIsProcessing(false);
      if (!cancelRequested) {
        setCompletionMessage("일괄 매수가 완료되었습니다.");
        setCompletionDialogOpen(true);
      }
    } catch (e) {
      console.error(e);
      setCompletionMessage("일괄 매수에 실패했습니다. 다시 시도해주세요.");
      setCompletionDialogOpen(true);
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="mb-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors">
          <ChevronLeft className="w-5 h-5" /> 뒤로가기
        </button>
      </div>

      <h2 className="text-white text-lg font-semibold mb-3">주식 주머니 (일괄 구매)</h2>

      {/* 검색 및 리스트 */}
      <div className="bg-slate-800 rounded-xl p-3 mb-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목명/심볼 검색"
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-400"
          />
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2 scrollbar-hide">
          {(filtered || []).slice(0, 50).map((s) => {
            const priceText = (() => {
              const cur = parseFloat(String(s?.price ?? "").replace("$", ""));
              return Number.isFinite(cur) ? `$${cur.toFixed(2)}` : "-";
            })();
            const changeText = (() => {
              const chg = parseFloat(String(s?.change ?? "").replace("+", ""));
              return Number.isFinite(chg) ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}` : "-";
            })();
            const changePctText = (() => {
              const pct = parseFloat(String(s?.changePercent ?? "").replace(/[%+]/g, ""));
              return Number.isFinite(pct) ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "-";
            })();
            const isUp = (() => {
              const chg = parseFloat(String(s?.change ?? "").replace("+", ""));
              return Number.isFinite(chg) ? chg >= 0 : false;
            })();

            return (
              <div key={s.symbol} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-[5px] flex items-center justify-center text-lg overflow-hidden">
                    <img
                      src={`https://financialmodelingprep.com/image-stock/${s.symbol}.png`}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <span className="text-gray-600 font-bold text-xs hidden">
                      {s.symbol}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">{s.name}</h4>
                    <p className="text-gray-400 text-xs">{s.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right whitespace-nowrap">
                    <p className="text-white font-semibold text-sm">{priceText}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <p className={`text-xs font-medium ${isUp ? "text-red-500" : "text-blue-500"}`}>
                        {changeText}
                      </p>
                      <p className={`text-xs ${isUp ? "text-red-500" : "text-blue-500"}`}>
                        ({changePctText})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => addToCart(s)} className="flex items-center gap-1 px-3 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-600 text-xs flex-shrink-0 whitespace-nowrap">
                    <Plus className="w-3 h-3" /> 담기
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 장바구니 */}
      <div className="bg-slate-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white text-sm font-semibold">장바구니</h3>
          <span className="text-xs text-gray-400">{cart.length}개 종목</span>
        </div>
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">담긴 종목이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between bg-slate-900 rounded-lg p-2">
                <div>
                  <div className="text-white text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.symbol}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.symbol, -1)} className="bg-slate-200 hover:bg-slate-300 text-black text-lg font-bold px-3 py-1 rounded">-</button>
                  <input
                    type="number"
                    value={item.qty}
                    min={0}
                    onChange={(e) => {
                      const v = String(e.target.value || "").replace(/^0+(?=\d)/, "");
                      const n = Math.max(0, parseInt(v, 10) || 0);
                      setQty(item.symbol, n);
                    }}
                    className="w-16 text-center bg-slate-900 text-white border border-slate-600 rounded px-2 py-1"
                  />
                  <button onClick={() => updateQty(item.symbol, 1)} className="bg-slate-200 hover:bg-slate-300 text-black text-lg font-bold px-3 py-1 rounded">+</button>
                  <button onClick={() => removeFromCart(item.symbol)} className="px-2 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button className="w-full mt-3" variant="confirm" onClick={handleBatchBuy} disabled={isProcessing}>
          {isProcessing ? "진행 중..." : "선택 종목 일괄 매수"}
        </Button>
      </div>
      {/* 진행 상태 모달 */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-[92vw] max-w-md mx-4 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-sm font-semibold">일괄 매수 진행중</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  setCancelRequested(true);
                  try { abortRef.current && abortRef.current.abort(); } catch (_) {}
                }}
                aria-label="취소"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 text-xs text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>서버에 주문을 전송하고 있어요...</span>
            </div>

            <div className="mb-2">
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>
                  {processedCount}/{totalCount} 처리됨 ({totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0}%)
                </span>
                <span>ETA {etaText}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
              <div className="bg-slate-700 rounded p-2">
                <div className="text-gray-400 mb-1">성공</div>
                <div className="text-emerald-400 font-semibold">{successCount}</div>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <div className="text-gray-400 mb-1">실패</div>
                <div className="text-red-400 font-semibold">{failureCount}</div>
              </div>
              <div className="bg-slate-700 rounded p-2">
                <div className="text-gray-400 mb-1">남은 작업</div>
                <div className="text-white font-semibold">{Math.max(0, totalCount - processedCount)}</div>
              </div>
            </div>

            {errors && errors.length > 0 && (
              <div className="mt-3 max-h-28 overflow-y-auto bg-slate-900 border border-slate-700 rounded p-2 text-[11px] text-red-300">
                {errors.slice(-5).map((e, i) => (
                  <div key={`${e.symbol}-${i}`}>[{e.symbol}] {e.message}</div>
                ))}
                {errors.length > 5 && (
                  <div className="text-gray-400">외 {errors.length - 5}건 더 있음</div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg text-sm"
                onClick={() => {
                  setCancelRequested(true);
                  try { abortRef.current && abortRef.current.abort(); } catch (_) {}
                  setIsProcessing(false);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 완료 다이얼로그 */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
          </DialogHeader>
          <p className="text-center text-lg mt-2">
            {completionMessage}
          </p>
          <DialogFooter>
            <Button 
              className="w-full mt-4" 
              onClick={() => {
                setCompletionDialogOpen(false);
                if (completionMessage.includes("완료되었습니다")) {
                  navigate(-1);
                }
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


