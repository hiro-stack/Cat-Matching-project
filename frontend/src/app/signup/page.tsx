"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { 
  Building2, 
  User as UserIcon, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  MapPin,
  Globe,
  Smartphone,
  AlertCircle,
  Lock,
  Sparkles,
  Info
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [isShelterFlow, setIsShelterFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    // Shelter specific fields
    shelter_name: "",
    shelter_prefecture: "東京都",
    shelter_city: "",
    shelter_postcode: "",
    shelter_address: "",
    shelter_phone: "",
    shelter_email: "",
    shelter_website_url: "",
    shelter_sns_url: "",
    shelter_business_hours: "",
    shelter_transfer_available_hours: "",
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToVerification, setAgreedToVerification] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate specific step
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.username) newErrors.username = "ユーザー名は必須です";
      if (!formData.email) newErrors.email = "メールアドレスは必須です";
      if (!formData.password) newErrors.password = "パスワードは必須です";
      if (formData.password.length < 8) newErrors.password = "パスワードは8文字以上必要です";
      if (formData.password !== formData.password_confirm) newErrors.password_confirm = "パスワードが一致しません";
      if (isShelterFlow && !formData.shelter_name) newErrors.shelter_name = "カフェ名・団体名は必須です";
    } 
    
    if (isShelterFlow) {
      if (step === 2) {
        if (!formData.shelter_phone) newErrors.shelter_phone = "代表電話番号は必須です";
        if (!formData.shelter_email) newErrors.shelter_email = "代表メールアドレスは必須です";
      } else if (step === 3) {
        if (!formData.shelter_city) newErrors.shelter_city = "市区町村は必須です";
        if (!formData.shelter_address) newErrors.shelter_address = "丁目・番地・号室は必須です";
      } else if (step === 5) {
        if (!agreedToTerms || !agreedToVerification) {
          newErrors.general = "利用規約および審査への同意が必要です";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Final validation
    if (isShelterFlow) {
      if (!validateStep(5)) return;
    } else {
      if (!validateStep(1)) return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const endpoint = isShelterFlow ? "/api/accounts/register/shelter/" : "/api/accounts/register/";

      // バックエンドが登録成功時に HttpOnly Cookie を自動セットする
      await api.post(endpoint, formData);

      if (isShelterFlow) {
        setIsCompleted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push("/verify-email");
      }
    } catch (err: any) {
      console.error("Signup error detail:", err.response?.data || err.message);
      if (err.response?.data) {
        const data = err.response.data;
        const fieldErrors: Record<string, string> = {};
        
        // Handle nested or array errors from Django
        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (Array.isArray(val)) fieldErrors[key] = val[0];
          else if (typeof val === "string") fieldErrors[key] = val;
          else if (typeof val === "object") fieldErrors[key] = JSON.stringify(val);
        });

        // 全エラーを結合して general メッセージとしても表示する
        const allErrorMessages = Object.entries(fieldErrors)
          .map(([key, msg]) => `${msg}`)
          .join('、');
        if (allErrorMessages) {
          fieldErrors.general = `入力内容にエラーがあります: ${allErrorMessages}`;
        }

        setErrors(fieldErrors);

        // Auto-jump to the step containing the first error
        if (isShelterFlow) {
          if (fieldErrors.username || fieldErrors.email || fieldErrors.password || fieldErrors.password_confirm || fieldErrors.shelter_name) {
            setCurrentStep(1);
          } else if (fieldErrors.shelter_phone || fieldErrors.shelter_email) {
            setCurrentStep(2);
          } else if (fieldErrors.shelter_city || fieldErrors.shelter_address || fieldErrors.shelter_postcode) {
            setCurrentStep(3);
          }
        }

        // エラーメッセージが見えるようにスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrors({ general: "サーバーとの通信に失敗しました。ネットワーク状況を確認してください。" });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  // --- RENDERING ---

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#fcf9f9] flex flex-col">
        <Header />
        <main className="flex-grow pt-32 pb-16 px-4">
          <div className="max-w-xl mx-auto text-center">
            <div className="bg-white rounded-[40px] shadow-2xl p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 to-purple-400" />
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-8">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">申請ありがとうございます！</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">保護団体・カフェの登録申請を受け付けました。<br />現在、運営にて内容の確認を行っております。</p>
              <div className="bg-blue-50/50 rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-800 font-medium">審査期間：通常1〜3営業日以内</p>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-800">実在確認が完了次第、メールにて通知いたします。</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">審査中も管理画面の一部機能をご利用いただけます</p>
                <Link href="/shelter/dashboard" className="inline-flex items-center justify-center w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg text-lg">
                  管理画面へ
                </Link>
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Info className="w-3 h-3" />
                  猫の登録（下書き）のみ可能ですが、公開は審査完了後となります。
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f9] font-sans text-gray-900">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          
          {isShelterFlow && (
            <div className="max-w-2xl mx-auto mb-12">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                      currentStep >= step ? "bg-pink-500 text-white shadow-lg scale-110" : "bg-gray-200 text-gray-400"
                    }`}>
                      {step}
                    </div>
                    {step < 5 && (
                      <div className={`absolute left-1/2 top-4 w-full h-0.5 z-0 ${
                        currentStep > step ? "bg-pink-300" : "bg-gray-100"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 font-medium px-2">
                <span className={currentStep === 1 ? "text-pink-600" : ""}>基本情報</span>
                <span className={currentStep === 2 ? "text-pink-600" : ""}>連絡先</span>
                <span className={currentStep === 3 ? "text-pink-600" : ""}>店舗詳細</span>
                <span className={currentStep === 4 ? "text-pink-600" : ""}>外部リンク</span>
                <span className={currentStep === 5 ? "text-pink-600" : ""}>完了</span>
              </div>
            </div>
          )}

          <div className={`bg-white rounded-[40px] shadow-2xl p-8 sm:p-12 border border-gray-100 transition-all duration-500 relative ${isShelterFlow ? "max-w-3xl mx-auto" : "max-w-md mx-auto"}`}>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                {isShelterFlow ? "保護団体・カフェ申請" : "新規登録"}
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                {isShelterFlow 
                  ? "約5〜10分で完了します。運営審査を経て本登録となります。" 
                  : "保護猫との素晴らしい出会いを始めましょう"}
              </p>
            </div>

            {errors.general && (
              <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium flex gap-3 items-center">
                <AlertCircle className="w-5 h-5" /> {errors.general}
              </div>
            )}

            <div className="space-y-8">
              {!isShelterFlow ? (
                /* --- ADOPTER FLOW --- */
                <div className="space-y-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">ユーザー名</label>
                      <input type="text" name="username" value={formData.username} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all ${errors.username ? "ring-2 ring-red-300" : ""}`} placeholder="なまえ" />
                      {errors.username && <p className="mt-2 text-xs text-red-500 font-medium">{errors.username}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">メールアドレス</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all ${errors.email ? "ring-2 ring-red-300" : ""}`} placeholder="mail@example.com" />
                      {errors.email && <p className="mt-2 text-xs text-red-500 font-medium">{errors.email}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">パスワード</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all ${errors.password ? "ring-2 ring-red-300" : ""}`} placeholder="8文字以上でパスワードを入力してください" />
                        {errors.password && <p className="mt-2 text-xs text-red-500 font-medium">{errors.password}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">確認用</label>
                        <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none transition-all ${errors.password_confirm ? "ring-2 ring-red-300" : ""}`} placeholder="再度パスワードを入力してください" />
                        {errors.password_confirm && <p className="mt-2 text-xs text-red-500 font-medium">{errors.password_confirm}</p>}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => handleSubmit()} disabled={isLoading} className="w-full py-5 bg-gradient-to-br from-pink-500 to-pink-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
                    {isLoading ? "登録中..." : "アカウントを作成する"}
                    {!isLoading && <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              ) : (
                /* --- SHELTER MULTI-STEP FLOW --- */
                <div>
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <UserIcon className="w-6 h-6 text-pink-500" /> ① アカウント基本情報
                      </h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">カフェ名・団体名 <span className="text-red-500">*</span></label>
                          <input type="text" name="shelter_name" value={formData.shelter_name} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.shelter_name ? "ring-2 ring-red-300" : ""}`} placeholder="保護猫カフェ 〇〇" />
                          <p className="mt-2 text-[10px] text-gray-400 italic flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            ユーザーに表示される正式な名称をご入力ください。
                          </p>
                          {errors.shelter_name && <p className="mt-2 text-xs text-red-500 font-medium">{errors.shelter_name}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">管理ユーザー名 <span className="text-red-500">*</span></label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.username ? "ring-2 ring-red-300" : ""}`} placeholder="admin_name" />
                            {errors.username && <p className="mt-2 text-xs text-red-500 font-medium">{errors.username}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">管理メールアドレス <span className="text-red-500">*</span></label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.email ? "ring-2 ring-red-300" : ""}`} placeholder="personal@example.com" />
                            {errors.email && <p className="mt-2 text-xs text-red-500 font-medium">{errors.email}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">パスワード <span className="text-red-500">*</span></label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.password ? "ring-2 ring-red-300" : ""}`} placeholder="8文字以上" />
                            {errors.password && <p className="mt-2 text-xs text-red-500 font-medium">{errors.password}</p>}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">確認用 <span className="text-red-500">*</span></label>
                            <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.password_confirm ? "ring-2 ring-red-300" : ""}`} placeholder="再入力" />
                            {errors.password_confirm && <p className="mt-2 text-xs text-red-500 font-medium">{errors.password_confirm}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6"><Smartphone className="w-6 h-6 text-pink-500" /> ② 連絡先・本人確認</h2>
                      <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4 items-center mb-8">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500">
                          <Lock className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-blue-800 font-medium leading-relaxed">電話番号・メールは運営確認でのみ使用し、ユーザーに直接公開されません。</p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">代表電話番号 <span className="text-red-500">*</span></label>
                          <input type="tel" name="shelter_phone" value={formData.shelter_phone} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.shelter_phone ? "ring-2 ring-red-300" : ""}`} placeholder="03-1234-5678" />
                          {errors.shelter_phone && <p className="mt-2 text-xs text-red-500 font-medium">{errors.shelter_phone}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">代表メールアドレス <span className="text-red-500">*</span></label>
                          <input type="email" name="shelter_email" value={formData.shelter_email} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.shelter_email ? "ring-2 ring-red-300" : ""}`} placeholder="official@shelter.com" />
                          {errors.shelter_email && <p className="mt-2 text-xs text-red-500 font-medium">{errors.shelter_email}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6"><MapPin className="w-6 h-6 text-pink-500" /> ③ 店舗詳細（公開情報）</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">郵便番号</label>
                          <input type="text" name="shelter_postcode" value={formData.shelter_postcode} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="123-4567" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">都道府県 <span className="text-red-500">*</span></label>
                          <select name="shelter_prefecture" value={formData.shelter_prefecture} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-white">
                            {prefectures.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">市区町村 <span className="text-red-500">*</span></label>
                          <input type="text" name="shelter_city" value={formData.shelter_city} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.shelter_city ? "ring-2 ring-red-300" : ""}`} placeholder="渋谷区代々木" />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">番地・建物名・号室 <span className="text-red-500">*</span></label>
                          <input type="text" name="shelter_address" value={formData.shelter_address} onChange={handleChange} className={`w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none ${errors.shelter_address ? "ring-2 ring-red-300" : ""}`} placeholder="1-2-3 〇〇ビル 2F" />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">営業時間・定休日</label>
                          <textarea name="shelter_business_hours" value={formData.shelter_business_hours} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none h-28 resize-none text-sm" placeholder="平日 11:00-20:00 / 水曜定休" />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6"><Globe className="w-6 h-6 text-pink-500" /> ④ 外部リンク（任意）</h2>
                      <div className="p-5 bg-green-50/50 rounded-3xl border border-green-100 flex gap-4 items-center mb-8">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-500">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-green-800 font-medium leading-relaxed">公式サイトやSNSを登録すると、ユーザーの信頼度が大幅に高まります。</p>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">公式サイト URL</label>
                          <input type="url" name="shelter_website_url" value={formData.shelter_website_url} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">SNS URL (Instagram等)</label>
                          <input type="url" name="shelter_sns_url" value={formData.shelter_sns_url} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none" placeholder="https://instagram.com/..." />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6"><ShieldCheck className="w-6 h-6 text-pink-500" /> ⑤ 規約・送信確認</h2>
                      <div className="space-y-3">
                        <button type="button" onClick={() => setAgreedToTerms(!agreedToTerms)} className={`w-full flex gap-4 p-6 rounded-3xl transition-all border-2 text-left ${agreedToTerms ? "bg-pink-50 border-pink-200" : "bg-white border-gray-100"}`}>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${agreedToTerms ? "bg-pink-500 border-pink-500" : "border-gray-200"}`}>
                            {agreedToTerms && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className="text-sm font-bold text-gray-700 leading-relaxed">
                            <Link href="/terms" onClick={(e) => e.stopPropagation()} className="text-pink-600 underline decoration-2">利用規約</Link> に同意します
                          </span>
                        </button>
                        <button type="button" onClick={() => setAgreedToVerification(!agreedToVerification)} className={`w-full flex gap-4 p-6 rounded-3xl transition-all border-2 text-left ${agreedToVerification ? "bg-pink-50 border-pink-200" : "bg-white border-gray-100"}`}>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${agreedToVerification ? "bg-pink-500 border-pink-500" : "border-gray-200"}`}>
                            {agreedToVerification && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className="text-sm font-bold text-gray-700 leading-relaxed">虚偽の申請はなく、運営による審査があることに同意します</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-10">
                    {currentStep > 1 && (
                      <button type="button" onClick={handleBack} className="flex-1 py-5 bg-gray-50 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                        <ChevronLeft className="w-5 h-5" /> 戻る
                      </button>
                    )}
                    <button type="button" onClick={() => currentStep === 5 ? handleSubmit() : handleNext()} disabled={isLoading} className="flex-[2] py-5 bg-gradient-to-br from-pink-500 to-pink-600 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {isLoading ? "送信中..." : (currentStep === 5 ? "申請の内容を送信する" : "次へ進む")}
                      {!isLoading && <ChevronRight className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Link href="/login" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-pink-50 text-pink-600 shadow-sm hover:bg-pink-100">
                  ログインはこちら
                </Link>
              </div>
              <button 
                onClick={() => { 
                  setIsShelterFlow(!isShelterFlow); 
                  setCurrentStep(1); 
                  setErrors({}); 
                }} 
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isShelterFlow ? "bg-gray-50 text-gray-400" : "bg-pink-50 text-pink-600 shadow-sm"
                }`}
              >
                {isShelterFlow ? "一般登録へ戻る" : "保護団体・カフェの方はこちら"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
