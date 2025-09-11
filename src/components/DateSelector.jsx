import React from "react";
import { getCurrentDate } from "../util/dateUtils";

const DateSelector = ({ 
  selYear, 
  setSelYear, 
  selMonth, 
  setSelMonth, 
  selDay, 
  setSelDay 
}) => {
  const handleToday = () => {
    const today = getCurrentDate();
    setSelYear(today.year);
    setSelMonth(today.month);
    setSelDay(today.day);
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
        <strong>기준일 선택</strong>
        <label className="row" style={{ gap: 6 }}>
          연도
          <input 
            className="field" 
            type="number" 
            value={selYear}
            onChange={(e) => setSelYear(Math.max(1900, Math.min(2100, Number(e.target.value) || selYear)))}
            style={{ width: 100 }} 
          />
        </label>
        <label className="row" style={{ gap: 6 }}>
          월
          <input 
            className="field" 
            type="number" 
            min={1} 
            max={12} 
            value={selMonth}
            onChange={(e) => {
              const v = Math.max(1, Math.min(12, Number(e.target.value) || selMonth));
              setSelMonth(v);
            }}
            style={{ width: 70 }} 
          />
        </label>
        <label className="row" style={{ gap: 6 }}>
          일
          <input 
            className="field" 
            type="number" 
            min={1} 
            max={31} 
            value={selDay}
            onChange={(e) => {
              const v = Math.max(1, Math.min(31, Number(e.target.value) || selDay));
              setSelDay(v);
            }}
            style={{ width: 70 }} 
          />
        </label>
        <button className="btn" onClick={handleToday}>오늘로</button>
      </div>
    </div>
  );
};

export default DateSelector;
