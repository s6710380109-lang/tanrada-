/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  BookOpen,
  Filter,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  HelpCircle,
  Database,
  ExternalLink,
  ChevronDown,
  X,
  Search,
} from 'lucide-react';
import { db, testConnection, handleFirestoreError, OperationType } from './firebase';
import { EducationLevel, Favorite, MediaType, Resource } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { PostResourceModal } from './components/PostResourceModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { FavoritesView } from './components/FavoritesView';
import { AdminDashboard } from './components/AdminDashboard';
import { Breadcrumbs, BreadcrumbItem } from './components/Breadcrumbs';
import { checkAndSeedInitialResources } from './utils/seedData';

function MainAppContent() {
  const { currentUser, isAdmin, isSuspended } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'favorites' | 'admin'>('home');

  // Modals State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [reportingResource, setReportingResource] = useState<Resource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedMediaType, setSelectedMediaType] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'favorites'>('latest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data State
  const [resources, setResources] = useState<Resource[]>([]);
  const [userFavorites, setUserFavorites] = useState<Favorite[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // 1. Initial Connection and Seed Check
  useEffect(() => {
    testConnection().then((connected) => {
      setDbConnected(connected);
      if (connected) {
        checkAndSeedInitialResources().then((seeded) => {
          if (seeded > 0) {
            showToast(`เตรียมข้อมูลสื่อการเรียนรู้ตัวอย่างเริ่มต้น ${seeded} รายการเรียบร้อย`, 'info');
          }
        });
      }
    });
  }, []);

  // 2. Real-time Resources Listener from Firestore
  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Resource[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ ...docSnap.data(), id: docSnap.id } as Resource);
        });
        setResources(items);
        setLoadingResources(false);
      },
      (error) => {
        console.warn('Firestore resources onSnapshot error:', error);
        setLoadingResources(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Real-time Favorites Listener for current authenticated user
  useEffect(() => {
    if (!currentUser) {
      setUserFavorites([]);
      return;
    }

    const q = query(collection(db, 'favorites'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const favs: Favorite[] = [];
        snapshot.forEach((docSnap) => {
          favs.push({ ...docSnap.data(), id: docSnap.id } as Favorite);
        });
        setUserFavorites(favs);
      },
      (error) => {
        console.warn('Firestore favorites onSnapshot error:', error);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  // Favorite IDs memoized for instant O(1) checks
  const favoriteResourceIds = useMemo(() => {
    return userFavorites.map((f) => f.resourceId);
  }, [userFavorites]);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (resource: Resource) => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนทำการบันทึกรายการโปรด', 'info');
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    const favoriteDocId = `${currentUser.uid}_${resource.id}`;
    const favRef = doc(db, 'favorites', favoriteDocId);
    const resourceRef = doc(db, 'resources', resource.id);
    const isCurrentlyFav = favoriteResourceIds.includes(resource.id);

    try {
      if (isCurrentlyFav) {
        // Remove favorite
        await deleteDoc(favRef);
        await updateDoc(resourceRef, {
          favoriteCount: increment(-1),
        });
        showToast(`ลบ "${resource.title}" ออกจากรายการโปรดแล้ว`, 'info');
      } else {
        // Add favorite
        const newFav: Favorite = {
          id: favoriteDocId,
          userId: currentUser.uid,
          resourceId: resource.id,
          resourceTitle: resource.title,
          resourceCategory: resource.category,
          resourceMediaType: resource.mediaType,
          createdAt: new Date().toISOString(),
        };
        await setDoc(favRef, newFav);
        await updateDoc(resourceRef, {
          favoriteCount: increment(1),
        });
        showToast(`บันทึก "${resource.title}" เข้าสู่รายการโปรดแล้ว`, 'success');
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      handleFirestoreError(err, OperationType.WRITE, `favorites/${favoriteDocId}`);
    }
  };

  // Handle Delete Resource
  const handleDeleteResource = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, 'resources', deleteConfirm.id));
      showToast(`ลบสื่อ "${deleteConfirm.title}" เรียบร้อยแล้ว`, 'success');
      setDeleteConfirm(null);
      if (selectedResource?.id === deleteConfirm.id) {
        setSelectedResource(null);
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      handleFirestoreError(err, OperationType.DELETE, `resources/${deleteConfirm.id}`);
    }
  };

  // Filter & Sort Logic
  const filteredResources = useMemo(() => {
    return resources
      .filter((res) => {
        // Only show published resources to public; admins or authors see their own
        if (res.status === 'hidden' && !isAdmin && currentUser?.uid !== res.authorId) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = res.title.toLowerCase().includes(q);
          const matchDesc = res.description.toLowerCase().includes(q);
          const matchCat = res.category.toLowerCase().includes(q);
          const matchAuthor = res.authorName.toLowerCase().includes(q);
          const matchTag = res.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchCat && !matchAuthor && !matchTag) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'all' && res.category !== selectedCategory) {
          return false;
        }

        // Education Level Filter
        if (selectedLevel !== 'all' && res.level !== selectedLevel) {
          return false;
        }

        // Media Type Filter
        if (selectedMediaType !== 'all' && res.mediaType !== selectedMediaType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'latest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'popular') {
          return (b.viewCount || 0) - (a.viewCount || 0);
        } else if (sortBy === 'favorites') {
          return (b.favoriteCount || 0) - (a.favoriteCount || 0);
        }
        return 0;
      });
  }, [
    resources,
    searchQuery,
    selectedCategory,
    selectedLevel,
    selectedMediaType,
    sortBy,
    isAdmin,
    currentUser,
  ]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedMediaType('all');
    setSortBy('latest');
  };

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    selectedMediaType !== 'all';

  // Dynamic Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const list: BreadcrumbItem[] = [
      {
        label: 'หน้าแรก',
        onClick: () => {
          setCurrentView('home');
          setSelectedCategory('all');
        },
      },
    ];

    if (currentView === 'favorites') {
      list.push({ label: 'รายการโปรดของฉัน', active: true });
    } else if (currentView === 'admin') {
      list.push({ label: 'แผงควบคุมระบบ (Admin Dashboard)', active: true });
    } else {
      if (selectedCategory !== 'all') {
        list.push({
          label: `หมวดหมู่: ${selectedCategory}`,
          onClick: () => setSelectedCategory(selectedCategory),
          active: !searchQuery,
        });
      }
      if (searchQuery) {
        list.push({ label: `ค้นหา: "${searchQuery}"`, active: true });
      }
    }

    return list;
  }, [currentView, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-200">
      {/* Suspended User Warning */}
      {isSuspended && (
        <div className="bg-rose-600 text-white text-xs py-2.5 px-4 text-center font-medium shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>
              บัญชีของคุณถูกระงับการใช้งานชั่วคราวเนื่องจากละเมิดกฎการใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อขอปลดระงับ
            </span>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'signin');
          setIsAuthModalOpen(true);
        }}
        onOpenPostModal={() => {
          if (isSuspended) {
            showToast('บัญชีของคุณถูกระงับ ไม่สามารถโพสต์แบ่งปันสื่อได้', 'error');
            return;
          }
          setEditingResource(null);
          setIsPostModalOpen(true);
        }}
        currentView={currentView}
        setCurrentView={setCurrentView}
        favoriteCount={userFavorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        {/* Dynamic Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* View Router */}
        {currentView === 'favorites' ? (
          <FavoritesView
            resources={resources}
            favoriteIds={favoriteResourceIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectResource={setSelectedResource}
            onOpenReport={setReportingResource}
            onEdit={(r) => {
              setEditingResource(r);
              setIsPostModalOpen(true);
            }}
            onDelete={(id, title) => setDeleteConfirm({ id, title })}
            onBackToHome={() => setCurrentView('home')}
          />
        ) : currentView === 'admin' ? (
          <AdminDashboard
            onBackToHome={() => setCurrentView('home')}
            onPreviewResource={setSelectedResource}
          />
        ) : (
          /* Home View */
          <div className="space-y-6">
            {/* Hero Section */}
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              totalResourcesCount={resources.length}
            />

            {/* Content & Sidebar Layout */}
            <div id="resources-grid" className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Desktop Filters Sidebar */}
              <aside className="w-full lg:w-64 shrink-0 space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span>ตัวกรองเนื้อหา</span>
                    </div>
                    {isFilterActive && (
                      <button
                        onClick={clearAllFilters}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        ล้างทั้งหมด
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      หมวดหมู่วิชา
                    </label>
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                          selectedCategory === 'all'
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>ทั้งหมด</span>
                        <span className="text-[10px] text-slate-400">{resources.length}</span>
                      </button>
                      {settings.categories.map((cat) => {
                        const count = resources.filter((r) => r.category === cat).length;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                              selectedCategory === cat
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate pr-2">{cat}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Education Level Filter */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ระดับการศึกษา
                    </label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">ทุกระดับชั้น</option>
                      {settings.levels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Media Type Filter */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ประเภทสื่อ
                    </label>
                    <select
                      value={selectedMediaType}
                      onChange={(e) => setSelectedMediaType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="all">ทุกประเภทสื่อ</option>
                      <option value="pdf">PDF / เอกสาร</option>
                      <option value="video">วิดีโอ / คลิปสอน</option>
                      <option value="slide">สไลด์นำเสนอ</option>
                      <option value="website">เว็บไซต์ / บทความ</option>
                      <option value="other">สื่ออื่นๆ</option>
                    </select>
                  </div>
                </div>

                {/* Educational Quote / Prompt card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>ร่วมเป็นผู้ให้ความรู้</span>
                  </div>
                  <p className="text-blue-100 leading-relaxed font-light">
                    คุณครูและเพื่อนๆ นักเรียนสามารถร่วมแชร์ชีทสรุป หรือคลิปสอนดีๆ เพื่อช่วยพัฒนาการศึกษาไปด้วยกัน
                  </p>
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthModalMode('signin');
                        setIsAuthModalOpen(true);
                      } else {
                        setEditingResource(null);
                        setIsPostModalOpen(true);
                      }
                    }}
                    className="w-full py-2 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition shadow-xs text-center block cursor-pointer"
                  >
                    + โพสต์สื่อของคุณตอนนี้
                  </button>
                </div>
              </aside>

              {/* Resources Main Grid */}
              <div className="flex-1 w-full space-y-4">
                {/* Header & Sort Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800 text-base">
                      {selectedCategory === 'all' ? 'สื่อการเรียนรู้ทั้งหมด' : selectedCategory}
                    </h2>
                    <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
                      {filteredResources.length} รายการ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      เรียงตาม:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="latest">อัปเดตล่าสุด</option>
                      <option value="popular">เปิดดูมากที่สุด</option>
                      <option value="favorites">รายการโปรดยอดนิยม</option>
                    </select>
                  </div>
                </div>

                {/* Loading Skeleton */}
                {loadingResources ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse"
                      >
                        <div className="flex justify-between">
                          <div className="h-5 w-24 bg-slate-200 rounded-md" />
                          <div className="h-5 w-16 bg-slate-200 rounded-md" />
                        </div>
                        <div className="h-6 w-3/4 bg-slate-200 rounded-md" />
                        <div className="h-12 w-full bg-slate-100 rounded-md" />
                        <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
                        <div className="pt-3 border-t border-slate-100 flex justify-between">
                          <div className="h-5 w-20 bg-slate-200 rounded-md" />
                          <div className="h-5 w-12 bg-slate-200 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredResources.length > 0 ? (
                  /* Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onSelect={setSelectedResource}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorited={favoriteResourceIds.includes(resource.id)}
                        onOpenReport={setReportingResource}
                        onEdit={(r) => {
                          setEditingResource(r);
                          setIsPostModalOpen(true);
                        }}
                        onDelete={(id, title) => setDeleteConfirm({ id, title })}
                      />
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                      ไม่พบสื่อการเรียนรู้ที่ตรงกับเงื่อนไข
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                      ลองปรับลดคำค้นหา เปลี่ยนตัวกรองหมวดหมู่ หรือร่วมเป็นคนแรกที่แบ่งปันความรู้ในหัวข้อนี้
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {isFilterActive && (
                        <button
                          onClick={clearAllFilters}
                          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs md:text-sm font-medium transition cursor-pointer"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            setAuthModalMode('signin');
                            setIsAuthModalOpen(true);
                          } else {
                            setEditingResource(null);
                            setIsPostModalOpen(true);
                          }
                        }}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium transition shadow-xs flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        โพสต์สื่อใหม่
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm">{settings.siteTitle}</span>
            <span className="text-slate-300">|</span>
            <span>เพื่อการศึกษาไทยที่เข้าถึงได้ทุกคน</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>ระบบเชื่อมต่อฐานข้อมูล Cloud Firestore & Firebase Auth</span>
            <span className="text-slate-300">•</span>
            <span>ลิขสิทธิ์สื่อการสอนเป็นของเจ้าของผลงาน</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <PostResourceModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditingResource(null);
        }}
        editingResource={editingResource}
        onSuccess={() => {
          // Handled via onSnapshot
        }}
      />

      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onToggleFavorite={handleToggleFavorite}
        isFavorited={selectedResource ? favoriteResourceIds.includes(selectedResource.id) : false}
        onOpenReport={(r) => setReportingResource(r)}
        onEdit={(r) => {
          setSelectedResource(null);
          setEditingResource(r);
          setIsPostModalOpen(true);
        }}
        onDelete={(id, title) => setDeleteConfirm({ id, title })}
      />

      <ReportModal
        resource={reportingResource}
        isOpen={!!reportingResource}
        onClose={() => setReportingResource(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">ยืนยันการลบสื่อการเรียนรู้</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบ "{deleteConfirm.title}" สื่อนี้จะถูกลบออกจากคลังความรู้ถาวร
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteResource}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <MainAppContent />
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
