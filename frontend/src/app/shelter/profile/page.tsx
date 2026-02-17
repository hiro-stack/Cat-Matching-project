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
import { compressImage } from "@/utils/image";
import { toast } from "react-hot-toast";

export default function ShelterProfileEditPage() {
  const router = useRouter();
  const [shelter, setShelter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchShelter = async () => {
      try {
        const data = await sheltersService.getMyShelter();
        setShelter(data);
        setLogoPreview(data.logo_image);
        setHeaderPreview(data.header_image);
      } catch (err) {
        console.error("Failed to fetch shelter:", err);
        toast.error("団体情報の取得に失敗しました。");
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'header') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') setLogoPreview(reader.result as string);
        else setHeaderPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
      
      setShelter((prev: any) => ({
        ...prev,
        [type === 'logo' ? 'logo_image' : 'header_image']: compressed
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
      Object.keys(shelter).forEach(key => {
        if (key === 'logo_image' || key === 'header_image') {
          if (shelter[key] instanceof File || shelter[key] instanceof Blob) {
            formData.append(key, shelter[key]);
          }
        } else if (typeof shelter[key] === 'boolean') {
          formData.append(key, shelter[key] ? 'true' : 'false');
        } else if (shelter[key] !== null) {
          formData.append(key, shelter[key]);
        }
      });

      await api.patch(`/api/shelters/${shelter.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success("プロフィールを更新しました。");
      router.refresh();
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("更新に失敗しました。詳細を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-center">読み込み中...</div>;
  if (!shelter) return <div className="p-10 text-center">団体情報が見つかりません。</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl"><Globe className="w-8 h-8" /></span>
            団体プロフィール編集
          </h1>
          <p className="text-gray-500 mt-2">一般公開される団体の情報を管理します。</p>
        </div>
        
        <div className="flex gap-4">
           {shelter.public_profile_enabled && (
             <Link 
               href={`/shelters/${shelter.id}`} 
               target="_blank"
               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold"
             >
               <Eye className="w-4 h-4" /> 公開ページを確認
             </Link>
           )}
           <button
             onClick={handleSubmit}
             disabled={isSaving}
             className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-100 disabled:opacity-50"
           >
             <Save className="w-5 h-5" />
             {isSaving ? "保存中..." : "保存する"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* 基本設定 */}
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
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
             </div>

             <div className="space-y-6">
               <div className="relative group overflow-hidden rounded-2xl h-48 bg-gray-100">
                  {headerPreview ? (
                    <Image src={headerPreview} alt="Header" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">ヘッダー画像</span>
                    </div>
                  )}
                  <button 
                    onClick={() => headerInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold"
                  >
                    <Upload className="w-5 h-5" /> 変更する
                  </button>
                  <input ref={headerInputRef} type="file" className="hidden" onChange={(e) => handleImageChange(e, 'header')} accept="image/*" />
               </div>

               <div className="flex gap-6 items-end -mt-12 px-6">
                  <div className="relative group w-24 h-24 rounded-3xl bg-white p-1 shadow-lg border border-gray-100 overflow-hidden">
                    {logoPreview ? (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden">
                        <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                        🏠
                      </div>
                    )}
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <input ref={logoInputRef} type="file" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} accept="image/*" />
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-bold text-gray-400 mb-1">団体のシンボルマーク</p>
                    <p className="text-[10px] text-gray-400">推奨: 500x500px以上の正方形</p>
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
                     className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 outline-none transition-all resize-none"
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
                     <ExternalLink className="w-3 h-3 text-gray-400" />
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
                     <ExternalLink className="w-3 h-3 text-gray-400" />
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

           <section className="bg-gray-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Twitter className="w-24 h-24" />
              </div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                SNS/Web連携
              </h2>
              <div className="space-y-4 relative z-10">
                <div>
                   <label className="block text-[10px] font-black uppercase text-indigo-300 mb-2 tracking-widest">公式サイト URL</label>
                   <input
                     name="website_url"
                     value={shelter.website_url || ""}
                     onChange={handleChange}
                     className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:bg-white/20 outline-none transition-all"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-indigo-300 mb-2 tracking-widest">SNS / 活動報告 URL</label>
                   <input
                     name="sns_url"
                     value={shelter.sns_url || ""}
                     onChange={handleChange}
                     className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:bg-white/20 outline-none transition-all"
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
