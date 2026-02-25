"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ArrowRight, Trash2 } from "lucide-react";

interface Application {
  id: number;
  cat: number;
  cat_detail: {
    id: number;
    name: string;
    primary_image?: string;
    breed?: string;
  };
  applicant_info: {
    id: number;
    username: string;
  };
  status: string;
  motivation: string;
  applied_at: string;
  updated_at: string;
  full_name?: string;
  phone_number?: string;
  address?: string;
}

export default function ShelterApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get("/api/applications/");
        setApplications(response.data.results || response.data);
      } catch (err: any) {
        console.error("Failed to fetch applications:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/shelter/login");
        } else {
          setError("申請情報を取得できませんでした。");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [router]);

  const getStatusInfo = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
      pending: { label: "未対応", color: "text-orange-600", bgColor: "bg-orange-100" },
      reviewing: { label: "チャット中", color: "text-blue-600", bgColor: "bg-blue-100" },
      trial: { label: "トライアル中", color: "text-purple-600", bgColor: "bg-purple-100" },
      accepted: { label: "譲渡成立", color: "text-green-600", bgColor: "bg-green-100" },
      rejected: { label: "お断り", color: "text-red-600", bgColor: "bg-red-100" },
      cancelled: { label: "キャンセル済み", color: "text-gray-600", bgColor: "bg-gray-100" },
    };
    return statusConfig[status] || { label: status, color: "text-gray-600", bgColor: "bg-gray-100" };
  };

  const updateStatus = async (applicationId: number, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/api/applications/${applicationId}/status/`, {
        status: newStatus,
      });
      
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("ステータスの更新に失敗しました。現在のステータスからは変更できない可能性があります。");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplications = statusFilter
    ? applications.filter((app) => app.status === statusFilter)
    : applications;

  // 統計
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter((a) => a.status === "reviewing").length,
    trial: applications.filter((a) => a.status === "trial").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
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
            <span className="text-gray-800">申請一覧</span>
          </div>

          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">里親申請一覧</h1>
            <p className="text-gray-500 mt-1">保護猫への里親申請を確認・管理します</p>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden ${
                statusFilter === "pending"
                  ? "bg-orange-50 border-orange-200 ring-2 ring-orange-200"
                  : "bg-white border-gray-100 hover:border-orange-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-gray-400 mb-1">未対応</p>
                {stats.pending > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
                )}
              </div>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}<span className="text-sm ml-1 font-normal text-gray-500">件</span></p>
            </button>
            <button
              onClick={() => setStatusFilter("reviewing")}
              className={`p-4 rounded-xl border transition-all text-left ${
                statusFilter === "reviewing"
                  ? "bg-blue-50 border-blue-200 ring-2 ring-blue-200"
                  : "bg-white border-gray-100 hover:border-blue-200"
              }`}
            >
              <p className="text-xs font-bold text-gray-400 mb-1">チャット中</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reviewing}<span className="text-sm ml-1 font-normal text-gray-500">件</span></p>
            </button>
            <button
              onClick={() => setStatusFilter("trial")}
              className={`p-4 rounded-xl border transition-all text-left ${
                statusFilter === "trial"
                  ? "bg-purple-50 border-purple-200 ring-2 ring-purple-200"
                  : "bg-white border-gray-100 hover:border-purple-200"
              }`}
            >
              <p className="text-xs font-bold text-gray-400 mb-1">トライアル中</p>
              <p className="text-2xl font-bold text-purple-600">{stats.trial}<span className="text-sm ml-1 font-normal text-gray-500">件</span></p>
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`p-4 rounded-xl border transition-all text-left ${
                statusFilter === "accepted"
                  ? "bg-green-50 border-green-200 ring-2 ring-green-200"
                  : "bg-white border-gray-100 hover:border-green-200"
              }`}
            >
              <p className="text-xs font-bold text-gray-400 mb-1">譲渡成立</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}<span className="text-sm ml-1 font-normal text-gray-500">件</span></p>
            </button>
            <button
              onClick={() => setStatusFilter("")}
              className={`p-4 rounded-xl border transition-all text-left ${
                statusFilter === ""
                  ? "bg-gray-50 border-gray-200 ring-2 ring-gray-200"
                  : "bg-white border-gray-100 hover:border-gray-200"
              }`}
            >
              <p className="text-xs font-bold text-gray-400 mb-1">全件</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}<span className="text-sm ml-1 font-normal text-gray-500">件</span></p>
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
              {error}
            </div>
          )}

          {/* 申請一覧 */}
          {filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const statusInfo = getStatusInfo(application.status);
                const isUpdating = updatingId === application.id;

                return (
                  <div
                    key={application.id}
                    onClick={() => router.push(`/shelter/applications/${application.id}`)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* 猫情報 */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-100 transition-all">
                          {application.cat_detail.primary_image ? (
                            <img
                              src={application.cat_detail.primary_image}
                              alt={application.cat_detail.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              🐱
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {application.cat_detail.name}
                          </div>
                          <p className="text-sm text-gray-500">
                            {application.cat_detail.breed || "MIX"}
                          </p>
                        </div>
                      </div>

                      {/* 申請者情報 */}
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">申請者</p>
                        <p className="font-medium text-gray-800">
                          {application.applicant_info.username} さん
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(application.applied_at).toLocaleDateString("ja-JP")} 申請
                        </p>
                      </div>

                      {/* ステータス */}
                      <div className="flex-shrink-0 flex items-center gap-3">
                        <span
                          className={`inline-block px-3 py-1.5 text-sm font-bold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>

                        {/* 削除（アーカイブ）ボタン */}
                        {['accepted', 'rejected', 'cancelled'].includes(application.status) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (confirm("この履歴を非表示にしますか？")) {
                                try {
                                  await api.post(`/api/applications/${application.id}/archive/`);
                                  setApplications(prev => prev.filter(a => a.id !== application.id));
                                } catch (err) {
                                  alert("履歴の非表示に失敗しました。");
                                }
                              }
                            }}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="履歴から削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* アクション省略（詳細ページへ統合） */}
                      <div className="hidden md:block">
                        <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* 応募動機（プレビュー） */}
                    {application.motivation && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">応募動機</p>
                        <p className="text-sm text-gray-700 line-clamp-1 group-hover:text-gray-900 transition-colors">
                          {application.motivation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {statusFilter ? "該当する申請がありません" : "まだ申請がありません"}
              </h3>
              <p className="text-gray-500 mb-6">
                {statusFilter
                  ? "フィルターを変更して、他の申請を確認してください。"
                  : "保護猫への里親申請が届くと、ここに表示されます。"}
              </p>
              {statusFilter && (
                <button
                  onClick={() => setStatusFilter("")}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  すべて表示
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
