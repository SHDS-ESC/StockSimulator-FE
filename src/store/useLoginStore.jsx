import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useLoginStore = create(
  persist(
    (set) => ({
      updatedAt: null,
      email: "",
      level: "",
      tickerList: [],
      setUpdatedAt: (updatedAt) => set({ updatedAt }),
      setEmail: (email) => set({ email }),
      setLevel: (level) => set({ level }),
      setTickerList: (tickerList) => set({ tickerList }),
      clear: () => set({ email: "", level: "", tickerList: [] }),
    }),
    {
      name: 'login-store',
      storage: createJSONStorage(() => sessionStorage), // or localStorage
      partialize: (state) => ({
        updatedAt: state.updatedAt,
        email: state.email,
        level: state.level,
        tickerList: state.tickerList,
      }),
    }
  )
);

export default useLoginStore;