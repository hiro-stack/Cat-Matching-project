"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [email, setEmail] = useState("");

  // ログイン済みユーザーのメールアドレスを取得
  useEffect(() => {
    api.get("/api/accounts/profile/")
      .then((res) => {
        // すでに認証済みならプロフィール編集へ
        if (res.data.is_email_verified) {
          router.push("/profile/edit");
          return;
        }
        setEmail(res.data.email);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/api/accounts/email-verify/", { code });
      router.push("/profile/edit");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail || "確認コードが正しくないか、有効期限が切れています。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    setError("");

    try {
      await api.post("/api/accounts/email-verify/resend/");
      setResendMessage("確認コードを再送しました。メールをご確認ください。");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail || "再送に失敗しました。しばらく待ってから再度お試しください。");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            {/* アイコン */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full mb-4">
                <MailCheck className="w-8 h-8 text-pink-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">メールアドレスの確認</h1>
              {email && (
                <p className="text-gray-500 mt-2 text-sm">
                  <span className="font-medium text-gray-700">{email}</span> に送信した<br />
                  6桁の確認コードを入力してください
                </p>
              )}
            </div>

            {/* エラー */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* 再送成功 */}
            {resendMessage && (
              <div className="mb-5 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
                {resendMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
                  確認コード（6桁）
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
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
                disabled={isLoading || code.length !== 6}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "確認中..." : "認証する"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
              <p className="text-xs text-gray-400">コードが届かない場合</p>
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-sm text-pink-500 hover:text-pink-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? "送信中..." : "確認コードを再送する"}
              </button>
              <p className="text-xs text-gray-400 mt-1">コードの有効期限は10分です</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
