import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface BitkubOrder {
    txn_id: string;
    order_id: string;
    parent_order_id: string;
    super_order_id: string;
    client_id: string;
    taken_by_me: boolean;
    is_maker: boolean;
    side: 'buy' | 'sell';
    type: string;
    rate: string | number;
    fee: string | number;
    credit: string | number;
    amount: string | number;
    ts: number;
}

export async function GET() {
    const apiKey = process.env.BITKUB_API_KEY;
    const apiSecret = process.env.BITKUB_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 99, message: "ยังไม่ได้ตั้งค่า API Key และ API Secret ในระบบเซิร์ฟเวอร์" }, { status: 500 });
    }

    const timestamp = Date.now().toString();
    const method = "GET";
    const requestPath = "/api/v3/market/my-order-history";
    const queryString = "?sym=BTC_THB&lmt=50";
    const body = ""; // GET request ไม่มี Body

    // สร้าง payload ตามสูตร V3 สำหรับ GET (timestamp + method + requestPath + queryString + body)
    const payload = timestamp + method + requestPath + queryString + body;

    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(payload, 'utf8')
        .digest('hex');

    try {
        const response = await fetch(`https://api.bitkub.com${requestPath}${queryString}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-BTK-APIKEY': apiKey,
                'X-BTK-TIMESTAMP': timestamp,
                'X-BTK-SIGN': signature,
            },
        });

        if (!response.ok) {
            return NextResponse.json({ 
                error: 98, 
                message: `การเชื่อมต่อ Bitkub ล้มเหลว (HTTP Status: ${response.status})` 
            }, { status: response.status });
        }

        const data = await response.json();

        // ตรวจสอบ Error จากฝั่ง Bitkub API
        if (data.error !== 0) {
            console.error("Bitkub API Returned Error:", data);
            return NextResponse.json({ 
                error: data.error, 
                message: `Bitkub API Error Code: ${data.error}` 
            }, { status: 400 });
        }

        // กรองเฉพาะรายการที่เป็นการซื้อ (side === 'buy')
        const orders: BitkubOrder[] = data.result || [];
        const buyOrders = orders.filter((order) => order.side === 'buy');

        // จัดรูปฟอร์แมตข้อมูลสำหรับจัดเก็บและแสดงผล
        const mappedOrders = buyOrders.map((order) => {
            const amount = Number(order.amount);
            const fee = Number(order.fee);
            const credit = Number(order.credit);
            const rate = Number(order.rate);
            
            // ในตลาด BTC_THB สำหรับฝั่งซื้อ (buy):
            // amount คือยอดเงิน THB ทั้งหมดที่จ่ายในการสั่งซื้อ
            // fee คือค่าธรรมเนียมที่จ่ายเป็น THB
            // credit คือจำนวนเครดิตค่าธรรมเนียมที่ถูกนำมาหักล้าง
            // ดังนั้น ยอดเงิน THB สุทธิที่ใช้ในการซื้อ BTC จริงๆ = amount - fee + credit
            const netTHB = amount - fee + credit;
            const btcAmount = rate > 0 ? (netTHB / rate) : 0;

            return {
                orderId: String(order.order_id || order.txn_id),
                amountTHB: amount,
                btcAmount: btcAmount,
                btcPriceAtBuy: rate,
                date: new Date(order.ts).toISOString(), // คืนค่าเป็น ISO string เพื่อง่ายในการแปลงกลับใน client-side
            };
        });

        return NextResponse.json({
            success: true,
            result: mappedOrders
        });

    } catch (error) {
        console.error("Bitkub History Route Error:", error);
        const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดภายในระบบในการเชื่อมต่อข้อมูล";
        return NextResponse.json({ 
            error: 99, 
            message: errorMessage 
        }, { status: 500 });
    }
}
