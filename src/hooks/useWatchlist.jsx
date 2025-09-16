import { useState, useEffect } from "react";
import axiosInstance from "../util/axiosInstance";

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);

  // 관심 종목 불러오기
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const watchRes = await axiosInstance.get("/watchlist", { params: { user: "guest" } });
        const warr = Array.isArray(watchRes?.data?.tickers) ? watchRes.data.tickers : [];
        setWatchlist(warr);
      } catch (_) { /* ignore */ }
    };
    loadWatchlist();
  }, []);

  const addToWatchlist = async (ticker) => {
    try {
      await axiosInstance.post('/watchlist/add', null, { 
        params: { ticker, user: 'guest' } 
      });
      setWatchlist((prev) => Array.from(new Set([...prev, ticker])));
    } catch (_) { /* ignore */ }
  };

  const removeFromWatchlist = async (ticker) => {
    try {
      await axiosInstance.delete('/watchlist/remove', { 
        params: { ticker, user: 'guest' } 
      });
      setWatchlist((prev) => prev.filter(t => t !== ticker));
    } catch (_) { /* ignore */ }
  };

  const toggleWatchlist = (ticker) => {
    const isFav = watchlist.includes(ticker);
    if (isFav) {
      removeFromWatchlist(ticker);
    } else {
      addToWatchlist(ticker);
    }
  };

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist
  };
};
