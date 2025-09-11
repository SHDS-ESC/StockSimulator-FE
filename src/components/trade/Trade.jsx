import React from "react";
import { cn } from "@/lib/utils";

// TradeCard 컴포넌트
export const TradeCard = ({ children, className = "", ...props }) => {
  return (
    <div
      className={cn(
        "bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// TradeButton 컴포넌트
export const TradeButton = ({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}) => {
  const variants = {
    default: "bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700",
    brand: "bg-blue-600 border-transparent text-white hover:bg-blue-700",
    destructive: "bg-red-600 border-transparent text-white hover:bg-red-700",
  };

  return (
    <button
      className={cn(
        "px-3 py-2 rounded-lg cursor-pointer transition-colors",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// TradeInput 컴포넌트
export const TradeInput = ({ className = "", ...props }) => {
  return (
    <input
      className={cn(
        "bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-2 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        className
      )}
      {...props}
    />
  );
};
