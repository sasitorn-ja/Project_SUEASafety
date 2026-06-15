import type { NextPageContext } from "next";

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "Sarabun, 'TH Sarabun New', sans-serif",
        background: "var(--background)",
        color: "#0e0f12",
      }}
    >
      <div>
        <h1 style={{ marginBottom: "12px", fontSize: "28px" }}>
          เกิดข้อผิดพลาดในการโหลดหน้า
        </h1>
        <p style={{ margin: 0, opacity: 0.8 }}>
          {statusCode ? `รหัสสถานะ ${statusCode}` : "เกิดข้อผิดพลาดภายในระบบ"}
        </p>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
