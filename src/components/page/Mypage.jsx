import React, { useState } from 'react';

export default function FintContent() {
  const [stats] = useState({
    winRate: 78,
    totalTrades: 143,
    holdings: 18,
    experience: 45
  });

  const services = [
    { icon: '🏆', title: '투자 대회', desc: '랭킹 경쟁' },
    { icon: '🎓', title: '투자 교육', desc: '학습 콘텐츠' },
    { icon: '👥', title: '커뮤니티', desc: '투자 토론' },
    { icon: '🤖', title: 'AI 분석', desc: '종목 추천' }
  ];

  const handleCardClick = (e) => {
    e.currentTarget.style.transform = 'scale(0.98)';
    setTimeout(() => {
      e.currentTarget.style.transform = '';
    }, 150);
  };

  return (
    <div className="bg-slate-950 text-white ">
      {/* User Section */}
      <div className="p-5 bg-slate-950">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-white font-medium">박지원</div>
          <div className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-xl text-xs font-semibold">
            초보투자자
          </div>
        </div>
        
        <div className="text-3xl font-bold text-white mb-2">$ 4,776.24</div>
        
        <div className="flex items-center gap-2 mb-5">
          <div className="text-green-400 text-sm font-semibold">+$233.76</div>
          <div className="bg-green-400 bg-opacity-20 text-green-400 px-2 py-1 rounded-lg text-xs font-semibold">
            +10.3%
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <div className="text-center">
            <div className="text-white text-opacity-70 text-xs mb-1">투자금</div>
            <div className="text-white text-base font-semibold">$ 2,266.24</div>
          </div>
          <div className="text-center">
            <div className="text-white text-opacity-70 text-xs mb-1">현금</div>
            <div className="text-white text-base font-semibold">$ 2,500.00</div>
          </div>
          <div className="text-center">
            <div className="text-white text-opacity-70 text-xs mb-1">전체 순위</div>
            <div className="text-white text-base font-semibold">7위</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-100 p-5 text-gray-800">
        {/* Stats Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-gray-800">투자 통계</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-2xl font-bold mb-1 text-green-500">{stats.winRate}%</div>
            <div className="text-xs text-gray-500">승률</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-2xl font-bold mb-1 text-gray-800">{stats.totalTrades}</div>
            <div className="text-xs text-gray-500">총 거래수</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-2xl font-bold mb-1 text-gray-800">{stats.holdings}</div>
            <div className="text-xs text-gray-500">보유 종목</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm">
            <div className="text-2xl font-bold mb-1 text-gray-800">{stats.experience}일</div>
            <div className="text-xs text-gray-500">투자 경력</div>
          </div>
        </div>

        {/* Services Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold text-gray-800">서비스</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-5 text-center cursor-pointer transition-all duration-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg"
              onClick={handleCardClick}
            >
              <div className="text-3xl mb-3">{service.icon}</div>
              <div className="text-sm font-semibold text-gray-800 mb-1">{service.title}</div>
              <div className="text-xs text-gray-500">{service.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}