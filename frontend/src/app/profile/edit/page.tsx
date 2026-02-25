"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import api from "@/lib/api";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { ApplicantProfile } from "@/types";
import { Info, ShieldCheck, ShieldOff, MailCheck, ChevronRight } from "lucide-react";

type Step = 'loading' | '2fa' | 'profile';

export default function ProfileEditPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // 2FA 状態
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [twoFaStep, setTwoFaStep] = useState<'idle' | 'code_sent'>('idle');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaMessage, setTwoFaMessage] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [isTwoFaSaving, setIsTwoFaSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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
        const enabled = user.is_2fa_enabled ?? false;
        setIs2faEnabled(enabled);
        setUserEmail(user.email ?? '');
        // 2FAが未設定なら2FAステップへ、設定済みならプロフィールへ
        setStep(enabled ? 'profile' : '2fa');
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push("/login");
          return;
        }
        setError("プロフィールの読み込みに失敗しました。");
        setStep('profile');
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

  const handleSendTwoFaCode = async () => {
    setIsTwoFaSaving(true);
    setTwoFaError('');
    setTwoFaMessage('');
    try {
      await api.post('/api/accounts/2fa/enable/', {});
      setTwoFaStep('code_sent');
      setTwoFaMessage('確認コードをメールに送信しました。コードの有効期限は10分です。');
    } catch (err: any) {
      setTwoFaError(err.response?.data?.detail || 'コードの送信に失敗しました。');
    } finally {
      setIsTwoFaSaving(false);
    }
  };

  const handleConfirmTwoFaCode = async () => {
    setIsTwoFaSaving(true);
    setTwoFaError('');
    try {
      await api.post('/api/accounts/2fa/enable/', { code: twoFaCode });
      setIs2faEnabled(true);
      setTwoFaStep('idle');
      setTwoFaCode('');
      setTwoFaMessage('二段階認証を有効にしました！プロフィール設定に進みます。');
      setTimeout(() => {
        setTwoFaMessage('');
        setStep('profile');
      }, 1500);
    } catch (err: any) {
      setTwoFaError(err.response?.data?.detail || 'コードが正しくないか、有効期限が切れています。');
    } finally {
      setIsTwoFaSaving(false);
    }
  };

  const handleDisableTwoFa = async () => {
    setIsTwoFaSaving(true);
    setTwoFaError('');
    setTwoFaMessage('');
    try {
      await api.post('/api/accounts/2fa/disable/', {});
      setIs2faEnabled(false);
      setTwoFaMessage('二段階認証を無効にしました。');
    } catch (err: any) {
      setTwoFaError(err.response?.data?.detail || '無効化に失敗しました。');
    } finally {
      setIsTwoFaSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

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
      await authService.updateProfile({
        applicant_profile: profile
      } as any);
      router.push("/");
    } catch (err: any) {
      if (err.response?.data) {
        const msg = JSON.stringify(err.response.data);
        setError(`保存に失敗しました: ${msg}`);
      } else {
        setError("プロフィールの保存に失敗しました。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  // ─── ローディング ───
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#fef9f3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // ─── 2FA 設定ステップ ───
  if (step === '2fa') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-md mx-auto">
            {/* ステップ表示 */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-sm font-bold flex items-center justify-center">1</div>
                <span className="text-sm font-bold text-pink-600">セキュリティ設定</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 text-sm font-bold flex items-center justify-center">2</div>
                <span className="text-sm font-medium text-gray-400">プロフィール設定</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-pink-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">二段階認証の設定</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  アカウントを保護するため、<br />
                  ログイン時にメールで確認コードを送信します。
                </p>
              </div>

              {twoFaMessage && (
                <div className="mb-5 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm">
                  {twoFaMessage}
                </div>
              )}
              {twoFaError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {twoFaError}
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <div className="flex items-start gap-3">
                  <MailCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">確認コードの送信先</p>
                    <p className="mt-0.5 font-mono">{userEmail}</p>
                  </div>
                </div>
              </div>

              {twoFaStep === 'idle' && (
                <button
                  type="button"
                  onClick={handleSendTwoFaCode}
                  disabled={isTwoFaSaving}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isTwoFaSaving ? '送信中...' : '確認コードをメールに送る'}
                  {!isTwoFaSaving && <ChevronRight className="w-5 h-5" />}
                </button>
              )}

              {twoFaStep === 'code_sent' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      メールに届いた確認コード（6桁）
                    </label>
                    <input
                      type="text"
                      value={twoFaCode}
                      onChange={(e) => {
                        setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setTwoFaError('');
                      }}
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-center text-2xl tracking-[0.5em] font-mono focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmTwoFaCode}
                    disabled={isTwoFaSaving || twoFaCode.length !== 6}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-400 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500 transition-all disabled:opacity-60"
                  >
                    {isTwoFaSaving ? '確認中...' : '二段階認証を有効にする'}
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setTwoFaStep('idle'); setTwoFaCode(''); setTwoFaError(''); setTwoFaMessage(''); }}
                      className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      コードを再送する
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => setStep('profile')}
                  className="text-sm text-gray-400 hover:text-gray-500 transition-colors underline underline-offset-2"
                >
                  スキップしてプロフィール設定へ
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── プロフィール設定ステップ ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#ffeef3] to-[#f5f0f6] font-sans text-gray-900">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* ステップ表示 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-400 text-white text-sm font-bold flex items-center justify-center">✓</div>
              <span className="text-sm font-medium text-gray-400">セキュリティ設定</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-sm font-bold flex items-center justify-center">2</div>
              <span className="text-sm font-bold text-pink-600">プロフィール設定</span>
            </div>
          </div>

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
                    <select
                      required
                      name="residence_area"
                      value={profile.residence_area || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-100 outline-none bg-white"
                    >
                      <option value="">選択してください</option>
                      {prefectures.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
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

              {/* B. 相性・ライフスタイル */}
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

              {/* セキュリティ設定（管理用） */}
              <section>
                <h2 className="text-lg font-bold text-pink-600 border-b border-pink-100 pb-2 mb-4 flex items-center gap-2">
                  {is2faEnabled
                    ? <ShieldCheck className="w-5 h-5 text-green-500" />
                    : <ShieldOff className="w-5 h-5 text-gray-400" />
                  }
                  セキュリティ設定
                </h2>

                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-800">二段階認証（メール OTP）</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ログイン時にメールアドレスへ6桁の確認コードを送信します
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      is2faEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {is2faEnabled ? '有効' : '無効'}
                    </span>
                  </div>

                  {twoFaMessage && (
                    <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm">
                      {twoFaMessage}
                    </div>
                  )}
                  {twoFaError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                      {twoFaError}
                    </div>
                  )}

                  {!is2faEnabled && twoFaStep === 'idle' && (
                    <button
                      type="button"
                      onClick={handleSendTwoFaCode}
                      disabled={isTwoFaSaving}
                      className="mt-1 px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-60"
                    >
                      {isTwoFaSaving ? '送信中...' : '二段階認証を有効にする'}
                    </button>
                  )}

                  {!is2faEnabled && twoFaStep === 'code_sent' && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-gray-600">メールに届いた6桁のコードを入力してください：</p>
                      <input
                        type="text"
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        className="w-40 px-4 py-2 border border-gray-200 rounded-lg text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-pink-100 outline-none"
                        placeholder="000000"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmTwoFaCode}
                          disabled={isTwoFaSaving || twoFaCode.length !== 6}
                          className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-60"
                        >
                          {isTwoFaSaving ? '確認中...' : '確認する'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTwoFaStep('idle'); setTwoFaCode(''); setTwoFaError(''); setTwoFaMessage(''); }}
                          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  )}

                  {is2faEnabled && (
                    <button
                      type="button"
                      onClick={handleDisableTwoFa}
                      disabled={isTwoFaSaving}
                      className="mt-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-60"
                    >
                      {isTwoFaSaving ? '処理中...' : '二段階認証を無効にする'}
                    </button>
                  )}
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
