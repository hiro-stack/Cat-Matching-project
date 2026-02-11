"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;
  const token = params.token as string;

  const [formData, setFormData] = useState({
    new_password: "",
    re_new_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

    if (formData.new_password !== formData.re_new_password) {
      setError("パスワードが一致しません。");
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/api/accounts/password-reset/confirm/", {
        uid,
        token,
        new_password: formData.new_password,
        re_new_password: formData.re_new_password,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.re_new_password) {
        setError(err.response.data.re_new_password[0]);
      } else {
        setError("パスワードの再設定に失敗しました。リンクが無効か期限切れの可能性があります。");
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
              <h1 className="text-2xl font-bold text-gray-800">新しいパスワードの設定</h1>
              <p className="text-gray-500 mt-2 text-sm">
                新しいパスワードを入力してください。
              </p>
            </div>

            {success ? (
              <div className="text-center">
                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm">
                  パスワードの再設定が完了しました。
                </div>
                <Link
                  href="/login"
                  className="inline-block w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all"
                >
                  ログインへ
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="new_password"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      新しいパスワード
                    </label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                      placeholder="8文字以上で入力"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="re_new_password"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      新しいパスワード（確認）
                    </label>
                    <input
                      type="password"
                      id="re_new_password"
                      name="re_new_password"
                      value={formData.re_new_password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                      placeholder="もう一度入力"
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
                        設定中...
                      </span>
                    ) : (
                      "パスワードを変更する"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
