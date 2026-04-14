import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { getTrackedLocation, reverseGeocodeToLabel } from "../utils/location";

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  return {
    date: d.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" }),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function sameId(a, b) {
  return String(a) === String(b);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/** Format elapsed seconds → "1h 30m 40s" */
function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${pad(m)}m ${pad(s)}s`;
  return `${pad(s)}s`;
}

/* ─────────────────────────────────────────────────────────────────────
   HOOK: LIVE CLOCK — ticks every second
───────────────────────────────────────────────────────────────────── */
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ─────────────────────────────────────────────────────────────────────
   HOOK: LIVE SESSION TIMER — counts up from checkedInAt
───────────────────────────────────────────────────────────────────── */
function useLiveSessionTimer(checkedInAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!checkedInAt) { setElapsed(0); return; }
    const start = new Date(checkedInAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkedInAt]);
  return elapsed;
}

/* ─────────────────────────────────────────────────────────────────────
   HERO CARD — greeting + live clock
───────────────────────────────────────────────────────────────────── */
function HeroCard() {
  const now = useLiveClock();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{
      background: "linear-gradient(135deg,#6366f1 0%,#0ea5e9 100%)",
      borderRadius: 24, padding: "20px 20px 18px", marginBottom: 14,
      color: "#fff", position: "relative", overflow: "hidden",
      boxShadow: "0 8px 28px rgba(99,102,241,0.30)",
    }}>
      {/* decorative blobs */}
      <div style={{ position:"absolute",right:-30,top:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,0.10)" }} />
      <div style={{ position:"absolute",right:20,bottom:-40,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />

      <p style={{ fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",opacity:0.8,margin:"0 0 4px" }}>Dashboard</p>
      <h1 style={{ fontSize:22,fontWeight:700,margin:"0 0 2px" }}>Good {greeting()}! 👋</h1>
      <p style={{ fontSize:13,opacity:0.75,margin:"0 0 16px" }}>{dateStr}</p>

      {/* live clock pill */}
      <div style={{
        display:"inline-block",
        background:"rgba(255,255,255,0.18)",
        backdropFilter:"blur(8px)",
        borderRadius:14, padding:"8px 18px",
        fontFamily:"'DM Mono', monospace",
        fontSize:30, fontWeight:700, letterSpacing:"0.04em",
        textShadow:"0 2px 8px rgba(0,0,0,0.12)",
      }}>
        {timeStr}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ACTIVE SESSION BANNER — live elapsed timer
───────────────────────────────────────────────────────────────────── */
function ActiveSessionBanner({ log }) {
  const elapsed = useLiveSessionTimer(log?.checkedInAt);
  if (!log) return null;
  const checkIn = formatDateTime(log.checkedInAt);

  return (
    <div style={{
      background: "linear-gradient(135deg,#059669 0%,#10b981 100%)",
      borderRadius: 20, padding: "16px 20px", marginBottom: 14,
      color: "#fff", position:"relative", overflow:"hidden",
      boxShadow: "0 8px 24px rgba(5,150,105,0.28)",
    }}>
      <div style={{ position:"absolute",right:-20,top:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.10)" }} />
      <div style={{ position:"absolute",left:-10,bottom:-30,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />

      {/* label row */}
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
        <span style={{
          width:10,height:10,borderRadius:"50%",
          background:"#a7f3d0",display:"inline-block",
          boxShadow:"0 0 0 0 rgba(167,243,208,0.7)",
          animation:"ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
        }} />
        <span style={{ fontSize:11,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",opacity:0.9 }}>
          Session Active
        </span>
      </div>

      {/* times row */}
      <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11,opacity:0.75,marginBottom:3 }}>Checked in at</div>
          <div style={{ fontWeight:700,fontSize:16 }}>{checkIn?.time ?? "—"}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11,opacity:0.75,marginBottom:3 }}>Time at work</div>
          <div style={{
            fontFamily:"'DM Mono', monospace",
            fontSize:24, fontWeight:700,
            letterSpacing:"0.04em",
            textShadow:"0 1px 4px rgba(0,0,0,0.15)",
          }}>
            {formatElapsed(elapsed)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0%   { box-shadow: 0 0 0 0 rgba(167,243,208,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(167,243,208,0); }
          100% { box-shadow: 0 0 0 0 rgba(167,243,208,0); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PRESS BUTTON
───────────────────────────────────────────────────────────────────── */
function PressButton({ label, icon, bg, onClick }) {
  const [active, setActive] = useState(false);
  return (
    <button
      onPointerDown={() => setActive(true)}
      onPointerUp={() => { setActive(false); onClick(); }}
      onPointerLeave={() => setActive(false)}
      style={{
        flex:1, background:bg, border:"none", borderRadius:20,
        padding:"18px 0", color:"#fff",
        fontFamily:"'DM Sans', sans-serif", fontWeight:600, fontSize:15,
        display:"flex", flexDirection:"column", alignItems:"center", gap:6,
        cursor:"pointer",
        boxShadow: active ? "0 2px 8px rgba(99,102,241,0.18)" : "0 6px 20px rgba(99,102,241,0.25)",
        transform: active ? "scale(0.96) translateY(2px)" : "scale(1) translateY(0)",
        transition:"transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.15s ease",
      }}
    >
      <span style={{ fontSize:24 }}>{icon}</span>
      <span style={{ letterSpacing:"0.04em" }}>{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STATUS PILL
───────────────────────────────────────────────────────────────────── */
function StatusPill({ message }) {
  if (!message) return null;
  return (
    <div style={{
      marginTop:12, display:"flex", alignItems:"center", gap:8,
      borderRadius:14, padding:"10px 14px", fontSize:13,
      background:"rgba(99,102,241,0.08)", color:"#4f46e5",
      fontFamily:"'DM Mono', monospace",
    }}>
      <span style={{ animation:"blink 1.2s infinite" }}>●</span>
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   LOG CARD — completed sessions
───────────────────────────────────────────────────────────────────── */
function LogCard({ log, locationMap }) {
  const checkIn  = formatDateTime(log.checkedInAt);
  const checkOut = formatDateTime(log.checkedOutAt);

  const checkInKey  = log.checkInLocation
    ? `${log.checkInLocation.latitude},${log.checkInLocation.longitude}` : null;
  const checkOutKey = log.checkOutLocation
    ? `${log.checkOutLocation.latitude},${log.checkOutLocation.longitude}` : null;

  const checkInAddress  = checkInKey  ? locationMap[checkInKey]  || "Resolving…" : "—";
  const checkOutAddress = checkOutKey ? locationMap[checkOutKey] || "Resolving…" : "—";

  return (
    <div style={{
      borderRadius:18, overflow:"hidden",
      border:"1px solid #e8eaf6", background:"#fff", marginBottom:12,
      boxShadow:"0 2px 10px rgba(99,102,241,0.07)",
    }}>
      {/* gradient header */}
      <div style={{
        background:"linear-gradient(90deg,#6366f1 0%,#06b6d4 100%)",
        padding:"8px 16px", display:"flex", alignItems:"center", justifyContent:"space-between",
        color:"#fff", fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase",
      }}>
        <span>{checkIn?.date ?? "—"}</span>
        {log.totalHours != null && (
          <span style={{ background:"rgba(255,255,255,0.22)", borderRadius:20, padding:"2px 10px" }}>
            {log.totalHours}h total
          </span>
        )}
      </div>

      {/* body */}
      <div style={{ padding:"14px 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:13 }}>
        <div>
          <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6366f1",marginBottom:4 }}>↑ Check In</div>
          <div style={{ fontWeight:600,color:"#1e1b4b",marginBottom:2 }}>{checkIn?.time ?? "—"}</div>
          <div style={{ fontSize:11,color:"#94a3b8",lineHeight:1.4 }}>{checkInAddress}</div>
        </div>
        <div style={{ borderLeft:"1px solid #e8eaf6", paddingLeft:12 }}>
          <div style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#06b6d4",marginBottom:4 }}>↓ Check Out</div>
          <div style={{ fontWeight:600,color:"#1e1b4b",marginBottom:2 }}>{checkOut?.time ?? "—"}</div>
          <div style={{ fontSize:11,color:"#94a3b8",lineHeight:1.4 }}>{checkOutAddress}</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────── */
export default function UserDashboardPage() {
  const { token, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [locationMap, setLocationMap] = useState({});
  const locationMapRef = useRef(locationMap);
  locationMapRef.current = locationMap;

  // Most recent log with no checkout = active session
  const activeSession = logs.find((l) => l.checkedInAt && !l.checkedOutAt) ?? null;
  const completedLogs = logs.filter((l) => l.checkedOutAt);

  const loadAttendance = useCallback(async () => {
    if (!token) return;
    const data = await apiRequest(`/user/attendance?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLogs(data.logs || []);
  }, [token]);

  const hitAction = async (path) => {
    try {
      setMessage("Requesting location permission…");
      const tracked = await getTrackedLocation();
      console.log("Tracked location:", tracked);
      setMessage("Resolving place name…");
      let placeLabel = "";
      try { placeLabel = await reverseGeocodeToLabel(tracked.latitude, tracked.longitude); } catch {}
      const data = await apiRequest(path, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ latitude: tracked.latitude, longitude: tracked.longitude, mapUrl: tracked.mapUrl, placeLabel }),
      });
      setMessage(data.message);
      if (data.session) {
        setLogs((prev) => {
          if (path.includes("checkin"))
            return [data.session, ...prev.filter((l) => !sameId(l._id, data.session._id))];
          return prev.map((l) => (sameId(l._id, data.session._id) ? data.session : l));
        });
      }
      await loadAttendance();
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Resolve addresses
  useEffect(() => {
    let cancelled = false;
    const uniqueLocations = new Map();
    for (const log of logs) {
      for (const loc of [log.checkInLocation, log.checkOutLocation]) {
        if (loc) uniqueLocations.set(`${loc.latitude},${loc.longitude}`, loc);
      }
    }
    (async () => {
      const prev = locationMapRef.current;
      const pending = Array.from(uniqueLocations.entries()).filter(([k]) => !prev[k]);
      if (!pending.length) return;
      const entries = await Promise.all(
        pending.map(async ([key, loc]) => {
          try { return [key, await reverseGeocodeToLabel(loc.latitude, loc.longitude)]; }
          catch { return [key, "Address unavailable"]; }
        })
      );
      if (cancelled) return;
      setLocationMap((p) => {
        const next = { ...p };
        for (const [k, v] of entries) if (!next[k]) next[k] = v;
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [logs]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #f0f2ff; margin: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <DashboardLayout title="My Attendance" onLogout={logout}>
        <div style={{ minHeight:"100vh", padding:"12px 16px 48px", maxWidth:480, margin:"0 auto" }}>

          {/* Live clock + greeting */}
          <HeroCard />

          {/* Live session timer (only when checked in) */}
          <ActiveSessionBanner log={activeSession} />

          {/* Action buttons */}
          <div style={{ display:"flex", gap:12, marginBottom:4 }}>
            {[
              { label:"Check In",  icon:"↑", path:"/user/checkin",  bg:"linear-gradient(135deg,#6366f1,#818cf8)" },
              { label:"Check Out", icon:"↓", path:"/user/checkout", bg:"linear-gradient(135deg,#0891b2,#06b6d4)" },
            ].map(({ label, icon, path, bg }) => (
              <PressButton key={label} label={label} icon={icon} bg={bg} onClick={() => hitAction(path)} />
            ))}
          </div>

          <StatusPill message={message} />

          {/* History */}
          <div style={{ marginTop:28 }}>
            <div style={{ fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#6366f1",marginBottom:12 }}>
              Attendance History
            </div>
            {completedLogs.length === 0 ? (
              <div style={{ textAlign:"center",padding:"48px 0",color:"#94a3b8",fontSize:13 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🗒️</div>
                No completed sessions yet.
              </div>
            ) : (
              completedLogs.map((log) => (
                <LogCard key={log._id} log={log} locationMap={locationMap} />
              ))
            )}
          </div>

          <div style={{ marginTop:24, textAlign:"center" }}>
            <button onClick={logout} style={{ fontSize:12,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline" }}>
              Sign out
            </button>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}