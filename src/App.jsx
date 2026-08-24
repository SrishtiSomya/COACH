import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ---------------------------------------------------------------------
   DAILY // a competitive-programming coach
   Design: Dark judge-terminal surface, Codeforces-inspired layout,
   Full-width centered GitHub/CF-style contribution contribution graph.
--------------------------------------------------------------------- */

const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap";

const PLATFORMS = ["Codeforces", "LeetCode", "AtCoder"];

const PLATFORM_META = {
  Codeforces: { short: "CF", color: "#5EB1F0" },
  LeetCode: { short: "LC", color: "#F5A623" },
  AtCoder: { short: "AC", color: "#6FE0C0" },
};

function ratingColor(r) {
  if (r < 1200) return "#8A8F98";
  if (r < 1400) return "#3AAE3A";
  if (r < 1600) return "#22B3AE";
  if (r < 1900) return "#4E6EF2";
  if (r < 2100) return "#B24EE0";
  if (r < 2400) return "#E0912B";
  return "#E0453C";
}

function ratingLabel(r) {
  if (r < 1200) return "newbie";
  if (r < 1400) return "pupil";
  if (r < 1600) return "specialist";
  if (r < 1900) return "expert";
  if (r < 2100) return "candidate master";
  if (r < 2400) return "master";
  return "grandmaster";
}

const SEED = {
  Codeforces: [
    { name: "Watermelon", code: "4A", rating: 800, topics: ["math"], url: "https://codeforces.com/problemset/problem/4/A" },
    { name: "Way Too Long Words", code: "71A", rating: 800, topics: ["strings"], url: "https://codeforces.com/problemset/problem/71/A" },
    { name: "Bit++", code: "282A", rating: 800, topics: ["implementation"], url: "https://codeforces.com/problemset/problem/282/A" },
    { name: "Theatre Square", code: "1A", rating: 1000, topics: ["math"], url: "https://codeforces.com/problemset/problem/1/A" },
    { name: "String Task", code: "118A", rating: 1100, topics: ["strings"], url: "https://codeforces.com/problemset/problem/118/A" },
    { name: "Beautiful Matrix", code: "263A", rating: 1200, topics: ["implementation"], url: "https://codeforces.com/problemset/problem/263/A" },
    { name: "Registration System", code: "4C", rating: 1300, topics: ["hashing"], url: "https://codeforces.com/problemset/problem/4/C" },
    { name: "Kefa and First Steps", code: "580A", rating: 1200, topics: ["dp"], url: "https://codeforces.com/problemset/problem/580/A" },
  ],
  LeetCode: [
    { name: "Two Sum", code: "1", rating: 900, topics: ["array"], url: "https://leetcode.com/problems/two-sum/" },
    { name: "Valid Parentheses", code: "20", rating: 1000, topics: ["stack"], url: "https://leetcode.com/problems/valid-parentheses/" },
    { name: "Longest Substring Without Repeating Characters", code: "3", rating: 1300, topics: ["sliding window"], url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { name: "3Sum", code: "15", rating: 1400, topics: ["two pointers"], url: "https://leetcode.com/problems/3sum/" },
    { name: "Merge Intervals", code: "56", rating: 1450, topics: ["sorting"], url: "https://leetcode.com/problems/merge-intervals/" },
    { name: "Course Schedule", code: "207", rating: 1500, topics: ["graph"], url: "https://leetcode.com/problems/course-schedule/" },
  ],
  AtCoder: [
    { name: "Product", code: "ABC086A", rating: 800, topics: ["math"], url: "https://atcoder.jp/contests/abc086/tasks/abc086_a" },
    { name: "Placing Marbles", code: "ABC081A", rating: 800, topics: ["implementation"], url: "https://atcoder.jp/contests/abc081/tasks/abc081_a" },
    { name: "Shift only", code: "ABC081B", rating: 900, topics: ["math"], url: "https://atcoder.jp/contests/abc081/tasks/abc081_b" },
    { name: "Coins", code: "ABC087B", rating: 1000, topics: ["brute force"], url: "https://atcoder.jp/contests/abc087/tasks/abc087_b" },
    { name: "Card Game for Two", code: "ABC088B", rating: 1100, topics: ["greedy"], url: "https://atcoder.jp/contests/abc088/tasks/abc088_b" },
    { name: "Kagami Mochi", code: "ABC085B", rating: 1200, topics: ["sorting"], url: "https://atcoder.jp/contests/abc085/tasks/abc085_b" },
    { name: "Otoshidama", code: "ABC085C", rating: 1300, topics: ["dp"], url: "https://atcoder.jp/contests/abc085/tasks/abc085_c" },
    { name: "Century", code: "ABC200A", rating: 800, topics: ["math"], url: "https://atcoder.jp/contests/abc200/tasks/abc200_a" },
  ],
};

function browseUrl(platform, rating) {
  switch (platform) {
    case "Codeforces":
      return `https://codeforces.com/problemset?order=BY_RATING_ASC&tags=&min=${rating}&max=${rating + 200}`;
    case "AtCoder":
      return "https://kenkoooo.com/atcoder/#/table/";
    case "LeetCode":
      return "https://leetcode.com/problemset/";
    default:
      return "#";
  }
}

const DEFAULT_SETTINGS = {
  weights: { Codeforces: 50, LeetCode: 30, AtCoder: 20 },
  dailyCount: 1,
  boost: 15,
  avoidSolved: true,
};

const DEFAULT_ABILITY = {
  Codeforces: 1250,
  LeetCode: 1350,
  AtCoder: 900,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weightedPlatformPick(weights, excludeSet = new Set()) {
  const entries = Object.entries(weights).filter(([p]) => !excludeSet.has(p));
  const total = entries.reduce((s, [, w]) => s + Math.max(w, 0), 0) || 1;
  let r = Math.random() * total;
  for (const [p, w] of entries) {
    r -= Math.max(w, 0);
    if (r <= 0) return p;
  }
  return entries[entries.length - 1]?.[0] || PLATFORMS[0];
}

function pickProblem(platform, targetRating, solvedCodes) {
  const pool = (SEED[platform] || []).filter((p) => !solvedCodes.has(`${platform}:${p.code}`));
  if (pool.length === 0) return null;
  const sorted = [...pool].sort((a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating));
  const nearTies = sorted.filter((p) => Math.abs(p.rating - sorted[0].rating) <= 100);
  return nearTies[Math.floor(Math.random() * nearTies.length)];
}

function useStorage() {
  const get = useCallback(async (key, fallback) => {
    try {
      const res = localStorage.getItem(key);
      return res ? JSON.parse(res) : fallback;
    } catch {
      return fallback;
    }
  }, []);

  const set = useCallback(async (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, []);

  return { get, set };
}

export default function App() {
  const { get, set } = useStorage();
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ability, setAbility] = useState(DEFAULT_ABILITY);
  const [history, setHistory] = useState({});
  const [today, setToday] = useState(null);
  const [braveResults, setBraveResults] = useState([]);
  const [braveCount, setBraveCount] = useState(3);
  const [bravePlatform, setBravePlatform] = useState("Any");
  const [braveLevel, setBraveLevel] = useState("Hard");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, a, h, t] = await Promise.all([
        get("cp-settings", DEFAULT_SETTINGS),
        get("cp-ability", DEFAULT_ABILITY),
        get("cp-history", {}),
        get(`cp-today:${todayKey()}`, null),
      ]);
      setSettings(s);
      setAbility(a);
      setHistory(h || {});
      setToday(t);
      setLoaded(true);
    })();
  }, [get]);

  const solvedCodes = useMemo(() => {
    const s = new Set();
    Object.values(history).forEach((day) =>
      day.forEach((item) => {
        if (item.outcome !== "skipped") s.add(`${item.platform}:${item.code}`);
      })
    );
    return s;
  }, [history]);

  const generateToday = useCallback(() => {
    const items = [];
    const usedPlatforms = new Set();
    const count = Math.max(1, Math.min(5, settings.dailyCount));
    for (let i = 0; i < count; i++) {
      const platform = weightedPlatformPick(settings.weights, count > 1 ? usedPlatforms : new Set());
      usedPlatforms.add(platform);
      const target = Math.round((ability[platform] || 900) * (1 + settings.boost / 100));
      const p = pickProblem(platform, target, settings.avoidSolved ? solvedCodes : new Set());
      if (p) {
        items.push({ ...p, platform, solved: false, outcome: null });
      } else {
        items.push({
          platform,
          code: "browse",
          name: `Browse ${platform} near rating ${target}`,
          rating: target,
          topics: [],
          url: browseUrl(platform, target),
          solved: false,
          outcome: null,
          isBrowseLink: true,
        });
      }
    }
    const rec = { date: todayKey(), items };
    setToday(rec);
    set(`cp-today:${todayKey()}`, rec);
  }, [settings, ability, solvedCodes, set]);

  useEffect(() => {
    if (loaded && !today) generateToday();
  }, [loaded, today, generateToday]);

  function markOutcome(idx, outcome) {
    const items = today.items.map((it, i) => (i === idx ? { ...it, solved: outcome !== "skipped", outcome } : it));
    const rec = { ...today, items };
    setToday(rec);
    set(`cp-today:${todayKey()}`, rec);

    const item = items[idx];
    const dayList = [...(history[todayKey()] || [])];
    const existingIdx = dayList.findIndex((d) => d.platform === item.platform && d.code === item.code);
    const entry = {
      platform: item.platform,
      code: item.code,
      name: item.name,
      rating: item.rating,
      url: item.url,
      outcome,
      time: new Date().toISOString(),
    };
    if (existingIdx >= 0) dayList[existingIdx] = entry;
    else dayList.push(entry);
    const newHistory = { ...history, [todayKey()]: dayList };
    setHistory(newHistory);
    set("cp-history", newHistory);

    if (outcome === "solved-easy" || outcome === "solved") {
      const na = { ...ability, [item.platform]: Math.round((ability[item.platform] || 900) * 1.03) };
      setAbility(na);
      set("cp-ability", na);
    } else if (outcome === "skipped") {
      const na = { ...ability, [item.platform]: Math.round((ability[item.platform] || 900) * 0.97) };
      setAbility(na);
      set("cp-ability", na);
    }
  }

  function updateSettings(patch) {
    const s = { ...settings, ...patch };
    setSettings(s);
    set("cp-settings", s);
  }
  function updateWeight(platform, val) {
    const w = { ...settings.weights, [platform]: val };
    updateSettings({ weights: w });
  }

  function runBrave() {
    const results = [];
    const platforms = bravePlatform === "Any" ? PLATFORMS : [bravePlatform];
    const levelBoost = { Easy: -10, Medium: 0, Hard: 25, Nasty: 60 }[braveLevel] ?? 0;
    for (let i = 0; i < braveCount; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const target = Math.round((ability[platform] || 900) * (1 + (settings.boost + levelBoost) / 100));
      const exclude = new Set([...solvedCodes, ...results.map((r) => `${r.platform}:${r.code}`)]);
      const p = pickProblem(platform, target, settings.avoidSolved ? exclude : new Set());
      if (p) results.push({ ...p, platform });
      else
        results.push({
          platform,
          code: "browse",
          name: `Browse ${platform} near rating ${target}`,
          rating: target,
          topics: [],
          url: browseUrl(platform, target),
          isBrowseLink: true,
        });
    }
    setBraveResults(results);
  }

  async function syncCodeforces() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const handle = PLATFORM_META.Codeforces.handle || "srishtisomya";
      const res = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      if (data.status === "OK" && data.result.length) {
        const latest = data.result[data.result.length - 1].newRating;
        const na = { ...ability, Codeforces: latest };
        setAbility(na);
        set("cp-ability", na);
        setSyncMsg(`Synced — current Codeforces rating is ${latest}.`);
      } else {
        setSyncMsg("Synced, but no rated contests found yet.");
      }
    } catch (e) {
      setSyncMsg("Could not reach Codeforces from preview. Rating stays as-is.");
    } finally {
      setSyncing(false);
    }
  }

  // ---- 52-Week Contribution Matrix (Center-Aligned Full Width) ----
  const { calendarWeeks, monthLabels } = useMemo(() => {
    const days = [];
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 364); // Full year
    
    // Align start to Sunday
    const dow = start.getDay();
    start.setDate(start.getDate() - dow);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const list = history[key] || [];
      const solvedCount = list.filter((x) => x.outcome && x.outcome !== "skipped").length;
      days.push({ key, date: new Date(d), count: solvedCount });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    // Calculate month labels dynamically based on weeks
    const months = [];
    let lastMonth = -1;
    weeks.forEach((week, wIdx) => {
      const firstDayOfWeek = week[0].date;
      const m = firstDayOfWeek.getMonth();
      if (m !== lastMonth) {
        months.push({ name: firstDayOfWeek.toLocaleString('default', { month: 'short' }), weekIndex: wIdx });
        lastMonth = m;
      }
    });

    return { calendarWeeks: weeks, monthLabels: months };
  }, [history]);

  const streak = useMemo(() => {
    let s = 0;
    let d = new Date();
    for (;;) {
      const key = d.toISOString().slice(0, 10);
      const list = history[key] || [];
      const solved = list.some((x) => x.outcome && x.outcome !== "skipped");
      if (solved) {
        s += 1;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  }, [history]);

  const totalSolved = useMemo(
    () =>
      Object.values(history).reduce(
        (sum, list) => sum + list.filter((x) => x.outcome && x.outcome !== "skipped").length,
        0
      ),
    [history]
  );

  function intensityColor(count) {
    if (count === 0) return "#1B2130";
    if (count === 1) return "#1F5F4A";
    if (count <= 3) return "#2C8F63";
    if (count <= 6) return "#41C97F";
    return "#7CF2A6";
  }

  if (!loaded) {
    return (
      <div style={{ background: "#0B0E14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "monospace", color: "#8890A3" }}>loading coach…</span>
      </div>
    );
  }

  return (
    <div style={{ background: "#0B0E14", minHeight: "100vh", color: "#E7EAF0", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('${FONTS_LINK}');
        * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        button { font-family: inherit; cursor: pointer; }
        input[type="range"] { accent-color: #7C6FF0; }
        ::selection { background: #7C6FF055; }
        .btn-primary {
          background: #7C6FF0; color: #0B0E14; border: none; border-radius: 8px;
          padding: 10px 18px; font-weight: 600; font-size: 14px; transition: transform .12s ease, opacity .12s ease;
        }
        .btn-primary:hover { opacity: .88; transform: translateY(-1px); }
        .btn-ghost {
          background: transparent; color: #C9CEDA; border: 1px solid #262D3D; border-radius: 8px;
          padding: 8px 14px; font-size: 13px; transition: border-color .12s ease, color .12s ease;
        }
        .btn-ghost:hover { border-color: #7C6FF0; color: #E7EAF0; }
        .chip {
          border: 1px solid #262D3D; border-radius: 999px; padding: 5px 12px; font-size: 12px;
          color: #A8AFC0; background: #131720;
        }
        .card { background: #131720; border: 1px solid #1E2534; border-radius: 14px; }
        @media (max-width: 720px) { .grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div className="mono" style={{ fontSize: 12, color: "#7C6FF0", letterSpacing: 1 }}>
              &gt; daily-cp-coach<span style={{ opacity: 0.6, animation: "blink 1.2s steps(1) infinite" }}>_</span>
            </div>
            <div className="display" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
              Today's set
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "#7CF2A6" }}>
                {streak}
              </div>
              <div style={{ fontSize: 11, color: "#8890A3" }}>day streak</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
                {totalSolved}
              </div>
              <div style={{ fontSize: 11, color: "#8890A3" }}>solved total</div>
            </div>
          </div>
        </div>

        {/* today's recommendation(s) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 26 }}>
          {today?.items.map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{ padding: 20, borderLeft: `4px solid ${ratingColor(item.rating)}`, position: "relative" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: PLATFORM_META[item.platform]?.color,
                        border: `1px solid ${PLATFORM_META[item.platform]?.color}55`,
                        borderRadius: 6,
                        padding: "3px 8px",
                      }}
                    >
                      {PLATFORM_META[item.platform]?.short || item.platform}
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: 11, fontWeight: 700, color: ratingColor(item.rating) }}
                      title={ratingLabel(item.rating)}
                    >
                      {item.rating}
                    </span>
                    {item.outcome && (
                      <span
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: item.outcome === "skipped" ? "#E0453C" : "#7CF2A6",
                        }}
                      >
                        {item.outcome === "skipped" ? "✕ skipped" : "✓ solved"}
                      </span>
                    )}
                  </div>
                  <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>
                    {item.name}
                  </div>
                  {item.topics?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {item.topics.map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <a href={item.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                    {item.isBrowseLink ? "Browse problems ↗" : "Open problem ↗"}
                  </a>
                  {!item.isBrowseLink && !item.outcome && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" onClick={() => markOutcome(idx, "solved-easy")}>
                        Solved — easy
                      </button>
                      <button className="btn-ghost" onClick={() => markOutcome(idx, "solved-tough")}>
                        Solved — tough
                      </button>
                      <button className="btn-ghost" onClick={() => markOutcome(idx, "skipped")}>
                        Couldn't solve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={generateToday}>
              ↻ Swap for a different pick
            </button>
            <button className="btn-ghost" onClick={syncCodeforces} disabled={syncing}>
              {syncing ? "Syncing…" : "⇅ Sync Codeforces rating"}
            </button>
          </div>
          {syncMsg && (
            <div className="mono" style={{ fontSize: 12, color: "#8890A3" }}>
              {syncMsg}
            </div>
          )}
        </div>

        {/* --- FULL-WIDTH CENTERED SOLVE HISTORY HEATMAP --- */}
        <div className="card" style={{ padding: "24px 28px", marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="display" style={{ fontWeight: 600, fontSize: 16 }}>Solve History & Contribution Heatmap</div>
            <div className="mono" style={{ fontSize: 12, color: "#8890A3" }}>{totalSolved} solved over 1 year</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", overflowX: "auto" }}>
            {/* Months Header Bar */}
            <div style={{ display: "flex", position: "relative", width: "100%", maxWidth: 900, height: 20, marginBottom: 4, fontSize: 11, color: "#8890A3" }}>
              {monthLabels.map((m, idx) => (
                <span key={idx} style={{ position: "absolute", left: `${(m.weekIndex / 52) * 100}%` }}>
                  {m.name}
                </span>
              ))}
            </div>

            {/* Main Graph Grid with Day labels (Mon, Wed, Fri) */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 114, fontSize: 10, color: "#8890A3", paddingRight: 4, textAlign: "right" }}>
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                {calendarWeeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {week.map((day) => (
                      <div
                        key={day.key}
                        onClick={() => setSelectedDay(day.key)}
                        title={`${day.key} — ${day.count} solved`}
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: 3,
                          background: intensityColor(day.count),
                          cursor: "pointer",
                          outline: selectedDay === day.key ? "2px solid #7C6FF0" : "none",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 11, color: "#8890A3" }}>
              <span>Less</span>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#1B2130" }} />
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#1F5F4A" }} />
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#2C8F63" }} />
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#41C97F" }} />
              <span style={{ width: 12, height: 12, borderRadius: 2, background: "#7CF2A6" }} />
              <span>More</span>
            </div>
          </div>

          {selectedDay && (
            <div style={{ marginTop: 20, borderTop: "1px solid #1E2534", paddingTop: 16, width: "100%" }}>
              <div className="mono" style={{ fontSize: 12, color: "#8890A3", marginBottom: 10 }}>Activity logs for {selectedDay}:</div>
              {(history[selectedDay] || []).length === 0 ? (
                <div style={{ fontSize: 13, color: "#8890A3" }}>No activity recorded on this date.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {history[selectedDay].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, background: "#0B0E14", padding: "8px 12px", borderRadius: 8, border: "1px solid #1E2534" }}>
                      <span>
                        <span className="mono" style={{ color: PLATFORM_META[item.platform]?.color, marginRight: 8, fontWeight: 700 }}>
                          {PLATFORM_META[item.platform]?.short}
                        </span>
                        {item.name}
                      </span>
                      <span className="mono" style={{ color: item.outcome === "skipped" ? "#E0453C" : "#7CF2A6", fontSize: 12 }}>
                        {item.outcome === "skipped" ? "skipped" : "solved"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* settings */}
        <div className="card" style={{ padding: 18, marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowSettings((v) => !v)}>
            <div className="display" style={{ fontWeight: 600, fontSize: 15 }}>
              Tune your coach
            </div>
            <span className="mono" style={{ color: "#8890A3", fontSize: 13 }}>{showSettings ? "−" : "+"}</span>
          </div>
          {showSettings && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 8 }}>Platform mix (long-run distribution)</div>
                {PLATFORMS.map((p) => (
                  <div key={p} style={{ display: "grid", gridTemplateColumns: "120px 1fr 40px", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 12, color: PLATFORM_META[p].color }}>{p}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={settings.weights[p]}
                      onChange={(e) => updateWeight(p, Number(e.target.value))}
                      style={{ width: "100%" }}
                    />
                    <span className="mono" style={{ fontSize: 12, textAlign: "right" }}>{settings.weights[p]}%</span>
                  </div>
                ))}
              </div>
              <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 8 }}>Problems per day</div>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={settings.dailyCount}
                    onChange={(e) => updateSettings({ dailyCount: Number(e.target.value) })}
                    style={{ background: "#0B0E14", border: "1px solid #262D3D", borderRadius: 8, color: "#E7EAF0", padding: "8px 10px", width: 80 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 8 }}>Difficulty boost above your level: {settings.boost}%</div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={settings.boost}
                    onChange={(e) => updateSettings({ boost: Number(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#C9CEDA" }}>
                <input type="checkbox" checked={settings.avoidSolved} onChange={(e) => updateSettings({ avoidSolved: e.target.checked })} />
                Never repeat a problem I've already solved
              </label>
              <div>
                <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 8 }}>Your current ability estimate</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {PLATFORMS.map((p) => (
                    <div key={p} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className="mono" style={{ fontSize: 11, color: PLATFORM_META[p].color }}>{p}</span>
                      <input
                        type="number"
                        value={ability[p]}
                        onChange={(e) => {
                          const na = { ...ability, [p]: Number(e.target.value) };
                          setAbility(na);
                          set("cp-ability", na);
                        }}
                        style={{ background: "#0B0E14", border: "1px solid #262D3D", borderRadius: 8, color: "#E7EAF0", padding: "6px 8px", width: 80 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* brave mode */}
        <div className="card" style={{ padding: 20, marginBottom: 26 }}>
          <div className="display" style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Feeling brave?</div>
          <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 14 }}>
            Ask for an extra batch, any time — separate from today's pick.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#8890A3" }}>
              Count
              <input
                type="number"
                min={1}
                max={10}
                value={braveCount}
                onChange={(e) => setBraveCount(Number(e.target.value))}
                style={{ marginLeft: 8, background: "#0B0E14", border: "1px solid #262D3D", borderRadius: 8, color: "#E7EAF0", padding: "6px 8px", width: 60 }}
              />
            </label>
            <label style={{ fontSize: 12, color: "#8890A3" }}>
              Platform
              <select
                value={bravePlatform}
                onChange={(e) => setBravePlatform(e.target.value)}
                style={{ marginLeft: 8, background: "#0B0E14", border: "1px solid #262D3D", borderRadius: 8, color: "#E7EAF0", padding: "6px 8px" }}
              >
                <option>Any</option>
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, color: "#8890A3" }}>
              Level
              <select
                value={braveLevel}
                onChange={(e) => setBraveLevel(e.target.value)}
                style={{ marginLeft: 8, background: "#0B0E14", border: "1px solid #262D3D", borderRadius: 8, color: "#E7EAF0", padding: "6px 8px" }}
              >
                {["Easy", "Medium", "Hard", "Nasty"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <button className="btn-primary" onClick={runBrave}>Give me problems</button>
          </div>
          {braveResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {braveResults.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #1E2534",
                    textDecoration: "none",
                    color: "#E7EAF0",
                  }}
                >
                  <span>
                    <span className="mono" style={{ color: PLATFORM_META[r.platform]?.color, fontSize: 12, marginRight: 8 }}>
                      {PLATFORM_META[r.platform]?.short}
                    </span>
                    {r.name}
                  </span>
                  <span className="mono" style={{ color: ratingColor(r.rating), fontSize: 12 }}>{r.rating}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}