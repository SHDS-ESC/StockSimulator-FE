// 날짜 관련 유틸리티 함수들

export const getCurrentDate = () => {
  const today = new Date();
  return {
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate()
  };
};

export const formatDate = (year, month, day) => {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
};

export const toEpoch = (t) => {
  if (typeof t === 'number') return t;
  if (t && typeof t === 'object') {
    const y = Number(t.year), m = Number(t.month), d = Number(t.day);
    if ([y, m, d].every(Number.isFinite)) return Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0) / 1000);
  }
  return null;
};

export const getDayEpochRange = (simIndex, simCandles) => {
  const bar = (simIndex >= 0) ? simCandles[simIndex] : null;
  const t = bar?.time;
  if (!(t && typeof t === 'object')) return null;
  const y = Number(t.year), m = Number(t.month), d = Number(t.day);
  if (![y, m, d].every(Number.isFinite)) return null;
  const start = Math.floor(Date.UTC(y, m - 1, d, 0, 0, 0) / 1000);
  const end = Math.floor(Date.UTC(y, m - 1, d, 23, 59, 59) / 1000);
  const prevStart = start - 10 * 86400;
  return { start, end, prevStart };
};
