import React, { useState } from 'react';
import useRegisterStore from "@/store/useRegisterStore";
import useLoginStore from '@/store/useLoginStore';
import { Badge } from '@/components/ui/badge';

export default function FintContent() {
  const [stats] = useState({
    winRate: 78,
    totalTrades: 143,
    holdings: 18,
    experience: 45
  });
  const {
    email,
    level,
    updatedAt,
    tickerList
  } = useLoginStore();

  const services = [
    { icon: '💼', title: '투자 포트폴리오', desc: '보유 자산 현황' },
    { icon: '🏆', title: '대회 기록', desc: '참가 이력' },
    { icon: '📊', title: '모의 투자', desc: '연습 기록' },
    { icon: '👥', title: '커뮤니티', desc: '투자 토론' }
  ];

  const handleCardClick = (e) => {
    e.currentTarget.style.transform = 'scale(0.98)';
    setTimeout(() => {
      e.currentTarget.style.transform = '';
      // 실제로는 여기서 페이지 이동 로직 실행
      // 예: navigate('/portfolio'), navigate('/contest') 등
    }, 150);
  };

  // 로그인 시 저장된 zustand 상태를 그대로 사용 (API 호출 없음)

  const setLevelBadge = (level) => {
    switch(level) {
      case 1: return <Badge variant="beginner">초보투자자</Badge>;
      case 2: return <Badge variant="intermediate">중급투자자</Badge>;
      case 3: return <Badge variant="expert">투자의 고수</Badge>;
      default: return <Badge>투자자</Badge>;
    }
  };

const formatLastLogin = (updatedAt) => {
  const date = new Date(updatedAt);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (isToday) {
    return `최근 접속: 오늘 ${hours}:${minutes}`;
  } else {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `최근 접속: ${y}-${m}-${d} ${hours}:${minutes}`;
  }
};


  return (
    <div className="bg-slate-950 text-white mt-10">
      {/* User Section */}
      <div className="px-5 bg-slate-950">
        <div className="text-xs text-gray-400 mb-3">{formatLastLogin(updatedAt)}</div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl text-white font-semibold">{email}</div>
            {setLevelBadge(level)}
        </div>
        
        <div className="bg-slate-800 rounded-xl p-5 mb-2">
          <div className="flex justify-between">
            <div className="text-center flex-1">
              <div className="text-white text-opacity-70 text-sm mb-2">전체 순위</div>
              <div className="text-white text-xl font-bold">7위</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-white text-opacity-70 text-sm mb-2">승률</div>
              <div className="text-green-400 text-xl font-bold">{stats.winRate}%</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-white text-opacity-70 text-sm mb-2">거래수</div>
              <div className="text-white text-xl font-bold">{stats.totalTrades}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-5 pb-5 bg-slate-950">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-white">투자 통계</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-800 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold mb-1 text-green-400">{stats.winRate}%</div>
            <div className="text-xs text-gray-400">승률</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold mb-1 text-white">{stats.totalTrades}</div>
            <div className="text-xs text-gray-400">총 거래수</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold mb-1 text-white">{stats.holdings}</div>
            <div className="text-xs text-gray-400">보유 종목</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-5 text-center">
            <div className="text-2xl font-bold mb-1 text-white">{stats.experience}일</div>
            <div className="text-xs text-gray-400">투자 경력</div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="p-5 bg-slate-950">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-white">서비스</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-slate-800 rounded-xl p-5 text-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700"
              onClick={handleCardClick}
            >
              <div className="text-3xl mb-3">{service.icon}</div>
              <div className="text-sm font-semibold text-white mb-1">{service.title}</div>
              <div className="text-xs text-gray-400">{service.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}