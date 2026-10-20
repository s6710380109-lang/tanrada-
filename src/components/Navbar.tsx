import React, { useState } from 'react';
import {
  BookOpen,
  PlusCircle,
  Bookmark,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  AlertTriangle,
  Send,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from './Toast';

interface NavbarProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenPostModal: () => void;
  currentView: 'home' | 'favorites' | 'admin';
  setCurrentView: (view: 'home' | 'favorites' | 'admin') => void;
  favoriteCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenPostModal,
  currentView,
  setCurrentView,
  favoriteCount,
}) => {
  const { currentUser, userProfile, logout, isAdmin, isModerator, resendVerificationEmail } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
      setUserDropdownOpen(false);
      if (currentView === 'favorites' || currentView === 'admin') {
        setCurrentView('home');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await resendVerificationEmail();
      showToast('ส่งอีเมลยืนยันตัวตนเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ', 'success');
    } catch (e: any) {
      showToast('ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณารอสักครู่แล้วลองใหม่', 'error');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Announcement Bar if enabled */}
      {settings.showAnnouncement && settings.announcement && (
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-300 animate-pulse" />
              <span className="font-medium truncate">{settings.announcement}</span>
            </div>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline-block">
              ข่าวประชาสัมพันธ์
            </span>
          </div>
        </div>
      )}

      {/* Email Verification Banner */}
      {currentUser && !currentUser.emailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>อีเมลของคุณยังไม่ได้รับการยืนยันตัวตน กรุณายืนยันเพื่อความปลอดภัยของบัญชี</span>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={sendingVerification}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer underline"
            >
              <Send className="w-3 h-3" />
              {sendingVerification ? 'กำลังส่ง...' : 'ส่งอีเมลยืนยันอีกครั้ง'}
            </button>
          </div>
        </div>
      )}

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg md:text-xl text-slate-900 tracking-tight block">
                  {settings.siteTitle || 'คลังปัญญา'}
                </span>
                <span className="text-[10px] md:text-xs text-blue-600 font-medium block">
                  แพลตฟอร์มแบ่งปันความรู้เพื่อการศึกษา
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                currentView === 'home'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              คลังความรู้
            </button>

            {currentUser && (
              <button
                onClick={() => setCurrentView('favorites')}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 relative ${
                  currentView === 'favorites'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                รายการโปรด
                {favoriteCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white font-bold rounded-full min-w-5 text-center">
                    {favoriteCount}
                  </span>
                )}
              </button>
            )}

            {(isAdmin || isModerator) && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  currentView === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                แผงควบคุมผู้ดูแล
                {isAdmin && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold">
                    Admin
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Post Resource Button */}
            <button
              onClick={() => {
                if (!currentUser) {
                  showToast('กรุณาเข้าสู่ระบบก่อนทำการโพสต์แบ่งปันความรู้', 'info');
                  onOpenAuth('signin');
                } else {
                  onOpenPostModal();
                }
              }}
              className="py-2 px-4 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/20 hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              แบ่งปันความรู้
            </button>

            {/* User Profile or Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-tight max-w-[120px] truncate">
                      {userProfile?.displayName || currentUser.email}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium">
                      {userProfile?.role === 'admin'
                        ? 'ผู้ดูแลระบบ (Admin)'
                        : userProfile?.role === 'moderator'
                        ? 'ผู้ตรวจสอบ (Moderator)'
                        : 'สมาชิกทั่วไป'}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {userProfile?.displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentView('favorites');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      รายการโปรดของฉัน ({favoriteCount})
                    </button>

                    {(isAdmin || isModerator) && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-indigo-700 font-medium hover:bg-indigo-50 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        แผงควบคุมระบบ (Admin)
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="py-2 px-3 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="py-2 px-3.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition cursor-pointer"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth('signin');
                } else {
                  onOpenPostModal();
                }
              }}
              className="p-2 text-blue-600 bg-blue-50 rounded-xl"
              title="แบ่งปันความรู้"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
          {currentUser && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{userProfile?.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                currentView === 'home' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              คลังความรู้ทั้งหมด
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setCurrentView('favorites');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                  currentView === 'favorites' ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4" />
                  รายการโปรดของฉัน
                </div>
                {favoriteCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full font-bold">
                    {favoriteCount}
                  </span>
                )}
              </button>
            )}

            {(isAdmin || isModerator) && (
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                  currentView === 'admin' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                แผงควบคุมระบบ (Admin)
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!currentUser) {
                  onOpenAuth('signin');
                } else {
                  onOpenPostModal();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              โพสต์แบ่งปันความรู้
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('signin');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium"
                >
                  เข้าสู่ระบบ
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
