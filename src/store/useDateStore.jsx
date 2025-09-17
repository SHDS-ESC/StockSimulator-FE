import { create } from "zustand";
import { persist } from "zustand/middleware";

const useDateStore = create(
  persist(
    (set, get) => ({
      // 초기 상태
      currentDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD 형식

      // 오늘 날짜로 초기화
      initToday: (currentDate) =>
        set({
          currentDate: currentDate,
        }),

      // 다음 턴으로 이동
      goNextTurn: () =>
        set((state) => {
          const currentDateObj = new Date(state.currentDate);
            currentDateObj.setDate(currentDateObj.getDate() + 1);
            return {
              currentDate: currentDateObj.toISOString().split("T")[0],
              isPrev: true, // 다음 날짜의 첫 번째 턴
            }
        }),

      // 날짜 직접 설정
      setCurrentDate: (date) => {
        let formattedDate;

        if (date instanceof Date) {
          formattedDate = date.toISOString().split("T")[0];
        } else if (typeof date === "string") {
          // 문자열인 경우 Date 객체로 변환 후 포맷
          formattedDate = new Date(date).toISOString().split("T")[0];
        } else {
          // 잘못된 입력의 경우 현재 날짜
          formattedDate = new Date().toISOString().split("T")[0];
        }

        return set({
          currentDate: formattedDate,
        });
      },

      // 현재 상태 초기화
      reset: () =>
        set({
          currentDate: new Date().toISOString().split("T")[0],
        }),
    }),
    {
      name: "date-storage", // 더 명확한 key 이름
    }
  )
);

export default useDateStore;
