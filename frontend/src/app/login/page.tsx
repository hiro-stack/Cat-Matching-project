"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User } from "@/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [formData, setFormData] = useState({
    username: "",
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

      // ユーザー情報を取得してリダイレクト先を決定
      const userResponse = await api.get<User>("/api/accounts/profile/");
      const user = userResponse.data;

      if (user.user_type === "shelter") {
        router.push("/shelter/dashboard");
      } else {
        // 里親（adopter）の場合、プロフィール入力完了チェック
        const profile = user.applicant_profile;
        const isProfileComplete = profile && profile.age && profile.indoors_agreement; // 最低限の必須項目チェック

        if (!isProfileComplete) {
          router.push("/profile/edit");
        } else {
          router.push(redirect);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("ログインに失敗しました。ユーザー名とパスワードを確認してください。");
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
          {/* ログインカード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            {/* アイコン */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full mb-4">
                <span className="text-3xl">🐱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">ログイン</h1>
              <p className="text-gray-500 mt-2 text-sm">
                保護猫マッチングへようこそ
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
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  ユーザー名
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  placeholder="ユーザー名を入力"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  placeholder="パスワードを入力"
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
                    ログイン中...
                  </span>
                ) : (
                  "ログイン"
                )}
              </button>
            </form>

            {/* 区切り線 */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-400">または</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* 新規登録リンク */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-3">
                アカウントをお持ちでない方
              </p>
              <Link
                href="/signup"
                className="inline-block w-full py-3 border-2 border-pink-400 text-pink-500 font-medium rounded-xl hover:bg-pink-50 transition-colors"
              >
                新規登録
              </Link>
            </div>

            {/* 団体ログインリンク */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm mb-2">保護団体の方はこちら</p>
              <Link
                href="/shelter/login"
                className="text-pink-500 font-medium text-sm hover:underline inline-flex items-center gap-1"
              >
                <span>🏠</span>
                団体ログイン
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
