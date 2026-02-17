"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  ExternalLink, 
  Heart, 
  ShieldCheck, 
  Package, 
  CreditCard, 
  MessageCircle, 
  ArrowLeft,
  Calendar,
  Info
} from "lucide-react";
import { sheltersService, ShelterPublic } from "@/services/shelters";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

export default function ShelterPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? parseInt(params.id as string, 10) : null;
  
  const [shelter, setShelter] = useState<ShelterPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await sheltersService.getPublicProfile(id);
        setShelter(data);
      } catch (err: any) {
        console.error("Failed to fetch shelter profile:", err);
        setError(err.response?.status === 404 ? "団体が見つからないか、非公開に設定されています。" : "エラーが発生しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{error}</h1>
          <button 
            onClick={() => router.push("/")}
            className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Header />
      
      <main className="pb-20">
        {/* ヒーローセクション */}
        <div className="relative h-[250px] sm:h-[350px] w-full bg-gradient-to-r from-gray-200 to-gray-300 overflow-hidden">
          {shelter.header_image ? (
            <Image 
              src={shelter.header_image} 
              alt={shelter.name} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-indigo-100 text-8xl grayscale opacity-30">
              🐾
            </div>
          )}
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="absolute bottom-4 left-4 sm:left-8">
             <button 
               onClick={() => router.back()}
               className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 text-sm font-bold rounded-full hover:bg-white transition-all shadow-sm"
             >
               <ArrowLeft className="w-4 h-4" /> 戻る
             </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          
          {/* 団体基本情報カード */}
          <div className="-mt-16 bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-gray-200/50 border border-gray-100 relative z-10 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* ロゴアイコン */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-white p-1 shadow-lg border border-gray-50 flex-shrink-0 relative overflow-hidden">
                {shelter.logo_image ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image src={shelter.logo_image} alt={shelter.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-pink-50 flex items-center justify-center text-4xl">
                    🏠
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-[10px] font-bold rounded uppercase tracking-tighter">
                     {shelter.shelter_type === 'cafe' ? '保護猫カフェ' : '保護団体'}
                   </span>
                   <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                     <ShieldCheck className="w-3 h-3" /> 各種確認済み
                   </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2 truncate">{shelter.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-pink-400" />
                    <span>{shelter.prefecture}{shelter.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-pink-400" />
                    <span>登録: {new Date(shelter.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                {shelter.website_url && (
                  <a 
                    href={shelter.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md"
                  >
                    公式サイト <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {shelter.sns_url && (
                  <a 
                    href={shelter.sns_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    SNS・活動報告 <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* 紹介文 */}
            <div className="mt-10 pt-10 border-t border-gray-50">
               <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span className="p-1.5 bg-pink-100 text-pink-600 rounded-lg"><MessageCircle className="w-5 h-5" /></span>
                 団体紹介・活動の想い
               </h2>
               <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                 {shelter.description || "団体紹介文はまだ登録されていません。"}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左: 保護受付セクション */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Heart className="w-5 h-5" /></span>
                  一般からの保護受付
                </h2>
                
                <div className="flex items-center gap-4 mb-8">
                   <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${shelter.rescue_accepting ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                     <span className={`w-2 h-2 rounded-full ${shelter.rescue_accepting ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                     {shelter.rescue_accepting ? '現在、保護を受け付けています' : '現在は受け付けておりません'}
                   </div>
                </div>

                {shelter.rescue_accepting && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> 受付対象エリア
                      </h3>
                      <p className="text-gray-800 font-bold text-lg">{shelter.rescue_area_text || "詳細はお問い合わせください"}</p>
                    </div>
                    
                    {shelter.rescue_notes && (
                      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <h3 className="text-orange-800 text-sm font-bold mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" /> 保護依頼に関する注意事項
                        </h3>
                        <p className="text-orange-950 text-sm leading-relaxed whitespace-pre-wrap">
                          {shelter.rescue_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {!shelter.rescue_accepting && (
                  <p className="text-gray-500 text-sm italic">
                    ※個人で保護された猫の掲載については、各団体にお問い合わせください。緊急の場合はお近くの行政機関等へご相談ください。
                  </p>
                )}
              </div>
              
              {/* この団体の猫たちを表示するセクション (将来拡張用) */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white">
                 <h2 className="text-xl font-bold mb-2">里親募集中</h2>
                 <p className="opacity-80 text-sm mb-6">{shelter.name}で新しい家族を待っている猫たちです。</p>
                 <Link 
                    href={`/cats?shelter=${shelter.id}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg"
                 >
                   募集中の猫リストを見る
                 </Link>
              </div>
            </div>

            {/* 右: 支援セクション */}
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm border-t-8 border-t-pink-400">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="p-1.5 bg-pink-100 text-pink-600 rounded-lg"><Package className="w-5 h-5" /></span>
                  ご支援のお願い
                </h2>
                
                {shelter.support_message && (
                  <p className="text-gray-600 text-sm mb-8 leading-relaxed italic border-l-4 border-pink-100 pl-4">
                    「{shelter.support_message}」
                  </p>
                )}
                
                <div className="space-y-3">
                  {shelter.support_goods_url && (
                    <a 
                      href={shelter.support_goods_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full p-4 bg-orange-50 text-orange-700 rounded-2xl hover:bg-orange-100 transition-all border border-orange-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6" />
                        <span className="font-bold">物資を支援する</span>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  
                  {shelter.support_donation_url && (
                    <a 
                      href={shelter.support_donation_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between w-full p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all border border-blue-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6" />
                        <span className="font-bold">寄付金で支援する</span>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  
                  {!shelter.support_goods_url && !shelter.support_donation_url && (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm">現在、ウェブからの支援受付設定はありません。詳細は公式サイト等をご確認ください。</p>
                    </div>
                  )}
                </div>
                
                <p className="mt-6 text-[11px] text-gray-400 leading-relaxed">
                  ※支援リンクはAmazon等の外部プラットフォームへ遷移します。支援の内容・用途については各団体へ直接ご確認ください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
