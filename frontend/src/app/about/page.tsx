"use client";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Info, CheckCircle2, ArrowRight, AlertTriangle, XCircle, HelpCircle, Heart } from "lucide-react";

export default function AboutPage() {
  const adopterFeatures = [
    "保護猫の情報閲覧（写真、特徴、性格、健康状態の補足、募集条件など）",
    "気になる猫への お問い合わせ／譲渡申請",
    "保護団体との メッセージ（チャット） によるやり取り"
  ];

  const shelterFeatures = [
    "猫情報の登録・更新（写真・動画、紹介文、募集条件、ステータス等）",
    "応募（申請）への対応・管理",
    "団体プロフィールの管理（紹介文、受付条件など）"
  ];

  const flowSteps = [
    { title: "閲覧", desc: "里親希望者が保護猫の情報を閲覧" },
    { title: "申請", desc: "気になる猫にお問い合わせ／申請" },
    { title: "面談", desc: "保護団体が内容を確認し、面談や条件確認を実施" },
    { title: "譲渡", desc: "当事者間で合意した場合に譲渡へ" }
  ];

  const faqs = [
    { q: "誰でも猫を掲載できますか？", a: "現在は主に保護団体（または保護主）向けの機能として提供しています。運用方針は変更される場合があります。" },
    { q: "譲渡費用はかかりますか？", a: "団体によって異なります（医療費負担等）。詳細は各団体へご確認ください。" },
    { q: "利用料はかかりますか？", a: "現時点では無料で提供しています（変更する場合は事前に告知します）。" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#fdf2f8] to-[#f5f3ff] text-gray-900 font-sans">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-[3rem] shadow-2xl shadow-pink-200/30 overflow-hidden border border-white">
              {/* About Header */}
              <div className="bg-gradient-to-br from-pink-500 to-rose-400 p-12 text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <Heart size={240} />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-md mb-6 border border-white/30">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">About Us</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">サービスについて</h1>
                  <p className="text-pink-50 text-lg max-w-2xl leading-relaxed">
                    保護猫と里親希望者の出会いをスムーズにするためのマッチングプラットフォームです。
                  </p>
                </div>
              </div>

              {/* About Content */}
              <div className="p-8 md:p-16">
                {/* Introduction */}
                <div className="mb-16">
                  <p className="text-gray-700 text-lg leading-relaxed mb-8">
                    保護猫の情報を見つけやすくし、里親希望者と保護団体の連絡を支援することで、保護猫が安心できるおうちに繋がる機会を増やすことを目的としています。
                  </p>
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <p className="text-amber-900 text-sm font-medium leading-relaxed">
                      本サービスは譲渡契約の当事者にはなりません。譲渡の可否や条件の最終判断は、保護団体（または保護主）および里親希望者の間で行われます。
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-20">
                  <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-pink-400 rounded-full" />
                    できること（主な機能）
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-pink-500 flex items-center gap-2 px-2">
                        里親希望者向け
                      </h3>
                      <ul className="space-y-3">
                        {adopterFeatures.map((f, i) => (
                          <li key={i} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-blue-500 flex items-center gap-2 px-2">
                        保護団体向け
                      </h3>
                      <ul className="space-y-3">
                        {shelterFeatures.map((f, i) => (
                          <li key={i} className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Flow */}
                <div className="mb-20">
                  <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-blue-400 rounded-full" />
                    想定している利用の流れ
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {flowSteps.map((step, i) => (
                      <div key={i} className="relative group">
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center h-full group-hover:bg-white group-hover:shadow-xl transition-all">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 font-bold mb-4 mx-auto group-hover:text-blue-500 shadow-inner">
                            {i + 1}
                          </div>
                          <h4 className="font-bold text-gray-800 mb-2">{step.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                        </div>
                        {i < flowSteps.length - 1 && (
                          <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-200 z-10" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-gray-400 text-right">※譲渡の進め方や条件は団体ごとに異なります。</p>
                </div>

                {/* Notices */}
                <div className="mb-20 bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white">
                  <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <span className="w-2 h-8 bg-rose-500 rounded-full" />
                    大切なお知らせ（注意事項）
                  </h2>
                  <div className="space-y-8">
                    <div>
                      <h4 className="font-bold text-rose-300 mb-2">譲渡の成立について</h4>
                      <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                        <li>本サービスは 譲渡の成立を保証するものではありません。</li>
                        <li>譲渡の可否は、保護団体の方針・猫の状況・里親希望者の条件等により決まります。</li>
                        <li>応募があっても必ず面談・譲渡に進むわけではありません。</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-300 mb-2">掲載情報の正確性について</h4>
                      <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                        <li>掲載情報（猫の性格、健康状態、経緯など）は、保護団体・投稿者が提供するものです。</li>
                        <li>運営者は、掲載情報の 正確性・完全性・最新性 を保証しません。</li>
                        <li>気になる点（健康状態、ワクチン、既往歴など）は、必ず保護団体へご確認ください。</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-300 mb-2">トラブル防止のために</h4>
                      <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                        <li>本サービス内外でのトラブル（連絡不通、条件の食い違い等）は、当事者間で解決していただく形になります。</li>
                        <li>個人情報（住所・電話番号など）は、不必要に公開しないようお願いします。</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Prohibited */}
                <div className="mb-20">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <XCircle className="w-7 h-7 text-rose-500" />
                    禁止していること（抜粋）
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      "虚偽情報の掲載・なりすまし",
                      "誹謗中傷、嫌がらせ、脅迫、差別的表現",
                      "無断転載（写真・文章の無断利用）",
                      "不正アクセス等の運営妨害",
                      "出会い目的、他目的の勧誘、詐欺的行為"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-900 text-sm">
                        <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                <div className="mb-20">
                  <h2 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
                    <HelpCircle className="w-7 h-7 text-blue-500" />
                    よくある質問（FAQ）
                  </h2>
                  <div className="space-y-4">
                    {faqs.map((faq, i) => (
                      <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                        <div className="font-bold text-gray-800 mb-2 flex items-start gap-2">
                          <span className="text-blue-500">Q.</span>
                          {faq.q}
                        </div>
                        <div className="text-gray-600 text-sm flex items-start gap-2">
                          <span className="text-pink-500 font-bold">A.</span>
                          {faq.a}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Info */}
                <div className="pt-12 border-t border-gray-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">運営者情報</h2>
                  <div className="space-y-2 text-gray-600 text-sm">
                    <p><span className="font-bold w-24 inline-block">運営者：</span>お迎えマッチ運営事務局</p>
                    <p>
                      <span className="font-bold w-24 inline-block">お問い合わせ：</span>
                      <a href="/contact" className="text-pink-500 hover:underline">お問い合わせフォーム</a> よりご連絡ください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
