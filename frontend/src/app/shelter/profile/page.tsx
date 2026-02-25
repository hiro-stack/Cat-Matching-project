"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Save, 
  Globe, 
  MessageSquare, 
  Heart, 
  Twitter, 
  Upload, 
  X,
  Info,
  ExternalLink,
  Lock,
  Eye,
  Camera,
  Package
} from "lucide-react";
import api from "@/lib/api";
import { sheltersService } from "@/services/shelters";
import { compressImage, getImageUrl } from "@/utils/image";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { toast } from "react-hot-toast";

export default function ShelterProfileEditPage() {
  const router = useRouter();
  const [shelter, setShelter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchShelter = async () => {
      try {
        const [shelterData, profileData] = await Promise.all([
          sheltersService.getMyShelter(),
          api.get("/api/accounts/profile/")
        ]);
        
        setShelter(shelterData);
        setLogoPreview(shelterData.logo_image);
        setIsAdmin(profileData.data.is_superuser || profileData.data.shelter_role === 'admin');
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/shelter/login");
          return;
        }
        toast.error("データの取得に失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchShelter();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setShelter((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
      
      setShelter((prev: any) => ({
        ...prev,
        logo_image: compressed
      }));
    } catch (err) {
      console.error("Image processing failed:", err);
      toast.error("画像の処理に失敗しました。");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      
      // 送信から除外する読み取り専用フィールド
      const excludeFields = ['id', 'verification_status', 'contact_verified', 'review_message', 'created_at', 'updated_at', 'representative'];

      Object.keys(shelter).forEach(key => {
        if (excludeFields.includes(key)) return;

        const value = shelter[key];

        // 画像フィールドの処理: File/Blobオブジェクトの場合のみ（新規選択時）
        if (key === 'logo_image' || key === 'header_image') {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          }
        } 
        // その他の値（null/undefined以外）
        else if (value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else {
            formData.append(key, String(value));
          }
        }
      });

      await api.patch(`/api/shelters/${shelter.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("プロフィールを更新しました。");
      router.refresh();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      
      if (err.response?.status === 400 && err.response.data) {
        // バリデーションエラーの詳細を表示
        const errorData = err.response.data;
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            const fieldName = {
              support_goods_url: '物資支援リンク',
              support_donation_url: '寄付リンク',
              website_url: '公式サイトURL',
              sns_url: 'SNS URL',
              email: 'メールアドレス'
            }[key] || key;
            return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
          })
          .join('\n');
        
        toast.error(`更新に失敗しました：\n${errorMessages}`, {
          duration: 5000
        });
      } else {
        toast.error("更新に失敗しました。詳細を確認してください。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">読み込み中...</div>;
  if (!shelter) return <div className="p-10 text-center">団体情報が見つかりません。</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl"><Globe className="w-8 h-8" /></span>
            団体プロフィール編集
          </h1>
          <p className="text-gray-500 mt-2">一般公開される団体の情報を管理します。</p>
        </div>
        
        <div className="flex w-full sm:w-auto gap-3">
           {shelter.public_profile_enabled && (
             <Link 
               href={`/shelters/${shelter.id}`} 
               target="_blank"
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold"
             >
               <Eye className="w-4 h-4" /> 公開ページ
             </Link>
           )}
           {isAdmin && (
             <button
               onClick={handleSubmit}
               disabled={isSaving}
               className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 disabled:opacity-50"
             >
               <Save className="w-5 h-5" />
               {isSaving ? "保存中..." : "保存する"}
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* 基本設定 (省略) */}
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="p-1.5 bg-pink-100 text-pink-600 rounded-lg"><Info className="w-5 h-5" /></span>
                  一般公開・基本情報
                </h2>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                   <span className="text-sm font-bold text-gray-700">プロフィールの公開</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="public_profile_enabled"
                      checked={shelter.public_profile_enabled}
                      onChange={handleChange}
                      disabled={!isAdmin}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>
             </div>

             <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">団体名・カフェ名 <span className="text-red-500">*</span></label>
                   <input
                     name="name"
                     value={shelter.name || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all"
                     placeholder="保護猫カフェ 〇〇"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">種別</label>
                   <select
                     name="shelter_type"
                     value={shelter.shelter_type || "cafe"}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all bg-white"
                   >
                     <option value="cafe">保護猫カフェ</option>
                     <option value="organization">保護団体</option>
                     <option value="individual">個人保護主</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">代表電話番号 <span className="text-red-500">*</span></label>
                   <input
                     name="phone"
                     value={shelter.phone || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                     placeholder="03-1234-5678"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">代表メールアドレス <span className="text-red-500">*</span></label>
                   <input
                     name="email"
                     type="email"
                     value={shelter.email || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                     placeholder="contact@example.com"
                     required
                   />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="md:col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-2">郵便番号</label>
                   <input
                     name="postcode"
                     value={shelter.postcode || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                     placeholder="123-4567"
                   />
                 </div>
                 <div className="md:col-span-1">
                   <label className="block text-sm font-bold text-gray-700 mb-2">都道府県 <span className="text-red-500">*</span></label>
                   <input
                     name="prefecture"
                     value={shelter.prefecture || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                     placeholder="東京都"
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-bold text-gray-700 mb-2">市区町村 <span className="text-red-500">*</span></label>
                   <input
                     name="city"
                     value={shelter.city || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                     placeholder="渋谷区代々木"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">番地・建物名など <span className="text-red-500">*</span></label>
                 <input
                   name="address"
                   value={shelter.address || ""}
                   onChange={handleChange}
                   className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all"
                   placeholder="1-2-3 〇〇ビル 2F"
                   required
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">営業時間・定休日</label>
                   <textarea
                     name="business_hours"
                     value={shelter.business_hours || ""}
                     onChange={handleChange}
                     rows={3}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all resize-none"
                     placeholder="平日 11:00-20:00 / 水曜定休"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">譲渡対応可能な時間帯</label>
                   <textarea
                     name="transfer_available_hours"
                     value={shelter.transfer_available_hours || ""}
                     onChange={handleChange}
                     rows={3}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all resize-none"
                     placeholder="土日祝 13:00-17:00（要予約）など"
                   />
                 </div>
               </div>

               <div className="pt-6 border-t border-gray-100 flex gap-6 items-center">
                  <div className="relative group w-24 h-24 rounded-3xl bg-white p-1 shadow-lg border border-gray-100 overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden">
                        <ImageWithFallback src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 text-3xl">
                        🏠
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <input ref={logoInputRef} type="file" className="hidden" onChange={(e) => handleImageChange(e)} accept="image/*" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-1">団体のシンボルマーク</p>
                    <p className="text-[10px] text-gray-400">推奨: 500x500px以上の正方形。ロゴ画像は各所で円形または角丸で表示されます。</p>
                    {isAdmin && (
                      <button 
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> 画像を変更する
                      </button>
                    )}
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">団体紹介文</label>
                 <textarea
                   name="description"
                   value={shelter.description || ""}
                   onChange={handleChange}
                   rows={6}
                   className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none"
                   placeholder="活動方針、譲渡の流れ、カフェの雰囲気、SNSへの誘導などを記入してください。"
                 />
                 <p className="mt-1.5 text-[10px] text-gray-400">※Markdownには対応していません。テキストのみで魅力的に伝えてください。</p>
               </div>
             </div>
          </section>

          {/* 保護受付設定 */}
          <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
               <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Heart className="w-5 h-5" /></span>
               一般からの保護受付
             </h2>

             <div className="space-y-6">
               <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-800">保護に関する相談を受け付ける</p>
                      <p className="text-[10px] text-blue-600">プロフィールに受付ステータスが表示されます。</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="rescue_accepting"
                      checked={shelter.rescue_accepting}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
               </div>

               <div className={`space-y-4 transition-all ${shelter.rescue_accepting ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">受付対応エリア</label>
                   <input
                     name="rescue_area_text"
                     value={shelter.rescue_area_text || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all"
                     placeholder="例：東京都内、〇〇市周辺、一都三県など"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">注意事項・定型文</label>
                   <textarea
                     name="rescue_notes"
                     value={shelter.rescue_notes || ""}
                     onChange={handleChange}
                     rows={3}
                     className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:border-indigo-500 outline-none transition-all resize-none"
                     placeholder="例：緊急時は行政へ、持ち込み不可、事前連絡必須など"
                   />
                 </div>
               </div>
             </div>
          </section>
        </div>

        {/* 右カラム：支援リンク */}
        <div className="space-y-8">
           <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm border-t-8 border-t-orange-400">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Package className="w-5 h-5" /></span>
                支援募集の設定
              </h2>
              
              <div className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                     物資支援リンク
                   </label>
                   <input
                     name="support_goods_url"
                     value={shelter.support_goods_url || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                     placeholder="Amazon欲しいものリスト等"
                   />
                </div>
                
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                     寄付リンク
                   </label>
                   <input
                     name="support_donation_url"
                     value={shelter.support_donation_url || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm"
                     placeholder="公式寄付ページ、Square等"
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">支援のお願いメッセージ</label>
                   <textarea
                     name="support_message"
                     value={shelter.support_message || ""}
                     onChange={handleChange}
                     rows={3}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none transition-all text-sm resize-none"
                     placeholder="例：毎日使う消耗品が不足しています。ご協力お願いします。"
                   />
                </div>
              </div>
           </section>

           <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><Twitter className="w-5 h-5" /></span>
                SNS/Web連携
              </h2>
              <div className="space-y-6 relative z-10">
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">公式サイト URL</label>
                   <input
                     name="website_url"
                     value={shelter.website_url || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-all"
                     placeholder="https://example.com"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">SNS / 活動報告 URL</label>
                   <input
                     name="sns_url"
                     value={shelter.sns_url || ""}
                     onChange={handleChange}
                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none text-sm transition-all"
                     placeholder="https://instagram.com/your_account"
                   />
                </div>
              </div>
           </section>

           <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 leading-relaxed font-medium">
                プロフィールの更新には管理者権限が必要です。スタッフ権限での変更は制限されています。
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

