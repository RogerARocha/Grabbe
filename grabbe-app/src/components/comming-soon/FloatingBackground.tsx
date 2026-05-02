const FloatingOrb = ({ size, color, style }: { size: string; color: string; style: React.CSSProperties }) => (
  <div
    className={`absolute ${size} rounded-full ${color} blur-3xl pointer-events-none`}
    style={{ ...style, animation: 'pulse 6s ease-in-out infinite' }}
  />
);

export function FloatingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <FloatingOrb size="w-96 h-96" color="bg-primary/5" style={{ top: '10%', left: '20%' }} />
      <FloatingOrb size="w-80 h-80" color="bg-tertiary/5" style={{ bottom: '15%', right: '15%', animationDelay: '2s' }} />
      <FloatingOrb size="w-64 h-64" color="bg-secondary/5" style={{ top: '50%', left: '60%', animationDelay: '4s' }} />
    </div>
  );
}