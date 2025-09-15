import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronLeft,
  Info,
  Star,
  Calendar,
  DollarSign,
  Target,
} from "lucide-react";
import useTimeLineStore from "@/store/useTimeLineStore";
import axiosInstance from "@/util/axiosInstance";
import useLoginStore from "@/store/useLoginStore";
import useConfirmLogin from "../hooks/useConfirmLogin";

const Character = () => {
  useConfirmLogin(null);
  const navigate = useNavigate();
  const { email } = useLoginStore();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { timelines, setTimelines } = useTimeLineStore();
  const [selectedTimeline, setSelectedTimeline] = useState(
    timelines[0] || null
  );

  const [newProfile, setNewProfile] = useState({
    nickname: "",
    timelineId: selectedTimeline?.timelineId || 1,
    email: email,
  });

  useEffect(() => {
    if (sessionStorage.getItem("timeLineList") === null) {
      axiosInstance
        .get("userprofile/timelines")
        .then((response) => {
          // response.data는 배열이므로 전체를 한번에 설정
          setTimelines(response.data);
          console.log("timelines loaded:", response.data);
        })
        .catch((error) => {
          console.error("타임라인 로딩 실패:", error);
        });
    }
  }, [setTimelines]);

  const createUserProfile = async (profile) => {
    try {
      const response = await axiosInstance.post("/userprofile/create", profile);
      console.log("프로필 생성 성공:", response.data);
      return response.data;
    } catch (error) {
      console.error("프로필 생성 실패:", error);
      throw error;
    }
  };

  // 난이도별 색상과 텍스트 반환
  const getDifficultyInfo = (level) => {
    const difficultyMap = {
      1: {
        color: "text-white",
        bgColor: "bg-green-500",
        text: "쉬움",
        stars: 1,
      },
      2: {
        color: "text-white",
        bgColor: "bg-blue-500",
        text: "보통",
        stars: 2,
      },
      3: {
        color: "text-white",
        bgColor: "bg-yellow-500",
        text: "어려움",
        stars: 3,
      },
      4: {
        color: "text-white",
        bgColor: "bg-orange-500",
        text: "매우 어려움",
        stars: 4,
      },
      5: { color: "text-white", bgColor: "bg-red-500", text: "극한", stars: 5 },
    };
    return (
      difficultyMap[level] || {
        color: "text-gray-400",
        bgColor: "bg-gray-500",
        text: "알 수 없음",
        stars: 0,
      }
    );
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "알 수 없음";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 상세 정보 모달 열기
  const handleShowDetails = (timeline) => {
    setSelectedTimeline(timeline);
    setIsDetailModalOpen(true);
  };

  // 상세 정보 모달 닫기
  const handleCloseDetails = () => {
    console.log(selectedTimeline);
    setSelectedTimeline(null);
    setIsDetailModalOpen(false);
  };

  const handleCreateProfile = () => {
    if (newProfile.nickname.trim()) {
      // 새 프로필 데이터를 localStorage에 저장
      createUserProfile(newProfile);
      localStorage.setItem("newProfile", JSON.stringify(newProfile));
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
              {timelines && timelines.length > 0 ? (
                timelines.map((timeline, index) => (
                  <div
                    key={timeline.timelineId || `timeline-${index}`}
                    onClick={() =>
                      setNewProfile({
                        ...newProfile,
                        timelineId: timeline.timelineId,
                        timeline: timeline.name, // 미리보기용
                        email: email, // 필요한 경우만
                      })
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      newProfile.timeline === timeline.name
                        ? "bg-blue-600 bg-opacity-20 border-blue-500"
                        : "bg-slate-800 border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-lg">
                            {timeline.name}
                          </span>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyInfo(timeline.level).bgColor} ${getDifficultyInfo(timeline.level).color}`}
                          >
                            {getDifficultyInfo(timeline.level).text}
                          </div>
                        </div>
                        {timeline.description && (
                          <p
                            className="text-gray-400 text-sm mt-1 overflow-hidden"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {timeline.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowDetails(timeline);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {newProfile.timeline === timeline.name && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-slate-600 bg-slate-800 text-center">
                  <p className="text-gray-400">타임라인을 불러오는 중...</p>
                </div>
              )}
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

      {/* 타임라인 상세 정보 모달 */}
      {isDetailModalOpen && selectedTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-2/5 max-w-md max-h-[90vh] overflow-y-auto rounded-xl mx-4">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-slate-600">
              <h2 className="text-white text-xl font-bold">
                {selectedTimeline.name}
              </h2>
              <button
                onClick={handleCloseDetails}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-6">
              {/* 설명 */}
              {selectedTimeline.description && (
                <div>
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    설명
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedTimeline.description}
                  </p>
                </div>
              )}

              {/* 난이도 */}
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  난이도
                </h3>
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyInfo(selectedTimeline.level).bgColor} ${getDifficultyInfo(selectedTimeline.level).color}`}
                  >
                    {getDifficultyInfo(selectedTimeline.level).text}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < getDifficultyInfo(selectedTimeline.level).stars
                            ? "text-yellow-400 fill-current"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 기간 */}
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  기간
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">시작:</span>
                    <span className="text-white">
                      {formatDate(selectedTimeline.from)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">종료:</span>
                    <span className="text-white">
                      {formatDate(selectedTimeline.to)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 시드 머니 */}
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  시드 머니
                </h3>
                <p className="text-2xl font-bold text-green-400">
                  ${selectedTimeline.seedMoney?.toLocaleString() || "0"}
                </p>
              </div>

              {/* 타입 */}
              <div>
                <h3 className="text-white font-medium mb-2">타입</h3>
                <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded-full text-sm">
                  {selectedTimeline.type === 1
                    ? "역사적 사건"
                    : selectedTimeline.type === 2
                      ? "경제적 사건"
                      : selectedTimeline.type === 3
                        ? "기술적 사건"
                        : "기타"}
                </span>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="font-bold text-center bg-blue-500 text-white p-6 border-t border-slate-600">
              <button
                onClick={() => {
                  setNewProfile((prev) => ({
                    ...prev,
                    timelineId: selectedTimeline.timelineId,
                    timeline: selectedTimeline.name,
                  }));
                  handleCloseDetails();
                }}
              >
                이 타임라인 선택하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Character;
