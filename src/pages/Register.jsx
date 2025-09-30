import { useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback } from "react";
import useRegisterStore from "@/store/useRegisterStore";
import axios from "axios";
import axiosInstance from "@/util/axiosInstance";

const interests = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const Register = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    level,
    setLevel,
    tickerList,
    setTickerList,
    error,
    setError,
  } = useRegisterStore();

  const navigate = useNavigate();

  // useCallback으로 함수 최적화
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      if (name === "email") setEmail(value);
      if (name === "password") setPassword(value);
    },
    [setEmail, setPassword]
  );

  const handleLevelChange = useCallback(
    (value) => {
      setLevel(value);
    },
    [setLevel]
  );

  const handleConfirmPasswordChange = useCallback(
    (e) => {
      setConfirmPassword(e.target.value);
    },
    [setConfirmPassword]
  );

  const handleTickerListChange = useCallback(
    (value) => {
      const newTickerList = tickerList.includes(value)
        ? tickerList.filter((item) => item !== value)
        : [...tickerList, value];
      setTickerList(newTickerList);
    },
    [setTickerList, tickerList]
  );

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setError("");
    try {
      const response = await axiosInstance.post("/user/register", {
        email,
        password,
        level,
        tickerList,
      });
      if (response.status === 200) {
        navigate("/");
      } else {
        setError("회원가입 실패: 다시 시도해주세요.");
      }
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <div className="text-white h-full flex flex-col items-center">
      <div className="w-full h-56 sm:h-64 bg-[url('/logo.svg')] bg-no-repeat bg-top bg-[length:180px] sm:bg-[length:220px] md:bg-[length:260px]"></div>
      <form onSubmit={handleRegister} className="w-full max-w-sm mx-auto mt-6">
        <Label htmlFor="email">아이디</Label>
        <Input
          id="email"
          type="text"
          placeholder="이메일"
          name="email"
          value={email}
          onChange={handleChange}
        />

        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          placeholder="비밀번호"
          name="password"
          value={password}
          onChange={handleChange}
        />

        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="비밀번호 확인"
          name="confirmPassword"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
        />

        <Label htmlFor="level">숙련도</Label>
        <Select onValueChange={handleLevelChange} value={level}>
          <SelectTrigger>
            <SelectValue placeholder="숙련도를 선택해주세요. (1, 2, 3)" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>숙련도</SelectLabel>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={4}>
            <Command>
              <CommandGroup>
                {interests.map((item) => (
                  <CommandItem key={item.value}>
                    <Checkbox
                      checked={tickerList.includes(item.value)}
                      onCheckedChange={() => handleTickerListChange(item.value)}
                      className="mr-2"
                    />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex justify-between mt-20">
          <Button variant="confirm" type="submit">
            회원가입하기
          </Button>
          <Button variant="confirm" type="button" onClick={() => navigate("/")}>
            돌아가기
          </Button>{" "}
        </div>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Register;
