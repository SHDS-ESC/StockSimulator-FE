import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import axiosInstance from "../util/axiosInstance";

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

  const apiTest = async () => {
    // axios.get("http://localhost:8080/api/test").then((response) => {
    //   console.log(response);
    // });

    const response = await axiosInstance.get("/api/example", {
      params: {
        param1: "value1",
        param2: "value2",
      },
    });
    console.log(response);
  };

  return (
    <div>
      <h2>메인 페이지</h2>
      <p>주식 시뮬레이터에 오신 것을 환영합니다!</p>
      <button onClick={handleGoToLogin}>로그인 페이지로 이동</button>
      <button onClick={apiTest}>API 테스트</button>
    </div>
  );
};

export default Main;
