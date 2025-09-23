import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Character from "./pages/Character";
import Stocks from "./pages/Stocks";
import News from "./pages/News";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyPage from "./pages/Mypage";
import Main from "./pages/Main";
import { Header, Footer } from "./components/layout/Layout";
import AnimatedBackground from "./components/AnimatedBackground";
import "./index.css";
import TradePage from "./pages/trade/TradePage";
import StockLive from "./pages/trade/StockLive";
import RedisTest from "./pages/RedisTest";
import Chat from "./pages/Chat";
import useDateStore from "@/store/useDateStore";
import React, { useState, useEffect, useCallback, useRef } from "react";
import * as echarts from "echarts";
import axiosInstance from "./util/axiosInstance";
// CalendarForm 관련 imports
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">날짜 선택</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
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
  const { isTurnOver, currentDate, setCurrentDate } = useDateStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { lastProfileId } = useLoginStore();
  const chartRef = useRef(null);

  const toggleCalendar = () => setIsCalendarOpen((prev) => !prev);

  // 날짜 업데이트 로직을 단일화
 const handleDateChange = async (selectedDate) => {
    try {
      // 1. 먼저 전역 상태 업데이트
      setCurrentDate(selectedDate);
      
      // 2. 백엔드에 날짜 업데이트 요청
      if (lastProfileId) {
        // Date 객체를 YYYY-MM-DD 형식 문자열로 변환
        const formatDateForBackend = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const formattedDate = formatDateForBackend(selectedDate);
        
        await axiosInstance.post(
          "/userprofile/update/process-date",
          {
            userProfileId: lastProfileId,
            processDate: formattedDate,
          },
          { withCredentials: true }
        );
        console.log("날짜 업데이트 완료:", formattedDate);
      }
      
      // 3. 캘린더 모달 닫기
      setIsCalendarOpen(false);
      
    } catch (error) {
      console.error("날짜 업데이트 실패:", error);
      // 에러 발생 시 사용자에게 알림
      toast("날짜 업데이트에 실패했습니다", {
        description: "다시 시도해주세요.",
      });
    }
  };
  const handleCloseCalendar = () => {
    setIsCalendarOpen(false);
  };

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

  // 차트 초기화
  useEffect(() => {
    const cleanup = initChart();
    return cleanup;
  }, [initChart, isTurnOver]);

  return (
    <div className="min-h-screen flex flex-col items-center relative">
      <AnimatedBackground />
      <Header onClick={toggleCalendar} />

      {/* CalendarForm 컴포넌트 */}
      {isCalendarOpen && (
        <CalendarForm
          onSubmit={handleDateChange}
          onClose={handleCloseCalendar}
          selectedDate={currentDate ? new Date(currentDate) : new Date()}
        />
      )}

      <div className="bg-slate-950 w-full max-w-md flex-1 flex flex-col relative z-20">
        <div className="overflow-y-auto hide-scrollbar flex-1 pt-10 mb-10 relative pt-16 pb-20">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/stocks/:symbol" element={<StockLive />} />
            <Route path="/stocks/live/:symbol" element={<StockLive />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/character" element={<Character />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/news" element={<News />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/redis-test" element={<RedisTest />} />
          </Routes>
        </div>

        {/* TurnOver 팝업 */}
        {isTurnOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl p-8 w-[90%] max-w-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Turn Over!</h2>
              {/* 포트폴리오 파이 차트 */}
              <div className="mb-6">
                <div
                  ref={chartRef}
                  className="w-full bg-slate-700 rounded-xl overflow-hidden"
                  style={{ height: "280px", width: "100%" }}
                ></div>
              </div>
              <button
                onClick={() => useDateStore.setState({ isTurnOver: false })}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;