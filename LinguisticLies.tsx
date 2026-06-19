import { useState, useEffect, useRef } from "react";

// ── Palette & tokens ──────────────────────────────────────────────
const T = {
  bg: "#0f1117",
  surface: "#181c27",
  border: "#252d3d",
  borderLight: "#2e3a50",
  accent: "#4a90c4",
  accentDim: "#2a5070",
  accentGlow: "rgba(74,144,196,0.15)",
  red: "#c0392b",
  redDim: "rgba(192,57,43,0.15)",
  amber: "#d4a017",
  amberDim: "rgba(212,160,23,0.12)",
  green: "#27ae60",
  greenDim: "rgba(39,174,96,0.12)",
  grey: "#4a5568",
  greyDim: "rgba(74,85,104,0.15)",
  textPrimary: "#e8eaf0",
  textSecondary: "#8892a4",
  textMuted: "#4a5568",
  fontMono: "'Space Mono', monospace",
  fontSans: "'Space Grotesk', sans-serif",
  fontSerif: "'Lora', serif",
};

const INDICATORS = [
  { key: "distancing", name: "Distancing Language", short: "DIST", desc: "Passive voice, impersonal constructions, avoiding ownership" },
  { key: "overqualification", name: "Over-Qualification", short: "OVER-Q", desc: "Excessive hedging that dilutes specific claims" },
  { key: "absoluteDenial", name: "Absolute Denial", short: "ABS-D", desc: "Emphatic denial going beyond what was asked" },
  { key: "pronounShift", name: "Pronoun Shift", short: "PRN", desc: "Loss of first-person ownership at key moments" },
  { key: "deflection", name: "Deflection", short: "DEFL", desc: "Answering a different question; topic-switching" },
  { key: "emotionalEscalation", name: "Emotional Escalation", short: "EMO-ESC", desc: "Disproportionate affect substituting for factual answers" },
];

const PRELOADED = [
  {
    id: "social",
    label: "On social circles",
    case: "Harry v ANL — Cross-examination, 21 Jan 2026",
    text: `"I am not friends with these journalists, I never have been. My social circles were not leaky, I want to make that absolutely clear."`,
  },
  {
    id: "sources",
    label: "On information sources",
    case: "Harry v ANL — Cross-examination, 21 Jan 2026",
    text: `"Having lived within this system my entire life… the kind of information that ends up in these articles is not the kind of thing that I would have been talking about."`,
  },
  {
    id: "suspicion",
    label: "On suspecting associates",
    case: "Harry v ANL — Witness statement, 21 Jan 2026",
    text: `"I always suspected those close to me, including my friends and bodyguards, of being the sources of that private information. If I became suspicious of someone, I would have to cut contact with this person."`,
  },
  {
    id: "purpose",
    label: "On motivation for the claim",
    case: "Harry v ANL — Witness statement, 21 Jan 2026",
    text: `"There is obviously a personal element to bringing this claim, motivated by truth, justice and accountability, but it is not just about me. I am determined to hold Associated accountable, for everyone's sake. I believe it is in the public interest."`,
  },
  {
    id: "meghan",
    label: "On Meghan & the Mail",
    case: "Harry v ANL — Cross-examination, 21 Jan 2026",
    text: `"They continue to come after me, they have made my wife's life an absolute misery. It's fundamentally wrong to put us through this again when all we wanted was an apology and accountability."`,
  },
];

const SIGNAL_META = {
  PRESENT: { color: T.red, bg: T.redDim, label: "PRESENT" },
  PARTIAL: { color: T.amber, bg: T.amberDim, label: "PARTIAL" },
  ABSENT: { color: T.green, bg: T.greenDim, label: "ABSENT" },
  UNCLEAR: { color: T.grey, bg: T.greyDim, label: "UNCLEAR" },
};

const OVERALL_META = {
  HIGH: { color: T.red, label: "HIGH SIGNAL", bar: 85 },
  MEDIUM: { color: T.amber, label: "MEDIUM SIGNAL", bar: 55 },
  LOW: { color: T.green, label: "LOW SIGNAL", bar: 20 },
  INCONCLUSIVE: { color: T.grey, label: "INCONCLUSIVE", bar: 0 },
};

// ── Font injection ────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

// ── Utility components ────────────────────────────────────────────
function Tag({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 7px",
      borderRadius: 2,
      fontSize: 9,
      fontFamily: T.fontMono,
      letterSpacing: "0.14em",
      fontWeight: 700,
      color,
      background: bg,
      border: `1px solid ${color}33`,
    }}>{children}</span>
  );
}

function Pill({ signal }) {
  const m = SIGNAL_META[signal] || SIGNAL_META.UNCLEAR;
  return <Tag color={m.color} bg={m.bg}>{m.label}</Tag>;
}

function Divider({ style }) {
  return <div style={{ borderTop: `1px solid ${T.border}`, ...style }} />;
}

// ── Scan animation ────────────────────────────────────────────────
function ScanText({ text }) {
  const words = text.split(/\s+/);
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setActiveIdx(i => (i + 1) % words.length), 60);
    return () => clearInterval(iv);
  }, [words.length]);
  return (
    <div style={{
      fontFamily: T.fontSerif,
      fontSize: 14,
      lineHeight: 1.8,
      color: T.textSecondary,
      padding: "20px 24px",
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 4,
      maxHeight: 120,
      overflow: "hidden",
    }}>
      {words.map((w, i) => (
        <span key={i} style={{
          color: i === activeIdx ? T.accent : i < activeIdx ? T.textMuted : T.textSecondary,
          background: i === activeIdx ? T.accentGlow : "transparent",
          transition: "color 0.1s, background 0.1s",
          marginRight: 4,
        }}>{w}</span>
      ))}
    </div>
  );
}

// ── Radar chart (SVG) ────────────────────────────────────────────
function RadarChart({ indicators, results }) {
  if (!results) return null;
  const cx = 110, cy = 110, r = 80;
  const n = indicators.length;
  const signalScore = { PRESENT: 1, PARTIAL: 0.6, UNCLEAR: 0.3, ABSENT: 0 };

  const points = indicators.map((ind, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const found = results.indicators?.find(x => x.name === ind.name);
    const score = found ? (signalScore[found.signal] || 0) : 0;
    return {
      x: cx + Math.cos(angle) * r * score,
      y: cy + Math.sin(angle) * r * score,
      lx: cx + Math.cos(angle) * (r + 20),
      ly: cy + Math.sin(angle) * (r + 20),
      label: ind.short,
      score,
    };
  });

  const poly = points.map(p => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      {/* Grid rings */}
      {gridLevels.map(l => {
        const pts = indicators.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return `${cx + Math.cos(angle) * r * l},${cy + Math.sin(angle) * r * l}`;
        }).join(" ");
        return <polygon key={l} points={pts} fill="none" stroke={T.border} strokeWidth={1} />;
      })}
      {/* Spokes */}
      {indicators.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy}
          x2={cx + Math.cos(angle) * r}
          y2={cy + Math.sin(angle) * r}
          stroke={T.border} strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <polygon points={poly} fill={T.accentGlow} stroke={T.accent} strokeWidth={1.5} />
      {/* Labels */}
      {points.map((p, i) => (
        <text key={i} x={p.lx} y={p.ly}
          textAnchor="middle" dominantBaseline="middle"
          fill={T.textMuted} fontSize={8} fontFamily={T.fontMono}
          style={{ letterSpacing: "0.08em" }}>{p.label}</text>
      ))}
    </svg>
  );
}

// ── Overall score bar ─────────────────────────────────────────────
function ScoreBar({ signal }) {
  const meta = OVERALL_META[signal] || OVERALL_META.INCONCLUSIVE;
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(meta.bar), 100);
    return () => clearTimeout(t);
  }, [signal, meta.bar]);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em", color: T.textMuted }}>DECEPTION SIGNAL LEVEL</span>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: "0.1em" }}>{meta.label}</span>
      </div>
      <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${width}%`,
          background: meta.color,
          borderRadius: 3,
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 8px ${meta.color}66`,
        }} />
      </div>
    </div>
  );
}

// ── History item ──────────────────────────────────────────────────
function HistoryItem({ item, active, onClick }) {
  const meta = OVERALL_META[item.result?.overallSignal] || OVERALL_META.INCONCLUSIVE;
  return (
    <button onClick={onClick} style={{
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "10px 12px",
      background: active ? T.accentGlow : "transparent",
      border: `1px solid ${active ? T.accentDim : T.border}`,
      borderRadius: 4,
      cursor: "pointer",
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textPrimary, lineHeight: 1.3, flex: 1, marginRight: 8 }}>{item.label}</span>
        <span style={{ fontFamily: T.fontMono, fontSize: 9, color: meta.color, letterSpacing: "0.1em", flexShrink: 0 }}>{item.result?.overallSignal}</span>
      </div>
      <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textMuted, letterSpacing: "0.06em" }}>{item.timestamp}</div>
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("input"); // input | loading | report
  const [testimony, setTestimony] = useState("");
  const [caseLabel, setCaseLabel] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [activeHistory, setActiveHistory] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  function loadPreset(p) {
    setTestimony(p.text);
    setCaseLabel(p.label + " — " + p.case);
  }

  function loadFromHistory(item) {
    setResult(item.result);
    setTestimony(item.testimony);
    setCaseLabel(item.label);
    setActiveHistory(item.id);
    setScreen("report");
    setActiveTab(0);
  }

  async function runAnalysis() {
    if (!testimony.trim()) return;
    setScreen("loading");
    setError("");

    const systemPrompt = `You are a forensic linguist applying Dr Kirsty King's deception detection framework from "The Language of Lies" to court testimony. Analyse against exactly these six indicators:

1. Distancing Language — passive voice, impersonal constructions, avoiding ownership
2. Over-Qualification — excessive hedging that dilutes specific claims
3. Absolute Denial — emphatic categorical denial beyond what was asked
4. Pronoun Shift — shifts in first-person ownership at critical moments
5. Deflection — answering a different question; topic-switching; broadening to avoid specifics
6. Emotional Escalation — disproportionate emotional intensity substituting for factual answers

You are NOT determining guilt or innocence — only linguistic patterns associated with deception per King's research.

Return ONLY valid JSON, no markdown fences, no preamble:
{
  "overallSignal": "HIGH" | "MEDIUM" | "LOW" | "INCONCLUSIVE",
  "overallSummary": "2-3 sentence forensic summary",
  "indicators": [
    {"name": "Distancing Language", "signal": "PRESENT"|"PARTIAL"|"ABSENT"|"UNCLEAR", "finding": "1-2 sentence finding", "evidenceQuote": "exact phrase from testimony or empty string"},
    {"name": "Over-Qualification", "signal": "...", "finding": "...", "evidenceQuote": "..."},
    {"name": "Absolute Denial", "signal": "...", "finding": "...", "evidenceQuote": "..."},
    {"name": "Pronoun Shift", "signal": "...", "finding": "...", "evidenceQuote": "..."},
    {"name": "Deflection", "signal": "...", "finding": "...", "evidenceQuote": "..."},
    {"name": "Emotional Escalation", "signal": "...", "finding": "...", "evidenceQuote": "..."}
  ],
  "deepAnalysis": "4-5 sentences of detailed forensic narrative covering overall patterns, what they may suggest, and what innocent explanations could also account for these patterns",
  "crossExamination": "2-3 specific questions a barrister could use based on the linguistic patterns found",
  "reliability": "1-2 sentences on confidence level of this analysis given the length and nature of the excerpt"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: `Analyse this court testimony:\n\n${testimony}` }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      const entry = {
        id: Date.now(),
        label: caseLabel || "Untitled excerpt",
        testimony,
        result: parsed,
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory(h => [entry, ...h]);
      setActiveHistory(entry.id);
      setResult(parsed);
      setScreen("report");
      setActiveTab(0);
    } catch (e) {
      setError("Analysis failed. Please check your input and try again.");
      setScreen("input");
    }
  }

  function copyReport() {
    if (!result) return;
    const lines = [
      `FORENSIC LINGUISTIC ANALYSIS`,
      `Case: ${caseLabel}`,
      `Overall Signal: ${result.overallSignal}`,
      ``,
      `SUMMARY`,
      result.overallSummary,
      ``,
      `INDICATOR FINDINGS`,
      ...(result.indicators || []).map(ind => `${ind.name}: ${ind.signal}\n${ind.finding}${ind.evidenceQuote ? `\nEvidence: "${ind.evidenceQuote}"` : ""}`),
      ``,
      `DETAILED ANALYSIS`,
      result.deepAnalysis,
      ``,
      `SUGGESTED CROSS-EXAMINATION`,
      result.crossExamination,
      ``,
      `METHODOLOGICAL NOTE: This analysis applies King (2025) as an investigative tool. Not for evidential submission.`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Styles ──
  const s = {
    app: {
      background: T.bg,
      minHeight: "100vh",
      fontFamily: T.fontSans,
      color: T.textPrimary,
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 24px",
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
      flexShrink: 0,
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 12 },
    logo: {
      fontFamily: T.fontMono,
      fontSize: 13,
      fontWeight: 700,
      color: T.textPrimary,
      letterSpacing: "0.02em",
    },
    logoAccent: { color: T.accent },
    logoSub: {
      fontFamily: T.fontMono,
      fontSize: 9,
      color: T.textMuted,
      letterSpacing: "0.16em",
      marginTop: 1,
    },
    body: { display: "flex", flex: 1, overflow: "hidden", minHeight: 0 },
    sidebar: {
      width: 260,
      borderRight: `1px solid ${T.border}`,
      background: T.surface,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      overflow: "hidden",
    },
    sidebarSection: { padding: "16px", borderBottom: `1px solid ${T.border}` },
    sideLabel: {
      fontFamily: T.fontMono,
      fontSize: 9,
      letterSpacing: "0.16em",
      color: T.textMuted,
      textTransform: "uppercase",
      marginBottom: 10,
      display: "block",
    },
    main: { flex: 1, overflow: "auto", padding: 32 },
  };

  // ── Input screen ──
  const InputScreen = () => (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: T.fontMono,
          fontSize: 9,
          letterSpacing: "0.18em",
          color: T.accent,
          marginBottom: 10,
          textTransform: "uppercase",
        }}>Forensic Linguistic Engine</div>
        <h1 style={{ fontFamily: T.fontSerif, fontSize: 28, fontWeight: 600, lineHeight: 1.25, marginBottom: 10 }}>
          The Language of Lies<br />
          <span style={{ color: T.textSecondary, fontStyle: "italic", fontSize: 20 }}>Deception Analysis Framework</span>
        </h1>
        <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, maxWidth: 540 }}>
          Applies Dr Kirsty King's six forensic linguistic indicators to court testimony. 
          Designed as an investigative tool for legal professionals — not for evidential submission.
        </p>
      </div>

      {/* Case label */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...s.sideLabel, marginBottom: 6 }}>Case / Witness Reference</label>
        <input
          value={caseLabel}
          onChange={e => setCaseLabel(e.target.value)}
          placeholder="e.g. Harry v ANL — Cross-examination, Jan 2026"
          style={{
            width: "100%",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: "10px 14px",
            fontFamily: T.fontSans,
            fontSize: 13,
            color: T.textPrimary,
            outline: "none",
          }}
        />
      </div>

      {/* Textarea */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...s.sideLabel, marginBottom: 0 }}>Testimony Excerpt</label>
          <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted }}>{testimony.length} chars</span>
        </div>
        <textarea
          ref={textareaRef}
          value={testimony}
          onChange={e => setTestimony(e.target.value)}
          placeholder="Paste verbatim court testimony here, or select a preloaded excerpt below…"
          rows={7}
          style={{
            width: "100%",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            padding: "12px 14px",
            fontFamily: T.fontSerif,
            fontSize: 13,
            color: T.textPrimary,
            lineHeight: 1.7,
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: T.redDim, border: `1px solid ${T.red}44`, borderRadius: 4, fontSize: 13, color: T.red, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button
        onClick={runAnalysis}
        disabled={!testimony.trim()}
        style={{
          width: "100%",
          padding: "13px",
          background: testimony.trim() ? T.accent : T.accentDim,
          color: testimony.trim() ? "#fff" : T.textMuted,
          border: "none",
          borderRadius: 4,
          cursor: testimony.trim() ? "pointer" : "not-allowed",
          fontFamily: T.fontMono,
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          transition: "background 0.2s",
          marginBottom: 32,
        }}
      >
        ▶ &nbsp; Run Forensic Analysis
      </button>

      {/* Preloaded */}
      <div>
        <div style={{ ...s.sideLabel, marginBottom: 12 }}>Preloaded — Harry v Associated Newspapers Ltd, Jan 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {PRELOADED.map(p => (
            <button key={p.id} onClick={() => loadPreset(p)} style={{
              textAlign: "left",
              padding: "11px 14px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontFamily: T.fontSerif, fontStyle: "italic", fontSize: 11, color: T.textMuted, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.text}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Loading screen ──
  const LoadingScreen = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24 }}>
      <div style={{ fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em", color: T.accent, textTransform: "uppercase" }}>
        Scanning Testimony
      </div>
      <div style={{ width: "min(480px, 90%)" }}>
        <ScanText text={testimony} />
      </div>
      <div style={{ fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase" }}>
        Applying King's Six Indicators…
      </div>
      <div style={{ width: 240, height: 3, background: T.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
          animation: "scan 1.6s ease-in-out infinite",
        }} />
        <style>{`@keyframes scan { 0%{width:0;marginLeft:0} 50%{width:60%;marginLeft:20%} 100%{width:0;marginLeft:100%} }`}</style>
      </div>
    </div>
  );

  // ── Report screen ──
  const ReportScreen = () => {
    if (!result) return null;
    const tabs = ["Overview", "Indicators", "Analysis", "Counsel"];

    return (
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* Report header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
              Forensic Analysis Report
            </div>
            <div style={{ fontFamily: T.fontSerif, fontStyle: "italic", fontSize: 17, color: T.textPrimary, marginBottom: 4 }}>
              {caseLabel || "Court Testimony Excerpt"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setScreen("input")} style={{
              padding: "7px 14px",
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: T.fontMono,
              fontSize: 10,
              color: T.textSecondary,
              letterSpacing: "0.1em",
            }}>← New</button>
            <button onClick={copyReport} style={{
              padding: "7px 14px",
              background: copied ? T.greenDim : "transparent",
              border: `1px solid ${copied ? T.green : T.border}`,
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: T.fontMono,
              fontSize: 10,
              color: copied ? T.green : T.textSecondary,
              letterSpacing: "0.1em",
              transition: "all 0.2s",
            }}>{copied ? "✓ Copied" : "Copy Report"}</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{
              padding: "8px 18px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : "2px solid transparent",
              cursor: "pointer",
              fontFamily: T.fontSans,
              fontSize: 13,
              fontWeight: activeTab === i ? 600 : 400,
              color: activeTab === i ? T.textPrimary : T.textSecondary,
              transition: "color 0.15s",
              marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        {/* Tab 0: Overview */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, marginBottom: 24 }}>
              <div>
                <ScoreBar signal={result.overallSignal} />
                <div style={{
                  padding: "18px 20px",
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 4,
                }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase", marginBottom: 10 }}>Overall Assessment</div>
                  <p style={{ fontFamily: T.fontSerif, fontSize: 14, lineHeight: 1.75, color: T.textPrimary }}>{result.overallSummary}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
                <RadarChart indicators={INDICATORS} results={result} />
                <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.textMuted, letterSpacing: "0.1em", marginTop: 4 }}>INDICATOR MAP</div>
              </div>
            </div>

            {/* Quick indicator grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {result.indicators?.map(ind => {
                const m = SIGNAL_META[ind.signal] || SIGNAL_META.UNCLEAR;
                return (
                  <div key={ind.name} onClick={() => setActiveTab(1)} style={{
                    padding: "12px 14px",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = m.color + "66"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textPrimary }}>{ind.name}</span>
                      <Pill signal={ind.signal} />
                    </div>
                    <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.5 }}>{ind.finding}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Indicators */}
        {activeTab === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.indicators?.map(ind => {
              const m = SIGNAL_META[ind.signal] || SIGNAL_META.UNCLEAR;
              const base = INDICATORS.find(i => i.name === ind.name);
              return (
                <div key={ind.name} style={{
                  padding: "18px 20px",
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderLeft: `3px solid ${m.color}`,
                  borderRadius: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Pill signal={ind.signal} />
                    <span style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600 }}>{ind.name}</span>
                  </div>
                  {base && (
                    <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted, marginBottom: 10, letterSpacing: "0.04em" }}>
                      {base.desc}
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, marginBottom: ind.evidenceQuote ? 12 : 0 }}>
                    {ind.finding}
                  </p>
                  {ind.evidenceQuote && (
                    <div style={{
                      padding: "10px 14px",
                      background: T.bg,
                      borderLeft: `2px solid ${m.color}55`,
                      borderRadius: 2,
                      fontFamily: T.fontSerif,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: T.textSecondary,
                      lineHeight: 1.65,
                    }}>
                      "{ind.evidenceQuote}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Analysis */}
        {activeTab === 2 && (
          <div>
            <div style={{ padding: "20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 16 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase", marginBottom: 12 }}>
                Detailed Forensic Narrative
              </div>
              <div style={{ fontFamily: T.fontSerif, fontSize: 14, lineHeight: 1.85, color: T.textPrimary }}>
                {result.deepAnalysis}
              </div>
            </div>
            <div style={{ padding: "16px 20px", background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 4 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                Reliability Assessment
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7 }}>{result.reliability}</div>
            </div>
          </div>
        )}

        {/* Tab 3: Counsel */}
        {activeTab === 3 && (
          <div>
            <div style={{ padding: "20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, marginBottom: 16 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase", marginBottom: 12 }}>
                Suggested Cross-Examination Lines
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 14, lineHeight: 1.85, color: T.textPrimary, whiteSpace: "pre-line" }}>
                {result.crossExamination}
              </div>
            </div>

            {/* Original testimony */}
            <div style={{ padding: "18px 20px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase", marginBottom: 12 }}>
                Source Testimony
              </div>
              <div style={{ fontFamily: T.fontSerif, fontStyle: "italic", fontSize: 13, color: T.textSecondary, lineHeight: 1.75 }}>
                {testimony}
              </div>
            </div>

            {/* Caveat */}
            <div style={{ marginTop: 16, padding: "14px 16px", background: T.bg, border: `1px dashed ${T.border}`, borderRadius: 4 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.14em", color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                Methodological Caveat
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
                This analysis applies King's forensic linguistic indicators as an investigative tool. Deception markers are probabilistic, not determinative. Innocent witnesses under stress, those with trauma histories, or individuals from high-surveillance environments may produce similar patterns for non-deceptive reasons. These findings must be validated by a qualified forensic linguist before informing legal strategy. Not for evidential submission.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <FontLoader />
      <div style={s.app}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div>
              <div style={s.logo}>
                <span style={s.logoAccent}>⬡</span> LinguaLex
              </div>
              <div style={s.logoSub}>Language of Lies · Deception Analysis</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Tag color={T.accent} bg={T.accentGlow}>King Framework v1</Tag>
            <Tag color={T.textMuted} bg={T.greyDim}>Investigative Only</Tag>
          </div>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            <div style={{ ...s.sidebarSection }}>
              <span style={s.sideLabel}>King's Indicators</span>
              {INDICATORS.map(ind => {
                const found = result?.indicators?.find(x => x.name === ind.name);
                const m = found ? SIGNAL_META[found.signal] : null;
                return (
                  <div key={ind.key} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: m ? m.color : T.border,
                      marginTop: 5, flexShrink: 0,
                      boxShadow: m ? `0 0 6px ${m.color}66` : "none",
                      transition: "background 0.3s",
                    }} />
                    <div>
                      <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 500, color: T.textPrimary }}>{ind.name}</div>
                      <div style={{ fontFamily: T.fontSans, fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>{ind.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {history.length > 0 && (
              <div style={{ ...s.sidebarSection, flex: 1, overflowY: "auto" }}>
                <span style={s.sideLabel}>Analysis History</span>
                {history.map(item => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    active={activeHistory === item.id && screen === "report"}
                    onClick={() => loadFromHistory(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Main */}
          <div style={s.main}>
            {screen === "input" && <InputScreen />}
            {screen === "loading" && <LoadingScreen />}
            {screen === "report" && <ReportScreen />}
          </div>
        </div>
      </div>
    </>
  );
}
