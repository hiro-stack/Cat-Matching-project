"use client";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. 取得する情報",
      content: [
        {
          subtitle: "(1) アカウント・登録情報",
          items: ["メールアドレス", "パスワード（※平文では保存せず、ハッシュ化等の方法で管理します）", "表示名、自己紹介等のプロフィール情報（登録する場合）"]
        },
        {
          subtitle: "(2) 投稿・送信情報",
          items: ["猫情報（説明文、画像、動画、募集条件など）", "申請・問い合わせ・メッセージなどの送信内容", "その他、利用者が本サービス上で入力・送信する情報"]
        },
        {
          subtitle: "(3) 端末・ログ情報（自動的に取得される場合があります）",
          items: ["IPアドレス、ブラウザ種類、OS、端末識別子（取得できる範囲）", "アクセス日時、閲覧ページ、操作履歴", "Cookie、ローカルストレージ等の識別子", "エラーログ、クラッシュログ等"]
        },
        {
          subtitle: "(4) お問い合わせ情報",
          items: ["問い合わせ内容", "連絡先（メールアドレス等）", "本人確認に必要な情報（退会・削除依頼時など）"]
        }
      ],
      footer: "※本サービスでは、住所・電話番号等の個人情報は原則として必須取得しません。将来、機能追加等により取得する場合は、本ポリシーを改定し周知します。"
    },
    {
      title: "2. 利用目的",
      items: [
        "本サービスの提供、本人確認、認証、アカウント管理のため",
        "申請・メッセージ等の機能提供および当事者間連絡のため",
        "問い合わせ対応、重要なお知らせ等の連絡のため",
        "不正利用の検知、防止、セキュリティ確保のため",
        "利用状況の分析、品質向上、機能改善、新機能開発のため",
        "規約違反行為への対応、トラブル対応、権利侵害への対応のため",
        "法令に基づく対応のため"
      ]
    },
    {
      title: "3. 第三者提供",
      content: "運営者は、次の場合を除き、本人の同意なく個人情報を第三者に提供しません。",
      items: [
        "法令に基づく場合",
        "人の生命・身体・財産の保護のために必要で、本人同意が困難な場合",
        "公衆衛生の向上または児童の健全育成推進のために特に必要な場合",
        "国の機関等への協力が必要で、本人同意により支障が生じる場合"
      ]
    },
    {
      title: "4. 外部委託（業務委託先）",
      content: "運営者は、サービス提供に必要な範囲で、個人情報を含むデータの取り扱いを外部事業者に委託する場合があります（例：サーバー運用、データ保存、メール配信、エラー監視、アクセス解析等）。委託にあたっては、適切な委託先を選定し、必要かつ適切な監督を行います。"
    },
    {
      title: "5. 外部サービス・解析ツールの利用",
      content: "本サービスでは、利便性向上や不正対策、品質改善のために、外部サービス（ホスティング、ストレージ、ログ監視、アクセス解析等）を利用する場合があります。これらのサービスにより、Cookie等を用いた識別子やログ情報が収集される場合があります。"
    },
    {
      title: "6. Cookie等の利用",
      items: [
        "本サービスは、ログイン状態の維持、利便性向上、不正対策、分析等のためにCookieやローカルストレージ等を利用する場合があります。",
        "利用者は、ブラウザ設定によりCookie等を無効にできますが、その場合本サービスの一部機能が利用できないことがあります。"
      ]
    },
    {
      title: "7. 個人情報の安全管理",
      content: "運営者は、個人情報への不正アクセス、漏えい、滅失、改ざん等を防止するため、合理的な安全管理措置を講じます（例：アクセス制御、暗号化、認証、ログ監視、脆弱性対応等）。"
    },
    {
      title: "8. 保存期間",
      content: "運営者は、利用目的の達成に必要な範囲で、利用者情報を保存します。退会後または削除依頼後であっても、不正対策、紛養対応、法令対応のために必要な期間、一定の情報（ログ等）を保持する場合があります。"
    },
    {
      title: "9. 開示・訂正・削除等の請求",
      content: "利用者は、運営者が保有する自己の情報について、開示、訂正、追加、削除、利用停止等を求めることができます。希望する場合は、お問い合わせフォームよりご連絡ください。本人確認を行ったうえで、合理的な期間内に対応します。ただし、法令により対応できない場合や、運営上著しい支障がある場合は、この限りではありません。"
    },
    {
      title: "10. 未成年の利用",
      content: "未成年の利用者は、必要に応じて保護者の同意を得たうえで本サービスを利用してください。"
    },
    {
      title: "11. ポリシーの改定",
      content: "運営者は、必要に応じて本ポリシーを改定することがあります。重要な変更がある場合は、本サービス上で告知するなど、適切な方法で周知します。"
    },
    {
      title: "12. お問い合わせ窓口",
      content: "本ポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#fdf2f8] to-[#f5f3ff] text-gray-900 font-sans">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-[3rem] shadow-2xl shadow-pink-200/30 overflow-hidden border border-white">
              {/* Privacy Header */}
              <div className="bg-gradient-to-br from-pink-600 to-rose-500 p-12 text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <ShieldCheck size={240} />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-md mb-6 border border-white/30">
                    <Lock className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Data Privacy</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">プライバシーポリシー</h1>
                  <div className="flex flex-wrap gap-6 text-pink-50 text-sm font-medium">
                    <p>制定日：2026年2月18日</p>
                    <p>運営者：お迎えマッチ運営事務局</p>
                  </div>
                </div>
              </div>

              {/* Privacy Content */}
              <div className="p-8 md:p-16">
                <div className="flex items-start gap-4 p-6 bg-pink-50 rounded-3xl border border-pink-100 mb-12">
                  <Eye className="w-6 h-6 text-pink-500 shrink-0 mt-1" />
                  <p className="text-gray-700 leading-relaxed">
                    お迎えマッチ運営事務局（以下「運営者」）は、運営者が提供する「保護猫 お迎えマッチ」（以下「本サービス」）において取得する利用者情報を、以下のとおり取り扱います。
                  </p>
                </div>

                <div className="space-y-16">
                  {sections.map((section, idx) => (
                    <section key={idx} className="group">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                          {section.title}
                        </h2>
                      </div>

                      <div className="pl-14 space-y-6">
                        {typeof section.content === 'string' && (
                          <p className="text-gray-600 leading-relaxed">{section.content}</p>
                        )}
                        
                        {Array.isArray(section.content) && section.content.map((sub, sIdx) => (
                          <div key={sIdx} className="space-y-3">
                            <h3 className="text-lg font-bold text-gray-700">{sub.subtitle}</h3>
                            <ul className="grid grid-cols-1 gap-2">
                              {sub.items.map((item, iIdx) => (
                                <li key={iIdx} className="flex items-start gap-3 text-gray-600">
                                  <span className="w-1.5 h-1.5 bg-pink-300 rounded-full mt-2.5 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {section.items && (
                          <ul className="grid grid-cols-1 gap-3">
                            {section.items.map((item, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-gray-600">
                                <span className="text-pink-400 font-bold">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        {section.footer && (
                          <p className="text-sm font-medium text-pink-600 bg-pink-50 p-4 rounded-xl border border-pink-100">
                            {section.footer}
                          </p>
                        )}
                      </div>
                    </section>
                  ))}
                </div>

                {/* Direct Action */}
                <div className="mt-24 p-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.15),transparent)]" />
                  <h3 className="text-2xl font-bold text-white mb-4 relative z-10">プライバシーに関するお問い合わせ</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto relative z-10">
                    ご不明な点やデータの開示請求等ございましたら、お問い合わせフォームよりお気軽にご連絡ください。
                  </p>
                  <a 
                    href="/contact"
                    className="inline-flex items-center justify-center px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10"
                  >
                    お問い合わせはこちら
                  </a>
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
