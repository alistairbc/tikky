import React from 'react';
import { TM } from "../constants";

export function TypeBadge({ type, onClick }: { type: string, onClick?: () => void }) {
  const meta = (TM as any)[type];
  return (
    <button onClick={e => { e.stopPropagation(); onClick && onClick(); }} title="Click to change type" style={{ fontSize:10, color: meta.color, fontWeight:600, background:`${meta.color}18`, border:"none", borderRadius:4, padding:"1px 7px", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
      {meta.icon} {meta.label}
    </button>
  );
}
