
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Static Question Data ───────────────────────────────────────────────────
import { QUESTIONS } from "./questions";

const CATEGORY_META = {
  movies: { label: "Movies", icon: "🎬", color: "#a855f7", glow: "rgba(168,85,247,0.4)" },
  songs: { label: "Songs", icon: "🎵", color: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  celebrities: { label: "Celebrities", icon: "⭐", color: "#f59e0b", glow: "rgba(245,158,11,0.4)" },
};

// ─── Sound Effects (Web Audio API) ─────────────────────────────────────────
const useSound = () => {
  const ctx = useRef(null);
  const getCtx = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctx.current;
  };
  const play = useCallback((type) => {
    try {
      const ac = getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      if (type === "correct") {
        o.frequency.setValueAtTime(523, ac.currentTime);
        o.frequency.setValueAtTime(659, ac.currentTime + 0.1);
        o.frequency.setValueAtTime(784, ac.currentTime + 0.2);
        g.gain.setValueAtTime(0.3, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
        o.start(); o.stop(ac.currentTime + 0.5);
      } else if (type === "wrong") {
        o.frequency.setValueAtTime(200, ac.currentTime);
        o.type = "sawtooth";
        g.gain.setValueAtTime(0.2, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
        o.start(); o.stop(ac.currentTime + 0.3);
      } else if (type === "hint") {
        o.frequency.setValueAtTime(440, ac.currentTime);
        g.gain.setValueAtTime(0.15, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
        o.start(); o.stop(ac.currentTime + 0.2);
      } else if (type === "tick") {
        o.frequency.setValueAtTime(880, ac.currentTime);
        g.gain.setValueAtTime(0.05, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
        o.start(); o.stop(ac.currentTime + 0.05);
      }
    } catch {}
  }, []);
  return play;
};

// ─── Zustand-like State (inline, no external lib needed) ───────────────────
const STORAGE_KEY = "guessverse_v4";
const defaultState = () => ({
  screen: "home",
  category: null,
  questionIndex: 0,
  roundNumber: 1,
  playedQuestionIds: [],
  hintsUsed: 0,
  score: 0,
  totalScore: 0,
  timeLeft: 30,
  answered: false,
  answeredCorrectly: false,
  questionsCompleted: [],
  leaderboard: [],
  playerName: "",
  soundEnabled: true,
});

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      const rawLb = parsed.leaderboard || [];
      const uniqueLb = rawLb.filter((v,i,a)=>a.findIndex(t=>(t.name===v.name && t.score===v.score && t.category===v.category))===i);
      return { ...defaultState(), leaderboard: uniqueLb };
    }
  } catch {}
  return defaultState();
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ leaderboard: state.leaderboard }));
  } catch {}
}



// ─── Components ─────────────────────────────────────────────────────────────

function StarRating({ score, max = 300 }) {
  const pct = score / max;
  const stars = pct > 0.7 ? 3 : pct > 0.4 ? 2 : pct > 0.1 ? 1 : 0;
  return (
    <div className="stars">
      {[1,2,3].map(i => (
        <span key={i} style={{ filter: i <= stars ? `drop-shadow(0 0 8px gold)` : "grayscale(1) opacity(0.3)" }}>⭐</span>
      ))}
    </div>
  );
}

function TimerRing({ timeLeft, maxTime = 30, color }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / maxTime;
  const strokeColor = timeLeft > 10 ? color : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="timer-ring">
      <svg viewBox="0 0 64 64">
        <circle className="timer-bg" cx="32" cy="32" r={r} />
        <circle
          className="timer-fill"
          cx="32" cy="32" r={r}
          stroke={strokeColor}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
        />
      </svg>
      <span className="timer-text" style={{ color: strokeColor }}>{timeLeft}</span>
    </div>
  );
}

// ─── Screens ────────────────────────────────────────────────────────────────

function HomeScreen({ state, setState, play }) {
  const [tab, setTab] = useState("play");
  const [name, setName] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", width: "100%", animation: "slideIn 0.5s ease" }}>
      <div className="floating" style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "3.5rem", textAlign: "center", filter: "drop-shadow(0 0 24px rgba(168,85,247,0.8))" }}>🎮</div>
      </div>
      <h1 className="title">GuessVerse</h1>
      <p className="subtitle">Test Your Pop Culture Knowledge</p>

      <div className="nav-tabs">
        <button className={`nav-tab ${tab === "play" ? "active" : ""}`} onClick={() => setTab("play")}>PLAY</button>
        <button className={`nav-tab ${tab === "leaderboard" ? "active" : ""}`} onClick={() => setTab("leaderboard")}>LEADERBOARD</button>
        <button className={`nav-tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>INFO</button>
      </div>

      {tab === "play" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", width: "100%" }}>
          <div className="glass" style={{ width: "100%", maxWidth: "420px" }}>
            <p style={{ fontSize: "0.8rem", letterSpacing: "2px", color: "rgba(148,163,184,0.6)", marginBottom: "10px", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif" }}>Your Name</p>
            <input
              className="name-input"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              style={{ border: !name.trim() && tab === "play" ? "1px solid rgba(239,68,68,0.3)" : "" }}
            />
            <p style={{ fontSize: "0.8rem", letterSpacing: "2px", color: "rgba(148,163,184,0.6)", marginBottom: "14px", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif" }}>Choose Category</p>
            <div className="category-grid">
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <button
                  key={key}
                  className={`category-btn cat-${key}`}
                  onClick={() => {
                    if (!name.trim()) {
                      alert("Please enter your name to start the journey!");
                      return;
                    }
                    play("hint");
                    setState(s => ({
                      ...s, screen: "game", category: key,
                      questionIndex: Math.floor(Math.random() * QUESTIONS[key].length),
                      roundNumber: 1, playedQuestionIds: [],
                      hintsUsed: 0, score: 0, totalScore: 0, timeLeft: 30, answered: false,
                      answeredCorrectly: false, questionsCompleted: [],
                      playerName: name.trim(),
                    }));
                  }}
                >
                  <span className="cat-icon">{meta.icon}</span>
                  <span className="cat-label">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>
          <p style={{ color: "rgba(148,163,184,0.4)", fontSize: "0.85rem", letterSpacing: "1px", textAlign: "center" }}>
            3 hints per question · Score decreases with hints · 30 seconds each
          </p>
        </div>
      ) : tab === "leaderboard" ? (
        <LeaderboardPanel leaderboard={state.leaderboard} setState={setState} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "600px" }}>
          <div className="glass">
            <h3 style={{ marginBottom: "16px", color: "var(--primary-accent)", letterSpacing: "1px" }}>📖 HOW TO PLAY</h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <li>• Select a category: <b>Movies, Songs, or Celebrities.</b></li>
              <li>• You get <b>3 clues</b> per question. Hints reveal more clues but cost points!</li>
              <li>• Type your answer. <b>Partial matches</b> (like "Messi" for "Lionel Messi") are accepted.</li>
              <li>• Each round has a <b>30-second timer</b>. Be quick!</li>
              <li>• Play infinitely and climb the <b>Hall of Fame</b>.</li>
            </ul>
          </div>
          <div className="glass">
            <h3 style={{ marginBottom: "16px", color: "var(--secondary-accent)", letterSpacing: "1px" }}>✨ ABOUT GUESSVERSE</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: "1.6", fontSize: "0.95rem" }}>
              GuessVerse is a premium trivia experience designed for pop culture enthusiasts. 
              Featuring infinite gameplay, live Wikipedia-powered autocomplete, and a stunning 
              glassmorphic design, it's the ultimate test of your knowledge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardPanel({ leaderboard, setState }) {
  const medals = ["🥇", "🥈", "🥉"];
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
  return (
    <div className="leaderboard">
      <div className="lb-title">Hall of Fame</div>
      {sorted.length === 0 ? (
        <div className="glass-sm" style={{ textAlign: "center", color: "rgba(148,163,184,0.4)", padding: "32px" }}>
          No scores yet. Play to get on the board!
        </div>
      ) : (
        <>
          {sorted.map((entry, i) => (
            <div key={i} className={`lb-row ${i === 0 ? "top-1" : i === 1 ? "top-2" : i === 2 ? "top-3" : ""}`}>
              <span className="lb-rank">{medals[i] || `#${i + 1}`}</span>
              <div style={{ flex: 1 }}>
                <div className="lb-name">{entry.name}</div>
                <div className="lb-cat">{CATEGORY_META[entry.category]?.icon} {CATEGORY_META[entry.category]?.label}</div>
              </div>
              <span className="lb-pts">{entry.score} pts</span>
            </div>
          ))}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: "0.6rem", opacity: 0.5 }}
              onClick={() => {
                if (confirm("Are you sure you want to clear all high scores?")) {
                  localStorage.removeItem(STORAGE_KEY);
                  setState(s => ({ ...s, leaderboard: [] }));
                }
              }}
            >
              🗑️ RESET LEADERBOARD
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GameScreen({ state, setState, play }) {
  const [guess, setGuess] = useState("");
  const [inputState, setInputState] = useState("idle"); // idle | correct | wrong
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Autocomplete
  useEffect(() => {
    if (!guess.trim() || state.answered) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      // Local matches
      const localMatches = QUESTIONS[state.category]
        .map(q => q.answer)
        .filter(ans => ans.toLowerCase().includes(guess.toLowerCase()));
      
      // Wikipedia Opensearch
      fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(guess)}&limit=5&origin=*`)
        .then(r => r.json())
        .then(data => {
          const wikiMatches = data[1] || [];
          const combined = Array.from(new Set([...localMatches, ...wikiMatches])).slice(0, 6);
          setSuggestions(combined);
          setShowSuggestions(combined.length > 0);
        })
        .catch(() => {
          setSuggestions(localMatches.slice(0, 6));
          setShowSuggestions(localMatches.length > 0);
        });
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [guess, state.answered, state.category]);

  const questions = QUESTIONS[state.category] || [];
  const current = questions[state.questionIndex];
  const meta = CATEGORY_META[state.category];
  const cluePoints = [300, 200, 100];
  const currentPoints = cluePoints[state.hintsUsed] || 100;

  // Timer
  useEffect(() => {
    if (state.answered) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setState(s => {
        if (s.timeLeft <= 1) {
          clearInterval(timerRef.current);
          play("wrong");
          return { ...s, timeLeft: 0, answered: true, answeredCorrectly: false };
        }
        if (s.timeLeft === 10 || s.timeLeft === 5) play("tick");
        return { ...s, timeLeft: s.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state.answered, state.questionIndex]);

  const handleHint = () => {
    if (state.hintsUsed >= 2 || state.answered) return;
    play("hint");
    setState(s => ({ ...s, hintsUsed: s.hintsUsed + 1 }));
  };

  const handleGuess = () => {
    if (!guess.trim() || state.answered) return;
    const g = guess.trim().toLowerCase();
    const a = current.answer.toLowerCase();
    const correct = a === g || (a.includes(g) && g.length >= 4) || a.replace(/[^a-z0-9]/g, '') === g.replace(/[^a-z0-9]/g, '');
    if (correct) {
      play("correct");
      setInputState("correct");
      clearInterval(timerRef.current);
      setState(s => ({
        ...s, answered: true, answeredCorrectly: true,
        score: s.score + currentPoints, totalScore: s.totalScore + currentPoints,
        questionsCompleted: [...s.questionsCompleted, { q: current.id, pts: currentPoints, correct: true }],
      }));
    } else {
      play("wrong");
      setInputState("wrong");
      setTimeout(() => setInputState("idle"), 600);
    }
  };

  const handleNext = () => {
    setGuess(""); setInputState("idle");
    setState(s => {
      let played = [...s.playedQuestionIds, current.id];
      if (played.length >= questions.length) played = []; // Reset if all played
      const availableIndices = questions.map((_, i) => i).filter(i => !played.includes(questions[i].id));
      const nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      return { 
        ...s, questionIndex: nextIndex, roundNumber: s.roundNumber + 1, playedQuestionIds: played,
        hintsUsed: 0, timeLeft: 30, answered: false, answeredCorrectly: false 
      };
    });
  };

  const handleSkip = () => {
    play("wrong");
    clearInterval(timerRef.current);
    setState(s => ({
      ...s, answered: true, answeredCorrectly: false,
      questionsCompleted: [...s.questionsCompleted, { q: current.id, pts: 0, correct: false }],
    }));
  };

  const progress = ((state.questionIndex) / questions.length) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", animation: "slideIn 0.4s ease" }}>
      {/* Header */}
      <div className="game-header">
        <div className="score-badge">⚡ {state.score} pts</div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ color: meta.color, fontSize: "1.4rem", filter: `drop-shadow(0 0 8px ${meta.glow})` }}>{meta.icon}</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.75rem", letterSpacing: "2px", color: "rgba(148,163,184,0.6)" }}>{meta.label.toUpperCase()}</span>
        </div>
        <TimerRing timeLeft={state.timeLeft} color={meta.color} />
      </div>

      {/* Progress */}
      <div className="q-counter">ROUND {state.roundNumber}</div>
      <div className="progress-bar" style={{ maxWidth: "700px" }}>
        <div className="progress-fill" style={{ width: `100%`, background: `linear-gradient(90deg, ${meta.color}, rgba(168,85,247,0.8))` }} />
      </div>

      {/* Question Card */}
      <div className="glass question-card" key={state.questionIndex}>
        {/* Points tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <span className="points-tag" style={{ background: `rgba(168,85,247,0.15)`, border: `1px solid rgba(168,85,247,0.3)`, color: "#c084fc" }}>
            ⚡ {currentPoints} PTS
          </span>
          <div className="hints-bar">
            {[0,1,2].map(i => (
              <div key={i} className={`hint-pip ${i < state.hintsUsed ? "used" : ""}`} />
            ))}
            <span style={{ fontSize: "0.75rem", color: "rgba(148,163,184,0.5)", marginLeft: "6px", fontFamily: "'Orbitron', monospace", letterSpacing: "1px" }}>
              {3 - state.hintsUsed} left
            </span>
          </div>
        </div>

        {/* Clues */}
        <ul className="clue-list">
          {current.clues.slice(0, state.hintsUsed + 1).map((clue, i) => (
            <li key={i} className="clue-item" style={{ borderColor: i === 0 ? meta.color : i === 1 ? "#f59e0b" : "#ef4444" }}>
              <span className="clue-num">#{i + 1}</span>
              <span className="clue-text">{clue}</span>
            </li>
          ))}
        </ul>

        {/* Input */}
        {!state.answered ? (
          <>
            <div className="input-row">
              <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
                <input
                  ref={inputRef}
                  className={`guess-input ${inputState}`}
                  placeholder="Type your answer..."
                  value={guess}
                  onChange={e => { setGuess(e.target.value); setShowSuggestions(true); }}
                  onKeyDown={e => e.key === "Enter" && handleGuess()}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoFocus
                  style={{ width: "100%" }}
                />
                {showSuggestions && (
                  <ul style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                    background: "rgba(15,23,42,0.95)", border: "1px solid rgba(168,85,247,0.4)",
                    borderRadius: "8px", marginTop: "4px", listStyle: "none", padding: "4px 0",
                    backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
                  }}>
                    {suggestions.map((s, idx) => (
                      <li key={idx} 
                        onMouseDown={(e) => { e.preventDefault(); setGuess(s); setShowSuggestions(false); }}
                        style={{ padding: "10px 16px", cursor: "pointer", color: "#e2e8f0", fontFamily: "'Rajdhani', sans-serif", fontSize: "1.05rem", fontWeight: 600 }}
                        onMouseEnter={e => e.target.style.background = "rgba(168,85,247,0.2)"}
                        onMouseLeave={e => e.target.style.background = "transparent"}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button className="btn btn-primary" onClick={handleGuess}>GO</button>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
              <button
                className="btn btn-hint"
                onClick={handleHint}
                disabled={state.hintsUsed >= 2}
              >
                💡 HINT {state.hintsUsed > 0 ? `(${state.hintsUsed}/2)` : ""}
              </button>
              <button className="btn btn-danger" onClick={handleSkip}>SKIP →</button>
            </div>
          </>
        ) : (
          <div>
            {state.answeredCorrectly ? (
              <div className="feedback-banner feedback-correct">
                🎉 CORRECT! +{currentPoints} POINTS
              </div>
            ) : (
              <div>
                <div className="feedback-banner feedback-wrong">
                  ✗ TIME UP / SKIPPED
                </div>
                <p className="reveal-answer">Answer: {current.answer}</p>
              </div>
            )}
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <button className="btn btn-primary" onClick={handleNext} style={{ animation: "pulse-glow 2s infinite" }}>
                {"NEXT QUESTION →"}
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        className="btn btn-secondary"
        onClick={() => {
          setState(s => {
            const entry = { name: s.playerName || "Anonymous", score: s.score, category: s.category, date: Date.now() };
            const lb = [...(s.leaderboard || []), entry].sort((a, b) => b.score - a.score).slice(0, 20);
            return { ...s, screen: "end", leaderboard: lb };
          });
        }}
        style={{ marginTop: "16px", fontSize: "0.65rem" }}
      >
        ⬛ END GAME
      </button>
    </div>
  );
}

function EndScreen({ state, setState, play }) {
  const meta = CATEGORY_META[state.category];
  const questions = QUESTIONS[state.category] || [];
  const correct = state.questionsCompleted.filter(q => q.correct).length;

  useEffect(() => {
    play("correct");
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", animation: "slideIn 0.5s ease", width: "100%" }}>
      <div className="end-card glass">
        <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "8px", animation: "float 3s ease-in-out infinite" }}>
          {state.score > 700 ? "🏆" : state.score > 400 ? "🥈" : state.score > 200 ? "🥉" : "🎮"}
        </div>
        <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: "1rem", letterSpacing: "4px", color: "rgba(148,163,184,0.6)", textAlign: "center", marginBottom: "4px" }}>
          FINAL SCORE
        </h2>
        <div className="end-score">{state.score}</div>
        <StarRating score={state.score} max={questions.length * 300} />
        <p style={{ textAlign: "center", color: "rgba(148,163,184,0.6)", fontSize: "0.95rem", marginBottom: "20px" }}>
          {correct} of {questions.length} correct · {meta.icon} {meta.label}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
          {[
            { label: "Correct", value: correct, color: "#4ade80" },
            { label: "Skipped", value: questions.length - correct, color: "#f87171" },
            { label: "Best Score", value: `${Math.max(...state.questionsCompleted.map(q => q.pts), 0)} pts`, color: "#c084fc" },
            { label: "Category", value: meta.label, color: meta.color },
          ].map((item, i) => (
            <div key={i} className="glass-sm" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", letterSpacing: "2px", color: "rgba(148,163,184,0.5)", fontFamily: "'Orbitron', monospace", marginBottom: "4px" }}>{item.label.toUpperCase()}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: item.color, fontFamily: "'Orbitron', monospace" }}>{item.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => {
            play("hint");
            setState(s => ({
              ...s, screen: "game", 
              questionIndex: Math.floor(Math.random() * QUESTIONS[s.category].length),
              roundNumber: 1, playedQuestionIds: [],
              hintsUsed: 0, score: 0, totalScore: 0, timeLeft: 30, 
              answered: false, answeredCorrectly: false, questionsCompleted: [],
            }));
          }}>
            🔄 PLAY AGAIN
          </button>
          <button className="btn btn-secondary" onClick={() => setState(s => ({ ...s, screen: "home" }))}>
            ← HOME
          </button>
        </div>
      </div>
      <LeaderboardPanel leaderboard={state.leaderboard} setState={setState} />
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function GuessVerse() {
  const [state, setState] = useState(loadState);
  const play = useSound();

  // Persist leaderboard changes
  useEffect(() => { saveState(state); }, [state.leaderboard]);

  const toggleSound = () => setState(s => ({ ...s, soundEnabled: !s.soundEnabled }));
  const soundPlay = useCallback((t) => { if (state.soundEnabled) play(t); }, [state.soundEnabled, play]);

  return (
    <>
      <div className="app">
        <button className="sound-btn" onClick={toggleSound} title="Toggle Sound">
          {state.soundEnabled ? "🔊" : "🔇"}
        </button>
        <div className="container">
          {state.screen === "home" && <HomeScreen state={state} setState={setState} play={soundPlay} />}
          {state.screen === "game" && <GameScreen state={state} setState={setState} play={soundPlay} />}
          {state.screen === "end" && <EndScreen state={state} setState={setState} play={soundPlay} />}
        </div>
      </div>
    </>
  );
}
