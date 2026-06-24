"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose(); // ปิด modal เมื่อล็อกอินสำเร็จ
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      // แปลข้อผิดพลาดของ Firebase เป็นภาษาไทยเพื่อให้ผู้ใช้เข้าใจง่าย
      switch (err.code) {
        case "auth/invalid-email":
          setError("รูปแบบอีเมลไม่ถูกต้อง");
          break;
        case "auth/user-disabled":
          setError("บัญชีนี้ถูกระงับการใช้งาน");
          break;
        case "auth/user-not-found":
          setError("ไม่พบบัญชีผู้ใช้นี้ในระบบ");
          break;
        case "auth/wrong-password":
          setError("รหัสผ่านไม่ถูกต้อง");
          break;
        case "auth/invalid-credential":
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
          break;
        case "auth/too-many-requests":
          setError("ป้อนรหัสผิดบ่อยเกินไป บัญชีถูกล็อกชั่วคราว กรุณาลองใหม่ภายหลัง");
          break;
        default:
          setError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col text-white animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#F7931A]/10 rounded text-[#F7931A]">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Access Admin</h2>
              <p className="text-xs text-gray-400 mt-0.5">เข้าสู่ระบบสำหรับผู้ดูแลระบบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-lg transition-colors"
            aria-label="ปิด"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleEmailLogin} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
              อีเมลผู้ใช้งาน (Email)
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] focus:outline-none rounded-lg pl-10.5 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 font-medium transition-colors"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
              รหัสผ่าน (Password)
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#F7931A] focus:ring-1 focus:ring-[#F7931A] focus:outline-none rounded-lg pl-10.5 pr-11 py-2.5 text-sm text-white placeholder-zinc-500 font-medium font-mono transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#F7931A] hover:bg-orange-500 text-black font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/5 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
