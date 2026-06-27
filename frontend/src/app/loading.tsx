export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--brand-accent)] rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">กำลังโหลด...</p>
      </div>
    </div>
  );
}
