import { Routes, Route } from "react-router-dom";
import Main from "./components/page/Main";
import Login from "./components/page/Login";
import Register from "./components/page/Register";
import Header from "./components/Header";
import MyPage from "./components/page/Mypage";

function App() {
  return (
    <div className="fixed inset-0 bg-sky-200 flex justify-center items-center">
      <div className="bg-slate-950 w-full max-w-md  h-[100vh] flex flex-col">
        <Header />
        <div className="overflow-y-auto hide-scrollbar flex flex-col ">
          <Routes>
            <Route path="/" element={<Main />} />
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