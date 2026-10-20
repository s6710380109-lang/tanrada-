import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Share2,
  Flag,
  Calendar,
  Eye,
  GraduationCap,
  Layers,
  FileText,
  Video,
  Globe,
  Presentation,
  FileBox,
  Edit2,
  Trash2,
  User,
  CheckCircle,
} from 'lucide-react';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface ResourceDetailModalProps {
  resource: Resource | null;
  onClose: () => void;
  onToggleFavorite: (resource: Resource) => void;
  isFavorited: boolean;
  onOpenReport: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: string, resourceTitle: string) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  onToggleFavorite,
  isFavorited,
  onOpenReport,
  onEdit,
  onDelete,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (resource?.id) {
      // Increment view count in Firestore
      const resourceRef = doc(db, 'resources', resource.id);
      updateDoc(resourceRef, {
        viewCount: increment(1),
      }).catch((e) => console.warn('Could not increment view count:', e));
    }
  }, [resource?.id]);

  if (!resource) return null;

  const isAuthor = currentUser?.uid === resource.authorId;
  const canModify = isAuthor || isAdmin;

  const handleShare = () => {
    navigator.clipboard.writeText(resource.url || window.location.href);
    showToast('คัดลอกลิงก์สื่อการเรียนรู้นี้แล้ว', 'success');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Helper for YouTube video embeds
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (parsed.hostname.includes('youtu.be')) {
        const id = parsed.pathname.slice(1);
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const youtubeEmbedUrl = resource.mediaType === 'video' ? getYouTubeEmbedUrl(resource.url) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
                {resource.category}
              </span>
              <span className="text-xs font-medium text-slate-700 bg-slate-200/70 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                {resource.level}
              </span>
              <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 capitalize">
                {resource.mediaType.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
              {resource.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Video Embed Preview if available */}
          {youtubeEmbedUrl && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-slate-200">
              <iframe
                src={youtubeEmbedUrl}
                title={resource.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* External Access Hero Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                ลิงก์สื่อการเรียนรู้ต้นทาง
              </p>
              <p className="text-xs text-slate-600 truncate max-w-md mt-0.5">
                {resource.url}
              </p>
            </div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>เปิดดูสื่อ / ดาวน์โหลด</span>
            </a>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2">คำอธิบายและรายละเอียดเนื้อหา</h4>
            <div className="text-sm md:text-base text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              {resource.description}
            </div>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                คำสำคัญ (Tags)
              </h4>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Card & Meta */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {resource.authorName ? resource.authorName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{resource.authorName}</p>
                <p className="text-slate-500 text-[11px]">{resource.authorEmail || 'ผู้แบ่งปันความรู้'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-500 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>เผยแพร่: {formatDate(resource.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-400" />
                <span>เปิดดู: {resource.viewCount || 0} ครั้ง</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(resource)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                isFavorited
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isFavorited ? 'บันทึกแล้ว' : 'บันทึกรายการโปรด'}</span>
              <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600">
                {resource.favoriteCount || 0}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>แชร์</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReport(resource)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-amber-700 hover:bg-amber-100/70 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Flag className="w-4 h-4" />
              <span>รายงานเนื้อหา</span>
            </button>

            {canModify && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(resource);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  แก้ไข
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDelete(resource.id, resource.title);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
