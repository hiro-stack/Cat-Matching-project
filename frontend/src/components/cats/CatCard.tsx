import { CatList } from "@/types";
// import Image from "next/image"; // Removed in favor of ImageWithFallback
import Link from "next/link";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { FC, useState } from "react";
import { Heart } from "lucide-react";

interface CatCardProps {
  cat: CatList;
}

const STATUS_LABELS: Record<string, string> = {
  open: "募集中",
  in_review: "審査中",
  trial: "トライアル中",
  adopted: "譲渡済み",
  paused: "一時停止",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-[#a8e6cf] text-[#2d5f4f]",
  in_review: "bg-[#e8daef] text-[#5b2c6f]", // Slightly different from matched but keeping theme
  trial: "bg-[#ffd4a3] text-[#8b5e3c]",
  adopted: "bg-[#d4b5d4] text-[#5a4a5a]",
  paused: "bg-gray-200 text-gray-600",
};

const GENDER_LABELS: Record<string, string> = {
  male: "オス",
  female: "メス",
  unknown: "不明",
};

const CatCard: FC<CatCardProps> = ({ cat }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: Call API
    console.log("Favorite clicked:", cat.id);
  };

  return (
    <Link
      href={`/cats/${cat.id}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      aria-label={`${cat.name}の詳細を見る`}
    >
      {/* 画像エリア */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {cat.primary_image ? (
          <ImageWithFallback
            src={cat.primary_image}
            alt={cat.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-6xl">🐾</span>
          </div>
        )}

        {/* ステータスバッジ */}
        <div className="absolute top-2 left-2">
          <span
            className={`${STATUS_COLORS[cat.status] || "bg-gray-200 text-gray-600"} text-xs px-2 py-1 rounded-full`}
          >
            {STATUS_LABELS[cat.status] || cat.status}
          </span>
        </div>

      </div>
      {/* 情報エリア */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{cat.name}</h3>

        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">品種:</span>
            <span>{cat.breed}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">年齢:</span>
            <span>{cat.estimated_age}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">性別:</span>
            <span>{GENDER_LABELS[cat.gender]}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">{cat.shelter_name}</p>
        </div>
      </div>
    </Link>
  );
};

export default CatCard;
