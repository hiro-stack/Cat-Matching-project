"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User, CatList } from "@/types";

interface Stats {
  totalCats: number;
  openCats: number;
  trialCats: number;
  adoptedCats: number;
  totalApplications: number;
  pendingApplications: number;
  reviewingApplications: number; // 審査中
  trialApplications: number;     // トライアル
  activeUsers: number;           // 対応中の実ユーザー数
}

interface Application {
  id: number;
  status: string;
}

export default function ShelterDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalCats: 0,
    openCats: 0,
    trialCats: 0,
    adoptedCats: 0,
    totalApplications: 0,
    pendingApplications: 0,
    reviewingApplications: 0,
    trialApplications: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ユーザー情報取得
        const userResponse = await api.get("/api/accounts/profile/");
        const userData = userResponse.data;

        if (userData.user_type !== "shelter" && userData.user_type !== "admin") {
          router.push("/");
          return;
        }

        setUser(userData);

        // 統計データ取得（個別に取得して耐障害性を高める）
        try {
          const catsPromise = api.get("/api/cats/my_cats/", { params: { limit: 1000 } });
          const applicationsPromise = (userData.shelter_role === 'admin' || userData.is_superuser)
            ? api.get("/api/applications/", { params: { limit: 1000 } })
            : Promise.resolve({ data: { results: [], count: 0 } });

          const [catsResult, appsResult] = await Promise.allSettled([
            catsPromise,
            applicationsPromise,
          ]);

          let catStats = { total: 0, open: 0, trial: 0, adopted: 0 };
          if (catsResult.status === 'fulfilled') {
            const cats = catsResult.value.data.results || catsResult.value.data;
            catStats = {
              total: catsResult.value.data.count || cats.length,
              open: cats.filter((c: any) => c.status === "open").length,
              trial: cats.filter((c: any) => c.status === "trial").length,
              adopted: cats.filter((c: any) => c.status === "adopted").length,
            };
          }

          let appStats = { total: 0, pending: 0, reviewing: 0, trial: 0, activeUsers: 0 };
          if (appsResult.status === 'fulfilled') {
            const apps = appsResult.value.data.results || appsResult.value.data;
            const activeApps = apps.filter((a: any) => ["reviewing", "trial"].includes(a.status));
            const uniqueUserIds = new Set(activeApps.map((a: any) => a.applicant_info?.id || a.applicant));

            appStats = {
              total: appsResult.value.data.count || apps.length,
              pending: apps.filter((a: any) => a.status === "pending").length,
              reviewing: apps.filter((a: any) => a.status === "reviewing").length,
              trial: apps.filter((a: any) => a.status === "trial").length,
              activeUsers: uniqueUserIds.size,
            };
          }

          setStats({
            totalCats: catStats.total,
            openCats: catStats.open,
            trialCats: catStats.trial,
            adoptedCats: catStats.adopted,
            totalApplications: appStats.total,
            pendingApplications: appStats.pending,
            reviewingApplications: appStats.reviewing,
            trialApplications: appStats.trial,
            activeUsers: appStats.activeUsers,
          });
        } catch (statsError) {
          console.error("Stats calculation failed:", statsError);
        }
      } catch (error: any) {
        console.error("Auth check failed:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          router.push("/shelter/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post("/api/accounts/logout/", {});
    } catch {
      // エラーでもログアウト処理を継続
    }
    router.push("/shelter/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 管理者権限チェック (is_superuser または shelter_role が admin)
  const isAdmin = user?.is_superuser || user?.shelter_role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* ウェルカムバナー */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-xl sm:text-3xl font-bold">
                    ようこそ、{user?.username}さん！
                  </h1>
                  {isAdmin ? (
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">管理者</span>
                  ) : (
                    <span className="bg-blue-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">スタッフ</span>
                  )}
                </div>
                <p className="text-blue-100 text-sm sm:text-lg opacity-90">
                  {isAdmin 
                    ? "本日の活動状況をチェックしましょう。" 
                    : "担当している猫の状況を確認しましょう。"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-xl text-white font-bold transition-all text-center shadow-sm"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* 審査ステータスバナー (省略) */}
          {user?.shelter_info && user.shelter_info.verification_status !== 'approved' && (
            <div className={`mb-8 p-6 rounded-2xl border ${
              user.shelter_info.verification_status === 'pending'
                ? 'bg-blue-50 border-blue-100 text-blue-800'
                : user.shelter_info.verification_status === 'need_fix'
                ? 'bg-orange-50 border-orange-100 text-orange-800'
                : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              <div className="flex items-start gap-4">
                <div className="text-2xl">
                  {user.shelter_info.verification_status === 'pending' ? '⏳' : '⚠️'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-1">
                    {user.shelter_info.verification_status === 'pending' && '団体情報の審査中です'}
                    {user.shelter_info.verification_status === 'need_fix' && '団体情報の修正が必要です'}
                    {user.shelter_info.verification_status === 'rejected' && '団体登録が承認されませんでした'}
                  </h3>
                  <div className="text-sm opacity-90">
                    {user.shelter_info.verification_status === 'pending' && (
                      <p>
                        現在運営による内容確認を行っております。承認されるまで、猫の公開や応募の受付はできません。<br />
                        審査完了まで今しばらくお待ちください。
                      </p>
                    )}
                    {user.shelter_info.verification_status === 'need_fix' && (
                      <div className="space-y-2">
                        <p>運営より以下の内容について修正依頼が出ています：</p>
                        {user.shelter_info.review_message && (
                          <div className="p-3 bg-white/50 rounded-lg font-medium">
                            {user.shelter_info.review_message}
                          </div>
                        )}
                        <Link 
                          href="/shelter/profile"
                          className="inline-block mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs"
                        >
                          プロフィールを修正する
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 統計カードセクション */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
              現在の活動ステータス
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* 猫の管理カード */}
              <Link href="/shelter/cats" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 font-bold text-sm">登録中の猫</span>
                    <span className="p-2 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors text-xl">🐱</span>
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">{stats.totalCats}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">募集中の子</span>
                      <span className="text-green-600 font-bold">{stats.openCats}匹</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: stats.totalCats > 0 ? `${(stats.openCats / stats.totalCats) * 100}%` : '0%' }}></div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* 里親申請（未対応）カード */}
              <Link href="/shelter/applications?status=pending" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 font-bold text-sm">新着の里親申請</span>
                    <span className="p-2 bg-orange-50 text-orange-500 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors text-xl">📨</span>
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">{stats.pendingApplications}</div>
                  <div className="text-xs text-orange-500 font-bold flex items-center gap-1">
                    <span className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></span>
                    未確認の申請があります
                  </div>
                </div>
              </Link>

              {/* 対応中（チャット中）カード */}
              <Link href="/shelter/applications?status=active" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 font-bold text-sm">チャット/対応中</span>
                    <span className="p-2 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition-colors text-xl">💬</span>
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">{stats.activeUsers}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">審査中: {stats.reviewingApplications}件</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">トライアル: {stats.trialApplications}件</span>
                  </div>
                </div>
              </Link>

              {/* 譲渡完了カード */}
              <Link href="/shelter/cats?status=adopted" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 font-bold text-sm">譲渡完了実績</span>
                    <span className="p-2 bg-green-50 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors text-xl">🏠</span>
                  </div>
                  <div className="text-4xl font-black text-gray-900 mb-2">{stats.adoptedCats}</div>
                  <div className="text-xs text-gray-400 font-medium">これまでに繋がったご縁</div>
                </div>
              </Link>
            </div>
          </div>

          {/* クイックツールセクション */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2 px-1">
              <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
              管理ツール
            </h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
              {isAdmin && (
                <Link
                  href="/shelter/cats/new"
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">✨</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">新しい猫を登録</h3>
                    <p className="text-[10px] text-gray-500">里親募集ページを作成</p>
                  </div>
                </Link>
              )}

              <Link
                href="/shelter/cats"
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">📋</div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">猫の一覧・管理</h3>
                  <p className="text-[10px] text-gray-500">情報の編集や募集停止</p>
                </div>
              </Link>
              
              <Link
                href="/shelter/profile"
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:bg-pink-50 hover:border-pink-200 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">🏢</div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">団体プロフィール</h3>
                  <p className="text-[10px] text-gray-500">公開情報やロゴの管理</p>
                </div>
              </Link>

              {isAdmin && (
                <Link
                  href="/shelter/staff"
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">👥</div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">スタッフ管理</h3>
                    <p className="text-[10px] text-gray-500">権限設定・メンバー管理</p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* お知らせ (管理人のみ) */}
          {isAdmin && stats.pendingApplications > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🔔</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 mb-1">
                    {stats.pendingApplications}件の未確認申請があります
                  </h3>
                  <p className="text-sm text-orange-700">
                    新しい里親申請を確認してください。
                  </p>
                </div>
                <Link
                  href="/shelter/applications"
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
                >
                  確認する
                </Link>
              </div>
            </div>
          )}

          {/* クイックスタートガイド (管理人のみ) */}
          {isAdmin && stats.totalCats === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">はじめましょう！</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    まだ猫が登録されていません。保護猫を登録して、里親を募集しましょう。
                  </p>
                  <Link
                    href="/shelter/cats/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <span>➕</span>
                    最初の猫を登録
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
