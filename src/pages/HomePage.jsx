import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  X,
  Heart,
  BarChart3,
  TrendingUp,
  LogIn,
} from "lucide-react";
import axiosInstance from "@/util/axiosInstance";
import useLoginStore from "@/store/useLoginStore";
import useConfirmLogin from "../hooks/useConfirmLogin";
import useRealtimeStocks from "../hooks/useRealtimeStocks";
import useDateStore from "@/store/useDateStore";

const HomePage = () => {
  const navigate = useNavigate();
  const [holdingStocks, setHoldingStocks] = useState([]);
  const { setCurrentDate } = useDateStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const { email, lastProfileId } = useLoginStore();
  const [startInvested, setStartInvested] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({
    id: 0,
    totalInvested: 0,
    totalAssets: 0,
    cashBalance: 0,
    nickname: "프로필을 선택해주세요",
    state: true,
    change: 0,
    changeAmount: 0,
    seedMoney: 0,
  });

  // 실시간 주식 데이터 훅 사용
  const {
    stocks,
    loading: stocksLoading,
    error: stocksError,
  } = useRealtimeStocks({ enabled: true });

  // 타임라인 기반 과거 모드 여부 판별 (프로필 변경/턴 변경에 반응)
  const { currentDate } = useDateStore();
  const isRealtime = useMemo(() => {
    // 1) 백엔드 DTO의 timelineId가 오면 그것으로 판별 (권장)
    if (selectedProfile?.timelineId != null) {
      return Number(selectedProfile.timelineId) === 9;
    }
    // 2) 마지막 백업: 기존 로직 유지(임시 호환)
    const name = String(selectedProfile?.name || "").toLowerCase();
    const stateRealtime = selectedProfile?.state === true;
    return stateRealtime || name.includes("실시간");
  }, [
    selectedProfile?.timelineId,
    selectedProfile?.name,
    selectedProfile?.state,
  ]);
  const isHistorical = !isRealtime;
  const simDate = useMemo(() => {
    if (!isHistorical) return null;
    const d = new Date(currentDate || selectedProfile?.processDate);
    if (Number.isNaN(d.getTime())) return null;
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }, [isHistorical, currentDate, selectedProfile?.processDate]);
  const dateKey = useMemo(() => {
    if (!isHistorical) return null;
    const y = String(simDate?.year || "");
    const m = String(simDate?.month || "").padStart(2, "0");
    const d = String(simDate?.day || "").padStart(2, "0");
    if (!y || !m || !d) return null;
    return `${y}-${m}-${d}`;
  }, [isHistorical, simDate?.year, simDate?.month, simDate?.day]);

  // 과거 모드: 해당 날짜 기준 급상승 종목 계산 (종가 vs 전일 종가)
  const [histTop, setHistTop] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState(null);
  const [histCache, setHistCache] = useState({}); // 날짜별 캐시: { [dateKey]: { rising:[], falling:[], volume:[] } }

  // TOP3 탭 상태 (상승률/하락률/거래량)
  const [topFilter, setTopFilter] = useState("rising"); // 'rising' | 'falling' | 'volume'

  // 거래량 축약 표시
  const formatVolume = (val) => {
    const n = parseFloat(String(val ?? "").replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(n)) return "-";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
  };

  useEffect(() => {
    if (!isHistorical || !dateKey) {
      setHistTop([]);
      setHistLoading(false);
      setHistError(null);
      return;
    }

    const cachedForDate = histCache[dateKey] || {};
    if (cachedForDate[topFilter]) {
      setHistTop(cachedForDate[topFilter]);
      setHistLoading(false);
      return;
    }

    const sortParam =
      topFilter === "rising"
        ? "changePercent,desc"
        : topFilter === "falling"
          ? "changePercent,asc"
          : "volume,desc";

    const run = async () => {
      setHistLoading(true);
      setHistError(null);
      try {
        const resp = await axiosInstance.get("/db/snapshot", {
          params: { date: dateKey, page: 1, size: 3, sort: sortParam },
        });
        const rows = Array.isArray(resp?.data?.rows) ? resp.data.rows : [];
        setHistTop(rows);
        setHistCache((prev) => ({
          ...prev,
          [dateKey]: { ...(prev[dateKey] || {}), [topFilter]: rows },
        }));
      } catch {
        setHistTop([]);
        setHistError("과거 데이터 계산 실패");
      } finally {
        setHistLoading(false);
      }
    };
    run();
  }, [isHistorical, dateKey, topFilter, histCache]);

  useConfirmLogin(null);

  // 모든 프로필 불러오기
  const fetchProfiles = useCallback(async () => {
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
  }, [email]);

  // 보유 주식 리스트 불러오기
  const fetchStocks = useCallback(async () => {
    if (!email || String(email).trim() === "") return [];
    const isoDate =
      currentDate instanceof Date
        ? currentDate.toISOString().slice(0, 10)
        : currentDate;
    try {
      const response = await axiosInstance.get(
        `holdings/stocks/${lastProfileId}/${isoDate}`,
        { withCredentials: true }
      );
      const stockList = response.data.holdingsResponseDTOS || [];
      setHoldingStocks(stockList);
      return response.data.totalCurrentPrice;
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  }, [email, lastProfileId, currentDate]);

  // 초기 프로필 로드 (email / lastProfileId 가 유효할 때만 호출)
  const loadProfile = useCallback(async () => {
    try {
      const list = await fetchProfiles();
      const totalCurrentPrice = await fetchStocks();
      // lastProfileId 가 유효하면 해당 프로필 조회, 아니면 첫 번째 프로필로 세팅
      if (lastProfileId && Number(lastProfileId) > 0) {
        try {
          const response = await axiosInstance.get(
            `userprofile/profile/${lastProfileId}`,
            { withCredentials: true }
          );
          setStartInvested(response.data.totalInvested);
          console.log("인" + startInvested);
          console.log("커" + totalCurrentPrice);
          setSelectedProfile({
            ...response.data,
            totalInvested: totalCurrentPrice,
          });
          localStorage.setItem("newProfile", JSON.stringify(response.data));
          setCurrentDate(response.data.processDate);
        } catch {
          console.error("Error fetching active profile");
          if (Array.isArray(list) && list.length > 0)
            setSelectedProfile(list[0]);
        }
      } else if (Array.isArray(list) && list.length > 0) {
        setSelectedProfile(list[0]);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  }, [
    lastProfileId,
    fetchProfiles,
    fetchStocks,
    setCurrentDate,
    startInvested,
  ]);

  useEffect(() => {
    if (!email || String(email).trim() === "") return; // 이메일 준비 전엔 호출 금지
    loadProfile();
  }, [email, lastProfileId, currentDate, loadProfile]);

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
        } catch {
          /* ignore */
        }
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
      const n = parseFloat(
        String(val || "")
          .replace("%", "")
          .replace("+", "")
      );
      return Number.isFinite(n) ? n : -Infinity;
    };
    const toPrice = (val) => {
      const n = parseFloat(String(val || "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : -Infinity;
    };
    return stocks
      .map((s) => ({
        ...s,
        price: String(s?.price ?? ""),
        change: String(s?.change ?? ""),
        changePercent: String(s?.changePercent ?? ""),
      }))
      .filter((s) => toPrice(s.price) >= 1)
      .filter((s) => s.changePercent && toPct(s.changePercent) !== -Infinity)
      .sort((a, b) => toPct(b.changePercent) - toPct(a.changePercent))
      .slice(0, 3);
  }, [stocks]);

  // 하락률 상위(절대값 기준 하락 큰 것) 3개
  const topFallingStocks = useMemo(() => {
    if (!Array.isArray(stocks) || stocks.length === 0) return [];
    const toPct = (val) => {
      const n = parseFloat(
        String(val || "")
          .replace("%", "")
          .replace("+", "")
      );
      return Number.isFinite(n) ? n : Infinity;
    };
    const toPrice = (val) => {
      const n = parseFloat(String(val || "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : -Infinity;
    };
    return stocks
      .map((s) => ({
        ...s,
        price: String(s?.price ?? ""),
        change: String(s?.change ?? ""),
        changePercent: String(s?.changePercent ?? ""),
      }))
      .filter((s) => toPrice(s.price) >= 1)
      .filter((s) => s.changePercent && toPct(s.changePercent) !== Infinity)
      .sort((a, b) => toPct(a.changePercent) - toPct(b.changePercent))
      .slice(0, 3);
  }, [stocks]);

  // 거래량 상위 3개
  const topVolumeStocks = useMemo(() => {
    if (!Array.isArray(stocks) || stocks.length === 0) return [];
    const toNum = (val) => {
      const n = parseFloat(String(val || "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) ? n : -Infinity;
    };
    return stocks
      .map((s) => ({
        ...s,
        price: String(s?.price ?? ""),
        change: String(s?.change ?? ""),
        changePercent: String(s?.changePercent ?? ""),
        volume: String(s?.volume ?? "0"),
      }))
      .sort((a, b) => toNum(b.volume) - toNum(a.volume))
      .slice(0, 3);
  }, [stocks]);

  // 실시간 모드에서 선택된 TOP3 리스트
  const selectedRtList = useMemo(() => {
    switch (topFilter) {
      case "falling":
        return topFallingStocks;
      case "volume":
        return topVolumeStocks;
      case "rising":
      default:
        return topRisingStocks;
    }
  }, [topFilter, topRisingStocks, topFallingStocks, topVolumeStocks]);

  const handleCreateProfile = () => {
    // Character 페이지로 이동
    navigate("/character");
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
    <div className="h-full pt-5 pb-10">
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
            ${selectedProfile.cashBalance + selectedProfile.totalInvested}
          </h3>
          {selectedProfile.totalAssets > 0 &&
            (() => {
              const totalCurrent =
                selectedProfile.cashBalance + selectedProfile.totalInvested;
              const totalInitial = selectedProfile.seedMoney;
              const diffPrice = (totalCurrent - totalInitial).toFixed(3);
              const diffPercent = (
                ((totalCurrent - totalInitial) / totalInitial) *
                100
              ).toFixed(3);
              return (
                <p
                  className={`text-xs ${diffPrice > 0 ? "text-red-500" : "text-blue-400"}`}
                >
                  {diffPrice > 0 ? "+" : ""}${diffPrice} (
                  {diffPrice > 0 ? "+" : ""}
                  {diffPercent}%)
                </p>
              );
            })()}
        </div>

        {/* 투자/현금 정보 */}
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-1">투자 </p>

            <p className="text-white text-lg font-semibold">
              $ {selectedProfile?.totalInvested}
            </p>
            <p
              className={`text-xs ${
                selectedProfile.totalInvested - startInvested >= 0
                  ? "text-red-500"
                  : "text-blue-400"
              }`}
            >
              {((selectedProfile.totalInvested - startInvested) /
                startInvested) *
                100 >
              0
                ? "+"
                : ""}
              ${(selectedProfile.totalInvested - startInvested).toFixed(2)} (
              {selectedProfile.totalInvested - startInvested > 0 ? "+" : ""}
              {(
                ((selectedProfile.totalInvested - startInvested) /
                  startInvested) *
                100
              ).toFixed(2)}
              %)
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">현금</p>
            <p className="text-white text-lg font-semibold">
              $ {selectedProfile?.cashBalance}
            </p>
          </div>
        </div>

        {/* 주문 내역 */}
        <div
          className="flex items-center justify-between cursor-pointer hover:bg-slate-700 rounded-lg p-2 transition-colors"
          onClick={() => navigate("/orderhistory")}
        >
          <span className="text-white text-sm">주문 내역</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* 보유 주식 섹션 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">보유 주식</h3>
          <div className="space-y-2">
            {holdingStocks
              .filter((stock) => stock.quantity && stock.quantity > 0)
              .map((stock, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm overflow-hidden">
                      <img
                        src={stock.logo}
                        alt={stock.name}
                        className="w-full h-full object-cover"
                      />
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
                    <p className="text-white font-semibold text-[10px] mb-2">
                      {stock.quantity}주
                    </p>
                    <p className="text-white font-semibold text-sm">
                      ${stock.price}
                    </p>
                    <p
                      className={`text-xs ${
                        stock.change > 0 ? "text-red-500" : "text-blue-400"
                      }`}
                    >
                      {stock.change > 0 ? "+" : ""}
                      {stock.change}% ({stock.changeAmount > 0 ? "+" : ""}$
                      {stock.changeAmount})
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 실시간/과거 TOP3 섹션 (상승/하락/거래량 탭) */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-lg font-semibold">
              {topFilter === "rising"
                ? "상승률 TOP3"
                : topFilter === "falling"
                  ? "하락률 TOP3"
                  : "거래량 TOP3"}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTopFilter("rising")}
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  topFilter === "rising"
                    ? "bg-red-500 text-white"
                    : "bg-slate-700 text-gray-200"
                }`}
              >
                상승률
              </button>
              <button
                onClick={() => setTopFilter("falling")}
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  topFilter === "falling"
                    ? "bg-red-500 text-white"
                    : "bg-slate-700 text-gray-200"
                }`}
              >
                하락률
              </button>
              <button
                onClick={() => setTopFilter("volume")}
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  topFilter === "volume"
                    ? "bg-red-500 text-white"
                    : "bg-slate-700 text-gray-200"
                }`}
              >
                거래량
              </button>
            </div>
          </div>
          {(isHistorical ? histLoading : stocksLoading) ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 animate-pulse"
                >
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
              <p className="text-red-400 text-sm">
                {isHistorical ? histError : stocksError}
              </p>
            </div>
          ) : (
              isHistorical ? histTop.length === 0 : selectedRtList.length === 0
            ) ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">
                {isHistorical
                  ? "데이터를 불러올 수 없습니다"
                  : "실시간 데이터 준비중"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(isHistorical ? histTop : selectedRtList).map((stock, index) => (
                <div
                  key={`trending-${stock.symbol}-${index}`}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 rounded-lg"
                  onClick={() =>
                    navigate(
                      `/stocks/${encodeURIComponent(String(stock.symbol || ""))}`
                    )
                  }
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
                      {String(stock.price).startsWith("$")
                        ? String(stock.price)
                        : `$${String(stock.price)}`}
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
                          String(stock.changePercent || "").includes("+")
                            ? "text-red-500"
                            : "text-blue-500"
                        }`}
                      >
                        ({String(stock.changePercent)})
                      </p>
                      {topFilter === "volume" && (
                        <p className="text-xs text-gray-400 ml-1">
                          거래량: {formatVolume(stock.volume)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* 더 많은 주식목록보기 버튼 */}
          <div className="mt-3 pt-3 border-t border-slate-600">
            <button
              onClick={() => navigate("/stocks")}
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
              className="px-6 py-4 space-y-3 overflow-y-auto scrollbar-hide"
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
                        {profile.name}
                      </p>
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
