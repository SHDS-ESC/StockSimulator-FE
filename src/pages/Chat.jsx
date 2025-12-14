import React, { useState, useEffect, useCallback, useRef } from "react";
import LightChart from "@/components/LightChart";
import { loadLW } from "@/lib/lightweight";
import StockSearchModal from "@/components/StockSearchModal";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Target,
  Award,
  AlertTriangle,
  LineChart,
  X,
  Plus,
  Trash2,
  Percent,
  Download,
} from "lucide-react";
import useLoginStore from "@/store/useLoginStore";
import useDateStore from "@/store/useDateStore";
import axiosInstance from "@/util/axiosInstance";

// 툴팁 컴포넌트
const Tooltip = ({ children, content }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const tooltipRef = useRef(null);

  const handleMouseEnter = (event) => {
    setShowTooltip(true);
    const target = event.currentTarget;

    // 화면 위치에 따라 툴팁 위치 결정
    setTimeout(() => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const padding = 16; // 여백

      let newTooltipStyle = {};
      let newArrowStyle = {};

      // 왼쪽으로 잘리는 경우
      if (rect.left < tooltipWidth / 2 + padding) {
        newTooltipStyle = {
          left: "0px",
          transform: "none",
        };
        newArrowStyle = {
          left: `${Math.max(16, rect.width / 2)}px`,
          transform: "none",
        };
      }
      // 오른쪽으로 잘리는 경우
      else if (rect.right > windowWidth - tooltipWidth / 2 - padding) {
        newTooltipStyle = {
          right: "0px",
          left: "auto",
          transform: "none",
        };
        newArrowStyle = {
          right: `${Math.max(16, rect.width / 2)}px`,
          left: "auto",
          transform: "none",
        };
      }
      // 중앙 정렬 (기본)
      else {
        newTooltipStyle = {
          left: "50%",
          transform: "translateX(-50%)",
        };
        newArrowStyle = {
          left: "50%",
          transform: "translateX(-50%)",
        };
      }

      setTooltipStyle(newTooltipStyle);
      setArrowStyle(newArrowStyle);
    }, 10);
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-[100] w-64 text-center"
          style={tooltipStyle}
        >
          <div className="whitespace-pre-line">{content}</div>
          <div
            className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={arrowStyle}
          ></div>
        </div>
      )}
    </div>
  );
};

// 포트폴리오 차트 컴포넌트 (기존 PredictionChart 스타일 활용)
const PortfolioChart = ({ portfolioData = [] }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRefs = useRef([]);

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];

  useEffect(() => {
    if (!containerRef.current || !portfolioData.length) return;

    const init = async () => {
      const LW = await loadLW();
      if (!LW || !containerRef.current) return;

      const container = containerRef.current;
      const chartWidth = container.clientWidth || 300;

      // 기존 차트 정리
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRefs.current = [];

      // 기존 PredictionChart와 동일한 스타일로 차트 생성
      const chart = LW.createChart(container, {
        width: chartWidth,
        height: 320,
        layout: { 
          background: { color: "#0f172a" }, 
          textColor: "#cbd5e1" 
        },
        crosshair: { mode: LW.CrosshairMode.Normal },
        timeScale: { 
          timeVisible: true, 
          secondsVisible: false,
          borderColor: '#475569'
        },
        rightPriceScale: { 
          borderVisible: false,
          borderColor: '#475569'
        },
        leftPriceScale: { visible: false },
        grid: {
          vertLines: { color: "#233046" },
          horzLines: { color: "#1e293b" },
        },
      });

      chartRef.current = chart;

      // 각 포트폴리오별로 라인 시리즈 생성
      portfolioData.forEach((portfolio, index) => {
        const seriesData = portfolio.series || portfolio.data;
        if (!seriesData || !Array.isArray(seriesData)) return;

        const series = chart.addLineSeries({
          color: colors[index % colors.length],
          lineWidth: 2,
          lastValueVisible: true,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lastPriceAnimation: 0,
        });

        // 데이터 변환 및 설정
        const chartData = seriesData.map(item => {
          // 날짜를 Unix timestamp로 변환
          const date = new Date(item.date);
          const timestamp = Math.floor(date.getTime() / 1000);
          const value = item.value || item.cumulativeReturn || item.cumulative_return || item.return || 0;
          
          return {
            time: timestamp,
            value: Number(value)
          };
        }).filter(point => 
          Number.isFinite(point.time) && Number.isFinite(point.value)
        ).sort((a, b) => a.time - b.time);

        if (chartData.length > 0) {
          series.setData(chartData);
          seriesRefs.current[index] = series;
        }
      });

      chart.timeScale().fitContent();

      // 리사이즈 핸들러
      const handleResize = () => {
        if (chartRef.current && containerRef.current) {
          chartRef.current.applyOptions({ 
            width: containerRef.current.clientWidth 
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    };

    init();
  }, [portfolioData]);

  return (
    <div>
      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center space-x-4 mb-3 text-xs">
        {portfolioData.map((portfolio, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-4 h-1 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="text-slate-200 font-medium">{portfolio.name || portfolio.id || `Portfolio ${index + 1}`}</span>
          </div>
        ))}
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 320 }} />
    </div>
  );
};

// 예측 라인 차트 컴포넌트 (서버 정규화 시계열 사용)
const PredictionChart = ({ historical = [], predictions = [] }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const historicalSeriesRef = useRef(null);
  const predictionSeriesRef = useRef(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { loadLW } = await import("@/lib/lightweight");
      const LW = await loadLW();
      if (!active || !LW || !containerRef.current) return;

      // 차트 생성
      const hostEl = containerRef.current;
      // 컨테이너가 가시화되고 폭이 0보다 클 때까지 대기
      const waitVisible = async () => {
        let tries = 0;
        while (tries < 30) {
          if (
            hostEl &&
            document.body.contains(hostEl) &&
            Number(hostEl.clientWidth) > 0
          )
            break;
          await new Promise((r) => requestAnimationFrame(r));
          tries += 1;
        }
      };
      await waitVisible();
      const chartWidth = Math.max(1, Number(hostEl?.clientWidth) || 0);
      const chart = LW.createChart(hostEl, {
        width: chartWidth,
        height: 260,
        layout: { background: { color: "#0f172a" }, textColor: "#cbd5e1" },
        crosshair: { mode: LW.CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderVisible: false },
        leftPriceScale: { visible: false },
        grid: {
          vertLines: { color: "#233046" },
          horzLines: { color: "#1e293b" },
        },
      });

      // 시리즈
      const historicalSeries = chart.addLineSeries({
        color: "#3b82f6",
        lineWidth: 2,
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        lastPriceAnimation: 0,
      });
      const predictionSeries = chart.addLineSeries({
        color: "#22c55e",
        lineWidth: 2,
        lineStyle: LW.LineStyle.Dashed,
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        lastPriceAnimation: 0,
      });

      chartRef.current = chart;
      lastSizeRef.current = { width: chartWidth, height: 260 };
      historicalSeriesRef.current = historicalSeries;
      predictionSeriesRef.current = predictionSeries;

      // 차트에 데이터 설정 (서버 정규화 시계열 사용)
      try {
        const isValidPoint = (p) =>
          p &&
          Number.isFinite(Number(p.time)) &&
          Number.isFinite(Number(p.value));
        const sortByTime = (a, b) => Number(a.time) - Number(b.time);
        const dedup = (arr) => {
          const seen = new Set();
          const out = [];
          for (const p of arr) {
            const t = Number(p.time);
            if (!seen.has(t)) {
              seen.add(t);
              out.push({ time: t, value: Number(p.value) });
            }
          }
          return out;
        };
        
        // 백엔드에서 이미 필터링된 데이터를 사용
        const hist = dedup(
          (historical || []).filter(isValidPoint).sort(sortByTime)
        );
        const pred = dedup(
          (predictions || []).filter(isValidPoint).sort(sortByTime)
        );
        if (hist.length > 0) {
          historicalSeries.setData(hist);
        }
        if (pred.length > 0) {
          predictionSeries.setData(pred);
        }
        try {
          chart.timeScale().fitContent();
        } catch (_) {}
      } catch (e) {
        console.warn("Chart data error:", e);
      }

      // 리사이즈 핸들러
      let rafId = null;
      let ro = null;
      const onResize = () => {
        if (!containerRef.current || !chartRef.current) return;
        if (
          !containerRef.current.isConnected ||
          !document.body.contains(containerRef.current)
        )
          return;
        const w = Number(containerRef.current.clientWidth);
        if (!Number.isFinite(w) || w <= 0) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          if (!containerRef.current || !chartRef.current) return;
          if (!containerRef.current.isConnected) return;
          const nextW = Math.max(1, Math.floor(w));
          const nextH = 260;
          if (
            lastSizeRef.current.width === nextW &&
            lastSizeRef.current.height === nextH
          )
            return;
          try {
            chartRef.current.resize(nextW, nextH);
            lastSizeRef.current = { width: nextW, height: nextH };
          } catch (_) {}
        });
      };
      try {
        if ("ResizeObserver" in window && hostEl) {
          ro = new ResizeObserver((entries) => {
            const entry = entries && entries[0];
            const target = entry && entry.target ? entry.target : hostEl;
            if (!target || !(target instanceof Element)) return;
            if (!document.body.contains(target)) return;
            const cr = entry && (entry.contentRect || {});
            const w = Number(cr.width || target.clientWidth);
            if (!Number.isFinite(w) || w <= 0) return;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              if (!chartRef.current) return;
              const nextW = Math.max(1, Math.floor(w));
              const nextH = 260;
              if (
                lastSizeRef.current.width === nextW &&
                lastSizeRef.current.height === nextH
              )
                return;
              try {
                chartRef.current.resize(nextW, nextH);
                lastSizeRef.current = { width: nextW, height: nextH };
              } catch (_) {}
            });
          });
          ro.observe(hostEl);
        } else {
          window.addEventListener("resize", onResize);
        }
      } catch (_) {
        window.addEventListener("resize", onResize);
      }

      return () => {
        try {
          ro && ro.disconnect && ro.disconnect();
        } catch (_) {}
        window.removeEventListener("resize", onResize);
        try {
          if (rafId) cancelAnimationFrame(rafId);
        } catch (_) {}
        try {
          chartRef.current && chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
      };
    };

    init();

    return () => {
      active = false;
      try {
        chartRef.current && chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
      historicalSeriesRef.current = null;
      predictionSeriesRef.current = null;
    };
  }, [historical, predictions]);

  return (
    <div className="space-y-2">
      {/* 범례 */}
      <div className="flex justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span className="text-gray-400">실제 데이터</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border-t border-green-500"></div>
          <span className="text-gray-400">AI 예측</span>
        </div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: 260 }} />
    </div>
  );
};

const Chat = () => {
  const [activeTab, setActiveTab] = useState("analysis");
  const { email, lastProfileId } = useLoginStore();
  const { currentDate } = useDateStore();
  const formatDateKey = (v) => {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === "string" && v.length >= 10) return v.slice(0, 10);
    const d = new Date(v || Date.now());
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  };

  // 시뮬레이션 상태 관리
  const [simulation, setSimulation] = useState({
    ticker: "AAPL",
    baseDate: formatDateKey(currentDate || new Date()),
    trainDays: 250,
    predictSteps: 10,
    loading: false,
    result: null,
    error: null,
  });

  // 포트폴리오 상태 관리
  const [portfolio, setPortfolio] = useState({
    startDate: "2024-01-01",
    endDate: formatDateKey(currentDate || new Date()),
    baseValue: 1.0,
    rebalance: "none",
    holdings: [], // 실제 보유 주식 데이터
    portfolios: [ // 수동 포트폴리오 데이터
      {
        id: "tech_portfolio",
        name: "기술주 포트폴리오",
        tickers: ["AAPL", "MSFT", "GOOGL"],
        weights: [1, 1, 1]
      },
      {
        id: "growth_portfolio",
        name: "성장주 포트폴리오",
        tickers: ["NVDA", "TSLA", "AMD"],
        weights: [5, 3, 2]
      }
    ],
    loading: false,
    result: null,
    error: null
  });

  // 기준 날짜는 사용자 입력으로 관리 (타임라인 자동 동기화 제거)

  // 모달 상태 관리
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [metricDetail, setMetricDetail] = useState(null);
  
  // 포트폴리오 탭 상태 관리
  const [portfolioTab, setPortfolioTab] = useState('my'); // 'my' 또는 'manual'
  
  // 종목 검색 모달 상태 관리
  const [isStockSearchModalOpen, setIsStockSearchModalOpen] = useState(false);
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(null);
  // 시뮬레이션용 종목 선택 여부
  const [isSelectingSimulation, setIsSelectingSimulation] = useState(false);
  
  
  // 보유 주식 불러오기
  const loadHoldings = async () => {
    try {
      setPortfolio(prev => ({ ...prev, loading: true, error: null }));
      
      // 현재 날짜를 YYYY-MM-DD 형식으로 변환
      const currentDateStr = formatDateKey(currentDate || new Date());
      
      // 사용자 프로필 ID 가져오기 (로그인 정보에서)
      const userProfileId = lastProfileId || 1; // 로그인된 사용자 프로필 ID 사용
      
      const response = await axiosInstance.get(`/holdings/stocks/${userProfileId}/${currentDateStr}`);
      
      if (response.data && response.data.holdingsResponseDTOS && response.data.holdingsResponseDTOS.length > 0) {
        // HoldingsDTO를 포트폴리오 분석에 맞는 형태로 변환
        const holdings = response.data.holdingsResponseDTOS.map(holding => ({
          ticker: holding.ticker,
          quantity: holding.quantity,
          total_price: (holding.price || 0) * (holding.quantity || 0) // 현재가 * 수량
        }));
        
        setPortfolio(prev => ({ 
          ...prev, 
          holdings: holdings,
          loading: false 
        }));
      } else {
        setPortfolio(prev => ({ 
          ...prev, 
          holdings: [],
          loading: false,
          error: '보유 주식이 없습니다. 먼저 주식을 매수해주세요.'
        }));
      }
    } catch (error) {
      console.error('보유 주식 불러오기 실패:', error);
      setPortfolio(prev => ({ 
        ...prev, 
        loading: false,
        error: '보유 주식을 불러오는데 실패했습니다.'
      }));
    }
  };

  // 컴포넌트 마운트 시 보유 주식 불러오기
  useEffect(() => {
    loadHoldings();
  }, []);
  const METRIC_DETAILS = {
    currentPrice: {
      title: "현재가격",
      content: "",
      noContent: true,
    },
    predictedAvgPrice: {
      title: "예상평균가격",
      content: "",
      noContent: true,
    },
    expectedTotalReturn: {
      title: "총 수익률",
      content: "",
      noContent: true,
    },
    expectedAvgDailyReturn: {
      title: "일평균 수익률",
      content: "",
      noContent: true,
    },
    var95: {
      title: "VaR (95%)",
      content: `정상적인 시장 상황에서, 95%의 확률로 발생할 수 있는 최대 손실률을 의미합니다.

쉽게 말해, "100번 투자하면 95번은 이 값 안에서 손실이 통제되지만, 5번은 그보다 훨씬 큰 손실이 날 수 있다"는 위험의 경계선입니다.

내가 감당해야 할 위험의 크기를 가늠하는 중요한 온도계 역할을 합니다.`,
      isSpecial: true,
      type: "risk",
    },
    maxExpectedLoss: {
      title: "최대손실",
      content:
        "예측 기간 내 최악의 시나리오 손실률입니다.\n포트폴리오 비중 조정과 손실 한계 설정에 활용합니다.",
    },
    estimatedSharpeRatio: {
      title: "샤프비율",
      content: `투자의 위험 대비 수익성을 측정하는 핵심 지표입니다.

간단히 말해, "내가 감수한 위험 1단위당, 무위험 투자보다 얼마나 더 높은 수익을 얻었는가?"를 알려주는 숫자입니다.

즉, 위험을 얼마나 효율적으로 관리하며 수익을 냈는지를 평가하는 것입니다.`,
      isSpecial: true,
    },
    predictedMaxPrice: {
      title: "예측 최고가",
      content:
        "정의: 예측 구간에서의 최고 예상 가격입니다.\n투자 활용: 목표가/청산가 상단 후보로 활용합니다.",
    },
    predictedMinPrice: {
      title: "예측 최저가",
      content:
        "정의: 예측 구간에서의 최저 예상 가격입니다.\n투자 활용: 손절가/재진입가 하단 후보로 활용합니다.",
    },
    predictedVolatility: {
      title: "예측 변동성",
      content:
        "정의: 예측 구간 동안의 가격 변동성 추정치입니다.\n투자 활용: 포지션 크기와 손절 폭(ATR 유사)을 산정하는 기준으로 사용합니다.",
    },
  };

  // API 호출 함수
  const handleSimulationSubmit = async () => {
    // 기준 날짜는 사용자 입력(simulation.baseDate)을 사용
    const baseDateStr = formatDateKey(simulation.baseDate || new Date());
    const safeTrain = Number.isFinite(Number(simulation.trainDays))
      ? Number(simulation.trainDays)
      : 110;
    const safeSteps = Number.isFinite(Number(simulation.predictSteps))
      ? Number(simulation.predictSteps)
      : 10;
    setSimulation((prev) => ({
      ...prev,
      baseDate: baseDateStr,
      loading: true,
      error: null,
    }));

    try {
      const response = await axiosInstance.post("/agent/predict", {
        ticker: simulation.ticker,
        today: baseDateStr, // API는 today 파라미터를 기대하므로 baseDate를 매핑
        process_date: formatDateKey(currentDate || new Date()), // 현재 타임라인 날짜 추가
        trainDays: safeTrain,
        predictSteps: safeSteps,
      });

      // 예측 데이터 분석
      // 필요 시 디버그: 예측 변화율 계산 로직 보존 (로그 제거)
      // if (response.data?.price_predictions && response.data.price_predictions.length > 1) {
      //   const prices = response.data.price_predictions;
      //   const changes = prices.slice(1).map((price, i) => ((price - prices[i]) / prices[i] * 100).toFixed(2));
      // }

      setSimulation((prev) => ({
        ...prev,
        loading: false,
        result: response.data,
      }));
    } catch (error) {
      console.error("시뮬레이션 API 오류:", error);
      setSimulation((prev) => ({
        ...prev,
        loading: false,
        error: "시뮬레이션 중 오류가 발생했습니다.",
      }));
    }
  };

  // 입력값 변경 핸들러
  const handleSimulationChange = (field, value) => {
    setSimulation((prev) => ({ ...prev, [field]: value }));
  };

  // 포트폴리오 날짜 동기화 useEffect
  useEffect(() => {
    setPortfolio((prev) => ({ ...prev, endDate: formatDateKey(currentDate || new Date()) }));
  }, [currentDate]);

  // 포트폴리오 API 호출 함수
  // 포트폴리오 분석 실행 (실제 보유 주식 기반)
  const handlePortfolioSubmit = async () => {
    if (portfolio.loading || portfolio.holdings.length === 0) return;
    
    setPortfolio(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 보유 주식 데이터를 백엔드 형식으로 변환
      const totalValue = portfolio.holdings.reduce((sum, holding) => sum + (holding.total_price || 0), 0);
      
      const requestData = {
        startDate: portfolio.startDate,
        endDate: portfolio.endDate,
        baseValue: portfolio.baseValue,
        rebalance: portfolio.rebalance,
        portfolios: [{
          id: "my_portfolio",
          name: "내 포트폴리오",
          tickers: portfolio.holdings.map(h => h.ticker),
          weights: portfolio.holdings.map(h => (h.total_price || 0) / totalValue)
        }]
      };

      const response = await axiosInstance.post('/agent/portfolio/analysis', requestData);

      // 응답 시리즈에 name 주입 (백엔드가 name을 반환하지 않는 경우 대비)
      const injected = (() => {
        const res = response && response.data ? { ...response.data } : {};
        const reqSeries = requestData.portfolios || [];
        const resSeries = Array.isArray(res.series) ? res.series : [];
        if (resSeries.length && reqSeries.length) {
          res.series = resSeries.map((s, i) => ({
            ...s,
            name: s.name || (reqSeries[i] && reqSeries[i].name) || s.id || `Portfolio ${i + 1}`,
          }));
        }
        return res;
      })();

      setPortfolio(prev => ({
        ...prev, 
        loading: false, 
        result: injected,
        error: null
      }));
    } catch (error) {
      console.error('포트폴리오 API 오류:', error);
      setPortfolio(prev => ({
        ...prev, 
        loading: false, 
        error: '포트폴리오 분석 중 오류가 발생했습니다.' 
      }));
    }
  };

  // 보유 주식 새로고침
  const refreshHoldings = () => {
    loadHoldings();
  };

  // 수동 포트폴리오 관련 함수들
  const handlePortfolioItemChange = (index, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      portfolios: prev.portfolios.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };


  const handleWeightChange = (portfolioIndex, tickerIndex, weight) => {
    const numWeight = parseFloat(weight) || 0;
    setPortfolio(prev => ({
      ...prev,
      portfolios: prev.portfolios.map((p, i) => {
        if (i === portfolioIndex) {
          const newWeights = [...p.weights];
          newWeights[tickerIndex] = numWeight;
          return { ...p, weights: newWeights };
        }
        return p;
      })
    }));
  };

  const addTicker = (portfolioIndex) => {
    setCurrentPortfolioIndex(portfolioIndex);
    setIsStockSearchModalOpen(true);
  };

  // 종목 선택 핸들러 (모달에서 종목 선택 시)
  const handleStockSelect = (stock) => {
    // 시뮬레이션 티커 선택 모드
    if (isSelectingSimulation) {
      handleSimulationChange("ticker", (stock?.ticker || "").toUpperCase());
      setIsSelectingSimulation(false);
      return;
    }

    if (currentPortfolioIndex === null) return;
    
    setPortfolio(prev => ({
      ...prev,
      portfolios: prev.portfolios.map((p, i) => {
        if (i === currentPortfolioIndex) {
          // 중복 체크
          if (p.tickers.includes(stock.ticker)) {
            return p;
          }
          return {
            ...p,
            tickers: [...p.tickers, stock.ticker],
            weights: [...p.weights, 1]
          };
        }
        return p;
      })
    }));
  };

  const removeTicker = (portfolioIndex, tickerIndex) => {
    setPortfolio(prev => ({
      ...prev,
      portfolios: prev.portfolios.map((p, i) => {
        if (i === portfolioIndex && p.tickers.length > 1) {
          return {
            ...p,
            tickers: p.tickers.filter((_, j) => j !== tickerIndex),
            weights: p.weights.filter((_, j) => j !== tickerIndex)
          };
        }
        return p;
      })
    }));
  };

  const normalizePortfolioWeights = (portfolioIndex) => {
    setPortfolio(prev => ({
      ...prev,
      portfolios: prev.portfolios.map((p, i) => {
        if (i === portfolioIndex) {
          const sum = p.weights.reduce((acc, w) => acc + w, 0);
          if (sum > 0) {
            return {
              ...p,
              weights: p.weights.map(w => parseFloat((w / sum).toFixed(3)))
            };
          }
        }
        return p;
      })
    }));
  };

  const getPortfolioWeightSum = (portfolioIndex) => {
    const p = portfolio.portfolios[portfolioIndex];
    return p ? p.weights.reduce((sum, w) => sum + w, 0) : 0;
  };

  const getWeightPercentage = (portfolioIndex, weight) => {
    const sum = getPortfolioWeightSum(portfolioIndex);
    return sum > 0 ? ((weight / sum) * 100).toFixed(1) : '0.0';
  };

  const addPortfolio = () => {
    const newPortfolio = {
      id: `portfolio_${Date.now()}`,
      name: `새 포트폴리오 ${portfolio.portfolios.length + 1}`,
      tickers: [],
      weights: []
    };
    setPortfolio(prev => ({
      ...prev,
      portfolios: [...prev.portfolios, newPortfolio]
    }));
  };

  const removePortfolio = (index) => {
    if (portfolio.portfolios.length <= 1) {
      return; // 최소 1개는 유지
    }
    setPortfolio(prev => ({
      ...prev,
      portfolios: prev.portfolios.filter((_, i) => i !== index)
    }));
  };

  // 수동 포트폴리오 분석 실행
  const handleManualPortfolioSubmit = async () => {
    // 유효성 검사
    const validationErrors = [];
    
    portfolio.portfolios.forEach((p, index) => {
      if (!p.name.trim()) {
        validationErrors.push(`포트폴리오 ${index + 1}: 이름을 입력해주세요.`);
      }
      const validTickers = p.tickers.filter(t => t.trim() !== '');
      if (validTickers.length === 0) {
        validationErrors.push(`${p.name}: 최소 1개 이상의 종목을 입력해주세요.`);
      }
      if (p.weights.some(w => w <= 0)) {
        validationErrors.push(`${p.name}: 모든 비중은 0보다 커야 합니다.`);
      }
    });
    
    if (validationErrors.length > 0) {
      setPortfolio(prev => ({ 
        ...prev, 
        error: validationErrors.join('\n') 
      }));
      return;
    }
    
    setPortfolio(prev => ({ ...prev, loading: true, error: null }));

    try {
      const requestData = {
        startDate: portfolio.startDate,
        endDate: portfolio.endDate,
        baseValue: portfolio.baseValue,
        rebalance: portfolio.rebalance,
        portfolios: portfolio.portfolios.map(p => {
          const sum = p.weights.reduce((acc, w) => acc + w, 0);
          const normalizedWeights = sum > 0 ? p.weights.map(w => w / sum) : p.weights;
          return {
            id: p.id,
            name: p.name || `포트폴리오 ${portfolio.portfolios.indexOf(p) + 1}`, // name이 없으면 기본값 사용
            tickers: p.tickers.filter(t => t.trim() !== ''), // 빈 종목 제거
            weights: normalizedWeights
          };
        })
      };

      const response = await axiosInstance.post('/agent/portfolio/analysis', requestData);
      
      // 응답 시리즈에 name 주입 (백엔드가 name을 반환하지 않는 경우 대비)
      const injected = (() => {
        const res = response && response.data ? { ...response.data } : {};
        const reqSeries = requestData.portfolios || [];
        const resSeries = Array.isArray(res.series) ? res.series : [];
        if (resSeries.length && reqSeries.length) {
          res.series = resSeries.map((s, i) => ({
            ...s,
            name: s.name || (reqSeries[i] && reqSeries[i].name) || s.id || `Portfolio ${i + 1}`,
          }));
        }
        return res;
      })();
      
      setPortfolio(prev => ({
        ...prev, 
        loading: false, 
        result: injected,
        error: null
      }));
    } catch (error) {
      console.error('포트폴리오 API 오류:', error);
      setPortfolio(prev => ({
        ...prev, 
        loading: false, 
        error: '포트폴리오 분석 중 오류가 발생했습니다.' 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* 모바일 헤더 */}
      <div className="bg-slate-900 sticky top-0 z-50 border-b border-slate-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                💬
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AI 투자 분석</h1>
                <p className="text-xs text-gray-400">스마트한 투자 인사이트</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 탭 네비게이션 - 모바일 최적화 */}
        <div className="bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: "analysis", name: "분석", icon: BarChart3 },
              { id: "strategy", name: "전략", icon: Brain },
              { id: "simulation", name: "시뮬레이션", icon: Target },
              { id: "portfolio", name: "포트폴리오", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors min-w-[80px] ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400 bg-blue-500 bg-opacity-10"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-medium">{tab.name}</div>
                </button>
              );
            })}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-4">
            {activeTab === "analysis" && (
              <div className="space-y-4">
                {/* 기간별 수익률 */}
                <div className="bg-slate-700 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    📈 기간별 수익률
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +8.5%
                      </div>
                      <div className="text-xs text-gray-400">1개월</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +12.3%
                      </div>
                      <div className="text-xs text-gray-400">3개월</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +18.7%
                      </div>
                      <div className="text-xs text-gray-400">6개월</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +24.1%
                      </div>
                      <div className="text-xs text-gray-400">1년</div>
                    </div>
                  </div>
                </div>

                {/* 리스크 지표 */}
                <div className="bg-slate-700 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    ⚠️ 리스크 지표
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">변동성</span>
                        <span className="font-medium text-white">18.5%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: "18.5%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">최대낙폭(MDD)</span>
                        <span className="font-medium text-red-400">-12.3%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: "12.3%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">샤프지수</span>
                      <span className="font-medium text-green-400">
                        1.85 (우수)
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI 예측 */}
                <div className="bg-gradient-to-r from-purple-500 bg-opacity-10 to-blue-500 bg-opacity-10 rounded-xl p-4 border border-purple-500 border-opacity-30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="font-medium text-white text-sm">
                      🤖 AI 예측
                    </h3>
                  </div>
                  {simulation.result?.investment_analysis ? (
                    <>
                      <div className="text-center mb-3">
                        <div className="text-xl font-bold text-purple-400">
                          {simulation.result.investmentAnalysis.metrics
                            ?.expectedTotalReturn
                            ? `${simulation.result.investmentAnalysis.metrics.expectedTotalReturn >= 0 ? "+" : ""}${simulation.result.investmentAnalysis.metrics.expectedTotalReturn.toFixed(1)}%`
                            : "+6.8% ~ +9.2%"}
                        </div>
                        <div className="text-xs text-gray-400">
                          예상 총 수익률
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 space-y-1">
                        {simulation.result.investmentAnalysis.signals?.map(
                          (signal, index) => <div key={index}>• {signal}</div>
                        ) || (
                          <>
                            <div>• 기술주 섹터 강세 지속 전망</div>
                            <div>• NVDA 실적 발표 임박 (호재 예상)</div>
                            <div>• 시장 변동성 증가 예상</div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-3">
                        <div className="text-xl font-bold text-purple-400">
                          +6.8% ~ +9.2%
                        </div>
                        <div className="text-xs text-gray-400">
                          다음 달 예상 수익률
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 space-y-1">
                        <div>• 기술주 섹터 강세 지속 전망</div>
                        <div>• NVDA 실적 발표 임박 (호재 예상)</div>
                        <div>• 시장 변동성 증가 예상</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "strategy" && (
              <div className="space-y-4">
                {/* 투자 성향 */}
                <div className="bg-blue-500 bg-opacity-10 rounded-xl p-4 border border-blue-500 border-opacity-30">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    🎯 나의 투자 성향
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-400">
                        단기매매
                      </div>
                      <div className="text-xs text-gray-400">70% 비중</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        성장주
                      </div>
                      <div className="text-xs text-gray-400">선호 스타일</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-400">
                        공격적
                      </div>
                      <div className="text-xs text-gray-400">투자 성향</div>
                    </div>
                  </div>
                </div>

                {/* 추천 전략 Top 3 */}
                <div>
                  <h3 className="font-medium text-white mb-3 text-sm">
                    💡 추천 전략 TOP 3
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-slate-700 border-2 border-green-500 border-opacity-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-green-400" />
                          <span className="font-medium text-green-300 text-sm">
                            1위: 모멘텀 전략
                          </span>
                        </div>
                        <span className="text-xs bg-green-500 bg-opacity-20 text-green-300 px-2 py-1 rounded-full">
                          92%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        상승 추세 종목 집중 투자
                      </p>
                      <div className="text-xs text-gray-400">
                        예상 수익률: +15~20% | 위험도: 높음
                      </div>
                    </div>

                    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white text-sm">
                            2위: 섹터 로테이션
                          </span>
                        </div>
                        <span className="text-xs bg-blue-500 bg-opacity-20 text-blue-300 px-2 py-1 rounded-full">
                          78%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        강세 섹터 간 자금 이동
                      </p>
                      <div className="text-xs text-gray-400">
                        예상 수익률: +10~15% | 위험도: 중간
                      </div>
                    </div>

                    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          <span className="font-medium text-white text-sm">
                            3위: 기술적 분석
                          </span>
                        </div>
                        <span className="text-xs bg-purple-500 bg-opacity-20 text-purple-300 px-2 py-1 rounded-full">
                          65%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        RSI, MACD 기반 매매
                      </p>
                      <div className="text-xs text-gray-400">
                        예상 수익률: +8~12% | 위험도: 중간
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "simulation" && (
              <div className="space-y-4">
                {/* 시뮬레이션 */}
                <div className="bg-green-500 bg-opacity-10 rounded-xl p-4 border border-green-500 border-opacity-30">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    🎮 AI 주식 예측 시뮬레이션
                  </h3>
                  <div className="space-y-3">
                    {/* 티커 입력 (StockSearchModal 사용) */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">
                        티커 심볼
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={simulation.ticker}
                          onChange={(e) =>
                            handleSimulationChange(
                              "ticker",
                              e.target.value.toUpperCase()
                            )
                          }
                          placeholder="예: AAPL"
                          className="flex-1 px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => { setIsSelectingSimulation(true); setIsStockSearchModalOpen(true); }}
                          className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                          검색
                        </button>
                      </div>
                    </div>

                    {/* baseDate (사용자 선택 가능) */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">
                        기준 날짜
                      </label>
                      <input
                        type="date"
                        value={simulation.baseDate}
                        onChange={(e) =>
                          handleSimulationChange("baseDate", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        AI 기준 날짜(baseDate)를 직접 선택하세요.
                      </p>
                    </div>

                    {/* 학습 기간과 예측 일수 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          학습 일수
                        </label>
                        <input
                          type="number"
                          value={simulation.trainDays}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "")
                              return handleSimulationChange("trainDays", "");
                            const n = parseInt(v, 10);
                            if (Number.isNaN(n)) return;
                            handleSimulationChange("trainDays", n);
                          }}
                          min="30"
                          max="365"
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">
                          예측 일수
                        </label>
                        <input
                          type="number"
                          value={simulation.predictSteps}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "")
                              return handleSimulationChange("predictSteps", "");
                            const n = parseInt(v, 10);
                            if (Number.isNaN(n)) return;
                            handleSimulationChange("predictSteps", n);
                          }}
                          min="1"
                          max="30"
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* 에러 메시지 */}
                    {simulation.error && (
                      <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg p-3">
                        <p className="text-xs text-red-300">
                          {simulation.error}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSimulationSubmit}
                      disabled={simulation.loading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {simulation.loading ? "예측 중..." : "AI 예측 실행"}
                    </button>
                  </div>

                  {/* 결과 표시 */}
                  {simulation.result && (
                    <div className="mt-4 space-y-4">
                      {/* 기본 정보 */}
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-2">
                          예측 완료
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-white">
                            {simulation.result.ticker} - $
                            {simulation.result.lastPrice?.toFixed(2)}
                          </div>
                          <div
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              simulation.result.investmentAnalysis?.action ===
                              "BUY"
                                ? "bg-green-600 text-white"
                                : simulation.result.investmentAnalysis
                                      ?.action === "SELL"
                                  ? "bg-red-600 text-white"
                                  : "bg-yellow-600 text-white"
                            }`}
                          >
                            {simulation.result.investmentAnalysis?.action ||
                              "ANALYSIS"}
                          </div>
                        </div>
                        <div className="text-xs text-gray-300 mt-1">
                          {simulation.result.investmentAnalysis
                            ?.recommendation || "분석 완료"}
                        </div>
                      </div>

                      {/* 상세 보기 버튼 */}
                      <div className="bg-slate-700 rounded-lg p-3">
                        <button
                          onClick={() => setIsChartModalOpen(true)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <LineChart className="w-4 h-4" />
                          <span>상세 분석 및 차트 보기</span>
                        </button>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          예측 결과, 투자 분석, 차트를 모두 확인하세요
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 리밸런싱 추천 */}
                <div>
                  <h3 className="font-medium text-white mb-3 text-sm">
                    ⚖️ 리밸런싱 추천
                  </h3>
                  <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl p-4 mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-yellow-300 text-sm">
                        포트폴리오 조정 필요
                      </span>
                    </div>
                    <p className="text-xs text-yellow-200">
                      기술주 비중 65% 과도 집중
                    </p>
                  </div>

                  <div className="bg-slate-700 rounded-xl border border-slate-600 p-4">
                    <h4 className="font-medium text-white mb-3 text-sm">
                      권장 액션
                    </h4>
                    <div className="space-y-2 text-xs text-gray-300">
                      <div>• AAPL 일부 매도 (20%) → 헬스케어 ETF</div>
                      <div>• JPM, BAC 금융주 추가 매수</div>
                      <div className="text-blue-400">
                        • 예상 효과: 리스크 15% 감소
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="space-y-4">
                {/* 포트폴리오 탭 선택 */}
                <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                  <div className="flex space-x-1 mb-4">
                    <button
                      onClick={() => setPortfolioTab('my')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        portfolioTab === 'my'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                      }`}
                    >
                      내 포트폴리오
                    </button>
                    <button
                      onClick={() => setPortfolioTab('manual')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        portfolioTab === 'manual'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-600 text-gray-300 hover:bg-slate-500'
                      }`}
                    >
                      커스텀 포트폴리오
                    </button>
                  </div>
                </div>

                {/* 내 포트폴리오 탭 */}
                {portfolioTab === 'my' && (
                  <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4">내 포트폴리오 분석</h3>
                  
                  {/* 기본 설정 */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">시작 날짜</label>
                      <input
                        type="date"
                        value={portfolio.startDate}
                        onChange={(e) => setPortfolio(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">종료 날짜</label>
                      <input
                        type="date"
                        value={portfolio.endDate}
                        onChange={(e) => setPortfolio(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">초기 투자금</label>
                      <input
                        type="number"
                        value={portfolio.baseValue}
                        onChange={(e) => setPortfolio(prev => ({ ...prev, baseValue: parseFloat(e.target.value) || 1.0 }))}
                        step="0.1"
                        min="0.1"
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">리밸런싱</label>
                      <select
                        value={portfolio.rebalance}
                        onChange={(e) => setPortfolio(prev => ({ ...prev, rebalance: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="none">없음</option>
                        <option value="monthly">월간</option>
                        <option value="quarterly">분기</option>
                        <option value="yearly">연간</option>
                      </select>
                    </div>
                  </div>

                  {/* 보유 주식 목록 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-white">보유 주식</label>
                      <button
                        onClick={refreshHoldings}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>새로고침</span>
                      </button>
                    </div>
                    
                    {portfolio.loading ? (
                      <div className="flex items-center justify-center h-24">
                        <div className="text-gray-400 text-sm">보유 주식을 불러오는 중...</div>
                      </div>
                    ) : portfolio.holdings.length === 0 ? (
                      <div className="flex items-center justify-center h-24">
                        <div className="text-gray-400 text-sm text-center">
                          <p>보유 주식이 없습니다.</p>
                          <p className="text-xs mt-1">먼저 주식을 매수해주세요.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {portfolio.holdings.map((holding, index) => {
                          const totalValue = portfolio.holdings.reduce((sum, h) => sum + (h.total_price || 0), 0);
                          const percentage = totalValue > 0 ? ((holding.total_price || 0) / totalValue * 100).toFixed(1) : '0.0';
                          
                          return (
                            <div key={index} className="bg-slate-600 rounded-lg p-3 border border-slate-500">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-white text-sm">
                                      {holding.ticker}
                                    </span>
                                    <span className="text-xs text-gray-300">
                                      {holding.quantity}주
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-300 mt-1">
                                    총 가격: ${(holding.total_price || 0).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-white">
                                    {percentage}%
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    비중
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 실행 버튼 */}
                  <button
                    onClick={handlePortfolioSubmit}
                    disabled={portfolio.loading || portfolio.holdings.length === 0}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {portfolio.loading ? "분석 중..." : "포트폴리오 분석 실행"}
                  </button>

                  {/* 에러 표시 */}
                  {portfolio.error && (
                    <div className="mt-3 p-3 bg-red-900 border border-red-600 rounded-lg">
                      <div className="text-xs text-red-300 whitespace-pre-line">{portfolio.error}</div>
                    </div>
                  )}
                  </div>
                )}

                {/* 커스텀 포트폴리오 탭 */}
                {portfolioTab === 'manual' && (
                  <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4">커스텀 포트폴리오 분석</h3>
                    
                    {/* 기본 설정 */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">시작 날짜</label>
                        <input
                          type="date"
                          value={portfolio.startDate}
                          onChange={(e) => setPortfolio(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">종료 날짜</label>
                        <input
                          type="date"
                          value={portfolio.endDate}
                          onChange={(e) => setPortfolio(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">초기 투자금</label>
                        <input
                          type="number"
                          value={portfolio.baseValue}
                          onChange={(e) => setPortfolio(prev => ({ ...prev, baseValue: parseFloat(e.target.value) || 1.0 }))}
                          step="0.1"
                          min="0.1"
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">리밸런싱</label>
                        <select
                          value={portfolio.rebalance}
                          onChange={(e) => setPortfolio(prev => ({ ...prev, rebalance: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="none">없음</option>
                          <option value="monthly">월간</option>
                          <option value="quarterly">분기</option>
                          <option value="yearly">연간</option>
                        </select>
                      </div>
                    </div>

                    {/* 포트폴리오 구성 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-white">포트폴리오 구성</label>
                      <button
                        onClick={addPortfolio}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                          <span>포트폴리오 추가</span>
                      </button>
                    </div>
                      
                    <div className="space-y-3">
                      {portfolio.portfolios && portfolio.portfolios.map((p, index) => {
                        if (!p || !p.tickers || !p.weights) return null;
                        
                        return (
                            <div key={p.id} className="bg-slate-600 rounded-lg p-3 border border-slate-500">
                            {/* 포트폴리오 헤더 */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={p.name || ''}
                                  onChange={(e) => handlePortfolioItemChange(index, 'name', e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-slate-500 border border-slate-400 rounded text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:bg-slate-600 transition-all"
                                  placeholder="포트폴리오 이름을 입력하세요"
                                />
                              </div>
                              <div className="flex items-center space-x-1">
                                {portfolio.portfolios.length > 1 && (
                                  <button
                                    onClick={() => removePortfolio(index)}
                                    className="p-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition-colors"
                                    title="포트폴리오 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 종목별 개별 입력 */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs text-gray-400">종목 구성</label>
                                <button
                                  onClick={() => addTicker(index)}
                                  className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>종목 추가</span>
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                  {p.tickers && p.tickers.length > 0 ? (
                                    p.tickers.map((ticker, tickerIndex) => (
                                  <div key={tickerIndex} className="flex items-center space-x-2">
                                        {/* 종목 표시 (읽기 전용) */}
                                    <div className="flex-1">
                                          <div className="w-full px-3 py-2 text-sm bg-slate-500 border border-slate-400 rounded text-white font-medium">
                                            {ticker}
                                          </div>
                                    </div>
                                    
                                    {/* 비중 입력 */}
                                        <div className="w-20">
                                      <input
                                        type="number"
                                        value={p.weights && p.weights[tickerIndex] ? p.weights[tickerIndex] : 1}
                                        onChange={(e) => handleWeightChange(index, tickerIndex, e.target.value)}
                                        placeholder="1"
                                        min="0"
                                        step="0.1"
                                            className="w-full px-2 py-2 text-sm bg-slate-500 border border-slate-400 rounded text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-center"
                                      />
                                    </div>
                                    
                                    {/* 비율 표시 */}
                                        <div className="w-16 text-sm text-gray-300 text-center font-medium">
                                      {getWeightPercentage(index, p.weights && p.weights[tickerIndex] ? p.weights[tickerIndex] : 1)}%
                                    </div>
                                    
                                    {/* 삭제 버튼 */}
                                    {p.tickers.length > 1 && (
                                      <button
                                        onClick={() => removeTicker(index, tickerIndex)}
                                            className="p-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                        title="종목 삭제"
                                      >
                                            <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                    ))
                                  ) : (
                                    <div className="flex items-center justify-center py-8 text-gray-400">
                                      <div className="text-center">
                                        <div className="text-sm mb-2">종목이 없습니다</div>
                                        <div className="text-xs">"종목 추가" 버튼을 눌러 종목을 검색해보세요</div>
                                      </div>
                                    </div>
                                  )}
                              </div>
                              
                              {/* 비중 정규화 버튼 */}
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-500">
                                <div className="text-xs text-gray-400">
                                  합계: {getPortfolioWeightSum(index).toFixed(1)} 
                                  <span className="text-gray-500 ml-1">
                                    (자동으로 100%로 변환됩니다)
                                  </span>
                                </div>
                                <button
                                  onClick={() => normalizePortfolioWeights(index)}
                                  className="flex items-center space-x-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs text-white transition-colors"
                                >
                                  <Percent className="w-3 h-3" />
                                  <span>비율 조정</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 실행 버튼 */}
                  <button
                      onClick={handleManualPortfolioSubmit}
                    disabled={portfolio.loading}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {portfolio.loading ? "분석 중..." : "포트폴리오 분석 실행"}
                  </button>

                  {/* 에러 표시 */}
                  {portfolio.error && (
                    <div className="mt-3 p-3 bg-red-900 border border-red-600 rounded-lg">
                      <div className="text-xs text-red-300 whitespace-pre-line">{portfolio.error}</div>
                    </div>
                  )}
                </div>
                )}

                {/* 포트폴리오 결과 */}
                {portfolio.result && (
                  <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4">포트폴리오 분석 결과</h3>
                    
                    {/* 포트폴리오 차트 */}
                    <div className="mb-6">
                      {/* 누적 수익률 (vs Benchmark) 차트 */}
                      <div className="text-xs text-gray-300 mb-2">누적 수익률 (vs Benchmark)</div>
                      <PortfolioChart portfolioData={portfolio.result.series || []} />
                    </div>

                    {/* KPI: 누적수익률, 최대낙폭, 변동성 */}
                    {Array.isArray(portfolio.result.metrics) && portfolio.result.metrics.length > 0 && (
                      <div className="mb-6">
                        <div className="text-sm font-medium text-white mb-3">핵심 지표 (KPI)</div>
                        <div className="grid grid-cols-1 gap-3">
                          {portfolio.result.metrics.map((m, index) => {
                            const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];
                            const seriesList = Array.isArray(portfolio.result.series) ? portfolio.result.series : [];
                            const matched = seriesList.find(s => s.id === (m && m.id));
                            const displayName = (matched && (matched.name || matched.id)) || (m && m.id) || `Portfolio ${index + 1}`;
                            const metrics = m && m.metrics ? m.metrics : {};
                            const toPct = (v) => (typeof v === 'number' && isFinite(v) ? `${(v * 100).toFixed(2)}%` : 'N/A');
                            const toPctSigned = (v) => (typeof v === 'number' && isFinite(v) ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%` : 'N/A');
                            const cumulative = metrics.cumulativeReturn;
                            const mdd = metrics.maxDrawdown; // already negative
                            const vol = metrics.volatilityAnnualized;
                            return (
                              <div key={m?.id || index} className="p-3 bg-slate-600 rounded-lg">
                                <div className="flex items-center mb-3">
                                  <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }}></div>
                                  <div className="text-white text-sm font-semibold">{displayName}</div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="bg-slate-500/40 rounded p-3 text-center">
                                    <div className="text-gray-300 text-xs mb-1">누적 수익률</div>
                                    <div className={`text-sm font-semibold ${typeof cumulative === 'number' && cumulative >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{toPctSigned(cumulative)}</div>
                                  </div>
                                  <div className="bg-slate-500/40 rounded p-3 text-center">
                                    <div className="text-gray-300 text-xs mb-1">최대낙폭</div>
                                    <div className="text-sm font-semibold text-red-300">{toPct(mdd)}</div>
                                  </div>
                                  <div className="bg-slate-500/40 rounded p-3 text-center">
                                    <div className="text-gray-300 text-xs mb-1">변동성(연간)</div>
                                    <div className="text-sm font-semibold text-yellow-300">{toPct(vol)}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 성과 요약 */}
                    {portfolio.result.series && (
                      <div className="grid grid-cols-1 gap-3">
                        {portfolio.result.series.map((portfolioData, index) => {
                          const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];
                          const seriesData = portfolioData.series || portfolioData.data || [];
                          const lastData = seriesData.length > 0 ? seriesData[seriesData.length - 1] : null;
                          
                          return (
                            <div key={index} className="p-3 bg-slate-600 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: colors[index % colors.length] }}
                                ></div>
                                <h4 className="font-medium text-white text-sm">{portfolioData.name || portfolioData.id || `Portfolio ${index + 1}`}</h4>
                              </div>
                              
                              {lastData && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-400">최종 수익률:</span>
                                    <span className={`ml-1 font-medium ${
                                      (lastData.value || lastData.cumulativeReturn || lastData.cumulative_return || lastData.return || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {((lastData.value || lastData.cumulativeReturn || lastData.cumulative_return || lastData.return || 0) * 100).toFixed(2)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">최종 날짜:</span>
                                    <span className="ml-1 font-medium text-white">
                                      {lastData.date || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

        {/* AI 인사이트 */}
        <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-white mb-3 text-sm">
            💡 AI 투자 인사이트
          </h3>
          <div className="space-y-3">
            {simulation.result?.investmentAnalysis ? (
              <>
                <div className="p-3 bg-gradient-to-r from-purple-500 bg-opacity-10 to-blue-500 bg-opacity-10 rounded-xl border border-purple-500 border-opacity-30">
                  <h4 className="font-medium text-purple-300 mb-1 text-sm">
                    {simulation.result.investmentAnalysis.recommendation ||
                      "투자 추천"}
                  </h4>
                  <p className="text-xs text-purple-200">
                    {simulation.result.investmentAnalysis.action ||
                      "기술주 비중 조정, 헬스케어 분산투자 고려"}
                  </p>
                  {simulation.result.investmentAnalysis.confidence && (
                    <p className="text-xs text-purple-300 mt-1">
                      신뢰도: {simulation.result.investmentAnalysis.confidence}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 bg-opacity-10 to-emerald-500 bg-opacity-10 rounded-xl border border-green-500 border-opacity-30">
                  <h4 className="font-medium text-green-300 mb-1 text-sm">
                    성과 분석
                  </h4>
                  <p className="text-xs text-green-200">
                    최근 30일 단타 성과 우수, 현재 전략 유지 권장
                  </p>
                  {simulation.result.investmentAnalysis.score && (
                    <p className="text-xs text-green-300 mt-1">
                      AI 점수: {simulation.result.investmentAnalysis.score}/
                      {simulation.result.investmentAnalysis.maxScore || 100}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-gradient-to-r from-purple-500 bg-opacity-10 to-blue-500 bg-opacity-10 rounded-xl border border-purple-500 border-opacity-30">
                  <h4 className="font-medium text-purple-300 mb-1 text-sm">
                    이번 주 추천
                  </h4>
                  <p className="text-xs text-purple-200">
                    기술주 비중 조정, 헬스케어 분산투자 고려
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 bg-opacity-10 to-emerald-500 bg-opacity-10 rounded-xl border border-green-500 border-opacity-30">
                  <h4 className="font-medium text-green-300 mb-1 text-sm">
                    성과 분석
                  </h4>
                  <p className="text-xs text-green-200">
                    최근 30일 단타 성과 우수, 현재 전략 유지 권장
                  </p>
                </div>
              </>
            )}


          </div>
        </div>
      </div>

      {/* 예측 차트 모달 */}
      {isChartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsChartModalOpen(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-[90vw] max-w-md mx-4 max-h-[85vh] overflow-visible">
            {/* 헤더 */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {simulation.ticker} 예측 차트
                    </h2>
                    <p className="text-xs text-gray-400">AI 주가 예측 결과</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChartModalOpen(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">현재가</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    $
                    {(
                      simulation.result?.lastPrice ||
                      simulation.result?.investmentAnalysis?.metrics
                        ?.currentPrice
                    )?.toFixed(2) || "N/A"}
                  </div>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">종목</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {simulation.result?.ticker || simulation.ticker}
                  </div>
                </div>
              </div>

              {/* 투자 추천 요약 - 상세 버전 */}
              {simulation.result?.investmentAnalysis && (
                <div
                  className={`rounded-lg p-4 ${
                    simulation.result.investmentAnalysis.action === "BUY"
                      ? "bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30"
                      : simulation.result.investmentAnalysis.action === "SELL"
                        ? "bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30"
                        : "bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">
                      AI 투자 추천
                    </span>
                    <div className="flex items-center space-x-2">
                      {simulation.result.investmentAnalysis.action === "BUY" ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : simulation.result.investmentAnalysis.action ===
                        "SELL" ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <BarChart3 className="w-4 h-4 text-yellow-400" />
                      )}
                      <span
                        className={`font-bold px-2 py-1 rounded text-xs ${
                          simulation.result.investmentAnalysis.action === "BUY"
                            ? "bg-green-600 text-white"
                            : simulation.result.investmentAnalysis.action ===
                                "SELL"
                              ? "bg-red-600 text-white"
                              : "bg-yellow-600 text-white"
                        }`}
                      >
                        {simulation.result.investmentAnalysis.action}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-white mb-3">
                    {simulation.result.investmentAnalysis.recommendation}
                  </div>

                  {/* 점수 바 표시 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((value) => (
                          <div
                            key={value}
                            className={`w-2 h-2 rounded-sm ${
                              value <=
                              simulation.result.investmentAnalysis.score
                                ? value < 0
                                  ? "bg-red-500"
                                  : value === 0
                                    ? "bg-gray-400"
                                    : "bg-green-500"
                                : "bg-gray-600"
                            } ${value !== 5 ? "mr-0.5" : ""}`}
                          ></div>
                        ))}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          simulation.result.investmentAnalysis.score > 0
                            ? "text-green-400"
                            : simulation.result.investmentAnalysis.score < 0
                              ? "text-red-400"
                              : "text-gray-300"
                        }`}
                      >
                        {simulation.result.investmentAnalysis.score > 0
                          ? "+"
                          : ""}
                        {simulation.result.investmentAnalysis.score}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Tooltip content="신뢰도는 AI 분석의 정확성을 나타냅니다. HIGH: 매우 신뢰할 만함, MEDIUM: 적당히 신뢰할 만함, LOW: 신중한 판단 필요">
                      <span className="text-gray-400 border-b border-dotted border-gray-500">
                        신뢰도:{" "}
                        {simulation.result.investmentAnalysis.confidence}
                      </span>
                    </Tooltip>
                    <span className="text-gray-400">
                      점수: {simulation.result.investmentAnalysis.score}/
                      {simulation.result.investmentAnalysis.maxScore}
                    </span>
                  </div>
                </div>
              )}

              {/* 핵심 메트릭 - 툴팁 포함 */}
              {simulation.result?.investmentAnalysis?.metrics && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-sm font-medium text-white mb-3">
                    핵심 지표
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMetricDetail(METRIC_DETAILS.currentPrice)
                        }
                        className="text-gray-400 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        현재가격
                      </button>
                      <div className="text-white font-medium">
                        $
                        {(
                          simulation.result.investmentAnalysis.metrics
                            ?.currentPrice || simulation.result.lastPrice
                        )?.toFixed(2) || "N/A"}
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMetricDetail(METRIC_DETAILS.predictedAvgPrice)
                        }
                        className="text-gray-400 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        예상평균가격
                      </button>
                      <div className="text-white font-medium">
                        $
                        {simulation.result.investmentAnalysis.metrics?.predictedAvgPrice?.toFixed(
                          2
                        ) || "N/A"}
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMetricDetail(METRIC_DETAILS.expectedTotalReturn)
                        }
                        className="text-gray-400 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        기대수익률
                      </button>
                      <div
                        className={`font-medium ${
                          (simulation.result.investmentAnalysis.metrics
                            ?.expectedTotalReturn || 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {(simulation.result.investmentAnalysis.metrics
                          ?.expectedTotalReturn || 0) >= 0
                          ? "+"
                          : ""}
                        {simulation.result.investmentAnalysis.metrics?.expectedTotalReturn?.toFixed(
                          1
                        ) || "N/A"}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 리스크 지표 - 툴팁 포함 */}
              {simulation.result?.investmentAnalysis?.riskMetrics && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="text-sm font-medium text-white mb-3">
                    리스크 지표
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <button
                        type="button"
                        onClick={() => setMetricDetail(METRIC_DETAILS.var95)}
                        className="text-gray-400 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        VaR (95%)
                      </button>
                      <div className="text-red-400 font-medium">
                        {(
                          simulation.result.investmentAnalysis.riskMetrics
                            .var95 * 100
                        )?.toFixed(1)}
                        %
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMetricDetail(METRIC_DETAILS.maxExpectedLoss)
                        }
                        className="text-gray-400 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        최대손실
                      </button>
                      <div className="text-red-400 font-medium">
                        {simulation.result.investmentAnalysis.riskMetrics.maxExpectedLoss?.toFixed(
                          1
                        )}
                        %
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setMetricDetail(METRIC_DETAILS.estimatedSharpeRatio)
                        }
                        className="text-gray-400 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        샤프비율
                      </button>
                      <div className="text-white font-medium">
                        {simulation.result.investmentAnalysis.riskMetrics.estimatedSharpeRatio?.toFixed(
                          2
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 투자 신호 */}
              {simulation.result?.investmentAnalysis?.signals &&
                simulation.result.investmentAnalysis.signals.length > 0 && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-white mb-3">
                      투자 신호
                    </div>
                    <div className="space-y-2">
                      {simulation.result.investmentAnalysis.signals.map(
                        (signal, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2 text-xs"
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                                simulation.result.investmentAnalysis.action ===
                                "BUY"
                                  ? "bg-green-400"
                                  : simulation.result.investmentAnalysis
                                        .action === "SELL"
                                    ? "bg-red-400"
                                    : "bg-yellow-400"
                              }`}
                            ></div>
                            <span className="text-gray-300">{signal}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* 예측 요약 카드 */}
              {simulation.result?.predictions &&
                simulation.result.predictions.length > 0 && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-white mb-3">
                      예측 요약
                    </div>
                    {/* 예측 라인 차트 */}
                    <div className="mb-4 bg-slate-800 rounded-md p-2">
                      <PredictionChart
                        historical={simulation.result?.historical}
                        predictions={simulation.result?.predictions}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="bg-slate-600 rounded p-3 text-center">
                        <div className="text-gray-400 mb-1">시작가</div>
                        <div className="text-white font-medium">
                          ${simulation.result?.lastPrice?.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-slate-600 rounded p-3 text-center">
                        <div className="text-gray-400 mb-1">예상종료가</div>
                        <div className="text-white font-medium">
                          $
                          {simulation.result.pricePredictions[
                            simulation.result.pricePredictions.length - 1
                          ]?.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* 예측 가격 범위 */}
                    {simulation.result.investmentAnalysis?.metrics && (
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div className="bg-green-900/30 border border-green-700 rounded p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setMetricDetail(METRIC_DETAILS.predictedMaxPrice)
                            }
                            className="text-green-400 mb-1 border-b border-dotted border-green-500 hover:text-green-300"
                          >
                            예측 최고가
                          </button>
                          <div className="text-white font-medium">
                            $
                            {simulation.result.investmentAnalysis.metrics.predictedMaxPrice?.toFixed(
                              2
                            ) || "N/A"}
                          </div>
                        </div>
                        <div className="bg-red-900/30 border border-red-700 rounded p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setMetricDetail(METRIC_DETAILS.predictedMinPrice)
                            }
                            className="text-red-400 mb-1 border-b border-dotted border-red-500 hover:text-red-300"
                          >
                            예측 최저가
                          </button>
                          <div className="text-white font-medium">
                            $
                            {simulation.result.investmentAnalysis.metrics.predictedMinPrice?.toFixed(
                              2
                            ) || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 text-xs">
                      <div className="bg-slate-600 rounded p-3 text-center">
                        <div className="text-gray-400 mb-1">일평균 수익률</div>
                        <div
                          className={`font-medium ${
                            (simulation.result.investmentAnalysis?.metrics
                              ?.expectedAvgDailyReturn || 0) >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {(simulation.result.investmentAnalysis?.metrics
                            ?.expectedAvgDailyReturn || 0) >= 0
                            ? "+"
                            : ""}
                          {simulation.result.investmentAnalysis?.metrics?.expectedAvgDailyReturn?.toFixed(
                            3
                          ) || "N/A"}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* AI 모델 정보 */}
              {(simulation.result?.trainDataCount ||
                simulation.result?.featureCount) && (
                <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-700/30 rounded-lg p-4">
                  <div className="text-sm font-medium text-white mb-3 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI 모델 정보
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-800/50 rounded p-3 text-center">
                      <div className="text-gray-400 mb-1">학습 데이터</div>
                      <div className="text-white font-medium">
                        {simulation.result.trainDataCount?.toLocaleString() ||
                          "N/A"}
                        개
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-3 text-center">
                      <div className="text-gray-400 mb-1">분석 특성</div>
                      <div className="text-white font-medium">
                        {simulation.result.featureCount || "N/A"}개
                      </div>
                    </div>
                  </div>
                  {simulation.result.investmentAnalysis?.metrics
                    ?.predictedVolatility && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setMetricDetail(METRIC_DETAILS.predictedVolatility)
                        }
                        className="text-gray-400 text-xs mb-1 border-b border-dotted border-gray-500 hover:text-white"
                      >
                        예측 변동성
                      </button>
                      <div className="text-yellow-400 font-medium">
                        {simulation.result.investmentAnalysis.metrics.predictedVolatility.toFixed(
                          2
                        )}
                        %
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Base64 차트 이미지 (백업용) */}
              {simulation.result?.chartFull &&
                simulation.result.chartFull !==
                  "sample_chart_full_base64_data" && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-white mb-3">
                      AI 생성 차트
                    </div>
                    <div className="text-center">
                      <img
                        src={`data:image/png;base64,${simulation.result.chartFull}`}
                        alt="예측 차트"
                        className="w-full max-w-md mx-auto rounded-lg"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <div
                        className="text-gray-400 text-xs mt-2"
                        style={{ display: "none" }}
                      >
                        차트 이미지를 불러올 수 없습니다
                      </div>
                    </div>
                  </div>
                )}

              {/* 지표 상세 모달 */}
              {metricDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={() => setMetricDetail(null)}
                  />
                  <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-[90vw] max-w-md mx-4">
                    <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                      <h3 className="text-white font-bold text-base">
                        {metricDetail.title}
                      </h3>
                      <button
                        onClick={() => setMetricDetail(null)}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        닫기
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* 핵심 지표 - 내용 없음 */}
                      {metricDetail.noContent && (
                        <div className="text-center py-8">
                          <div className="text-2xl mb-2">📊</div>
                          <div className="text-lg font-medium text-white">
                            {metricDetail.title}
                          </div>
                          <div className="text-sm text-gray-400 mt-2">
                            클릭하여 확인하세요
                          </div>
                        </div>
                      )}

                      {/* 샤프비율 특별 처리 */}
                      {metricDetail.isSpecial &&
                        metricDetail.title === "샤프비율" && (
                          <div className="space-y-4">
                            {/* 샤프비율 시각적 표시 */}
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="text-sm text-white font-medium mb-3">
                                샤프비율 구간별 평가
                              </div>

                              {/* 구간 표시 바 */}
                              <div className="relative bg-slate-600 rounded-full h-6 mb-3">
                                {/* 구간별 색상 */}
                                <div className="absolute left-0 top-0 w-1/4 h-full bg-red-500 rounded-l-full"></div>
                                <div className="absolute left-1/4 top-0 w-1/4 h-full bg-yellow-500"></div>
                                <div className="absolute left-1/2 top-0 w-1/4 h-full bg-green-500"></div>
                                <div className="absolute left-3/4 top-0 w-1/4 h-full bg-blue-500 rounded-r-full"></div>

                                {/* 현재값 화살표 */}
                                {(() => {
                                  const currentSharpe =
                                    simulation.result?.investmentAnalysis
                                      ?.riskMetrics?.estimatedSharpeRatio || 0;
                                  let position = 0;

                                  // 샤프비율: -1 ~ 3 범위로 매핑 (총 4 범위)
                                  // -1 ~ 0: 0~25%, 0 ~ 1: 25~50%, 1 ~ 2: 50~75%, 2 ~ 3: 75~100%
                                  if (currentSharpe < -1) {
                                    position = 5; // 최소 5%
                                  } else if (currentSharpe >= 3) {
                                    position = 95; // 최대 95%
                                  } else if (currentSharpe < 0) {
                                    // -1 ~ 0 구간: 0~25%
                                    position = ((currentSharpe + 1) / 1) * 25;
                                  } else if (currentSharpe < 1) {
                                    // 0 ~ 1 구간: 25~50%
                                    position = 25 + (currentSharpe / 1) * 25;
                                  } else if (currentSharpe < 2) {
                                    // 1 ~ 2 구간: 50~75%
                                    position =
                                      50 + ((currentSharpe - 1) / 1) * 25;
                                  } else {
                                    // 2 ~ 3 구간: 75~100%
                                    position =
                                      75 + ((currentSharpe - 2) / 1) * 25;
                                  }

                                  // 5% ~ 95% 범위로 제한
                                  position = Math.max(
                                    5,
                                    Math.min(95, position)
                                  );

                                  return (
                                    <div
                                      className="absolute top-0 transform -translate-x-1/2"
                                      style={{ left: `${position}%` }}
                                    >
                                      <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-white"></div>
                                      <div className="text-white text-xs font-bold mt-1 transform -translate-x-1/2">
                                        {currentSharpe.toFixed(2)}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* 구간별 라벨 */}
                              <div className="grid grid-cols-4 gap-1 text-xs">
                                <div className="text-center">
                                  <div className="text-red-400 font-medium">
                                    0 미만
                                  </div>
                                  <div className="text-gray-400">
                                    위험 가치 없음
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-yellow-400 font-medium">
                                    0 ~ 1
                                  </div>
                                  <div className="text-gray-400">불만족</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-green-400 font-medium">
                                    1 ~ 2
                                  </div>
                                  <div className="text-gray-400">양호</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-blue-400 font-medium">
                                    2 이상
                                  </div>
                                  <div className="text-gray-400">우수</div>
                                </div>
                              </div>
                            </div>

                            {/* 상세 설명 */}
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="text-sm text-white font-medium mb-2">
                                구간별 평가
                              </div>
                              <div className="space-y-1 text-xs text-gray-300">
                                <div>
                                  <span className="text-green-400 font-medium">
                                    1 이상:
                                  </span>{" "}
                                  좋은 투자. 위험 대비 수익률 양호
                                </div>
                                <div>
                                  <span className="text-blue-400 font-medium">
                                    2 이상:
                                  </span>{" "}
                                  매우 우수한 투자
                                </div>
                                <div>
                                  <span className="text-yellow-400 font-medium">
                                    1 미만:
                                  </span>{" "}
                                  위험 대비 수익 불만족
                                </div>
                                <div>
                                  <span className="text-red-400 font-medium">
                                    0 미만:
                                  </span>{" "}
                                  위험 감수 가치 없음
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* 리스크 지표 특별 처리 (VaR만) */}
                      {metricDetail.isSpecial &&
                        metricDetail.type === "risk" &&
                        metricDetail.title === "VaR (95%)" && (
                          <div className="space-y-4">
                            {/* 리스크 지표 시각적 표시 */}
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="text-sm text-white font-medium mb-3">
                                {metricDetail.title} 위험도
                              </div>

                              {/* 위험도 표시 바 */}
                              <div className="relative bg-slate-600 rounded-full h-6 mb-3">
                                {/* 위험도 구간별 색상 */}
                                <div className="absolute left-0 top-0 w-1/4 h-full bg-green-500 rounded-l-full"></div>
                                <div className="absolute left-1/4 top-0 w-1/4 h-full bg-yellow-500"></div>
                                <div className="absolute left-1/2 top-0 w-1/4 h-full bg-orange-500"></div>
                                <div className="absolute left-3/4 top-0 w-1/4 h-full bg-red-500 rounded-r-full"></div>

                                {/* 현재값 화살표 */}
                                {(() => {
                                  const currentValue =
                                    Math.abs(
                                      simulation.result?.investmentAnalysis
                                        ?.riskMetrics?.var95 || 0
                                    ) * 100;

                                  // VaR: 0~8% 범위로 매핑 (8% 이상은 100%로 처리)
                                  const maxValue = 8;
                                  let position = Math.min(
                                    (currentValue / maxValue) * 100,
                                    100
                                  );

                                  // 5% ~ 95% 범위로 제한 (화살표가 끝에서 잘리지 않도록)
                                  position = Math.max(
                                    5,
                                    Math.min(95, position)
                                  );

                                  return (
                                    <div
                                      className="absolute top-0 transform -translate-x-1/2"
                                      style={{ left: `${position}%` }}
                                    >
                                      <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-white"></div>
                                      <div className="text-white text-xs font-bold mt-1 transform -translate-x-1/2">
                                        {currentValue.toFixed(1)}%
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* 위험도 구간별 라벨 */}
                              <div className="grid grid-cols-4 gap-1 text-xs">
                                <div className="text-center">
                                  <div className="text-green-400 font-medium">
                                    매우낮음
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-yellow-400 font-medium">
                                    낮음
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-orange-400 font-medium">
                                    높음
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-red-400 font-medium">
                                    매우높음
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 설명 */}
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="text-sm text-gray-300 whitespace-pre-line">
                                {metricDetail.content}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* 일반 지표 설명 */}
                      {!metricDetail.isSpecial && !metricDetail.noContent && (
                        <div className="text-sm text-gray-200 whitespace-pre-line">
                          {metricDetail.content}
                        </div>
                      )}

                      {/* 기본 설명 (샤프비율의 경우) */}
                      {metricDetail.isSpecial &&
                        metricDetail.title === "샤프비율" && (
                          <div className="text-sm text-gray-300 whitespace-pre-line border-t border-slate-600 pt-4">
                            {metricDetail.content}
                          </div>
                        )}
                    </div>
                    <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 rounded-b-2xl">
                      <button
                        onClick={() => setMetricDetail(null)}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors"
                      >
                        확인
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 닫기 버튼 */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setIsChartModalOpen(false)}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 종목 검색 모달 */}
      <StockSearchModal
        isOpen={isStockSearchModalOpen}
        onClose={() => { setIsSelectingSimulation(false); setIsStockSearchModalOpen(false); }}
        onSelectStock={(stock) => { handleStockSelect(stock); setIsStockSearchModalOpen(false); }}
        currentTickers={
          isSelectingSimulation
            ? []
            : (currentPortfolioIndex !== null && portfolio.portfolios[currentPortfolioIndex]
                ? portfolio.portfolios[currentPortfolioIndex].tickers || []
                : [])
        }
      />
    </div>
  );
};

export default Chat;
