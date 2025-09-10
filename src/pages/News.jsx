import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, X } from "lucide-react";

const News = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("뉴스");
  const [selectedFilter, setSelectedFilter] = useState("이름");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState([]);

  const newsItems = [
    {
      id: 1,
      symbol: "FIG",
      change: "+0.09%",
      changeColor: "text-red-500",
      headline:
        "캐시 우드의 아크 인베스트, 실적 발표 후 20% 하락 속에서 피그마 주식 매입",
      source: "Decrypt.co",
      timestamp: "2025-09-05 14:25",
      image: "ARK INVEST",
    },
    {
      id: 2,
      symbol: "TSLA",
      change: "-0.2%",
      changeColor: "text-blue-500",
      headline:
        "트럼프의 백악관 로즈 가든 행사가 무산된 가운데, 엘론 머스크는 초대를 받았지만 '안타깝게도...",
      source: "Benzinga",
      timestamp: "2025-09-05 12:53",
      image: "Trump & Musk",
    },
    {
      id: 3,
      symbol: "AAPL",
      change: "+1.2%",
      changeColor: "text-red-500",
      headline: "애플, 새로운 AI 기능 발표로 주가 상승세 지속",
      source: "TechCrunch",
      timestamp: "2025-09-05 10:30",
      image: "Apple",
    },
    {
      id: 4,
      symbol: "NVDA",
      change: "+3.5%",
      changeColor: "text-red-500",
      headline: "엔비디아, 차세대 GPU 출시 소식에 주가 급등",
      source: "Reuters",
      timestamp: "2025-09-05 09:15",
      image: "NVIDIA",
    },
  ];

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

  const handleGoBack = () => {
    navigate("/");
  };

  const handleStockSelect = (stock) => {
    if (selectedStocks.some((s) => s.symbol === stock.symbol)) {
      setSelectedStocks(
        selectedStocks.filter((s) => s.symbol !== stock.symbol)
      );
    } else {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const removeSelectedStock = (symbol) => {
    setSelectedStocks(selectedStocks.filter((s) => s.symbol !== symbol));
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
          <h1 className="text-white text-2xl font-bold">뉴스</h1>
        </div>

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
              onClick={() => setActiveTab("뉴스")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "뉴스"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              뉴스
            </button>
          </div>
        </div>

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
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                        {stock.logo}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{stock.name}</h4>
                        <p className="text-gray-400 text-sm">{stock.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{stock.price}</p>
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
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* 뉴스 목록 */
          <div className="px-4 py-2">
            <div className="space-y-4">
              {newsItems.map((news) => (
                <div
                  key={news.id}
                  className="bg-white rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-semibold ${news.changeColor}`}>
                          {news.symbol} {news.change}
                        </span>
                      </div>
                      <h3 className="text-gray-800 font-medium text-sm leading-relaxed mb-2">
                        {news.headline}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <span>{news.source}</span>
                        <span>•</span>
                        <span>{news.timestamp}</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600 font-medium">
                      {news.image}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;

// <button
//           onClick={handleNewsClick}
//           className={`text-sm font-medium transition-colors ${
//             location.pathname === "/news"
//               ? "text-white"
//               : "text-gray-400 hover:text-white"
//           }`}
//         >
//           뉴스
//         </button>
