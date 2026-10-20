import { collection, doc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Resource } from '../types';

export const INITIAL_RESOURCES: Omit<Resource, 'id'>[] = [
  {
    title: 'คู่มือเริ่มต้นเขียนโปรแกรมด้วยภาษา Python ฉบับสมบูรณ์สำหรับผู้เริ่มต้น',
    description: 'เอกสารสรุปไวยากรณ์พื้นฐานภาษา Python 3 โครงสร้างข้อมูล เงื่อนไข ลูป ฟังก์ชัน และการจัดการไฟล์ เหมาะสำหรับนักเรียนมัธยมและนิสิตนักศึกษาที่เริ่มต้นสายงานพัฒนาซอฟต์แวร์',
    category: 'เทคโนโลยี & คอมพิวเตอร์',
    level: 'มัธยมศึกษาตอนปลาย',
    mediaType: 'pdf',
    url: 'https://docs.python.org/3/tutorial/index.html',
    authorId: 'system_admin',
    authorName: 'อ.ดร. ธีรภัทร์ ภัทรเกียรติ',
    authorEmail: 'theerapat@edu.example.com',
    viewCount: 142,
    favoriteCount: 28,
    reportCount: 0,
    status: 'published',
    tags: ['Python', 'การเขียนโปรแกรม', 'Coding', 'วิทยาการคำนวณ'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    title: 'สรุปสูตรฟิสิกส์ ม.ปลาย: กลศาสตร์ ไฟฟ้า คลื่น และฟิสิกส์อะตอม',
    description: 'เอกสารรวมสูตรฟิสิกส์ ม.4-ม.6 พร้อมภาพประกอบและตัวอย่างข้อสอบเก่า A-Level / TPAT3 อธิบายการประยุกต์ใช้สูตรอย่างกระชับ เข้าใจง่าย',
    category: 'วิทยาศาสตร์',
    level: 'มัธยมศึกษาตอนปลาย',
    mediaType: 'pdf',
    url: 'https://www.scimath.org/',
    authorId: 'system_admin',
    authorName: 'ครูสมชาย พรพิสุทธิ์',
    authorEmail: 'somchai.sci@edu.example.com',
    viewCount: 310,
    favoriteCount: 75,
    reportCount: 0,
    status: 'published',
    tags: ['ฟิสิกส์', 'ม.ปลาย', 'สรุปสูตร', 'A-Level'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    title: 'วิดีโอสอน: แคลคูลัสพื้นฐาน ลิมิต อนุพันธ์ และการอินทิเกรต',
    description: 'คลิปบรรยายอธิบายแนวคิด Calculus ตั้งแต่นิยามของ Limit การหาความชันของเส้นสัมผัส ไปจนถึงเทคนิคการอินทิเกรตเพื่อหาพื้นที่ใต้กราฟ สำหรับเตรียมสอบมหาวิทยาลัย',
    category: 'คณิตศาสตร์',
    level: 'อุดมศึกษา/มหาวิทยาลัย',
    mediaType: 'video',
    url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    authorId: 'system_admin',
    authorName: 'รศ. กิตติศักดิ์ เจริญกิจ',
    authorEmail: 'kittisak@math.example.com',
    viewCount: 520,
    favoriteCount: 112,
    reportCount: 0,
    status: 'published',
    tags: ['คณิตศาสตร์', 'แคลคูลัส', 'มหาวิทยาลัย', 'อนุพันธ์'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    title: 'คลังคำศัพท์ภาษาอังกฤษ 1,000 คำที่พบบ่อยที่สุดในข้อสอบ IELTS & TOEIC',
    description: 'รวบรวมคำศัพท์พร้อมคำแปลภาษาไทย ตัวอย่างประโยค และรากศัพท์ (Prefix / Suffix) ช่วยให้จดจำคำศัพท์ได้อย่างเป็นระบบและรวดเร็ว',
    category: 'ภาษาต่างประเทศ (อังกฤษ/จีน/ญี่ปุ่น)',
    level: 'บุคคลทั่วไป',
    mediaType: 'website',
    url: 'https://dictionary.cambridge.org/',
    authorId: 'system_admin',
    authorName: 'Teacher Jennifer L.',
    authorEmail: 'jennifer.eng@edu.example.com',
    viewCount: 260,
    favoriteCount: 88,
    reportCount: 0,
    status: 'published',
    tags: ['English', 'Vocabulary', 'IELTS', 'TOEIC', 'ภาษาอังกฤษ'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    title: 'สไลด์สรุปเนื้อหาประวัติศาสตร์ไทยและพัฒนาการทางสังคมในยุคโลกาภิวัตน์',
    description: 'ชุดสไลด์นำเสนอประกอบการสอนวิชาประวัติศาสตร์ ครอบคลุมเหตุการณ์สำคัญ การปฏิรูปประเทศ และผลกระทบต่อเศรษฐกิจและสังคมในปัจจุบัน',
    category: 'สังคมศึกษา & ประวัติศาสตร์',
    level: 'มัธยมศึกษาตอนต้น',
    mediaType: 'slide',
    url: 'https://www.sac.or.th/',
    authorId: 'system_admin',
    authorName: 'ครูกัลยา บุญชู',
    authorEmail: 'kanlaya@soc.example.com',
    viewCount: 180,
    favoriteCount: 34,
    reportCount: 0,
    status: 'published',
    tags: ['ประวัติศาสตร์', 'สังคมศึกษา', 'สไลด์สรุป'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    title: 'ชุดแบบฝึกหัดวิทยาศาสตร์ประถมศึกษา: ระบบสุริยะและวัฏจักรของน้ำ',
    description: 'ใบงานและแบบฝึกหัดเสริมทักษะวิทยาศาสตร์สำหรับเด็กประถม มีภาพระบายสี คำถามทบทวน และการทดลองจำลองเรื่องการเกิดฝนอย่างง่าย',
    category: 'วิทยาศาสตร์',
    level: 'ประถมศึกษา',
    mediaType: 'pdf',
    url: 'https://www.narit.or.th/',
    authorId: 'system_admin',
    authorName: 'ครูแอน พิสมัย',
    authorEmail: 'ann.prim@edu.example.com',
    viewCount: 95,
    favoriteCount: 19,
    reportCount: 0,
    status: 'published',
    tags: ['วิทยาศาสตร์', 'ประถม', 'ระบบสุริยะ', 'ใบงาน'],
    createdAt: new Date().toISOString(),
  },
];

export async function checkAndSeedInitialResources(): Promise<number> {
  try {
    const q = query(collection(db, 'resources'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return 0; // Already has resources
    }

    let seededCount = 0;
    for (const item of INITIAL_RESOURCES) {
      const newDocRef = doc(collection(db, 'resources'));
      await setDoc(newDocRef, {
        ...item,
        id: newDocRef.id,
      });
      seededCount++;
    }
    return seededCount;
  } catch (err) {
    console.error('Error seeding initial resources:', err);
    return 0;
  }
}
