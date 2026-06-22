"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName = user?.displayName ?? user?.email ?? "ผู้ใช้";

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-gray-300">สวัสดี, {displayName}</span>
          <button onClick={handleLogout} className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-200">
            ออกจากระบบ
          </button>
        </>
      ) : (
        <button onClick={handleLogin} disabled={loading} className="px-4 py-2 bg-[#F7931A] text-white rounded-md text-sm font-medium hover:bg-[#E88318] disabled:opacity-60">
          {loading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย Google"}
        </button>
      )}
    </div>
  );
}