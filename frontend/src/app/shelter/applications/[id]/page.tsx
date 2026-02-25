"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { 
  ArrowLeft, 
  Send, 
  User as UserIcon, 
  Home, 
  Phone, 
  Mail, 
  MapPin, 
  Info,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Trash2,
  FileText
} from "lucide-react";
import { User } from "@/types";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

interface Message {
  id: number;
  application: number;
  sender: number;
  sender_type: 'user' | 'shelter' | 'admin';
  sender_info: {
    username: string;
    profile_image: string | null;
  };
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Application {
  id: number;
  cat: number;
  cat_detail: {
    id: number;
    name: string;
    primary_image?: string;
    breed?: string;
    shelter?: {
      id: number;
      name: string;
    };
  };
  applicant_info: {
    id: number;
    username: string;
    email: string;
    phone_number: string;
    address: string;
    profile_image: string | null;
    applicant_profile: {
      age: number | null;
      gender: string;
      residence_area: string;
      marital_status: string;
      income_status: string;
      pet_policy_confirmed: boolean;
      indoors_agreement: boolean;
      absence_time: string;
      home_frequency: string;
      cat_experience: string;
      cat_distance: string;
      home_atmosphere: string;
      visitor_frequency: string;
    };
  };
  status: string;
  message: string;
  applied_at: string;
  // Agreements
  term_agreement: boolean;
  lifelong_care_agreement: boolean;
  spay_neuter_agreement: boolean;
  medical_cost_understanding: boolean;
  income_status: string;
  emergency_contact_available: boolean;
  family_consent: boolean;
  allergy_status: boolean;
  cafe_data_sharing_consent: boolean;
}

export default function ShelterApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'chat'>('chat'); // Mobile tab

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchData = useCallback(async () => {
    try {
      const [appRes, msgRes] = await Promise.all([
        api.get(`/api/applications/${applicationId}/`),
        api.get(`/api/messages/?application=${applicationId}`)
      ]);
      setApplication(appRes.data);
      const data = Array.isArray(msgRes.data) ? msgRes.data : (msgRes.data.results || []);
      setMessages([...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      
      // Mark as read
      if (data.some((m: Message) => !m.is_read && m.sender_type === 'user')) {
        api.post('/api/messages/mark_as_read/', { application_id: Number(applicationId) })
           .catch(err => console.error("Failed to mark as read:", err));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get("/api/accounts/profile/");
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCurrentUser();
    pollingInterval.current = setInterval(fetchData, 5000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [applicationId, fetchData, fetchCurrentUser, router]);

  const fillTemplate = () => {
    if (!application) return;
    
    const shelterName = application.cat_detail.shelter?.name || "当団体";
    const staffName = currentUser?.username || "担当者";
    const catName = application.cat_detail.name;
    const applicantName = application.applicant_info.username;

    const template = `件名：お見合い日程のご案内（${catName}）
${applicantName}さま

${shelterName}の${staffName}です。
${catName}へのご応募ありがとうございます。

お見合い（面談）日程の候補です。ご都合のよいものを1つ選んで返信してください。
【形式】{来店/オンライン}
【候補】
A：{日付} {時間}
B：{日付} {時間}
C：{日付} {時間}

もし合う候補がなければ、可能な曜日・時間帯（例：土日午前／平日19時以降）を教えてください。
調整してご案内します。よろしくお願いします🐾

${shelterName}
${staffName}`;

    setNewMessage(template);
    
    // Adjust textarea height
    setTimeout(() => {
      const textarea = document.getElementById('chat-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.focus();
      }
    }, 0);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await api.post("/api/messages/", {
        application_id: Number(applicationId),
        content: newMessage,
      });
      setNewMessage("");
      await fetchData();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    let reason = "";
    if (newStatus === 'rejected') {
      const input = prompt("お見送りの理由を応募者へのメッセージとして入力してください（チャットに送信されます）");
      if (input === null) return; // キャンセル
      if (!input.trim()) {
        alert("メッセージを入力してください。");
        return;
      }
      reason = input;
    } else {
      if (!confirm(`ステータスを「${getStatusLabel(newStatus)}」に変更しますか？`)) return;
    }

    setIsUpdatingStatus(true);
    try {
      // 1. 最新状態を再取得（古い状態での操作を防止）
      const latestRes = await api.get(`/api/applications/${applicationId}/`);
      const latestApp = latestRes.data;
      
      // 2. クライアント側で遷移可能か事前チェック
      const currentStatus = latestApp.status;
      if (currentStatus !== application?.status) {
        // サーバー側のステータスがクライアントと異なる場合、画面を更新
        setApplication(latestApp);
        alert(`ステータスが「${getStatusLabel(currentStatus)}」に変更されています。画面を更新しました。`);
        return;
      }

      // 3. お見送りの場合はメッセージを先に送る
      if (newStatus === 'rejected' && reason) {
        await api.post("/api/messages/", {
          application_id: Number(applicationId),
          content: `【自動通知：お見送りのご連絡】\n\n${reason}`,
        });
      }

      // 4. ステータス更新
      const result = await api.patch(`/api/applications/${applicationId}/status/`, {
        status: newStatus,
      });

      // 5. 最新データで画面を更新
      await fetchData();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      
      // バリデーションエラーの場合、具体的なメッセージを表示
      const errorData = err.response?.data;
      if (errorData?.status) {
        const msg = Array.isArray(errorData.status) ? errorData.status[0] : errorData.status;
        const allowed = errorData.allowed_transitions;
        const allowedDisplay = allowed?.map((s: string) => getStatusLabel(s)).join('、');
        alert(`${msg}${allowedDisplay ? `\n\n変更可能なステータス: ${allowedDisplay}` : ''}`);
      } else {
        alert("更新に失敗しました。ページを再読み込みしてお試しください。");
      }
      
      // エラー時も最新状態を反映
      await fetchData();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "未対応",
      reviewing: "チャット中",
      trial: "トライアル中",
      accepted: "譲渡成立",
      rejected: "お断り",
      cancelled: "キャンセル済み",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'reviewing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'trial': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">申請情報が見つかりませんでした。</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 pt-16 flex flex-col overflow-hidden">
        {/* Top Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-10">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/shelter/applications')} 
                className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 flex-shrink-0">
                  {application.cat_detail.primary_image ? (
                    <Image 
                      src={application.cat_detail.primary_image} 
                      alt={application.cat_detail.name} 
                      width={48}
                      height={48}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🐱</div>
                  )}
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 flex items-center gap-2">
                    {application.cat_detail.name}
                    <Link href={`/cats/${application.cat}`} target="_blank" className="text-gray-400 hover:text-blue-500 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </h1>
                  <p className="text-xs text-gray-500">
                    {application.applicant_info.username} さんからの申請
                  </p>
                </div>
              </div>

              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStatusColor(application.status)}`}>
                <Clock className="w-3.5 h-3.5" />
                {getStatusLabel(application.status)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {application.status === 'pending' && currentUser?.shelter_role !== 'staff' && (
                <button
                  onClick={() => handleUpdateStatus('reviewing')}
                  disabled={isUpdatingStatus}
                  className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-sm text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  {isUpdatingStatus ? '処理中...' : '対応を開始（チャットを有効化）'}
                </button>
              )}
              {application.status === 'reviewing' && currentUser?.shelter_role !== 'staff' && (
                <button
                  onClick={() => handleUpdateStatus('trial')}
                  disabled={isUpdatingStatus}
                  className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {isUpdatingStatus ? '処理中...' : 'トライアル開始'}
                </button>
              )}
              {application.status === 'trial' && currentUser?.shelter_role !== 'staff' && (
                <button
                  onClick={() => handleUpdateStatus('accepted')}
                  disabled={isUpdatingStatus}
                  className="whitespace-nowrap flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isUpdatingStatus ? '処理中...' : '譲渡を確定（完了）'}
                </button>
              )}
              {(['pending', 'reviewing', 'trial'].includes(application.status)) && currentUser?.shelter_role !== 'staff' && (
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={isUpdatingStatus}
                  className="whitespace-nowrap flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  見送り
                </button>
              )}
              {/* 履歴の非表示アクション */}
              {['accepted', 'rejected', 'cancelled'].includes(application.status) && (
                <button
                  onClick={async () => {
                    if (confirm("この履歴を一覧から非表示にしますか？")) {
                      try {
                        await api.post(`/api/applications/${applicationId}/archive/`);
                        router.push('/shelter/applications');
                      } catch (err) {
                        alert("履歴の非表示に失敗しました。");
                      }
                    }
                  }}
                  className="whitespace-nowrap flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  履歴を削除（非表示）
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden bg-white border-b border-gray-200 flex">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            チャット
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            ユーザー情報
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Applicant Info */}
          <div className={`${activeTab === 'profile' ? 'flex' : 'hidden md:flex'} w-full md:w-[350px] lg:w-[450px] flex-col bg-white border-r border-gray-200 overflow-y-auto no-scrollbar`}>
            <div className="p-6 space-y-8">
              {/* Basic Profile */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> 基本情報
                </h3>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl border-4 border-white shadow-sm overflow-hidden relative">
                    {application.applicant_info.profile_image ? (
                        <Image 
                          src={application.applicant_info.profile_image} 
                          alt={application.applicant_info.username}
                          fill
                          className="object-cover" 
                        />
                    ) : application.applicant_info.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{application.applicant_info.username}</h2>
                    <p className="text-sm text-gray-500">応募者ID: #{application.applicant_info.id}</p>
                    <div className="flex gap-2 mt-2">
                       <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{application.applicant_info.applicant_profile?.age || '?'}歳</span>
                       <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                         {application.applicant_info.applicant_profile?.gender === 'male' ? '男性' : 
                          application.applicant_info.applicant_profile?.gender === 'female' ? '女性' : 'その他'}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{application.applicant_info.address || application.applicant_info.applicant_profile?.residence_area || "未登録"}</span>
                  </div>
                </div>
              </section>

              {/* Living Situation */}
              <section className="bg-blue-50/50 rounded-2xl p-5 border border-blue-50">
                <h3 className="text-sm font-bold text-blue-600/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" /> 生活環境・条件
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="家族構成" value={application.applicant_info.applicant_profile?.marital_status === 'married' ? '既婚者' : application.applicant_info.applicant_profile?.marital_status === 'single' ? '単身者' : '選択なし'} />
                  <InfoItem label="収入状況" value={application.applicant_info.applicant_profile?.income_status === 'stable' ? '安定' : application.applicant_info.applicant_profile?.income_status === 'unstable' ? '不安定' : '選択なし'} />
                  <InfoItem label="ペット飼育経験" value={
                    application.applicant_info.applicant_profile?.cat_experience === 'none' ? 'なし' : 
                    application.applicant_info.applicant_profile?.cat_experience === 'one' ? 'あり' : 
                    application.applicant_info.applicant_profile?.cat_experience === 'multiple' ? '複数経験あり' : '不明'
                  } />
                  <InfoItem label="住居のペット確認" value={application.applicant_info.applicant_profile?.pet_policy_confirmed ? '済み' : '未確認'} />
                  <InfoItem label="留守時間" value={
                    application.applicant_info.applicant_profile?.absence_time === 'less_than_4' ? '4h未満' : 
                    application.applicant_info.applicant_profile?.absence_time === '4_to_8' ? '4-8h' : 
                    application.applicant_info.applicant_profile?.absence_time === '8_to_12' ? '8-12h' : 
                    application.applicant_info.applicant_profile?.absence_time === 'more_than_12' ? '12h以上' : '不明'
                  } />
                  <InfoItem label="在宅頻度" value={
                    application.applicant_info.applicant_profile?.home_frequency === 'high' ? '高い' : 
                    application.applicant_info.applicant_profile?.home_frequency === 'medium' ? '普通' : 
                    application.applicant_info.applicant_profile?.home_frequency === 'low' ? '低い' : '不明'
                  } />
                </div>
              </section>

              {/* Application Details */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">応募時のメッセージ</h3>
                <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {application.message || "メッセージなし"}
                </div>
              </section>

              {/* Agreements */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">確認・同意事項</h3>
                <div className="space-y-2">
                  <AgreementItem label="終生飼養の約束" checked={application.lifelong_care_agreement} />
                  <AgreementItem label="不妊去勢への同意" checked={application.spay_neuter_agreement} />
                  <AgreementItem label="医療費負担の理解" checked={application.medical_cost_understanding} />
                  <AgreementItem label="家族全員の同意" checked={application.family_consent} />
                  <AgreementItem label="アレルギー対策済み" checked={application.allergy_status} />
                  <AgreementItem label="完全室内飼い" checked={application.applicant_info.applicant_profile?.indoors_agreement} />
                </div>
              </section>
              
              <div className="h-10" />
            </div>
          </div>

          {/* Right Panel: Chat */}
          <div className={`${activeTab === 'chat' ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-100 overflow-hidden relative`}>
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              <div className="flex justify-center mb-6">
                 <div className="bg-black/5 text-[11px] text-gray-500 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    {new Date(application.applied_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 応募情報を受け取りました
                 </div>
              </div>

              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                   <MessageCircle className="w-12 h-12 mb-2" />
                   <p className="text-sm">チャットを開始して、里親候補者とやり取りしましょう</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isShelter = msg.sender_type === 'shelter';
                  const isAdopter = msg.sender_type === 'user';
                  
                  // 自分（シェルター）は右側、応募者は左側
                  const isRight = isShelter;
                  
                  const showAvatar = index === 0 || messages[index-1].sender_type !== msg.sender_type;

                  return (
                    <div key={msg.id} className={`flex ${isRight ? 'justify-end' : 'justify-start'} w-full`}>
                       <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isRight ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                          {!isRight && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs overflow-hidden border border-white relative">
                               {application.applicant_info.profile_image ? (
                                   <Image 
                                     src={application.applicant_info.profile_image} 
                                     alt={application.applicant_info.username}
                                     fill
                                     className="object-cover" 
                                   />
                               ) : "👤"}
                            </div>
                          )}
                          
                          <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                             {showAvatar && (
                               <span className="text-[10px] text-gray-400 mb-1 px-1">
                                  {isShelter ? "保護団体（自店舗）" : application.applicant_info.username}
                               </span>
                             )}
                             <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                               isRight 
                                 ? 'bg-blue-600 text-white rounded-br-none' 
                                 : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                             }`}>
                               {msg.content}
                             </div>
                             <span className="text-[9px] text-gray-400 mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                {isRight && msg.is_read && <span className="ml-2">既読</span>}
                             </span>
                          </div>
                       </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Chat Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              {application.status === 'pending' ? (
                 <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-100">
                    <p className="text-sm text-orange-800 font-bold mb-3">
                      {currentUser?.shelter_role === 'staff' 
                        ? '対応待機中です（管理者が対応を開始するとチャットが可能になります）' 
                        : 'まずは「対応を開始」してチャットを有効にしましょう'}
                    </p>
                    {currentUser?.shelter_role !== 'staff' && (
                      <button
                        onClick={() => handleUpdateStatus('reviewing')}
                        className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm font-bold shadow-md hover:bg-orange-600 transition-all"
                      >
                        対応を開始して会話をはじめる
                      </button>
                    )}
                 </div>
              ) : (
                <div className="space-y-4">
                  {/* ステータス変更クイックアクション */}
                  {['reviewing', 'trial'].includes(application.status) && (
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {application.status === 'reviewing' && currentUser?.shelter_role !== 'staff' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('trial')}
                          disabled={isUpdatingStatus}
                          className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full hover:bg-purple-200 transition-all text-xs font-bold shadow-sm active:scale-95"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          トライアルに移行
                        </button>
                      )}
                      {application.status === 'trial' && currentUser?.shelter_role !== 'staff' && (
                        <button
                          onClick={() => handleUpdateStatus('accepted')}
                          disabled={isUpdatingStatus}
                          className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-all text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          譲渡を確定させる
                        </button>
                      )}
                      {currentUser?.shelter_role !== 'staff' && (
                        <button
                          onClick={() => handleUpdateStatus('rejected')}
                          disabled={isUpdatingStatus}
                          className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full hover:bg-red-100 transition-all text-xs font-bold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          お断り（お見送り）
                        </button>
                      )}
                      <div className="h-4 w-px bg-gray-200 mx-1" />
                      {currentUser?.shelter_role !== 'staff' && (
                        <button
                          type="button"
                          onClick={fillTemplate}
                          className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full hover:bg-blue-100 transition-all text-xs font-bold shadow-sm active:scale-95"
                        >
                          <FileText className="w-4 h-4" />
                          日程案内(定型文)
                        </button>
                      )}
                    </div>
                  )}

                  {currentUser?.shelter_role === 'staff' ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">チャットは閲覧のみ可能です（送信権限がありません）</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-gray-100 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <textarea
                        id="chat-textarea"
                        rows={1}
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="メッセージを入力..."
                        className="flex-1 bg-transparent border-none rounded-xl py-2.5 focus:outline-none text-sm resize-none max-h-64 min-h-[44px]"
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl w-10 h-10 flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-bold tracking-tighter mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  );
}

function AgreementItem({ label, checked, value }: { label: string, checked?: boolean, value?: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-xs">
      <span className="text-gray-600">{label}</span>
      {value ? (
        <span className="font-bold text-gray-800">{value}</span>
      ) : checked ? (
        <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> 同意済み</span>
      ) : (
        <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" /> 未確認</span>
      )}
    </div>
  );
}
