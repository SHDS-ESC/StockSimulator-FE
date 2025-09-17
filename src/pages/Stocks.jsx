import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, X, Heart, AlertCircle, Clock } from "lucide-react";
import useRealtimeStocks from "../hooks/useRealtimeStocks";
import useWatchlist from "../hooks/useWatchlist";
import useLoginStore from "../store/useLoginStore";
import useDateStore from "../store/useDateStore";
import axios from "../util/axiosInstance";

const Stocks = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState("탐색");
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedFilter, setSelectedFilter] = useState("이름");
   const [currentPage, setCurrentPage] = useState(1);
   const [stocksPerPage] = useState(6); // 페이지당 6개 주식 표시

	// 로그인 상태 및 프로필 정보
	const { lastProfileId } = useLoginStore();
	const { currentDate } = useDateStore();
	const profile = useMemo(() => {
		try { return JSON.parse(localStorage.getItem("newProfile") || "null"); } catch (_) { return null; }
	}, [lastProfileId]);
	const timelineFrom = profile?.timelineFrom || null;
	const simDate = useMemo(() => {
		// currentDate가 있으면 우선 사용 (턴 종료로 날짜가 변경된 경우)
		const dateToUse = currentDate || timelineFrom;
		if (!dateToUse) return null;
		const d = new Date(dateToUse);
		if (Number.isNaN(d.getTime())) return null;
		return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
	}, [currentDate, timelineFrom, lastProfileId]);
	const isHistorical = Boolean(simDate?.year && simDate?.month && simDate?.day);

	// 실시간 주식 데이터 훅 사용
	const {
		stocks,
		loading,
		error,
		lastUpdate
	} = useRealtimeStocks();

	// 관심종목 훅 사용
	const {
		watchlist,
		loading: watchlistLoading,
		error: watchlistError,
		toggleWatchlist,
		isInWatchlist
	} = useWatchlist(lastProfileId);

	// 과거 모드 가격 캐시
	const [histMap, setHistMap] = useState({}); // symbol -> { price, change, changePercent }

	// 날짜가 변경될 때마다 캐시 초기화
	useEffect(() => {
		if (isHistorical) {
			setHistMap({});
		}
	}, [simDate?.year, simDate?.month, simDate?.day, isHistorical]);


	const handleGoBack = () => {
		navigate("/");
	};

	const handleStockSelect = (stock) => {
		navigate(`/stocks/${stock.symbol}`);
	};

	const handleToggleFavorite = async (symbol) => {
		if (!lastProfileId) {
			alert('로그인이 필요합니다');
			return;
		}
		
		const success = await toggleWatchlist(symbol);
		if (!success) {
			alert('관심종목 토글에 실패했습니다');
		}
	};

	// 주식 표시 데이터 계산 함수
	const getStockDisplayData = (stock) => {
		const hp = isHistorical ? histMap[stock.symbol] : null;
		const priceText = isHistorical ? (hp?.price ?? '-') : (String(stock.price).startsWith('$') ? String(stock.price) : `$${String(stock.price)}`);
		const changeText = isHistorical ? (hp?.change ?? '-') : String(stock.change ?? '');
		const changePctText = isHistorical ? (hp?.changePercent ?? '-') : String(stock.changePercent ?? '');
		const isUp = (isHistorical ? String(hp?.change || '').startsWith('+') : String(stock.change ?? '').includes("+"));
		
		return { priceText, changeText, changePctText, isUp };
	};

	// 주식 카드 컴포넌트
	const StockCard = ({ stock, index, showFavorite = true }) => {
		const { priceText, changeText, changePctText, isUp } = getStockDisplayData(stock);
		
		return (
			<div
				key={index}
				onClick={() => handleStockSelect(stock)}
				className="flex items-center justify-between p-3 bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors"
			>
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg overflow-hidden">
						<img
							src={`https://financialmodelingprep.com/image-stock/${stock.symbol}.png`}
							alt={stock.name}
							className="w-full h-full object-cover"
							onError={(e) => {
								e.target.style.display = "none";
								e.target.nextSibling.style.display = "flex";
							}}
						/>
						<span className="text-gray-600 font-bold text-xs hidden">
							{stock.symbol}
						</span>
					</div>
					<div>
						<h4 className="text-white font-medium">{stock.name}</h4>
						<p className="text-gray-400 text-sm">{stock.symbol}</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-right">
						<p className="text-white font-semibold text-lg">
							{priceText}
						</p>
						<div className="flex items-center gap-1">
							<p className={`text-sm font-medium ${isUp ? "text-red-500" : "text-blue-500"}`}>
								{changeText}
							</p>
							<p className={`text-xs ${isUp ? "text-red-500" : "text-blue-500"}`}>
								({changePctText})
							</p>
						</div>
					</div>
					{showFavorite && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleToggleFavorite(stock.symbol);
							}}
							className="p-1 hover:bg-slate-600 rounded-full transition-colors"
							disabled={watchlistLoading}
						>
							<Heart
								className={`w-5 h-5 ${
									isInWatchlist(stock.symbol)
										? "text-red-500 fill-red-500"
										: "text-gray-400"
								}`}
							/>
						</button>
					)}
				</div>
			</div>
		);
	};

	// 필터링된 주식 목록
	const filteredStocks = useMemo(() => {
		let filtered = stocks.filter(
			(stock) =>
				stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
		);

		// 정렬 적용 (표시값 기준 정렬: 과거 모드라면 histMap 값이 있으면 그 값으로)
		switch (selectedFilter) {
			case "이름":
				filtered.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case "가격":
				filtered.sort((a, b) => {
					const normalizePrice = (val) => parseFloat(String(val ?? '').replace('$', '').replace(',', '')) || 0;
					const pa = isHistorical ? normalizePrice(histMap[a.symbol]?.price) : normalizePrice(a.price);
					const pb = isHistorical ? normalizePrice(histMap[b.symbol]?.price) : normalizePrice(b.price);
					return pb - pa;
				});
				break;
			case "등락률":
				filtered.sort((a, b) => {
					const normalizePercent = (val) => parseFloat(String(val ?? '0').replace('%', '')) || 0;
					const ca = isHistorical ? normalizePercent(histMap[a.symbol]?.changePercent) : normalizePercent(a.change);
					const cb = isHistorical ? normalizePercent(histMap[b.symbol]?.changePercent) : normalizePercent(b.change);
					return cb - ca;
				});
				break;
			default:
				break;
		}

		return filtered;
	}, [stocks, searchQuery, selectedFilter, isHistorical, histMap]);

	// 페이지네이션 계산
	const totalPages = Math.ceil(filteredStocks.length / stocksPerPage);
	const startIndex = (currentPage - 1) * stocksPerPage;
	const endIndex = startIndex + stocksPerPage;
	const currentStocks = filteredStocks.slice(startIndex, endIndex);

	// 현재 페이지 심볼들의 과거 가격 로드 트리거
	useEffect(() => {
		if (!isHistorical || !simDate) return;
		const symbols = currentStocks.map(s => s.symbol).filter(Boolean);
		if (symbols.length === 0) return;
		
		// 이미 캐시된 심볼들은 제외
		const uncachedSymbols = symbols.filter(sym => !histMap[sym]);
		if (uncachedSymbols.length === 0) return;
		
		const doFetch = async () => {
			const base = new Date(Date.UTC(simDate.year, simDate.month - 1, simDate.day));
			const selectedEpoch = Math.floor(base.getTime() / 1000);
			const prevEpoch = selectedEpoch - 86400;
			const curFrom = prevEpoch;
			const curTo = selectedEpoch + 86400 * 7;
			const prevFrom = prevEpoch - 86400 * 7;
			const prevTo = prevEpoch;
			const updates = {};
			
			await Promise.all(uncachedSymbols.map(async (sym) => {
				try {
					const [curRes, prevRes] = await Promise.all([
						axios.get('/db/candles', { params: { ticker: sym, from: curFrom, to: curTo } }),
						axios.get('/db/candles', { params: { ticker: sym, from: prevFrom, to: prevTo } }),
					]);
					const curT = curRes?.data?.t || [];
					const curC = curRes?.data?.c || [];
					let currentClose = null;
					for (let i = 0; i < curT.length; i++) { if (curT[i] >= selectedEpoch) { currentClose = curC[i]; break; } }
					const prevT = prevRes?.data?.t || [];
					const prevC = prevRes?.data?.c || [];
					let prevClose = null;
					for (let i = prevT.length - 1; i >= 0; i--) { if (prevT[i] <= prevEpoch) { prevClose = prevC[i]; break; } }
					if (typeof currentClose === 'number' && typeof prevClose === 'number') {
						const chg = currentClose - prevClose;
						const pct = prevClose !== 0 ? (chg / prevClose) * 100 : 0;
						updates[sym] = { price: `$${currentClose.toFixed(2)}`, change: `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}`, changePercent: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` };
					} else {
						updates[sym] = { price: '-', change: '-', changePercent: '-' };
					}
				} catch (_) {
					updates[sym] = { price: '-', change: '-', changePercent: '-' };
				}
			}));
			
			if (Object.keys(updates).length > 0) setHistMap((prev) => ({ ...prev, ...updates }));
		};
		
		doFetch();
	}, [currentStocks, isHistorical, simDate?.year, simDate?.month, simDate?.day, histMap]);

	// 검색어 변경 시 첫 페이지로 이동
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, selectedFilter]);


	return (
		<div>
			{/* 전체 콘텐츠 영역 */}
			<div>
				{/* 뒤로가기 버튼 */}
				<div className="px-4 py-4">
					<button
						onClick={handleGoBack}
						className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
						<span>뒤로가기</span>
					</button>
				</div>

				{/* 페이지 제목 */}
				<div className="px-4 py-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
							{lastUpdate && (
								<div className="flex items-center gap-1">
									<Clock className="w-3 h-3" />
									<span>마지막 업데이트: {lastUpdate.toLocaleTimeString()}</span>
								</div>
							)}
							<div className="flex items-center gap-1">
								<span>총 {stocks.length}개 주식</span>
								{filteredStocks.length !== stocks.length && (
									<span>(검색 결과: {filteredStocks.length}개)</span>
								)}
								{filteredStocks.length > stocksPerPage && (
									<span>(페이지 {currentPage}/{totalPages})</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* 탭 메뉴 */}
				<div className="px-4 py-4">
					<div className="flex bg-slate-800 rounded-xl p-1">
						<button
							onClick={() => setActiveTab("탐색")}
							className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
								activeTab === "탐색"
									? "bg-white text-black"
									: "text-gray-400 hover:text-white"
							}`}
						>
							탐색
						</button>
						<button
							onClick={() => setActiveTab("관심")}
							className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
								activeTab === "관심"
									? "bg-white text-black"
								: "text-gray-400 hover:text-white"
							}`}
						>
							관심
						</button>
					</div>
				</div>

				{/* 탭에 따른 콘텐츠 */}
				{activeTab === "탐색" ? (
					<div>
						{/* 검색바 */}
						<div className="px-4 py-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="text"
									placeholder="원하는 주식을 검색하세요"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
								/>
							</div>
						</div>


						{/* 정렬 옵션 */}
						<div className="px-4 py-2">
							<div className="flex gap-2">
								{["이름", "가격", "등락률"].map((option) => (
									<button
										key={option}
										onClick={() => setSelectedFilter(option)}
										className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
											selectedFilter === option
												? "bg-white text-black border border-gray-300"
												: "bg-slate-800 text-gray-400 hover:text-white"
										}`}
									>
										{option}
									</button>
								))}
							</div>
						</div>

						{/* 주식 목록 */}
						<div className="px-4 py-2">
							{error && (
								<div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
									<div className="flex items-center gap-2 text-red-400">
										<AlertCircle className="w-4 h-4" />
										<span className="text-sm">{error}</span>
									</div>
								</div>
							)}

							{loading ? (
								<div className="space-y-2">{[...Array(5)].map((_, index) => (
									<div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl animate-pulse">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
											<div>
												<div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
												<div className="h-3 bg-slate-700 rounded w-16"></div>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="text-right">
												<div className="h-4 bg-slate-700 rounded w-16 mb-2"></div>
												<div className="h-3 bg-slate-700 rounded w-12"></div>
											</div>
											<div className="w-6 h-6 bg-slate-700 rounded-full"></div>
										</div>
									</div>
								))}</div>
							) : (
								<div className="space-y-2">
									{currentStocks.length === 0 ? (
										<div className="text-center py-8">
											<Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
											<p className="text-gray-400 text-sm">검색 결과가 없습니다</p>
											<p className="text-gray-500 text-xs mt-1">
												다른 검색어를 시도해보세요
											</p>
										</div>
									) : (
										currentStocks.map((stock, index) => (
											<StockCard key={index} stock={stock} index={index} />
										))
									)}
								</div>
							)}

							{/* 페이지네이션 */}
							{filteredStocks.length > stocksPerPage && (
								<div className="mt-6 flex items-center justify-between">
									<div className="text-sm text-gray-400">
										{startIndex + 1}-{Math.min(endIndex, filteredStocks.length)} / {filteredStocks.length}개
									</div>
									<div className="flex items-center gap-2">
										<button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>이전</button>
										<span className="text-sm text-gray-400">{currentPage} / {totalPages}</span>
										<button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`px-3 py-1 rounded-md text-sm ${currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>다음</button>
									</div>
								</div>
							)}

							{/* Redis 데이터 안내 */}
							<div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
								<div className="flex items-center gap-2 text-blue-400 text-sm">
									<AlertCircle className="w-4 h-4" />
									<span>Redis 데이터: 백그라운드 스케줄러가 20분마다 자동 갱신하는 주식 데이터 | 갱신 없이 읽기만</span>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="px-4 py-2">
						{watchlistError && (
							<div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
								<div className="flex items-center gap-2 text-red-400">
									<AlertCircle className="w-4 h-4" />
									<span className="text-sm">{watchlistError}</span>
								</div>
							</div>
						)}
						
						<div className="space-y-2">
							{watchlistLoading ? (
								<div className="space-y-2">
									{[...Array(3)].map((_, index) => (
										<div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl animate-pulse">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
												<div>
													<div className="h-4 bg-slate-700 rounded w-20 mb-2"></div>
													<div className="h-3 bg-slate-700 rounded w-16"></div>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<div className="text-right">
													<div className="h-4 bg-slate-700 rounded w-16 mb-2"></div>
													<div className="h-3 bg-slate-700 rounded w-12"></div>
												</div>
												<div className="w-6 h-6 bg-slate-700 rounded-full"></div>
											</div>
										</div>
									))}
								</div>
							) : watchlist.size === 0 ? (
								<div className="text-center py-8">
									<Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-400 text-sm">관심종목이 없습니다</p>
									<p className="text-gray-500 text-xs mt-1">
										탐색 탭에서 하트를 눌러 관심종목을 추가해보세요
									</p>
								</div>
							) : (
								stocks
									.filter((stock) => isInWatchlist(stock.symbol))
									.map((stock, index) => (
										<StockCard key={index} stock={stock} index={index} showFavorite={true} />
									))
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Stocks;
