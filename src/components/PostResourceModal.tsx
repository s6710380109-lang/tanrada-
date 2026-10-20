import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle2, AlertCircle, Link as LinkIcon, FileText, Tag, Layers, GraduationCap } from 'lucide-react';
import { EducationLevel, MediaType, Resource, ResourceStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from './Toast';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface PostResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingResource?: Resource | null;
  onSuccess: () => void;
}

export const PostResourceModal: React.FC<PostResourceModalProps> = ({
  isOpen,
  onClose,
  editingResource,
  onSuccess,
}) => {
  const { currentUser, userProfile } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<EducationLevel>('มัธยมศึกษาตอนปลาย');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<ResourceStatus>('published');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingResource) {
      setTitle(editingResource.title);
      setDescription(editingResource.description);
      setCategory(editingResource.category);
      setLevel(editingResource.level);
      setMediaType(editingResource.mediaType);
      setUrl(editingResource.url);
      setTagsInput(editingResource.tags ? editingResource.tags.join(', ') : '');
      setStatus(editingResource.status);
    } else {
      setTitle('');
      setDescription('');
      setCategory(settings.categories[0] || 'เทคโนโลยี & คอมพิวเตอร์');
      setLevel('มัธยมศึกษาตอนปลาย');
      setMediaType('pdf');
      setUrl('');
      setTagsInput('');
      setStatus('published');
    }
    setErrorMsg(null);
  }, [editingResource, isOpen, settings.categories]);

  if (!isOpen) return null;

  const validateForm = () => {
    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('กรุณากรอกชื่อเรื่องอย่างน้อย 3 ตัวอักษร');
      return false;
    }
    if (title.trim().length > 200) {
      setErrorMsg('ชื่อเรื่องต้องไม่เกิน 200 ตัวอักษร');
      return false;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('กรุณากรอกคำอธิบายอย่างน้อย 10 ตัวอักษร เพื่อให้ผู้เรียนเข้าใจประโยชน์ของสื่อ');
      return false;
    }
    if (!url.trim()) {
      setErrorMsg('กรุณาระบุลิงก์สื่อการเรียนรู้');
      return false;
    }
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setErrorMsg('ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://');
        return false;
      }
    } catch {
      setErrorMsg('รูปแบบ URL ไม่ถูกต้อง กรุณาใส่ลิงก์ที่สมบูรณ์ เช่น https://example.com/doc.pdf');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('กรุณาเข้าสู่ระบบก่อนทำการแบ่งปันสื่อการเรียนรู้');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      if (editingResource) {
        // Update existing resource
        const resourceRef = doc(db, 'resources', editingResource.id);
        const updatePayload = {
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          mediaType,
          url: url.trim(),
          status,
          tags: tagsArray,
          updatedAt: new Date().toISOString(),
        };

        await updateDoc(resourceRef, updatePayload);
        showToast('อัปเดตข้อมูลสื่อการเรียนรู้สำเร็จ', 'success');
      } else {
        // Create new resource
        const newResourceRef = doc(collection(db, 'resources'));
        const newResourcePayload: Omit<Resource, 'id'> = {
          title: title.trim(),
          description: description.trim(),
          category,
          level,
          mediaType,
          url: url.trim(),
          authorId: currentUser.uid,
          authorName: userProfile?.displayName || currentUser.email?.split('@')[0] || 'ผู้ใช้งาน',
          authorEmail: currentUser.email || '',
          authorPhoto: currentUser.photoURL || '',
          viewCount: 0,
          favoriteCount: 0,
          reportCount: 0,
          status,
          tags: tagsArray,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(newResourceRef, {
          ...newResourcePayload,
          id: newResourceRef.id,
        });

        showToast('โพสต์แบ่งปันสื่อการเรียนรู้สำเร็จแล้ว', 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving resource:', err);
      handleFirestoreError(err, OperationType.WRITE, 'resources');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">
                {editingResource ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
              </h3>
              <p className="text-xs text-blue-100">
                ร่วมสร้างสังคมแห่งการเรียนรู้ แบ่งปันเอกสาร คอร์ส และแหล่งข้อมูลดีๆ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อเรื่อง / หัวข้อการเรียนรู้ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรตรีโกณมิติ ม.5 พร้อมตัวอย่างข้อสอบ PAT1"
              required
              maxLength={200}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            <span className="text-[10px] text-slate-400 mt-1 block text-right">{title.length}/200 ตัวอักษร</span>
          </div>

          {/* Grid Category & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่วิชา <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
                >
                  {settings.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระดับการศึกษาที่เหมาะสม <span className="text-rose-500">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationLevel)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
              >
                {settings.levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Media Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ประเภทของสื่อ <span className="text-rose-500">*</span>
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
              >
                <option value="pdf">PDF / เอกสารประกอบการเรียน</option>
                <option value="video">วิดีโอ / คลิปสอน (YouTube/Drive)</option>
                <option value="slide">สไลด์นำเสนอ (PPTX / Canva / Google Slides)</option>
                <option value="website">เว็บไซต์ / บทความออนไลน์</option>
                <option value="other">สื่อการสอนอื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะการเผยแพร่
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResourceStatus)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition cursor-pointer"
              >
                <option value="published">เผยแพร่สู่สาธารณะ (Published)</option>
                <option value="hidden">ซ่อนไว้ชั่วคราว (Hidden)</option>
              </select>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ลิงก์ URL เข้าถึงสื่อหรือดาวน์โหลด <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/... หรือ https://youtube.com/..."
                required
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              สามารถแนบลิงก์ Google Drive, YouTube, Canva, OneDrive, หรือเว็บไซต์ความรู้ได้
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบายรายละเอียดเนื้อหา <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายว่าสื่อนี้มีประโยชน์อย่างไร มีหัวข้อย่อยอะไรบ้าง และเหมาะกับผู้เรียนกลุ่มไหน..."
              required
              maxLength={3000}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
            />
            <span className="text-[10px] text-slate-400 mt-1 block text-right">{description.length}/3000 ตัวอักษร</span>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำสำคัญ / แท็ก (คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="เช่น แคลคูลัส, สอบเข้า, ชีทสรุป, ครูสมชาย"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingResource ? 'บันทึกการแก้ไข' : 'โพสต์แบ่งปันทันที'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
