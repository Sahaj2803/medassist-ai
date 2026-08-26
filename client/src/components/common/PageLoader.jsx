function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-signal-400" />
        <p className="text-sm text-mist-400">Loading MedAssist…</p>
      </div>
    </div>
  );
}

export default PageLoader;
