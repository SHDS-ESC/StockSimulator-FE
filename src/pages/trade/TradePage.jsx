import { useEffect, useMemo, useState } from "react";
import UnifiedChart from "../../components/UnifiedChart";
import axios from "../../util/axiosInstance";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function TradePage() {
  const url = new URL(window.location.href);
  const qy = Number(url.searchParams.get('y')) || null;
  const qm = Number(url.searchParams.get('m')) || null;
  const qd = Number(url.searchParams.get('d')) || null;

  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [simDate] = useState({ year: qy, month: qm, day: qd });

  const [symbols, setSymbols] = useState([]); // {ticker,name,sector,industry}[]
  const [openSearch, setOpenSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // 즐겨찾기 기능 제거

  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [priceChangePct, setPriceChangePct] = useState(null);

  // 심볼 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/db/symbols");
        const list = res?.data?.symbols || [];
        if (mounted) setSymbols(list);
      } catch (_) {
        if (mounted) setSymbols([]);
      }
    })();
    return () => { mounted = false };
  }, []);

  const filteredSymbols = useMemo(() => {
    const q = String(searchQuery || "").trim().toLowerCase();
    let base = symbols;
    if (!q) return base; // 전체 노출 (필요시 UI에서 스크롤)
    return base.filter(s => (
      String(s.ticker).toLowerCase().includes(q) ||
      String(s.name || s.security || "").toLowerCase().includes(q) ||
      String(s.sector || "").toLowerCase().includes(q) ||
      String(s.industry || "").toLowerCase().includes(q)
    ));
  }, [searchQuery, symbols]);

  const onPickSymbol = (it) => {
    setSymbol(it.ticker);
    setCompanyName(it.name || it.security || "");
    setSelectedSector(it.sector || "");
    setSelectedIndustry(it.industry || "");
    setOpenSearch(false);
  };

  // 즐겨찾기 관련 로직 제거

  // 선택 날짜 기반 가격 계산: 시가(currentOpen) vs 전일 종가(prevClose)
  useEffect(() => {
    if (!symbol || !simDate.year || !simDate.month || !simDate.day) {
      setCurrentPrice(null); setPriceChange(null); setPriceChangePct(null);
      return;
    }
    const base = new Date(Date.UTC(simDate.year, (simDate.month - 1), simDate.day));
    const selectedEpoch = Math.floor(base.getTime() / 1000);
    const prevEpoch = selectedEpoch - 86400;

    const fetchPrices = async () => {
      try {
        // 현재 구간: 선택일 포함 이후 7일 내 첫 거래일의 시가
        const curFrom = prevEpoch; // 하루 전부터
        const curTo = selectedEpoch + 86400 * 7;
        const prevFrom = prevEpoch - 86400 * 7;
        const prevTo = prevEpoch;

        const [curRes, prevRes] = await Promise.all([
          axios.get('/db/candles', { params: { ticker: symbol, from: curFrom, to: curTo } }),
          axios.get('/db/candles', { params: { ticker: symbol, from: prevFrom, to: prevTo } }),
        ]);

        const curT = curRes?.data?.t || [];
        const curO = curRes?.data?.o || [];
        const curD = curRes?.data?.d || [];
        // 선택일 당일 또는 이후 첫 거래일 찾기
        let currentOpen = null;
        for (let i = 0; i < curT.length; i++) {
          if (curT[i] >= selectedEpoch) { currentOpen = curO[i]; break; }
        }

        const prevT = prevRes?.data?.t || [];
        const prevC = prevRes?.data?.c || [];
        // 전일 이전 구간에서 마지막 거래일 종가
        let prevClose = null;
        for (let i = prevT.length - 1; i >= 0; i--) {
          if (prevT[i] <= prevEpoch) { prevClose = prevC[i]; break; }
        }

        if (typeof currentOpen === 'number' && typeof prevClose === 'number') {
          const chg = currentOpen - prevClose;
          const pct = prevClose !== 0 ? (chg / prevClose) * 100 : 0;
          setCurrentPrice(currentOpen);
          setPriceChange(chg);
          setPriceChangePct(pct);
        } else {
          setCurrentPrice(null); setPriceChange(null); setPriceChangePct(null);
        }
      } catch (_) {
        setCurrentPrice(null); setPriceChange(null); setPriceChangePct(null);
      }
    };

    fetchPrices();
  }, [symbol, simDate.year, simDate.month, simDate.day]);

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            className="field"
            readOnly
            value={symbol ? `${symbol}${companyName ? ` · ${companyName}` : ''}` : "티커/회사명/섹터/산업 검색"}
            onClick={() => setOpenSearch(true)}
          />
        </div>
        {null}
      </div>

      {/* 검색 모달 */}
      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        {/* 시각 숨김용 제목/설명 (접근성) */}
        <div style={{ display: 'none' }}>
          <h2 id="search-title">티커 검색</h2>
          <p id="search-desc">티커, 회사명, 섹터, 산업으로 검색</p>
        </div>
        <CommandInput placeholder="검색어 입력 (티커/회사명/섹터/산업)" value={searchQuery} onValueChange={setSearchQuery} />
        <CommandList>
          <CommandSeparator />
          <CommandEmpty>결과 없음</CommandEmpty>
          <CommandGroup heading="검색 결과">
            {filteredSymbols.map((it) => (
              <CommandItem key={it.ticker} onSelect={() => onPickSymbol(it)}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 600 }}>{it.name || it.security}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      {it.sector ? <Badge variant="outline">{it.sector}</Badge> : null}
                      {it.industry ? <Badge variant="outline">{it.industry}</Badge> : null}
                    </div>
                  </div>
                  {/* 즐겨찾기 버튼 제거 */}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* 선택 정보 카드 */}
      {symbol && (
        <div className="card" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="text-lg font-bold">{symbol}</div>
            <div className="text-muted-foreground">{companyName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {typeof currentPrice === 'number' ? (
              <>
                <div className="text-lg font-bold">{currentPrice.toFixed(2)}</div>
                {typeof priceChange === 'number' && typeof priceChangePct === 'number' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: (priceChange >= 0 ? '#10b981' : '#ef4444') }}>
                    {priceChange >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{priceChange.toFixed(2)} ({priceChangePct.toFixed(2)}%)</span>
                  </div>
                ) : (
                  <div className="text-muted-foreground">등락률 계산 불가</div>
                )}
                {(selectedSector || selectedIndustry) && (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                    {selectedSector ? <Badge variant="outline">{selectedSector}</Badge> : null}
                    {selectedIndustry ? <Badge variant="outline">{selectedIndustry}</Badge> : null}
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">선택한 날짜의 데이터 없음</div>
            )}
          </div>
      </div>
      )}

      {symbol ? (
      <div style={{ marginTop: 8 }}>
        <UnifiedChart
            symbol={symbol}
          defaultMode="historical"
          autoLoad={true}
            initialYear={simDate.year}
            initialMonth={simDate.month}
            initialDay={simDate.day}
        />
      </div>
      ) : (
        <div className="card" style={{ marginTop: 8, textAlign: 'center', color: '#666' }}>
          종목을 선택하면 차트가 표시됩니다
        </div>
      )}
    </div>
  );
}

