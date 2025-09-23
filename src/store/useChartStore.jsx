// src/store/useChartStore.js
import { create } from "zustand";
import * as echarts from "echarts";

const useChartStore = create((set, get) => ({
  portfolioList: [], // 차트 데이터
  chartInstance: null, // ECharts 인스턴스

  setPortfolioList: (list) => set({ portfolioList: list }),

  initChart: (chartRef) => {
   if (!chartRef?.current) return;

    // 기존 차트 있으면 dispose
    if (get().chartInstance) {
      get().chartInstance.dispose();
    }

    const myChart = echarts.init(chartRef.current);
    set({ chartInstance: myChart });

    const updateChart = () => {
      const data = get().portfolioList;
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
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 14, fontWeight: "bold", color: "#fff" },
            },
            data: data,
          },
        ],
      });
    };

    updateChart();

    window.addEventListener("resize", updateChart);

    return () => {
      window.removeEventListener("resize", updateChart);
      myChart.dispose();
      set({ chartInstance: null });
    };
  },
}));

export default useChartStore;
