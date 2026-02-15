"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { CatDetail, CatImage, CatVideo } from "@/types";
import { Image as ImageIcon, Video as VideoIcon, Plus, X, Upload } from "lucide-react";
import { compressImage } from "@/utils/image";

interface CatFormData {
  name: string;
  gender: string;
  age_category: string;
  estimated_age: string;
  breed: string;
  size: string;
  color: string;
  
  // Health
  spay_neuter_status: string;
  vaccination_status: string;
  health_status_category: string;
  fiv_felv_status: string;
  health_notes: string;
  
  // Personality
  human_distance: string;
  activity_level: string;
  personality: string;
  
  // Transfer
  interview_format: string;
  trial_period: string;
  transfer_fee: number;
  fee_details: string;

  description: string;
  status: string;
  is_public: boolean;
}

interface PendingFile {
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
  caption: string;
}

function EditCatForm({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreated = searchParams.get("created") === "true";
  const idValue = params.id; // params.id を直接使用
  
  const [cat, setCat] = useState<CatDetail | null>(null);
  const [formData, setFormData] = useState<CatFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  
  const [isSuperUser, setIsSuperUser] = useState(false);
  
  // アップロード用State
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const fetchCat = async () => {
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/shelter/login");
      return;
    }

    try {
      // ユーザー情報の取得（権限チェック用）
      const userResponse = await api.get("/api/accounts/profile/");
      const isActuallyAdmin = userResponse.data.is_superuser || userResponse.data.shelter_role === 'admin';
      setIsSuperUser(isActuallyAdmin);
      setUser(userResponse.data);

      const response = await api.get(`/api/cats/${idValue}/`);
      const catData = response.data;
      setCat(catData);
      
      // APIレスポンスをフォームデータにマッピング
      setFormData({
        name: catData.name || "",
        gender: catData.gender || "unknown",
        age_category: catData.age_category || "unknown",
        estimated_age: catData.estimated_age || "",
        breed: catData.breed || "",
        size: catData.size || "medium",
        color: catData.color || "",
        
        spay_neuter_status: catData.spay_neuter_status || "unknown",
        vaccination_status: catData.vaccination_status || "unknown",
        health_status_category: catData.health_status_category || "unknown",
        fiv_felv_status: catData.fiv_felv_status || "unknown",
        health_notes: catData.health_notes || "",
        
        human_distance: catData.human_distance || "unknown",
        activity_level: catData.activity_level || "unknown",
        personality: catData.personality || "",
        
        interview_format: catData.interview_format || "offline",
        trial_period: catData.trial_period || "",
        transfer_fee: catData.transfer_fee || 0,
        fee_details: catData.fee_details || "",

        description: catData.description || "",
        status: catData.status || "open",
        is_public: catData.is_public || false,
      });
    } catch (err: any) {
      console.error("Failed to fetch cat:", err);
      if (err.response?.status === 404) {
        router.push("/shelter/cats");
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/shelter/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCat();
    if (isCreated) {
      setSuccessMessage("猫の登録が完了しました！写真をアップロードして情報を充実させましょう。");
    }
  }, [idValue, router, isCreated]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!formData) return;
    
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => prev ? { ...prev, [name]: checked } : null);
    } else if (type === "number") {
      setFormData((prev) => prev ? { ...prev, [name]: parseInt(value) || 0 } : null);
    } else {
      setFormData((prev) => prev ? { ...prev, [name]: value } : null);
    }
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setIsSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const response = await api.patch(`/api/cats/${idValue}/`, formData);
      setCat(response.data);
      // 成功メッセージを表示してリダイレクト
      window.alert("情報を更新しました！");
      router.push("/shelter/cats");
    } catch (err: any) {
      console.error("Update error:", err);
      let errorMessage = "更新に失敗しました。";
      
      if (err.response?.data) {
        const data = err.response.data;
        const fieldErrors: Record<string, string> = {};
        const errorKeys: string[] = [];

        Object.keys(data).forEach((key) => {
          errorKeys.push(key);
          if (Array.isArray(data[key])) {
            fieldErrors[key] = data[key].join(" ");
          } else if (typeof data[key] === "string") {
            fieldErrors[key] = data[key];
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          errorMessage += `\n以下の項目を確認してください: ${errorKeys.join(", ")}`;
        }
      } else {
        setErrors({ general: "更新に失敗しました。" });
      }
      
      window.alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // ファイル選択ハンドラ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);
    
    setPendingFile({
      file,
      type,
      previewUrl,
      caption: '',
    });

    // 同じファイルを選択しても反応するようにリセット
    e.target.value = '';
  };



  // アップロード処理
  const processUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    const formData = new FormData();
    
    try {
      if (pendingFile.type === 'image') {
        // 画像を圧縮してからアップロード
        const compressedFile = await compressImage(pendingFile.file);
        formData.append("image", compressedFile);
        formData.append("is_primary", (!cat?.images || cat.images.length === 0) ? "true" : "false");
      } else {
        formData.append("video", pendingFile.file);
      }
      
      // キャプション追加
      if (pendingFile.caption) {
        formData.append("caption", pendingFile.caption);
      }

      const endpoint = pendingFile.type === 'image' 
        ? `/api/cats/${idValue}/images/` 
        : `/api/cats/${idValue}/videos/`;
        
      await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchCat(); // 最新情報を再取得
      setSuccessMessage(`${pendingFile.type === 'image' ? '画像' : '動画'}をアップロードしました！`);
      cancelUpload(); // モーダルを閉じる
    } catch (err) {
      console.error("Upload failed:", err);
      setErrors({ upload: `${pendingFile.type === 'image' ? '画像' : '動画'}のアップロードに失敗しました。` });
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
  };

  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900 relative">
      <Header />

      {/* アップロードモーダル */}
      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {pendingFile.type === 'image' ? '写真' : '動画'}のアップロード
              </h3>
              <button onClick={cancelUpload} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 aspect-video flex items-center justify-center">
                {pendingFile.type === 'image' ? (
                  <img src={pendingFile.previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <video src={pendingFile.previewUrl} controls className="max-h-full max-w-full" />
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  一言メモ（任意）
                </label>
                <input
                  type="text"
                  value={pendingFile.caption}
                  onChange={(e) => setPendingFile({...pendingFile, caption: e.target.value})}
                  placeholder="例：お気に入りの写真です！"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelUpload}
                  disabled={isUploading}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={processUpload}
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      送信中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      アップロード
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* パンくずリスト */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/shelter/dashboard" className="hover:text-blue-600">
              ダッシュボード
            </Link>
            <span>/</span>
            <Link href="/shelter/cats" className="hover:text-blue-600">
              猫の管理
            </Link>
            <span>/</span>
            <span className="text-gray-800">{cat?.name}を編集</span>
          </div>

          {/* 成功メッセージ */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm flex items-center gap-2 animate-fade-in-down">
              <span className="text-lg">✅</span>
              {successMessage}
            </div>
          )}

          {/* フォームカード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
            <div className="flex items-center gap-4 mb-8">
              {cat?.primary_image ? (
                <img
                  src={cat.primary_image}
                  alt={cat.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-4xl border-2 border-white shadow-md">
                  🐱
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{cat?.name}を編集</h1>
                <p className="text-gray-500 text-sm">猫の情報を更新します</p>
              </div>
            </div>

            {/* メディア管理セクション */}
            <div className="mb-10 border-b border-gray-100 pb-10">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                写真・動画
              </h2>
              
              {/* エラー表示 */}
              {errors.upload && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {errors.upload}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* 既存の画像 */}
                {cat?.images && cat.images.map((img: CatImage) => (
                  <div key={`img-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                    <img 
                      src={img.image_url || img.image} 
                      alt="Cat" 
                      className="w-full h-full object-cover"
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-white text-[10px] truncate text-center">{img.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">登録済み</span>
                    </div>
                  </div>
                ))}

                {/* 既存の動画 */}
                {cat?.videos && cat.videos.map((vid: CatVideo) => (
                  <div key={`vid-${vid.id}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-black group">
                    <video 
                      src={vid.video_url || vid.video} 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <VideoIcon className="w-8 h-8 text-white" />
                    </div>
                    {vid.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 z-10">
                        <p className="text-white text-[10px] truncate text-center">{vid.caption}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs">動画</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* アップロードボタン */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 画像アップロードボタン */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'image')}
                    ref={imageInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  >
                    <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">写真を追加</span>
                    <span className="text-xs text-blue-400 mt-1">スマホのライブラリから選択</span>
                  </button>
                </div>

                {/* 動画アップロードボタン */}
                <div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileSelect(e, 'video')}
                    ref={videoInputRef}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-pink-200 rounded-2xl flex flex-col items-center justify-center text-pink-500 hover:bg-pink-50 hover:border-pink-300 transition-all group"
                  >
                    <div className="bg-pink-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <VideoIcon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">動画を追加</span>
                    <span className="text-xs text-pink-400 mt-1">スマホの動画を選択</span>
                  </button>
                </div>
              </div>
            </div>

            {/* エラーメッセージ */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* A. 基本情報 */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">📝</span> 基本情報
                </h2>
                
                {isSuperUser ? (
                  // 管理者用編集フォーム
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 名前 */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                        名前 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>

                    {/* 性別 */}
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
                        性別 <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="male">オス</option>
                        <option value="female">メス</option>
                        <option value="unknown">不明</option>
                      </select>
                    </div>

                    {/* 年齢区分 */}
                    <div>
                      <label htmlFor="age_category" className="block text-sm font-medium text-gray-700 mb-1.5">
                        年齢区分
                      </label>
                      <select
                        id="age_category"
                        name="age_category"
                        value={formData.age_category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="kitten">子猫</option>
                        <option value="adult">成猫</option>
                        <option value="senior">シニア猫</option>
                        <option value="unknown">不明</option>
                      </select>
                    </div>

                    {/* 推定年齢 */}
                    <div>
                      <label htmlFor="estimated_age" className="block text-sm font-medium text-gray-700 mb-1.5">
                        推定年齢 (テキスト) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="estimated_age"
                        name="estimated_age"
                        value={formData.estimated_age}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="例：2歳くらい、2023年春生まれ"
                      />
                    </div>

                    {/* 品種 */}
                    <div>
                      <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1.5">
                        品種
                      </label>
                      <input
                        type="text"
                        id="breed"
                        name="breed"
                        value={formData.breed}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>

                    {/* 体格 */}
                    <div>
                      <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1.5">
                        体格
                      </label>
                      <select
                        id="size"
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="small">小型</option>
                        <option value="medium">中型</option>
                        <option value="large">大型</option>
                      </select>
                    </div>

                    {/* 毛色 */}
                    <div className="md:col-span-2">
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1.5">
                        毛色
                      </label>
                      <input
                        type="text"
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  // 一般スタッフ用表示（閲覧のみ）
                  <div className="space-y-4 text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">名前</span>
                        {formData.name}
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500 block">性別</span>
                        {formData.gender === 'male' ? 'オス' : formData.gender === 'female' ? 'メス' : '不明'}
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500 block">年齢区分</span>
                        {formData.age_category === 'kitten' ? '子猫' : formData.age_category === 'adult' ? '成猫' : formData.age_category === 'senior' ? 'シニア猫' : '不明'}
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500 block">推定年齢</span>
                        {formData.estimated_age}
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500 block">品種</span>
                        {formData.breed || '未設定'}
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-500 block">体格</span>
                         {formData.size === 'small' ? '小型' : formData.size === 'medium' ? '中型' : formData.size === 'large' ? '大型' : '未設定'}
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-sm font-medium text-gray-500 block">毛色</span>
                        {formData.color || '未設定'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

               {/* B. 性格・特徴 */}
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">✨</span> 性格・特徴
                </h2>
                
                {isSuperUser ? (
                  // 管理者用編集フォーム
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* 人への距離感 */}
                        <div>
                            <label htmlFor="human_distance" className="block text-sm font-medium text-gray-700 mb-1.5">
                            人への距離感
                            </label>
                            <select
                            id="human_distance"
                            name="human_distance"
                            value={formData.human_distance}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.human_distance ? 'border-red-500' : 'border-gray-200'} focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none`}
                            >
                                <option value="cuddly">抱っこ好き</option>
                                <option value="ok">抱っこ可</option>
                                <option value="shy">抱っこ苦手</option>
                                <option value="unknown">不明</option>
                            </select>
                            {errors.human_distance && <p className="text-red-500 text-xs mt-1">{errors.human_distance}</p>}
                        </div>

                        {/* 活発さ */}
                        <div>
                            <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700 mb-1.5">
                            活発さ
                            </label>
                            <select
                            id="activity_level"
                            name="activity_level"
                            value={formData.activity_level}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.activity_level ? 'border-red-500' : 'border-gray-200'} focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none`}
                            >
                                <option value="active">活発</option>
                                <option value="normal">普通</option>
                                <option value="calm">おっとり</option>
                                <option value="unknown">不明</option>
                            </select>
                            {errors.activity_level && <p className="text-red-500 text-xs mt-1">{errors.activity_level}</p>}
                        </div>
                    </div>

                    {/* 性格詳細 */}
                    <div>
                        <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1.5">
                            性格詳細
                        </label>
                        <textarea
                            id="personality"
                            name="personality"
                            value={formData.personality}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.personality ? 'border-red-500' : 'border-gray-200'} focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none resize-none`}
                            placeholder="猫の性格や好きなこと、苦手なことなどを詳しく入力してください。"
                        />
                        {errors.personality && <p className="text-red-500 text-xs mt-1">{errors.personality}</p>}
                    </div>
                  </>
                ) : (
                  // 一般スタッフ用表示（閲覧のみ）
                  <div className="space-y-4 text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">人への距離感</span>
                        {formData.human_distance === 'cuddly' ? '抱っこ好き' : 
                         formData.human_distance === 'ok' ? '抱っこ可' :
                         formData.human_distance === 'shy' ? '抱っこ苦手' : '不明'}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">活発さ</span>
                        {formData.activity_level === 'active' ? '活発' : 
                         formData.activity_level === 'normal' ? '普通' :
                         formData.activity_level === 'calm' ? 'おっとり' : '不明'}
                      </div>
                    </div>

                    {formData.personality && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-500 block mb-1">性格詳細</span>
                        <p className="whitespace-pre-wrap px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-600">
                          {formData.personality}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {/* C. 医療情報 */}
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">🏥</span> 医療情報
                </h2>
                
                {isSuperUser ? (
                  // 管理者用編集フォーム
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       {/* 不妊去勢 */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              不妊去勢
                          </label>
                          <select
                              name="spay_neuter_status"
                              value={formData.spay_neuter_status}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          >
                              <option value="not_yet">未実施</option>
                              <option value="done">実施済み</option>
                              <option value="planned">予定あり</option>
                              <option value="unknown">不明</option>
                          </select>
                      </div>
                      {/* ワクチン */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              ワクチン接種
                          </label>
                           <select
                              name="vaccination_status"
                              value={formData.vaccination_status}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          >
                              <option value="not_yet">未接種</option>
                              <option value="done">接種済み</option>
                              <option value="partial">一部接種</option>
                              <option value="unknown">不明</option>
                          </select>
                      </div>
                       {/* ウイルス検査 */}
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              ウイルス検査 (FIV/FeLV)
                          </label>
                           <select
                              name="fiv_felv_status"
                              value={formData.fiv_felv_status}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          >
                              <option value="negative">陰性 (-)</option>
                              <option value="positive_fiv">FIV陽性 (+)</option>
                               <option value="positive_felv">FeLV陽性 (+)</option>
                               <option value="positive_double">ダブルキャリア</option>
                               <option value="untested">未検査</option>
                               <option value="unknown">不明</option>
                          </select>
                      </div>
                      {/* 健康状態区分 */}
                       <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              現在の健康状態
                          </label>
                           <select
                              name="health_status_category"
                              value={formData.health_status_category}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          >
                              <option value="healthy">問題なし</option>
                              <option value="needs_care">ケアあり</option>
                               <option value="treatment">継続治療中</option>
                               <option value="unknown">不明</option>
                          </select>
                      </div>
                  </div>
                   {/* 医療詳細メモ */}
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          医療特記事項
                      </label>
                      <textarea
                          name="health_notes"
                          value={formData.health_notes}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none"
                          placeholder="例：過去に猫風邪の既往歴があります。現在は完治しています。"
                      />
                  </div>
                  </>
                ) : (
                  // 一般スタッフ用表示（閲覧のみ）
                  <div className="space-y-4 text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">不妊去勢</span>
                        {formData.spay_neuter_status === 'done' ? '実施済み' : 
                         formData.spay_neuter_status === 'not_yet' ? '未実施' :
                         formData.spay_neuter_status === 'planned' ? '予定あり' : '不明'}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">ワクチン接種</span>
                        {formData.vaccination_status === 'done' ? '接種済み' :
                         formData.vaccination_status === 'not_yet' ? '未接種' :
                         formData.vaccination_status === 'partial' ? '一部接種' : '不明'}
                      </div>
                      <div>
                         <span className="text-sm font-medium text-gray-500 block">ウイルス検査</span>
                         {formData.fiv_felv_status === 'negative' ? '陰性 (-)' :
                          formData.fiv_felv_status === 'positive_fiv' ? 'FIV陽性 (+)' :
                          formData.fiv_felv_status === 'positive_felv' ? 'FeLV陽性 (+)' : 
                          formData.fiv_felv_status === 'positive_double' ? 'ダブルキャリア' :
                          formData.fiv_felv_status === 'untested' ? '未検査' : '不明'}
                      </div>
                      <div>
                         <span className="text-sm font-medium text-gray-500 block">健康状態</span>
                         {formData.health_status_category === 'healthy' ? '問題なし' :
                          formData.health_status_category === 'needs_care' ? 'ケアあり' :
                          formData.health_status_category === 'treatment' ? '継続治療中' : '不明'}
                      </div>
                    </div>
                    {formData.health_notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-500 block mb-1">医療特記事項</span>
                        <p className="whitespace-pre-wrap px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-600">
                          {formData.health_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
               </div>

                {/* D. 募集詳細・譲渡条件 */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">🤝</span> 募集詳細・譲渡条件
                </h2>

                {isSuperUser ? (
                  // 管理者用編集フォーム
                  <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       {/* 面談形式 */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              面談形式
                          </label>
                          <select
                              name="interview_format"
                              value={formData.interview_format}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          >
                               <option value="offline">対面のみ</option>
                               <option value="online">オンラインのみ</option>
                               <option value="both">対面・オンライン可</option>
                          </select>
                      </div>
                       {/* トライアル期間 */}
                      <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              トライアル期間
                          </label>
                          <input
                              type="text"
                              name="trial_period"
                              value={formData.trial_period}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                              placeholder="例：2週間"
                          />
                      </div>
                       {/* 譲渡費用 */}
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              譲渡費用 (円) <span className="text-red-400">*</span>
                          </label>
                          <input
                              type="number"
                              name="transfer_fee"
                              value={formData.transfer_fee}
                              onChange={handleChange}
                              min="0"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"
                          />
                      </div>
                  </div>
                  {/* 費用詳細 */}
                  <div className="mb-4">
                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              費用の内訳
                          </label>
                          <textarea
                              name="fee_details"
                              value={formData.fee_details}
                              onChange={handleChange}
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none"
                              placeholder="例：ワクチン、ウイルス検査費、避妊手術費として"
                          />
                  </div>

                  {/* 紹介文 */}
                   <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                        全体の紹介文 <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                      />
                    </div>
                  </>
                ) : (
                  // 一般スタッフ用表示（閲覧のみ）
                  <div className="space-y-4 text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">面談形式</span>
                        {formData.interview_format === 'offline' ? '対面のみ' :
                         formData.interview_format === 'online' ? 'オンラインのみ' : '対面・オンライン可'}
                      </div>
                      <div>
                         <span className="text-sm font-medium text-gray-500 block">トライアル期間</span>
                         {formData.trial_period || '未設定'}
                      </div>
                      <div>
                         <span className="text-sm font-medium text-gray-500 block">譲渡費用</span>
                         {formData.transfer_fee.toLocaleString()}円
                      </div>
                    </div>
                    
                    {formData.fee_details && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                        <span className="font-semibold mr-2">内訳:</span> {formData.fee_details}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-500 block mb-1">全体の紹介文</span>
                      <p className="whitespace-pre-wrap px-4 py-3 bg-white rounded-xl border border-gray-200 text-gray-600">
                        {formData.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 公開設定 */}
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-50 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                      <span className="text-xl">🌐</span> 公開設定
                    </h2>
                    <p className="text-sm text-gray-500 mb-3">
                      一般ユーザーにこの猫の情報を公開しますか？
                    </p>
                    
                    {user?.shelter_info?.verification_status !== 'approved' && (
                      <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-2 mb-4">
                        <span className="text-orange-500 text-lg">⚠️</span>
                        <p className="text-xs text-orange-800 leading-relaxed font-medium">
                          現在、団体情報の審査中です。<br />
                          運営による承認が完了するまで、「公開」に設定することはできません。
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="is_public"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      disabled={user?.shelter_info?.verification_status !== 'approved'}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <label htmlFor="status" className="block text-xs font-bold text-gray-400 uppercase mb-2">現在の募集ステータス</label>
                    {isSuperUser ? (
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium"
                      >
                        <option value="open">募集中</option>
                        <option value="paused">一時停止</option>
                        <option value="in_review">審査中</option>
                        <option value="trial">トライアル中</option>
                        <option value="adopted">譲渡済み</option>
                      </select>
                    ) : (
                       <div className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl border border-gray-200 flex items-center justify-between">
                         <span className="text-sm font-medium">
                           {formData.status === 'open' ? '募集中' :
                            formData.status === 'paused' ? '一時停止' :
                            formData.status === 'in_review' ? '審査中' :
                            formData.status === 'trial' ? 'トライアル中' :
                            formData.status === 'adopted' ? '譲渡済み' : formData.status}
                         </span>
                         <span className="text-[10px] text-gray-400">※管理人のみ変更可</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ボタン */}
              {/* アップロードボタンの制御などは別途必要かもしれないが、基本情報の保存は許可 */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/shelter/cats"
                  className="flex-1 py-3.5 text-center border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {isSaving ? "保存中..." : "保存する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function EditCatPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <EditCatForm params={params} />
    </Suspense>
  );
}
