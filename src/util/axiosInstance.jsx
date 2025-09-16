import axios from "axios";

// Axios 인스턴스 생성
const axiosInstance = axios.create({
baseURL: (import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "http://localhost:8090/api"),
  withCredentials: true,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // 토큰 가져오기
      const token = sessionStorage.getItem("accessToken");

      if (token) {
        // Authorization 헤더에 토큰 추가
        config.headers.Authorization = `Bearer ${token}`;
        console.log("토큰이 헤더에 추가되었습니다.");
      } else {
        console.log("토큰이 없습니다. 로그인이 필요할 수 있습니다.");
      }
    } catch (error) {
      console.error("토큰 처리 중 오류 발생:", error);
    }
    return config;
  },
  (error) => {
    // 요청 오류 처리
    console.error("요청 오류:", error);
    return Promise.reject(error);
  }
);
// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    // 새로운 액세스 토큰이 있으면 저장
    const newAccessToken = response.headers["authorization"]?.split(" ")[1];
    if (newAccessToken) {
      sessionStorage.setItem("accessToken", newAccessToken);
      console.log("새 토큰이 저장되었습니다.");
    }
    return response;
  },
  (error) => {
    console.log("=== 에러 상세 정보 ===");
    console.log("전체 에러 객체:", error);
    
    if (error.response) {
      const { status, data } = error.response;
      console.log("응답 상태:", status);
      console.log("응답 데이터:", data);
      
      if (status === 401 && data) {
        console.log("인증 실패 - 에러 코드:", data.errorCode);
        console.log("인증 실패 - 메시지:", data.message);
        
        // 토큰 관련 에러 처리
        switch (data.errorCode) {
          case "SESSION_EXPIRED":
            console.log("🔄 세션이 만료되었습니다.");
            sessionStorage.removeItem("accessToken");
            alert("세션이 만료되어 다시 로그인해주세요.");
            window.location.href = '/login';
            break;
            
          case "REFRESH_TOKEN_MISSING":
            console.log("🔑 리프레시 토큰이 없습니다.");
            sessionStorage.removeItem("accessToken");
            alert("로그인이 필요합니다.");
            window.location.href = '/login';
            break;
            
          case "TOKEN_ERROR":
            if (data.message === "UNACCEPT") {
              console.log("❌ 토큰이 없거나 형식이 잘못되었습니다.");
              sessionStorage.removeItem("accessToken");
              alert("인증 정보가 없습니다. 로그인해주세요.");
              window.location.href = '/login';
            } else if (data.message === "EXPIRED") {
              console.log("⏰ 토큰이 만료되었습니다.");
              // 이 경우는 서버에서 자동으로 리프레시를 시도할 것임
            } else {
              console.log("🚫 토큰 에러:", data.message);
              alert(`토큰 오류: ${data.message}`);
              window.location.href = '/login';
            }
            break;
            
          default:
            console.log("🔐 기타 인증 오류:", data.errorCode);
            alert(data.message || "인증 오류가 발생했습니다.");
            window.location.href = '/login';
        }
      }
      
      if (status === 403) {
        console.error("권한 없음:", data);
        const code = data?.errorCode || "ACCESS_DENIED";
        const msg = data?.message || "접근 권한이 없습니다.";
        alert(`[${code}] ${msg}`);
      }
    } else if (error.request) {
      console.error("네트워크 오류 - 응답 없음:", error.request);
      console.error("CORS 또는 프리플라이트 오류 가능성. Origin/baseURL/withCredentials를 확인하세요.");
      alert("요청이 서버에 의해 차단되었습니다. CORS 설정을 확인해주세요.");
    } else {
      console.error("요청 설정 오류:", error.message);
      alert("요청 처리 중 오류가 발생했습니다.");
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;