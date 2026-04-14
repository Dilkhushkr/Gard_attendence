export default function AuthLayout({ title, children }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
      backgroundSize: "400% 400%",
      animation: "gradientShift 15s ease infinite"
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .auth-card {
          animation: floatIn 0.6s ease-out;
        }
        .input-focus:focus {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: all 0.3s ease;
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .btn-gradient:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <section className="auth-card w-full max-w-md relative z-10">
        {/* Glassmorphism card */}
        <div className="rounded-2xl bg-white/95 backdrop-blur-lg p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block mb-4 p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {title}
            </h1>
            <p className="text-sm text-slate-500">
              Sign in to access your attendance dashboard
            </p>
          </div>

          {children}

          {/* Decorative divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <span className="text-xs text-slate-400">Stay connected</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>
        </div>
      </section>
    </main>
  );
}
