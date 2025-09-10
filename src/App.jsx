import { Routes, Route } from "react-router-dom";
import Main from "./components/page/Main";
import Login from "./components/page/Login";
import Register from "./components/page/Register";
import Header from "./components/Header";

function App() {
  return (
    <div className="fixed inset-0 bg-sky-200 flex justify-center items-center">
      <div className="bg-[#020618] w-full max-w-md  px-4 h-[100vh] flex flex-col">
        <Header />
        <div className=" overflow-y-auto hide-scrollbar px-4 flex flex-col ">
          <Routes>
            <Route path="/" element={<Main />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;