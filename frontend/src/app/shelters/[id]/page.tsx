"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Globe, 
  Twitter, 
  ExternalLink, 
  Clock, 
  Package,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Building2,
  Bookmark,
  Mail
} from "lucide-react";
import { sheltersService } from "@/services/shelters";
import { catsService } from "@/services/cats";
import { ShelterPublic, CatList } from "@/types";
import { getImageUrl } from "@/utils/image";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import CatCard from "@/components/cats/CatCard";
import { authService } from "@/services/auth";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { Edit2, MessageSquare, Heart } from "lucide-react";

export default function ShelterPublicProfilePage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id as string, 10) : null;
  const [shelter, setShelter] = useState<ShelterPublic | null>(null);
  const [cats, setCats] = useState<CatList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyShelter, setIsMyShelter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [shelterData, catsResponse] = await Promise.all([
          sheltersService.getPublicProfile(id),
          catsService.getCats({ shelter_id: id, status: 'open' })
        ]);
        
        setShelter(shelterData);
        setCats(catsResponse.results || []);

        // 自分がこの団体のスタッフかどうかチェック
        try {
          const user = await authService.getProfile();
          if (user.shelter_info && user.shelter_info.id === id) {
            setIsMyShelter(true);
          }
        } catch (e) {
          // 未ログイン時は無視
        }
        
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-pink-100 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-6">団体情報が見つかりません。</p>
          <Link href="/" className="inline-flex items-center text-pink-500 font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200/50 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-pink-500 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> 猫の一覧へ戻る
          </Link>
          
          {isMyShelter && (
            <Link 
              href="/shelter/profile" 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-bold shadow-lg shadow-indigo-100"
            >
              <Edit2 className="w-4 h-4" /> 団体のプロフィールを編集する
            </Link>
          )}
        </div>

        {/* 団体プロフィールヘッダー（簡素化） */}
        <section className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative w-32 h-32 rounded-3xl bg-white p-1 shadow-lg border border-gray-100 overflow-hidden flex-shrink-0">
              {shelter.logo_image ? (
                <ImageWithFallback src={shelter.logo_image} alt="logo" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-6xl">🏠</div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {shelter.shelter_type === 'cafe' ? "保護猫カフェ" : (shelter.shelter_type || "保護団体")}
                </span>
                {shelter.verification_status === 'approved' && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold flex items-center gap-1 border border-blue-100">
                    <ShieldCheck className="w-3 h-3" /> 認証済み団体
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">{shelter.name}</h1>
              <p className="text-gray-600 leading-relaxed font-medium text-lg whitespace-pre-wrap">
                {shelter.description || "団体紹介文はまだ登録されていません。"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左カラム: 猫の一覧 */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <span className="p-2 bg-pink-100 text-pink-600 rounded-2xl">🐱</span>
                保護中の猫たち 🐾
              </h2>
              
              {cats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {cats.map((cat) => (
                    <CatCard key={cat.id} cat={cat} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-bold text-lg">現在里親募集中の猫はいません</p>
                </div>
              )}

            </section>
          </div>

          {/* 右カラム: 基本情報・支援 */}
          <div className="space-y-8">
            {/* 支援リンク */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6 text-orange-400" />
                支援のお願い
              </h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-6 leading-relaxed bg-orange-50/50 p-4 rounded-xl border-l-4 border-orange-200 font-medium">
                  {shelter.support_message || "保護猫たちの食費や医療費など、活動への温かいご支援をお願いしております。"}
                </p>
                
                <div className="grid grid-cols-1 gap-3">
                  {shelter.support_goods_url ? (
                    <a 
                      href={shelter.support_goods_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-all font-bold shadow-sm"
                    >
                      <span className="text-sm">Amazon欲しいものリスト</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl text-xs text-center border border-dashed border-gray-200">
                      物資支援リストは未登録です
                    </div>
                  )}
                  
                  {shelter.support_donation_url ? (
                    <a 
                      href={shelter.support_donation_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border-2 border-indigo-500 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all font-bold"
                    >
                      <span className="text-sm">寄付・支援金について</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl text-xs text-center border border-dashed border-gray-200">
                      寄付情報の詳細は未登録です
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 保護受付状況 */}
            {shelter.rescue_accepting && (
              <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 border-t-8 border-t-blue-400">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-500" />
                  一般からの保護相談
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-xl text-xs font-bold w-fit">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> 現在相談を受け付けています
                  </div>
                  
                  {shelter.rescue_area_text && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">対応エリア</p>
                      <p className="text-sm font-bold text-gray-700">{shelter.rescue_area_text}</p>
                    </div>
                  )}
                  
                  {shelter.rescue_notes && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">注意事項・条件</p>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{shelter.rescue_notes}</p>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-400 italic">
                    ※保護には条件がある場合があります。詳細は公式サイト等をご確認ください。
                  </p>
                </div>
              </section>
            )}

            {/* 連絡先・アクセス */}
            <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
               <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                 アクセス・連絡先
               </h2>
               
               <div className="space-y-6">
                 <div className="bg-gray-50 p-5 rounded-2xl">
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> LOCATION</p>
                   <p className="text-sm text-gray-800 font-bold leading-relaxed">
                     〒{shelter.postcode}<br/>
                     {shelter.address || "住所は一般公開されています。"}
                   </p>
                 </div>

                 {shelter.email && (
                   <div className="bg-gray-50 p-5 rounded-2xl">
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> CONTACT EMAIL</p>
                     <p className="text-sm text-gray-800 font-bold leading-relaxed break-all">
                       <a href={`mailto:${shelter.email}`} className="hover:text-indigo-600 transition-colors">
                         {shelter.email}
                       </a>
                     </p>
                   </div>
                 )}

                 {(shelter.business_hours || shelter.transfer_available_hours) && (
                    <div className="space-y-4 px-1">
                      {shelter.business_hours && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> OPEN HOURS</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap font-bold leading-relaxed">{shelter.business_hours}</p>
                        </div>
                      )}
                      {shelter.transfer_available_hours && (
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> ADOPTION HOURS</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap font-bold leading-relaxed">{shelter.transfer_available_hours}</p>
                        </div>
                      )}
                    </div>
                 )}

                 <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                    {shelter.website_url && (
                      <a href={shelter.website_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px] flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:border-indigo-500 transition-all group">
                         <Globe className="w-5 h-5 text-indigo-500" />
                         <span className="text-[10px] font-bold text-gray-600">公式サイト</span>
                      </a>
                    )}
                    {shelter.sns_url && (
                      <a href={shelter.sns_url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[100px] flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 transition-all group">
                         <Twitter className="w-5 h-5 text-blue-400" />
                         <span className="text-[10px] font-bold text-gray-600">SNS・活動報告</span>
                      </a>
                    )}
                  </div>
               </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
  </svg>
);
