"use client";

import React from "react";
import { User } from "firebase/auth";
import { Bitcoin, Settings, RefreshCw } from "lucide-react";
import AddTransaction from "../AddTransaction";
import LoginButton from "../ui/LoginButton";

interface DashboardHeaderProps {
  currentBtcPrice: number;
  lastFetchTime: string;
  user: User | null;
  isSyncing: boolean;
  handleSyncHistory: () => void;
  onOpenSettings: () => void;
}

export default function DashboardHeader({
  currentBtcPrice,
  lastFetchTime,
  user,
  isSyncing,
  handleSyncHistory,
  onOpenSettings,
}: DashboardHeaderProps) {
  return (
    <header className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between border-b border-gray-800 pb-4 gap-4">
      <div className="flex items-center gap-3">
        <Bitcoin size={40} color="#F7931A" />
        <h1 className="text-3xl font-bold tracking-tight">BTC DCA Tracker</h1>
      </div>

      <div className="flex flex-col items-start md:items-end">
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700/50 px-4 py-2 rounded-lg shadow-lg w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-gray-400 text-sm font-medium">ราคา Bitkub ตอนนี้:</span>
          </div>

          <span className="text-[#F7931A] text-2xl font-bold font-mono tracking-tight">
            ฿{" "}
            {currentBtcPrice > 0
              ? currentBtcPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              : "กำลังโหลด..."}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-2 self-start md:self-end">
          อัปเดตล่าสุด: {lastFetchTime || "-"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-start md:justify-end">
        <AddTransaction currentPrice={currentBtcPrice} />
        {user && (
          <button
            onClick={handleSyncHistory}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 disabled:bg-orange-800 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
            title="ซิงก์ประวัติคำสั่งซื้อทั้งหมดจากบัญชี Bitkub"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "กำลังซิงก์ข้อมูล..." : "ซิงก์ประวัติ Bitkub"}</span>
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-gray-300 hover:text-[#F7931A] rounded-md transition-colors"
          title="การตั้งค่า"
        >
          <Settings className="h-5 w-5" />
        </button>
        <LoginButton />
      </div>
    </header>
  );
}
