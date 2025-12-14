import axiosInstance from "../util/axiosInstance";

//뉴스 목록 가져오는 함수
export const getNews = async (page = 1, size = 10) => {
  try {
    const response = await axiosInstance.get(`/news?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error("뉴스 목록 조회 실패:", error);
    throw error;
  }
};

export const getNewsByDate = async (processDate, page = 1, size = 10) => {
  try {
    const response = await axiosInstance.get(
      `/news/date?processDate=${processDate}&page=${page}&size=${size}`
    );
    return response.data;
  } catch (error) {
    console.error("날짜별 뉴스 조회 실패:", error);
    throw error;
  }
};
