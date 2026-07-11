import React from "react";
import { Bitcoin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800 pt-8 pb-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-4">
          <Bitcoin size={20} color="#52525b" />
          <span className="text-sm font-bold text-zinc-400 tracking-wider">BTC DCA TRACKER</span>
        </div>
        
        <p className="text-sm text-gray-400 mb-1">
          © 2026 Developed by <span className="text-gray-200 font-medium">Mr. Nopphorn Somboonchai</span>.
        </p>
        
        <p className="text-[10px] text-zinc-600 max-w-lg mt-3 leading-relaxed">
          Disclaimer: เว็บแอปพลิเคชันนี้สร้างขึ้นเพื่อเป็นเครื่องมือบันทึกและติดตามผลการลงทุนส่วนบุคคลเท่านั้น 
          ข้อมูลที่แสดงผลไม่ใช่คำแนะนำทางการเงิน (Not Financial Advice) การลงทุนในสินทรัพย์ดิจิทัลมีความเสี่ยง 
          โปรดศึกษาข้อมูลก่อนตัดสินใจลงทุน
        </p>
      </div>
    </footer>
  );
}
