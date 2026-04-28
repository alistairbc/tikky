import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { TM, PM } from "../constants";
import { Entry } from "../types";
import { renderMd } from "../utils/format";

function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }

/* Auto-resizing textarea helper */
function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/* Toolbar button */
function ToolBtn({ onClick, label, title, badge, active, danger, C, accent }: any) {
  return (
    <button onClick={onClick} title={title}
      style={{
        position:"relative", padding:"8px 12px", borderRadius:10,
        background: active ? `${accent || C.accent}22` : "none",
        border:"none", cursor:"pointer", fontSize:20,
        color: danger ? "#ef4444" : active ? (accent || C.accent) : C.dim,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"background .12s",
      }}>
      {label}
      {badge > 0 && (
        <span style={{ position:"absolute", top:4, right:4, width:16, height:16, borderRadius:"50%",
          background: C.accent, color:"#fff", fontSize:9, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center" }}>{badge > 9 ? "9+" : badge}</span>
      )}
    </button>
  );
}

/* Inline body renderer */
function BodyDisplay({ text, C }: { text: string; C: any }) {
  return (
    <div style={{ fontSize:14, color: C.dim, lineHeight:1.6 }}>
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:8 }} />;
        if (/^## /.test(line)) return <div key={i} style={{ fontSize:14, fontWeight:800, color:C.text, marginTop:8 }}>{line.slice(3)}</div>;
        if (/^# /.test(line))  return <div key={i} style={{ fontSize:16, fontWeight:800, color:C.text, marginTop:10 }}>{line.slice(2)}</div>;
        const isBullet = /^[-*•]\s/.test(line);
        const isCheck  = /^- \[[ xX]\]/.test(line);
        const isChecked = isCheck && line[3] !== " ";
        if (isCheck) return (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginTop:4 }}>
            <span style={{ width:14, height:14, borderRadius:4, border:`2px solid ${isChecked ? C.accent : C.border}`,
              background: isChecked ? C.accent : "none", flexShrink:0, marginTop:3,
              display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
              {isChecked && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
            </span>
            <span style={{ textDecoration: isChecked ? "line-through" : "none", color: isChecked ? C.dimmer : C.text, fontSize:14 }}>{line.slice(6)}</span>
          </div>
        );
        if (isBullet) return (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginTop:4 }}>
            <span style={{ color:C.accent, flexShrink:0, fontSize:12, marginTop:4 }}>•</span>
            <span style={{ color:C.text }}>{line.slice(2)}</span>
          </div>
        );
        return <div key={i} style={{ color:C.text, marginTop: i > 0 ? 4 : 0 }}>{renderMd(line, "")}</div>;
      })}
    </div>
  );
}

interface EntrySheetProps {
  entry: Entry;
  C: any;
  onClose: () => void;
  onUpdate: (updates: Partial<Entry>) => void;
  onDelete: () => void;
  onToggleDone: () => void;
  onAddPhoto: (dataUrl: string) => void;
  onAddComment: (text: string) => void;
  onAiTitle: () => void;
  aiTitling: boolean;
}

export function EntrySheet({
  entry, C, onClose, onUpdate, onDelete, onToggleDone,
  onAddPhoto, onAddComment, onAiTitle, aiTitling,
}: EntrySheetProps) {

  const [title,        setTitle]        = useState(entry.text);
  const [body,         setBody]         = useState(entry.body || "");
  const [showDue,      setShowDue]      = useState(false);
  const [showComments, setShowComments] = useState((entry.comments || []).length > 0);
  const [showPhotos,   setShowPhotos]   = useState((entry.images   || []).length > 0);
  const [commentText,  setCommentText]  = useState("");
  const [editingBody,  setEditingBody]  = useState(false);

  const titleRef   = useRef<HTMLTextAreaElement>(null);
  const bodyRef    = useRef<HTMLTextAreaElement>(null);
  const photoRef   = useRef<HTMLInputElement>(null);

  // Keep local state synced when entry changes externally
  useEffect(() => { setTitle(entry.text);       }, [entry.text]);
  useEffect(() => { setBody(entry.body || "");  }, [entry.body]);
  useEffect(() => { autoSize(titleRef.current); }, [title]);

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== entry.text) onUpdate({ text: t });
  };
  const saveBody = () => {
    if (body !== (entry.body || "")) onUpdate({ body });
    setEditingBody(false);
  };
  const closeSheet = () => { saveTitle(); saveBody(); onClose(); };

  const meta = (TM as any)[entry.type];
  const pmeta = (PM as any)[entry.priority];
  const overdue = entry.dueDate && !entry.done && new Date(entry.dueDate + "T00:00") < new Date();
  const types: Array<"task"|"event"|"note"|"thought"> = ["task","event","note","thought"];
  const priorities: Array<"low"|"medium"|"high"> = ["low","medium","high"];

  const today = new Date(); today.setHours(0,0,0,0);
  const dueDateShortcuts = [
    { label:"Today",     value: toISO(today) },
    { label:"Tomorrow",  value: toISO(addDays(today,1)) },
    { label:"This Fri",  value: toISO(addDays(today, (5 - today.getDay() + 7) % 7 || 7)) },
    { label:"Next Mon",  value: toISO(addDays(today, (1 - today.getDay() + 7) % 7 || 7)) },
    { label:"2 weeks",   value: toISO(addDays(today,14)) },
  ];

  const photoHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const raw = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 900, scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const cvs = document.createElement("canvas");
        cvs.width = Math.round(img.width * scale);
        cvs.height = Math.round(img.height * scale);
        const ctx = cvs.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0, cvs.width, cvs.height); onAddPhoto(cvs.toDataURL("image/jpeg", 0.72)); }
        else onAddPhoto(raw);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
    (e.target as HTMLInputElement).value = "";
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div key="backdrop"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:.2 }}
        onClick={closeSheet}
        style={{ position:"fixed", inset:0, background:"#00000088", zIndex:900, backdropFilter:"blur(3px)" }}
      />

      {/* Sheet */}
      <motion.div key="sheet"
        initial={{ y:"100%" }}
        animate={{ y:0 }}
        exit={{ y:"100%" }}
        transition={{ type:"spring", damping:32, stiffness:340, mass:0.9 }}
        drag="y"
        dragConstraints={{ top:0 }}
        dragElastic={{ top:0.05, bottom:0.4 }}
        onDragEnd={(_, info) => { if (info.offset.y > 100 || info.velocity.y > 400) closeSheet(); }}
        style={{
          position:"fixed", bottom:0, left:0, right:0,
          height:"92dvh",
          background: C.card,
          borderRadius:"22px 22px 0 0",
          zIndex:901,
          display:"flex", flexDirection:"column",
          overflow:"hidden",
          boxShadow:"0 -8px 40px #00000044",
        }}>

        {/* Drag handle */}
        <div onClick={closeSheet} style={{ display:"flex", justifyContent:"center", paddingTop:10, paddingBottom:6, flexShrink:0, cursor:"pointer" }}>
          <div style={{ width:40, height:4, borderRadius:2, background: C.border }} />
        </div>

        {/* Accent line */}
        <div style={{ height:2, background: meta.color, opacity:0.7, flexShrink:0, marginBottom:2 }} />

        {/* Header: chips + done check + close */}
        <div style={{ display:"flex", alignItems:"center", padding:"8px 16px 6px", gap:6, flexShrink:0, flexWrap:"wrap" }}>
          {/* Type chip */}
          <button onClick={() => onUpdate({ type: types[(types.indexOf(entry.type as any)+1)%4] })}
            style={{ padding:"4px 12px", borderRadius:20, fontSize:10, fontWeight:800, textTransform:"uppercase",
              letterSpacing:"0.08em", background:`${meta.color}22`, color:meta.color,
              border:`1px solid ${meta.color}55`, cursor:"pointer", fontFamily:"inherit", transition:"all .12s" }}>
            {meta.label}
          </button>
          {/* Priority chip */}
          <button onClick={() => onUpdate({ priority: priorities[(priorities.indexOf(entry.priority)+1)%3] })}
            style={{ padding:"4px 12px", borderRadius:20, fontSize:10, fontWeight:800, textTransform:"uppercase",
              letterSpacing:"0.08em", background:`${pmeta.color}22`, color:pmeta.color,
              border:`1px solid ${pmeta.color}55`, cursor:"pointer", fontFamily:"inherit", transition:"all .12s" }}>
            {entry.priority}
          </button>
          {/* Due date chip */}
          {(entry.type === "task" || entry.type === "event") && (
            <button onClick={() => setShowDue(p => !p)}
              style={{ padding:"4px 12px", borderRadius:20, fontSize:10, fontWeight:700,
                background: overdue ? "#ef444422" : (entry.dueDate ? `${C.surface}` : "none"),
                color: overdue ? "#ef4444" : entry.dueDate ? C.dim : C.dimmer,
                border:`1px solid ${overdue ? "#ef444455" : entry.dueDate ? C.border : "transparent"}`,
                cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, transition:"all .12s" }}>
              {entry.dueDate ? (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {entry.dueDate}</>
              ) : (
                <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Set date</>
              )}
            </button>
          )}

          {/* Spacer */}
          <div style={{ flex:1 }} />

          {/* Done toggle (tasks/events) */}
          {(entry.type === "task" || entry.type === "event") && (
            <button onClick={onToggleDone}
              style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
                border:`2px solid ${entry.done ? "#10b981" : C.border}`,
                background: entry.done ? "#10b981" : "transparent",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .15s" }}>
              {entry.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
            </button>
          )}

          {/* Close */}
          <button onClick={closeSheet}
            style={{ width:30, height:30, borderRadius:"50%", flexShrink:0,
              background: C.surface, border:`1px solid ${C.border}`,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: C.dim, fontSize:18, lineHeight:1, transition:"all .12s" }}>
            ×
          </button>
        </div>

        {/* Due date picker dropdown */}
        <AnimatePresence>
          {showDue && (
            <motion.div key="due"
              initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
              transition={{ duration:.2 }}
              style={{ overflow:"hidden", flexShrink:0 }}>
              <div style={{ padding:"0 16px 12px" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {dueDateShortcuts.map(s => (
                    <button key={s.label}
                      onClick={() => { onUpdate({ dueDate: s.value }); setShowDue(false); }}
                      style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600,
                        background: entry.dueDate === s.value ? C.accent : C.surface,
                        color: entry.dueDate === s.value ? "#fff" : C.dim,
                        border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit" }}>
                      {s.label}
                    </button>
                  ))}
                  {entry.dueDate && (
                    <button onClick={() => { onUpdate({ dueDate: undefined }); setShowDue(false); }}
                      style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600,
                        background:"none", color:"#ef4444", border:"1px solid #ef444444", cursor:"pointer", fontFamily:"inherit" }}>
                      Clear
                    </button>
                  )}
                </div>
                <input type="date" value={entry.dueDate || ""}
                  onChange={e => { onUpdate({ dueDate: e.target.value || undefined }); setShowDue(false); }}
                  style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"7px 10px", fontSize:12, color:C.text, fontFamily:"inherit",
                    width:"100%", boxSizing:"border-box" as const, outline:"none" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Scrollable body ─── */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 0", WebkitOverflowScrolling:"touch" as any }}>

          {/* Title */}
          <textarea ref={titleRef} value={title}
            onChange={e => { setTitle(e.target.value); autoSize(e.target); }}
            onBlur={saveTitle}
            placeholder="Title…"
            style={{
              display:"block", width:"100%", background:"transparent",
              border:"none", outline:"none",
              fontSize:22, fontWeight:700, lineHeight:1.3,
              color: entry.done ? C.dimmer : C.text,
              textDecoration: entry.done ? "line-through" : "none",
              fontFamily:"inherit", resize:"none", padding:0,
              marginBottom:8, boxSizing:"border-box" as const, overflow:"hidden",
            }}
            rows={1}
          />

          {/* Tags */}
          {(entry.tags||[]).length > 0 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
              {entry.tags.map(tag => (
                <span key={tag} style={{ padding:"2px 8px", borderRadius:3, fontSize:10, fontWeight:800,
                  background:`${C.accent}22`, color:C.accent, letterSpacing:"0.04em", textTransform:"uppercase" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Contexts */}
          {(entry.contexts||[]).length > 0 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
              {entry.contexts.map(ctx => (
                <span key={ctx} style={{ padding:"2px 8px", borderRadius:3, fontSize:10, fontWeight:700,
                  background:`${C.surface}`, color:C.dim, border:`1px solid ${C.border}` }}>
                  @{ctx}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height:1, background: C.border, marginBottom:14, opacity:.5 }} />

          {/* Body — view or edit */}
          {editingBody ? (
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", gap:5, marginBottom:6, flexWrap:"wrap" }}>
                {[
                  ["B","**","**"],["I","_","_"],["•","\n- ",""],["[ ]","\n- [ ] ",""],["H2","## ",""]
                ].map(([label, prefix, suffix]) => (
                  <button key={label} type="button"
                    onMouseDown={e => {
                      e.preventDefault();
                      const ta = bodyRef.current;
                      if (!ta) return;
                      const s = ta.selectionStart, en = ta.selectionEnd;
                      const sel = body.slice(s, en);
                      const newVal = body.slice(0,s) + prefix + sel + (suffix||"") + body.slice(en);
                      setBody(newVal);
                      setTimeout(() => { if (bodyRef.current) { bodyRef.current.focus(); bodyRef.current.setSelectionRange(s+prefix.length+sel.length, s+prefix.length+sel.length); }}, 0);
                    }}
                    style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4,
                      color:C.dim, cursor:"pointer", padding:"3px 10px", fontSize:11,
                      fontWeight:700, fontFamily:"monospace", lineHeight:1.6, flexShrink:0 }}>
                    {label}
                  </button>
                ))}
              </div>
              <textarea ref={bodyRef} value={body}
                onChange={e => setBody(e.target.value)}
                onBlur={saveBody}
                placeholder="Add notes, details, links…"
                autoFocus
                style={{ display:"block", width:"100%", minHeight:140, background:C.input,
                  border:`1px solid ${C.accent}55`, borderRadius:10, padding:"10px 12px",
                  fontSize:14, color:C.text, fontFamily:"inherit", resize:"none",
                  outline:"none", lineHeight:1.6, boxSizing:"border-box" as const }}
                rows={6}
              />
              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                <button onClick={saveBody}
                  style={{ fontSize:12, background:C.accent, border:"none", color:"#fff",
                    cursor:"pointer", padding:"6px 16px", borderRadius:8, fontFamily:"inherit", fontWeight:600 }}>
                  Done
                </button>
                <button onClick={() => { setBody(entry.body||""); setEditingBody(false); }}
                  style={{ fontSize:12, background:"none", border:`1px solid ${C.border}`,
                    color:C.dim, cursor:"pointer", padding:"6px 16px", borderRadius:8, fontFamily:"inherit" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditingBody(true)} style={{ marginBottom:16, cursor:"text", minHeight:60 }}>
              {body ? (
                <BodyDisplay text={body} C={C} />
              ) : (
                <div style={{ fontSize:14, color:C.dimmer, fontStyle:"italic", padding:"4px 0" }}>
                  Tap to add notes…
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {showPhotos && (entry.images||[]).length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.dim, textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:8 }}>Photos</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {(entry.images||[]).map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width:80, height:80, borderRadius:10, objectFit:"cover",
                      border:`1px solid ${C.border}` }} />
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {showComments && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.dim, textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:8 }}>Comments</div>
              {(entry.comments||[]).length === 0 && (
                <div style={{ fontSize:13, color:C.dimmer, fontStyle:"italic", marginBottom:8 }}>No comments yet.</div>
              )}
              {(entry.comments||[]).map(c => (
                <div key={c.id} style={{ padding:"8px 12px", background:C.surface, borderRadius:10,
                  marginBottom:6, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{c.text}</div>
                  <div style={{ fontSize:10, color:C.dimmer, marginTop:3 }}>
                    {c.createdAt instanceof Date ? c.createdAt.toLocaleDateString() : ""}
                  </div>
                </div>
              ))}
              {/* Comment input */}
              <div style={{ display:"flex", gap:8, marginTop:6 }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && commentText.trim()) {
                      onAddComment(commentText.trim());
                      setCommentText("");
                    }
                  }}
                  placeholder="Add comment… (Enter to post)"
                  style={{ flex:1, background:C.input, border:`1px solid ${C.border}`, borderRadius:10,
                    padding:"9px 12px", fontSize:13, color:C.text, fontFamily:"inherit",
                    outline:"none" }} />
                <button
                  onClick={() => { if (commentText.trim()) { onAddComment(commentText.trim()); setCommentText(""); }}}
                  style={{ width:38, height:38, borderRadius:10, background:C.accent, border:"none",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Bottom padding */}
          <div style={{ height:24 }} />
        </div>

        {/* ─── Bottom toolbar ─── */}
        <div style={{
          flexShrink:0, borderTop:`1px solid ${C.border}`,
          padding:"8px 8px", paddingBottom:"max(10px, env(safe-area-inset-bottom))",
          display:"flex", alignItems:"center", background: C.card,
        }}>
          <input ref={photoRef} type="file" accept="image/*" capture="environment"
            style={{ display:"none" }} onChange={photoHandler} />

          <ToolBtn onClick={onAiTitle} label="✨" title="Generate AI title" active={aiTitling} accent={C.accent} C={C} />
          <ToolBtn
            onClick={() => { setShowPhotos(true); photoRef.current?.click(); }}
            label="📷" title="Add photo"
            badge={(entry.images||[]).length}
            active={showPhotos && (entry.images||[]).length > 0}
            C={C}
          />
          <ToolBtn
            onClick={() => setShowComments(p => !p)}
            label="💬" title="Comments"
            badge={(entry.comments||[]).length}
            active={showComments}
            C={C}
          />

          <div style={{ flex:1 }} />

          <ToolBtn onClick={() => { onDelete(); onClose(); }} label="🗑" title="Delete" danger C={C} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
