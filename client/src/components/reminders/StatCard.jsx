function StatCard({ label, value, accent }) {
  return (
    <div className="glass-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-mist-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-white"}`}>{value}</p>
    </div>
  );
}

export default StatCard;
