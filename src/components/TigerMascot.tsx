// @ts-nocheck
const mascotLogo = "/images/mascots/suea-mascot-logo.png";
const sueaShield = "/images/mascots/suea-shield.png";
const sueaThumbsUp = "/images/mascots/suea-thumbs-up.png";

const ACTION_IMAGE_MAP = {
  big: mascotLogo,
  "thumbs-up": sueaThumbsUp,
  salute: mascotLogo,
  radio: mascotLogo,
  stop: sueaShield,
  danger: sueaShield,
  shield: sueaShield,
  clipboard: mascotLogo,
  flashlight: sueaShield,
  whistle: mascotLogo,
  running: mascotLogo,
  smile: mascotLogo,
  happy: sueaThumbsUp,
};

const ANIMATION_CLASS_MAP = {
  none: "",
  float: "anim-float",
  wave: "anim-wave",
  bounce: "anim-bounce",
  run: "anim-run",
  pulse: "anim-pulse",
  wiggle: "anim-wiggle",
};

export default function TigerMascot({
  action = "big",
  size = "120px",
  animation = "none",
  style = {},
  className = "",
  ...props
}) {
  const image = ACTION_IMAGE_MAP[action] || mascotLogo;
  const animationClass = ANIMATION_CLASS_MAP[animation] || "";

  return (
    <>
      <style>{`
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes mascot-wave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg) translateY(-2px); }
        }
        @keyframes mascot-bounce {
          0%, 100% { transform: translateY(0) scaleY(1); }
          40% { transform: translateY(-12px) scaleY(1.02); }
          60% { transform: translateY(2px) scaleY(0.97); }
        }
        @keyframes mascot-run {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(2deg); }
          75% { transform: translateY(-2px) rotate(-2deg); }
        }
        @keyframes mascot-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes mascot-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }

        .anim-float { animation: mascot-float 3s ease-in-out infinite; }
        .anim-wave { animation: mascot-wave 2.2s ease-in-out infinite; }
        .anim-bounce { animation: mascot-bounce 1.5s ease-in-out infinite; }
        .anim-run { animation: mascot-run 0.6s linear infinite; }
        .anim-pulse { animation: mascot-pulse 2s ease-in-out infinite; }
        .anim-wiggle { animation: mascot-wiggle 0.5s ease-in-out infinite; }
      `}</style>
      <img
        className={`${className} ${animationClass}`.trim()}
        src={image}
        alt="SUEA mascot"
        style={{
          width: size,
          height: "auto",
          display: "inline-block",
          flexShrink: 0,
          objectFit: "contain",
          transition: "transform 0.2s ease, filter 0.2s ease",
          ...style,
        }}
        {...props}
      />
    </>
  );
}
