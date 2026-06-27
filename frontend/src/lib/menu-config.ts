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
  Download,
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
  Download,
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
              label: "แบบประเมิน",
              href: "/safety-admin",
              icon: "Settings2",
              description: "เพิ่ม แก้ไข และจัดลำดับหัวข้อ Linewalk / Safety Contact",
            }),
            n({
              label: "ประวัติการส่ง",
              href: "/safety-admin/report-history",
              icon: "ClipboardCheck",
              description: "ดูรายงานที่ผู้ใช้ส่งเข้าระบบ",
            }),
            n({
              label: "ส่งออก Excel",
              href: "/safety-admin/export-report",
              icon: "Download",
              description: "ดาวน์โหลดรายงานและแก้ไขข้อมูลก่อนส่งออก",
            }),
            n({
              label: "โรงงาน/สำนักงาน/ไซต์งาน",
              href: "/safety-admin/manage-data",
              icon: "MapPin",
              description: "จัดการ master data สถานที่สำหรับ Check-in",
            }),
          ],
        }),
        n({
          label: "Safety Culture",
          href: "/safety-culture",
          icon: "Heart",
          children: [
            n({
              label: "กิจกรรมบนฟีด",
              href: "/safety-culture/admin-event",
              icon: "Settings2",
              description: "จัดการกิจกรรมและช่วงเวลาพิเศษ",
            }),
            n({
              label: "ทีมและอันดับ",
              href: "/safety-culture/admin-leaderboard",
              icon: "Trophy",
              description: "จัดการทีม คะแนน และอันดับ",
            }),
            n({
              label: "รางวัลและแต้มแลก",
              href: "/safety-culture/admin-reward",
              icon: "Gift",
              description: "จัดการรางวัลและคะแนนแลก",
            }),
          ],
        }),
        n({
          label: "ตั้งค่าคะแนน",
          href: "/safety-culture/admin-points",
          icon: "Star",
          description: "กำหนดคะแนนที่ใช้ในระบบ Safety Culture และ Safety Effort",
        }),
        n({
          label: "จัดการผู้ใช้และสิทธิ์ Admin",
          href: "/safety-culture/admin-users",
          icon: "UserCog",
          description: "จัดการผู้ใช้ Role และสิทธิ์ Admin",
        }),
      ],
    }),
  ];
}

function normalizeNode(raw: any): MenuNode | null {
  if (!raw || typeof raw !== "object") return null;
  if (raw.href === "/safety-culture/admin-menu") return null;
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

function isAdminNode(node: MenuNode) {
  const label = node.label.trim().toLowerCase();
  return node.href === "/safety-admin" || label === "admin" || label === "ผู้ดูแลระบบ";
}

function applyAdminMenuLabels(adminNode: MenuNode) {
  let updated = false;
  const rename = (href: string, label: string, description?: string, icon?: string) => {
    const node = findNodeByHref(adminNode.children, href);
    if (!node) return;
    if (node.label !== label) {
      node.label = label;
      updated = true;
    }
    if (description !== undefined && node.description !== description) {
      node.description = description;
      updated = true;
    }
    if (icon !== undefined && node.icon !== icon) {
      node.icon = icon;
      updated = true;
    }
  };

  if (adminNode.label !== "Admin") {
    adminNode.label = "Admin";
    updated = true;
  }

  rename("/safety-culture/admin-awareness", "Safety Awareness", "จัดการวัน KPI และคลังคำถาม Safety Awareness", "ShieldCheck");
  rename("/category", "Safety Effort", undefined, "ShieldCheck");
  rename("/safety-admin", "แบบประเมิน", "เพิ่ม แก้ไข และจัดลำดับหัวข้อ Linewalk / Safety Contact", "Settings2");
  rename("/safety-admin/report-history", "ประวัติการส่ง", "ดูรายงานที่ผู้ใช้ส่งเข้าระบบ", "ClipboardCheck");
  rename("/safety-admin/export-report", "ส่งออก Excel", "ดาวน์โหลดรายงานและแก้ไขข้อมูลก่อนส่งออก", "Download");
  rename("/safety-admin/manage-data", "โรงงาน/สำนักงาน/ไซต์งาน", "จัดการ master data สถานที่สำหรับ Check-in", "MapPin");
  rename("/safety-culture", "Safety Culture", undefined, "Heart");
  rename("/safety-culture/admin-event", "กิจกรรมบนฟีด", "จัดการกิจกรรมและช่วงเวลาพิเศษ", "Settings2");
  rename("/safety-culture/admin-points", "ตั้งค่าคะแนน", "กำหนดคะแนนที่ใช้ในระบบ Safety Culture และ Safety Effort", "Star");
  rename("/safety-culture/admin-leaderboard", "ทีมและอันดับ", "จัดการทีม คะแนน และอันดับ", "Trophy");
  rename("/safety-culture/admin-reward", "รางวัลและแต้มแลก", "จัดการรางวัลและคะแนนแลก", "Gift");
  rename("/safety-culture/admin-users", "จัดการผู้ใช้และสิทธิ์ Admin", "จัดการผู้ใช้ Role และสิทธิ์ Admin", "UserCog");

  return updated;
}

function findNodeByHref(menu: MenuNode[], href: string): MenuNode | undefined {
  for (const node of menu) {
    if (node.href === href) return node;
    const child = findNodeByHref(node.children, href);
    if (child) return child;
  }
  return undefined;
}

export function loadMenu(): MenuNode[] {
  if (typeof window === "undefined") return getDefaultMenu();
  try {
    const stored = window.localStorage.getItem(MENU_STORAGE_KEY);
    if (stored) {
      const parsed = normalizeMenu(JSON.parse(stored));
      if (parsed && parsed.length > 0) {
        // Migration: ensure "Role" node and "ประวัติส่งรายงาน" node exist under "Admin" section
        const adminNode = parsed.find(isAdminNode);
        if (adminNode) {
          const n = (p: Partial<MenuNode>) => createMenuNode(p);
          let updated = applyAdminMenuLabels(adminNode);

          // Migration: remove the deprecated "Role" (User Role Management) node.
          // Replaced by DB-backed "จัดการผู้ใช้และสิทธิ์ Admin" (/safety-culture/admin-users).
          const beforeRoleRemoval = adminNode.children.length;
          adminNode.children = adminNode.children.filter(
            (child) => child.href !== "/safety-admin/role" && child.label.trim().toLowerCase() !== "role"
          );
          if (adminNode.children.length !== beforeRoleRemoval) {
            updated = true;
          }

          const safetyEffortNode = adminNode.children.find(
            (child) => child.href === "/category" || child.label.trim().toLowerCase() === "safety effort"
          );
          if (safetyEffortNode) {
            const hasReportHistory = safetyEffortNode.children.some(
              (child) =>
                child.href === "/safety-admin/report-history" ||
                child.label.includes("ประวัติส่งรายงาน") ||
                child.label.includes("ประวัติรายงาน") ||
                child.label.includes("ประวัติการส่ง")
            );
            if (!hasReportHistory) {
              safetyEffortNode.children.push(
                n({
                  label: "ประวัติการส่ง",
                  href: "/safety-admin/report-history",
                  icon: "ClipboardCheck",
                  description: "ดูรายงานที่ผู้ใช้ส่งเข้าระบบ",
                })
              );
              updated = true;
            }

            const hasExportReport = safetyEffortNode.children.some(
              (child) =>
                child.href === "/safety-admin/export-report" ||
                child.label.includes("ส่งออกรายงาน") ||
                child.label.includes("ส่งออก Excel")
            );
            if (!hasExportReport) {
              safetyEffortNode.children.push(
                n({
                  label: "ส่งออก Excel",
                  href: "/safety-admin/export-report",
                  icon: "Download",
                  description: "ดาวน์โหลดรายงานและแก้ไขข้อมูลก่อนส่งออก",
                })
              );
              updated = true;
            }

            const hasManageData = safetyEffortNode.children.some(
              (child) =>
                child.href === "/safety-admin/manage-data" ||
                child.label.includes("จัดการข้อมูล") ||
                child.label.includes("ข้อมูลสถานที่") ||
                child.label.includes("โรงงาน")
            );
            if (!hasManageData) {
              safetyEffortNode.children.push(
                n({
                  label: "โรงงาน/สำนักงาน/ไซต์งาน",
                  href: "/safety-admin/manage-data",
                  icon: "MapPin",
                  description: "จัดการ master data สถานที่สำหรับ Check-in",
                })
              );
              updated = true;
            }
          }

          const hasTopLevelPointSettings = adminNode.children.some(
            (child) => child.href === "/safety-culture/admin-points" || child.label.includes("ตั้งค่าคะแนน")
          );
          if (!hasTopLevelPointSettings) {
            adminNode.children.splice(
              1,
              0,
              n({
                label: "ตั้งค่าคะแนน",
                href: "/safety-culture/admin-points",
                icon: "Star",
                description: "กำหนดคะแนนที่ใช้ในระบบ Safety Culture และ Safety Effort",
              })
            );
            updated = true;
          }

          const safetyCultureNode = adminNode.children.find(
            (child) => child.href === "/safety-culture" || child.label.trim().toLowerCase() === "safety culture"
          );
          if (safetyCultureNode) {
            const beforePointRemoval = safetyCultureNode.children.length;
            safetyCultureNode.children = safetyCultureNode.children.filter(
              (child) => child.href !== "/safety-culture/admin-points" && !child.label.includes("ตั้งค่าคะแนน")
            );
            if (safetyCultureNode.children.length !== beforePointRemoval) {
              updated = true;
            }
          }

          // Migration: enforce canonical admin-children order:
          // Safety Awareness → Safety Effort → Safety Culture → ตั้งค่าคะแนน → จัดการผู้ใช้ฯ
          const DESIRED_ADMIN_ORDER = [
            "/safety-culture/admin-awareness",
            "/category",
            "/safety-culture",
            "/safety-culture/admin-points",
            "/safety-culture/admin-users",
          ];
          const currentOrder = adminNode.children.map((c) => c.href);
          const isOrdered = DESIRED_ADMIN_ORDER.every((href, i) => {
            const pos = currentOrder.indexOf(href);
            if (pos === -1) return true;
            const prevHref = DESIRED_ADMIN_ORDER.slice(0, i).find((h) => currentOrder.includes(h));
            return prevHref === undefined || currentOrder.indexOf(prevHref) < pos;
          });
          if (!isOrdered) {
            const byHref = new Map(adminNode.children.map((c) => [c.href, c]));
            const ordered = DESIRED_ADMIN_ORDER.flatMap((href) => (byHref.has(href) ? [byHref.get(href)!] : []));
            const rest = adminNode.children.filter((c) => !DESIRED_ADMIN_ORDER.includes(c.href));
            adminNode.children = [...ordered, ...rest];
            updated = true;
          }

          if (updated) {
            try {
              window.localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(parsed));
            } catch (e) {
              /* ignore quota errors */
            }
          }
        }
        return parsed;
      }
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
  return menu.find(isAdminNode);
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
