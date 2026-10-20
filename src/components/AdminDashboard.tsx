import React, { useState, useEffect } from 'react';
import {
  Shield,
  Flag,
  Users,
  Settings,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Trash2,
  EyeOff,
  UserCheck,
  UserX,
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  Clock,
  History,
  Save,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ModerationLog, Report, Resource, UserProfile, UserRole, UserStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from './Toast';

interface AdminDashboardProps {
  onBackToHome: () => void;
  onPreviewResource: (resource: Resource) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToHome,
  onPreviewResource,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { settings, updateSettings, addCategory, removeCategory } = useSettings();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reports' | 'resources' | 'users' | 'settings' | 'logs'>('reports');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Resources list in admin
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceSearch, setResourceSearch] = useState('');

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Logs state
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Site Settings Form state
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle);
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [showAnnouncement, setShowAnnouncement] = useState(settings.showAnnouncement);
  const [newCatInput, setNewCatInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; type: 'resource' | 'report' } | null>(null);

  // Sync settings inputs when loaded
  useEffect(() => {
    setSiteTitle(settings.siteTitle);
    setSiteDescription(settings.siteDescription);
    setAnnouncement(settings.announcement);
    setShowAnnouncement(settings.showAnnouncement);
  }, [settings]);

  // Log moderation action helper
  const addModerationLog = async (action: string, targetType: 'resource' | 'user' | 'setting', targetId: string, details: string) => {
    if (!currentUser) return;
    try {
      const logRef = doc(collection(db, 'moderationLogs'));
      await setDoc(logRef, {
        id: logRef.id,
        action,
        targetType,
        targetId,
        performedBy: currentUser.uid,
        performedByEmail: currentUser.email || '',
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to record moderation log:', e);
    }
  };

  // 1. Listen to Reports
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Report[] = [];
        snapshot.forEach((d) => {
          fetched.push({ ...d.data(), id: d.id } as Report);
        });
        setReports(fetched);
        setLoadingReports(false);
      },
      (error) => {
        console.warn('Reports listener error:', error);
        setLoadingReports(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Listen to all resources
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Resource[] = [];
        snapshot.forEach((d) => {
          fetched.push({ ...d.data(), id: d.id } as Resource);
        });
        setAllResources(fetched);
        setLoadingResources(false);
      },
      (error) => {
        console.warn('Resources listener error:', error);
        setLoadingResources(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Load users
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'), limit(100));
      const snap = await getDocs(q);
      const fetched: UserProfile[] = [];
      snap.forEach((d) => {
        fetched.push({ ...d.data(), uid: d.id } as UserProfile);
      });
      setUsers(fetched);
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // 4. Load moderation logs
  useEffect(() => {
    if (activeTab === 'logs') {
      const q = query(collection(db, 'moderationLogs'), orderBy('timestamp', 'desc'), limit(50));
      getDocs(q)
        .then((snap) => {
          const fetched: ModerationLog[] = [];
          snap.forEach((d) => fetched.push({ ...d.data(), id: d.id } as ModerationLog));
          setLogs(fetched);
          setLoadingLogs(false);
        })
        .catch((e) => {
          console.warn('Logs load error:', e);
          setLoadingLogs(false);
        });
    }
  }, [activeTab]);

  // Actions on Reports
  const handleDismissReport = async (report: Report) => {
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'dismissed',
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser?.uid,
      });
      await addModerationLog('ยกเลิกรายงาน', 'resource', report.resourceId, `ยกเลิกรายงานเรื่อง: ${report.resourceTitle}`);
      showToast('ยกเลิกรายงานเรียบร้อยแล้ว', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${report.id}`);
    }
  };

  const handleHideResourceFromReport = async (resourceId: string, reportId: string) => {
    try {
      await updateDoc(doc(db, 'resources', resourceId), {
        status: 'hidden',
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser?.uid,
      });
      await addModerationLog('ซ่อนสื่อการเรียนรู้', 'resource', resourceId, `ซ่อนสื่อตามรายงาน id: ${reportId}`);
      showToast('ซ่อนสื่อการเรียนรู้และอัปเดตสถานะรายงานแล้ว', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `resources/${resourceId}`);
    }
  };

  // Actions on Resources
  const handleToggleResourceStatus = async (resource: Resource) => {
    const newStatus = resource.status === 'published' ? 'hidden' : 'published';
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      await addModerationLog('เปลี่ยนสถานะสื่อ', 'resource', resource.id, `เปลี่ยนสถานะเป็น ${newStatus}`);
      showToast(`เปลี่ยนสถานะสื่อเป็น ${newStatus === 'published' ? 'เผยแพร่' : 'ซ่อนไว้'} สำเร็จ`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `resources/${resource.id}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'resource') {
        await deleteDoc(doc(db, 'resources', deleteTarget.id));
        await addModerationLog('ลบสื่อการเรียนรู้ถาวร', 'resource', deleteTarget.id, `ลบสื่อ: ${deleteTarget.title}`);
        showToast(`ลบสื่อ "${deleteTarget.title}" สำเร็จแล้ว`, 'success');
      } else if (deleteTarget.type === 'report') {
        await deleteDoc(doc(db, 'reports', deleteTarget.id));
        showToast('ลบรายการรายงานแล้ว', 'info');
      }
      setDeleteTarget(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, deleteTarget.id);
    }
  };

  // Actions on Users
  const handleToggleUserStatus = async (user: UserProfile) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, status: nextStatus } : u))
      );
      await addModerationLog('ปรับสถานะสมาชิก', 'user', user.uid, `ปรับสถานะเป็น ${nextStatus}`);
      showToast(
        nextStatus === 'suspended'
          ? `ระงับการใช้งานบัญชี "${user.displayName}" แล้ว`
          : `เปิดการใช้งานบัญชี "${user.displayName}" ปกติแล้ว`,
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleChangeUserRole = async (user: UserProfile, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      // If setting as admin, also add to admins collection for security rules
      if (newRole === 'admin') {
        await setDoc(doc(db, 'admins', user.uid), { email: user.email, assignedAt: new Date().toISOString() });
      } else {
        try {
          await deleteDoc(doc(db, 'admins', user.uid));
        } catch {}
      }

      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, role: newRole } : u))
      );
      await addModerationLog('เปลี่ยนบทบาทสมาชิก', 'user', user.uid, `เปลี่ยนบทบาทเป็น ${newRole}`);
      showToast(`เปลี่ยนบทบาทของ ${user.displayName} เป็น ${newRole} สำเร็จ`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // Save General Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingSettings(true);
    try {
      await updateSettings(
        {
          siteTitle: siteTitle.trim(),
          siteDescription: siteDescription.trim(),
          announcement: announcement.trim(),
          showAnnouncement,
        },
        currentUser.uid
      );
      await addModerationLog('อัปเดตการตั้งค่าเว็บไซต์', 'setting', 'general', 'ปรับเปลี่ยนข้อมูลเว็บไซต์หรือประกาศ');
      showToast('บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว', 'success');
    } catch (err) {
      showToast('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newCatInput.trim()) return;
    try {
      await addCategory(newCatInput.trim(), currentUser.uid);
      await addModerationLog('เพิ่มหมวดหมู่ใหม่', 'setting', 'category', `เพิ่มหมวดหมู่: ${newCatInput.trim()}`);
      setNewCatInput('');
      showToast('เพิ่มหมวดหมู่วิชาใหม่สำเร็จ', 'success');
    } catch (err) {
      showToast('ไม่สามารถเพิ่มหมวดหมู่ได้', 'error');
    }
  };

  const handleRemoveCategory = async (cat: string) => {
    if (!currentUser) return;
    if (confirm(`คุณต้องการลบหมวดหมู่ "${cat}" หรือไม่?`)) {
      try {
        await removeCategory(cat, currentUser.uid);
        await addModerationLog('ลบหมวดหมู่วิชา', 'setting', 'category', `ลบหมวดหมู่: ${cat}`);
        showToast(`ลบหมวดหมู่ "${cat}" เรียบร้อย`, 'info');
      } catch (err) {
        showToast('ไม่สามารถลบหมวดหมู่ได้', 'error');
      }
    }
  };

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
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
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                แผงควบคุมระบบ (Admin & Moderator Dashboard)
              </h2>
              <p className="text-xs text-slate-500">
                จัดการรายงาน ตรวจสอบสื่อการเรียนรู้ ควบคุมสมาชิก และตั้งค่าเว็บไซต์แบบไดนามิก
              </p>
            </div>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>สถานะ: {isAdmin ? 'ผู้ดูแลระบบสูงสุด (Admin)' : 'ผู้ตรวจสอบ (Moderator)'}</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-4 h-4 text-amber-600" />
          ตรวจสอบรายงาน
          {pendingReportsCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] bg-amber-500 text-white rounded-full font-bold">
              {pendingReportsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'resources'
              ? 'bg-blue-50 text-blue-900 border border-blue-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          สื่อการเรียนรู้ทั้งหมด ({allResources.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          จัดการสมาชิก
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-600" />
            ตั้งค่าเว็บไซต์ & หมวดหมู่
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-purple-50 text-purple-900 border border-purple-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            ประวัติการปฏิบัติงาน (Audit Logs)
          </button>
        )}
      </div>

      {/* Tab 1: Reports Moderation */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-500" />
              รายงานปัญหาเนื้อหา ({reports.length} รายการ)
            </h3>
            <span className="text-xs text-slate-500">
              รอตรวจสอบ {pendingReportsCount} รายการ
            </span>
          </div>

          {loadingReports ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              กำลังโหลดรายการรายงาน...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">ไม่มีรายงานที่ค้างอยู่</h4>
              <p className="text-xs text-slate-500 mt-1">คลังความรู้สะอาด ปลอดภัย และลิงก์ทำงานได้ปกติทั้งหมด</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`bg-white p-5 rounded-2xl border transition-all ${
                    report.status === 'pending'
                      ? 'border-amber-300 shadow-xs'
                      : 'border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            report.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : report.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {report.status === 'pending'
                            ? 'รอดำเนินการ'
                            : report.status === 'resolved'
                            ? 'จัดการแล้ว'
                            : 'ยกเลิกรายงาน'}
                        </span>
                        <span className="text-xs font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                          {report.reason === 'broken_link'
                            ? 'ลิงก์เสีย / เข้าไม่ได้'
                            : report.reason === 'copyright'
                            ? 'ละเมิดลิขสิทธิ์'
                            : report.reason === 'inappropriate'
                            ? 'เนื้อหาไม่เหมาะสม'
                            : report.reason === 'inaccurate'
                            ? 'ข้อมูลผิดพลาด'
                            : 'อื่นๆ'}
                        </span>
                        <span className="text-xs text-slate-400">
                          เมื่อ {new Date(report.createdAt).toLocaleString('th-TH')}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base">
                        {report.resourceTitle}
                      </h4>

                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                        <span className="font-semibold text-slate-900 block mb-0.5">
                          รายละเอียดจากผู้รายงาน ({report.reporterEmail}):
                        </span>
                        {report.details}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleHideResourceFromReport(report.resourceId, report.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            ซ่อนสื่อนี้
                          </button>

                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: report.resourceId,
                                title: report.resourceTitle,
                                type: 'resource',
                              })
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            ลบสื่อถาวร
                          </button>

                          <button
                            onClick={() => handleDismissReport(report)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            ยกเลิกรายงาน
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          const res = allResources.find((r) => r.id === report.resourceId);
                          if (res) onPreviewResource(res);
                          else showToast('ไม่พบสื่อการเรียนรู้นี้ในระบบ (อาจถูกลบไปแล้ว)', 'error');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        เปิดดูสื่อต้นทาง
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Manage All Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm md:text-base">
              รายการสื่อการเรียนรู้ทั้งหมด ({allResources.length})
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="ค้นหาชื่อเรื่อง หรือผู้โพสต์..."
                className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">ชื่อสื่อการเรียนรู้</th>
                    <th className="px-4 py-3">หมวดหมู่</th>
                    <th className="px-4 py-3">ผู้โพสต์</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3">รายงาน</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allResources
                    .filter((r) => {
                      if (!resourceSearch.trim()) return true;
                      const q = resourceSearch.toLowerCase();
                      return (
                        r.title.toLowerCase().includes(q) ||
                        r.authorName.toLowerCase().includes(q) ||
                        r.category.toLowerCase().includes(q)
                      );
                    })
                    .map((resource) => (
                      <tr key={resource.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs">
                          <button
                            onClick={() => onPreviewResource(resource)}
                            className="hover:text-blue-600 line-clamp-1 text-left cursor-pointer"
                          >
                            {resource.title}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs">
                            {resource.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {resource.authorName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                              resource.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {resource.status === 'published' ? 'เผยแพร่' : 'ซ่อนไว้'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(resource.reportCount || 0) > 0 ? (
                            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md font-bold">
                              {resource.reportCount} ครั้ง
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleToggleResourceStatus(resource)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              resource.status === 'published'
                                ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={resource.status === 'published' ? 'ซ่อนสื่อนี้' : 'เผยแพร่สื่อนี้'}
                          >
                            {resource.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: resource.id,
                                title: resource.title,
                                type: 'resource',
                              })
                            }
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="ลบสื่อถาวร"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm md:text-base">
              สมาชิกทั้งหมดในระบบ ({users.length} คน)
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาชื่อ หรืออีเมล..."
                className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              กำลังโหลดข้อมูลสมาชิก...
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-3">ชื่อสมาชิก</th>
                      <th className="px-4 py-3">อีเมล</th>
                      <th className="px-4 py-3">บทบาท (Role)</th>
                      <th className="px-4 py-3">สถานะบัญชี</th>
                      <th className="px-4 py-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users
                      .filter((u) => {
                        if (!userSearch.trim()) return true;
                        const q = userSearch.toLowerCase();
                        return u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                      })
                      .map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span>{u.displayName}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{u.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as UserRole)}
                              disabled={u.uid === currentUser?.uid}
                              className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium cursor-pointer"
                            >
                              <option value="member">สมาชิกทั่วไป (Member)</option>
                              <option value="moderator">ผู้ตรวจสอบ (Moderator)</option>
                              <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {u.status === 'active' ? 'ปกติ (Active)' : 'ถูกระงับ (Suspended)'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {u.uid !== currentUser?.uid && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                  u.status === 'active'
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {u.status === 'active' ? 'ระงับบัญชี' : 'ยกเลิกระงับ'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Site Settings & Dynamic Categories */}
      {activeTab === 'settings' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Site Config */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              การตั้งค่าข้อมูลเว็บไซต์ทั่วไป
            </h3>
            <p className="text-xs text-slate-500">
              แก้ไขชื่อเว็บ คำอธิบาย และข้อความแถบประกาศด้านบนได้ทันทีโดยไม่ต้องแก้ไขซอร์สโค้ด
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อเว็บไซต์ (Site Title)
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คำอธิบายเว็บไซต์ (Site Description)
                </label>
                <textarea
                  rows={3}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    ข้อความแถบประกาศด้านบน (Top Announcement)
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={showAnnouncement}
                      onChange={(e) => setShowAnnouncement(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>เปิดแสดงประกาศ</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingSettings ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกการตั้งค่า</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Dynamic Categories Manager */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              จัดการหมวดหมู่ความรู้ ({settings.categories.length} หมวดหมู่)
            </h3>
            <p className="text-xs text-slate-500">
              เพิ่มหรือลบหมวดหมู่วิชาความรู้เพื่อใช้เป็นตัวกรองและตัวเลือกในการโพสต์สื่อ
            </p>

            {/* Add Category Form */}
            <form onSubmit={handleAddNewCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="ระบุชื่อหมวดหมู่ใหม่..."
                className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs md:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {settings.categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition"
                >
                  <span className="text-sm font-medium text-slate-800">{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="ลบหมวดหมู่นี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Moderation Audit Logs */}
      {activeTab === 'logs' && isAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              บันทึกการปฏิบัติงานของผู้ดูแลระบบ (Audit Logs)
            </h3>
            <span className="text-xs text-slate-500">{logs.length} รายการล่าสุด</span>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              กำลังโหลดประวัติการปฏิบัติงาน...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">ยังไม่มีบันทึกการปฏิบัติงาน</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-4 text-xs md:text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                        {log.action}
                      </span>
                      <span className="text-slate-500">โดย: {log.performedByEmail}</span>
                    </div>
                    <p className="text-slate-700">{log.details}</p>
                  </div>
                  <span className="text-slate-400 text-xs shrink-0 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">ยืนยันการลบถาวร</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบ "{deleteTarget.title}" ข้อมูลนี้จะไม่สามารถกู้คืนได้
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
