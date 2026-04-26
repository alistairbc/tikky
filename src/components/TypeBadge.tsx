import React from 'react';
import { TM } from "../constants";

export function TypeBadge({ type, onClick }: { type: string, onClick?: () => void }) {
  const meta = (TM as any)[type];
  // Note type uses yellow (#fde047) — readable on dark surface, use dark ink for bg tint
  const isNote = type === "note";
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick && onClick(); }}
      title="Click to change type"
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: meta.color,
        background: `${meta.color}1a`,
        border: `1px solid ${meta.color}44`,
        borderRadius: 4,
        padding: "1px 7px",
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
        letterSpacing: "0.05em",
        textTransform: "uppercase" as const,
        lineHeight: 1.6,
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        transition: "all .12s",
      }}
    >
      <span style={{ fontSize: 9 }}>{meta.icon}</span>
      {meta.label}
    </button>
  );
}
