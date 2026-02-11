"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function ShelterLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/api/accounts/login/", formData);
      const { access, refresh } = response.data;

      // Cookieにトークンを保存
      const isSecure = process.env.NODE_ENV === "production";
      Cookies.set("access_token", access, { expires: 1, secure: isSecure, sameSite: "Lax" });
      Cookies.set("refresh_token", refresh, { expires: 7, secure: isSecure, sameSite: "Lax" });

      // ユーザー情報を取得して団体スタッフかどうか確認
      const userResponse = await api.get("/api/accounts/profile/");
      const user = userResponse.data;

      if (user.user_type !== "shelter" && user.user_type !== "admin") {
        // 団体アカウントでない場合はエラー
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        setError("このアカウントは保護団体として登録されていません。一般ユーザーとしてログインしてください。");
        return;
      }

      // 団体ダッシュボードへリダイレクト
      router.push("/shelter/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data) {
        const errorData = err.response.data;
        const errorMessages = Object.values(errorData).flat().join(" ");
        setError(errorMessages || "ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      } else {
        setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          {/* ログインカード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
            {/* アイコン */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">団体ログイン</h1>
              <p className="text-gray-500 mt-2 text-sm">
                保護団体スタッフ専用ページ
              </p>
            </div>


            {/* エラーメッセージ */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* ログインフォーム */}
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
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="メールアドレスを入力"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="パスワードを入力"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                    ログイン中...
                  </span>
                ) : (
                  "団体ログイン"
                )}
              </button>
            </form>

            {/* 一般ユーザーログインリンク */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm mb-2">
                飼い主希望者の方はこちら
              </p>
              <Link
                href="/login"
                className="text-pink-500 font-medium text-sm hover:underline inline-flex items-center gap-1"
              >
                <span>🐱</span>
                一般ログイン
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
