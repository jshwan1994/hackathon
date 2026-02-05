"use client";

interface CategoryIconProps {
  category: string;
  size?: number;
  color?: string;
  className?: string;
}

export default function CategoryIcon({ category, size = 20, color = "currentColor", className = "" }: CategoryIconProps) {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (category) {
    case 'Valve':
      // 밸브 모양 (나비밸브 스타일)
      return (
        <svg {...iconProps}>
          <path d="M12 4v4M12 16v4" />
          <path d="M8 8l8 8M16 8l-8 8" />
          <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.2" />
        </svg>
      );

    case 'Safety Valve':
      // 안전밸브 (PSV/PRV) - 스프링 릴리프 밸브 스타일
      return (
        <svg {...iconProps}>
          {/* 밸브 본체 */}
          <path d="M8 14h8v6H8z" fill={color} fillOpacity="0.15" />
          <path d="M8 14h8M8 20h8M8 14v6M16 14v6" />
          {/* 스프링 */}
          <path d="M10 6l2 2 2-2M10 8l2 2 2-2M10 10l2 2 2-2" />
          {/* 윗뚜껑 */}
          <circle cx="12" cy="4" r="2" fill={color} fillOpacity="0.3" />
          {/* 배출구 */}
          <path d="M16 17h4" strokeWidth="2.5" />
          <path d="M18 15l2 2-2 2" />
        </svg>
      );

    case 'Pressure':
      // 압력 게이지
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="13" r="8" fill={color} fillOpacity="0.1" />
          <path d="M12 5v3" />
          <path d="M12 13l4-4" strokeWidth="2.5" />
          <circle cx="12" cy="13" r="1.5" fill={color} />
        </svg>
      );

    case 'Temperature':
      // 온도계
      return (
        <svg {...iconProps}>
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" fill={color} fillOpacity="0.1" />
          <circle cx="11.5" cy="17.5" r="2" fill={color} />
          <path d="M11.5 11v6.5" strokeWidth="2.5" />
        </svg>
      );

    case 'Flow':
      // 유량 (물방울 + 화살표)
      return (
        <svg {...iconProps}>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" fill={color} fillOpacity="0.15" />
          <path d="M8 12h8M14 9l3 3-3 3" />
        </svg>
      );

    case 'Level':
      // 수위계
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" fill={color} fillOpacity="0.1" />
          <path d="M4 14h16" />
          <path d="M4 14c2 -1 4 1 6 0s4 1 6 0s2 -1 4 0" fill={color} fillOpacity="0.3" />
          <rect x="4" y="14" width="16" height="6" rx="1" fill={color} fillOpacity="0.2" />
        </svg>
      );

    case 'Analysis':
      // 분석 (비커)
      return (
        <svg {...iconProps}>
          <path d="M9 3h6v5l4 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l4-9V3z" fill={color} fillOpacity="0.1" />
          <path d="M9 3h6" />
          <path d="M7 14h10" />
          <circle cx="10" cy="17" r="1" fill={color} />
          <circle cx="14" cy="16" r="0.8" fill={color} />
        </svg>
      );

    case 'Position':
      // 위치/밸브 위치
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" fill={color} fillOpacity="0.1" />
          <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      );

    case 'Control Valve':
      // 조절밸브 (CV 스타일)
      return (
        <svg {...iconProps}>
          <path d="M4 12h4l2-4 4 8 2-4h4" />
          <rect x="6" y="6" width="12" height="12" rx="2" fill={color} fillOpacity="0.1" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );

    case 'Hand/Manual':
      // 수동 (손)
      return (
        <svg {...iconProps}>
          <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
          <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
          <path d="M10 10V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
          <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-6-12 2 2 0 1 1 4 0" fill={color} fillOpacity="0.1" />
        </svg>
      );

    case 'Speed':
      // 속도/회전
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.1" />
          <path d="M12 7v5l3 3" />
          <path d="M12 3v2M21 12h-2M12 21v-2M3 12h2" />
        </svg>
      );

    case 'Vibration':
      // 진동
      return (
        <svg {...iconProps}>
          <path d="M2 12h2l2-6 3 12 3-12 3 12 2-6h2" />
        </svg>
      );

    case 'Electrical':
      // 전기
      return (
        <svg {...iconProps}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={color} fillOpacity="0.2" />
        </svg>
      );

    default:
      // 기타 (사각형)
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" fill={color} fillOpacity="0.1" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
  }
}
