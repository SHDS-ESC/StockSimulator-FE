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
  Eye,
  EyeOff,
  RefreshCw,
  Menu,
  Home,
} from "lucide-react";
import * as echarts from "echarts";
import useLoginStore from "@/store/useLoginStore";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/util/axiosInstance";

const MyPage = () => {
  console.log(localStorage.getItem("newProfile"));
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({
    id: 0,
    totalInvested: 0,
    totalAssets: 0,
    cashBalance: 0,
    nickname: "프로필을 선택해주세요",
    state: true,
  });
  const [showBalance, setShowBalance] = useState(true);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const { email, level, updatedAt, lastProfileId } = useLoginStore();
  const chartRef = useRef(null);

  // ECharts 파이 차트 초기화
  const initChart = useCallback(() => {
    if (chartRef.current) {
      const myChart = echarts.init(chartRef.current);
      const option = {
        title: {
          text: "포트폴리오",

          left: "center",
          top: "10px",
          textStyle: {
            color: "#ffffff",
            fontSize: 16,
          },
          subtextStyle: {
            color: "#9ca3af",
            fontSize: 12,
          },
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderColor: "#374151",
          textStyle: {
            color: "#ffffff",
          },
        },
        legend: {
          orient: "horizontal",
          bottom: "10px",
          left: "center",
          textStyle: {
            color: "#ffffff",
            fontSize: 11,
          },
          itemWidth: 12,
          itemHeight: 8,
        },
        series: [
          {
            name: "보유 종목",
            type: "pie",
            radius: ["30%", "60%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: "bold",
                color: "#ffffff",
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              { value: 248, name: "AAPL", itemStyle: { color: "#ff6384" } },
              { value: 735, name: "GOOGL", itemStyle: { color: "#36a2eb" } },
              { value: 580, name: "TSLA", itemStyle: { color: "#ffce56" } },
              { value: 484, name: "NVDA", itemStyle: { color: "#4bc0c0" } },
              { value: 300, name: "NFLX", itemStyle: { color: "#9966ff" } },
            ],
          },
        ],
      };
      myChart.setOption(option);

      // 리사이즈 이벤트 리스너 추가
      const handleResize = () => {
        myChart.resize();
      };
      window.addEventListener("resize", handleResize);

      // 컴포넌트 언마운트 시 차트 정리
      return () => {
        window.removeEventListener("resize", handleResize);
        myChart.dispose();
      };
    }
  }, []);

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

  // 초기 프로필 로드
  const loadProfile = useCallback(async () => {
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
          // 현재 인덱스 설정
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
  }, [lastProfileId, fetchProfiles]);

  useEffect(() => {
    if (!email || String(email).trim() === "") return; // 이메일 준비 전엔 호출 금지
    loadProfile();
  }, [email, lastProfileId, loadProfile]);

  // 차트 초기화
  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart]);

  const setLevelBadge = (level) => {
    switch (level) {
      case 1:
        return <Badge variant="beginner">초보투자자</Badge>;
      case 2:
        return <Badge variant="intermediate">중급투자자</Badge>;
      case 3:
        return <Badge variant="expert">투자의 고수</Badge>;
      default:
        return <Badge>투자자</Badge>;
    }
  };
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
        localStorage.setItem("newProfile", JSON.stringify(profile));
        // 현재 인덱스 업데이트
        const index = profiles.findIndex((p) => p.id === profile.id);
        if (index !== -1) {
          setCurrentProfileIndex(index);
        }
      });
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

  const portfolioData = [
    {
      stock: "AAPL",
      name: "애플",
      quantity: 10,
      avgPrice: 150.5,
      currentPrice: 175.3,
      sector: "기술주",
    },
    {
      stock: "GOOGL",
      name: "구글",
      quantity: 5,
      avgPrice: 2800.0,
      currentPrice: 2950.0,
      sector: "기술주",
    },
    {
      stock: "TSLA",
      name: "테슬라",
      quantity: 8,
      avgPrice: 220.0,
      currentPrice: 195.5,
      sector: "자동차",
    },
    {
      stock: "NVDA",
      name: "엔비디아",
      quantity: 15,
      avgPrice: 420.0,
      currentPrice: 485.2,
      sector: "반도체",
    },
  ];

  const calculatePL = (stock) => {
    const pl = (stock.currentPrice - stock.avgPrice) * stock.quantity;
    const plRate =
      ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100;
    return { pl, plRate };
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
              <button className="p-2 text-gray-400 hover:text-white rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 통합 프로필 & 자산 현황 */}
        <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
          {/* 현재 프로필 정보 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {profiles[currentProfileIndex] && (
                <>
                  {/* <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        profiles[currentProfileIndex].color || "#3b82f6",
                    }}
                  ></div> */}
                  <div className="relative">
                    <h3
                      className="text-lg font-semibold text-white relative z-10"
                      style={{
                        textShadow: `2px 2px 0px ${profiles[currentProfileIndex].color || "#3b82f6"}`,
                      }}
                    >
                      {profiles[currentProfileIndex].nickname}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {profiles[currentProfileIndex].name}
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
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 text-gray-400 hover:text-white"
              >
                {showBalance ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 포트폴리오 파이 차트 */}
          <div className="mb-6">
            <div
              ref={chartRef}
              className="w-full bg-slate-700 rounded-xl overflow-hidden"
              style={{ height: "280px", width: "100%" }}
            ></div>
          </div>

          {/* 메인 손익 */}
          <div
            className={`p-4 rounded-xl mb-4 ${selectedProfile.totalAssets >= 0 ? "bg-red-500 bg-opacity-10" : "bg-blue-500 bg-opacity-10"}`}
          >
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">총 손익</div>
              <div
                className={`text-2xl font-bold ${selectedProfile.totalAssets >= 0 ? "text-red-400" : "text-blue-400"}`}
              >
                {showBalance
                  ? `${selectedProfile.totalAssets >= 0 ? "+" : ""}$${Math.abs(selectedProfile.totalAssets).toFixed(0)}`
                  : "$ ***"}
              </div>
              <div
                className={`text-sm font-medium ${selectedProfile.totalAssets >= 0 ? "text-red-300" : "text-blue-300"}`}
              >
                {showBalance
                  ? `${selectedProfile.totalAssets >= 0 ? "+" : ""}${((selectedProfile.totalAssets / selectedProfile.totalInvested) * 100).toFixed(2)}%`
                  : "**.**%"}
              </div>
            </div>
          </div>

          {/* 2x2 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">현금잔고</div>
              <div className="text-base font-bold text-white">
                {showBalance ? `$${selectedProfile.cashBalance}` : "$***"}
              </div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">투자금액</div>
              <div className="text-base font-bold text-white">
                {showBalance ? `$${selectedProfile.totalInvested}` : "$***"}
              </div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">평가금액</div>
              <div className="text-base font-bold text-white">
                {showBalance ? `$${selectedProfile.totalAssets}` : "$***"}
              </div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">총 자산</div>
              <div className="text-base font-bold text-white">
                {showBalance
                  ? `$${selectedProfile.totalInvested + selectedProfile.totalAssets}`
                  : "$***"}
              </div>
            </div>
          </div>
        </div>

        {/* 포트폴리오 섹션 */}
        <div className="bg-slate-800 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">포트폴리오</h2>
            </div>
          </div>

          {/* 포트폴리오 컨텐츠 */}
          <div className="p-4">
            <div className="space-y-4">
              {/* 구매일 입력 섹션 - 모바일 최적화 */}
              <div className="bg-blue-500 bg-opacity-10 rounded-xl p-4 border border-blue-500 border-opacity-30">
                <h3 className="font-medium text-blue-300 mb-3 text-sm">
                  📊 종가 자동 조회
                </h3>
                <div className="space-y-3">
                  <select className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white">
                    <option>AAPL - 애플</option>
                    <option>GOOGL - 구글</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                    />
                    <div className="px-3 py-2 text-sm bg-slate-600 border border-slate-600 rounded-lg text-white">
                      $175.30
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="실제 구매가"
                      className="flex-1 px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-gray-400"
                    />
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    범위: $170.20 - $178.40
                  </p>
                </div>
              </div>

              {/* 현재 보유 자산 - 카드형 */}
              <div>
                <h3 className="font-semibold text-white mb-3 text-sm">
                  현재 보유 자산
                </h3>
                <div className="space-y-3">
                  {portfolioData.map((stock, index) => {
                    const { pl, plRate } = calculatePL(stock);
                    return (
                      <div
                        key={index}
                        className="bg-slate-700 border border-slate-600 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-white">
                              {stock.stock}
                            </div>
                            <div className="text-xs text-gray-400">
                              {stock.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-bold text-sm ${pl >= 0 ? "text-red-400" : "text-blue-400"}`}
                            >
                              {pl >= 0 ? "+" : ""}${Math.abs(pl).toFixed(0)}
                            </div>
                            <div
                              className={`text-xs ${pl >= 0 ? "text-red-300" : "text-blue-300"}`}
                            >
                              {pl >= 0 ? "+" : ""}
                              {plRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                          <div>
                            <div className="text-gray-400">수량</div>
                            <div className="font-medium">
                              {stock.quantity}주
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">평균가</div>
                            <div className="font-medium">
                              ${stock.avgPrice.toFixed(0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">현재가</div>
                            <div className="font-medium">
                              ${stock.currentPrice.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
