import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // 1. Main 대신 HomePage를 불러옵니다.
import Character from "./pages/Character";
import Stocks from "./pages/Stocks";
import News from "./pages/News";
import Login from "./component/Login";
import Register from "./components/page/Register";
import MyPage from "./components/page/Mypage";
import Main from "./components/page/Main";
import Header from "./components/Header";
import "./index.css"; // 2. Tailwind CSS를 적용하기 위해 CSS 파일을 불러옵니다.

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center font-['Jua']">
      <div className="bg-slate-950 w-full max-w-md  h-[100vh] flex flex-col">
        <Header />
        <div className="overflow-y-auto hide-scrollbar flex flex-col ">
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/character" element={<Character />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/news" element={<News />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
