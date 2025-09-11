import axios from "axios";

// 로그인 시 토큰 발급
const callToken = async (email, password) => {
  try {
    console.log("토큰이 없으므로 새로 발급 요청...");
    const baseURL = 
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8091";
    const response = await axios.post(
      baseURL + "/auth",
      {
        email,
        password,
      },
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );

    if (response.status === 200) {
      const newToken = response.data.accessToken;
      sessionStorage.setItem("accessToken", newToken);
      
      // 리프레시 토큰을 쿠키에서 가져와서 별도 저장 (httpOnly 쿠키는 JS에서 접근 불가)
      // 백엔드에서 httpOnly 쿠키로 설정하므로, 여기서는 로그인 성공만 확인
      console.log("새 토큰 발급 완료:", newToken);
      console.log("리프레시 토큰은 httpOnly 쿠키로 설정됨");
      return newToken;
    } else {
      console.error("인증 실패");
      return null;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
    console.log("401 실패 (인증 실패)");
  } else {
    console.error("토큰 요청 중 오류 발생:", error);
  }
    return null;
  }
};

export default callToken;
