"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { ArrowLeft, Send, User as UserIcon, Home } from "lucide-react";
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
      const res = await api.get(`/api/applications/applications/${applicationId}/`);
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
      // 古い順に並び替え
      const sortedMessages = res.data.sort((a: Message, b: Message) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setMessages(sortedMessages);
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
      
      <main className="flex-1 pt-20 pb-4 max-w-4xl w-full mx-auto px-4 flex flex-col h-[calc(100vh-80px)]">
        {/* チャットヘッダー */}
        <div className="bg-white p-4 rounded-t-2xl shadow-sm border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/shelter/applications" className="md:hidden p-2 -ml-2 text-gray-400">
               <ArrowLeft className="w-5 h-5" />
             </Link>
             <div className="bg-pink-100 p-2 rounded-full">
               <Home className="w-5 h-5 text-pink-500" />
             </div>
             <div>
               <h1 className="font-bold text-gray-800">
                 {application?.cat_detail?.shelter_name || "保護団体"}
               </h1>
               <p className="text-xs text-gray-500">
                 {application?.cat_detail?.name ? `${application.cat_detail.name}への問い合わせ` : "里親申請チャット"}
               </p>
             </div>
          </div>
          <div className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
            ステータス: {application?.status || "不明"}
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
               <div className="text-4xl">💬</div>
               <p>保護団体とのメッセージを始めましょう</p>
             </div>
          ) : (
            messages.map((msg) => {
              const isMe = currentUser ? msg.sender === currentUser.id : false;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMe 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-pink-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="bg-white p-4 rounded-b-2xl shadow-sm border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-xl px-6 flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
