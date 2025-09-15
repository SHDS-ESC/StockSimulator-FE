import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import callToken from "../util/callToken";
import { Input } from "@/components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "@/components/ui/label";
import useConfirmLogin from "../hooks/useConfirmLogin";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 페이지 로드 시 토큰 체크 → 로그인 상태면 홈으로 이동
  useConfirmLogin("login");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const token = await callToken(email, password);
      if (token) {
        navigate("/"); // 로그인 성공 → 홈으로 이동
      } else {
        setError("로그인 실패: 아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <div className="h-full w-full bg-[url('/logo.svg')] bg-cover bg-center bg-no-repeat flex items-center justify-center ps-4 pe-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 mt-60">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 text-white"
            >
              아이디
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="아이디를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full placeholder:text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700 text-white"
            >
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full placeholder:text-sm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              로그인하기
            </Button>

            <Button
              type="button"
              variant="confirm"
              onClick={() => navigate("/")}
              className="w-full"
            >
              돌아가기
            </Button>

            <Button
              type="button"
              variant="confirm"
              onClick={() => navigate("/register")}
              className="w-full"
            >
              회원가입
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
