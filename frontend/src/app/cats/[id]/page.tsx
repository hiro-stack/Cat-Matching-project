"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, Play, Image as ImageIcon, ExternalLink, Calendar, Clock, Heart, Activity, Stethoscope, Twitter, AlertCircle, PawPrint, Lightbulb, Home, Sparkles, CheckCircle2, Handshake, ChevronRight } from "lucide-react";
import { catsService } from "@/services/cats";
import { CatDetail, CatImage, CatVideo } from "@/types";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import api from "@/lib/api";

const STATUS_LABELS = {
  open: "募集中",
  adopted: "譲渡済み",
  trial: "トライアル中",
  in_review: "審査中",
  paused: "一時停止",
} as const;

const STATUS_COLORS = {
  open: "bg-[#a8e6cf] text-[#2d5f4f]",
  adopted: "bg-[#d4b5d4] text-[#5a4a5a]",
  trial: "bg-[#ffd4a3] text-[#8b5e3c]",
  in_review: "bg-[#e8daef] text-[#5b2c6f]",
  paused: "bg-gray-200 text-gray-600",
} as const;

const GENDER_LABELS = {
  male: "オス",
  female: "メス",
  unknown: "不明",
} as const;

const AGE_CATEGORY_LABELS: Record<string, string> = {
  kitten: "子猫",
  adult: "成猫",
  senior: "シニア猫",
  unknown: "不明",
};

const HEALTH_Category_LABELS: Record<string, string> = {
  healthy: "問題なし",
  needs_care: "ケアあり",
  treatment: "継続治療中",
  unknown: "不明",
};

const FIV_FELV_LABELS: Record<string, string> = {
  negative: "陰性 (-)",
  positive_fiv: "FIV陽性 (+)",
  positive_felv: "FeLV陽性 (+)",
  positive_double: "ダブルキャリア",
  untested: "未検査",
  unknown: "不明",
};

const AFFECTION_LEVEL_LABELS: Record<number, string> = {
  5: "5: とろとろ甘えん坊",
  4: "4: 甘えん坊",
  3: "3: ツンデレ",
  2: "2: クール",
  1: "1: 怖がり",
};

const MAINTENANCE_LEVEL_LABELS: Record<string, string> = {
    easy: "初心者でも安心 (楽々)",
    normal: "少しコツが必要 (普通)",
    hard: "経験者向き (練習中)",
};

const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
    active: "活発",
    normal: "普通",
    calm: "おっとり",
    unknown: "不明",
};

const INTERVIEW_FORMAT_LABELS: Record<string, string> = {
    online: "オンライン",
    offline: "対面",
    both: "対面・オンライン可",
};


// 画像と動画を統合したメディアアイテム型
interface MediaItem {
  id: number;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export default function CatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id ? parseInt(params.id as string, 10) : null;
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [cat, setCat] = useState<CatDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  useEffect(() => {
    if (!id) return;

    const fetchCat = async () => {
      try {
        setIsLoading(true);
        const data = await catsService.getCat(id);
        setCat(data);

        // 画像と動画を統合したメディアリストを作成
        const items: MediaItem[] = [];

        // 画像を追加
        if (data.images && data.images.length > 0) {
          data.images.forEach((img: CatImage) => {
            items.push({
              id: img.id,
              type: "image",
              url: img.image_url || img.image,
              thumbnailUrl: img.image_url || img.image,
              caption: img.caption,
            });
          });
        } else if (data.primary_image) {
          items.push({
            id: 0,
            type: "image",
            url: data.primary_image,
            thumbnailUrl: data.primary_image,
          });
        }

        // 動画を追加
        if (data.videos && data.videos.length > 0) {
          data.videos.forEach((video: CatVideo) => {
            items.push({
              id: video.id,
              type: "video",
              url: video.video_url || video.video,
              caption: video.caption,
            });
          });
        }

        setMediaItems(items);
      } catch (err) {
        console.error("Failed to fetch cat details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCat();
  }, [id]);

  const handleApplyClick = async () => {
    try {
      // ユーザー情報の役割をチェック
      const res = await api.get("/api/accounts/profile/");
      const user = res.data;

      if (user.user_type === 'shelter' || user.shelter_role) {
        alert("保護団体アカウント（スタッフ・管理者）の方は、里親への応募はできません。一般ユーザーアカウントでログインしてください。");
        return;
      }

      // 現在の応募数をチェック
      const applicationsRes = await api.get("/api/applications/");
      const applications = Array.isArray(applicationsRes.data)
        ? applicationsRes.data
        : (applicationsRes.data.results || []);

      const activeStatuses = ['pending', 'reviewing', 'accepted'];
      const activeApplicationsCount = applications.filter(
        (app: any) => activeStatuses.includes(app.status)
      ).length;

      if (activeApplicationsCount >= 3) {
        alert("現在進行中の応募が3件あります。一度に応募できる猫は3匹までです。\n\n先に進行中の応募を完了させるか、キャンセルしてから新しい応募を行ってください。");
        return;
      }
    } catch (err) {
      console.error("Failed to check user role or applications:", err);
    }

    router.push(`/cats/${id}/apply`);
  };

  const selectedMedia = mediaItems[selectedMediaIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐾</div>
          <p className="text-[#9b9baa]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!cat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😿</div>
          <h2 className="text-2xl font-semibold text-[#5a5a6b] mb-2">
            保護猫が見つかりません
          </h2>
          <Link href="/">
            <button className="px-6 py-2 bg-[#f4a5b9] text-white rounded-lg hover:bg-[#ef8ca4] transition-colors">
              一覧に戻る
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] relative font-sans text-gray-800">

      {/* ヘッダー */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b-2 border-[#f4a5b9]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-[#f4a5b9] hover:text-[#f28ea6]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            一覧に戻る
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 受付停止中のアラート */}
        {cat.status !== "open" && (
          <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  現在、この保護猫の里親募集は停止されています
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    現在のステータス: <span className="font-bold">{STATUS_LABELS[cat.status as keyof typeof STATUS_LABELS] || cat.status}</span>
                  </p>
                  <p className="mt-1">
                    申し訳ありませんが、現在は応募を受け付けておりません。<br/>
                    <Link href="/" className="text-amber-900 underline hover:text-amber-800">他の募集中の保護猫</Link>もぜひご覧ください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左カラム：メディアギャラリー */}
          <div className="space-y-4">
            {/* メイン表示エリア */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              {selectedMedia ? (
                selectedMedia.type === "video" ? (
                  // 動画表示
                  <video
                    key={selectedMedia.url}
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  >
                    お使いのブラウザは動画をサポートしていません。
                  </video>
                ) : (
                  // 画像表示
                  <ImageWithFallback
                    key={selectedMedia.url}
                    src={selectedMedia.url}
                    alt={`${cat.name} - 画像 ${selectedMediaIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-200 gap-4">
                  <PawPrint className="w-24 h-24" />
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-300">No Image Available</p>
                </div>
              )}

              {/* ステータスバッジ */}
              <div className="absolute top-4 left-4 z-10">
                <span
                  className={`${STATUS_COLORS[cat.status as keyof typeof STATUS_COLORS] || "bg-gray-200 text-gray-600"} px-3 py-1 rounded-full text-sm font-bold shadow-sm`}
                >
                  {STATUS_LABELS[cat.status as keyof typeof STATUS_LABELS] || cat.status}
                </span>
              </div>

              {/* メディアタイプ表示 */}
              {selectedMedia && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-black/50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 backdrop-blur-sm">
                    {selectedMedia.type === "video" ? (
                      <>
                        <Play className="w-3 h-3" />
                        動画
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        画像
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* サムネイル一覧 */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {mediaItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                      selectedMediaIndex === index
                        ? "ring-2 ring-pink-500 ring-offset-2"
                        : "hover:opacity-80"
                    }`}
                  >
                    {item.type === "video" ? (
                      // 動画サムネイル
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-center">
                          <Play className="w-6 h-6 text-white mx-auto" />
                        </div>
                      </div>
                    ) : (
                      // 画像サムネイル
                      <ImageWithFallback
                        src={item.thumbnailUrl || item.url}
                        alt={`${cat.name} - サムネイル ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* キャプション */}
            {selectedMedia?.caption && (
              <p className="text-sm text-gray-600 bg-white/80 backdrop-blur-sm rounded-xl py-3 px-5 shadow-sm border border-pink-100 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>{selectedMedia.caption}</span>
              </p>
            )}
            
            {/* カフェの基本情報 (スマホ版で上部に持ってくるデザインもアリだが、一旦ここに配置) */}
            <div 
                onClick={() => router.push(`/shelters/${cat.shelter.id}`)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-pink-200 hover:-translate-y-1 transition-all cursor-pointer group/card"
            >
                 <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shadow-sm group-hover/card:bg-indigo-100 group-hover/card:scale-110 transition-all">
                     <Home className="w-6 h-6" />
                   </div>
                   <span>お問い合わせ・譲渡元</span>
                   <ChevronRight className="w-5 h-5 ml-auto text-gray-300 group-hover/card:text-pink-500 group-hover/card:translate-x-1 transition-all" />
                 </h2>
                 <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                         <div className="flex-1 text-center sm:text-left">
                            <p className="font-bold text-2xl text-pink-600 group-hover/card:text-pink-700 transition-colors flex items-center justify-center sm:justify-start gap-2">
                                {cat.shelter.name}
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500 mt-1">
                                {cat.shelter.prefecture && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{cat.shelter.prefecture}</span>}
                                <span>{cat.shelter.city}</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-3 pt-2 border-t border-gray-50">
                         {cat.shelter.address && (
                             <div className="flex items-start gap-3">
                                 <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                 </div>
                                 <span className="leading-relaxed">{cat.shelter.address}</span>
                             </div>
                         )}
                         {cat.shelter.business_hours && (
                             <div className="flex items-start gap-3">
                                 <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400">
                                    <Clock className="w-4 h-4" />
                                 </div>
                                 <div className="flex-1">
                                     <span className="font-bold text-gray-700 block text-xs mb-0.5">営業時間・定休日</span>
                                     <span className="whitespace-pre-wrap leading-relaxed">{cat.shelter.business_hours}</span>
                                 </div>
                             </div>
                         )}
                      </div>
                 </div>
            </div>
            
             {/* 応募ボタン (Desktop: 左カラム下部、Mobile: 固定フッター等は未実装なので一旦ここに) */}
            <div className="pt-4">
                {cat.status === "open" ? (
                <button 
                  onClick={handleApplyClick} 
                  className="w-full py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white text-lg font-bold rounded-2xl hover:from-pink-500 hover:to-pink-600 transition-all shadow-lg transform hover:scale-[1.02] duration-200 flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  この猫の里親に応募する
                </button>
              ) : (
                <button 
                  disabled
                  className="w-full py-4 bg-gray-300 text-gray-500 text-lg font-bold rounded-2xl cursor-not-allowed"
                >
                  {STATUS_LABELS[cat.status as keyof typeof STATUS_LABELS] || cat.status} (受付停止中)
                </button>
              )}
              <p className="text-xs text-center text-gray-500 mt-2">
                 応募にはログインとプロフィールの登録が必要です
              </p>
            </div>

          </div>

          {/* 右カラム：情報エリア */}
          <div className="space-y-6">
            
            {/* 名前と品種 */}
            <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                         {AGE_CATEGORY_LABELS[cat.age_category] || "不明"}
                    </span>
                    <span className="text-gray-400 text-sm">ID: {cat.id}</span>
                 </div>
                 <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{cat.name}</h1>
                 <p className="text-lg text-gray-600">{cat.breed}</p>
            </div>
            
            {/* 基本スペック */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">性別</div>
                    <div className="font-bold text-gray-700">{GENDER_LABELS[cat.gender as keyof typeof GENDER_LABELS]}</div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">年齢</div>
                    <div className="font-bold text-gray-700">{cat.estimated_age}</div>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">毛色</div>
                    <div className="font-bold text-gray-700">{cat.color || "不明"}</div>
                </div>
            </div>

            {/* 性格・特徴 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-5 flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    性格・特徴
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                     <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium border border-pink-100">
                         甘えん坊度: {AFFECTION_LEVEL_LABELS[cat.affection_level as keyof typeof AFFECTION_LEVEL_LABELS]}
                     </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">
                         お手入れ: {MAINTENANCE_LEVEL_LABELS[cat.maintenance_level as keyof typeof MAINTENANCE_LEVEL_LABELS]}
                     </span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                         活動量: {ACTIVITY_LEVEL_LABELS[cat.activity_level]}
                     </span>
                </div>
                
                {cat.personality && (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {cat.personality}
                    </p>
                )}
            </div>

            {/* ストーリー・紹介文 */}
            {cat.description && (
              <div className="bg-white rounded-lg p-6 shadow-md border border-pink-100">
                <h2 className="text-xl font-bold text-gray-900 mb-3">紹介文</h2>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{cat.description}</p>
              </div>
            )}
            
             {/* 医療情報 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Activity className="w-6 h-6" />
                    </div>
                    医療情報・健康状態
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="block text-xs text-gray-500 mb-1">不妊去勢</span>
                        <span className="font-bold text-gray-800 flex items-center gap-1.5">
                             {cat.spay_neuter_status === 'done' ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> 実施済み</> : 
                              cat.spay_neuter_status === 'planned' ? '実施予定' : 
                              cat.spay_neuter_status === 'not_yet' ? '未実施' : '不明'}
                        </span>
                    </div>
                     <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="block text-xs text-gray-500 mb-1">ワクチン</span>
                        <span className="font-bold text-gray-800 flex items-center gap-1.5">
                             {cat.vaccination_status === 'done' ? <><CheckCircle2 className="w-4 h-4 text-green-500" /> 接種済み</> : 
                              cat.vaccination_status === 'partial' ? '一部接種済み' : 
                              cat.vaccination_status === 'not_yet' ? '未接種' : '不明'}
                        </span>
                    </div>
                     <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="block text-xs text-gray-500 mb-1">ウイルス検査 (FIV/FeLV)</span>
                        <span className="font-medium text-gray-800">
                             {FIV_FELV_LABELS[cat.fiv_felv_status]}
                        </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="block text-xs text-gray-500 mb-1">現在の健康状態</span>
                        <span className="font-medium text-gray-800">
                             {HEALTH_Category_LABELS[cat.health_status_category]}
                        </span>
                    </div>
                </div>
                {cat.health_notes && (
                     <div className="mt-4 p-4 bg-blue-50/50 rounded-xl text-sm text-gray-700">
                        <p className="font-bold text-blue-800 mb-1">特記事項</p>
                        {cat.health_notes}
                     </div>
                )}
            </div>
            
            {/* 譲渡条件 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shadow-sm">
                      <Handshake className="w-6 h-6" />
                    </div>
                    譲渡条件
                </h2>
                <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                          <span className="text-gray-500">面談形式</span>
                          <span className="font-medium">{INTERVIEW_FORMAT_LABELS[cat.interview_format]}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                          <span className="text-gray-500">トライアル期間</span>
                          <span className="font-medium">{cat.trial_period || "応相談"}</span>
                      </div>
                       <div className="flex justify-between items-center py-4 border-b border-gray-50">
                          <span className="text-gray-500">譲渡費用</span>
                          <div className="text-right">
                              <span className="font-bold text-xl text-pink-600">¥{cat.transfer_fee.toLocaleString()}</span>
                              {cat.fee_details && (
                                  <p className="text-[10px] text-gray-400 mt-1">
                                      内訳: {cat.fee_details}
                                  </p>
                              )}
                          </div>
                      </div>

                      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm mt-4">
                          <h3 className="text-amber-800 text-xs font-bold mb-2 flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5" />
                              詳しい譲渡条件・特記事項
                          </h3>
                          <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed min-h-[1em]">
                              {cat.other_terms || ""}
                          </p>
                      </div>
                </div>
             </div>



            <div className="text-xs text-gray-400 text-right">
                登録日: {new Date(cat.created_at).toLocaleDateString()}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
