"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, collection, addDoc, onSnapshot } from "firebase/firestore";
import { Clock, Calendar, DollarSign, RefreshCw, X } from "lucide-react";

interface AutoDCAConfigProps {
  currentPrice: number;
}

interface AutoDCAConfigData {
  userId?: string;
  amountTHB: number;
  purchaseTime: string;
  interval: string;
  maxOccurrences: number;
  completedOccurrences?: number;
  lastExecuted?: { toDate?: () => Date } | Date | null;
  nextExecutionTime?: { toDate?: () => Date } | Date | null;
  isActive: boolean;
  updatedAt?: { toDate?: () => Date } | Date;
}

// ฟังก์ชันคำนวณเวลาการเข้าซื้อรอบถัดไป
function calculateNextExecutionTime(purchaseTime: string, interval: string, referenceDate: Date): Date {
  const [hours, minutes] = purchaseTime.split(":").map(Number);
  const nextDate = new Date(referenceDate);
  nextDate.setHours(hours, minutes, 0, 0);

  // ถ้าเวลาที่คำนวณได้เป็นอดีตหรือเท่ากับปัจจุบัน ให้ขยับไปรอบถัดไปตามความถี่
  if (nextDate <= referenceDate) {
    if (interval === "day") {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (interval === "week") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (interval === "month") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  }
  return nextDate;
}

export default function AutoDCAConfig({ currentPrice }: AutoDCAConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // State สำหรับเก็บค่าฟอร์มตามเงื่อนไข
  const [amountTHB, setAmountTHB] = useState("");
  const [purchaseTime, setPurchaseTime] = useState("09:00"); // เวลาเริ่มต้น 09:00 น.
  const [interval, setInterval] = useState("week"); // day, week, month
  const [maxOccurrences, setMaxOccurrences] = useState(""); // จำนวนครั้ง (วัน)

  const [isActive, setIsActive] = useState(false); // สถานะเปิด/ปิดบอท
  const [config, setConfig] = useState<AutoDCAConfigData | null>(null); // ข้อมูลการตั้งค่าบอทแบบเรียลไทม์

  // ซิงค์ตั้งค่าเดิมจาก Firestore (แบบ Realtime) เมื่อล็อกอิน
  useEffect(() => {
    let unsubscribeConfig: (() => void) | null = null;

    const subscribe = () => {
      if (auth.currentUser) {
        const docRef = doc(db, "auto_dca_configs", auth.currentUser.uid);
        unsubscribeConfig = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAmountTHB(data.amountTHB?.toString() || "");
            setPurchaseTime(data.purchaseTime || "09:00");
            setInterval(data.interval || "week");
            setMaxOccurrences(data.maxOccurrences?.toString() || "");
            setIsActive(data.isActive || false);
            setConfig(data as AutoDCAConfigData);
          } else {
            setConfig(null);
          }
        });
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeConfig) {
        unsubscribeConfig();
        unsubscribeConfig = null;
      }
      if (user) {
        subscribe();
      } else {
        setConfig(null);
        setAmountTHB("");
        setPurchaseTime("09:00");
        setInterval("week");
        setMaxOccurrences("");
        setIsActive(false);
      }
    });

    return () => {
      if (unsubscribeConfig) unsubscribeConfig();
      unsubscribeAuth();
    };
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("กรุณาล็อกอินก่อนตั้งค่าระบบอัตโนมัติครับ!");
      return;
    }

    if (currentPrice <= 0) {
      alert("ระบบกำลังดึงราคา BTC ล่าสุด กรุณารอสักครู่แล้วกดบันทึกใหม่อีกครั้งครับ");
      return;
    }

    const thb = parseFloat(amountTHB);
    const occurrences = parseInt(maxOccurrences);

    if (isNaN(thb) || thb <= 0 || isNaN(occurrences) || occurrences <= 0) {
      alert("กรุณากรอกข้อมูลตัวเลขให้ถูกต้องและมากกว่า 0");
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const nextExecutionTime = calculateNextExecutionTime(purchaseTime, interval, now);

      // บันทึกแผนการลงทุนลง Firestore (ไม่บันทึกยอดสะสมทันที รอจนถึงเวลาที่กำหนด)
      await setDoc(doc(db, "auto_dca_configs", auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        amountTHB: thb,
        purchaseTime: purchaseTime,
        interval: interval,
        maxOccurrences: occurrences,
        completedOccurrences: 0,
        lastExecuted: null,
        nextExecutionTime: nextExecutionTime,
        isActive: true, // เปิดใช้งานบอททันทีที่บันทึก
        updatedAt: now,
      });

      setIsActive(true);
      setIsOpen(false);
      alert("บันทึกแผน Auto DCA สำเร็จ! บอทจะเริ่มซื้อและบันทึกประวัติเมื่อถึงกำหนดเวลา 🤖");
    } catch (error) {
      console.error("Error saving Auto DCA config:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
    setLoading(false);
  };

  const handleStopBot = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "auto_dca_configs", auth.currentUser.uid), {
        isActive: false
      }, { merge: true });
      setIsActive(false);
      alert("ปิดการทำงานระบบ Auto DCA ชั่วคราวแล้ว");
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // ระบบ Scheduler คอยตรวจสอบเวลาและบันทึกรายการ
  useEffect(() => {
    if (!config || !config.isActive || !auth.currentUser || currentPrice <= 0) return;

    const checkAndExecute = async () => {
      const now = new Date();
      const nextTime = config.nextExecutionTime
        ? (typeof (config.nextExecutionTime as any).toDate === 'function'
            ? (config.nextExecutionTime as any).toDate()
            : new Date(config.nextExecutionTime as any))
        : null;

      if (nextTime && now >= nextTime) {
        try {
          const docRef = doc(db, "auto_dca_configs", auth.currentUser!.uid);

          const completedCount = config.completedOccurrences || 0;
          const newCompletedCount = completedCount + 1;
          const newIsActive = newCompletedCount < config.maxOccurrences;

          const nextNextTime = calculateNextExecutionTime(config.purchaseTime, config.interval, nextTime);

          // 1. ล็อกและปรับปรุงสถานะรอบการซื้อถัดไปใน Firestore
          await setDoc(docRef, {
            completedOccurrences: newCompletedCount,
            lastExecuted: new Date(),
            nextExecutionTime: nextNextTime,
            isActive: newIsActive,
          }, { merge: true });

          // 2. บันทึกรายการลง collection 'transactions'
          const btcAmount = config.amountTHB / currentPrice;
          await addDoc(collection(db, "transactions"), {
            userId: auth.currentUser!.uid,
            amountTHB: config.amountTHB,
            btcAmount: btcAmount,
            btcPriceAtBuy: currentPrice,
            date: new Date(),
            type: "AutoDCAConfig",
          });

          // ถ้าล่าช้ากว่า 1 นาที แสดงว่าเป็นกรณี catch up ย้อนหลัง ไม่ต้องแจ้งเตือน Alert
          const isCatchUp = now.getTime() - nextTime.getTime() > 60000;
          if (!newIsActive) {
            alert(`บอท Auto DCA ทำงานครบ ${config.maxOccurrences} ครั้งเรียบร้อยแล้วและปิดระบบอัตโนมัติ 🤖`);
          } else if (!isCatchUp) {
            alert(`บอท Auto DCA ได้สั่งซื้ออัตโนมัติสำเร็จ! 🤖`);
          }
        } catch (error) {
          console.error("Scheduler run error:", error);
        }
      }
    };

    // รันตรวจสอบครั้งแรกทันทีที่ค่าเปลี่ยน จากนั้นเช็กทุก 10 วินาที
    checkAndExecute();
    const intervalId = window.setInterval(checkAndExecute, 10000);
    return () => window.clearInterval(intervalId);
  }, [config, currentPrice]);

  return (
    <>
      {/* ปุ่มกดเปิดสำหรับตั้งค่าหน้าหลัก */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive
            ? "bg-amber-600 hover:bg-amber-700 text-white"
            : "bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-zinc-700"
          }`}
      >
        <RefreshCw size={16} className={isActive ? "animate-spin-slow" : ""} />
        {isActive ? "🤖 บอท Auto DCA กำลังรัน" : "+ ตั้งค่า Auto DCA"}
      </button>

      {/* Modal หน้าต่างฟอร์มตั้งค่า */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-md text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-[#F7931A]">
              <RefreshCw size={22} /> ตั้งค่าระบบซื้ออัตโนมัติ (Auto DCA)
            </h2>
            <p className="text-xs text-gray-400 mb-6">กำหนดแผนการซื้อ Bitcoin อัตโนมัติเชื่อมต่อ API Bitkub</p>

            {/* แสดงสถานะบอทที่กำลังทำงานและกำหนดการ */}
            {isActive && config && (
              <div className="mb-4 p-3 bg-amber-600/10 border border-amber-600/20 rounded-lg text-xs space-y-1.5 text-amber-200">
                <p className="font-bold flex items-center gap-1 text-[#F7931A]">
                  🤖 บอท Auto DCA กำลังรันอยู่
                </p>
                <div className="grid grid-cols-2 gap-y-1 text-[11px] text-zinc-300">
                  <span>ซื้อสะสมสำเร็จแล้ว:</span>
                  <span className="text-white font-semibold text-right">{config.completedOccurrences || 0} / {config.maxOccurrences} ครั้ง</span>
                  
                  {config.lastExecuted && (
                    <>
                      <span>รอบล่าสุด:</span>
                      <span className="text-white font-semibold text-right">
                        {typeof (config.lastExecuted as any).toDate === 'function'
                          ? (config.lastExecuted as any).toDate().toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })
                          : new Date(config.lastExecuted as any).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </>
                  )}

                  {config.nextExecutionTime && (
                    <>
                      <span>รอบถัดไป:</span>
                      <span className="text-amber-400 font-semibold text-right">
                        {typeof (config.nextExecutionTime as any).toDate === 'function'
                          ? (config.nextExecutionTime as any).toDate().toLocaleString("th-TH", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : new Date(config.nextExecutionTime as any).toLocaleString("th-TH", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">

              {/* เงื่อนไข 1: จำนวนเงินหน่วยบาท */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <DollarSign size={14} /> จำนวนเงินลงทุนต่อรอบ (บาท THB)
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  value={amountTHB}
                  onChange={(e) => setAmountTHB(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F7931A]"
                  placeholder="เช่น 1000"
                />
              </div>

              {/* เงื่อนไข 2: เวลาที่ซื้อ */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <Clock size={14} /> เวลาที่ต้องการเข้าซื้อ (ระบุเวลาเป๊ะๆ)
                </label>
                <input
                  type="time"
                  required
                  value={purchaseTime}
                  onChange={(e) => setPurchaseTime(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F7931A]"
                />
              </div>

              {/* เงื่อนไข 3: รอบการซื้อ (วัน/สัปดาห์/เดือน) */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                  <Calendar size={14} /> ความถี่รอบการเข้าซื้อ (Interval)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* ปุ่มเลือก วัน */}
                  <button
                    type="button"
                    onClick={() => setInterval("day")}
                    className={`py-2 text-sm font-medium rounded-lg border transition-colors ${interval === "day"
                        ? "bg-[#F7931A] text-black border-[#F7931A]"
                        : "bg-zinc-800 text-gray-400 border-zinc-700 hover:bg-zinc-700"
                      }`}
                  >
                    ทุกวัน
                  </button>
                  {/* ปุ่มเลือก สัปดาห์ */}
                  <button
                    type="button"
                    onClick={() => setInterval("week")}
                    className={`py-2 text-sm font-medium rounded-lg border transition-colors ${interval === "week"
                        ? "bg-[#F7931A] text-black border-[#F7931A]"
                        : "bg-zinc-800 text-gray-400 border-zinc-700 hover:bg-zinc-700"
                      }`}
                  >
                    ทุกสัปดาห์
                  </button>
                  {/* ปุ่มเลือก เดือน */}
                  <button
                    type="button"
                    onClick={() => setInterval("month")}
                    className={`py-2 text-sm font-medium rounded-lg border transition-colors ${interval === "month"
                        ? "bg-[#F7931A] text-black border-[#F7931A]"
                        : "bg-zinc-800 text-gray-400 border-zinc-700 hover:bg-zinc-700"
                      }`}
                  >
                    ทุกเดือน
                  </button>
                </div>
              </div>

              {/* เงื่อนไข 4: จำนวนรอบซื้อทั้งหมด */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  🔢 จำนวนรอบที่ต้องการรันทั้งหมด (ครั้ง)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#F7931A]"
                  placeholder="เช่น ซื้อทั้งหมด 12 ครั้ง"
                />
              </div>

              {/* ส่วนกลุ่มปุ่มกดยืนยัน */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800 mt-6 justify-between">
                {isActive && (
                  <button
                    type="button"
                    onClick={handleStopBot}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    หยุดบอทชั่วคราว
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#F7931A] text-black font-bold rounded-lg hover:bg-orange-500 disabled:opacity-50 text-sm transition-colors"
                  >
                    {loading ? "กำลังบันทึก..." : "บันทึกและเปิดใช้งาน"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
