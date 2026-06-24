"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import AuthModal from "../AuthModal";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "ผู้ดูแลระบบ";

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {user ? (
        <>
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-full border border-zinc-800" />
          )}
          <span className="text-sm text-gray-300 hidden md:inline">สวัสดี, {displayName}</span>
          <button onClick={handleLogout} className="px-3 sm:px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-gray-300 hover:text-white rounded-md text-sm font-medium transition-colors">
            <span>ออกจากระบบ</span>
          </button>
        </>
      ) : (
        <button onClick={() => setIsAuthOpen(true)} className="px-3 sm:px-4 py-2 bg-[#F7931A] text-black hover:bg-orange-500 rounded-md text-sm font-bold transition-colors">
          <span>Access Admin</span>
        </button>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}