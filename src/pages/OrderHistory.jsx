import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useOrderStore } from "../store/useOrderStore";
import useLoginStore from "../store/useLoginStore";

const OrderHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { lastProfileId } = useLoginStore();
  const { orders, fetchOrders, isSyncing } = useOrderStore();

  // 컴포넌트 마운트 시 주문 내역 로드
  useEffect(() => {
    if (lastProfileId) {
      fetchOrders(lastProfileId);
    }
  }, [lastProfileId, fetchOrders]);

  // 더미 데이터 (백엔드 데이터가 없을 때 사용)
  const dummyOrderHistory = [
    {
      id: 1,
      symbol: "AAPL",
      name: "Apple Inc.",
      type: "buy",
      quantity: 10,
      price: 175.3,
      totalAmount: 1753.0,
      date: "2024-01-15",
      time: "14:30:25",
      logo: "https://financialmodelingprep.com/stock/AAPL.png",
    },
    {
      id: 2,
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      type: "sell",
      quantity: 5,
      price: 2950.0,
      totalAmount: 14750.0,
      date: "2024-01-14",
      time: "09:15:42",
      logo: "https://financialmodelingprep.com/stock/GOOGL.png",
    },
    {
      id: 3,
      symbol: "TSLA",
      name: "Tesla Inc.",
      type: "buy",
      quantity: 8,
      price: 195.5,
      totalAmount: 1564.0,
      date: "2024-01-13",
      time: "16:45:18",
      logo: "https://financialmodelingprep.com/stock/TSLA.png",
    },
    {
      id: 4,
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      type: "buy",
      quantity: 15,
      price: 485.2,
      totalAmount: 7278.0,
      date: "2024-01-12",
      time: "11:20:33",
      logo: "https://financialmodelingprep.com/stock/NVDA.png",
    },
    {
      id: 5,
      symbol: "MSFT",
      name: "Microsoft Corporation",
      type: "sell",
      quantity: 12,
      price: 420.75,
      totalAmount: 5049.0,
      date: "2024-01-11",
      time: "13:55:07",
      logo: "https://financialmodelingprep.com/stock/MSFT.png",
    },
    {
      id: 6,
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      type: "buy",
      quantity: 7,
      price: 158.9,
      totalAmount: 1112.3,
      date: "2024-01-10",
      time: "10:30:15",
      logo: "https://financialmodelingprep.com/stock/AMZN.png",
    },
  ];

  // 실제 데이터 또는 더미 데이터 사용
  const orderHistory = orders.length > 0 ? orders : dummyOrderHistory;

  const filteredOrders = orderHistory.filter((order) => {
    const matchesSearch =
      (order.stock || order.symbol || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    // 백엔드 데이터: type이 "BUY"/"SELL", 프론트 표시: "buy"/"sell"
    const orderType = order.type; // 이미 useOrderStore에서 올바르게 변환됨
    const matchesType = filterType === "all" || orderType === filterType;

    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 헤더 */}
      <div className="bg-slate-900 sticky top-0 z-50 border-b border-slate-700">
        <div className="px-4 py-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-lg font-bold text-white">주문 내역</h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 검색 및 필터 */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="space-y-3">
            {/* 검색바 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="종목명 또는 심볼 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 필터 */}
            <div className="flex space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">전체 거래</option>
                <option value="buy">매수</option>
                <option value="sell">매도</option>
              </select>
            </div>
          </div>
        </div>
        {/* 통계 요약 */}
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">거래 요약</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">총 거래</p>
              <p className="text-white text-lg font-bold">
                {filteredOrders.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">매수</p>
              <p className="text-red-500 text-lg font-bold">
                {filteredOrders.filter((order) => order.type === "buy").length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs mb-1">매도</p>
              <p className="text-blue-500 text-lg font-bold">
                {filteredOrders.filter((order) => order.type === "sell").length}
              </p>
            </div>
          </div>
        </div>

        {/* 주문 내역 리스트 */}
        <div className="space-y-3">
          {isSyncing ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">주문 내역을 불러오는 중...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">주문 내역이 없습니다</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              // 백엔드 데이터 필드 매핑 (이미 useOrderStore에서 올바르게 변환됨)
              const orderType = order.type;
              const stockSymbol = order.symbol || "";
              const stockName = order.name || stockSymbol;
              const orderId = order.id;
              const orderDate = order.date;
              const orderTime = order.time || "00:00:00";
              const totalAmount = order.totalAmount || 0;
              const logoUrl = stockSymbol
                ? `https://financialmodelingprep.com/image-stock/${stockSymbol}.png`
                : null;

              return (
                <div
                  key={orderId}
                  className="bg-slate-800 rounded-xl p-4 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-[5px] flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          <>
                            <img
                              src={logoUrl}
                              alt={stockName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const sibling =
                                  e.currentTarget.nextElementSibling;
                                if (sibling) sibling.classList.remove("hidden");
                              }}
                            />
                            <span className="hidden text-gray-600 font-bold text-[10px] px-1">
                              {stockSymbol}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-600 font-bold text-[10px] px-1">
                            {stockSymbol}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">
                          {stockName}
                        </h3>
                        <p className="text-gray-400 text-xs">{stockSymbol}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {orderType === "buy" ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-blue-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          orderType === "buy" ? "text-red-500" : "text-blue-500"
                        }`}
                      >
                        {orderType === "buy" ? "매수" : "매도"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">수량</p>
                      <p className="text-white text-sm font-medium">
                        {order.quantity}주
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">주가</p>
                      <p className="text-white text-sm font-medium">
                        ${order.price ? order.price.toFixed(2) : "0.00"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-400 text-xs mb-1">총 금액</p>
                    <p className="text-white text-lg font-semibold">
                      ${totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-xs">
                        {formatDate(orderDate)} {orderTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-xs">
                        주문 #{orderId}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
