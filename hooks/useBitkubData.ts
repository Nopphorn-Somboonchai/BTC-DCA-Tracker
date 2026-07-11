"use client";

import { useState, useEffect } from "react";

export function useBitkubData() {
  const [currentBtcPrice, setCurrentBtcPrice] = useState<number>(0);
  const [actualBtcBalance, setActualBtcBalance] = useState<number>(0);
  const [actualThbBalance, setActualThbBalance] = useState<number>(0);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");

  // 🟢 ฟังก์ชันขอดูยอดเงินในบัญชี Bitkub
  const fetchMyBalance = async () => {
    try {
      const res = await fetch("/api/bitkub-balance", { method: "POST" });
      const data = await res.json();

      console.log("🕵️ ข้อมูลกระเป๋าจาก Bitkub:", data);

      if (data && data.code === "0" && data.data) {
        const btcWallet = data.data.find(
          (coin: { currency: string; available?: string | number }) => coin.currency === "BTC"
        );
        const thbWallet = data.data.find(
          (coin: { currency: string; available?: string | number }) => coin.currency === "THB"
        );

        if (btcWallet) setActualBtcBalance(Number(btcWallet.available || 0));
        if (thbWallet) setActualThbBalance(Number(thbWallet.available || 0));

        const now = new Date();
        setLastFetchTime(now.toTimeString().split(" ")[0]);
      }
    } catch (error) {
      console.error("ดึงยอดเงินพลาด:", error);
    }
  };

  // ดึงราคาจาก Bitkub API (WebSocket)
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket("wss://api.bitkub.com/websocket-api/market.ticker.thb_btc");

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.last) {
          setCurrentBtcPrice(data.last);
          const now = new Date();
          setLastFetchTime(now.toTimeString().split(" ")[0]);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  return {
    currentBtcPrice,
    actualBtcBalance,
    actualThbBalance,
    lastFetchTime,
    fetchMyBalance,
    setActualBtcBalance,
    setActualThbBalance,
  };
}
