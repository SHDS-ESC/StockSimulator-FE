import { useState, useEffect } from "react";
import {
  profiles as mockProfiles,
  stocks as mockStocks,
} from "../util/mockData";

// 나중에는 이 훅 안에서 실제 API(axios 등)를 호출하게 됩니다.
export const useStockData = () => {
  const [profiles, setProfiles] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API 호출을 시뮬레이션합니다.
    setTimeout(() => {
      setProfiles(mockProfiles);
      setStocks(mockStocks);
      setLoading(false);
    }, 500); // 0.5초 로딩
  }, []);

  return { profiles, stocks, loading };
};
