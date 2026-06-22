import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST() {
    const apiKey = process.env.BITKUB_API_KEY;
    const apiSecret = process.env.BITKUB_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 99, message: "ยังไม่ได้ตั้งค่า API Key" }, { status: 500 });
    }

    // 1. ตั้งค่าสำหรับ V4 Endpoint (ตอนนี้ต้องใช้เป็น GET แทน POST แล้ว)
    const timestamp = Date.now().toString();
    const method = "GET";
    const requestPath = "/api/v4/wallet/balances";
    const body = ""; // GET request จะไม่มี Body

    // 2. สร้าง Payload ตามสูตร V4 (Timestamp + Method + Path + Body)
    const payload = timestamp + method + requestPath + body;

    // 3. เข้ารหัสด้วย HMAC SHA-256
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(payload, 'utf8')
        .digest('hex');

    try {
        // 4. ยิง Request ไปที่ Bitkub (แนบ Key, Timestamp และ ลายเซ็น ไว้ที่ Header)
        const response = await fetch(`https://api.bitkub.com${requestPath}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-BTK-APIKEY': apiKey,
                'X-BTK-TIMESTAMP': timestamp,
                'X-BTK-SIGN': signature,
            },
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Bitkub Error:", error);
        return NextResponse.json({ error: 99, message: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
    }
}