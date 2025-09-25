import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  User,
  Settings,
  TrendingUp,
  TrendingDown,
  PieChart,
  Users,
  Bell,
  FileText,
  Plus,
  Edit3,
  DollarSign,
  Activity,
  ChevronRight,
  RefreshCw,
  Menu,
  Home,
  ArrowLeft,
} from "lucide-react";
import useLoginStore from "@/store/useLoginStore";
import useDateStore from "@/store/useDateStore";
import useChartStore from "@/store/useChartStore";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/util/axiosInstance";
import * as echarts from "echarts";

const MyPage = () => {
  console.log(localStorage.getItem("newProfile"));

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
  });
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const { email, level, updatedAt, lastProfileId, setLastProfileId } =
    useLoginStore();
  const { currentDate } = useDateStore();
  const { portfolioList, setPortfolioList } = useChartStore();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [startInvested, setStartInvested] = useState(0);

  // ECharts 파이 차트 초기화
  const initChart = useCallback(() => {
    if (chartRef.current) {
      console.log("차트 컨테이너 발견, 차트 초기화 중...");
      console.log("현재 portfolioList:", portfolioList);
      console.log(
        "차트 컨테이너 크기:",
        chartRef.current.offsetWidth,
        "x",
        chartRef.current.offsetHeight
      );

      // 기존 차트 인스턴스가 있으면 제거
      if (chartInstanceRef.current) {
        console.log("기존 차트 인스턴스 제거");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }

      // 직접 차트 초기화
      const myChart = echarts.init(chartRef.current);
      chartInstanceRef.current = myChart;
      console.log("차트 인스턴스 생성 완료");

      const option = {
        backgroundColor: "transparent",
        title: {
          text: "포트폴리오",
          left: "center",
          top: "10px",
          textStyle: { color: "#ffffff", fontSize: 16 },
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          textStyle: { color: "#ffffff" },
        },
        legend: {
          orient: "horizontal",
          bottom: "10px",
          left: "center",
          textStyle: { color: "#ffffff", fontSize: 11 },
        },
        series: [
          {
            name: "보유 종목",
            type: "pie",
            radius: ["30%", "60%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: false,
            label: {
              show: true,
              position: "outside",
              formatter: "{b}: {d}%",
              color: "#ffffff",
              fontSize: 12,
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 5,
              lineStyle: {
                color: "#ffffff",
              },
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: "bold",
                color: "#fff",
              },
            },
            data:
              portfolioList.length > 0
                ? portfolioList.map((item) => ({
                    value: item.value || 0,
                    name: item.name || "알 수 없음",
                    itemStyle: item.itemStyle || { color: "#6b7280" },
                  }))
                : [
                    {
                      value: 100,
                      name: "보유 종목 없음",
                      itemStyle: { color: "#6b7280" },
                    },
                  ],
          },
        ],
      };

      myChart.setOption(option);
      console.log("차트 옵션 설정 완료");
      console.log("차트 데이터:", portfolioList);

      // 로딩 텍스트 숨기기
      const loadingText = chartRef.current.querySelector(".absolute");
      if (loadingText) {
        loadingText.style.display = "none";
      }

      // 차트가 제대로 렌더링되었는지 확인
      setTimeout(() => {
        console.log(
          "차트 렌더링 확인:",
          myChart.getWidth(),
          "x",
          myChart.getHeight()
        );
        console.log("차트 DOM 요소:", chartRef.current);
        console.log("차트 인스턴스:", myChart);

        // 차트 강제 리렌더링
        myChart.resize();
        myChart.setOption(option, true); // notMerge: true로 강제 업데이트
      }, 100);

      const handleResize = () => {
        myChart.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        myChart.dispose();
      };
    } else {
      console.log("차트 컨테이너를 찾을 수 없습니다");
    }
  }, [portfolioList]);

  // 모든 프로필 불러오기
  const fetchProfiles = useCallback(async () => {
    if (!email || String(email).trim() === "") return [];
    try {
      const response = await axiosInstance.get(
        `userprofile/profiles/${encodeURIComponent(email)}`,
        { withCredentials: true }
      );
      console.log("프로필 API 응답:", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  }, [email]);

  // 보유 주식 리스트 불러오기 (홈화면과 동일한 로직)
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
      return response.data.totalCurrentPrice || 0;
    } catch (error) {
      console.error("Error fetching stocks:", error);
      return 0;
    }
  }, [email, lastProfileId, currentDate]);

  // 포트폴리오 데이터 가져오기 (차트용)
  const fetchPortfolioData = useCallback(
    async (profileId) => {
      if (!email || String(email).trim() === "") return [];
      const isoDate =
        currentDate instanceof Date
          ? currentDate.toISOString().slice(0, 10)
          : currentDate;
      try {
        const response = await axiosInstance.get(
          `holdings/stocks/${profileId}/${isoDate}`,
          { withCredentials: true }
        );
        const stockList = response.data.holdingsResponseDTOS || [];

        // 차트용 데이터로 변환
        const portfolioData = stockList.map((stock) => ({
          value: stock.currentPrice * stock.quantity,
          name: stock.ticker,
          itemStyle: {
            color: `hsl(${Math.random() * 360}, 70%, 60%)`, // 랜덤 색상
          },
        }));

        return portfolioData;
      } catch (error) {
        console.error("Error fetching portfolio data:", error);
        return [];
      }
    },
    [email, currentDate]
  );

  // 초기 프로필 로드 (홈화면과 동일한 로직)
  const loadProfile = useCallback(async () => {
    try {
      console.log("프로필 로딩 시작, email:", email);
      const list = await fetchProfiles();
      console.log("프로필 목록:", list);
      setProfiles(list);
      const totalCurrentPrice = await fetchStocks();
      // lastProfileId 가 유효하면 해당 프로필 조회, 아니면 첫 번째 프로필로 세팅
      if (lastProfileId && Number(lastProfileId) > 0) {
        try {
          const response = await axiosInstance.get(
            `userprofile/profile/${lastProfileId}`,
            { withCredentials: true }
          );
          setStartInvested(response.data.totalInvested);
          setSelectedProfile({
            ...response.data,
            totalInvested: totalCurrentPrice,
          });
          localStorage.setItem("newProfile", JSON.stringify(response.data));
          const index = list.findIndex((p) => p.id === response.data.id);
          if (index !== -1) {
            setCurrentProfileIndex(index);
          }
        } catch (e) {
          console.error("Error fetching active profile:", e);
          if (Array.isArray(list) && list.length > 0) {
            setSelectedProfile(list[0]);
            setCurrentProfileIndex(0);
          }
        }
      } else if (Array.isArray(list) && list.length > 0) {
        setSelectedProfile(list[0]);
        setCurrentProfileIndex(0);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  }, [lastProfileId, fetchProfiles, fetchStocks]);

  useEffect(() => {
    if (email) {
      loadProfile();
    }
  }, [email, loadProfile]);

  useEffect(() => {
    if (showPortfolio) {
      // 포트폴리오 화면에서만 차트 초기화
      const timer = setTimeout(() => {
        console.log("차트 초기화 시작");
        console.log("showPortfolio 상태:", showPortfolio);
        console.log("chartRef.current:", chartRef.current);
        initChart();
      }, 500); // DOM이 완전히 렌더링된 후 차트 초기화

      return () => clearTimeout(timer);
    }
  }, [showPortfolio, initChart]);

  // portfolioList가 변경될 때마다 차트 업데이트
  useEffect(() => {
    if (showPortfolio && chartInstanceRef.current) {
      console.log("포트폴리오 데이터 변경으로 차트 업데이트:", portfolioList);
      chartInstanceRef.current.setOption({
        series: [
          {
            data:
              portfolioList.length > 0
                ? portfolioList.map((item) => ({
                    value: item.value || 0,
                    name: item.name || "알 수 없음",
                    itemStyle: item.itemStyle || { color: "#6b7280" },
                  }))
                : [
                    {
                      value: 100,
                      name: "보유 종목 없음",
                      itemStyle: { color: "#6b7280" },
                    },
                  ],
          },
        ],
      });
    }
  }, [portfolioList, showPortfolio]);

  // 컴포넌트 언마운트 시 차트 인스턴스 정리
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        console.log("컴포넌트 언마운트 시 차트 인스턴스 정리");
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // 프로필 선택 및 포트폴리오 보기
  const handleProfileSelect = async (profile, index) => {
    console.log("닉네임 선택:", profile);

    // 현재 플레이 중인 닉네임 변경
    setLastProfileId(profile.id);

    // 선택된 프로필 정보 업데이트
    setCurrentProfileIndex(index);
    setSelectedProfile(profile);

    // 선택된 닉네임의 포트폴리오 데이터 로드
    try {
      const totalCurrentPrice = await fetchStocks();
      setSelectedProfile({
        ...profile,
        totalInvested: totalCurrentPrice,
      });

      // 포트폴리오 데이터 가져오기
      console.log("포트폴리오 데이터 로딩 시작...");
      const portfolioData = await fetchPortfolioData(profile.id);
      console.log("포트폴리오 데이터 로드 완료:", portfolioData);

      // 포트폴리오 데이터가 있으면 차트에 설정
      if (portfolioData.length > 0) {
        setPortfolioList(portfolioData);
        console.log("포트폴리오 데이터 설정 완료:", portfolioData);
      } else {
        console.log("포트폴리오 데이터가 없습니다");
        // 빈 배열로 설정하여 "데이터 없음" 표시
        setPortfolioList([]);
      }

      // 프로필 정보를 localStorage에 저장
      localStorage.setItem("newProfile", JSON.stringify(profile));

      console.log("닉네임 변경 완료:", profile.nickname);
      console.log("포트폴리오 데이터:", portfolioData);
    } catch (error) {
      console.error("포트폴리오 데이터 로드 실패:", error);
    }

    // 포트폴리오 화면으로 이동
    setShowPortfolio(true);
  };

  // 포트폴리오에서 프로필 목록으로 돌아가기
  const handleBackToProfiles = () => {
    setShowPortfolio(false);
  };

  // 다음 프로필로 이동 (조회용)
  const handleNextProfile = () => {
    if (profiles.length > 0) {
      const newIndex =
        currentProfileIndex < profiles.length - 1 ? currentProfileIndex + 1 : 0;
      setCurrentProfileIndex(newIndex);

      // 선택된 프로필의 정보를 업데이트 (실행 중인 프로필은 변경하지 않음)
      const selectedProfile = profiles[newIndex];
      if (selectedProfile) {
        setSelectedProfile(selectedProfile);
      }
    }
  };

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

    if (isToday) {
      return `최근 접속: 오늘 ${hours}:${minutes}`;
    } else {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `최근 접속: ${y}-${m}-${d} ${hours}:${minutes}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* 모바일 헤더 */}
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
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {!showPortfolio ? (
          /* 프로필 목록 화면 */
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">내 닉네임</h2>
              <p className="text-gray-400">
                포트폴리오를 확인할 닉네임을 선택하세요
              </p>
              <p className="text-xs text-gray-500 mt-2">
                닉네임 수: {profiles.length}개
              </p>
            </div>

            <div className="grid gap-4">
              {profiles.length > 0 ? (
                profiles.map((profile, index) => (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile, index)}
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
                            {profile.seedMoney?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
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
              )}
            </div>
          </div>
        ) : (
          /* 포트폴리오 요약 화면 */
          <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
            {/* 현재 프로필 정보 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {selectedProfile && (
                  <>
                    <div className="relative">
                      <div className="flex items-center space-x-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: selectedProfile.color || "#3b82f6",
                          }}
                        ></div>
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
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleNextProfile}
                  className="p-2 bg-slate-700 border border-slate-600 hover:bg-slate-600 rounded-lg transition-colors"
                  disabled={profiles.length <= 1}
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* 포트폴리오 파이 차트 */}
            <div className="mb-6">
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-white">
                  포트폴리오 차트
                </h3>
                <p className="text-sm text-gray-400">보유 종목 비율</p>
              </div>
              <div
                ref={chartRef}
                className="w-full bg-slate-800 rounded-xl border border-slate-600"
                style={{
                  height: "280px",
                  width: "100%",
                  minHeight: "280px",
                  minWidth: "300px",
                  display: "block",
                  position: "relative",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  차트 로딩 중...
                </div>
              </div>
            </div>

            {/* 총 손익 */}
            <div className="mb-4">
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
                  const isProfit = diffPrice > 0;
                  console.log("마이페이지 데이터:", {
                    totalCurrent,
                    totalInitial,
                    cashBalance: selectedProfile.cashBalance,
                    totalInvested: selectedProfile.totalInvested,
                    seedMoney: selectedProfile.seedMoney,
                    totalAssets: selectedProfile.totalAssets,
                    startInvested: startInvested,
                    diffPrice: totalCurrent - totalInitial,
                    diffPercent:
                      ((totalCurrent - totalInitial) / totalInitial) * 100,
                  });
                  return (
                    <div
                      className={`relative overflow-hidden rounded-2xl p-6 ${
                        isProfit
                          ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30"
                          : "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
                      }`}
                    >
                      {/* 배경 패턴 */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/5"></div>
                        <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/5"></div>
                      </div>

                      <div className="relative z-10 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              isProfit ? "bg-red-500" : "bg-blue-500"
                            }`}
                          ></div>
                          <span className="text-sm text-gray-300 font-medium">
                            총 손익
                          </span>
                        </div>
                        <div
                          className={`text-4xl font-bold mb-2 ${
                            isProfit ? "text-red-400" : "text-blue-400"
                          }`}
                        >
                          {isProfit ? "+" : ""}${diffPrice}
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
                            <span>${totalInitial.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>현재 자산</span>
                            <span>${totalCurrent.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* 자산 현황 - 2x2 그리드 (현금잔고, 투자금액만) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">현금잔고</div>
                <div className="text-base font-bold text-white">
                  ${selectedProfile.cashBalance}
                </div>
              </div>
              <div className="bg-slate-700 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">투자금액</div>
                <div className="text-base font-bold text-white">
                  ${selectedProfile.totalInvested}
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
                          {diff >= 0 ? "+" : ""}${diff.toFixed(2)} (
                          {diff >= 0 ? "+" : ""}
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
