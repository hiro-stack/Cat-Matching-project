"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { User, ApplicantProfile } from "@/types";
import { Info } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // プロフィールデータ
  const [profile, setProfile] = useState<ApplicantProfile>({
    age: null,
    gender: null,
    residence_area: "",
    marital_status: null,
    income_status: null,
    pet_policy_confirmed: false,
    indoors_agreement: false,
    absence_time: null,
    home_frequency: null,
    cat_experience: null,
    cat_distance: null,
    home_atmosphere: null,
    visitor_frequency: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getProfile();
        if (user.applicant_profile) {
          setProfile(prev => ({ ...prev, ...user.applicant_profile }));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("プロフィールの読み込みに失敗しました。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setProfile(prev => ({ ...prev, [name]: checked }));
    } else {
       setProfile(prev => ({ ...prev, [name]: value === "" ? null : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    // バリデーション (必須項目)
    if (!profile.indoors_agreement) {
      setError("完全室内飼いへの同意は必須です。");
      setIsSaving(false);
      return;
    }
    if (!profile.pet_policy_confirmed) {
      setError("住居のペット可否状況の確認は必須です。");
      setIsSaving(false);
      return;
    }
    if (!profile.marital_status) {
      setError("家族構成（既婚/単身）を選択してください。");
      setIsSaving(false);
      return;
    }
    if (!profile.income_status) {
      setError("収入状況を選択してください。");
      setIsSaving(false);
      return;
    }
    if (!profile.age) {
        setError("年齢を入力してください。");
        setIsSaving(false);
        return;
    }
    if (!profile.cat_experience) {
        setError("猫の飼育経験を選択してください。");
        setIsSaving(false);
        return;
    }

    try {
      // UserMeUpdateSerializer に合わせて構造化
      // applicant_profile フィールドにネストして送信
      await authService.updateProfile({
        applicant_profile: profile
      } as any); // Type assertion needed because updateProfile expects User partial
      
      // 成功したら猫一覧へ
      router.push("/");
    } catch (err: any) {
      console.error("Update error:", err);
      if (err.response?.data) {
          // エラー処理（簡略化）
          const msg = JSON.stringify(err.response.data);
          setError(`保存に失敗しました: ${msg}`);
      } else {
        setError("プロフィールの保存に失敗しました。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fef9f3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">プロフィール設定</h1>
              <p className="text-gray-500 mt-2">
                里親応募のために必要な情報を入力してください。<br/>
                この情報は相性診断にも使用されます。
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* A. 初期登録（必須・マッチング基盤） */}
              <section>
                <h2 className="text-lg font-bold text-pink-600 border-b border-pink-100 pb-2 mb-4">基本情報</h2>
                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">年齢 <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="number"
                      name="age"
                      value={profile.age || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                    <select
                      name="gender"
                      value={profile.gender || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">その他</option>
                      <option value="no_answer">回答しない</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      団体提出用（マッチングスコアには使用しません）
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">居住エリア（都道府県のみ） <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      name="residence_area"
                      value={profile.residence_area || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                      placeholder="例：東京都"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">家族構成 <span className="text-red-500">*</span></label>
                    <select
                      required
                      name="marital_status"
                      value={profile.marital_status || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="married">既婚者</option>
                      <option value="single">単身者</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">収入状況 <span className="text-red-500">*</span></label>
                    <select
                      required
                      name="income_status"
                      value={profile.income_status || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="stable">安定している</option>
                      <option value="unstable">不安定</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-pink-50 rounded-xl border border-pink-100 hover:bg-pink-100/50 transition-colors">
                    <input
                      type="checkbox"
                      name="indoors_agreement"
                      checked={profile.indoors_agreement || false}
                      onChange={handleChange}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                    />
                    <span className="text-gray-800 font-bold">完全室内飼いに同意します <span className="text-red-500 text-xs ml-1">(必須)</span></span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-pink-50 rounded-xl border border-pink-100 hover:bg-pink-100/50 transition-colors">
                    <input
                      type="checkbox"
                      name="pet_policy_confirmed"
                      checked={profile.pet_policy_confirmed || false}
                      onChange={handleChange}
                      className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                    />
                    <span className="text-gray-800 font-bold">住居のペット可否について確認しました <span className="text-red-500 text-xs ml-1">(必須)</span></span>
                  </label>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-pink-600 border-b border-pink-100 pb-2 mb-4">生活リズム</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">平均留守時間</label>
                    <select
                      name="absence_time"
                      value={profile.absence_time || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="less_than_4">4時間未満</option>
                      <option value="4_to_8">4〜8時間</option>
                      <option value="8_to_12">8〜12時間</option>
                      <option value="more_than_12">12時間以上</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">在宅頻度</label>
                    <select
                      name="home_frequency"
                      value={profile.home_frequency || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="high">高い（ほぼ毎日）</option>
                      <option value="medium">普通（週2-3日在宅）</option>
                      <option value="low">低い（ほぼ不在）</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* B. プロフィール（相性推定用・強く推奨） */}
              <section>
                <h2 className="text-lg font-bold text-pink-600 border-b border-pink-100 pb-2 mb-4">
                  相性・ライフスタイル <span className="text-sm font-normal text-gray-400 ml-2 inline-flex items-center gap-1"><Info className="w-3 h-3" /> マッチング精度向上のため入力推奨</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ペットの飼育経験 <span className="text-red-500">*</span></label>
                    <select
                      required
                      name="cat_experience"
                      value={profile.cat_experience || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="none">なし</option>
                      <option value="one">あり</option>
                      <option value="multiple">複数経験あり</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">猫との希望距離感</label>
                    <select
                      name="cat_distance"
                      value={profile.cat_distance || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="clingy">べったり甘えてほしい</option>
                      <option value="moderate">適度な距離感がいい</option>
                      <option value="watchful">静かに見守りたい</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">家の雰囲気</label>
                    <select
                      name="home_atmosphere"
                      value={profile.home_atmosphere || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="quiet">静か</option>
                      <option value="normal">普通</option>
                      <option value="lively">にぎやか</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">来客頻度</label>
                    <select
                      name="visitor_frequency"
                      value={profile.visitor_frequency || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none"
                    >
                      <option value="">選択してください</option>
                      <option value="high">多い</option>
                      <option value="medium">普通</option>
                      <option value="low">少ない</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60"
                >
                  {isSaving ? "保存中..." : "プロフィールを保存して次へ"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
