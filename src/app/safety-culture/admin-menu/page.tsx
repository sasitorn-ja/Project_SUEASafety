"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Download,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  CornerDownRight,
  Check,
} from "lucide-react";
import { SafetyCultureHero } from "@/components/safety-culture/safety-culture-hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  MAX_MENU_DEPTH,
  MENU_ICON_NAMES,
  type MenuNode,
  createMenuNode,
  deepCloneMenu,
  countNodes,
  getDefaultMenu,
  getMenuIcon,
  loadMenu,
  normalizeMenu,
  saveMenu,
} from "@/lib/menu-config";

/* ---------- pure tree helpers (immutable) ---------- */

function updateNodeById(nodes: MenuNode[], id: string, patch: Partial<MenuNode>): MenuNode[] {
  return nodes.map((n) =>
    n.id === id
      ? { ...n, ...patch }
      : { ...n, children: updateNodeById(n.children, id, patch) }
  );
}

function removeNodeById(nodes: MenuNode[], id: string): MenuNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, children: removeNodeById(n.children, id) }));
}

function addChildToParent(nodes: MenuNode[], parentId: string, child: MenuNode): MenuNode[] {
  return nodes.map((n) =>
    n.id === parentId
      ? { ...n, children: [...n.children, child] }
      : { ...n, children: addChildToParent(n.children, parentId, child) }
  );
}

function moveSibling(nodes: MenuNode[], id: string, dir: "up" | "down"): MenuNode[] {
  const idx = nodes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= nodes.length) return nodes;
    const copy = [...nodes];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    return copy;
  }
  return nodes.map((n) => ({ ...n, children: moveSibling(n.children, id, dir) }));
}

/* ---------- icon picker ---------- */

function IconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const Selected = getMenuIcon(value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--c-d7c5a7)] bg-white px-2.5 text-[12.5px] font-bold text-[var(--c-5c3214)] hover:bg-[var(--c-fff6d6)]"
      >
        {Selected ? <Selected className="h-4 w-4 text-[var(--c-8b5a12)]" /> : <span className="text-[var(--c-a98a5b)]">— ไม่มี —</span>}
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-[228px] rounded-xl border border-[var(--c-d7c5a7)] bg-white p-2 shadow-[0_12px_28px_rgba(62,36,13,0.16)]">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="mb-1.5 w-full rounded-md px-2 py-1 text-left text-[11.5px] font-bold text-[var(--c-a98a5b)] hover:bg-[var(--c-fff6d6)]"
          >
            — ไม่มีไอคอน —
          </button>
          <div className="grid grid-cols-6 gap-1">
            {MENU_ICON_NAMES.map((name) => {
              const Ico = getMenuIcon(name)!;
              const active = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border",
                    active
                      ? "border-[var(--c-d89b09)] bg-[var(--c-ffb000)] text-[var(--c-3b1d07)]"
                      : "border-transparent text-[var(--c-5c3214)] hover:bg-[var(--c-fff6d6)]"
                  )}
                >
                  <Ico className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- editor row (recursive) ---------- */

type RowProps = {
  node: MenuNode;
  depth: number;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  patch: (id: string, p: Partial<MenuNode>) => void;
  remove: (id: string) => void;
  move: (id: string, dir: "up" | "down") => void;
  addChild: (id: string) => void;
};

function EditorRow({ node, depth, expanded, toggleExpand, patch, remove, move, addChild }: RowProps) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const canHaveChildren = depth < MAX_MENU_DEPTH - 1;

  const depthBg = ["bg-[var(--c-fffaf0)]", "bg-[var(--c-fff6d6)]", "bg-white"][depth] ?? "bg-white";

  return (
    <div className="rounded-xl border border-[var(--c-e4d3b3)]">
      <div className={cn("flex flex-col gap-2 rounded-xl p-2.5", depthBg)}>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleExpand(node.id)}
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--c-8b5a12)] hover:bg-black/5",
              !canHaveChildren && "invisible"
            )}
            aria-label="เปิด/ปิดเมนูย่อย"
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <span className="flex h-6 items-center rounded-full bg-[var(--brand-nav)] px-2 text-[10px] font-black text-white">
            L{depth + 1}
          </span>

          <Input
            value={node.label}
            onChange={(e: any) => patch(node.id, { label: e.target.value })}
            placeholder="ชื่อเมนู"
            className="h-8 flex-1 border-[var(--c-d7c5a7)] bg-white text-[13px] font-bold"
          />

          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => move(node.id, "up")} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--c-8b5a12)] hover:bg-black/5" aria-label="เลื่อนขึ้น">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => move(node.id, "down")} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--c-8b5a12)] hover:bg-black/5" aria-label="เลื่อนลง">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => patch(node.id, { enabled: !node.enabled })}
              className={cn("flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5", node.enabled ? "text-[var(--c-2f7d4f,#2f7d4f)]" : "text-[var(--c-a98a5b)]")}
              aria-label="แสดง/ซ่อน"
              title={node.enabled ? "กำลังแสดง" : "ถูกซ่อน"}
            >
              {node.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => remove(node.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#b3473f] hover:bg-[#fdecea]" aria-label="ลบ">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-[34px]">
          <IconPicker value={node.icon} onChange={(name) => patch(node.id, { icon: name })} />
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[var(--c-a98a5b)]">ลิงก์</span>
            <Input
              value={node.href}
              onChange={(e: any) => patch(node.id, { href: e.target.value })}
              placeholder="/path หรือ https://"
              className="h-8 w-[180px] border-[var(--c-d7c5a7)] bg-white text-[12px]"
            />
          </div>
          <div className="flex flex-1 items-center gap-1">
            <span className="text-[11px] font-bold text-[var(--c-a98a5b)]">คำอธิบาย</span>
            <Input
              value={node.description}
              onChange={(e: any) => patch(node.id, { description: e.target.value })}
              placeholder="คำอธิบายสั้น (ไม่บังคับ)"
              className="h-8 min-w-[140px] flex-1 border-[var(--c-d7c5a7)] bg-white text-[12px]"
            />
          </div>
          {canHaveChildren && (
            <Button
              type="button"
              onClick={() => addChild(node.id)}
              className="h-8 rounded-lg bg-[var(--brand-nav)] px-2.5 text-[11.5px] font-black text-white hover:bg-[var(--brand-nav-active)]"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              เมนูย่อย
            </Button>
          )}
        </div>
      </div>

      {isOpen && canHaveChildren && (
        <div className="flex flex-col gap-2 border-t border-[var(--c-e4d3b3)] p-2.5 pl-5">
          {hasChildren ? (
            node.children.map((child) => (
              <EditorRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggleExpand={toggleExpand}
                patch={patch}
                remove={remove}
                move={move}
                addChild={addChild}
              />
            ))
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--c-d7c5a7)] px-3 py-2 text-[12px] font-bold text-[var(--c-a98a5b)]">
              <CornerDownRight className="h-4 w-4" />
              ยังไม่มีเมนูย่อย — กด “เมนูย่อย” เพื่อเพิ่ม
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- live flyout preview (CPAC style) ---------- */

function PreviewLink({ node }: { node: MenuNode }) {
  const Ico = getMenuIcon(node.icon);
  return (
    <span className="flex items-start gap-2">
      {Ico && <Ico className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--brand-accent)]" strokeWidth={2.3} />}
      <span className="min-w-0">
        <span className="block text-[12.5px] font-extrabold leading-tight text-white">{node.label}</span>
        {node.description && (
          <span className="mt-0.5 block text-[10px] font-semibold leading-tight text-white/60">{node.description}</span>
        )}
      </span>
    </span>
  );
}

function PreviewLevel2({ node }: { node: MenuNode }) {
  const children = node.children.filter((c) => c.enabled);
  const hasFlyout = children.length > 0;
  return (
    <div className="group/lvl2 relative">
      <div className="flex cursor-default items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-white hover:bg-white/10">
        <PreviewLink node={node} />
        {hasFlyout && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/70" />}
      </div>
      {hasFlyout && (
        <div className="invisible absolute left-full top-0 z-50 w-[230px] -translate-x-1 pl-2 opacity-0 transition-all duration-150 group-hover/lvl2:visible group-hover/lvl2:translate-x-0 group-hover/lvl2:opacity-100">
          <div className="rounded-xl border border-white/15 bg-[rgba(var(--brand-nav-rgb),0.98)] p-1.5 shadow-[0_18px_44px_var(--brand-shadow)] backdrop-blur-xl">
            {children.map((c) => (
              <div key={c.id} className="rounded-lg px-2.5 py-2 text-white hover:bg-white/10">
                <PreviewLink node={c} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewTopItem({ node }: { node: MenuNode }) {
  const Ico = getMenuIcon(node.icon);
  const children = node.children.filter((c) => c.enabled);
  const hasMenu = children.length > 0;
  return (
    <div className="group/lvl1 relative">
      <button
        type="button"
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-white/85 hover:bg-white/10 hover:text-white"
      >
        {Ico && <Ico className="h-4 w-4" strokeWidth={2.3} />}
        {node.label}
        {hasMenu && <ChevronDown className="h-3 w-3 transition-transform group-hover/lvl1:rotate-180" />}
      </button>
      {hasMenu && (
        <div className="invisible absolute left-0 top-full z-40 w-[250px] -translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover/lvl1:visible group-hover/lvl1:translate-y-0 group-hover/lvl1:opacity-100">
          <div className="rounded-xl border border-white/15 bg-[rgba(var(--brand-nav-rgb),0.96)] p-1.5 shadow-[0_18px_44px_var(--brand-shadow)] backdrop-blur-xl">
            {children.map((c) => (
              <PreviewLevel2 key={c.id} node={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuPreview({ menu }: { menu: MenuNode[] }) {
  const items = menu.filter((n) => n.enabled);
  return (
    <div className="rounded-2xl bg-[linear-gradient(135deg,var(--brand-hero-start)_0%,var(--brand-nav)_60%,var(--brand-hero-end)_100%)] p-3">
      <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--brand-hero-label)]">
        ตัวอย่างเมนู (ชี้เมาส์เพื่อดูเมนูย่อย)
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {items.length === 0 ? (
          <span className="px-2 py-3 text-[12px] font-bold text-white/60">ยังไม่มีเมนูที่เปิดแสดง</span>
        ) : (
          items.map((node) => <PreviewTopItem key={node.id} node={node} />)
        )}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<MenuNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loaded = loadMenu();
    setMenu(loaded);
    // expand level 1 + level 2 by default
    const ids = new Set<string>();
    loaded.forEach((l1) => {
      if (l1.children.length) ids.add(l1.id);
      l1.children.forEach((l2) => {
        if (l2.children.length) ids.add(l2.id);
      });
    });
    setExpanded(ids);
    setHydrated(true);
  }, []);

  const totalNodes = useMemo(() => countNodes(menu), [menu]);

  const mutate = (updater: (m: MenuNode[]) => MenuNode[]) => {
    setMenu((m) => updater(m));
    setDirty(true);
  };

  const patch = (id: string, p: Partial<MenuNode>) => mutate((m) => updateNodeById(m, id, p));
  const remove = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm("ลบเมนูนี้และเมนูย่อยทั้งหมด?")) return;
    mutate((m) => removeNodeById(m, id));
  };
  const move = (id: string, dir: "up" | "down") => mutate((m) => moveSibling(m, id, dir));
  const addChild = (id: string) => {
    const child = createMenuNode({ label: "เมนูย่อยใหม่" });
    setExpanded((s) => new Set(s).add(id).add(child.id));
    mutate((m) => addChildToParent(m, id, child));
  };
  const addTopLevel = () => {
    const node = createMenuNode({ label: "เมนูหลักใหม่" });
    mutate((m) => [...m, node]);
  };

  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSave = () => {
    saveMenu(menu);
    setSavedAt(Date.now());
    setDirty(false);
  };

  const handleReset = () => {
    if (typeof window !== "undefined" && !window.confirm("คืนค่าเมนูเริ่มต้น? การแก้ไขที่ยังไม่บันทึกจะหายไป")) return;
    setMenu(getDefaultMenu());
    setDirty(true);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(menu, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suea-menu-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeMenu(JSON.parse(String(reader.result)));
        if (parsed && parsed.length) {
          setMenu(parsed);
          setDirty(true);
        } else {
          window.alert("ไฟล์ไม่ถูกต้อง");
        }
      } catch {
        window.alert("อ่านไฟล์ JSON ไม่สำเร็จ");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] bg-[var(--background)] px-3.5 pt-2 pb-10 font-sarabun md:px-4">
      <SafetyCultureHero
        eyebrow="SAFETY CULTURE ADMIN"
        title={
          <>
            จัดการ <span className="text-[var(--brand-accent)]">เมนู</span>
          </>
        }
        description="ออกแบบโครงสร้างเมนูและเมนูย่อยได้ถึง 3 ชั้น ดูตัวอย่าง flyout ทันที แล้วกดบันทึก"
        mascotSrc="/images/mascots/suea-mascot.png"
        mascotAlt="SUEA Admin Mascot"
        mascotAction="radio"
        actions={
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/safety-culture">
              <Button className="h-8 rounded-full border border-white/30 bg-white/10 px-4 text-[12.5px] font-black text-white hover:bg-white/15 md:h-9">
                <ArrowLeft className="mr-1 h-4 w-4" />
                กลับ
              </Button>
            </Link>
          </div>
        }
      />

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--c-e4d3b3)] bg-[var(--c-fffaf0)] p-3">
        <div className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--c-5c3214)]">
          <span className="rounded-lg border border-[var(--c-d7c5a7)] bg-white px-2.5 py-1">
            {menu.length} เมนูหลัก · {totalNodes} รายการ
          </span>
          {dirty ? (
            <span className="rounded-lg border border-[#e2c8c8] bg-[#fff4f4] px-2.5 py-1 text-[#9a4040]">มีการแก้ไขที่ยังไม่บันทึก</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1 rounded-lg border border-[#c7d8be] bg-[#f2fff2] px-2.5 py-1 text-[#245336]">
              <Check className="h-3.5 w-3.5" /> บันทึกแล้ว
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          <Button onClick={() => fileRef.current?.click()} variant="outline" className="h-9 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff6d6)]">
            <Upload className="mr-1 h-4 w-4" /> นำเข้า
          </Button>
          <Button onClick={handleExport} variant="outline" className="h-9 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff6d6)]">
            <Download className="mr-1 h-4 w-4" /> ส่งออก
          </Button>
          <Button onClick={handleReset} variant="outline" className="h-9 rounded-xl border-[var(--c-d7c5a7)] bg-white px-3 text-[12.5px] font-black text-[var(--c-5c3214)] hover:bg-[var(--c-fff6d6)]">
            <RotateCcw className="mr-1 h-4 w-4" /> ค่าเริ่มต้น
          </Button>
          <Button onClick={handleSave} className="h-9 rounded-xl bg-[var(--c-ffb000)] px-4 text-[12.5px] font-black text-[var(--c-3b1d07)] hover:bg-[var(--brand-accent)]">
            <Save className="mr-1 h-4 w-4" /> บันทึก
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        {/* editor */}
        <Card className="rounded-[18px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffaf0)] p-3 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-black text-[var(--c-5c3214)]">โครงสร้างเมนู</h2>
            <Button onClick={addTopLevel} className="h-8 rounded-lg bg-[var(--brand-nav)] px-3 text-[12px] font-black text-white hover:bg-[var(--brand-nav-active)]">
              <Plus className="mr-1 h-4 w-4" /> เมนูหลัก
            </Button>
          </div>
          {!hydrated ? (
            <div className="py-10 text-center text-[13px] font-bold text-[var(--c-a98a5b)]">กำลังโหลด…</div>
          ) : (
            <div className="flex flex-col gap-2">
              {menu.map((node) => (
                <EditorRow
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  patch={patch}
                  remove={remove}
                  move={move}
                  addChild={addChild}
                />
              ))}
              {menu.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--c-d7c5a7)] py-8 text-center text-[13px] font-bold text-[var(--c-a98a5b)]">
                  ยังไม่มีเมนู — กด “เมนูหลัก” เพื่อเริ่ม
                </div>
              )}
            </div>
          )}
        </Card>

        {/* preview */}
        <div className="lg:sticky lg:top-[calc(var(--topbar-h)+12px)] lg:self-start">
          <Card className="rounded-[18px] border border-[var(--c-e4d3b3)] bg-[var(--c-fffaf0)] p-3 shadow-[0_8px_18px_rgba(62,36,13,0.04)]">
            <h2 className="mb-2 text-[15px] font-black text-[var(--c-5c3214)]">ตัวอย่างเมนู</h2>
            {hydrated && <MenuPreview menu={menu} />}
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[var(--c-a98a5b)]">
              เมนูถูกเก็บไว้ในเครื่องนี้ (localStorage) เมื่อกดบันทึก สามารถส่งออกเป็นไฟล์ JSON เพื่อสำรองหรือย้ายไปเครื่องอื่นได้
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
