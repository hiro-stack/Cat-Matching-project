"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { CatList } from "@/types";

export default function ShelterCatsPage() {
  const router = useRouter();
  const [cats, setCats] = useState<CatList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const fetchMyCats = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

      try {
        // プロフィール情報を取得して権限を確認
        const userResponse = await api.get("/api/accounts/profile/");
        setIsSuperUser(userResponse.data.is_superuser || userResponse.data.shelter_role === 'admin');

        const response = await api.get("/api/cats/my_cats/");
        setCats(response.data.results || response.data);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/shelter/login");
        } else {
          setError("情報の取得に失敗しました。");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCats();
  }, [router]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      open: { label: "募集中", color: "bg-green-100 text-green-600" },
      paused: { label: "一時停止", color: "bg-yellow-100 text-yellow-600" },
      in_review: { label: "審査中", color: "bg-blue-100 text-blue-600" },
      trial: { label: "トライアル中", color: "bg-purple-100 text-purple-600" },
      adopted: { label: "譲渡済み", color: "bg-gray-100 text-gray-600" },
    };
    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-600" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f0f6] via-[#e8f4f8] to-[#f0f5ff] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* パンくずリスト */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/shelter/dashboard" className="hover:text-blue-600">
              ダッシュボード
            </Link>
            <span>/</span>
            <span className="text-gray-800">猫の管理</span>
          </div>

          {/* ヘッダー */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">猫の管理</h1>
              <p className="text-gray-500 mt-1">登録済みの保護猫を管理します</p>
            </div>
            {isSuperUser && (
              <Link
                href="/shelter/cats/new"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>➕</span>
                新しい猫を登録
              </Link>
            )}
          </div>

          {/* ステータスタブ */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
            {[
              { id: 'all', label: 'すべて', count: cats.length },
              { id: 'open', label: '募集中', count: cats.filter(c => c.status === 'open').length },
              { id: 'trial', label: 'トライアル', count: cats.filter(c => c.status === 'trial').length },
              { id: 'adopted', label: '譲渡完了', count: cats.filter(c => c.status === 'adopted').length },
              { id: 'etc', label: 'その他', count: cats.filter(c => !['open', 'trial', 'adopted'].includes(c.status)).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-100'
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {cats.length > 0 ? (
            <>
              {/* 猫リストのフィルタリング */}
              {(() => {
                const filteredCats = activeTab === 'all' 
                  ? cats 
                  : activeTab === 'etc'
                    ? cats.filter(c => !['open', 'trial', 'adopted'].includes(c.status))
                    : cats.filter(c => c.status === activeTab);
                
                if (filteredCats.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                      <p className="text-gray-500">該当する猫がいません。</p>
                    </div>
                  );
                }

                return (
                  <>
                    {/* PC用テーブル表示 (md以上) */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                猫情報
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                性別・年齢・種類
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                ステータス
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                登録日
                              </th>
                              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredCats.map((cat) => (
                              <tr 
                                key={`pc-${cat.id}`} 
                                onClick={() => router.push(`/shelter/cats/${cat.id}/edit`)}
                                className="hover:bg-blue-50 transition-colors cursor-pointer group"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform relative">
                                      {cat.primary_image ? (
                                        <Image
                                          src={cat.primary_image}
                                          alt={cat.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg bg-gray-200">
                                          🐱
                                        </div>
                                      )}
                                    </div>
                                    <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{cat.name}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">
                                      {cat.gender === "male" ? "♂ オス" : cat.gender === "female" ? "♀ メス" : "不明"}
                                    </span>
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-gray-600">{cat.estimated_age || cat.age_category || "不明"}</span>
                                    <div className="text-gray-500 text-xs mt-0.5">{cat.breed}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(cat.status)}</td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                  {new Date(cat.created_at).toLocaleDateString("ja-JP")}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="text-gray-400 text-lg group-hover:text-blue-500">›</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* モバイル用カード表示 (md未満) */}
                    <div className="md:hidden space-y-4">
                      {filteredCats.map((cat) => (
                        <div 
                          key={`mobile-${cat.id}`}
                          onClick={() => router.push(`/shelter/cats/${cat.id}/edit`)}
                          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-all flex gap-4 cursor-pointer"
                        >
                          <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                            {cat.primary_image ? (
                              <Image
                                src={cat.primary_image}
                                alt={cat.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-200">
                                🐱
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-gray-900 truncate pr-2">{cat.name}</h3>
                              <div className="flex-shrink-0 transform scale-90 origin-top-right">
                                {getStatusBadge(cat.status)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {cat.gender === "male" ? "♂" : cat.gender === "female" ? "♀" : "?"} 
                              <span className="mx-1">·</span>
                              {cat.estimated_age || cat.age_category}
                              <span className="mx-1">·</span>
                              {cat.breed}
                            </div>
                            <div className="text-xs text-gray-400">
                              登録: {new Date(cat.created_at).toLocaleDateString("ja-JP")}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-300">
                            ›
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">🐱</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">まだ猫が登録されていません</h3>
              <p className="text-gray-500 mb-6">
                新しい保護猫を登録して、里親を募集しましょう
              </p>
              {isSuperUser ? (
                <Link
                  href="/shelter/cats/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <span>➕</span>
                  最初の猫を登録する
                </Link>
              ) : (
                <p className="text-sm text-gray-400">
                  ※新しい猫の登録は管理人のみ可能です
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
