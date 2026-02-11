"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  User, 
  ClipboardCheck, 
  Heart,
  AlertCircle,
  ChevronRight,
  Home,
  Clock,
  Briefcase
} from "lucide-react";
import api from "@/lib/api";
import Cookies from "js-cookie";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { CatDetail, User as UserType } from "@/types";

const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  no_answer: "回答しない",
};

const HOUSING_TYPE_LABELS: Record<string, string> = {
  owned: "持ち家",
  rented: "賃貸",
};

const PET_ALLOWED_LABELS: Record<string, string> = {
  allowed: "可（契約書あり）",
  planned: "確認予定",
  not_allowed: "不可",
};

const ABSENCE_TIME_LABELS: Record<string, string> = {
  less_than_4: "4時間未満",
  "4_to_8": "4〜8時間",
  "8_to_12": "8〜12時間",
  more_than_12: "12時間以上",
};

const HOME_FREQUENCY_LABELS: Record<string, string> = {
  high: "高い（ほぼ毎日）",
  medium: "普通（週2-3日在宅）",
  low: "低い（ほぼ不在）",
};

export default function ApplicationApplyPage() {
  const params = useParams();
  const router = useRouter();
  const catId = params.id ? parseInt(params.id as string, 10) : null;
  
  const [cat, setCat] = useState<CatDetail | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    message: "",
    term_agreement: false,
    lifelong_care_agreement: false,
    spay_neuter_agreement: false,
    medical_cost_understanding: false,
    income_status: "stable",
    emergency_contact_available: false,
    family_consent: false,
    allergy_status: false,
    cafe_data_sharing_consent: false,
  });

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      router.push(`/login?redirect=/cats/${catId}/apply`);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [catRes, userRes] = await Promise.all([
          api.get(`/api/cats/${catId}/`),
          api.get("/api/accounts/profile/")
        ]);
        setCat(catRes.data);
        setUser(userRes.data);

        // 基本情報の不足チェック
        // if (!userRes.data.phone_number || !userRes.data.address) {
        //   // 警告を出すか、編集ページへ促す
        //   setApplicationError("連絡先情報（電話番号・住所）が未登録です。プロフィール設定から登録してください。");
        // }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (catId) fetchData();
  }, [catId, router]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId) return;
    
    setIsSubmitting(true);
    setApplicationError("");
    setFieldErrors({});

    try {
      const response = await api.post("/api/applications/", {
        cat: catId,
        ...formData
      });
      
      if (response.data && response.data.id) {
        router.push(`/applications/complete?id=${response.data.id}`);
      }
    } catch (err: any) {
      console.error("Application failed:", err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
           setFieldErrors(errorData);
           setApplicationError(errorData.detail || errorData.non_field_errors?.[0] || "入力内容に不備があります。");
        }
      } else {
        setApplicationError("申請の送信に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!cat || !user) return null;

  const profile = user.applicant_profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        <div className="mb-8">
          <Link href={`/cats/${catId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            猫の紹介ページへ戻る
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">里親申請の確認と同意</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: 同意フォーム */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. 提供される個人情報の確認 */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
               <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">提供される情報の確認</h2>
                  <p className="text-xs text-gray-500">この申請を行うと、以下の情報が保護団体「{cat.shelter.name}」に開示されます。</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-xs text-gray-500 block">氏名（ユーザー名）</span>
                      <span className="font-bold">{user.username}</span>
                    </div>
                  </div>
                  {user.phone_number && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-xs text-gray-500 block">電話番号</span>
                        <span className="font-bold">{user.phone_number}</span>
                      </div>
                    </div>
                  )}
                  {user.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-xs text-gray-500 block">現在の住所</span>
                        <span className="font-bold">{user.address}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">年齢:</span> <span className="font-medium">{profile?.age || "未入力"}歳</span>
                  </div>
                  <div>
                    <span className="text-gray-500">性別:</span> <span className="font-medium">{profile?.gender ? GENDER_LABELS[profile.gender] : "未入力"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">居住エリア:</span> <span className="font-medium">{profile?.residence_area || "未入力"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">住宅形態:</span> <span className="font-medium">{profile?.housing_type ? HOUSING_TYPE_LABELS[profile.housing_type] : "未入力"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ペット可否:</span> <span className="font-medium">{profile?.pet_allowed ? PET_ALLOWED_LABELS[profile.pet_allowed] : "未入力"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">完全室内飼い:</span> <span className="font-medium">{profile?.indoors_agreement ? "同意済み" : "未回答"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">平均留守時間:</span> <span className="font-medium">{profile?.absence_time ? ABSENCE_TIME_LABELS[profile.absence_time] : "未入力"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">在宅頻度:</span> <span className="font-medium">{profile?.home_frequency ? HOME_FREQUENCY_LABELS[profile.home_frequency] : "未入力"}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Link href="/profile/edit" className="text-sm text-pink-500 font-bold hover:underline flex items-center gap-1">
                    情報を変更・追加する <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </section>

            {/* 2. 申請フォーム */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-pink-50 rounded-xl">
                    <ClipboardCheck className="w-6 h-6 text-pink-500" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">追加情報の入力</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      応募動機・メッセージ <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      required 
                      name="message" 
                      value={formData.message} 
                      onChange={handleFormChange} 
                      rows={5} 
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-pink-200 transition-all resize-none ${fieldErrors.message ? 'border-red-500' : 'border-gray-100'}`}
                      placeholder="例：以前も猫を飼っていた経験があり、この子の穏やかな性格に惹かれました。家族全員で温かく迎え入れたいと思っています。" 
                    />
                    {fieldErrors.message && <p className="text-xs text-red-500 mt-1">{fieldErrors.message[0]}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        現在の収入状況 <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="income_status" 
                        value={formData.income_status} 
                        onChange={handleFormChange} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-pink-200 transition-all font-medium"
                      >
                        <option value="stable">安定している</option>
                        <option value="unstable">やや不安定／変動がある</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                      <input type="checkbox" name="emergency_contact_available" checked={formData.emergency_contact_available} onChange={handleFormChange} className="mt-1 w-5 h-5 text-pink-500 rounded-lg focus:ring-pink-500 border-gray-300" />
                      <div>
                        <span className="text-sm font-bold text-gray-700 block">緊急時の対応</span>
                        <span className="text-xs text-gray-500">自分に万が一のことがあった際、猫を預けられる場所や人がいます。</span>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                      <input type="checkbox" name="family_consent" checked={formData.family_consent} onChange={handleFormChange} className="mt-1 w-5 h-5 text-pink-500 rounded-lg focus:ring-pink-500 border-gray-300" />
                      <div>
                        <span className="text-sm font-bold text-gray-700 block">家族の同意</span>
                        <span className="text-xs text-gray-500">同居家族全員が、この猫を家族として迎え入れることに同意しています。</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                      <input type="checkbox" name="allergy_status" checked={formData.allergy_status} onChange={handleFormChange} className="mt-1 w-5 h-5 text-pink-500 rounded-lg focus:ring-pink-500 border-gray-300" />
                      <div>
                        <span className="text-sm font-bold text-gray-700 block">猫アレルギー</span>
                        <span className="text-xs text-gray-500">本人および同居家族に猫アレルギーはいません（または、対策が取れています）。</span>
                      </div>
                    </label>
                  </div>
                </div>
              </section>

              {/* 3. 同意事項 */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">里親としての誓約</h3>
                
                <div className="space-y-4">
                  {[
                    { name: 'term_agreement', label: '利用規約および個人情報保護方針の内容を理解し、同意します' },
                    { name: 'lifelong_care_agreement', label: '何があっても生涯この猫を大切に育てることを誓います' },
                    { name: 'spay_neuter_agreement', label: '適切な不妊去勢手術を行い、状況を報告することに同意します' },
                    { name: 'medical_cost_understanding', label: '必要な医療（ワクチンや通院）と、譲渡時の費用負担に同意します' },
                  ].map((item) => (
                    <label key={item.name} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        required 
                        type="checkbox" 
                        name={item.name} 
                        checked={formData[item.name as keyof typeof formData] as boolean} 
                        onChange={handleFormChange} 
                        className="w-5 h-5 text-pink-500 rounded-lg focus:ring-pink-500 border-gray-300" 
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors font-medium">{item.label}</span>
                    </label>
                  ))}
                  
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-pink-50 border border-pink-100 rounded-2xl mt-6">
                    <input 
                      required 
                      type="checkbox" 
                      name="cafe_data_sharing_consent" 
                      checked={formData.cafe_data_sharing_consent} 
                      onChange={handleFormChange} 
                      className="mt-1 w-6 h-6 text-pink-500 rounded-lg focus:ring-pink-500 border-pink-200" 
                    />
                    <span className="text-sm text-pink-900 font-bold leading-relaxed">
                      入力した情報（メッセージ、連絡先、プロフィール）を保護団体「{cat.shelter.name}」へ提供し、里親申請することに同意します。
                    </span>
                  </label>
                </div>

                {applicationError && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {applicationError}
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2 text-lg transform hover:scale-[1.01] active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>送信中...</span>
                      </div>
                    ) : (
                      <>
                        <Heart className="w-6 h-6 fill-current" />
                        同意して団体へ応募情報を送る
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-4">
                    ※ 応募後は取り消しができません。メッセージ機能を通じて団体と直接やり取りを行ってください。
                  </p>
                </div>
              </section>
            </form>
          </div>

          {/* 右側: 応募対象猫のミニ情報 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="aspect-[4/3] relative">
                <img 
                  src={cat.primary_image || "/images/placeholder_cat.svg"} 
                  alt={cat.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm uppercase tracking-tighter">
                    {cat.breed}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.name} ちゃん</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Home className="w-4 h-4" /> {cat.shelter.name}</span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">年齢区分</span>
                    <span className="font-bold">{cat.age_category === 'kitten' ? '子猫' : cat.age_category === 'adult' ? '成猫' : 'シニア'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">性別</span>
                    <span className="font-bold">{cat.gender === 'male' ? 'オス' : 'メス'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">譲渡費用</span>
                    <span className="font-bold text-pink-500">¥{cat.transfer_fee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 審査について
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    申請後、保護団体による審査が行われます。返信には数日かかる場合があります。メッセージ履歴はマイページから確認可能です。
                  </p>
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
