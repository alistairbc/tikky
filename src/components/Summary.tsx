import React from 'react';
import { TM, PM } from "../constants";
import { fmt, renderMd, tagColor } from "../utils/format";
import { Tick } from "./Tick";

export function SumItem({ entry, onToggle, expanded, onExpand, cp, C }: any) {
  const commentCount = (entry.comments||[]).length;
  return (
    <div style={{ marginBottom:6 }}>
      <div onClick={onExpand} style={{ padding:"9px 12px", background: entry.done ? "transparent" : C.surface, borderRadius: expanded ? "8px 8px 0 0" : 8, border:`1px solid ${expanded ? C.accent+"55" : entry.done ? C.border : C.border}`, opacity: entry.done ? 0.5 : 1, cursor:"pointer", transition:"border-color .15s" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
          {entry.type === "task"
            ? <div onClick={e => e.stopPropagation()}><Tick checked={entry.done} onChange={onToggle} /></div>
            : <div style={{ width:6, height:6, borderRadius:"50%", background: (TM as any)[entry.type].color, flexShrink:0, marginTop:5 }} />
          }
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:"0 0 4px", fontSize:13, color: C.text, textDecoration: entry.done ? "line-through" : "none", lineHeight:1.5 }}>{entry.emoji && <span style={{ marginRight:4 }}>{entry.emoji}</span>}{renderMd(entry.text)}</p>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:10, color: C.dim }}>{fmt(entry.timestamp)}</span>
              {entry.dueDate && !entry.done && <span style={{ fontSize:10, color:"#f59e0b", background:"#f59e0b15", padding:"1px 6px", borderRadius:3, fontWeight:600 }}>⏱ {entry.dueDate}</span>}
              {commentCount > 0 && <span style={{ fontSize:9, color: C.accent, background:`${C.accent}18`, padding:"1px 6px", borderRadius:3, fontWeight:600 }}>💬 {commentCount}</span>}
              {[...entry.tags, ...entry.contexts].map(t => <span key={t} style={{ fontSize:10, color: tagColor(t), background:`${tagColor(t)}15`, padding:"1px 5px", borderRadius:3 }}>{t}</span>)}
            </div>
          </div>
          {entry.type === "task" && <span style={{ fontSize:10, color: (PM as any)[entry.priority].color, background:`${(PM as any)[entry.priority].color}15`, padding:"2px 6px", borderRadius:4, flexShrink:0 }}>{(PM as any)[entry.priority].label}</span>}
          <span style={{ fontSize:12, color: expanded ? C.accent : C.border, padding:"0 2px", flexShrink:0 }}>{expanded ? "▾" : "▸"}</span>
        </div>
      </div>

      {expanded && cp && (
        <div onClick={e => e.stopPropagation()} style={{ padding:"10px 12px", background: C.bg, borderRadius:"0 0 8px 8px", border:`1px solid ${C.accent}55`, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, color: C.dim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>💬 Comments {commentCount > 0 && <span style={{ color: C.accent, fontWeight:400 }}>· {commentCount}</span>}</div>
          {(entry.comments||[]).map((comment: any) => (
            <div key={comment.id} style={{ marginBottom:7, padding:"6px 9px", background: C.surface, borderRadius:6, border:`1px solid ${C.border}` }}>
              {cp.editingComment && cp.editingComment.commentId === comment.id ? (
                <div>
                  <textarea value={cp.editCommentText} onChange={e => cp.onEditTextChange(e.target.value)} onKeyDown={e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();cp.onSaveEdit();} if(e.key==="Escape")cp.onCancelEdit(); }} rows={2} autoFocus style={{ width:"100%", resize:"none", background:C.input, border:`1px solid ${C.accent}55`, borderRadius:5, padding:"4px 7px", fontSize:12, fontFamily:"inherit", color: C.text, outline:"none", boxSizing:"border-box" }} />
                  <div style={{ display:"flex", gap:5, marginTop:4 }}>
                    <button onClick={cp.onSaveEdit} style={{ fontSize:11, background: C.accent, border:"none", color:"#fff", cursor:"pointer", padding:"2px 9px", borderRadius:4, fontFamily:"inherit" }}>Save</button>
                    <button onClick={cp.onCancelEdit} style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`, color: C.dim, cursor:"pointer", padding:"2px 9px", borderRadius:4, fontFamily:"inherit" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
                  <div style={{ flex:1 }}>
                    <p onStartEdit={() => cp.onStartEdit(comment.id, comment.text)} title="Double-click to edit" style={{ margin:"0 0 3px", fontSize:12, color: C.text, lineHeight:1.5, wordBreak:"break-word", cursor:"default" }}>{comment.text}</p>
                    <span style={{ fontSize:10, color: C.border }}>{fmt(comment.createdAt)}</span>
                  </div>
                  <button onClick={() => cp.onDelete(comment.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#ef4444", padding:"1px 3px", opacity:.6, flexShrink:0 }}>✕</button>
                </div>
              )}
            </div>
          ))}
          <div style={{ display:"flex", gap:6, marginTop:6 }}>
            <textarea value={cp.input} onChange={e => cp.onInputChange(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();cp.onAdd();} }} placeholder="Add a comment…" rows={2} style={{ flex:1, resize:"none", background:C.input, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", fontSize:12, fontFamily:"inherit", color: C.text, outline:"none", lineHeight:1.5, boxSizing:"border-box" }} onFocus={(e: any)=>e.target.style.borderColor=`${C.accent}66`} onBlur={(e: any)=>e.target.style.borderColor=C.border} />
            <button onClick={cp.onAdd} disabled={!cp.input.trim()} style={{ padding:"0 11px", borderRadius:6, border:"none", background: cp.input.trim() ? C.accent : C.border, color:"#fff", cursor: cp.input.trim() ? "pointer" : "default", fontSize:13, alignSelf:"stretch", transition:"background .15s" }}>↑</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SumSection({ label, color, count, children, C }: any) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background: color, boxShadow:`0 0 6px ${color}88` }} />
        <span style={{ fontWeight:600, fontSize:13, color: C.text }}>{label}</span>
        <span style={{ fontSize:11, color: C.dim, background: C.surface, padding:"1px 7px", borderRadius:8 }}>{count}</span>
      </div>
      {children}
    </div>
  );
}
