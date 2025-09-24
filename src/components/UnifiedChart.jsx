import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../util/axiosInstance";

// -------- Lightweight Charts Loader --------
function loadLightweightCharts() {
  return new Promise((resolve) => {
    if (window.LightweightCharts) return resolve(window.LightweightCharts);
    const existing = document.getElementById("lightweight-charts-umd");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "lightweight-charts-umd";
      script.src = "https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js";
      script.async = true;
      script.onload = () => resolve(window.LightweightCharts);
      document.body.appendChild(script);
    } else {
      const timer = setInterval(() => {
        if (window.LightweightCharts) {
          clearInterval(timer);
          resolve(window.LightweightCharts);
        }
      }, 50);
    }
  });
}

// -------- Historical Chart --------
function HistoricalChart({ symbol, onCandlesLoaded, initialYear, initialMonth, initialDay, autoLoad = false, theme = 'light' }) {
  const containerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const volContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const rsiChartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const ma20Ref = useRef(null);
  const ma50Ref = useRef(null);
  const ma200Ref = useRef(null);
  const dataRef = useRef([]);
  const initedRef = useRef(false);
  const loadedFromRef = useRef(null);
  const loadedToRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [ready, setReady] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(initialYear || now.getUTCFullYear());
  const [month, setMonth] = useState(initialMonth || (now.getUTCMonth() + 1));
  const [day, setDay] = useState(initialDay || 1);
  const [showMA20, setShowMA20] = useState(true);
  const [showMA50, setShowMA50] = useState(true);
  const [showMA200, setShowMA200] = useState(false);

  const CANDLE_HEIGHT = 360;
  const VOLUME_HEIGHT = 110;
  const RSI_HEIGHT = 140;
  const UP_COLOR = '#26a69a';
  const DOWN_COLOR = '#ef5350';

  const epochFromYmd = (y, m, d, end=false) => {
    const date = end ? new Date(Date.UTC(y, m - 1, d, 23, 59, 59)) : new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return Math.floor(date.getTime() / 1000);
  };
  const ymdFromEpochUTC = (sec) => {
    const d = new Date(sec * 1000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  };

  // SMA 계산
  const computeSMAForCandles = (candles, period) => {
    if (!Array.isArray(candles) || candles.length < period) return [];
    const result = [];
    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      const v = Number(candles[i]?.close);
      if (!Number.isFinite(v)) return [];
      sum += v;
      if (i >= period) sum -= Number(candles[i - period]?.close) || 0;
      if (i >= period - 1) {
        result.push({ time: candles[i].time, value: sum / period });
      }
    }
    return result;
  };

  // RSI 계산
  const computeRSI = (candles, period = 14) => {
    if (!Array.isArray(candles) || candles.length < period + 1) return [];
    const result = [];
    let gainSum = 0, lossSum = 0;
    for (let i = 1; i <= period; i++) {
      const change = Number(candles[i].close) - Number(candles[i - 1].close);
      gainSum += change > 0 ? change : 0;
      lossSum += change < 0 ? -change : 0;
    }
    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;
    const firstIdx = period;
    const firstRsi = () => avgLoss === 0 ? 100 : (100 - 100 / (1 + (avgGain / avgLoss)));
    result.push({ time: candles[firstIdx].time, value: firstRsi() });
    for (let i = firstIdx + 1; i < candles.length; i++) {
      const change = Number(candles[i].close) - Number(candles[i - 1].close);
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + (avgGain / avgLoss));
      result.push({ time: candles[i].time, value: rsi });
    }
    return result;
  };

  const updateOverlays = (candles) => {
    const arr = Array.isArray(candles) ? candles : (dataRef.current || []);
    if (!arr.length) {
      ma20Ref.current?.setData([]);
      ma50Ref.current?.setData([]);
      ma200Ref.current?.setData([]);
      return;
    }
    const ma20 = computeSMAForCandles(arr, 20);
    const ma50 = computeSMAForCandles(arr, 50);
    const ma200 = computeSMAForCandles(arr, 200);
    ma20Ref.current?.setData(ma20);
    ma50Ref.current?.setData(ma50);
    ma200Ref.current?.setData(ma200);
  };

  // 보조지표 업데이트(안전 처리)
  const updateIndicators = (baseCandles) => {
    const candles = Array.isArray(baseCandles) ? baseCandles : (dataRef.current || []);
    if (!candles || candles.length === 0) {
      try { volumeSeriesRef.current?.setData([]); } catch (_) {}
      try { rsiSeriesRef.current?.setData([]); } catch (_) {}
      updateOverlays([]);
      return;
    }
    // 거래량
    if (volumeSeriesRef.current) {
      const vol = candles.map((bar) => ({
        time: bar.time,
        value: Number(bar.volume) || 0,
        color: (Number(bar.close) >= Number(bar.open)) ? UP_COLOR : DOWN_COLOR,
      }));
      try { volumeSeriesRef.current.setData(vol); } catch (_) {}
    }
    // RSI
    if (rsiSeriesRef.current) {
      const rsi = computeRSI(candles, 14);
      try { rsiSeriesRef.current.setData(rsi); } catch (_) {}
    }
    updateOverlays(candles);
  };

  const normalizeCandles = (payload) => {
    const { status, timestamps, dates, opens, highs, lows, closes, volumes } = payload || {};
    if (status !== 'ok' || !Array.isArray(opens)) return [];
    return opens.map((_, i) => {
      const day = dates?.[i];
      let time = Number(timestamps?.[i]);
      if (day) {
        const [yy, mm, dd] = String(day).split('-').map(Number);
        if ([yy, mm, dd].every(Number.isFinite)) time = { year: yy, month: mm, day: dd };
      }
      return {
        time,
        open:  Number(opens[i]),
        high:  Number(highs[i]),
        low:   Number(lows[i]),
        close: Number(closes[i]),
        volume: Number(volumes?.[i] ?? 0),
      };
    }).filter(v => v.time && [v.open, v.high, v.low, v.close].every(Number.isFinite));
  };
  const toEpoch = (t) => (typeof t === 'number' ? t : (t && typeof t === 'object' ? Math.floor(Date.UTC(t.year, t.month - 1, t.day, 0, 0, 0) / 1000) : null));

  const loadMonthWithPrevWeek = async (y, m) => {
    const start = epochFromYmd(y, m, 1, false);
    const end = epochFromYmd(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 0, true);
    const res = await axiosInstance.get('/db/candles', { params: { ticker: symbol, from: start, to: end } });
    const monthCandles = normalizeCandles(res.data);
    const prevStart = start - 30 * 86400;
    const prevEnd = start - 1;
    let prevCandles = [];
    try {
      const pres = await axiosInstance.get('/db/candles', { params: { ticker: symbol, from: prevStart, to: prevEnd } });
      prevCandles = normalizeCandles(pres.data);
    } catch (_) {}
    return { combined: [...prevCandles, ...monthCandles], start, end };
  };

  // 오래된 구간 추가 로드 (차트 왼쪽으로 스크롤 시)
  const loadOlderChunk = async () => {
    if (!initedRef.current || isLoadingRef.current) return;
    const arr = dataRef.current || [];
    if (!arr.length) return;
    // 현재 보이는 논리 범위 (인덱스 기준) 저장해 스크롤 위치 보정
    let currentRange = null;
    try { currentRange = chartRef.current?.timeScale().getVisibleLogicalRange(); } catch (_) {}
    const firstEpoch = toEpoch(arr[0]?.time);
    if (!Number.isFinite(firstEpoch)) return;
    const { y: fy, m: fm } = ymdFromEpochUTC(firstEpoch);
    // 이전 달 데이터 로드
    const prevMonth = fm === 1 ? 12 : fm - 1;
    const prevYear = fm === 1 ? fy - 1 : fy;
    try {
      isLoadingRef.current = true;
      const { combined } = await loadMonthWithPrevWeek(prevYear, prevMonth);
      // combined = (prevMonth-1의 일부) + prevMonth 전부 → 현재 데이터와 겹칠 수 있으니 시간 기준으로 유니크 머지
      const seen = new Set(arr.map((c) => toEpoch(c.time)));
      const older = (combined || []).filter((c) => !seen.has(toEpoch(c.time)));
      if (older.length === 0) return;
      const merged = [...older, ...arr].sort((a, b) => toEpoch(a.time) - toEpoch(b.time));
      const added = older.length;
      dataRef.current = merged;
      try { seriesRef.current?.setData(merged); } catch (_) {}
      updateIndicators(merged);
      // 스크롤 위치 보정: 앞에 데이터가 추가된 만큼 오른쪽으로 같은 양 이동
      if (currentRange && typeof currentRange.from === 'number' && typeof currentRange.to === 'number') {
        const shifted = { from: currentRange.from + added, to: currentRange.to + added };
        try { chartRef.current?.timeScale().setVisibleLogicalRange(shifted); } catch (_) {}
      }
    } catch (_) {
      /* ignore */
    } finally {
      isLoadingRef.current = false;
    }
  };

  // 차트 초기화 및 데이터 로드
  useEffect(() => {
    let isActive = true;
    if (!containerRef.current) return () => {};
    let localChart = null;
    const init = async () => {
      const LW = await loadLightweightCharts();
      if (!isActive || !containerRef.current || !LW) return;
      const kstTimeFormatter = (t) => {
        if (typeof t === 'object' && t) {
          if ('year' in t && 'month' in t && 'day' in t) {
            const y = Number(t.year), m = Number(t.month), d = Number(t.day);
            if ([y, m, d].every(Number.isFinite)) {
              return new Date(y, m - 1, d).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
            }
          }
        }
        const ts = Number(t);
        return Number.isFinite(ts)
          ? new Date(ts * 1000).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
          : '';
      };

      const isDark = theme === 'dark';
      const baseBg = isDark ? '#0f172a' : 'white';
      const baseText = isDark ? '#cbd5e1' : '#333';
      const gridColor = isDark ? '#1e293b' : '#f6f6f6';
      const gridVert = isDark ? '#233046' : '#eee';

      localChart = LW.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: CANDLE_HEIGHT,
        layout: { background: { color: baseBg }, textColor: baseText },
        crosshair: { mode: LW.CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false, tickMarkFormatter: kstTimeFormatter },
        localization: { locale: 'ko-KR', timeFormatter: kstTimeFormatter },
        rightPriceScale: { borderVisible: false },
        leftPriceScale: { visible: true, borderVisible: false },
        grid: { vertLines: { color: gridVert }, horzLines: { color: gridColor } },
      });
      const candleSeries = localChart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350',
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        borderVisible: false,
      });
      chartRef.current = localChart;
      seriesRef.current = candleSeries;
      // MAs
      ma20Ref.current = localChart.addLineSeries({ color: '#1976d2', lineWidth: 2, priceScaleId: 'right', lastValueVisible: false });
      ma50Ref.current = localChart.addLineSeries({ color: '#9c27b0', lineWidth: 2, priceScaleId: 'right', lastValueVisible: false });
      ma200Ref.current = localChart.addLineSeries({ color: '#ff9800', lineWidth: 2, priceScaleId: 'right', lastValueVisible: false });
      // Volume chart
      if (volContainerRef.current) {
        const localVolChart = LW.createChart(volContainerRef.current, {
          width: volContainerRef.current.clientWidth,
          height: VOLUME_HEIGHT,
          layout: { background: { color: baseBg }, textColor: baseText },
          rightPriceScale: { borderVisible: false },
          leftPriceScale: { visible: false },
          grid: { vertLines: { color: gridVert }, horzLines: { color: gridColor } },
          timeScale: { timeVisible: true, secondsVisible: false, tickMarkFormatter: kstTimeFormatter },
          localization: { locale: 'ko-KR', timeFormatter: kstTimeFormatter },
        });
        volumeChartRef.current = localVolChart;
        volumeSeriesRef.current = localVolChart.addHistogramSeries({
          color: '#90caf9',
          priceFormat: { type: 'volume' },
          baseLineVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        try { volumeSeriesRef.current.setData([]); } catch (_) {}
      }
      // RSI chart
      if (rsiContainerRef.current) {
        const localRsiChart = LW.createChart(rsiContainerRef.current, {
          width: rsiContainerRef.current.clientWidth,
          height: RSI_HEIGHT,
          layout: { background: { color: baseBg }, textColor: baseText },
          rightPriceScale: { borderVisible: false },
          leftPriceScale: { visible: false },
          grid: { vertLines: { color: gridVert }, horzLines: { color: gridColor } },
          timeScale: { timeVisible: true, secondsVisible: false, tickMarkFormatter: kstTimeFormatter },
          localization: { locale: 'ko-KR', timeFormatter: kstTimeFormatter },
        });
        rsiChartRef.current = localRsiChart;
        rsiSeriesRef.current = localRsiChart.addLineSeries({ color: '#455a64', lineWidth: 2, priceScaleId: 'right', lastValueVisible: false });
        try { rsiSeriesRef.current.setData([]); } catch (_) {}
        try {
          rsiSeriesRef.current.createPriceLine({ price: 30, color: '#ef5350', lineWidth: 1, lineStyle: LW.LineStyle.Dotted, axisLabelVisible: true });
          rsiSeriesRef.current.createPriceLine({ price: 70, color: '#26a69a', lineWidth: 1, lineStyle: LW.LineStyle.Dotted, axisLabelVisible: true });
        } catch (_) {}
        try {
          localChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (!range || typeof range.from !== 'number' || typeof range.to !== 'number') return;
            try { localRsiChart.timeScale().setVisibleLogicalRange(range); } catch (_) {}
            try { volumeChartRef.current?.timeScale().setVisibleLogicalRange(range); } catch (_) {}
          });
        } catch (_) {}
      }

      // 적용
      ma20Ref.current.applyOptions({ visible: showMA20 });
      ma50Ref.current.applyOptions({ visible: showMA50 });
      ma200Ref.current.applyOptions({ visible: showMA200 });
      setReady(true);
      dataRef.current = [];
      try { seriesRef.current?.setData([]); } catch (_) {}

      const onResize = () => {
        if (!containerRef.current || !chartRef.current) return;
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        if (rsiContainerRef.current && rsiChartRef.current) {
          rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
        }
        if (volContainerRef.current && volumeChartRef.current) {
          volumeChartRef.current.applyOptions({ width: volContainerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", onResize);
      // 왼쪽 스크롤 근접 시 추가 로드 트리거
      try {
        localChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (!range || typeof range.from !== 'number') return;
          // 왼쪽 끝에 가까워지면 이전 달 로드 (여유 구간 3칸)
          if (range.from < 3) {
            loadOlderChunk();
          }
        });
      } catch (_) {}
      return () => {
        window.removeEventListener("resize", onResize);
      };
    };
    const cleanupResize = init();
    return () => {
      Promise.resolve(cleanupResize).then((fn) => typeof fn === "function" && fn());
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch (_) {}
        chartRef.current = null;
      }
      seriesRef.current = null;
      if (volumeChartRef.current) { try { volumeChartRef.current.remove(); } catch (_) {} }
      volumeChartRef.current = null;
      if (rsiChartRef.current) { try { rsiChartRef.current.remove(); } catch (_) {} }
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      setReady(false);
    };
  }, []);

  // 외부 초기 날짜 동기화
  useEffect(() => {
    if (Number.isFinite(Number(initialYear))) setYear(Number(initialYear));
    if (Number.isFinite(Number(initialMonth))) setMonth(Number(initialMonth));
    if (Number.isFinite(Number(initialDay))) setDay(Number(initialDay));
  }, [initialYear, initialMonth, initialDay]);

  // 자동 로드: 선택 날짜의 캔들은 제외(전일까지만 노출)
  useEffect(() => {
    (async () => {
      if (!autoLoad || !symbol || !ready || !seriesRef.current) return;
      try {
        isLoadingRef.current = true;
        const { combined, start, end } = await loadMonthWithPrevWeek(year, month);
        dataRef.current = combined;

        const selDay = Number(initialDay) || 1;
        const selectedDate = new Date(year, month - 1, selDay);
        let lastIdx = -1;
        for (let i = 0; i < combined.length; i++) {
          const e = toEpoch(combined[i]?.time);
          if (!Number.isFinite(e)) continue;
          const candleDate = new Date(e * 1000);
          if (
            candleDate.getFullYear() === selectedDate.getFullYear() &&
            candleDate.getMonth() === selectedDate.getMonth() &&
            candleDate.getDate() === selectedDate.getDate()
          ) {
            break; // 선택일 캔들은 제외
          }
          lastIdx = i;
        }
        // 선택 날짜의 캔들은 포함하지 않음 (전일까지만)
        const initialSlice = lastIdx >= 0 ? combined.slice(0, lastIdx + 1) : [];
        try { seriesRef.current?.setData(initialSlice); } catch (_) {}
        updateIndicators(initialSlice);
        if (initialSlice.length > 0) {
          const rightIndex = initialSlice.length - 1;
          try { chartRef.current?.timeScale().setVisibleLogicalRange({ from: Math.max(0, rightIndex - 18), to: rightIndex }); } catch (_) {}
          try { rsiChartRef.current?.timeScale().setVisibleLogicalRange({ from: Math.max(0, rightIndex - 18), to: rightIndex }); } catch (_) {}
          try { volumeChartRef.current?.timeScale().setVisibleLogicalRange({ from: Math.max(0, rightIndex - 18), to: rightIndex }); } catch (_) {}
        }
        initedRef.current = true;
        loadedFromRef.current = start;
        loadedToRef.current = end;
      } catch (_) { /* ignore */ } finally { isLoadingRef.current = false; }
    })();
  }, [autoLoad, symbol, ready, year, month, initialDay]);

  // MA 토글 적용
  useEffect(() => { ma20Ref.current?.applyOptions({ visible: showMA20 }); }, [showMA20]);
  useEffect(() => { ma50Ref.current?.applyOptions({ visible: showMA50 }); }, [showMA50]);
  useEffect(() => { ma200Ref.current?.applyOptions({ visible: showMA200 }); }, [showMA200]);

  return (  
    <div>
      <div className="card" style={{ marginBottom: 8 }}>
        <div className="row wrap" style={{ gap: 12, alignItems: 'center' }}>
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" checked={showMA20} onChange={(e) => setShowMA20(e.target.checked)} /> MA20
            </label>
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" checked={showMA50} onChange={(e) => setShowMA50(e.target.checked)} /> MA50
            </label>
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" checked={showMA200} onChange={(e) => setShowMA200(e.target.checked)} /> MA200
            </label>
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: CANDLE_HEIGHT }} />
      <div ref={volContainerRef} style={{ width: "100%", height: VOLUME_HEIGHT, marginTop: 6 }} />
      <div ref={rsiContainerRef} style={{ width: "100%", height: RSI_HEIGHT, marginTop: 6 }} />
    </div>
  );
}

// -------- TradingView Widget (kept) --------
export function TradeRealtimeWidget({ symbol, theme = "light", autosize = true, interval = "60" }) {
  const wrapRef = useRef(null);
  const containerIdRef = useRef(`tv-container-${Math.random().toString(36).slice(2)}`);

  function ensureScript(cb) {
    if (window.TradingView) return cb();
    const sid = "tradingview-widget-loader";
    if (!document.getElementById(sid)) {
      const s = document.createElement("script");
      s.id = sid;
      s.src = "https://s3.tradingview.com/tv.js";
      s.async = true;
      s.onload = cb;
      document.body.appendChild(s);
    } else {
      const w = setInterval(() => {
        if (window.TradingView) { clearInterval(w); cb(); }
      }, 100);
    }
  }

  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.innerHTML = "";
    const ctn = document.createElement("div");
    ctn.style.height = "100%";
    ctn.style.width = "100%";
    ctn.id = containerIdRef.current;
    wrapRef.current.appendChild(ctn);

    ensureScript(() => {
      requestAnimationFrame(() => {
        if (!document.getElementById(containerIdRef.current)) return;
        // eslint-disable-next-line no-new
        new window.TradingView.widget({
          autosize,
          symbol,
          interval,
          timezone: "Asia/Seoul",
          theme,
          style: "1",
          locale: "ko",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerIdRef.current,
        });
      });
    });

    return () => { if (wrapRef.current) wrapRef.current.innerHTML = ""; };
  }, [symbol, theme, autosize, interval]);

  return (
    <div style={{ height: 600, width: "100%" }}>
      <div ref={wrapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

// -------- Unified Wrapper --------
export default function UnifiedChart({ symbol, defaultMode = "historical", initialYear, initialMonth, initialDay, onCandlesLoaded, autoLoad, hideModeToggle = false, lockedMode, theme = 'light' }) {
  const [mode, setMode] = useState(defaultMode);
  const effectiveMode = lockedMode || mode;
  const isHistorical = effectiveMode === "historical";
  const Chart = useMemo(() => (isHistorical ? HistoricalChart : TradeRealtimeWidget), [isHistorical]);
  const chartKey = `${effectiveMode}-${symbol}`;

  return (
    <div>
      {!hideModeToggle && (
        <div className="row" style={{ marginBottom: 8 }}>
          <div className="seg">
            <button className={`seg-btn ${isHistorical ? 'active' : ''}`} onClick={() => setMode('historical')}>과거</button>
            <button className={`seg-btn ${!isHistorical ? 'active' : ''}`} onClick={() => setMode('realtime')}>실시간</button>
          </div>
        </div>
      )}
      <Chart
        key={chartKey}
        symbol={symbol}
        onCandlesLoaded={onCandlesLoaded}
        initialYear={initialYear}
        initialMonth={initialMonth}
        initialDay={initialDay}
        autoLoad={autoLoad}
        theme={theme}
      />
    </div>
  );
}

