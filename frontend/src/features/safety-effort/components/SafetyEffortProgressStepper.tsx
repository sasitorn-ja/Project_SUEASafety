"use client";

type SafetyEffortProgressStepperProps = {
  current: number;
  total?: number;
  title?: string;
  compact?: boolean;
};

function CheckIcon() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function SafetyEffortProgressStepper({
  current,
  total = 4,
  title = "SAFETY EFFORT",
  compact = false,
}: SafetyEffortProgressStepperProps) {
  return (
    <div className={compact ? "se-stepper se-stepper-compact" : "se-stepper"}>
      <span className="se-stepper-title">{title}</span>
      <div className="se-stepper-row">
        <div className="se-stepper-track">
          {Array.from({ length: total }, (_, index) => {
            const step = index + 1;
            const isDone = step < current;
            const isActive = step === current;
            const lineActive = step <= current;
            return (
              <div key={step} className="se-stepper-item">
                {step > 1 && (
                  <div
                    className="se-stepper-line"
                    style={{
                      background: lineActive ? "var(--brand-accent)" : "rgba(11, 130, 240, 0.2)",
                    }}
                  />
                )}
                <div
                  className="se-stepper-node"
                  style={{
                    background: isDone ? "#1f7a55" : isActive ? "var(--brand-accent)" : "rgba(11, 130, 240, 0.08)",
                    color: isDone ? "#fff" : isActive ? "var(--c-1a1613)" : "#55739B",
                    boxShadow: isActive ? "0 0 8px rgba(var(--brand-accent-rgb), 0.6)" : "none",
                    border: !isDone && !isActive ? "1px solid rgba(11, 130, 240, 0.22)" : "none",
                  }}
                >
                  {isDone ? <CheckIcon /> : <span>{step}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .se-stepper {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          min-width: 0;
          font-family: 'Prompt', sans-serif;
        }
        .se-stepper-title {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          color: rgba(255, 248, 230, 0.62);
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .se-stepper-row {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .se-stepper-track {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .se-stepper-item {
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .se-stepper-line {
          width: 12px;
          height: 2px;
          transition: all 0.3s;
          border-radius: 99px;
        }
        .se-stepper-node {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11.5px;
          font-weight: 900;
          transition: all 0.3s;
          flex: 0 0 auto;
        }
        .se-stepper-count {
          font-size: 11px;
          color: var(--brand-accent);
          font-weight: 900;
          white-space: nowrap;
        }
        .se-stepper-compact .se-stepper-title {
          display: none;
        }
        .se-stepper-compact .se-stepper-node {
          width: 22px;
          height: 22px;
          font-size: 11.5px;
        }
        .se-stepper-compact .se-stepper-line {
          width: 14px;
          height: 3px;
        }
        @media (max-width: 767px) {
          .se-stepper {
            align-items: flex-end;
            gap: 2px;
          }
          .se-stepper-title {
            font-size: 11.5px;
            letter-spacing: 0.04em;
          }
          .se-stepper-row {
            gap: 5px;
          }
          .se-stepper-track {
            gap: 4px;
          }
          .se-stepper-node {
            width: 22px;
            height: 22px;
            font-size: 11.5px;
          }
          .se-stepper-line {
            width: 14px;
            height: 3px;
          }
          .se-stepper-count {
            font-size: 10.5px;
          }
        }
      `}</style>
    </div>
  );
}
