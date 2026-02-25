"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User } from "@/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /** ログイン後のリダイレクト先を決定して遷移 */
  const redirectAfterLogin = async () => {
    const userResponse = await api.get<User>("/api/accounts/profile/");
    const user = userResponse.data;
    if (user.user_type === "shelter") {
      router.push("/shelter/dashboard");
    } else {
      const profile = user.applicant_profile;
      const isProfileComplete = profile && profile.age && profile.indoors_agreement;
      router.push(isProfileComplete ? redirect : "/profile/edit");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // ① バックエンドがログイン成功時に HttpOnly Cookie を自動セットする
      const res = await api.post("/api/accounts/login/", formData);

      if (res.data.requires_2fa) {
        // 2FA が有効 → OTP 入力フォームを表示
        setRequiresTwoFactor(true);
        return;
      }

      await redirectAfterLogin();
    } catch (err: any) {
      console.error("Login error:", err);
      const data = err.response?.data;

      if (!data) {
        // ネットワークエラー等
        setError("サーバーに接続できませんでした。しばらく待ってから再度お試しください。");
        return;
      }

      // レート制限エラー（429）
      if (err.response?.status === 429) {
        setError("ログイン試行が多すぎます。しばらく待ってから再度お試しください。");
        return;
      }

      // フィールド別エラー（メール・パスワードのどちらが間違いか）
      const newFieldErrors: { email?: string; password?: string } = {};
      if (data.email) {
        newFieldErrors.email = Array.isArray(data.email) ? data.email[0] : data.email;
      }
      if (data.password) {
        newFieldErrors.password = Array.isArray(data.password) ? data.password[0] : data.password;
      }
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        return;
      }

      // 全体エラー（アカウント無効化など）
      if (data.detail) {
        setError(data.detail);
      } else if (data.non_field_errors) {
        const msg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        setError(msg);
      } else {
        setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/api/accounts/2fa/verify/", {
        email: formData.email,
        code: twoFactorCode,
      });
      await redirectAfterLogin();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail || "確認コードが正しくないか、有効期限が切れています。");
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // OTP 入力フォーム（2FA が要求された場合に表示）
  // ──────────────────────────────────────────────
  if (requiresTwoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">二段階認証</h1>
                <p className="text-gray-500 mt-2 text-sm">
                  {formData.email} に送信した確認コードを入力してください
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    確認コード（6桁）
                  </label>
                  <input
                    type="text"
                    id="twoFactorCode"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-center text-2xl tracking-[0.5em] font-mono focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? "確認中..." : "確認する"}
                </button>

                <button
                  type="button"
                  onClick={() => { setRequiresTwoFactor(false); setTwoFactorCode(""); setError(""); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← ログイン画面に戻る
                </button>
              </form>

              <p className="mt-4 text-xs text-gray-400 text-center">
                コードの有効期限は10分です。届かない場合は迷惑メールフォルダをご確認ください。
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    fieldErrors.email
                      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  }`}
                  placeholder="メールアドレスを入力"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldErrors.email}</p>
                )}
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
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                    fieldErrors.password
                      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  }`}
                  placeholder="パスワードを入力"
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-pink-500 hover:text-pink-600 hover:underline"
                >
                  パスワードを忘れた場合
                </Link>
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
