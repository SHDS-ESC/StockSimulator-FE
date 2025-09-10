import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  CircleUserRound,
  BotMessageSquare,
  Star,
} from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTrendingUpClick = () => {
    navigate("/stocks");
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleBotMessageClick = () => {
    navigate("/chat");
  };

  const handleStarClick = () => {
    navigate("/favorites");
  };

  const handleUserClick = () => {
    navigate("/profile");
  };

  return (
    <div className="bg-slate-900 px-8 py-3 flex items-center justify-between border-t border-slate-700 flex-shrink-0">
      <button
        onClick={handleBotMessageClick}
        className={`w-6 h-6 transition-colors ${
          location.pathname === "/chat"
            ? "text-white"
            : "text-gray-500 hover:text-white"
        }`}
      >
        <BotMessageSquare className="w-6 h-6" />
      </button>
      <button
        onClick={handleStarClick}
        className={`w-6 h-6 transition-colors ${
          location.pathname === "/favorites"
            ? "text-white"
            : "text-gray-500 hover:text-white"
        }`}
      >
        <Star className="w-6 h-6" />
      </button>
      <button
        onClick={handleHomeClick}
        className={`w-6 h-6 transition-colors ${
          location.pathname === "/"
            ? "text-white"
            : "text-gray-500 hover:text-white"
        }`}
      >
        <Home className="w-6 h-6" />
      </button>
      <button
        onClick={handleTrendingUpClick}
        className={`w-6 h-6 transition-colors ${
          location.pathname === "/stocks"
            ? "text-white"
            : "text-gray-500 hover:text-white"
        }`}
      >
        <TrendingUp className="w-6 h-6" />
      </button>
      <button
        onClick={handleUserClick}
        className={`w-6 h-6 transition-colors ${
          location.pathname === "/profile"
            ? "text-white"
            : "text-gray-500 hover:text-white"
        }`}
      >
        <CircleUserRound className="w-6 h-6" />
      </button>
    </div>
  );
};

export default BottomNav;
