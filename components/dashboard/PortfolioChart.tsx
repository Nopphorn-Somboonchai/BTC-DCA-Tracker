"use client";

import React from "react";
import { User } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import LoginButton from "../ui/LoginButton";

interface PortfolioChartProps {
  chartData: { label: string; totalInvested: number; value: number }[];
  user: User | null;
  transactionsLength: number;
}

export default function PortfolioChart({
  chartData,
  user,
  transactionsLength,
}: PortfolioChartProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white lg:col-span-2">
      <CardHeader>
        <CardTitle>การเติบโตของพอร์ต (Portfolio Growth)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="label"
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
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
                contentStyle={{
                  backgroundColor: "#0F0F0F",
                  borderColor: "#27272a",
                  color: "#fff",
                }}
                itemStyle={{ color: "#F7931A" }}
                formatter={(value: unknown) => [`฿${Number(value).toLocaleString()}`, ""]}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="มูลค่าปัจจุบัน"
                stroke="#F7931A"
                strokeWidth={3}
                dot={{ r: 4, fill: "#F7931A" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="totalInvested"
                name="ต้นทุนสะสม"
                stroke="#71717a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Overlay for Guest Mode */}
          {!user && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg border border-zinc-800">
              <div className="text-center p-6 bg-zinc-950/85 border border-zinc-800 rounded-xl max-w-xs shadow-2xl">
                <TrendingUp className="h-10 w-10 text-[#F7931A] mx-auto mb-3 animate-pulse" />
                <h3 className="text-lg font-bold mb-1">ติดตามการเติบโตพอร์ต</h3>
                <p className="text-sm text-gray-400 mb-4">
                  เข้าสู่ระบบเพื่อบันทึกประวัติ DCA
                  และดูแนวโน้มการเติบโตของพอร์ตจริงของคุณ
                </p>
                <div className="flex justify-center">
                  <LoginButton />
                </div>
              </div>
            </div>
          )}

          {/* Empty state when Logged In but no transactions */}
          {user && transactionsLength === 0 && (
            <div className="absolute inset-0 bg-[#0F0F0F]/90 flex flex-col items-center justify-center rounded-lg border border-zinc-800 border-dashed p-6">
              <TrendingUp className="h-10 w-10 text-zinc-500 mb-3" />
              <h3 className="text-lg font-bold mb-1 text-zinc-300">ยังไม่มีข้อมูลประวัติ DCA</h3>
              <p className="text-sm text-zinc-500 mb-4 text-center max-w-xs">
                เพิ่มข้อมูลประวัติ DCA รายการแรกโดยใช้ปุ่ม &quot;+ บันทึกประวัติ DCA&quot;
                เพื่อเริ่มแสดงกราฟเติบโตพอร์ต
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
