import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import LocationCell from "../components/LocationCell";
import { reverseGeocodeToLabel } from "../utils/location";

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */
function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString([], {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function formatElapsed(totalSecs) {
  if (!totalSecs || totalSecs < 0) totalSecs = 0;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${pad(m)}m ${pad(s)}s`;
  return `${pad(s)}s`;
}

function hoursToHMS(totalHours) {
  if (totalHours == null) return "—";
  return formatElapsed(Math.round(Number(totalHours) * 3600));
}

/* ─────────────────────────────────────────────────────────────────────
   HOOK: live elapsed timer
───────────────────────────────────────────────────────────────────── */
function useLiveTimer(checkedInAt) {
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
   LIVE DURATION CELL
───────────────────────────────────────────────────────────────────── */
function DurationCell({ log }) {
  const isActive = log.checkedInAt && !log.checkedOutAt;
  const elapsed  = useLiveTimer(isActive ? log.checkedInAt : null);

  if (!isActive) {
    return (
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#374151" }}>
        {hoursToHMS(log.totalHours)}
      </span>
    );
  }

  return (
    <span style={{
      fontFamily: "'DM Mono', monospace", fontSize: 13,
      color: "#059669", fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: "#10b981",
        display: "inline-block", flexShrink: 0,
        animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      {formatElapsed(elapsed)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const isActive = status?.toLowerCase() === "checked-in" || status?.toLowerCase() === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: isActive ? "rgba(5,150,105,0.10)" : "rgba(100,116,139,0.10)",
      color: isActive ? "#059669" : "#475569",
      border: `1px solid ${isActive ? "rgba(5,150,105,0.25)" : "rgba(100,116,139,0.20)"}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#10b981" : "#94a3b8",
        display: "inline-block",
        animation: isActive ? "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" : "none",
      }} />
      {status || "—"}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────────────── */
function StatCard({ label, value, accent, icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "18px 22px",
      boxShadow: "0 1px 6px rgba(15,23,42,0.07)",
      border: "1px solid #f1f5f9",
      display: "flex", alignItems: "center", gap: 16, minWidth: 160,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: accent + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   INSIGHT CARD — small analytics widget
───────────────────────────────────────────────────────────────────── */
function InsightCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "16px 20px",
      boxShadow: "0 1px 5px rgba(15,23,42,0.06)",
      border: "1px solid #f1f5f9", flex: "1 1 180px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 9, background: accent + "18",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION WRAPPER
───────────────────────────────────────────────────────────────────── */
function Section({ title, badge, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      boxShadow: "0 1px 8px rgba(15,23,42,0.07)",
      border: "1px solid #f1f5f9",
      marginBottom: 24, overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
        {badge != null && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: "#f0f4ff", color: "#6366f1",
          }}>{badge}</span>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   TABLE HELPERS
───────────────────────────────────────────────────────────────────── */
const TH = ({ children }) => (
  <th style={{
    padding: "10px 16px", textAlign: "left",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase", color: "#94a3b8",
    background: "#f8fafc", whiteSpace: "nowrap",
  }}>{children}</th>
);

const TD = ({ children, mono }) => (
  <td style={{
    padding: "12px 16px", fontSize: 13, color: "#374151",
    fontFamily: mono ? "'DM Mono', monospace" : "inherit",
    whiteSpace: "nowrap", verticalAlign: "middle",
  }}>{children}</td>
);

/* ─────────────────────────────────────────────────────────────────────
   TAB BUTTON
───────────────────────────────────────────────────────────────────── */
function TabButton({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 18px", borderRadius: 10, border: "none",
        background: active ? "#6366f1" : "transparent",
        color: active ? "#fff" : "#64748b",
        cursor: "pointer", fontWeight: 600, fontSize: 13,
        whiteSpace: "nowrap",
        transition: "all 0.15s ease",
        boxShadow: active ? "0 4px 14px rgba(99,102,241,0.25)" : "none",
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CALENDAR MATRIX BUILDER
───────────────────────────────────────────────────────────────────── */
function buildCalendarMatrix(logs, baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const dateStats = new Map();
  for (const log of logs) {
    if (!log.checkedInAt) continue;
    const date = new Date(log.checkedInAt);
    if (date.getFullYear() !== year || date.getMonth() !== month) continue;
    const day = date.getDate();
    const existing = dateStats.get(day) || { count: 0, totalHours: 0 };
    existing.count += 1;
    existing.totalHours += Number(log.totalHours || 0);
    dateStats.set(day, existing);
  }

  const weeks = [];
  let week = Array(7).fill(null);
  for (let i = 0; i < startOffset; i++) week[i] = null;

  for (let day = 1; day <= lastDay; day++) {
    const stats = dateStats.get(day) || { count: 0, totalHours: 0 };
    week[(startOffset + day - 1) % 7] = { day, ...stats };
    if (((startOffset + day) % 7 === 0) || day === lastDay) {
      weeks.push(week);
      week = Array(7).fill(null);
    }
  }

  return {
    monthLabel: firstDay.toLocaleString([], { month: "long", year: "numeric" }),
    weeks,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   CALENDAR VIEW
───────────────────────────────────────────────────────────────────── */
function CalendarView({ calendar, today }) {
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDay = today.getDate();

  return (
    <div style={{ padding: "20px 24px" }}>
      <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
        {calendar.monthLabel}
      </div>
      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{
            textAlign: "center", fontSize: 11, fontWeight: 700,
            color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em",
            paddingBottom: 4,
          }}>{d}</div>
        ))}
      </div>
      {/* Weeks */}
      {calendar.weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
          {week.map((cell, di) => {
            if (!cell) return <div key={di} />;
            const isToday = cell.day === todayDay;
            const intensity = cell.count === 0 ? 0
              : cell.count === 1 ? 1
              : cell.count <= 3 ? 2
              : 3;
            const bgColors = ["#f8fafc", "#dbeafe", "#93c5fd", "#3b82f6"];
            const textColors = ["#cbd5e1", "#1e40af", "#1e40af", "#fff"];
            return (
              <div key={di} title={cell.count > 0 ? `${cell.count} session(s), ${cell.totalHours.toFixed(1)}h` : ""} style={{
                borderRadius: 10,
                background: isToday ? "#6366f1" : bgColors[intensity],
                color: isToday ? "#fff" : textColors[intensity],
                padding: "10px 4px 8px",
                textAlign: "center",
                cursor: cell.count > 0 ? "default" : "default",
                border: isToday ? "2px solid #4f46e5" : "2px solid transparent",
                transition: "transform 0.1s",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{cell.day}</div>
                {cell.count > 0 && (
                  <div style={{ fontSize: 10, marginTop: 2, fontWeight: 600, opacity: 0.85 }}>
                    {cell.count}×
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>Sessions:</span>
        {[["#f8fafc", "#94a3b8", "0"], ["#dbeafe", "#1e40af", "1"], ["#93c5fd", "#1e40af", "2–3"], ["#3b82f6", "#fff", "4+"]].map(([bg, col, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: "1px solid #e2e8f0" }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: "#6366f1" }} />
          <span style={{ fontSize: 11, color: "#64748b" }}>Today</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAP EMBED
───────────────────────────────────────────────────────────────────── */
function getMapEmbedUrl(location) {
  if (!location || typeof location.latitude !== "number" || typeof location.longitude !== "number") return null;
  const lat = location.latitude;
  const lon = location.longitude;
  const span = 0.02;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - span},${lat - span},${lon + span},${lat + span}&layer=mapnik&marker=${lat},${lon}`;
}

/* ─────────────────────────────────────────────────────────────────────
   OFFLINE BANNER
───────────────────────────────────────────────────────────────────── */
function OfflineBanner({ isOnline, syncMessage }) {
  if (isOnline && !syncMessage) return null;
  const isError = !isOnline;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 18px", borderRadius: 12, marginBottom: 16,
      background: isError ? "rgba(239,68,68,0.08)" : "rgba(5,150,105,0.08)",
      border: `1px solid ${isError ? "rgba(239,68,68,0.2)" : "rgba(5,150,105,0.2)"}`,
      color: isError ? "#b91c1c" : "#065f46",
      fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ fontSize: 16 }}>{isError ? "📡" : "✅"}</span>
      {syncMessage || (isError ? "You are offline. Data may be outdated." : "")}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   GUARD AVATAR
───────────────────────────────────────────────────────────────────── */
function GuardAvatar({ name, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase() ?? "G"}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────── */
const TABS = ["Overview", "Map", "Login Details", "Attendance", "Insights"];

export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const [guards, setGuards]       = useState([]);
  const [logs, setLogs]           = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedGuard, setSelectedGuard] = useState(null);
  const [isOnline, setIsOnline]   = useState(navigator.onLine);
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSync, setLastSync]   = useState("Never");
  const [loadError, setLoadError] = useState("");

  const locationMapRef = useRef(locationMap);
  locationMapRef.current = locationMap;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Data loading ── */
  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      setLoadError("");
      setSyncMessage("Refreshing dashboard...");
      const data = await apiRequest(`/admin/dashboard?_=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuards(data.guards || []);
      setLogs(data.logs   || []);
      setLastSync(new Date().toLocaleString());
      setIsOnline(true);
      setSyncMessage(""); // clear after success
    } catch (error) {
      setLoadError(error.message || "Failed to refresh dashboard");
      setIsOnline(navigator.onLine);
      setSyncMessage(navigator.onLine ? "Unable to refresh — server error." : "You're offline. Data may be outdated.");
    }
  }, [token]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  /* ── SSE live updates ── */
  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`/api/admin/dashboard/live?token=${token}`);
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "attendance-update") loadDashboard();
    };
    es.onerror = () => setSyncMessage("Live updates disconnected. Refresh to reconnect.");
    return () => es.close();
  }, [token, loadDashboard]);

  /* ── Visibility / online/offline ── */
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") loadDashboard(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadDashboard]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncMessage("Back online — refreshing…");
      loadDashboard();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncMessage("You're offline. Dashboard updates paused.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadDashboard]);

  /* ── Reverse geocoding ── */
  useEffect(() => {
    let cancelled = false;
    const uniqueLocations = new Map();
    for (const log of logs) {
      for (const loc of [log.checkInLocation, log.checkOutLocation]) {
        if (loc) uniqueLocations.set(`${loc.latitude},${loc.longitude}`, loc);
      }
    }
    for (const g of guards) {
      const loc = g.lastCheckInLocation;
      if (loc?.latitude) uniqueLocations.set(`${loc.latitude},${loc.longitude}`, loc);
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
  }, [logs, guards]);

  /* ── Derived stats ── */
  const activeGuards = useMemo(
    () => guards.filter((g) => g.status?.toLowerCase() === "checked-in" || g.status?.toLowerCase() === "active"),
    [guards]
  );
  const activeSessions = useMemo(() => logs.filter((l) => l.checkedInAt && !l.checkedOutAt).length, [logs]);
  const totalHoursAll  = useMemo(() => Number(logs.reduce((s, l) => s + (l.totalHours || 0), 0).toFixed(2)), [logs]);
  const finishedLogs   = useMemo(() => logs.filter((l) => l.totalHours != null), [logs]);
  const averageHours   = useMemo(() => {
    if (!finishedLogs.length) return "0.00";
    return (finishedLogs.reduce((s, l) => s + Number(l.totalHours || 0), 0) / finishedLogs.length).toFixed(2);
  }, [finishedLogs]);
  const busiestDay = useMemo(() => {
    const counts = {};
    for (const log of logs) {
      if (!log.checkedInAt) continue;
      const key = new Date(log.checkedInAt).toLocaleDateString();
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["—", 0];
  }, [logs]);
  const lastWeekSessions = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return logs.filter((l) => new Date(l.checkedInAt).getTime() >= cutoff).length;
  }, [logs]);
  const longestSession = useMemo(() => {
    const maxLog = finishedLogs.reduce((best, l) => (Number(l.totalHours) > Number(best?.totalHours || 0) ? l : best), null);
    return maxLog ? `${Number(maxLog.totalHours).toFixed(2)}h — ${maxLog.guardName}` : "—";
  }, [finishedLogs]);
  const guardSessionCounts = useMemo(() => {
    const counts = {};
    for (const log of logs) {
      counts[log.guardName] = (counts[log.guardName] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const today = useMemo(() => new Date(), []);
  const calendar = useMemo(() => buildCalendarMatrix(logs, today), [logs, today]);

  /* ── Map ── */
  const mapGuard = selectedGuard || activeGuards[0] || guards[0];
  const mapLocation = mapGuard?.lastCheckInLocation;
  const mapEmbedUrl = getMapEmbedUrl(mapLocation);

  const locKey = (loc) => loc ? `${loc.latitude},${loc.longitude}` : null;

  /* ─────────────────────────────────────────────────────────────────
     RENDER TABS
  ───────────────────────────────────────────────────────────────── */
  function renderTabContent() {
    switch (activeTab) {

      /* ── OVERVIEW ── */
      case "Overview":
        return (
          <>
            {/* Guard Status Table */}
            <Section title="Guard Status" badge={guards.length}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Guard</TH><TH>Status</TH><TH>Last Check-In</TH><TH>Last Location</TH>
                  </tr>
                </thead>
                <tbody>
                  {guards.length === 0
                    ? <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No guards found.</td></tr>
                    : guards.map((guard) => (
                      <tr key={guard.guardName} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <TD>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <GuardAvatar name={guard.guardName} />
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{guard.guardName}</span>
                          </div>
                        </TD>
                        <TD><StatusBadge status={guard.status} /></TD>
                        <TD mono>{formatDateTime(guard.lastCheckIn)}</TD>
                        <TD>
                          <LocationCell
                            location={guard.lastCheckInLocation}
                            fallbackLabel={guard.lastCheckInLocation ? locationMap[locKey(guard.lastCheckInLocation)] : undefined}
                          />
                        </TD>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Section>

            {/* Recent Attendance (last 10) */}
            <Section title="Recent Attendance" badge={Math.min(logs.length, 10)}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Guard</TH><TH>Check In</TH><TH>Check Out</TH><TH>Duration</TH>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0
                    ? <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No logs.</td></tr>
                    : logs.slice(0, 10).map((log) => (
                      <tr key={log._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <TD>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <GuardAvatar name={log.guardName} size={28} />
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{log.guardName}</span>
                          </div>
                        </TD>
                        <TD mono>{formatDateTime(log.checkedInAt)}</TD>
                        <TD mono>
                          {log.checkedOutAt
                            ? formatDateTime(log.checkedOutAt)
                            : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 12 }}>In progress</span>}
                        </TD>
                        <TD><DurationCell log={log} /></TD>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Section>
          </>
        );

      /* ── MAP ── */
      case "Map":
        return (
          <div style={{ display: "flex", gap: 20 }}>
            {/* Guard list sidebar */}
            <div style={{
              width: 220, flexShrink: 0, background: "#fff", borderRadius: 16,
              border: "1px solid #f1f5f9", boxShadow: "0 1px 6px rgba(15,23,42,0.06)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Guards
              </div>
              {guards.map((g) => {
                const isSelected = (selectedGuard?.guardName ?? mapGuard?.guardName) === g.guardName;
                return (
                  <div
                    key={g.guardName}
                    onClick={() => setSelectedGuard(g)}
                    style={{
                      padding: "12px 16px", cursor: "pointer",
                      background: isSelected ? "#f0f4ff" : "transparent",
                      borderLeft: isSelected ? "3px solid #6366f1" : "3px solid transparent",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "background 0.1s",
                    }}
                  >
                    <GuardAvatar name={g.guardName} size={28} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{g.guardName}</div>
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                );
              })}
              {guards.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No guards</div>
              )}
            </div>

            {/* Map panel */}
            <div style={{ flex: 1, minHeight: 480 }}>
              <div style={{
                background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9",
                boxShadow: "0 1px 6px rgba(15,23,42,0.06)", overflow: "hidden",
              }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    {mapGuard ? `📍 ${mapGuard.guardName}'s Last Location` : "Guard Map"}
                  </span>
                  {mapGuard && <StatusBadge status={mapGuard.status} />}
                </div>

                {mapEmbedUrl ? (
                  <iframe
                    src={mapEmbedUrl}
                    title="guard-location-map"
                    style={{ width: "100%", height: 440, border: "none", display: "block" }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    height: 440, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    color: "#94a3b8", fontSize: 14, gap: 8,
                  }}>
                    <span style={{ fontSize: 36 }}>🗺️</span>
                    <span>No location data available for this guard.</span>
                  </div>
                )}
              </div>

              {/* Location detail */}
              {mapLocation && (
                <div style={{
                  marginTop: 14, background: "#fff", borderRadius: 14,
                  border: "1px solid #f1f5f9", padding: "14px 20px",
                  display: "flex", gap: 24, flexWrap: "wrap",
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Latitude</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#0f172a" }}>{mapLocation.latitude?.toFixed(6)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Longitude</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#0f172a" }}>{mapLocation.longitude?.toFixed(6)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Address</div>
                    <div style={{ fontSize: 13, color: "#374151" }}>
                      {locationMap[locKey(mapLocation)] || "Resolving…"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Last Check-In</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#374151" }}>
                      {formatDateTime(mapGuard?.lastCheckIn)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      /* ── LOGIN DETAILS ── */
      case "Login Details":
        return (
          <Section title="Login Details" badge={logs.length}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Guard</TH>
                  <TH>Check In</TH>
                  <TH>Check Out</TH>
                  <TH>Duration</TH>
                  <TH>Check-In Location</TH>
                  <TH>Check-Out Location</TH>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0
                  ? <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No logs found.</td></tr>
                  : logs.map((log) => (
                    <tr key={log._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <TD>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <GuardAvatar name={log.guardName} size={28} />
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{log.guardName}</span>
                        </div>
                      </TD>
                      <TD mono>{formatDateTime(log.checkedInAt)}</TD>
                      <TD mono>
                        {log.checkedOutAt
                          ? formatDateTime(log.checkedOutAt)
                          : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 12 }}>In progress</span>}
                      </TD>
                      <TD><DurationCell log={log} /></TD>
                      <TD>
                        <LocationCell
                          location={log.checkInLocation}
                          fallbackLabel={log.checkInLocation ? locationMap[locKey(log.checkInLocation)] : undefined}
                        />
                      </TD>
                      <TD>
                        <LocationCell
                          location={log.checkOutLocation}
                          fallbackLabel={log.checkOutLocation ? locationMap[locKey(log.checkOutLocation)] : undefined}
                        />
                      </TD>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>
        );

      /* ── ATTENDANCE (CALENDAR) ── */
      case "Attendance":
        return (
          <>
            <Section title="Attendance Calendar">
              <CalendarView calendar={calendar} today={today} />
            </Section>

            {/* Per-guard breakdown */}
            <Section title="Per-Guard Attendance" badge={guardSessionCounts.length}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr><TH>Guard</TH><TH>Total Sessions</TH><TH>Total Hours</TH></tr>
                </thead>
                <tbody>
                  {guardSessionCounts.map(([name, count]) => {
                    const guardLogs = logs.filter((l) => l.guardName === name);
                    const hrs = guardLogs.reduce((s, l) => s + Number(l.totalHours || 0), 0).toFixed(2);
                    return (
                      <tr key={name} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <TD>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <GuardAvatar name={name} size={28} />
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{name}</span>
                          </div>
                        </TD>
                        <TD mono>{count}</TD>
                        <TD mono>{hrs}h</TD>
                      </tr>
                    );
                  })}
                  {guardSessionCounts.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No attendance data.</td></tr>
                  )}
                </tbody>
              </table>
            </Section>
          </>
        );

      /* ── INSIGHTS ── */
      case "Insights":
        return (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
              <InsightCard label="Total Hours Logged"   value={`${totalHoursAll}h`}       sub="All time"              accent="#6366f1" icon="⏱️" />
              <InsightCard label="Avg Hours / Session"  value={`${averageHours}h`}          sub="Finished sessions"     accent="#0ea5e9" icon="📊" />
              <InsightCard label="Busiest Day"          value={busiestDay[0]}               sub={`${busiestDay[1]} sessions`} accent="#f59e0b" icon="📅" />
              <InsightCard label="Last 7 Days Sessions" value={lastWeekSessions}            sub="Past week"             accent="#059669" icon="📈" />
              <InsightCard label="Longest Session"      value={longestSession}              sub="Single session record" accent="#ef4444" icon="🏅" />
              <InsightCard label="Guards Registered"    value={guards.length}               sub={`${activeGuards.length} active now`} accent="#8b5cf6" icon="👥" />
            </div>

            {/* Top Guards by sessions */}
            <Section title="Top Guards by Sessions">
              <div style={{ padding: "16px 24px" }}>
                {guardSessionCounts.map(([name, count], i) => {
                  const maxCount = guardSessionCounts[0]?.[1] || 1;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={name} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: "50%",
                            background: ["#6366f1","#0ea5e9","#f59e0b","#059669","#ef4444"][i] + "22",
                            color: ["#6366f1","#0ea5e9","#f59e0b","#059669","#ef4444"][i],
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 11,
                          }}>{i + 1}</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{name}</span>
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#64748b" }}>
                          {count} session{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999 }}>
                        <div style={{
                          height: 8, borderRadius: 999,
                          background: ["#6366f1","#0ea5e9","#f59e0b","#059669","#ef4444"][i],
                          width: `${pct}%`,
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
                {guardSessionCounts.length === 0 && (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No data yet.</div>
                )}
              </div>
            </Section>

            {/* Last sync info */}
            <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", marginTop: -12 }}>
              Last synced: {lastSync}
            </div>
          </>
        );

      default:
        return null;
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     JSX
  ───────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #f1f5f9; margin: 0; }
        tr:hover td { background: #fafbff !important; }
        @keyframes ping {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>

      <DashboardLayout title="Admin Dashboard" onLogout={logout}>
        <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

          {/* ── Top bar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Admin Dashboard</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={loadDashboard}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: "1px solid #e2e8f0",
                  background: "#fff", color: "#334155", cursor: "pointer",
                  fontSize: 12, fontWeight: 600,
                }}
              >
                ↺ Refresh
              </button>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: isOnline ? "rgba(5,150,105,0.09)" : "rgba(239,68,68,0.09)",
                borderRadius: 20, padding: "6px 14px",
                fontSize: 12, fontWeight: 600,
                color: isOnline ? "#059669" : "#b91c1c",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: isOnline ? "#10b981" : "#ef4444",
                  display: "inline-block",
                  animation: isOnline ? "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" : "none",
                }} />
                {isOnline ? "Live" : "Offline"}
              </div>
            </div>
          </div>

          {/* ── Offline / sync banner ── */}
          <OfflineBanner isOnline={isOnline} syncMessage={syncMessage} />

          {/* ── Stat cards ── */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <StatCard label="Total Guards"    value={guards.length}        accent="#6366f1" icon="👤" />
            <StatCard label="Active Now"      value={activeGuards.length}  accent="#059669" icon="🟢" />
            <StatCard label="Active Sessions" value={activeSessions}        accent="#0ea5e9" icon="⏱️" />
            <StatCard label="Total Logs"      value={logs.length}          accent="#f59e0b" icon="📋" />
            <StatCard label="Total Hours"     value={`${totalHoursAll}h`}  accent="#8b5cf6" icon="🕐" />
          </div>

          {/* ── Tab bar ── */}
          <div style={{
            display: "flex", gap: 4, flexWrap: "wrap",
            background: "#f1f5f9", borderRadius: 14, padding: 5,
            marginBottom: 24, width: "fit-content",
          }}>
            {TABS.map((tab) => (
              <TabButton key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
            ))}
          </div>

          {/* ── Tab content ── */}
          {renderTabContent()}

        </div>
      </DashboardLayout>
    </>
  );
}