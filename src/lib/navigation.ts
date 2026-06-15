export const SAFETY_EFFORT_ROUTES = new Set([
  "/category",
  "/checkin",
  "/activity",
  "/create-post",
  "/linewalk",
  "/safety-contact",
  "/assessment-summary",
]);

export function isMainNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/category") return SAFETY_EFFORT_ROUTES.has(pathname) || pathname === "/safety-admin";
  if (href === "/were-ok") return pathname === "/were-ok" || pathname.startsWith("/were-ok/");
  if (href === "/work-permit") return pathname === "/work-permit" || pathname.startsWith("/work-permit/");
  if (href === "/safety-culture") {
    return pathname === "/safety-culture" || pathname.startsWith("/safety-culture/");
  }

  return pathname === href;
}

export function isExactNavActive(pathname: string, href: string) {
  return pathname === href;
}
