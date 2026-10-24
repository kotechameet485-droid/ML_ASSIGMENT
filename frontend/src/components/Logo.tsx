import React from 'react';

export const EngineMindRotor: React.FC<{ className?: string }> = ({
  className = "w-5 h-5"
}) => {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="26" stroke="#2563EB" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="3 3" />
      <circle cx="28" cy="28" r="22" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
      {/* Rotor blades */}
      <path d="M28 10 C32 18, 32 24, 28 28 C24 24, 24 18, 28 10 Z" fill="#60A5FA" />
      <path d="M46 28 C38 32, 32 32, 28 28 C32 24, 38 24, 46 28 Z" fill="#3B82F6" />
      <path d="M28 46 C24 38, 24 32, 28 28 C32 32, 32 38, 28 46 Z" fill="#2563EB" />
      <path d="M10 28 C18 24, 24 24, 28 28 C24 32, 18 32, 10 28 Z" fill="#1D4ED8" />
      {/* Diagonal blades */}
      <path d="M40.7 15.3 C37.8 22.4, 33.6 25.2, 28 28 C30.8 22.4, 33.6 18.2, 40.7 15.3 Z" fill="#93C5FD" />
      <path d="M40.7 40.7 C33.6 37.8, 30.8 33.6, 28 28 C33.6 30.8, 37.8 33.6, 40.7 40.7 Z" fill="#3B82F6" />
      <path d="M15.3 40.7 C18.2 33.6, 22.4 30.8, 28 28 C25.2 33.6, 22.4 37.8, 15.3 40.7 Z" fill="#1E40AF" />
      <path d="M15.3 15.3 C22.4 18.2, 25.2 22.4, 28 28 C22.4 25.2, 18.2 22.4, 15.3 15.3 Z" fill="#60A5FA" />
      {/* Core Hub */}
      <circle cx="28" cy="28" r="6" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
      <circle cx="28" cy="28" r="2.5" fill="#2563EB" />
    </svg>
  );
};

export const EngineMindLogo: React.FC<{ className?: string; inverted?: boolean }> = ({
  className = "h-8",
  inverted = true
}) => {
  return (
    <svg viewBox="0 0 210 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Turbofan Rotor Geometric Emblem */}
      <g transform="translate(4, 4)">
        <circle cx="28" cy="28" r="26" stroke="#2563EB" strokeWidth="2" strokeOpacity="0.3" strokeDasharray="3 3" />
        <circle cx="28" cy="28" r="22" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
        {/* Rotor blades */}
        <path d="M28 10 C32 18, 32 24, 28 28 C24 24, 24 18, 28 10 Z" fill="#60A5FA" />
        <path d="M46 28 C38 32, 32 32, 28 28 C32 24, 38 24, 46 28 Z" fill="#3B82F6" />
        <path d="M28 46 C24 38, 24 32, 28 28 C32 32, 32 38, 28 46 Z" fill="#2563EB" />
        <path d="M10 28 C18 24, 24 24, 28 28 C24 32, 18 32, 10 28 Z" fill="#1D4ED8" />
        {/* Diagonal blades */}
        <path d="M40.7 15.3 C37.8 22.4, 33.6 25.2, 28 28 C30.8 22.4, 33.6 18.2, 40.7 15.3 Z" fill="#93C5FD" />
        <path d="M40.7 40.7 C33.6 37.8, 30.8 33.6, 28 28 C33.6 30.8, 37.8 33.6, 40.7 40.7 Z" fill="#3B82F6" />
        <path d="M15.3 40.7 C18.2 33.6, 22.4 30.8, 28 28 C25.2 33.6, 22.4 37.8, 15.3 40.7 Z" fill="#1E40AF" />
        <path d="M15.3 15.3 C22.4 18.2, 25.2 22.4, 28 28 C22.4 25.2, 18.2 22.4, 15.3 15.3 Z" fill="#60A5FA" />
        {/* Core Hub */}
        <circle cx="28" cy="28" r="6" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2" />
        <circle cx="28" cy="28" r="2.5" fill="#2563EB" />
      </g>
      {/* Wordmark */}
      <text
        x="70"
        y="32"
        fontFamily="Inter, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill={inverted ? "#F8FAFC" : "#0F172A"}
        letterSpacing="-0.03em"
      >
        EngineMind
      </text>
      <text
        x="70"
        y="47"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize="9"
        fontWeight="600"
        fill={inverted ? "#94A3B8" : "#64748B"}
        letterSpacing="0.12em"
      >
        C-MAPSS RUL RESEARCH
      </text>
    </svg>
  );
};
