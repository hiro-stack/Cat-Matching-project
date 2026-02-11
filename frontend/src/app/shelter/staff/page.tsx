"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ShelterMember } from "@/types";
import { ArrowLeft, Users, Shield, User, Trash2, Home, Crown, AlertTriangle, Plus, X, AlertCircle } from "lucide-react";

export default function ShelterStaffPage() {
  const router = useRouter();
  const [members, setMembers] = useState<ShelterMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("access_token");
      if (!token) {
        router.push("/shelter/login");
        return;
      }

      try {
        // プロフィール取得（権限チェック）
        const userRes = await api.get("/api/accounts/profile/");
        const user = userRes.data;
        setCurrentUserId(user.id);

        if (user.user_type !== "shelter" && !user.is_superuser) {
          alert("アクセス権限がありません。");
          router.push("/");
          return;
        }

        if (user.shelter_role !== 'admin' && !user.is_superuser) {
           alert("このページにアクセスできるのは管理者のみです。");
           router.push("/shelter/dashboard");
           return;
        }

        // メンバー一覧取得
        const membersRes = await api.get("/api/shelters/members/");
        setMembers(membersRes.data.results || membersRes.data);

      } catch (error: any) {
        console.error("Failed to fetch data:", error);
         if (error.response?.status === 401 || error.response?.status === 403) {
             // 権限エラーの場合もダッシュボード等へ
             alert("スタッフ情報の取得に失敗しました。権限が不足している可能性があります。");
             router.push("/shelter/dashboard");
         }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleRoleChange = async (memberId: number, newRole: string) => {
    if (!confirm("役割を変更してもよろしいですか？")) return;

    try {
      await api.patch(`/api/shelters/members/${memberId}/`, { role: newRole });
      
      // ローカルの状態を更新
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole as any } : m
      ));
      alert("役割を変更しました。");
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("役割の変更に失敗しました。");
    }
  };

  const handleDelete = async (memberId: number) => {
    if (!confirm("本当にこのメンバーを削除（無効化）しますか？\nこの操作は取り消せません。")) return;

    try {
      await api.delete(`/api/shelters/members/${memberId}/`);
      
      // ローカルの状態を更新（リストから削除）
      setMembers(prev => prev.filter(m => m.id !== memberId));
      alert("メンバーを削除しました。");
    } catch (error: any) {
      console.error("Failed to delete member:", error);
      const msg = error.response?.data?.join ? error.response.data.join("\n") : "メンバーの削除に失敗しました。";
      alert(msg);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    if (!confirm(`${newMemberEmail} をスタッフとして追加しますか？\n対象のユーザーは既に会員登録済みである必要があります。`)) return;

    setIsAdding(true);
    try {
      await api.post("/api/shelters/members/", { email: newMemberEmail });
      
      alert("メンバーを追加しました。");
      setNewMemberEmail("");
      setIsAddModalOpen(false);
      
      // リロードして最新リストを取得
      const membersRes = await api.get("/api/shelters/members/");
      setMembers(membersRes.data.results || membersRes.data);
      
    } catch (error: any) {
      console.error("Failed to add member:", error);
      const msg = error.response?.data?.detail 
        || (error.response?.data?.email ? error.response.data.email[0] : "メンバーの追加に失敗しました。");
      alert(msg);
    } finally {
      setIsAdding(false);
    }
  };


  // 役割ラベルの変換
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'staff': return 'スタッフ';
      default: return role;
    }
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
          {/* Breadcrumb / Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/shelter/dashboard" 
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              スタッフ管理
            </h1>
          </div>

          <div className="bg-white rounded-[30px] shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h2 className="text-lg font-bold text-gray-700">所属メンバー一覧</h2>
                  <p className="text-sm text-gray-400">
                    現在の保護団体に所属しているスタッフの一覧です。
                  </p>
               </div>
               
               <button 
                 onClick={() => setIsAddModalOpen(true)}
                 className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-600 transition-all flex items-center gap-2"
               >
                 <Plus className="w-4 h-4" /> メンバーを追加
               </button>
            </div>

            {members.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    メンバーが見つかりません。
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="py-4 px-4 font-medium">ユーザー名</th>
                                <th className="py-4 px-4 font-medium">メールアドレス</th>
                                <th className="py-4 px-4 font-medium">役割</th>
                                <th className="py-4 px-4 font-medium">参加日</th>
                                <th className="py-4 px-4 text-right font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {members.map((member) => (
                                <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-4 font-bold text-gray-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold">
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                        {member.username} 
                                        {member.user_id === currentUserId && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-1">自分</span>}
                                    </td>
                                    <td className="py-4 px-4">{member.email}</td>
                                    <td className="py-4 px-4">
                                        <div className="relative inline-block">
                                            {member.role === 'admin' && <Crown className="w-3 h-3 text-yellow-500 absolute -top-1 -right-2 transform rotate-12" />}
                                            <select 
                                                value={member.role} 
                                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                className={`appearance-none bg-transparent font-medium py-1 pr-6 cursor-pointer focus:outline-none ${
                                                    member.role === 'admin' ? 'text-blue-600' : 'text-gray-600'
                                                }`}
                                                disabled={member.user_id === currentUserId} // 自分自身は変更不可 (ロックアウト防止)
                                            >
                                                <option value="admin">管理者</option>
                                                <option value="staff">スタッフ</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-gray-400">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        {member.user_id !== currentUserId && (
                                            <button 
                                                onClick={() => handleDelete(member.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="削除する"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 text-xs text-orange-800">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                    <h4 className="font-bold mb-1">権限について</h4>
                    <p className="opacity-90 leading-relaxed">
                        <strong>管理者:</strong> 全ての機能（猫の登録・編集、申請管理、スタッフ管理、団体設定）にアクセスできます。<br />
                        <strong>スタッフ:</strong> 猫の登録・編集、申請管理が可能です。スタッフ管理や団体設定はできません。
                    </p>
                </div>
            </div>

          </div>
        </div>

        {/* Add Member Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                     <Plus className="w-5 h-5 text-blue-500" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-800">メンバーを追加</h3>
                     <p className="text-xs text-gray-400">メールアドレスで検索して追加します</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス</label>
                  <input 
                    type="email" 
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    追加するユーザーは、事前にマッチングアプリに会員登録（一般ユーザーとして登録）している必要があります。
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button 
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAdding && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    追加する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
