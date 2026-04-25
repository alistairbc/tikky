import React from 'react';
import { TAG_PAL } from "./constants_format";

export const tagColor = (tag: string) => { 
  const key = tag.replace(/^[#@]/, ""); 
  let h = 0; 
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff; 
  return TAG_PAL[Math.abs(h) % TAG_PAL.length]; 
};

export const fmt = (date: Date | string | null, short = false) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (short) return new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit" }).format(d);
  return new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
};

export const inPeriod = (date: Date | string, p: string) => {
  const d = date instanceof Date ? date : new Date(date), now = new Date();
  const sod = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const today = sod(now);
  if (p === "today")    return d >= today;
  if (p === "week")     { const w = new Date(today); w.setDate(w.getDate() - 7); return d >= w; }
  if (p === "lastweek") { const w1 = new Date(today), w2 = new Date(today); w1.setDate(w1.getDate()-7); w2.setDate(w2.getDate()-14); return d >= w2 && d < w1; }
  return true;
};

export function renderMd(text: string, query: string = "") {
  if (!text) return null;
  const PATS = [
    { re:/\*\*(.+?)\*\*/,  fn:(m: any, k: any)=><strong key={k} style={{fontWeight:700}}>{m[1]}</strong> },
    { re:/__(.+?)__/,      fn:(m: any, k: any)=><strong key={k} style={{fontWeight:700}}>{m[1]}</strong> },
    { re:/\*(.+?)\*/,      fn:(m: any, k: any)=><em key={k} style={{fontStyle:"italic"}}>{m[1]}</em> },
    { re:/_([^_]+?)_/,     fn:(m: any, k: any)=><em key={k} style={{fontStyle:"italic"}}>{m[1]}</em> },
    { re:/`(.+?)`/,        fn:(m: any, k: any)=><code key={k} style={{fontFamily:"monospace",fontSize:"0.9em",background:"rgba(128,128,128,0.18)",padding:"0 3px",borderRadius:3}}>{m[1]}</code> },
    { re:/\[(.+?)\]\((.+?)\)/, fn:(m: any, k: any)=><a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" style={{color:"inherit",textDecoration:"underline",opacity:.8}}>{m[1]}</a> },
  ];
  let ki = 0;

  function highlightText(s: string, q: string) {
    if (!q || !s) return s;
    const idx = s.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return s;
    return (
      <span key={`hl-${ki++}`}>
        {s.slice(0, idx)}
        <mark style={{ background:"#f59e0b44", color:"inherit", borderRadius:2, padding:"0 1px" }}>{s.slice(idx, idx + q.length)}</mark>
        {highlightText(s.slice(idx + q.length), q)}
      </span>
    );
  }

  function parseInline(s: string) {
    const out: any[] = [];
    while (s.length > 0) {
      let best: any = null, bestIdx = s.length;
      for (const p of PATS) {
        const m = s.match(p.re);
        if (m && m.index !== undefined && m.index < bestIdx) { 
          best = { m, fn:p.fn }; 
          bestIdx = m.index; 
        }
      }
      if (!best) { out.push(highlightText(s, query)); break; }
      if (bestIdx > 0) out.push(highlightText(s.slice(0, bestIdx), query));
      out.push(best.fn(best.m, ki++));
      s = s.slice(bestIdx + best.m[0].length);
    }
    return out;
  }
  const segs = text.split('\n');
  const out: any[] = [];
  segs.forEach((seg, i) => {
    out.push(...parseInline(seg));
    if (i < segs.length - 1) out.push(<br key={`br${i}`} />);
  });
  return out;
}
