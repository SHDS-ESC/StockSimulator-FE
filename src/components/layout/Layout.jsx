import React, { useEffect, useState, useRef, useMemo } from "react";
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
  CalendarDays,
} from "lucide-react";
import useDateStore from "@/store/useDateStore";
import { Button } from "../ui/button";
import axiosInstance from "@/util/axiosInstance";
import useLoginStore from "@/store/useLoginStore";
import useChartStore from "@/store/useChartStore";
import { format, subDays } from "date-fns";
// Header 컴포넌트
export const Header = ({ onClick, onTurnOverData }) => {
  const { setPortfolioList } = useChartStore();
  const {
    currentDate,
    goNextTurn,
    setCurrentDate,
    showSkipNotice,
    clearSkipNotice,
    setIsEnding,
    isEnding,
  } = useDateStore();

  const { lastProfileId } = useLoginStore();
  console.log("현재 날짜" + currentDate);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState();
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [turnProgress, setTurnProgress] = useState(0);
  const progressTimerRef = useRef(null);
  // 투자 종료 여부(프로필 종료일 기준) - 모달 닫혀도 비활성 유지
  const isInvestmentEnded = useMemo(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("newProfile") || "{}");
      const toRaw = profile?.timelineTo;
      if (!toRaw) return false;
      const toStr = format(new Date(toRaw), "yyyy-MM-dd");
      const curStr = String(currentDate || "");
      return curStr > toStr;
    } catch (_) {
      return false;
    }
  }, [currentDate]);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRedisTestClick = () => {
    navigate("/redis-test");
    setIsMenuOpen(false);
  };

  const validateRealTimeDate = (date) => {
    const realTimeDate = format(date, "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");
    return realTimeDate === today;
  };

  // 휴장일 스냅은 컴포넌트 레벨에서 수행 (버튼 핸들러 내 Hook 호출 제거)
  useEffect(() => {
    let active = true;
    const snap = async () => {
      if (!lastProfileId) return;
      try {
        const r = await axiosInstance.get(`/db/next-trading-day`, {
          params: { date: currentDate, max: 30 },
        });
        const eff = String(r?.data?.effectiveDate || "") || null;
        const result = eff
          ? {
              effectiveDate: eff,
              skipped: Number(r?.data?.skippedDays || 0),
              reachedLimit: false,
            }
          : { effectiveDate: currentDate, skipped: 0, reachedLimit: false };
        if (!active) return;
        if (
          !result.reachedLimit &&
          result.effectiveDate &&
          result.effectiveDate !== currentDate
        ) {
          setCurrentDate(result.effectiveDate);
        }
      } catch (_) {
        // ignore
      }
    };
    snap();
    return () => {
      active = false;
    };
  }, [lastProfileId]);

  const handleNextButtonClick = async () => {
    if (isInvestmentEnded) {
      return;
    }
    // 진행바 시작
    setIsProcessingTurn(true);
    setTurnProgress(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setTurnProgress((p) => (p < 90 ? p + 7 : 90));
    }, 150);

    const currentDateObj = new Date(currentDate);
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    const nextKey = currentDateObj.toISOString().split("T")[0];
    let effectiveKey = nextKey;
    try {
      // 백엔드에서 다음 유효 거래일 메타 제공: /api/db/next-trading-day
      const r = await axiosInstance.get(`/db/next-trading-day`, {
        params: { date: nextKey, max: 30 },
      });
      const eff = String(r?.data?.effectiveDate || "") || null;
      const result = eff
        ? {
            effectiveDate: eff,
            skipped: Number(r?.data?.skippedDays || 0),
            reachedLimit: false,
          }
        : { effectiveDate: nextKey, skipped: 0, reachedLimit: false };
      if (!result.reachedLimit && result.effectiveDate) {
        effectiveKey = result.effectiveDate;
        if (effectiveKey !== nextKey) {
          showSkipNotice({
            from: nextKey,
            to: effectiveKey,
            skipped: result.skipped,
          });
          setTimeout(() => clearSkipNotice(), 2500);
        }
      }
    } catch (_) {
      // ignore, fall back to nextKey
    }

    // 서버에 유효 거래일로 업데이트
    const effectiveDateObj = new Date(effectiveKey);
    const response = await axiosInstance.post(
      "/userprofile/update/process-date",
      {
        userProfileId: lastProfileId,
        prevProcessDate: format(subDays(effectiveDateObj, 1), "yyyy-MM-dd"),
        processDate: format(effectiveDateObj, "yyyy-MM-dd"),
      },
      { withCredentials: true }
    );

    console.log("턴 종료 응답:", response.data);

    // changeList 사용 (차트용)
    const responseData = response.data.changeList.map((holdings) => ({
      value: holdings.currentPrice, // currentPrice 사용
      name: holdings.ticker,
      itemStyle: { color: getRandomColor() },
    }));

    setList(response.data.changeList);
    if (onTurnOverData) {
      onTurnOverData(response.data.changeList);
    }

    console.log("차트 데이터:", responseData);
    setPortfolioList(responseData);
    goNextTurn(effectiveDateObj);

    // 엔딩 조건: 프로필의 timelineTo(종료일) 도달 또는 초과 시 엔딩 팝업 표시
    try {
      const profile = JSON.parse(localStorage.getItem("newProfile") || "{}");
      const timelineToRaw = profile?.timelineTo;
      const toStr = timelineToRaw
        ? format(new Date(timelineToRaw), "yyyy-MM-dd")
        : "";
      const effStr = format(effectiveDateObj, "yyyy-MM-dd");
      // 엔딩은 종료일을 지나친 시점(>)에만 표시: 종료일 당일은 플레이 가능
      if (toStr && effStr > toStr) {
        // TurnOver 팝업 대신 엔딩 팝업
        useDateStore.setState({ isTurnOver: false });
        setIsEnding();
      }
    } catch (_) {
      // ignore parse errors
    }

    function getRandomColor() {
      return (
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")
      );
    }
    // (이전 위치의 잘못된 Hook 호출 제거)
    // 진행바 종료
    try {
      setTurnProgress(100);
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setTimeout(() => setIsProcessingTurn(false), 300);
    }
  };
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);
  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
      <div className="bg-slate-900 px-4 py-3 grid grid-cols-3 items-center relative">
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
          <button
            onClick={onClick}
            className="text-white w-6 h-6 flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <CalendarDays className="" />
          </button>
        </div>

        {/* 가운데 - 자동으로 완전 중앙 */}
        <div
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
        </div>

        {/* 오른쪽 */}
        <div className="flex justify-end">
          {location.pathname === "/" ||
          location.pathname === "/register" ||
          lastProfileId === null ? null : isEnding ? (
            <Button className="m-0 bg-slate-700 text-gray-300 hover:bg-slate-700 cursor-not-allowed" variant="block" disabled>
              투자 종료됨
            </Button>
          ) : validateRealTimeDate(currentDate) ? (
            <Button className="m-0" variant="block" disabled>
              실시간
            </Button>
          ) : (
            <Button
              onClick={handleNextButtonClick}
              className={`m-0 ${isInvestmentEnded ? "bg-slate-700 text-gray-300 hover:bg-slate-700 cursor-not-allowed" : ""}`}
              variant={isInvestmentEnded ? "block" : "confirm"}
              disabled={isProcessingTurn || isInvestmentEnded}
            >
              {isInvestmentEnded ? "투자 종료됨" : (isProcessingTurn ? "처리중..." : "턴 종료")}
            </Button>
          )}
        </div>
      </div>
      {isProcessingTurn && (
        <div className="px-4">
          <div className="h-1 bg-slate-700/40 rounded overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${turnProgress}%` }}
            />
          </div>
        </div>
      )}

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

/// BackButton 컴포넌트
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
