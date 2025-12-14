import { useEffect } from "react";
import axiosInstance from "@/util/axiosInstance";
import { useNavigate } from "react-router-dom";
import useLoginStore from "@/store/useLoginStore";

const useConfirmLogin = (page) => {
  const navigate = useNavigate();

  const { setEmail, setLevel, setTickerList, setLastProfileId, setUpdatedAt } = useLoginStore();

  useEffect(() => {
    // 페이지 로드 시 토큰 체크
    axiosInstance
      .get("/user/me", { withCredentials: true })
      .then((response) => {
        console.log("response", response);
        console.log(response.data);
        setEmail(response.data.email ?? response.data.username);
        setLevel(response.data.level);
        setTickerList(response.data.tickerList);
        setLastProfileId(response.data.lastProfileId);
        setUpdatedAt(new Date().toISOString());
        if (page === "login") {
          alert("이미 로그인된 상태입니다! 홈으로 이동합니다.");
          navigate("/home");
        } else {
          console.log("로그인 상태");
        }
      })
      .catch((error) => {
        if (page !== "login") {
          console.log("로그인 상태 아님:", error);
          alert("로그인 한 유저만 접근할 수 있습니다.");
          navigate("/");
        } else {

	  console.log("error, page" + error + page);
	}
      });
  }, [page, navigate]);
};

export default useConfirmLogin;
