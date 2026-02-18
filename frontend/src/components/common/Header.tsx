"use client";

import Link from 'next/link';
import { FC, useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';
import { ClipboardList, Bell, Cat, User as UserIcon, LogOut, Settings, Heart, Home, ChevronDown } from 'lucide-react';

const Header: FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/api/applications/");
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const unread = data.reduce((acc: number, app: any) => acc + (app.unread_count || 0), 0);
      setTotalUnread(unread);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/accounts/profile/');
        setUser(response.data);
        // 初回取得
        fetchUnreadCount();
        
        // ポーリング (30秒ごと)
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ドロップダウン外をクリックしたら閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    setUser(null);
    setIsDropdownOpen(false);
    router.push('/');
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'shelter': return '団体スタッフ';
      case 'admin': return '管理者';
      default: return '一般ユーザー';
    }
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'shelter': return 'bg-blue-100 text-blue-600';
      case 'admin': return 'bg-purple-100 text-purple-600';
      default: return 'bg-pink-100 text-pink-600';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100 h-16">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-100 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white">
              <Cat className="w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-800">
              お迎え<span className="text-pink-500">マッチ</span>
            </span>
          </Link>
        </div>

        {/* Center-Right: Navigation */}
        <nav className="hidden md:flex items-center gap-6 ml-auto mr-4">
          <Link 
            href="/" 
            className="text-gray-600 hover:text-pink-500 font-medium transition-colors"
          >
            保護猫を探す
          </Link>
          {user?.user_type === 'shelter' && (
            <Link 
              href="/shelter/dashboard" 
              className="text-gray-600 hover:text-blue-500 font-medium transition-colors"
            >
              団体ダッシュボード
            </Link>
          )}
          {user?.is_superuser && (
            <Link 
              href="/admin/shelters" 
              className="text-purple-600 hover:text-purple-800 font-bold transition-colors"
            >
              👑 運営管理
            </Link>
          )}
        </nav>

        {/* Right: User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse"></div>
          ) : user ? (
            <>
              {/* 申請履歴ボタン (通知付き) - 一般ユーザーのみ表示 */}
              {user.user_type !== 'shelter' && user.user_type !== 'admin' && (
                <Link
                  href="/profile/applications"
                  className="relative p-2 text-gray-500 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-all"
                  title="申請履歴"
                >
                  <ClipboardList className="w-6 h-6" />
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                        !
                      </span>
                    </span>
                  )}
                </Link>
              )}

              {/* Profile Dropdown Container */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all bg-white shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-medium text-sm shadow-inner">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 hidden lg:block max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${getUserTypeBadgeColor(user.user_type)}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold">プロフィール</span>
                      </Link>
                      
                      <Link
                        href="/profile/edit"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">プロフィール編集</span>
                      </Link>

                      {user.user_type !== 'shelter' && user.user_type !== 'admin' && (
                        <>
                          <Link
                            href="/profile/applications"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">申請履歴</span>
                          </Link>

                          <Link
                            href="/profile/favorites"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">
                              <Heart className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium">お気に入り一覧</span>
                          </Link>
                        </>
                      )}

                      {user.user_type === 'shelter' && (
                        <Link
                          href="/shelter/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-blue-600 hover:bg-blue-50 transition-colors group"
                        >
                          <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Home className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold">団体ダッシュボード</span>
                        </Link>
                      )}

                      <div className="mt-1 pt-1 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-all group"
                        >
                          <div className="p-1.5 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold">ログアウト</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="ログアウト"
              >
                <span className="text-sm font-medium">ログアウト</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-pink-500 border border-pink-500 rounded-full hover:bg-pink-50 transition-colors"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-pink-500 border border-pink-500 rounded-full hover:bg-pink-600 shadow-md hover:shadow-lg transition-all"
              >
                新規登録
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
