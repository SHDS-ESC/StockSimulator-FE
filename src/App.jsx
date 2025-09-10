import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // 1. Main 대신 HomePage를 불러옵니다.
import Character from "./pages/Character";
import Stocks from "./pages/Stocks";
import News from "./pages/News";
import Login from "./component/Login";
import "./index.css"; // 2. Tailwind CSS를 적용하기 위해 CSS 파일을 불러옵니다.

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center font-['Jua']">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/character" element={<Character />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/news" element={<News />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
