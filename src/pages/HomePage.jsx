import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X, Heart, BarChart3, TrendingUp } from "lucide-react";
import axiosInstance from "@/util/axiosInstance";

const HomePage = () => {
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState({
    id: 0,
    totalInvested: 0,
    totalAssets: 0,
    cashBalance: 0,
    nickname: "프로필을 선택해주세요",
    state: true,
  });

  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const nickname = selectedProfile?.nickname
          ? `/${selectedProfile.nickname}`
          : "";
        const response = await axiosInstance.get(
          `userprofile/profiles${nickname}`,
          { withCredentials: true }
        );

        setProfiles(response.data);

        // state가 true인 프로필 선택, 없으면 첫 번째 선택
        const activeProfile =
          response.data.find((p) => p.state) || response.data[0];
        setSelectedProfile(activeProfile);

        localStorage.setItem("newProfile", JSON.stringify(activeProfile));
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

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
const handleProfileSelect = (profile) => {
  setSelectedProfile(profile);
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
    <div className="h-full pt-10 pb-10">
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
              {selectedProfile?.nickname}
            </h2>
            <span className="text-gray-400 text-sm">
              {selectedProfile
                ? "TimeLine : 실시간 "
                : "TimeLine : 없음"}
            </span>
          </div>
        </div>

        {/* 총 잔고 */}
        <div className="mb-4">
          <h3 className="text-white text-3xl font-bold">
            {selectedProfile?.balance}
          </h3>
          <p className="text-blue-400 text-sm">-$233.76 (10.3%)</p>
        </div>

        {/* 투자/현금 정보 */}
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">투자</p>
            <p className="text-white text-lg font-semibold">
              {selectedProfile?.totalAssets}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">현금</p>
            <p className="text-white text-lg font-semibold">
              {selectedProfile?.totalInvested}
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
                  onClick={() => handleProfileSelect(profile)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200
      ${
        profile.id === selectedProfile.id
          ? "bg-red-500 bg-opacity-10 border-red-500 border-opacity-50"
          : "bg-slate-800 border-slate-700"
      }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {profile.id === selectedProfile.id && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <h4 className="text-white font-semibold text-base">
                          {profile.nickname}
                        </h4>
                        {profile.id === selectedProfile.id && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                            활성
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        서브타이틀
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-base">
                        {profile.cashBalance}
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
