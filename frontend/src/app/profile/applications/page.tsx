"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { 
  ClipboardList, 
  ChevronRight, 
  MessageSquare, 
  Calendar, 
  Heart,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

interface Application {
  id: number;
  cat: number;
  cat_detail: {
    id: number;
    name: string;
    breed: string;
    age_category: string;
    gender: string;
    primary_image: string;
    shelter_name: string;
  };
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'cancelled';
  unread_count: number;
  applied_at: string;
  message: string;
}

export default function ApplicationHistoryPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get("/api/applications/");
        // res.data がページネーションされている可能性があるため、前回の修正と同様に処理
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setApplications(data);
      } catch (err: any) {
        console.error("Failed to fetch applications:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/login");
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [router]);

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            応募直後
          </span>
        );
      case 'reviewing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <AlertCircle className="w-3 h-3" />
            審査中
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            承認済み
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3" />
            不成立
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            キャンセル
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/profile" className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              マイページへ戻る
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-pink-500" />
              里親申請の履歴
            </h1>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-500">
              合計 <span className="font-bold text-gray-900">{applications.length}</span> 件の申請
            </p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-pink-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">申請履歴がありません</h2>
            <p className="text-gray-500 mb-8">
              気になる猫ちゃんを見つけて、里親申請をしてみましょう。
            </p>
            <Link 
              href="/cats" 
              className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-pink-200"
            >
              猫ちゃんを探しに行く
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div 
                key={app.id}
                className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* 猫の画像 */}
                  <div className="relative w-full md:w-32 h-40 md:h-32 flex-shrink-0">
                    <img 
                      src={app.cat_detail.primary_image || "/images/placeholder_cat.svg"} 
                      alt={app.cat_detail.name}
                      className="w-full h-full object-cover rounded-xl shadow-inner bg-gray-100"
                    />
                  </div>

                  {/* 申請内容 */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{app.cat_detail.name} ちゃん</h2>
                          <span className="text-gray-300">|</span>
                          <span className="text-sm text-gray-500">{app.cat_detail.shelter_name}</span>
                          {app.unread_count > 0 && (
                            <Link
                              href={`/messages/${app.id}`}
                              className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce shadow-sm cursor-pointer transition-colors"
                              title="新着メッセージを確認"
                            >
                              <MessageSquare className="w-3 h-3" />
                              新着 {app.unread_count}
                            </Link>
                          )}
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          応募日: {new Date(app.applied_at).toLocaleDateString('ja-JP')}
                        </div>
                        <div className="bg-gray-100 h-1 w-1 rounded-full px-0 py-0 overflow-hidden" />
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-500">{app.cat_detail.breed}</span>
                        </div>
                      </div>

                      {app.message && (
                        <Link
                          href={`/messages/${app.id}`}
                          className="block text-sm text-gray-600 line-clamp-2 bg-gray-50 hover:bg-gray-100 p-3 rounded-lg mb-4 cursor-pointer transition-colors group/message"
                        >
                          <span className="text-gray-400 group-hover/message:text-pink-500 font-bold text-xs block mb-1 transition-colors">
                            あなたのメッセージ: (クリックでチャットを開く)
                          </span>
                          {app.message}
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/cats/${app.cat_detail.id}`}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2.5 px-6 rounded-xl transition-colors text-sm"
                      >
                        猫の詳細を見る
                      </Link>

                      {/* 削除（アーカイブ）ボタン */}
                      {['accepted', 'rejected', 'cancelled'].includes(app.status) && (
                        <button
                          onClick={async () => {
                            if (confirm("この履歴を非表示にしますか？（この操作は取り消せません）")) {
                              try {
                                await api.post(`/api/applications/${app.id}/archive/`);
                                setApplications(prev => prev.filter(a => a.id !== app.id));
                              } catch (err) {
                                alert("履歴の削除に失敗しました。");
                              }
                            }
                          }}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
                          title="履歴から削除"
                        >
                          <Trash2 className="w-4 h-4" />
                          履歴を削除
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
