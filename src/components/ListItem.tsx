import React, { useRef, useEffect } from 'react';
import { Tick } from "./Tick";

export function ListItem({
  item, listColor, isEditing, editText,
  onEditChange, onEditSave, onEditCancel, onStartEdit,
  onToggle, onDelete,
  noteOpen, noteText, onNoteOpen, onNoteChange, onNoteSave, onNoteClose,
  isDragOver, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  C, isMobile, onEmojiChange,
}: any) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus(); }, [isEditing]);

  return (
    <div
      style={{
        marginBottom: 4,
        outline: isDragOver ? `2px dashed ${C.accent}` : "none",
        borderRadius: 8,
        transition: "outline .08s",
        position: "relative",
        overflow: "hidden",
      }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Mobile swipe-to-delete reveal */}
      {isMobile && (
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:60,
                      background:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:16, color:"#fff" }}>🗑</span>
        </div>
      )}

      <div
        onTouchStart={e => {
          if (!isMobile) return;
          (e.currentTarget as any)._swipeStartX = e.touches[0].clientX;
          (e.currentTarget as any)._swipeStartY = e.touches[0].clientY;
          (e.currentTarget as any)._swipeDx     = 0;
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
            e.currentTarget.style.transform  = `translateX(${Math.max(-65, Math.min(0, dx))}px)`;
            e.currentTarget.style.transition = "none";
          }
        }}
        onTouchEnd={e => {
          if (!isMobile) return;
          const dx = (e.currentTarget as any)._swipeDx || 0;
          e.currentTarget.style.transition = "transform .2s ease";
          e.currentTarget.style.transform  = "translateX(0)";
          (e.currentTarget as any)._swipeDx = 0;
          if (dx < -50) onDelete();
        }}
        style={{
          display:"flex", alignItems:"flex-start", gap:9, padding:"8px 10px",
          background: item.done ? "transparent" : C.surface,
          borderRadius: 8,
          border:`1px solid ${C.border}`,
          opacity: item.done ? 0.55 : 1,
          transition:"all .15s",
          position:"relative", zIndex:1,
        }}
      >
        {/* Drag handle */}
        <span
          title="Drag to reorder"
          style={{ fontSize:11, color: C.dimmer, cursor:"grab", flexShrink:0,
                   marginTop:2, lineHeight:1.5, userSelect:"none" as const, opacity:.5 }}>
          ⠿
        </span>

        {/* Checkbox */}
        <button
          onClick={onToggle}
          style={{
            width:18, height:18, borderRadius:5,
            border: item.done ? "none" : `1.5px solid #475569`,
            background: item.done ? listColor : "transparent",
            cursor:"pointer", flexShrink:0, padding:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            marginTop:1, transition:"all .15s",
          }}>
          {item.done && (
            <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
              <path d="M1 3.5L3.8 6.5L9 1" stroke="white" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {isEditing ? (
            <div>
              {/* Edit: text + emoji inline */}
              <div style={{ display:"flex", gap:5, marginBottom:5 }}>
                <input
                  ref={inputRef}
                  value={editText}
                  onChange={e => onEditChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") onEditSave(); if (e.key === "Escape") onEditCancel(); }}
                  style={{ flex:1, background: C.input, border:`1px solid ${C.accent}55`,
                           borderRadius:6, padding:"4px 8px", fontSize:13,
                           color: C.text, fontFamily:"inherit", outline:"none",
                           boxSizing:"border-box" as const }}
                />
                <input
                  value={item.emoji || ""}
                  onChange={e => onEmojiChange(e.target.value.trim())}
                  placeholder="Emoji"
                  style={{ width:45, background: C.input, border:`1px solid ${C.border}`,
                           borderRadius:6, padding:"4px", textAlign:"center", fontSize:13,
                           color: C.text, fontFamily:"inherit", outline:"none" }}
                />
              </div>
              {/* Emoji picker */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                {[
                  "✅","🚀","💡","📅","🔥","⭐","📌","📝","🛒","✈️","🎬","🎵","🎮","☕","🐾","🚗",
                  "💰","💪","🎁","🏠","🎨","🎯","❤️","💬","👍","🎉","💯","🙏","🤝","👏","⚠️","🔖",
                  "🇦🇺","🇺🇸","🇬🇧","🇯🇵","🇰🇷","🇨🇳","🇫🇷","🇩🇪","🇮🇹","🇪🇸","🇧🇷","🇨🇦","🇮🇳","🇲🇽","🇿🇦","🇳🇿"
                ].map(emo => (
                  <button
                    key={emo}
                    onClick={() => onEmojiChange(emo)}
                    style={{
                      fontSize:14,
                      background: item.emoji === emo ? `${C.accent}22` : "none",
                      border: item.emoji === emo ? `1px solid ${C.accent}55` : `1px solid ${C.border}`,
                      borderRadius:4, width:26, height:26, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                    {emo}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={onEditSave}
                  style={{ fontSize:11, background: C.accent, border:"none",
                           color:"#fff", cursor:"pointer", padding:"2px 9px",
                           borderRadius:4, fontFamily:"inherit" }}>
                  Save
                </button>
                <button onClick={onEditCancel}
                  style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                           color: C.dim, cursor:"pointer", padding:"2px 9px",
                           borderRadius:4, fontFamily:"inherit" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={onStartEdit}
              title="Click to edit"
              style={{ margin:0, fontSize:13, color: item.done ? C.dim : C.text,
                       textDecoration: item.done ? "line-through" : "none",
                       lineHeight:1.5, cursor:"text", wordBreak:"break-word" }}>
              {item.emoji && <span style={{ marginRight:5 }}>{item.emoji}</span>}
              {item.text}
            </p>
          )}

          {/* Inline note */}
          {noteOpen ? (
            <div style={{ marginTop:6 }}>
              <textarea
                value={noteText}
                onChange={e => onNoteChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") onNoteClose(); }}
                placeholder="Add a note…"
                rows={2}
                style={{ width:"100%", resize:"none", background: C.input,
                         border:`1px solid ${C.border}`, borderRadius:6,
                         padding:"5px 8px", fontSize:12, color: C.text,
                         fontFamily:"inherit", outline:"none",
                         boxSizing:"border-box" as const, marginBottom:4 }}
              />
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={onNoteSave}
                  style={{ fontSize:11, background: C.accent, border:"none",
                           color:"#fff", cursor:"pointer", padding:"2px 9px",
                           borderRadius:4, fontFamily:"inherit" }}>
                  Save
                </button>
                <button onClick={onNoteClose}
                  style={{ fontSize:11, background:"none", border:`1px solid ${C.border}`,
                           color: C.dim, cursor:"pointer", padding:"2px 9px",
                           borderRadius:4, fontFamily:"inherit" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            item.note && (
              <p style={{ margin:"3px 0 0", fontSize:11, color: C.dim,
                          fontStyle:"italic", lineHeight:1.4 }}>
                {item.note}
              </p>
            )
          )}
        </div>

        {/* Action buttons (non-edit mode) */}
        {!isEditing && (
          <div style={{ display:"flex", gap:4, flexShrink:0, opacity:0.5 }}>
            <button onClick={onNoteOpen} title="Add note"
              style={{ background:"none", border:"none", cursor:"pointer",
                       fontSize:12, color: item.note ? listColor : C.border, padding:"1px 3px" }}>
              ✎
            </button>
            <button onClick={onDelete} title="Delete"
              style={{ background:"none", border:"none", cursor:"pointer",
                       fontSize:11, color: C.border, padding:"1px 3px" }}>
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
