"use client";

import React from "react";
import { User } from "firebase/auth";
import { Settings } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempInitialCapital: string;
  setTempInitialCapital: (value: string) => void;
  tempGoalBtc: string;
  setTempGoalBtc: (value: string) => void;
  handleSaveSettings: (e: React.FormEvent) => void;
  user: User | null;
  isPurging: boolean;
  handlePurgeSimulatedData: (onSuccess: () => void) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  tempInitialCapital,
  setTempInitialCapital,
  tempGoalBtc,
  setTempGoalBtc,
  handleSaveSettings,
  user,
  isPurging,
  handlePurgeSimulatedData,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-150 text-white">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
          <Settings className="h-6 w-6 text-[#F7931A]" />
          <h2 className="text-xl font-bold">ตั้งค่าการติดตามพอร์ต</h2>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                ทุนตั้งต้น (THB)
              </label>
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
              <label className="block text-sm text-gray-400 mb-2 font-medium">
                เป้าหมายสะสม BTC (Goal)
              </label>
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

          {/* Danger Zone */}
          {user && (
            <div className="mt-6 pt-6 border-t border-red-950/40 mb-6">
              <h3 className="text-sm font-semibold text-red-500 mb-2">
                Danger Zone (พื้นที่ควบคุม)
              </h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                เมื่อระบบเปลี่ยนไปดึงประวัติการลงทุนจริงจาก Bitkub คุณสามารถล้างข้อมูลจำลองบอท Auto
                DCA และประวัติการทำรายการจำลองเพื่อไม่ให้ข้อมูลคลาดเคลื่อนได้ที่นี่
              </p>
              <button
                type="button"
                onClick={() => handlePurgeSimulatedData(onClose)}
                disabled={isPurging}
                className="w-full py-2.5 px-4 bg-red-900/20 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isPurging ? "กำลังล้างข้อมูล..." : "🗑️ ล้างประวัติธุรกรรมจำลองทั้งหมด"}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
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
  );
}
