import { useCallback, useEffect, useRef, useState } from "react";
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

/** Seconds → "1h 30m 40s" */
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

/** totalHours number/string → "2h 30m 00s" */
function hoursToHMS(totalHours) {
  if (totalHours == null) return "—";
  return formatElapsed(Math.round(Number(totalHours) * 3600));
}

/* ─────────────────────────────────────────────────────────────────────
   HOOK: live elapsed timer from a checkedInAt timestamp
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
   LIVE DURATION CELL — ticks for active sessions, static for closed ones
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
   GUARD STATUS BADGE
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
   STAT CARD — summary numbers at the top
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
   TABLE STYLES (shared)
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
   MAIN PAGE
───────────────────────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const { token, logout } = useAuth();
  const [guards, setGuards] = useState([]);
  const [logs, setLogs]     = useState([]);
  const [locationMap, setLocationMap] = useState({});
  const locationMapRef = useRef(locationMap);
  locationMapRef.current = locationMap;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    const data = await apiRequest(`/admin/dashboard?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setGuards(data.guards || []);
    setLogs(data.logs   || []);
  }, [token]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Poll every 3s
  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => loadDashboard().catch(() => {}), 3000);
    return () => clearInterval(id);
  }, [token, loadDashboard]);

  // Sync on tab focus
  useEffect(() => {
    if (!token) return;
    const onVisible = () => { if (document.visibilityState === "visible") loadDashboard(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [token, loadDashboard]);

  // Resolve addresses
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
      if (loc && typeof loc.latitude === "number") {
        uniqueLocations.set(`${loc.latitude},${loc.longitude}`, loc);
      }
    }
    (async () => {
      const prev    = locationMapRef.current;
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

  // Derived stats
  const activeGuards = guards.filter(
    (g) => g.status?.toLowerCase() === "checked-in" || g.status?.toLowerCase() === "active"
  ).length;
  const activeSessions = logs.filter((l) => l.checkedInAt && !l.checkedOutAt).length;

  const locKey = (loc) => loc ? `${loc.latitude},${loc.longitude}` : null;

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                Admin Dashboard
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                 &nbsp;·&nbsp;{" "}
                {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(5,150,105,0.09)", borderRadius: 20,
              padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#059669",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981",
                display: "inline-block", animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }} />
              Live
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
            <StatCard label="Total Guards"    value={guards.length}  accent="#6366f1" icon="👤" />
            <StatCard label="Active Now"      value={activeGuards}   accent="#059669" icon="🟢" />
            <StatCard label="Active Sessions" value={activeSessions}  accent="#0ea5e9" icon="⏱️" />
            <StatCard label="Total Logs"      value={logs.length}    accent="#f59e0b" icon="📋" />
          </div>

          {/* ── Guard Status Table ── */}
          <Section title="Guard Status" badge={guards.length}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Guard</TH>
                  <TH>Status</TH>
                  <TH>Last Check-In</TH>
                  <TH>Last Check-In Place</TH>
                </tr>
              </thead>
              <tbody>
                {guards.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No guards found.</td></tr>
                ) : guards.map((guard) => (
                  <tr key={guard.guardName} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>
                          {guard.guardName?.[0]?.toUpperCase() ?? "G"}
                        </div>
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

          {/* ── Attendance Logs Table ── */}
          <Section title="Attendance Logs" badge={logs.length}>
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
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No attendance logs.</td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0,
                        }}>
                          {log.guardName?.[0]?.toUpperCase() ?? "G"}
                        </div>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>{log.guardName}</span>
                      </div>
                    </TD>
                    <TD mono>{formatDateTime(log.checkedInAt)}</TD>
                    <TD mono>
                      {log.checkedOutAt
                        ? formatDateTime(log.checkedOutAt)
                        : <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 12 }}>In progress</span>
                      }
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

        </div>
      </DashboardLayout>
    </>
  );
}