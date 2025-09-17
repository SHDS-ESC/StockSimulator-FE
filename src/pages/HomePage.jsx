import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  X,
  Heart,
  BarChart3,
  TrendingUp,
  LogIn,
  LogOut,
} from "lucide-react";
import axiosInstance from "@/util/axiosInstance";
import useLoginStore from "@/store/useLoginStore";
import useConfirmLogin from "../hooks/useConfirmLogin";
import useRealtimeStocks from "../hooks/useRealtimeStocks";
import useDateStore from "@/store/useDateStore";

const HomePage = () => {
  const navigate = useNavigate();
  const { setCurrentDate } = useDateStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const { email, lastProfileId, clear } = useLoginStore();

  // 실시간 주식 데이터 훅 사용
  const {
    stocks,
    loading: stocksLoading,
    error: stocksError,
    lastUpdate,
    isUpdating
  } = useRealtimeStocks();

  const [selectedProfile, setSelectedProfile] = useState({
    id: 0,
    totalInvested: 0,
    totalAssets: 0,
    cashBalance: 0,
    nickname: "프로필을 선택해주세요",
    state: true,
  });

  useConfirmLogin(null);
  // 초기 프로필 로드 (email / lastProfileId 가 유효할 때만 호출)
  const loadProfile = async () => {
    try {
      const list = await fetchProfiles();
      // lastProfileId 가 유효하면 해당 프로필 조회, 아니면 첫 번째 프로필로 세팅
      if (lastProfileId && Number(lastProfileId) > 0) {
        try {
          const response = await axiosInstance.get(
            `userprofile/profile/${lastProfileId}`,
            { withCredentials: true }
          );
          setSelectedProfile(response.data);
          localStorage.setItem("newProfile", JSON.stringify(response.data));
          setCurrentDate(response.data.processDate)
        } catch (e) {
          console.error("Error fetching active profile:", e);
          if (Array.isArray(list) && list.length > 0)
            setSelectedProfile(list[0]);
        }
      } else if (Array.isArray(list) && list.length > 0) {
        setSelectedProfile(list[0]);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  // 모든 프로필 불러오기
  const fetchProfiles = async () => {
    if (!email || String(email).trim() === "") return [];
    try {
      const response = await axiosInstance.get(
        `userprofile/profiles/${encodeURIComponent(email)}`,
        { withCredentials: true }
      );
      const list = response.data || [];
      setProfiles(list);
      return list;
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  };
  useEffect(() => {
    if (!email || String(email).trim() === "") return; // 이메일 준비 전엔 호출 금지
    loadProfile();
  }, [email, lastProfileId]);

  // 프로필 선택
  const handleProfileSelect = (profile) => {
    axiosInstance
      .post(
        `userprofile/select`,
        { userProfileId: profile.id, email: email },
        { withCredentials: true }
      )
      .then((res) => {
        console.log("프로필 선택 성공:", res.data.id);
        setSelectedProfile(profile);
        useLoginStore.setState({ lastProfileId: profile.id });
        setTimeout(() => setIsProfileModalOpen(false), 200);
      });
  };

  // 등락률 순으로 정렬된 상위 3개 주식
  const topRisingStocks = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];

    return stocks
      .filter(stock => stock.change && stock.changePercent) // 유효한 데이터만 필터링
      .sort((a, b) => {
        const changeA = parseFloat(a.change.replace('%', ''));
        const changeB = parseFloat(b.change.replace('%', ''));
        return changeB - changeA; // 높은 등락률순
      })
      .slice(0, 3); // 상위 3개만
  }, [stocks]);

  const handleCreateProfile = () => {
    // Character 페이지로 이동
    navigate("/character");
  };

  const handleGoLogin = () => navigate("/login");
  const handleLogout = async () => {
    try {
      await axiosInstance.post("/user/logout");
    } catch (_) {
      /* ignore */
    }
    clear();
    sessionStorage.removeItem("accessToken");
    navigate("/");
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
      {/* 상단 로그인/로그아웃 액션 (상태에 따라 토글) */}
      <div className="px-4 mb-3 flex gap-2">
        {sessionStorage.getItem("accessToken") ? (
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg bg-slate-800 text-white flex items-center gap-2"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        ) : null}
      </div>
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
                ? "TimeLine : " + selectedProfile.name
                : "TimeLine : 없음"}
            </span>
          </div>
        </div>

        {/* 총 잔고 */}
        <div className="mb-4">
          <h3 className="text-white text-3xl font-bold">
            $ {selectedProfile?.cashBalance}
          </h3>
          <p className="text-blue-400 text-sm">-$233.76 (10.3%)</p>
        </div>

        {/* 투자/현금 정보 */}
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">투자</p>
            <p className="text-white text-lg font-semibold">
              $ {selectedProfile?.totalAssets}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">현금</p>
            <p className="text-white text-lg font-semibold">
              $ {selectedProfile?.totalInvested}
            </p>
          </div>
        </div>

        {/* 주문 내역 */}
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">주문 내역</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* 보유 주식 섹션 - 현재는 빈 상태 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">보유 주식</h3>
          <div className="space-y-2">
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">보유 주식이 없습니다</p>
              <p className="text-gray-500 text-xs mt-1">
                주식을 구매하여 포트폴리오를 구성해보세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 급상승 종목 섹션 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">
            실시간 급상승 종목
          </h3>
          {stocksLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-2 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-slate-700 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-slate-700 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-slate-700 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stocksError ? (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm">{stocksError}</p>
            </div>
          ) : topRisingStocks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">데이터를 불러올 수 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topRisingStocks.map((stock, index) => (
                <div
                  key={`trending-${stock.symbol}-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm overflow-hidden">
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
                      <h4 className="text-white font-medium text-sm">
                        {stock.name}
                      </h4>
                      <p className="text-gray-400 text-xs">{stock.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">
                      {stock.price.startsWith('$') ? stock.price : `$${stock.price}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <p
                        className={`text-xs font-medium ${
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
                </div>
              ))}
            </div>
          )}
          {/* 더 많은 주식목록보기 버튼 */}
          <div className="mt-3 pt-3 border-t border-slate-600">
            <button
              onClick={() => navigate('/stocks')}
              className="w-full py-2 text-center text-red-500 text-sm font-medium hover:bg-slate-700 rounded-lg transition-colors"
            >
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
                      <p className="text-gray-400 text-sm mt-1">서브타이틀</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold text-base">
                        $ {profile.cashBalance}
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
