import React, { useState } from 'react';
import { Bookmark, Search, ArrowLeft, BookOpen, Trash2, ExternalLink } from 'lucide-react';
import { Resource } from '../types';
import { ResourceCard } from './ResourceCard';

interface FavoritesViewProps {
  resources: Resource[];
  favoriteIds: string[];
  onToggleFavorite: (resource: Resource) => void;
  onSelectResource: (resource: Resource) => void;
  onOpenReport: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: string, resourceTitle: string) => void;
  onBackToHome: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  resources,
  favoriteIds,
  onToggleFavorite,
  onSelectResource,
  onOpenReport,
  onEdit,
  onDelete,
  onBackToHome,
}) => {
  const [search, setSearch] = useState('');

  // Filter resources that are in favoriteIds
  const favoritedResources = resources.filter((r) => favoriteIds.includes(r.id));

  const filtered = favoritedResources.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToHome}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 mb-2 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            กลับสู่หน้าหลัก
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <Bookmark className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                รายการโปรดของฉัน
              </h2>
              <p className="text-xs text-slate-500">
                บันทึกคลังความรู้ไว้ {favoritedResources.length} รายการ ซิงค์ข้อมูลเข้ากับบัญชีของคุณอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        {/* Search in favorites */}
        {favoritedResources.length > 0 && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาในรายการโปรด..."
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>

      {/* Grid or Empty State */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onSelect={onSelectResource}
              onToggleFavorite={onToggleFavorite}
              isFavorited={true}
              onOpenReport={onOpenReport}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {favoritedResources.length === 0
              ? 'ยังไม่มีรายการโปรดที่บันทึกไว้'
              : 'ไม่พบรายการโปรดที่ตรงกับคำค้นหา'}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
            {favoritedResources.length === 0
              ? 'เมื่อคุณพบคอร์สเรียน เอกสาร หรือวิดีโอที่น่าสนใจ ให้คลิกที่ไอคอนบุ๊กมาร์กเพื่อบันทึกไว้ทบทวนภายหลังได้ทุกที่ทุกเวลา'
              : 'ลองเปลี่ยนคำค้นหา หรือค้นหาด้วยชื่อวิชาเพื่อค้นหาสื่อที่คุณต้องการ'}
          </p>
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs md:text-sm shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            สำรวจคลังความรู้ทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
