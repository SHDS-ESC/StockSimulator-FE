import React from "react";
// import { useNavigate, useLocation } from "react-router-dom";
import { User } from "lucide-react";

const Header = () => {
  // const navigate = useNavigate();
  // const location = useLocation();

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
      <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex flex-col items-center justify-center gap-1 cursor-pointer">
            <div className="w-4 h-0.5 bg-white"></div>
            <div className="w-4 h-0.5 bg-white"></div>
            <div className="w-4 h-0.5 bg-white"></div>
          </div>
        </div>
        <h1 className="text-white text-lg font-bold">FINT</h1>
        <User className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};

export default Header;
