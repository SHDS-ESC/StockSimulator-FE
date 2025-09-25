import React, { useEffect, useRef } from "react";
import { loadLW } from "@/lib/lightweight";

/**
 * LightChart - Lightweight Charts 얇은 래퍼
 * props:
 * - type: 'line' | 'candlestick'
 * - data: array of { time, value } | { time, open, high, low, close }
 * - theme: 'dark' | 'light' (기본: 'dark')
 * - height: number (기본: 260)
 * - onReady?: ({ chart, series }) => void
 */
export default function LightChart({ type = 'line', data = [], theme = 'dark', height = 260, onReady }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    let active = true;
    let disposeResize = null;

    const init = async () => {
      const LW = await loadLW();
      if (!active || !LW || !containerRef.current) return;

      const isDark = theme === 'dark';
      const baseBg = isDark ? '#0f172a' : 'white';
      const baseText = isDark ? '#cbd5e1' : '#333';
      const gridColor = isDark ? '#1e293b' : '#f6f6f6';
      const gridVert = isDark ? '#233046' : '#eee';

      const chart = LW.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: { background: { color: baseBg }, textColor: baseText },
        crosshair: { mode: LW.CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderVisible: false },
        leftPriceScale: { visible: false },
        grid: { vertLines: { color: gridVert }, horzLines: { color: gridColor } },
      });

      let series = null;
      if (type === 'candlestick') {
        series = chart.addCandlestickSeries({
          upColor: '#26a69a', downColor: '#ef5350',
          wickUpColor: '#26a69a', wickDownColor: '#ef5350',
          borderVisible: false,
        });
      } else {
        series = chart.addLineSeries({ color: '#22c55e', lineWidth: 2 });
      }

      chartRef.current = chart;
      seriesRef.current = series;

      try {
        if (Array.isArray(data) && data.length) {
          series.setData(data);
          chart.timeScale().fitContent();
        }
      } catch (_) {}

      const onResize = () => {
        if (!containerRef.current || !chartRef.current) return;
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth, height });
      };
      window.addEventListener('resize', onResize);
      disposeResize = () => window.removeEventListener('resize', onResize);

      if (typeof onReady === 'function') onReady({ chart, series });
    };

    init();

    return () => {
      active = false;
      try { disposeResize && disposeResize(); } catch (_) {}
      try { chartRef.current && chartRef.current.remove(); } catch (_) {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [type, theme, height]);

  useEffect(() => {
    // 데이터 변경 시 시리즈 업데이트
    try {
      if (seriesRef.current && Array.isArray(data)) {
        seriesRef.current.setData(data);
      }
    } catch (_) {}
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', height }} />
  );
}



