import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "timer" | "tasks" | "planner" | "notes" | "stats";
type TimerMode = "work" | "short" | "long";
type Priority = "low" | "medium" | "high";
type Subject =
  | "math"
  | "science"
  | "history"
  | "english"
  | "other";

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  subject: Subject;
  dueDate: string;
}

interface StudyEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  duration: number;
  subject: Subject;
}

interface NoteAttachment {
  id: string;
  type: "image" | "document";
  name: string;
  dataUrl?: string;
  fileType?: string;
  size?: number;
}

interface NoteRecording {
  id: string;
  duration: number;
  transcription: string;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  body: string;
  subject: Subject;
  updatedAt: string;
  attachments: NoteAttachment[];
  recordings: NoteRecording[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};
const SUBJECTS: Subject[] = [
  "math",
  "science",
  "history",
  "english",
  "other",
];
const TODAY = "2026-07-21";

const SC: Record<
  Subject,
  { label: string; dot: string; pill: string }
> = {
  math: {
    label: "Math",
    dot: "bg-blue-500",
    pill: "bg-blue-50 text-blue-600",
  },
  science: {
    label: "Science",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700",
  },
  history: {
    label: "History",
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700",
  },
  english: {
    label: "English",
    dot: "bg-violet-500",
    pill: "bg-violet-50 text-violet-600",
  },
  other: {
    label: "Other",
    dot: "bg-stone-400",
    pill: "bg-stone-100 text-stone-600",
  },
};

const PRIORITY_DOT: Record<Priority, string> = {
  low: "bg-stone-300",
  medium: "bg-amber-400",
  high: "bg-red-500",
};

// ── Sample Data ────────────────────────────────────────────────────────────────

const INIT_TASKS: Task[] = [
  {
    id: "1",
    text: "Read Chapter 7 — Calculus derivatives",
    done: false,
    priority: "high",
    subject: "math",
    dueDate: "2026-07-21",
  },
  {
    id: "2",
    text: "Outline comparative essay",
    done: false,
    priority: "high",
    subject: "english",
    dueDate: "2026-07-21",
  },
  {
    id: "3",
    text: "Review cellular respiration",
    done: true,
    priority: "medium",
    subject: "science",
    dueDate: "2026-07-21",
  },
  {
    id: "4",
    text: "Integration by parts practice",
    done: false,
    priority: "medium",
    subject: "math",
    dueDate: "2026-07-22",
  },
  {
    id: "5",
    text: "Complete WWI timeline",
    done: false,
    priority: "low",
    subject: "history",
    dueDate: "2026-07-23",
  },
  {
    id: "6",
    text: "Read Hamlet Act III",
    done: true,
    priority: "low",
    subject: "english",
    dueDate: "2026-07-20",
  },
];

const INIT_EVENTS: StudyEvent[] = [
  {
    id: "1",
    title: "Calculus Study",
    date: "2026-07-21",
    startTime: "09:00",
    duration: 90,
    subject: "math",
  },
  {
    id: "2",
    title: "Essay Drafting",
    date: "2026-07-21",
    startTime: "14:00",
    duration: 60,
    subject: "english",
  },
  {
    id: "3",
    title: "Bio Lab Review",
    date: "2026-07-22",
    startTime: "10:00",
    duration: 45,
    subject: "science",
  },
  {
    id: "4",
    title: "History Reading",
    date: "2026-07-23",
    startTime: "15:30",
    duration: 30,
    subject: "history",
  },
  {
    id: "5",
    title: "Math Problem Set",
    date: "2026-07-24",
    startTime: "09:30",
    duration: 120,
    subject: "math",
  },
  {
    id: "6",
    title: "Shakespeare Analysis",
    date: "2026-07-25",
    startTime: "13:00",
    duration: 50,
    subject: "english",
  },
];

const INIT_NOTES: Note[] = [
  {
    id: "1",
    title: "Derivatives — Key Rules",
    body: `## Power Rule\nFor f(x) = xⁿ, the derivative is f\'(x) = n·xⁿ⁻¹\n\nExample: d/dx[x³] = 3x²\n\n## Chain Rule\nFor composite functions: d/dx[f(g(x))] = f\'(g(x)) · g\'(x)\n\nRemember the "outside-inside" pattern — differentiate the outer function first, leave the inner alone, then multiply by the derivative of the inner.\n\n## Product Rule\n(fg)\' = f\'g + fg\'\n\n## Quotient Rule\n(f/g)\' = (f\'g − fg\') / g²\n\nMnemonic: "low d-high minus high d-low, over the square of what\'s below"`,
    subject: "math",
    updatedAt: "2026-07-21",
    attachments: [],
    recordings: [
      {
        id: "r1",
        duration: 142,
        createdAt: "2026-07-21",
        transcription:
          "Alright everyone, so today we're going over integration by parts. The formula you need is: the integral of u dv equals uv minus the integral of v du. The tricky part is choosing what to assign as u and what as dv. There's a helpful acronym — LIATE. Logarithmic, Inverse trig, Algebraic, Trig, and Exponential. Your u should come from whichever category appears earliest in that list. Let's do an example. Take the integral of x times e to the x. Here x is algebraic, e to the x is exponential, so u equals x and dv equals e to the x dx. Differentiating u gives du equals dx, and integrating dv gives v equals e to the x. Plug that into the formula and you get x times e to the x minus the integral of e to the x dx, which is just x e to the x minus e to the x plus our constant C.",
      },
    ],
  },
  {
    id: "2",
    title: "Hamlet — Major Themes",
    body: `## Revenge vs. Moral Integrity\nHamlet\'s central tension: the ghost demands revenge, but Hamlet questions whether revenge is just. He delays because he cannot reconcile action with his moral code.\n\n## Appearance vs. Reality\n"One may smile, and smile, and be a villain." Denmark is rotten beneath its courtly surface. Claudius, Polonius, and Rosencrantz/Guildenstern all wear masks.\n\n## Mortality & The Afterlife\nThe "To be or not to be" soliloquy. Yorick\'s skull. Death is inevitable — but what lies beyond?\n\n## Corruption & Decay\nThe state of Denmark mirrors the corruption at its top. "Something is rotten in the state of Denmark."`,
    subject: "english",
    updatedAt: "2026-07-20",
    attachments: [
      {
        id: "a1",
        type: "document",
        name: "Hamlet_Act3_Slides.pptx",
        fileType: "pptx",
        size: 2400000,
      },
      {
        id: "a2",
        type: "document",
        name: "Shakespeare_Context.pdf",
        fileType: "pdf",
        size: 890000,
      },
    ],
    recordings: [],
  },
  {
    id: "3",
    title: "Cellular Respiration",
    body: `## Overview\nCellular respiration converts glucose + oxygen → ATP + CO₂ + water\n\nC₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~38 ATP\n\n## Stage 1 — Glycolysis (cytoplasm)\n- Glucose (6C) → 2× Pyruvate (3C)\n- Net yield: 2 ATP, 2 NADH\n- Does NOT require oxygen\n\n## Stage 2 — Krebs Cycle (mitochondrial matrix)\n- Pyruvate → Acetyl-CoA\n- Produces: 2 ATP, 6 NADH, 2 FADH₂ per glucose\n\n## Stage 3 — Electron Transport Chain (inner membrane)\n- NADH and FADH₂ donate electrons\n- Oxygen is the final electron acceptor\n- Produces ~34 ATP via chemiosmosis`,
    subject: "science",
    updatedAt: "2026-07-19",
    attachments: [],
    recordings: [],
  },
  {
    id: "4",
    title: "WWI Causes — MAIN",
    body: `## M — Militarism\nEuropean powers built up massive armies and navies throughout the early 1900s. Arms race between Britain and Germany (naval expansion). Military planning made war almost automatic (Schlieffen Plan).\n\n## A — Alliances\nTriple Alliance: Germany, Austria-Hungary, Italy\nTriple Entente: France, Russia, Britain\nAlliances meant a local conflict could drag all major powers into war.\n\n## I — Imperialism\nCompetition for colonies in Africa and Asia created tensions, especially between Britain, France, and Germany.\n\n## N — Nationalism\nPan-Slavic movements in the Balkans. Serbian nationalism threatened Austria-Hungary. Assassination of Franz Ferdinand (28 June 1914) was the spark.`,
    subject: "history",
    updatedAt: "2026-07-18",
    attachments: [],
    recordings: [],
  },
];

const MOCK_TRANSCRIPTIONS: Record<Subject, string> = {
  math: "Alright everyone, picking up from last time — integration by parts. The formula: integral of u dv equals uv minus integral of v du. Choosing u and dv wisely is the whole skill. Use LIATE as your guide: Logarithmic, Inverse trig, Algebraic, Trig, Exponential. Whatever comes first in that ordering should be your u. Let's work through integral of x times ln x. Here ln x is logarithmic, x is algebraic, so u equals ln x. That means dv equals x dx, giving v equals x squared over two. Now plug in: x squared over two times ln x, minus the integral of x squared over two times one over x dx. That last integral simplifies to x squared over four. So our answer is x squared over two times ln x minus x squared over four plus C.",
  science:
    "So continuing from Monday — we finished glycolysis, now we're in the Krebs cycle. This happens in the mitochondrial matrix. For each pyruvate molecule, first we convert it to Acetyl-CoA, releasing one CO₂ and one NADH in the process. Then Acetyl-CoA enters the cycle proper. Each full turn of the cycle generates three NADH, one FADH₂, one ATP or GTP, and releases two more CO₂ molecules. Since one glucose gives us two pyruvates, we run the Krebs cycle twice per glucose molecule. Total from both turns: six NADH, two FADH₂, two ATP. The real ATP harvest comes next — the electron transport chain. Those NADH and FADH₂ molecules are energy carriers that will drive the production of about thirty-four more ATP through oxidative phosphorylation.",
  history:
    "So the spark that ignited the war was the assassination of Archduke Franz Ferdinand on June 28th, 1914, in Sarajevo. But remember — we always stress in this class — that was the trigger, not the cause. The gun had been loaded for decades. Our MAIN framework: Militarism — European powers had been in an arms race since the 1870s. Germany's naval buildup directly challenged British supremacy. Alliances — the alliance system meant no conflict could stay localized. Austria-Hungary declares war on Serbia, Russia mobilizes to defend Serbia, Germany declares war on Russia, France gets pulled in, Germany invades Belgium, Britain enters. What should have been a Balkan squabble became a world war in six weeks. That's the alliance system working exactly as designed — and exactly as feared.",
  english:
    "What makes Hamlet so enduringly fascinating is the central paralysis. Hamlet has been given a direct command by his father's ghost: avenge my murder. The task is clear. And yet — he delays. He philosophizes. He puts on an 'antic disposition.' Why? I'd argue Shakespeare is exploring what happens when an intensely analytical mind confronts a moral problem that doesn't yield to analysis. Killing Claudius would be simple. But Hamlet needs it to be just. He needs to be certain. The ghost might be a devil in disguise. Claudius might be innocent. So Hamlet engineers the play-within-a-play to test the king's guilt. Even after that confirmation, he can't act — he catches Claudius praying and refuses to kill him in a state of grace. Every delay is rationalized. That's what makes him tragic: he's too intelligent for his own good.",
  other:
    "So those are the three frameworks we'll be working with this semester. The key insight — and this will come up on the midterm — is that the frameworks aren't competing explanations. They're complementary lenses. Depending on what question you're trying to answer, you'll reach for different tools. Before next Tuesday, read chapters four through six and come prepared to apply at least one framework to the case study in the appendix. The case study is deliberately ambiguous so there's no single right answer — I want to see your reasoning process, not just a conclusion. Office hours are Thursday two to four, and I've posted additional practice problems on the course portal. Any questions before we wrap up?",
};

// ── Utilities ──────────────────────────────────────────────────────────────────

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function getWeekDays(): {
  date: string;
  day: string;
  label: string;
}[] {
  const base = new Date("2026-07-21T12:00:00");
  const dow = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const day = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ][d.getDay()];
    return { date: iso, day, label: String(d.getDate()) };
  });
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IcoTimer({ s = 22, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoCheck({ s = 22, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoCal({ s = 22, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IcoBar({ s = 22, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={cls}
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IcoPlus({ s = 18, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={cls}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IcoX({ s = 17, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={cls}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IcoReset({ s = 18, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}
function IcoSkip({ s = 18, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={cls}
    >
      <polygon points="5 4 15 12 5 20" />
      <line x1="19" y1="4" x2="19" y2="20" />
    </svg>
  );
}
function IcoNote({ s = 22, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
function IcoArrowLeft({ s = 20, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function IcoTrash({ s = 18, cls = "" }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cls}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Timer View ─────────────────────────────────────────────────────────────────

function TimerView({
  sessions,
  onSessionComplete,
}: {
  sessions: number;
  onSessionComplete: () => void;
}) {
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState<Subject>("math");
  const ref = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const total = DURATIONS[mode];
  const progress = timeLeft / total;
  const mins = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  const R = 90,
    SZ = 200,
    CX = 100;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - progress);
  const ringColor =
    mode === "work"
      ? "#EA580C"
      : mode === "short"
        ? "#16A34A"
        : "#6366F1";
  const modeLabel =
    mode === "work"
      ? "Focus"
      : mode === "short"
        ? "Short Break"
        : "Long Break";

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(ref.current!);
            setRunning(false);
            if (mode === "work") onSessionComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, mode, onSessionComplete]);

  const switchMode = (m: TimerMode) => {
    if (ref.current) clearInterval(ref.current);
    setMode(m);
    setTimeLeft(DURATIONS[m]);
    setRunning(false);
  };
  const reset = () => {
    if (ref.current) clearInterval(ref.current);
    setTimeLeft(DURATIONS[mode]);
    setRunning(false);
  };

  const focusMins = sessions * 25;
  const fh = Math.floor(focusMins / 60);
  const fm = focusMins % 60;
  const focusStr =
    fh > 0 ? `${fh}h${fm > 0 ? ` ${fm}m` : ""}` : `${fm}m`;

  return (
    <div className="flex flex-col items-center px-5 pt-4 pb-4 gap-5 overflow-y-auto scrollbar-none">
      {/* Mode pills */}
      <div className="flex bg-stone-100 rounded-2xl p-1 w-full gap-0.5">
        {(["work", "short", "long"] as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${mode === m ? "bg-white shadow-sm text-stone-900" : "text-stone-400"}`}
          >
            {m === "work"
              ? "Focus"
              : m === "short"
                ? "Short Break"
                : "Long Break"}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative">
        <svg width={SZ} height={SZ} className="-rotate-90">
          <circle
            cx={CX}
            cy={CX}
            r={R}
            fill="none"
            stroke="#E7E5E4"
            strokeWidth="10"
          />
          <circle
            cx={CX}
            cy={CX}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={String(circ)}
            strokeDashoffset={String(offset)}
            style={{
              transition: running
                ? "stroke-dashoffset 1s linear"
                : "stroke-dashoffset 0.3s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-medium text-stone-900 tracking-tighter leading-none"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {mins}:{secs}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mt-2">
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${i < sessions % 4 ? "w-3 h-3 bg-orange-500" : "w-2 h-2 bg-stone-200"}`}
          />
        ))}
        <span className="text-[10px] text-stone-400 font-medium ml-1">
          {sessions % 4} of 4
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <button
          onClick={reset}
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors"
          aria-label="Reset"
        >
          <IcoReset cls="text-stone-400" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: ringColor }}
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="white"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="white"
              style={{ marginLeft: 2 }}
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <button
          onClick={() =>
            switchMode(mode === "work" ? "short" : "work")
          }
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors"
          aria-label="Skip"
        >
          <IcoSkip cls="text-stone-400" />
        </button>
      </div>

      {/* Subject selector */}
      <div className="w-full">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
          Studying
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${subject === s ? SC[s].pill : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SC[s].dot}`}
              />
              {SC[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Today summary */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-3">
          Today
        </p>
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-stone-100">
          <div>
            <p
              className="text-2xl font-semibold text-stone-900"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {sessions}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Sessions
            </p>
          </div>
          <div>
            <p
              className="text-2xl font-semibold text-stone-900"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {focusStr}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Focus
            </p>
          </div>
          <div>
            <p
              className="text-2xl font-semibold text-orange-500"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              3
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Day Streak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tasks View ─────────────────────────────────────────────────────────────────

function TasksView({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
}) {
  const [filter, setFilter] = useState<
    "today" | "upcoming" | "done"
  >("today");
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] =
    useState<Priority>("medium");
  const [newSubject, setNewSubject] = useState<Subject>("math");
  const [newDue, setNewDue] = useState(TODAY);

  const filtered = tasks.filter((t) => {
    if (filter === "today")
      return t.dueDate === TODAY && !t.done;
    if (filter === "upcoming")
      return t.dueDate > TODAY && !t.done;
    return t.done;
  });

  const todayDone = tasks.filter(
    (t) => t.dueDate === TODAY && t.done,
  ).length;
  const todayTotal = tasks.filter(
    (t) => t.dueDate === TODAY,
  ).length;
  const pct = todayTotal
    ? Math.round((todayDone / todayTotal) * 100)
    : 0;

  const toggle = (id: string) =>
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    );
  const del = (id: string) =>
    setTasks((ts) => ts.filter((t) => t.id !== id));

  const addTask = () => {
    if (!newText.trim()) return;
    setTasks((ts) => [
      {
        id: Date.now().toString(),
        text: newText.trim(),
        done: false,
        priority: newPriority,
        subject: newSubject,
        dueDate: newDue,
      },
      ...ts,
    ]);
    setNewText("");
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      {todayTotal > 0 && (
        <div className="px-5 pt-4">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-stone-500 font-medium">
              Today's tasks
            </span>
            <span
              className="text-xs font-semibold text-stone-700"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {pct}%
            </span>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex px-5 pt-3 gap-1.5">
        {(["today", "upcoming", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === f ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"}`}
          >
            {f === "today"
              ? "Due Today"
              : f === "upcoming"
                ? "Upcoming"
                : "Completed"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2 scrollbar-none">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
              <IcoCheck cls="text-stone-300" />
            </div>
            <p className="text-stone-400 text-sm font-medium">
              {filter === "done"
                ? "Nothing completed yet"
                : filter === "today"
                  ? "All caught up for today"
                  : "No upcoming tasks"}
            </p>
          </div>
        )}
        {filtered.map((task) => (
          <div
            key={task.id}
            className={`bg-white rounded-2xl px-4 py-3.5 flex items-start gap-3 shadow-sm transition-opacity ${task.done ? "opacity-60" : ""}`}
          >
            <button
              onClick={() => toggle(task.id)}
              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.done ? "bg-indigo-500 border-indigo-500" : "border-stone-300 hover:border-indigo-400"}`}
            >
              {task.done && (
                <IcoCheck s={10} cls="text-white" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium leading-snug ${task.done ? "line-through text-stone-400" : "text-stone-800"}`}
              >
                {task.text}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${SC[task.subject].pill}`}
                >
                  {SC[task.subject].label}
                </span>
                <span className="text-[10px] text-stone-400">
                  {task.dueDate === TODAY
                    ? "Today"
                    : new Date(
                        task.dueDate + "T12:00",
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div
                className={`w-2 h-2 rounded-full mt-0.5 ${PRIORITY_DOT[task.priority]}`}
                title={task.priority}
              />
              <button
                onClick={() => del(task.id)}
                className="text-stone-200 hover:text-red-400 transition-colors"
              >
                <IcoX />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors active:scale-[0.98]"
        >
          <IcoPlus cls="text-white" />
          Add Task
        </button>
      </div>

      {/* Modal */}
      {showAdd && (
        <div
          className="absolute inset-0 bg-black/40 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div className="bg-white rounded-t-3xl w-full p-5 pb-8 flex flex-col gap-4 animate-[slideUp_0.25s_ease]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">
                New Task
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                <IcoX />
              </button>
            </div>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                Subject
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewSubject(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${newSubject === s ? SC[s].pill : "bg-stone-100 text-stone-500"}`}
                  >
                    {SC[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                Priority
              </p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as Priority[]).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize flex items-center justify-center gap-1.5 transition-all ${newPriority === p ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[p]}`}
                      />
                      {p}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                Due Date
              </p>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 rounded-xl text-sm text-stone-900 outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <button
              onClick={addTask}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-semibold text-sm hover:bg-indigo-700 transition-colors active:scale-[0.98]"
            >
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Planner View ───────────────────────────────────────────────────────────────

function PlannerView({
  events,
  setEvents,
}: {
  events: StudyEvent[];
  setEvents: Dispatch<SetStateAction<StudyEvent[]>>;
}) {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newDuration, setNewDuration] = useState(60);
  const [newSubject, setNewSubject] = useState<Subject>("math");

  const weekDays = getWeekDays();
  const dayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const totalMins = dayEvents.reduce(
    (s, e) => s + e.duration,
    0,
  );

  const addEvent = () => {
    if (!newTitle.trim()) return;
    setEvents((es) => [
      ...es,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        date: selectedDate,
        startTime: newTime,
        duration: newDuration,
        subject: newSubject,
      },
    ]);
    setNewTitle("");
    setShowAdd(false);
  };

  const selectedLabel =
    selectedDate === TODAY
      ? "Today"
      : new Date(selectedDate + "T12:00").toLocaleDateString(
          "en-US",
          { weekday: "long", month: "short", day: "numeric" },
        );

  return (
    <div className="flex flex-col h-full">
      {/* Week strip */}
      <div className="flex px-4 pt-4 gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {weekDays.map(({ date, day, label }) => {
          const has = events.some((e) => e.date === date);
          const isToday = date === TODAY;
          const sel = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center px-3 pt-2.5 pb-2 rounded-2xl flex-shrink-0 min-w-[46px] transition-all ${sel ? "bg-stone-900 text-white" : isToday ? "bg-indigo-50 text-indigo-700" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
            >
              <span className="text-[9px] font-bold uppercase">
                {day}
              </span>
              <span className="text-xl font-bold leading-tight">
                {label}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${has ? (sel ? "bg-white/50" : "bg-orange-400") : "transparent"}`}
                style={{ opacity: has ? 1 : 0 }}
              />
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {selectedLabel}
          </p>
          {totalMins > 0 && (
            <p className="text-xs text-stone-400 mt-0.5">
              {formatDuration(totalMins)} planned
            </p>
          )}
          {totalMins === 0 && (
            <p className="text-xs text-stone-300 mt-0.5">
              Nothing scheduled
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center hover:bg-stone-700 transition-colors"
        >
          <IcoPlus s={14} cls="text-white" />
        </button>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-2 scrollbar-none pb-3">
        {dayEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
              <IcoCal cls="text-stone-300" />
            </div>
            <p className="text-stone-400 text-sm font-medium">
              No sessions yet
            </p>
            <p className="text-stone-300 text-xs mt-1">
              Tap + to plan a study session
            </p>
          </div>
        )}
        {dayEvents.map((ev) => (
          <div
            key={ev.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-stretch gap-3"
          >
            <div
              className={`w-1 rounded-full flex-shrink-0 ${SC[ev.subject].dot}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-900">
                {ev.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-xs text-stone-500"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {ev.startTime}
                </span>
                <span className="text-stone-200 text-xs">
                  ·
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${SC[ev.subject].pill}`}
                >
                  {SC[ev.subject].label}
                </span>
                <span className="text-xs text-stone-400 ml-auto">
                  {formatDuration(ev.duration)}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                setEvents((es) =>
                  es.filter((e) => e.id !== ev.id),
                )
              }
              className="text-stone-200 hover:text-red-400 transition-colors self-start mt-0.5"
            >
              <IcoX />
            </button>
          </div>
        ))}
      </div>

      {/* Add event modal */}
      {showAdd && (
        <div
          className="absolute inset-0 bg-black/40 flex items-end z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div className="bg-white rounded-t-3xl w-full p-5 pb-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">
                New Session
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                <IcoX />
              </button>
            </div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Session title"
              className="w-full px-4 py-3 bg-stone-50 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-violet-300"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                  Start Time
                </p>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 rounded-xl text-sm text-stone-900 outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                  Duration
                </p>
                <select
                  value={newDuration}
                  onChange={(e) =>
                    setNewDuration(Number(e.target.value))
                  }
                  className="w-full px-3 py-2.5 bg-stone-50 rounded-xl text-sm text-stone-900 outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {[25, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>
                      {formatDuration(d)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                Subject
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewSubject(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${newSubject === s ? SC[s].pill : "bg-stone-100 text-stone-500"}`}
                  >
                    {SC[s].label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={addEvent}
              className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-semibold text-sm hover:bg-violet-700 transition-colors active:scale-[0.98]"
            >
              Add Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notes View helpers ─────────────────────────────────────────────────────────

type RecState =
  | "idle"
  | "recording"
  | "processing"
  | "transcribed";

function formatRecDuration(secs: number) {
  return `${Math.floor(secs / 60)
    .toString()
    .padStart(
      2,
      "0",
    )}:${(secs % 60).toString().padStart(2, "0")}`;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024)
    return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DOC_COLORS: Record<string, string> = {
  pdf: "bg-red-100 text-red-600",
  pptx: "bg-orange-100 text-orange-600",
  ppt: "bg-orange-100 text-orange-600",
  docx: "bg-blue-100 text-blue-600",
  doc: "bg-blue-100 text-blue-600",
  xlsx: "bg-green-100 text-green-600",
  xls: "bg-green-100 text-green-600",
};

function DocTypeIcon({ fileType }: { fileType?: string }) {
  const ext = fileType?.toLowerCase() ?? "";
  if (ext === "pptx" || ext === "ppt") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="8" x2="12" y2="12" />
      </svg>
    );
  }
  if (ext === "pdf") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// ── Notes View ─────────────────────────────────────────────────────────────────

function NotesView({
  notes,
  setNotes,
}: {
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
}) {
  // List state
  const [filterSubject, setFilterSubject] = useState<
    Subject | "all"
  >("all");

  // Editor state
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSubject, setEditSubject] =
    useState<Subject>("math");
  const [editAttachments, setEditAttachments] = useState<
    NoteAttachment[]
  >([]);
  const [editRecordings, setEditRecordings] = useState<
    NoteRecording[]
  >([]);
  const [showSubjectPicker, setShowSubjectPicker] =
    useState(false);
  const [expandedRecId, setExpandedRecId] = useState<
    string | null
  >(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(
    null,
  );

  // Recording state
  const [recState, setRecState] = useState<RecState>("idle");
  const [recDuration, setRecDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(
    Array(28).fill(0.3),
  );
  const recTimerRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);
  const waveformRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Waveform animation while recording
  useEffect(() => {
    if (recState === "recording") {
      waveformRef.current = setInterval(() => {
        setWaveformBars(
          Array(28)
            .fill(0)
            .map((_, i) => {
              const dist = Math.abs(i - 14) / 14;
              return (
                (1 - dist * 0.4) * (0.15 + Math.random() * 0.85)
              );
            }),
        );
      }, 80);
    } else {
      if (waveformRef.current)
        clearInterval(waveformRef.current);
    }
    return () => {
      if (waveformRef.current)
        clearInterval(waveformRef.current);
    };
  }, [recState]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editBody, openNote]);

  const openExisting = (note: Note) => {
    setOpenNote(note);
    setEditTitle(note.title);
    setEditBody(note.body);
    setEditSubject(note.subject);
    setEditAttachments([...note.attachments]);
    setEditRecordings([...note.recordings]);
    setIsNew(false);
    setShowSubjectPicker(false);
    setExpandedRecId(null);
    setRecState("idle");
  };

  const startNew = () => {
    const blank: Note = {
      id: Date.now().toString(),
      title: "",
      body: "",
      subject: filterSubject !== "all" ? filterSubject : "math",
      updatedAt: TODAY,
      attachments: [],
      recordings: [],
    };
    setOpenNote(blank);
    setEditTitle("");
    setEditBody("");
    setEditSubject(blank.subject);
    setEditAttachments([]);
    setEditRecordings([]);
    setIsNew(true);
    setShowSubjectPicker(false);
    setExpandedRecId(null);
    setRecState("idle");
  };

  const saveAndBack = () => {
    if (!openNote) return;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    const updated: Note = {
      ...openNote,
      title: editTitle.trim() || "Untitled",
      body: editBody,
      subject: editSubject,
      updatedAt: TODAY,
      attachments: editAttachments,
      recordings: editRecordings,
    };
    if (isNew) {
      if (editTitle.trim() || editBody.trim())
        setNotes((ns) => [updated, ...ns]);
    } else {
      setNotes((ns) =>
        ns.map((n) => (n.id === openNote.id ? updated : n)),
      );
    }
    setOpenNote(null);
    setRecState("idle");
  };

  const deleteNote = () => {
    if (!openNote) return;
    setNotes((ns) => ns.filter((n) => n.id !== openNote.id));
    setOpenNote(null);
  };

  // Recording
  const startRecording = () => {
    setRecDuration(0);
    setRecState("recording");
    recTimerRef.current = setInterval(
      () => setRecDuration((d) => d + 1),
      1000,
    );
  };

  const stopRecording = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecState("processing");
    setTimeout(() => setRecState("transcribed"), 2200);
  };

  const insertRecording = () => {
    const rec: NoteRecording = {
      id: Date.now().toString(),
      duration: recDuration,
      transcription: MOCK_TRANSCRIPTIONS[editSubject],
      createdAt: TODAY,
    };
    setEditRecordings((rs) => [...rs, rec]);
    setExpandedRecId(rec.id);
    setRecState("idle");
    setRecDuration(0);
  };

  const discardRecording = () => {
    setRecState("idle");
    setRecDuration(0);
  };

  // Attachments
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const ext =
        file.name.split(".").pop()?.toLowerCase() ?? "";
      const isImage = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
      ].includes(ext);
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setEditAttachments((prev) => [
            ...prev,
            {
              id: `${Date.now()}${Math.random()}`,
              type: "image",
              name: file.name,
              dataUrl: ev.target?.result as string,
              size: file.size,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setEditAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}${Math.random()}`,
            type: "document",
            name: file.name,
            fileType: ext,
            size: file.size,
          },
        ]);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filtered = notes.filter(
    (n) =>
      filterSubject === "all" || n.subject === filterSubject,
  );

  // ── Editor ──
  if (openNote) {
    const images = editAttachments.filter(
      (a) => a.type === "image",
    );
    const docs = editAttachments.filter(
      (a) => a.type === "document",
    );
    const wordCount = editBody
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Image lightbox */}
        {lightboxImg && (
          <div
            className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-6"
            onClick={() => setLightboxImg(null)}
          >
            <img
              src={lightboxImg}
              alt="Attachment preview"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <button className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <IcoX cls="text-white" />
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
          <button
            onClick={saveAndBack}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <IcoArrowLeft s={18} />
            <span className="text-sm font-medium">Notes</span>
          </button>
          <div className="flex items-center gap-3">
            {!isNew && (
              <button
                onClick={deleteNote}
                className="text-stone-300 hover:text-red-400 transition-colors"
              >
                <IcoTrash s={17} />
              </button>
            )}
            <button
              onClick={saveAndBack}
              className="px-3.5 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Subject + badges */}
        <div className="px-5 pt-4 flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowSubjectPicker((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${SC[editSubject].pill}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${SC[editSubject].dot}`}
              />
              {SC[editSubject].label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showSubjectPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-stone-100 p-1.5 flex flex-col gap-0.5 z-10 min-w-[120px]">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setEditSubject(s);
                      setShowSubjectPicker(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-left ${editSubject === s ? SC[s].pill : "text-stone-600 hover:bg-stone-50"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${SC[s].dot}`}
                    />
                    {SC[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {editRecordings.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="8" />
              </svg>
              {editRecordings.length} rec
            </span>
          )}
          {editAttachments.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-lg">
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              {editAttachments.length}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="px-5 pt-2 flex-shrink-0">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Note title"
            autoFocus={isNew}
            className="w-full text-xl font-bold text-stone-900 placeholder-stone-300 outline-none bg-transparent leading-tight"
          />
          <p className="text-[10px] text-stone-400 mt-1 font-medium">
            {openNote.updatedAt === TODAY
              ? "Today"
              : openNote.updatedAt}
          </p>
        </div>

        <div className="mx-5 mt-3 h-px bg-stone-100 flex-shrink-0" />

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-5 pt-3 scrollbar-none"
          onClick={() => textareaRef.current?.focus()}
        >
          <textarea
            ref={textareaRef}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder={
              "Start writing your notes…\n\nTip: Use ## for headings to organize sections."
            }
            className="w-full text-sm text-stone-700 placeholder-stone-300 outline-none bg-transparent resize-none leading-relaxed min-h-[100px]"
            style={{ fontFamily: "var(--font-sans)" }}
          />

          {/* Recordings */}
          {editRecordings.length > 0 && (
            <div
              className="mt-5 mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                Lecture Recordings
              </p>
              <div className="flex flex-col gap-2">
                {editRecordings.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-100"
                  >
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="white"
                          style={{ marginLeft: 1 }}
                        >
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                      {/* Static waveform decoration */}
                      <div className="flex-1 flex items-center gap-px h-5">
                        {Array.from({ length: 36 }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-stone-300 rounded-full"
                              style={{
                                height: `${25 + Math.sin(i * 0.7) * 35 + Math.sin(i * 2.1) * 20}%`,
                              }}
                            />
                          ),
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold text-stone-400 flex-shrink-0"
                        style={{
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatRecDuration(rec.duration)}
                      </span>
                      <button
                        onClick={() =>
                          setExpandedRecId((id) =>
                            id === rec.id ? null : rec.id,
                          )
                        }
                        className="text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <polyline
                            points={
                              expandedRecId === rec.id
                                ? "18 15 12 9 6 15"
                                : "6 9 12 15 18 9"
                            }
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setEditRecordings((rs) =>
                            rs.filter((r) => r.id !== rec.id),
                          )
                        }
                        className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <IcoX s={13} />
                      </button>
                    </div>
                    {expandedRecId === rec.id && (
                      <div className="px-3 pb-3 border-t border-stone-200/70">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mt-2.5 mb-2">
                          Transcript
                        </p>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {rec.transcription}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {editAttachments.length > 0 && (
            <div
              className="mt-5 mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">
                Attachments
              </p>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative rounded-xl overflow-hidden aspect-square bg-stone-100 group"
                    >
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() =>
                          setLightboxImg(img.dataUrl ?? null)
                        }
                      />
                      <button
                        onClick={() =>
                          setEditAttachments((as) =>
                            as.filter((a) => a.id !== img.id),
                          )
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IcoX s={9} cls="text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="rounded-xl aspect-square bg-stone-100 border-2 border-dashed border-stone-200 flex items-center justify-center hover:bg-stone-200 transition-colors"
                  >
                    <IcoPlus s={16} cls="text-stone-400" />
                  </button>
                </div>
              )}
              {docs.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {docs.map((doc) => {
                    const ext =
                      doc.fileType?.toLowerCase() ?? "file";
                    const colorCls =
                      DOC_COLORS[ext] ??
                      "bg-stone-100 text-stone-600";
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-100"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}
                        >
                          <DocTypeIcon
                            fileType={doc.fileType}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {ext.toUpperCase()} ·{" "}
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setEditAttachments((as) =>
                              as.filter((a) => a.id !== doc.id),
                            )
                          }
                          className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <IcoX s={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="pb-4" />
        </div>

        {/* Bottom toolbar */}
        <div className="flex-shrink-0 border-t border-stone-100 bg-white px-4 py-2.5 flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors text-xs font-semibold text-stone-600"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Attach
          </button>
          <button
            onClick={startRecording}
            disabled={recState !== "idle"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-xs font-semibold text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="animate-pulse"
            >
              <circle cx="12" cy="12" r="8" />
            </svg>
            Record Lecture
          </button>
          <p
            className="text-[10px] text-stone-300 ml-auto"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {wordCount}w
          </p>
        </div>

        {/* Recording overlay */}
        {recState !== "idle" && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex items-end z-40">
            <div className="bg-white rounded-t-3xl w-full p-5 pb-8">
              {recState === "recording" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-semibold text-stone-900">
                        Recording lecture
                      </span>
                    </div>
                    <span
                      className="text-sm font-semibold text-stone-600"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {formatRecDuration(recDuration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-px h-14 px-1">
                    {waveformBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-red-400 rounded-full"
                        style={{
                          height: `${h * 100}%`,
                          transition: "height 80ms ease",
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={stopRecording}
                    className="w-full py-3.5 bg-red-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="16"
                        height="16"
                        rx="2"
                      />
                    </svg>
                    Stop Recording
                  </button>
                </div>
              )}

              {recState === "processing" && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
                    <svg
                      className="animate-spin text-stone-600"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-stone-900">
                    Transcribing lecture…
                  </p>
                  <p className="text-xs text-stone-400">
                    Converting speech to text
                  </p>
                </div>
              )}

              {recState === "transcribed" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-stone-900">
                      Lecture Transcript
                    </h3>
                    <span
                      className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded-lg"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {formatRecDuration(recDuration)}
                    </span>
                  </div>
                  <div className="h-40 overflow-y-auto scrollbar-none bg-stone-50 rounded-2xl p-3">
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {MOCK_TRANSCRIPTIONS[editSubject]}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={discardRecording}
                      className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-semibold text-stone-500 hover:bg-stone-50 transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      onClick={insertRecording}
                      className="flex-1 py-3 rounded-2xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition-colors"
                    >
                      Save Recording
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── List ──
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-3 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setFilterSubject("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterSubject === "all" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"}`}
        >
          All
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterSubject === s ? SC[s].pill : "bg-stone-100 text-stone-500"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${SC[s].dot}`}
            />
            {SC[s].label}
          </button>
        ))}
      </div>

      <div className="px-5 pt-3 pb-1">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
          {filtered.length}{" "}
          {filtered.length === 1 ? "note" : "notes"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2 scrollbar-none">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
              <IcoNote cls="text-stone-300" />
            </div>
            <p className="text-stone-400 text-sm font-medium">
              No notes yet
            </p>
            <p className="text-stone-300 text-xs mt-1">
              Tap + to write your first note
            </p>
          </div>
        )}
        {filtered.map((note) => {
          const preview =
            note.body
              .replace(/##\s?/g, "")
              .split("\n")
              .filter(Boolean)[0] ?? "";
          return (
            <button
              key={note.id}
              onClick={() => openExisting(note)}
              className="bg-white rounded-2xl p-4 shadow-sm text-left flex items-start gap-3 hover:shadow-md transition-shadow active:scale-[0.99]"
            >
              <div
                className={`w-1 self-stretch rounded-full flex-shrink-0 ${SC[note.subject].dot}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 leading-snug truncate">
                  {note.title}
                </p>
                {preview && (
                  <p
                    className="text-xs text-stone-400 mt-1 leading-relaxed"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {preview}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${SC[note.subject].pill}`}
                  >
                    {SC[note.subject].label}
                  </span>
                  {note.recordings.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">
                      <svg
                        width="7"
                        height="7"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                      {note.recordings.length}
                    </span>
                  )}
                  {note.attachments.length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-lg">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      {note.attachments.length}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400 ml-auto">
                    {note.updatedAt === TODAY
                      ? "Today"
                      : new Date(
                          note.updatedAt + "T12:00",
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                  </span>
                </div>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="text-stone-300 flex-shrink-0 mt-1"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="px-5 pb-3">
        <button
          onClick={startNew}
          className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors active:scale-[0.98]"
        >
          <IcoPlus cls="text-white" />
          New Note
        </button>
      </div>
    </div>
  );
}

// ── Stats View ─────────────────────────────────────────────────────────────────

function StatsView({
  tasks,
  sessions,
}: {
  tasks: Task[];
  sessions: number;
}) {
  const todayTasks = tasks.filter((t) => t.dueDate === TODAY);
  const todayDone = todayTasks.filter((t) => t.done).length;
  const pct = todayTasks.length
    ? Math.round((todayDone / todayTasks.length) * 100)
    : 0;
  const focusMins = sessions * 25;
  const fh = Math.floor(focusMins / 60),
    fm = focusMins % 60;
  const focusStr =
    fh > 0 ? `${fh}h${fm > 0 ? `${fm}m` : ""}` : `${fm || 0}m`;

  const weekData = [
    { day: "Mon", mins: 75, today: false },
    { day: "Tue", mins: focusMins, today: true },
    { day: "Wed", mins: 0, today: false },
    { day: "Thu", mins: 0, today: false },
    { day: "Fri", mins: 0, today: false },
    { day: "Sat", mins: 0, today: false },
    { day: "Sun", mins: 0, today: false },
  ];
  const maxMins = Math.max(...weekData.map((d) => d.mins), 90);

  const subjectStats = SUBJECTS.map((s) => ({
    s,
    total: tasks.filter((t) => t.subject === s).length,
    done: tasks.filter((t) => t.subject === s && t.done).length,
  })).filter((x) => x.total > 0);

  const weekTotal =
    Math.round(((75 + focusMins) / 60) * 10) / 10;

  return (
    <div className="overflow-y-auto px-5 pt-4 pb-4 flex flex-col gap-4 scrollbar-none">
      {/* Hero grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
            Focus Today
          </p>
          <p
            className="text-3xl font-semibold text-stone-900 mt-1 leading-none"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {focusStr}
          </p>
          <p className="text-xs text-stone-400 mt-1.5">
            {sessions} pomodoros
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
            Tasks Done
          </p>
          <p
            className="text-3xl font-semibold text-stone-900 mt-1 leading-none"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {pct}%
          </p>
          <p className="text-xs text-stone-400 mt-1.5">
            {todayDone} of {todayTasks.length} today
          </p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-orange-400 font-semibold">
            Streak
          </p>
          <p
            className="text-3xl font-bold text-orange-500 mt-1 leading-none"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            3
          </p>
          <p className="text-xs text-orange-400 mt-1.5">
            days in a row
          </p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
            This Week
          </p>
          <p
            className="text-3xl font-bold text-indigo-600 mt-1 leading-none"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {weekTotal}h
          </p>
          <p className="text-xs text-indigo-400 mt-1.5">
            total focus
          </p>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-4">
          Weekly Focus
        </p>
        <div
          className="flex items-end gap-1.5"
          style={{ height: 72 }}
        >
          {weekData.map(({ day, mins, today }) => (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              <div
                className="w-full flex items-end justify-center"
                style={{ height: 56 }}
              >
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${today ? "bg-orange-400" : mins > 0 ? "bg-stone-200" : "bg-stone-100"}`}
                  style={{
                    height:
                      mins > 0
                        ? `${Math.max((mins / maxMins) * 52, 6)}px`
                        : "4px",
                  }}
                />
              </div>
              <span
                className={`text-[9px] font-bold ${today ? "text-orange-500" : "text-stone-400"}`}
              >
                {day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject breakdown */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-3">
          By Subject
        </p>
        <div className="flex flex-col gap-3">
          {subjectStats.map(({ s, total, done }) => (
            <div key={s}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${SC[s].dot}`}
                  />
                  <span className="text-xs font-medium text-stone-700">
                    {SC[s].label}
                  </span>
                </div>
                <span
                  className="text-xs text-stone-400"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {done}/{total}
                </span>
              </div>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${SC[s].dot}`}
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best study time tip */}
      <div className="bg-stone-900 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <IcoTimer s={16} cls="text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">
            Peak Focus Window
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
            You study best between 9–11 AM. Try to schedule
            difficult tasks in the morning.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>("timer");
  const [sessions, setSessions] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS);
  const [events, setEvents] =
    useState<StudyEvent[]>(INIT_EVENTS);
  const [notes, setNotes] = useState<Note[]>(INIT_NOTES);

  const onSessionComplete = useCallback(
    () => setSessions((s) => s + 1),
    [],
  );

  const navItems: {
    id: Tab;
    icon: (active: boolean) => ReactNode;
    label: string;
  }[] = [
    {
      id: "timer",
      label: "Timer",
      icon: (a) => (
        <IcoTimer
          s={20}
          cls={a ? "text-stone-900" : "text-stone-400"}
        />
      ),
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: (a) => (
        <IcoCheck
          s={20}
          cls={a ? "text-stone-900" : "text-stone-400"}
        />
      ),
    },
    {
      id: "planner",
      label: "Planner",
      icon: (a) => (
        <IcoCal
          s={20}
          cls={a ? "text-stone-900" : "text-stone-400"}
        />
      ),
    },
    {
      id: "notes",
      label: "Notes",
      icon: (a) => (
        <IcoNote
          s={20}
          cls={a ? "text-stone-900" : "text-stone-400"}
        />
      ),
    },
    {
      id: "stats",
      label: "Stats",
      icon: (a) => (
        <IcoBar
          s={20}
          cls={a ? "text-stone-900" : "text-stone-400"}
        />
      ),
    },
  ];

  const headerInfo: Record<
    Tab,
    { title: string; sub: string }
  > = {
    timer: {
      title: "Focus Timer",
      sub: "Stay focused, take breaks",
    },
    tasks: { title: "My Tasks", sub: "Tuesday, July 21" },
    planner: { title: "Study Planner", sub: "Week of July 21" },
    notes: {
      title: "Course Notes",
      sub: `${notes.length} notes across ${new Set(notes.map((n) => n.subject)).size} subjects`,
    },
    stats: { title: "Progress", sub: "Your stats this week" },
  };

  return (
    <div
      className="min-h-screen bg-stone-300 flex items-center justify-center p-4"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div
        className="relative w-full max-w-[390px] h-[812px] bg-[#F5F4F0] flex flex-col overflow-hidden rounded-[40px] shadow-2xl"
        style={{
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.35), 0 0 0 10px #1c1917",
        }}
      >
        {/* Notch bar */}
        <div className="flex items-center justify-between px-7 pt-3 pb-2 flex-shrink-0 bg-[#F5F4F0]">
          <span
            className="text-xs font-semibold text-stone-900"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            9:41
          </span>
          <div className="w-24 h-6 bg-stone-900 rounded-full" />
          <div className="flex items-center gap-1">
            {/* Signal bars */}
            <div className="flex items-end gap-[2px]">
              {[3, 5, 7, 9].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] bg-stone-900 rounded-sm"
                  style={{ height: h }}
                />
              ))}
            </div>
            {/* Battery */}
            <div className="flex items-center ml-1">
              <div className="w-5 h-2.5 border border-stone-900 rounded-[3px] relative flex items-center px-px">
                <div
                  className="h-1.5 bg-stone-900 rounded-[2px]"
                  style={{ width: "70%" }}
                />
              </div>
              <div className="w-0.5 h-1.5 bg-stone-900 rounded-r-sm ml-px" />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="px-5 pb-2 flex-shrink-0">
          <h1 className="text-xl font-bold text-stone-900">
            {headerInfo[tab].title}
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {headerInfo[tab].sub}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-hidden">
          {tab === "timer" && (
            <div className="absolute inset-0 overflow-y-auto scrollbar-none">
              <TimerView
                sessions={sessions}
                onSessionComplete={onSessionComplete}
              />
            </div>
          )}
          {tab === "tasks" && (
            <div className="absolute inset-0 flex flex-col">
              <TasksView tasks={tasks} setTasks={setTasks} />
            </div>
          )}
          {tab === "planner" && (
            <div className="absolute inset-0 flex flex-col">
              <PlannerView
                events={events}
                setEvents={setEvents}
              />
            </div>
          )}
          {tab === "notes" && (
            <div className="absolute inset-0 flex flex-col">
              <NotesView notes={notes} setNotes={setNotes} />
            </div>
          )}
          {tab === "stats" && (
            <div className="absolute inset-0 overflow-y-auto scrollbar-none">
              <StatsView tasks={tasks} sessions={sessions} />
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex-shrink-0 bg-white border-t border-stone-100 rounded-b-[40px]">
          <div className="flex items-center px-2 pt-2 pb-1">
            {navItems.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="flex-1 flex flex-col items-center py-1.5 rounded-2xl transition-all"
                >
                  <div
                    className={`transition-transform duration-150 ${active ? "scale-110" : ""}`}
                  >
                    {item.icon(active)}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 font-semibold transition-colors ${active ? "text-stone-900" : "text-stone-400"}`}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <div className="w-1 h-1 rounded-full bg-orange-400 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Home indicator */}
          <div className="flex justify-center pb-2 pt-1">
            <div className="w-28 h-1 bg-stone-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}