import { useNavigate } from "react-router-dom";
import axiosInstance from "../../util/axiosInstance";
import { Button } from "@/components/ui/button";
import axios from "axios";

const Main = () => {
  const navigate = useNavigate();

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

  const handleLogout = () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) return;

    sessionStorage.removeItem("accessToken");
    axios
      .post("http://localhost:8090/auth/logout", null, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log(res.data);
      });
  };

  const apiTest = async () => {
    const response = await axiosInstance.get("/api/test/me");
    console.log(response.headers);
  };

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
        <Button variant="destructive" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </div>
  );
};

export default Main;
