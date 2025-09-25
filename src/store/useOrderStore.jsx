import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "../util/axiosInstance";

// 주문 항목 프론트 표시용 구조
// {
//   id, profileId, symbol, name,
//   type: 'buy' | 'sell',
//   quantity, price, totalAmount,
//   executedAt, date, time
// }

export const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],
      isSyncing: false,
      lastError: null,

      addLocalOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }));
      },

      removeLocalOrderById: (id) => {
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
      },

      // 백엔드 DTO(OfferRequestDTO)로 주문 생성 요청
      // payload: { usersProfileId, stock, type('BUY'|'SELL'|'buy'|'sell'), quantity, price, offerDate?('yyyy-MM-dd'), name? }
      createOrder: async (payload) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const executedAt = new Date().toISOString();

        const quantity = Number(payload.quantity);
        const price = Number(payload.price);
        const totalAmount = quantity * price;

        const normalizedType = (payload.type || "BUY").toString().toUpperCase();
        const optimistic = {
          id,
          executedAt,
          totalAmount,
          profileId: payload.usersProfileId,
          symbol: payload.stock,
          name: payload.name || payload.stock,
          type: normalizedType === "SELL" ? "buy" : "sell", // 화면 표시 규칙: BUY→sell, SELL→buy
          quantity,
          price,
        };
        get().addLocalOrder(optimistic);

        const toYmd = (d) =>
          typeof d === "string" ? d : new Date().toISOString().slice(0, 10);

        const dto = {
          offerDate: toYmd(payload.offerDate),
          usersProfileId: payload.usersProfileId,
          stock: payload.stock,
          type: normalizedType === "SELL" ? "SELL" : "BUY",
          quantity,
          price,
        };

        try {
          set({ isSyncing: true, lastError: null });
          await axiosInstance.post("offer/update", dto, {
            withCredentials: true,
          });
          set({ isSyncing: false });
          return optimistic;
        } catch (error) {
          console.error("createOrder failed:", error);
          set({ lastError: error, isSyncing: false });
          get().removeLocalOrderById(id);
          throw error;
        }
      },

      // 백엔드 주문 내역 조회: GET /api/offer/history/{usersProfileId}
      fetchOrders: async (usersProfileId) => {
        try {
          set({ isSyncing: true, lastError: null });
          const res = await axiosInstance.get(
            `offer/history/${usersProfileId}`,
            {
              withCredentials: true,
            }
          );

          const orders = (res.data || []).map((offer) => ({
            id: offer.offerId,
            profileId: offer.usersProfileId,
            symbol: offer.stock, // offer.stock은 문자열 (ticker)
            name: offer.stock, // 종목명이 없으므로 ticker 사용
            // 화면 표기 규칙: BUY → buy (매수), SELL → sell (매도)
            type: offer.type === "BUY" ? "buy" : "sell",
            quantity: offer.quantity,
            price: offer.price, // 실제 price 값 사용
            totalAmount: offer.price * offer.quantity, // 계산된 총액
            executedAt: offer.offerDate,
            date:
              offer.offerDate?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            time:
              offer.offerDate?.split("T")[1]?.split(".")[0] ||
              new Date().toTimeString().split(" ")[0],
          }));

          set({ orders, isSyncing: false });
          return orders;
        } catch (error) {
          console.error("fetchOrders failed:", error);
          set({ lastError: error, isSyncing: false });
          return [];
        }
      },
    }),
    {
      name: "order-store",
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);

export default useOrderStore;
