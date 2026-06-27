import { SwaggerUiClient } from "@/components/api-docs/swagger-ui-client";
import { requireApiDocsAccess } from "@backend/components/core/api-docs-access";

export const dynamic = "force-dynamic";

export default async function ApiDocsPage() {
  await requireApiDocsAccess();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="mb-5 rounded-2xl bg-slate-950 px-5 py-4 text-slate-50">
          <h1 className="text-2xl font-semibold">SUEA Safety API Docs</h1>
          <p className="mt-2 text-sm text-slate-300">
            Swagger UI แบบ local bundle ในแอป ไม่ต้องพึ่ง CDN ภายนอก สามารถใช้ &quot;Try it out&quot; กับ API ฝั่งเดียวกัน
            ได้เลย และจะส่ง session cookie ไปด้วยอัตโนมัติ
          </p>
        </div>

        <SwaggerUiClient />
      </div>
    </main>
  );
}
