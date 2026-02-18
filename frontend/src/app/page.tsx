"use client";

import { useState } from "react";
import useSWR from "swr";
import { catsService } from "@/services/cats";
import { CatFilters, CatList } from "@/types";
import Header from "@/components/common/Header";
import SearchHero from "@/components/sections/SearchHero";
import CatFilter from "@/components/cats/CatFilter";
import CatCard from "@/components/cats/CatCard";
import Footer from "@/components/common/Footer";
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

export default function Home() {
  const [filters, setFilters] = useState<CatFilters>({});
  const [page, setPage] = useState(1);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Use SWR for data fetching with filters
  const { data, error, isLoading } = useSWR(
    ['/api/cats', { ...filters, page }],
    ([_, f]) => catsService.getCats(f)
  );

  const cats = data?.results || [];
  const totalCount = data?.count || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />
      
      <main className="pt-16">
        <SearchHero />
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Filter Panel */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <CatFilter 
                filters={filters} 
                onFilterChange={(newFilters) => {
                  setFilters(newFilters);
                  setPage(1);
                }} 
                onReset={() => {
                  setFilters({});
                  setPage(1);
                }}
              />
            </aside>

            {/* Right Column: Search Results */}
            <div className="flex-1">
              <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-2">
                <h2 className="text-lg font-medium text-gray-700">
                  {isLoading ? (
                    <span className="animate-pulse bg-gray-200 text-transparent rounded">Loading...</span>
                  ) : (
                    `${totalCount}件の保護猫が見つかりました`
                  )}
                </h2>
              </div>

              {isLoading ? (
                // Loading Skeleton
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm h-96 animate-pulse p-4">
                      <div className="bg-gray-200 h-48 rounded-xl mb-4 w-full" />
                      <div className="bg-gray-200 h-6 w-3/4 rounded mb-2" />
                      <div className="bg-gray-200 h-4 w-1/2 rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-center">
                  データの取得に失敗しました。しばらく経ってから再度お試しください。
                </div>
              ) : cats.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cats.map((cat) => (
                    <CatCard key={cat.id} cat={cat} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-lg">
                    条件に一致する保護猫は見つかりませんでした。
                  </p>
                  <button 
                    onClick={() => {
                      setFilters({});
                      setPage(1);
                    }} 
                    className="mt-4 text-pink-500 font-medium hover:underline"
                  >
                    条件をクリアする
                  </button>
                </div>
              )}

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className={`p-2 rounded-xl transition-all ${
                      page === 1 
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                        : 'bg-white border border-gray-100 text-gray-600 hover:border-pink-200 hover:text-pink-500 hover:shadow-md'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {[...Array(Math.ceil(totalCount / 20))].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first, last, current, and surrounding pages
                    if (
                      pageNum === 1 ||
                      pageNum === Math.ceil(totalCount / 20) ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-pink-500 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === page - 2 ||
                      pageNum === page + 2
                    ) {
                      return <span key={pageNum} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(totalCount / 20)}
                    className={`p-2 rounded-xl transition-all ${
                      page >= Math.ceil(totalCount / 20)
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                        : 'bg-white border border-gray-100 text-gray-600 hover:border-pink-200 hover:text-pink-500 hover:shadow-md'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating Help Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-white text-pink-500 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all border border-pink-100 z-50 group">
        <HelpCircle className="w-6 h-6 mb-0.5 group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Help</span>
      </button>
    </div>
  );
}
