"use client";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { Scale, FileText, Info, AlertCircle } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "第1条（定義）",
      items: [
        "「利用者」とは、本サービスを閲覧または利用するすべての者をいいます。",
        "「登録利用者」とは、本サービス所定の方法でアカウント登録を完了した者をいいます。",
        "「団体ユーザー」とは、保護団体等として本サービスの団体向け機能を利用する登録利用者をいいます。",
        "「投稿等」とは、利用者が本サービス上に投稿・送信・登録する文章、画像、動画、プロフィール情報、メッセージその他一切の情報をいいます。",
        "「譲渡等」とは、保護猫の譲渡、面談、引き渡し、費用負担、契約、その他譲渡に関連する一切の行為をいいます。"
      ]
    },
    {
      title: "第2条（適用）",
      items: [
        "1. 本規約は、本サービスの利用に関する運営者と利用者との間の一切の関係に適用されます。",
        "2. 運営者が本サービス上で掲載するルール、ガイドライン、注意事項等（名称を問いません）は、本規約の一部を構成します。",
        "3. 本規約と前項の内容が矛盾する場合、本規約が優先します（ただし特段の定めがある場合を除く）。"
      ]
    },
    {
      title: "第3条（本サービスの性質）",
      items: [
        "1. 本サービスは、里親希望者と保護団体等の連絡・情報閲覧等を支援するものであり、運営者は譲渡等の当事者になりません。",
        "2. 運営者は、譲渡等の成立、猫の健康状態・性格・適合性、掲載情報の真実性、利用者の本人性・適格性を保証しません。",
        "3. 譲渡等に関する最終判断および責任は、当事者（里親希望者・保護団体等）が負うものとします。"
      ]
    },
    {
      title: "第4条（アカウント登録）",
      items: [
        "1. 登録利用者は、運営者の定める方法により、真実かつ正確な情報を登録するものとします。",
        "2. 登録情報に変更があった場合、登録利用者は速やかに変更手続きを行うものとします。",
        "3. 運営者は、以下の場合、登録を拒否または登録を抹消できるものとします。",
        "・登録情報に虚偽、誤記、漏れがあった場合",
        "・過去に本規約違反等により利用停止等の措置を受けたことがある場合",
        "・反社会的勢力等（第18条）に該当する場合",
        "・その他運営者が不適切と判断した場合"
      ]
    },
    {
      title: "第5条（認証情報の管理）",
      items: [
        "1. 登録利用者は、メールアドレス・パスワード等の認証情報を自己の責任で管理し、第三者に利用させてはなりません。",
        "2. 認証情報が第三者により使用された場合でも、当該アカウントによる利用は登録利用者本人の利用とみなします。",
        "3. 登録利用者は、不正利用の疑いがある場合、直ちに運営者へ連絡し、運営者の指示に従うものとします。"
      ]
    },
    {
      title: "第6条（利用料金）",
      items: [
        "1. 本サービスの利用料金は原則無料とします（将来有料機能を追加する場合、別途提示します）。",
        "2. 通信料その他利用に要する費用は利用者が負担します。"
      ]
    },
    {
      title: "第7条（禁止事項）",
      items: [
        "利用者は、以下の行為をしてはなりません。",
        "・法令違反・公序良俗違反（動物虐待に該当し得る行為を含む）",
        "・虚偽情報の登録・掲載、経歴・所属・猫の状態等の偽装",
        "・なりすまし、第三者になりすます行為",
        "・不正アクセス、スパム、過度なアクセス、脆弱性探索など運営妨害",
        "・詐欺的行為、金銭目的での不当な誘導、寄付・物販等の強要",
        "・誹謗中傷、差別、嫌がらせ、脅迫、名誉毀損・侮辱",
        "・個人情報の不適切な公開（住所、電話番号、口座、勤務先、SNS等を公開欄へ記載する等）",
        "・無断転載・権利侵害（第三者の画像・文章・商標・肖像等の無断利用）",
        "・不適切コンテンツの投稿（暴力的・残虐、過度に不快、違法行為を助長する内容等）",
        "・外部サービスへの不当誘導（出会い目的、勧誘、宗教・マルチ等）",
        "・未成年の不適切な利用（保護者の同意なく個人情報を入力する等）",
        "・その他運営者が不適切と合理的に判断する行為"
      ]
    },
    {
      title: "第8条（投稿等の取り扱い）",
      items: [
        "1. 利用者は、投稿等について、投稿する権利（著作権、使用許諾等）を有すること、または必要な許諾を得ていることを保証します。",
        "2. 利用者は、運営者に対し、投稿等を本サービスの提供・運営・改善・広報（サービス内表示、SNSや紹介ページでの一部紹介を含む）に必要な範囲で無償利用（複製、翻案、編集、表示、配信等）する非独占的な権利を許諾します。",
        "3. 運営者は、投稿等が第7条違反または不適切と判断した場合、事前通知なく削除・非表示等の措置を取れるものとします。",
        "4. 運営者は、投稿等の保存義務を負いません。"
      ]
    },
    {
      title: "第9条（個人情報・プライバシー）",
      items: [
        "利用者情報の取り扱いは、別途定めるプライバシーポリシーによります。"
      ]
    },
    {
      title: "第10条（譲渡等に関する注意・免責）",
      items: [
        "1. 当事者間の譲渡等に関し、費用負担、条件、手続き、面談、契約、引き渡し、トラブル対応は当事者が行うものとします。",
        "2. 運営者は、譲渡等の成立・不成立、猫の健康状態、感染症、事故、咬傷等を含む一切の結果について責任を負いません（ただし運営者の故意または重大な過失がある場合を除く）。",
        "3. 利用者は、譲渡等に関し必要に応じて獣医師の診断・行政の指針等を参照し、自己の責任で判断するものとします。"
      ]
    },
    {
      title: "第11条（外部サービス・リンク）",
      content: "本サービスから外部サイトへリンクする場合があります。外部サイトの内容・安全性等について運営者は責任を負いません。"
    },
    {
      title: "第12条（サービスの変更・停止・終了）",
      items: [
        "1. 運営者は、事前の通知なく本サービスの内容を変更できるものとします。",
        "2. 運営者は、システム障害、保守、災害等のやむを得ない場合、事前通知なく本サービスの提供を停止できるものとします。",
        "3. 運営者は、本サービスを終了する場合、可能な範囲で事前に告知します。"
      ]
    },
    {
      title: "第13条（保証の否認）",
      content: "運営者は、本サービスに関して、正確性、完全性、安全性、有用性、特定目的への適合性、継続性、エラーや不具合がないこと等を明示的にも黙示的にも保証しません。"
    },
    {
      title: "第14条（利用制限・登録抹消）",
      items: [
        "1. 運営者は、利用者が以下に該当すると判断した場合、事前通知なく、投稿削除、機能制限、アカウント停止、登録抹消等の措置を取ることができます。",
        "・本規約に違反した場合",
        "・不正利用の疑いがある場合",
        "・反社会的勢力等に該当する場合",
        "・その他運営者が不適切と判断した場合",
        "2. 前項の措置により利用者に損害が生じても、運営者は責任を負いません（運営者の故意または重大な過失がある場合を除く）。"
      ]
    },
    {
      title: "第15条（退会）",
      content: "登録利用者は、運営者所定の方法により退会できます。退会後も、運営者が合理的に必要と判断する範囲で、一定期間ログ等を保持する場合があります（プライバシーポリシー参照）。"
    },
    {
      title: "第16条（損害賠償）",
      items: [
        "1. 利用者が本規約違反または不正行為により運営者に損害を与えた場合、利用者はその損害（弁護士費用を含む）を賠償するものとします。",
        "2. 運営者の責任が認められる場合でも、運営者の賠償責任は、運営者の故意または重大な過失がある場合を除き、通常生ずべき直接損害に限られます。"
      ]
    },
    {
      title: "第17条（通知・連絡）",
      content: "運営者から利用者への通知は、本サービス上の表示、登録メールアドレスへの送信その他運営者が適当と判断する方法で行います。通知が発信された時点で到達したものとみなします。"
    },
    {
      title: "第18条（反社会的勢力の排除）",
      items: [
        "1. 利用者は、自らが反社会的勢力等に該当しないこと、また関係を有しないことを表明し保証します。",
        "2. これに反した場合、運営者は事前通知なく利用を停止し、登録を抹消できます。"
      ]
    },
    {
      title: "第19条（権利義務の譲渡禁止）",
      content: "利用者は、運営者の事前の書面による承諾なく、本規約上の地位または権利義務を第三者に譲渡できません。"
    },
    {
      title: "第20条（分離可能性）",
      content: "本規約の一部が無効と判断された場合でも、残りの規定は継続して効力を有します。"
    },
    {
      title: "第21条（準拠法・管轄）",
      content: "本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#fdf2f8] to-[#f5f3ff] text-gray-900 font-sans">
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-[3rem] shadow-2xl shadow-pink-200/30 overflow-hidden border border-white">
              {/* Terms Header */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-12 text-white relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <Scale size={240} />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-md mb-6 border border-white/30">
                    <Scale className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Terms of Service</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">利用規約</h1>
                  <div className="flex flex-wrap gap-6 text-gray-400 text-sm font-medium">
                    <p>制定日：2026年2月18日</p>
                    <p>運営者：お迎えマッチ運営事務局</p>
                  </div>
                </div>
              </div>

              {/* Terms Content */}
              <div className="p-8 md:p-16">
                <div className="flex items-start gap-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 mb-12">
                  <Info className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                  <p className="text-gray-700 leading-relaxed font-medium">
                    この利用規約（以下「本規約」）は、お迎えマッチ運営事務局（以下「運営者」）が提供する「保護猫 お迎えマッチ」（以下「本サービス」）の利用条件を定めるものです。利用者（第2条で定義します）は、本規約に同意のうえ本サービスを利用します。
                  </p>
                </div>

                <div className="space-y-16">
                  {sections.map((section, idx) => (
                    <section key={idx} className="group">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 group-hover:scale-110 group-hover:bg-pink-100 group-hover:text-pink-500 transition-all">
                          <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                          {section.title}
                        </h2>
                      </div>

                      <div className="pl-14 space-y-6">
                        {section.content && (
                          <p className="text-gray-600 leading-relaxed">{section.content}</p>
                        )}

                        {section.items && (
                          <ul className="grid grid-cols-1 gap-3">
                            {section.items.map((item, iIdx) => (
                              <li key={iIdx} className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 text-gray-600 hover:border-pink-100 hover:bg-white transition-colors">
                                <span className="text-pink-400 font-bold">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  ))}
                </div>

                {/* Important Notice */}
                <div className="mt-24 p-12 bg-gradient-to-br from-pink-50 to-rose-50 rounded-[2.5rem] border border-pink-100 text-center relative overflow-hidden">
                  <AlertCircle className="w-12 h-12 text-pink-500 mx-auto mb-6 opacity-80" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">お問い合わせ</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    規約に関するご質問や、その他のお問い合わせは下記フォームよりお願いいたします。
                  </p>
                  <a 
                    href="/contact"
                    className="inline-flex items-center justify-center px-10 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all border border-pink-100"
                  >
                    お問い合わせフォームへ
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
