import React, { useState, useEffect } from "react";
import { getNewsByDate } from "../api/NewsApi";
import useDateStore from "../store/useDateStore";

const News = () => {
  const [selectedFilter, setSelectedFilter] = useState("최신순");

  // 상태 관리
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { currentDate } = useDateStore();

  const handleNewsClick = (news) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePreviousGroup = () => {
    const pagesPerGroup = 5;
    const currentGroup = Math.ceil(page / pagesPerGroup);
    const newPage = Math.max(1, (currentGroup - 2) * pagesPerGroup + 1);
    setPage(newPage);
  };

  const handleNextGroup = () => {
    const pagesPerGroup = 5;
    const currentGroup = Math.ceil(page / pagesPerGroup);
    const newPage = Math.min(totalPages, currentGroup * pagesPerGroup + 1);
    setPage(newPage);
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // currentDate가 없으면 기본 뉴스 조회
        if (!currentDate) {
          console.warn(
            "[News] currentDate가 없습니다. 기본 뉴스를 조회합니다."
          );
          setNewsData([]);
          setTotalPages(1);
          setTotalItems(0);
          return;
        }

        console.log("[News] 날짜별 뉴스 조회 시작:", {
          currentDate,
          page,
          size,
        });

        // 날짜별 뉴스 조회
        const response = await getNewsByDate(currentDate, page, size);

        console.log("[News] 뉴스 응답 수신:", {
          totalPage: response?.totalPage,
          dtoListLength: response?.dtoList?.length,
          raw: response,
        });

        // 페이지 정보 저장
        setTotalPages(response.totalPage || 1);
        setTotalItems(response.dtoList?.length || 0);

        // 데이터 변환
        const transformedData = (response.dtoList || []).map((news) => ({
          id: news.newsId,
          symbol: news.stockId,
          headline: news.title,
          source: news.source,
          timestamp: news.timePublished,
          image: news.image || "기본이미지",
          summary: news.summary,
          url: news.url,
        }));

        console.log("[News] 데이터 변환 완료:", {
          transformedLength: transformedData.length,
          sample: transformedData[0],
        });

        setNewsData(transformedData);
      } catch (err) {
        console.error("[News] 뉴스 조회 실패:", err);
        setError("뉴스 데이터를 불러오는데 실패했습니다.");
        setNewsData([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentDate, page, size]);

  return (
    <div>
      {/* 전체 콘텐츠 영역 */}
      <div>
        {/* 페이지 제목 */}
        <div className="px-4 py-2">
          <h1 className="text-white text-2xl font-bold">뉴스</h1>
        </div>

        {/* 정렬 옵션 */}
        <div className="px-4 py-2">
          <div className="flex gap-2">
            {["최신순"].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedFilter(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === option
                    ? "bg-white text-black border border-gray-300"
                    : "bg-slate-800 text-gray-400 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* 뉴스 목록 */}
        <div className="px-4 py-2">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-white">로딩 중...</div>
            </div>
          )}

          {error && (
            <div className="flex justify-center items-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {newsData.map((news) => (
                <div
                  key={news.id}
                  className="bg-slate-800 rounded-xl p-4 cursor-pointer hover:bg-slate-700 transition-colors"
                  onClick={() => handleNewsClick(news)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-semibold text-white`}>
                          {news.symbol}
                        </span>
                      </div>
                      <h3 className="text-slate-100 font-medium text-sm leading-relaxed mb-2">
                        {news.headline}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <span>{news.source}</span>
                        <span>•</span>
                        <span>
                          {news.timestamp
                            ? new Date(news.timestamp)
                                .toISOString()
                                .split("T")[0]
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      {news.image && news.image !== "기본이미지" ? (
                        <img
                          src={news.image}
                          alt={news.headline}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                        style={{
                          display:
                            news.image && news.image !== "기본이미지"
                              ? "none"
                              : "flex",
                        }}
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {!loading && !error && totalPages > 1 && (
          <div className="px-4 py-6 flex justify-center items-center gap-2">
            <button
              onClick={handlePreviousGroup}
              disabled={page <= 5}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-slate-800 text-gray-400 hover:text-white disabled:opacity-50"
            >
              이전
            </button>

            {(() => {
              const pages = [];
              const pagesPerGroup = 5;
              const currentGroup = Math.ceil(page / pagesPerGroup);
              const startPage = (currentGroup - 1) * pagesPerGroup + 1;
              const endPage = Math.min(
                currentGroup * pagesPerGroup,
                totalPages
              );

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-2 rounded ${
                      page === i
                        ? "bg-white text-black"
                        : "bg-slate-700 text-white"
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              return pages;
            })()}

            <button
              onClick={handleNextGroup}
              disabled={page > totalPages - 5}
              className="px-3 py-2 bg-slate-700 text-white rounded disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 모달 팝업 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">
                {selectedNews?.headline}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <span className="text-sm text-gray-600">
                {selectedNews?.source}
              </span>
              <span className="text-sm text-gray-600 ml-2">•</span>
              <span className="text-sm text-gray-600 ml-2">
                {selectedNews?.timestamp
                  ? new Date(selectedNews.timestamp).toISOString().split("T")[0]
                  : ""}
              </span>
            </div>

            <div className="mb-4">
              <span className="text-sm font-semibold text-blue-600">
                {selectedNews?.title}
              </span>
            </div>

            <div className="mb-4">
              {selectedNews?.image && selectedNews?.image !== "기본이미지" ? (
                <img
                  src={selectedNews?.image}
                  alt={selectedNews?.headline}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                style={{
                  display:
                    selectedNews?.image && selectedNews?.image !== "기본이미지"
                      ? "none"
                      : "flex",
                }}
              >
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">
                {selectedNews?.summary || "요약 내용이 없습니다."}
              </p>
            </div>

            <div className="flex justify-end">
              <a
                href={selectedNews?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                원문 보기
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
