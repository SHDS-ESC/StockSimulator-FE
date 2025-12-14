import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../util/axiosInstance";

export const useStockData = () => {
  const [tickers, setTickers] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [query, setQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // DB의 티커/심볼 목록 불러오기
  useEffect(() => {
    const load = async () => {
      try {
        const [tickersRes, watchRes] = await Promise.all([
          axiosInstance.get("/db/tickers"),
          axiosInstance.get("/watchlist", { params: { user: "guest" } })
        ]);
        const arr = Array.isArray(tickersRes?.data?.tickers) ? tickersRes.data.tickers : [];
        setTickers(arr);
      } catch (_) { /* ignore */ }
    };
    load();
  }, []);

  // 팝업 오픈 시에만 심볼 메타(회사명/섹터/산업) 지연 로딩
  useEffect(() => {
    if (!showPicker || symbols.length) return;
    (async () => {
      try {
        const sres = await axiosInstance.get("/db/symbols");
        const sarr = Array.isArray(sres?.data?.symbols) ? sres.data.symbols : [];
        setSymbols(sarr);
      } catch (_) { /* ignore */ }
    })();
  }, [showPicker, symbols.length]);

  const filteredTickers = useMemo(() => {
    const q = String(query || "").trim().toUpperCase();
    const base = symbols.length ? symbols : tickers.map(t => ({ ticker: t, name: t, sector: null, industry: null }));
    const filt = !q ? base : base.filter(it => (
      String(it.ticker).toUpperCase().includes(q)
      || String(it.name || "").toUpperCase().includes(q)
      || String(it.sector || "").toUpperCase().includes(q)
      || String(it.industry || "").toUpperCase().includes(q)
    ));
    return filt; // 제한 제거
  }, [tickers, symbols, query]);

  return {
    tickers,
    symbols,
    query,
    setQuery,
    showPicker,
    setShowPicker,
    filteredTickers
  };
};