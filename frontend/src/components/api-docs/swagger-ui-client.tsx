"use client";

import { useEffect, useRef } from "react";
import SwaggerUI from "swagger-ui-dist/swagger-ui-bundle.js";

export function SwaggerUiClient() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ui = SwaggerUI({
      url: "/api/openapi",
      domNode: containerRef.current,
      deepLinking: true,
      docExpansion: "list",
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: (request: RequestInit & { credentials?: RequestCredentials }) => {
        request.credentials = "include";
        return request;
      },
    });

    return () => {
      ui?.destroy?.();
    };
  }, []);

  return <div ref={containerRef} />;
}
