import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { TM, PM } from "../constants";
import { Entry } from "../types";


function toISO(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }

function autoSize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/* SVG icons — stroke-based, 18px, matching app style */
const IcoAI = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
);
const IcoCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IcoComment = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

/* Toolbar button */
function ToolBtn({ onClick, icon, label, badge, active, danger, dim, accent }: {
  onClick: () => void; icon: React.ReactNode; label: string;
  badge?: number; active?: boolean; danger?: boolean; dim: string; accent: string;
}) {
  return (
    <button onClick={onClick} title={label}
      style={{
        position:"relative", padding:"10px 14px", borderRadius:10,
        background: active ? `${accent}18` : "none",
        border:"none", cursor:"pointer",
        color: danger ? "#ef4444" : active ? accent : dim,
        display:"flex", flexDirection:"column", alignItems:"center", gap:3,
        transition:"background .12s", flexShrink:0,
      }}>
      {icon}
      <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1 }}>
        {label}
      </span>
      {!!badge && badge > 0 && (
        <span style={{ position:"absolute", top:6, right:8, minWidth:16, height:16, borderRadius:8,
          background: accent, color:"#fff", fontSize:9, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
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
  const [kbOffset,     setKbOffset]     = useState(0);
  const [sheetMaxH,    setSheetMaxH]    = useState(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    return vv ? vv.height - 70 : window.innerHeight - 120;
  });

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef  = useRef<HTMLTextAreaElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync if entry updates externally (e.g. AI Title result comes in)
  useEffect(() => { setTitle(entry.text); },      [entry.text]);
  useEffect(() => { setBody(entry.body || ""); }, [entry.body]);
  useEffect(() => { autoSize(titleRef.current); }, [title]);

  // Visual viewport — lift sheet above keyboard and track height
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const update = () => {
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(kh);
      setSheetMaxH(vv.height - 70);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  // Focus body textarea without scrolling after spring animation settles
  useEffect(() => {
    const id = setTimeout(() => {
      bodyRef.current?.focus({ preventScroll: true });
    }, 350);
    return () => clearTimeout(id);
  }, []);


  // Escape key → close sheet
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSheet(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveTitle = () => {
    const t = title.trim();
    if (t && t !== entry.text) onUpdate({ text: t });
  };
  const saveBody = () => {
    if (body !== (entry.body || "")) onUpdate({ body });
  };
  const closeSheet = () => { saveTitle(); saveBody(); onClose(); };

  const meta  = (TM as any)[entry.type];
  const pmeta = (PM as any)[entry.priority];
  const overdue = entry.dueDate && !entry.done && new Date(entry.dueDate + "T00:00") < new Date();
  const types: Array<"task"|"event"|"note"|"thought"> = ["task","event","note","thought"];
  const priorities: Array<"low"|"medium"|"high"> = ["low","medium","high"];
  const isTaskOrEvent = entry.type === "task" || entry.type === "event";

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

  /* Chip style helpers */
  const chipBase: React.CSSProperties = {
    padding:"4px 10px", borderRadius:20, fontSize:10, fontWeight:800,
    textTransform:"uppercase", letterSpacing:"0.07em",
    cursor:"pointer", fontFamily:"inherit", flexShrink:0,
    display:"inline-flex", alignItems:"center", gap:4, lineHeight:1,
    whiteSpace:"nowrap",
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div key="backdrop"
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        transition={{ duration:.2 }}
        onClick={closeSheet}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:900, backdropFilter:"blur(2px)" }}
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
          position:"fixed",
          bottom: kbOffset,
          left:0, right:0,
          height: sheetMaxH,
          background: C.surface,
          borderRadius:"20px 20px 0 0",
          zIndex:901,
          display:"flex", flexDirection:"column",
          overflow:"hidden",
          boxShadow:"0 -4px 32px rgba(0,0,0,0.5)",
        }}>

        {/* Drag handle — generous breathing room */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:14, paddingBottom:10, flexShrink:0, cursor:"grab" }}>
          <div style={{ width:36, height:4, borderRadius:2, background: C.border }} />
        </div>

        {/* Title row: textarea + done toggle + close */}
        <div style={{ display:"flex", alignItems:"flex-start", padding:"0 14px 10px", gap:8, flexShrink:0 }}>
          <textarea ref={titleRef} data-entry-title value={title}
            onChange={e => { setTitle(e.target.value); autoSize(e.target); }}
            onBlur={saveTitle}
            placeholder="Title…"
            style={{
              flex:1, background:"transparent", border:"none", outline:"none",
              fontSize:20, fontWeight:700, lineHeight:1.3,
              color: entry.done ? C.dimmer : C.text,
              textDecoration: entry.done ? "line-through" : "none",
              fontFamily:"inherit", resize:"none", padding:0,
              boxSizing:"border-box" as const, overflow:"hidden",
            }}
            rows={1}
          />
          {/* Done toggle — only for tasks and events */}
          {isTaskOrEvent && (
            <button onClick={onToggleDone}
              style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, marginTop:4,
                border:`2px solid ${entry.done ? "#10b981" : C.border}`,
                background: entry.done ? "#10b981" : "transparent",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .15s" }}>
              {entry.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
            </button>
          )}
          {/* Close */}
          <button onClick={closeSheet}
            style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, marginTop:4,
              background: C.bg, border:`1px solid ${C.border}`,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              color: C.dim }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Single condensed chip row: type + priority + due + tags + contexts */}
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"0 14px 10px",
          overflowX:"auto", flexShrink:0, flexWrap:"nowrap" as any,
          /* hide scrollbar but keep scrollability */
          msOverflowStyle:"none", scrollbarWidth:"none" as any,
        }}>
          {/* Type chip */}
          <button onClick={() => onUpdate({ type: types[(types.indexOf(entry.type as any)+1)%4] })}
            style={{ ...chipBase, background:`${meta.color}22`, color:meta.color, border:`1px solid ${meta.color}44` }}>
            {meta.label}
          </button>

          {/* Priority chip */}
          <button onClick={() => onUpdate({ priority: priorities[(priorities.indexOf(entry.priority)+1)%3] })}
            style={{ ...chipBase, background:`${pmeta.color}22`, color:pmeta.color, border:`1px solid ${pmeta.color}44` }}>
            {entry.priority}
          </button>

          {/* Due date chip — tasks and events only */}
          {isTaskOrEvent && (
            <button onClick={() => setShowDue(p => !p)}
              style={{ ...chipBase, fontWeight:700,
                background: overdue ? "#ef444418" : entry.dueDate ? C.bg : "none",
                color: overdue ? "#ef4444" : entry.dueDate ? C.muted : C.dimmer,
                border:`1px solid ${overdue ? "#ef444444" : entry.dueDate ? C.border : C.border + "80"}` }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {entry.dueDate || "Due"}{entry.dueTime ? ` · ${formatTime(entry.dueTime)}` : ""}
            </button>
          )}

          {/* Tag pills — tap × to remove */}
          {(entry.tags||[]).map(tag => (
            <span key={tag} style={{ ...chipBase, background:`${C.accent}22`, color:C.accent,
              border:`1px solid ${C.accent}33`, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
              #{tag.startsWith("#") ? tag.slice(1) : tag}
              <button onClick={() => {
                const rx = new RegExp('(?:^|\s)#' + (tag.startsWith("#") ? tag.slice(1) : tag) + '(?=\s|$)', 'g');
                onUpdate({ text: entry.text.replace(rx, '').replace(/\s{2,}/g,' ').trim() });
              }} style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", opacity:.6,
                          padding:0, lineHeight:1, fontSize:10, marginLeft:1 }}>✕</button>
            </span>
          ))}

          {/* Context pills — tap × to remove */}
          {(entry.contexts||[]).map(ctx => (
            <span key={ctx} style={{ ...chipBase, background: C.bg, color:C.dim,
              border:`1px solid ${C.border}`, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
              @{ctx.startsWith("@") ? ctx.slice(1) : ctx}
              <button onClick={() => {
                const rx = new RegExp('(?:^|\s)@' + (ctx.startsWith("@") ? ctx.slice(1) : ctx) + '(?=\s|$)', 'g');
                onUpdate({ text: entry.text.replace(rx, '').replace(/\s{2,}/g,' ').trim() });
              }} style={{ background:"none", border:"none", cursor:"pointer", color:"inherit", opacity:.6,
                          padding:0, lineHeight:1, fontSize:10, marginLeft:1 }}>✕</button>
            </span>
          ))}

          {/* Add tag / context buttons */}
          <button
            onClick={() => {
              const ta = document.querySelector('[data-entry-title]') as HTMLTextAreaElement | null;
              if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
              onUpdate({ text: entry.text + ' #' });
            }}
            style={{ ...chipBase, background:"none", border:`1px dashed ${C.border}`,
                     color: C.dimmer, cursor:"pointer" }}>
            + #tag
          </button>
          <button
            onClick={() => {
              const ta = document.querySelector('[data-entry-title]') as HTMLTextAreaElement | null;
              if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
              onUpdate({ text: entry.text + ' @' });
            }}
            style={{ ...chipBase, background:"none", border:`1px dashed ${C.border}`,
                     color: C.dimmer, cursor:"pointer" }}>
            + @ctx
          </button>
        </div>

        {/* Due date picker — expandable below chip row */}
        <AnimatePresence>
          {showDue && (
            <motion.div key="due"
              initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
              transition={{ duration:.18 }} style={{ overflow:"hidden", flexShrink:0 }}>
              <div style={{ padding:"0 14px 10px" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                  {dueDateShortcuts.map(s => (
                    <button key={s.label}
                      onClick={() => { onUpdate({ dueDate: s.value }); setShowDue(false); }}
                      style={{ padding:"5px 11px", borderRadius:8, fontSize:11, fontWeight:600,
                        background: entry.dueDate === s.value ? C.accent : C.bg,
                        color: entry.dueDate === s.value ? "#fff" : C.dim,
                        border:`1px solid ${C.border}`, cursor:"pointer", fontFamily:"inherit" }}>
                      {s.label}
                    </button>
                  ))}
                  {entry.dueDate && (
                    <button onClick={() => { onUpdate({ dueDate: undefined }); setShowDue(false); }}
                      style={{ padding:"5px 11px", borderRadius:8, fontSize:11, fontWeight:600,
                        background:"none", color:"#ef4444", border:"1px solid #ef444433", cursor:"pointer", fontFamily:"inherit" }}>
                      Clear
                    </button>
                  )}
                </div>
                <input type="date" value={entry.dueDate || ""}
                  onChange={e => { onUpdate({ dueDate: e.target.value || undefined }); setShowDue(false); }}
                  style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"7px 10px", fontSize:12, color:C.text, fontFamily:"inherit",
                    width:"100%", boxSizing:"border-box" as const, outline:"none" }} />
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
                  <span style={{ fontSize:11, color:C.dim, flexShrink:0 }}>Time</span>
                  <input type="time" value={entry.dueTime || ""}
                    onChange={e => onUpdate({ dueTime: e.target.value || undefined })}
                    style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:8,
                      padding:"6px 10px", fontSize:12, color:C.text, fontFamily:"inherit",
                      outline:"none" }} />
                  {entry.dueTime && (
                    <button onClick={() => onUpdate({ dueTime: undefined })}
                      style={{ fontSize:11, color:"#ef4444", background:"none", border:`1px solid #ef444433`,
                               borderRadius:6, padding:"4px 8px", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thin divider */}
        <div style={{ height:1, background: C.border, marginBottom:0, opacity:.35, flexShrink:0 }} />

        {/* ─── Scrollable body ─── */}
        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

          {/* Formatting toolbar */}
          <div style={{ display:"flex", gap:4, padding:"8px 14px 6px", flexWrap:"wrap", flexShrink:0 }}>
            {([["B","**","**"],["I","_","_"],["•","\n- ",""],["☑","\n- [ ] ",""],["H","## ",""]] as [string,string,string][]).map(([label, prefix, suffix]) => (
              <button key={label} type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  const ta = bodyRef.current;
                  if (!ta) return;
                  const s = ta.selectionStart, en = ta.selectionEnd;
                  const sel = body.slice(s, en);
                  setBody(body.slice(0,s) + prefix + sel + suffix + body.slice(en));
                  setTimeout(() => {
                    if (bodyRef.current) {
                      bodyRef.current.focus();
                      bodyRef.current.setSelectionRange(s+prefix.length+sel.length, s+prefix.length+sel.length);
                    }
                  }, 0);
                }}
                style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:4,
                  color:C.dim, cursor:"pointer", padding:"3px 9px", fontSize:11,
                  fontWeight:700, fontFamily:"monospace", lineHeight:1.6, flexShrink:0 }}>
                {label}
              </button>
            ))}
          </div>

          {/* Body textarea — fills remaining space, always editable */}
          <textarea ref={bodyRef} value={body}
            onChange={e => setBody(e.target.value)}
            onBlur={saveBody}
            placeholder="Add notes, details, links… tap anywhere here"
            style={{ display:"block", flex:1, minHeight:100,
              background:"transparent",
              border:"none", outline:"none",
              padding:"4px 14px 12px",
              fontSize:14, color:C.text, fontFamily:"inherit", resize:"none",
              lineHeight:1.65, boxSizing:"border-box" as const,
              cursor:"text",
            }}
          />

          {/* Photos */}
          {showPhotos && (entry.images||[]).length > 0 && (
            <div style={{ padding:"0 14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.dim, textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:8 }}>Photos</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {(entry.images||[]).map((img, i) => (
                  <img key={i} src={img} alt=""
                    style={{ width:76, height:76, borderRadius:10, objectFit:"cover", border:`1px solid ${C.border}` }} />
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {showComments && (
            <div style={{ padding:"0 14px 16px" }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.dim, textTransform:"uppercase",
                letterSpacing:"0.08em", marginBottom:8 }}>Comments</div>
              {(entry.comments||[]).length === 0 && (
                <div style={{ fontSize:13, color:C.dimmer, fontStyle:"italic", marginBottom:8 }}>No comments yet.</div>
              )}
              {(entry.comments||[]).map(c => (
                <div key={c.id} style={{ padding:"8px 11px", background:C.bg, borderRadius:10,
                  marginBottom:6, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>{c.text}</div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:6 }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && commentText.trim()) {
                      onAddComment(commentText.trim()); setCommentText("");
                    }
                  }}
                  placeholder="Add comment…"
                  style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:10,
                    padding:"9px 12px", fontSize:13, color:C.text, fontFamily:"inherit", outline:"none" }} />
                <button
                  onClick={() => { if (commentText.trim()) { onAddComment(commentText.trim()); setCommentText(""); }}}
                  style={{ width:38, height:38, borderRadius:10, background:C.accent, border:"none",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          )}

          <div style={{ height:16 }} />
        </div>

        {/* ─── Bottom toolbar ─── */}
        <div style={{
          flexShrink:0,
          borderTop:`1px solid ${C.border}`,
          padding:"4px 4px",
          paddingBottom:`max(8px, env(safe-area-inset-bottom))`,
          display:"flex", alignItems:"center", background: C.surface,
        }}>
          <input ref={photoRef} type="file" accept="image/*" capture="environment"
            style={{ display:"none" }} onChange={photoHandler} />

          <ToolBtn onClick={onAiTitle} icon={<IcoAI/>} label="AI Title"
            active={aiTitling} dim={C.dim} accent={C.accent} />
          <ToolBtn
            onClick={() => { setShowPhotos(true); photoRef.current?.click(); }}
            icon={<IcoCamera/>} label="Photo"
            badge={(entry.images||[]).length}
            active={showPhotos && (entry.images||[]).length > 0}
            dim={C.dim} accent={C.accent}
          />
          <ToolBtn
            onClick={() => setShowComments(p => !p)}
            icon={<IcoComment/>} label="Comments"
            badge={(entry.comments||[]).length}
            active={showComments}
            dim={C.dim} accent={C.accent}
          />

          <div style={{ flex:1 }} />

          <ToolBtn onClick={() => { onDelete(); onClose(); }}
            icon={<IcoTrash/>} label="Delete" danger dim={C.dim} accent={C.accent} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
