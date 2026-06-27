import "swagger-ui-dist/swagger-ui.css";
import type { ReactNode } from "react";

export default function ApiDocsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
