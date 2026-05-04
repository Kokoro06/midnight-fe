import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GrainCanvas from "../components/GrainCanvas";
import TopNav from "../components/TopNav";
import { QUESTIONS, computeResult, type OptionBinary } from "../data/quizData";
import "./Quiz.css";

const TOTAL = QUESTIONS.length;

interface QuizCardProps {
  children: React.ReactNode;
}

function typeText(
  text: string,
  setter: React.Dispatch<React.SetStateAction<string>>,
  onComplete?: () => void,
  prevTimer?: ReturnType<typeof setInterval>,
): ReturnType<typeof setInterval> {
  if (prevTimer !== undefined) clearInterval(prevTimer);
  let i = 0;
  setter("");
  const timer = setInterval(() => {
    if (i < text.length) {
      const char = text.charAt(i);
      i++;
      setter((prev) => prev + char);
    } else {
      clearInterval(timer);
      onComplete?.();
    }
  }, 10);
  return timer;
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
  const [titleText, setTitleText] = useState<string>("");
  const [questionText, setQuestionText] = useState<string>("");
  const [chosenOption, setChosenOption] = useState<OptionBinary | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    document.title = "心情測驗 | Midnight Moodvie";
    timerRef.current = setTimeout(() => {
      typingTimerRef.current = typeText("點根線香，放鬆一下", setTitleText, undefined, typingTimerRef.current);
    }, 100);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (typingTimerRef.current !== undefined) clearInterval(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step >= 1 && step <= TOTAL) {
      const q = QUESTIONS[step - 1];
      setIsTyping(true);
      setOptionsVisible(false);
      typingTimerRef.current = typeText(
        q.text,
        setQuestionText,
        () => {
          setIsTyping(false);
          setOptionsVisible(true);
        },
        typingTimerRef.current,
      );
    }
  }, [step]);

  const chooseOption = (type: OptionBinary) => {
    if (leaving || chosenOption !== null) return;
    setChosenOption(type);

    setTimeout(() => {
      setLeaving(true);
      setTimeout(() => {
        const newAnswers = [...answers, type];
        setAnswers(newAnswers);
        const nextStep = step + 1;

        if (nextStep > TOTAL) {
          const key = computeResult(newAnswers);
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

      {step >= 1 && (
        <div className="quiz-progress-bar" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL} aria-label="測驗進度">
          <div className="quiz-progress-bar__fill" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
      )}

      <section className={sceneClass(0)}>
        <QuizCard>
          <div style={{ paddingTop: "12px" }}>
            <div className="scene-logo">
              <img src="img/mm-logo-w.svg" alt="Midnight Moodvie" />
            </div>
            <h1 className="scene-title">{titleText}</h1>
            <p className="scene-subtitle">你是哪款！電影地縛靈 👻</p>
            <p className="scene-preview">共 {TOTAL} 題，約需 3 分鐘</p>
            <div className="quiz-divider" style={{ marginBottom: "32px" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <motion.button
                className="scene-option btn-quiz-start"
                style={{ display: "block", width: "100%", maxWidth: "200px", fontSize: "14px" }}
                onClick={() => {
                  setStep(1);
                  setLeaving(false);
                }}
                whileHover={{ y: -2, boxShadow: "0 8px 22px rgba(0,0,0,0.45)" }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                開始測驗
              </motion.button>
              <Link to="/" className="skip-link">
                略過測驗，直接前往首頁
              </Link>
            </div>
          </div>
        </QuizCard>
      </section>

      {step >= 1 && <TopNav />}

      {QUESTIONS.map((q) => (
        <section key={q.step} className={sceneClass(q.step)}>
          <QuizCard>
            <div className="quiz-step-header">
              <span className="quiz-step-num">
                Q{q.step}
                <span className="quiz-step-total"> / {TOTAL}</span>
              </span>
              <Link to="/" className="quiz-exit-link">
                離開
              </Link>
            </div>
            <div className="quiz-divider" />
            <h2 className={`scene-question${isTyping && step === q.step ? " typing-cursor" : ""}`}>{step === q.step ? questionText : ""}</h2>
            <div className={`scene-options${optionsVisible && step === q.step ? " options-visible" : ""}`}>
              {q.options.map((opt) => (
                <motion.button
                  key={opt.type}
                  className={`quiz-option${chosenOption === opt.type ? " chosen" : ""}${chosenOption !== null && chosenOption !== opt.type ? " option-disabled" : ""}`}
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
            {q.footnote && (
              <div className="scene-footnote">
                <small>{q.footnote}</small>
              </div>
            )}
          </QuizCard>
        </section>
      ))}
    </div>
  );
}
