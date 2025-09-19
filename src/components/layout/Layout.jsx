import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  TrendingUp,
  CircleUserRound,
  BotMessageSquare,
  Star,
  Newspaper,
  User,
  ChevronLeft,
  Menu,
  X,
  Settings,
} from "lucide-react";
import useDateStore from "@/store/useDateStore";
import { Button } from "../ui/button";
import axiosInstance from "@/util/axiosInstance";
import useLoginStore from "@/store/useLoginStore";
// Header 컴포넌트
export const Header = () => {
  const { currentDate, goNextTurn } = useDateStore();
  const { lastProfileId } = useLoginStore();
  console.log("현재 날짜" + currentDate);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRedisTestClick = () => {
    navigate("/redis-test");
    setIsMenuOpen(false);
  };

  const handleNextButtonClick = async () => {
    const currentDateObj = new Date(currentDate);
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    const updateDate = goNextTurn(currentDateObj);
    try {
      await axiosInstance.post(
        "/userprofile/update/process-date",
        {
          userProfileId: lastProfileId,
          processDate: updateDate,
        },
        { withCredentials: true }
      );
    } catch (e) {
      console.log(e);
      /* ignore */
    } finally {
      console.log("업데이트 날짜" + updateDate);
    }
  };

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
      <div className="bg-slate-900 px-4 py-3 grid grid-cols-3 items-center">
        {/* 왼쪽 */}
        <div className="flex justify-start">
          <button
            onClick={toggleMenu}
            className="w-6 h-6 flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* 가운데 - 자동으로 완전 중앙 */}
        <h1
          className="text-white text-lg text-center"
          style={{
            fontFamily: '"IBM Plex Sans KR", sans-serif',
            fontWeight: "normal",
          }}
        >
          {location.pathname === "/" ||
          location.pathname === "/register" ||
          lastProfileId === null ? (
            <h1>FINT</h1>
          ) : (
            <h1>{currentDate}</h1>
          )}
        </h1>

        {/* 오른쪽 */}
        <div className="flex justify-end">
          {location.pathname === "/" || location.pathname === "/register" || lastProfileId === null ? (
            <h1>FINT</h1>
          ) : (
            <Button
              onClick={handleNextButtonClick}
              className="m-0"
              variant="confirm"
            >
              턴 종료
            </Button>
          )}
        </div>
      </div>

      {/* 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-800 border-t border-slate-700 shadow-lg">
          <div className="px-4 py-2">
            <button
              onClick={handleRedisTestClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-white hover:bg-slate-700 rounded-md transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Redis 관리</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Footer (BottomNav) 컴포넌트
export const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTrendingUpClick = () => {
    navigate("/stocks");
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  const handleBotMessageClick = () => {
    navigate("/chat");
  };

  const handleStarClick = () => {
    navigate("/news");
  };

  const handleUserClick = () => {
    navigate("/mypage");
  };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
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
          <Newspaper className="w-6 h-6" />
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
    </div>
  );
};

// BackButton 컴포넌트
export const BackButton = ({ onClick, className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-white hover:text-gray-300 transition-colors ${className}`}
    >
      <ChevronLeft className="w-5 h-5" />
      <span>뒤로가기</span>
    </button>
  );
};
