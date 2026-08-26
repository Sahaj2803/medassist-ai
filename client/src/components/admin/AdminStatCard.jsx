function AdminStatCard({ label, value, accent, sublabel }) {
  return (
    <div className="glass-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-mist-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-white"}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-mist-400">{sublabel}</p>}
    </div>
  );
}

export default AdminStatCard;
