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
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] inline-block align-text-bottom">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#000000" />
      <path
        d="M17.2 4.6 7.2 17.6c-.8 1.1-1.7 1.8-3 2.1"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="15.2" y1="6.8" x2="8.6" y2="15.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="14.9" cy="8.9" r="1.1" fill="none" stroke="#fff" strokeWidth="1.3" />
    </svg>
  );
}
