import { useNavigate } from "react-router-dom";
import axiosInstance from "../util/axiosInstance";
import useLoginStore from "@/store/useLoginStore";
import { useState, useEffect } from "react";
import UnifiedChart from "../components/UnifiedChart";
import { useStockData } from "../hooks/useStockData";
import { useWatchlist } from "../hooks/useWatchlist";
import { useSimulation } from "../hooks/useSimulation";
import StockSelector from "../components/StockSelector";
import WatchlistPanel from "../components/WatchlistPanel";
import SimulationControls from "../components/SimulationControls";
import DateSelector from "../components/DateSelector";
import SimulationModal from "../components/SimulationModal";
import { getCurrentDate } from "../util/dateUtils";
import axios from "axios";
import { Button} from "@/components/ui/button";

const Main = () => {
  const navigate = useNavigate();
  const { clear, setEmail, setLevel, setTickerList, setLastProfileNickname, setUpdatedAt } = useLoginStore();

  // 커스텀 훅들 사용
  const { query, setQuery, showPicker, setShowPicker, filteredTickers } =
    useStockData();

  const { watchlist, toggleWatchlist } = useWatchlist();

  const {
    simCandles,
    simIndex,
    visibleCount,
    showEndPreview,
    currentDate,
    canAdvance,
    handleEndTurn,
    confirmEndTurn,
    cancelEndTurn,
    updateSimulation,
  } = useSimulation();

  // 로컬 상태
  const [symbol, setSymbol] = useState("");
  const today = getCurrentDate();
  const [selYear, setSelYear] = useState(today.year);
  const [selMonth, setSelMonth] = useState(today.month);
  const [selDay, setSelDay] = useState(today.day);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleSymbolSelect = (selectedSymbol) => {
    setSymbol(selectedSymbol);
  };


  const handleLogout = async () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      clear();
      navigate("/login");
      return;
    }

    // 먼저 서버 로그아웃 요청을 완료하고
    try {
      await axios.post("http://localhost:8090/api/user/logout", null, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.log("logout error", e); // 에러는 로그로 남기고 무시
    } finally {
      // 그 다음 클라이언트 상태/토큰 제거 후 로그인으로 이동
      clear();
      sessionStorage.removeItem("accessToken");
      navigate("/login");
    }
  };
  useEffect(() => {
    // 토큰이 없으면 사용자 정보 조회를 건너뜀 (토큰이 재저장되는 문제 방지)
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;

    axiosInstance.get("/user/me").then((response) => {
      console.log(response.data);
      setEmail(response.data.email ?? response.data.username);
      setLevel(response.data.level);
      setTickerList(response.data.tickerList);
      setLastProfileNickname(response.data.lastProfileNickname);
      setUpdatedAt(new Date().toISOString());
    });
  }, [setEmail, setLevel, setTickerList, setLastProfileNickname,  setUpdatedAt]);
  // 시뮬레이션 진행 시 날짜 자동 업데이트
  const handleConfirmEndTurn = () => {
    confirmEndTurn();
    // 다음 날로 진행 시 날짜도 자동 업데이트
    const nextIndex = simIndex + 1;
    const bar =
      simCandles && nextIndex >= 0 && nextIndex < simCandles.length
        ? simCandles[nextIndex]
        : null;
    const t = bar?.time;
    if (
      t &&
      Number.isFinite(t.year) &&
      Number.isFinite(t.month) &&
      Number.isFinite(t.day)
    ) {
      setSelYear(t.year);
      setSelMonth(t.month);
      setSelDay(t.day);
    }
  };

  // 페이지 진입 시 기존 TradingView 위젯 잔여물 제거(워터마크/컨테이너)
  useEffect(() => {
    const selectors = [
      '[id^="tv-container-"]',
      ".tradingview-widget-container",
      ".tradingview-widget-copyright",
    ];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }, []);

  return (
    <div className="container">
      {/* 헤더 */}
      <div className="row space" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 10 }}>
          <strong style={{ fontSize: 18 }}>Stock Simulator</strong>
          <Button className="btn brand" onClick={() => setShowPicker(true)}>
            종목 선택
          </Button>
          <span className="muted">선택됨: {symbol || "-"}</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button className="btn" onClick={handleGoToLogin}>
            로그인
          </Button>
        </div>
         <div className="row" style={{ gap: 8 }}>
          <Button variants="destructive" className="btn" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>
      </div>

      {/* 관심 종목 패널 */}
      <WatchlistPanel
        watchlist={watchlist}
        onSymbolSelect={handleSymbolSelect}
      />

      {/* 시뮬레이션 컨트롤 */}
      <SimulationControls
        symbol={symbol}
        currentDate={currentDate}
        canAdvance={canAdvance}
        onEndTurn={handleEndTurn}
        simIndex={simIndex}
        simCandles={simCandles}
      />

      {/* 날짜 선택 */}
      <DateSelector
        selYear={selYear}
        setSelYear={setSelYear}
        selMonth={selMonth}
        setSelMonth={setSelMonth}
        selDay={selDay}
        setSelDay={setSelDay}
      />

      {/* 시뮬레이션 모달 */}
      <SimulationModal
        showEndPreview={showEndPreview}
        onCancel={cancelEndTurn}
        onConfirm={handleConfirmEndTurn}
        simIndex={simIndex}
        simCandles={simCandles}
      />

      {/* 종목 선택 모달 */}
      <StockSelector
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        filteredTickers={filteredTickers}
        query={query}
        setQuery={setQuery}
        onSymbolSelect={handleSymbolSelect}
        watchlist={watchlist}
        toggleWatchlist={toggleWatchlist}
      />

      {/* 차트 */}
      <div style={{ marginTop: 8 }}>
        <UnifiedChart
          symbol={symbol}
          defaultMode="historical"
          initialYear={selYear}
          initialMonth={selMonth}
          initialDay={selDay}
          visibleCount={visibleCount}
          autoLoad
          onCandlesLoaded={(candles) => {
            updateSimulation(candles, selYear, selMonth, selDay);
          }}
        />
      </div>
    </div>
  );
};

export default Main;
