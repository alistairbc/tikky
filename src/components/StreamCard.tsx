import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { TM, PM } from "../constants";
import { fmt, tagColor, renderMd } from "../utils/format";
import { relDueLabel, isOverdue } from "../utils/nlp";
import { Tick } from "./Tick";
import { TypeBadge } from "./TypeBadge";
import { Entry } from "../types";

/* ── date-picker helpers ────────────────────────────────────────── */
function toISO(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getDueDateShortcuts() {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dToFri = (5 - today.getDay() + 7) % 7 || 7;
  const dToMon = (1 - today.getDay() + 7) % 7 || 7;
  return [
    { label: "Today",     value: toISO(today) },
    { label: "Tomorrow",  value: toISO(addDays(today, 1)) },
    { label: "Friday",    value: toISO(addDays(today, dToFri)) },
    { label: "Next Mon",  value: toISO(addDays(today, dToMon)) },
    { label: "In 2 wks", value: toISO(addDays(today, 14)) },
  ];
}

/* ── body renderer — handles - bullets and line breaks ─────────── */
function BodyText({ text, C }: { text: string; C: any }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const isBullet = /^[-*•]\s/.test(line);
        return isBullet ? (
          <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginTop: i > 0 ? 3 : 0 }}>
            <span style={{ color: C.accent, flexShrink:0, marginTop:1, fontSize:11 }}>•</span>
            <span>{renderMd(line.slice(2), "")}</span>
          </div>
        ) : (
          <p key={i} style={{ margin: i > 0 ? "4px 0 0" : 0, lineHeight:1.5 }}>
            {line ? renderMd(line, "") : <span> </span>}
          </p>
        );
      })}
    </>
  );
}

export function StreamCard({
  entry, rowIdx, totalRows, isMobile, C,
  compact, manualMode,
  isExpanded, isEditing, editText, editRef,
  editingDueDate, dueDateInput,
  commentInputs, editingComment, editCommentText,
  stInputs, filterTag,
  selectMode, isSelected, onToggleSelect, onDuplicate,
  onExpand, onCycleType, onDelete, onToggleDone, onPin, onPriority,
  onEditStart, onEditChange, onEditSave, onEditCancel,
  onDueDateEdit, onDueDateChange, onDueDateSave, onDueDateCancel, onDueDateQuickSet,
  onCommentInput, onCommentAdd,
  onCommentEditStart, onCommentEditChange, onCommentEditSave, onCommentEditCancel,
  onCommentDelete,
  onSubtaskInput, onSubtaskAdd, onSubtaskToggle, onSubtaskDelete,
  onAddPhoto, onTagClick, onImgDelete, onEmojiChange,
  onHandleDragStart, onHandleDragEnd,
  editingBodyId, bodyInput,
  onBodyEdit, onBodyChange, onBodySave, onBodyCancel,
  onAiTitle, aiTitling,
  searchQuery,
  showRestore,
}: any) {
  const meta = (TM as any)[entry.type];
  const overdueEntry = isOverdue(entry);
  const priorities: Array<"low"|"medium"|"high"> = ["low","medium","high"];
  const cyclePriority = () => {
    const next = priorities[(priorities.indexOf(entry.priority) + 1) % 3];
    onPriority(next);
  };

  return (
    <div style={{ display:"flex", gap: isMobile ? 0 : 10, marginBottom: isMobile ? 8 : compact ? 5 : 10 }}>

      {!isMobile && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0 }}>
          {selectMode ? (
            <button onClick={e => { e.stopPropagation(); onToggleSelect && onToggleSelect(); }}
              style={{ width:16, height:16, borderRadius:4,
                       border:`2px solid ${isSelected ? C.accent : C.dimmer}`,
                       background: isSelected ? C.accent : "transparent",
                       cursor:"pointer", marginTop:6, flexShrink:0,
                       display:"flex", alignItems:"center", justifyContent:"center",
                       padding:0, transition:"all .12s" }}>
              {isSelected && <span style={{ color:"#fff", fontSize:10, lineHeight:1, fontWeight:700 }}>✓</span>}
            </button>
          ) : (
            <div style={{ width:8, height:8, borderRadius:"50%", background: meta.color,
                          flexShrink:0, marginTop:8, boxShadow:`0 0 6px ${meta.color}66` }} />
          )}
          {rowIdx < totalRows - 1 && <div style={{ width:1, flex:1, background: C.border, marginTop:3 }} />}
        </div>
      )}

      <div style={{ flex:1, borderRadius:16, minWidth:0 }}>
        {isMobile && (
          <div style={{ position:"absolute", right:0, top:0, bottom:0, width:76, background:"#ef4444",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:22, color:"#fff" }}>🗑</span>
          </div>
        )}
        {isMobile && (entry.type === "task" || entry.type === "event") && (
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:76,
                        background: entry.done ? "#6366f1" : "#10b981",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:22, color:"#fff" }}>{entry.done ? "↩" : "✓"}</span>
          </div>
        )}

        {showRestore && entry.done && (
          <div onClick={e => e.stopPropagation()} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, padding:"6px 10px", background:"#64748b18", borderRadius:8, border:"1px solid #64748b33" }}>
            <span style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>✓ Completed</span>
            <button onClick={onToggleDone} style={{ fontSize:11, background:"#6366f1", color:"#fff", border:"none", borderRadius:6, padding:"3px 10px", cursor:"pointer", fontWeight:600 }}>Restore</button>
          </div>
        )}
        <motion.div
          initial={entry.isNew ? { opacity: 0, y: 16, scale: 0.97 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={e => {
            if ((e.currentTarget as any)._wasSwiped) { (e.currentTarget as any)._wasSwiped = false; return; }
            if (selectMode) { onToggleSelect && onToggleSelect(); return; }
            onExpand();
          }}
          onTouchStart={e => {
            if (!isMobile) return;
            (e.currentTarget as any)._swipeStartX = e.touches[0].clientX;
            (e.currentTarget as any)._swipeStartY = e.touches[0].clientY;
            (e.currentTarget as any)._swipeDx     = 0;
            (e.currentTarget as any)._swipeDy     = 0;
            (e.currentTarget as any)._wasSwiped   = false;
            (e.currentTarget as any)._swipeLocked = false;
          }}
          onTouchMove={e => {
            if (!isMobile || (e.currentTarget as any)._swipeStartX === undefined) return;
            const dx = e.touches[0].clientX - (e.currentTarget as any)._swipeStartX;
            const dy = e.touches[0].clientY - (e.currentTarget as any)._swipeStartY;
            if (!(e.currentTarget as any)._swipeLocked) {
              if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
                (e.currentTarget as any)._swipeStartX = undefined; return;
              }
              if (Math.abs(dx) > 10) (e.currentTarget as any)._swipeLocked = true;
            }
            if ((e.currentTarget as any)._swipeLocked) {
              (e.currentTarget as any)._swipeDx = dx;
              e.currentTarget.style.transform  = `translateX(${Math.max(-82, Math.min(82, dx))}px)`;
              e.currentTarget.style.transition = "none";
              if (Math.abs(dx) > 15) (e.currentTarget as any)._wasSwiped = true;
            }
          }}
          onTouchEnd={e => {
            if (!isMobile) return;
            const dx = (e.currentTarget as any)._swipeDx || 0;
            e.currentTarget.style.transition = "transform .22s cubic-bezier(0.2, 0, 0, 1)";
            e.currentTarget.style.transform  = "translateX(0)";
            (e.currentTarget as any)._swipeDx = 0;
            (e.currentTarget as any)._swipeStartX = undefined;
            if      (dx < -72) setTimeout(() => onDelete(), 170);
            else if (dx >  72) onToggleDone();
          }}
          style={{
            background: overdueEntry ? "#ef444408" : entry.pinned ? `${C.accent}08` : C.surface,
            borderRadius: 16,
            padding: isMobile ? "12px" : compact ? "6px 10px" : "12px",
            border: entry.isNew
              ? `1.5px solid ${C.accent}`
              : `1px solid ${isSelected ? C.accent+"88" : isExpanded ? C.accent+"44" : overdueEntry ? "#ef444455" : entry.done ? C.bg : C.border}`,
            boxShadow: entry.isNew ? `0 0 12px ${C.accent}33` : isSelected ? `0 0 0 2px ${C.accent}22` : "none",
            opacity: entry.done ? 0.55 : 1,
            cursor: "pointer",
            transition: "border-color .2s, box-shadow .2s, opacity .2s",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display:"flex", gap: isMobile ? 16 : 10 }}>
            {isMobile && (
              <div style={{ width:40, height:40, borderRadius:10, background:`${meta.color}15`,
                            border:`1px solid ${meta.color}33`, display:"flex",
                            alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                {entry.emoji || (entry.type === "task" ? "⚡" : entry.type === "event" ? "📅" : entry.type === "note" ? "📝" : "💡")}
              </div>
            )}

            <div style={{ flex:1, minWidth:0 }}>
              {/* Title row */}
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom: compact ? 3 : 4, flexWrap:"wrap" }}>
                {!isMobile && (
                  <span title="Drag to reorder" draggable
                    onDragStart={e => { e.stopPropagation(); onHandleDragStart && onHandleDragStart(e); }}
                    onDragEnd={e => { e.stopPropagation(); onHandleDragEnd && onHandleDragEnd(e); }}
                    style={{ fontSize:13, color: manualMode ? C.dim : C.dimmer, cursor:"grab",
                             flexShrink:0, lineHeight:1, userSelect:"none", marginRight:1,
                             opacity: manualMode ? 1 : 0.45, touchAction:"none" }}>
                    ⠿
                  </span>
                )}
                {entry.pinned && <span style={{ fontSize:10, color:"#f59e0b", lineHeight:1, flexShrink:0 }}>📌</span>}
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  {isEditing ? (
                    <textarea ref={editRef} value={editText} autoFocus rows={2}
                      onChange={e => onEditChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSave(); }
                        if (e.key === "Escape") onEditCancel();
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex:1, resize:"none", background: C.input,
                               border:`1px solid ${C.accent}66`, borderRadius:6,
                               padding:"4px 8px", fontSize: isMobile ? 15 : 13,
                               fontWeight:700, fontFamily:"inherit", color: C.text,
                               outline:"none", boxSizing:"border-box" as const }}
                    />
                  ) : (
                    <span onClick={e => { e.stopPropagation(); onEditStart(); }}
                      title="Click to edit"
                      style={{ fontSize: isMobile ? 15 : 13, fontWeight:700, color: C.text,
                               overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                               textDecoration: entry.done ? "line-through" : "none",
                               cursor:"text", flex:1 }}>
                      {entry.text}
                    </span>
                  )}
                  {!isMobile && entry.emoji && !isEditing && <span>{entry.emoji}</span>}
                </div>
                {isEditing ? (
                  <div style={{ display:"flex", gap:4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={onEditSave}
                      style={{ fontSize:11, background: C.accent, border:"none", color:"#fff",
                               cursor:"pointer", padding:"3px 9px", borderRadius:5, fontFamily:"inherit" }}>
                      Save
                    </button>
                    <button onClick={onEditCancel}
                      style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                               color: C.dim, cursor:"pointer", padding:"3px 9px",
                               borderRadius:5, fontFamily:"inherit" }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={e => { e.stopPropagation(); onExpand(); }}
                    title={isExpanded ? "Collapse" : "Expand"}
                    style={{ fontSize:13, background:"none", border:"none", color: C.dim, cursor:"pointer",
                             padding:"2px 5px", borderRadius:4, lineHeight:1,
                             transform: isExpanded ? "rotate(180deg)" : "none",
                             transition:"transform .15s" }}>
                    ▾
                  </button>
                  <button onClick={e => { e.stopPropagation(); onDelete(); }}
                    style={{ background:"none", border:"none", color: C.dim,
                             fontSize:14, cursor:"pointer", opacity:0.4 }}>
                    ⋮
                  </button>
                )}
              </div>

              {/* Body preview (collapsed) */}
              {!isEditing && entry.body && (
                <div onClick={e => { e.stopPropagation(); onBodyEdit(); }}
                  title="Click to edit body"
                  style={{ margin:"0 0 6px", fontSize:11, color: C.muted, lineHeight:1.5,
                           cursor:"text", display:"-webkit-box" as any,
                           WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any,
                           overflow:"hidden" }}>
                  <BodyText text={entry.body} C={C} />
                </div>
              )}

              {/* Priority · due date row */}
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span onClick={e => { e.stopPropagation(); cyclePriority(); }}
                  title="Click to cycle priority"
                  style={{ fontSize:10, fontWeight:800,
                           color: (PM as any)[entry.priority].color,
                           background:`${(PM as any)[entry.priority].color}15`,
                           padding:"2px 7px", borderRadius:4, cursor:"pointer",
                           userSelect:"none" as const, transition:"all .12s" }}>
                  {(PM as any)[entry.priority].label.toUpperCase()}
                </span>

                {onCycleType && (
                  <TypeBadge type={entry.type} onClick={onCycleType} />
                )}

                {entry.dueDate && editingDueDate !== entry.id && (
                  <span onClick={e => { e.stopPropagation(); onDueDateEdit(); }}
                    title="Click to change date"
                    style={{ fontSize:11, color: overdueEntry ? "#ef4444" : C.dim,
                             display:"flex", alignItems:"center", gap:3, cursor:"pointer" }}>
                    <span>{overdueEntry ? "⚠️" : "📅"}</span>
                    {relDueLabel(entry.dueDate, entry.timestamp)}
                  </span>
                )}
                {!entry.dueDate && editingDueDate !== entry.id && (
                  <button onClick={e => { e.stopPropagation(); onDueDateEdit(); }}
                    style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`,
                             color: C.dimmer, cursor:"pointer", padding:"1px 6px",
                             borderRadius:4, fontFamily:"inherit" }}>
                    + date
                  </button>
                )}
              </div>

              {/* Inline date picker — appears below priority row, no overflow clipping */}
              {editingDueDate === entry.id && (
                <div onClick={e => e.stopPropagation()}
                  style={{ marginTop:8, padding:"10px 12px", background: C.bg,
                           border:`1px solid ${C.accent}44`, borderRadius:10 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                    {getDueDateShortcuts().map(s => (
                      <button key={s.label} onClick={() => { onDueDateQuickSet ? onDueDateQuickSet(s.value) : (onDueDateChange(s.value), onDueDateSave()); }}
                        style={{ fontSize:11, padding:"3px 9px", borderRadius:6,
                                 background:`${C.accent}18`, border:`1px solid ${C.accent}44`,
                                 color: C.accent, cursor:"pointer", fontFamily:"inherit" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <input type="date"
                    onChange={e => { if (e.target.value) { onDueDateQuickSet ? onDueDateQuickSet(e.target.value) : (onDueDateChange(e.target.value), onDueDateSave()); } }}
                    style={{ width:"100%", background: C.input, border:`1px solid ${C.border}`,
                             borderRadius:6, padding:"5px 8px", fontSize:11, color: C.text,
                             fontFamily:"inherit", outline:"none", boxSizing:"border-box" as const,
                             marginBottom:6 }}
                  />
                  <div style={{ display:"flex", gap:6 }}>
                    {entry.dueDate && (
                      <button onClick={() => { onDueDateQuickSet ? onDueDateQuickSet('') : (onDueDateChange(null), onDueDateSave()); }}
                        style={{ flex:1, fontSize:11, padding:"4px", background:"none",
                                 border:`1px solid ${C.border}`, color:"#ef4444",
                                 borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>
                        Clear
                      </button>
                    )}
                    <button onClick={onDueDateCancel}
                      style={{ flex:1, fontSize:11, padding:"4px", background:"none",
                               border:`1px solid ${C.border}`, color: C.dim,
                               borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Image thumbnails (desktop collapsed) */}
              {!isMobile && !isEditing && (entry.images||[]).length > 0 && (
                <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                  {(entry.images as string[]).slice(0,4).map((src, i) => (
                    <img key={i} src={src} alt=""
                      style={{ width:40, height:40, objectFit:"cover", borderRadius:6,
                               border:`1px solid ${C.border}`, display:"block" }} />
                  ))}
                  {(entry.images||[]).length > 4 && (
                    <div style={{ width:40, height:40, borderRadius:6, background: C.bg,
                                  border:`1px solid ${C.border}`, display:"flex",
                                  alignItems:"center", justifyContent:"center",
                                  fontSize:10, color: C.dim }}>
                      +{(entry.images||[]).length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile: image hero */}
              {isMobile && (entry.images||[]).length > 0 && (
                <div style={{ borderRadius:10, overflow:"hidden", marginTop:8, marginBottom:4,
                              border:`1px solid ${C.border}` }}>
                  <img src={(entry.images as string[])[0]} alt=""
                    style={{ width:"100%", height:120, objectFit:"cover" }} />
                </div>
              )}

              {/* Mobile: subtask progress */}
              {isMobile && entry.subtasks.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:10, fontWeight:800, color: C.dim,
                                   textTransform:"uppercase", letterSpacing:"0.05em" }}>Subtasks</span>
                    <span style={{ fontSize:10, fontWeight:700, color: C.dim }}>
                      {entry.subtasks.filter((s:any)=>s.done).length} / {entry.subtasks.length}
                    </span>
                  </div>
                  <div style={{ height:6, background: C.bg, borderRadius:3, overflow:"hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width:`${(entry.subtasks.filter((s:any)=>s.done).length / entry.subtasks.length)*100}%` }}
                      style={{ height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.accent}dd)` }}
                    />
                  </div>
                </div>
              )}

              {/* Mobile: tags */}
              {isMobile && (entry.tags.length > 0 || entry.contexts.length > 0) && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
                  {[...entry.tags, ...entry.contexts].map(t => (
                    <span key={t} style={{ fontSize:11, fontWeight:600, color: C.accent,
                                          background:`${C.accent}15`, padding:"3px 10px", borderRadius:8 }}>
                      {t.startsWith("#") || t.startsWith("@") ? t : `#${t}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expanded section */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", gap:6, marginBottom:12 }}>
                    <button onClick={onAiTitle} disabled={aiTitling}
                      title="Let AI split into title + body"
                      style={{ fontSize:11, background:`${C.accent}18`, border:`1px solid ${C.accent}44`,
                               color: C.accent, cursor: aiTitling ? "wait" : "pointer",
                               padding:"3px 10px", borderRadius:6, fontFamily:"inherit",
                               display:"flex", alignItems:"center", gap:5 }}>
                      ✨ {aiTitling ? "Thinking…" : "AI Title"}
                    </button>
                    {!entry.body && editingBodyId !== entry.id && (
                      <button onClick={onBodyEdit}
                        style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                                 color: C.dim, cursor:"pointer", padding:"3px 10px",
                                 borderRadius:6, fontFamily:"inherit" }}>
                        + Add body
                      </button>
                    )}
                  </div>

                  {/* Body edit area */}
                  {(entry.body || editingBodyId === entry.id) && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                    textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
                        Note body
                      </div>
                      {editingBodyId === entry.id ? (
                        <div>
                          <textarea autoFocus rows={4} value={bodyInput}
                            onChange={e => onBodyChange(e.target.value)}
                            onKeyDown={e => { if (e.key === "Escape") onBodyCancel(); }}
                            placeholder="Add detail, context, links… (- for bullets)"
                            style={{ width:"100%", resize:"vertical", background: C.input,
                                     border:`1px solid ${C.accent}55`, borderRadius:8,
                                     padding:"8px 10px", fontSize:12, fontFamily:"inherit",
                                     color: C.text, outline:"none", lineHeight:1.6,
                                     boxSizing:"border-box" as const }}
                          />
                          <div style={{ display:"flex", gap:6, marginTop:6 }}>
                            <button onClick={onBodySave}
                              style={{ fontSize:11, background: C.accent, border:"none",
                                       color:"#fff", cursor:"pointer", padding:"4px 12px",
                                       borderRadius:6, fontFamily:"inherit" }}>
                              Save
                            </button>
                            <button onClick={onBodyCancel}
                              style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                                       color: C.dim, cursor:"pointer", padding:"4px 12px",
                                       borderRadius:6, fontFamily:"inherit" }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={onBodyEdit} title="Click to edit"
                          style={{ fontSize:12, color: C.text, lineHeight:1.6, cursor:"text",
                                   padding:"8px 10px", background: C.bg, borderRadius:8,
                                   border:`1px solid ${C.border}` }}>
                          <BodyText text={entry.body} C={C} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subtasks */}
                  {entry.type === "task" && (
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                    textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7 }}>
                        Sub-tasks
                      </div>
                      {entry.subtasks.length === 0 && (
                        <div style={{ fontSize:11, color: C.dimmer, marginBottom:8, fontStyle:"italic" }}>
                          No sub-tasks yet.
                        </div>
                      )}
                      {entry.subtasks.map((st: any) => (
                        <div key={st.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                          <Tick checked={st.done} onChange={() => onSubtaskToggle(st.id)} size={15} />
                          <span style={{ flex:1, fontSize:12, color: st.done ? C.dim : C.text,
                                         textDecoration: st.done ? "line-through" : "none" }}>
                            {renderMd(st.text, searchQuery)}
                          </span>
                          <button onClick={() => onSubtaskDelete(st.id)}
                            style={{ background:"none", border:"none", cursor:"pointer",
                                     fontSize:12, color:"#ef4444", padding:"1px 4px", opacity:.6 }}>
                            ✕
                          </button>
                        </div>
                      ))}
                      <div style={{ display:"flex", gap:6, marginTop:6 }}>
                        <input value={stInputs[entry.id] || ""}
                          onChange={e => onSubtaskInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") onSubtaskAdd(); }}
                          placeholder="Add sub-task…"
                          style={{ flex:1, background: C.input, border:`1px solid ${C.border}`,
                                   borderRadius:6, padding:"5px 9px", fontSize:12,
                                   color: C.text, fontFamily:"inherit", outline:"none" }}
                        />
                        <button onClick={onSubtaskAdd}
                          style={{ background: C.accent, border:"none", color:"#fff",
                                   cursor:"pointer", padding:"5px 11px", borderRadius:6,
                                   fontSize:13, fontFamily:"inherit" }}>+</button>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                      💬 Comments {(entry.comments||[]).length > 0 && (
                        <span style={{ color: C.accent, fontWeight:400 }}>
                          · {(entry.comments||[]).length}
                        </span>
                      )}
                    </div>
                    {(entry.comments||[]).map((comment: any) => (
                      <div key={comment.id}
                        style={{ marginBottom:8, padding:"7px 10px", background: C.bg,
                                 borderRadius:7, border:`1px solid ${C.border}` }}>
                        {editingComment && editingComment.commentId === comment.id ? (
                          <div>
                            <textarea value={editCommentText}
                              onChange={e => onCommentEditChange(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentEditSave(); }
                                if (e.key === "Escape") onCommentEditCancel();
                              }}
                              rows={2} autoFocus
                              style={{ width:"100%", resize:"none", background: C.input,
                                       border:`1px solid ${C.accent}55`, borderRadius:5,
                                       padding:"5px 8px", fontSize:12, fontFamily:"inherit",
                                       color: C.text, outline:"none", boxSizing:"border-box" as const }}
                            />
                            <div style={{ display:"flex", gap:5, marginTop:5 }}>
                              <button onClick={onCommentEditSave}
                                style={{ fontSize:11, background: C.accent, border:"none",
                                         color:"#fff", cursor:"pointer", padding:"2px 9px",
                                         borderRadius:4, fontFamily:"inherit" }}>Save</button>
                              <button onClick={onCommentEditCancel}
                                style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                                         color: C.dim, cursor:"pointer", padding:"2px 9px",
                                         borderRadius:4, fontFamily:"inherit" }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display:"flex", alignItems:"flex-start", gap:7 }}>
                            <div style={{ flex:1 }}>
                              <p onDoubleClick={() => onCommentEditStart(comment.id, comment.text)}
                                title="Double-click to edit"
                                style={{ margin:"0 0 4px", fontSize:12, color: C.text,
                                         lineHeight:1.5, wordBreak:"break-word", cursor:"default" }}>
                                {renderMd(comment.text, searchQuery)}
                              </p>
                              <span style={{ fontSize:10, color: C.dimmer }}>{fmt(comment.createdAt)}</span>
                            </div>
                            <button onClick={() => onCommentDelete(comment.id)}
                              style={{ background:"none", border:"none", cursor:"pointer",
                                       fontSize:11, color:"#ef4444", padding:"1px 3px",
                                       opacity:.5, flexShrink:0 }}>
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <textarea value={commentInputs[entry.id] || ""}
                        onChange={e => onCommentInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentAdd(); } }}
                        placeholder="Add a comment… (Enter to submit)"
                        rows={2}
                        style={{ flex:1, resize:"none", background: C.input,
                                 border:`1px solid ${C.border}`, borderRadius:7,
                                 padding:"6px 9px", fontSize:12, fontFamily:"inherit",
                                 color: C.text, outline:"none", lineHeight:1.5,
                                 boxSizing:"border-box" as const, transition:"border-color .15s" }}
                        onFocus={e => e.target.style.borderColor=`${C.accent}66`}
                        onBlur={e => e.target.style.borderColor=C.border}
                      />
                      <button onClick={onCommentAdd}
                        disabled={!(commentInputs[entry.id]||"").trim()}
                        style={{ padding:"0 12px", borderRadius:7, border:"none",
                                 background:(commentInputs[entry.id]||"").trim() ? C.accent : C.dimmer,
                                 color:"#fff", cursor:(commentInputs[entry.id]||"").trim() ? "pointer" : "default",
                                 fontSize:13, alignSelf:"stretch", transition:"background .15s" }}>
                        ↑
                      </button>
                    </div>
                  </div>

                  {/* Emoji picker */}
                  <div style={{ marginTop:14, marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:10, fontWeight:700, color: C.dim,
                                     textTransform:"uppercase", letterSpacing:"0.08em", flexShrink:0 }}>
                        Emoji
                      </span>
                      <input maxLength={4} value={entry.emoji || ""}
                        onChange={e => onEmojiChange(e.target.value.trim())}
                        placeholder="Emoji…"
                        style={{ width:60, background: C.input, border:`1px solid ${C.border}`,
                                 borderRadius:6, padding:"4px 9px", fontSize:12,
                                 color: C.text, fontFamily:"inherit", outline:"none" }}
                        onClick={e => e.stopPropagation()}
                      />
                      {entry.emoji && (
                        <button onClick={e => { e.stopPropagation(); onEmojiChange(""); }}
                          style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                                   color: C.dim, cursor:"pointer", padding:"4px 9px",
                                   borderRadius:6, fontFamily:"inherit", flexShrink:0 }}>
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {["✅","📝","🚀","💡","📅","🔥","⭐","📌","🛒","✈️","🍔","🏋","🎨","🎵","💬","❤️"].map(emo => (
                        <button key={emo} onClick={e => { e.stopPropagation(); onEmojiChange(emo); }}
                          style={{ fontSize:16, background: entry.emoji === emo ? `${C.accent}22` : "none",
                                   border: entry.emoji === emo ? `1px solid ${C.accent}55` : `1px solid ${C.border}`,
                                   borderRadius:6, width:32, height:32, cursor:"pointer",
                                   display:"flex", alignItems:"center", justifyContent:"center",
                                   transition:"all .1s" }}>
                          {emo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                  textTransform:"uppercase", letterSpacing:"0.08em",
                                  marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                      📷 Photos
                      {(entry.images||[]).length > 0 && (
                        <span style={{ color: C.accent, fontWeight:400, textTransform:"none", letterSpacing:0 }}>
                          · {(entry.images||[]).length}
                        </span>
                      )}
                      <button onClick={onAddPhoto}
                        style={{ fontSize:10, color: C.accent, background:"none",
                                 border:`1px solid ${C.accent}44`, borderRadius:4,
                                 padding:"1px 7px", cursor:"pointer", fontFamily:"inherit",
                                 fontWeight:400, textTransform:"none", letterSpacing:0, marginLeft:"auto" }}>
                        + Add
                      </button>
                    </div>
                    {(entry.images||[]).length === 0 && (
                      <div style={{ fontSize:11, color: C.dimmer, fontStyle:"italic", marginBottom:4 }}>
                        No photos attached.
                      </div>
                    )}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {(entry.images||[]).map((src: string, idx: number) => {
                        const imgW = isMobile ? 90 : 110;
                        return (
                          <div key={idx} style={{ position:"relative" }}>
                            <img src={src} alt=""
                              style={{ width:imgW, height:imgW, objectFit:"cover",
                                       borderRadius:9, border:`1px solid ${C.border}`, display:"block" }} />
                            <button onClick={e => { e.stopPropagation(); onImgDelete(idx); }}
                              style={{ position:"absolute", top:-6, right:-6, width:19, height:19,
                                       borderRadius:"50%", background:"#ef4444", border:"none",
                                       color:"#fff", fontSize:11, cursor:"pointer",
                                       display:"flex", alignItems:"center", justifyContent:"center",
                                       lineHeight:1, padding:0 }}>
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Expanded footer */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                marginTop:16, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                    <button onClick={e => { e.stopPropagation(); onDuplicate && onDuplicate(); }}
                      style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                               color: C.dim, cursor:"pointer", padding:"5px 14px",
                               borderRadius:7, fontFamily:"inherit", display:"flex",
                               alignItems:"center", gap:5 }}>
                      {"\u21B2"} Duplicate
                    </button>
                    <button onClick={onExpand}
                      style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                               color: C.dim, cursor:"pointer", padding:"5px 20px",
                               borderRadius:7, fontFamily:"inherit" }}>
                      {"\u2191"} Close panel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}


