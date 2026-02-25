"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Image as ImageIcon, Plus, X, Lock } from "lucide-react";
import { compressImage } from "@/utils/image";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";

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
  affection_level: number;
  maintenance_level: string;
  activity_level: string;
  personality: string;
  
  // Transfer
  is_single_ok: boolean;
  is_elderly_ok: boolean;
  other_terms: string;
  interview_format: string;
  trial_period: string;
  transfer_fee: number;
  fee_details: string;

  description: string;
  status: string;
  is_public: boolean;
}

const initialFormData: CatFormData = {
  name: "",
  gender: "unknown",
  age_category: "unknown",
  estimated_age: "",
  breed: "",
  size: "medium",
  color: "",
  
  spay_neuter_status: "unknown",
  vaccination_status: "unknown",
  health_status_category: "unknown",
  fiv_felv_status: "unknown",
  health_notes: "",
  
  affection_level: 3,
  maintenance_level: "normal",
  activity_level: "unknown",
  personality: "",
  
  is_single_ok: false,
  is_elderly_ok: false,
  other_terms: "",
  interview_format: "offline",
  trial_period: "",
  transfer_fee: 0,
  fee_details: "",

  description: "",
  status: "open",
  is_public: false,
};

export default function NewCatPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CatFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSuperUser, setIsSuperUser] = useState(false);

  // 画像アップロード用State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/api/accounts/profile/");
        if (response.data.user_type !== "shelter" && response.data.user_type !== "admin") {
          router.push("/");
          return;
        }
        setUser(response.data);
        
        // 管理者権限の判定
        const isActuallyAdmin = response.data.is_superuser || response.data.shelter_role === 'admin';
        setIsSuperUser(isActuallyAdmin);
      } catch (error) {
        router.push("/shelter/login");
        return;
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    // API処理中のローディング表示はButtonのisLoadingで行う
    
    try {
      // 1. 猫情報の作成
      const response = await api.post("/api/cats/", formData);
      const catId = response.data.id;

      // 2. 画像があればアップロード
      if (selectedImage) {
        try {
          // 画像を圧縮してからアップロード
          const compressedFile = await compressImage(selectedImage);
          
          const imageFormData = new FormData();
          imageFormData.append("image", compressedFile);
          imageFormData.append("is_primary", "true");

          await api.post(`/api/cats/${catId}/images/`, imageFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          // 画像アップロード成功
          toast.success("猫の登録と画像のアップロードが完了しました！");
          router.push(`/shelter/cats/`);
        } catch (imageErr: any) {
          console.error("Image upload failed:", imageErr);
          // エラーメッセージの詳細化
          let errorMsg = "画像のアップロードに失敗しました";
          
          if (imageErr.response) {
            const status = imageErr.response.status;
            const data = imageErr.response.data;
            
            if (data?.detail) {
              errorMsg = `(${status}) ${data.detail}`;
            } else if (data?.error) {
              errorMsg = `(${status}) ${data.error}`;
            } else if (data?.image && Array.isArray(data.image)) {
              errorMsg = `(${status}) ${data.image.join(", ")}`;
            } else if (typeof data === 'string') {
              // HTMLエラー等が返ってきた場合
              errorMsg = `(${status}) サーバーエラー: ${data.substring(0, 100)}...`;
            } else {
              errorMsg = `(${status}) 不明なエラーが発生しました`;
            }
          } else if (imageErr.message) {
             errorMsg = imageErr.message;
          }

          toast.error(`猫の登録は完了しましたが、画像のアップロードに失敗しました。\nエラー: ${errorMsg}`, { duration: 6000 });
          router.push(`/shelter/cats/${catId}/edit?created=true`);
        }
      } else {
        // 画像なしで登録完了
        toast.success("猫の登録が完了しました！");
        router.push(`/shelter/cats/`);
      }
    } catch (err: any) {
      console.error("Create error:", err);
      if (err.response?.data) {
        const data = err.response.data;
        const fieldErrors: Record<string, string> = {};

        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) {
            fieldErrors[key] = data[key].join(" ");
          } else if (typeof data[key] === "string") {
            fieldErrors[key] = data[key];
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setErrors({ general: "登録に失敗しました。" });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        setErrors({ general: "登録に失敗しました。しばらく経ってから再度お試しください。" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900">
      <Header />

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
            <span className="text-gray-800">新規登録</span>
          </div>

          {/* フォームカード */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full mb-4">
                <span className="text-3xl">🐱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">新しい猫を登録</h1>
              <p className="text-gray-500 mt-2 text-sm">
                保護猫の詳細情報を入力してください
              </p>
            </div>

            {/* エラーメッセージ */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* メイン画像アップロード */}
              <div className="flex flex-col items-center justify-center mb-8">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg group">
                    <Image 
                      src={previewUrl} 
                      alt="Preview" 
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X className="w-8 h-8" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-500 transition-all"
                  >
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">写真を追加</span>
                  </button>
                )}
                <p className="mt-2 text-sm text-gray-500">メイン画像（任意）</p>
              </div>

              {/* A. 基本情報 */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">📝</span> 基本情報
                </h2>
                
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
                      placeholder="例：ミケ"
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
                      placeholder="例：MIX、三毛猫"
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
                      placeholder="例：白黒、茶トラ"
                    />
                  </div>
                </div>
              </div>

              {/* B. 性格・特徴 */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">✨</span> 性格・特徴
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     {/* 甘えん坊度 */}
                    <div>
                        <label htmlFor="affection_level" className="block text-sm font-medium text-gray-700 mb-1.5">
                        甘えん坊度
                        </label>
                        <select
                        id="affection_level"
                        name="affection_level"
                        value={formData.affection_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, affection_level: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                            <option value="5">5: とろとろ甘えん坊（膝乗り・抱っこ大好き）</option>
                            <option value="4">4: 甘えん坊（ナデナデ大好き）</option>
                            <option value="3">3: ツンデレ・気まぐれ（気が向くと甘える）</option>
                            <option value="2">2: クール・マイペース（適度な距離感）</option>
                            <option value="1">1: 怖がり・修行中（ゆっくり仲良くなろう）</option>
                        </select>
                    </div>

                     {/* お手入れ難易度 */}
                    <div>
                        <label htmlFor="maintenance_level" className="block text-sm font-medium text-gray-700 mb-1.5">
                        お手入れ難易度（爪切り・投薬等）
                        </label>
                        <select
                        id="maintenance_level"
                        name="maintenance_level"
                        value={formData.maintenance_level}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                             <option value="easy">初心者でも安心（協力的）</option>
                             <option value="normal">少しコツが必要（普通）</option>
                             <option value="hard">経験者向き（要練習）</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     {/* 活動量 */}
                    <div>
                        <label htmlFor="activity_level" className="block text-sm font-medium text-gray-700 mb-1.5">
                        活発さ
                        </label>
                        <select
                        id="activity_level"
                        name="activity_level"
                        value={formData.activity_level}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                             <option value="active">活発</option>
                             <option value="normal">普通</option>
                             <option value="calm">おっとり</option>
                             <option value="unknown">不明</option>
                        </select>
                    </div>
                </div>

                {/* 性格詳細 */}
                <div>
                    <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1.5">
                        性格詳細 <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        id="personality"
                        name="personality"
                        value={formData.personality}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                        placeholder="例：とても人懐っこく、おもちゃで遊ぶのが大好きです。"
                    />
                </div>
              </div>
              
              {/* C. 医療情報 */}
               <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="text-xl">🏥</span> 医療情報
                </h2>
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
               </div>

              {/* D. 募集詳細・譲渡条件 */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">🤝</span> 募集詳細・譲渡条件
                        {!isSuperUser && <Lock className="w-4 h-4 text-amber-500" />}
                    </h2>
                    {!isSuperUser && (
                        <div className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            管理者のみ設定可
                        </div>
                    )}
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     {/* 面談形式 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            面談形式
                        </label>
                        <div className="relative">
                            <select
                                name="interview_format"
                                value={formData.interview_format}
                                onChange={handleChange}
                                disabled={!isSuperUser}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all ${!isSuperUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100 pl-10' : ''}`}
                            >
                                 <option value="offline">対面のみ</option>
                                 <option value="online">オンラインのみ</option>
                                 <option value="both">対面・オンライン可</option>
                            </select>
                            {!isSuperUser && (
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            )}
                        </div>
                    </div>
                     {/* トライアル期間 */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            トライアル期間
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="trial_period"
                                value={formData.trial_period}
                                onChange={handleChange}
                                disabled={!isSuperUser}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all ${!isSuperUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100 pl-10' : ''}`}
                                placeholder="例：2週間"
                            />
                            {!isSuperUser && (
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            )}
                        </div>
                    </div>

                    {/* 譲渡条件 */}
                    <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            譲渡条件
                            {!isSuperUser && <Lock className="w-3.5 h-3.5 text-gray-300" />}
                        </label>
                        <div className="relative">
                            <textarea
                                name="other_terms"
                                value={formData.other_terms}
                                onChange={handleChange}
                                rows={6}
                                disabled={!isSuperUser}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none transition-all ${!isSuperUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100 pl-10' : ''}`}
                                placeholder="例：単身者可、高齢者可、ペット可物件必須、脱走防止対策必須など。詳細な条件を記載することで、ミスマッチを減らせます。"
                            />
                            {!isSuperUser && (
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
                            )}
                        </div>
                    </div>
                     {/* 譲渡費用 */}
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                            譲渡費用 (円) <span className="text-red-400">*</span>
                            {!isSuperUser && <Lock className="w-3.5 h-3.5 text-gray-300" />}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="transfer_fee"
                                value={formData.transfer_fee}
                                onChange={handleChange}
                                min="0"
                                disabled={!isSuperUser}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 outline-none transition-all ${!isSuperUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100 pl-10' : ''}`}
                            />
                            {!isSuperUser && (
                                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            )}
                        </div>
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
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      全体の紹介文 <span className="text-red-400">*</span>
                      {!isSuperUser && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                    </label>
                    <div className="relative">
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          required
                          rows={4}
                          disabled={!isSuperUser}
                          className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all ${!isSuperUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100 pl-10' : ''}`}
                          placeholder="保護の経緯、エピソードなど..."
                        />
                        {!isSuperUser && (
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-4" />
                        )}
                    </div>
                  </div>
              </div>
              
              {/* 公開設定 */}
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-50 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                      <span className="text-xl">🌐</span> 公開設定
                      {!isSuperUser && <Lock className="w-4 h-4 text-amber-500" />}
                    </h2>
                    <p className="text-sm text-gray-500 mb-3">
                      一般ユーザーにこの猫の情報を公開しますか？
                    </p>
                    
                    {user?.shelter_info?.verification_status !== 'approved' ? (
                      <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-2 mb-4">
                        <span className="text-orange-500 text-lg">⚠️</span>
                        <p className="text-xs text-orange-800 leading-relaxed font-medium">
                          現在、団体情報の審査中です。<br />
                          運営による承認が完了するまで、「公開」に設定することはできません。
                        </p>
                      </div>
                    ) : !isSuperUser && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2 mb-4">
                        <Lock className="w-4 h-4 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          公開設定の変更は、管理者権限が必要です。
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <label className={`relative inline-flex items-center ${!isSuperUser || user?.shelter_info?.verification_status !== 'approved' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      id="is_public"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      disabled={!isSuperUser || user?.shelter_info?.verification_status !== 'approved'}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <label htmlFor="status" className="block text-xs font-bold text-gray-400 uppercase mb-2">初期ステータス</label>
                    <div className="relative">
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          disabled={!isSuperUser}
                          className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all ${!isSuperUser ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100 pl-10' : ''}`}
                        >
                          <option value="open">募集中</option>
                          <option value="paused">一時停止</option>
                          <option value="in_review">審査中</option>
                          <option value="trial">トライアル中</option>
                          <option value="adopted">譲渡済み</option>
                        </select>
                        {!isSuperUser && (
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-4 pt-4">
                <Link
                  href="/shelter/cats"
                  className="flex-1 py-3.5 text-center border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </Link>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading || user?.shelter_info?.verification_status !== 'approved' && formData.is_public}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 shadow-md text-white font-semibold rounded-xl"
                >
                  {isLoading ? "登録中..." : "猫を登録"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
