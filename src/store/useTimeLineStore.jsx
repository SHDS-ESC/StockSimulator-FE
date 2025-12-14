import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useTimeLineStore = create (
  persist(
    (set) => ({
      timelines: [], // 리스트로 저장
      addTimeline: (timeline) =>
        set((state) => ({ timelines: [...state.timelines, timeline] })),
      setTimelines: (timelines) =>
        set(() => ({ timelines: timelines })),
    }),
    {
      name: 'timeLineList', // 로컬스토리지 key
      storage: createJSONStorage(() => sessionStorage), // sessionStorage or localStorage
      partialize: (timelineList) => ({ timelines: timelineList.timelines }),
    }
  )
);

export default useTimeLineStore;
