import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ---------------------------------------------------------------------
   DAILY // a competitive-programming coach
   Design: dark judge-terminal surface, Codeforces-authentic rating colors
   for difficulty pills, Space Grotesk for UI, JetBrains Mono for data.
--------------------------------------------------------------------- */

const FONTS_LINK =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap";

const PLATFORMS = ["Codeforces", "LeetCode", "AtCoder"];

const PLATFORM_META = {
  Codeforces: { short: "CF", handle: "srishtisomya", color: "#5EB1F0" },
  LeetCode: { short: "LC", handle: "IoIvnVl8JP", color: "#F5A623" },
  AtCoder: { short: "AC", handle: "srishtisomya", color: "#6FE0C0" },
};

// Codeforces-authentic rating -> color scale, reused for every platform's
// difficulty pill so the whole app speaks one consistent "rank language."
function ratingColor(r) {
  if (r < 1200) return "#8A8F98"; // gray
  if (r < 1400) return "#3AAE3A"; // green
  if (r < 1600) return "#22B3AE"; // cyan
  if (r < 1900) return "#4E6EF2"; // blue
  if (r < 2100) return "#B24EE0"; // purple
  if (r < 2400) return "#E0912B"; // orange
  return "#E0453C"; // red
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

/* ------------------------- Seed problem sets -------------------------
   Small, high-confidence sets of real, well-known problems per platform,
   used when a live sync isn't available. Ratings are approximate bands.
------------------------------------------------------------------------ */
const SEED = {
  Codeforces: [
    { name: "Watermelon", code: "4A", rating: 800, topics: ["math"], url: "https://codeforces.com/problemset/problem/4/A" },
    { name: "Way Too Long Words", code: "71A", rating: 800, topics: ["strings"], url: "https://codeforces.com/problemset/problem/71/A" },
    { name: "Bit++", code: "282A", rating: 800, topics: ["implementation"], url: "https://codeforces.com/problemset/problem/282/A" },
    { name: "Domino Piling", code: "50A", rating: 800, topics: ["math", "greedy"], url: "https://codeforces.com/problemset/problem/50/A" },
    { name: "Team", code: "231A", rating: 800, topics: ["brute force"], url: "https://codeforces.com/problemset/problem/231/A" },
    { name: "Next Round", code: "158A", rating: 800, topics: ["implementation"], url: "https://codeforces.com/problemset/problem/158/A" },
    { name: "Theatre Square", code: "1A", rating: 1000, topics: ["math"], url: "https://codeforces.com/problemset/problem/1/A" },
    { name: "String Task", code: "118A", rating: 1100, topics: ["strings"], url: "https://codeforces.com/problemset/problem/118/A" },
    { name: "Beautiful Matrix", code: "263A", rating: 1200, topics: ["implementation"], url: "https://codeforces.com/problemset/problem/263/A" },
    { name: "Registration System", code: "4C", rating: 1300, topics: ["hashing", "data structures"], url: "https://codeforces.com/problemset/problem/4/C" },
    { name: "Kefa and First Steps", code: "580A", rating: 1200, topics: ["dp", "greedy"], url: "https://codeforces.com/problemset/problem/580/A" },
    { name: "Fox and Number Game", code: "510C", rating: 2200, topics: ["math", "greedy"], url: "https://codeforces.com/problemset/problem/510/C" },
  ],
  LeetCode: [
    { name: "Two Sum", code: "1", rating: 900, topics: ["array", "hash table"], url: "https://leetcode.com/problems/two-sum/" },
    { name: "Valid Parentheses", code: "20", rating: 1000, topics: ["stack"], url: "https://leetcode.com/problems/valid-parentheses/" },
    { name: "Longest Substring Without Repeating Characters", code: "3", rating: 1300, topics: ["sliding window"], url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { name: "3Sum", code: "15", rating: 1400, topics: ["two pointers"], url: "https://leetcode.com/problems/3sum/" },
    { name: "Merge Intervals", code: "56", rating: 1450, topics: ["sorting", "intervals"], url: "https://leetcode.com/problems/merge-intervals/" },
    { name: "Course Schedule", code: "207", rating: 1500, topics: ["graph", "topo sort"], url: "https://leetcode.com/problems/course-schedule/" },
    { name: "Word Break", code: "139", rating: 1600, topics: ["dp"], url: "https://leetcode.com/problems/word-break/" },
    { name: "Median of Two Sorted Arrays", code: "4", rating: 2100, topics: ["binary search"], url: "https://leetcode.com/problems/median-of-two-sorted-arrays/" },
    { name: "Trapping Rain Water", code: "42", rating: 1900, topics: ["two pointers", "stack"], url: "https://leetcode.com/problems/trapping-rain-water/" },
    { name: "Merge k Sorted Lists", code: "23", rating: 1950, topics: ["heap", "linked list"], url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
  ],
  AtCoder: [
    { name: "ABC Practice A - PizzaCutter Rating (browse)", code: "PRC", rating: 800, topics: ["warm-up"], url: "https://atcoder.jp/contests/abc/tasks?f.LangName=ja" },
  ],
};

// Fallback difficulty-filtered browse links, used when no seed problem
// fits the requested band for a platform (kept honest — no invented data).
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
  boost: 15, // % above demonstrated ability
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
  // closest rating to target, then slight randomization among near-ties
  const sorted = [...pool].sort((a, b) => Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating));
  const nearTies = sorted.filter((p) => Math.abs(p.rating - sorted[0].rating) <= 50);
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
  const [history, setHistory] = useState({}); // date -> [{platform, code, name, rating, url, outcome}]
  const [today, setToday] = useState(null); // {date, items:[{platform,code,name,rating,url,topics,solved,outcome}]}
  const [braveResults, setBraveResults] = useState([]);
  const [braveCount, setBraveCount] = useState(3);
  const [bravePlatform, setBravePlatform] = useState("Any");
  const [braveLevel, setBraveLevel] = useState("Hard");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  // ---- load persisted state ----
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
      setHistory(h);
      setToday(t);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function markOutcome(idx, outcome) {
    const items = today.items.map((it, i) => (i === idx ? { ...it, solved: outcome !== "skipped", outcome } : it));
    const rec = { ...today, items };
    setToday(rec);
    set(`cp-today:${todayKey()}`, rec);

    // update history
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

    // adapt ability
    if (outcome === "solved-easy" || outcome === "solved") {
      const na = { ...ability, [item.platform]: Math.round((ability[item.platform] || 900) * 1.03) };
      setAbility(na);
      set("cp-ability", na);
    } else if (outcome === "solved-tough") {
      // keep roughly the same
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
      const handle = PLATFORM_META.Codeforces.handle;
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
        setSyncMsg("Synced, but no rated contests found yet — keeping your current estimate.");
      }
    } catch (e) {
      setSyncMsg(
        "Couldn't reach Codeforces from here (this preview can't always make outside network calls). Your ability estimate stays as-is — adjust it manually in settings if needed."
      );
    } finally {
      setSyncing(false);
    }
  }

  // ---- calendar data ----
  const calendarWeeks = useMemo(() => {
    const days = [];
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 118); // ~17 weeks
    // align start to Monday
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const list = history[key] || [];
      const solvedCount = list.filter((x) => x.outcome && x.outcome !== "skipped").length;
      days.push({ key, date: new Date(d), count: solvedCount });
    }
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
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

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 20px 80px" }}>
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
                <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 8 }}>Platform mix (long-run distribution, not a strict daily quota)</div>
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
                <div style={{ fontSize: 13, color: "#8890A3", marginBottom: 8 }}>Your current ability estimate (edit if it's off)</div>
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

        {/* calendar */}
        <div className="card" style={{ padding: 20 }}>
          <div className="display" style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Solve history</div>
          <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 6 }}>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {week.map((day) => (
                  <div
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    title={`${day.key} — ${day.count} solved`}
                    style={{
                      width: 12,
                      height: 12,
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
          {selectedDay && (
            <div style={{ marginTop: 14, borderTop: "1px solid #1E2534", paddingTop: 14 }}>
              <div className="mono" style={{ fontSize: 12, color: "#8890A3", marginBottom: 8 }}>{selectedDay}</div>
              {(history[selectedDay] || []).length === 0 ? (
                <div style={{ fontSize: 13, color: "#8890A3" }}>No activity that day.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {history[selectedDay].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>
                        <span className="mono" style={{ color: PLATFORM_META[item.platform]?.color, marginRight: 8 }}>
                          {PLATFORM_META[item.platform]?.short}
                        </span>
                        {item.name}
                      </span>
                      <span className="mono" style={{ color: item.outcome === "skipped" ? "#E0453C" : "#7CF2A6" }}>
                        {item.outcome === "skipped" ? "skipped" : "solved"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, fontSize: 12, color: "#5C6478", lineHeight: 1.6 }}>
          Runs entirely in this preview: your settings, ability estimate, and solve history are saved to your account and
          persist between visits. Live sync only works for Codeforces (and only when the network call succeeds) — LeetCode
          and AtCoder don't allow that kind of direct access from a browser page, so their picks come
          from a small curated set plus a filtered "browse" link when nothing fits. Mark problems solved yourself for now.
        </div>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}