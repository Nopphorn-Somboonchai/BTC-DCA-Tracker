# Refactoring Walkthrough & Architectural Recommendations - BTC DCA Tracker

การรีแฟคเตอร์โปรเจกต์ **BTC DCA Tracker** ทั้ง 3 Phases ได้ดำเนินการเสร็จสิ้น 100% เรียบร้อยแล้วครับ โค้ดได้รับการปรับปรุงให้มีโครงสร้างที่ยืดหยุ่น (Scalable), ดูแลรักษาง่าย (Maintainable) ปราศจากข้อผิดพลาดของ Linter และสามารถรัน Build บนโปรดักชันได้ผ่านฉลุย

---

## 🛠️ โครงสร้างโฟลเดอร์หลังการปรับปรุง (Final Directory Layout)

```
/app
  page.tsx (หน้าแดชบอร์ดหลัก ขนาดกะทัดรัด ~100 บรรทัด ทำหน้าที่ประสานงาน)
/components
  /dashboard (Sub-components ที่แยก UI ตามโมดูล)
    DashboardHeader.tsx
    DashboardStats.tsx
    PortfolioChart.tsx
    GoalTracker.tsx
    SettingsModal.tsx
  AddTransaction.tsx
  StatementModal.tsx
/hooks (Custom Hooks สำหรับเก็บ Business Logic และการคำนวณ)
  useBitkubData.ts (WebSocket ราคา และ API ดึงยอดเงินจริง)
  useUserConfig.ts (จัดการตั้งค่าทุนเริ่มต้นและเป้าหมาย)
  useTransactions.ts (real-time transaction subscription และ Bitkub sync)
  usePortfolio.ts (รวบรวมข้อมูลทั้งหมดและคำนวณ PnL/สถิติพอร์ตเพื่อส่งออก)
```

---

## 🧪 ผลการทดสอบ (Verification & Validation Results)

1. **การตรวจสอบ Lint (eslint):** ผ่านการตรวจสอบ 100% ไม่มีข้อความแจ้งเตือนหรือข้อผิดพลาด
2. **การรันคอมไพล์ (npm run build):** ผ่านกระบวนการคอมไพล์ Next.js build และรัน TypeScript สำเร็จโดยไม่มีปัญหาใดๆ ทั้งฝั่งไคลเอนต์และเซิร์ฟเวอร์

---

## 💡 ข้อเสนอแนะเชิงสถาปัตยกรรม (Architectural Recommendations)

> [!TIP]
> เพื่อความยั่งยืน ความปลอดภัย และความคล่องตัวในการพัฒนาฟีเจอร์ใหม่ๆ ในอนาคต นี่คือข้อแนะนำเชิงสถาปัตยกรรมสำหรับโปรเจกต์นี้ครับ:

### 1. ความปลอดภัยและการเข้าถึง API (API Security & Authentication)
* **ปัญหาในปัจจุบัน:** API Routes เช่น `/api/bitkub-balance` และ `/api/bitkub-history` สามารถถูกเรียกใช้จากหน้าบ้านโดยตรงได้โดยไม่มีการตรวจสอบสิทธิ์ของผู้ใช้งาน (Authorization)
* **ข้อเสนอแนะ:** 
  - ควรส่ง Firebase Auth ID Token ไปกับ HTTP Request Header ทุกครั้งเมื่อเรียกใช้ API เหล่านี้
  - ใน API Route Handler ฝั่งเซิร์ฟเวอร์ ให้ตรวจสอบ Token โดยใช้ `firebase-admin` เพื่อยืนยันว่าผู้ที่เรียกใช้งานคือผู้ใช้คนนั้นจริงก่อนจะดำเนินการเข้าถึงข้อมูล Bitkub API เพื่อความปลอดภัยสูงสุด

### 2. การจัดการขนาดของ State และการส่งต่อ Props (State Management)
* **ปัญหาในปัจจุบัน:** ปัจจุบันเราใช้ `usePortfolio` ดึงข้อมูลทั้งหมดรวมกันในจุดเดียวที่หน้า `app/page.tsx` แล้วส่ง Props กระจายต่อลงไป หากระบบเติบโตและมีหน้าย่อยมากขึ้น (เช่น หน้าประวัติเชิงลึก, หน้าสถิติเดี่ยว) จะทำให้เกิดปัญหา **Prop Drilling** หรือการ Render ซ้ำเกินความจำเป็น
* **ข้อเสนอแนะ:**
  - สร้าง **Portfolio Context Provider** ครอบที่ระดับสูงสุดของหน้าแดชบอร์ด
  - ย้ายการเรียกใช้งาน `usePortfolio` ไปไว้ใน Context และให้แต่ละ Sub-component เรียกใช้ข้อมูลผ่าน Custom Hook ตัวกลาง เช่น `usePortfolioContext()` เพื่อให้อ่านสเตตที่ต้องการได้โดยตรงโดยไม่ต้องส่ง Props ผ่าน Component หลัก

### 3. การดึงข้อมูลที่มีประสิทธิภาพ (Data Fetching with SWR / React Query)
* **ปัญหาในปัจจุบัน:** ปัจจุบันระบบใช้ `fetch` ดิบๆ ใน `useEffect` หรือผ่าน Event handlers ซึ่งขาดระบบการจัดการ Cache, การดึงข้อมูลซ้ำเมื่อเครือข่ายหลุด (Automatic Retry), หรือการดึงข้อมูลเมื่อสลับหน้าต่างกลับมา (Focus Revalidation)
* **ข้อเสนอแนะ:** 
  - นำไลบรารีอย่าง `SWR` หรือ `@tanstack/react-query` เข้ามาจัดการในการเรียก API ของ Bitkub (เช่น `/api/bitkub-balance`) เพื่อลดภาระการเขียนสเตตสำหรับ Loading / Error และช่วยอำนวยความสะดวกในการจัดแคชชิ่งแบบเรียลไทม์

### 4. การจัดการแจ้งเตือน Recharts ในช่วง Build (Recharts SSR Sizing Alert)
* **ปัญหาในปัจจุบัน:** ในตอนรัน build จะมีคำเตือน: `The width(-1) and height(-1) of chart should be greater than 0...` เกิดจาก Recharts พยายามคำนวณขนาดของคอมโพเนนต์ขณะที่รันสแตติกเซิร์ฟเวอร์ (SSR) ซึ่งไม่มี DOM
* **ข้อเสนอแนะ:**
  - เพิ่ม state `isMounted` ใน [PortfolioChart.tsx](file:///h:/06-Projects/bitcoin-dca-tracker/components/dashboard/PortfolioChart.tsx) และกำหนดให้เรนเดอร์ชาร์ตเฉพาะเมื่อ Component โหลดในฝั่งไคลเอนต์เสร็จสิ้นแล้วเท่านั้น (Client-side rendering check) เพื่อลดความรกรุงรังของข้อความแจ้งเตือนขณะ Build

### 5. การแยก Types/Interfaces ออกจากตัวโค้ด
* **ปัญหาในปัจจุบัน:** Interfaces ต่างๆ (เช่น `Transaction`) ยังเขียนซ้ำและกระจายอยู่ในแต่ละ Hooks
* **ข้อเสนอแนะ:** 
  - สร้างไฟล์กลาง เช่น `/types/index.ts` หรือ `/types/portfolio.ts` เพื่อรวมจุดอ้างอิงของ Type ทั้งหมด เพื่อความสะอาดของโค้ดและแก้ไขได้ง่ายในจุดเดียวเมื่อโครงสร้างข้อมูลของ Firebase หรือ Bitkub มีการปรับเปลี่ยนในอนาคต
