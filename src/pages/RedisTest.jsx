import React, { useState } from 'react';
import axiosInstance from '../util/axiosInstance';

const RedisTest = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [schedulerStatus, setSchedulerStatus] = useState('중지됨');
  const [logs, setLogs] = useState([]);
  const [isLogging, setIsLogging] = useState(false);

  // Redis 초기화
  const initRedis = async () => {
    setLoading(true);
    setMessage('Redis 초기화 중...');
    try {
      const response = await axiosInstance.post('/market/redis/init');
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
      const response = await axiosInstance.post('/market/redis/scheduler/start');
      setMessage(response.data);
      setSchedulerStatus('실행 중');
      setIsLogging(true);
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
      const response = await axiosInstance.post('/market/redis/scheduler/stop');
      setMessage(response.data);
      setSchedulerStatus('중지됨');
      setIsLogging(false);
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
      const response = await axiosInstance.post('/market/redis/scheduler/run-now');
      setMessage(response.data);
      addLog('🚀 스케줄러 수동 실행 요청됨');
    } catch (error) {
      setMessage('스케줄러 수동 실행 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Redis 주식 데이터 관리</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      20분마다 712개 전체 티커를 60개씩 배치로 처리하여 Redis에 저장합니다. (분당 60개 제한 최대 활용)
                    </p>
            <div className="flex gap-2">
              <button
                onClick={startScheduler}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium ${
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
                className={`px-4 py-2 rounded-lg font-medium ${
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
                className={`px-4 py-2 rounded-lg font-medium ${
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
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">결과</h3>
            <p className="text-gray-300">{message}</p>
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

        {/* 사용법 안내 */}
        <div className="mt-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">사용법</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-300">
            <li>먼저 "Redis 초기화"를 클릭하여 712개 주식 데이터를 Redis에 저장합니다.</li>
            <li>"스케줄러 시작"을 클릭하여 20분마다 자동 갱신을 시작합니다.</li>
            <li>주식 페이지에서 Redis에 저장된 데이터를 확인할 수 있습니다.</li>
            <li>스케줄러는 60개씩 배치로 처리하여 API 제한을 최대한 활용합니다.</li>
            <li>각 배치 처리 후 1분 대기하여 분당 60개 제한을 준수합니다.</li>
            <li>약 12분 내에 712개 전체 티커가 모두 갱신됩니다.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RedisTest;
