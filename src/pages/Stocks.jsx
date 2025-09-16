import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ChevronLeft, Search, X, Heart } from "lucide-react";

const Stocks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("탐색");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("이름");
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [favoriteStocks, setFavoriteStocks] = useState(new Set());

  const stocks = [
    {
      symbol: "AAPL",
      name: "애플",
      price: "$238.69",
      change: "-0.2%",
      changeAmount: "-$0.48",
      logo: "🍎",
    },
    {
      symbol: "MMM",
      name: "3M",
      price: "$155.30",
      change: "-0.1%",
      changeAmount: "-$0.16",
      logo: "3️⃣",
    },
    {
      symbol: "NFLX",
      name: "넷플릭스",
      price: "$1,243.82",
      change: "+0.8%",
      changeAmount: "+$9.87",
      logo: "🎬",
    },
    {
      symbol: "TSLA",
      name: "테슬라",
      price: "$245.67",
      change: "+2.3%",
      changeAmount: "+$5.52",
      logo: "🚗",
    },
    {
      symbol: "NVDA",
      name: "엔비디아",
      price: "$456.23",
      change: "+3.2%",
      changeAmount: "+$14.15",
      logo: "🎮",
    },
    {
      symbol: "GOOGL",
      name: "구글",
      price: "$2,856.12",
      change: "+1.2%",
      changeAmount: "+$33.89",
      logo: "🔍",
    },
    {
      symbol: "MSFT",
      name: "마이크로소프트",
      price: "$378.45",
      change: "-0.8%",
      changeAmount: "-$3.05",
      logo: "🪟",
    },
    {
      symbol: "AMZN",
      name: "아마존",
      price: "$3,234.56",
      change: "+0.5%",
      changeAmount: "+$16.12",
      logo: "📦",
    },
  ];

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

  const toggleFavorite = (symbol) => {
    setFavoriteStocks((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-white text-2xl font-bold">주식</h1>
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
              <div className="space-y-2">
                {filteredStocks.map((stock, index) => (
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
                        <p className="text-white font-semibold">
                          {stock.price}
                        </p>
                        <p
                          className={`text-sm ${
                            stock.change.includes("+")
                              ? "text-red-500"
                              : "text-blue-500"
                          }`}
                        >
                          {stock.change}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(stock.symbol);
                        }}
                        className="p-1 hover:bg-slate-600 rounded-full transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favoriteStocks.has(stock.symbol)
                              ? "text-red-500 fill-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* 관심종목 목록 */
          <div className="px-4 py-2">
            <div className="space-y-2">
              {favoriteStocks.size === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">관심종목이 없습니다</p>
                  <p className="text-gray-500 text-xs mt-1">
                    탐색 탭에서 하트를 눌러 관심종목을 추가해보세요
                  </p>
                </div>
              ) : (
                stocks
                  .filter((stock) => favoriteStocks.has(stock.symbol))
                  .map((stock, index) => (
                    <div
                      key={index}
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
                          <p className="text-white font-semibold">
                            {stock.price}
                          </p>
                          <p
                            className={`text-sm ${
                              stock.change.includes("+")
                                ? "text-red-500"
                                : "text-blue-500"
                            }`}
                          >
                            {stock.change}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleFavorite(stock.symbol)}
                          className="p-1 hover:bg-slate-600 rounded-full transition-colors"
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
