import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import UnifiedChart from "../../components/UnifiedChart";
import axios from "../../util/axiosInstance";

export default function StockLive() {
	const { symbol } = useParams();
	const navigate = useNavigate();
	const s = String(symbol || '').toUpperCase();

	// 프로필의 타임라인 정보: HomePage에서 localStorage("newProfile")에 저장됨
	const profile = useMemo(() => {
		try {
			return JSON.parse(localStorage.getItem("newProfile") || "null");
		} catch (_) { return null; }
	}, []);

	const timelineFrom = profile?.timelineFrom || null; // ISO string expected
	const [simDate, setSimDate] = useState(() => {
		if (!timelineFrom) return { year: null, month: null, day: null };
		const d = new Date(timelineFrom);
		if (Number.isNaN(d.getTime())) return { year: null, month: null, day: null };
		return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
	});

	const isHistorical = Boolean(simDate.year && simDate.month && simDate.day);

	const [price, setPrice] = useState(null);
	const [prevClose, setPrevClose] = useState(null);
	const [err, setErr] = useState(null);

	const change = useMemo(() => {
		if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(prevClose))) return null;
		return Number(price) - Number(prevClose);
	}, [price, prevClose]);
	const changePct = useMemo(() => {
		if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(prevClose)) || Number(prevClose) === 0) return null;
		return (Number(price) / Number(prevClose) - 1) * 100;
	}, [price, prevClose]);

	// 가격/등락률 계산: 타임라인이 있으면 DB 캔들 기반, 없으면 Redis 실시간
	useEffect(() => {
		let active = true;
		async function fetchHistorical() {
			if (!s || !isHistorical) return;
			try {
				const base = new Date(Date.UTC(simDate.year, simDate.month - 1, simDate.day));
				const selectedEpoch = Math.floor(base.getTime() / 1000);
				const prevEpoch = selectedEpoch - 86400;
				const curFrom = prevEpoch;
				const curTo = selectedEpoch + 86400 * 7;
				const prevFrom = prevEpoch - 86400 * 7;
				const prevTo = prevEpoch;
				const [curRes, prevRes] = await Promise.all([
					axios.get('/db/candles', { params: { ticker: s, from: curFrom, to: curTo } }),
					axios.get('/db/candles', { params: { ticker: s, from: prevFrom, to: prevTo } }),
				]);
                const curT = curRes?.data?.timestamps || [];
                const curO = curRes?.data?.opens || [];
				let currentOpen = null;
				for (let i = 0; i < curT.length; i++) {
					if (curT[i] >= selectedEpoch) { currentOpen = curO[i]; break; }
				}
                const prevT = prevRes?.data?.timestamps || [];
                const prevC = prevRes?.data?.closes || [];
				let prevCloseVal = null;
				for (let i = prevT.length - 1; i >= 0; i--) {
					if (prevT[i] <= prevEpoch) { prevCloseVal = prevC[i]; break; }
				}
				if (!active) return;
				if (typeof currentOpen === 'number' && typeof prevCloseVal === 'number') {
					setPrice(currentOpen);
					setPrevClose(prevCloseVal);
					setErr(null);
				} else {
					setPrice(null); setPrevClose(null); setErr('선택일 가격 데이터를 찾을 수 없습니다.');
				}
			} catch (_) {
				if (!active) return;
				setPrice(null); setPrevClose(null); setErr('DB에서 가격을 불러오지 못했습니다.');
			}
		}
		async function fetchRealtime() {
			if (!s || isHistorical) return;
			try {
				const res = await axios.get(`/market/redis/stock/${s}`);
				const data = res?.data;
				if (!data) { setErr('데이터 없음'); return; }
				const cur = parseFloat(String(data.price || '').replace('$',''));
				const chg = parseFloat(String(data.change || '').replace('+',''));
				const prev = Number.isFinite(cur) && Number.isFinite(chg) ? (cur - chg) : null;
				if (!active) return;
				setPrice(Number.isFinite(cur) ? cur : null);
				setPrevClose(Number.isFinite(prev) ? prev : null);
				setErr(null);
			} catch (_) {
				if (!active) return;
				setErr('Redis에서 가격을 불러오지 못했습니다.');
			}
		}
		if (isHistorical) fetchHistorical(); else fetchRealtime();
		return () => { active = false; };
	}, [s, isHistorical, simDate]);

	return (
		<div className="container">
			<div className="card" style={{ marginBottom: 12 }}>
				<div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
					<strong style={{ fontSize: 18 }}>{s || (isHistorical ? 'HIST' : 'LIVE')}</strong>
					<button className="btn" onClick={() => navigate(-1)}>뒤로</button>
				</div>
			</div>
			<div className="card" style={{ marginBottom: 12 }}>
				<div className="row" style={{ gap: 12 }}>
					<span className="muted">현재가</span>
					<strong>{Number.isFinite(Number(price)) ? Number(price).toFixed(2) : '-'}</strong>
					<span className="muted">전일대비</span>
					<span style={{ color: (change ?? 0) >= 0 ? '#26a69a' : '#ef5350' }}>
						{Number.isFinite(Number(change)) ? `${change.toFixed(2)} (${Number(changePct).toFixed(2)}%)` : '-'}
					</span>
					{err && <span className="muted">{err}</span>}
				</div>
			</div>
			<div style={{ height: 600 }}>
				<UnifiedChart
					symbol={s}
					defaultMode={isHistorical ? "historical" : "realtime"}
					initialYear={isHistorical ? simDate.year : undefined}
					initialMonth={isHistorical ? simDate.month : undefined}
					initialDay={isHistorical ? simDate.day : undefined}
					autoLoad={true}
				/>
			</div>
		</div>
	);
}


