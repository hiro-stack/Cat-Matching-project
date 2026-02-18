import Link from "next/link";
import { FC } from "react";
import { Cat } from "lucide-react";

const Footer: FC = () => {
  return (
    <footer className="bg-[#5a5a6b] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* サイト情報 */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20">
                <Cat className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight">お迎え<span className="text-pink-300">マッチ</span></span>
            </div>
            <p className="text-[#e8d5f2] text-sm">
              保護猫との出会いをサポートするプラットフォームです。
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="font-semibold mb-4">リンク</h3>
            <ul className="space-y-2 text-sm text-[#e8d5f2]">
              <li>
                <Link href="/cats" className="hover:text-white transition-colors">
                  保護猫を探す
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  サービスについて
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="font-semibold mb-4">法的情報</h3>
            <ul className="space-y-2 text-sm text-[#e8d5f2]">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-[#9b9baa]/30 text-center text-sm text-[#e8d5f2]">
          <p>&copy; 2026 保護猫 お迎えマッチ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
