import {
  Home,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  ClipboardCheck,
  Heart,
  UserRound,
  Trophy,
  Gift,
  Settings2,
  FileText,
  Bell,
  Truck,
  Wrench,
  MapPin,
  Megaphone,
  Sparkles,
  Star,
  BookOpen,
  Link2,
  UserCog,
  type LucideIcon,
} from "lucide-react";

/**
 * โครงสร้างเมนูแบบ 3 ชั้น (recursive)
 *  - ชั้น 1: เมนูหลักบน topbar (เช่น สินค้าและบริการ)
 *  - ชั้น 2: หมวดย่อย (เช่น บริการงานคอนกรีต)
 *  - ชั้น 3: รายการย่อย / flyout (เช่น CPAC EASY PUMP)
 */
export type MenuNode = {
  id: string;
  label: string;
  /** เส้นทางลิงก์ ปล่อยว่างได้ถ้าใช้เป็นหัวข้อกลุ่มเท่านั้น */
  href: string;
  /** ชื่อไอคอนจาก MENU_ICONS ปล่อยว่างได้ */
  icon?: string;
  /** คำอธิบายสั้น แสดงใต้ชื่อในเมนู */
  description?: string;
  /** เปิด/ปิดการแสดงผล */
  enabled: boolean;
  children: MenuNode[];
};

export const MENU_STORAGE_KEY = "suea-safety-menu-config-v4";
export const MENU_UPDATED_EVENT = "suea-safety-menu-updated";
export const MAX_MENU_DEPTH = 3;

/** ไอคอนที่เลือกใช้ได้ในตัวจัดการเมนู (mapping ชื่อ -> component) */
export const MENU_ICONS: Record<string, LucideIcon> = {
  Home,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  ClipboardCheck,
  Heart,
  UserRound,
  Trophy,
  Gift,
  Settings2,
  FileText,
  Bell,
  Truck,
  Wrench,
  MapPin,
  Megaphone,
  Sparkles,
  Star,
  BookOpen,
  Link2,
  UserCog,
};

export const MENU_ICON_NAMES = Object.keys(MENU_ICONS);

export function getMenuIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  return MENU_ICONS[name] ?? null;
}

let idCounter = 0;
export function createMenuId(prefix = "node"): string {
  idCounter += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${rand}`;
}

export function createMenuNode(partial: Partial<MenuNode> = {}): MenuNode {
  return {
    id: partial.id ?? createMenuId(),
    label: partial.label ?? "เมนูใหม่",
    href: partial.href ?? "",
    icon: partial.icon ?? "",
    description: partial.description ?? "",
    enabled: partial.enabled ?? true,
    children: partial.children ?? [],
  };
}

/** เมนูเริ่มต้น seed จากโครงสร้างเมนูปัจจุบันของแอป */
export function getDefaultMenu(): MenuNode[] {
  const n = (p: Partial<MenuNode>) => createMenuNode(p);
  return [
    n({ label: "Home", href: "/", icon: "Home" }),
    n({ label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" }),
    n({ label: "Safety Effort", href: "/category", icon: "ShieldCheck" }),
    n({
      label: "Safety Culture",
      href: "/safety-culture",
      icon: "Heart",
      children: [
        n({
          label: "Feed",
          href: "/safety-culture",
          icon: "Heart",
          description: "แชร์พฤติกรรมความปลอดภัยและเรื่องราวของทีม",
        }),
        n({
          label: "Leaderboard",
          href: "/safety-culture/leaderboard",
          icon: "Trophy",
          description: "ติดตามอันดับของทีมและส่วนตัว",
        }),
        n({
          label: "Rewards",
          href: "/safety-culture/rewards",
          icon: "Gift",
          description: "ดูคะแนนและรางวัลที่แลกได้",
        }),
      ],
    }),
    n({
      label: "Admin",
      href: "/safety-admin",
      icon: "UserRound",
      children: [
        n({
          label: "Safety Awareness",
          href: "/safety-culture/admin-awareness",
          icon: "ShieldCheck",
          description: "จัดการวัน KPI และคลังคำถาม Safety Awareness",
        }),
        n({
          label: "Safety Effort",
          href: "/category",
          icon: "ShieldCheck",
          children: [
            n({
              label: "Settings",
              href: "/safety-admin",
              icon: "Settings2",
              description: "จัดการแบบประเมินและรายการตรวจ Safety Effort",
            }),
          ],
        }),
        n({
          label: "Safety Culture",
          href: "/safety-culture",
          icon: "Heart",
          children: [
            n({
              label: "Edit Event",
              href: "/safety-culture/admin-event",
              icon: "Settings2",
              description: "จัดการกิจกรรมและช่วงเวลาพิเศษ",
            }),
            n({
              label: "Edit Leaderboard",
              href: "/safety-culture/admin-leaderboard",
              icon: "Trophy",
              description: "จัดการทีม คะแนน และอันดับ",
            }),
            n({
              label: "Edit Reward",
              href: "/safety-culture/admin-reward",
              icon: "Gift",
              description: "จัดการรางวัลและคะแนนแลก",
            }),
          ],
        }),
        n({
          label: "จัดการผู้ใช้และสิทธิ์ Admin",
          href: "/safety-culture/admin-users",
          icon: "UserCog",
          description: "จัดการผู้ใช้ Role และสิทธิ์ Admin จาก DB",
        }),
      ],
    }),
  ];
}

function normalizeNode(raw: any): MenuNode | null {
  if (!raw || typeof raw !== "object") return null;
  if (["/were-ok", "/work-permit", "/safety-culture/admin-menu"].includes(raw.href)) return null;
  const children = Array.isArray(raw.children)
    ? (raw.children.map(normalizeNode).filter(Boolean) as MenuNode[])
    : [];
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createMenuId(),
    label: typeof raw.label === "string" ? raw.label : "เมนู",
    href: typeof raw.href === "string" ? raw.href : "",
    icon: typeof raw.icon === "string" ? raw.icon : "",
    description: typeof raw.description === "string" ? raw.description : "",
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : true,
    children,
  };
}

export function normalizeMenu(raw: any): MenuNode[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map(normalizeNode).filter(Boolean) as MenuNode[];
}

export function loadMenu(): MenuNode[] {
  if (typeof window === "undefined") return getDefaultMenu();
  try {
    const stored = window.localStorage.getItem(MENU_STORAGE_KEY);
    if (stored) {
      const parsed = normalizeMenu(JSON.parse(stored));
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback to default */
  }
  return getDefaultMenu();
}

export function saveMenu(menu: MenuNode[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
    window.dispatchEvent(new CustomEvent(MENU_UPDATED_EVENT));
  } catch {
    /* ignore quota errors */
  }
}

export function findAdminMenu(menu: MenuNode[]): MenuNode | undefined {
  return menu.find((node) => node.href === "/safety-admin" || node.label.trim().toLowerCase() === "admin");
}

export function deepCloneMenu(menu: MenuNode[]): MenuNode[] {
  return menu.map((node) => ({
    ...node,
    children: deepCloneMenu(node.children),
  }));
}

export function countNodes(menu: MenuNode[]): number {
  return menu.reduce((acc, node) => acc + 1 + countNodes(node.children), 0);
}
