import { create } from 'zustand';

const useRegisterStore = create((set) => ({
  email: "",
  password: "",
  confirmPassword: "",
  level: "",
  tickerList: [],
  error: "",
  
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setLevel: (level) => set({ level }),
  setTickerList: (tickerList) => set({ tickerList }),
  setError: (error) => set({ error }),
}));

export default useRegisterStore;