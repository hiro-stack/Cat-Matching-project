import { CatFilters } from "@/types";
import { Search, X } from "lucide-react";
import { FC, ChangeEvent } from "react";

interface CatFilterProps {
  filters: CatFilters;
  onFilterChange: (filters: CatFilters) => void;
  onReset?: () => void;
}

const CatFilter: FC<CatFilterProps> = ({ filters, onFilterChange, onReset }) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };

  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      gender: value ? (value as CatFilters["gender"]) : undefined,
    });
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      status: value ? (value as CatFilters["status"]) : undefined,
    });
  };

  const handleAgeCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      age_category: value ? (value as CatFilters["age_category"]) : undefined,
    });
  };

  const handleActivityLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      activity_level: value ? (value as CatFilters["activity_level"]) : undefined,
    });
  };


  const handleAffectionLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      affection_level: value ? parseInt(value, 10) : undefined,
    });
  };

  const handlePrefectureChange = (pref: string) => {
    const currentPrefs = Array.isArray(filters.prefecture) 
      ? filters.prefecture 
      : (typeof filters.prefecture === 'string' && filters.prefecture)
        ? [filters.prefecture] 
        : [];
    
    let newPrefs: string[];
    if (currentPrefs.includes(pref)) {
      newPrefs = currentPrefs.filter(p => p !== pref);
    } else {
      newPrefs = [...currentPrefs, pref];
    }
    
    onFilterChange({
      ...filters,
      prefecture: newPrefs.length > 0 ? newPrefs : undefined,
    });
  };

  const handleMaintenanceLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      maintenance_level: value ? (value as CatFilters["maintenance_level"]) : undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.gender ||
    filters.status ||
    filters.age_category ||
    (Array.isArray(filters.prefecture) ? filters.prefecture.length > 0 : filters.prefecture) ||
    filters.activity_level ||
    filters.affection_level ||
    filters.maintenance_level;

  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border-2 border-[#f4a5b9]/20 sticky top-24 flex flex-col max-h-[calc(100vh-120px)]">
      {/* Header - Fixed */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-50">
        <h2 className="text-lg font-semibold text-[#5a5a6b]">絞り込み</h2>
        {hasActiveFilters && onReset && (
          <button
            onClick={onReset}
            className="flex items-center text-sm font-medium text-[#f4a5b9] hover:text-[#f28ea6] hover:bg-pink-50 px-2 py-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4 mr-1" />
            クリア
          </button>
        )}
      </div>

      {/* Content - Scrollable if needed */}
      <div className="p-6 pt-2 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-100 scrollbar-track-transparent">
        {/* Keyword Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            キーワード検索
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9b9baa]" />
            <input
              id="search"
              type="text"
              placeholder="名前、品種で検索..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Prefecture */}
        <div>
          <label className="block text-sm font-medium text-[#5a5a6b] mb-3">
            エリア（都道府県）
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-100 scrollbar-track-transparent border border-gray-100 rounded-lg p-3 bg-gray-50/30">
            {prefectures.map((pref) => {
              const isSelected = Array.isArray(filters.prefecture) 
                ? filters.prefecture.includes(pref)
                : filters.prefecture === pref;
              return (
                <label key={pref} className="flex items-center group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePrefectureChange(pref)}
                      className="peer h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-300 transition-all cursor-pointer opacity-0 absolute"
                    />
                    <div className={`h-4 w-4 rounded border ${isSelected ? 'bg-pink-500 border-pink-500' : 'bg-white border-gray-300'} peer-focus:ring-2 peer-focus:ring-pink-300 transition-all flex items-center justify-center`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white fill-current" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-3 text-sm transition-colors ${isSelected ? 'text-pink-600 font-bold' : 'text-gray-600 group-hover:text-pink-400'}`}>
                    {pref}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Age Category */}
        <div>
          <label htmlFor="age_category" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            年齢区分
          </label>
          <select
            id="age_category"
            value={filters.age_category || ""}
            onChange={handleAgeCategoryChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="kitten">子猫</option>
            <option value="adult">成猫</option>
            <option value="senior">シニア猫</option>
            <option value="unknown">不明</option>
          </select>
        </div>

        {/* Personality: Activity Level */}
        <div>
          <label htmlFor="activity_level" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            活動量
          </label>
          <select
            id="activity_level"
            value={filters.activity_level || ""}
            onChange={handleActivityLevelChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="active">活発</option>
            <option value="normal">普通</option>
            <option value="calm">おっとり</option>
            <option value="unknown">不明</option>
          </select>
        </div>

        {/* Personality: Affection Level */}
        <div>
          <label htmlFor="affection_level" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            甘えん坊度
          </label>
          <select
            id="affection_level"
            value={filters.affection_level || ""}
            onChange={handleAffectionLevelChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="5">5: とろとろ甘えん坊</option>
            <option value="4">4: 甘えん坊</option>
            <option value="3">3: ツンデレ</option>
            <option value="2">2: クール</option>
            <option value="1">1: 怖がり</option>
          </select>
        </div>

        {/* Personality: Maintenance Level */}
        <div>
          <label htmlFor="maintenance_level" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            お手入れ
          </label>
          <select
            id="maintenance_level"
            value={filters.maintenance_level || ""}
            onChange={handleMaintenanceLevelChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="easy">初心者でも安心 (楽々)</option>
            <option value="normal">少しコツが必要 (普通)</option>
            <option value="hard">経験者向き (練習中)</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            性別
          </label>
          <select
            id="gender"
            value={filters.gender || ""}
            onChange={handleGenderChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="male">オス</option>
            <option value="female">メス</option>
            <option value="unknown">不明</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[#5a5a6b] mb-2">
            募集状況
          </label>
          <select
            id="status"
            value={filters.status || ""}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm bg-white"
          >
            <option value="">すべて</option>
            <option value="open">募集中</option>
            <option value="trial">トライアル中</option>
            <option value="adopted">譲渡済み</option>
            <option value="in_review">審査中</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CatFilter;
