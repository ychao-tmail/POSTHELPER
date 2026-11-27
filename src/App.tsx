import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
  Award,
  Users,
  BookOpen,
  Heart,
  Smile,
  Flame,
  Zap,
  MessageSquare,
  Trash2,
  Lightbulb,
  Edit3,
  Globe,
  FileText,
  CheckCircle2,
  Camera,
  Star,
  GraduationCap,
  Share2
} from 'lucide-react';

interface PresetItem {
  title: string;
  advisor: string;
  students: string;
  achievement: string;
  highlights: string;
  style: string;
}

const PRESETS: Record<string, PresetItem> = {
  scienceFair: {
    title: "AI 智慧植物照護與病蟲害預警系統",
    advisor: "林志明 老師",
    students: "陳大文、王小美、張偉",
    achievement: "全國高級中等學校專題實作競賽 資訊群 🏆 全國第一名（金牌）",
    highlights: "歷時 8 個月共同開發，結合物聯網感測器與 Gemini 視覺模型，能自動辨識葉片病害並即時預警，克服了硬體斷線與野外辨識率低落的難題！",
    style: "激勵人心"
  },
  artExhibition: {
    title: "「尋光之徑」畢業美展視覺藝術創作",
    advisor: "李雅婷 教授",
    students: "林佳樺、黃郁翔",
    achievement: "新一代設計展 數位媒體類 🌟 最佳視覺金獎",
    highlights: "透過沉浸式投影與生成式AI互動裝置，探討人與自然記憶的對話。展期間吸引超過三千名觀展者駐足互動，獲得評審高度讚譽。",
    style: "溫馨感人"
  },
  sportsMeet: {
    title: "全國中等學校運動會 高中男子組 4x400公尺接力",
    advisor: "王建民 教練",
    students: "張豪、李明、周柏宇、趙冠廷",
    achievement: "突破校史紀錄！榮獲全國高中組 🥇 金牌（3分15秒20）",
    highlights: "決賽當天大雨滂沱，第四棒在最後五十公尺極限超車逆轉勝！平日清晨五點的晨訓與汗水，在此刻化為最動人的榮耀。",
    style: "熱血青春"
  },
  makerProject: {
    title: "「智造未來」微型自動化智慧工廠",
    advisor: "陳永昌 主任",
    students: "吳柏翰、鄭宇辰",
    achievement: "全國自造者大賽 最佳人氣獎暨特優獎",
    highlights: "全機採用 3D 列印與回收材料製作，結合 AI 視覺瑕疵檢測。從機構設計到程式除錯，兩人無數次在實習工廠熬夜奮戰。",
    style: "幽默風趣"
  }
};

interface UploadedImage {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}

export default function App() {
  // Form states
  const [title, setTitle] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [students, setStudents] = useState('');
  const [achievement, setAchievement] = useState('');
  const [highlights, setHighlights] = useState('');
  const [style, setStyle] = useState('激勵人心');
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Output states
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ig' | 'fb' | 'threads' | 'line'>('ig');
  const [posts, setPosts] = useState<{
    igPost: string;
    fbPost: string;
    threadsPost: string;
    imageAnalysis: string;
  } | null>(null);

  // Editable copies for each tab
  const [editedPosts, setEditedPosts] = useState<{
    ig: string;
    fb: string;
    threads: string;
    line: string;
  }>({ ig: '', fb: '', threads: '', line: '' });

  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Preset loading
  const loadPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    setTitle(p.title);
    setAdvisor(p.advisor);
    setStudents(p.students);
    setAchievement(p.achievement);
    setHighlights(p.highlights);
    setStyle(p.style);
    setPosts(null);
  };

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImages((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            data: result,
            previewUrl: result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate Posts via Backend API
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !achievement && images.length === 0) {
      setErrorMsg('請至少填寫「專題/活動標題」或上傳照片，以便 AI 為您生成精彩文案！');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          advisor,
          students,
          achievement,
          highlights,
          style,
          images: images.map((img) => ({ mimeType: img.mimeType, data: img.data }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '生成文案失敗');
      }

      setPosts(data);
      // Initialize editable posts
      const lineVersion = `${data.fbPost}\n\n📢【群組快報分享】`;
      setEditedPosts({
        ig: data.igPost,
        fb: data.fbPost,
        threads: data.threadsPost,
        line: lineVersion
      });
      setActiveTab('ig');
    } catch (err: any) {
      setErrorMsg(err.message || '發生未預期的錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, tabKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabKey);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                師生社群貼文小幫手
              </h1>
              <p className="text-xs text-slate-400">
                AI 智慧校園公關與得獎捷報文案生成器（IG / FB / Threads）
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>支援 Gemini 2.5 視覺辨識與多平台自動排版</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form & Presets */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Presets */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> 快速載入情境範例
              </span>
              <span className="text-[11px] text-slate-500">點擊一鍵填入</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loadPreset('scienceFair')}
                className="text-left text-xs p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/50 transition flex flex-col gap-1 group"
              >
                <span className="font-medium text-slate-200 group-hover:text-indigo-300">🏆 科展金牌</span>
                <span className="text-[11px] text-slate-400 truncate">資訊專題第一名</span>
              </button>
              <button
                type="button"
                onClick={() => loadPreset('artExhibition')}
                className="text-left text-xs p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700/60 hover:border-purple-500/50 transition flex flex-col gap-1 group"
              >
                <span className="font-medium text-slate-200 group-hover:text-purple-300">🎨 美展金獎</span>
                <span className="text-[11px] text-slate-400 truncate">數位視覺創作</span>
              </button>
              <button
                type="button"
                onClick={() => loadPreset('sportsMeet')}
                className="text-left text-xs p-2.5 rounded-xl bg-slate-800/80 hover:bg-pink-950/60 border border-slate-700/60 hover:border-pink-500/50 transition flex flex-col gap-1 group"
              >
                <span className="font-medium text-slate-200 group-hover:text-pink-300">🏅 運動會奪牌</span>
                <span className="text-[11px] text-slate-400 truncate">田徑接力破紀錄</span>
              </button>
              <button
                type="button"
                onClick={() => loadPreset('makerProject')}
                className="text-left text-xs p-2.5 rounded-xl bg-slate-800/80 hover:bg-amber-950/60 border border-slate-700/60 hover:border-amber-500/50 transition flex flex-col gap-1 group"
              >
                <span className="font-medium text-slate-200 group-hover:text-amber-300">⚙️ 自造特優</span>
                <span className="text-[11px] text-slate-400 truncate">智慧工廠實作</span>
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleGenerate} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-indigo-400" /> 填寫專題或活動資訊
            </h2>

            {errorMsg && (
              <div className="bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs p-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                上傳現場照片 / 得獎合照 / 作品截圖 (可多張)
              </label>
              <div className="flex flex-wrap gap-2 items-center">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 group">
                    <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/50 hover:bg-slate-800 flex flex-col items-center justify-center cursor-pointer transition text-slate-400 hover:text-indigo-300">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px]">上傳</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                💡 AI 會透過視覺辨識分析照片中的情境與人物互動，讓文案更貼切生動。
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                專題 / 活動名稱 <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：AI 智慧植物照護與病蟲害預警系統"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Advisor & Students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> 指導老師
                </label>
                <input
                  type="text"
                  value={advisor}
                  onChange={(e) => setAdvisor(e.target.value)}
                  placeholder="例如：林志明 老師"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-400" /> 學生 / 團隊成員
                </label>
                <input
                  type="text"
                  value={students}
                  onChange={(e) => setStudents(e.target.value)}
                  placeholder="例如：陳大文、王小美"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Achievement */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" /> 獲獎 / 成就摘要
              </label>
              <input
                type="text"
                value={achievement}
                onChange={(e) => setAchievement(e.target.value)}
                placeholder="例如：全國專題實作競賽 資訊群 第一名（金牌）"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Highlights / Story */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                核心亮點 / 幕後努力過程
              </label>
              <textarea
                rows={3}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="例如：歷時 8 個月開發，無數次除錯與實測，克服了硬體斷線與辨識率低落難題..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                貼文風格
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: '激勵人心', icon: Flame, color: 'text-amber-400' },
                  { name: '溫馨感人', icon: Heart, color: 'text-rose-400' },
                  { name: '幽默風趣', icon: Smile, color: 'text-emerald-400' },
                  { name: '專業正式', icon: Zap, color: 'text-cyan-400' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = style === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setStyle(item.name)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI 正在精心撰寫貼文中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>一鍵生成多平台社群貼文</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Output & Multi-Platform Preview */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {posts ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col backdrop-blur">
              
              {/* AI Vision Analysis Tag */}
              {posts.imageAnalysis && (
                <div className="mb-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-200">
                    <span className="font-semibold text-indigo-300">AI 視覺解讀與融合：</span>
                    {posts.imageAnalysis}
                  </div>
                </div>
              )}

              {/* Platform Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 overflow-x-auto gap-2">
                <div className="flex items-center space-x-2">
                  {[
                    { id: 'ig', label: 'Instagram', icon: Camera, color: 'text-pink-400' },
                    { id: 'fb', label: 'Facebook', icon: Globe, color: 'text-blue-400' },
                    { id: 'threads', label: 'Threads', icon: MessageSquare, color: 'text-purple-400' },
                    { id: 'line', label: 'LINE 群組', icon: Share2, color: 'text-emerald-400' }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => {
                    const currentText = editedPosts[activeTab];
                    copyToClipboard(currentText, activeTab);
                  }}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  {copiedTab === activeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">已複製！</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>複製此篇文案</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editor Box */}
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> 支援直接編輯與微調文案內容
                  </span>
                  <span>字數：{editedPosts[activeTab].length} 字</span>
                </div>

                <textarea
                  value={editedPosts[activeTab]}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditedPosts((prev) => ({ ...prev, [activeTab]: val }));
                  }}
                  rows={14}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-sans leading-relaxed resize-y"
                />
              </div>

              {/* Photo Preview Strip inside Output if images uploaded */}
              {images.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 mb-2">搭配發布照片預覽：</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                        <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center flex-1 min-h-[450px]">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl shadow-indigo-500/10">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">準備好為師生榮耀發聲了嗎？</h3>
              <p className="text-sm text-slate-400 max-w-md mb-6">
                請在左側填寫專題/活動資訊，或點擊上方「快速載入情境範例」，再點選「一鍵生成多平台社群貼文」。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400">
                <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center gap-1.5">
                  <Camera className="w-5 h-5 text-pink-400" />
                  <span>IG 視覺排版</span>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center gap-1.5">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span>FB 感性長文</span>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center gap-1.5">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <span>Threads 金句</span>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl flex flex-col items-center gap-1.5">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <span>LINE 快速公告</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        師生社群貼文小幫手 &copy; 2026 - 讓每一份努力與榮耀都被看見 🎓✨
      </footer>
    </div>
  );
}
