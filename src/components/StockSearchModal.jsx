import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import axiosInstance from '../util/axiosInstance';

const StockSearchModal = ({ 
  isOpen, 
  onClose, 
  onSelectStock, 
  currentTickers = [] // 이미 선택된 티커들 (중복 방지용)
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 종목 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadStocks();
      // 모달이 열릴 때 배경 스크롤 방지 (모달 내부는 스크롤 가능)
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // 모달이 닫힐 때 스크롤 복원
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [isOpen]);

  const loadStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/market/symbols');
      if (response.data.status === 'ok') {
        setStocks(response.data.symbols || []);
      } else {
        setError('종목 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('종목 목록 로드 실패:', error);
      setError('종목 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return stocks.slice(0, 50); // 검색어가 없으면 처음 50개만 표시
    
    const query = searchQuery.toLowerCase();
    return stocks.filter(stock => 
      stock.ticker?.toLowerCase().includes(query) ||
      stock.name?.toLowerCase().includes(query) ||
      stock.sector?.toLowerCase().includes(query) ||
      stock.industry?.toLowerCase().includes(query)
    ).slice(0, 100); // 최대 100개까지 표시
  }, [stocks, searchQuery]);

  const handleStockSelect = (stock) => {
    onSelectStock(stock);
    onClose();
  };

  const isAlreadySelected = (ticker) => {
    return currentTickers.includes(ticker);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-slate-600">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <h3 className="text-lg font-semibold text-white">종목 검색</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 검색 입력 */}
        <div className="p-4 border-b border-slate-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="티커, 회사명, 섹터, 산업으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* 종목 목록 */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400 text-sm">종목 목록을 불러오는 중...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : (
            <div className="overflow-y-auto h-full max-h-96 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {filteredStocks.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-400 text-sm">
                    {searchQuery ? '검색 결과가 없습니다.' : '종목이 없습니다.'}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredStocks.map((stock, index) => (
                    <button
                      key={`${stock.ticker}-${index}`}
                      onClick={() => handleStockSelect(stock)}
                      disabled={isAlreadySelected(stock.ticker)}
                      className={`w-full p-4 text-left hover:bg-slate-700 transition-colors group ${
                        isAlreadySelected(stock.ticker) 
                          ? 'opacity-50 cursor-not-allowed bg-slate-700' 
                          : 'cursor-pointer hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-bold text-white text-lg">
                              {stock.ticker}
                            </span>
                            {isAlreadySelected(stock.ticker) && (
                              <div className="flex items-center space-x-1 text-green-400">
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-medium">선택됨</span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-200 mb-3 leading-relaxed">
                            {stock.name}
                          </div>
                          <div className="flex items-center space-x-2">
                            {stock.sector && (
                              <span className="px-3 py-1 bg-blue-600 text-xs text-white rounded-full font-medium">
                                {stock.sector}
                              </span>
                            )}
                            {stock.industry && (
                              <span className="px-3 py-1 bg-purple-600 text-xs text-white rounded-full font-medium">
                                {stock.industry}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-slate-600">
          <div className="text-xs text-gray-400 text-center">
            {filteredStocks.length}개 종목 표시 중
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockSearchModal;
