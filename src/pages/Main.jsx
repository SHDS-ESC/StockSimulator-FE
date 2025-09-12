import { useNavigate } from "react-router-dom";
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

const Main = () => {
  const navigate = useNavigate();

  // 커스텀 훅들 사용
  const { 
    query, 
    setQuery, 
    showPicker, 
    setShowPicker, 
    filteredTickers 
  } = useStockData();
  
  const { 
    watchlist, 
    toggleWatchlist 
  } = useWatchlist();
  
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
    updateSimulation
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

  // 시뮬레이션 진행 시 날짜 자동 업데이트
  const handleConfirmEndTurn = () => {
    confirmEndTurn();
    // 다음 날로 진행 시 날짜도 자동 업데이트
    const nextIndex = simIndex + 1;
    const bar = (simCandles && nextIndex >= 0 && nextIndex < simCandles.length) ? simCandles[nextIndex] : null;
    const t = bar?.time;
    if (t && Number.isFinite(t.year) && Number.isFinite(t.month) && Number.isFinite(t.day)) {
      setSelYear(t.year);
      setSelMonth(t.month);
      setSelDay(t.day);
    }
  };

  // 페이지 진입 시 기존 TradingView 위젯 잔여물 제거(워터마크/컨테이너)
  useEffect(() => {
    const selectors = [
      '[id^="tv-container-"]',
      '.tradingview-widget-container',
      '.tradingview-widget-copyright'
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
          <button className="btn brand" onClick={() => setShowPicker(true)}>종목 선택</button>
          <span className="muted">선택됨: {symbol || '-'}</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={handleGoToLogin}>로그인</button>
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