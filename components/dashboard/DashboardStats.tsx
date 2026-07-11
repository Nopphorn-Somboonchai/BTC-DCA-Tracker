"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Wallet, ArrowUpRight, Pencil, Bitcoin, Target } from "lucide-react";

interface DashboardStatsProps {
  currentPortfolioValue: number;
  profitOrLoss: number;
  profitPercentage: number;
  totalCostBasis: number;
  initialCapital: number;
  totalInvested: number;
  effectiveBtc: number;
  actualThbBalance: number;
  realAvgPrice: number;
  onOpenSettings: () => void;
  onOpenStatement: () => void;
}

export default function DashboardStats({
  currentPortfolioValue,
  profitOrLoss,
  profitPercentage,
  totalCostBasis,
  initialCapital,
  totalInvested,
  effectiveBtc,
  actualThbBalance,
  realAvgPrice,
  onOpenSettings,
  onOpenStatement,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Total Value */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            มูลค่าพอร์ตปัจจุบัน (THB)
          </CardTitle>
          <Wallet className="h-4 w-4 text-[#F7931A]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#F7931A]">
            ฿{" "}
            {currentPortfolioValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p
            className={`text-xs flex items-center mt-1 ${
              profitOrLoss >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            <ArrowUpRight
              className={`h-3 w-3 mr-1 ${profitOrLoss >= 0 ? "" : "rotate-90"}`}
            />
            {profitOrLoss >= 0 ? "+" : ""}
            {profitPercentage.toFixed(2)}% จากทุน ({profitOrLoss >= 0 ? "+" : ""}
            {profitOrLoss.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            THB)
          </p>
        </CardContent>
      </Card>

      {/* Card 2: Total Invested */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            ต้นทุนรวมที่ DCA (THB)
          </CardTitle>
          <button
            onClick={onOpenSettings}
            className="text-xs flex items-center gap-1 text-gray-400 hover:text-[#F7931A] transition-colors bg-zinc-800/80 hover:bg-zinc-700 px-2 py-1 rounded"
            title="ปรับทุนเริ่มต้น"
          >
            <Pencil className="h-3 w-3" /> ตั้งค่าทุนเริ่มต้น
          </button>
        </CardHeader>
        <CardContent className="flex flex-row items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold">
              ฿{" "}
              {totalCostBasis.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              (ทุนเริ่ม: ฿ {initialCapital.toLocaleString()} + สะสม: ฿{" "}
              {totalInvested.toLocaleString()})
            </p>
          </div>
          <button
            onClick={onOpenStatement}
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
          <CardTitle className="text-sm font-medium text-gray-400">
            BTC ในกระเป๋า (Bitkub)
          </CardTitle>
          <Bitcoin className="h-4 w-4 text-[#F7931A]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{effectiveBtc.toFixed(8)}</div>
          <p className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>
              เงินสดพร้อมซื้อ: ฿{" "}
              {actualThbBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Card 4: Average Price */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">
            ราคาต้นทุนเฉลี่ย (THB/BTC)
          </CardTitle>
          <Target className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ฿ {realAvgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
