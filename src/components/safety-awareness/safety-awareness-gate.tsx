"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { useAppActions, useAppState } from "@/providers/app-providers";
import { useAppTheme } from "@/providers/theme-provider";
import { pickRandom, type SafetyAwarenessQuestion } from "@/lib/safety-awareness";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const QUESTIONS_PER_DAY = 3;

/**
 * Blocking, non-dismissable popup shown on the first visit of each day.
 * Draws 3 random enabled questions, gives instant per-question feedback (เฉลย),
 * and cannot be closed until all questions are answered.
 */
export function SafetyAwarenessGate() {
  const { awarenessQuestions, awarenessDoneToday, awarenessRequiredToday } = useAppState();
  const { markAwarenessDone } = useAppActions();
  const { mascot } = useAppTheme();

  const [mounted, setMounted] = useState(false);
  const [quiz, setQuiz] = useState<SafetyAwarenessQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  // Answers stay editable until the user presses "ตรวจคำตอบ"; only then is the
  // เฉลย (answer key) revealed — so changing a pick beforehand can't be used to copy it.
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => setMounted(true), []);

  const enabled = useMemo(
    () => awarenessQuestions.filter((q) => q.enabled),
    [awarenessQuestions],
  );

  // Build the day's quiz exactly once, when the gate should open.
  useEffect(() => {
    if (!mounted || awarenessDoneToday || !awarenessRequiredToday || enabled.length === 0 || quiz.length > 0) return;
    setQuiz(pickRandom(enabled, QUESTIONS_PER_DAY));
  }, [mounted, awarenessDoneToday, awarenessRequiredToday, enabled, quiz.length]);

  const open = mounted && awarenessRequiredToday && !awarenessDoneToday && quiz.length > 0;

  // Lock background scrolling while the gate is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const answeredCount = quiz.filter((q) => q.id in answers).length;
  const allAnswered = answeredCount === quiz.length;
  const correctCount = quiz.filter((q) => answers[q.id] === q.answer).length;

  const choose = (question: SafetyAwarenessQuestion, value: boolean) => {
    // Freely selectable / changeable until the answers are checked.
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  return (
    <Dialog open={open}>
      <DialogContent
      showCloseButton={false}
      aria-label="Safety Awareness"
      className="z-[100000] max-h-[calc(100vh-3rem)] w-full max-w-[560px] overflow-hidden rounded-[22px] border-[2px] border-[var(--brand-accent)] bg-[var(--background)] p-0 font-sarabun shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
    >
        {/* Header */}
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,var(--brand-hero-start)_0%,var(--brand-nav)_55%,var(--brand-hero-end)_100%)] px-5 pb-4 pt-4 text-white">
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(-45deg,var(--brand-accent),var(--brand-accent)_10px,#1a1a1a_10px,#1a1a1a_20px)]" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-[var(--brand-accent)]">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.3} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-hero-label)]">
                แบบทดสอบประจำวัน
              </span>
              <h2 className="text-[20px] font-black leading-tight">Safety Awareness</h2>
            </div>
            <Image
              src={mascot("gateHappy")}
              alt=""
              width={66}
              height={66}
              className="mascot-motion mascot-motion-compact pointer-events-none hidden h-[66px] w-[66px] object-contain sm:block"
            />
          </div>
          <p className="relative mt-2 text-[12.5px] font-bold leading-relaxed text-white/85">
            ตอบคำถามความปลอดภัย {quiz.length} ข้อ ก่อนเริ่มใช้งานในแต่ละวัน — ตอบครบทุกข้อจึงจะเข้าใช้งานได้
          </p>
          <div className="relative mt-2.5 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[var(--brand-accent)] transition-[width] duration-300 ease-out"
                style={{ width: `${(answeredCount / quiz.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-black text-white/90">
              {answeredCount}/{quiz.length}
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="max-h-[58vh] overflow-y-auto px-4 py-4 md:px-5">
          <div className="flex flex-col gap-3">
            {quiz.map((question, index) => {
              const picked = answers[question.id];
              const isCorrect = submitted && picked === question.answer;

              return (
                <div
                  key={question.id}
                  className="rounded-2xl border-[1.5px] border-[var(--border)] bg-[var(--brand-surface)] p-3.5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-nav)] text-[12px] font-black text-[var(--brand-accent)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="mb-1 inline-block rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--brand-text)]/70">
                        {question.category}
                      </span>
                      <p className="text-[14px] font-bold leading-relaxed text-[var(--brand-text)]">
                        {question.text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {([true, false] as const).map((value) => {
                      const label = value ? "ถูก" : "ผิด";
                      const selected = picked === value;
                      const isAnswerOption = question.answer === value;

                      let cls =
                        "flex h-10 items-center justify-center gap-1.5 rounded-xl border-[1.5px] text-[14px] font-black transition-colors";
                      if (!submitted) {
                        // Pre-check: just highlight the user's current pick (changeable).
                        if (selected) {
                          cls += " border-[var(--brand-accent)] bg-[var(--brand-soft)] text-[var(--brand-text)]";
                        } else {
                          cls +=
                            " border-[var(--border)] bg-[var(--background)] text-[var(--brand-text)] hover:border-[var(--brand-accent)] hover:bg-[var(--brand-soft)]";
                        }
                      } else if (isAnswerOption) {
                        // After checking, the correct answer is highlighted green.
                        cls += " border-[#1f7a55] bg-[#daf5e6] text-[#19734a]";
                      } else if (selected) {
                        // User picked this and it's wrong.
                        cls += " border-[#d5301a] bg-[#fbe3df] text-[#b3271a]";
                      } else {
                        cls += " border-[var(--border)] bg-[var(--background)] text-[var(--brand-text)]/40";
                      }

                      return (
                        <button
                          key={label}
                          type="button"
                          disabled={submitted}
                          onClick={() => choose(question, value)}
                          className={cls}
                        >
                          {value ? <Check className="h-4 w-4" strokeWidth={2.6} /> : <X className="h-4 w-4" strokeWidth={2.6} />}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div
                      className={
                        "mt-2.5 rounded-xl px-3 py-2 text-[12.5px] font-bold leading-relaxed " +
                        (isCorrect ? "bg-[#eafaf1] text-[#19734a]" : "bg-[#fdeee9] text-[#b3271a]")
                      }
                    >
                      <span className="font-black">{isCorrect ? "ถูกต้อง! " : "ยังไม่ถูก — "}</span>
                      เฉลย: ข้อนี้ตอบ “{question.answer ? "ถูก" : "ผิด"}”
                      {question.note ? ` (${question.note})` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-3 md:px-5">
          {!submitted ? (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12.5px] font-bold text-[var(--brand-text)]/60">
                {allAnswered
                  ? "ตรวจสอบคำตอบของคุณ แก้ไขได้ก่อนกดตรวจคำตอบ"
                  : `ตอบให้ครบทั้ง ${quiz.length} ข้อ — เปลี่ยนคำตอบได้ก่อนตรวจ`}
              </p>
              <button
                type="button"
                disabled={!allAnswered}
                onClick={() => setSubmitted(true)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-nav)] px-5 text-[14px] font-black text-[var(--brand-accent)] transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ตรวจคำตอบ
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] font-black text-[var(--brand-text)]">
                คะแนนของคุณ:{" "}
                <span className="text-[var(--brand-accent-strong)]">
                  {correctCount}/{quiz.length}
                </span>{" "}
                ข้อ
              </p>
              <button
                type="button"
                onClick={() =>
                  markAwarenessDone({
                    score: correctCount,
                    total: quiz.length,
                    questions: quiz.map((question) => ({
                      id: question.id,
                      category: question.category,
                      text: question.text,
                      correct: answers[question.id] === question.answer,
                    })),
                  })
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-nav)] px-5 text-[14px] font-black text-[var(--brand-accent)] transition-transform hover:scale-[1.02]"
              >
                เข้าสู่เว็บไซต์
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
