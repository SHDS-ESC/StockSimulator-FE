import React from "react";
import { Heart } from "lucide-react";

// StockListItem 컴포넌트
export const StockListItem = ({ stock, isFavorite, onToggleFavorite }) => {
  const isPositive = stock.change.includes("+");

  return (
    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors duration-200 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition-transform duration-200">
          {stock.logo}
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">{stock.name}</h4>
          <p className="text-gray-400 text-xs">{stock.symbol}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-white font-bold text-sm">{stock.price}</p>
          <div className="flex items-center gap-1">
            <p
              className={`font-medium text-xs ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {stock.change}
            </p>
            <p className="text-gray-400 text-xs">{stock.changeAmount}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "text-red-500 fill-current" : "text-gray-400"
            }`}
          />
        </button>
      </div>
    </div>
  );
};
