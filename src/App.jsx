import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // 1. Main 대신 HomePage를 불러옵니다.
import Character from "./pages/Character";
import Stocks from "./pages/Stocks";
import News from "./pages/News";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyPage from "./pages/Mypage";
import Main from "./pages/Main";
import { Header, Footer } from "./components/layout/Layout";
import AnimatedBackground from "./components/AnimatedBackground";
import "./index.css"; // Tailwind CSS + 모든 커스텀 스타일
import TradePage from "./pages/trade/TradePage";
import StockLive from "./pages/trade/StockLive";
import RedisTest from "./pages/RedisTest";
import useDateStore from "@/store/useDateStore";

function App() {
  const { isTurnOver } = useDateStore();

  return (
    <div className="min-h-screen flex flex-col items-center font-['Jua'] relative">
      <AnimatedBackground />
      <Header />
      <div className="bg-slate-950 w-full max-w-md flex-1 flex flex-col relative z-20">
        <div className="overflow-y-auto hide-scrollbar flex-1 pt-10 mb-10 relative">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/stocks/:symbol" element={<StockLive />} />
            <Route path="/stocks/live/:symbol" element={<StockLive />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/character" element={<Character />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/news" element={<News />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/redis-test" element={<RedisTest />} />
          </Routes>
        </div>
        {/* TurnOver 팝업 */}
        {isTurnOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-2xl p-8 w-[90%] max-w-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Turn Over!</h2>
              <p className="mb-6 text-gray-700">
                포트폴리오를 보여줄 팝업 내용입니다.
              </p>
              <button
                onClick={() => useDateStore.setState({ isTurnOver: false })}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
