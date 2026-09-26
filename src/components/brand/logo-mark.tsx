import { useId } from "react";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id={`l${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9e5ff" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#g${id})`} />
      <path d="M18 45.5v3.5c0 2.9 6.3 5.2 14 5.2s14-2.3 14-5.2v-3.5" fill="#fff" fillOpacity=".55" />
      <ellipse cx="32" cy="45.5" rx="14" ry="5.2" fill={`url(#l${id})`} />
      <path d="M32 43V27" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M31.5 33.5C23 33.5 17.5 28.5 17.5 20.5c8.5 0 14 5 14 13Z" fill={`url(#l${id})`} />
      <path d="M32.5 28c0-8.5 5-14 13.5-14 0 8.5-5 14-13.5 14Z" fill="#fff" fillOpacity=".85" />
    </svg>
  );
}
