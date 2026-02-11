"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("/api/accounts/password-reset/", { email });
      setMessage("パスワードリセット用のリンクをメールで送信しました。");
      setEmail("");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      // 詳細なエラーメッセージがあれば表示、なければ汎用メッセージ
      if (err.response?.data?.detail) {
          setError(err.response.data.detail);
      } else {
          setError("メール送信に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">パスワードをお忘れの方</h1>
              <p className="text-gray-500 mt-2 text-sm">
                ご登録のメールアドレスを入力してください。<br />
                パスワード再設定用のリンクをお送りします。
              </p>
            </div>

            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm">
                {message}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  メールアドレス
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  placeholder="メールアドレスを入力"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    送信中...
                  </span>
                ) : (
                  "送信する"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-pink-500 font-medium text-sm hover:underline inline-flex items-center gap-1"
              >
                ← ログインに戻る
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
