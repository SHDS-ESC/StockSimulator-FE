import React from "react";

const AnimatedBackground = () => {
  return (
    <div
      className="fixed top-0 left-0 w-full h-screen overflow-hidden z-0"
      style={{
        background:
          "linear-gradient(135deg, #1a1d29 0%, #252a3d 50%, #1f2332 100%)",
      }}
    >
      {/* 주식 차트 그리드 */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "gridMove 30s linear infinite",
        }}
      ></div>

      {/* 메인 주식 차트 라인 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <svg
          className="absolute w-full h-full"
          style={{ zIndex: 1 }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 70 L 20 60 L 40 50 L 60 40 L 80 30 L 100 20"
            stroke="#10b981"
            strokeWidth="0.8"
            fill="none"
            opacity="0.9"
            style={{
              animation: "drawPath 12s ease-in-out infinite",
              strokeDasharray: "100",
              strokeDashoffset: "100",
            }}
          />
        </svg>
      </div>

      {/* 주식 차트 데이터 포인트들 */}
      <div
        className="absolute w-1.5 h-1.5 bg-green-400 rounded-full opacity-80"
        style={{
          top: "30%",
          left: "20%",
          animation: "dataPoint 6s ease-in-out infinite",
        }}
      ></div>
      <div
        className="absolute w-1.5 h-1.5 bg-green-400 rounded-full opacity-80"
        style={{
          top: "20%",
          left: "60%",
          animation: "dataPoint 6s ease-in-out infinite 2s",
        }}
      ></div>
      <div
        className="absolute w-1.5 h-1.5 bg-green-400 rounded-full opacity-80"
        style={{
          top: "10%",
          left: "80%",
          animation: "dataPoint 6s ease-in-out infinite 4s",
        }}
      ></div>

      {/* 보조 차트 라인 (더 미묘하게) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <svg
          className="absolute w-full h-full"
          style={{ zIndex: 1 }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 80 L 30 75 L 60 70 L 90 65 L 100 60"
            stroke="#3b82f6"
            strokeWidth="0.3"
            fill="none"
            opacity="0.4"
            style={{
              animation: "drawPath 15s ease-in-out infinite 3s",
              strokeDasharray: "100",
              strokeDashoffset: "100",
            }}
          />
        </svg>
      </div>

      {/* 글로우 오브들 */}
      <div
        className="absolute rounded-full opacity-40"
        style={{
          width: "120px",
          height: "120px",
          top: "20%",
          right: "10%",
          background: "radial-gradient(circle, #3b82f6, transparent)",
          filter: "blur(40px)",
          animation: "pulse 4s ease-in-out infinite",
        }}
      ></div>
      <div
        className="absolute rounded-full opacity-40"
        style={{
          width: "80px",
          height: "80px",
          bottom: "30%",
          left: "15%",
          background: "radial-gradient(circle, #8b5cf6, transparent)",
          filter: "blur(40px)",
          animation: "pulse 4s ease-in-out infinite 2s",
        }}
      ></div>
    </div>
  );
};

export default AnimatedBackground;
