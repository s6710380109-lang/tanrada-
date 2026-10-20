import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { ReportReason, Resource } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { collection, doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ReportModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ resource, isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนรายงานเนื้อหา', 'info');
      onClose();
      return;
    }

    if (!details.trim()) {
      setErrorMsg('กรุณาระบุรายละเอียดเพิ่มเติมเกี่ยวกับการรายงาน');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const newReportRef = doc(collection(db, 'reports'));
      const reportData = {
        id: newReportRef.id,
        resourceId: resource.id,
        resourceTitle: resource.title,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email || '',
        reason,
        details: details.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(newReportRef, reportData);

      // Increment reportCount on the resource
      try {
        await updateDoc(doc(db, 'resources', resource.id), {
          reportCount: increment(1),
        });
      } catch (err) {
        console.warn('Failed to increment reportCount on resource:', err);
      }

      showToast('ส่งรายงานเนื้อหาเรียบร้อยแล้ว ทีมผู้ดูแลจะเร่งตรวจสอบโดยเร็ว', 'success');
      setDetails('');
      onClose();
    } catch (err) {
      console.error('Error reporting resource:', err);
      handleFirestoreError(err, OperationType.WRITE, 'reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-200" />
            <h3 className="text-base md:text-lg font-bold">รายงานเนื้อหาที่ไม่เหมาะสม</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block">สื่อการเรียนรู้ที่ถูกรายงาน:</span>
            <span className="font-semibold text-slate-800 line-clamp-1 mt-0.5">
              {resource.title}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สาเหตุในการรายงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white transition cursor-pointer"
            >
              <option value="broken_link">ลิงก์เสียหรือไม่สามารถเปิดดูได้</option>
              <option value="copyright">ละเมิดลิขสิทธิ์ / ไม่ได้รับอนุญาต</option>
              <option value="inappropriate">เนื้อหาไม่เหมาะสม / ลามก / รุนแรง</option>
              <option value="inaccurate">ข้อมูลวิชาการผิดพลาด / บิดเบือน</option>
              <option value="other">สาเหตุอื่นๆ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="กรุณาอธิบายข้อผิดพลาด เพื่อให้ผู้ดูแลสามารถตรวจสอบได้อย่างรวดเร็ว..."
              required
              maxLength={1000}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งรายงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
