"use client";

import { useSearchParams } from 'next/navigation';
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { CheckCircle, ShieldAlert } from "lucide-react";
import Link from 'next/link';
import { Suspense } from 'react';

function ApplicationCompleteContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-20 px-4">
         <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-pink-100">
             
             <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
             </div>

             <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                 里親申請を受け付けました！
             </h1>
             
             <p className="text-gray-500 mb-8">
                 この度は保護猫への申請ありがとうございます。<br className="hidden sm:block"/>
                 今後のステップについてご確認ください。
             </p>

             <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 text-left mb-8 transform transition-all hover:shadow-md">
                 <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6" />
                    今後のやり取りと注意事項
                 </h2>
                 <ul className="space-y-4 text-gray-700 text-sm md:text-base leading-relaxed">
                     <li className="flex gap-3 items-start">
                         <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">1</span>
                         <span>今後のやり取りについては<span className="font-bold text-blue-700">保護団体とチャット</span>にて行っていただきます。</span>
                     </li>
                     <li className="flex gap-3 items-start">
                         <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">2</span>
                         <span>応募内容の確認、追加の質問、面談や譲渡条件のすり合わせなどは、団体からの返信をお待ちください。</span>
                     </li>
                     <li className="flex gap-3 items-start">
                         <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">3</span>
                         <span>返信にはお時間をいただく場合があります。あらかじめご了承ください。</span>
                     </li>
                     <li className="flex gap-3 items-start">
                         <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold text-xs mt-0.5">!</span>
                         <span className="font-bold text-red-600">個人情報（住所・電話番号など）は、団体から依頼があるまでチャット上で送信しないようお願いいたします。</span>
                     </li>
                 </ul>
             </div>

             <div className="flex justify-center">
                 <Link 
                    href={applicationId ? `/messages/${applicationId}` : '/'}
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200 w-full sm:w-auto min-w-[280px]"
                 >
                    確認してチャットへ進む
                 </Link>
             </div>
             
             {!applicationId && (
                 <p className="text-xs text-red-400 mt-4">
                     ※申請IDが見つかりません。履歴からご確認ください。
                 </p>
             )}

         </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ApplicationCompletePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationCompleteContent />
    </Suspense>
  );
}
