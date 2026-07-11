"use client";

import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useUserConfig(user: User | null) {
  const [goalBtc, setGoalBtc] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const guestGoal = localStorage.getItem("dca_goal_guest");
      if (guestGoal) return Number(guestGoal);
    }
    return 0.1;
  });
  const [tempGoalBtc, setTempGoalBtc] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const guestGoal = localStorage.getItem("dca_goal_guest");
      if (guestGoal) return guestGoal;
    }
    return "0.1";
  });

  const [initialCapital, setInitialCapital] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const guestCapital = localStorage.getItem("dca_initial_capital_guest");
      if (guestCapital) return Number(guestCapital);
    }
    return 30659;
  });
  const [tempInitialCapital, setTempInitialCapital] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const guestCapital = localStorage.getItem("dca_initial_capital_guest");
      if (guestCapital) return guestCapital;
    }
    return "30659";
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // โหลดค่าเป้าหมายและทุนตั้งต้นของ Guest หรือล้างค่าเมื่อ Logout
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        const guestGoal = localStorage.getItem("dca_goal_guest") || "0.1";
        const guestCapital = localStorage.getItem("dca_initial_capital_guest") || "30659";
        setGoalBtc(Number(guestGoal));
        setTempGoalBtc(guestGoal);
        setInitialCapital(Number(guestCapital));
        setTempInitialCapital(guestCapital);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // ดึงคอนฟิกเมื่อ user เปลี่ยนแปลง
  useEffect(() => {
    if (!user) return;

    const fetchConfig = async () => {
      const docRef = doc(db, "user_configs", user.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.goalBtc != null) {
            setGoalBtc(Number(data.goalBtc));
            setTempGoalBtc(data.goalBtc.toString());
          }
          if (data.initialCapital != null) {
            setInitialCapital(Number(data.initialCapital));
            setTempInitialCapital(data.initialCapital.toString());
          }
        } else {
          // ดึงจาก localStorage รายบุคคลหากไม่มีใน db
          const localGoal = localStorage.getItem(`dca_goal_${user.uid}`);
          if (localGoal) {
            setGoalBtc(Number(localGoal));
            setTempGoalBtc(localGoal);
          }
          const localCapital = localStorage.getItem(`dca_initial_capital_${user.uid}`);
          if (localCapital) {
            setInitialCapital(Number(localCapital));
            setTempInitialCapital(localCapital);
          }
        }
      } catch (err) {
        console.error("ดึงข้อมูลการตั้งค่าไม่สำเร็จ:", err);
        const localGoal = localStorage.getItem(`dca_goal_${user.uid}`);
        if (localGoal) {
          setGoalBtc(Number(localGoal));
          setTempGoalBtc(localGoal);
        }
        const localCapital = localStorage.getItem(`dca_initial_capital_${user.uid}`);
        if (localCapital) {
          setInitialCapital(Number(localCapital));
          setTempInitialCapital(localCapital);
        }
      }
    };

    fetchConfig();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCapital = parseFloat(tempInitialCapital);
    const parsedGoal = parseFloat(tempGoalBtc);

    if (isNaN(parsedCapital) || parsedCapital < 0) {
      alert("กรุณากรอกทุนตั้งต้นให้ถูกต้อง (ต้องเป็น 0 หรือมากกว่า)");
      return;
    }

    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      alert("กรุณากรอกเป้าหมายสะสม BTC ที่มากกว่า 0");
      return;
    }

    setInitialCapital(parsedCapital);
    setGoalBtc(parsedGoal);
    setIsSettingsOpen(false);

    const capitalKey = user ? `dca_initial_capital_${user.uid}` : "dca_initial_capital_guest";
    const goalKey = user ? `dca_goal_${user.uid}` : "dca_goal_guest";

    localStorage.setItem(capitalKey, parsedCapital.toString());
    localStorage.setItem(goalKey, parsedGoal.toString());

    if (user) {
      try {
        await setDoc(
          doc(db, "user_configs", user.uid),
          {
            initialCapital: parsedCapital,
            goalBtc: parsedGoal,
          },
          { merge: true }
        );
      } catch (err) {
        console.error("บันทึกการตั้งค่าใน Firestore ไม่สำเร็จ:", err);
      }
    }
  };

  return {
    goalBtc,
    initialCapital,
    tempGoalBtc,
    tempInitialCapital,
    setTempGoalBtc,
    setTempInitialCapital,
    isSettingsOpen,
    setIsSettingsOpen,
    handleSaveSettings,
  };
}
