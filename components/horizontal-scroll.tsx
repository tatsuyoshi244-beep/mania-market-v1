type HorizontalScrollProps = {
  children: React.ReactNode;
  className?: string;
};

export function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-paper to-transparent dark:from-ink" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-paper to-transparent dark:from-ink" />
      <div className="scrollbar-hide flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}