"use client";

import { useState } from "react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Mail, Send, Info, AlertCircle, Trash2, ShieldCheck, HelpCircle, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Backend API (Django) へ送信
      await api.post("/api/contact/", formData);
      
      toast.success("お問い合わせを送信しました。");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = [
    { value: "bug", label: "不具合の報告" },
    { value: "request", label: "機能の要望" },
    { value: "account", label: "アカウントについて（ログインできない／退会したい 等）" },
    { value: "privacy", label: "規約・プライバシーについて" },
    { value: "other", label: "その他" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#fdf2f8] to-[#f5f3ff] text-gray-900 font-sans">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-[3rem] shadow-2xl shadow-pink-200/30 overflow-hidden border border-white">
              {/* Contact Header */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-400 p-12 text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <Mail size={240} />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-md mb-6 border border-white/30">
                    <Mail className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Contact Us</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">お問い合わせ</h1>
                   <p className="text-blue-50 text-lg max-w-2xl leading-relaxed">
                    サービスに関するご質問やご要望、不具合の報告などはこちらからお寄せください。内容を確認のうえ、ご返信します。
                  </p>
                </div>
              </div>

              {/* Contact Form Container */}
              <div className="p-8 md:p-16">
                {/* Notice Box */}
                <div className="mb-12 flex items-start gap-6 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 shadow-sm backdrop-blur-sm">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm border border-blue-50">
                    <Info className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-900">譲渡に関するお問い合わせについて</h4>
                    <p className="text-sm text-blue-800/80 leading-relaxed">
                      本サービスは保護猫の譲渡交渉を仲裁する立場ではありません。譲渡条件・面談・費用など個別の譲渡内容については、各保護団体へ直接お問い合わせください。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                  {/* Left Side: Information */}
                  <div className="lg:col-span-2 space-y-10">
                    <section>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        返信できないもの
                      </h3>
                      <ul className="space-y-4 text-sm text-gray-600">
                        <li className="flex gap-3">
                          <span className="text-pink-400 font-bold">•</span>
                          <span>利用者同士・団体と里親希望者の間のトラブル（仲裁・調停）</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-pink-400 font-bold">•</span>
                          <span>個別の譲渡条件や健康状態など、当事者（保護団体）側で判断すべき内容</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-pink-400 font-bold">•</span>
                          <span>誹謗中傷や、過度な要求・不適切な内容</span>
                        </li>
                      </ul>
                    </section>

                    <section className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                      <h3 className="text-sm font-bold text-rose-600 mb-4 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        退会・データ削除のご依頼
                      </h3>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        退会やデータ削除をご希望の場合は、以下を添えてご連絡ください。
                        <br /><br />
                        1. 登録したメールアドレス
                        <br />
                        2. 「退会希望」または「データ削除希望」の明記
                        <br /><br />
                        <span className="opacity-70 text-[10px]">※本人確認のため、追加情報のご提示をお願いする場合があります。</span>
                      </p>
                    </section>

                    <section className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                      <h3 className="text-sm font-bold text-blue-600 mb-4 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        個人情報の取り扱い
                      </h3>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        お問い合わせで取得した情報は、対応および必要な連絡のために利用し、プライバシーポリシーに従って適切に管理します。
                        詳しくは <a href="/privacy" className="underline font-bold">プライバシーポリシー</a> をご覧ください。
                      </p>
                    </section>
                  </div>

                  {/* Right Side: Form */}
                  <div className="lg:col-span-3">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 ml-2 uppercase tracking-wider">お名前</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-800"
                            placeholder="山田 太郎"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 ml-2 uppercase tracking-wider">メールアドレス</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-800"
                            placeholder="example@mail.com"
                          />
                          <p className="text-[10px] text-gray-400 ml-2">※返信が必要な場合、こちら宛にご連絡します。</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 ml-2 uppercase tracking-wider">お問い合わせ種別</label>
                          <select
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-800 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:20px] bg-[right_1.5rem_center] bg-no-repeat"
                          >
                            <option value="">選択してください</option>
                            {subjects.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 ml-2 uppercase tracking-wider">お問い合わせ内容</label>
                          <textarea
                            required
                            rows={8}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-gray-800 resize-none"
                            placeholder="できるだけ具体的にご記入ください。不具合の場合は、発生日時、画面URL、操作手順、エラー内容、利用環境（iPhone/Windows等）を添えていただけますとスムーズです。"
                          ></textarea>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-5 rounded-[2rem] font-black text-white shadow-2xl shadow-blue-200/50 flex items-center justify-center gap-3 transition-all ${
                          isSubmitting
                            ? "bg-gray-300 cursor-not-allowed translate-y-0"
                            : "bg-gradient-to-br from-blue-600 to-indigo-500 hover:shadow-blue-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                        }`}
                      >
                        {isSubmitting ? (
                          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            メッセージを送信する
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-20 pt-12 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4 underline decoration-blue-200 decoration-4 underline-offset-4">運営者情報</h4>
                      <p className="text-gray-600 mb-2 font-medium">運営者：お迎えマッチ運営事務局</p>
                      <p className="text-gray-400 text-xs">
                        お問い合わせ内容によっては、返信までにお時間をいただく場合や、回答し兼ねる場合がございます。あらかじめご了承ください。
                      </p>
                    </div>
                    <div className="flex flex-col md:items-end justify-center gap-4">
                      <div className="flex flex-wrap gap-4">
                        <a href="/terms" className="text-blue-500 font-bold hover:underline">利用規約</a>
                        <a href="/privacy" className="text-blue-500 font-bold hover:underline">プライバシーポリシー</a>
                      </div>
                      <p className="text-[10px] text-gray-300">© 2026 お迎えマッチ運営事務局</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
