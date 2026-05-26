export const TimelinePlaceholder = () => {
  return (
    <section className="bg-surface rounded-xl p-8 bloom-shadow border border-surface-container-high border-dashed opacity-70">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-text-muted mb-4 opacity-50">calendar_month</span>
        <h3 className="text-xl font-bold text-text-high mb-2">Consuming Timeline</h3>
        <p className="text-text-muted max-w-md">This will display your consumption over time.</p>
      </div>
    </section>
  );
};
