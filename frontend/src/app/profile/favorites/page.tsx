"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { Heart, ArrowLeft, X } from "lucide-react";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import CatCard from "@/components/cats/CatCard";
import { CatList } from "@/types";

interface Favorite {
  id: number;
  cat: number;
  cat_detail: CatList;
  created_at: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const res = await api.get("/api/favorites/");
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setFavorites(data);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      router.push("/login?redirect=/profile/favorites");
      return;
    }

    fetchFavorites();
  }, [router]);

  const handleRemoveFavorite = async (favoriteId: number) => {
    if (!confirm("お気に入りから削除しますか？")) {
      return;
    }

    try {
      await api.delete(`/api/favorites/${favoriteId}/`);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      alert("お気に入りの削除に失敗しました。");
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

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            猫一覧へ戻る
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500 fill-current" />
            お気に入りの猫ちゃん
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            合計 <span className="font-bold text-gray-900">{favorites.length}</span> 匹
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-pink-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">お気に入りがありません</h2>
            <p className="text-gray-500 mb-8">
              気になる猫ちゃんを見つけて、ハートボタンでお気に入り登録してみましょう。
            </p>
            <Link
              href="/cats"
              className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg shadow-pink-200"
            >
              猫ちゃんを探しに行く
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="relative">
                <CatCard
                  cat={favorite.cat_detail}
                  onFavoriteChange={fetchFavorites}
                  showFavoriteButton={false}
                />
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                  title="お気に入りから削除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
