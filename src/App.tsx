import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TM, TYPES, PM, FONTS, LIST_COLORS, LIST_ICONS, LIST_TEMPLATES, TIKKY_VERSION 
} from "./constants";
import { CHANGELOG, THEMES } from "./changelog";
import { SEED, SEED_LISTS } from "./seeds";
import { Entry, List, ListItemType, Prefs, Subtask, Comment, Priority } from "./types";
import { 
  analyze, cleanText, extractDue, extractEventTime, resolveDueDate, isOverdue, relDueLabel, extractTags, extractContexts, guessEmoji, findUpdateTarget
} from "./utils/nlp";
import { fmt, inPeriod, tagColor, renderMd } from "./utils/format";
import { classifyEntry, queryAssistant } from "./api";

// Components
import { Tick } from "./components/Tick";
import { TypeBadge } from "./components/TypeBadge";
import { TagPill } from "./components/TagPill";
import { Highlight } from "./components/Highlight";
import { StreamCard } from "./components/StreamCard";
import { DashboardCard } from "./components/DashboardCard";
import { ListItem } from "./components/ListItem";
import { SumItem, SumSection } from "./components/Summary";

const loadPrefs = (): Prefs => { try { return JSON.parse(localStorage.getItem("tikky_prefs") || "{}"); } catch(_) { return {}; } };

const C_BASE = { bg:"#111111", surface:"#1c1c1c", border:"#2c2c2c", text:"#f0f0f0", muted:"#a0a0a0", dim:"#707070", dimmer:"#4a4a4a", accent:"#6366f1", input:"#0a0a0a" };

const changelog = CHANGELOG;

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const raw = localStorage.getItem("tikky_entries");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
          subtasks:  e.subtasks  || [],
          comments:  (e.comments || []).map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })),
          tags:      e.tags     || [],
          contexts:  e.contexts || [],
          images:    e.images   || [],
          pinned:    e.pinned   || false,
        }));
      }
    } catch(_) {}
    return SEED;
  });

  const [input,      setInput]      = useState("");
  const [dashTab,    setDashTab]    = useState("all");
  const [view,       setView]       = useState("main");
  const [primaryTab, setPrimaryTab] = useState<"stream" | "lists" | "insights" | "settings">("stream");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileCompose, setShowMobileCompose] = useState(false);
  const [sumPeriod,  setSumPeriod]  = useState("all");
  const [preview,    setPreview]    = useState<any>(null);
  const [search,     setSearch]     = useState("");
  const [filterTag,  setFilterTag]  = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [editText,   setEditText]   = useState("");
  const [editingBodyId, setEditingBodyId] = useState<number | null>(null);
  const [bodyInput,    setBodyInput]    = useState("");
  const [aiTitlingId,  setAiTitlingId]  = useState<number | null>(null);
  const [expanded,     setExpanded]     = useState<number | null>(null);
  const [dashExpanded, setDashExpanded] = useState<number | null>(null);
  const [stInputs,   setStInputs]   = useState<Record<number, string>>({});
  const [modal,      setModal]      = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [copied,     setCopied]     = useState(false);

  const [theme, setTheme] = useState(() => loadPrefs().theme || "midnight");
  const [spaceFilter,    setSpaceFilter]    = useState("all");
  const [accentOverride, setAccentOverride] = useState(() => loadPrefs().accent || null);
  const [fontFamily,     setFontFamily]     = useState(() => loadPrefs().font    || "inter");
  const [fontScale,      setFontScale]      = useState(() => loadPrefs().scale || 1.0);
  const [bgPreset,       setBgPreset]       = useState(() => loadPrefs().bgPreset || "none");
  const [bgImage,        setBgImage]        = useState(() => { try { return localStorage.getItem("tikky_bgimage") || null; } catch(_) { return null; } });
  const [bgOpacity,      setBgOpacity]      = useState(() => loadPrefs().bgOpacity || 0.12);

  const [trash,           setTrash]          = useState<Entry[]>([]);
  const [commentTrash,    setCommentTrash]    = useState<any>(null);
  const [selectedListId,  setSelectedListId]  = useState<number | null>(null);
  const [listTrash,       setListTrash]       = useState<any>(null);
  const [undoMsg,         setUndoMsg]         = useState<string | null>(null);
  const [toggleUndo,      setToggleUndo]      = useState<{ id: number, prev: boolean } | null>(null);
  const [commentInputs,   setCommentInputs]   = useState<Record<number, string>>({});
  const [editingComment,  setEditingComment]  = useState<any>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editingDueDate,  setEditingDueDate]  = useState<number | null>(null);
  const [dueDateInput,    setDueDateInput]    = useState("");

  const [streamSort,    setStreamSort]    = useState(() => loadPrefs().streamSort || "newest");
  const [compactView,   setCompactView]   = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [typeFilter,    setTypeFilter]    = useState<string | null>(null);
  const [dueFilter,     setDueFilter]     = useState<string | null>(null);
  const [groupBy,       setGroupBy]       = useState<string | null>(null);
  const [selectMode,    setSelectMode]    = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set<number>());
  const [streamOrder,      setStreamOrder]      = useState<number[]>(() => { try { const r = localStorage.getItem("tikky_stream_order"); return r ? JSON.parse(r) : []; } catch(_) { return []; } });
  const [dragEntryId,      setDragEntryId]      = useState<number | null>(null);
  const [dragOverEntryId,  setDragOverEntryId]  = useState<number | null>(null);
  const [dragItemId,       setDragItemId]       = useState<number | null>(null);
  const [dragOverItemId,   setDragOverItemId]   = useState<number | null>(null);

  const [dueDateAlerts,   setDueDateAlerts]   = useState<Entry[]>([]);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const [savedFilters,    setSavedFilters]    = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("tikky_saved_filters") || "[]"); } catch(_) { return []; }
  });

  const [collapsedSecs, setCollapsedSecs] = useState(new Set(["whats-new","roadmap","shipped"]));
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [semanticResponse, setSemanticResponse] = useState<string | null>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime,   setPomodoroTime]   = useState(25 * 60);
  const [pomodoroMode,   setPomodoroMode]   = useState<"work" | "break">("work");
  const [focusMode,      setFocusMode]      = useState(false);
  const [focusSetup,     setFocusSetup]     = useState(true);
  const [focusTaskIds,   setFocusTaskIds]   = useState<Set<number>>(new Set());
  const [celebration,    setCelebration]    = useState(false);
  const [lightboxImg,    setLightboxImg]    = useState<string | null>(null);

  const roadmap = [
    { icon: "📅", label: "Calendar View", desc: "Full-screen interactive calendar to manage events and deadlines visually." },
    { icon: "🔖", label: "Smart Templates", desc: "Create reusable blueprints for recurring tasks, meetings, or daily logs." },
    { icon: "🔔", label: "Native Notifications", desc: "Desktop and mobile push alerts for time-sensitive events and reminders." },
    { icon: "☁️", label: "Cloud Sync", desc: "Seamlessly sync your stream across all your devices with end-to-end encryption." },
    { icon: "🎙️", label: "Voice-to-Entry", desc: "Dictate thoughts and tasks on the go with automatic NLP parsing." },
    { icon: "👥", label: "Collaboration", desc: "Share lists and streams with others for real-time teamwork." },
    { icon: "📱", label: "Native Apps", desc: "Dedicated iOS and Android apps for the best mobile experience." },
    { icon: "🔌", label: "API & Webhooks", desc: "Connect Tikky to your favorite tools and automate your workflow." },
  ];

  const shipped = [
    { label: "Insights Dashboard", desc: "Live productivity metrics and streak tracking." },
    { label: "Markdown Engine", desc: "Rich text formatting with search highlighting." },
    { label: "Smart Filters", desc: "Saved combinations for rapid context switching." },
    { label: "Bulk Operations", desc: "Multi-select actions for stream management." },
    { label: "NLP Parser", desc: "Automatic extraction of dates, tags, and contexts." },
    { label: "Themes & Customization", desc: "Deep UI personalization with fonts and backgrounds." },
    { label: "Undo/Redo", desc: "Safety net for deletions and major changes." },
    { label: "Subtasks & Comments", desc: "Break down tasks and keep logs of progress." },
  ];

  const [lists, setLists] = useState<List[]>(() => {
    try {
      const raw = localStorage.getItem("tikky_lists");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          items: (l.items || []).map((i: any) => ({ ...i, addedAt: new Date(i.addedAt) })),
        }));
      }
    } catch(_) {}
    return SEED_LISTS;
  });
  const [activeListId,  setActiveListId]  = useState<number | null>(SEED_LISTS[0].id);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const playSound = (type: 'ding' | 'bell') => {
    try {
      const url = type === 'ding' 
        ? "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        : "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
      const audio = new Audio(url);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch(_) {}
  };

  useEffect(() => {
    let timer: any;
    if (pomodoroActive && pomodoroTime > 0) {
      timer = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0 && pomodoroActive) {
      setPomodoroActive(false);
      playSound('bell');
      if (pomodoroMode === "work") {
        setPomodoroMode("break");
        setPomodoroTime(5 * 60);
      } else {
        setPomodoroMode("work");
        setPomodoroTime(25 * 60);
      }
    }
    return () => clearInterval(timer);
  }, [pomodoroActive, pomodoroTime, pomodoroMode]);

  const onAddPhoto = (entryId?: number) => {
    addPhotoEntryIdRef.current = entryId || null;
    photoInputRef.current?.click();
  };
  const [listItemInput, setListItemInput] = useState("");
  const [editItemText,  setEditItemText]  = useState("");
  const [noteFor,       setNoteFor]       = useState<any>(null);
  const [noteText,      setNoteText]      = useState("");
  const [showNewList,   setShowNewList]   = useState(false);
  const [listHover,     setListHover]     = useState<number | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newListName,   setNewListName]   = useState("");
  const [newListIcon,   setNewListIcon]   = useState("📋");
  const [newListColor,  setNewListColor]  = useState(LIST_COLORS[0]);
  const [listSearch,    setListSearch]    = useState("");
  const [editingListItemId, setEditingListItemId] = useState<number | null>(null);
  const [editListItemText,  setEditListItemText]  = useState("");

  const [acType,        setAcType]        = useState<"tag" | "context" | null>(null);
  const [acQuery,       setAcQuery]       = useState("");
  const [acIndex,       setAcIndex]       = useState(0);
  const [acPos,         setAcPos]         = useState({ top: 0, left: 0 });

  const allTags = useMemo(() => [...new Set(entries.flatMap(e => e.tags))].sort(), [entries]);
  const allContexts = useMemo(() => [...new Set(entries.flatMap(e => e.contexts))].sort(), [entries]);

  const acOptions = useMemo(() => {
    if (!acType) return [];
    const pool = acType === "tag" ? allTags : allContexts;
    return pool.filter(x => x.toLowerCase().includes(acQuery.toLowerCase())).slice(0, 5);
  }, [acType, acQuery, allTags, allContexts]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const val = input;
    const pos = el.selectionStart || 0;
    const before = val.slice(0, pos);
    const lastWord = before.split(/\s+/).pop() || "";
    
    if (lastWord.startsWith("#")) {
      setAcType("tag");
      setAcQuery(lastWord.slice(1));
      setAcIndex(0);
      const { top, left } = getCaretCoordinates(el, pos);
      setAcPos({ top: top + 20, left });
    } else if (lastWord.startsWith("@")) {
      setAcType("context");
      setAcQuery(lastWord.slice(1));
      setAcIndex(0);
      const { top, left } = getCaretCoordinates(el, pos);
      setAcPos({ top: top + 20, left });
    } else {
      setAcType(null);
    }
  }, [input]);

  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const { offsetLeft: left, offsetTop: top } = element;
    return { top, left }; // Simplified for now, real caret tracking is complex
  };

  const handleAcSelect = (val: string) => {
    if (!val) { setAcType(null); return; }
    const el = inputRef.current;
    if (!el) return;
    const pos = el.selectionStart || 0;
    const before = input.slice(0, pos);
    const after = input.slice(pos);
    const words = before.split(/\s+/);
    words[words.length - 1] = (acType === "tag" ? "#" : "@") + val;
    const newBefore = words.join(" ");
    setInput(newBefore + " " + after);
    setAcType(null);
    setTimeout(() => el.focus(), 0);
  };
  const [mobileTab,     setMobileTab]     = useState("stream");
  const [showCompose,   setShowCompose]   = useState(false);
  const [composeImages, setComposeImages] = useState<string[]>([]);
  const [isListening,   setIsListening]   = useState(false);
  const [isDragOver,    setIsDragOver]    = useState(false);
  const [voiceError,    setVoiceError]    = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const streamEndRef  = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const editRef       = useRef<HTMLTextAreaElement>(null);
  const photoInputRef        = useRef<HTMLInputElement>(null);
  const bgFileRef    = useRef<HTMLInputElement>(null);
  const recognitionRef       = useRef<any>(null);
  const addPhotoEntryIdRef   = useRef<number | null>(null);
  const prevEntryCountRef    = useRef(0);
  const trashTimerRef = useRef<any>(null);

  const C = useMemo(() => {
    const resolvedId = theme === "auto" ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "light") : theme;
    const t = THEMES.find(x => x.id === resolvedId);
    const colors = t?.colors ? { ...t.colors } : { ...C_BASE };
    if (accentOverride) colors.accent = accentOverride;
    return colors;
  }, [theme, accentOverride]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
      if (e.key === "n") { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") {
        if (modal)              { setModal(null); return; }
        if (view !== "main")    { setView("main"); return; }
        if (focusMode)          { setFocusMode(false); setFocusSetup(true); return; }
        if (expanded !== null)  { setExpanded(null); return; }
        if (editingDueDate)     { setEditingDueDate(null); return; }
        if (dueFilter)          { setDueFilter(null); return; }
        if (typeFilter)         { setTypeFilter(null); return; }
        if (filterTag)          { setFilterTag(null); return; }
        if (search)             { setSearch(""); return; }
        if (spaceFilter !== "all") { setSpaceFilter("all"); return; }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dueFilter, typeFilter, filterTag, search, spaceFilter, modal, focusMode, expanded, editingDueDate, view]);

  // Clear drag-over indicator if drag ends outside a drop zone
  useEffect(() => {
    const clear = () => { setDragEntryId(null); setDragOverEntryId(null); };
    window.addEventListener("dragend", clear);
    return () => window.removeEventListener("dragend", clear);
  }, []);

  // Duplicate resize listener removed — handled by the effect near isMobile initialisation.

  useEffect(() => {
    if (entries.length > prevEntryCountRef.current && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevEntryCountRef.current = entries.length;
  }, [entries]);

  useEffect(() => {
    if (input.length > 4 && !input.startsWith("/")) setPreview(analyze(input));
    else setPreview(null);
  }, [input]);

  useEffect(() => {
    try {
      localStorage.setItem("tikky_entries", JSON.stringify(
        entries.map(e => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
          comments:  (e.comments || []).map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
        }))
      ));
    } catch(_) {}
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem("tikky_lists", JSON.stringify(
        lists.map(l => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          items: (l.items || []).map(i => ({ ...i, addedAt: i.addedAt.toISOString() })),
        }))
      ));
    } catch(_) {}
  }, [lists]);

  useEffect(() => {
    try {
      const p: Prefs = { theme, accent: accentOverride || undefined, font: fontFamily, scale: fontScale, bgPreset, bgOpacity, streamSort };
      localStorage.setItem("tikky_prefs", JSON.stringify(p));
      if (bgImage) localStorage.setItem("tikky_bgimage", bgImage);
      else localStorage.removeItem("tikky_bgimage");
    } catch(_) {}
  }, [theme, accentOverride, fontFamily, fontScale, bgPreset, bgImage, bgOpacity, streamSort]);

  useEffect(() => {
    try { localStorage.setItem("tikky_stream_order", JSON.stringify(streamOrder)); } catch(_) {}
  }, [streamOrder]);

  useEffect(() => {
    try { localStorage.setItem("tikky_saved_filters", JSON.stringify(savedFilters)); } catch(_) {}
  }, [savedFilters]);

  useEffect(() => {
    const now = new Date();
    const tod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const alerts = entries.filter(e => {
      if (e.done || !e.dueDate || (e.type !== "task" && e.type !== "event")) return false;
      const r = resolveDueDate(e.dueDate, e.timestamp);
      if (!r) return false;
      return r < new Date(tod.getTime() + 86400000);
    });
    setDueDateAlerts(alerts);
    setAlertsDismissed(false);
  }, [entries]); // Fixed: was [] so alerts never updated after mount

  const up = (id: number, patch: Partial<Entry>) => setEntries(p => p.map(e => e.id === id ? { ...e, ...patch } : e));

  const startUndoTimer = () => {
    if (trashTimerRef.current) clearTimeout(trashTimerRef.current);
    trashTimerRef.current = setTimeout(() => { setTrash([]); setCommentTrash(null); setListTrash(null); setUndoMsg(null); }, 5000);
  };

  const rm = (id: number) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    setEntries(p => p.filter(e => e.id !== id));
    setTrash([entry]); setCommentTrash(null); setToggleUndo(null);
    setUndoMsg(`Deleted: ${entry.text.slice(0, 30)}${entry.text.length > 30 ? "…" : ""}`);
    startUndoTimer();
  };

  const toggleDone = (id: number) => {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    const prev = e.done;
    up(id, { done: !prev });
    if (!prev) {
      setCelebration(true);
      playSound('ding');
      setTimeout(() => setCelebration(false), 800);
    }
    setToggleUndo({ id, prev }); setTrash([]); setCommentTrash(null);
    setUndoMsg(`${!prev ? "Completed" : "Reopened"}: ${e.text.slice(0, 30)}${e.text.length > 30 ? "…" : ""}`);
    startUndoTimer();
  };

  const duplicateEntry = (id: number) => {
    const e = entries.find(x => x.id === id); if (!e) return;
    const newId = Date.now();
    const clone: Entry = { ...e, id: newId, timestamp: new Date(), done: false, pinned: false, comments: [], images: [] };
    setEntries(p => [...p, clone]);
    if (streamSort === "manual") setStreamOrder(prev => [newId, ...prev]);
  };

  const undoDelete = () => {
    if (listTrash) {
      setLists((prev: any) => [...prev, listTrash.list]);
      setActiveListId(listTrash.prevActiveId);
      setListTrash(null); setUndoMsg(null);
      return;
    }
    if (toggleUndo) {
      up(toggleUndo.id, { done: toggleUndo.prev });
      setToggleUndo(null); setUndoMsg(null);
      return;
    }
    if (trash.length > 0) setEntries(p => [...p, ...trash]);
    if (commentTrash) {
      const host = entries.find(e => e.id === commentTrash.entryId);
      if (host) up(commentTrash.entryId, { comments: [...(host.comments||[]), commentTrash.comment].sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime()) });
    }
    setTrash([]); setCommentTrash(null); setUndoMsg(null);
    if (trashTimerRef.current) clearTimeout(trashTimerRef.current);
  };

  const addComment = (entryId: number) => {
    const text = (commentInputs[entryId] || "").trim(); if (!text) return;
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    const newTags     = [...new Set([...entry.tags,     ...extractTags(text)])];
    const newContexts = [...new Set([...entry.contexts, ...extractContexts(text)])];
    up(entryId, {
      comments:  [...(entry.comments || []), { id: Date.now(), text, createdAt: new Date() }],
      tags:      newTags,
      contexts:  newContexts,
    });
    setCommentInputs(p => ({ ...p, [entryId]: "" }));
  };

  const deleteComment = (entryId: number, commentId: number) => {
    const entry = entries.find(e => e.id === entryId);
    const comment = (entry?.comments||[]).find(c => c.id === commentId);
    if (!comment) return;
    up(entryId, { comments: (entry?.comments||[]).filter(c => c.id !== commentId) });
    setCommentTrash({ entryId, comment }); setTrash([]);
    setUndoMsg(`Comment: "${comment.text.slice(0, 44)}${comment.text.length > 44 ? "…" : ""}"`);
    startUndoTimer();
  };

  const addEntry = async () => {
    const text = input.trim();
    const hasImages = composeImages.length > 0;
    if ((!text && !hasImages) || isSubmitting) return;

    // ── Slash commands (sync, no API needed) ─────────────────────────────────
    if (text.startsWith("/")) {
      const parts = text.split(" ");
      const cmd   = parts[0].toLowerCase();
      if (cmd === "/help")    { setView("help");    setInput(""); return; }
      if (cmd === "/summary") { setView("summary"); setSumPeriod(parts[1] || "all"); setInput(""); return; }
      if (cmd === "/export")  { setModal("export"); setInput(""); return; }
      // Type-forcing shortcuts: /task hello, /event lunch, /note idea
      if (["/task","/event","/note","/thought"].includes(cmd) && parts.slice(1).join(" ").trim()) {
        const forced = cmd.slice(1) as "task"|"event"|"note"|"thought";
        const body   = parts.slice(1).join(" ").trim();
        setIsSubmitting(true);
        setInput("");
        const id = Date.now();
        const now = new Date();
        const newEntry: Entry = {
          id, rawText: body, text: body, type: forced,
          priority: "medium", done: false, pinned: false,
          tags: [], contexts: [], subtasks: [], comments: [], images: [],
          timestamp: now, isNew: true,
        };
        setEntries(p => [newEntry, ...p]);
        setTimeout(() => up(id, { isNew: false }), 2000);
        setIsSubmitting(false);
        return;
      }
      if (cmd === "/import")  { setModal("import"); setInput(""); return; }
    }

    // ── Questions / assistant queries → Claude ────────────────────────────────
    // Detected by question words or a trailing "?"
    const isQuery = /^(what|how|why|when|where|who|which|rank|show|list|find|suggest)\b/i.test(text)
                 || text.trim().endsWith("?");
    if (isQuery && text.length > 3) {
      setIsSubmitting(true);
      const aiMsg = await queryAssistant(text, entries);
      if (aiMsg) {
        setSemanticResponse(aiMsg);
      } else {
        // Fallback to local pattern matching
        const local = findUpdateTarget(text, entries);
        if (local?.type === "semantic") setSemanticResponse(local.message);
      }
      setIsSubmitting(false);
      setInput("");
      return;
    }

    // ── Update commands → local matching (fast, no API cost) ─────────────────
    const update = findUpdateTarget(text, entries);
    if (update) {
      if (update.type === "semantic") { setSemanticResponse(update.message); setInput(""); return; }
      if (update.type === "update") {
        up(update.id, update.patch);
        setInput("");
        setTimeout(() => setEntries(prev => prev.map(e => e.id === update.id ? { ...e, updated: false } : e)), 3000);
        return;
      }
    }

    // ── New entry → Claude classifies, local regex as fallback ───────────────
    setIsSubmitting(true);
    let a = analyze(text); // immediate local result used if Claude fails
    const aiResult = await classifyEntry(text);
    if (aiResult) {
      // Claude's classification takes precedence; keep local tag/context extraction
      a = {
        type:     aiResult.type     ?? a.type,
        priority: aiResult.priority ?? a.priority,
        dueDate:  aiResult.dueDate  ?? a.dueDate,
        emoji:    aiResult.emoji    ?? a.emoji,
        tags:     a.tags,
        contexts: a.contexts,
      };
    }
    setIsSubmitting(false);

    const displayText = text ? cleanText(text, a.type) : "📷 Photo";
    const newId = Date.now();
    const newEntry: Entry = {
      id: newId,
      rawText: text || "📷 Photo",
      text: displayText,
      type: a.type,
      priority: a.priority,
      dueDate: a.dueDate,
      emoji: a.emoji || guessEmoji(displayText) || "📝",
      tags: a.tags,
      contexts: a.contexts,
      done: false,
      pinned: false,
      comments: [],
      subtasks: [],
      images: composeImages,
      timestamp: new Date(),
      isNew: true,
    };

    setEntries(p => [...p, newEntry]);
    // Fixed: don't clobber manual sort when user has chosen it
    if (streamSort !== "manual") setStreamSort("newest");
    if (streamSort === "manual") setStreamOrder(prev => [newId, ...prev]);
    setInput("");
    setComposeImages([]);
    if (inputRef.current) inputRef.current.focus();
    setTimeout(() => setEntries(prev => prev.map(e => e.id === newId ? { ...e, isNew: false } : e)), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (addPhotoEntryIdRef.current) {
        const entry = entries.find(x => x.id === addPhotoEntryIdRef.current);
        if (entry) up(entry.id, { images: [...(entry.images || []), src] });
        addPhotoEntryIdRef.current = null;
      } else {
        setComposeImages(p => [...p, src]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onDropEntry = (targetId: number) => {
    if (dragEntryId === null || dragEntryId === targetId) return;
    
    const fromIdx = entries.findIndex(x => x.id === dragEntryId);
    const toIdx   = entries.findIndex(x => x.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    
    const next = [...entries];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    
    setEntries(next);
    setStreamSort("manual");
    setStreamOrder(next.map(e => e.id));
    setDragEntryId(null);
    setDragOverEntryId(null);
  };

  const upList = (listId: number, patch: Partial<List>) => setLists(ls => ls.map(l => l.id === listId ? { ...l, ...patch } : l));

  const cycleType = (id: number) => {
    const e = entries.find(x => x.id === id); if (!e) return;
    const types = ["task", "event", "note", "thought"];
    const next = types[(types.indexOf(e.type) + 1) % types.length] as any;
    up(id, { type: next });
  };

  const saveEdit = (id: number) => {
    if (!editText.trim()) return;
    const a = analyze(editText);
    const e = entries.find(x => x.id === id);
    up(id, { 
      rawText: editText, 
      text: cleanText(editText, a.type), 
      type: a.type, 
      priority: a.priority, 
      dueDate: a.dueDate, 
      tags: a.tags, 
      contexts: a.contexts,
      emoji: e?.emoji || a.emoji
    });
    setEditingId(null);
  };

  const saveBody = (id: number) => {
    up(id, { body: bodyInput });
    setEditingBodyId(null);
  };

  const handleAiTitle = async (id: number) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    setAiTitlingId(id);
    try {
      const result = await queryAssistant(
        `Split this entry into a very short title (max 8 words) and a longer body with the details. Return ONLY valid JSON with no markdown: {"title":"...","body":"..."}. Entry text: "${entry.text}"`,
        []
      );
      if (result) {
        const clean = result.replace(/```json?|```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (parsed.title) up(id, { text: parsed.title.trim(), rawText: parsed.title.trim(), body: parsed.body || "" });
      }
    } catch {}
    setAiTitlingId(null);
  };

  const saveDueDate = (id: number) => {
    up(id, { dueDate: dueDateInput.trim() || null }); // Fixed: null clears the field; undefined does not
    setEditingDueDate(null);
  };

  const saveCommentEdit = () => {
    if (!editingComment || !editingComment.text.trim()) return;
    const entry = entries.find(e => e.id === editingComment.entryId);
    if (!entry) return;
    up(editingComment.entryId, {
      comments: (entry.comments || []).map(c => c.id === editingComment.commentId ? { ...c, text: editingComment.text } : c)
    });
    setEditingComment(null);
  };

  const addSubtask = (entryId: number) => {
    const text = (stInputs[entryId] || "").trim(); if (!text) return;
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    up(entryId, { subtasks: [...(entry.subtasks || []), { id: Date.now(), text, done: false }] });
    setStInputs(p => ({ ...p, [entryId]: "" }));
  };

  const toggleSubtask = (entryId: number, stId: number) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    up(entryId, { subtasks: (entry.subtasks || []).map(s => s.id === stId ? { ...s, done: !s.done } : s) });
  };

  const deleteSubtask = (entryId: number, stId: number) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    up(entryId, { subtasks: (entry.subtasks || []).filter(s => s.id !== stId) });
  };

  const deleteList = (id: number) => {
    const list = lists.find(l => l.id === id);
    if (!list) return;
    const remaining = lists.filter(l => l.id !== id);
    setLists(remaining);
    const prevActiveId = activeListId;
    setActiveListId(remaining.length > 0 ? remaining[0].id : null);
    setListTrash({ list, prevActiveId });
    setUndoMsg(`List: ${list.name}`);
    startUndoTimer();
  };

  const filteredEntries = useMemo(() => {
    const PO: Record<string, number> = { high:0, medium:1, low:2 };
    const sq = search.toLowerCase();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59);
    
    const filtered = entries.filter(e => {
      if (spaceFilter !== "all" && !e.contexts.includes(spaceFilter)) return false;
      if (!showCompleted && e.done) return false;
      if (filterTag && !e.tags.includes(filterTag) && !e.contexts.includes(filterTag)) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      if (dueFilter) {
        if (dueFilter === "overdue") { if (!isOverdue(e)) return false; }
        else {
          const r = e.dueDate ? resolveDueDate(e.dueDate, e.timestamp) : null;
          if (!r) return false;
          if (dueFilter === "today" && (r < todayStart || r >= new Date(todayStart.getTime() + 86400000))) return false;
          if (dueFilter === "week"  && (r < now || r > weekEnd)) return false;
        }
      }
      if (sq) {
        const inText     = e.text.toLowerCase().includes(sq);
        const inComments = (e.comments  || []).some(c => c.text.toLowerCase().includes(sq));
        const inSubtasks = (e.subtasks  || []).some(s => s.text.toLowerCase().includes(sq));
        const inTags     = e.tags.some(t => t.toLowerCase().includes(sq));
        const inContexts = e.contexts.some(c => c.toLowerCase().includes(sq));
        if (!inText && !inComments && !inSubtasks && !inTags && !inContexts) return false;
      }
      return true;
    });

    if (streamSort === "manual") {
      if (streamOrder.length === 0) return [...filtered].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return [...filtered].sort((a, b) => {
        const ai = streamOrder.indexOf(a.id);
        const bi = streamOrder.indexOf(b.id);
        if (ai < 0 && bi < 0) return 0;
        if (ai < 0) return 1;
        if (bi < 0) return -1;
        return ai - bi;
      });
    }

    return [...filtered].sort((a, b) => {
      const ap = a.pinned ? 1 : 0, bp = b.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      if (streamSort === "oldest")   return a.timestamp.getTime() - b.timestamp.getTime();
      if (streamSort === "priority") return PO[a.priority] - PO[b.priority] || b.timestamp.getTime() - a.timestamp.getTime();
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [entries, search, filterTag, spaceFilter, streamSort, showCompleted, streamOrder, typeFilter, dueFilter]);

  const bgOverlayStyle: any = useMemo(() => {
    if (bgPreset === "none") return null;
    if (bgPreset === "mesh")  return { background: `radial-gradient(ellipse at 20% 30%, ${C.accent}55 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #ec489955 0%, transparent 50%), radial-gradient(ellipse at 60% 10%, #06b6d455 0%, transparent 45%)`, opacity: bgOpacity };
    if (bgPreset === "noise") return { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: bgOpacity * 0.6 };
    if (bgPreset === "grid")  return { backgroundImage: `linear-gradient(${C.accent}22 1px, transparent 1px), linear-gradient(90deg, ${C.accent}22 1px, transparent 1px)`, backgroundSize: "32px 32px", opacity: bgOpacity };
    if (bgPreset === "image" && bgImage) return { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: bgOpacity };
    return null;
  }, [bgPreset, bgImage, bgOpacity, C.accent]);

  // Note: fmtLocal avoids shadowing the imported `fmt` from utils/format
  const fmtLocal = (d: number | Date) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const insights = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Streak
    let streak = 0;
    const activeDays = new Set(entries.map(e => {
      const d = new Date(e.timestamp);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }));
    
    let check = today;
    if (!activeDays.has(check.getTime())) {
      check = new Date(today.getTime() - 86400000);
    }
    
    while (activeDays.has(check.getTime())) {
      streak++;
      check = new Date(check.getTime() - 86400000);
    }

    // Completion Rate
    const tasks = entries.filter(e => e.type === "task");
    const doneTasks = tasks.filter(e => e.done);
    const completionRate = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

    // Activity (Last 7 Days)
    const activity = [6,5,4,3,2,1,0].map(daysAgo => {
      const d = new Date(today.getTime() - daysAgo * 86400000);
      const count = entries.filter(e => {
        const d_e = new Date(e.timestamp);
        const ed = new Date(d_e.getFullYear(), d_e.getMonth(), d_e.getDate());
        return ed.getTime() === d.getTime();
      }).length;
      return count;
    });

    return { streak, completionRate, activity };
  }, [entries]);

  if (view === "help") {
    return (
      <div style={{ minHeight:"100vh", background: C.bg, color: C.text, fontFamily: (FONTS as any)[fontFamily], zoom: String(fontScale), display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"15px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface }}>
          <div style={{ fontWeight:700 }}>Tikky Guide</div>
          <button onClick={() => setView("main")} style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.text, cursor:"pointer", fontWeight:600, padding:"6px 16px", borderRadius:8, fontSize:13 }}>✕ Close</button>
        </div>
        <div style={{ flex:1, padding:30, maxWidth:700, margin:"0 auto", display:"flex", flexDirection:"column", gap:25 }}>
          <section>
            <h3 style={{ color: C.accent, marginBottom:10 }}>Natural Language Commands</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { cmd: "!1, !2, !3", desc: "Set priority (High, Medium, Low)" },
                { cmd: "#tag, @context", desc: "Categorize your entries" },
                { cmd: "tomorrow 5pm", desc: "Set due dates automatically" },
                { cmd: "Update [task] to [value]", desc: "Modify existing entries" },
                { cmd: "/summary", desc: "View your productivity recap" },
                { cmd: "What should I do next?", desc: "Get a smart suggestion" },
                { cmd: "Rank my tasks", desc: "See your top priorities" },
              ].map(i => (
                <div key={i.cmd} style={{ display:"flex", justifyContent:"space-between", background: C.surface, padding:"10px 15px", borderRadius:10, border:`1px solid ${C.border}` }}>
                  <code style={{ color: C.accent, fontWeight:700 }}>{i.cmd}</code>
                  <span style={{ color: C.dim, fontSize:13 }}>{i.desc}</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 style={{ color: C.accent, marginBottom:10 }}>Keyboard Shortcuts</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>Add Entry</span> <kbd style={{ background:C.surface, padding:"2px 6px", borderRadius:4, border:`1px solid ${C.border}` }}>Enter</kbd></div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>Search</span> <kbd style={{ background:C.surface, padding:"2px 6px", borderRadius:4, border:`1px solid ${C.border}` }}>/</kbd></div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span>New Line</span> <kbd style={{ background:C.surface, padding:"2px 6px", borderRadius:4, border:`1px solid ${C.border}` }}>Shift + Enter</kbd></div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (view === "summary") {
    const done = entries.filter(e => e.done);
    const tasks = entries.filter(e => e.type === "task");
    const rate = tasks.length ? Math.round((done.filter(e=>e.type==="task").length / tasks.length) * 100) : 0;
    
    return (
      <div style={{ height:"100%", background: C.bg, color: C.text, fontFamily: (FONTS as any)[fontFamily], zoom: String(fontScale), display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"15px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, flexShrink:0 }}>
          <div style={{ fontWeight:700 }}>Productivity Summary</div>
          <button onClick={() => setView("main")} style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.text, cursor:"pointer", fontWeight:600, padding:"6px 16px", borderRadius:8, fontSize:13 }}>✕ Close</button>
        </div>
        <div style={{ flex:1, padding:30, maxWidth:800, margin:"0 auto", width:"100%", overflowY:"auto" }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap:20, marginBottom:40 }}>
            <div style={{ background: C.surface, padding:20, borderRadius:16, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:800, color: C.accent }}>{done.length}</div>
              <div style={{ fontSize:12, color: C.dim }}>Completed Items</div>
            </div>
            <div style={{ background: C.surface, padding:20, borderRadius:16, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:800, color: "#10b981" }}>{rate}%</div>
              <div style={{ fontSize:12, color: C.dim }}>Task Completion Rate</div>
            </div>
            <div style={{ background: C.surface, padding:20, borderRadius:16, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ fontSize:32, fontWeight:800, color: "#f59e0b" }}>{insights.streak}</div>
              <div style={{ fontSize:12, color: C.dim }}>Day Streak</div>
            </div>
          </div>
          
          <h3 style={{ marginBottom:15 }}>Recent Activity</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {done.slice(0, 10).map(e => (
              <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12, background: C.surface, padding:12, borderRadius:12, border:`1px solid ${C.border}` }}>
                <span style={{ fontSize:18 }}>{e.emoji || "✅"}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{e.text}</div>
                  <div style={{ fontSize:11, color: C.dim }}>Completed {fmtLocal(e.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (focusMode) {
    const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2, '0')}`;
    const rankedTasks = [...entries]
      .filter(e => !e.done && (e.type === "task" || e.type === "event"))
      .sort((a, b) => {
        const pMap = { high: 0, medium: 1, low: 2 };
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
        const ad = a.dueDate ? resolveDueDate(a.dueDate, a.timestamp) : null;
        const bd = b.dueDate ? resolveDueDate(b.dueDate, b.timestamp) : null;
        if (ad && bd) return ad.getTime() - bd.getTime();
        if (ad) return -1;
        if (bd) return 1;
        return 0;
      });

    if (focusSetup) {
      return (
        <div style={{ height:"100%", background: "#000", color: "#fff", display:"flex", flexDirection:"column", padding:30, fontFamily: (FONTS as any)[fontFamily], overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:40, flexShrink:0 }}>
            <h2 style={{ fontSize:24, fontWeight:800 }}>Focus Setup</h2>
            <button onClick={() => setFocusMode(false)} style={{ background:"none", border:"none", color:"#666", cursor:"pointer" }}>Cancel</button>
          </div>

          <div style={{ flex:1, overflowY:"auto" }}>
            <div style={{ marginBottom:30 }}>
            <div style={{ fontSize:12, color: C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:15 }}>1. Select Duration</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
              {[15, 25, 45, 60].map(m => (
                <button 
                  key={m} 
                  onClick={() => setPomodoroTime(m * 60)}
                  style={{ background: pomodoroTime === m * 60 ? C.accent : "#111", border:`1px solid ${pomodoroTime === m * 60 ? C.accent : "#333"}`, color:"#fff", padding:"12px", borderRadius:12, cursor:"pointer", fontWeight:700 }}
                >
                  {m}m
                </button>
              ))}
            </div>
            <div style={{ marginTop:15, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:12, color:"#666" }}>Custom:</span>
              <input 
                type="number" 
                placeholder="Mins" 
                onChange={e => setPomodoroTime(parseInt(e.target.value || "0") * 60)}
                style={{ background:"#111", border:"1px solid #333", color:"#fff", padding:"8px 12px", borderRadius:8, width:80 }}
              />
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", marginBottom:30 }}>
            <div style={{ fontSize:12, color: C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:15 }}>2. Select Objectives ({focusTaskIds.size})</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {rankedTasks.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => {
                    const next = new Set(focusTaskIds);
                    if (next.has(t.id)) next.delete(t.id);
                    else next.add(t.id);
                    setFocusTaskIds(next);
                  }}
                  style={{ background: focusTaskIds.has(t.id) ? `${C.accent}22` : "#111", border:`1px solid ${focusTaskIds.has(t.id) ? C.accent : "#333"}`, borderRadius:12, padding:15, textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}
                >
                  <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${focusTaskIds.has(t.id) ? C.accent : "#444"}`, background: focusTaskIds.has(t.id) ? C.accent : "none", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {focusTaskIds.has(t.id) && <span style={{ fontSize:12 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color: focusTaskIds.has(t.id) ? "#fff" : "#ccc" }}>{t.text}</div>
                    <div style={{ fontSize:11, color:"#666" }}>{t.priority} · {t.dueDate || "No due date"}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
            onClick={() => { setFocusSetup(false); setPomodoroActive(true); }}
            disabled={focusTaskIds.size === 0}
            style={{ background: focusTaskIds.size > 0 ? C.accent : "#333", color:"#fff", border:"none", padding:"18px", borderRadius:16, fontSize:16, fontWeight:800, cursor: focusTaskIds.size > 0 ? "pointer" : "not-allowed" }}
          >
            Start Focus Session
          </button>
        </div>
      );
    }

    const activeTasks = entries.filter(e => focusTaskIds.has(e.id));
    const currentTask = activeTasks.find(e => !e.done);
    const totalTime = pomodoroMode === "work" ? (pomodoroTime > 25*60 ? pomodoroTime : 25*60) : 5*60; // Rough estimate for progress
    const progress = (pomodoroTime / totalTime) * 100;

    return (
      <div style={{ height:"100vh", background: "#000", color: "#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily: (FONTS as any)[fontFamily], position:"relative", overflow:"hidden" }}>
        {/* Subtle background pulse */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background: C.accent, filter:"blur(100px)", zIndex:0, pointerEvents:"none" }}
        />

        <button onClick={() => { setFocusMode(false); setFocusSetup(true); setPomodoroActive(false); }} style={{ position:"absolute", top:30, right:30, background:"none", border:"none", color:"#666", cursor:"pointer", fontSize:14, zIndex:10 }}>Exit Focus Mode</button>
        
        <div style={{ textAlign:"center", marginBottom:60, position:"relative", zIndex:1 }}>
          <div style={{ fontSize:12, color: C.accent, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.2em", marginBottom:10 }}>{pomodoroMode === "work" ? "Focus Session" : "Break Time"}</div>
          <motion.div 
            animate={pomodoroActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize:120, fontWeight:800, fontFamily:"monospace", lineHeight:1 }}
          >
            {formatTime(pomodoroTime)}
          </motion.div>
          
          {/* Progress Bar */}
          <div style={{ width:200, height:4, background:"#222", borderRadius:2, margin:"20px auto", overflow:"hidden" }}>
            <motion.div 
              animate={{ width: `${progress}%` }}
              style={{ height:"100%", background: C.accent }}
            />
          </div>

          <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:20 }}>
            <button 
              onClick={() => setPomodoroActive(!pomodoroActive)}
              style={{ background: pomodoroActive ? "transparent" : C.accent, border: `2px solid ${C.accent}`, color: pomodoroActive ? C.accent : "#fff", padding:"10px 30px", borderRadius:30, fontSize:16, fontWeight:700, cursor:"pointer" }}
            >
              {pomodoroActive ? "Pause" : "Resume"}
            </button>
            <button 
              onClick={() => setPomodoroTime(pomodoroMode === "work" ? 25*60 : 5*60)}
              style={{ background:"none", border:"1px solid #333", color:"#666", padding:"10px 20px", borderRadius:30, fontSize:14, cursor:"pointer" }}
            >
              Reset
            </button>
          </div>
        </div>

        {currentTask ? (
          <div style={{ maxWidth:500, textAlign:"center", padding:"0 20px" }}>
            <div style={{ fontSize:14, color:"#666", marginBottom:10 }}>Current Objective ({activeTasks.filter(e=>e.done).length}/{activeTasks.length})</div>
            <div style={{ fontSize:28, fontWeight:700 }}>{currentTask.text}</div>
            <div style={{ marginTop:20, display:"flex", gap:10, justifyContent:"center" }}>
              {currentTask.tags.map(t => <span key={t} style={{ fontSize:12, color: C.accent }}>#{t}</span>)}
            </div>
            <button 
              onClick={() => toggleDone(currentTask.id)}
              style={{ marginTop:40, background:"#fff", color:"#000", border:"none", padding:"12px 40px", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer" }}
            >
              Complete Task
            </button>
          </div>
        ) : (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:20 }}>🎯</div>
            <div style={{ fontSize:24, fontWeight:700 }}>All objectives cleared!</div>
            <button onClick={() => { setFocusMode(false); setFocusSetup(true); }} style={{ marginTop:30, background: C.accent, border:"none", color:"#fff", padding:"12px 30px", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer" }}>Finish Session</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, height: "100%", color: C.text, fontFamily: (FONTS as any)[fontFamily], display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zoom: String(fontScale) }}>
      {bgOverlayStyle && <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", ...bgOverlayStyle }} />}
      
      {/* ── Image lightbox ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{ position:"fixed", inset:0, zIndex:1200, background:"rgba(0,0,0,0.92)",
                   display:"flex", alignItems:"center", justifyContent:"center",
                   cursor:"zoom-out", backdropFilter:"blur(6px)" }}
        >
          <img
            src={lightboxImg}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth:"92vw", maxHeight:"88vh", objectFit:"contain",
                     borderRadius:12, boxShadow:"0 20px 80px rgba(0,0,0,0.8)",
                     cursor:"default" }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{ position:"fixed", top:20, right:24, background:"rgba(255,255,255,0.12)",
                     border:"none", color:"#fff", fontSize:22, width:40, height:40,
                     borderRadius:"50%", cursor:"pointer", display:"flex",
                     alignItems:"center", justifyContent:"center", lineHeight:1 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Confetti burst ── */}
      <AnimatePresence>
        {celebration && (
          <div style={{ position:"fixed", inset:0, zIndex:1000, pointerEvents:"none", overflow:"hidden" }}>
            {Array.from({ length: 48 }).map((_, i) => {
              const hues = [0, 30, 60, 120, 200, 270, 320];
              const hue = hues[i % hues.length];
              const x = (Math.sin(i * 2.4) * 0.5 + 0.5) * 100; // 0-100%
              const delay = (i % 8) * 0.05;
              const dur = 0.9 + (i % 5) * 0.15;
              const size = 8 + (i % 4) * 4;
              const rotate = (i * 137) % 360;
              const shapes = ["●", "■", "▲", "◆"];
              return (
                <motion.div
                  key={i}
                  initial={{ y: -20, x: `${x}vw`, opacity: 1, rotate: 0, scale: 1 }}
                  animate={{ y: "110vh", opacity: [1, 1, 0], rotate: rotate + 360, scale: [1, 1.2, 0.8] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: dur, delay, ease: "easeIn" }}
                  style={{ position:"absolute", top:0, left:0, fontSize: size, color: `hsl(${hue},90%,60%)`, lineHeight:1 }}
                >
                  {shapes[i % shapes.length]}
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>


      {/* ── Import / Export modal ── */}
      <AnimatePresence>
        {modal === "export" && (
          <motion.div
            key="export-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position:"fixed", inset:0, zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:"28px 28px 24px", width: 520, maxWidth:"92vw", maxHeight:"80vh", display:"flex", flexDirection:"column", gap:16, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:17, fontWeight:700, color: C.text }}>📤 Export stream</div>
                <button onClick={() => setModal(null)} style={{ background:"none", border:"none", color: C.dim, cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
              </div>
              <div style={{ fontSize:13, color: C.dim }}>Copy this JSON to back up or migrate your stream.</div>
              <textarea
                readOnly
                value={JSON.stringify(entries, null, 2)}
                style={{ flex:1, minHeight:220, resize:"none", background: C.bg, color: C.text, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", fontFamily:"monospace", fontSize:12, lineHeight:1.5 }}
              />
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(JSON.stringify(entries, null, 2)); }}
                  style={{ background: C.accent, color:"#fff", border:"none", borderRadius:10, padding:"9px 20px", cursor:"pointer", fontWeight:600, fontSize:13 }}
                >
                  Copy to clipboard
                </button>
                <button onClick={() => setModal(null)} style={{ background: C.surface, color: C.dim, border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 20px", cursor:"pointer", fontSize:13 }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal === "import" && (
          <motion.div
            key="import-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position:"fixed", inset:0, zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:"28px 28px 24px", width: 520, maxWidth:"92vw", maxHeight:"80vh", display:"flex", flexDirection:"column", gap:16, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:17, fontWeight:700, color: C.text }}>📥 Import stream</div>
                <button onClick={() => setModal(null)} style={{ background:"none", border:"none", color: C.dim, cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
              </div>
              <div style={{ fontSize:13, color: C.dim }}>Paste previously exported JSON below. This will <strong>merge</strong> with your current stream (no data is deleted).</div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='Paste exported JSON here…'
                style={{ flex:1, minHeight:220, resize:"none", background: C.bg, color: C.text, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", fontFamily:"monospace", fontSize:12, lineHeight:1.5 }}
              />
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button
                  onClick={() => {
                    try {
                      const imported: Entry[] = JSON.parse(importText);
                      if (!Array.isArray(imported)) throw new Error("Not an array");
                      const existingIds = new Set(entries.map(e => e.id));
                      const newEntries = imported.filter(e => !existingIds.has(e.id)).map(e => ({
                        ...e,
                        timestamp: new Date(e.timestamp),
                        dueDate: e.dueDate ? new Date(e.dueDate) : undefined,
                      }));
                      setEntries(prev => [...prev, ...newEntries]);
                      setModal(null);
                      setImportText("");
                      setUndoMsg(`Imported ${newEntries.length} entr${newEntries.length === 1 ? "y" : "ies"}`);
                      startUndoTimer();
                    } catch {
                      alert("Invalid JSON — please paste a valid Tikky export.");
                    }
                  }}
                  style={{ background: C.accent, color:"#fff", border:"none", borderRadius:10, padding:"9px 20px", cursor:"pointer", fontWeight:600, fontSize:13 }}
                >
                  Import
                </button>
                <button onClick={() => { setModal(null); setImportText(""); }} style={{ background: C.surface, color: C.dim, border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 20px", cursor:"pointer", fontSize:13 }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {semanticResponse && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position:"fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: C.surface, border: `1px solid ${C.accent}`, borderRadius: 16, padding: "20px 25px", zIndex: 500, boxShadow: "0 15px 40px rgba(0,0,0,0.4)", maxWidth: 400, width: "90%" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color: C.accent, textTransform:"uppercase" }}>Tikky Assistant</div>
              <button onClick={() => setSemanticResponse(null)} style={{ background:"none", border:"none", color: C.dim, cursor:"pointer", fontSize:16 }}>✕</button>
            </div>
            <div style={{ fontSize:14, lineHeight:1.6, color: C.text }}>
              {renderMd(semanticResponse ?? "", "")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectMode && selectedEntries.size > 0 && (
        <div style={{ position:"fixed", bottom:30, left:"50%", transform:"translateX(-50%)", background: C.surface, border:`1px solid ${C.accent}`, borderRadius:16, padding:"10px 20px", display:"flex", alignItems:"center", gap:15, zIndex:200, boxShadow:"0 10px 30px rgba(0,0,0,.3)" }}>
          <div style={{ fontSize:12, fontWeight:700, color: C.accent }}>{selectedEntries.size} selected</div>
          <div style={{ width:1, height:20, background: C.border }} />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => {
              const next = entries.map(e => selectedEntries.has(e.id) ? { ...e, done: true } : e);
              setEntries(next); setSelectedEntries(new Set()); setSelectMode(false);
            }} style={{ background:"none", border:`1px solid ${C.border}`, color: C.text, padding:"5px 12px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600 }}>✓ Done</button>
            <button onClick={() => {
              const next = entries.map(e => selectedEntries.has(e.id) ? { ...e, pinned: true } : e);
              setEntries(next); setSelectedEntries(new Set()); setSelectMode(false);
            }} style={{ background:"none", border:`1px solid ${C.border}`, color: C.text, padding:"5px 12px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600 }}>📌 Pin</button>
            <button onClick={() => {
              const ctx = prompt("Move to context?", "");
              if (ctx !== null) {
                const next = entries.map(e => selectedEntries.has(e.id) ? { ...e, contexts: ctx ? [ctx] : [] } : e);
                setEntries(next); setSelectedEntries(new Set()); setSelectMode(false);
              }
            }} style={{ background:"none", border:`1px solid ${C.border}`, color: C.text, padding:"5px 12px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600 }}>📦 Move</button>
            <button onClick={() => {
              const p = prompt("Set priority? (high, medium, low)", "medium") as Priority;
              if (p && ["high","medium","low"].includes(p)) {
                const next = entries.map(e => selectedEntries.has(e.id) ? { ...e, priority: p } : e);
                setEntries(next); setSelectedEntries(new Set()); setSelectMode(false);
              }
            }} style={{ background:"none", border:`1px solid ${C.border}`, color: C.text, padding:"5px 12px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600 }}>⚡ Priority</button>
            <button onClick={() => {
              const next = entries.filter(e => !selectedEntries.has(e.id));
              setEntries(next); setSelectedEntries(new Set()); setSelectMode(false);
            }} style={{ background:"#ef444418", border:"1px solid #ef444455", color:"#ef4444", padding:"5px 12px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600 }}>🗑 Delete</button>
          </div>
          <button onClick={() => { setSelectedEntries(new Set()); setSelectMode(false); }} style={{ background:"none", border:"none", color: C.dim, cursor:"pointer", fontSize:12, fontWeight:600 }}>Cancel</button>
        </div>
      )}

      {undoMsg && (
        <div style={{ position:"fixed", bottom: isMobile ? 150 : 80, left:"50%", transform:"translateX(-50%)", background:"#1c1c1c", border:"1px solid #333", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:14, zIndex:300, boxShadow:"0 8px 24px rgba(0,0,0,.5)", minWidth:260 }}>
          <span style={{ fontSize:12, color:"#ccc", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{undoMsg}</span>
          <button onClick={undoDelete} style={{ background: C.accent, border:"none", color:"#fff", cursor:"pointer", padding:"4px 13px", borderRadius:6, fontSize:12, fontFamily:"inherit", fontWeight:600 }}>Undo</button>
        </div>
      )}

      <div style={{ padding: isMobile ? "8px 15px" : "11px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background: isMobile ? C.bg : "rgba(15,23,42,0.97)", backdropFilter: isMobile ? "none" : "blur(8px)", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color: C.accent, fontSize: isMobile ? 18 : 15, filter: isMobile ? "none" : "drop-shadow(0 0 5px #6366f1)" }}>{isMobile ? "✔️" : "◈"}</span>
          <span style={{ fontWeight:700, fontSize: isMobile ? 18 : 15, letterSpacing:"-0.3px" }}>Tikky</span>
        </div>
        <div style={{ display:"flex", gap: isMobile ? 12 : 6, alignItems:"center" }}>
          {isMobile ? (
            <>
              <button onClick={() => setShowMobileFilters(true)} style={{ background:"none", border:"none", color: C.text, fontSize:18, cursor:"pointer" }}>🔍</button>
              <button onClick={() => setShowMobileFilters(true)} style={{ background:"none", border:"none", color: C.text, fontSize:18, cursor:"pointer" }}>⊌</button>
              <div style={{ width:28, height:28, borderRadius:"50%", overflow:"hidden", border:`1px solid ${C.border}` }}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => setFocusMode(true)} 
                style={{ background: focusMode ? `${C.accent}22` : C.surface, border:`1px solid ${focusMode ? C.accent : C.border}`, color: focusMode ? C.accent : C.muted, cursor:"pointer", padding:"5px 11px", borderRadius:7, fontSize:12, fontFamily:"inherit", fontWeight:500, display:"flex", alignItems:"center", gap:5 }}
              >
                <span style={{ fontSize:14 }}>{pomodoroActive ? "⏳" : "⏱️"}</span>
                {pomodoroActive ? `${Math.floor(pomodoroTime/60)}m` : "Focus"}
              </button>
              {primaryTab === "stream" && (
                <button onClick={() => { setSumPeriod("all"); setView("summary"); }} style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.muted, cursor:"pointer", padding:"5px 11px", borderRadius:7, fontSize:12, fontFamily:"inherit", fontWeight:500 }}>Summary ↗</button>
              )}
              <button onClick={() => setView("help")} style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.muted, cursor:"pointer", padding:"5px 10px", borderRadius:7, fontSize:12, fontFamily:"inherit" }}>?</button>
              <button onClick={() => setPrimaryTab("settings")} style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.muted, cursor:"pointer", padding:"5px 10px", borderRadius:7, fontSize:12, fontFamily:"inherit" }}>⚙</button>
            </>
          )}
        </div>
      </div>

      {/* Removed mobile spaces bar to save space */}

      {!isMobile && (
        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0, background: C.bg, padding:"0 18px", alignItems:"center" }}>
          {[
            { key:"stream",   label:"Stream",   icon:"◎" },
            { key:"lists",    label:"Lists",    icon:"☰" },
            { key:"insights", label:"Insights", icon:"✦" },
            { key:"settings", label:"Settings", icon:"⚙" },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setPrimaryTab(key)} style={{ padding:"9px 16px", background:"none", border:"none", borderBottom: primaryTab===key ? `2px solid ${C.accent}` : "2px solid transparent", color: primaryTab===key ? C.accent : C.dim, cursor:"pointer", fontSize:13, fontWeight: primaryTab===key ? 600 : 400, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, transition:"all .15s", marginBottom:"-1px" }}>
              <span style={{ fontSize:11 }}>{icon}</span>{label}
            </button>
          ))}
          <div className="no-scrollbar" style={{ marginLeft:"auto", display:"flex", gap:2, padding:"4px 0", alignItems:"center", overflowX:"auto" }}>
            <button onClick={() => setSpaceFilter("all")} style={{ padding:"3px 10px", background: spaceFilter==="all" ? `${C.accent}22` : "none", border: spaceFilter==="all" ? `1px solid ${C.accent}55` : "1px solid transparent", borderRadius:6, color: spaceFilter==="all" ? C.accent : C.dim, cursor:"pointer", fontSize:11, fontWeight: spaceFilter==="all" ? 600 : 400, fontFamily:"inherit", transition:"all .15s" }}>All</button>
            {allContexts.map(ctx => (
              <button key={ctx} onClick={() => setSpaceFilter(spaceFilter===ctx ? "all" : ctx)} style={{ padding:"3px 10px", background: spaceFilter===ctx ? `${C.accent}22` : "none", border: spaceFilter===ctx ? `1px solid ${C.accent}55` : "1px solid transparent", borderRadius:6, color: spaceFilter===ctx ? C.accent : C.dim, cursor:"pointer", fontSize:11, fontWeight: spaceFilter===ctx ? 600 : 400, fontFamily:"inherit", transition:"all .15s", maxWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ctx}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0, zIndex:1 }}>
        <div style={{ flex:1, display:"flex", overflow:"hidden", width:"100%" }}>
        {primaryTab === "stream" ? (
          <>
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight: `1px solid ${C.border}` }}>
              {!isMobile && (
                <div style={{ borderBottom:`1px solid ${C.border}`, padding: "15px", background:C.bg, flexShrink:0 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
                    <div style={{ display:"flex", gap: 10, position:"relative" }}>
                      <textarea 
                        ref={inputRef}
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => { 
                          if (acType) {
                            if (e.key === "ArrowDown") { e.preventDefault(); setAcIndex(p => (p + 1) % acOptions.length); }
                            if (e.key === "ArrowUp") { e.preventDefault(); setAcIndex(p => (p - 1 + acOptions.length) % acOptions.length); }
                            if (e.key === "Enter" || e.key === "Tab") { 
                              e.preventDefault(); 
                              if (acOptions[acIndex]) handleAcSelect(acOptions[acIndex]);
                              else setAcType(null);
                            }
                            if (e.key === "Escape") { setAcType(null); }
                            return;
                          }
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addEntry(); } 
                        }}
                        placeholder="What's on your mind? Try 'Update...', 'What's next?', #tags, @spaces, !priority or /summary..." 
                        rows={2}
                        style={{ flex:1, background:C.input, border:`1.5px solid ${C.accent}33`, borderRadius:10, padding: "12px", fontSize:14, color:C.text, outline:"none", resize:"none", minHeight: 60, maxHeight:120, transition:"border-color .2s", boxShadow:`0 0 0 3px ${C.accent}08` }} 
                      />
                      {acType && (
                        <div style={{ position:"absolute", top: acPos.top, left: acPos.left, background: C.surface, border:`1px solid ${C.accent}55`, borderRadius:8, zIndex:1000, boxShadow:"0 10px 25px rgba(0,0,0,.3)", minWidth:120, overflow:"hidden" }}>
                          {acOptions.length === 0 ? (
                            <div style={{ padding:"8px 12px", fontSize:12, color: C.dim }}>No matches</div>
                          ) : (
                            acOptions.map((opt, i) => (
                              <div 
                                key={opt} 
                                onClick={() => handleAcSelect(opt)}
                                onMouseEnter={() => setAcIndex(i)}
                                style={{ padding:"8px 12px", fontSize:12, color: acIndex === i ? "#fff" : C.text, background: acIndex === i ? C.accent : "none", cursor:"pointer", fontWeight: acIndex === i ? 600 : 400 }}
                              >
                                {acType === "tag" ? "#" : "@"}{opt}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      <button onClick={() => photoInputRef.current?.click()} title="Attach photo" style={{ background: C.surface, border:`1px solid ${C.border}`, color: C.dim, borderRadius:10, padding:"0 14px", cursor:"pointer", fontSize:16, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>📷</button>
                      <button onClick={addEntry} disabled={isSubmitting} style={{ background: isSubmitting ? C.dimmer : C.accent, color:"#fff", border:"none", borderRadius:10, padding: "0 20px", cursor: isSubmitting ? "wait" : "pointer", fontWeight:600, fontSize:14, transition:"all .1s", minWidth:56, opacity: isSubmitting ? 0.7 : 1 }} onMouseDown={e=>{ if (!isSubmitting) e.currentTarget.style.transform="scale(0.96)"; }} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>{isSubmitting ? "…" : "Add"}</button>
                    </div>
                    {composeImages.length > 0 && (
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
                        {composeImages.map((img, i) => (
                          <div key={i} style={{ position:"relative" }}>
                            <img src={img} alt="" style={{ width:52, height:52, objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}`, display:"block" }} />
                            <button onClick={() => setComposeImages(p => p.filter((_,idx) => idx !== i))} style={{ position:"absolute", top:-5, right:-5, width:16, height:16, borderRadius:"50%", background:"#ef4444", border:"none", color:"#fff", fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:10, fontSize:10, color: C.dim, paddingLeft:2 }}>
                      <span>💡 Tip: Type <b>/task</b> or <b>/event</b> to change type</span>
                      <span>·</span>
                      <span><b>#tag</b> for categories</span>
                      <span>·</span>
                      <span><b>@space</b> for context</span>
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                const overdue = entries.filter(e => !e.done && e.dueDate && resolveDueDate(e.dueDate, e.timestamp)! < new Date(new Date().setHours(0,0,0,0)));
                const today   = entries.filter(e => !e.done && e.dueDate && resolveDueDate(e.dueDate, e.timestamp)! >= new Date(new Date().setHours(0,0,0,0)) && resolveDueDate(e.dueDate, e.timestamp)! < new Date(new Date().setHours(24,0,0,0)));
                if ((overdue.length > 0 || today.length > 0) && !dismissedAlert) {
                  const isMidnight = theme === "midnight";
                  const bg = isMidnight ? "#ef444415" : "#fef2f2";
                  const border = isMidnight ? "#ef444433" : "#fee2e2";
                  const textCol = isMidnight ? "#fca5a5" : "#991b1b";
                  const btnBg = isMidnight ? "#ef444433" : "#fee2e2";

                  return (
                    <div style={{ background: bg, borderBottom:`1px solid ${border}`, padding:"8px 15px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                      <span style={{ fontSize:14 }}>⚠️</span>
                      <div style={{ flex:1, fontSize:12, color: textCol, fontWeight:500 }}>
                        {overdue.length > 0 && <span>{overdue.length} overdue item{overdue.length>1?'s':''}</span>}
                        {overdue.length > 0 && today.length > 0 && <span> and </span>}
                        {today.length > 0 && <span>{today.length} due today</span>}
                      </div>
                      <button onClick={() => setDueFilter(overdue.length > 0 ? "overdue" : "today")} style={{ background: btnBg, border:"none", color: textCol, padding:"3px 8px", borderRadius:5, fontSize:11, fontWeight:600, cursor:"pointer" }}>View</button>
                      <button onClick={() => setDismissedAlert(true)} style={{ background:"none", border:"none", color: textCol, cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
                    </div>
                  );
                }
                return null;
              })()}
              <div style={{ borderBottom: isMobile ? "none" : `1px solid ${C.border}`, flexShrink:0, background: C.surface+"33" }}>
                {!isMobile && (
                  <div style={{ padding:"12px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                    {/* Row 1: Search & Core Filters */}
                    <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:200, position:"relative", display:"flex", alignItems:"center" }}>
                        <input
                          ref={searchRef}
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search stream…"
                          style={{ width:"100%", background:"transparent", border:`1px solid ${search ? C.accent+"66" : C.border+"88"}`, borderRadius:10, padding:"8px 12px", paddingRight: search ? 30 : 12, fontSize:13, color: C.text, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"all .2s" }}
                        />
                        {search && (
                          <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, background:"none", border:"none", color: C.dimmer, cursor:"pointer", fontSize:14, padding:0, lineHeight:1, display:"flex", alignItems:"center" }}>✕</button>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:3, background: C.bg, padding:3, borderRadius:8, border:`1px solid ${C.border}` }}>
                        {[null,"task","event","note","thought"].map(t => {
                          const active = typeFilter === t;
                          const col    = t ? (TM as any)[t].color : C.accent;
                          const label  = t ? (TM as any)[t].icon : "All";
                          return (
                            <button key={String(t)} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                              title={t ? (TM as any)[t].label : "All types"}
                              style={{ fontSize:12, width:30, height:30, borderRadius:6, border: "none", background: active ? `${col}33` : "none", color: active ? col : C.dim, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display:"flex", gap:4 }}>
                        {[["overdue","⚠ Overdue","#ef4444"],["today","⏱ Today","#f59e0b"],["week","📅 Week",C.accent]].map(([k,label,col]) => (
                          <button key={k} onClick={() => setDueFilter(dueFilter === k ? null : k)}
                            style={{ fontSize:11, padding:"5px 12px", borderRadius:8, border: dueFilter===k ? `1px solid ${col}55` : `1px solid ${C.border}`, background: dueFilter===k ? `${col}22` : C.input, color: dueFilter===k ? col : C.dim, cursor:"pointer", fontFamily:"inherit", fontWeight: dueFilter===k ? 700 : 500, transition:"all .2s", whiteSpace:"nowrap" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: View & Sort */}
                    <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", borderTop:`1px solid ${C.border}44`, paddingTop:10 }}>
                      <div style={{ display:"flex", gap:3, background: C.bg, padding:3, borderRadius:10, border:`1px solid ${C.border}` }}>
                        {[["newest","🕜 New"],["oldest","📅 Old"],["priority","⚡ Priority"],["manual","⠿ Manual"]].map(([s, label]) => (
                          <button key={s} onClick={() => setStreamSort(s)} style={{ fontSize:11, padding:"5px 12px", borderRadius:7, border: "none", background: streamSort===s ? C.accent : "none", color: streamSort===s ? "#fff" : C.dim, cursor:"pointer", fontFamily:"inherit", fontWeight: streamSort===s ? 700 : 500, transition:"all .2s", whiteSpace:"nowrap" }}>{label}</button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginLeft:"auto" }}>
                        <select value={groupBy || ""} onChange={e => setGroupBy(e.target.value || null)}
                          style={{ fontSize:11, padding:"6px 12px", borderRadius:8, border:`1px solid ${groupBy ? C.accent+"55" : C.border}`, background: groupBy ? `${C.accent}18` : C.input, color: groupBy ? C.accent : C.dim, cursor:"pointer", fontFamily:"inherit", outline:"none", transition:"all .12s" }}>
                          <option value="">Group: off</option>
                          <option value="type">Type</option>
                          <option value="priority">Priority</option>
                          <option value="context">Context</option>
                          <option value="date">Due date</option>
                        </select>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => setSelectMode(v => !v)} title="Select mode" style={{ fontSize:12, width:34, height:34, borderRadius:8, border: selectMode ? `1px solid ${C.accent}55` : `1px solid ${C.border}`, background: selectMode ? `${C.accent}18` : C.input, color: selectMode ? C.accent : C.dim, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>☑</button>
                          <button onClick={() => setCompactView(v => !v)} title="Compact view" style={{ fontSize:12, width:34, height:34, borderRadius:8, border: compactView ? `1px solid ${C.accent}55` : `1px solid ${C.border}`, background: compactView ? `${C.accent}18` : C.input, color: compactView ? C.accent : C.dim, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .2s" }}>⊟</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              {(allTags.length > 0 || savedFilters.length > 0 || typeFilter || filterTag || dueFilter || search) && (
                <div style={{ padding:"0 15px 7px", display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                  {(typeFilter || filterTag || dueFilter || search) && (
                    <button 
                      onClick={() => { setTypeFilter(null); setFilterTag(null); setDueFilter(null); setSearch(""); }}
                      style={{ fontSize:10, padding:"2px 8px", borderRadius:5, border:`1px solid #ef444455`, background:"#ef444411", color: "#ef4444", cursor:"pointer", fontFamily:"inherit", fontWeight:700, transition:"all .12s", marginRight:5 }}
                    >
                      ✕ Clear all
                    </button>
                  )}
                  {savedFilters.map(f => (
                  <div key={f.id} style={{ display:"flex", alignItems:"center", background: `${C.accent}12`, border:`1px solid ${C.accent}33`, borderRadius:6, padding:"1px 2px 1px 8px", gap:4 }}>
                    <span 
                      onClick={() => { setTypeFilter(f.type); setFilterTag(f.tag); setDueFilter(f.due); setSearch(f.search || ""); }}
                      style={{ fontSize:10, color: C.accent, fontWeight:600, cursor:"pointer" }}
                    >
                      {f.name}
                    </span>
                    <button onClick={() => setSavedFilters(savedFilters.filter(x => x.id !== f.id))} style={{ background:"none", border:"none", color: C.dim, cursor:"pointer", fontSize:10, padding:"2px 4px" }}>✕</button>
                  </div>
                ))}
                {allTags.map(t => <TagPill key={t} tag={t} active={filterTag === t} onClick={() => setFilterTag(filterTag === t ? null : t)} />)}
              </div>
            )}
          </div>
          
          <div 
            onClick={() => inputRef.current?.focus()}
            className="no-scrollbar"
            style={{ flex:1, overflowY:"auto", padding: isMobile ? "15px 15px 80px" : "15px", position:"relative" }}
          >
            <div style={{ maxWidth: isMobile ? "100%" : 860, margin:"0 auto" }}>
            {(() => {
              const PO: Record<string, number> = { high:0, medium:1, low:2 };
              
              const renderCard = (entry: Entry, i: number, total: number) => (
                <div
                  key={entry.id}
                  onClick={(e) => e.stopPropagation()}
                  draggable={true}
                  onDragStart={() => { setDragEntryId(entry.id); if (streamSort !== "manual") setStreamSort("manual"); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverEntryId(entry.id); }}
                  onDragLeave={() => setDragOverEntryId(null)}
                  onDrop={() => onDropEntry(entry.id)}
                  onDragEnd={() => { setDragEntryId(null); setDragOverEntryId(null); }}
                  style={{ 
                    position: "relative",
                    outline: dragOverEntryId === entry.id ? `2px dashed ${C.accent}` : "none",
                    borderRadius: 10,
                    transition: "outline .1s"
                  }}
                >
                  <StreamCard 
                    entry={entry} 
                    rowIdx={i} 
                    totalRows={total} 
                    isMobile={isMobile} 
                    C={C}
                    compact={compactView}
                    manualMode={streamSort === "manual"}
                    isExpanded={expanded === entry.id}
                    onExpand={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    onDelete={() => rm(entry.id)}
                    onToggleDone={() => toggleDone(entry.id)}
                    showRestore={dashTab === "done"}
                    onPin={() => up(entry.id, { pinned: !entry.pinned })}
                    onPriority={(p: Priority) => up(entry.id, { priority: p })}
                    onAddPhoto={() => onAddPhoto(entry.id)}
                    onCommentInput={(v: string) => setCommentInputs(p => ({ ...p, [entry.id]: v }))}
                    onCommentAdd={() => addComment(entry.id)}
                    commentInputs={commentInputs}
                    stInputs={stInputs}
                    onSubtaskInput={(v: string) => setStInputs(p => ({ ...p, [entry.id]: v }))}
                    onSubtaskAdd={() => {
                      const text = (stInputs[entry.id] || "").trim();
                      if (!text) return;
                      up(entry.id, { subtasks: [...entry.subtasks, { id: Date.now(), text, done: false }] });
                      setStInputs(p => ({ ...p, [entry.id]: "" }));
                    }}
                    onSubtaskToggle={(sid: number) => up(entry.id, { subtasks: entry.subtasks.map(s => s.id === sid ? { ...s, done: !s.done } : s) })}
                    onSubtaskDelete={(sid: number) => up(entry.id, { subtasks: entry.subtasks.filter(s => s.id !== sid) })}
                    onEmojiChange={(v: string) => up(entry.id, { emoji: v })}
                    onDueDateEdit={() => { setEditingDueDate(entry.id); setDueDateInput(entry.dueDate || ""); }}
                    editingDueDate={editingDueDate}
                    dueDateInput={dueDateInput}
                    onDueDateChange={setDueDateInput}
                    onDueDateSave={() => {
                      up(entry.id, { dueDate: dueDateInput });
                      setEditingDueDate(null);
                    }}
                    onDueDateQuickSet={(v: string) => { up(entry.id, { dueDate: v || null }); setEditingDueDate(null); }}
                    onDueDateCancel={() => setEditingDueDate(null)}
                    onDuplicate={() => duplicateEntry(entry.id)}
                    onCycleType={() => {
                      const types = ["task", "event", "note", "thought"] as const;
                      const next = types[(types.indexOf(entry.type as any) + 1) % types.length];
                      up(entry.id, { type: next });
                    }}
                    onEditStart={() => { setEditingId(entry.id); setEditText(entry.rawText); }}
                    isEditing={editingId === entry.id}
                    editingBodyId={editingBodyId}
                    bodyInput={bodyInput}
                    onBodyEdit={() => { setEditingBodyId(entry.id); setBodyInput(entry.body || ""); }}
                    onBodyChange={setBodyInput}
                    onBodySave={() => saveBody(entry.id)}
                    onBodyCancel={() => setEditingBodyId(null)}
                    onAiTitle={() => handleAiTitle(entry.id)}
                    aiTitling={aiTitlingId === entry.id}
                    editText={editText}
                    onEditChange={setEditText}
                    onEditSave={() => saveEdit(entry.id)}
                    onEditCancel={() => setEditingId(null)}
                    onTagClick={(t: string) => setFilterTag(filterTag === t ? null : t)}
                    filterTag={filterTag}
                    onImgDelete={(idx: number) => up(entry.id, { images: (entry.images||[]).filter((_, i) => i !== idx) })}
                    onImgClick={(url: string) => setLightboxImg(url)}
                    selectMode={selectMode}
                    isSelected={selectedEntries.has(entry.id)}
                    onToggleSelect={() => {
                      const next = new Set(selectedEntries);
                      if (next.has(entry.id)) next.delete(entry.id);
                      else next.add(entry.id);
                      setSelectedEntries(next);
                    }}
                    searchQuery={search}
                  />
                </div>
              );

              if (groupBy) {
                const bucketOf = (e: Entry) => {
                  if (groupBy === "type")     return e.type;
                  if (groupBy === "priority") return e.type === "task" ? e.priority : "__other";
                  if (groupBy === "context")  return e.contexts.length > 0 ? e.contexts[0] : "__none";
                  if (groupBy === "date") {
                    if (!e.dueDate) return "__none";
                    const r = resolveDueDate(e.dueDate, e.timestamp); if (!r) return "__none";
                    const now = new Date(), tod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    if (r < tod) return "__overdue";
                    if (r < new Date(tod.getTime() + 86400000))  return "__today";
                    if (r < new Date(tod.getTime() + 172800000)) return "__tomorrow";
                    if (r < new Date(tod.getTime() + 7*86400000)) return "__week";
                    return "__later";
                  }
                  return "__all";
                };
                const map = new Map<string, Entry[]>();
                filteredEntries.forEach(e => {
                  const k = bucketOf(e);
                  if (!map.has(k)) map.set(k, []);
                  map.get(k)!.push(e);
                });
                const ORDER: Record<string, string[] | null> = {
                  type:     ["task","event","note","thought"],
                  priority: ["high","medium","low","__other"],
                  context:  null,
                  date:     ["__overdue","__today","__tomorrow","__week","__later","__none"],
                };
                const keys = ORDER[groupBy] ? ORDER[groupBy]!.filter(k => map.has(k)) : [...map.keys()].sort();
                const META: Record<string, string> = {
                  task:"✓ Tasks", event:"◈ Events", note:"◉ Notes", thought:"◎ Thoughts",
                  high:"High priority", medium:"Med priority", low:"Low priority", __other:"Other",
                  __overdue:"⚠ Overdue", __today:"⏱ Today", __tomorrow:"📅 Tomorrow",
                  __week:"📅 This week", __later:"Later", __none: groupBy === "date" ? "No due date" : "No context",
                };
                return keys.map(k => (
                  <div key={k} style={{ marginBottom:18 }}>
                    <div style={{ fontSize:10, fontWeight:700, color: C.dim, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, paddingBottom:5, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:6 }}>
                      <span>{META[k] || k}</span>
                      <span style={{ color: C.dim, fontWeight:400 }}>· {map.get(k)!.length}</span>
                    </div>
                    {map.get(k)!.map((entry, i) => renderCard(entry, i, map.get(k)!.length))}
                  </div>
                ));
              }

              return filteredEntries.map((entry, i) => renderCard(entry, i, filteredEntries.length));
            })()}
            </div>{/* /tramline */}
            <div ref={streamEndRef} />
          </div>
        </div>

        {!isMobile && (
          <div style={{ width: 300, display:"flex", flexDirection:"column", background:C.bg }}>
            <div style={{ display:"flex", padding:"8px 10px", borderBottom:`1px solid ${C.border}`, gap:3, flexShrink:0 }}>
              {[
                { k:"all",    l:"All",    c: C.accent,  n: entries.filter(e=>!e.done).length },
                { k:"tasks",  l:"Tasks",  c:"#10b981", n: entries.filter(e=>e.type==="task"&&!e.done).length },
                { k:"events", l:"Events", c:"#f59e0b", n: entries.filter(e=>e.type==="event"&&!e.done).length },
                { k:"notes",  l:"Notes",  c:"#818cf8", n: entries.filter(e=>(e.type==="note"||e.type==="thought")&&!e.done).length },
                { k:"done",   l:"✓ Done", c:"#64748b", n: entries.filter(e=>e.done).length },
              ].map(({ k, l, c, n }) => (
                <button key={k} onClick={() => setDashTab(k)} style={{ flex:1, padding:"5px 4px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, fontFamily:"inherit", background: dashTab===k ? `${c}22` : "transparent", color: dashTab===k ? c : C.dim, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                  {l}
                  {n > 0 && <span style={{ fontSize:10, background: dashTab===k ? `${c}33` : C.surface, padding:"0 4px", borderRadius:5 }}>{n}</span>}
                </button>
              ))}
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"10px" }}>
              {entries
                .filter(e => 
                  (spaceFilter === "all" || e.contexts.includes(spaceFilter)) &&
                  (dashTab === "all" || dashTab === "done" || (dashTab === "tasks" ? e.type === "task" : dashTab === "events" ? e.type === "event" : e.type === "note" || e.type === "thought")))
                .filter(e => dashTab === "done" ? e.done : !e.done)
                .map(entry => (
                  <div key={entry.id}
                    draggable={dashTab !== "done" && streamSort === "manual"}
                    onDragStart={() => setDragEntryId(entry.id)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverEntryId(entry.id); }}
                    onDragLeave={() => setDragOverEntryId(null)}
                    onDrop={() => onDropEntry(entry.id)}
                    onDragEnd={() => { setDragEntryId(null); setDragOverEntryId(null); }}
                    style={{ outline: dragOverEntryId === entry.id && dragEntryId !== entry.id ? `2px solid ${C.accent}` : "none", borderRadius:14, transition:"outline 0.1s" }}
                  >
                  <DashboardCard 
                    key={`dc-${entry.id}`}
                    entry={entry} 
                    C={C}
                    isDashExp={dashExpanded === entry.id}
                    editingDueDate={editingDueDate}
                    dueDateInput={dueDateInput}
                    commentInputs={commentInputs}
                    editingComment={editingComment}
                    editCommentText={editingComment?.text || ""}
                    stInputs={stInputs}
                    onExpand={() => setDashExpanded(dashExpanded === entry.id ? null : entry.id)}
                    onToggleDone={() => toggleDone(entry.id)}
                    showRestore={dashTab === "done"}
                    onDelete={() => rm(entry.id)}
                    onPriority={(p: any) => up(entry.id, { priority: p })}
                    onDueDateEdit={() => { setEditingDueDate(entry.id); setDueDateInput(entry.dueDate || ""); }}
                    onDueDateChange={setDueDateInput}
                    onDueDateSave={() => saveDueDate(entry.id)}
                    onDueDateQuickSet={(v: string) => { up(entry.id, { dueDate: v || null }); setEditingDueDate(null); }}
                    onDueDateCancel={() => setEditingDueDate(null)}
                    onCommentInput={(val: string) => setCommentInputs(p => ({ ...p, [entry.id]: val }))}
                    onCommentAdd={() => addComment(entry.id)}
                    onCommentEditStart={(commentId: number, text: string) => setEditingComment({ entryId: entry.id, commentId, text })}
                    onCommentEditChange={(text: string) => setEditingComment(p => p ? { ...p, text } : null)}
                    onCommentEditSave={saveCommentEdit}
                    onCommentEditCancel={() => setEditingComment(null)}
                    onCommentDelete={(commentId: number) => deleteComment(entry.id, commentId)}
                    onSubtaskInput={(val: string) => setStInputs(p => ({ ...p, [entry.id]: val }))}
                    onSubtaskAdd={() => addSubtask(entry.id)}
                    onSubtaskToggle={(stId: number) => toggleSubtask(entry.id, stId)}
                    onSubtaskDelete={(stId: number) => deleteSubtask(entry.id, stId)}
                    searchQuery={search}
                  />
                  </div>
                ))}
            </div>
          </div>
        )}
      </>
        ) : primaryTab === "lists" ? (
          <div style={{ flex:1, display:"flex", overflow:"hidden", background: C.bg }}>
            {!isMobile && (
              <div style={{ width:240, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
                <div style={{ padding:"20px 15px 10px", fontSize:10, fontWeight:700, color: C.dim, textTransform:"uppercase", letterSpacing:"0.1em" }}>My Lists</div>
                <div style={{ flex:1, overflowY:"auto", padding:"0 10px" }}>
                  {lists.map(list => {
                    const active = selectedListId === list.id;
                    const doneCount = list.items.filter(i => i.done).length;
                    const totalCount = list.items.length;
                    const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
                    return (
                      <button 
                        key={list.id} 
                        onClick={() => { setSelectedListId(list.id); setListSearch(''); }}
                        style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, background: active ? `${list.color}15` : "none", border:"none", cursor:"pointer", textAlign:"left", marginBottom:4, transition:"all .15s" }}
                      >
                        <span style={{ fontSize:16 }}>{list.icon || "📋"}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color: active ? C.text : C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{list.name}</div>
                          <div style={{ fontSize:10, color: C.dim }}>{totalCount - doneCount} left</div>
                        </div>
                        <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${list.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color: list.color }}>
                          {pct}%
                        </div>
                      </button>
                    );
                  })}
                  <button 
                    onClick={() => {
                      const newList: List = { id: Date.now(), name: "New List", color: "#6366f1", items: [], icon: "📋", pinned: false, createdAt: new Date() };
                      setLists([...lists, newList]);
                      setSelectedListId(newList.id);
                    }}
                    style={{ width:"100%", padding:"10px", background:"none", border:`1px dashed ${C.border}`, borderRadius:10, color: C.dim, cursor:"pointer", fontSize:12, marginTop:10, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
                  >
                    <span>+</span> New List
                  </button>
                  <div style={{ marginTop:15 }}>
                    <div style={{ fontSize:10, fontWeight:700, color: C.dim, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Suggestions</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, paddingBottom:5 }}>
                      {[
                        { name: "Groceries",        icon: "🛒", color: "#10b981" },
                        { name: "Travel",           icon: "✈️", color: "#06b6d4" },
                        { name: "Movies",           icon: "🎬", color: "#6366f1" },
                        { name: "TV Shows",         icon: "📺", color: "#8b5cf6" },
                        { name: "Books",            icon: "📚", color: "#f59e0b" },
                        { name: "Restaurants",      icon: "🍽️", color: "#f97316" },
                        { name: "Music",            icon: "🎵", color: "#ec4899" },
                        { name: "Project Tasks",    icon: "🚀", color: "#8b5cf6" },
                        { name: "Home",             icon: "🏠", color: "#64748b" },
                        { name: "Gift Ideas",       icon: "🎁", color: "#e11d48" },
                        { name: "Fitness",          icon: "🏋️", color: "#16a34a" },
                        { name: "Wishlist",         icon: "⭐", color: "#0284c7" },
                        { name: "Work",             icon: "💼", color: "#7c3aed" },
                        { name: "Ideas",            icon: "💡", color: "#d97706" },
                        { name: "Recipes",          icon: "🍳", color: "#dc2626" },
                        { name: "Shopping",         icon: "🛍️", color: "#059669" },
                      ].map(s => (
                        <button 
                          key={s.name}
                          onClick={() => {
                            const newList: List = { id: Date.now(), name: s.name, color: s.color, items: [], icon: s.icon, pinned: false, createdAt: new Date() };
                            setLists([...lists, newList]);
                            setSelectedListId(newList.id);
                          }}
                          style={{ padding:"6px 12px", borderRadius:8, background: C.surface, border:`1px solid ${C.border}`, color: C.text, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}
                        >
                          {s.icon} {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {isMobile && (
                <div className="no-scrollbar" style={{ padding:"10px 15px", borderBottom:`1px solid ${C.border}`, overflowX:"auto", display:"flex", gap:8, background:C.surface }}>
                  {lists.map(list => (
                    <button 
                      key={list.id} 
                      onClick={() => { setSelectedListId(list.id); setListSearch(''); }}
                      style={{ padding:"6px 12px", borderRadius:20, background: selectedListId === list.id ? `${list.color}22` : "none", border: selectedListId === list.id ? `1px solid ${list.color}55` : `1px solid ${C.border}`, color: selectedListId === list.id ? list.color : C.dim, fontSize:12, fontWeight:600, whiteSpace:"nowrap", cursor:"pointer" }}
                    >
                      {list.icon} {list.name}
                    </button>
                  ))}
                  <button 
                    onClick={() => {
                      const newList: List = { id: Date.now(), name: "New List", color: "#6366f1", items: [], icon: "📋", pinned: false, createdAt: new Date() };
                      setLists([...lists, newList]);
                      setSelectedListId(newList.id);
                    }}
                    style={{ padding:"6px 12px", borderRadius:20, background:"none", border:`1px dashed ${C.border}`, color: C.dim, fontSize:12, whiteSpace:"nowrap", cursor:"pointer" }}
                  >
                    + New
                  </button>
                  <div style={{ width:1, height:20, background: C.border, flexShrink:0, alignSelf:"center" }} />
                  {[
                    { name: "Groceries",       icon: "🛒", color: "#10b981" },
                    { name: "Travel",          icon: "✈️", color: "#06b6d4" },
                    { name: "Movies",          icon: "🎬", color: "#6366f1" },
                    { name: "Books",           icon: "📚", color: "#f59e0b" },
                    { name: "Restaurants",     icon: "🍽️", color: "#f97316" },
                    { name: "Fitness",         icon: "🏋️", color: "#16a34a" },
                    { name: "Ideas",           icon: "💡", color: "#d97706" },
                    { name: "Shopping",        icon: "🛍️", color: "#059669" },
                    { name: "Movies",          icon: "🎬", color: "#6366f1" },
                    { name: "TV Shows",        icon: "📺", color: "#8b5cf6" },
                    { name: "Books",           icon: "📚", color: "#f59e0b" },
                    { name: "Restaurants",     icon: "🍽️", color: "#f97316" },
                    { name: "Music",           icon: "🎵", color: "#ec4899" },
                    { name: "Project Tasks",   icon: "🚀", color: "#8b5cf6" },
                    { name: "Gift Ideas",      icon: "🎁", color: "#e11d48" },
                    { name: "Fitness Goals",   icon: "🏋️", color: "#16a34a" },
                    { name: "Travel Wishlist", icon: "🌍", color: "#0284c7" },
                  ].map(s => (
                    <button 
                      key={s.name}
                      onClick={() => {
                        const newList: List = { id: Date.now(), name: s.name, color: s.color, items: [], icon: s.icon, pinned: false, createdAt: new Date() };
                        setLists([...lists, newList]);
                        setSelectedListId(newList.id);
                      }}
                      style={{ padding:"6px 12px", borderRadius:20, background: C.surface, border:`1px solid ${C.border}`, color: C.text, fontSize:12, whiteSpace:"nowrap", cursor:"pointer" }}
                    >
                      {s.icon} {s.name}
                    </button>
                  ))}
                </div>
              )}
              {(() => {
                const list = lists.find(l => l.id === selectedListId) || lists[0];
                if (!list) return (
                  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color: C.dim, fontSize:14 }}>
                    Create a list to get started
                  </div>
                );
                return (
                  <>
                    <div style={{ padding:"15px 25px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:`${C.bg}ee`, backdropFilter:"blur(10px)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <input 
                          value={list.icon || "📋"} 
                          onChange={e => setLists(lists.map(l => l.id === list.id ? { ...l, icon: e.target.value } : l))}
                          style={{ background:"none", border:"none", color: C.text, fontSize:24, outline:"none", padding:0, width:30, textAlign:"center" }}
                        />
                        <div>
                          <input 
                            value={list.name} 
                            onChange={e => {
                              const newName = e.target.value;
                              const guessed = guessEmoji(newName);
                              setLists(lists.map(l => l.id === list.id ? { ...l, name: newName, icon: (l.icon === "📋" && guessed) ? guessed : l.icon } : l));
                            }}
                            style={{ background:"none", border:"none", color: C.text, fontSize:20, fontWeight:800, outline:"none", padding:0, letterSpacing:"-0.5px" }}
                          />
                          <div style={{ fontSize:12, color: C.dim }}>{list.items.filter(i => !i.done).length} remaining · {list.items.filter(i => i.done).length} done</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => setLists(lists.filter(l => l.id !== list.id))} style={{ background:"none", border:`1px solid ${C.border}`, color: C.dim, cursor:"pointer", padding:"6px 10px", borderRadius:8, fontSize:14 }}>🗑</button>
                      </div>
                    </div>
                    <div style={{ flex:1, overflowY:"auto", padding: isMobile ? "25px 25px 80px" : "25px" }}>
                      <div style={{ maxWidth:700, margin:"0 auto" }}>
                        <div style={{ marginBottom:20, position:"relative" }}>
                          <input 
                            placeholder={`Search ${list.name}...`}
                            value={listSearch}
                            onChange={e => setListSearch(e.target.value)}
                            style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 15px", fontSize:14, color:C.text, outline:"none" }}
                          />
                        </div>
                        <div style={{ background: C.surface, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>
                          {list.items.filter(item => !listSearch || item.text.toLowerCase().includes(listSearch.toLowerCase())).map(item => (
                            <ListItem 
                              key={item.id} 
                              item={item} 
                              C={C} 
                              listColor={list.color}
                              isEditing={editingListItemId === item.id}
                              editText={editListItemText}
                              onEditChange={setEditListItemText}
                              onEditSave={() => {
                                const guessedEmoji = guessEmoji(editListItemText);
                                setLists(lists.map(l => l.id === list.id ? { ...l, items: l.items.map(i => i.id === item.id ? { ...i, text: editListItemText, emoji: i.emoji || guessedEmoji || null } : i) } : l));
                                setEditingListItemId(null);
                              }}
                              onEmojiChange={(emo: string) => {
                                setLists(lists.map(l => l.id === list.id ? { ...l, items: l.items.map(i => i.id === item.id ? { ...i, emoji: emo } : i) } : l));
                              }}
                              onEditCancel={() => setEditingListItemId(null)}
                              onStartEdit={() => {
                                setEditingListItemId(item.id);
                                setEditListItemText(item.text);
                              }}
                              onToggle={() => setLists(lists.map(l => l.id === list.id ? { ...l, items: l.items.map(i => i.id === item.id ? { ...i, done: !i.done } : i) } : l))}
                              onDelete={() => setLists(lists.map(l => l.id === list.id ? { ...l, items: l.items.filter(i => i.id !== item.id) } : l))}
                              isMobile={isMobile}
                              onDragStart={() => setDragItemId(item.id)}
                              onDragOver={(e: any) => { e.preventDefault(); setDragOverItemId(item.id); }}
                              onDragLeave={() => setDragOverItemId(null)}
                              onDragEnd={() => { setDragItemId(null); setDragOverItemId(null); }}
                              onDrop={() => {
                                if (dragItemId === null || dragItemId === item.id) return;
                                const l = lists.find(x => x.id === list.id); if (!l) return;
                                const items = [...l.items];
                                const fromIdx = items.findIndex(x => x.id === dragItemId);
                                const toIdx   = items.findIndex(x => x.id === item.id);
                                if (fromIdx < 0 || toIdx < 0) return;
                                const [moved] = items.splice(fromIdx, 1);
                                items.splice(toIdx, 0, moved);
                                setLists(lists.map(x => x.id === list.id ? { ...x, items } : x));
                                setDragItemId(null); setDragOverItemId(null);
                              }}
                              isDragOver={dragOverItemId === item.id}
                            />
                          ))}
                          <button onClick={() => {
                            const newItemId = Date.now();
                            const newItem = { id: newItemId, text: "", emoji: null, done: false, addedAt: new Date(), note: "" };
                            setLists(lists.map(l => l.id === list.id ? { ...l, items: [...l.items, newItem] } : l));
                            setEditingListItemId(newItemId);
                            setEditListItemText("");
                          }} style={{ width:"100%", padding:"15px", background:"none", border:"none", borderTop:`1px solid ${C.border}`, color: C.accent, cursor:"pointer", fontSize:13, fontWeight:600, textAlign:"left", display:"flex", alignItems:"center", gap:10 }}>
                            <span style={{ fontSize:18 }}>+</span> Add item
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : primaryTab === "insights" ? (
          <div style={{ flex:1, overflowY:"auto", background: C.bg, padding: isMobile ? "20px 20px 80px" : 40 }}>
            <div style={{ maxWidth: 800, margin:"0 auto" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:30 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg, ${C.accent}, #818cf8)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:20 }}>✦</div>
                <div>
                  <h1 style={{ margin:0, fontSize:24, fontWeight:800, letterSpacing:"-0.5px" }}>Insights</h1>
                  <p style={{ margin:0, fontSize:13, color: C.dim }}>Your productivity patterns and stream breakdown</p>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap:20, marginBottom:30 }}>
                <div style={{ background: C.surface, padding:20, borderRadius:16, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, color: C.dim, marginBottom:8 }}>Current Streak</div>
                  <div style={{ fontSize:32, fontWeight:800, color: C.accent }}>{insights.streak} <span style={{ fontSize:14, fontWeight:400, color: C.dim }}>days</span></div>
                </div>
                <div style={{ background: C.surface, padding:20, borderRadius:16, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, color: C.dim, marginBottom:8 }}>Completion Rate</div>
                  <div style={{ fontSize:32, fontWeight:800, color: "#10b981" }}>{insights.completionRate}<span style={{ fontSize:14, fontWeight:400, color: C.dim }}>%</span></div>
                </div>
                <div style={{ background: C.surface, padding:20, borderRadius:16, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:12, color: C.dim, marginBottom:8 }}>Total Entries</div>
                  <div style={{ fontSize:32, fontWeight:800, color: C.text }}>{entries.length}</div>
                </div>
              </div>

              <div style={{ background: C.surface, padding:25, borderRadius:20, border:`1px solid ${C.border}`, marginBottom:30 }}>
                <h3 style={{ margin:"0 0 20px 0", fontSize:15, fontWeight:700 }}>Activity (Last 7 Days)</h3>
                <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
                  {insights.activity.map((v, i) => {
                    const max = Math.max(...insights.activity, 1);
                    return (
                      <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                        <div style={{ width:"100%", height: `${(v/max)*100}%`, background: i === 6 ? C.accent : `${C.accent}44`, borderRadius:"4px 4px 0 0", minHeight:4 }} />
                        <div style={{ fontSize:10, color: C.dim }}>{["M","T","W","T","F","S","S"][(new Date().getDay() + i + 1) % 7]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:20 }}>
                <div style={{ background: C.surface, padding:25, borderRadius:20, border:`1px solid ${C.border}` }}>
                  <h3 style={{ margin:"0 0 15px 0", fontSize:15, fontWeight:700 }}>Type Breakdown</h3>
                  {["task","event","note","thought"].map(t => {
                    const count = entries.filter(e => e.type === t).length;
                    const pct = entries.length ? (count / entries.length) * 100 : 0;
                    return (
                      <div key={t} style={{ marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                          <span style={{ textTransform:"capitalize" }}>{t}s</span>
                          <span style={{ color: C.dim }}>{count} ({Math.round(pct)}%)</span>
                        </div>
                        <div style={{ height:6, background: C.bg, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width: `${pct}%`, background: (TM as any)[t].color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: C.surface, padding:25, borderRadius:20, border:`1px solid ${C.border}` }}>
                  <h3 style={{ margin:"0 0 15px 0", fontSize:15, fontWeight:700 }}>Top Tags</h3>
                  {(() => {
                    const tagCounts = allTags.map(tag => ({ tag, count: entries.filter(e => e.tags.includes(tag) || e.contexts.includes(tag)).length }));
                    return tagCounts.sort((a, b) => b.count - a.count).slice(0, 5).map(({ tag, count }) => (
                      <div key={tag} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <div style={{ flex:1, height:24, background: `${C.accent}11`, borderRadius:6, display:"flex", alignItems:"center", padding:"0 10px", fontSize:12 }}>{tag.startsWith("#") || tag.startsWith("@") ? tag : `#${tag}`}</div>
                        <div style={{ fontSize:12, fontWeight:700 }}>{count}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-scrollbar" style={{ flex:1, overflowY:"auto", background: "transparent", padding: isMobile ? "20px 20px 80px" : 40 }}>
            <div style={{ maxWidth: 640, margin:"0 auto" }}>
              <div style={{ marginBottom:36 }}>
                <div style={{ fontSize:10, fontWeight:700, color: C.accent, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Theme & Accent</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:15 }}>
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} style={{ background: `${C.surface}cc`, backdropFilter:"blur(12px)", border:`2px solid ${theme === t.id ? C.accent : C.border}`, borderRadius:12, padding:"14px 12px", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                      <div style={{ fontSize:12, fontWeight:700, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize:10, color: C.dim }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:15, background: `${C.surface}cc`, backdropFilter:"blur(12px)", padding:"12px 15px", borderRadius:12, border:`1px solid ${C.border}`, marginBottom:10 }}>
                  <span style={{ fontSize:12, fontWeight:600, color: C.dim }}>Accent Color</span>
                  <input 
                    type="color" 
                    value={accentOverride || C_BASE.accent} 
                    onChange={e => setAccentOverride(e.target.value)} 
                    style={{ width:40, height:24, border:"none", background:"none", cursor:"pointer" }} 
                  />
                  <button 
                    onClick={() => setAccentOverride(null)}
                    style={{ background:"none", border:"none", color: C.accent, fontSize:11, fontWeight:600, cursor:"pointer" }}
                  >
                    Reset
                  </button>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:36, padding:"0 5px" }}>
                  {["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#f43f5e", "#14b8a6"].map(c => (
                    <button 
                      key={c} 
                      onClick={() => setAccentOverride(c)}
                      style={{ width:22, height:22, borderRadius:"50%", background:c, border: accentOverride === c ? `2px solid ${C.text}` : `1px solid ${C.border}`, cursor:"pointer", transition:"transform .1s" }}
                      onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"}
                      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:36 }}>
                <div style={{ fontSize:10, fontWeight:700, color: C.accent, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Font & Scale</div>
                <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                    {Object.keys(FONTS).map(f => (
                      <button key={f} onClick={() => setFontFamily(f)} style={{ background: `${C.surface}cc`, backdropFilter:"blur(12px)", border:`2px solid ${fontFamily === f ? C.accent : C.border}`, borderRadius:10, padding:"10px", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily: (FONTS as any)[f] }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:15, background: `${C.surface}cc`, backdropFilter:"blur(12px)", padding:"12px 15px", borderRadius:12, border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, fontWeight:600, color: C.dim }}>Text Size</span>
                    <input type="range" min="0.8" max="1.2" step="0.05" value={fontScale} onChange={e => setFontScale(parseFloat(e.target.value))} style={{ flex:1, accentColor: C.accent }} />
                    <span style={{ fontSize:12, fontWeight:700, minWidth:35 }}>{Math.round(fontScale * 100)}%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:36 }}>
                <div style={{ fontSize:10, fontWeight:700, color: C.accent, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Background</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:12 }}>
                  {[
                    { id: "none",  label: "None",           preview: null },
                    { id: "mesh",  label: "Mesh Gradient",  preview: { background: `radial-gradient(ellipse at 20% 40%, ${C.accent}99 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #ec489999 0%, transparent 50%), radial-gradient(ellipse at 60% 10%, #06b6d499 0%, transparent 50%)` } },
                    { id: "noise", label: "Film Grain",     preview: { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='60' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`, opacity: 0.6 } },
                    { id: "grid",  label: "Blueprint Grid", preview: { backgroundImage: `linear-gradient(${C.accent}44 1px, transparent 1px), linear-gradient(90deg, ${C.accent}44 1px, transparent 1px)`, backgroundSize:"14px 14px" } },
                    { id: "image", label: "Custom Image",   preview: bgImage ? { backgroundImage:`url(${bgImage})`, backgroundSize:"cover", backgroundPosition:"center" } : null },
                  ].map(p => (
                    <button key={p.id} onClick={() => setBgPreset(p.id)} style={{ background: `${C.surface}cc`, backdropFilter:"blur(12px)", border:`2px solid ${bgPreset === p.id ? C.accent : C.border}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:8, textAlign:"left", transition:"border-color .15s" }}>
                      <div style={{ width:"100%", height:44, borderRadius:7, background: C.bg, border:`1px solid ${C.border}`, overflow:"hidden", position:"relative", flexShrink:0 }}>
                        {p.preview ? (
                          <div style={{ position:"absolute", inset:0, ...p.preview }} />
                        ) : (
                          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color: C.dimmer }}>∅</div>
                        )}
                      </div>
                      <span style={{ fontSize:12, fontWeight:600, color: bgPreset === p.id ? C.accent : C.text }}>{p.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, background: `${C.surface}cc`, backdropFilter:"blur(12px)", padding:"12px 15px", borderRadius:12, border:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:15 }}>
                      <span style={{ fontSize:12, fontWeight:600, color: C.dim }}>Upload Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const base64 = ev.target?.result as string;
                              setBgImage(base64);
                              setBgPreset("image");
                              localStorage.setItem("tikky_bgimage", base64);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ fontSize:11, color: C.dim, flex:1 }}
                      />
                      {bgImage && (
                        <button onClick={() => { setBgImage(null); if(bgPreset === "image") setBgPreset("none"); localStorage.removeItem("tikky_bgimage"); }} style={{ background:"none", border:"none", color:"#ef4444", fontSize:11, cursor:"pointer" }}>Remove</button>
                      )}
                    </div>
                    {bgImage && (
                      <div style={{ width:"100%", height:80, borderRadius:8, background:`url(${bgImage})`, backgroundSize:"cover", backgroundPosition:"center", border:`1px solid ${C.border}` }} />
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:15, background: `${C.surface}cc`, backdropFilter:"blur(12px)", padding:"12px 15px", borderRadius:12, border:`1px solid ${C.border}` }}>
                    <span style={{ fontSize:12, fontWeight:600, color: C.dim }}>Overlay Opacity</span>
                    <input type="range" min="0" max="1" step="0.05" value={bgOpacity} onChange={e => setBgOpacity(parseFloat(e.target.value))} style={{ flex:1, accentColor: C.accent }} />
                    <span style={{ fontSize:12, fontWeight:700, minWidth:35 }}>{Math.round(bgOpacity * 100)}%</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom:36 }}>
                <div style={{ fontSize:10, fontWeight:700, color: C.accent, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Product Pulse</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
                  {[
                    { v: "v1.2.0", name: "The Precision Update", status: "ACTIVE", color: C.accent, notes: ["Claude AI integration for smart entry classification", "Railway deployment — accessible anywhere", "Async compose with live feedback"] },
                    { v: "v1.1.0", name: "Foundation Layer", status: "SHIPPED", color: "#10b981", notes: ["Core task management engine", "Focus / Pomodoro timer", "Bulk operations & select mode"] },
                    { v: "v1.3.0", name: "Neural Workflows", status: "UPCOMING", color: C.dim, notes: ["Calendar view for events", "Smart templates & recurring tasks", "Native push notifications"] },
                  ].map(pulse => (
                    <div key={pulse.v} style={{ background: `${C.surface}cc`, backdropFilter:"blur(12px)", borderRadius:16, border:`1px solid ${C.border}`, padding:20, position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:4, background: pulse.color }} />
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:10, fontWeight:700, color: pulse.color, fontFamily:"monospace", marginBottom:4 }}>{pulse.v}</div>
                          <div style={{ fontSize:15, fontWeight:700 }}>{pulse.name}</div>
                        </div>
                        <div style={{ fontSize:9, fontWeight:800, background: `${pulse.color}22`, color: pulse.color, padding:"3px 8px", borderRadius:4, letterSpacing:"0.05em" }}>{pulse.status}</div>
                      </div>
                      <ul style={{ margin:0, padding:"0 0 0 18px", fontSize:12, color: C.dim, lineHeight:1.6 }}>
                        {pulse.notes.map((note, i) => <li key={i}>{note}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:10, fontWeight:700, color: C.accent, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>Coming Up</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                  {roadmap.map(item => (
                    <div key={item.label} style={{ background: `${C.surface}cc`, backdropFilter:"blur(12px)", borderRadius:12, border:`1px solid ${C.border}`, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ fontSize:18, flexShrink:0, lineHeight:1.2 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, marginBottom:2 }}>{item.label}</div>
                        <div style={{ fontSize:11, color: C.dim, lineHeight:1.4 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize:10, fontWeight:700, color: "#10b981", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12 }}>✓ Shipped</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {shipped.map(item => (
                    <div key={item.label} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 12px", background: `${C.surface}cc`, backdropFilter:"blur(12px)", borderRadius:10, border:`1px solid ${C.border}` }}>
                      <span style={{ color:"#10b981", fontWeight:700, fontSize:12, flexShrink:0 }}>✓</span>
                      <div>
                        <span style={{ fontSize:12, fontWeight:600 }}>{item.label}</span>
                        <span style={{ fontSize:11, color: C.dim, marginLeft:6 }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>{/* /outer-tramline */}
      </div>

      {isMobile && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, height:64, background: C.surface, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-around", zIndex:500, backdropFilter:"blur(12px)", paddingBottom:"env(safe-area-inset-bottom)" }}>
          {[
            { key:"stream",   label:"Stream",   icon:"🗂️" },
            { key:"insights", label:"Insights", icon:"📈" },
            { key:"add",      label:"Add",      icon:"➕" },
            { key:"lists",    label:"Lists",    icon:"📋" },
            { key:"settings", label:"Settings", icon:"⚙️" },
          ].map(({ key, label, icon }) => (
            <button 
              key={key} 
              onClick={() => {
                if (key === "add") setShowMobileCompose(true);
                else setPrimaryTab(key as any);
              }} 
              style={{ 
                flex:1, 
                height:"100%", 
                background:"none", 
                border:"none", 
                display:"flex", 
                flexDirection:"column", 
                alignItems:"center", 
                justifyContent:"center", 
                gap:2, 
                color: (key === "add") ? C.accent : (primaryTab === key ? C.accent : C.dim), 
                transition:"all .2s",
                opacity: (key === "add" || primaryTab === key) ? 1 : 0.6
              }}
            >
              <div style={{ 
                width: key === "add" ? 40 : "auto", 
                height: key === "add" ? 40 : "auto", 
                borderRadius: key === "add" ? 12 : 0,
                background: key === "add" ? `${C.accent}22` : "none",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                marginBottom: key === "add" ? 2 : 0
              }}>
                <span style={{ fontSize: key === "add" ? 24 : 20 }}>{icon}</span>
              </div>
              <span style={{ fontSize:8, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Removed floating quick add bar to save space */}

      {isMobile && showMobileFilters && (
        <div style={{ position:"fixed", inset:0, background: "rgba(0,0,0,0.8)", zIndex:2000, display:"flex", alignItems:"flex-end" }}>
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            style={{ width:"100%", background: C.surface, borderTopLeftRadius:24, borderTopRightRadius:24, padding:25, maxHeight:"80%", overflowY:"auto" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:18, fontWeight:700 }}>Filters & Sort</h2>
              <button onClick={() => setShowMobileFilters(false)} style={{ background: C.bg, border:"none", width:32, height:32, borderRadius:"50%", color: C.text, fontSize:14 }}>✕</button>
            </div>
            
            <div style={{ marginBottom:25 }}>
              <div style={{ fontSize:11, fontWeight:800, color: C.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Spaces</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
                {["All", "Work", "Personal"].map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSpaceFilter(cat === "All" ? "all" : cat.toLowerCase())}
                    style={{ fontSize:13, padding:"12px", borderRadius:12, border: (spaceFilter === "all" && cat === "All") || spaceFilter === cat.toLowerCase() ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: (spaceFilter === "all" && cat === "All") || spaceFilter === cat.toLowerCase() ? `${C.accent}15` : C.bg, color: (spaceFilter === "all" && cat === "All") || spaceFilter === cat.toLowerCase() ? C.accent : C.text, fontWeight:600 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:25 }}>
              <div style={{ fontSize:11, fontWeight:800, color: C.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Quick Filters</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
                <button 
                  onClick={() => setDueFilter(dueFilter === "today" ? null : "today")}
                  style={{ fontSize:13, padding:"12px", borderRadius:12, border: dueFilter === "today" ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: dueFilter === "today" ? `${C.accent}15` : C.bg, color: dueFilter === "today" ? C.accent : C.text, fontWeight:600 }}
                >
                  Due Today
                </button>
                <button 
                  onClick={() => setDueFilter(dueFilter === "overdue" ? null : "overdue")}
                  style={{ fontSize:13, padding:"12px", borderRadius:12, border: dueFilter === "overdue" ? `2px solid #ef4444` : `1px solid ${C.border}`, background: dueFilter === "overdue" ? "#ef444415" : C.bg, color: dueFilter === "overdue" ? "#ef4444" : C.text, fontWeight:600 }}
                >
                  Overdue
                </button>
              </div>
            </div>

            <div style={{ marginBottom:25 }}>
              <div style={{ fontSize:11, fontWeight:800, color: C.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Type</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:8 }}>
                {[null,"task","event","note","thought"].map(t => {
                  const active = typeFilter === t;
                  const col    = t ? (TM as any)[t].color : C.accent;
                  const label  = t ? (TM as any)[t].icon : "All";
                  return (
                    <button key={String(t)} onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                      style={{ fontSize:16, height:48, borderRadius:12, border: active ? `2px solid ${col}` : `1px solid ${C.border}`, background: active ? `${col}15` : C.bg, color: active ? col : C.dim, cursor:"pointer" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom:25 }}>
              <div style={{ fontSize:11, fontWeight:800, color: C.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Sort By</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
                {[["newest","Newest"],["oldest","Oldest"],["priority","Priority"],["manual","Manual"]].map(([s, label]) => (
                  <button key={s} onClick={() => setStreamSort(s)} style={{ fontSize:13, padding:"12px", borderRadius:12, border: streamSort===s ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: streamSort===s ? `${C.accent}15` : C.bg, color: streamSort===s ? C.accent : C.text, fontWeight:600 }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:25 }}>
              <div style={{ fontSize:11, fontWeight:800, color: C.dim, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Group By</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
                {[["type","Type"],["priority","Priority"],["context","Context"],["date","Due Date"]].map(([g, label]) => (
                  <button key={g} onClick={() => setGroupBy(groupBy === g ? null : g)} style={{ fontSize:13, padding:"12px", borderRadius:12, border: groupBy===g ? `2px solid ${C.accent}` : `1px solid ${C.border}`, background: groupBy===g ? `${C.accent}15` : C.bg, color: groupBy===g ? C.accent : C.text, fontWeight:600 }}>{label}</button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => { setTypeFilter(null); setFilterTag(null); setDueFilter(null); setSearch(""); setGroupBy(null); setStreamSort("newest"); }}
              style={{ width:"100%", padding:"15px", borderRadius:16, background:"#ef444415", color:"#ef4444", border:"none", fontWeight:700, fontSize:14, marginBottom:10 }}
            >
              Reset All Filters
            </button>
            <button 
              onClick={() => setShowMobileFilters(false)}
              style={{ width:"100%", padding:"15px", borderRadius:16, background: C.accent, color:"#fff", border:"none", fontWeight:700, fontSize:14 }}
            >
              Apply
            </button>
          </motion.div>
        </div>
      )}

      {isMobile && showMobileCompose && (
        <div style={{ position:"fixed", inset:0, background: C.bg, zIndex:1000, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"15px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background: C.surface }}>
            <button onClick={() => setShowMobileCompose(false)} style={{ background:"none", border:"none", color: C.dim, fontSize:14, fontWeight:600 }}>Cancel</button>
            <div style={{ fontWeight:700, fontSize:16 }}>New Entry</div>
            <button onClick={() => { addEntry(); setShowMobileCompose(false); }} style={{ background: C.accent, border:"none", color:"#fff", padding:"6px 16px", borderRadius:10, fontSize:14, fontWeight:700 }}>Add</button>
          </div>
          <div style={{ flex:1, padding:20, overflowY:"auto" }}>
            <textarea
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="What's on your mind?..."
              style={{ width:"100%", height:"100%", background:"none", border:"none", fontSize:18, color: C.text, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.5 }}
            />
          </div>
          <div style={{ padding:"15px 20px", borderTop:`1px solid ${C.border}`, display:"flex", gap:15, background: C.surface }}>
            <button onClick={() => onAddPhoto()} style={{ background: C.bg, border:`1px solid ${C.border}`, color: C.text, padding:"10px", borderRadius:12, flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:14, fontWeight:600 }}>
              📷 Photo
            </button>
            <button onClick={() => { /* mic logic if any */ }} style={{ background: C.bg, border:`1px solid ${C.border}`, color: C.text, padding:"10px", borderRadius:12, flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:14, fontWeight:600 }}>
              🎙️ Voice
            </button>
          </div>
          {composeImages.length > 0 && (
            <div className="no-scrollbar" style={{ padding:"10px 20px", background: C.bg, display:"flex", gap:10, overflowX:"auto", borderTop:`1px solid ${C.border}` }}>
              {composeImages.map((src, i) => (
                <div key={i} style={{ position:"relative", flexShrink:0 }}>
                  <img src={src} alt="" style={{ width:60, height:60, objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}` }} />
                  <button onClick={() => setComposeImages(p => p.filter((_, idx) => idx !== i))} style={{ position:"absolute", top:-5, right:-5, width:20, height:20, borderRadius:"50%", background:"#ef4444", color:"#fff", border:"none", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <input 
        type="file" 
        ref={photoInputRef} 
        onChange={handlePhotoUpload} 
        style={{ display: "none" }} 
        accept="image/*" 
      />
      <input 
        type="file" 
        ref={bgFileRef} 
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => setBgImage(ev.target?.result as string);
          reader.readAsDataURL(file);
        }} 
        style={{ display: "none" }} 
        accept="image/*" 
      />
    </div>
  );
}





