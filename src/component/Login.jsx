import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // 로그인 처리 후 메인으로 이동
    navigate("/");
  };

  return (
    <div>
      <h2>로그인 페이지</h2>
      <button onClick={handleLogin}>로그인하기</button>
    </div>
  );
};

export default Login;
