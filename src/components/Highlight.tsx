import React from 'react';

export function Highlight({ text, query, style = {} }: { text: string, query: string, style?: React.CSSProperties }) {
  if (!query || !text) return <span style={style}>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <span style={style}>{text}</span>;
  return (
    <span style={style}>
      {text.slice(0, idx)}
      <mark style={{ background:"#f59e0b44", color:"inherit", borderRadius:2, padding:"0 1px" }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}
