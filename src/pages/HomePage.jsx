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
  const [stocks, setStocks] = useState([
    {
      ticker: "AAPL", //response.data.stock.ticker
      name: "애플", //response.data.stock.name
      price: "$238.69", // 계산필요
      change: "-0.2%", // 계산필요 (등락률)
      changeAmount: "-$0.48", // 등락가
      logo: "🍎", // response.data.stock.image
    },
    {
      ticker: "MMM",
      name: "3M",
      price: "$155.30",
      change: "-0.1%",
      changeAmount: "-$0.16",
      logo: "3️⃣",
    },
    {
      ticker: "NFLX",
      name: "넷플릭스",
      price: "$1,243.82",
      change: "+0.8%",
      changeAmount: "+$9.87",
      logo: "🎬",
    },
    {
      ticker: "TSLA",
      name: "테슬라",
      price: "$245.67",
      change: "+2.3%",
      changeAmount: "+$5.52",
      logo: "🚗",
    },
    {
      ticker: "NVDA",
      name: "엔비디아",
      price: "$456.23",
      change: "+3.2%",
      changeAmount: "+$14.15",
      logo: "🎮",
    },
  ]);
  const { setCurrentDate } = useDateStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const { email, lastProfileId, clear } = useLoginStore();
  const [selectedProfile, setSelectedProfile] = useState({
    id: 0,
    totalInvested: 0,
    totalAssets: 0,
    cashBalance: 0,
    nickname: "프로필을 선택해주세요",
    state: true,
  });

  // 실시간 주식 데이터 훅 사용
  const {
    stocks,
    loading: stocksLoading,
    error: stocksError,
    lastUpdate,
    isUpdating
  } = useRealtimeStocks();

  // 타임라인 기반 과거 모드 여부 판별 (프로필 변경/턴 변경에 반응)
  const { currentDate } = useDateStore();
  const isRealtime = useMemo(() => {
    const name = String(selectedProfile?.name || '').trim();
    const d = String(currentDate || selectedProfile?.processDate || '');
    return name === '실시간' || d.startsWith('0000');
  }, [selectedProfile?.name, currentDate, selectedProfile?.processDate]);
  const isHistorical = !isRealtime;
  const simDate = useMemo(() => {
    if (!isHistorical) return null;
    const d = new Date(currentDate || selectedProfile?.processDate);
    if (Number.isNaN(d.getTime())) return null;
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  }, [isHistorical, currentDate, selectedProfile?.processDate]);

  // 과거 모드: 해당 날짜 기준 급상승 종목 계산 (종가 vs 전일 종가)
  const [histTop, setHistTop] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState(null);
  const [histCache, setHistCache] = useState({}); // 날짜별 캐시

  useEffect(() => {
    if (!isHistorical) { setHistTop([]); setHistLoading(false); setHistError(null); return; }

    // 캐시 키 생성
    const cacheKey = `${simDate?.year}-${simDate?.month}-${simDate?.day}`;
    if (histCache[cacheKey]) {
      setHistTop(histCache[cacheKey]);
      setHistLoading(false);
      return;
    }

    const run = async () => {
      setHistLoading(true); setHistError(null);
      try {
        const base = new Date(Date.UTC(simDate.year, simDate.month - 1, simDate.day));
        const selectedEpoch = Math.floor(base.getTime() / 1000);
        const prevEpoch = selectedEpoch - 86400;
        const curFrom = prevEpoch;
        const curTo = selectedEpoch + 86400 * 7;
        const prevFrom = prevEpoch - 86400 * 7;
        const prevTo = prevEpoch;
        const list = Array.isArray(stocks) ? stocks : [];
        const symbols = list.map(s => s.symbol).filter(Boolean).slice(0, 150); // 과도한 호출 방지 제한
        const results = await Promise.allSettled(symbols.map(async (sym) => {
          const [curRes, prevRes] = await Promise.all([
            axiosInstance.get('/db/candles', { params: { ticker: sym, from: curFrom, to: curTo } }),
            axiosInstance.get('/db/candles', { params: { ticker: sym, from: prevFrom, to: prevTo } }),
          ]);
          const curT = curRes?.value?.data?.t || curRes?.data?.t || [];
          const curC = curRes?.value?.data?.c || curRes?.data?.c || [];
          let currentClose = null;
          for (let i = 0; i < curT.length; i++) { if (curT[i] >= selectedEpoch) { currentClose = curC[i]; break; } }
          const prevT = prevRes?.value?.data?.t || prevRes?.data?.t || [];
          const prevC = prevRes?.value?.data?.c || prevRes?.data?.c || [];
          let prevClose = null;
          for (let i = prevT.length - 1; i >= 0; i--) { if (prevT[i] <= prevEpoch) { prevClose = prevC[i]; break; } }
          if (typeof currentClose !== 'number' || typeof prevClose !== 'number') return null;
          const chg = currentClose - prevClose;
          const pct = prevClose !== 0 ? (chg / prevClose) * 100 : 0;
          const meta = list.find(s => s.symbol === sym) || { name: sym };
          return {
            symbol: sym,
            name: meta.name || sym,
            price: `$${currentClose.toFixed(2)}`,
            change: `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}`,
            changePercent: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
          };
        }));
        const rows = results.map(r => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean);
        rows.sort((a, b) => parseFloat(String(b.changePercent).replace('%','')) - parseFloat(String(a.changePercent).replace('%','')));
        const top3 = rows.slice(0, 3);
        setHistTop(top3);
        setHistCache(prev => ({ ...prev, [cacheKey]: top3 }));
      } catch (_) {
        setHistTop([]); setHistError('과거 데이터 계산 실패');
      } finally {
        setHistLoading(false);
      }
    };
    run();
  }, [isHistorical, simDate?.year, simDate?.month, simDate?.day, stocks, selectedProfile?.id, histCache]);


  useConfirmLogin(null);
  // 초기 프로필 로드 (email / lastProfileId 가 유효할 때만 호출)
  const loadProfile = async () => {
    try {
      const list = await fetchProfiles();
      const stcokList = await fetchStocks();
      // lastProfileId 가 유효하면 해당 프로필 조회, 아니면 첫 번째 프로필로 세팅
      if (lastProfileId && Number(lastProfileId) > 0) {
        setStocks(stcokList);
        try {
          const response = await axiosInstance.get(
            `userprofile/profile/${lastProfileId}`,
            { withCredentials: true }
          );
          setSelectedProfile(response.data);
          localStorage.setItem("newProfile", JSON.stringify(response.data));
          setCurrentDate(response.data.processDate);
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

  // 보유 주식 리스트 불러오기
  const fetchStocks = async () => {
    if (!email || String(email).trim() === "") return [];
    try {
      const response = await axiosInstance.get(
        `holdings/stocks/${lastProfileId}`,
        { withCredentials: true }
      );
      const stockList = response.data || [];

      setStocks(stockList);
      return stockList;
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  };

  useEffect(
    () => {
      if (!email || String(email).trim() === "") return; // 이메일 준비 전엔 호출 금지
      loadProfile();
    },
    [email, lastProfileId]
  );

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
        try {
          localStorage.setItem("newProfile", JSON.stringify(profile));
          if (profile?.processDate) setCurrentDate(profile.processDate);
        } catch (_) { /* ignore */ }
        // 프로필 변경 시 급상승 종목 즉시 재계산 트리거
        setTimeout(() => {
          // selectedProfile/processDate 변경과 currentDate 설정에 의해 useEffect가 재실행됨
        }, 0);
        setTimeout(() => setIsProfileModalOpen(false), 200);
      });
  };

  // 등락률 순으로 정렬된 상위 3개 주식
  const topRisingStocks = useMemo(() => {
    if (!Array.isArray(stocks) || stocks.length === 0) return [];
    const toPct = (val) => {
      const n = parseFloat(String(val || '').replace('%', '').replace('+',''));
      return Number.isFinite(n) ? n : -Infinity;
    };
    return stocks
      .map(s => ({
        ...s,
        price: String(s?.price ?? ''),
        change: String(s?.change ?? ''),
        changePercent: String(s?.changePercent ?? ''),
      }))
      .filter(s => s.changePercent && toPct(s.changePercent) !== -Infinity)
      .sort((a, b) => toPct(b.changePercent) - toPct(a.changePercent))
      .slice(0, 3);
  }, [stocks]);

  const handleCreateProfile = () => {
    // Character 페이지로 이동
    navigate("/character");
  };

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

      {/* 보유 주식 섹션 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">보유 주식</h3>
          <div className="space-y-2">
            {stocks.map((stock, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm overflow-hidden">
                    {/* 이미지 */}
                    <img
                      src={stock.logo}
                      alt={stock.name}
                      className="w-full h-full object-cover"
                    />
                    {/* */}
                    <span className="text-gray-600 font-bold text-xs hidden">
                      {stock.ticker}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">
                      {stock.name}
                    </h4>
                    <p className="text-gray-400 text-xs">{stock.ticker}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm">
                    $ {stock.price}
                  </p>
                  <p
                    className={`text-xs ${stock.change > 0 ? "text-red-500" : "text-blue-400"}`}
                  >
                    $ {stock.change}%
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
          {(isHistorical ? histLoading : stocksLoading) ? (
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
          ) : (isHistorical ? histError : stocksError) ? (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm">{isHistorical ? histError : stocksError}</p>
            </div>
          ) : (isHistorical ? histTop.length === 0 : topRisingStocks.length === 0) ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">데이터를 불러올 수 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(isHistorical ? histTop : topRisingStocks).map((stock, index) => (
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
                      {String(stock.price).startsWith('$') ? String(stock.price) : `$${String(stock.price)}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <p
                        className={`text-xs font-medium ${
                          String(stock.change).includes("+")
                            ? "text-red-500"
                            : "text-blue-500"
                        }`}
                      >
                        {String(stock.change)}
                      </p>
                      <p
                        className={`text-xs ${
                          String(stock.changePercent || '').includes("+")
                            ? "text-red-500"
                            : "text-blue-500"
                        }`}
                      >
                        ({String(stock.changePercent)})
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
