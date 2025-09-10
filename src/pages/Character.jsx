import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft } from "lucide-react";
const Character = () => {
  const navigate = useNavigate();
  const [newProfile, setNewProfile] = useState({
    nickname: "",
    timeline: "실시간",
  });

  const timelineOptions = [
    { value: "실시간", label: "실시간" },
    { value: "트럼프대통령 당선시기", label: "트럼프대통령 당선시기" },
    { value: "러시아전쟁", label: "러시아전쟁" },
    { value: "코로나", label: "코로나" },
  ];

  const handleCreateProfile = () => {
    if (newProfile.nickname.trim()) {
      // 새 프로필 데이터를 localStorage에 저장
      const newProfileData = {
        nickname: newProfile.nickname,
        timeline: newProfile.timeline,
        timestamp: Date.now(),
      };

      localStorage.setItem("newProfile", JSON.stringify(newProfileData));

      // 성공 후 홈페이지로 이동
      alert("프로필이 생성되었습니다!");
      navigate("/");
    }
  };

  const handleGoBack = () => {
    // 홈페이지로 돌아가기
    navigate("/");
  };

  return (
    <div className="bg-slate-950 w-full max-w-md mx-auto h-screen overflow-y-auto custom-scrollbar relative">
      {/* 전체 콘텐츠 영역 - 헤더/푸터 높이만큼 패딩 */}
      <div
        className="overflow-y-auto"
        style={{
          paddingTop: "64px", // 헤더 높이만큼
          paddingBottom: "72px", // 푸터 높이만큼 (예: 72px)
          minHeight: "calc(100vh - 64px - 72px)",
        }}
      >
        {/* 뒤로가기 버튼 */}
        <div className="px-4 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>뒤로가기</span>
          </button>
        </div>

        {/* 페이지 제목 */}
        <div className="px-4 py-2">
          <h1 className="text-white text-2xl font-bold">새 프로필 생성</h1>
          <p className="text-gray-400 text-sm mt-1">
            새로운 투자 프로필을 만들어보세요
          </p>
        </div>

        {/* 프로필 생성 폼 */}
        <div className="px-4 py-4 space-y-6">
          {/* 닉네임 입력 */}
          <div>
            <label className="block text-white text-lg font-medium mb-3">
              닉네임
            </label>
            <input
              type="text"
              value={newProfile.nickname}
              onChange={(e) =>
                setNewProfile({ ...newProfile, nickname: e.target.value })
              }
              placeholder="프로필 닉네임을 입력하세요"
              className="w-full p-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>

          {/* 타임라인 선택 */}
          <div>
            <label className="block text-white text-lg font-medium mb-3">
              타임라인 선택
            </label>
            <p className="text-gray-400 text-sm mb-4">
              어떤 시점의 주식 시장을 시뮬레이션할까요?
            </p>
            <div className="space-y-3">
              {timelineOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() =>
                    setNewProfile({ ...newProfile, timeline: option.value })
                  }
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    newProfile.timeline === option.value
                      ? "bg-blue-600 bg-opacity-20 border-blue-500"
                      : "bg-slate-800 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-lg">
                      {option.label}
                    </span>
                    {newProfile.timeline === option.value && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 프로필 미리보기 */}
          {newProfile.nickname && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-600">
              <h3 className="text-white text-lg font-medium mb-3">
                프로필 미리보기
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">닉네임:</span>
                  <span className="text-white font-medium">
                    {newProfile.nickname}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">타임라인:</span>
                  <span className="text-white font-medium">
                    {newProfile.timeline}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 생성 버튼 */}
        <div className="px-4 py-6">
          <button
            onClick={handleCreateProfile}
            disabled={!newProfile.nickname.trim()}
            className="w-full p-4 bg-blue-600 text-white rounded-xl font-medium text-lg active:scale-[0.98] transition-all touch-manipulation disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            프로필 생성하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Character;
