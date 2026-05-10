import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { TM, PM } from "../constants";
import { fmt, renderMd, formatTime } from "../utils/format";
import { relDueLabel, isOverdue } from "../utils/nlp";
import { Tick } from "./Tick";
import { TypeBadge } from "./TypeBadge";


/* Fixed: use local date parts, not toISOString() which returns UTC (Bug #4) */
function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
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

/* Body editor with formatting toolbar — needs local ref for cursor ops */
function BodyEditor({ bodyInput, onBodyChange, onBodyCancel, onBodySave, C }: { bodyInput: string; onBodyChange: (v: string) => void; onBodyCancel: () => void; onBodySave: () => void; C: any }) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const insert = (prefix: string, suffix = "") => {
    const ta = bodyRef.current;
    if (!ta) { onBodyChange(bodyInput + prefix + suffix); return; }
    const start = ta.selectionStart ?? bodyInput.length;
    const end   = ta.selectionEnd   ?? bodyInput.length;
    const selected = bodyInput.slice(start, end);
    const newVal = bodyInput.slice(0, start) + prefix + selected + suffix + bodyInput.slice(end);
    onBodyChange(newVal);
    setTimeout(() => {
      if (!bodyRef.current) return;
      bodyRef.current.focus();
      const pos = start + prefix.length + selected.length;
      bodyRef.current.setSelectionRange(pos, pos);
    }, 0);
  };
  const btn = (label: string, title: string, prefix: string, suffix = "") => (
    <button key={label} type="button"
      onMouseDown={e => { e.preventDefault(); insert(prefix, suffix); }}
      title={title}
      style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color: C.muted, cursor:"pointer", padding:"2px 8px", fontSize:11, fontWeight:700, fontFamily:"monospace", lineHeight:1.6, flexShrink:0 }}
    >{label}</button>
  );
  return (
    <div>
      <div style={{ display:"flex", gap:5, marginBottom:6, flexWrap:"wrap" }}>
        {btn("B","Bold","**","**")}
        {btn("I","Italic","_","_")}
        {btn("•","Bullet","\n- ")}
        {btn("☑","Checkbox","\n- [ ] ")}
        {btn("H","Heading","## ")}
      </div>
      <textarea autoFocus ref={bodyRef} rows={5} value={bodyInput}
        onChange={e => onBodyChange(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") onBodyCancel(); }}
        placeholder="Add detail, context, links… (- for bullets, - [ ] for checkboxes)"
        style={{ width:"100%", resize:"vertical", background: C.input,
                 border:`1px solid ${C.accent}55`, borderRadius:8,
                 padding:"8px 10px", fontSize:12, fontFamily:"inherit",
                 color: C.text, outline:"none", lineHeight:1.6,
                 boxSizing:"border-box" as const }}
      />
      <div style={{ display:"flex", gap:6, marginTop:6 }}>
        <button onClick={onBodySave}
          style={{ fontSize:11, background: C.accent, border:"none", color:"#fff", cursor:"pointer", padding:"4px 12px", borderRadius:6, fontFamily:"inherit", fontWeight:600 }}>
          Save
        </button>
        <button onClick={onBodyCancel}
          style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`, color: C.dim, cursor:"pointer", padding:"4px 12px", borderRadius:6, fontFamily:"inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* Markdown formatting toolbar for body notes */
function FormatToolbar({ bodyRef, value, onChange, C }: { bodyRef: React.RefObject<HTMLTextAreaElement|null>; value: string; onChange: (v: string) => void; C: any }) {
  const insert = (prefix: string, suffix = "") => {
    const ta = bodyRef.current;
    if (!ta) { onChange(value + prefix + suffix); return; }
    const start = ta.selectionStart ?? value.length;
    const end   = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const newVal = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      if (!bodyRef.current) return;
      bodyRef.current.focus();
      const pos = start + prefix.length + selected.length;
      bodyRef.current.setSelectionRange(pos, pos);
    }, 0);
  };
  const btn = (label: string, title: string, prefix: string, suffix = "") => (
    <button key={label} type="button"
      onMouseDown={e => { e.preventDefault(); insert(prefix, suffix); }}
      title={title}
      style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4, color: C.muted, cursor:"pointer", padding:"2px 8px", fontSize:11, fontWeight:700, fontFamily:"monospace", lineHeight:1.6, flexShrink:0 }}
    >{label}</button>
  );
  return (
    <div style={{ display:"flex", gap:5, marginBottom:6, flexWrap:"wrap" }}>
      {btn("B","Bold","**","**")}
      {btn("I","Italic","_","_")}
      {btn("•","Bullet","\n- ")}
      {btn("☑","Checkbox","\n- [ ] ")}
      {btn("H","Heading","## ")}
    </div>
  );
}

/* Body renderer — handles - bullets, checkboxes and line breaks */
function BodyText({ text, C }: { text: string; C: any }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (/^---+$/.test(line.trim())) return <hr key={i} style={{ border:"none", borderTop:`1px solid ${C.border}`, margin:"6px 0" }} />;
        if (/^## /.test(line)) return <div key={i} style={{ fontSize:13, fontWeight:800, color: C.text, marginTop: i>0?10:0, marginBottom:2, letterSpacing:"-0.01em" }}>{line.slice(3)}</div>;
        if (/^# /.test(line))  return <div key={i} style={{ fontSize:15, fontWeight:800, color: C.text, marginTop: i>0?12:0, marginBottom:3, letterSpacing:"-0.02em" }}>{line.slice(2)}</div>;
        const isCheck   = /^- \[[ xX]\]\s/.test(line);
        const isChecked = isCheck && line[3] !== " ";
        const isBullet  = !isCheck && /^[-*•]\s/.test(line);
        return isCheck ? (
          <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginTop: i > 0 ? 3 : 0 }}>
            <span style={{ width:12, height:12, borderRadius:3, border:`1.5px solid ${isChecked ? C.accent : C.border}`, background: isChecked ? C.accent : "none", flexShrink:0, marginTop:3, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              {isChecked && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
            </span>
            <span style={{ textDecoration: isChecked ? "line-through" : "none", color: isChecked ? C.dim : C.text, fontSize:"inherit" }}>{line.slice(6)}</span>
          </div>
        ) : isBullet ? (
          <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginTop: i > 0 ? 3 : 0 }}>
            <span style={{ color: C.accent, flexShrink:0, marginTop:1, fontSize:11 }}>•</span>
            <span>{renderMd(line.slice(2), "")}</span>
          </div>
        ) : (
          <p key={i} style={{ margin: i > 0 ? "4px 0 0" : 0, lineHeight:1.5 }}>
            {line ? renderMd(line, "") : <span> </span>}
          </p>
        );
      })}
    </>
  );
}


/* Collapsible emoji picker — collapsed by default */
function EmojiPicker({ entry, C, onEmojiChange }: { entry: any, C: any, onEmojiChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const EMOJIS = [
    "✅","🚀","💡","📅","🔥","⭐","📌","📝","🛒","✈️","🎬","🎵","🎮","☕","🐾","🚗",
    "💰","💪","🎁","🏠","🎨","🎯","⚠️","🔖","❤️","💬","👍","🎉","💯","🙏","🤝","👏",
    "🇦🇺","🇺🇸","🇬🇧","🇯🇵","🇰🇷","🇨🇳","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇧🇷","🇨🇦","🇮🇳","🇲🇽","🇿🇦","🇳🇿",
  ];
  return (
    <div style={{ marginTop:12, marginBottom:10 }}>
      {/* Header row — always visible */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: open ? 8 : 0 }}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{ fontSize:10, fontWeight:700, color: C.dim, textTransform:"uppercase" as const,
                   letterSpacing:"0.08em", background:"none", border:"none", cursor:"pointer",
                   fontFamily:"inherit", display:"flex", alignItems:"center", gap:4, padding:0 }}>
          {entry.emoji ? <span style={{ fontSize:16 }}>{entry.emoji}</span> : "Emoji"}
          <span style={{ fontSize:9, opacity:0.6 }}>{open ? "▴" : "▾"}</span>
        </button>
        {entry.emoji && (
          <button onClick={e => { e.stopPropagation(); onEmojiChange(""); }}
            style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`,
                     color: C.dim, cursor:"pointer", padding:"2px 7px",
                     borderRadius:4, fontFamily:"inherit" }}>
            ✕
          </button>
        )}
      </div>
      {/* Expandable grid */}
      {open && (
        <div>
          <div style={{ display:"flex", gap:5, marginBottom:6 }}>
            <input
              value={entry.emoji || ""}
              onChange={e => onEmojiChange(e.target.value.trim())}
              placeholder="Type or paste…"
              style={{ flex:1, background: C.input, border:`1px solid ${C.border}`,
                       borderRadius:6, padding:"4px 8px", fontSize:12,
                       color: C.text, fontFamily:"inherit", outline:"none" }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {EMOJIS.map(emo => (
              <button key={emo}
                onClick={e => { e.stopPropagation(); onEmojiChange(emo); setOpen(false); }}
                style={{
                  fontSize:15, background: entry.emoji === emo ? `${C.accent}22` : "none",
                  border: entry.emoji === emo ? `1px solid ${C.accent}55` : `1px solid ${C.border}`,
                  borderRadius:5, width:30, height:30, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                {emo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
  onExpand, onOpenSheet, onCycleType, onDelete, onToggleDone, onPin, onPriority,
  onEditStart, onEditChange, onEditSave, onEditCancel,
  onDueDateEdit, onDueDateChange, onDueDateSave, onDueDateCancel, onDueDateQuickSet, onDueTimeSet,
  onCommentInput, onCommentAdd,
  onCommentEditStart, onCommentEditChange, onCommentEditSave, onCommentEditCancel,
  onCommentDelete,
  onSubtaskInput, onSubtaskAdd, onSubtaskToggle, onSubtaskDelete,
  onAddPhoto, onTagClick, onImgDelete, onEmojiChange, onImgClick,
  onHandleDragStart, onHandleDragEnd,
  editingBodyId, bodyInput,
  onBodyEdit, onBodyChange, onBodySave, onBodyCancel,
  onAiTitle, aiTitling,
  searchQuery,
  showRestore,
}: any) {
  const meta = (TM as any)[entry.type];
  const overdueEntry = isOverdue(entry);
  // pastDue: like overdueEntry but for ALL types — used for date text colour
  const pastDue = !entry.done && !!entry.dueDate &&
    new Date(entry.dueDate + "T00:00") < new Date(new Date().setHours(0,0,0,0));
  const priorities: Array<"low"|"medium"|"high"> = ["low","medium","high"];
  const cyclePriority = () => {
    const next = priorities[(priorities.indexOf(entry.priority) + 1) % 3];
    onPriority(next);
  };

  /* Card has substantive content = expanded with body, comments, or subtasks */
  const hasContent = entry.body || (entry.comments||[]).length > 0 || entry.subtasks.length > 0;

  /* More menu state — closes on outside click/tap */
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPick, setShowEmojiPick] = useState(false);
  React.useEffect(() => {
    if (!showMoreMenu) return;
    const close = () => setShowMoreMenu(false);
    document.addEventListener("click", close, { once: true });
    return () => document.removeEventListener("click", close);
  }, [showMoreMenu]);

  /* Strip #tag and @context from display title — they appear in chip row separately */
  const displayTitle = (() => {
    const stripped = (entry.text || "")
      .replace(/#[\w-]+/g, "")
      .replace(/@[\w-]+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return stripped || (entry.text || "");
  })();

  return (
    <div style={{ display:"flex", gap: isMobile ? 0 : 10, marginBottom: isMobile ? 8 : compact ? 5 : 10 }}>

      {/* Timeline rail (desktop only) */}
      {!isMobile && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:14, flexShrink:0, paddingTop:14 }}>
          {selectMode ? (
            <button onClick={e => { e.stopPropagation(); onToggleSelect && onToggleSelect(); }}
              style={{
                width:16, height:16, borderRadius:4,
                border:`2px solid ${isSelected ? C.accent : C.dimmer}`,
                background: isSelected ? C.accent : "transparent",
                cursor:"pointer", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:0, transition:"all .12s",
              }}>
              {isSelected && <span style={{ color:"#fff", fontSize:10, lineHeight:1, fontWeight:700 }}>✓</span>}
            </button>
          ) : (
            /* Type-colored dot — 7px per design spec */
            <div style={{
              width:7, height:7, borderRadius:"50%",
              background: meta.color,
              flexShrink:0,
              boxShadow:`0 0 6px ${meta.color}66`,
            }} />
          )}
          {rowIdx < totalRows - 1 && (
            <div style={{ width:1, flex:1, background: C.border, marginTop:6, opacity:.6 }} />
          )}
        </div>
      )}

      <div style={{ flex:1, borderRadius:11, minWidth:0, position:"relative", overflow:"hidden" }}>
        {/* Mobile swipe-action reveals */}
        {/* Swipe-right action: complete / restore */}
        {isMobile && (entry.type === "task" || entry.type === "event") && (
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:76,
                        background: entry.done ? "#6366f1" : "#10b981",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
            {entry.done ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.17"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            )}
          </div>
        )}
        {/* Swipe-left action: delete */}
        {isMobile && (
          <div style={{ position:"absolute", right:0, top:0, bottom:0, width:76,
                        background:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg>
          </div>
        )}

        {/* Restore banner (Done tab) */}
        {showRestore && entry.done && (
          <div onClick={e => e.stopPropagation()}
            style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                     marginBottom:4, padding:"6px 10px",
                     background:"#64748b18", borderRadius:8, border:"1px solid #64748b33" }}>
            <span style={{ fontSize:11, color:"#64748b", fontWeight:600 }}>✓ Completed</span>
            <button onClick={onToggleDone}
              style={{ fontSize:11, background: C.accent, color:"#fff", border:"none",
                       borderRadius:6, padding:"3px 10px", cursor:"pointer", fontWeight:600 }}>
              Restore
            </button>
          </div>
        )}

        <motion.div
          initial={entry.isNew ? { opacity: 0, y: 16, scale: 0.97 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={e => {
            if ((e.currentTarget as any)._wasSwiped) { (e.currentTarget as any)._wasSwiped = false; return; }
            if (selectMode) { onToggleSelect && onToggleSelect(); return; }
            if (isMobile && onOpenSheet) { onOpenSheet(); return; }
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
            background: C.surface,
            borderRadius: 11,
            padding: isMobile ? "10px 11px" : compact ? "6px 10px" : "12px",
            border: entry.isNew
              ? `1.5px solid ${C.accent}`
              : `1px solid ${
                  isSelected ? C.accent+"88" :
                  isExpanded ? C.accent+"44" :
                  entry.done ? C.bg          :
                               C.border
                }`,
            boxShadow: entry.isNew
              ? `inset 3px 0 0 ${C.accent}, 0 0 12px ${C.accent}33`
              : isSelected
              ? `inset 3px 0 0 ${C.accent}, 0 0 0 2px ${C.accent}22`
              : entry.done
              ? "none"
              : overdueEntry
              ? "inset 3px 0 0 #ef4444"
              : `inset 3px 0 0 ${meta.color}`,
            opacity: entry.done ? 0.55 : 1,
            cursor: "pointer",
            transition: "border-color .2s, box-shadow .2s, opacity .2s",
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          {/* AI-loaded spine — violet accent bar on left edge when expanded with content */}
          {!isMobile && isExpanded && hasContent && (
            <div style={{
              position:"absolute", left:0, top:8, bottom:8, width:3,
              pointerEvents:"none", borderRadius:"0 2px 2px 0",
              background:`linear-gradient(180deg,
                rgba(139,92,246,0)   0%,
                rgba(139,92,246,0.5) 18%,
                #8b5cf6              50%,
                rgba(167,139,250,0.5) 82%,
                rgba(167,139,250,0)  100%)`,
            }} />
          )}

          {/* Ghost swipe hint icons — subtle always-visible indicators of swipe actions */}
          {isMobile && !isExpanded && (
            <>
              {(entry.type === "task" || entry.type === "event") && (
                <div style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", opacity:0.12, pointerEvents:"none" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={entry.done ? "#6366f1" : "#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                </div>
              )}
              <div style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", opacity:0.12, pointerEvents:"none" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/></svg>
              </div>
            </>
          )}

          <div style={{ display:"flex", gap: isMobile ? 10 : 10 }}>
            {/* Mobile: type icon */}
            {isMobile && (
              <div style={{ width:28, height:28, borderRadius:7,
                            background:`${meta.color}15`, border:`1px solid ${meta.color}33`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            flexShrink:0 }}>
                {entry.emoji ? (
                  <span style={{ fontSize:20, lineHeight:1 }}>{entry.emoji}</span>
                ) : entry.type === "task" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                ) : entry.type === "event" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                ) : entry.type === "note" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                )}
              </div>
            )}

            <div style={{ flex:1, minWidth:0 }}>

              {/* Title row */}
              <div style={{ display:"flex", alignItems:"center", gap:6,
                            marginBottom: compact ? 3 : 4 }}>
                {!isMobile && (
                  <span
                    title="Drag to reorder"
                    draggable
                    onDragStart={e => { e.stopPropagation(); onHandleDragStart && onHandleDragStart(e); }}
                    onDragEnd={e => { e.stopPropagation(); onHandleDragEnd && onHandleDragEnd(e); }}
                    style={{
                      fontSize:13, color: manualMode ? C.dim : C.dimmer, cursor:"grab",
                      flexShrink:0, lineHeight:1, userSelect:"none" as const, marginRight:1,
                      opacity: manualMode ? 0.8 : 0.35, touchAction:"none",
                    }}>
                    ⠿
                  </span>
                )}
                {entry.pinned && (
                  <span style={{ fontSize:10, color:"#f59e0b", lineHeight:1, flexShrink:0 }}>📌</span>
                )}

                <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  {/* Task checkbox — desktop */}
                  {entry.type === "task" && !isMobile && !isEditing && (
                    <button
                      onClick={e => { e.stopPropagation(); onToggleDone(); }}
                      title={entry.done ? "Mark incomplete" : "Mark complete"}
                      style={{ width:16, height:16, borderRadius:4, flexShrink:0,
                               border:`1.5px solid ${entry.done ? meta.color : C.border}`,
                               background: entry.done ? meta.color : "transparent",
                               cursor:"pointer", display:"flex", alignItems:"center",
                               justifyContent:"center", transition:"all .15s", padding:0 }}>
                      {entry.done && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  )}
                  {isEditing ? (
                    <textarea
                      ref={editRef}
                      value={editText}
                      autoFocus
                      rows={2}
                      onChange={e => onEditChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSave(); }
                        if (e.key === "Escape") onEditCancel();
                      }}
                      onBlur={() => {
                        if (editText.trim() === (entry.rawText||"").trim()) onEditCancel();
                        else onEditSave();
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex:1, resize:"none", background: C.input,
                               border:`1px solid ${C.accent}66`, borderRadius:6,
                               padding:"4px 8px", fontSize: isMobile ? 15 : 13,
                               fontWeight:700, fontFamily:"inherit", color: C.text,
                               outline:"none", boxSizing:"border-box" as const }}
                    />
                  ) : (
                    <span
                      onDoubleClick={e => { e.stopPropagation(); onEditStart(); }}
                      title="Double-click to edit"
                      style={{
                        fontSize: isMobile ? 15 : 13, fontWeight:700, color: C.text,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        textDecoration: entry.done ? "line-through" : "none",
                        cursor:"default", flex:1,
                        letterSpacing:"-0.005em",
                      }}>
                      {displayTitle}
                    </span>
                  )}
                  {!isMobile && entry.emoji && !isEditing && (
                    <span style={{ fontSize:14 }}>{entry.emoji}</span>
                  )}
                  {/* Due date inline on title row — right-aligned, dimmed */}
                  {!isEditing && entry.dueDate && editingDueDate !== entry.id && (
                    <span
                      onClick={e => { e.stopPropagation(); onDueDateEdit(); }}
                      title="Click to change date"
                      style={{ fontSize:10.5, color: pastDue ? "#ef4444" : C.dim, flexShrink:0,
                               display:"flex", alignItems:"center", gap:2, cursor:"pointer",
                               fontWeight: pastDue ? 700 : 400 }}>
                      {pastDue ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                      )}
                      {relDueLabel(entry.dueDate, entry.timestamp)}{entry.dueTime && <span style={{opacity:0.75}}> · {formatTime(entry.dueTime)}</span>}
                    </span>
                  )}
                  {/* Subtask progress — desktop only, collapsed view */}
                  {!isMobile && !isEditing && !isExpanded && entry.subtasks && entry.subtasks.length > 0 && (() => {
                    const done = entry.subtasks.filter((s:any) => s.done).length;
                    const total = entry.subtasks.length;
                    const pct = Math.round((done/total)*100);
                    return (
                      <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }} title={`${done} of ${total} subtasks done`}>
                        <div style={{ width:32, height:3, borderRadius:2, background:`${C.border}`, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background: done===total ? "#10b981" : meta.color, borderRadius:2, transition:"width .3s" }} />
                        </div>
                        <span style={{ fontSize:9.5, color: done===total ? "#10b981" : C.dimmer, fontWeight:600 }}>{done}/{total}</span>
                      </div>
                    );
                  })()}
                </div>

                {isEditing ? (
                  <div style={{ display:"flex", gap:4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={onEditSave}
                      style={{ fontSize:11, background: C.accent, border:"none", color:"#fff",
                               cursor:"pointer", padding:"3px 9px", borderRadius:5,
                               fontFamily:"inherit", fontWeight:600 }}>
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
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); isMobile && onOpenSheet ? onOpenSheet() : onExpand(); }}
                      title={isExpanded ? "Collapse" : "Expand"}
                      style={{
                        fontSize:13, background:"none", border:"none", color: C.dim,
                        cursor:"pointer", padding:"2px 5px", borderRadius:4, lineHeight:1,
                        transform: isExpanded && !isMobile ? "rotate(180deg)" : "none",
                        transition:"transform .15s",
                      }}>
                      ▾
                    </button>
                    {/* ⋮ More menu — not delete */}
                    <div style={{ position:"relative" }}>
                      <button
                        onClick={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowMoreMenu(m => !m); }}
                        style={{ background:"none", border:"none", color: C.dim,
                                 fontSize:16, cursor:"pointer", opacity:0.4, padding:"0 3px",
                                 lineHeight:1, display:"flex", alignItems:"center" }}>
                        ⋮
                      </button>
                      {showMoreMenu && (
                        <div
                          onMouseLeave={() => setShowMoreMenu(false)}
                          style={{
                            position:"absolute", right:0, top:"100%", zIndex:200,
                            background: C.surface, border:`1px solid ${C.border}`,
                            borderRadius:8, boxShadow:"0 8px 24px rgba(0,0,0,.25)",
                            minWidth:140, overflow:"hidden", marginTop:4,
                          }}>
                          {[
                            { label: entry.done ? "↩ Restore" : "✓ Done", action: () => { onToggleDone(); setShowMoreMenu(false); } },
                            { label: entry.pinned ? "📌 Unpin" : "📌 Pin", action: () => { onPin(); setShowMoreMenu(false); } },
                            { label: "↲ Duplicate", action: () => { onDuplicate && onDuplicate(); setShowMoreMenu(false); } },
                            { label: "🗑 Delete", action: () => { onDelete(); setShowMoreMenu(false); }, danger: true },
                          ].map(item => (
                            <button
                              key={item.label}
                              onClick={e => { e.stopPropagation(); item.action(); }}
                              style={{
                                display:"block", width:"100%", textAlign:"left",
                                background:"none", border:"none", cursor:"pointer",
                                padding:"9px 14px", fontSize:12, fontFamily:"inherit",
                                color: (item as any).danger ? "#ef4444" : C.text,
                                transition:"background .1s",
                              }}
                              onMouseEnter={e => { (e.currentTarget as any).style.background = (item as any).danger ? "#ef444415" : `${C.accent}15`; }}
                              onMouseLeave={e => { (e.currentTarget as any).style.background = "none"; }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Priority · type · tags — single scrollable line under title */}
              <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"nowrap",
                            overflowX:"auto", msOverflowStyle:"none", scrollbarWidth:"none" as any,
                            marginBottom: entry.body ? 4 : 0 }}>
                {/* Type label — on desktop cycles type, on mobile opens sheet */}
                {onCycleType && (
                  <span onClick={e => {
                      e.stopPropagation();
                      if (isMobile && onOpenSheet) { onOpenSheet(); } else { onCycleType(); }
                    }}
                    title={isMobile ? "Tap to open" : "Click to change type"}
                    style={{ fontSize:10, fontWeight:800, textTransform:"uppercase" as const,
                             letterSpacing:"0.08em", color: meta.color,
                             cursor:"pointer", userSelect:"none" as const, flexShrink:0 }}>
                    {meta.label}
                  </span>
                )}

                {/* Separator */}
                <span style={{ color: C.border, fontSize:10, flexShrink:0, userSelect:"none" as const }}>·</span>

                {/* Priority: dot + word — on desktop cycles, on mobile opens sheet */}
                <span
                  onClick={e => {
                    e.stopPropagation();
                    if (isMobile && onOpenSheet) { onOpenSheet(); } else { cyclePriority(); }
                  }}
                  title={isMobile ? "Tap to open" : "Click to cycle priority"}
                  style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", flexShrink:0 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%",
                    background: (PM as any)[entry.priority].color, flexShrink:0, display:"inline-block" }} />
                  <span style={{ fontSize:10, fontWeight:500, color: C.dim,
                    userSelect:"none" as const }}>
                    {(PM as any)[entry.priority].label}
                  </span>
                </span>

                {/* Tags */}
                {(entry.tags||[]).map((tag: string) => {
                  const t = tag.startsWith("#") ? tag.slice(1) : tag;
                  return (
                    <span key={tag} style={{ fontSize:9, fontWeight:800, textTransform:"uppercase" as const,
                      letterSpacing:"0.05em", color: C.accent, background:`${C.accent}18`,
                      border:`1px solid ${C.accent}30`, padding:"1px 5px", borderRadius:3,
                      flexShrink:0, whiteSpace:"nowrap" as const }}>
                      #{t}
                    </span>
                  );
                })}
                {(entry.contexts||[]).map((ctx: string) => {
                  const c = ctx.startsWith("@") ? ctx.slice(1) : ctx;
                  return (
                    <span key={ctx} style={{ fontSize:9, fontWeight:700,
                      color: C.dim, background: C.bg,
                      border:`1px solid ${C.border}`, padding:"1px 5px", borderRadius:3,
                      flexShrink:0, whiteSpace:"nowrap" as const }}>
                      @{c}
                    </span>
                  );
                })}

                {/* + date button shown only when no date set */}
                {!entry.dueDate && editingDueDate !== entry.id && (
                  <button
                    onClick={e => { e.stopPropagation(); onDueDateEdit(); }}
                    style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`,
                             color: C.dimmer, cursor:"pointer", padding:"1px 6px",
                             borderRadius:4, fontFamily:"inherit" }}>
                    + date
                  </button>
                )}
              </div>
              {/* Body preview (collapsed) */}
              {!isEditing && entry.body && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    if (isMobile && onOpenSheet) { onOpenSheet(); }
                    else { onBodyEdit(); }
                  }}
                  title={isMobile ? "Tap to open" : "Click to edit body"}
                  style={{ margin:"4px 0 4px", fontSize:11.5, color: C.muted, lineHeight:1.5,
                           cursor: isMobile ? "pointer" : "text",
                           display:"-webkit-box" as any,
                           WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any,
                           overflow:"hidden" }}>
                  <BodyText text={entry.body} C={C} />
                </div>
              )}


              {/* Inline date picker */}
              {editingDueDate === entry.id && (
                <div onClick={e => e.stopPropagation()}
                  style={{ marginTop:8, padding:"10px 12px", background: C.bg,
                           border:`1px solid ${C.accent}44`, borderRadius:10 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                    {getDueDateShortcuts().map(s => (
                      <button key={s.label}
                        onClick={() => {
                          onDueDateQuickSet
                            ? onDueDateQuickSet(s.value)
                            : (onDueDateChange(s.value), onDueDateSave());
                        }}
                        style={{ fontSize:11, padding:"3px 9px", borderRadius:6,
                                 background:`${C.accent}18`, border:`1px solid ${C.accent}44`,
                                 color: C.accent, cursor:"pointer", fontFamily:"inherit" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <input type="date"
                    value={entry.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(entry.dueDate) ? entry.dueDate : ""}
                    onChange={e => {
                      if (e.target.value) {
                        onDueDateQuickSet
                          ? onDueDateQuickSet(e.target.value)
                          : (onDueDateChange(e.target.value), onDueDateSave());
                      }
                    }}
                    style={{ width:"100%", background: C.input, border:`1px solid ${C.border}`,
                             borderRadius:6, padding:"5px 8px", fontSize:11, color: C.text,
                             fontFamily:"inherit", outline:"none",
                             boxSizing:"border-box" as const, marginBottom:6 }}
                  />
                  {/* Time picker — styled select with 15-min increments */}
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                    <select
                      value={entry.dueTime || ""}
                      onChange={e => onDueTimeSet && onDueTimeSet(e.target.value || null)}
                      style={{ flex:1, background: C.input, border:`1px solid ${C.border}`,
                               borderRadius:6, padding:"5px 8px", fontSize:12,
                               color: entry.dueTime ? C.text : C.dim,
                               fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                      <option value="">Set a time…</option>
                      {Array.from({length:96}, (_,i) => {
                        const h24 = Math.floor(i / 4);
                        const min = (i % 4) * 15;
                        const val = `${String(h24).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
                        const h12 = h24 % 12 || 12;
                        const label = `${h12}:${String(min).padStart(2,"0")} ${h24 < 12 ? "AM" : "PM"}`;
                        return <option key={val} value={val}>{label}</option>;
                      })}
                    </select>
                    {entry.dueTime && (
                      <button onClick={() => onDueTimeSet && onDueTimeSet(null)}
                        style={{ fontSize:11, color:"#ef4444", background:"none", border:"none",
                                 cursor:"pointer", padding:"2px 4px", lineHeight:1, flexShrink:0 }}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    {entry.dueDate && (
                      <button
                        onClick={() => {
                          onDueDateQuickSet
                            ? onDueDateQuickSet('')
                            : (onDueDateChange(null), onDueDateSave());
                        }}
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

              {/* Desktop: image thumbnails (collapsed) */}
              {!isMobile && !isEditing && (entry.images||[]).length > 0 && (
                <div style={{ display:"flex", gap:4, marginTop:8, flexWrap:"wrap" }}>
                  {(entry.images as string[]).slice(0,4).map((src, i) => (
                    <img key={i} src={src} alt=""
                      onClick={e => { e.stopPropagation(); onImgClick && onImgClick(src); }}
                      style={{ width:40, height:40, objectFit:"cover",
                               borderRadius:7,                          /* --r-7: image thumb */
                               border:`1px solid ${C.border}`, display:"block", cursor:"zoom-in" }} />
                  ))}
                  {(entry.images||[]).length > 4 && (
                    <div style={{ width:40, height:40, borderRadius:7, background: C.bg,
                                  border:`1px solid ${C.border}`, display:"flex",
                                  alignItems:"center", justifyContent:"center",
                                  fontSize:10, color: C.dim }}>
                      +{(entry.images||[]).length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile: image hero — tapping opens lightbox */}
              {isMobile && (entry.images||[]).length > 0 && (
                <div style={{ borderRadius:10, overflow:"hidden", marginTop:8, marginBottom:4,
                              border:`1px solid ${C.border}`, cursor:"zoom-in" }}
                  onClick={e => { e.stopPropagation(); onImgClick && onImgClick((entry.images as string[])[0]); }}>
                  <img src={(entry.images as string[])[0]} alt=""
                    style={{ width:"100%", height:120, objectFit:"cover", pointerEvents:"none" }} />
                </div>
              )}

              {/* Mobile: subtask progress bar */}
              {isMobile && entry.subtasks.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <span style={{ fontSize:10, fontWeight:700, color: C.dim,
                                   textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>
                      Subtasks
                    </span>
                    <span style={{ fontSize:10, fontWeight:600, color: C.dim }}>
                      {entry.subtasks.filter((s:any)=>s.done).length} / {entry.subtasks.length}
                    </span>
                  </div>
                  <div style={{ height:4, background: C.bg, borderRadius:2, overflow:"hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width:`${(entry.subtasks.filter((s:any)=>s.done).length / entry.subtasks.length)*100}%` }}
                      style={{ height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.accent}dd)` }}
                    />
                  </div>
                </div>
              )}


            </div>
          </div>

          {/* Expanded section */}
          <AnimatePresence initial={false}>
            {!isMobile && isExpanded && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>

                  {/* ── Action bar ─────────────────────────────── */}
                  <div style={{ display:"flex", gap:6, marginBottom:10, alignItems:"center", flexWrap:"nowrap" as const }}>
                    <button onClick={onAiTitle} disabled={aiTitling}
                      style={{ fontSize:11, background:`${C.accent}18`, border:`1px solid ${C.accent}44`,
                               color: C.accent, cursor: aiTitling ? "wait" : "pointer",
                               padding:"4px 10px", borderRadius:6, fontFamily:"inherit", whiteSpace:"nowrap" as const,
                               display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                      ✨ {aiTitling ? "Thinking…" : "AI Title"}
                    </button>
                    <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                      {entry.emoji ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); setShowEmojiPick(o => !o); }}
                            title="Change emoji"
                            style={{ fontSize:16, background:"none", border:"none", cursor:"pointer", padding:"2px 4px", lineHeight:1 }}>
                            {entry.emoji}
                          </button>
                          <button onClick={e => { e.stopPropagation(); onEmojiChange(""); setShowEmojiPick(false); }}
                            title="Remove emoji"
                            style={{ fontSize:10, background:"none", border:`1px solid ${C.border}`,
                                     color: C.dim, cursor:"pointer", padding:"2px 6px",
                                     borderRadius:4, fontFamily:"inherit" }}>✕</button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setShowEmojiPick(o => !o); }}
                          style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                                   color: C.dim, cursor:"pointer", padding:"4px 9px",
                                   borderRadius:6, fontFamily:"inherit", whiteSpace:"nowrap" as const }}>
                          😊 Emoji
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Emoji tray (toggled) ──────────────────── */}
                  {showEmojiPick && (
                    <div style={{ marginBottom:10, padding:"8px 10px", background: C.bg,
                                  borderRadius:8, border:`1px solid ${C.border}` }}
                         onClick={e => e.stopPropagation()}>
                      <div style={{ display:"flex", gap:4, alignItems:"center", flexWrap:"wrap" as const }}>
                        <input
                          value={entry.emoji || ""}
                          onChange={e => onEmojiChange(e.target.value.trim())}
                          placeholder="Type or paste…"
                          autoFocus
                          style={{ width:110, background: C.input, border:`1px solid ${C.border}`,
                                   borderRadius:6, padding:"4px 8px", fontSize:12,
                                   color: C.text, fontFamily:"inherit", outline:"none" }}
                        />
                        {["✅","🚀","💡","📅","🔥","⭐","📌","📝","🛒","✈️","🎨","💬","🎯","⚠️","❤️","🎉"].map(emo => (
                          <button key={emo}
                            onClick={() => { onEmojiChange(emo); setShowEmojiPick(false); }}
                            style={{ fontSize:16, background: entry.emoji === emo ? `${C.accent}22` : "none",
                                     border: entry.emoji === emo ? `1px solid ${C.accent}55` : `1px solid ${C.border}`,
                                     borderRadius:5, width:30, height:30, cursor:"pointer",
                                     display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 2-column body: notes left, tasks+comments right ── */}
                  <div style={{ display:"flex", gap:16, marginBottom:14, alignItems:"stretch" }}>

                    {/* LEFT — body notes (55%) */}
                    <div style={{ flex:"0 0 55%", minWidth:0, display:"flex", flexDirection:"column" as const }}>
                      <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                    textTransform:"uppercase" as const, letterSpacing:"0.08em", marginBottom:6 }}>
                        Notes
                      </div>
                      {editingBodyId === entry.id ? (
                        <BodyEditor bodyInput={bodyInput} onBodyChange={onBodyChange} onBodyCancel={onBodyCancel} onBodySave={onBodySave} C={C} />
                      ) : entry.body ? (
                        <div onClick={onBodyEdit} title="Click to edit notes"
                          style={{ fontSize:12, color: C.text, lineHeight:1.6, cursor:"text",
                                   padding:"8px 10px", background: C.bg, borderRadius:8,
                                   border:`1px solid ${C.border}`, flex:1 }}>
                          <BodyText text={entry.body} C={C} />
                        </div>
                      ) : (
                        <div onClick={onBodyEdit}
                          style={{ fontSize:12, color: C.dimmer, cursor:"text", fontStyle:"italic",
                                   padding:"8px 10px", background: C.bg, borderRadius:8,
                                   border:`1px dashed ${C.border}`, flex:1, minHeight:60,
                                   display:"flex", alignItems:"center" }}>
                          Click to add notes…
                        </div>
                      )}
                    </div>

                    {/* RIGHT — subtasks (tasks only) + comments */}
                    <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:12 }}>

                      {/* Sub-tasks */}
                      {entry.type === "task" && (
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                        textTransform:"uppercase" as const,
                                        letterSpacing:"0.08em", marginBottom:7 }}>
                            Sub-tasks {entry.subtasks.length > 0 && <span style={{ color:C.accent, fontWeight:400 }}>· {entry.subtasks.filter((s:any)=>s.done).length}/{entry.subtasks.length}</span>}
                          </div>
                          {entry.subtasks.map((st: any) => (
                            <div key={st.id}
                              style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                              <Tick checked={st.done} onChange={() => onSubtaskToggle(st.id)} size={14} />
                              <span style={{ flex:1, fontSize:12, color: st.done ? C.dim : C.text,
                                             textDecoration: st.done ? "line-through" : "none" }}>
                                {renderMd(st.text, searchQuery)}
                              </span>
                              <button onClick={() => onSubtaskDelete(st.id)}
                                style={{ background:"none", border:"none", cursor:"pointer",
                                         fontSize:11, color:"#ef4444", padding:"1px 3px", opacity:.5 }}>
                                ✕
                              </button>
                            </div>
                          ))}
                          <div style={{ display:"flex", gap:5, marginTop:5 }}>
                            <input
                              value={stInputs[entry.id] || ""}
                              onChange={e => onSubtaskInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") onSubtaskAdd(); }}
                              placeholder="Add sub-task…"
                              style={{ flex:1, background: C.input, border:`1px solid ${C.border}`,
                                       borderRadius:6, padding:"4px 8px", fontSize:12,
                                       color: C.text, fontFamily:"inherit", outline:"none" }}
                            />
                            <button onClick={onSubtaskAdd}
                              style={{ background: C.accent, border:"none", color:"#fff",
                                       cursor:"pointer", padding:"4px 10px", borderRadius:6,
                                       fontSize:13, fontFamily:"inherit" }}>+</button>
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                      textTransform:"uppercase" as const,
                                      letterSpacing:"0.08em", marginBottom:7 }}>
                          Comments {(entry.comments||[]).length > 0 && <span style={{ color:C.accent, fontWeight:400 }}>· {(entry.comments||[]).length}</span>}
                        </div>
                        {(entry.comments||[]).map((comment: any) => (
                          <div key={comment.id}
                            style={{ marginBottom:6, padding:"6px 9px", background: C.bg,
                                     borderRadius:6, border:`1px solid ${C.border}` }}>
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
                                           border:`1px solid ${C.accent}55`, borderRadius:5,
                                           padding:"4px 7px", fontSize:12, fontFamily:"inherit",
                                           color: C.text, outline:"none", boxSizing:"border-box" as const }}
                                />
                                <div style={{ display:"flex", gap:4, marginTop:4 }}>
                                  <button onClick={onCommentEditSave}
                                    style={{ fontSize:11, background: C.accent, border:"none",
                                             color:"#fff", cursor:"pointer", padding:"2px 8px",
                                             borderRadius:4, fontFamily:"inherit" }}>Save</button>
                                  <button onClick={onCommentEditCancel}
                                    style={{ fontSize:11, background:"none",
                                             border:`1px solid ${C.border}`, color: C.dim,
                                             cursor:"pointer", padding:"2px 8px",
                                             borderRadius:4, fontFamily:"inherit" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                                <div style={{ flex:1 }}>
                                  <p onDoubleClick={() => onCommentEditStart(comment.id, comment.text)}
                                    style={{ margin:"0 0 3px", fontSize:12, color: C.text,
                                             lineHeight:1.4, wordBreak:"break-word", cursor:"default" }}>
                                    {renderMd(comment.text, searchQuery)}
                                  </p>
                                  <span style={{ fontSize:9, color: C.dimmer }}>{fmt(comment.createdAt)}</span>
                                </div>
                                <button onClick={() => onCommentDelete(comment.id)}
                                  style={{ background:"none", border:"none", cursor:"pointer",
                                           fontSize:11, color:"#ef4444", padding:"1px 3px", opacity:.4 }}>✕</button>
                              </div>
                            )}
                          </div>
                        ))}
                        <div style={{ display:"flex", gap:5, marginTop:5 }}>
                          <textarea
                            value={commentInputs[entry.id] || ""}
                            onChange={e => onCommentInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommentAdd(); } }}
                            placeholder="Add a comment…"
                            rows={2}
                            style={{ flex:1, resize:"none", background: C.input,
                                     border:`1px solid ${C.border}`, borderRadius:6,
                                     padding:"5px 8px", fontSize:12, fontFamily:"inherit",
                                     color: C.text, outline:"none", lineHeight:1.5,
                                     boxSizing:"border-box" as const, transition:"border-color .15s" }}
                            onFocus={e => e.target.style.borderColor=`${C.accent}66`}
                            onBlur={e  => e.target.style.borderColor=C.border}
                          />
                          <button onClick={onCommentAdd}
                            disabled={!(commentInputs[entry.id]||"").trim()}
                            style={{ padding:"0 10px", borderRadius:6, border:"none",
                                     background: (commentInputs[entry.id]||"").trim() ? C.accent : C.dimmer,
                                     color:"#fff", cursor: (commentInputs[entry.id]||"").trim() ? "pointer" : "default",
                                     fontSize:13, alignSelf:"stretch", transition:"background .15s" }}>
                            ↑
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color: C.dim,
                                  textTransform:"uppercase" as const, letterSpacing:"0.08em",
                                  marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                      📷 Photos
                      {(entry.images||[]).length > 0 && (
                        <span style={{ color: C.accent, fontWeight:400,
                                       textTransform:"none" as const, letterSpacing:0 }}>
                          · {(entry.images||[]).length}
                        </span>
                      )}
                      <button onClick={onAddPhoto}
                        style={{ fontSize:10, color: C.accent, background:"none",
                                 border:`1px solid ${C.accent}44`, borderRadius:4,
                                 padding:"1px 7px", cursor:"pointer", fontFamily:"inherit",
                                 fontWeight:400, textTransform:"none" as const,
                                 letterSpacing:0, marginLeft:"auto" }}>
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
                              onClick={e => { e.stopPropagation(); onImgClick && onImgClick(src); }}
                              style={{ width:imgW, height:imgW, objectFit:"cover",
                                       cursor:"zoom-in", borderRadius:10,  /* --r-7 */
                                       border:`1px solid ${C.border}`, display:"block" }} />
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

                  {/* Expanded footer: Duplicate · Close panel */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                marginTop:16, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                    <button onClick={e => { e.stopPropagation(); onDuplicate && onDuplicate(); }}
                      style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                               color: C.dim, cursor:"pointer", padding:"5px 14px",
                               borderRadius:7, fontFamily:"inherit",
                               display:"flex", alignItems:"center", gap:5 }}>
                      {"↲"} Duplicate
                    </button>
                    <button onClick={onExpand}
                      style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                               color: C.dim, cursor:"pointer", padding:"5px 20px",
                               borderRadius:7, fontFamily:"inherit" }}>
                      {"↑"} Close panel
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


