import React, { useState } from "react";
import {
  User,
  Settings,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
  Target,
  Brain,
  Users,
  Bell,
  FileText,
  Plus,
  Edit3,
  DollarSign,
  Activity,
  Award,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Menu,
  Home,
  History,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "lucide-react";
import useRegisterStore from "@/store/useRegisterStore";
import useLoginStore from "@/store/useLoginStore";
import { Badge } from "@/components/ui/badge";

const MyPage = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [selectedProfile, setSelectedProfile] = useState("profile1");
  const [showBalance, setShowBalance] = useState(true);
  const { email, level, updatedAt } = useLoginStore();

  // 로그인 시 저장된 zustand 상태를 그대로 사용 (API 호출 없음)

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

  // 모의투자 이력 데이터 (실제로는 API에서 가져올 데이터)
  const [investmentHistory] = useState([
    {
      id: 1,
      date: "2024-01-15",
      stock: "AAPL",
      stockName: "애플",
      action: "매수",
      quantity: 10,
      price: 185.5,
      totalAmount: 1855.0,
      currentPrice: 195.3,
      profit: 98.0,
      profitRate: 5.28,
      status: "보유중",
    },
    {
      id: 2,
      date: "2024-01-10",
      stock: "TSLA",
      stockName: "테슬라",
      action: "매도",
      quantity: 5,
      price: 220.0,
      totalAmount: 1100.0,
      sellPrice: 245.67,
      profit: 128.35,
      profitRate: 11.67,
      status: "완료",
    },
    {
      id: 3,
      date: "2024-01-08",
      stock: "NVDA",
      stockName: "엔비디아",
      action: "매수",
      quantity: 8,
      price: 420.0,
      totalAmount: 3360.0,
      currentPrice: 485.2,
      profit: 521.6,
      profitRate: 15.52,
      status: "보유중",
    },
    {
      id: 4,
      date: "2024-01-05",
      stock: "GOOGL",
      stockName: "구글",
      action: "매도",
      quantity: 3,
      price: 2800.0,
      totalAmount: 8400.0,
      sellPrice: 2950.0,
      profit: 450.0,
      profitRate: 5.36,
      status: "완료",
    },
    {
      id: 5,
      date: "2024-01-03",
      stock: "MSFT",
      stockName: "마이크로소프트",
      action: "매수",
      quantity: 15,
      price: 380.0,
      totalAmount: 5700.0,
      currentPrice: 365.2,
      profit: -222.0,
      profitRate: -3.89,
      status: "보유중",
    },
  ]);

  // 샘플 데이터
  const userProfiles = [
    {
      id: "profile1",
      name: "단타전용",
      color: "#FF6B6B",
      totalReturn: 12.5,
      holdings: 8,
    },
    {
      id: "profile2",
      name: "장기투자",
      color: "#4ECDC4",
      totalReturn: 8.3,
      holdings: 5,
    },
    {
      id: "profile3",
      name: "성장주",
      color: "#45B7D1",
      totalReturn: -2.1,
      holdings: 12,
    },
  ];

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

  const totalInvestment = portfolioData.reduce(
    (sum, stock) => sum + stock.avgPrice * stock.quantity,
    0
  );
  const currentValue = portfolioData.reduce(
    (sum, stock) => sum + stock.currentPrice * stock.quantity,
    0
  );
  const totalPL = currentValue - totalInvestment;
  const totalPLRate = (totalPL / totalInvestment) * 100;

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
        {/* 프로필 선택 - 수평 스크롤 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">투자 프로필</h2>
            <button className="text-blue-400 text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1" />
              추가
            </button>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {userProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile.id)}
                className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all min-w-[120px] ${
                  selectedProfile === profile.id
                    ? "border-blue-500 bg-blue-500 bg-opacity-10"
                    : "border-slate-700 bg-slate-800"
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: profile.color }}
                    ></div>
                    <span className="font-medium text-white text-sm">
                      {profile.name}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold ${profile.totalReturn >= 0 ? "text-red-400" : "text-blue-400"}`}
                  >
                    {profile.totalReturn >= 0 ? "+" : ""}
                    {profile.totalReturn}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {profile.holdings}개 보유
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 자산 요약 - 모바일 최적화 */}
        <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">자산 현황</h2>
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

          {/* 메인 손익 */}
          <div
            className={`p-4 rounded-xl mb-4 ${totalPL >= 0 ? "bg-red-500 bg-opacity-10" : "bg-blue-500 bg-opacity-10"}`}
          >
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">총 손익</div>
              <div
                className={`text-2xl font-bold ${totalPL >= 0 ? "text-red-400" : "text-blue-400"}`}
              >
                {showBalance
                  ? `${totalPL >= 0 ? "+" : ""}₩${Math.abs(totalPL / 1000).toFixed(0)}K`
                  : "₩ ***K"}
              </div>
              <div
                className={`text-sm font-medium ${totalPL >= 0 ? "text-red-300" : "text-blue-300"}`}
              >
                {showBalance
                  ? `${totalPL >= 0 ? "+" : ""}${totalPLRate.toFixed(2)}%`
                  : "**.**%"}
              </div>
            </div>
          </div>

          {/* 2x2 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">현금잔고</div>
              <div className="text-base font-bold text-white">
                {showBalance ? "₩5.4M" : "₩*.**M"}
              </div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">투자금액</div>
              <div className="text-base font-bold text-white">
                {showBalance
                  ? `₩${(totalInvestment / 1000000).toFixed(1)}M`
                  : "₩*.**M"}
              </div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">평가금액</div>
              <div className="text-base font-bold text-white">
                {showBalance
                  ? `₩${(currentValue / 1000000).toFixed(1)}M`
                  : "₩*.**M"}
              </div>
            </div>
            <div className="bg-slate-700 rounded-xl p-3">
              <div className="text-xs text-gray-400 mb-1">총 자산</div>
              <div className="text-base font-bold text-white">
                {showBalance
                  ? `₩${((currentValue + 5420000) / 1000000).toFixed(1)}M`
                  : "₩*.**M"}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 - 모바일 최적화 */}
        <div className="bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: "portfolio", name: "포트폴리오", icon: PieChart },
              { id: "analysis", name: "분석", icon: BarChart3 },
              { id: "strategy", name: "전략", icon: Brain },
              { id: "simulation", name: "시뮬레이션", icon: Target },
              { id: "history", name: "모의투자 이력", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-center border-b-2 transition-colors min-w-[80px] ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400 bg-blue-500 bg-opacity-10"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-xs font-medium">{tab.name}</div>
                </button>
              );
            })}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-4">
            {activeTab === "portfolio" && (
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
            )}

            {activeTab === "analysis" && (
              <div className="space-y-4">
                {/* 기간별 수익률 */}
                <div className="bg-slate-700 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    📈 기간별 수익률
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +8.5%
                      </div>
                      <div className="text-xs text-gray-400">1개월</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +12.3%
                      </div>
                      <div className="text-xs text-gray-400">3개월</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +18.7%
                      </div>
                      <div className="text-xs text-gray-400">6개월</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        +24.1%
                      </div>
                      <div className="text-xs text-gray-400">1년</div>
                    </div>
                  </div>
                </div>

                {/* 리스크 지표 */}
                <div className="bg-slate-700 rounded-xl p-4">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    ⚠️ 리스크 지표
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">변동성</span>
                        <span className="font-medium text-white">18.5%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: "18.5%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">최대낙폭(MDD)</span>
                        <span className="font-medium text-red-400">-12.3%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: "12.3%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">샤프지수</span>
                      <span className="font-medium text-green-400">
                        1.85 (우수)
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI 예측 */}
                <div className="bg-gradient-to-r from-purple-500 bg-opacity-10 to-blue-500 bg-opacity-10 rounded-xl p-4 border border-purple-500 border-opacity-30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="font-medium text-white text-sm">
                      🤖 AI 예측
                    </h3>
                  </div>
                  <div className="text-center mb-3">
                    <div className="text-xl font-bold text-purple-400">
                      +6.8% ~ +9.2%
                    </div>
                    <div className="text-xs text-gray-400">
                      다음 달 예상 수익률
                    </div>
                  </div>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>• 기술주 섹터 강세 지속 전망</div>
                    <div>• NVDA 실적 발표 임박 (호재 예상)</div>
                    <div>• 시장 변동성 증가 예상</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "strategy" && (
              <div className="space-y-4">
                {/* 투자 성향 */}
                <div className="bg-blue-500 bg-opacity-10 rounded-xl p-4 border border-blue-500 border-opacity-30">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    🎯 나의 투자 성향
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-400">
                        단기매매
                      </div>
                      <div className="text-xs text-gray-400">70% 비중</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        성장주
                      </div>
                      <div className="text-xs text-gray-400">선호 스타일</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-400">
                        공격적
                      </div>
                      <div className="text-xs text-gray-400">투자 성향</div>
                    </div>
                  </div>
                </div>

                {/* 추천 전략 Top 3 */}
                <div>
                  <h3 className="font-medium text-white mb-3 text-sm">
                    💡 추천 전략 TOP 3
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-slate-700 border-2 border-green-500 border-opacity-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-green-400" />
                          <span className="font-medium text-green-300 text-sm">
                            1위: 모멘텀 전략
                          </span>
                        </div>
                        <span className="text-xs bg-green-500 bg-opacity-20 text-green-300 px-2 py-1 rounded-full">
                          92%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        상승 추세 종목 집중 투자
                      </p>
                      <div className="text-xs text-gray-400">
                        예상 수익률: +15~20% | 위험도: 높음
                      </div>
                    </div>

                    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white text-sm">
                            2위: 섹터 로테이션
                          </span>
                        </div>
                        <span className="text-xs bg-blue-500 bg-opacity-20 text-blue-300 px-2 py-1 rounded-full">
                          78%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        강세 섹터 간 자금 이동
                      </p>
                      <div className="text-xs text-gray-400">
                        예상 수익률: +10~15% | 위험도: 중간
                      </div>
                    </div>

                    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-purple-400" />
                          <span className="font-medium text-white text-sm">
                            3위: 기술적 분석
                          </span>
                        </div>
                        <span className="text-xs bg-purple-500 bg-opacity-20 text-purple-300 px-2 py-1 rounded-full">
                          65%
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">
                        RSI, MACD 기반 매매
                      </p>
                      <div className="text-xs text-gray-400">
                        예상 수익률: +8~12% | 위험도: 중간
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "simulation" && (
              <div className="space-y-4">
                {/* 시뮬레이션 */}
                <div className="bg-green-500 bg-opacity-10 rounded-xl p-4 border border-green-500 border-opacity-30">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    🎮 가상 시나리오
                  </h3>
                  <div className="space-y-3">
                    <select className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white">
                      <option>AAPL - 애플</option>
                      <option>MSFT - 마이크로소프트</option>
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="투자금액"
                        className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-gray-400"
                      />
                      <select className="px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white">
                        <option>1개월</option>
                        <option>3개월</option>
                        <option>6개월</option>
                      </select>
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-green-700">
                      시뮬레이션 실행
                    </button>
                  </div>
                  <div className="mt-4 bg-slate-700 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">예상 결과</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white">예상 수익</span>
                      <span className="font-bold text-green-400">
                        +₩2,670K (+8.5%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* 리밸런싱 추천 */}
                <div>
                  <h3 className="font-medium text-white mb-3 text-sm">
                    ⚖️ 리밸런싱 추천
                  </h3>
                  <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl p-4 mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-yellow-300 text-sm">
                        포트폴리오 조정 필요
                      </span>
                    </div>
                    <p className="text-xs text-yellow-200">
                      기술주 비중 65% 과도 집중
                    </p>
                  </div>

                  <div className="bg-slate-700 rounded-xl border border-slate-600 p-4">
                    <h4 className="font-medium text-white mb-3 text-sm">
                      권장 액션
                    </h4>
                    <div className="space-y-2 text-xs text-gray-300">
                      <div>• AAPL 일부 매도 (20%) → 헬스케어 ETF</div>
                      <div>• JPM, BAC 금융주 추가 매수</div>
                      <div className="text-blue-400">
                        • 예상 효과: 리스크 15% 감소
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                {/* 모의투자 이력 헤더 */}
                <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                  <h3 className="font-medium text-white mb-3 text-sm flex items-center gap-2">
                    <History className="w-4 h-4" />
                    📊 모의투자 이력
                  </h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-400">
                        {investmentHistory.filter((h) => h.profit > 0).length}
                      </div>
                      <div className="text-xs text-gray-400">수익 거래</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-400">
                        {investmentHistory.filter((h) => h.profit < 0).length}
                      </div>
                      <div className="text-xs text-gray-400">손실 거래</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {
                          investmentHistory.filter((h) => h.status === "보유중")
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-400">보유중</div>
                    </div>
                  </div>
                </div>

                {/* 거래 이력 목록 */}
                <div>
                  <h3 className="font-medium text-white mb-3 text-sm">
                    최근 거래 내역
                  </h3>
                  <div className="space-y-3">
                    {investmentHistory.map((trade) => (
                      <div
                        key={trade.id}
                        className="bg-slate-700 rounded-xl p-4 border border-slate-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                              <img
                                src={`https://financialmodelingprep.com/image-stock/${trade.stock}.png`}
                                alt={trade.stockName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <span className="text-white font-bold text-sm hidden">
                                {trade.stock}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-semibold text-sm">
                                {trade.stockName}
                              </h4>
                              <p className="text-gray-400 text-xs">
                                {trade.date} • {trade.action}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-bold text-sm flex items-center gap-1 ${
                                trade.profit >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {trade.profit >= 0 ? (
                                <TrendingUpIcon className="w-3 h-3" />
                              ) : (
                                <TrendingDownIcon className="w-3 h-3" />
                              )}
                              {trade.profit >= 0 ? "+" : ""}$
                              {Math.abs(trade.profit).toFixed(0)}
                            </div>
                            <div
                              className={`text-xs ${
                                trade.profit >= 0
                                  ? "text-green-300"
                                  : "text-red-300"
                              }`}
                            >
                              {trade.profit >= 0 ? "+" : ""}
                              {trade.profitRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-gray-400 mb-1">수량</div>
                            <div className="text-white font-medium">
                              {trade.quantity}주
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">
                              {trade.action === "매수" ? "매수가" : "매도가"}
                            </div>
                            <div className="text-white font-medium">
                              ${trade.price.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">상태</div>
                            <div
                              className={`font-medium ${
                                trade.status === "보유중"
                                  ? "text-blue-400"
                                  : "text-gray-300"
                              }`}
                            >
                              {trade.status}
                            </div>
                          </div>
                        </div>

                        {trade.status === "보유중" && (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">현재가</span>
                              <span className="text-white font-medium">
                                ${trade.currentPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 통계 요약 */}
                <div className="bg-slate-700 rounded-xl p-4 border border-slate-600">
                  <h3 className="font-medium text-white mb-3 text-sm">
                    📈 투자 성과 요약
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">총 수익</div>
                      <div className="text-lg font-bold text-green-400">
                        +$
                        {investmentHistory
                          .reduce((sum, trade) => sum + trade.profit, 0)
                          .toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">승률</div>
                      <div className="text-lg font-bold text-white">
                        {(
                          (investmentHistory.filter((h) => h.profit > 0)
                            .length /
                            investmentHistory.length) *
                          100
                        ).toFixed(0)}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI 인사이트 */}
        <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-white mb-3 text-sm">
            💡 AI 투자 인사이트
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 bg-opacity-10 to-blue-500 bg-opacity-10 rounded-xl border border-purple-500 border-opacity-30">
              <h4 className="font-medium text-purple-300 mb-1 text-sm">
                이번 주 추천
              </h4>
              <p className="text-xs text-purple-200">
                기술주 비중 조정, 헬스케어 분산투자 고려
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 bg-opacity-10 to-emerald-500 bg-opacity-10 rounded-xl border border-green-500 border-opacity-30">
              <h4 className="font-medium text-green-300 mb-1 text-sm">
                성과 분석
              </h4>
              <p className="text-xs text-green-200">
                최근 30일 단타 성과 우수, 현재 전략 유지 권장
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
