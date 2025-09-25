// Lightweight Charts UMD 로더 (중복 로드 방지)
export function loadLW() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.LightweightCharts) {
      return resolve(window.LightweightCharts);
    }
    const existing = document.getElementById('lightweight-charts-umd');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'lightweight-charts-umd';
      script.src = 'https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js';
      script.async = true;
      script.onload = () => resolve(window.LightweightCharts);
      document.body.appendChild(script);
    } else {
      const timer = setInterval(() => {
        if (window.LightweightCharts) {
          clearInterval(timer);
          resolve(window.LightweightCharts);
        }
      }, 50);
    }
  });
}



