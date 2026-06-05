"use client";

import React from "react";

interface LogoProps {
  className?: string;
  glow?: boolean;
}

export default function NexoraLogo({ className = "w-8 h-8", glow = true }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${glow ? "filter drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]" : ""} transition-all duration-300`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Face Gradients */}
        <linearGradient id="prismTop" x1="50" y1="20" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D4D4D8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="prismLeft" x1="24" y1="35" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E4E4E7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#52525B" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="prismRight" x1="76" y1="35" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A1A1AA" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#27272A" stopOpacity="0.05" />
        </linearGradient>

        {/* Ray Gradients */}
        <linearGradient id="rayGreen" x1="5" y1="75" x2="35" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="rayBlue" x1="65" y1="42" x2="95" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ambient soft background glow */}
      {glow && (
        <circle cx="50" cy="50" r="30" fill="#3B82F6" opacity="0.04" />
      )}

      {/* Incoming Light Ray (Green) */}
      <path
        d="M 5,75 L 35,55"
        stroke="url(#rayGreen)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Refraction segment inside the prism */}
      <path
        d="M 35,55 L 50,48 L 65,42"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Outgoing Refracted Light Ray (Blue) */}
      <path
        d="M 65,42 L 95,25"
        stroke="url(#rayBlue)"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* 3D Glass Prism Structure */}
      {/* Left Face */}
      <path
        d="M24,35 L50,50 L50,80 L24,65 Z"
        fill="url(#prismLeft)"
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Right Face */}
      <path
        d="M50,50 L76,35 L76,65 L50,80 Z"
        fill="url(#prismRight)"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Top Face */}
      <path
        d="M50,20 L76,35 L50,50 L24,35 Z"
        fill="url(#prismTop)"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Light highlights on active node satellite */}
      <circle cx="50" cy="20" r="2" fill="#FFFFFF" opacity="0.3" className="animate-ping" style={{ animationDuration: "3s" }} />
      <circle cx="50" cy="20" r="1.2" fill="#FFFFFF" />

      {/* Small accent connection dots */}
      <circle cx="24" cy="35" r="0.8" fill="#FFFFFF" opacity="0.4" />
      <circle cx="76" cy="35" r="0.8" fill="#FFFFFF" opacity="0.4" />
      <circle cx="50" cy="80" r="0.8" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
}
