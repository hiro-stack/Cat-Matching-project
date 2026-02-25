"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User } from "@/types";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  ClipboardList, 
  Home, 
  Clock, 
  Heart, 
  Maximize, 
  Music, 
  Users,
  Edit2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Cat,
  ChevronRight,
  Sparkles
} from "lucide-react";

// ラベル定義
const GENDER_LABELS: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  no_answer: "回答しない",
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

const CAT_EXPERIENCE_LABELS: Record<string, string> = {
  none: "なし",
  one: "あり",
  multiple: "複数経験あり",
};

const CAT_DISTANCE_LABELS: Record<string, string> = {
  clingy: "べったり甘えてほしい",
  moderate: "適度な距離感がいい",
  watchful: "静かに見守りたい",
};

const HOME_ATMOSPHERE_LABELS: Record<string, string> = {
  quiet: "静か",
  normal: "普通",
  lively: "にぎやか",
};

const VISITOR_FREQUENCY_LABELS: Record<string, string> = {
  high: "多い",
  medium: "普通",
  low: "少ない",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<User>("/api/accounts/profile/");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "shelter": return "団体スタッフ";
      case "admin": return "管理者";
      default: return "一般ユーザー";
    }
  };

  const renderProfileItem = (label: string, value: string | number | null | undefined, icon: ReactNode = <span className="text-gray-300">•</span>) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-50 last:border-0 group">
      <span className="text-sm font-bold text-gray-500 w-44 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-all border border-transparent group-hover:border-pink-100 shadow-sm">
          {icon}
        </div>
        {label}
      </span>
      <span className="text-gray-800 font-bold mt-2 sm:mt-0 flex-1">
        {value || <span className="text-gray-300 font-normal">未設定</span>}
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6 mx-auto animate-bounce border border-pink-100">
            <Cat className="w-10 h-10 text-pink-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-800">読み込み中</h2>
            <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Preparing your matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profile = user.applicant_profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900 selection:bg-pink-100 selection:text-pink-600">
      <Header />

      <main className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* ヒーロープロフィールセクション */}
          <div className="relative group">
            {/* 背景の装飾 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-indigo-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 shadow-2xl"></div>
            
            <div className="relative bg-white rounded-[2rem] overflow-hidden border border-white shadow-2xl">
              {/* プロフィールヘッダー背景 */}
              <div className="h-32 bg-gradient-to-r from-pink-400 via-pink-500 to-indigo-500 animate-gradient-xy"></div>
              
              <div className="px-8 pb-10 -mt-16">
                <div className="flex flex-col md:flex-row items-end gap-6">
                  {/* アバター */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] bg-white p-1 shadow-2xl">
                      <div className="w-full h-full rounded-[1.8rem] bg-gradient-to-br from-pink-50 to-indigo-50 flex items-center justify-center text-5xl font-black text-pink-500 border-4 border-white shadow-inner">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-pink-500 border-4 border-pink-50">
                      <Sparkles className="w-5 h-5 fill-current" />
                    </div>
                  </div>

                  {/* ユーザー基本情報 */}
                  <div className="flex-1 text-center md:text-left pt-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                      <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user.username}</h1>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-pink-100 text-pink-600 text-xs font-black rounded-full border border-pink-200 uppercase tracking-wider">
                          {getUserTypeLabel(user.user_type)}
                        </span>
                        {profile?.age && (
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-black rounded-full border border-indigo-100 uppercase tracking-wider">
                            {profile.age} Years Old
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-bold tracking-wide">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </p>
                  </div>

                  {/* アクション */}
                  <div className="pb-2">
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-pink-500 transition-all shadow-xl hover:shadow-pink-200 active:scale-95 group"
                    >
                      <Edit2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      プロフィールを編集
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左サイド: 基本情報 */}
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <UserIcon className="w-32 h-32" />
                </div>
                
                <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  アカウント設定
                </h2>
                
                <div className="space-y-1">
                  {renderProfileItem("ユーザー名", user.username, <UserIcon className="w-4 h-4" />)}
                  {renderProfileItem("連絡先メール", user.email, <Mail className="w-4 h-4" />)}
                  {renderProfileItem("居住地域", user.address || profile?.residence_area || (user.user_type === 'shelter' ? user.shelter_info?.prefecture : null), <MapPin className="w-4 h-4" />)}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                  <span>Registered since: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</span>
                  <span>ID: {user.id}</span>
                </div>
              </section>

              {/* クイックリンク */}
              <div className="space-y-4">
                <Link
                  href="/profile/applications"
                  className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-pink-200 group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-all">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">申請履歴</p>
                      <p className="text-xs text-gray-400 font-bold">Applications</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/profile/favorites"
                  className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:border-red-200 group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">お気に入り</p>
                      <p className="text-xs text-gray-400 font-bold">Matching Favorites</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>

            {/* 右メイン: 里親プロフィール詳細 */}
            <div className="lg:col-span-2 space-y-8">
              {profile ? (
                <>
                  <section className="bg-white rounded-[2rem] p-10 shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <ClipboardList className="w-48 h-48 rotate-12" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-gray-900 mb-10 flex items-center gap-4">
                      <div className="w-12 h-12 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center shadow-sm">
                        <ClipboardList className="w-7 h-7" />
                      </div>
                      里親プロフィール詳細
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                      <div className="space-y-2">
                        <div className="px-4 py-2 bg-pink-50/50 rounded-xl text-pink-600 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                          Background Info
                        </div>
                        {renderProfileItem("現在の年齢", profile.age ? `${profile.age}歳` : null, <Calendar className="w-4 h-4" />)}
                        {renderProfileItem("性別", profile.gender ? GENDER_LABELS[profile.gender] : null, <UserIcon className="w-4 h-4" />)}
                        {renderProfileItem("居住エリア", profile.residence_area, <MapPin className="w-4 h-4" />)}
                        {renderProfileItem("完全室内飼い", profile.indoors_agreement ? "同意済み" : "未同意", <ShieldCheck className={`w-4 h-4 ${profile.indoors_agreement ? 'text-green-500' : 'text-amber-500'}`} />)}
                      </div>

                      <div className="space-y-2 mt-8 md:mt-0">
                        <div className="px-4 py-2 bg-indigo-50/50 rounded-xl text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                          Lifestyle Preferences
                        </div>
                        {renderProfileItem("お留守番の時間", profile.absence_time ? ABSENCE_TIME_LABELS[profile.absence_time] : null, <Clock className="w-4 h-4" />)}
                        {renderProfileItem("在宅頻度", profile.home_frequency ? HOME_FREQUENCY_LABELS[profile.home_frequency] : null, <Home className="w-4 h-4" />)}
                        {renderProfileItem("猫の飼育経験", profile.cat_experience ? CAT_EXPERIENCE_LABELS[profile.cat_experience] : null, <Heart className="w-4 h-4" />)}
                        {renderProfileItem("希望の距離感", profile.cat_distance ? CAT_DISTANCE_LABELS[profile.cat_distance] : null, <Maximize className="w-4 h-4" />)}
                      </div>
                    </div>

                    <div className="mt-10 p-6 bg-pink-50/30 rounded-3xl border border-pink-100/50">
                      <h3 className="text-sm font-black text-pink-600 mb-6 flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        家庭の雰囲気・環境
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        {renderProfileItem("家の雰囲気", profile.home_atmosphere ? HOME_ATMOSPHERE_LABELS[profile.home_atmosphere] : null, <Music className="w-4 h-4" />)}
                        {renderProfileItem("来客の頻度", profile.visitor_frequency ? VISITOR_FREQUENCY_LABELS[profile.visitor_frequency] : null, <Users className="w-4 h-4" />)}
                      </div>
                    </div>
                  </section>

                  {/* 特集：猫を探すバナー */}
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl group cursor-pointer hover:shadow-indigo-200 transition-all">
                    <div className="absolute -right-10 -bottom-10 opacity-20 transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700">
                      <Cat className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 max-w-sm">
                      <h3 className="text-3xl font-black mb-4 tracking-tight">運命の出会いを探す</h3>
                      <p className="text-indigo-100 font-bold mb-8 leading-relaxed">
                        あなたにぴったりのパートナーが待っています。条件に合う保護猫たちをチェックしてみましょう。
                      </p>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-pink-50 transition-all shadow-xl group/btn"
                      >
                        新しい家族を探しに行く
                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent"></div>
                  <div className="relative">
                    <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 rotate-6 shadow-lg border-2 border-white">
                      <AlertCircle className="w-12 h-12" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">情報を充実させましょう</h3>
                    <p className="text-gray-500 font-bold mb-10 max-w-md mx-auto leading-relaxed">
                      里親に応募するには、プロフィール詳細の入力が必要です。
                      あなたのライフスタイルを共有して、最適な猫ちゃんと出会いましょう。
                    </p>
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-3 px-10 py-5 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-xl hover:shadow-amber-200 hover:scale-105 active:scale-95 group"
                    >
                      <Edit2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      里親プロフィールを登録
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
