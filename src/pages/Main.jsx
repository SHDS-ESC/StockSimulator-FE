import { useNavigate } from "react-router-dom";
import axiosInstance from "../util/axiosInstance";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect } from "react";
import useLoginStore from "@/store/useLoginStore";

const Main = () => {
  const navigate = useNavigate();

  const { setEmail, setLevel, setTickerList, clear, setUpdatedAt } = useLoginStore();

  // 예시: 특정 조건에서만 리다이렉트
  // useEffect(() => {
  //   const isLoggedIn = false; // 실제로는 상태나 토큰 체크
  //   if (!isLoggedIn) {
  //     navigate("/login");
  //   }
  // }, [navigate]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleGoRegister = () => {
    navigate("/register");
  };

  const handleGoMypage = () => {
    navigate("/mypage");
  };
  const handleLogout = async () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      clear();
      navigate("/login");
      return;
    }

    // 먼저 서버 로그아웃 요청을 완료하고
    try {
      await axios.post("http://localhost:8090/api/user/logout", null, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.log("logout error", e); // 에러는 로그로 남기고 무시
    } finally {
      // 그 다음 클라이언트 상태/토큰 제거 후 로그인으로 이동
      clear();
      sessionStorage.removeItem("accessToken");
      navigate("/login");
    }
  };

  const apiTest = async () => {
    const response = await axiosInstance.get("/test/me");
    console.log(response.headers);
  };
  
  useEffect(() => {
    // 토큰이 없으면 사용자 정보 조회를 건너뜀 (토큰이 재저장되는 문제 방지)
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;

    axiosInstance.get("/user/me").then((response) => {
      console.log(response.data);
      setEmail(response.data.email ?? response.data.username);
      setLevel(response.data.level);
      setTickerList(response.data.tickerList);
      setUpdatedAt(new Date().toISOString());
    });
  }, [setEmail, setLevel, setTickerList, setUpdatedAt]);

  return (
    <div className="text-white">
      <h2>메인 페이지</h2>
      <p>주식 시뮬레이터에 오신 것을 환영합니다!</p>
      <div className="mt-4">
        <Button variant="confirm" onClick={handleGoToLogin}>
          로그인 페이지로 이동
        </Button>
      </div>
      <div className="mt-4">
        <Button variant="confirm" onClick={apiTest}>
          API 테스트
        </Button>
      </div>
      <div className="mt-4">
        <Button variant="confirm" onClick={handleGoRegister}>
          회원가입 이동
        </Button>
      </div>
      <div className="mt-4">
        <Button variant="confirm" onClick={handleGoMypage}>
          마이페이지 이동
        </Button>
      </div>
      <div className="mt-4">
        <Button variant="destructive" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </div>
  );
};

export default Main;
