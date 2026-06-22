// @ts-nocheck
import React, { useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/app-navigation";
import { Lock, Info } from "lucide-react";
import { isLocalDemoLoginHost } from "@/lib/session-user";

const LOGIN_SESSION_KEY = "cpac-safety-login-session";

export default function Login() {
  const navigate = useNavigate();

  const ssoError = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("sso_error") || "";
  }, []);

  const demoLoginAvailable = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      process.env.NODE_ENV !== "production" &&
      isLocalDemoLoginHost(window.location.hostname)
    );
  }, []);

  const handleDemoLogin = () => {
    try {
      window.sessionStorage.setItem(LOGIN_SESSION_KEY, "true");
    } catch {
      // The demo login still navigates home even without storage.
    }
    navigate("/");
  };

  useEffect(() => {
    try {
      window.sessionStorage.removeItem(LOGIN_SESSION_KEY);
    } catch {
      // Keep the login screen usable if browser storage is unavailable.
    }
  }, []);

  const handleLogin = () => {
    window.location.assign("/api/auth/login");
  };

  return (
    <main className="cpac-login-page">
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src="/images/login/bg/login-bg2.mp4" type="video/mp4" />
      </video>

      <div className="bg-image" />
      <div className="bg-overlay" />
      <div className="right-focus-gradient" />
      <div className="hero-glow hero-glow-left" />
      <div className="hero-glow hero-glow-card" />

      {demoLoginAvailable && (
        <button
          type="button"
          onClick={handleDemoLogin}
          className="top-demo-btn"
          title="Demo Login"
        >
          <Lock size={13} />
          <span>Demo Login</span>
        </button>
      )}

      <section className="login-shell">
        <div className="hero-section">
          <div className="hero-copy">
            <h1 className="hero-title">
              <span>SAFETY</span>
              <span className="cyan">STARTS</span>
              <span>WITH US</span>
            </h1>

            <div className="hero-line" />

            <p className="hero-subtitle">
              ความปลอดภัย <span>เริ่มต้นที่เรา</span>
            </p>
          </div>

          <div className="mascot-wrap" aria-hidden="true">
            <div className="mascot-halo" />
            <img
              className="mascot-img mascot-motion mascot-motion-hero"
              src="/images/login/Video/WangJaiLogin.gif"
              alt="WangJai Mascot"
            />
          </div>
        </div>

        <aside className="login-panel" aria-label="CPAC Safety+ Login">
          <div className="login-card">
            <div className="card-shine" />

            <div className="brand-block">
              <img
                className="brand-logo"
                src="/images/login/brand/LOGO2.png"
                alt="CPAC Safety+"
              />

              <p>เข้าสู่ระบบเพื่อใช้งานบริการ CPAC Safety+ อย่างปลอดภัย</p>
            </div>

            <div className="action-block">
              <button type="button" onClick={handleLogin} className="scg-login-btn">
                <span className="scg-logo-badge">
                  <img
                    src="/images/login/brand/scg.logo.jpg"
                    alt="SCG"
                  />
                </span>
                <span>พนักงาน SCG เข้าสู่ระบบ</span>
              </button>

              {ssoError && (
                <div className="sso-error-card">
                  <Info size={18} />
                  <div>
                    <strong>ไม่สามารถเชื่อมต่อ SSO ได้</strong>
                    <p>รหัส: {ssoError}</p>
                    {ssoError.startsWith("missing:") && (
                      <p>
                        กรุณาตรวจสอบ SSO_CLIENT_ID และ SSO_CLIENT_SECRET
                        บนเซิร์ฟเวอร์
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <footer className="secure-footer">
              <div>
                <Lock size={15} />
                <span>เชื่อมต่ออย่างปลอดภัยด้วยระบบ Single Sign-On</span>
              </div>
              <small>Bethezank Lab 2026</small>
            </footer>
          </div>
        </aside>
      </section>

      <style>{`
        .cpac-login-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          font-family: 'Prompt', 'Sarabun', system-ui, sans-serif;
          color: #ffffff;
          background: #06152b;
        }

        .bg-image,
        .bg-video,
        .bg-overlay,
        .right-focus-gradient,
        .hero-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .bg-image {
          background-image: url('/images/login/bg/login-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .bg-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          opacity: 0.75;
        }

        .bg-overlay {
          z-index: 2;
          background:
            linear-gradient(90deg,
              rgba(4, 24, 51, 0.40) 0%,
              rgba(5, 28, 57, 0.38) 38%,
              rgba(3, 11, 26, 0.78) 68%,
              rgba(2, 8, 20, 0.94) 100%
            ),
            linear-gradient(180deg,
              rgba(7, 34, 70, 0.18) 0%,
              rgba(3, 10, 23, 0.45) 100%
            );
        }

        .right-focus-gradient {
          z-index: 3;
          background:
            radial-gradient(circle at 80% 45%,
              rgba(0, 229, 255, 0.16) 0%,
              rgba(0, 126, 255, 0.06) 24%,
              transparent 48%
            ),
            radial-gradient(circle at 38% 42%,
              rgba(0, 229, 255, 0.16) 0%,
              transparent 30%
            );
        }

        .hero-glow {
          z-index: 4;
          filter: blur(30px);
        }

        .hero-glow-left {
          background: radial-gradient(circle at 14% 38%, rgba(0, 178, 255, 0.26), transparent 30%);
        }

        .hero-glow-card {
          background: radial-gradient(circle at 80% 50%, rgba(0, 229, 255, 0.16), transparent 30%);
        }

        .login-shell {
          position: relative;
          z-index: 5;
          min-height: 100vh;
          width: min(100%, 1680px);
          margin: 0 auto;
          padding: clamp(28px, 5vw, 80px);
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(420px, 0.78fr);
          align-items: center;
          gap: clamp(24px, 4vw, 72px);
          box-sizing: border-box;
        }

        .hero-section {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(380px, 0.92fr) minmax(240px, 0.62fr);
          align-items: center;
          gap: clamp(10px, 2vw, 34px);
        }

        .hero-copy {
          transform: translateY(10px);
        }

        .hero-title {
          margin: 0;
          display: flex;
          flex-direction: column;
          font-size: clamp(56px, 6.3vw, 112px);
          line-height: 0.93;
          letter-spacing: -0.055em;
          font-weight: 950;
          font-style: italic;
          color: #ffffff;
          text-transform: uppercase;
          text-shadow:
            0 4px 0 rgba(0, 0, 0, 0.25),
            0 13px 25px rgba(0, 0, 0, 0.65),
            0 26px 60px rgba(0, 0, 0, 0.50);
        }

        .hero-title .cyan {
          color: #00e5ff;
          text-shadow:
            0 4px 0 rgba(0, 95, 125, 0.40),
            0 13px 25px rgba(0, 0, 0, 0.65),
            0 0 30px rgba(0, 229, 255, 0.35);
        }

        .hero-line {
          width: min(420px, 82%);
          height: 3px;
          margin: clamp(22px, 2.2vw, 36px) 0 clamp(16px, 1.8vw, 26px);
          border-radius: 99px;
          background: linear-gradient(90deg, #00e5ff, rgba(0, 229, 255, 0.12));
          box-shadow: 0 0 24px rgba(0, 229, 255, 0.55);
        }

        .hero-subtitle {
          margin: 0;
          font-size: clamp(26px, 2.55vw, 46px);
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: rgba(255, 255, 255, 0.96);
          text-shadow:
            0 5px 12px rgba(0, 0, 0, 0.78),
            0 18px 32px rgba(0, 0, 0, 0.45);
          white-space: nowrap;
        }

        .hero-subtitle span {
          color: #00e5ff;
          margin-left: 10px;
          text-shadow:
            0 5px 12px rgba(0, 0, 0, 0.78),
            0 0 22px rgba(0, 229, 255, 0.28);
        }

        .mascot-wrap {
          position: relative;
          width: min(44vw, 550px);
          min-width: 320px;
          justify-self: center;
          transform: translate(-4%, -7%);
          animation: mascotFloat 6s ease-in-out infinite;
        }

        .mascot-halo {
          position: absolute;
          inset: 12% 4% 12% 2%;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(0, 229, 255, 0.34), rgba(0, 145, 255, 0.10) 42%, transparent 70%);
          filter: blur(18px);
          transform: scale(1.08);
        }

        .mascot-img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: auto;
          display: block;
          filter:
            drop-shadow(0 28px 42px rgba(0, 0, 0, 0.50))
            drop-shadow(0 0 18px rgba(0, 229, 255, 0.18));
        }

        .login-panel {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .login-card {
          width: min(100%, 560px);
          min-height: 380px;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          padding: clamp(20px, 2.5vw, 32px) clamp(34px, 3.5vw, 56px);
          border-radius: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(14px, 1.8vw, 22px);
          background:
            linear-gradient(155deg,
              rgba(22, 45, 76, 0.92) 0%,
              rgba(7, 22, 43, 0.94) 48%,
              rgba(3, 13, 29, 0.98) 100%
            );
          border: 1px solid rgba(161, 220, 255, 0.54);
          box-shadow:
            0 0 0 1px rgba(0, 229, 255, 0.14) inset,
            0 0 38px rgba(0, 229, 255, 0.22),
            0 34px 90px rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(28px) saturate(130%);
          -webkit-backdrop-filter: blur(28px) saturate(130%);
        }

        .login-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg,
            rgba(0, 229, 255, 0.85),
            rgba(255, 255, 255, 0.34) 28%,
            rgba(0, 92, 255, 0.18) 62%,
            rgba(255, 255, 255, 0.26)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .card-shine {
          position: absolute;
          top: -40%;
          left: -35%;
          width: 80%;
          height: 70%;
          transform: rotate(28deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
          filter: blur(14px);
        }

        .brand-block {
          position: relative;
          z-index: 1;
          width: 100%;
          text-align: center;
        }

        .brand-logo {
          width: min(72%, 300px);
          height: auto;
          display: block;
          margin: -10px auto -18px;
          filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45));
        }

        .brand-block h2 {
          margin: 0;
          font-size: clamp(25px, 2.15vw, 38px);
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -0.035em;
          color: #ffffff;
          text-shadow: 0 10px 28px rgba(0, 0, 0, 0.36);
        }

        .brand-block p {
          margin: 4px 0 0;
          font-size: clamp(14px, 1.05vw, 18px);
          line-height: 1.55;
          font-weight: 500;
          color: rgba(226, 241, 255, 0.70);
        }

        .action-block {
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .scg-login-btn {
          width: 100%;
          min-height: 72px;
          border: 0;
          border-radius: 24px;
          cursor: pointer;
          font-family: inherit;
          font-size: clamp(16px, 1.2vw, 21px);
          font-weight: 850;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            filter 220ms ease;
        }

        .scg-login-btn {
          color: #ffffff;
          background:
            linear-gradient(180deg, rgba(45, 139, 255, 1) 0%, rgba(27, 94, 218, 1) 48%, rgba(13, 74, 188, 1) 100%);
          border: 1px solid rgba(174, 227, 255, 0.70);
          box-shadow:
            0 14px 28px rgba(0, 86, 220, 0.40),
            0 0 28px rgba(0, 229, 255, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.40),
            inset 0 -12px 24px rgba(0, 45, 135, 0.30);
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.30);
        }

        .scg-login-btn:hover {
          transform: translateY(-3px);
          filter: brightness(1.07);
          box-shadow:
            0 18px 38px rgba(0, 86, 220, 0.52),
            0 0 36px rgba(0, 229, 255, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.48),
            inset 0 -12px 24px rgba(0, 45, 135, 0.30);
        }

        .scg-login-btn:active {
          transform: translateY(0);
        }

        .scg-logo-badge {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          flex: none;
          display: grid;
          place-items: center;
          background: #ffffff;
          box-shadow:
            0 10px 18px rgba(0, 0, 0, 0.20),
            inset 0 0 0 1px rgba(255, 255, 255, 0.75);
          overflow: hidden;
        }

        .scg-logo-badge img {
          width: 31px;
          height: auto;
          display: block;
          object-fit: contain;
        }



        .sso-error-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
          padding: 16px;
          border-radius: 18px;
          color: #e8f5ff;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .sso-error-card svg {
          color: #5dbdff;
          margin-top: 2px;
        }

        .sso-error-card strong {
          display: block;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .sso-error-card p {
          margin: 0 0 4px;
          font-size: 12px;
          line-height: 1.45;
          color: #ffb4b4;
          word-break: break-word;
        }

        .secure-footer {
          position: relative;
          z-index: 1;
          width: 100%;
          padding-top: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          color: rgba(226, 241, 255, 0.68);
          text-align: center;
        }

        .secure-footer div {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          font-size: clamp(12px, 0.9vw, 15px);
          font-weight: 650;
        }

        .secure-footer svg {
          color: rgba(226, 241, 255, 0.72);
        }

        .secure-footer small {
          font-size: 12px;
          color: rgba(226, 241, 255, 0.42);
        }

        @keyframes mascotFloat {
          0%, 100% {
            transform: translate(-4%, -7%) rotate(0deg);
          }
          50% {
            transform: translate(-4%, -11%) rotate(1.5deg);
          }
        }

        @media (max-width: 1280px) {
          .login-shell {
            grid-template-columns: 1fr 460px;
            gap: 30px;
          }

          .hero-section {
            grid-template-columns: 1fr;
          }

          .mascot-wrap {
            position: absolute;
            width: 380px;
            min-width: 0;
            left: 40%;
            top: 24%;
          }

          .hero-title {
            font-size: clamp(58px, 7.2vw, 92px);
          }
        }

        @media (max-width: 1024px) {
          .cpac-login-page {
            overflow-y: auto;
          }

          .login-shell {
            min-height: 100vh;
            grid-template-columns: 1fr;
            justify-items: center;
            align-content: center;
            padding: 34px 22px;
            gap: 22px;
          }

          .hero-section {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .hero-copy {
            display: none;
          }

          .mascot-wrap {
            position: relative;
            left: auto;
            top: auto;
            width: clamp(280px, 60vw, 420px);
            transform: none;
            animation: mascotFloatMobile 5.5s ease-in-out infinite;
          }

          .login-panel {
            width: 100%;
          }

          .login-card {
            width: min(100%, 480px);
            min-height: auto;
            padding: 18px 24px 16px;
            border-radius: 34px;
            gap: 14px;
          }

          .brand-logo {
            width: min(68%, 245px);
            margin-top: -10px;
            margin-bottom: -12px;
          }
        }

        @media (max-width: 520px) {
          .login-shell {
            padding: 24px 16px;
          }

          .login-card {
            border-radius: 28px;
          }

          .brand-block h2 {
            font-size: 22px;
          }

          .brand-block p {
            font-size: 13px;
          }

          .scg-login-btn {
            min-height: 58px;
            border-radius: 18px;
            font-size: 15px;
            gap: 10px;
          }

          .scg-logo-badge {
            width: 36px;
            height: 36px;
          }

          .scg-logo-badge img {
            width: 25px;
          }

          .secure-footer div {
            font-size: 11.5px;
          }
        }

        .top-demo-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }

        .top-demo-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          border-color: rgba(0, 229, 255, 0.4);
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.2);
        }

        .top-demo-btn:active {
          transform: translateY(1px);
        }

        @media (max-width: 520px) {
          .top-demo-btn {
            top: 12px;
            right: 12px;
            padding: 6px 10px;
            font-size: 12px;
          }
        }

        @keyframes mascotFloatMobile {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }
      `}</style>
    </main>
  );
}
