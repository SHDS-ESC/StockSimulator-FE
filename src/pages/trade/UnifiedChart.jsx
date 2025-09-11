import { useEffect, useRef } from "react";

export default function TradeUnifiedChart() {
  return null;
}

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
      const w = setInterval(() => { if (window.TradingView) { clearInterval(w); cb(); } }, 100);
    }
  }

  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.innerHTML = "";
    const ctn = document.createElement("div");
    ctn.style.height = "100%"; ctn.style.width = "100%"; ctn.id = containerIdRef.current;
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
          toolbar_bg: "#0f172a",
          container_id: containerIdRef.current,
        });
      });
    });
    return () => { if (wrapRef.current) wrapRef.current.innerHTML = ""; };
  }, [symbol, theme, autosize, interval]);

  return (
    <div style={{ height: 420, width: "100%" }}>
      <div ref={wrapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}


