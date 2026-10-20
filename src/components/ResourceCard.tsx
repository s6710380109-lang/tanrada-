import React from 'react';
import {
  FileText,
  Video,
  Globe,
  Presentation,
  FileBox,
  Eye,
  Bookmark,
  Share2,
  Flag,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { MediaType, Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
  onToggleFavorite: (resource: Resource) => void;
  isFavorited: boolean;
  onOpenReport: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: string, resourceTitle: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onSelect,
  onToggleFavorite,
  isFavorited,
  onOpenReport,
  onEdit,
  onDelete,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isAuthor = currentUser?.uid === resource.authorId;
  const canModify = isAuthor || isAdmin;

  const getMediaIconAndBadge = (type: MediaType) => {
    switch (type) {
      case 'pdf':
        return {
          icon: <FileText className="w-3.5 h-3.5" />,
          label: 'PDF / เอกสาร',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'video':
        return {
          icon: <Video className="w-3.5 h-3.5" />,
          label: 'วิดีโอ / คลิปสอน',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'slide':
        return {
          icon: <Presentation className="w-3.5 h-3.5" />,
          label: 'สไลด์นำเสนอ',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'website':
        return {
          icon: <Globe className="w-3.5 h-3.5" />,
          label: 'เว็บไซต์ / บทความ',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          icon: <FileBox className="w-3.5 h-3.5" />,
          label: 'สื่อทั่วไป',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  const media = getMediaIconAndBadge(resource.mediaType);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resource.url || window.location.href);
    showToast('คัดลอกลิงก์ของสื่อนี้แล้ว', 'success');
    setMenuOpen(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={() => onSelect(resource)}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Banner Accent */}
      <div className="p-5 pb-3">
        {/* Category & Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category tag */}
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 truncate max-w-[150px]">
              {resource.category}
            </span>
            {/* Media Type badge */}
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${media.bg}`}
            >
              {media.icon}
              {media.label}
            </span>
          </div>

          {/* Action Menu Button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              aria-label="เมนูเพิ่มเติม"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={handleShare}
                  className="w-full px-3.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  คัดลอกลิงก์
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenReport(resource);
                  }}
                  className="w-full px-3.5 py-1.5 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500" />
                  รายงานเนื้อหา
                </button>

                {canModify && (
                  <>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(resource);
                      }}
                      className="w-full px-3.5 py-1.5 text-left text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                      แก้ไขสื่อนี้
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(resource.id, resource.title);
                      }}
                      className="w-full px-3.5 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      ลบสื่อนี้
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-base md:text-lg mb-2 leading-snug">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 text-xs md:text-sm line-clamp-3 font-normal leading-relaxed mb-4">
          {resource.description}
        </p>

        {/* Education Level indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700">{resource.level}</span>
        </div>
      </div>

      {/* Footer Meta & Stats */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        {/* Author info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
            {resource.authorName ? resource.authorName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="truncate max-w-[110px] font-medium text-slate-700">
            {resource.authorName}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] text-slate-400 shrink-0">{formatDate(resource.createdAt)}</span>
        </div>

        {/* Stats & Favorite button */}
        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 text-slate-400" title="จำนวนเปิดดู">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px]">{resource.viewCount || 0}</span>
          </div>

          <button
            onClick={() => onToggleFavorite(resource)}
            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
              isFavorited
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'
            }`}
            title={isFavorited ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-rose-600' : ''}`} />
            <span className="text-[11px] font-semibold">{resource.favoriteCount || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
