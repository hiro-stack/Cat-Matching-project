"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User, ApplicantProfile } from "@/types";

// ラベル定義
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

const MOVING_PLAN_LABELS: Record<string, string> = {
  none: "なし",
  within_1_2_years: "1–2年以内",
  undecided: "未定",
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

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
      case "shelter":
        return "団体スタッフ";
      case "admin":
        return "管理者";
      default:
        return "飼い主希望者";
    }
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "shelter":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "admin":
        return "bg-purple-100 text-purple-600 border-purple-200";
      default:
        return "bg-pink-100 text-pink-600 border-pink-200";
    }
  };

  const renderProfileItem = (label: string, value: string | number | null | undefined, icon: string = "•") => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm font-medium text-gray-500 w-40 flex items-center gap-2">
        <span className="text-gray-300">{icon}</span>
        {label}
      </span>
      <span className="text-gray-800 font-medium mt-1 sm:mt-0">
        {value || <span className="text-gray-400 text-sm">未設定</span>}
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profile = user.applicant_profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* プロフィールカード */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100 mb-8">
            {/* ヘッダー部分 */}
            <div className="bg-gradient-to-r from-pink-400 to-pink-500 px-8 py-10 text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* アバター */}
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-inner">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
                  <p className="text-pink-100 opacity-90">{user.email}</p>
                  <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border bg-white/10 border-white/20 backdrop-blur-sm text-white`}
                    >
                      {getUserTypeLabel(user.user_type)}
                    </span>
                    {profile?.age && (
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full border bg-white/10 border-white/20 backdrop-blur-sm text-white">
                            {profile.age}歳
                        </span>
                    )}
                     {profile?.residence_area && (
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full border bg-white/10 border-white/20 backdrop-blur-sm text-white">
                           📍 {profile.residence_area}
                        </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link
                    href="/profile/edit"
                    className="inline-flex items-center px-6 py-2.5 bg-white text-pink-500 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                    >
                    ✏️ プロフィール編集
                    </Link>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 左カラム：アカウント情報・自己紹介 */}
                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-2xl">👤</span> 基本情報
                        </h2>
                        <div className="bg-gray-50 rounded-2xl p-6 space-y-2">
                            {renderProfileItem("ユーザー名", user.username, "🆔")}
                            {renderProfileItem("メールアドレス", user.email, "📧")}
                            {user.phone_number && renderProfileItem("電話番号", user.phone_number, "📞")}
                            {user.address && renderProfileItem("住所", user.address, "🏠")}
                        </div>
                    </section>

                </div>

                {/* 右カラム：里親プロフィール */}
                <div className="space-y-8">
                     {profile ? (
                        <>
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">📋</span> 里親プロフィール
                                </h2>
                                <div className="bg-pink-50/50 rounded-2xl p-6 border border-pink-100">
                                    {renderProfileItem("年齢", profile.age ? `${profile.age}歳` : null)}
                                    {renderProfileItem("性別", profile.gender ? GENDER_LABELS[profile.gender] : null)}
                                    {renderProfileItem("居住エリア", profile.residence_area)}
                                    {renderProfileItem("完全室内飼い", profile.indoors_agreement ? "同意済み ✅" : "未同意 ⚠️")}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-2xl">🏠</span> ライフスタイル・相性
                                </h2>
                                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                    {renderProfileItem("留守時間", profile.absence_time ? ABSENCE_TIME_LABELS[profile.absence_time] : null, "⏰")}
                                    {renderProfileItem("在宅頻度", profile.home_frequency ? HOME_FREQUENCY_LABELS[profile.home_frequency] : null, "🏠")}
                                    {renderProfileItem("猫の飼育経験", profile.cat_experience ? CAT_EXPERIENCE_LABELS[profile.cat_experience] : null, "🐈")}
                                    {renderProfileItem("希望の距離感", profile.cat_distance ? CAT_DISTANCE_LABELS[profile.cat_distance] : null, "📏")}
                                    {renderProfileItem("家の雰囲気", profile.home_atmosphere ? HOME_ATMOSPHERE_LABELS[profile.home_atmosphere] : null, "🎵")}
                                    {renderProfileItem("来客頻度", profile.visitor_frequency ? VISITOR_FREQUENCY_LABELS[profile.visitor_frequency] : null, "👥")}
                                </div>
                            </section>
                        </>
                     ) : (
                         <div className="bg-amber-50 rounded-2xl p-8 text-center border border-amber-100">
                             <div className="text-4xl mb-4">⚠️</div>
                             <h3 className="text-lg font-bold text-amber-800 mb-2">プロフィールが未設定です</h3>
                             <p className="text-amber-700 mb-6 text-sm">
                                 里親に応募するには、プロフィールの入力が必要です。<br/>
                                 あなたにぴったりの保護猫を見つけるためにも、詳細な情報を登録しましょう。
                             </p>
                             <Link
                                href="/profile/edit"
                                className="inline-block px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-md"
                             >
                                 プロフィールを作成する
                             </Link>
                         </div>
                     )}
                </div>
            </div>
            
            {/* フッター情報 */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-right text-xs text-gray-400">
                 ユーザーID: #{user.id} | 登録日: {user.created_at ? new Date(user.created_at).toLocaleDateString("ja-JP") : "-"}
            </div>
          </div>

          {/* クイックリンク */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/profile/applications"
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📋
              </div>
              <div>
                <h3 className="font-bold text-gray-800">申請履歴</h3>
                <p className="text-xs text-gray-500 mt-1">里親申請の状況を確認</p>
              </div>
            </Link>

            <Link
              href="/profile/favorites"
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ❤️
              </div>
              <div>
                <h3 className="font-bold text-gray-800">お気に入り</h3>
                <p className="text-xs text-gray-500 mt-1">お気に入りの猫ちゃん</p>
              </div>
            </Link>

             <Link
              href="/profile/edit"
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                ✏️
              </div>
              <div>
                <h3 className="font-bold text-gray-800">情報更新</h3>
                <p className="text-xs text-gray-500 mt-1">いつでも編集可能です</p>
              </div>
            </Link>

            <Link
              href="/"
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pink-200 hover:shadow-md transition-all flex flex-col items-center text-center gap-3 group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🐱
              </div>
              <div>
                <h3 className="font-bold text-gray-800">保護猫を探す</h3>
                <p className="text-xs text-gray-500 mt-1">新しい家族を見つける</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
