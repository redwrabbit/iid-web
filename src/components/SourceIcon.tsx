import Image from "next/image";

export default function SourceIcon({ source }: { source: string }) {
  if (source === "유튜브") {
    return (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] inline-block align-text-bottom shrink-0">
        <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
        <path d="M10 8.7l7 3.3-7 3.3z" fill="#fff" />
      </svg>
    );
  }
  if (source === "브런치") {
    return (
      <Image
        src="/brunch-logo.png"
        alt="브런치"
        width={18}
        height={18}
        className="inline-block align-text-bottom rounded-full shrink-0"
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] inline-block align-text-bottom shrink-0">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#111111" />
      <path d="M8 7h8M8 11.5h8M8 16h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
