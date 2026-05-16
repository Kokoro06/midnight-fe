import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GrainCanvas from "../components/GrainCanvas";
import TopNav from "../components/TopNav";
import { QUESTIONS, computeResult, type OptionBinary } from "../data/quizData";
import { track } from "../lib/analytics";
import "./Quiz.css";

const TOTAL = QUESTIONS.length;

interface QuizCardProps {
  children: React.ReactNode;
}

function QuizCard({ children }: QuizCardProps) {
  return (
    <div className="quiz-card">
      <div className="quiz-card-bg" />
      <div className="quiz-card-smoke" />
      <GrainCanvas />
      <div className="quiz-card-inner">{children}</div>
    </div>
  );
}

export default function Quiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0);
  const [leaving, setLeaving] = useState<boolean>(false);
  const [answers, setAnswers] = useState<OptionBinary[]>([]);
  const [chosenOption, setChosenOption] = useState<OptionBinary | null>(null);
  const quizStartedAtRef = useRef<number | null>(null);
  const questionShownAtRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const stateRef = useRef({ step: 0, answers: [] as OptionBinary[] });

  useEffect(() => {
    stateRef.current = { step, answers };
  }, [step, answers]);

  useEffect(() => {
    const onPageHide = () => {
      const s = stateRef.current;
      if (startedRef.current && s.answers.length < TOTAL) {
        track("quiz_abandoned", {
          last_step: s.step,
          answers_count: s.answers.length,
          answers_so_far: s.answers,
          exit_method: "page_hide",
        });
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    document.title = "心情測驗 | Midnight Moodvie";
  }, []);

  useEffect(() => {
    if (step >= 1 && step <= TOTAL) {
      questionShownAtRef.current = performance.now();
    }
  }, [step]);

  const chooseOption = (type: OptionBinary) => {
    if (leaving || chosenOption !== null) return;
    setChosenOption(type);

    const shownAt = questionShownAtRef.current;
    const timeToAnswer = shownAt !== null ? Math.round(performance.now() - shownAt) : null;
    const currentQ = QUESTIONS[step - 1];
    track("quiz_question_answered", {
      step,
      axis: currentQ?.axis,
      choice: type,
      time_to_answer_ms: timeToAnswer,
    });

    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        const newAnswers = [...answers, type];
        setAnswers(newAnswers);
        const nextStep = step + 1;

        if (nextStep > TOTAL) {
          const key = computeResult(newAnswers);
          const startedAt = quizStartedAtRef.current;
          const durationMs = startedAt !== null ? Math.round(performance.now() - startedAt) : null;
          track("quiz_completed", {
            result_type: key,
            answers: newAnswers,
            duration_ms: durationMs,
          });
          setTimeout(() => navigate(`/quiz-result?type=${key}`), 450);
        } else {
          setStep(nextStep);
          setLeaving(false);
          setChosenOption(null);
        }
      }, 350);
    }, 200);
  };

  const sceneClass = (s: number) => {
    if (s !== step) return "scene";
    if (leaving) return "scene scene-leave";
    return "scene scene-active";
  };

  return (
    <div className="quiz-page">
      <video className="quiz-bg-video" src="ir.mp4" autoPlay muted loop playsInline />

      <section className={sceneClass(0)}>
        <QuizCard>
          <div style={{ paddingTop: "12px" }}>
            <div className="scene-logo">
              <img src="img/mm-logo-w.svg" alt="Midnight Moodvie" />
            </div>
            <p className="scene-subtitle">點根線香，放鬆一下</p>
            <h1 className="scene-title">你是哪款電影地縛靈？</h1>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <motion.button
                className="scene-option btn-quiz-start"
                style={{ display: "block", width: "100%", maxWidth: "200px", fontSize: "14px" }}
                onClick={() => {
                  startedRef.current = true;
                  quizStartedAtRef.current = performance.now();
                  track("quiz_started");
                  setStep(1);
                  setLeaving(false);
                }}
                whileHover={{ y: -2, boxShadow: "0 8px 22px rgba(0,0,0,0.45)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                開始測驗
              </motion.button>
              <Link
                to="/"
                className="skip-link"
                onClick={() => track("quiz_skipped", { step_at_skip: 0 })}
              >
                略過測驗，直接前往首頁
              </Link>
            </div>
          </div>
        </QuizCard>
      </section>

      <TopNav />

      {QUESTIONS.map((q) => (
        <section key={q.step} className={sceneClass(q.step)}>
          <QuizCard>
            <div
              className="quiz-progress-bar"
              role="progressbar"
              aria-valuenow={q.step}
              aria-valuemin={1}
              aria-valuemax={TOTAL}
              aria-label="測驗進度"
            >
              <div className="quiz-progress-bar__fill" style={{ width: `${(q.step / TOTAL) * 100}%` }} />
            </div>
            <div className="quiz-step-header">
              <span className="quiz-step-num">
                Q{q.step}
                <span className="quiz-step-total"> / {TOTAL}</span>
              </span>
              <Link
                to="/"
                className="quiz-exit-link"
                onClick={() => {
                  if (startedRef.current && answers.length < TOTAL) {
                    track("quiz_abandoned", {
                      last_step: step,
                      answers_count: answers.length,
                      answers_so_far: answers,
                      exit_method: "leave_link",
                    });
                  }
                }}
              >
                離開
              </Link>
            </div>
            <div className="quiz-divider" />
            <h2 className="scene-question">{q.text}</h2>
            <div className="scene-options">
              {q.options.map((opt, idx) => (
                <motion.button
                  key={opt.type}
                  className={`quiz-option${chosenOption === opt.type ? " chosen" : ""}${chosenOption !== null && chosenOption !== opt.type ? " option-disabled" : ""}`}
                  style={{ ["--option-index" as string]: idx } as React.CSSProperties}
                  onClick={() => chooseOption(opt.type)}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <span className="option-badge" aria-hidden="true">
                    {opt.type}
                  </span>
                  <span className="option-text">{opt.text}</span>
                </motion.button>
              ))}
            </div>
          </QuizCard>
        </section>
      ))}
    </div>
  );
}
