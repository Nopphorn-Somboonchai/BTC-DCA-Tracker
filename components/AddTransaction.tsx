"use client";

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface AddTransactionProps {
  currentPrice: number;
}

export default function AddTransaction({ currentPrice }: AddTransactionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amountTHB, setAmountTHB] = useState("");
  const [btcPriceAtBuy, setBtcPriceAtBuy] = useState("");
  const [loading, setLoading] = useState(false);

  // เปิดฟอร์มและดึงราคาตลาดปัจจุบันมาใส่ให้เป็นค่าเริ่มต้น
  const handleOpen = () => {
    // ถ้าราคาตลาดยังไม่มา ให้ใช้ช่องว่างไปก่อน
    setBtcPriceAtBuy(currentPrice > 0 ? currentPrice.toString() : "");
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("กรุณาล็อกอินก่อนครับ");
      return;
    }

    const thb = parseFloat(amountTHB);
    const price = parseFloat(btcPriceAtBuy);

    if (isNaN(thb) || isNaN(price) || thb <= 0 || price <= 0) {
      alert("กรุณากรอกตัวเลขให้ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      // คำนวณจำนวน BTC ที่ได้จากการซื้อรอบนี้
      const btcAmount = thb / price;

      await addDoc(collection(db, "transactions"), {
        userId: auth.currentUser.uid,
        amountTHB: thb,
        btcAmount: btcAmount,
        btcPriceAtBuy: price,
        date: Timestamp.now(), // ประทับเวลาที่บันทึก
        type: "AddTransaction",
      });

      setIsOpen(false);
      setAmountTHB(""); // เคลียร์ฟอร์ม
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
      >
        <span className="hidden sm:inline">+ บันทึกประวัติ DCA</span>
        <span className="inline sm:hidden">+ บันทึก DCA</span>
      </button>

      {/* Popup Form (จะโชว์เมื่อ isOpen = true) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">บันทึกการลงทุน (DCA)</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">ยอดเงินที่ซื้อ (THB)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amountTHB}
                  onChange={(e) => setAmountTHB(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded px-3 py-2 focus:outline-none focus:border-[#F7931A]"
                  placeholder="เช่น 1000"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-1">ราคา BTC ณ ตอนที่ซื้อ (THB)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={btcPriceAtBuy}
                  onChange={(e) => setBtcPriceAtBuy(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 text-white rounded px-3 py-2 focus:outline-none focus:border-[#F7931A]"
                />
              </div>

              {/* แสดงพรีวิวจำนวน BTC ที่จะได้รับ */}
              {amountTHB && btcPriceAtBuy && (
                <div className="mb-6 p-3 bg-zinc-800/50 rounded border border-zinc-700 text-sm text-gray-300">
                  ระบบจะบันทึกว่าคุณได้รับ: <span className="text-[#F7931A] font-bold">{(parseFloat(amountTHB) / parseFloat(btcPriceAtBuy)).toFixed(8)} BTC</span>
                </div>
              )}

              <div className="flex justify-end gap-3">
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
                  className="px-4 py-2 bg-[#F7931A] text-black font-bold rounded hover:bg-orange-500 disabled:opacity-50"
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}