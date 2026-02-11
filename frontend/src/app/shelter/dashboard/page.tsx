"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User, CatList } from "@/types";

interface Stats {
  totalCats: number;
  openCats: number;
  adoptedCats: number;
  totalApplications: number;
  pendingApplications: number;
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
    adoptedCats: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

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

          let catStats = { total: 0, open: 0, adopted: 0 };
          if (catsResult.status === 'fulfilled') {
            const cats = catsResult.value.data.results || catsResult.value.data;
            catStats = {
              total: catsResult.value.data.count || cats.length,
              open: cats.filter((c: any) => c.status === "open").length,
              adopted: cats.filter((c: any) => c.status === "adopted").length,
            };
          }

          let appStats = { total: 0, pending: 0 };
          if (appsResult.status === 'fulfilled') {
            const apps = appsResult.value.data.results || appsResult.value.data;
            appStats = {
              total: appsResult.value.data.count || apps.length,
              pending: apps.filter((a: any) => a.status === "pending").length,
            };
          }

          setStats({
            totalCats: catStats.total,
            openCats: catStats.open,
            adoptedCats: catStats.adopted,
            totalApplications: appStats.total,
            pendingApplications: appStats.pending,
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

  const handleLogout = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    ようこそ、{user?.username}さん！
                  </h1>
                  {isAdmin ? (
                    <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">管理者</span>
                  ) : (
                    <span className="bg-blue-400 text-blue-900 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">スタッフ</span>
                  )}
                </div>
                <p className="text-blue-100">
                  保護団体ダッシュボードへようこそ。
                  {isAdmin 
                    ? "ここから猫の登録や申請の管理（管理者機能）ができます。" 
                    : "登録済みの猫の情報の管理を行えます。"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* 審査ステータスバナー */}
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
                    {user.shelter_info.verification_status === 'rejected' && (
                      <p>恐れ入りますが、ご登録の内容では承認することができませんでした。詳細はメールまたは運営までお問い合わせください。</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* クイックアクション */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 mb-8`}>
            {isAdmin && (
              <Link
                href="/shelter/cats/new"
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🐱</div>
                <h3 className="font-semibold text-gray-800 mb-1">新しい猫を登録</h3>
                <p className="text-sm text-gray-500">保護猫の情報を追加</p>
              </Link>
            )}

            <Link
              href="/shelter/cats"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📋</div>
              <h3 className="font-semibold text-gray-800 mb-1">猫の管理</h3>
              <p className="text-sm text-gray-500">登録済みの猫を管理</p>
            </Link>

            {isAdmin && (
              <Link
                href="/shelter/applications"
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group relative"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📨</div>
                <h3 className="font-semibold text-gray-800 mb-1">申請一覧</h3>
                <p className="text-sm text-gray-500">里親申請を確認</p>
                {stats.pendingApplications > 0 && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    {stats.pendingApplications}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/shelter/profile"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏢</div>
              <h3 className="font-semibold text-gray-800 mb-1">団体プロフィール</h3>
              <p className="text-sm text-gray-500">
                {isAdmin ? "団体の情報を編集・管理" : "団体の情報を確認"}
              </p>
            </Link>

            {isAdmin && (
              <Link
                href="/shelter/staff"
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👥</div>
                <h3 className="font-semibold text-gray-800 mb-1">スタッフ管理</h3>
                <p className="text-sm text-gray-500">メンバーの権限設定・削除</p>
              </Link>
            )}
          </div>

          {/* 統計カード */}
          <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6 mb-8`}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">登録中の猫</span>
                <span className="text-2xl">🐱</span>
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats.totalCats}</div>
              <p className="text-sm text-green-500 mt-1">募集中: {stats.openCats}匹</p>
            </div>

            {isAdmin && (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm">里親申請</span>
                    <span className="text-2xl">📨</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{stats.totalApplications}</div>
                  <p className="text-sm text-orange-500 mt-1">未確認: {stats.pendingApplications}件</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm">譲渡完了</span>
                    <span className="text-2xl">🏠</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{stats.adoptedCats}</div>
                  <p className="text-sm text-gray-400 mt-1">これまでの実績</p>
                </div>
              </>
            )}
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
