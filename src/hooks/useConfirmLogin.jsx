import { useEffect } from "react";
import axiosInstance from "@/util/axiosInstance";
import { useNavigate } from "react-router-dom";

const useConfirmLogin = (page) => {
  const navigate = useNavigate();

  useEffect(() => {
    // 페이지 로드 시 토큰 체크
    axiosInstance
      .get("/user/me", { withCredentials: true })
      .then(() => {
        if (page === "login") {
          alert("이미 로그인된 상태입니다! 홈으로 이동합니다.");
          navigate("/"); // 홈 페이지로 이동
        } else {
          console.log("로그인 상태");
        }
      })
      .catch((error) => {
        if (page !== "login") {
          console.log("로그인 상태 아님:", error);
          alert("로그인 한 유저만 접근할 수 있습니다.");
          navigate("/"); // 홈 페이지로 이동
        }
      });
  }, [page, navigate]);
};

export default useConfirmLogin;
