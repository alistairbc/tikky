import React from 'react';
import { tagColor } from "../utils/format";

export function TagPill({ tag, active, onClick }: any) {
  const col = tagColor(tag);
  return (
    <button onClick={e => { e.stopPropagation(); onClick && onClick(); }} style={{ fontSize:10, fontWeight:600, color: col, background: active ? `${col}40` : `${col}28`, border: active ? `1px solid ${col}` : `1px solid ${col}55`, borderRadius:4, padding:"1px 6px", cursor:"pointer", fontFamily:"inherit", transition:"all .12s" }}>
      {tag}
    </button>
  );
}
