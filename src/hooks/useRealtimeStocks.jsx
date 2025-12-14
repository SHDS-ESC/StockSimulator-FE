import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../util/axiosInstance';

// Module-level cache to prevent refetches across route changes
let cachedStocks = null;
let cachedAtMs = 0;
let inFlightPromise = null;
// 캐시 신선도: 과도한 시간 차이로 상세와 불일치 방지 (1분)
const STALE_MS = 60 * 1000;

const useRealtimeStocks = (options = {}) => {
  const { enabled = true } = options;
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
      const response = await axiosInstance.get(`/redis/stock/${ticker}`);
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
      const now = Date.now();
      // 1) 유효한 캐시가 있으면 즉시 사용
      if (cachedStocks && (now - cachedAtMs) < STALE_MS) {
        setStocks(cachedStocks);
        setLastUpdate(new Date(cachedAtMs));
        setError(null);
        return;
      }

      // 2) 진행 중인 요청이 있으면 공유
      if (inFlightPromise) {
        await inFlightPromise;
        setStocks(cachedStocks || []);
        setLastUpdate(new Date(cachedAtMs || Date.now()));
        setError(null);
        return;
      }

      // 3) 신규 요청 수행 및 캐시 저장
      inFlightPromise = axiosInstance.get('/redis/stocks');
      const response = await inFlightPromise;
      const data = response?.data;
      if (Array.isArray(data) && data.length > 0) {
        cachedStocks = data;
        cachedAtMs = Date.now();
        setStocks(data);
        setLastUpdate(new Date(cachedAtMs));
        setError(null);
        console.log(`Redis에서 ${data.length}개 주식 데이터를 가져왔습니다.`);
      } else {
        console.log('Redis 데이터가 없습니다.');
        cachedStocks = [];
        cachedAtMs = Date.now();
        setStocks([]);
        setLastUpdate(new Date(cachedAtMs));
        setError(null);
      }
    } catch (error) {
      console.error('Redis 주식 데이터 가져오기 실패:', error);
      // 오류 시 캐시는 유지(최근 정상값 재사용 가능), 상태는 에러 반영
      setStocks(Array.isArray(cachedStocks) ? cachedStocks : []);
      setLastUpdate(new Date(cachedAtMs || Date.now()));
      setError('데이터를 가져올 수 없습니다.');
    } finally {
      setLoading(false);
      setIsUpdating(false);
      inFlightPromise = null;
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (enabled) {
      // 마운트 시 캐시가 있으면 즉시 그려주고, 필요 시 백그라운드에서 갱신
      if (cachedStocks && (Date.now() - cachedAtMs) < STALE_MS) {
        setStocks(cachedStocks);
        setLastUpdate(new Date(cachedAtMs));
        setLoading(false);
        // 너무 오래된 경우에만 갱신 시도 (여기선 생략, 라우트 전환 즉시 렌더가 목표)
      } else {
        fetchAllStocks();
      }
    } else {
      setLoading(false);
    }
  }, [fetchAllStocks, enabled]);

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
