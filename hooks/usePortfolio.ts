"use client";

import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useBitkubData } from "./useBitkubData";
import { useUserConfig } from "./useUserConfig";
import { useTransactions } from "./useTransactions";

const mockData = [
  { label: "Jan", totalInvested: 10000, value: 12000 },
  { label: "Feb", totalInvested: 20000, value: 25000 },
  { label: "Mar", totalInvested: 30000, value: 28000 },
  { label: "Apr", totalInvested: 40000, value: 45000 },
  { label: "May", totalInvested: 50000, value: 58000 },
  { label: "Jun", totalInvested: 60000, value: 72000 },
];

export function usePortfolio() {
  const [user, setUser] = useState<User | null>(null);

  // 1. ดึงข้อมูล Bitkub
  const bitkub = useBitkubData();

  // 2. ดึงคอนฟิกผู้ใช้
  const config = useUserConfig(user);

  // 3. ดึงรายการธุรกรรม
  const tx = useTransactions(user);

  // ติดตามสถานะ Login/Logout
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        bitkub.setActualBtcBalance(0);
        bitkub.setActualThbBalance(0);
      } else {
        bitkub.fetchMyBalance();
      }
    });

    return () => {
      unsubscribeAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🌟 ระบบคำนวณพอร์ตเชื่อมโยงข้อมูลจริงและทุนตั้งต้น
  const effectiveBtc = bitkub.actualBtcBalance > 0 ? bitkub.actualBtcBalance : tx.totalBtc;

  // ทุนรวมทั้งหมด = ทุนตั้งต้น + ทุนสะสมเพิ่มจากประวัติใหม่ในแอป
  const totalCostBasis = config.initialCapital + tx.totalInvested;

  // มูลค่ารวมปัจจุบัน = จำนวนเหรียญจริงจากกระเป๋า * ราคาตลาดล่าสุด
  const currentPortfolioValue = effectiveBtc * bitkub.currentBtcPrice;

  // คำนวณผลตอบแทน สุทธิ (บาท) และ (%)
  const profitOrLoss = currentPortfolioValue - totalCostBasis;
  const profitPercentage = totalCostBasis > 0 ? (profitOrLoss / totalCostBasis) * 100 : 0;

  // 🌟 ราคาต้นทุนเฉลี่ยจริงต่อ 1 BTC = ทุนรวมทั้งหมด / จำนวนเหรียญที่มีจริงในกระเป๋า
  const realAvgPrice = effectiveBtc > 0 ? totalCostBasis / effectiveBtc : 0;

  // คำนวณข้อมูลกราฟเติบโตจากประวัติจริงใน Firestore
  const chartData = useMemo(() => {
    const isLoggedIn = !!user;
    if (!isLoggedIn) {
      // สำหรับผู้ใช้ Guest ให้แสดง mockData เป็นตัวอย่าง
      return mockData;
    }

    if (tx.transactions.length === 0) {
      return [];
    }

    // คำนวณจำนวน BTC เริ่มต้น (เช่น ในกระเป๋า Bitkub มีมากกว่ายอดรวมจากธุรกรรมแสดงว่ามีส่วนเริ่มต้น)
    const totalBtcFromTxs = tx.transactions.reduce((sum, t) => sum + t.btcAmount, 0);
    const btcInitial = Math.max(0, effectiveBtc - totalBtcFromTxs);

    const dataPoints: { label: string; totalInvested: number; value: number }[] = [];

    // 1. จุดเริ่มต้น (อ้างอิงจากราคารายการแรก ย้อนกลับไป 1 วัน หรือใช้ราคาตลาด ณ ตอนนั้น)
    const firstTx = tx.transactions[0];
    const startPrice = firstTx ? firstTx.btcPriceAtBuy : bitkub.currentBtcPrice || 2000000;
    dataPoints.push({
      label: "เริ่มต้น",
      totalInvested: config.initialCapital,
      value: Math.round(btcInitial * startPrice + (btcInitial === 0 ? config.initialCapital : 0)),
    });

    let cumInvested = config.initialCapital;
    let cumBtc = btcInitial;

    // 2. จุดตามแต่ละรายการธุรกรรม
    tx.transactions.forEach((t) => {
      cumInvested += t.amountTHB;
      cumBtc += t.btcAmount;

      const txDate = t.date instanceof Date ? t.date : new Date();
      const day = String(txDate.getDate()).padStart(2, "0");
      const month = String(txDate.getMonth() + 1).padStart(2, "0");
      const dateLabel = `${day}/${month}`;

      dataPoints.push({
        label: dateLabel,
        totalInvested: cumInvested,
        value: Math.round(cumBtc * t.btcPriceAtBuy),
      });
    });

    // 3. จุดปัจจุบัน (ถ้ามีการเชื่อมโยงราคาปัจจุบันจากตลาด)
    if (bitkub.currentBtcPrice > 0) {
      dataPoints.push({
        label: "ปัจจุบัน",
        totalInvested: totalCostBasis,
        value: Math.round(currentPortfolioValue),
      });
    }

    return dataPoints;
  }, [
    tx.transactions,
    user,
    config.initialCapital,
    effectiveBtc,
    bitkub.currentBtcPrice,
    totalCostBasis,
    currentPortfolioValue,
  ]);

  return {
    user,
    // Bitkub states & functions
    currentBtcPrice: bitkub.currentBtcPrice,
    actualBtcBalance: bitkub.actualBtcBalance,
    actualThbBalance: bitkub.actualThbBalance,
    lastFetchTime: bitkub.lastFetchTime,
    fetchMyBalance: bitkub.fetchMyBalance,
    
    // User Config states & functions
    goalBtc: config.goalBtc,
    initialCapital: config.initialCapital,
    tempGoalBtc: config.tempGoalBtc,
    tempInitialCapital: config.tempInitialCapital,
    setTempGoalBtc: config.setTempGoalBtc,
    setTempInitialCapital: config.setTempInitialCapital,
    isSettingsOpen: config.isSettingsOpen,
    setIsSettingsOpen: config.setIsSettingsOpen,
    handleSaveSettings: config.handleSaveSettings,

    // Transactions states & functions
    transactions: tx.transactions,
    totalInvested: tx.totalInvested,
    totalBtc: tx.totalBtc,
    isSyncing: tx.isSyncing,
    isPurging: tx.isPurging,
    handleSyncHistory: tx.handleSyncHistory,
    handlePurgeSimulatedData: tx.handlePurgeSimulatedData,

    // Derived states
    effectiveBtc,
    totalCostBasis,
    currentPortfolioValue,
    profitOrLoss,
    profitPercentage,
    realAvgPrice,
    chartData,
  };
}
