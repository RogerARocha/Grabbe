interface HeroCoverProps {
  title: string;
  imageUrl: string;
}

export const HeroCover = ({ title, imageUrl }: HeroCoverProps) => {
  return (
    <div className="aspect-[2/3] rounded-lg overflow-hidden bloom-shadow transition-all duration-300 hover:scale-[1.02] relative group">
      <img alt={title} className="w-full h-full object-cover" src={imageUrl} />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
        <button className="w-full py-3 bg-text-base/10 backdrop-blur-md rounded-lg text-sm font-bold border border-text-base/20 hover:bg-text-base/20 transition-all text-text-base">
          View Gallery
        </button>
      </div>
    </div>
  );
};
