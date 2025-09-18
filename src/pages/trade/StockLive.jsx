import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { TradeRealtimeWidget } from "../../components/UnifiedChart";
import axiosInstance from "../../util/axiosInstance";
import { Button } from "@/components/ui/button";
import useDateStore from "@/store/useDateStore";
import useLoginStore from "@/store/useLoginStore";

export default function StockLive() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const s = String(symbol || "").toUpperCase();
  const [price, setPrice] = useState(null);
  const [prevClose, setPrevClose] = useState(null);
  const [err, setErr] = useState(null);
  const { currentDate } = useDateStore();
  const { lastProfileId } = useLoginStore();
  const [quantity, setQuantity] = useState(0);

  const handleUpdateStockAmount = async (type, quantity) => {
    try {
       const isoDate =
      currentDate instanceof Date
        ? currentDate.toISOString().slice(0, 10)
        : currentDate;           
      await axiosInstance.post(
        `offer/update`,
        {
          price: price,
          offerDate: isoDate,
          usersProfileId: lastProfileId,
          stock: s,
          type: type,
          quantity: quantity,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }
  };

  const change = useMemo(() => {
    if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(prevClose)))
      return null;
    return Number(price) - Number(prevClose);
  }, [price, prevClose]);
  const changePct = useMemo(() => {
    if (
      !Number.isFinite(Number(price)) ||
      !Number.isFinite(Number(prevClose)) ||
      Number(prevClose) === 0
    )
      return null;
    return (Number(price) / Number(prevClose) - 1) * 100;
  }, [price, prevClose]);

  useEffect(() => {
    let timer = null;
    if (!s) {
      setErr("심볼 없음");
      setPrice(null);
      setPrevClose(null);
      return;
    }
    const fetchFromRedis = async () => {
      try {
        const res = await axiosInstance.get(`/market/redis/stock/${s}`);
        const data = res?.data;
        if (!data) {
          setErr("데이터 없음");
          return;
        }
        const cur = parseFloat(String(data.price || "").replace("$", ""));
        const chg = parseFloat(String(data.change || "").replace("+", ""));
        const prev =
          Number.isFinite(cur) && Number.isFinite(chg) ? cur - chg : null;
        setPrice(Number.isFinite(cur) ? cur : null);
        setPrevClose(Number.isFinite(prev) ? prev : null);
        setErr(null);
      } catch (_) {
        setErr("Redis에서 가격을 불러오지 못했습니다.");
      }
    };

    fetchFromRedis();

    // 자동 갱신은 스케줄러에 맡김: 주기 요청 제거
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [s]);
  const handleDecrease = () => {
    setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };
  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 12 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", width: "100%" }}
        >
          <strong style={{ fontSize: 18 }}>{s || "LIVE"}</strong>
          <button className="btn" onClick={() => navigate(-1)}>
            뒤로
          </button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="muted">현재가</span>
          <strong>
            {Number.isFinite(Number(price)) ? Number(price).toFixed(2) : "-"}
          </strong>
          <span className="muted">전일대비</span>
          <span style={{ color: (change ?? 0) >= 0 ? "#26a69a" : "#ef5350" }}>
            {Number.isFinite(Number(change))
              ? `${change.toFixed(2)} (${Number(changePct).toFixed(2)}%)`
              : "-"}
          </span>
          {err && <span className="muted">{err}</span>}
        </div>
      </div>
      <div style={{ height: 600 }}>
        <TradeRealtimeWidget symbol={s} />
      </div>
      <div className=" flex items-center space-x-2 mt-4">
        {/* 차트는 상단에 있다고 가정 */}

        <button
          onClick={handleDecrease}
          className="bg-gray-200 hover:bg-gray-300 text-xl font-bold px-3 py-1 rounded"
        >
          -
        </button>

        <div className="text-white w-12 text-center border rounded px-2 py-1">
          {quantity}
        </div>

        <button
          onClick={handleIncrease}
          className="bg-gray-200 hover:bg-gray-300 text-xl font-bold px-3 py-1 rounded"
        >
          +
        </button>
      </div>

      <div className="flex gap-4 h-[3rem] mb-5">
        <Button
          className="w-full h-full rounded-[0.8rem] text-[20px]"
          variant="confirm"
          onClick={() => handleUpdateStockAmount("BUY", quantity)}
        >
          구매
        </Button>
        <Button
          className="w-full h-full rounded-[0.8rem] text-[20px]"
          variant="destructive"
          onClick={() => handleUpdateStockAmount("SELL", quantity)}
        >
          판매
        </Button>
      </div>
    </div>
  );
}
