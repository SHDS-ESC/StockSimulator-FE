import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from '../util/axiosInstance';

const RedisTest = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState('중지됨');
  const [logs, setLogs] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [cfg, setCfg] = useState({ batchSize: 50, perRequestDelayMs: 1000, sleepBetweenBatchesMs: 60000, verboseLog: false, enabled: true });
  const [testSymbol, setTestSymbol] = useState('AAPL');
  const [dbDays, setDbDays] = useState(7);
  const [dbDate, setDbDate] = useState(new Date().toISOString().slice(0,10));
  const lastLogIdRef = useRef(0);
  const pollTimerRef = useRef(null);

  // Redis 초기화
  const initRedis = async () => {
    setLoading(true);
    setMessage('Redis 초기화 중...');
    try {
      const response = await axiosInstance.post('/redis/init');
      setMessage(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage('백엔드 서버가 실행되지 않았습니다. 서버를 먼저 시작해주세요.');
      } else {
        setMessage('Redis 초기화 실패: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 스케줄러 시작
  const startScheduler = async () => {
    setLoading(true);
    setMessage('스케줄러 시작 중...');
    try {
      const response = await axiosInstance.post('/redis/scheduler/start');
      setMessage(response.data);
      setSchedulerStatus('실행 중');
      startLogPolling();
      addLog('🚀 스케줄러가 시작되었습니다.');
    } catch (error) {
      setMessage('스케줄러 시작 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 스케줄러 중지
  const stopScheduler = async () => {
    setLoading(true);
    setMessage('스케줄러 중지 중...');
    try {
      const response = await axiosInstance.post('/redis/scheduler/stop');
      setMessage(response.data);
      setSchedulerStatus('중지됨');
      stopLogPolling();
      addLog('⏹️ 스케줄러가 중지되었습니다.');
    } catch (error) {
      setMessage('스케줄러 중지 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그 추가
  const addLog = (logMessage) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${logMessage}`]);
  };

  // 로그 클리어
  const clearLogs = () => {
    setLogs([]);
  };

  // 스케줄러 수동 실행
  const runSchedulerNow = async () => {
    setLoading(true);
    setMessage('스케줄러 수동 실행 중...');
    try {
      const response = await axiosInstance.post('/redis/scheduler/run-now');
      setMessage(response.data);
      addLog('🚀 스케줄러 수동 실행 요청됨');
    } catch (error) {
      setMessage('스케줄러 수동 실행 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 설정 적용
  const applyConfig = async () => {
    setLoading(true);
    setMessage('설정 적용 중...');
    try {
      const { batchSize, perRequestDelayMs, sleepBetweenBatchesMs, verboseLog, enabled } = cfg;
      const res = await axiosInstance.post('/redis/config', { batchSize, perRequestDelayMs, sleepBetweenBatchesMs, verboseLog, enabled });
      if (res.data?.status === 'ok') {
        setMessage('설정 적용 완료');
        addLog(`⚙️ 설정 적용: batch=${batchSize}, delay=${perRequestDelayMs}ms, sleep=${sleepBetweenBatchesMs}ms, verbose=${String(verboseLog)}, enabled=${String(enabled)}`);
      } else {
        setMessage('설정 적용 실패');
      }
    } catch (e) {
      setMessage('설정 적용 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그 폴링
  const startLogPolling = () => {
    if (pollTimerRef.current) return;
    setIsLogging(true);
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const after = lastLogIdRef.current || 0;
        const res = await axiosInstance.get(`/redis/logs${after ? `?after=${after}` : ''}`);
        const entries = res.data?.entries || [];
        if (Array.isArray(entries) && entries.length) {
          setLogs(prev => [...prev, ...entries.map(e => `[${e.time}] ${e.message}`)]);
        }
        const lastId = Number(res.data?.lastId || 0);
        lastLogIdRef.current = Math.max(lastLogIdRef.current, lastId);
      } catch (e) {
        // 네트워크 오류는 무시하고 다음 사이클 진행
      }
    }, 1000);
  };
  const stopLogPolling = () => {
    setIsLogging(false);
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };
  useEffect(() => () => stopLogPolling(), []);

  // API 직접 테스트
  const testQuote = async () => {
    setLoading(true);
    setMessage('quote 테스트 중...');
    try {
      const res = await axiosInstance.get(`/market/quote`, { params: { symbol: testSymbol } });
      setMessage(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
    } catch (e) {
      setMessage('quote 실패: ' + e.message);
    } finally { setLoading(false); }
  };
  const testRedisStocks = async () => {
    setLoading(true);
    setMessage('redis/stocks 테스트 중...');
    try {
      const res = await axiosInstance.get(`/redis/stocks`);
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) { setMessage('redis/stocks 실패: ' + e.message); } finally { setLoading(false); }
  };
  const testRedisStock = async () => {
    setLoading(true);
    setMessage('redis/stock 테스트 중...');
    try {
      const res = await axiosInstance.get(`/redis/stock/${encodeURIComponent(testSymbol)}`);
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) { setMessage('redis/stock 실패: ' + e.message); } finally { setLoading(false); }
  };

  // DB 과거 타임라인 테스트
  const testDbCandles = async () => {
    setLoading(true);
    setMessage('db/candles 테스트 중...');
    try {
      const res = await axiosInstance.get('/db/candles', { params: { ticker: testSymbol, days: dbDays } });
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) {
      setMessage('db/candles 실패: ' + e.message);
    } finally { setLoading(false); }
  };
  const testDbLastRange = async () => {
    setLoading(true);
    setMessage('db/last-range 테스트 중...');
    try {
      const res = await axiosInstance.get('/db/last-range', { params: { ticker: testSymbol, days: dbDays } });
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) {
      setMessage('db/last-range 실패: ' + e.message);
    } finally { setLoading(false); }
  };
  const testDbSnapshot = async () => {
    setLoading(true);
    setMessage('db/snapshot 테스트 중...');
    try {
      const res = await axiosInstance.get('/db/snapshot', { params: { date: dbDate } });
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) {
      setMessage('db/snapshot 실패: ' + e.message);
    } finally { setLoading(false); }
  };
  const testDbNextTradingDay = async () => {
    setLoading(true);
    setMessage('db/next-trading-day 테스트 중...');
    try {
      const res = await axiosInstance.get('/db/next-trading-day', { params: { date: dbDate } });
      setMessage(JSON.stringify(res.data, null, 2));
    } catch (e) {
      setMessage('db/next-trading-day 실패: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Redis 주식 데이터 테스트</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Redis 초기화 */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Redis 초기화</h2>
            <p className="text-gray-400 mb-4">
              712개 티커에 대해 모의 데이터를 생성하여 Redis에 저장합니다.
            </p>
            <button
              onClick={initRedis}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {loading ? '초기화 중...' : 'Redis 초기화'}
            </button>
          </div>

          {/* 스케줄러 관리 */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">스케줄러 관리</h2>
            <p className="text-gray-400 mb-4">
              분당 배치/지연을 조절해 테스트할 수 있습니다.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={startScheduler}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {loading ? '처리 중...' : '스케줄러 시작'}
              </button>
              <button
                onClick={stopScheduler}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {loading ? '처리 중...' : '스케줄러 중지'}
              </button>
              <button
                onClick={runSchedulerNow}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {loading ? '처리 중...' : '지금 실행'}
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              상태: <span className="text-white">{schedulerStatus}</span>
            </div>
          </div>

          {/* 스케줄러 설정 */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">스케줄러 설정</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-gray-200">배치 크기
                <input type="number" className="mt-1 w-full px-3 py-2 bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={cfg.batchSize}
                  onChange={e=>setCfg(v=>({...v, batchSize: Number(e.target.value||50)}))}
                />
              </label>
              <label className="text-sm text-gray-200">요청간 지연(ms)
                <input type="number" className="mt-1 w-full px-3 py-2 bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={cfg.perRequestDelayMs}
                  onChange={e=>setCfg(v=>({...v, perRequestDelayMs: Number(e.target.value||1000)}))}
                />
              </label>
              <label className="text-sm text-gray-200">배치간 대기(ms)
                <input type="number" className="mt-1 w-full px-3 py-2 bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={cfg.sleepBetweenBatchesMs}
                  onChange={e=>setCfg(v=>({...v, sleepBetweenBatchesMs: Number(e.target.value||60000)}))}
                />
              </label>
              <div className="flex items-center gap-6 mt-6 col-span-2">
                <label className="text-sm text-gray-200 flex items-center gap-2">
                  <input type="checkbox" checked={cfg.verboseLog} onChange={e=>setCfg(v=>({...v, verboseLog: e.target.checked}))} /> 상세 로그
                </label>
                <label className="text-sm text-gray-200 flex items-center gap-2">
                  <input type="checkbox" checked={cfg.enabled} onChange={e=>setCfg(v=>({...v, enabled: e.target.checked}))} /> 활성화
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={applyConfig} disabled={loading} className={`px-4 py-2 rounded-lg font-medium ${loading? 'bg-gray-600 cursor-not-allowed':'bg-indigo-600 hover:bg-indigo-500'} whitespace-nowrap`}>
                {loading ? '적용 중...' : '설정 적용'}
              </button>
            </div>
          </div>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">결과</h3>
              <button onClick={() => navigator.clipboard.writeText(String(message || ''))} className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500">복사</button>
            </div>
            <pre className="text-gray-300 bg-black/60 p-3 rounded max-h-96 overflow-auto whitespace-pre-wrap break-words">{message}</pre>
          </div>
        )}

        {/* 실시간 로그 */}
        <div className="mt-6 p-6 bg-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">실시간 로그</h3>
            <div className="flex gap-2">
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500"
              >
                로그 클리어
              </button>
              <button
                onClick={() => (isLogging ? stopLogPolling() : startLogPolling())}
                className={`px-3 py-1 rounded text-sm ${isLogging ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}
              >
                {isLogging ? '로그 중지' : '로그 시작'}
              </button>
              <div className={`px-3 py-1 rounded text-sm ${
                isLogging ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {isLogging ? '실시간 모니터링 중' : '대기 중'}
              </div>
            </div>
          </div>
          <div className="bg-black p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">로그가 없습니다. 스케줄러를 시작하면 로그가 표시됩니다.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 text-green-400">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* API 직접 호출 */}
        <div className="mt-6 p-6 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">API 직접 호출</h3>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <input value={testSymbol} onChange={e=>setTestSymbol(e.target.value)} className="px-3 py-2 bg-slate-900 rounded" placeholder="심볼 (예: AAPL)" />
            <button onClick={testQuote} className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-500">/market/quote</button>
            <button onClick={testRedisStocks} className="px-3 py-2 bg-indigo-600 rounded hover:bg-indigo-500">/redis/stocks</button>
            <button onClick={testRedisStock} className="px-3 py-2 bg-emerald-600 rounded hover:bg-emerald-500">/redis/stock/{'{' }symbol{ '}'}</button>
          </div>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <input type="number" value={dbDays} onChange={e=>setDbDays(Number(e.target.value||7))} className="px-3 py-2 bg-slate-900 rounded w-28" placeholder="days" />
            <input type="date" value={dbDate} onChange={e=>setDbDate(e.target.value)} className="px-3 py-2 bg-slate-900 rounded" />
            <button onClick={testDbCandles} className="px-3 py-2 bg-purple-600 rounded hover:bg-purple-500">/db/candles</button>
            <button onClick={testDbLastRange} className="px-3 py-2 bg-fuchsia-600 rounded hover:bg-fuchsia-500">/db/last-range</button>
            <button onClick={testDbSnapshot} className="px-3 py-2 bg-amber-600 rounded hover:bg-amber-500">/db/snapshot</button>
            <button onClick={testDbNextTradingDay} className="px-3 py-2 bg-teal-600 rounded hover:bg-teal-500">/db/next-trading-day</button>
          </div>
          <p className="text-xs text-gray-400">테스트 응답은 상단 "결과" 영역에 표시됩니다.</p>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">사용법</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-300">
            <li>"Redis 초기화"로 모의 데이터를 저장합니다.</li>
            <li>"스케줄러 설정"에서 배치/지연/대기/활성화를 조정하고 "설정 적용"을 누릅니다.</li>
            <li>"지금 실행"으로 즉시 1회 배치 실행을 테스트합니다. 필요 시 "스케줄러 시작"도 가능하지만, 테스트는 지금 실행만으로 충분합니다.</li>
            <li>"실시간 로그"에서 진행 상황을 모니터링합니다. 429가 발생하면 자동으로 대기합니다.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RedisTest;
