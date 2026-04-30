interface DetailItem {
  label: string;
  value: string;
}

interface DetailsGridProps {
  items: DetailItem[];
}

export const DetailsGrid = ({ items }: DetailsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-outline-variant/10">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">{item.label}</p>
          <p className="text-sm font-bold text-text-high">{item.value}</p>
        </div>
      ))}
    </div>
  );
};
