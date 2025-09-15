import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useLoginStore = create(
  persist(
    (set) => ({
      updatedAt: null,
      email: "",
      level: "",
      tickerList: [],
      lastProfileId: 0,
      setUpdatedAt: (updatedAt) => set({ updatedAt }),
      setEmail: (email) => set({ email }),
      setLevel: (level) => set({ level }),
      setTickerList: (tickerList) => set({ tickerList }),
      setLastProfileId: (lastProfileId) => set({ lastProfileId }),
      clear: () => set({ email: "", level: "", tickerList: [], lastProfileId: 0 }),
    }),
    {
      name: 'login-store',
      storage: createJSONStorage(() => sessionStorage), // or localStorage
      partialize: (state) => ({
        updatedAt: state.updatedAt,
        email: state.email,
        level: state.level,
        tickerList: state.tickerList,
        lastProfileNickname: state.lastProfileNickname,
      }),
    }
  )
);

export default useLoginStore;