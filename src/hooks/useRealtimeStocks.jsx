import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../util/axiosInstance';

const useRealtimeStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 티커 목록 가져오기 (DB에서 712개 티커)
  const fetchTickers = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/market/tickers');
      if (response.data.status === 'ok') {
        console.log(`DB에서 ${response.data.tickers.length}개 티커를 가져왔습니다.`);
        return response.data.tickers || [];
      }
      return [];
    } catch (error) {
      console.error('티커 목록 가져오기 실패:', error);
      return [];
    }
  }, []);

  // Redis에서 개별 주식 데이터 가져오기
  const fetchStockFromRedis = useCallback(async (ticker) => {
    try {
      const response = await axiosInstance.get(`/market/redis/stock/${ticker}`);
      if (response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error(`${ticker} Redis 데이터 가져오기 실패:`, error);
      return null;
    }
  }, []);


  // Redis에서 모든 주식 데이터 가져오기 (한 번만)
  const fetchAllStocks = useCallback(async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await axiosInstance.get('/market/redis/stocks');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setStocks(response.data);
        setLastUpdate(new Date());
        setError(null);
        console.log(`Redis에서 ${response.data.length}개 주식 데이터를 가져왔습니다.`);
      } else {
        console.log('Redis 데이터가 없습니다.');
        setStocks([]);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (error) {
      console.error('Redis 주식 데이터 가져오기 실패:', error);
      setStocks([]);
      setLastUpdate(new Date());
      setError('데이터를 가져올 수 없습니다.');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchAllStocks();
  }, [fetchAllStocks]);

  // 자동 갱신 비활성화 - 스케줄러가 알아서 갱신

  return {
    stocks,
    loading,
    error,
    lastUpdate,
    isUpdating
  };
};

export default useRealtimeStocks;
