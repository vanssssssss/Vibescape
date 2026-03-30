import { useState, useEffect, useRef } from "react";

const features = [
  {
    id: 1,
    tag: "Our Mission",
    headline: "Discover Your Vibe,\nNot Just a Place",
    sub: "VibeScape doesn't give you a list of restaurants. It reads the energy you're chasing — quiet rooftops, buzzing street markets, hidden bookshops — and finds places that actually match your mood.",
    accent: "#7C3AED",
    lightAccent: "rgba(124,58,237,0.08)",
    borderAccent: "rgba(124,58,237,0.2)",
    emoji: "🌍",
    mockups: [
      {
        rotate: "-4deg", top: "10%", right: "4%", width: "200px",
        content: (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "14px", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ color: "#7C3AED", fontSize: "10px", fontWeight: 700, marginBottom: "8px", letterSpacing: "1px" }}>VIBE SEARCH</div>
            <div style={{ background: "#F3F4F6", borderRadius: "10px", padding: "8px 12px", color: "#374151", fontSize: "12px", border: "1px solid #E5E7EB" }}>
              "cozy corner with good coffee ☕"
            </div>
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
              {["Brewed Awakening Café", "The Study Nook", "Whispering Pages"].map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 8px", borderRadius: "8px", background: "#F9FAFB" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7C3AED", flexShrink: 0 }} />
                  <span style={{ color: "#374151", fontSize: "11px" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        rotate: "4deg", top: "55%", right: "10%", width: "160px",
        content: (
          <div style={{ background: "#7C3AED", borderRadius: "14px", padding: "12px", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px", marginBottom: "2px" }}>MATCH SCORE</div>
            <div style={{ color: "white", fontSize: "26px", fontWeight: 900 }}>94%</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", marginBottom: "8px" }}>Vibe compatibility</div>
            <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "6px", height: "5px" }}>
              <div style={{ background: "white", borderRadius: "6px", height: "5px", width: "94%" }} />
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 2,
    tag: "Memories",
    headline: "Every Place Deserves\na Story",
    sub: "Pin photos, jot notes, and build a living journal of every place you've visited. Your memories are tagged to the exact spot on the map — ready to relive any time.",
    accent: "#10B981",
    lightAccent: "rgba(16,185,129,0.08)",
    borderAccent: "rgba(16,185,129,0.2)",
    emoji: "📸",
    mockups: [
      {
        rotate: "3deg", top: "8%", right: "4%", width: "195px",
        content: (
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #E5E7EB", background: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ height: "90px", background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>🏔️</div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ color: "#10B981", fontSize: "10px", fontWeight: 700, marginBottom: "3px" }}>MEMORY · JAN 2025</div>
              <div style={{ color: "#111827", fontSize: "13px", fontWeight: 700 }}>Sunset Ridge Trail</div>
              <div style={{ color: "#6B7280", fontSize: "11px", marginTop: "4px" }}>"Best golden hour I've ever seen!"</div>
            </div>
          </div>
        )
      },
      {
        rotate: "-4deg", top: "55%", right: "10%", width: "155px",
        content: (
          <div style={{ background: "#fff", borderRadius: "12px", padding: "10px 12px", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", gap: "5px", marginBottom: "6px" }}>
              {["#D1FAE5", "#6EE7B7", "#10B981"].map((c, i) => (
                <div key={i} style={{ flex: 1, height: "44px", borderRadius: "8px", background: c }} />
              ))}
            </div>
            <div style={{ color: "#374151", fontSize: "11px" }}>📍 3 photos saved</div>
          </div>
        )
      }
    ]
  },
  {
    id: 3,
    tag: "Saved Places",
    headline: "Your Personal\nTravel Wishlist",
    sub: "Bookmark places you want to visit, then mark them done when you've been. Your favourites list becomes a bucket list that tracks your adventures automatically.",
    accent: "#F59E0B",
    lightAccent: "rgba(245,158,11,0.08)",
    borderAccent: "rgba(245,158,11,0.2)",
    emoji: "⭐",
    mockups: [
      {
        rotate: "-3deg", top: "8%", right: "4%", width: "200px",
        content: (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "14px", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ color: "#F59E0B", fontSize: "10px", fontWeight: 700, marginBottom: "10px", letterSpacing: "1px" }}>TO VISIT</div>
            {[
              { name: "Amber Fort", visited: false },
              { name: "Jantar Mantar", visited: true },
              { name: "Hawa Mahal", visited: false },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 8px", borderRadius: "10px", marginBottom: "5px", background: "#F9FAFB", border: `1px solid ${p.visited ? "rgba(16,185,129,0.2)" : "#F3F4F6"}` }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: p.visited ? "#10B981" : "#FEF3C7", border: `2px solid ${p.visited ? "#10B981" : "#F59E0B"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {p.visited && <span style={{ color: "white", fontSize: "9px" }}>✓</span>}
                </div>
                <span style={{ color: p.visited ? "#10B981" : "#374151", fontSize: "11px", textDecoration: p.visited ? "line-through" : "none", opacity: p.visited ? 0.7 : 1 }}>{p.name}</span>
                {!p.visited && <span style={{ marginLeft: "auto", fontSize: "12px" }}>⭐</span>}
              </div>
            ))}
          </div>
        )
      },
      {
        rotate: "5deg", top: "55%", right: "10%", width: "150px",
        content: (
          <div style={{ background: "#fff", borderRadius: "12px", padding: "12px", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#F59E0B" }}>12 <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 400 }}>saved</span></div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#10B981" }}>7 <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 400 }}>visited</span></div>
            <div style={{ marginTop: "8px", height: "4px", borderRadius: "4px", background: "#F3F4F6" }}>
              <div style={{ height: "4px", borderRadius: "4px", width: "58%", background: "linear-gradient(90deg, #F59E0B, #10B981)" }} />
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 4,
    tag: "Vibe Search",
    headline: "Describe the Mood,\nFind the Place",
    sub: "Type 'cozy rainy evening read' or 'rooftop with city lights' — VibeScape's AI translates your feeling into real places on the map, ranked by how well they match your energy.",
    accent: "#7C3AED",
    lightAccent: "rgba(124,58,237,0.08)",
    borderAccent: "rgba(124,58,237,0.2)",
    emoji: "🔍",
    mockups: [
      {
        rotate: "4deg", top: "8%", right: "4%", width: "190px",
        content: (
          <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ height: "75px", background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>🗺️</div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ color: "#7C3AED", fontSize: "10px", fontWeight: 700, marginBottom: "3px" }}>AI MATCH · 5 RESULTS</div>
              <div style={{ color: "#111827", fontSize: "12px", fontWeight: 700 }}>"rooftop city vibes 🌃"</div>
              <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                {["Terrace", "Rooftop", "Night"].map(t => (
                  <span key={t} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "20px", background: "#EDE9FE", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.2)" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        )
      },
      {
        rotate: "-5deg", top: "55%", right: "10%", width: "165px",
        content: (
          <div style={{ background: "#7C3AED", borderRadius: "12px", padding: "12px", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px", marginBottom: "2px" }}>NEARBY</div>
            <div style={{ color: "white", fontSize: "14px", fontWeight: 800 }}>Sky Garden Bar</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", marginBottom: "8px" }}>0.8 km · 4.7 ⭐ · Open now</div>
            <div style={{ padding: "5px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.2)", color: "white", fontSize: "10px", textAlign: "center", fontWeight: 700 }}>View on Map →</div>
          </div>
        )
      }
    ]
  }
];

export default function FeaturesPage() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const go = (idx) => {
    if (animating || idx === active) return;
    setAnimating(true);
    setTimeout(() => { setActive(idx); setAnimating(false); }, 300);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setActive(prev => (prev + 1) % features.length);
        setAnimating(false);
      }, 300);
    }, 4500);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const f = features[active];

  return (
    <>
      <style>{`
     
        .fp-wrap {
          background: #E5E7EB;
          margin: -28px -38px;
          padding: 32px 38px 38px;
          min-height: calc(100vh - 56px);
          box-sizing: border-box;
          overflow-x: hidden;
          overflow-y: auto;
        }

        .fp-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .fp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #7C3AED;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .fp-title {
          font-family: 'Roboto', sans-serif;
          font-size: clamp(22px, 3vw, 34px);
          font-weight: 800;
          color: #111827;
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .fp-title span { color: #7C3AED; }

        .fp-card {
          background: white;
          border-radius: 22px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.08);
          border: 1px solid #E5E7EB;
          overflow: hidden;
          transition: border-color 0.4s;
        }

        .fp-body {
          display: flex;
          align-items: stretch;
          min-height: 360px;
        }

        .fp-left {
          flex: 0 0 48%;
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid #F3F4F6;
        }

        .fp-right {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #F9FAFB;
          min-height: 320px;
        }

        .fp-tag-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 100px;
          margin-bottom: 14px;
          transition: all 0.4s;
        }

        .fp-headline {
          font-family: 'Roboto', sans-serif;
          font-size: clamp(18px, 2vw, 26px);
          font-weight: 700;
          line-height: 1.3;
          color: #111827;
          margin: 0 0 14px;
          white-space: pre-line;
          letter-spacing: -0.3px;
        }

        .fp-sub {
          font-size: 14px;
          line-height: 1.7;
          color: #6B7280;
          margin: 0 0 28px;
        }

        .fp-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .fp-dot {
          height: 7px;
          border-radius: 100px;
          cursor: pointer;
          transition: width 0.4s cubic-bezier(.4,0,.2,1), background 0.4s;
          flex-shrink: 0;
        }

        .fp-dot.active { width: 24px; }
        .fp-dot:not(.active) { width: 7px; background: #D1D5DB !important; }

        .fp-mockup {
          position: absolute;
          transition: transform 0.3s ease;
        }

        .fp-mockup:hover {
          transform: translateY(-5px) rotate(0deg) !important;
          z-index: 10 !important;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.15));
        }

        .fp-tabs {
          display: flex;
          border-top: 1px solid #F3F4F6;
        }

        .fp-tab {
          flex: 1;
          padding: 14px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #9CA3AF;
          transition: all 0.25s;
          border-right: 1px solid #F3F4F6;
          font-family: 'Roboto', sans-serif;
        }

        .fp-tab:last-child { border-right: none; }
        .fp-tab:hover { background: #F9FAFB; color: #374151; }
        .fp-tab.active { color: #7C3AED; background: #FAFAFA; }

        .fp-tab-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          transition: background 0.3s;
          flex-shrink: 0;
        }

        .fp-content-in {
          animation: fp-in 0.3s ease forwards;
        }

        @keyframes fp-in {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .fp-mockup-in {
          animation: fp-pop 0.4s cubic-bezier(.34,1.4,.64,1) forwards;
        }

        @keyframes fp-pop {
          from { opacity: 0; transform: scale(0.88) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .fp-diamond {
          position: absolute;
          transform: rotate(45deg);
          opacity: 0.25;
          transition: background 0.5s;
        }

        @media (max-width: 700px) {
          .fp-wrap { margin: -28px -20px; padding: 24px 20px 32px; }
          .fp-body { flex-direction: column; }
          .fp-left { flex: none; padding: 24px; border-right: none; border-bottom: 1px solid #F3F4F6; }
          .fp-right { min-height: 260px; }
          .fp-tab span.fp-tab-label { display: none; }
        }
      `}</style>

      <div className="fp-wrap">

        {/* Header */}
        <div className="fp-header">
          <div className="fp-eyebrow">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", display: "inline-block" }} />
            What Makes VibeScape Special
          </div>
          <h2 className="fp-title">
            Built for how you <span>actually explore</span>
          </h2>
        </div>

        {/* Main Card */}
        <div className="fp-card" style={{ borderColor: f.borderAccent }}>
          <div className="fp-body">

            {/* Left */}
            <div className="fp-left">
              <div
                key={`tag-${active}`}
                className="fp-tag-pill fp-content-in"
                style={{ background: f.lightAccent, color: f.accent, border: `1px solid ${f.borderAccent}` }}
              >
                {f.emoji} {f.tag}
              </div>
              <div key={`h-${active}`} className="fp-headline fp-content-in" style={{ animationDelay: "0.05s" }}>
                {f.headline}
              </div>
              <p key={`s-${active}`} className="fp-sub fp-content-in" style={{ animationDelay: "0.1s" }}>
                {f.sub}
              </p>
              <div className="fp-dots">
                {features.map((_, i) => (
                  <div
                    key={i}
                    className={`fp-dot${i === active ? " active" : ""}`}
                    style={{ background: i === active ? f.accent : undefined }}
                    onClick={() => { go(i); resetTimer(); }}
                  />
                ))}
              </div>
            </div>

            {/* Right: floating mockups */}
            <div className="fp-right">
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: `radial-gradient(circle at 65% 40%, ${f.lightAccent}, transparent 65%)`,
              }} />

              {[
                { top: "14%", left: "6%", size: 9 },
                { top: "68%", left: "16%", size: 6 },
                { top: "40%", left: "3%", size: 12 },
              ].map((d, i) => (
                <div key={i} className="fp-diamond" style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: f.accent }} />
              ))}

              {!animating && f.mockups.map((m, i) => (
                <div
                  key={`${active}-${i}`}
                  className="fp-mockup fp-mockup-in"
                  style={{
                    top: m.top, right: m.right, width: m.width,
                    transform: `rotate(${m.rotate})`,
                    zIndex: i === 0 ? 2 : 1,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {m.content}
                </div>
              ))}
            </div>
          </div>

          {/* Tab nav */}
          <div className="fp-tabs">
            {features.map((feat, i) => (
              <button
                key={i}
                className={`fp-tab${i === active ? " active" : ""}`}
                onClick={() => { go(i); resetTimer(); }}
              >
                <div className="fp-tab-dot" style={{ background: i === active ? feat.accent : "#D1D5DB" }} />
                <span className="fp-tab-label">{feat.tag}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}