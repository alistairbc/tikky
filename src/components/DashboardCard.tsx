import React from 'react';
import { TM, PM } from "../constants";
import { fmt, renderMd } from "../utils/format";
import { relDueLabel } from "../utils/nlp";
import { Tick } from "./Tick";

export function DashboardCard({
  entry, C,
  isDashExp, editingDueDate, dueDateInput,
  commentInputs, editingComment, editCommentText, stInputs,
  onExpand, onToggleDone, onDelete, onPriority,
  onDueDateEdit, onDueDateChange, onDueDateSave, onDueDateCancel,
  onCommentInput, onCommentAdd,
  onCommentEditStart, onCommentEditChange, onCommentEditSave, onCommentEditCancel,
  onCommentDelete,
  onSubtaskInput, onSubtaskAdd, onSubtaskToggle, onSubtaskDelete,
  searchQuery,
}: any) {
  const meta = (TM as any)[entry.type];
  const commentCount = (entry.comments||[]).length;
  return (
    <div style={{ marginBottom:7 }}>

      <div
        onClick={onExpand}
        style={{ padding:"9px 10px", background: entry.done ? C.bg : C.surface, borderRadius: isDashExp ? "8px 8px 0 0" : 8, border:`1px solid ${isDashExp ? C.accent+"55" : C.border}`, opacity: entry.done ? 0.45 : 1, transition:"all .2s", cursor:"pointer" }}
      >
        <div style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
          {entry.type === "task"
            ? <div onClick={e => e.stopPropagation()}><Tick checked={entry.done} onChange={onToggleDone} /></div>
            : <div style={{ width:6, height:6, borderRadius:"50%", background: meta.color, flexShrink:0, marginTop:5 }} />
          }
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:"0 0 3px", fontSize:12, color: C.text, lineHeight:1.5, textDecoration: entry.done ? "line-through" : "none", wordBreak:"break-word" }}>
              {entry.emoji && <span style={{ marginRight:4 }}>{entry.emoji}</span>}
              {renderMd(entry.text, searchQuery)}
            </p>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:4, alignItems:"center" }}>
              {entry.type === "task" && !entry.done && (
                <div style={{ display:"flex", gap:3 }}>
                  {["high","medium","low"].map(p => (
                    <button key={p} onClick={e => { e.stopPropagation(); onPriority(p); }} title={`Set priority: ${(PM as any)[p].label}`} style={{ fontSize:10, padding:"2px 6px", borderRadius:4, border: entry.priority===p ? `1px solid ${(PM as any)[p].color}66` : `1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit", fontWeight:700, background: entry.priority===p ? `${(PM as any)[p].color}28` : C.surface, color: entry.priority===p ? (PM as any)[p].color : C.dim, transition:"all .12s" }}>
                      {(PM as any)[p].label[0]}
                    </button>
                  ))}
                </div>
              )}
              {editingDueDate === entry.id && !entry.done ? (
                <div onClick={e => e.stopPropagation()} style={{ display:"flex", alignItems:"center", gap:3 }}>
                  <input autoFocus value={dueDateInput} onChange={e => onDueDateChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); onDueDateSave(); } if (e.key === "Escape") { e.stopPropagation(); onDueDateCancel(); } }} onClick={e => e.stopPropagation()} placeholder="e.g. Friday 3pm" style={{ fontSize:10, background:C.input, border:`1px solid ${C.accent}88`, borderRadius:4, padding:"2px 6px", color:"#f59e0b", fontFamily:"inherit", outline:"none", width:100 }} />
                  <button onClick={e => { e.stopPropagation(); onDueDateSave(); }}   style={{ fontSize:10, background:`${C.accent}22`, border:`1px solid ${C.accent}55`, color:C.accent, cursor:"pointer", padding:"2px 5px", borderRadius:4, fontFamily:"inherit", lineHeight:1 }}>✓</button>
                  <button onClick={e => { e.stopPropagation(); onDueDateCancel(); }} style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`, color:C.dim, cursor:"pointer", padding:"2px 5px", borderRadius:4, fontFamily:"inherit", lineHeight:1 }}>✕</button>
                </div>
              ) : entry.dueDate && !entry.done ? (
                <span onClick={e => { e.stopPropagation(); onDueDateEdit(); }} title={`Due: ${entry.dueDate} — click to edit`} style={{ fontSize:10, color:"#f59e0b", background:"#f59e0b18", padding:"1px 6px", borderRadius:3, fontWeight:600, cursor:"pointer" }}>⏱ {relDueLabel(entry.dueDate, entry.timestamp)}</span>
              ) : !entry.done ? (
                <button onClick={e => { e.stopPropagation(); onDueDateEdit(); }} style={{ fontSize:9, color:C.dim, background:"none", border:`1px solid ${C.border}`, cursor:"pointer", padding:"1px 5px", borderRadius:3, fontFamily:"inherit" }}>+ due</button>
              ) : null}
              {commentCount > 0 && <span style={{ fontSize:9, color:C.accent, background:`${C.accent}18`, padding:"1px 5px", borderRadius:3, fontWeight:600 }}>💬 {commentCount}</span>}
              {entry.subtasks.length > 0 && (
                <span style={{ fontSize:9, color:C.muted, background:`${C.border}55`, padding:"1px 5px", borderRadius:3, fontWeight:600 }}>
                  ☑ {entry.subtasks.filter((s: any) => s.done).length}/{entry.subtasks.length}
                </span>
              )}
            </div>
            {[...entry.tags, ...entry.contexts].length > 0 && (
              <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:4 }}>
                {[...entry.tags, ...entry.contexts].map(t => (
                  <span key={t} style={{ fontSize:9, color: (TM as any).thought.color, background:`${(TM as any).thought.color}28`, padding:"1px 5px", borderRadius:3, fontWeight:600 }}>{t}</span>
                ))}
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:10, color: C.dim }}>{fmt(entry.timestamp, true)}</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background:"none", border:"none", cursor:"pointer", color: C.border, padding:0, fontSize:11, opacity:.4 }}>✕</button>
            <span style={{ fontSize:10, color: isDashExp ? C.accent : C.border }}>{isDashExp ? "▾" : "▸"}</span>
          </div>
        </div>
      </div>

      {isDashExp && (
        <div onClick={e => e.stopPropagation()} style={{ padding:"10px 11px", background: C.bg, borderRadius:"0 0 8px 8px", border:`1px solid ${C.accent}55`, borderTop:`1px solid ${C.border}` }}>

          {entry.type === "task" && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, fontWeight:700, color: C.dim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Sub-tasks</div>
              {entry.subtasks.length === 0 && <div style={{ fontSize:11, color: C.border, fontStyle:"italic", marginBottom:6 }}>None yet.</div>}
              {entry.subtasks.map((st: any) => (
                <div key={st.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <Tick checked={st.done} onChange={() => onSubtaskToggle(st.id)} size={14} />
                  <span style={{ flex:1, fontSize:11, color: st.done ? C.dim : C.text, textDecoration: st.done ? "line-through" : "none" }}>{renderMd(st.text, searchQuery)}</span>
                  <button onClick={() => onSubtaskDelete(st.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:"#ef4444", padding:"1px 2px", opacity:.55 }}>✕</button>
                </div>
              ))}
              <div style={{ display:"flex", gap:5, marginTop:4 }}>
                <input value={stInputs[entry.id]||""} onChange={e => onSubtaskInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") onSubtaskAdd(); }} placeholder="Add sub-task…" style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:5, padding:"4px 7px", fontSize:11, color:C.text, fontFamily:"inherit", outline:"none" }} />
                <button onClick={onSubtaskAdd} style={{ background:C.accent, border:"none", color:"#fff", cursor:"pointer", padding:"4px 9px", borderRadius:5, fontSize:12, fontFamily:"inherit" }}>+</button>
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize:9, fontWeight:700, color: C.dim, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
              💬 Comments {commentCount > 0 && <span style={{ color:C.accent, fontWeight:400 }}>· {commentCount}</span>}
            </div>
            {(entry.comments||[]).map((comment: any) => (
              <div key={comment.id} style={{ marginBottom:6, padding:"5px 8px", background:C.surface, borderRadius:5, border:`1px solid ${C.border}` }}>
                {editingComment && editingComment.commentId === comment.id ? (
                  <div>
                    <textarea value={editCommentText} onChange={e => onCommentEditChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentEditSave(); } if (e.key === "Escape") onCommentEditCancel(); }} rows={2} autoFocus style={{ width:"100%", resize:"none", background:C.input, border:`1px solid ${C.accent}55`, borderRadius:4, padding:"3px 6px", fontSize:11, fontFamily:"inherit", color:C.text, outline:"none", boxSizing:"border-box" }} />
                    <div style={{ display:"flex", gap:4, marginTop:3 }}>
                      <button onClick={onCommentEditSave} style={{ fontSize:10, background:C.accent, border:"none", color:"#fff", cursor:"pointer", padding:"2px 8px", borderRadius:3, fontFamily:"inherit" }}>Save</button>
                      <button onClick={onCommentEditCancel} style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`, color:C.dim, cursor:"pointer", padding:"2px 8px", borderRadius:3, fontFamily:"inherit" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:5 }}>
                    <div style={{ flex:1 }}>
                      <p onDoubleClick={() => onCommentEditStart(comment.id, comment.text)} title="Double-click to edit" style={{ margin:"0 0 2px", fontSize:11, color:C.text, lineHeight:1.45, wordBreak:"break-word", cursor:"default" }}>{renderMd(comment.text, searchQuery)}</p>
                      <span style={{ fontSize:9, color:C.border }}>{fmt(comment.createdAt)}</span>
                    </div>
                    <button onClick={() => onCommentDelete(comment.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, color:"#ef4444", padding:"1px 2px", opacity:.55, flexShrink:0 }}>✕</button>
                  </div>
                )}
              </div>
            ))}
            <div style={{ display:"flex", gap:5, marginTop:4 }}>
              <textarea value={commentInputs[entry.id]||""} onChange={e => onCommentInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentAdd(); } }} placeholder="Add a comment…" rows={2} style={{ flex:1, resize:"none", background:C.surface, border:`1px solid ${C.border}`, borderRadius:5, padding:"4px 7px", fontSize:11, fontFamily:"inherit", color:C.text, outline:"none", lineHeight:1.45, boxSizing:"border-box" }} onFocus={e => e.target.style.borderColor=`${C.accent}66`} onBlur={e => e.target.style.borderColor=C.border} />
              <button onClick={onCommentAdd} disabled={!(commentInputs[entry.id]||"").trim()} style={{ padding:"0 9px", borderRadius:5, border:"none", background:(commentInputs[entry.id]||"").trim() ? C.accent : C.border, color:"#fff", cursor:(commentInputs[entry.id]||"").trim() ? "pointer" : "default", fontSize:12, alignSelf:"stretch", transition:"background .15s" }}>↑</button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
