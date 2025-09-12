import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // 1. Main 대신 HomePage를 불러옵니다.
import Character from "./pages/Character";
import Stocks from "./pages/Stocks";
import News from "./pages/News";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyPage from "./pages/Mypage";
import Main from "./pages/Main";
import Header from "./components/Header";
import "./index.css"; // 2. Tailwind CSS를 적용하기 위해 CSS 파일을 불러옵니다.
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center font-['Jua']">
      <Header />
      <div className="bg-slate-950 w-full max-w-md  flex-1 flex flex-col">
        <div className="overflow-y-auto hide-scrollbar flex-1 pt-10 mb-10 relative">
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
      <Footer />
    </div>
  );
}

export default App;
