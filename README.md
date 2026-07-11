# BTC DCA Tracker

เว็บแอปพลิเคชันสำหรับติดตามและวิเคราะห์พอร์ตการลงทุน Bitcoin แบบ DCA (Dollar Cost Average) โดยเชื่อมต่อข้อมูลยอดเงินคงเหลือและประวัติธุรกรรมซื้อขายจริงโดยตรงจากบัญชี Bitkub ของคุณผ่านระบบ Bitkub API พร้อมทั้งคำนวณสถิติพอร์ตอย่างมีประสิทธิภาพ

---

## Features (ฟีเจอร์เด่นของระบบ)

### 1. Interactive Portfolio Dashboard (แดชบอร์ดติดตามพอร์ตอัจฉริยะ)
* **Live Bitcoin Price:** แสดงราคาตลาด BTC/THB ปัจจุบันแบบ Real-time โดยเชื่อมต่อผ่าน WebSocket API ของ Bitkub (`wss://api.bitkub.com/websocket-api/market.ticker.thb_btc`) พร้อมระบุวันเวลาที่ข้อมูลอัปเดตล่าสุด
* **Real Balance Sync:** ดึงข้อมูลยอดเงินสด (THB) และยอดสะสม Bitcoin (BTC) ที่มีอยู่จริงในกระเป๋า Bitkub ของผู้ใช้มาแสดงโดยอัตโนมัติ
* **Comprehensive Portfolio Metrics:** คำนวณและแสดงสถิติพอร์ตการลงทุนที่สำคัญแบบไดนามิก:
  * **มูลค่าพอร์ตปัจจุบัน (Current Portfolio Value):** มูลค่าเป็นเงินบาทจากการนำเหรียญ BTC จริงในกระเป๋าคูณด้วยราคาตลาดล่าสุด
  * **ผลตอบแทนรวม (Profit/Loss):** ผลกำไรหรือขาดทุนสุทธิของพอร์ต (แสดงเป็นจำนวนเงิน THB และอัตราร้อยละ %) เมื่อเทียบกับต้นทุนจริง
  * **ต้นทุนรวมในการลงทุน (Total Cost Basis):** ผลรวมของทุนตั้งต้น (Initial Capital) และทุนที่ใช้ซื้อสะสมเพิ่มเติมผ่านแอปพลิเคชัน
  * **ราคาต้นทุนเฉลี่ยจริง (Real Avg Price):** ราคาเฉลี่ยต่อ 1 BTC จริงจากสูตร `ต้นทุนรวมทั้งหมด / จำนวน BTC คงเหลือจริงในกระเป๋า`
* **Portfolio Growth Chart:** กราฟเส้นแบบ Interactive (พัฒนาโดยใช้ Recharts) เปรียบเทียบระหว่าง มูลค่าของพอร์ตตามราคาตลาด (Value) และ ต้นทุนสะสมทั้งหมด (Total Invested) ตามวันเวลาที่ทำรายการจริง
  * **ระบบ Guest Mode:** แสดงกราฟจำลอง (Mock Data) พร้อมมีข้อความชวนล็อกอิน (Overlay Banner) เพื่อเปิดระบบวิเคราะห์พอร์ตจริง
  * **ระบบ Empty State:** แสดงข้อความแนะนำขั้นตอนเมื่อล็อกอินเข้าสู่ระบบเรียบร้อยแล้วแต่ยังไม่มีรายการประวัติบันทึก

### 2. Goal Tracker & Settings (ระบบเป้าหมายและการตั้งค่าพอร์ต)
* **Custom DCA Goal:** ตั้งค่าและปรับแต่งจำนวน BTC เป้าหมายที่ต้องการสะสม (เช่น 0.1 BTC, 0.5 BTC, 1.0 BTC)
* **Initial Capital Setting:** กำหนดต้นทุนตั้งต้น (ก่อนเริ่มเข้าใช้งานระบบ) เพื่อนำมาคำนวณราคาเฉลี่ยต่อเหรียญและกำไรสุทธิได้อย่างแม่นยำสูงสุด
* **Progress Dashboard:** แสดงอัตราความสำเร็จเป็นเปอร์เซ็นต์ แถบแสดงความคืบหน้า (Progress Bar) และแสดงคำสรุปความคืบหน้าแบบไดนามิกตามจำนวน BTC ในปัจจุบัน (เช่น ข้อความแสดงความยินดีเมื่อสะสมถึงเป้าหมาย หรือคำนวณจำนวน BTC ที่ยังคงขาดอยู่)
* **Danger Zone (พื้นที่ควบคุม):** ปุ่มล้างประวัติธุรกรรมจำลองทั้งหมด (Purge Simulated Auto DCA) เพื่อช่วยทำความสะอาดฐานข้อมูล Firestore ลบข้อมูลประวัติธุรกรรมจำลองหรือข้อมูลบอทเก่าที่อาจทำให้ค่าสถิติพอร์ตจริงคลาดเคลื่อน
* **Data Persistence:** ระบบจัดเก็บข้อมูลการตั้งค่าลงบนฐานข้อมูล Firestore เมื่อล็อกอิน และจัดเก็บข้อมูลลงบน LocalStorage เมื่อใช้งานในโหมดบุคคลทั่วไป (Guest)

### 3. Bitkub API Integration (เชื่อมโยงข้อมูลผ่าน API ทั้ง Auto & Manual)
* **Real Balances Fetching:** ดึงข้อมูลยอดคงเหลือในกระเป๋าจริงโดยเรียกผ่าน API Route `/api/bitkub-balance` ที่เชื่อมต่อกับ Bitkub API V4 ล่าสุด เพื่อความปลอดภัย
* **History Auto-Sync:** ซิงก์ประวัติการสั่งซื้อ BTC (เฉพาะรายการประเภท Buy เท่านั้น) ย้อนหลังจาก Bitkub API V3 ผ่าน API Route `/api/bitkub-history` โดยอัตโนมัติทันที 1 ครั้งเมื่อเข้าสู่ระบบ
* **Manual Sync:** ปุ่มกดสั่งซิงก์ข้อมูลประวัติคำสั่งซื้อล่าสุดจาก Bitkub ได้ทันทีตามต้องการ พร้อมการแสดงสถานะกำลังโหลด (Loading Spinner)
* **Smart Deduplication:** ระบบเปรียบเทียบรหัสอ้างอิง `orderId` ของ Bitkub กับประวัติเดิมในระบบก่อนทำการเขียนข้อมูลลง Firestore เพื่อป้องกันปัญหาข้อมูลรายการธุรกรรมทับซ้อนกัน

### 4. DCA Management Methods (การจัดการประวัติธุรกรรม)
* **Manual Logging (บันทึกด้วยมือ):** เพิ่มรายการประวัติการซื้อ BTC ย้อนหลังด้วยตนเองโดยระบุจำนวนเงินที่ซื้อ (THB) และราคา BTC ในขณะซื้อ ระบบจะคำนวณจำนวน BTC ที่ได้รับและแสดงภาพตัวอย่าง (Preview) ให้เห็นก่อนกดบันทึก

### 5. Transaction Statement (หน้าสรุปและจัดการประวัติการทำรายการ)
* **History Table:** ตารางรายงานประวัติการทำรายการ DCA ทั้งหมด เรียงลำดับจากธุรกรรมใหม่ล่าสุดไปหาเก่าสุด
* **Transaction Source Badges:** แสดงป้ายกำกับแหล่งที่มาของข้อมูลอย่างเด่นชัด ได้แก่:
  * `🍊 Bitkub API` สำหรับรายการธุรกรรมจริงที่ดึงและซิงก์มาจาก Bitkub
  * `✍️ AddTransaction` สำหรับรายการที่ผู้ใช้บันทึกเพิ่มเติมด้วยตนเอง
* **Record Management (Edit Mode):** โหมดแก้ไขรายการที่เปิดโอกาสให้ผู้ใช้งานที่มีสิทธิ์เข้าสู่ระบบสามารถเลือกลบ (Delete) รายการธุรกรรมที่ไม่จำเป็นหรือข้อมูลที่ผิดพลาดออกจาก Firestore ได้อย่างถาวร โดยมีระบบขอคำยืนยันป้องกันการเผลอกดลบ
* **Summary Row:** แถบสรุปผลรวมจำนวนเงินลงทุนสะสมทั้งหมด และคำนวณราคาเฉลี่ยต่อ BTC ถ่วงน้ำหนักของรายการในตารางทั้งหมด

### 6. PWA Support (Progressive Web App)
* รองรับการติดตั้งเป็น Standalone App บนสมาร์ทโฟน แท็บเล็ต หรือคอมพิวเตอร์ผ่าน Web App Manifest (`app/manifest.ts`) และลงทะเบียน Service Worker (`components/PWARegister.tsx` -> `public/sw.js`) เพื่อการเรียกใช้งานที่สะดวก รวดเร็ว เสมือนแอปพลิเคชันจริง

---

## Technology Stack (เทคโนโลยีที่เลือกใช้)

### Frontend & Styling
* **Next.js 15 (App Router)**
* **TypeScript**
* **TailwindCSS**
* **Shadcn/UI** (Card, Progress)
* **Lucide React** (ไอคอนปุ่มและแท็บ)
* **Recharts** (ไลบรารีกราฟแสดงผลข้อมูล)

### Backend & API
* **Next.js API Routes** (รันบน Node.js Environment หลังบ้านเพื่อความปลอดภัย)
* **Crypto (HMAC-SHA256)** สำหรับสร้าง Signature เข้ารหัสยืนยันตนเพื่อติดต่อกับ Bitkub API V3 และ V4

### Database & Authentication
* **Firebase Client SDK v10**
* **Firebase Authentication** (ระบบล็อกอินด้วยอีเมลและรหัสผ่านสำหรับ Admin)
* **Firebase Firestore** (ฐานข้อมูล NoSQL แบบเรียลไทม์)

---

## UI Theme (การออกแบบส่วนติดต่อผู้ใช้)

* **Primary/Accent Color:** สีส้มบิตคอยน์ (`#F7931A`)
* **Background:** สีดำชาร์โคล (`#0F0F0F`)
* **Card & Components:** สีเทาเข้ม (`#1A1A1A` / `#18181b`)
* **Text:** สีขาว (`#FFFFFF`) / เทา Muted (`#a1a1aa`)
* **Design Style:** Modern Crypto Dashboard / Dark Theme ที่สบายตาและดูพรีเมียม

---

## Database Design (Firestore Schema)

ฐานข้อมูล Firestore ในระบบใช้ 2 Collection หลัก ดังนี้:

### 1. `transactions`
ใช้เก็บรายการประวัติการ DCA ของผู้ใช้งานแต่ละบัญชี
```json
{
  "userId": "string (Firebase User UID)",
  "amountTHB": "number (ยอดเงินบาทสุทธิที่ลงทุน)",
  "btcAmount": "number (จำนวน BTC ที่ได้รับจากการทำรายการ)",
  "btcPriceAtBuy": "number (ราคา BTC/THB ณ จุดซื้อ)",
  "date": "Timestamp (วันเวลาที่ทำรายการ)",
  "type": "string ('AddTransaction' | 'bitkub')",
  "orderId": "string (มีเฉพาะเมื่อ type เป็น 'bitkub' สำหรับทำ deduplication)"
}
```

### 2. `user_configs`
ใช้เก็บข้อมูลเป้าหมายพอร์ตและการตั้งค่าตั้งต้น
```json
{
  "initialCapital": "number (เงินลงทุนเริ่มต้นนอกแอป)",
  "goalBtc": "number (ยอดจำนวน BTC เป้าหมายที่ต้องการสะสม)"
}
```

---

## Security Practices (มาตรการรักษาความปลอดภัย)

1. **Server-side Secrets:** เก็บ API Key และ API Secret ของ Bitkub และ Firebase Credentials ไว้ใน Environment Variables ฝั่งเซิร์ฟเวอร์ (`.env.local`) ป้องกันไม่ให้บุคคลภายนอกแกะคีย์จากหน้าเบราว์เซอร์
2. **HMAC-SHA256 Signatures:** ดำเนินการคำนวณและทำ Signature เพื่อขอเรียกดูข้อมูลส่วนตัวจาก API ของ Bitkub ผ่าน Backend API Routes ทั้งหมด โดยไม่มีการเปิดเผย Secret Key ไปยังฝั่ง Client
3. **User Isolation:** ควบคุมความปลอดภัยของฐานข้อมูล Firestore ผ่านการตรวจสอบสิทธิ์ Firebase Auth (`uid`) เพื่อป้องกันไม่ให้ผู้ใช้คนอื่นเข้าถึงข้อมูลข้ามบัญชีกันได้

---

## Getting Started (ขั้นตอนการรันโปรเจกต์)

### 1. การตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ไว้ที่โฟลเดอร์หลัก (Root) ของโปรเจกต์ จากนั้นกรอกข้อมูลการตั้งค่าดังนี้:

```env
# Firebase Credentials (สำหรับ Initialize Firebase Client)
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_firebase_app_id"

# Bitkub API Credentials (ประมวลผลเฉพาะฝั่งเซิร์ฟเวอร์หลังบ้านเท่านั้น)
BITKUB_API_KEY="your_bitkub_api_key_here"
BITKUB_API_SECRET="your_bitkub_api_secret_here"
```

### 2. การติดตั้งโปรแกรมและการรัน

1. ติดตั้ง Dependencies ในโปรเจกต์:
   ```bash
   npm install
   ```

2. รันโปรเจกต์บนเครื่องเซิร์ฟเวอร์จำลอง (Development Mode):
   ```bash
   npm run dev
   ```

3. เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000) เพื่อเริ่มใช้งานแอปพลิเคชัน

---

## Future Features (แผนพัฒนาฟีเจอร์ในอนาคต)

* **Multi-User Key Configuration:** เพิ่มระบบให้ผู้ใช้งานสามารถนำเข้าและเข้ารหัสคีย์ Bitkub API ของตัวเองผ่าน UI และบันทึกลง Firestore เพื่อเปิดสิทธิ์การซิงก์ส่วนบุคคล
* **Multi-Exchange Integration:** ขยายการรองรับระบบดึงประวัติการทำรายการจาก Exchange ชั้นนำอื่นๆ เช่น Binance, Bybit หรือตลาดสัญชาติไทยรายอื่น
* **Automated DCA Order Scheduler:** พัฒนาระบบบอทส่งคำสั่งซื้ออัตโนมัติจริง (DCA Executor) ผ่าน API ของ Bitkub ตามคาบเวลาที่ผู้ใช้เลือก (รายวัน, รายสัปดาห์, รายเดือน) จากหลังบ้าน
* **Multi-Channel Notifications:** ระบบส่งข้อความแจ้งเตือนผลสรุปพอร์ตและความคืบหน้าสะสมประจำรอบผ่าน Line Notify หรือ Telegram Bot
* **AI Purchase Analyzer:** ใช้โมเดล AI ในการประมวลผลสถิติประวัติการซื้อ เพื่อประเมินรอบจังหวะการทำ DCA และจำลองแบบแผนในสภาวะตลาดแบบต่างๆ
