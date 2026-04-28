import React from 'react';
import { TM, PM } from "../constants";
import { fmt, renderMd } from "../utils/format";
import { relDueLabel, isOverdue } from "../utils/nlp";
import { Tick } from "./Tick";

/* Fixed: use local date parts, not toISOString() which returns UTC (Bug #4) */
function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getDueDateShortcuts() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dToFri = (5 - today.getDay() + 7) % 7 || 7;
  return [
    { label: "Today",     value: toISO(today) },
    { label: "Tomorrow",  value: toISO(addDays(today, 1)) },
    { label: "Friday",    value: toISO(addDays(today, dToFri)) },
    { label: "Next week", value: toISO(addDays(today, 7)) },
  ];
}

export function DashboardCard({
  entry, C,
  isDashExp, editingDueDate, dueDateInput,
  commentInputs, editingComment, editCommentText, stInputs,
  onExpand, onToggleDone, onDelete, onPriority,
  onDueDateEdit, onDueDateChange, onDueDateSave, onDueDateCancel, onDueDateQuickSet,
  onCommentInput, onCommentAdd,
  onCommentEditStart, onCommentEditChange, onCommentEditSave, onCommentEditCancel,
  onCommentDelete,
  onSubtaskInput, onSubtaskAdd, onSubtaskToggle, onSubtaskDelete,
  searchQuery,
}: any) {
  const meta = (TM as any)[entry.type];
  const commentCount = (entry.comments||[]).length;
  const overdueEntry = isOverdue(entry);

  return (
    <div style={{ marginBottom: 7 }}>
      {/* Card header row */}
      <div
        onClick={onExpand}
        style={{
          padding: "9px 10px",
          background: entry.done ? C.bg : C.surface,
          borderRadius: isDashExp ? "8px 8px 0 0" : 8,   /* --r-6: dashboard card */
          border: `1px solid ${isDashExp ? C.accent+"55" : C.border}`,
          boxShadow: entry.done ? "none" : overdueEntry
            ? "inset 3px 0 0 #ef4444"
            : `inset 3px 0 0 ${meta.color}`,
          opacity: entry.done ? 0.45 : 1,
          transition: "all .2s",
          cursor: "pointer",
        }}
      >
        <div style={{ display:"flex", alignItems:"flex-start", gap: 7 }}>
          {entry.type === "task"
            ? <div onClick={e => e.stopPropagation()}><Tick checked={entry.done} onChange={onToggleDone} /></div>
            : <div style={{ width:6, height:6, borderRadius:"50%", background: meta.color,
                            flexShrink:0, marginTop:5, boxShadow:`0 0 4px ${meta.color}66` }} />
          }
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:"0 0 3px", fontSize:12, color: C.text, lineHeight:1.5,
                        textDecoration: entry.done ? "line-through" : "none", wordBreak:"break-word" }}>
              {entry.emoji && <span style={{ marginRight: 4 }}>{entry.emoji}</span>}
              {renderMd(entry.text, searchQuery)}
            </p>

            {/* Priority · due date row */}
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:4, alignItems:"center" }}>
              {entry.type === "task" && !entry.done && (
                <div style={{ display:"flex", gap:3 }}>
                  {["high","medium","low"].map(p => (
                    <button key={p}
                      onClick={e => { e.stopPropagation(); onPriority(p); }}
                      title={`Set priority: ${(PM as any)[p].label}`}
                      style={{
                        fontSize: 10, padding:"2px 6px", borderRadius: 4,
                        border: entry.priority===p ? `1px solid ${(PM as any)[p].color}66` : `1px solid ${C.border}`,
                        cursor: "pointer", fontFamily:"inherit", fontWeight: 800,
                        letterSpacing: "0.04em",
                        background: entry.priority===p ? `${(PM as any)[p].color}28` : C.surface,
                        color: entry.priority===p ? (PM as any)[p].color : C.dim,
                        transition:"all .12s",
                      }}>
                      {(PM as any)[p].label[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Inline date picker (expanded absolute) */}
              {editingDueDate === entry.id && !entry.done ? (
                <div onClick={e => e.stopPropagation()} style={{ position:"relative" }}>
                  <div style={{
                    position:"absolute", top:"100%", left:0, zIndex:300,
                    background: C.surface, border:`1px solid ${C.accent}55`,
                    borderRadius: 8, padding:"8px 10px", marginTop:3,
                    boxShadow: "0 8px 20px rgba(0,0,0,.35)", minWidth:180,
                  }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
                      {getDueDateShortcuts().map(s => (
                        <button key={s.label}
                          onClick={() => onDueDateQuickSet(s.value)}
                          style={{ fontSize:10, padding:"2px 7px", borderRadius:5,
                                   background:`${C.accent}18`, border:`1px solid ${C.accent}44`,
                                   color: C.accent, cursor:"pointer", fontFamily:"inherit" }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <input type="date"
                      onChange={e => { if (e.target.value) onDueDateQuickSet(e.target.value); }}
                      style={{ width:"100%", background: C.input, border:`1px solid ${C.border}`,
                               borderRadius:5, padding:"3px 6px", fontSize:10, color: C.text,
                               fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const }}
                    />
                    <button onClick={onDueDateCancel}
                      style={{ marginTop:4, width:"100%", fontSize:9, padding:"2px",
                               background:"none", border:"none", color: C.dim,
                               cursor:"pointer", fontFamily:"inherit" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : entry.dueDate && !entry.done ? (
                <span
                  onClick={e => { e.stopPropagation(); onDueDateEdit(); }}
                  title={`Due: ${entry.dueDate} — click to edit`}
                  style={{
                    fontSize: 10,
                    color: overdueEntry ? "#ef4444" : C.dim,
                    fontWeight: overdueEntry ? 700 : 400,
                    cursor:"pointer",
                  }}>
                  {relDueLabel(entry.dueDate, entry.timestamp)}
                </span>
              ) : !entry.done ? (
                <button
                  onClick={e => { e.stopPropagation(); onDueDateEdit(); }}
                  style={{ fontSize:9, color: C.dim, background:"none",
                           border:`1px solid ${C.border}`, cursor:"pointer",
                           padding:"1px 5px", borderRadius:3, fontFamily:"inherit" }}>
                  + due
                </button>
              ) : null}

              {commentCount > 0 && (
                <span style={{ fontSize:9, color: C.accent, background:`${C.accent}18`,
                               padding:"1px 5px", borderRadius:3, fontWeight:600 }}>
                  💬 {commentCount}
                </span>
              )}
              {entry.subtasks.length > 0 && (
                <span style={{ fontSize:9, color: C.muted, background:`${C.border}55`,
                               padding:"1px 5px", borderRadius:3, fontWeight:600 }}>
                  ☑ {entry.subtasks.filter((s: any) => s.done).length}/{entry.subtasks.length}
                </span>
              )}
            </div>

            {/* Tags */}
            {[...entry.tags, ...entry.contexts].length > 0 && (
              <div style={{ display:"flex", gap:3, flexWrap:"wrap", marginBottom:4 }}>
                {[...entry.tags, ...entry.contexts].map(t => {
                  const col = "#8b5cf6";   /* violet — thought color for tags */
                  return (
                    <span key={t} style={{ fontSize:9, color: col,
                                           background:`${col}28`, padding:"1px 5px",
                                           borderRadius:3, fontWeight:600 }}>
                      {t}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Image thumbnails */}
            {(entry.images||[]).length > 0 && (
              <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                {(entry.images as string[]).slice(0,3).map((src, i) => (
                  <img key={i} src={src} alt=""
                    style={{ width:32, height:32, objectFit:"cover", borderRadius:4,
                             border:`1px solid ${C.border}`, display:"block" }} />
                ))}
                {(entry.images||[]).length > 3 && (
                  <div style={{ width:32, height:32, borderRadius:4, background: C.bg,
                                border:`1px solid ${C.border}`, display:"flex",
                                alignItems:"center", justifyContent:"center",
                                fontSize:9, color: C.dim }}>
                    +{(entry.images||[]).length - 3}
                  </div>
                )}
              </div>
            )}

            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:9, color: C.dimmer }}>{fmt(entry.timestamp, true)}</span>
            </div>
          </div>

          {/* Right: delete + expand indicator */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ background:"none", border:"none", cursor:"pointer",
                       color: C.border, padding:0, fontSize:11, opacity:.4 }}>
              ✕
            </button>
            <span style={{ fontSize:10, color: isDashExp ? C.accent : C.dim }}>
              {isDashExp ? "▾" : "▸"}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {isDashExp && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ padding:"10px 11px", background: C.bg,
                   borderRadius:"0 0 8px 8px",
                   border:`1px solid ${C.accent}55`, borderTop:`1px solid ${C.border}` }}>

          {/* Sub-tasks */}
          {entry.type === "task" && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, fontWeight:700, color: C.dim,
                            textTransform:"uppercase" as const, letterSpacing:"0.08em", marginBottom:6 }}>
                Sub-tasks
              </div>
              {entry.subtasks.length === 0 && (
                <div style={{ fontSize:11, color: C.dimmer, fontStyle:"italic", marginBottom:6 }}>
                  None yet.
                </div>
              )}
              {entry.subtasks.map((st: any) => (
                <div key={st.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <Tick checked={st.done} onChange={() => onSubtaskToggle(st.id)} size={14} />
                  <span style={{ flex:1, fontSize:11, color: st.done ? C.dim : C.text,
                                 textDecoration: st.done ? "line-through" : "none" }}>
                    {renderMd(st.text, searchQuery)}
                  </span>
                  <button onClick={() => onSubtaskDelete(st.id)}
                    style={{ background:"none", border:"none", cursor:"pointer",
                             fontSize:10, color:"#ef4444", padding:"1px 2px", opacity:.55 }}>
                    ✕
                  </button>
                </div>
              ))}
              <div style={{ display:"flex", gap:5, marginTop:4 }}>
                <input
                  value={stInputs[entry.id]||""}
                  onChange={e => onSubtaskInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") onSubtaskAdd(); }}
                  placeholder="Add sub-task…"
                  style={{ flex:1, background: C.surface, border:`1px solid ${C.border}`,
                           borderRadius:5, padding:"4px 7px", fontSize:11,
                           color: C.text, fontFamily:"inherit", outline:"none" }}
                />
                <button onClick={onSubtaskAdd}
                  style={{ background: C.accent, border:"none", color:"#fff",
                           cursor:"pointer", padding:"4px 9px", borderRadius:5,
                           fontSize:12, fontFamily:"inherit" }}>
                  +
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <div style={{ fontSize:9, fontWeight:700, color: C.dim,
                          textTransform:"uppercase" as const, letterSpacing:"0.08em", marginBottom:6 }}>
              💬 Comments
              {commentCount > 0 && (
                <span style={{ color: C.accent, fontWeight:400 }}> · {commentCount}</span>
              )}
            </div>
            {(entry.comments||[]).map((comment: any) => (
              <div key={comment.id}
                style={{ marginBottom:6, padding:"5px 8px", background: C.surface,
                         borderRadius:5, border:`1px solid ${C.border}` }}>
                {editingComment && editingComment.commentId === comment.id ? (
                  <div>
                    <textarea
                      value={editCommentText}
                      onChange={e => onCommentEditChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentEditSave(); }
                        if (e.key === "Escape") onCommentEditCancel();
                      }}
                      rows={2} autoFocus
                      style={{ width:"100%", resize:"none", background: C.input,
                               border:`1px solid ${C.accent}55`, borderRadius:4,
                               padding:"3px 6px", fontSize:11, fontFamily:"inherit",
                               color: C.text, outline:"none", boxSizing:"border-box" as const }}
                    />
                    <div style={{ display:"flex", gap:4, marginTop:3 }}>
                      <button onClick={onCommentEditSave}
                        style={{ fontSize:10, background: C.accent, border:"none",
                                 color:"#fff", cursor:"pointer", padding:"2px 8px",
                                 borderRadius:3, fontFamily:"inherit" }}>
                        Save
                      </button>
                      <button onClick={onCommentEditCancel}
                        style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`,
                                 color: C.dim, cursor:"pointer", padding:"2px 8px",
                                 borderRadius:3, fontFamily:"inherit" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:5 }}>
                    <div style={{ flex:1 }}>
                      <p
                        onDoubleClick={() => onCommentEditStart(comment.id, comment.text)}
                        title="Double-click to edit"
                        style={{ margin:"0 0 2px", fontSize:11, color: C.text,
                                 lineHeight:1.45, wordBreak:"break-word", cursor:"default" }}>
                        {renderMd(comment.text, searchQuery)}
                      </p>
                      <span style={{ fontSize:9, color: C.dimmer }}>{fmt(comment.createdAt)}</span>
                    </div>
                    <button onClick={() => onCommentDelete(comment.id)}
                      style={{ background:"none", border:"none", cursor:"pointer",
                               fontSize:10, color:"#ef4444", padding:"1px 2px",
                               opacity:.55, flexShrink:0 }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Comment input */}
            <div style={{ display:"flex", gap:5, marginTop:4 }}>
              <textarea
                value={commentInputs[entry.id]||""}
                onChange={e => onCommentInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentAdd(); } }}
                placeholder="Add a comment…"
                rows={2}
                style={{ flex:1, resize:"none", background: C.surface,
                         border:`1px solid ${C.border}`, borderRadius:5,
                         padding:"4px 7px", fontSize:11, fontFamily:"inherit",
                         color: C.text, outline:"none", lineHeight:1.45,
                         boxSizing:"border-box" as const }}
                onFocus={e => e.target.style.borderColor=`${C.accent}66`}
                onBlur={e  => e.target.style.borderColor=C.border}
              />
              <button
                onClick={onCommentAdd}
                disabled={!(commentInputs[entry.id]||"").trim()}
                style={{ padding:"0 9px", borderRadius:5, border:"none",
                         background: (commentInputs[entry.id]||"").trim() ? C.accent : C.border,
                         color:"#fff",
                         cursor: (commentInputs[entry.id]||"").trim() ? "pointer" : "default",
                         fontSize:12, alignSelf:"stretch", transition:"background .15s" }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
