// src/store/useChartStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as echarts from "echarts";

const useChartStore = create(
  persist(
    (set, get) => ({
  portfolioList: [], // 차트 데이터
  chartInstance: null, // ECharts 인스턴스

  setPortfolioList: (list) => set({ portfolioList: list }),

  initChart: (chartRef) => {
    console.log("=== useChartStore initChart 실행 ===");
    console.log("chartRef:", chartRef);
    console.log("chartRef.current:", chartRef?.current);

    if (!chartRef?.current) {
      console.log("차트 컨테이너가 없습니다!");
      return;
    }

    // 기존 차트 있으면 dispose
    if (get().chartInstance) {
      console.log("기존 차트 dispose");
      get().chartInstance.dispose();
    }

    const myChart = echarts.init(chartRef.current);
    set({ chartInstance: myChart });
    console.log("차트 인스턴스 생성 완료:", myChart);

    const updateChart = () => {
      const data = get().portfolioList;
      const itemCount = Array.isArray(data) ? data.length : 0;
      // 항목이 많을수록 파이를 약간 위로 올리고 반지름을 줄여 겹침 방지
      const centerY = itemCount > 14 ? "40%" : itemCount > 10 ? "42%" : itemCount > 6 ? "44%" : "45%";
      const outerR = itemCount > 14 ? "56%" : itemCount > 10 ? "58%" : "60%";

      myChart.setOption({
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
          type: "scroll",
          orient: "horizontal",
          bottom: 6,
          left: "center",
          padding: [0, 0, 6, 0],
          itemGap: 10,
          textStyle: { color: "#ffffff", fontSize: 11 },
          pageTextStyle: { color: "#ffffff" },
          pageIconColor: "#ffffff",
        },
        series: [
          {
            name: "보유 종목",
            type: "pie",
            radius: ["30%", outerR],
            center: ["50%", centerY],
            avoidLabelOverlap: false,
            label: { show: false },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: "bold",
                color: "#fff",
              },
            },
            data: data,
          },
        ],
      });
    };

    // 초기 그리기
    updateChart();

    // portfolioList 변경 시 자동 업데이트 구독
    const unsubscribe = useChartStore.subscribe(
      (state) => state.portfolioList,
      () => {
        try {
          updateChart();
        } catch (e) {
          console.warn("차트 업데이트 실패", e);
        }
      }
    );

    window.addEventListener("resize", updateChart);

    return () => {
      unsubscribe?.();
      window.removeEventListener("resize", updateChart);
      myChart.dispose();
      set({ chartInstance: null });
    };
  },
    }),
    {
      name: "chart-store",
      partialize: (state) => ({ portfolioList: state.portfolioList }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useChartStore;
