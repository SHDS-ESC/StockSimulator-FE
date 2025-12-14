import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../util/axiosInstance';

export const useWatchlist = (profileId) => {
  const [watchlist, setWatchlist] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 관심종목 목록 조회
  const fetchWatchlist = useCallback(async () => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/user/likes/list', {
        params: { profileId },
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setWatchlist(new Set(response.data.watchlist || []));
      } else {
        setError(response.data.message || '관심종목 목록을 가져올 수 없습니다');
      }
    } catch (err) {
      console.error('관심종목 목록 조회 실패:', err);
      setError('관심종목 목록을 가져올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // 관심종목 추가/제거 토글
  const toggleWatchlist = useCallback(async (stockId) => {
    if (!profileId) return false;
    
    try {
      const response = await axiosInstance.post('/user/likes/toggle', null, {
        params: { profileId, stockId },
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setWatchlist(prev => {
          const newWatchlist = new Set(prev);
          if (response.data.isInWatchlist) {
            newWatchlist.add(stockId);
          } else {
            newWatchlist.delete(stockId);
          }
          return newWatchlist;
        });
        return true;
      } else {
        setError(response.data.message || '관심종목 토글에 실패했습니다');
        return false;
      }
    } catch (err) {
      console.error('관심종목 토글 실패:', err);
      setError('관심종목 토글에 실패했습니다');
      return false;
    }
  }, [profileId]);

  // 관심종목 여부 확인
  const isInWatchlist = useCallback((stockId) => {
    return watchlist.has(stockId);
  }, [watchlist]);

  // 관심종목 추가
  const addToWatchlist = useCallback(async (stockId) => {
    if (!profileId) return false;
    
    try {
      const response = await axiosInstance.post('/user/likes/add', null, {
        params: { profileId, stockId },
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setWatchlist(prev => new Set([...prev, stockId]));
        return true;
      } else {
        setError(response.data.message || '관심종목 추가에 실패했습니다');
        return false;
      }
    } catch (err) {
      console.error('관심종목 추가 실패:', err);
      setError('관심종목 추가에 실패했습니다');
      return false;
    }
  }, [profileId]);

  // 관심종목 제거
  const removeFromWatchlist = useCallback(async (stockId) => {
    if (!profileId) return false;
    
    try {
      const response = await axiosInstance.delete('/user/likes/remove', {
        params: { profileId, stockId },
        withCredentials: true
      });
      
      if (response.data.status === 'success') {
        setWatchlist(prev => {
          const newWatchlist = new Set(prev);
          newWatchlist.delete(stockId);
          return newWatchlist;
        });
        return true;
      } else {
        setError(response.data.message || '관심종목 제거에 실패했습니다');
        return false;
      }
    } catch (err) {
      console.error('관심종목 제거 실패:', err);
      setError('관심종목 제거에 실패했습니다');
      return false;
    }
  }, [profileId]);

  // 프로필이 변경될 때마다 관심종목 목록 새로고침
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return {
    watchlist,
    loading,
    error,
    fetchWatchlist,
    toggleWatchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist
  };
};

export default useWatchlist;