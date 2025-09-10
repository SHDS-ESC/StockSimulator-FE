import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X, Heart, BarChart3, TrendingUp } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("SSUNW");
  // const [favoriteStocks, setFavoriteStocks] = useState(new Set());
  const [profiles, setProfiles] = useState([
    {
      id: "SSUNW",
      name: "SSUNW",
      subtitle: "TimeLine : 실시간",
      balance: "$4,776.24",
      totalAssets: "$2,266.24",
      totalInvested: "$2,500.00",
    },
    {
      id: "TRADING_PRO",
      name: "Trading Pro",
      subtitle: "Advanced Strategy",
      balance: "$8,432.17",
      totalAssets: "$5,200.89",
      totalInvested: "$3,231.28",
    },
    {
      id: "CONSERVATIVE",
      name: "Conservative",
      subtitle: "Low Risk Portfolio",
      balance: "$12,156.91",
      totalAssets: "$7,890.45",
      totalInvested: "$4,266.46",
    },
    {
      id: "CRYPTO_FOCUS",
      name: "Crypto Focus",
      subtitle: "Digital Assets Only",
      balance: "$3,892.15",
      totalAssets: "$2,100.33",
      totalInvested: "$1,791.82",
    },
    {
      id: "DAY_TRADER",
      name: "Day Trader",
      subtitle: "Short-term Scalping",
      balance: "$6,421.67",
      totalAssets: "$3,888.90",
      totalInvested: "$2,532.77",
    },
    {
      id: "SWING_MASTER",
      name: "Swing Master",
      subtitle: "Medium-term Holdings",
      balance: "$15,892.34",
      totalAssets: "$9,455.12",
      totalInvested: "$6,437.22",
    },
  ]);

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
  ];

  const currentProfile = profiles.find((p) => p.id === selectedProfile);

  const handleProfileSelect = (profileId) => {
    setSelectedProfile(profileId);
    setTimeout(() => setIsProfileModalOpen(false), 200);
  };

  const handleCreateProfile = () => {
    // Character 페이지로 이동
    navigate("/character");
  };

  const addNewProfile = (newProfileData) => {
    const newProfile = {
      id: `PROFILE_${Date.now()}`, // 고유 ID 생성
      name: newProfileData.nickname,
      subtitle: `TimeLine : ${newProfileData.timeline}`,
      balance: "$0.00", // 초기 잔고
      totalAssets: "$0.00",
      totalInvested: "$0.00",
    };

    setProfiles((prev) => [...prev, newProfile]);
    setSelectedProfile(newProfile.id); // 새로 생성된 프로필을 선택
  };

  // localStorage에서 새 프로필 확인
  useEffect(() => {
    const checkForNewProfile = () => {
      const newProfileData = localStorage.getItem("newProfile");
      if (newProfileData) {
        const profileData = JSON.parse(newProfileData);
        addNewProfile(profileData);
        localStorage.removeItem("newProfile"); // 사용 후 제거
      }
    };

    checkForNewProfile();
  }, []);

  // const toggleFavorite = (stockSymbol) => {
  //   setFavoriteStocks((prev) => {
  //     const newFavorites = new Set(prev);
  //     if (newFavorites.has(stockSymbol)) {
  //       newFavorites.delete(stockSymbol);
  //     } else {
  //       newFavorites.add(stockSymbol);
  //     }
  //     return newFavorites;
  //   });
  // };

  return (
    <div className="h-full">
      {/* 전체 콘텐츠 영역 */}

      {/* 자산 정보 섹션 (다크 배경) */}
      <div className="bg-slate-950 mx-4 rounded-xl p-1 mb-4">
        {/* 프로필명 */}
        <div className="mb-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
            <h2 className="text-white text-lg font-semibold">
              {currentProfile?.name}
            </h2>
            <span className="text-gray-400 text-sm">
              {currentProfile?.subtitle}
            </span>
          </div>
        </div>

        {/* 총 잔고 */}
        <div className="mb-4">
          <h3 className="text-white text-3xl font-bold">
            {currentProfile?.balance}
          </h3>
          <p className="text-blue-400 text-sm">-$233.76 (10.3%)</p>
        </div>

        {/* 투자/현금 정보 */}
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">투자</p>
            <p className="text-white text-lg font-semibold">
              {currentProfile?.totalAssets}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">현금</p>
            <p className="text-white text-lg font-semibold">
              {currentProfile?.totalInvested}
            </p>
          </div>
        </div>

        {/* 주문 내역 */}
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">주문 내역</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* 보유 주식 섹션 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">보유 주식</h3>
          <div className="space-y-2">
            {stocks.map((stock, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    {stock.logo}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {stock.name}
                    </h4>
                    <p className="text-gray-400 text-xs">{stock.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm">
                    {stock.price}
                  </p>
                  <p
                    className={`text-xs ${stock.change.includes("+") ? "text-red-500" : "text-gray-400"}`}
                  >
                    {stock.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 실시간 급상승 종목 섹션 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">
            실시간 급상승 종목
          </h3>
          <div className="space-y-2">
            {stocks.slice(0, 3).map((stock, index) => (
              <div
                key={`trending-${index}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">
                    {stock.logo}
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {stock.name}
                    </h4>
                    <p className="text-gray-400 text-xs">{stock.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm">
                    {stock.price}
                  </p>
                  <p
                    className={`text-xs ${stock.change.includes("+") ? "text-red-500" : "text-gray-400"}`}
                  >
                    {stock.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* 더 많은 주식목록보기 버튼 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <button className="w-full py-2 text-center text-red-500 text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors">
              더 많은 주식목록보기
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 선택 모달 */}
      {isProfileModalOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-50 flex items-end">
          <div
            className="w-full max-w-md mx-auto bg-slate-900 rounded-t-3xl transform transition-transform duration-300 ease-out"
            style={{ maxHeight: "600px" }}
          >
            {/* 드래그 핸들 */}
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-4"></div>

            {/* 모달 헤더 */}
            <div className="px-6 pb-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-xl font-semibold">
                  프로필 선택
                </h3>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* 프로필 목록 */}
            <div
              className="px-6 py-4 space-y-3 overflow-y-auto"
              style={{ maxHeight: "400px" }}
            >
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile.id)}
                  className={`
                    p-4 rounded-2xl border cursor-pointer transition-all duration-200 active:scale-[0.98] touch-manipulation
                    ${
                      profile.id === selectedProfile
                        ? "bg-red-500 bg-opacity-10 border-red-500 border-opacity-50"
                        : "bg-slate-800 border-slate-700"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {profile.id === selectedProfile && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <h4 className="text-white font-semibold text-base">
                          {profile.name}
                        </h4>
                        {profile.id === selectedProfile && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                            활성
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {profile.subtitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-base">
                        {profile.balance}
                      </p>
                      <p className="text-gray-400 text-xs">총자산</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 새 프로필 추가 버튼 */}
            <div className="px-6 py-4 border-t border-slate-700">
              <button
                onClick={handleCreateProfile}
                className="w-full p-4 bg-slate-800 rounded-2xl border border-slate-600 border-dashed text-gray-400 font-medium active:scale-[0.98] transition-all touch-manipulation"
              >
                + 새 프로필 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
