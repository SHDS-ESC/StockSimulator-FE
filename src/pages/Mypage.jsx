// src/pages/MyPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Users, ChevronRight, ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useLoginStore from "@/store/useLoginStore";
import useDateStore from "@/store/useDateStore";
import useChartStore from "@/store/useChartStore";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/util/axiosInstance";
import { format } from "date-fns";

const MyPage = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({
    id: 0,
    nickname: "",
    name: "",
    cashBalance: 0,
    totalInvested: 0,
    totalAssets: 0,
    seedMoney: 0,
    color: "#3b82f6",
    state: true,
    change: 0,
    changeAmount: 0,
    processDate: null,
  });
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { email, level, updatedAt, lastProfileId, setLastProfileId, clear } =
    useLoginStore();
  const { currentDate } = useDateStore();

  // ✅ zustand 차트 스토어만 사용 (로컬 차트 인스턴스 관리 제거)
  const { portfolioList, setPortfolioList, initChart } = useChartStore();

  const chartRef = useRef(null);
  const [startInvested, setStartInvested] = useState(0);
  const [showHoldings, setShowHoldings] = useState(false); // 보유종목 토글 상태

  // App.jsx와 동일한 getRandomColor 함수
  function getRandomColor() {
    return (
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    );
  }

  // 차트 초기화 (포트폴리오 화면이 보일 때만)
  useEffect(() => {
    if (showPortfolio && chartRef.current) {
      console.log("=== 차트 초기화 실행 ===");
      console.log("chartRef:", chartRef);
      console.log("chartRef.current:", !!chartRef.current);
      console.log("portfolioList:", portfolioList);

      const cleanup = initChart(chartRef);
      return cleanup;
    }
  }, [showPortfolio, portfolioList, initChart]); // showPortfolio와 portfolioList 바뀌면 업데이트

  // ---- helpers ----
  const setLevelBadge = (level) => {
    switch (level) {
      case 1:
        return <Badge className="bg-yellow-500 text-yellow-900">초보자</Badge>;
      case 2:
        return <Badge className="bg-green-500 text-green-900">중급자</Badge>;
      case 3:
        return <Badge className="bg-blue-500 text-blue-900">고급자</Badge>;
      case 4:
        return <Badge className="bg-purple-500 text-purple-900">전문가</Badge>;
      case 5:
        return <Badge className="bg-red-500 text-red-900">마스터</Badge>;
      default:
        return <Badge>투자자</Badge>;
    }
  };

  const formatLastLogin = (updatedAt) => {
    const date = new Date(updatedAt);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    if (isToday) return `최근 접속: 오늘 ${hours}:${minutes}`;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `최근 접속: ${y}-${m}-${d} ${hours}:${minutes}`;
  };

  // ---- API ----
  const fetchProfiles = useCallback(async () => {
    if (!email || String(email).trim() === "") return [];
    try {
      const response = await axiosInstance.get(
        `userprofile/profiles/${encodeURIComponent(email)}`,
        { withCredentials: true }
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  }, [email]);

  const fetchStocks = useCallback(
    async (profileId, processDate) => {
      if (!email || String(email).trim() === "" || !profileId) return 0;
      // 날짜 정규화 YYYY-MM-DD
      const raw =
        processDate ||
        (currentDate instanceof Date ? currentDate.toISOString() : currentDate);
      const targetDate = typeof raw === "string" ? raw.slice(0, 10) : raw;

      try {
        const response = await axiosInstance.get(
          `holdings/stocks/${profileId}/${targetDate}`,
          { withCredentials: true }
        );
        return response.data.totalCurrentPrice || 0;
      } catch (error) {
        console.error("Error fetching stocks:", error);
        return 0;
      }
    },
    [email, currentDate]
  );

  // App.jsx와 동일한 API 사용
  const fetchPortfolioData = useCallback(
    async (profileId, processDate) => {
      if (!email || String(email).trim() === "" || !profileId) return [];

      const raw =
        processDate ||
        (currentDate instanceof Date ? currentDate.toISOString() : currentDate);
      const targetDate = typeof raw === "string" ? raw.slice(0, 10) : raw;

      try {
        // App.jsx와 동일한 API 사용
        const response = await axiosInstance.post(
          "/userprofile/update/process-date",
          {
            userProfileId: profileId,
            processDate: targetDate,
            prevProcessDate: targetDate
          }
        );

        console.log("=== App.jsx와 동일한 API 사용 ===");
        console.log("API 응답:", response.data);
        console.log("holdingsDTOList:", response.data.holdingsDTOList);

        // 각 종목의 상세 정보 확인
        if (response.data.holdingsDTOList) {
          response.data.holdingsDTOList.forEach((holding, index) => {
            console.log(`종목 ${index}:`, {
              ticker: holding.ticker,
              price: holding.price,
              quantity: holding.quantity,
              currentPrice: holding.currentPrice,
              전체객체: holding,
            });
          });
        }

        // 수량 정보를 포함한 데이터 변환 (0주인 종목 제외)
        const responseData = response.data.holdingsDTOList
          .filter((holdings) => holdings.quantity && holdings.quantity > 0) // 0주인 종목 필터링
          .map((holdings) => ({
            value: holdings.price,
            name: holdings.ticker,
            quantity: holdings.quantity || 0,
            currentPrice: holdings.currentPrice || 0,
            itemStyle: { color: getRandomColor() },
          }));

        console.log("변환된 차트 데이터:", responseData);
        console.log("================================");

        return responseData;
      } catch (error) {
        console.error("🚨 Error fetching portfolio data:", error);
        return [];
      }
    },
    [email, currentDate]
  );

  const fetchProfileDetail = useCallback(async (profileId) => {
    if (!profileId) return null;
    try {
      const response = await axiosInstance.get(
        `userprofile/profile/${profileId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching profile detail:", error);
      return null;
    }
  }, []);

  // ---- 초기 로드 ----
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await fetchProfiles();
      setProfiles(list);

      const loadProfileData = async (p) => {
        const profileDetail = await fetchProfileDetail(p.id);
        if (!profileDetail) return;

        const totalCurrentPrice = await fetchStocks(
          p.id,
          profileDetail.processDate
        );

        const updatedProfile = {
          ...profileDetail,
          totalInvested: totalCurrentPrice,
        };

        setStartInvested(profileDetail.totalInvested || 0);
        setSelectedProfile(updatedProfile);
        localStorage.setItem("newProfile", JSON.stringify(updatedProfile));
      };

      if (lastProfileId && Number(lastProfileId) > 0) {
        const chosen = list.find((x) => x.id === Number(lastProfileId));
        if (chosen) await loadProfileData(chosen);
        else if (list.length) await loadProfileData(list[0]);
      } else if (list.length) {
        await loadProfileData(list[0]);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    } finally {
      // 로딩 완료 후 약간의 지연을 두어 자연스러운 전환
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [lastProfileId, fetchProfiles, fetchStocks, fetchProfileDetail]);

  useEffect(() => {
    if (email) loadProfile();
  }, [email, loadProfile]);

  // 차트 초기화는 위에서 이미 처리됨 (App.jsx와 동일)

  // ---- 핸들러 ----
  const handleProfileSelect = async (profile) => {
    setLastProfileId(profile.id);

    // 컨테이너 먼저 만들기(초기화 타이밍 보장)
    setShowPortfolio(true);

    try {
      const profileDetail = await fetchProfileDetail(profile.id);
      if (profileDetail) {
        const processDate = profileDetail.processDate;
        const totalCurrentPrice = await fetchStocks(profile.id, processDate);
        const portfolioData = await fetchPortfolioData(profile.id, processDate);

        console.log("=== 마이페이지 데이터 ===");
        console.log("프로필 ID:", profile.id);
        console.log("processDate:", processDate);
        console.log("portfolioData:", portfolioData);
        console.log("차트용 데이터:", [...(portfolioData || [])]);
        console.log("===================");

        const updatedProfile = {
          ...profileDetail,
          totalInvested: totalCurrentPrice,
          portfolioData,
        };

        setStartInvested(profileDetail.totalInvested || 0);
        setSelectedProfile(updatedProfile);

        // ✅ 차트용 데이터는 항상 새 배열로
        setPortfolioList([...(portfolioData || [])]);

        localStorage.setItem("newProfile", JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error("포트폴리오 데이터 로드 실패:", error);
    }
  };

  const handleBackToProfiles = () => setShowPortfolio(false);

  // 스켈레톤 UI 컴포넌트
  const SkeletonCard = () => (
    <div className="rounded-2xl p-6 bg-slate-800 border border-slate-700 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
          <div>
            <div className="h-5 bg-slate-700 rounded w-24 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-32 mb-1"></div>
            <div className="h-3 bg-slate-700 rounded w-20"></div>
          </div>
        </div>
        <div className="w-5 h-5 bg-slate-700 rounded"></div>
      </div>
    </div>
  );

  const SkeletonHeader = () => (
    <div className="bg-slate-900 sticky top-0 z-50 border-b border-slate-700">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse"></div>
            <div>
              <div className="h-4 bg-slate-700 rounded w-16 mb-1"></div>
              <div className="h-3 bg-slate-700 rounded w-20"></div>
            </div>
          </div>
          <div className="w-10 h-10 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/user/logout");
    } catch {
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
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* 헤더 */}
      <div className="bg-slate-900 sticky top-0 z-50 border-b border-slate-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {email ? email.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                {setLevelBadge(level)}
                <h1 className="text-lg font-bold text-white">{email}님</h1>
                <p className="text-xs text-gray-400">
                  {formatLastLogin(updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showPortfolio && (
                <button
                  onClick={handleBackToProfiles}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 py-4 space-y-4">
        {!showPortfolio ? (
          // 프로필 목록
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">내 프로필</h2>
              <p className="text-gray-400">
                포트폴리오를 확인할 프로필을 선택하세요
              </p>
              <p className="text-xs text-gray-500 mt-2">
                프로필 수: {profiles.length}개
              </p>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                // 로딩 중일 때 스켈레톤 UI 표시
                [1, 2, 3].map((i) => <SkeletonCard key={i} />)
              ) : profiles.length > 0 ? (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    className={`rounded-2xl p-6 cursor-pointer transition-colors border ${
                      profile.id === lastProfileId
                        ? "bg-slate-700 border-green-500/50 hover:bg-slate-600"
                        : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            backgroundColor: profile.color || "#3b82f6",
                          }}
                        >
                          {profile.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">
                              {profile.nickname}
                            </h3>
                            {profile.id === lastProfileId && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                                현재 플레이 중
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {profile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            시드머니: $
                            {profile.seedMoney
                              ? Number(profile.seedMoney).toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "0.00"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : !isLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    닉네임이 없습니다
                  </h3>
                  <p className="text-gray-400 mb-4">
                    새로운 투자자 닉네임을 생성해보세요
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                    닉네임 생성
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          // 포트폴리오 화면
          <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
            {/* 현재 프로필 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedProfile && (
                  <div className="relative">
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: selectedProfile.color || "#3b82f6",
                        }}
                      />
                      <span className="text-xs text-green-400 font-medium">
                        현재 플레이 중
                      </span>
                    </div>
                    <h3
                      className="text-lg font-semibold text-white relative z-10"
                      style={{
                        textShadow: `2px 2px 0px ${selectedProfile.color || "#3b82f6"}`,
                      }}
                    >
                      {selectedProfile.nickname}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {selectedProfile.name}
                    </p>
                    {selectedProfile.processDate && (
                      <p className="text-xs text-gray-500">
                        진행 날짜: {selectedProfile.processDate}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 포트폴리오 파이 차트 - App.jsx와 동일 */}
            <div className="mb-6">
              <div
                ref={chartRef}
                className="w-full bg-slate-700 rounded-xl overflow-hidden"
                style={{ height: "280px", width: "100%" }}
              ></div>
            </div>

            {/* 보유 주식 상세 정보 - 토글 */}
            {portfolioList.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowHoldings(!showHoldings)}
                  className="w-full flex items-center justify-between bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-white">
                      보유 종목
                    </h3>
                    <span className="text-sm text-gray-400">
                      (
                      {
                        portfolioList.filter(
                          (stock) => stock.quantity && stock.quantity > 0
                        ).length
                      }
                      개)
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {showHoldings ? "▲" : "▼"}
                  </div>
                </button>

                {showHoldings && (
                  <div className="mt-3 space-y-2">
                    {portfolioList
                      .filter((stock) => stock.quantity && stock.quantity > 0) // 0주인 종목 제외
                      .map((stock, index) => (
                        <div
                          key={index}
                          className="bg-slate-700 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm overflow-hidden">
                              <img
                                src={`https://financialmodelingprep.com/image-stock/${stock.name}.png`}
                                alt={stock.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <span className="text-gray-600 font-bold text-xs hidden">
                                {stock.name}
                              </span>
                            </div>
                            <span className="text-white font-medium">
                              {stock.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">
                              {stock.quantity || 0}주
                            </div>
                            <div className="text-xs text-gray-400">
                              $
                              {Number(stock.currentPrice || 0).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                              /주
                            </div>
                            <div className="text-xs text-gray-500">
                              총 $
                              {Number(stock.value).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* 총 손익 */}
            <div className="mb-4">
              {selectedProfile.totalAssets > 0 &&
                (() => {
                  const totalCurrent =
                    selectedProfile.cashBalance + selectedProfile.totalInvested;
                  const totalInitial = selectedProfile.seedMoney || 0;
                  const diffPrice = (totalCurrent - totalInitial).toFixed(2);
                  const diffPercent =
                    totalInitial > 0
                      ? (
                          ((totalCurrent - totalInitial) / totalInitial) *
                          100
                        ).toFixed(2)
                      : "0.00";
                  const isProfit = Number(diffPrice) > 0;

                  return (
                    <div
                      className={`relative overflow-hidden rounded-2xl p-6 ${
                        isProfit
                          ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30"
                          : "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
                      }`}
                    >
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
                        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/5" />
                        <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/5" />
                      </div>

                      <div className="relative z-10 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              isProfit ? "bg-red-500" : "bg-blue-500"
                            }`}
                          />
                          <span className="text-sm text-gray-300 font-medium">
                            총 손익
                          </span>
                        </div>
                        <div
                          className={`text-4xl font-bold mb-2 ${
                            isProfit ? "text-red-400" : "text-blue-400"
                          }`}
                        >
                          {isProfit ? "+" : ""}$
                          {Number(diffPrice).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            isProfit
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          <span className="mr-1">{isProfit ? "↗" : "↘"}</span>
                          {isProfit ? "+" : ""}
                          {diffPercent}%
                        </div>
                        <div className="mt-4 text-xs text-gray-400">
                          <div className="flex justify-between">
                            <span>시작 자본</span>
                            <span>
                              $
                              {Number(totalInitial).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>현재 자산</span>
                            <span>
                              $
                              {Number(totalCurrent).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* 자산 현황 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">현금잔고</div>
                <div className="text-base font-bold text-white">
                  $
                  {Number(selectedProfile.cashBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="bg-slate-700 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">투자금액</div>
                <div className="text-base font-bold text-white">
                  $
                  {Number(selectedProfile.totalInvested).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>
                {startInvested > 0 && (
                  <div className="text-xs mt-1">
                    {(() => {
                      const diff =
                        selectedProfile.totalInvested - startInvested;
                      const diffPercent =
                        startInvested > 0
                          ? ((diff / startInvested) * 100).toFixed(2)
                          : 0;
                      return (
                        <span
                          className={
                            diff >= 0 ? "text-red-500" : "text-blue-400"
                          }
                        >
                          {diff >= 0 ? "+" : ""}$
                          {Number(diff).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ({diff >= 0 ? "+" : ""}
                          {diffPercent}%)
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
