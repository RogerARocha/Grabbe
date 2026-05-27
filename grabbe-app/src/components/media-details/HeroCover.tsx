interface HeroCoverProps {
  title: string;
  imageUrl: string;
}

export const HeroCover = ({ title, imageUrl }: HeroCoverProps) => {
  return (
    <div className="aspect-2/3 rounded-lg overflow-hidden bloom-shadow transition-all duration-300 relative group">
      <img alt={title} className="w-full h-full object-cover" src={imageUrl} />
      <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent opacity-0 ">
      </div>
    </div>
  );
};
