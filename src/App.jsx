import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Character from "./pages/Character";
import Stocks from "./pages/Stocks";
import News from "./pages/News";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyPage from "./pages/Mypage";
import OrderHistory from "./pages/OrderHistory";
import { Header, Footer } from "./components/layout/Layout";
import AnimatedBackground from "./components/AnimatedBackground";
import "./index.css";
import StockLive from "./pages/trade/StockLive";
import RedisTest from "./pages/RedisTest";
import Chat from "./pages/Chat";
import useDateStore from "@/store/useDateStore";
import React, { useState, useEffect, useRef } from "react";
import useScrollLock from "@/hooks/useScrollLock";
import axiosInstance from "./util/axiosInstance";
// CalendarForm 관련 imports
import { format, subDays } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useLoginStore from "./store/useLoginStore";
import useChartStore from "./store/useChartStore";

const FormSchema = z.object({
  selectedDate: z.date({
    required_error: "날짜를 선택해주세요.",
  }),
});

// CalendarForm 컴포넌트
function CalendarForm({ onSubmit, onClose, selectedDate }) {
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      selectedDate: selectedDate || new Date(),
    },
  });

  function handleSubmit(data) {
    onSubmit(data.selectedDate);
    toast("날짜가 선택되었습니다", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">
            {format(data.selectedDate, "yyyy년 MM월 dd일")}
          </code>
        </pre>
      ),
    });
  }
  const profile = JSON.parse(localStorage.getItem("newProfile") || "{}");
  const timelineFrom = new Date(profile.timelineFrom);
  const timelineTo = new Date(profile.timelineTo);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white ps-6 pe-6 pb-6 pt-4 rounded-lg shadow-lg w-[40%] max-w-md">
        <div className="flex justify-between items-center mt-0 mb-0">
          <h3 className="text-lg font-semibold">날짜 선택</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 flex justify-between items-start"
          >
            ✕
          </Button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="selectedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>날짜 선택</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "yyyy년 MM월 dd일")
                          ) : (
                            <span>날짜를 선택하세요</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        defaultMonth={field.value}
                        disabled={(date) =>
                          date > new Date() ||
                          date < new Date("1900-01-01") || // 절대 범위
                          date.getDay() === 0 ||
                          date.getDay() === 6 || // 주말
                          date < timelineFrom ||
                          date > timelineTo
                        }
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    선택된 날짜가 애플리케이션에 적용됩니다.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit">확인</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

function App() {
  const { isTurnOver, currentDate, skipNotice, goNextTurn, isEnding } = useDateStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { lastProfileId } = useLoginStore();
  const chartRef = useRef(null);
  const toggleCalendar = () => setIsCalendarOpen((prev) => !prev);
  const { portfolioList, setPortfolioList, initChart } = useChartStore();
  // 모달 열릴 때 배경 스크롤 잠금 (캘린더/턴오버/엔딩)
  useScrollLock(isCalendarOpen || isTurnOver || isEnding);
  // Header에서 호출할 콜백 함수
  const handleTurnOverData = (changeList) => {
    console.log("App에서 받은 턴 종료 데이터:", changeList);
    setTodayOfferData(changeList);
  };
  // 유틸리티 함수들

  // 금액
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "" || value === "0")
      return "$ 0";

    const numValue =
      typeof value === "string"
        ? parseFloat(value.replace(/[$,]/g, ""))
        : value;

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

  // 달러 변동
  const formatCurrencyValue = (value) => {
    if (value === null || value === undefined || value === "" || value === "0")
      return "$ 0";

    const numValue =
      typeof value === "string"
        ? parseFloat(value.replace(/[$,]/g, ""))
        : value;

    if (!Number.isFinite(numValue)) return "$ 0";

    const absValue = Math.abs(numValue);
    const formatted = absValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0, // 소수점 없애기
    });

    return formatted.replace("$", "$ ");
  };

  // 등락률
  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === "") return "0.00%";
    const numValue =
      typeof value === "string"
        ? parseFloat(value.replace(/[+%]/g, ""))
        : value;
    if (!Number.isFinite(numValue)) return "0.00%";
    return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(2)}%`;
  };

  const getColorClass = (value) => {
    if (value > 0) return "text-red-500";
    if (value < 0) return "text-blue-400";
    return "text-gray-400";
  };

  const parseNumericValue = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, "");
    const n = parseFloat(cleaned);
    if (!Number.isFinite(n)) return 0;
    return Math.abs(n) < 1e-9 ? 0 : n;
  };

  const handleDateChange = async (selectedDate) => {
    try {
      const response = await axiosInstance.post(
        "/userprofile/update/process-date",
        {
          userProfileId: lastProfileId,
          prevProcessDate: format(subDays(selectedDate, 1), "yyyy-MM-dd"),
          processDate: format(selectedDate, "yyyy-MM-dd"),
        }
      );

      console.log("날짜 선택 응답:", response.data);

      // changeList 사용 (차트용) - 이미 올바름
      const responseData = response.data.changeList.map((holdings) => ({
        value: holdings.currentPrice, // price → currentPrice로 수정
        name: holdings.ticker,
        itemStyle: { color: getRandomColor() },
      }));

      console.log("차트 데이터:", responseData);
      setPortfolioList(responseData); // store에 저장
      initChart(chartRef);
      setTodayOfferData(response.data.changeList); // 이미 올바름
      goNextTurn(selectedDate);
      setIsCalendarOpen(false);
    } catch (error) {
      console.error("날짜 업데이트 실패:", error);
      toast("날짜 업데이트에 실패했습니다", {
        description: "다시 시도해주세요.",
      });
    }
  };

  const [todayOfferData, setTodayOfferData] = useState([]);

  const [todayProfile, setTodayProfile] = useState([]);
  const [endingHoldings, setEndingHoldings] = useState([]);
  const formatDate = (currentDate) => {
    let date = new Date(currentDate);

    // 하루 빼기
    date.setDate(date.getDate() - 1);

    // 다시 yyyy-MM-dd 형식으로 변환
    return date.toISOString().split("T")[0];
  };

  // const fetchTodayOfferData = async () => {
  //   try {
  //     const response = await axiosInstance.post(
  //       `offer/today`,
  //       {
  //         offerDate: formatDate(currentDate),
  //         userProfileId: lastProfileId,
  //       },
  //       { withCredentials: true }
  //     );
  //     setTodayOfferData(response.data.todayOfferResponseDTOList);
  //     setTodayProfile({
  //       totalPrice: 0.0,
  //       changeAmount: 0.0,
  //       changeRate: 0.0,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching todayOfferList:", error);
  //     return 0;
  //   }
  // };

  const handleCloseCalendar = () => {
    setIsCalendarOpen(false);
  };

  function getRandomColor() {
    return (
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    );
  }

  // 차트 초기화: 턴종료/엔딩 팝업 모두에서 동작
  useEffect(() => {
    if ((isTurnOver || isEnding) && chartRef.current) {
      const cleanup = initChart(chartRef);
      return cleanup;
    }
  }, [initChart, isTurnOver, isEnding, chartRef, todayOfferData]);

  // portfolioList가 변경될 때 차트 업데이트를 위한 별도 useEffect
useEffect(() => {
  if (portfolioList.length > 0 && chartRef.current) {
    const item = JSON.parse(localStorage.getItem("newProfile") || "{}");

    setTodayProfile({
      cashBalance: item.cashBalance ?? 0,
      totalInvested: item.totalInvested ?? 0,
      totalAssets: item.totalAssets ?? 0,
    });

    console.log("Portfolio data updated:", portfolioList);
  }
}, [portfolioList]);

  // 엔딩 모달이 열릴 때 보유 주식 리스트 로드
  useEffect(() => {
    const loadEndingHoldings = async () => {
      try {
        if (!isEnding) return;
        const profile = JSON.parse(localStorage.getItem("newProfile") || "{}");
        const id = profile?.id || lastProfileId;
        const offerDate = formatDate(currentDate);
        if (!id || !offerDate) {
          setEndingHoldings([]);
          return;
        }
        const resp = await axiosInstance.get(
          `holdings/stocks/${id}/${offerDate}`,
          { withCredentials: true }
        );
        const list = resp?.data?.holdingsResponseDTOS || [];
        setEndingHoldings(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Ending holdings fetch failed", e);
        setEndingHoldings([]);
      }
    };
    loadEndingHoldings();
  }, [isEnding, currentDate, lastProfileId]);

  return (
    <div className="min-h-screen flex flex-col items-center relative">
      <AnimatedBackground />
      <Header onClick={toggleCalendar} onTurnOverData={handleTurnOverData} />
      {/* CalendarForm 컴포넌트 */}
      {isCalendarOpen && (
        <CalendarForm
          onSubmit={handleDateChange}
          onClose={handleCloseCalendar}
          selectedDate={currentDate ? new Date(currentDate) : new Date()}
        />
      )}

      <div className="bg-slate-950 w-full max-w-md flex-1 flex flex-col relative z-20">
        <div className="overflow-y-auto hide-scrollbar flex-1 pt-10 mb-10 relative pt-16 pb-5">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/stocks/:symbol" element={<StockLive />} />
            <Route path="/stocks/live/:symbol" element={<StockLive />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/character" element={<Character />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/news" element={<News />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/orderhistory" element={<OrderHistory />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/redis-test" element={<RedisTest />} />
          </Routes>
        </div>

        {/* TurnOver 팝업 */}
        {isTurnOver && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div
              className="bg-slate-800 rounded-2xl ps-8 pe-8 pt-4 inline-block w-auto max-w-[90vw] sm:max-w-[640px] overflow-auto scrollbar-hide"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end">
                <button
                  onClick={() => useDateStore.setState({ isTurnOver: false })}  
                  className="px-4 rounded-lg text-white mb-5"
                >
                  X
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white text-center">
                {formatDate(currentDate)} 투자 요약
              </h2>
              {/*차트*/}
              <div className="mb-10">
                <div
                  ref={chartRef}
                  className="bg-slate-800 rounded-xl overflow-hidden mx-auto"
                  style={{
                    height: "280px",
                    width: "100%",
                    maxWidth: "400px", // 이 값으로 차트 크기 조절 가능
                  }}
                />
                <div className="mt-4 bg-slate-900 p-4 rounded-xl text-white shadow-md w-full">
                  {/* 총자산/투자손익/보유 현금 */}
                  <div className="flex flex-col gap-4 mb-6">
                    {/* 총 자산 */}
                    <div className="flex justify-between">
                      <span className="font-semibold">총 자산</span>
                      <div className="flex flex-col text-end">
                        <div className="font-bold">
                          {formatCurrencyValue(todayProfile.totalAssets)}
                        </div>
                        <div
                          className={getColorClass(
                            parseNumericValue(todayProfile.changeRate)
                          )}
                        >
                          ({formatPercentage(todayProfile.changeRate)})
                        </div>
                      </div>
                    </div>

                    {/* 투자 손익 */}
                    <div className="flex justify-between">
                      <span className="font-semibold">투자금</span>
                      <div className="flex flex-col text-end">
                        <span
                          className={`font-bold `}
                        >
                         $ {todayProfile.totalInvested}
                        </span>
                        <div
                          className={getColorClass(
                            parseNumericValue(todayProfile.changeRate)
                          )}
                        >
                          ({formatPercentage(todayProfile.changeRate)})
                        </div>
                      </div>
                    </div>

                    {/* 보유 현금 */}
                    <div className="flex justify-between">
                      <span className="font-semibold">보유 현금</span>
                      <div className="flex flex-col text-end">
                        <span className="font-bold">
                          {formatCurrencyValue(todayProfile?.cashBalance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 구매/판매 내역 리스트 (스크롤 가능) */}
                  <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2">
                    {todayOfferData.map((todayOffer, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-2 border-b border-gray-700"
                      >
                        {/* 왼쪽: 로고 + 종목명 */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-[5px] flex items-center justify-center overflow-hidden">
                            <img
                              src={todayOffer.logo} // <- 로고 url 사용
                              alt={todayOffer.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm">
                              {todayOffer.name}
                            </h4>
                            <p className="text-gray-400 text-xs">
                              {todayOffer.ticker}
                            </p>
                          </div>
                        </div>

                        {/* 오른쪽: 수량/금액/등락률 */}
                        <div className="text-right">
                          <p className="text-white font-semibold text-[10px] mb-2">
                            {todayOffer.quantity}주
                          </p>
                          <p className="text-white font-semibold text-sm">
                            {formatCurrencyValue(todayOffer.changeAmount)}
                          </p>
                          <p
                            className={`text-xs ${getColorClass(
                              parseNumericValue(todayOffer.changeAmount)
                            )}`}
                          >
                            {formatCurrency(todayOffer.changeAmount)} (
                            {formatPercentage(todayOffer.changeRate)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

         {/* Ending 팝업 */}
        {isEnding && (
          
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            
            <div
              className="bg-slate-800 rounded-2xl ps-8 pe-8 pt-4 inline-block w-auto max-w-[90vw] sm:max-w-[640px] overflow-auto scrollbar-hide"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end">
                <button
                  onClick={() => useDateStore.setState({ isEnding: false }, 
                  )}  
                  className="pt-4 rounded-lg text-white mb-5"
                >
                  X
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white text-center">
              {JSON.parse(localStorage.getItem("newProfile") || "{}").name} 모의 투자 종료
              </h2>
              {/*차트*/}
              <div className="mb-10">
                <div
                  ref={chartRef}
                  className="bg-slate-800 rounded-xl overflow-hidden mx-auto"
                  style={{
                    height: "280px",
                    width: "100%",
                    maxWidth: "400px", // 이 값으로 차트 크기 조절 가능
                  }}
                />
                
                <div className="mt-4 bg-slate-900 p-4 rounded-xl text-white shadow-md w-full">
                  {/* 총자산/투자손익/보유 현금 */}
                  <div className="flex flex-col gap-4 mb-6">
                    {/* 총 자산 */}
                    <div className="flex justify-between">
                      <span className="font-semibold">총 자산</span>
                      <div className="flex flex-col text-end">
                        <div className="font-bold">
                          {formatCurrencyValue(todayProfile.totalAssets)}
                        </div>
                        <div
                          className={getColorClass(
                            parseNumericValue(todayProfile.changeRate)
                          )}
                        >
                          ({formatPercentage(todayProfile.changeRate)})
                        </div>
                      </div>
                    </div>

                    {/* 투자 손익 */}
                    <div className="flex justify-between">
                      <span className="font-semibold">투자금</span>
                      <div className="flex flex-col text-end">
                        <span
                          className={`font-bold `}
                        >
                          {formatCurrency(todayProfile.totalInvested)}
                        </span>
                        <div
                          className={getColorClass(
                            parseNumericValue(todayProfile.changeRate)
                          )}
                        >
                          ({formatPercentage(todayProfile.changeRate)})
                        </div>
                      </div>
                    </div>

                    {/* 보유 현금 */}
                    <div className="flex justify-between">
                      <span className="font-semibold">보유 현금</span>
                      <div className="flex flex-col text-end">
                        <span className="font-bold">
                          {formatCurrencyValue(todayProfile?.cashBalance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 구매/판매 내역 리스트 (스크롤 가능) */}
                  <div className="max-h-40 overflow-y-auto scrollbar-hide space-y-2">
                    {todayOfferData.map((todayOffer, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-2 border-b border-gray-700"
                      >
                        {/* 왼쪽: 로고 + 종목명 */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-[5px] flex items-center justify-center overflow-hidden">
                            <img
                              src={todayOffer.logo} // <- 로고 url 사용
                              alt={todayOffer.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm">
                              {todayOffer.name}
                            </h4>
                            <p className="text-gray-400 text-xs">
                              {todayOffer.ticker}
                            </p>
                          </div>
                        </div>

                        {/* 오른쪽: 수량/금액/등락률 */}
                        <div className="text-right">
                          <p className="text-white font-semibold text-[10px] mb-2">
                            {todayOffer.quantity}주
                          </p>
                          <p className="text-white font-semibold text-sm">
                            {formatCurrencyValue(todayOffer.changeAmount)}
                          </p>
                          <p
                            className={`text-xs ${getColorClass(
                              parseNumericValue(todayOffer.changeAmount)
                            )}`}
                          >
                            {formatCurrency(todayOffer.changeAmount)} (
                            {formatPercentage(todayOffer.changeRate)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* 휴장일 스킵 토스트 */}
        {skipNotice && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-blue-900 text-blue-100 border border-blue-500/40 rounded-lg px-4 py-2 text-xs shadow-lg">
              <span>{skipNotice.from}</span>
              <span className="mx-1">→</span>
              <span>{skipNotice.to}</span>
              <span className="ml-2">휴장일로 {skipNotice.skipped}일 SKIP</span>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
