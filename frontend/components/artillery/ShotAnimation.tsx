"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AmmoType } from "@/engine/types";

interface ShotAnimationProps {
  ammoType: AmmoType;
  targetPosition: number; // 0–100, matches enemy.position (right: X%)
  travelMs: number;
  onComplete: () => void;
}

// ── Air: LightningDart ────────────────────────────────────────────────────────
// SVG arrowhead with glowing trail, travels left→right across the lane.

function LightningDart({
  targetPosition,
  travelMs,
  onComplete,
}: {
  targetPosition: number;
  travelMs: number;
  onComplete: () => void;
}) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setLeft(100 - targetPosition));
    });

    let raf2: number;

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [targetPosition]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const t = setTimeout(() => onCompleteRef.current(), travelMs);
    return () => clearTimeout(t);
  }, [travelMs]);

  const trail = [
    { offset: -18, w: 10, h: 5, opacity: 0.55 },
    { offset: -32, w: 6, h: 3, opacity: 0.3 },
    { offset: -44, w: 3, h: 2, opacity: 0.12 },
  ];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: "50%",
        left: `${left}%`,
        transform: "translateY(-50%) translateX(-50%) skewX(-12deg)",
        transition: `left ${travelMs}ms linear`,
        zIndex: 10,
      }}
    >
      {trail.map((t, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: t.w,
            height: t.h,
            background:
              "radial-gradient(ellipse, #ffffff 0%, #fde047 50%, transparent 100%)",
            opacity: t.opacity,
            top: "50%",
            left: t.offset,
            transform: "translateY(-50%)",
          }}
        />
      ))}
      <svg
        width="26"
        height="14"
        viewBox="0 0 26 14"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <filter id="dart-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="dart-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fde047" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fde047" />
          </linearGradient>
        </defs>
        {/* Main arrowhead body */}
        <path
          d="M 26 7 L 2 1 L 6 7 L 2 13 Z"
          fill="url(#dart-grad)"
          filter="url(#dart-glow)"
        />
        {/* White-hot tip */}
        <path
          d="M 26 7 L 16 5.5 L 17 7 L 16 8.5 Z"
          fill="#ffffff"
          opacity="0.95"
        />
      </svg>
    </div>
  );
}

// ── Sea: WaterDroplet ─────────────────────────────────────────────────────────
// Torpedo-shaped water droplet with glowing trail, travels left→right.

function WaterDroplet({
  targetPosition,
  travelMs,
  onComplete,
}: {
  targetPosition: number;
  travelMs: number;
  onComplete: () => void;
}) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setLeft(100 - targetPosition));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [targetPosition]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  useEffect(() => {
    const t = setTimeout(() => onCompleteRef.current(), travelMs);
    return () => clearTimeout(t);
  }, [travelMs]);

  const trail = [
    { offset: -16, size: 7, opacity: 0.5 },
    { offset: -27, size: 4, opacity: 0.25 },
  ];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: "50%",
        left: `${left}%`,
        transform: "translateY(-50%) translateX(-50%)",
        transition: `left ${travelMs}ms linear`,
        zIndex: 10,
      }}
    >
      {trail.map((t, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: t.size,
            height: t.size,
            background:
              "radial-gradient(circle, #bae6fd 0%, #38bdf8 60%, transparent 100%)",
            opacity: t.opacity,
            top: "50%",
            left: t.offset,
            transform: "translateY(-50%)",
          }}
        />
      ))}
      <div style={{ animation: "droplet-wobble 600ms ease-in-out infinite" }}>
        <svg
          width="30"
          height="18"
          viewBox="0 0 30 18"
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <filter id="drop-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="drop-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
          </defs>
          {/* Torpedo/teardrop body pointing right */}
          <path
            d="M 2 9 C 2 4.6 5.4 2 10 2 C 16 2 27 5.5 30 9 C 27 12.5 16 16 10 16 C 5.4 16 2 13.4 2 9 Z"
            fill="url(#drop-grad)"
            filter="url(#drop-glow)"
          />
          {/* Specular highlight */}
          <ellipse
            cx="16"
            cy="6"
            rx="4"
            ry="1.8"
            fill="#e0f2fe"
            opacity="0.65"
          />
        </svg>
      </div>
    </div>
  );
}

// ── Land (vine) travel: SVG wavy bezier drawn via stroke-dasharray ────────────
// Brown woody stalk with a bright green vine weaving over/under it (3-layer
// SVG technique). Leaves on short stems pop in as the vine tip passes.

interface LeafDef {
  stemD: string;
  tipX: number;
  tipY: number;
  delay: number;
  above: boolean;
  spiralD: string | null; // non-null for tendril nodes
}

function VineTravel({
  targetPosition,
  travelMs,
  onComplete,
}: {
  targetPosition: number;
  travelMs: number;
  onComplete: () => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null); // brown stalk — measured for dashoffset
  const pathARef = useRef<SVGPathElement>(null); // green vine — measured for leaves

  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [mainDash, setMainDash] = useState(0);
  const [mainOffset, setMainOffset] = useState<number | null>(null);
  const [sideADash, setSideADash] = useState(0);
  const [sideAOffset, setSideAOffset] = useState<number | null>(null);
  const [leaves, setLeaves] = useState<LeafDef[]>([]);

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const { width, height } = svgRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) setDims({ w: width, h: height });
  }, []);

  const vw = dims?.w ?? 300;
  const vh = dims?.h ?? 50;
  const endX = (1 - targetPosition / 100) * vw;
  const midX = endX / 2;
  const cy = vh / 2;
  const amp = vh * 0.18;

  // Brown stalk — S-curve along centreline
  const dMain = `M 0 ${cy} C ${midX * 0.3} ${cy - amp}, ${midX * 0.7} ${
    cy + amp
  }, ${midX} ${cy} S ${endX * 0.85} ${cy - amp}, ${endX} ${cy}`;
  // Green vine — same S-curve inverted + larger amplitude so it weaves over/under
  const dGreen = `M 0 ${cy} C ${midX * 0.3} ${cy + amp * 1.4}, ${midX * 0.7} ${
    cy - amp * 1.4
  }, ${midX} ${cy} S ${endX * 0.85} ${cy + amp * 1.4}, ${endX} ${cy}`;

  const mainSW = Math.max(1.5, vh * 0.06);
  const branchSW = Math.max(0.8, vh * 0.028);
  const spiralSW = Math.max(0.6, vh * 0.018);
  const leafRx = Math.max(2, vh * 0.1);
  const leafRy = Math.max(1, vh * 0.038);
  const blurR = Math.max(0.5, vh * 0.022);
  const stemLen = vh * 0.22;

  // Brown stalk animation — 40 ms delay so green vine leads
  useEffect(() => {
    if (!dims || !pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    setMainDash(len);
    setMainOffset(len);
    let stalkTimeout: ReturnType<typeof setTimeout>;
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        stalkTimeout = setTimeout(() => setMainOffset(0), 40);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(stalkTimeout);
    };
  }, [dims]);

  // Green vine animation (immediate) + leaf/tendril computation
  useEffect(() => {
    if (!dims || !pathARef.current) return;
    const len = pathARef.current.getTotalLength();
    setSideADash(len);
    setSideAOffset(len);

    const leafFractions = [0.12, 0.27, 0.42, 0.57, 0.72, 0.87];
    // Tendrils added to leaves at index 2 (≈0.42) and index 4 (0.72)
    const tendrilIndexes = new Set([2, 4]);

    const leafDefs = leafFractions.map((fraction, i) => {
      const pt = pathARef.current!.getPointAtLength(fraction * len);
      const above = i % 2 === 0;
      const tipX = pt.x + stemLen * 0.3;
      const tipY = pt.y + (above ? -stemLen : stemLen);

      let spiralD: string | null = null;
      if (tendrilIndexes.has(i)) {
        const sx = tipX;
        const sy = tipY;
        const sw = stemLen * 0.4 * 0.38;
        const sh = stemLen * 0.4 * 0.28;
        spiralD = above
          ? `M ${sx} ${sy} C ${sx + sw * 0.3} ${sy - sh * 0.8} ${sx + sw} ${
              sy - sh * 0.8
            } ${sx + sw * 0.9} ${sy} C ${sx + sw * 0.8} ${sy + sh * 0.4} ${
              sx + sw * 0.2
            } ${sy + sh * 0.4} ${sx + sw * 0.4} ${sy + sh * 0.07}`
          : `M ${sx} ${sy} C ${sx + sw * 0.3} ${sy + sh * 0.8} ${sx + sw} ${
              sy + sh * 0.8
            } ${sx + sw * 0.9} ${sy} C ${sx + sw * 0.8} ${sy - sh * 0.4} ${
              sx + sw * 0.2
            } ${sy - sh * 0.4} ${sx + sw * 0.4} ${sy - sh * 0.07}`;
      }

      return {
        stemD: `M ${pt.x} ${pt.y} L ${tipX} ${tipY}`,
        tipX,
        tipY,
        delay: fraction * travelMs,
        above,
        spiralD,
      };
    });

    setLeaves(leafDefs);
    requestAnimationFrame(() => setSideAOffset(0));
  }, [dims, travelMs, stemLen]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });
  useEffect(() => {
    const t = setTimeout(() => onCompleteRef.current(), travelMs + 300);
    return () => clearTimeout(t);
  }, [travelMs]);

  const greenVineProps = {
    d: dGreen,
    stroke: "rgb(101 163 13)",
    strokeWidth: mainSW * 0.55,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeDasharray: sideADash || undefined,
    strokeDashoffset: sideAOffset ?? sideADash,
    style: {
      transition:
        sideAOffset === 0
          ? `stroke-dashoffset ${travelMs}ms linear`
          : undefined,
    },
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${vw} ${vh}`}
    >
      <defs>
        <filter id="vine-glow">
          <feGaussianBlur stdDeviation={blurR} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Clip rects for over-bridge segments at each crossing point */}
        {[0.2, 0.4, 0.6, 0.8].map((f, i) => {
          const span = 0.15 * endX;
          return (
            <clipPath key={i} id={`bridge-clip-${i}`}>
              <rect x={f * endX - span / 2} y={0} width={span} height={vh} />
            </clipPath>
          );
        })}
      </defs>

      {/* Layer 1: Green vine "under" — occluded by brown at crossings */}
      <path ref={pathARef} {...greenVineProps} />

      {/* Layer 2: Brown woody stalk — drawn over green, glowing */}
      <path
        ref={pathRef}
        d={dMain}
        stroke="rgb(120 53 15)"
        strokeWidth={mainSW}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={mainDash || undefined}
        strokeDashoffset={mainOffset ?? mainDash}
        filter="url(#vine-glow)"
        style={{
          transition:
            mainOffset === 0
              ? `stroke-dashoffset ${travelMs}ms linear`
              : undefined,
        }}
      />

      {/* Layer 3: Green vine "over" bridges — same path clipped to crossing zones */}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} {...greenVineProps} clipPath={`url(#bridge-clip-${i})`} />
      ))}

      {/* Leaves on short stems + spiral tendrils */}
      {leaves.map((leaf, i) => (
        <g key={i}>
          <path
            d={leaf.stemD}
            pathLength="1"
            stroke="rgb(134 239 172)"
            strokeWidth={branchSW}
            strokeOpacity="0.9"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1"
            strokeDashoffset="1"
            style={{
              animation: `vine-branch-grow 300ms ease-out forwards`,
              animationDelay: `${leaf.delay}ms`,
            }}
          />
          <ellipse
            cx={leaf.tipX}
            cy={leaf.tipY}
            rx={leafRx}
            ry={leafRy}
            fill="rgb(134 239 172)"
            opacity="0"
            style={{
              animation: `vine-leaf-pop-${
                leaf.above ? "up" : "down"
              } 0.25s ease-out forwards`,
              animationDelay: `${leaf.delay + 280}ms`,
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
          {leaf.spiralD && (
            <path
              d={leaf.spiralD}
              pathLength="1"
              stroke="rgb(134 239 172)"
              strokeWidth={spiralSW}
              strokeOpacity="0.85"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="1"
              strokeDashoffset="1"
              style={{
                animation: `vine-branch-grow 450ms ease-out forwards`,
                animationDelay: `${leaf.delay + 300}ms`,
              }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Main ShotAnimation ────────────────────────────────────────────────────────

export function ShotAnimation({
  ammoType,
  targetPosition,
  travelMs,
  onComplete,
}: ShotAnimationProps) {
  if (ammoType === "air") {
    return (
      <LightningDart
        targetPosition={targetPosition}
        travelMs={travelMs}
        onComplete={onComplete}
      />
    );
  }

  if (ammoType === "sea") {
    return (
      <WaterDroplet
        targetPosition={targetPosition}
        travelMs={travelMs}
        onComplete={onComplete}
      />
    );
  }

  // land: vine SVG grows from castle to enemy
  return (
    <VineTravel
      targetPosition={targetPosition}
      travelMs={travelMs}
      onComplete={onComplete}
    />
  );
}
