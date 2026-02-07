"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, Play, Image as ImageIcon } from "lucide-react";
import { catsService } from "@/services/cats";
import { CatDetail, CatImage, CatVideo } from "@/types";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import api from "@/lib/api";
import Cookies from "js-cookie";

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
  
  // 応募モーダル用
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    occupation: "",
    phone_number: "",
    address: "",
    housing_type: "apartment",
    family_members: "1",
    has_experience: false,
    motivation: "",
  });

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

  const handleApplyClick = () => {
    const token = Cookies.get("access_token");
    if (!token) {
      // ログインページへリダイレクト（戻り先を指定）
      router.push(`/login?redirect=/cats/${id}`);
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
       setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // エラーをクリア
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);
    setApplicationError("");
    setFieldErrors({});

    try {
      // 申請を作成
      const response = await api.post("/api/applications/", {
        cat: id,
        ...formData,
        age: parseInt(formData.age),
        family_members: parseInt(formData.family_members),
      });
      
      if (response.data && response.data.id) {
        router.push(`/messages/${response.data.id}`);
      } else {
        console.error("Application created but no ID returned:", response.data);
        setApplicationError("申請は完了しましたが、画面遷移に失敗しました。マイページをご確認ください。");
      }
      
    } catch (err: any) {
      console.error("Application failed:", err);
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // 全体エラーとフィールドエラーを振り分け
        if (typeof errorData === 'object') {
           const newFieldErrors: Record<string, string[]> = {};
           let hasGlobalError = false;

           Object.entries(errorData).forEach(([key, value]) => {
             if (Array.isArray(value)) {
               if (key === 'non_field_errors' || key === 'detail') {
                 setApplicationError(value.join(" "));
                 hasGlobalError = true;
               } else {
                 newFieldErrors[key] = value as string[];
               }
             } else if (typeof value === 'string') {
               if (key === 'detail' || key === 'non_field_errors') {
                 setApplicationError(value);
                 hasGlobalError = true;
               }
             }
           });
           
           setFieldErrors(newFieldErrors);
           
           if (!hasGlobalError && Object.keys(newFieldErrors).length > 0) {
             setApplicationError("入力内容に不備があります。赤字の項目を確認してください。");
           }
        } else {
           setApplicationError("申請の送信に失敗しました。");
        }
      } else {
        setApplicationError("サーバーエラーが発生しました。");
      }
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] relative">
      {/* 応募モーダル */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-gray-800">
                里親への応募
              </h3>
              <button 
                onClick={() => setIsApplyModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <p className="mb-6 text-gray-600 text-sm">
                {cat.name}ちゃんへの応募ありがとうございます。以下の必須項目を入力して、保護団体へのメッセージを開始しましょう。
              </p>

              {applicationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {applicationError}
                </div>
              )}

              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">氏名 <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="full_name" 
                      value={formData.full_name} 
                      onChange={handleFormChange} 
                      className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      placeholder="山田 太郎" 
                    />
                    {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">年齢 <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="number" 
                      name="age" 
                      value={formData.age} 
                      onChange={handleFormChange} 
                      className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.age ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      placeholder="30" 
                    />
                    {fieldErrors.age && <p className="text-xs text-red-500 mt-1">{fieldErrors.age[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">職業 <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="occupation" 
                      value={formData.occupation} 
                      onChange={handleFormChange} 
                      className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.occupation ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      placeholder="会社員" 
                    />
                    {fieldErrors.occupation && <p className="text-xs text-red-500 mt-1">{fieldErrors.occupation[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">電話番号 <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="phone_number" 
                      value={formData.phone_number} 
                      onChange={handleFormChange} 
                      className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.phone_number ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      placeholder="090-1234-5678" 
                    />
                    {fieldErrors.phone_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_number[0]}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">住所 <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    name="address" 
                    value={formData.address} 
                    onChange={handleFormChange} 
                    className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    placeholder="東京都..." 
                  />
                  {fieldErrors.address && <p className="text-xs text-red-500 mt-1">{fieldErrors.address[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">住居タイプ <span className="text-red-500">*</span></label>
                    <select 
                      name="housing_type" 
                      value={formData.housing_type} 
                      onChange={handleFormChange} 
                      className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.housing_type ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    >
                      <option value="apartment">マンション・アパート</option>
                      <option value="house">一戸建て</option>
                      <option value="other">その他</option>
                    </select>
                    {fieldErrors.housing_type && <p className="text-xs text-red-500 mt-1">{fieldErrors.housing_type[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">家族構成（人数） <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      type="number" 
                      name="family_members" 
                      value={formData.family_members} 
                      onChange={handleFormChange} 
                      className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 ${fieldErrors.family_members ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                      min="1" 
                    />
                    {fieldErrors.family_members && <p className="text-xs text-red-500 mt-1">{fieldErrors.family_members[0]}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">応募動機・メッセージ <span className="text-red-500">*</span></label>
                  <textarea 
                    required 
                    name="motivation" 
                    value={formData.motivation} 
                    onChange={handleFormChange} 
                    rows={4} 
                    className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-200 resize-none ${fieldErrors.motivation ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                    placeholder="なぜこの猫に応募しようと思いましたか？" 
                  />
                  {fieldErrors.motivation && <p className="text-xs text-red-500 mt-1">{fieldErrors.motivation[0]}</p>}
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#f4a5b9] text-white font-bold rounded-xl hover:bg-[#ef8ca4] transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        送信中...
                      </>
                    ) : (
                      "応募してメッセージを送る"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
      
      {/* ... (Main Content) ... */}
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
          {/* メディアギャラリー */}
          <div className="space-y-4">
            {/* メイン表示エリア */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
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
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-6xl">🐾</span>
                </div>
              )}

              {/* ステータスバッジ */}
              <div className="absolute top-4 left-4">
                <span
                  className={`${STATUS_COLORS[cat.status as keyof typeof STATUS_COLORS] || "bg-gray-200 text-gray-600"} px-3 py-1 rounded-full text-sm font-medium`}
                >
                  {STATUS_LABELS[cat.status as keyof typeof STATUS_LABELS] || cat.status}
                </span>
              </div>

              {/* メディアタイプ表示 */}
              {selectedMedia && (
                <div className="absolute top-4 right-4">
                  <span className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
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
              <div className="grid grid-cols-4 gap-2">
                {mediaItems.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`relative aspect-square rounded-md overflow-hidden ${
                      selectedMediaIndex === index
                        ? "ring-2 ring-pink-500"
                        : "hover:ring-2 hover:ring-gray-300"
                    }`}
                  >
                    {item.type === "video" ? (
                      // 動画サムネイル
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="text-center">
                          <Play className="w-8 h-8 text-white mx-auto" />
                          <span className="text-white text-xs mt-1">動画</span>
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

                    {/* 選択中のインジケーター */}
                    {selectedMediaIndex === index && (
                      <div className="absolute inset-0 bg-pink-500/20" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* キャプション */}
            {selectedMedia?.caption && (
              <p className="text-sm text-gray-600 text-center bg-white/50 rounded-lg py-2 px-4 shadow-sm border border-gray-100">
                {selectedMedia.caption}
              </p>
            )}
          </div>

          {/* 情報エリア */}
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{cat.name}</h1>

              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">品種:</span>
                  <span className="text-gray-900">{cat.breed}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">年齢:</span>
                  <span className="text-gray-900">{cat.age_years}歳</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">性別:</span>
                  <span className="text-gray-900">{GENDER_LABELS[cat.gender as keyof typeof GENDER_LABELS]}</span>
                </div>
                {cat.color && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">毛色:</span>
                    <span className="text-gray-900">{cat.color}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 性格 */}
            {cat.personality && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">性格</h2>
                <p className="text-gray-700">{cat.personality}</p>
              </div>
            )}

            {/* 詳細説明 */}
            {cat.description && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">詳細</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{cat.description}</p>
              </div>
            )}

            {/* 保護団体情報 */}
            {cat.shelter && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">保護団体情報</h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{cat.shelter.name}</p>
                  </div>
                  {cat.shelter.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{cat.shelter.address}</span>
                    </div>
                  )}
                  {cat.shelter.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{cat.shelter.phone}</span>
                    </div>
                  )}
                  {cat.shelter.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>{cat.shelter.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 応募ボタン */}
            {cat.status === "open" ? (
              <button 
                onClick={handleApplyClick} 
                className="w-full py-3 bg-[#f4a5b9] text-white text-lg font-medium rounded-lg hover:bg-[#ef8ca4] transition-colors shadow-md transform hover:scale-[1.02] duration-200"
              >
                里親に応募する
              </button>
            ) : (
              <button 
                disabled
                className="w-full py-3 bg-gray-300 text-gray-500 text-lg font-medium rounded-lg cursor-not-allowed"
              >
                {STATUS_LABELS[cat.status as keyof typeof STATUS_LABELS] || cat.status} (受付停止中)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
