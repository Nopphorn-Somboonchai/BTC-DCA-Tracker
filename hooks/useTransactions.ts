"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export interface Transaction {
  id: string;
  amountTHB: number;
  btcAmount: number;
  btcPriceAtBuy: number;
  date: Date;
  type?: string;
  orderId?: string;
}

interface SyncedBitkubOrder {
  orderId: string;
  amountTHB: number;
  btcAmount: number;
  btcPriceAtBuy: number;
  date: string;
}

export function useTransactions(user: User | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [totalBtc, setTotalBtc] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  
  const hasAutoSyncedRef = useRef<boolean>(false);
  const transactionsRef = useRef<Transaction[]>([]);

  // Keep ref up to date
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  // 🟢 ฟังก์ชันซิงก์ข้อมูลประวัติจาก Bitkub และป้องกันการเขียนซ้ำ (Deduplication)
  const syncBitkubHistory = useCallback(async (
    customExistingTransactions?: Transaction[],
    currentUserObject?: User | null
  ): Promise<{ count: number; message: string }> => {
    const activeUser = currentUserObject || user || auth.currentUser;
    if (!activeUser) {
      throw new Error("กรุณาล็อกอินเพื่อดำเนินการซิงก์ประวัติ");
    }

    try {
      const res = await fetch("/api/bitkub-history");
      if (!res.ok) {
        let errorMessage = `ดึงประวัติจาก API ล้มเหลว (HTTP Status: ${res.status})`;
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errorMessage += `: ${errData.message}`;
          }
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "ดึงประวัติการสั่งซื้อล้มเหลว");
      }

      const bitkubOrders: SyncedBitkubOrder[] = data.result || [];

      // ดึงรหัสอ้างอิงของธุรกรรม Bitkub เดิมที่มีอยู่แล้วในระบบเพื่อเทียบไม่ให้ซ้ำ
      const targetTxs = customExistingTransactions || transactionsRef.current;
      const existingOrderIds = new Set(
        targetTxs
          .filter((tx) => tx.type === "bitkub" && tx.orderId)
          .map((tx) => tx.orderId as string)
      );

      // กรองเฉพาะรายการคำสั่งซื้อใหม่ที่ยังไม่เคยมีใน Firestore
      const newOrders = bitkubOrders.filter(
        (order) => !existingOrderIds.has(order.orderId)
      );

      if (newOrders.length === 0) {
        return { count: 0, message: "ข้อมูลประวัติการลงทุนเป็นปัจจุบันอยู่แล้ว" };
      }

      // บันทึกธุรกรรมลงใน Firestore
      const writePromises = newOrders.map((order) => {
        return addDoc(collection(db, "transactions"), {
          userId: activeUser.uid,
          amountTHB: order.amountTHB,
          btcAmount: order.btcAmount,
          btcPriceAtBuy: order.btcPriceAtBuy,
          date: Timestamp.fromDate(new Date(order.date)),
          type: "bitkub",
          orderId: order.orderId,
        });
      });

      await Promise.all(writePromises);

      return {
        count: newOrders.length,
        message: `ซิงก์สำเร็จ เพิ่มประวัติการซื้อใหม่จำนวน ${newOrders.length} รายการ`,
      };
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการซิงก์ข้อมูล Bitkub:", error);
      throw error;
    }
  }, [user]);

  // 🟢 ฟังก์ชันผูกปุ่มกดซิงก์ข้อมูลเพื่อแจ้ง Feedback แก่ผู้ใช้งาน
  const handleSyncHistory = async () => {
    setIsSyncing(true);
    try {
      const res = await syncBitkubHistory();
      alert(res.message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการซิงก์ข้อมูล";
      alert(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  // 🟢 ฟังก์ชันล้างข้อมูลจำลองบอท Auto DCA
  const handlePurgeSimulatedData = async (onSuccess?: () => void) => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) {
      alert("กรุณาล็อกอินก่อนดำเนินการล้างข้อมูลครับ");
      return;
    }

    const isConfirmed = window.confirm(
      "⚠️ คุณต้องการลบข้อมูลแผนการลงทุน Auto DCA และธุรกรรมจำลองทั้งหมดออกจากฐานข้อมูลใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้ และจะลบข้อมูลธุรกรรมจำลองทั้งหมดออกจากระบบคลาวด์อย่างถาวร"
    );
    if (!isConfirmed) return;

    setIsPurging(true);
    try {
      // 1. ลบคอนฟิก Auto DCA จาก auto_dca_configs
      const configRef = doc(db, "auto_dca_configs", activeUser.uid);
      await deleteDoc(configRef);

      // 2. ดึงธุรกรรมทั้งหมดที่เป็น AutoDCAConfig เพื่อนำมาลบ
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", activeUser.uid),
        where("type", "==", "AutoDCAConfig")
      );

      const querySnapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(doc(db, "transactions", docSnap.id)));
      });

      await Promise.all(deletePromises);
      alert("ล้างข้อมูลจำลอง Auto DCA ทั้งหมดออกจากฐานข้อมูลเรียบร้อยแล้วครับ 🤖✨");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการล้างข้อมูลจำลอง:", err);
      alert("เกิดข้อผิดพลาดในการล้างข้อมูลจำลอง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsPurging(false);
    }
  };

  // ดึงข้อมูลธุรกรรม Real-time และทำ Auto-sync
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    if (user) {
      hasAutoSyncedRef.current = false; // รีเซ็ต Ref ทุกครั้งที่มีการล็อกอินใหม่
      const q = query(collection(db, "transactions"), where("userId", "==", user.uid));

      unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        let sumInvested = 0;
        let sumBtc = 0;
        const txList: Transaction[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const type = data.type || "AddTransaction";

          // ข้ามรายการจำลอง AutoDCA ในแดชบอร์ดจริง
          if (type === "AutoDCAConfig") {
            return;
          }

          const amountTHB = Number(
            data.amountTHB !== undefined
              ? data.amountTHB
              : data.amountThb !== undefined
              ? data.amountThb
              : data.amount !== undefined
              ? data.amount
              : 0
          );
          const btcAmount = Number(
            data.btcAmount !== undefined
              ? data.btcAmount
              : data.btc !== undefined
              ? data.btc
              : 0
          );
          const btcPriceAtBuy = Number(
            data.btcPriceAtBuy !== undefined
              ? data.btcPriceAtBuy
              : data.btcPrice !== undefined
              ? data.btcPrice
              : data.price !== undefined
              ? data.price
              : 0
          );

          sumInvested += amountTHB;
          sumBtc += btcAmount;

          let txDate: Date;
          if (data.date) {
            if (typeof data.date.toDate === "function") {
              txDate = data.date.toDate();
            } else if (data.date instanceof Date) {
              txDate = data.date;
            } else if (typeof data.date === "string" || typeof data.date === "number") {
              txDate = new Date(data.date);
            } else if (data.date.seconds !== undefined) {
              txDate = new Date(data.date.seconds * 1000 + (data.date.nanoseconds || 0) / 1000000);
            } else {
              txDate = new Date();
            }
          } else {
            txDate = new Date();
          }

          txList.push({
            id: doc.id,
            amountTHB,
            btcAmount,
            btcPriceAtBuy,
            date: txDate,
            type,
            orderId: data.orderId || "",
          });
        });

        // เรียงลำดับจากเก่าไปใหม่
        txList.sort((a, b) => a.date.getTime() - b.date.getTime());

        setTransactions(txList);
        setTotalInvested(sumInvested);
        setTotalBtc(sumBtc);

        // Auto-sync Bitkub history
        if (!hasAutoSyncedRef.current) {
          hasAutoSyncedRef.current = true;
          syncBitkubHistory(txList, user)
            .then((res) => {
              if (res.count > 0) {
                console.log(`🤖 Auto-sync success: ${res.message}`);
              }
            })
            .catch((err) => {
              console.error("🤖 Auto-sync failed:", err);
            });
        }
      });
    } else {
      // เคลียร์ข้อมูลกรณี Guest / ล็อกเอาต์ แบบ asynchronous
      const timer = setTimeout(() => {
        setTransactions([]);
        setTotalInvested(0);
        setTotalBtc(0);
      }, 0);
      return () => clearTimeout(timer);
    }

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [user, syncBitkubHistory]);

  return {
    transactions,
    totalInvested,
    totalBtc,
    isSyncing,
    isPurging,
    handleSyncHistory,
    handlePurgeSimulatedData,
    syncBitkubHistory,
  };
}
