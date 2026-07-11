"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Progress } from "../ui/progress";
import { Pencil } from "lucide-react";

interface GoalTrackerProps {
  goalBtc: number;
  effectiveBtc: number;
  onOpenSettings: () => void;
}

export default function GoalTracker({
  goalBtc,
  effectiveBtc,
  onOpenSettings,
}: GoalTrackerProps) {
  const percentage = goalBtc > 0 ? (effectiveBtc / goalBtc) * 100 : 0;
  const progressValue = goalBtc > 0 ? Math.min(percentage, 100) : 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>เป้าหมาย DCA (Goal)</CardTitle>
        <button
          onClick={onOpenSettings}
          className="text-xs flex items-center gap-1 text-gray-400 hover:text-[#F7931A] transition-colors bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded"
        >
          <Pencil className="h-3.5 w-3.5" /> ปรับเป้าหมาย
        </button>
      </CardHeader>
      <CardContent className="flex flex-col justify-center h-[300px]">
        <div className="text-center mb-6">
          <div className="text-5xl font-extrabold text-[#F7931A] mb-2">
            {percentage.toFixed(1)}%
          </div>
          <p className="text-gray-400 text-sm">ความคืบหน้าสู่เป้าหมาย {goalBtc} BTC</p>
        </div>

        <Progress
          value={progressValue}
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
              <span className="text-green-400 font-semibold">
                ยินดีด้วย! คุณสะสม BTC ได้ถึงหรือเกินเป้าหมายที่คุณตั้งไว้แล้ว 🎉
              </span>
            ) : effectiveBtc > 0 ? (
              <>
                คุณยังขาดอีก{" "}
                <span className="text-white font-semibold">
                  {(goalBtc - effectiveBtc).toFixed(8)} BTC
                </span>{" "}
                หากมีวินัย DCA ต่อไป เป้าหมายอยู่ไม่ไกลแน่นอน!
              </>
            ) : (
              <>คุณยังไม่มีรายการ DCA บันทึกสะสม เริ่มการบันทึกเพื่อแสดงผลสถานะเป้าหมาย</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
