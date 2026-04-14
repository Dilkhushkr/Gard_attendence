export default function DashboardLayout({ title, onLogout, children }) {
  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-xl p-4 shadow flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{title}</h1>
          <button
            onClick={onLogout}
            className="rounded-md bg-slate-700 text-white px-4 py-2 text-sm"
          >
            Logout
          </button>
        </header>
        {children}
      </div>
    </main>
  );
}
