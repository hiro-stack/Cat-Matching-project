"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { ArrowLeft, Send, User as UserIcon, Home, Clock, MessageSquare, AlertCircle } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

import { User } from "@/types";

interface Message {
  id: number;
  application: number;
  sender: number;
  sender_type: 'user' | 'shelter' | 'admin';
  sender_info: {
    username: string;
    [key: string]: any;
  };
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Application {
  id: number;
  cat: number;
  cat_detail: {
    name: string;
    shelter_name: string;
    [key: string]: any;
  }; 
  status: string;
  applied_at: string;
}

export default function MessagePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // スクロール最下部へ
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchApplication = async () => {
    try {
      // 申請詳細を取得（相手の名前などを知るため）
      // TODO: アプリケーション詳細APIが必要だが、ここでは一覧からフィルタするか、専用エンドポイントを使う
      // とりあえずメッセージ取得を優先
      const res = await api.get(`/api/applications/${applicationId}/`);
      setApplication(res.data);
    } catch (err) {
      console.error("Failed to fetch application:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/accounts/profile/');
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/messages/?application=${applicationId}`);
      // バックエンドのページネーション設定に関わらず、配列を取り出す
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      
      // バックエンド側で sort されているはずだが、念のためフロントでも確認（またはそのままセット）
      const sortedMessages = [...data].sort((a: Message, b: Message) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);

      // 既読にする (未読がある場合のみ、または常に呼び出す)
      if (data.some((m: Message) => !m.is_read && m.sender_type !== 'user')) {
        api.post('/api/messages/mark_as_read/', { application_id: Number(applicationId) })
           .catch(err => console.error("Failed to mark as read:", err));
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const init = async () => {
      await Promise.all([
        fetchApplication(),
        fetchMessages(),
        fetchUser()
      ]);
      setIsLoading(false);
      scrollToBottom();
    };

    init();

    // ポーリング開始 (5秒ごと)
    pollingInterval.current = setInterval(fetchMessages, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [applicationId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await api.post("/api/messages/", {
        application_id: Number(applicationId),
        content: newMessage,
      });
      setNewMessage("");
      await fetchMessages(); // 即時更新
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("メッセージの送信に失敗しました。");
    } finally {
      setIsSending(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-0 max-w-4xl w-full mx-auto px-0 md:px-4 flex flex-col h-[calc(100vh-64px)]">
        {/* チャットヘッダー */}
        <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 transition-colors">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="bg-pink-100 p-2 rounded-full hidden sm:block">
               <Home className="w-5 h-5 text-pink-500" />
             </div>
             <div>
               <h1 className="font-bold text-gray-800 leading-tight">
                 {application?.cat_detail?.shelter_name || "保護団体"}
               </h1>
               <p className="text-xs text-gray-500">
                 {application?.cat_detail?.name ? `${application.cat_detail.name}への里親申請チャット` : "里親申請チャット"}
               </p>
             </div>
          </div>
          <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${
            application?.status === 'accepted' ? 'bg-green-100 text-green-700' :
            application?.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {application?.status === 'pending' ? '応募直後' :
             application?.status === 'reviewing' ? '審査中' :
             application?.status === 'accepted' ? '承認済み' :
             application?.status === 'rejected' ? 'お見送り' :
             application?.status === 'cancelled' ? 'キャンセル' : application?.status || "確認中"}
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 bg-[#f0f2f5] overflow-y-auto p-4 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="bg-black/5 backdrop-blur-sm text-[11px] text-gray-500 px-4 py-1 rounded-full">
              {new Date(application?.applied_at || Date.now()).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })} にチャットを開始しました
            </div>
          </div>

          {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 opacity-80">
               <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                 <MessageSquare className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-sm font-black uppercase tracking-widest">Start a conversation</p>
             </div>
          ) : (
            messages.map((msg, index) => {
              // メッセージの送信者が自分かどうか（IDでの判定）
              const isMyId = currentUser ? msg.sender === currentUser.id : false;
              
              // 画面上の「右側」に表示すべきかどうかを判定
              // 基本は自分のメッセージを右、相手を左にする。
              // ただし、もし自分と相手が同じID（テスト等）の場合、タイプが異なれば別扱いに見せたい等の考慮
              const isRight = isMyId;
              
              const showAvatar = index === 0 || messages[index-1].sender !== msg.sender;
              const showTime = index === messages.length - 1 || 
                               messages[index+1].sender !== msg.sender ||
                               new Date(messages[index+1].created_at).getTime() - new Date(msg.created_at).getTime() > 60000;

              return (
                <div key={msg.id} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                  <div className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isRight && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mb-1">
                        {showAvatar ? (
                          msg.sender_type === 'shelter' ? <Home className="w-4 h-4 text-gray-500" /> : <UserIcon className="w-4 h-4 text-gray-500" />
                        ) : null}
                      </div>
                    )}
                    
                    <div className="flex flex-col max-w-[75%] sm:max-w-[70%]">
                      {showAvatar && !isRight && (
                        <span className="text-[10px] text-gray-500 mb-1 ml-1">
                          {msg.sender_type === 'shelter' ? '保護団体スタッフ' : msg.sender_info.username}
                        </span>
                      )}
                      
                      <div className={`flex items-end gap-1.5 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                          isRight 
                            ? 'bg-[#FF4D8C] text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                        }`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                        
                        {showTime && (
                          <span className="text-[10px] text-gray-400 mb-0.5 whitespace-nowrap">
                            {new Date(msg.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* 入力エリア */}
        <div className="bg-white p-4 border-t border-gray-100">
          {application?.status === 'pending' ? (
            <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100 flex flex-col items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Clock className="w-6 h-6 text-pink-500 animate-pulse" />
              </div>
              <div className="text-center mb-4">
                <p className="text-sm font-bold text-pink-700">ただいま内容を差し支えなく確認中です</p>
                <p className="text-[11px] text-pink-600 mt-1 leading-relaxed">
                  里親申請を受け付けました。団体側が内容を確認し、<br/>
                  お返事を差し上げるとチャットで直接やり取りができるようになります。<br/>
                  今しばらくお待ちください。
                </p>
              </div>

              {/* 営業情報の表示 */}
              {(application.cat_detail as any).shelter && (
                <div className="w-full space-y-3 pt-4 border-t border-pink-100">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">営業日・営業時間・定休日</p>
                      <p className="text-xs text-pink-800 font-medium">{(application.cat_detail as any).shelter.business_hours || "未登録"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                      <Home className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">譲渡対応可能な時間帯</p>
                      <p className="text-xs text-pink-800 font-medium">{(application.cat_detail as any).shelter.transfer_available_hours || "未登録"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-gray-100 rounded-2xl px-3 py-1 focus-within:ring-2 focus-within:ring-pink-200 transition-all">
                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    // 自動リサイズ
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="メッセージを入力..."
                  className="flex-1 bg-transparent border-none rounded-xl px-2 py-3 focus:outline-none text-sm resize-none max-h-32 min-h-[44px]"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-xl w-10 h-10 flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                誹謗中傷や個人情報の取り扱いには十分ご注意ください
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
