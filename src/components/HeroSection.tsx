import React from 'react';
import { Search, Sparkles, BookCheck, Users, FileText, ArrowRight, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  totalResourcesCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  totalResourcesCount,
}) => {
  const { settings } = useSettings();

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 text-white py-12 md:py-16 px-4 sm:px-6 lg:px-8 rounded-3xl shadow-xl mb-8">
      {/* Background Decorative Circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-blue-200 mb-4 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>ศูนย์กลางสื่อการเรียนการสอนและองค์ความรู้เพื่อคนไทย</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          ค้นหาและแบ่งปัน <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">ความรู้ไร้ขีดจำกัด</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-blue-100/90 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          {settings.siteDescription || 'รวมเอกสาร สไลด์สรุป วิดีโอสอน และแหล่งเรียนรู้สำหรับนักเรียน นิสิต นักศึกษา และคุณครูทุกระดับชั้น'}
        </p>

        {/* Large Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl p-1.5 shadow-2xl border border-white/30 text-slate-900 focus-within:ring-4 focus-within:ring-sky-400/40 transition">
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเรื่อง, วิชา, หัวข้อ หรือคำสำคัญ เช่น Python, แคลคูลัส, ฟิสิกส์..."
              className="w-full py-2.5 px-2 text-sm md:text-base bg-transparent text-slate-800 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-600 mr-1 rounded-full hover:bg-slate-100 transition"
                title="ล้างข้อความ"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                // Focus on search or trigger scroll
                const element = document.getElementById('resources-grid');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>ค้นหา</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </div>

        {/* Popular Quick Category Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 max-w-3xl mx-auto">
          <span className="text-xs text-blue-200/80 mr-1">หมวดหมู่ยอดนิยม:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            ทั้งหมด
          </button>
          {settings.categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer truncate max-w-[160px] ${
                selectedCategory === cat
                  ? 'bg-sky-300 text-blue-950 font-semibold shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-10 pt-6 border-t border-white/15 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold text-lg md:text-xl">
              <FileText className="w-4 h-4" />
              <span>{totalResourcesCount > 0 ? totalResourcesCount : '100+'}</span>
            </div>
            <span className="text-[11px] md:text-xs text-blue-200 font-light">สื่อการเรียนรู้ในระบบ</span>
          </div>
          <div className="flex flex-col items-center border-x border-white/15">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold text-lg md:text-xl">
              <BookCheck className="w-4 h-4" />
              <span>100%</span>
            </div>
            <span className="text-[11px] md:text-xs text-blue-200 font-light">เข้าถึงฟรีทุกวิชา</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold text-lg md:text-xl">
              <Users className="w-4 h-4" />
              <span>ครู & นักเรียน</span>
            </div>
            <span className="text-[11px] md:text-xs text-blue-200 font-light">ร่วมสร้างคลังความรู้</span>
          </div>
        </div>
      </div>
    </div>
  );
};
