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

// 유틸리티 함수들
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "" || value === "0")
    return "$ 0";

  const numValue =
    typeof value === "string" ? parseFloat(value.replace(/[$,]/g, "")) : value;

  if (!Number.isFinite(numValue)) return "$ 0";

  const absValue = Math.abs(numValue);
  const formatted = absValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0, // 소수점 없애기
  });

  return numValue < 0
    ? `- ${formatted.replace("$", "$ ")}`
    : `+${formatted.replace("$", "$ ")}`;
};

const formatCurrencyValue = (value) => {
  if (value === null || value === undefined || value === "" || value === "0")
    return "$ 0";

  const numValue =
    typeof value === "string" ? parseFloat(value.replace(/[$,]/g, "")) : value;

  if (!Number.isFinite(numValue)) return "$ 0";

  const absValue = Math.abs(numValue);
  const formatted = absValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0, // 소수점 없애기
  });

  return formatted.replace("$", "$ ");
};

const formatPercentage = (value) => {
  if (value === null || value === undefined || value === "") return "0.00%";
  const numValue =
    typeof value === "string" ? parseFloat(value.replace(/[+%]/g, "")) : value;
  if (!Number.isFinite(numValue)) return "0.00%";
  return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(2)}%`;
};

const formatVolume = (val) => {
  const n = parseFloat(String(val ?? "").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "-";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
};

const parseNumericValue = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(String(val).replace("%", "").replace(/\+/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

const getColorClass = (value) => {
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-blue-400";
  return "text-gray-400";
};

// Shimmer 스켈레톤 컴포넌트
const ShimmerSkeleton = ({ className }) => (
  <div className={`bg-slate-700 rounded ${className} relative overflow-hidden`}>
    <div className="absolute inset-0">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent transform -translate-x-full animate-shimmer-sweep"></div>
    </div>
  </div>
);

// 커스텀 CSS 애니메이션을 위한 스타일
const shimmerStyles = `
@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer-sweep {
  animation: shimmer-sweep 2s infinite ease-in-out;
}
`;

const HomePage = () => {
  const navigate = useNavigate();
  const [holdingStocks, setHoldingStocks] = useState([]);
  const { setCurrentDate } = useDateStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const { email, lastProfileId, clear } = useLoginStore();
  const [startInvested, setStartInvested] = useState(0);
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

  // 타임라인 기반 과거 모드 여부 판별
  const { currentDate } = useDateStore();
  const isRealtime = useMemo(() => {
    if (selectedProfile?.timelineId != null) {
      return Number(selectedProfile.timelineId) === 9;
    }
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

  // 과거 모드 관련 상태
  const [histTop, setHistTop] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState(null);
  const [histCache, setHistCache] = useState({});
  const [topFilter, setTopFilter] = useState("rising");

  // 포트폴리오 메트릭스 계산
  const portfolioMetrics = useMemo(() => {
    const totalCurrent =
      (selectedProfile?.cashBalance || 0) +
      (selectedProfile?.totalInvested || 0);
    const totalInitial = selectedProfile?.seedMoney || 0;
    const investmentPL =
      (selectedProfile?.totalInvested || 0) - (startInvested || 0);
    const overallPL = totalCurrent - totalInitial;

    return {
      totalCurrent,
      totalInitial,
      overallPL,
      overallPLPercent: totalInitial > 0 ? (overallPL / totalInitial) * 100 : 0,
      investmentPL,
      investmentPLPercent:
        startInvested > 0 ? (investmentPL / startInvested) * 100 : 0,
    };
  }, [selectedProfile, startInvested]);

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
                    setStartInvested(response.data.totalInvested || 0);
                    setSelectedProfile({
                        ...response.data,
                        totalInvested: totalCurrentPrice || 0,
                    });
                    localStorage.setItem("newProfile", JSON.stringify(response.data));
                    setCurrentDate(response.data.processDate);
                } catch(e) {
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
    }, [
        lastProfileId,
        fetchProfiles,
        fetchStocks,
        setCurrentDate,
        startInvested,
    ]);

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

    const fetchStocks = useCallback(async () => {
        if (!email || String(email).trim() === "") return 0;
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
      return response.data.totalCurrentPrice || 0;
    } catch (error) {
      console.error("Error fetching stocks:", error);
      return 0;
    }
  }, [email, lastProfileId, currentDate]);



  useEffect(() => {
    if (!email || String(email).trim() === "") return;
    loadProfile();
  }, [email, lastProfileId, currentDate, loadProfile]);

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
        setTimeout(() => setIsProfileModalOpen(false), 200);
      });
  };

  // TOP3 주식 계산
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
    sessionStorage.removeItem("login-store");
    sessionStorage.removeItem("timeLineList");
    localStorage.removeItem("newProfile");
    localStorage.removeItem("date-storage");
    navigate("/");
  };

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
      {/* 커스텀 CSS 스타일 추가 */}
      <style jsx>{shimmerStyles}</style>

      {/* 자산 정보 섹션 */}
      <div className="bg-slate-950 mx-4 rounded-xl mb-5">
        {!selectedProfile?.id || selectedProfile?.id === 0 ? (
          // Shimmer 스켈레톤 UI
          <div>
            {/* 프로필명 스켈레톤 */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <ShimmerSkeleton className="w-3 h-3 rounded-full" />
                <ShimmerSkeleton className="h-5 w-32" />
                <ShimmerSkeleton className="h-4 w-24" />
              </div>
            </div>
            {/* 총 잔고 스켈레톤 */}
            <div className="mb-4">
              <ShimmerSkeleton className="h-9 w-40 mb-2" />
              <ShimmerSkeleton className="h-4 w-32" />
            </div>
            {/* 투자/현금 정보 스켈레톤 */}
            <div className="flex justify-between mb-4">
              <div>
                <ShimmerSkeleton className="h-3 w-8 mb-1" />
                <ShimmerSkeleton className="h-6 w-20 mb-1" />
                <ShimmerSkeleton className="h-3 w-24" />
              </div>
              <div>
                <ShimmerSkeleton className="h-3 w-8 mb-1" />
                <ShimmerSkeleton className="h-6 w-20" />
              </div>
            </div>
            {/* 주문 내역 스켈레톤 */}
            <div className="flex items-center justify-between">
              <ShimmerSkeleton className="h-4 w-16" />
              <ShimmerSkeleton className="w-4 h-4" />
            </div>
          </div>
        ) : (
          // 실제 데이터
          <>
            {/* 프로필명 */}
            <div className="mb-4">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h2 className="text-white text-lg font-semibold">
                  {selectedProfile?.nickname}
                </h2>
                <span className="text-gray-400 text-sm">
                  TimeLine : {selectedProfile?.name || "없음"}
                </span>
              </div>
            </div>

            {/* 총 잔고 */}
            <div className="mb-4">
              <h3 className="text-white text-3xl font-bold">
                {formatCurrencyValue(portfolioMetrics.totalCurrent)}
              </h3>
              {selectedProfile?.totalAssets > 0 && (
                <p
                  className={`text-xs ${getColorClass(portfolioMetrics.overallPL)}`}
                >
                  {formatCurrency(portfolioMetrics.overallPL)} (
                  {formatPercentage(portfolioMetrics.overallPLPercent)})
                </p>
              )}
            </div>

            {/* 투자/현금 정보 */}
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">투자</p>
                <p className="text-white text-lg font-semibold">
                  {formatCurrencyValue(selectedProfile?.totalInvested)}
                </p>
                <p
                  className={`text-xs ${getColorClass(portfolioMetrics.investmentPL)}`}
                >
                  {formatCurrency(portfolioMetrics.investmentPL)} (
                  {formatPercentage(portfolioMetrics.investmentPLPercent)})
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">현금</p>
                <p className="text-white text-lg font-semibold">
                  {formatCurrencyValue(selectedProfile?.cashBalance)}
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
          </>
        )}
      </div>

      {/* 보유 주식 섹션 */}
      <div className="bg-slate-950 px-4 py-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <h3 className="text-white text-lg font-semibold mb-3">보유 주식</h3>
          {!selectedProfile?.id ||
          selectedProfile?.id === 0 ||
          holdingStocks.length === 0 ? (
            // Shimmer 스켈레톤 UI
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShimmerSkeleton className="w-8 h-8 rounded-lg" />
                    <div>
                      <ShimmerSkeleton className="h-4 w-20 mb-1" />
                      <ShimmerSkeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="text-right">
                    <ShimmerSkeleton className="h-3 w-8 mb-2" />
                    <ShimmerSkeleton className="h-4 w-16 mb-1" />
                    <ShimmerSkeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {holdingStocks
                .filter((stock) => stock.quantity && stock.quantity > 0)
                .map((stock, index) => (
                  <button
                    className="w-full"
                    onClick={() => navigate(`/stocks/${stock.ticker}`)}
                  >
                    {" "}
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-[5px] flex items-center justify-center text-sm overflow-hidden">
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
                          <p className="text-gray-400 text-xs text-start">
                            {stock.ticker}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold text-[10px] mb-2">
                          {(stock.quantity || 0).toLocaleString("en-US")}주
                        </p>
                        <p className="text-white font-semibold text-sm">
                          {formatCurrencyValue(stock.price)}
                        </p>
                        <p
                          className={`text-xs ${getColorClass(parseNumericValue(stock.change))}`}
                        >
                          {formatCurrency(stock.changeAmount)} (
                          {formatPercentage(stock.change)})
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP3 섹션 */}
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
                  className="flex items-center justify-between p-2"
                >
                  <div className="flex items-center gap-3">
                    <ShimmerSkeleton className="w-8 h-8 rounded-lg" />
                    <div>
                      <ShimmerSkeleton className="h-4 w-20 mb-1" />
                      <ShimmerSkeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="text-right">
                    <ShimmerSkeleton className="h-4 w-16 mb-1" />
                    <ShimmerSkeleton className="h-3 w-12" />
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
                    <div className="w-8 h-8 bg-gray-100 rounded-[5px] flex items-center justify-center text-sm overflow-hidden">
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
                    {/* 1줄: 가격 */}
                    <p className="text-white font-semibold text-sm">
                      {formatCurrencyValue(stock.price)}
                    </p>

                    {/* 2줄: 변동값 + 퍼센트 */}
                    <p className="text-xs font-medium">
                      <span
                        className={getColorClass(
                          parseNumericValue(stock.change)
                        )}
                      >
                        {formatCurrency(stock.change)}
                      </span>
                      <span
                        className={getColorClass(
                          parseNumericValue(stock.changePercent)
                        )}
                      >
                        ({formatPercentage(stock.changePercent)})
                      </span>
                    </p>

                    {/* 3줄: 거래량 */}
                    {topFilter === "volume" && (
                      <p className="text-xs text-gray-400">
                        거래량: {formatVolume(stock.volume)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-4"></div>

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

            <div
              className="px-6 py-4 space-y-3 overflow-y-auto scrollbar-hide"
              style={{ maxHeight: "400px" }}
            >
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
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
                        {formatCurrencyValue(profile.cashBalance)}
                      </p>

                      <p className="text-gray-400 text-xs">총자산</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
