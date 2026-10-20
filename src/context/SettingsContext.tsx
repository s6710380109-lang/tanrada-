import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { EducationLevel, SiteSettings } from '../types';

export const DEFAULT_CATEGORIES: string[] = [
  'วิทยาศาสตร์',
  'คณิตศาสตร์',
  'เทคโนโลยี & คอมพิวเตอร์',
  'ภาษาไทย',
  'ภาษาต่างประเทศ (อังกฤษ/จีน/ญี่ปุ่น)',
  'สังคมศึกษา & ประวัติศาสตร์',
  'ศิลปะ & ดนตรี',
  'การงานอาชีพ & ธุรกิจการเงิน',
  'สุขศึกษา & สุขภาพ',
  'การเตรียมตัวสอบ & ชิงทุน',
];

export const DEFAULT_LEVELS: EducationLevel[] = [
  'ประถมศึกษา',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
  'อาชีวศึกษา/ปวช.-ปวส.',
  'อุดมศึกษา/มหาวิทยาลัย',
  'บุคคลทั่วไป',
];

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'คลังปัญญา (KlangPanya)',
  siteDescription: 'ศูนย์รวมสื่อการเรียนรู้ เอกสาร คอร์สเรียน และแบบฝึกหัดสำหรับนักเรียน นักศึกษา และครูอาจารย์',
  announcement: 'ยินดีต้อนรับสู่คลังปัญญา! ร่วมแบ่งปันสื่อการสอนและแหล่งเรียนรู้ฟรี เพื่อส่งเสริมการศึกษาไทยอย่างเท่าเทียม',
  showAnnouncement: true,
  categories: DEFAULT_CATEGORIES,
  levels: DEFAULT_LEVELS,
};

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>, updatedByUid: string) => Promise<void>;
  addCategory: (category: string, updatedByUid: string) => Promise<void>;
  removeCategory: (category: string, updatedByUid: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');

    // Subscribe to live settings updates
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SiteSettings>;
          setSettings({
            siteTitle: data.siteTitle || DEFAULT_SETTINGS.siteTitle,
            siteDescription: data.siteDescription || DEFAULT_SETTINGS.siteDescription,
            announcement: data.announcement || DEFAULT_SETTINGS.announcement,
            showAnnouncement: data.showAnnouncement !== undefined ? data.showAnnouncement : true,
            categories: data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES,
            levels: data.levels && data.levels.length > 0 ? data.levels : DEFAULT_LEVELS,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
          });
        } else {
          // Initialize settings if they don't exist yet
          setDoc(docRef, {
            ...DEFAULT_SETTINGS,
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            console.warn('Initial settings setDoc deferred:', err);
          });
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Settings onSnapshot error (using fallback defaults):', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>, updatedByUid: string) => {
    const docRef = doc(db, 'settings', 'general');
    try {
      const merged = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedByUid,
      };
      await setDoc(docRef, merged, { merge: true });
      setSettings(merged);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/general');
    }
  };

  const addCategory = async (category: string, updatedByUid: string) => {
    const trimmed = category.trim();
    if (!trimmed || settings.categories.includes(trimmed)) return;
    const newCats = [...settings.categories, trimmed];
    await updateSettings({ categories: newCats }, updatedByUid);
  };

  const removeCategory = async (category: string, updatedByUid: string) => {
    const newCats = settings.categories.filter((c) => c !== category);
    await updateSettings({ categories: newCats }, updatedByUid);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
