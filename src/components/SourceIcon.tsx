export default function SourceIcon({ source }: { source: string }) {
  if (source === "유튜브") {
    return (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] inline-block align-text-bottom">
        <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
        <path d="M10 8.7l7 3.3-7 3.3z" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] inline-block align-text-bottom text-[#B8791E]">
      <path
        d="M17.5 2.8 6.8 17.2c-.9 1.2-1.9 2-3.3 2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="15.3" y1="5.3" x2="8" y2="15.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="15" cy="7.6" r="1.15" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
