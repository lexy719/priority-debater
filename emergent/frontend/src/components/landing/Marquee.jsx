export const Marquee = ({ dark = false }) => {
  const text = "DEBATE YOUR STARTUP IDEA UNTIL IT BREAKS";
  const items = Array.from({ length: 6 });
  return (
    <div
      data-testid="marquee"
      className={`overflow-hidden border-y-[1.5px] border-black py-3 ${
        dark ? "bg-[#0a0a0a]" : "bg-[#ffd60a]"
      }`}
    >
      <div className="flex whitespace-nowrap animate-marquee">
        {items.concat(items).map((_, i) => (
          <span
            key={i}
            className={`font-display text-xl uppercase tracking-wide px-6 flex items-center gap-6 ${
              dark ? "text-white" : "text-black"
            }`}
          >
            {text}
            <span className="text-[#ff3b30]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};
