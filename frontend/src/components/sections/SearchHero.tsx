import { FC } from "react";
import { Sparkles, Cat } from "lucide-react";

const SearchHero: FC = () => {
  return (
    <header className="relative bg-white pt-12 pb-16 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight">
            保護猫と<span className="text-pink-500">新しい人生</span>を、<br className="sm:hidden" />ここからはじめる
          </h1>
          
          <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">
            あなたとの出会いを待っている猫たちがたくさんいます。<br className="hidden sm:block" />
            ライフスタイルにぴったりのパートナーを見つけましょう。
          </p>

        </div>
      </div>
    </header>
  );
};

export default SearchHero;
