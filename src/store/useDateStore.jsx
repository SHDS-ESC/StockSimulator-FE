import { create } from "zustand";
import { persist } from "zustand/middleware";

const useDateStore = create(
  persist(
    (set, get) => ({
      // 초기 상태
      currentDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD 형식
      isTurnOver: false,
      skipNotice: null, // { from, to, skipped }

      // 오늘 날짜로 초기화
      initToday: (currentDate) =>
        set({
          currentDate: currentDate,
        }),

      // 다음 턴으로 이동
      goNextTurn: (currentDateObj) => {
        const newDate = currentDateObj.toISOString().split("T")[0];
        set(() => {
          console.log(currentDateObj);
          return {
            currentDate: newDate,
            isTurnOver: true,
          };
        });
        return newDate;
      },

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

      // 휴장일 스킵 알림 표시/해제
      showSkipNotice: (info) => set({ skipNotice: info }),
      clearSkipNotice: () => set({ skipNotice: null }),

      // 현재 상태 초기화
      reset: () =>
        set({
          currentDate: new Date().toISOString().split("T")[0],
          skipNotice: null,
        }),
    }),
    {
      name: "date-storage", // 더 명확한 key 이름
    }
  )
);

export default useDateStore;
