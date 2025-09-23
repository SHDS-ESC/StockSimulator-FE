import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Target,
  Award,
  AlertTriangle,
  LineChart,
} from "lucide-react";
import useLoginStore from "@/store/useLoginStore";
import axiosInstance from "@/util/axiosInstance";
import PredictionChartModal from "../components/PredictionChartModal";

// 툴팁 컴포넌트
const Tooltip = ({ children, content }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const tooltipRef = useRef(null);

  const handleMouseEnter = (event) => {
    setShowTooltip(true);
    
    // 화면 위치에 따라 툴팁 위치 결정
    setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const tooltipWidth = 256; // w-64 = 16rem = 256px
      const padding = 16; // 여백
      
      let newTooltipStyle = {};
      let newArrowStyle = {};
      
      // 왼쪽으로 잘리는 경우
      if (rect.left < tooltipWidth / 2 + padding) {
        newTooltipStyle = {
          left: '0px',
          transform: 'none'
        };
        newArrowStyle = {
          left: `${Math.max(16, rect.width / 2)}px`,
          transform: 'none'
        };
      }
      // 오른쪽으로 잘리는 경우  
      else if (rect.right > windowWidth - tooltipWidth / 2 - padding) {
        newTooltipStyle = {
          right: '0px',
          left: 'auto',
          transform: 'none'
        };
        newArrowStyle = {
          right: `${Math.max(16, rect.width / 2)}px`,
          left: 'auto',
          transform: 'none'
        };
      }
      // 중앙 정렬 (기본)
      else {
        newTooltipStyle = {
          left: '50%',
          transform: 'translateX(-50%)'
        };
        newArrowStyle = {
          left: '50%',
          transform: 'translateX(-50%)'
        };
      }
      
      setTooltipStyle(newTooltipStyle);
      setArrowStyle(newArrowStyle);
    }, 10);
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip && (
        <div 
          ref={tooltipRef}
          className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 w-64 text-center"
          style={tooltipStyle}
        >
          <div className="whitespace-pre-line">{content}</div>
          <div 
            className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={arrowStyle}
          ></div>
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const [activeTab, setActiveTab] = useState("analysis");
  const { email, lastProfileId } = useLoginStore();
  
  // 시뮬레이션 상태 관리
  const [simulation, setSimulation] = useState({
    ticker: "AAPL",
    today: new Date().toISOString().split('T')[0],
    trainDays: 110,
    predictSteps: 3,
    loading: false,
    result: null,
    error: null
  });

  // 모달 상태 관리
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  // API 호출 함수
  const handleSimulationSubmit = async () => {
    setSimulation(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await axiosInstance.post('http://localhost:8090/dev/agent/predict', {
        ticker: simulation.ticker,
        today: simulation.today,
        train_days: simulation.trainDays,
        predict_steps: simulation.predictSteps
      });
      
      setSimulation(prev => ({ 
        ...prev, 
        loading: false, 
        result: response.data 
      }));
    } catch (error) {
      console.error('시뮬레이션 API 오류:', error);
      setSimulation(prev => ({ 
        ...prev, 
        loading: false, 
        error: '시뮬레이션 중 오류가 발생했습니다.' 
      }));
    }
  };

  // 입력값 변경 핸들러
  const handleSimulationChange = (field, value) => {
    setSimulation(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* 모바일 헤더 */}
      <div className="bg-slate-900 sticky top-0 z-50 border-b border-slate-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                💬
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AI 투자 분석</h1>
                <p className="text-xs text-gray-400">스마트한 투자 인사이트</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 탭 네비게이션 - 모바일 최적화 */}
        <div className="bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: "analysis", name: "분석", icon: BarChart3 },
              { id: "strategy", name: "전략", icon: Brain },
              { id: "simulation", name: "시뮬레이션", icon: Target },
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
                    🎮 AI 주식 예측 시뮬레이션
                  </h3>
                  <div className="space-y-3">
                    {/* 티커 입력 */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">티커 심볼</label>
                      <input
                        type="text"
                        value={simulation.ticker}
                        onChange={(e) => handleSimulationChange('ticker', e.target.value.toUpperCase())}
                        placeholder="예: AAPL"
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-gray-400"
                      />
                    </div>
                    
                    {/* 기준 날짜 */}
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">기준 날짜</label>
                      <input
                        type="date"
                        value={simulation.today}
                        onChange={(e) => handleSimulationChange('today', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                      />
                    </div>
                    
                    {/* 학습 기간과 예측 일수 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">학습 일수</label>
                        <input
                          type="number"
                          value={simulation.trainDays}
                          onChange={(e) => handleSimulationChange('trainDays', parseInt(e.target.value))}
                          min="30"
                          max="365"
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">예측 일수</label>
                        <input
                          type="number"
                          value={simulation.predictSteps}
                          onChange={(e) => handleSimulationChange('predictSteps', parseInt(e.target.value))}
                          min="1"
                          max="30"
                          className="w-full px-3 py-2 text-sm border border-slate-600 rounded-lg bg-slate-700 text-white"
                        />
                      </div>
                    </div>
                    
                    {/* 에러 메시지 */}
                    {simulation.error && (
                      <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg p-3">
                        <p className="text-xs text-red-300">{simulation.error}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleSimulationSubmit}
                      disabled={simulation.loading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {simulation.loading ? '예측 중...' : 'AI 예측 실행'}
                    </button>
                  </div>
                  
                  {/* 결과 표시 */}
                  {simulation.result && (
                    <div className="mt-4 space-y-4">
                      {/* 기본 정보 */}
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-2">예측 결과</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-300">종목</div>
                            <div className="font-medium text-white">{simulation.result.ticker}</div>
                          </div>
                          <div>
                            <div className="text-gray-300">기준가격</div>
                            <div className="font-medium text-white">${simulation.result.last_price?.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 예측 데이터 */}
                      {simulation.result.predicted && simulation.result.predicted.length > 0 && (
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-2">일별 예측</div>
                          <div className="space-y-2">
                            {simulation.result.predicted.map((prediction, index) => {
                              const isPositive = prediction.return_rate >= 0;
                              return (
                                <div key={index} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-300">
                                    {prediction.date} ({prediction.day}일차 예측)
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-white">${prediction.price?.toFixed(2)}</span>
                                    <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                      {isPositive ? '+' : ''}{
                                        prediction.return_rate.toFixed(2)
                                      }%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* 투자 분석 */}
                      {simulation.result.investment_analysis && (
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-3">투자 분석</div>
                          
                          {/* 추천 정보 */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">
                                {simulation.result.investment_analysis.recommendation}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  simulation.result.investment_analysis.action === 'BUY' 
                                    ? 'bg-green-600 text-white' 
                                    : simulation.result.investment_analysis.action === 'SELL'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-yellow-600 text-white'
                                }`}>
                                  {simulation.result.investment_analysis.action}
                                </span>
                                <div className="flex items-center space-x-2">
                                  {/* 점수 바 표시 */}
                                  <div className="flex items-center space-x-1">
                                    <div className="flex">
                                      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((value) => (
                                        <div
                                          key={value}
                                          className={`w-2 h-2 rounded-sm ${
                                            value <= simulation.result.investment_analysis.score
                                              ? value < 0 
                                                ? 'bg-red-500' 
                                                : value === 0 
                                                ? 'bg-gray-400' 
                                                : 'bg-green-500'
                                              : 'bg-gray-600'
                                          } ${value !== 5 ? 'mr-0.5' : ''}`}
                                        ></div>
                                      ))}
                                    </div>
                                    <span className={`text-xs font-medium ${
                                      simulation.result.investment_analysis.score > 0 
                                        ? 'text-green-400' 
                                        : simulation.result.investment_analysis.score < 0 
                                        ? 'text-red-400' 
                                        : 'text-gray-300'
                                    }`}>
                                      {simulation.result.investment_analysis.score > 0 ? '+' : ''}{simulation.result.investment_analysis.score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Tooltip content="신뢰도는 AI 분석의 정확성을 나타냅니다. HIGH: 매우 신뢰할 만함, MEDIUM: 적당히 신뢰할 만함, LOW: 신중한 판단 필요">
                              <div className="text-xs text-gray-300 mb-2 border-b border-dotted border-gray-500 inline-block">
                                신뢰도: {simulation.result.investment_analysis.confidence}
                              </div>
                            </Tooltip>
                          </div>

                          {/* 핵심 지표 */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-xs">
                              <Tooltip content="현재 주식의 실시간 가격입니다. 예측 분석의 기준점이 되는 가격입니다.">
                                <div className="text-gray-400 border-b border-dotted border-gray-500">현재가격</div>
                              </Tooltip>
                              <div className="text-white font-medium">
                                ${simulation.result.investment_analysis.metrics?.current_price?.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-xs">
                              <Tooltip content="AI가 예측하는 향후 기간의 평균 주가입니다. 현재가와 비교하여 상승/하락 여부를 판단할 수 있습니다.">
                                <div className="text-gray-400 border-b border-dotted border-gray-500">예상평균가격</div>
                              </Tooltip>
                              <div className="text-white font-medium">
                                ${simulation.result.investment_analysis.metrics?.predicted_avg_price?.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-xs">
                              <Tooltip content="투자 기간 동안 예상되는 총 수익률입니다. 배당금과 주가 상승분을 모두 포함한 수치입니다.">
                                <div className="text-gray-400 border-b border-dotted border-gray-500">기대수익률</div>
                              </Tooltip>
                              <div className="text-green-400 font-medium">
                                +{simulation.result.investment_analysis.metrics?.expected_total_return?.toFixed(1)}%
                              </div>
                            </div>
                            <div className="text-xs">
                              <Tooltip content="주가가 현재가보다 상승할 확률입니다. 70% 이상이면 상승 가능성이 높다고 판단할 수 있습니다.">
                                <div className="text-gray-400 border-b border-dotted border-gray-500">상승확률</div>
                              </Tooltip>
                              <div className="text-white font-medium">
                                {simulation.result.investment_analysis.metrics?.upside_probability?.toFixed(0)}%
                              </div>
                            </div>
                          </div>

                          {/* 리스크 지표 */}
                          <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2">리스크 지표</div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <Tooltip content="VaR (Value at Risk): 95% 신뢰도에서 하루 동안 발생할 수 있는 최대 손실률입니다. 예를 들어 -2.5%라면 95%의 확률로 하루 손실이 2.5%를 넘지 않는다는 의미입니다.">
                                  <div className="text-gray-400 border-b border-dotted border-gray-500">VaR (95%)</div>
                                </Tooltip>
                                <div className="text-red-400 font-medium">
                                  {simulation.result.investment_analysis.risk_metrics?.var_95?.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <Tooltip content="최대 예상 손실: 예측 기간 동안 발생할 수 있는 최악의 시나리오에서의 손실률입니다. 투자 전 리스크 허용 범위를 확인하는 데 중요한 지표입니다.">
                                  <div className="text-gray-400 border-b border-dotted border-gray-500">최대손실</div>
                                </Tooltip>
                                <div className="text-red-400 font-medium">
                                  {simulation.result.investment_analysis.risk_metrics?.max_expected_loss?.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <Tooltip content="샤프 비율: 위험 대비 수익률을 나타내는 지표입니다. 1.0 이상이면 좋은 투자, 2.0 이상이면 매우 우수한 투자로 평가됩니다. 높을수록 같은 위험 대비 더 높은 수익을 의미합니다.">
                                  <div className="text-gray-400 border-b border-dotted border-gray-500">샤프비율</div>
                                </Tooltip>
                                <div className="text-white font-medium">
                                  {simulation.result.investment_analysis.risk_metrics?.estimated_sharpe_ratio?.toFixed(1)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 투자 신호 */}
                          {simulation.result.investment_analysis.signals && simulation.result.investment_analysis.signals.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-400 mb-2">투자 신호</div>
                              <div className="space-y-1">
                                {simulation.result.investment_analysis.signals.map((signal, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-xs">
                                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                    <span className="text-gray-300">{signal}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 인터랙티브 차트 버튼 */}
                      {simulation.result && (
                        <div className="bg-slate-700 rounded-lg p-3">
                          <div className="text-xs text-gray-400 mb-3">예측 차트</div>
                          <button
                            onClick={() => setIsChartModalOpen(true)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2"
                          >
                            <LineChart className="w-4 h-4" />
                            <span>인터랙티브 차트 보기</span>
                          </button>
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            AI 예측 결과를 상세한 차트로 확인하세요
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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

      {/* 예측 차트 모달 */}
      <PredictionChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        ticker={simulation.ticker}
        baseDate={simulation.today}
        lastPrice={simulation.result?.last_price}
        predictionData={{
          dates: simulation.result?.prediction_dates || [],
          prices: simulation.result?.price_predictions || [],
          returns: simulation.result?.return_predictions || []
        }}
      />
    </div>
  );
};

export default Chat;
