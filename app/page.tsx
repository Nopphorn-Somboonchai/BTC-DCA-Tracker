"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "../lib/firebase"; // เช็ก Path ให้ตรงกับที่คุณใช้
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bitcoin, TrendingUp, Wallet, Target, ArrowUpRight, Pencil, Settings } from "lucide-react";
import AddTransaction from "../components/AddTransaction";
import AutoDCAConfig from "../components/AutoDCAConfig";
import LoginButton from "../components/ui/LoginButton"; // แก้ไข Path ป้องกันจอแดง
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import StatementModal from "../components/StatementModal";

// Mock Data สำหรับกราฟจำลอง
const mockData = [
  { label: 'Jan', totalInvested: 10000, value: 12000 },
  { label: 'Feb', totalInvested: 20000, value: 25000 },
  { label: 'Mar', totalInvested: 30000, value: 28000 },
  { label: 'Apr', totalInvested: 40000, value: 45000 },
  { label: 'May', totalInvested: 50000, value: 58000 },
  { label: 'Jun', totalInvested: 60000, value: 72000 },
];

export default function BTCDashboard() {
  // สร้างตัวแปรเก็บค่ารวมของพอร์ต
  const [transactions, setTransactions] = useState<{ id: string; amountTHB: number; btcAmount: number; btcPriceAtBuy: number; date: Date; type?: string }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [totalInvested, setTotalInvested] = useState(0);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [totalBtc, setTotalBtc] = useState(0);

  const [lastFetchTime, setLastFetchTime] = useState("");

  // การตั้งค่าเป้าหมาย (Goal)
  const [goalBtc, setGoalBtc] = useState<number>(0.1);
  const [tempGoalBtc, setTempGoalBtc] = useState<string>("0.1");

  // การตั้งค่าทุนตั้งต้น (Initial Capital)
  const [initialCapital, setInitialCapital] = useState<number>(30659);
  const [tempInitialCapital, setTempInitialCapital] = useState<string>("30659");

  // ควบคุมหน้าต่างตั้งค่า (Settings Modal)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // ตัวแปรเก็บราคา BTC ปัจจุบันจาก Bitkub
  const [currentBtcPrice, setCurrentBtcPrice] = useState(0);

  // 🟢 ยอดเงินจริงจากบัญชี Bitkub
  const [actualBtcBalance, setActualBtcBalance] = useState(0);
  const [actualThbBalance, setActualThbBalance] = useState(0);

  // 🌟 ระบบคำนวณพอร์ตเชื่อมโยงข้อมูลจริงและทุนตั้งต้น
  const effectiveBtc = actualBtcBalance > 0 ? actualBtcBalance : totalBtc;

  // ทุนรวมทั้งหมด = ทุนตั้งต้น + ทุนสะสมเพิ่มจากประวัติใหม่ในแอป
  const totalCostBasis = initialCapital + totalInvested;

  // มูลค่ารวมปัจจุบัน = จำนวนเหรียญจริงจากกระเป๋า * ราคาตลาดล่าสุด
  const currentPortfolioValue = effectiveBtc * currentBtcPrice;

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

    if (transactions.length === 0) {
      return [];
    }

    // คำนวณจำนวน BTC เริ่มต้น (เช่น ในกระเป๋า Bitkub มีมากกว่ายอดรวมจากธุรกรรมแสดงว่ามีส่วนเริ่มต้น)
    const totalBtcFromTxs = transactions.reduce((sum, tx) => sum + tx.btcAmount, 0);
    const btcInitial = Math.max(0, effectiveBtc - totalBtcFromTxs);

    const dataPoints: { label: string; totalInvested: number; value: number }[] = [];

    // 1. จุดเริ่มต้น (อ้างอิงจากราคารายการแรก ย้อนกลับไป 1 วัน หรือใช้ราคาตลาด ณ ตอนนั้น)
    const firstTx = transactions[0];
    const startPrice = firstTx ? firstTx.btcPriceAtBuy : currentBtcPrice || 2000000;
    dataPoints.push({
      label: "เริ่มต้น",
      totalInvested: initialCapital,
      value: Math.round(btcInitial * startPrice + (btcInitial === 0 ? initialCapital : 0)),
    });

    let cumInvested = initialCapital;
    let cumBtc = btcInitial;

    // 2. จุดตามแต่ละรายการธุรกรรม
    transactions.forEach((tx) => {
      cumInvested += tx.amountTHB;
      cumBtc += tx.btcAmount;

      const txDate = tx.date instanceof Date ? tx.date : new Date();
      const day = String(txDate.getDate()).padStart(2, '0');
      const month = String(txDate.getMonth() + 1).padStart(2, '0');
      const dateLabel = `${day}/${month}`;

      dataPoints.push({
        label: dateLabel,
        totalInvested: cumInvested,
        value: Math.round(cumBtc * tx.btcPriceAtBuy),
      });
    });

    // 3. จุดปัจจุบัน (ถ้ามีการเชื่อมโยงราคาปัจจุบันจากตลาด)
    if (currentBtcPrice > 0) {
      dataPoints.push({
        label: "ปัจจุบัน",
        totalInvested: totalCostBasis,
        value: Math.round(currentPortfolioValue),
      });
    }

    return dataPoints;
  }, [transactions, user, initialCapital, effectiveBtc, currentBtcPrice, totalCostBasis, currentPortfolioValue]);

  // โหลดค่าเป้าหมายและทุนตั้งต้นของ Guest จาก localStorage ตอนเริ่มต้น
  useEffect(() => {
    const guestGoal = localStorage.getItem("dca_goal_guest");
    if (guestGoal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoalBtc(Number(guestGoal));
      setTempGoalBtc(guestGoal);
    }
    const guestCapital = localStorage.getItem("dca_initial_capital_guest");
    if (guestCapital) {
      setInitialCapital(Number(guestCapital));
      setTempInitialCapital(guestCapital);
    }
  }, []);

  // 🟢 ฟังก์ชันขอดูยอดเงินในบัญชี Bitkub
  const fetchMyBalance = async () => {
    try {
      const res = await fetch('/api/bitkub-balance', { method: 'POST' });
      const data = await res.json();

      console.log("🕵️ ข้อมูลกระเป๋าจาก Bitkub:", data);

      if (data && data.code === "0" && data.data) {
        const btcWallet = data.data.find((coin: { currency: string; available?: string | number }) => coin.currency === "BTC");
        const thbWallet = data.data.find((coin: { currency: string; available?: string | number }) => coin.currency === "THB");

        if (btcWallet) setActualBtcBalance(Number(btcWallet.available || 0));
        if (thbWallet) setActualThbBalance(Number(thbWallet.available || 0));

        const now = new Date();
        setLastFetchTime(now.toTimeString().split(' ')[0]);
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
      ws = new WebSocket(
        "wss://api.bitkub.com/websocket-api/market.ticker.thb_btc"
      );

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.last) {
          setCurrentBtcPrice(data.last);
          const now = new Date();
          setLastFetchTime(now.toTimeString().split(' ')[0]);
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

  // ดึงข้อมูล Real-time ทันทีที่ล็อกอิน และดึงการตั้งค่าผู้ใช้
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // ยกเลิก snapshot subscription เก่าหากมี
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        setUser(user);
        fetchMyBalance();
        const q = query(collection(db, "transactions"), where("userId", "==", user.uid));

        unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
          let sumInvested = 0;
          let sumBtc = 0;
          const txList: { id: string; amountTHB: number; btcAmount: number; btcPriceAtBuy: number; date: Date; type?: string }[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // ป้องกันปัญหา Type mismatch (เช่น string จาก Firebase) และรองรับชื่อ Field ทั้งแบบพิมพ์เล็ก/ใหญ่/ย่อ
            const amountTHB = Number(
              data.amountTHB !== undefined ? data.amountTHB : 
              (data.amountThb !== undefined ? data.amountThb : 
              (data.amount !== undefined ? data.amount : 0))
            );
            const btcAmount = Number(
              data.btcAmount !== undefined ? data.btcAmount : 
              (data.btc !== undefined ? data.btc : 0)
            );
            const btcPriceAtBuy = Number(
              data.btcPriceAtBuy !== undefined ? data.btcPriceAtBuy : 
              (data.btcPrice !== undefined ? data.btcPrice : 
              (data.price !== undefined ? data.price : 0))
            );

            sumInvested += amountTHB;
            sumBtc += btcAmount;

            // จัดการข้อมูลวันที่ให้รองรับทั้ง Timestamp, Date, String, หรือ Unix Milliseconds
            let txDate: Date;
            if (data.date) {
              if (typeof data.date.toDate === 'function') {
                txDate = data.date.toDate();
              } else if (data.date instanceof Date) {
                txDate = data.date;
              } else if (typeof data.date === 'string' || typeof data.date === 'number') {
                txDate = new Date(data.date);
              } else if (data.date.seconds !== undefined) {
                txDate = new Date(data.date.seconds * 1000 + (data.date.nanoseconds || 0) / 1000000);
              } else {
                txDate = new Date();
              }
            } else {
              txDate = new Date();
            }

            const type = data.type || "AddTransaction";

            txList.push({
              id: doc.id,
              amountTHB,
              btcAmount,
              btcPriceAtBuy,
              date: txDate,
              type,
            });
          });

          // เรียงลำดับจากเก่าไปใหม่ (โครโนโลยี)
          txList.sort((a, b) => a.date.getTime() - b.date.getTime());

          setTransactions(txList);
          setTotalInvested(sumInvested);
          setTotalBtc(sumBtc);
        });

        // ดึงการตั้งค่าจาก Firestore (เป้าหมาย และ ทุนตั้งต้น)
        const docRef = doc(db, "user_configs", user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.goalBtc != null) {
              setGoalBtc(Number(data.goalBtc));
              setTempGoalBtc(data.goalBtc.toString());
            }
            if (data.initialCapital != null) {
              setInitialCapital(Number(data.initialCapital));
              setTempInitialCapital(data.initialCapital.toString());
            }
          } else {
            const localGoal = localStorage.getItem(`dca_goal_${user.uid}`);
            if (localGoal) {
              setGoalBtc(Number(localGoal));
              setTempGoalBtc(localGoal);
            }
            const localCapital = localStorage.getItem(`dca_initial_capital_${user.uid}`);
            if (localCapital) {
              setInitialCapital(Number(localCapital));
              setTempInitialCapital(localCapital);
            }
          }
        } catch (err) {
          console.error("ดึงข้อมูลการตั้งค่าไม่สำเร็จ:", err);
          const localGoal = localStorage.getItem(`dca_goal_${user.uid}`);
          if (localGoal) {
            setGoalBtc(Number(localGoal));
            setTempGoalBtc(localGoal);
          }
          const localCapital = localStorage.getItem(`dca_initial_capital_${user.uid}`);
          if (localCapital) {
            setInitialCapital(Number(localCapital));
            setTempInitialCapital(localCapital);
          }
        }
      } else {
        setUser(null);
        setTransactions([]);
        setTotalInvested(0);
        setTotalBtc(0);
        setActualBtcBalance(0);
        setActualThbBalance(0);

        const guestGoal = localStorage.getItem("dca_goal_guest");
        if (guestGoal) {
          setGoalBtc(Number(guestGoal));
          setTempGoalBtc(guestGoal);
        } else {
          setGoalBtc(0.1);
          setTempGoalBtc("0.1");
        }

        const guestCapital = localStorage.getItem("dca_initial_capital_guest");
        if (guestCapital) {
          setInitialCapital(Number(guestCapital));
          setTempInitialCapital(guestCapital);
        } else {
          setInitialCapital(30659);
          setTempInitialCapital("30659");
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCapital = parseFloat(tempInitialCapital);
    const parsedGoal = parseFloat(tempGoalBtc);

    if (isNaN(parsedCapital) || parsedCapital < 0) {
      alert("กรุณากรอกทุนตั้งต้นให้ถูกต้อง (ต้องเป็น 0 หรือมากกว่า)");
      return;
    }

    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      alert("กรุณากรอกเป้าหมายสะสม BTC ที่มากกว่า 0");
      return;
    }

    setInitialCapital(parsedCapital);
    setGoalBtc(parsedGoal);
    setIsSettingsOpen(false);

    const user = auth.currentUser;
    const capitalKey = user ? `dca_initial_capital_${user.uid}` : "dca_initial_capital_guest";
    const goalKey = user ? `dca_goal_${user.uid}` : "dca_goal_guest";

    localStorage.setItem(capitalKey, parsedCapital.toString());
    localStorage.setItem(goalKey, parsedGoal.toString());

    if (user) {
      try {
        await setDoc(doc(db, "user_configs", user.uid), {
          initialCapital: parsedCapital,
          goalBtc: parsedGoal,
        }, { merge: true });
      } catch (err) {
        console.error("บันทึกการตั้งค่าใน Firestore ไม่สำเร็จ:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white p-4 md:p-8 font-sans">

      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Bitcoin size={40} color="#F7931A" />
          <h1 className="text-3xl font-bold tracking-tight">BTC DCA Tracker</h1>
        </div>

        <div className="flex flex-col items-end flex-1">
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/50 px-4 py-2 rounded-lg shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-gray-400 text-sm font-medium hidden sm:inline">ราคา Bitkub ตอนนี้:</span>

            <span className="text-[#F7931A] text-2xl font-bold font-mono tracking-tight">
              ฿ {currentBtcPrice > 0 ? currentBtcPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "กำลังโหลด..."}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            อัปเดตล่าสุด: {lastFetchTime || "-"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AutoDCAConfig currentPrice={currentBtcPrice} />
          <AddTransaction currentPrice={currentBtcPrice} />
          <button
            onClick={() => {
              setTempInitialCapital(initialCapital.toString());
              setTempGoalBtc(goalBtc.toString());
              setIsSettingsOpen(true);
            }}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-gray-300 hover:text-[#F7931A] rounded-md transition-colors"
            title="การตั้งค่า"
          >
            <Settings className="h-5 w-5" />
          </button>
          <LoginButton />
        </div>
      </header>

      {/* 1. Top Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Card 1: Total Value */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">มูลค่าพอร์ตปัจจุบัน (THB)</CardTitle>
            <Wallet className="h-4 w-4 text-[#F7931A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F7931A]">
              ฿ {currentPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs flex items-center mt-1 ${profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <ArrowUpRight className={`h-3 w-3 mr-1 ${profitOrLoss >= 0 ? '' : 'rotate-90'}`} />
              {profitOrLoss >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}% จากทุน ({profitOrLoss >= 0 ? '+' : ''}{profitOrLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB)
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Total Invested */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
            <CardTitle className="text-sm font-medium text-gray-400">ต้นทุนรวมที่ DCA (THB)</CardTitle>
            <button
              onClick={() => {
                setTempInitialCapital(initialCapital.toString());
                setTempGoalBtc(goalBtc.toString());
                setIsSettingsOpen(true);
              }}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-[#F7931A] transition-colors bg-zinc-800/80 hover:bg-zinc-700 px-2 py-1 rounded"
              title="ปรับทุนเริ่มต้น"
            >
              <Pencil className="h-3 w-3" /> ตั้งค่าทุนเริ่มต้น
            </button>
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold">฿ {totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-gray-500 mt-1">
                (ทุนเริ่ม: ฿ {initialCapital.toLocaleString()} + สะสม: ฿ {totalInvested.toLocaleString()})
              </p>
            </div>
            <button
              onClick={() => setIsStatementOpen(true)}
              className="text-xs flex items-center gap-1.5 text-gray-300 hover:text-[#F7931A] transition-colors bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 hover:border-[#F7931A]/50 px-3 py-2 rounded-md font-medium shadow-sm shadow-black/20 shrink-0"
              title="ดูประวัติการทำรายการ"
            >
              ดู Statement
            </button>
          </CardContent>
        </Card>

        {/* Card 3: BTC ในกระเป๋า */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">BTC ในกระเป๋า (Bitkub)</CardTitle>
            <Bitcoin className="h-4 w-4 text-[#F7931A]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectiveBtc.toFixed(8)}</div>
            <p className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>เงินสดพร้อมซื้อ: ฿ {actualThbBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Average Price */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">ราคาต้นทุนเฉลี่ย (THB/BTC)</CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿ {realAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800 text-white lg:col-span-2">
          <CardHeader>
            <CardTitle>การเติบโตของพอร์ต (Portfolio Growth)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#a1a1aa"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `฿${(value / 1000).toFixed(0)}k`;
                      return `฿${value}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F0F0F', borderColor: '#27272a', color: '#fff' }}
                    itemStyle={{ color: '#F7931A' }}
                    formatter={(value: unknown) => [`฿${Number(value).toLocaleString()}`, ""]}
                  />
                  <Line type="monotone" dataKey="value" name="มูลค่าปัจจุบัน" stroke="#F7931A" strokeWidth={3} dot={{ r: 4, fill: "#F7931A" }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="totalInvested" name="ต้นทุนสะสม" stroke="#71717a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              {/* Overlay for Guest Mode */}
              {!user && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg border border-zinc-800">
                  <div className="text-center p-6 bg-zinc-950/85 border border-zinc-800 rounded-xl max-w-xs shadow-2xl">
                    <TrendingUp className="h-10 w-10 text-[#F7931A] mx-auto mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold mb-1">ติดตามการเติบโตพอร์ต</h3>
                    <p className="text-sm text-gray-400 mb-4">เข้าสู่ระบบเพื่อบันทึกประวัติ DCA และดูแนวโน้มการเติบโตของพอร์ตจริงของคุณ</p>
                    <div className="flex justify-center">
                      <LoginButton />
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state when Logged In but no transactions */}
              {user && transactions.length === 0 && (
                <div className="absolute inset-0 bg-[#0F0F0F]/90 flex flex-col items-center justify-center rounded-lg border border-zinc-800 border-dashed p-6">
                  <TrendingUp className="h-10 w-10 text-zinc-500 mb-3" />
                  <h3 className="text-lg font-bold mb-1 text-zinc-300">ยังไม่มีข้อมูลประวัติ DCA</h3>
                  <p className="text-sm text-zinc-500 mb-4 text-center max-w-xs">
                    เพิ่มข้อมูลประวัติ DCA รายการแรกโดยใช้ปุ่ม &quot;+ บันทึกประวัติ DCA&quot; เพื่อเริ่มแสดงกราฟเติบโตพอร์ต
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Goal Section */}
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>เป้าหมาย DCA (Goal)</CardTitle>
            <button
              onClick={() => {
                setTempInitialCapital(initialCapital.toString());
                setTempGoalBtc(goalBtc.toString());
                setIsSettingsOpen(true);
              }}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-[#F7931A] transition-colors bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded"
            >
              <Pencil className="h-3.5 w-3.5" /> ปรับเป้าหมาย
            </button>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[300px]">
            <div className="text-center mb-6">
              <div className="text-5xl font-extrabold text-[#F7931A] mb-2">
                {goalBtc > 0 ? ((effectiveBtc / goalBtc) * 100).toFixed(1) : "0.0"}%
              </div>
              <p className="text-gray-400 text-sm">ความคืบหน้าสู่เป้าหมาย {goalBtc} BTC</p>
            </div>

            <Progress
              value={goalBtc > 0 ? Math.min((effectiveBtc / goalBtc) * 100, 100) : 0}
              className="h-3 bg-zinc-800 mb-4 [&>div]:bg-[#F7931A]"
            />

            <div className="flex justify-between text-sm text-gray-400">
              <span>ปัจจุบัน: {effectiveBtc.toFixed(8)} BTC</span>
              <span>เป้าหมาย: {goalBtc} BTC</span>
            </div>

            <div className="mt-8 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <h4 className="text-sm font-medium mb-1">💡 สรุปสถานะ</h4>
              <div className="text-xs text-gray-400 leading-relaxed">
                {effectiveBtc >= goalBtc ? (
                  <span className="text-green-400 font-semibold">ยินดีด้วย! คุณสะสม BTC ได้ถึงหรือเกินเป้าหมายที่คุณตั้งไว้แล้ว 🎉</span>
                ) : effectiveBtc > 0 ? (
                  <>
                    คุณยังขาดอีก <span className="text-white font-semibold">{(goalBtc - effectiveBtc).toFixed(8)} BTC</span> หากมีวินัย DCA ต่อไป เป้าหมายอยู่ไม่ไกลแน่นอน!
                  </>
                ) : (
                  <>คุณยังไม่มีรายการ DCA บันทึกสะสม เริ่มการบันทึกเพื่อแสดงผลสถานะเป้าหมาย</>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Modal Overlay (จะแสดงเมื่อ isSettingsOpen = true) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-150 text-white">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
              <Settings className="h-6 w-6 text-[#F7931A]" />
              <h2 className="text-xl font-bold">ตั้งค่าการติดตามพอร์ต</h2>
            </div>

            <form onSubmit={handleSaveSettings}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">ทุนตั้งต้น (THB)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={tempInitialCapital}
                    onChange={(e) => setTempInitialCapital(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] text-lg font-semibold font-mono"
                    placeholder="เช่น 30659"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ทุนก้อนแรกที่ลงไปก่อนเริ่มใช้แอปพลิเคชัน เพื่อให้การคำนวณต้นทุนรวมและผลตอบแทนถูกต้อง
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">เป้าหมายสะสม BTC (Goal)</label>
                  <div className="relative flex items-center gap-2">
                    <input
                      type="number"
                      required
                      step="0.0001"
                      min="0.0001"
                      value={tempGoalBtc}
                      onChange={(e) => setTempGoalBtc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] text-lg font-semibold font-mono"
                      placeholder="เช่น 0.1"
                    />
                    <span className="font-bold text-zinc-400 pr-2">BTC</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    จำนวน BTC เป้าหมายที่คุณต้องการสะสมให้สำเร็จ
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F7931A] text-black font-bold rounded-lg hover:bg-orange-500 transition-colors flex items-center gap-1.5 shadow-lg shadow-orange-500/10"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal Overlay */}
      <StatementModal
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        transactions={transactions}
      />
    </div>
  );
}
