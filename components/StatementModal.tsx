"use client";

import React, { useMemo, useState, useEffect } from "react";
import { X, FileText, Pencil, Trash2 } from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Transaction {
  id: string;
  amountTHB: number;
  btcAmount: number;
  btcPriceAtBuy: number;
  date: Date;
  type?: string;
}

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export default function StatementModal({ isOpen, onClose, transactions }: StatementModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);

  // Reset edit mode when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
    }
  }, [isOpen]);

  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?");
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบรายการ:", error);
      alert("ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // เรียงลำดับจากปัจจุบันย้อนหลัง (ใหม่ไปเก่า) สำหรับตาราง Statement
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  // คำนวณสรุปรวมทั้งหมด
  const summary = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amountTHB, 0);
    const totalBtc = transactions.reduce((sum, tx) => sum + tx.btcAmount, 0);
    const weightedAvgPrice = totalBtc > 0 ? totalAmount / totalBtc : 0;

    return {
      totalAmount,
      totalBtc,
      weightedAvgPrice,
    };
  }, [transactions]);

  if (!isOpen) return null;

  // ฟอร์แมตวันที่แบบไทย DD/MM/YYYY
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ฟอร์แมตเวลา HH:mm น.
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} น.`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F7931A]/10 rounded-lg text-[#F7931A]">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ประวัติการทำรายการ (Statement)</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                รายการประวัติ DCA ทั้งหมดในระบบ ({transactions.length} รายการ)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors duration-150 ${
                  isEditMode
                    ? "bg-[#F7931A]/20 border-[#F7931A] text-[#F7931A] hover:bg-[#F7931A]/30"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-gray-300 hover:text-white"
                }`}
                title="แก้ไขรายการประวัติ"
              >
                <Pencil className="h-3.5 w-3.5" />
                {isEditMode ? "เสร็จสิ้น" : "แก้ไขรายการ"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-16 w-16 text-zinc-600 mb-4 stroke-1" />
              <h3 className="text-lg font-bold text-zinc-300">ไม่มีข้อมูลประวัติ DCA</h3>
              <p className="text-sm text-zinc-500 max-w-xs mt-1">
                กรุณาบันทึกประวัติการลงทุนครั้งแรกของคุณ หรือเปิดบอท Auto DCA เพื่อดูรายการประวัติที่นี่
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-medium">วันที่ / เดือน / ปี</th>
                    <th className="py-3.5 px-4 font-medium">ประเภทรายการ</th>
                    <th className="py-3.5 px-4 font-medium text-right">จำนวนเงิน (บาท)</th>
                    <th className="py-3.5 px-4 font-medium text-right">ราคาที่ซื้อ BTC (บาท)</th>
                    {isEditMode && <th className="py-3.5 px-4 font-medium text-center">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm">
                  {sortedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium font-mono text-zinc-200">
                          {formatDate(tx.date)}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {formatTime(tx.date)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.type === "AutoDCAConfig" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            🤖 AutoDCAConfig
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            ✍️ AddTransaction
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                        ฿ {tx.amountTHB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                        ฿ {tx.btcPriceAtBuy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      {isEditMode && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-md transition-colors duration-150"
                            title="ลบรายการ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {/* Summary Row */}
                <tfoot>
                  <tr className="bg-zinc-900/90 border-t border-zinc-800 text-sm font-semibold">
                    <td colSpan={isEditMode ? 3 : 2} className="py-4 px-4 text-zinc-300 text-left font-bold">
                      🔥 สรุปรวมทั้งหมดที่ทำรายการ
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[#F7931A] text-lg font-bold">
                      ฿ {summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-[#F7931A] text-sm font-medium">
                      <div className="text-zinc-500 text-[10px] uppercase font-semibold font-sans tracking-wide">ราคาเฉลี่ยต่อ BTC</div>
                      <div>
                        ฿ {summary.weightedAvgPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-sm font-semibold rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
