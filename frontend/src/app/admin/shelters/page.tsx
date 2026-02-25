"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, Search, Filter } from "lucide-react";

interface Shelter {
  id: number;
  name: string;
  prefecture: string;
  city: string;
  address: string;
  postcode?: string;
  email: string;
  phone: string;
  website_url: string;
  sns_url: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'need_fix' | 'suspended';
  created_at: string;
  representative?: string;
  business_hours?: string;
  transfer_available_hours?: string;
  description?: string;
}

export default function AdminShelterManagementPage() {
  const router = useRouter();
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get("/api/accounts/profile/");
        if (!profileRes.data.is_superuser) {
          router.push("/");
          return;
        }

        const sheltersRes = await api.get("/api/shelters/");
        setShelters(sheltersRes.data.results || sheltersRes.data);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        // 認証エラー等はログインへ誘導
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/shelter/login");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleVerify = async (id: number, status: string) => {
    if (!reviewMessage && status !== 'approved') {
      alert("不承認や修正依頼の場合はメッセージを入力してください。");
      return;
    }

    setIsProcessing(true);
    try {
      await api.post(`/api/shelters/${id}/verify/`, {
        status,
        review_message: reviewMessage
      });
      
      // 一覧を更新
      const updated = shelters.map(s => 
        s.id === id ? { ...s, verification_status: status as any } : s
      );
      setShelters(updated);
      setSelectedShelter(null);
      setReviewMessage("");
      alert("処理が完了しました。");
    } catch (err) {
      console.error("Verification failed:", err);
      alert("処理に失敗しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredShelters = shelters.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || s.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">保護団体審査管理</h1>
              <p className="text-gray-500">新規登録団体の内容確認と承認を行います</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 一覧セクション */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="カフェ名・メールで検索..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="text-gray-400 w-4 h-4" />
                  <select 
                    className="bg-gray-50 border-none rounded-xl text-sm py-2 focus:ring-2 focus:ring-indigo-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">すべてのステータス</option>
                    <option value="pending">未審査 (pending)</option>
                    <option value="approved">承認済み (approved)</option>
                    <option value="need_fix">修正依頼中 (need_fix)</option>
                    <option value="rejected">否認 (rejected)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">団体・カフェ名</th>
                      <th className="px-6 py-4">登録日</th>
                      <th className="px-6 py-4">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredShelters.map((s) => (
                      <tr 
                        key={s.id} 
                        onClick={() => setSelectedShelter(s)}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedShelter?.id === s.id ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            s.verification_status === 'approved' ? 'bg-green-100 text-green-700' :
                            s.verification_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            s.verification_status === 'need_fix' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {s.verification_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredShelters.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                          該当する団体が見つかりません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 詳細・審査セクション */}
            <div className="lg:col-span-1">
              {selectedShelter ? (
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-50 sticky top-24 max-h-[85vh] overflow-y-auto">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
                    {selectedShelter.name}
                    <span className="block text-sm font-normal text-gray-500 mt-1">店舗詳細・審査</span>
                  </h2>
                  
                  <div className="space-y-6 mb-8">
                    {/* 代表者・連絡先 */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">代表者・連絡先</p>
                      {selectedShelter.representative && (
                        <p className="text-sm font-medium mb-1">代表：{selectedShelter.representative}</p>
                      )}
                      <p className="text-sm font-medium">{selectedShelter.phone}</p>
                      <p className="text-sm font-medium">{selectedShelter.email}</p>
                    </div>

                    {/* 所在地 */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">所在地</p>
                      {selectedShelter.postcode && (
                        <p className="text-xs text-gray-500">〒{selectedShelter.postcode}</p>
                      )}
                      <p className="text-sm font-medium">{selectedShelter.prefecture}{selectedShelter.city}{selectedShelter.address}</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedShelter.prefecture + selectedShelter.city + selectedShelter.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1"
                      >
                        Google Mapで確認 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    {/* 店舗情報 */}
                    <div>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">店舗情報</p>
                       {selectedShelter.business_hours && (
                         <div className="mb-2">
                           <span className="text-xs text-gray-500 block">営業時間</span>
                           <p className="text-sm">{selectedShelter.business_hours}</p>
                         </div>
                       )}
                       {selectedShelter.transfer_available_hours && (
                         <div className="mb-2">
                           <span className="text-xs text-gray-500 block">譲渡対応時間</span>
                           <p className="text-sm">{selectedShelter.transfer_available_hours}</p>
                         </div>
                       )}
                    </div>

                    {/* リンク */}
                    <div className="flex gap-4 border-t border-gray-100 pt-4">
                      {selectedShelter.website_url && (
                        <a 
                          href={selectedShelter.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center text-xs font-bold text-gray-600 flex items-center justify-center gap-2"
                        >
                          公式サイト <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedShelter.sns_url && (
                        <a 
                          href={selectedShelter.sns_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center text-xs font-bold text-gray-600 flex items-center justify-center gap-2"
                        >
                          SNS <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    
                    {/* 紹介文 */}
                    {selectedShelter.description && (
                      <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 whitespace-pre-wrap">
                        {selectedShelter.description}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">審査メッセージ（団体へ通知されます）</label>
                      <textarea 
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500"
                        rows={4}
                        placeholder="修正が必要な箇所や歓迎のメッセージを入力してください"
                        value={reviewMessage}
                        onChange={(e) => setReviewMessage(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleVerify(selectedShelter.id, 'need_fix')}
                        disabled={isProcessing}
                        className="py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        修正依頼
                      </button>
                      <button
                        onClick={() => handleVerify(selectedShelter.id, 'rejected')}
                        disabled={isProcessing}
                        className="py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        辞退・否認
                      </button>
                    </div>
                    <button
                      onClick={() => handleVerify(selectedShelter.id, 'approved')}
                      disabled={isProcessing}
                      className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold text-sm hover:bg-green-600 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      承認する
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 text-gray-400 sticky top-24">
                  <div className="text-4xl mb-4">👈</div>
                  <p className="text-sm font-medium">一覧から団体を選択して<br />詳細情報を確認・審査してください</p>
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
