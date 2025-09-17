import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ChevronLeft, Search, X, Heart, AlertCircle, Clock } from "lucide-react";
import useRealtimeStocks from "../hooks/useRealtimeStocks";
import useWatchlist from "../hooks/useWatchlist";
import useLoginStore from "../store/useLoginStore";

const Stocks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("탐색");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("이름");
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [stocksPerPage] = useState(6); // 페이지당 6개 주식 표시

  // 로그인 상태 및 프로필 정보
  const { lastProfileId } = useLoginStore();

  // 실시간 주식 데이터 훅 사용
  const {
    stocks,
    loading,
    error,
    lastUpdate,
    isUpdating
  } = useRealtimeStocks();

  // 관심종목 훅 사용
  const {
    watchlist,
    loading: watchlistLoading,
    error: watchlistError,
    toggleWatchlist,
    isInWatchlist
  } = useWatchlist(lastProfileId);

  const newsItems = [
    {
      id: 1,
      symbol: "FIG",
      change: "+0.09%",
      changeColor: "text-red-500",
      headline:
        "캐시 우드의 아크 인베스트, 실적 발표 후 20% 하락 속에서 피그마 주식 매입",
      source: "Decrypt.co",
      timestamp: "2025-09-05 09:15",
      image: "FIGMA",
    },
    {
      id: 2,
      symbol: "TSLA",
      change: "+2.3%",
      changeColor: "text-red-500",
      headline: "테슬라, 사이버트럭 생산량 증가 발표... 주가 긍정적 영향",
      source: "Reuters",
      timestamp: "2025-09-05 08:30",
      image: "TESLA",
    },
    {
      id: 3,
      symbol: "NVDA",
      change: "+3.2%",
      changeColor: "text-red-500",
      headline: "엔비디아, AI 칩 수요 폭증으로 사상 최고 실적 기록",
      source: "Bloomberg",
      timestamp: "2025-09-05 07:45",
      image: "NVIDIA",
    },
    {
      id: 4,
      symbol: "AAPL",
      change: "-0.2%",
      changeColor: "text-blue-500",
      headline: "애플, 신형 아이폰 출시 지연 우려... 주가 소폭 하락",
      source: "The Verge",
      timestamp: "2025-09-04 18:00",
      image: "APPLE",
    },
    {
      id: 5,
      symbol: "GOOGL",
      change: "+1.2%",
      changeColor: "text-red-500",
      headline: "구글, 새로운 AI 검색 기능 공개... 시장 기대감 증폭",
      source: "TechCrunch",
      timestamp: "2025-09-04 16:30",
      image: "GOOGLE",
    },
  ];

  const handleGoBack = () => {
    navigate("/");
  };

  const [openSimModal, setOpenSimModal] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [simY, setSimY] = useState(today.getFullYear());
  const [simM, setSimM] = useState(today.getMonth() + 1);
  const [simD, setSimD] = useState(today.getDate());
  const [errMsg, setErrMsg] = useState("");

  const goToSimulator = () => {
    setErrMsg("");
    setOpenSimModal(true);
  };

  const submitSim = () => {
    const curYear = new Date().getFullYear();
    const y = Math.max(1980, Math.min(curYear, Number(simY) || curYear));
    const m = Math.max(1, Math.min(12, Number(simM) || 1));
    const d = Math.max(1, Math.min(31, Number(simD) || 1));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      setErrMsg("유효한 날짜를 입력해주세요.");
      return;
    }
    setOpenSimModal(false);
    navigate(`/trade?y=${y}&m=${m}&d=${d}`);
  };

  const handleStockSelect = (stock) => {
    navigate(`/stocks/live/${stock.symbol}`);
  };

  const removeSelectedStock = (symbol) => {
    setSelectedStocks(selectedStocks.filter((s) => s.symbol !== symbol));
  };

  const handleToggleFavorite = async (symbol) => {
    if (!lastProfileId) {
      alert('로그인이 필요합니다');
      return;
    }
    
    const success = await toggleWatchlist(symbol);
    if (!success) {
      alert('관심종목 토글에 실패했습니다');
    }
  };

  // 필터링된 주식 목록
  const filteredStocks = useMemo(() => {
    let filtered = stocks.filter(
      (stock) =>
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 정렬 적용
    switch (selectedFilter) {
      case "이름":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "가격":
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.replace('$', '').replace(',', ''));
          const priceB = parseFloat(b.price.replace('$', '').replace(',', ''));
          return priceB - priceA; // 높은 가격순
        });
        break;
      case "등락률":
        filtered.sort((a, b) => {
          const changeA = parseFloat(a.change.replace('%', ''));
          const changeB = parseFloat(b.change.replace('%', ''));
          return changeB - changeA; // 높은 등락률순
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [stocks, searchQuery, selectedFilter]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredStocks.length / stocksPerPage);
  const startIndex = (currentPage - 1) * stocksPerPage;
  const endIndex = startIndex + stocksPerPage;
  const currentStocks = filteredStocks.slice(startIndex, endIndex);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter]);

  // 페이지 이동 시 자동 갱신 제거 (스케줄러가 알아서 갱신)

  return (
    <div>
      {/* 전체 콘텐츠 영역 */}
      <div>
        {/* 뒤로가기 버튼 */}
        <div className="px-4 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>뒤로가기</span>
          </button>
        </div>

        {/* 페이지 제목 */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                {lastUpdate && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>마지막 업데이트: {lastUpdate.toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>총 {stocks.length}개 주식</span>
                  {filteredStocks.length !== stocks.length && (
                    <span>(검색 결과: {filteredStocks.length}개)</span>
                  )}
                  {filteredStocks.length > stocksPerPage && (
                    <span>(페이지 {currentPage}/{totalPages})</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={goToSimulator}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
            >
              시뮬레이터
            </button>
          </div>
        </div>

        {/* 시뮬레이터 날짜 선택 모달 */}
        <Dialog open={openSimModal} onOpenChange={setOpenSimModal}>
          <DialogContent className="bg-slate-900 text-white border border-slate-700">
            <DialogHeader>
              <DialogTitle>시뮬레이션 날짜 선택</DialogTitle>
              <DialogDescription className="text-slate-400">
                과거 특정 날짜로 돌아가 시뮬레이션을 시작합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div>
                <label className="text-sm text-slate-300">
                  연도(1980~현재)
                </label>
                <input
                  type="number"
                  className="field w-full"
                  value={simY}
                  onChange={(e) => setSimY(e.target.value)}
                  min={1980}
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">월(1~12)</label>
                <input
                  type="number"
                  className="field w-full"
                  value={simM}
                  onChange={(e) => setSimM(e.target.value)}
                  min={1}
                  max={12}
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">일(1~31)</label>
                <input
                  type="number"
                  className="field w-full"
                  value={simD}
                  onChange={(e) => setSimD(e.target.value)}
                  min={1}
                  max={31}
                />
              </div>
            </div>
            {errMsg && (
              <div className="text-red-400 text-sm mt-2">{errMsg}</div>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-3 py-2 bg-slate-800 rounded"
                onClick={() => setOpenSimModal(false)}
              >
                취소
              </button>
              <button
                className="px-3 py-2 bg-blue-600 rounded"
                onClick={submitSim}
              >
                시작
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 탭 메뉴 */}
        <div className="px-4 py-4">
          <div className="flex bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("탐색")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "탐색"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              탐색
            </button>
            <button
              onClick={() => setActiveTab("관심")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "관심"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              관심
            </button>
          </div>
        </div>

        {/* 탭에 따른 콘텐츠 */}
        {activeTab === "탐색" ? (
          <>
            {/* 검색바 */}
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="원하는 주식을 검색하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 선택된 주식 태그들 */}
            {selectedStocks.length > 0 && (
              <div className="px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {selectedStocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                    >
                      <span>
                        {stock.symbol} {stock.change}
                      </span>
                      <button
                        onClick={() => removeSelectedStock(stock.symbol)}
                        className="hover:bg-blue-700 rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 정렬 옵션 */}
            <div className="px-4 py-2">
              <div className="flex gap-2">
                {["이름", "가격", "등락률"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedFilter(option)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === option
                        ? "bg-white text-black border border-gray-300"
                        : "bg-slate-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* 주식 목록 */}
            <div className="px-4 py-2">
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                          <div className="h-3 bg-slate-700 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="h-4 bg-slate-700 rounded w-16 mb-2"></div>
                          <div className="h-3 bg-slate-700 rounded w-12"></div>
                        </div>
                        <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {currentStocks.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">검색 결과가 없습니다</p>
                      <p className="text-gray-500 text-xs mt-1">
                        다른 검색어를 시도해보세요
                      </p>
                    </div>
                  ) : (
                    currentStocks.map((stock, index) => (
                  <div
                    key={index}
                    onClick={() => handleStockSelect(stock)}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg overflow-hidden">
                        <img
                          src={`https://financialmodelingprep.com/image-stock/${stock.symbol}.png`}
                          alt={stock.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <span className="text-gray-600 font-bold text-xs hidden">
                          {stock.symbol}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{stock.name}</h4>
                        <p className="text-gray-400 text-sm">{stock.symbol}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-white font-semibold text-lg">
                          {stock.price.startsWith('$') ? stock.price : `$${stock.price}`}
                        </p>
                        <div className="flex items-center gap-1">
                          <p
                            className={`text-sm font-medium ${
                              stock.change.includes("+")
                                ? "text-red-500"
                                : "text-blue-500"
                            }`}
                          >
                            {stock.change}
                          </p>
                          <p
                            className={`text-xs ${
                              stock.changePercent.includes("+")
                                ? "text-red-500"
                                : "text-blue-500"
                            }`}
                          >
                            ({stock.changePercent})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(stock.symbol);
                        }}
                        className="p-1 hover:bg-slate-600 rounded-full transition-colors"
                        disabled={watchlistLoading}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isInWatchlist(stock.symbol)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                    ))
                  )}
                </div>
              )}

              {/* 페이지네이션 */}
              {filteredStocks.length > stocksPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {startIndex + 1}-{Math.min(endIndex, filteredStocks.length)} / {filteredStocks.length}개
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === 1 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-400">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === totalPages 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}

              {/* Redis 데이터 안내 */}
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Redis 데이터: 백그라운드 스케줄러가 20분마다 자동 갱신하는 주식 데이터 | 갱신 없이 읽기만</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 관심종목 목록 */
          <div className="px-4 py-2">
            {watchlistError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{watchlistError}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {watchlistLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
                          <div className="h-3 bg-slate-700 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="h-4 bg-slate-700 rounded w-16 mb-2"></div>
                          <div className="h-3 bg-slate-700 rounded w-12"></div>
                        </div>
                        <div className="w-6 h-6 bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : watchlist.size === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">관심종목이 없습니다</p>
                  <p className="text-gray-500 text-xs mt-1">
                    탐색 탭에서 하트를 눌러 관심종목을 추가해보세요
                  </p>
                </div>
              ) : (
                stocks
                  .filter((stock) => isInWatchlist(stock.symbol))
                  .map((stock, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg overflow-hidden">
                          <img
                            src={`https://financialmodelingprep.com/image-stock/${stock.symbol}.png`}
                            alt={stock.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <span className="text-gray-600 font-bold text-xs hidden">
                            {stock.symbol}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            {stock.name}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            {stock.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-white font-semibold text-lg">
                            {stock.price.startsWith('$') ? stock.price : `$${stock.price}`}
                          </p>
                          <div className="flex items-center gap-1">
                            <p
                              className={`text-sm font-medium ${
                                stock.change.includes("+")
                                  ? "text-red-500"
                                  : "text-blue-500"
                              }`}
                            >
                              {stock.change}
                            </p>
                            <p
                              className={`text-xs ${
                                stock.changePercent && stock.changePercent.includes("+")
                                  ? "text-red-500"
                                  : "text-blue-500"
                              }`}
                            >
                              ({stock.changePercent})
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(stock.symbol);
                          }}
                          className="p-1 hover:bg-slate-600 rounded-full transition-colors"
                          disabled={watchlistLoading}
                        >
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stocks;
