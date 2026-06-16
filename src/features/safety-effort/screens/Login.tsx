// @ts-nocheck
import React from "react";
import { useNavigate } from "@/lib/router-compat";
import { Lock } from "lucide-react";
export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simulate login success by redirecting to home page
    navigate("/");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Prompt', 'Sarabun', sans-serif",
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <source src="/images/branding/bg/login-bg2.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay to match image background tone */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.45)",
          zIndex: 1,
        }}
      />

      {/* Top Left Brand Logo (Floating on Desktop, centered header on Mobile) */}
      <div className="top-left-brand">
        <img
          src="/images/CpacLogo.jpg"
          className="cpac-logo-img"
          alt="CPAC Logo"
        />
        <div className="cpac-safety-plus-text">
          <span style={{ color: "#00a2e8", marginRight: 5 }}>CPAC</span>
          <span style={{ color: "#ffffff" }}>Safety+</span>
        </div>
      </div>

      {/* Modern Split Layout Container */}
      <div className="login-container" style={{ zIndex: 2 }}>
        {/* Left Column: Mascot & Brand Text */}
        <div className="mascot-left-panel">
          {/* Main Content: Text + Mascot */}
          <div className="hero-main-content">
            <div className="hero-text-block">
              <div className="en-safety-text">
                SAFETY<br />
                <span className="light-blue">STARTS</span><br />
                WITH US
              </div>
              <div className="th-safety-text">
                <div className="th-dark">ความปลอดภัย</div>
                <div className="th-light">เริ่มต้นที่เรา</div>
              </div>
            </div>

            <div className="hero-mascot-wrapper">
              {/* Desktop Mascot */}
              <img
                className="mascot-left-img mascot-desktop"
                src="/images/WangJai/login.png"
                alt="Mascot Desktop"
              />
              {/* Mobile Mascot */}
              <img
                className="mascot-left-img mascot-mobile"
                src="/images/WangJai/Wangjai2.png"
                alt="Mascot Mobile"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="login-right-panel">
          <div className="login-card">
            {/* Brand/SSO Titles */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
              <h1 className="login-title">
                CPAC Safety+
              </h1>
              <p className="login-subtitle">
                เข้าสู่ระบบเพื่อใช้งานบริการ RMC อย่างปลอดภัย
              </p>
            </div>

            {/* Buttons Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", marginTop: 12 }}>
              {/* SCG Button */}
              <button
                type="button"
                onClick={handleLogin}
                className="login-btn btn-scg"
              >
                <img
                  src="/images/scg.logo.jpg"
                  alt="SCG Logo"
                  style={{ height: 24, width: "auto", objectFit: "contain", marginRight: 2 }}
                />
                <span>พนักงาน SCG เข้าสู่ระบบ</span>
              </button>
            </div>

            {/* Shield verification text */}
            <div className="shield-footer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 11 11 13 15 9" />
              </svg>
              <span>เชื่อมต่ออย่างปลอดภัยด้วยระบบ Single Sign-On</span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styling */}
      <style>{`
        .login-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 460px;
          min-height: 100vh;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding: 86px 32px 40px;
          box-sizing: border-box;
          position: relative;
          margin-top: auto;
          margin-bottom: auto;
        }

        .top-left-brand {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
        }

        .cpac-logo-img {
          height: 32px;
          width: auto;
          object-fit: contain;
          border-radius: 4px;
        }

        .cpac-safety-plus-text {
          font-size: 20px;
          font-weight: 800;
          font-family: 'Prompt', sans-serif;
        }

        .mascot-left-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: none;
          max-width: 220px;
          width: 100%;
          color: #ffffff;
          box-sizing: border-box;
          transform: translateY(-28px);
        }

        .hero-main-content {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          gap: 0;
        }

        .hero-text-block {
          display: none;
        }

        .en-safety-text {
          font-size: 52px;
          font-weight: 900;
          font-style: italic;
          color: #ffffff;
          line-height: 0.95;
          letter-spacing: -0.01em;
          font-family: 'Prompt', sans-serif;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .en-safety-text .light-blue {
          color: #00e5ff;
        }

        .th-safety-text {
          font-size: 26px;
          font-weight: 700;
          font-family: 'Prompt', sans-serif;
          margin-top: 14px;
          line-height: 1.35;
          text-shadow: 0 4px 16px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .th-safety-text .th-dark {
          color: #ffffff;
        }

        .th-safety-text .th-light {
          color: #00e5ff;
          margin-top: 6px;
        }

        .hero-mascot-wrapper {
          flex: none;
          display: flex;
          justify-content: center;
          align-items: center;
          width: clamp(112px, 18vw, 150px);
          max-width: 150px;
          animation: mascotFloatLeft 6s ease-in-out infinite;
          will-change: transform;
        }

        .mascot-left-img {
          width: 100%;
          height: auto;
          max-height: 180px;
          object-fit: contain;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.45));
        }

        .mascot-desktop {
          display: none !important;
        }

        .mascot-mobile {
          display: block !important;
        }

        .login-right-panel {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: none;
          max-width: 440px;
          width: 100%;
        }

        .login-card {
          width: 100%;
          background: rgba(30, 41, 59, 0.75);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 36px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
          padding: 48px 40px 40px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          color: #ffffff;
        }

        .login-title {
          font-size: 38px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          margin: 0;
          letter-spacing: -0.01em;
          text-align: center;
        }

        .login-subtitle {
          font-size: 14.5px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          text-align: center;
          margin: 8px 0 0 0;
          line-height: 1.4;
        }

        .login-btn {
          width: 100%;
          height: 56px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
          box-sizing: border-box;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .btn-scg {
          background: #ffffff;
          color: #1e3e6b;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .btn-scg:hover {
          background: #f8fafc;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        }

        .lock-icon {
          color: #005eff;
          stroke-width: 2.8;
        }

        .footer-links {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 13.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 12px;
        }

        .link-item {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }

        .link-item:hover {
          color: #ffffff;
        }

        .divider {
          color: rgba(255, 255, 255, 0.3);
        }

        .shield-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.55);
          text-align: center;
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 20px;
          margin-top: 4px;
        }

        @keyframes mascotFloatLeft {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1.5deg);
          }
        }

        @media (min-width: 821px) {
          .top-left-brand {
            left: 60px;
            top: 40px;
            transform: none;
          }

          .login-container {
            flex-direction: row;
            max-width: 1240px;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            padding: 80px 60px 40px;
            margin-left: auto;
            margin-right: auto;
            gap: 40px;
          }

          .mascot-left-panel {
            max-width: 740px;
            width: 100%;
            transform: none;
            align-items: flex-start;
          }

          .hero-main-content {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 40px;
            width: 100%;
          }

          .hero-text-block {
            display: block;
            text-align: left;
          }

          .en-safety-text {
            font-size: 56px;
            line-height: 0.95;
          }

          .th-safety-text {
            font-size: 26px;
            margin-top: 16px;
          }

          .hero-mascot-wrapper {
            width: 360px;
            max-width: 400px;
            animation: mascotFloatLeft 6s ease-in-out infinite;
          }

          .mascot-left-img {
            max-height: 480px;
          }

          .mascot-desktop {
            display: block !important;
          }

          .mascot-mobile {
            display: none !important;
          }

          .login-right-panel {
            max-width: 440px;
            width: 100%;
            flex: none;
          }
        }

        @media (max-width: 900px) {
          .en-safety-text {
            font-size: 42px;
          }
          .th-safety-text {
            font-size: 22px;
          }
        }

        @media (max-width: 820px) {
          .top-left-brand {
            position: absolute;
            top: 26px;
            left: 50%;
            transform: translateX(-50%);
            justify-content: center;
          }

          .login-container {
            justify-content: center;
            gap: 14px;
            padding: 76px 24px 32px;
          }

          .mascot-left-panel {
            align-items: center;
            flex: none;
            max-width: 280px;
            width: 100%;
            transform: translateY(-22px);
          }

          .hero-main-content {
            justify-content: center;
            align-items: center;
          }

          .hero-text-block {
            display: none;
          }

          .hero-mascot-wrapper {
            width: clamp(140px, 35vw, 240px);
            max-width: 240px;
            animation: mascotFloatMobile 5s ease-in-out infinite;
          }

          .mascot-left-img {
            max-height: 250px;
          }

          .login-right-panel {
            max-width: 440px;
            flex: none;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            gap: 12px;
            padding: 72px 16px 28px;
          }

          .hero-mascot-wrapper {
            width: clamp(130px, 42vw, 190px);
            max-width: 190px;
          }

          .mascot-left-img {
            max-height: 200px;
          }

          .login-card {
            padding: 32px 24px 28px 24px;
            border-radius: 28px;
            gap: 20px;
          }

          .login-title {
            font-size: 32px;
          }

          .login-subtitle {
            font-size: 13px;
          }

          .login-btn {
            height: 52px;
            font-size: 15px;
            border-radius: 14px;
          }

          .footer-links {
            font-size: 12px;
          }
        }

        @keyframes mascotFloatMobile {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(1deg);
          }
        }
      `}</style>
    </div>
  );
}
