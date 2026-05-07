import { Entry, List } from "./types";

export const SEED: Entry[] = [
  {
    id: 1,
    rawText: 'Welcome to Tikky! Type anything — tasks, events, notes, or thoughts. Use #tags, @contexts, or "by Friday" to stay organised.',
    text: 'Welcome to Tikky! Type anything naturally.',
    type: "note", priority: "low", done: false, pinned: false, dueDate: null,
    comments: [], tags: [], contexts: [], subtasks: [], timestamp: new Date(),
    body: '**Getting started:**\n- "Call Alex tomorrow at 3pm #work" — Tikky classifies it automatically\n- Use **#tags** and **@contexts** to organise your stream\n- Type **/** to see commands like /summary and /help\n- Swipe right → to complete, left ← to delete on mobile',
  },
  {
    id: 2,
    rawText: 'Try completing this sample task',
    text: 'Try completing this sample task',
    type: "task", priority: "medium", done: false, pinned: false, dueDate: null,
    comments: [], tags: [], contexts: [],
    subtasks: [
      { id: 21, text: "Click the checkbox or swipe right to complete", done: false },
      { id: 22, text: "Double-click any card title to edit it", done: false },
      { id: 23, text: "Add your first real task above ↑", done: false },
    ],
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: 3,
    rawText: 'Team standup tomorrow at 9am @work',
    text: 'Team standup',
    type: "event", priority: "low", done: false, pinned: false,
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
    dueTime: "09:00",
    comments: [], tags: [], contexts: ["@work"], subtasks: [], timestamp: new Date(Date.now() - 120000),
  },
  {
    id: 4,
    rawText: 'The best ideas deserve a home — use thoughts to capture whatever is on your mind, no pressure to action them',
    text: 'The best ideas deserve a home',
    type: "thought", priority: "low", done: false, pinned: false, dueDate: null,
    comments: [], tags: [], contexts: [], subtasks: [], timestamp: new Date(Date.now() - 180000),
  },
];

export const SEED_LISTS: List[] = [
  {
    id: 101, name: "Movies to Watch", icon: "\u{1F3AC}", color: "#6366f1", pinned: false, createdAt: new Date(),
    items: [
      { id: 1011, text: "The Brutalist",  done: false, note: "", addedAt: new Date() },
      { id: 1012, text: "Dune: Prophecy", done: false, note: "", addedAt: new Date() },
      { id: 1013, text: "Conclave",       done: true,  note: "Watched — great ending", addedAt: new Date(Date.now()-86400000) },
    ],
  },
  {
    id: 102, name: "TV to Watch", icon: "\u{1F4FA}", color: "#8b5cf6", pinned: false, createdAt: new Date(),
    items: [
      { id: 1021, text: "Severance S2",   done: false, note: "", addedAt: new Date() },
      { id: 1022, text: "The Bear S3",    done: false, note: "", addedAt: new Date() },
      { id: 1023, text: "Slow Horses S4", done: false, note: "", addedAt: new Date() },
      { id: 1024, text: "White Lotus S3", done: true,  note: "Finished", addedAt: new Date(Date.now()-604800000) },
    ],
  },
  {
    id: 103, name: "Books to Read", icon: "\u{1F4DA}", color: "#10b981", pinned: false, createdAt: new Date(),
    items: [
      { id: 1031, text: "Clear Thinking — Shane Parrish", done: false, note: "", addedAt: new Date() },
      { id: 1032, text: "The Creative Act — Rick Rubin",  done: false, note: "", addedAt: new Date() },
      { id: 1033, text: "Build — Tony Fadell",            done: true,  note: "Finished Mar 2026", addedAt: new Date(Date.now()-604800000) },
    ],
  },
  {
    id: 104, name: "Restaurants to Try", icon: "\u{1F37D}\uFE0F", color: "#f59e0b", pinned: false, createdAt: new Date(),
    items: [
      { id: 1041, text: "Attica",      done: false, note: "Book well in advance", addedAt: new Date() },
      { id: 1042, text: "Gimlet",      done: false, note: "Carlton", addedAt: new Date() },
      { id: 1043, text: "Supernormal", done: true,  note: "Excellent dumplings", addedAt: new Date(Date.now()-172800000) },
    ],
  },
  {
    id: 105, name: "Travel Wishlist", icon: "\u{2708}\uFE0F", color: "#06b6d4", pinned: false, createdAt: new Date(),
    items: [
      { id: 1051, text: "Japan — Kyoto & Osaka", done: false, note: "Cherry blossom", addedAt: new Date() },
      { id: 1052, text: "Portugal — Lisbon",     done: false, note: "", addedAt: new Date() },
      { id: 1053, text: "Italy — Amalfi Coast",  done: false, note: "", addedAt: new Date() },
    ],
  },
  {
    id: 106, name: "Music to Listen", icon: "\u{1F3B5}", color: "#ec4899", pinned: false, createdAt: new Date(),
    items: [
      { id: 1061, text: "Charli xcx — BRAT",                        done: true,  note: "Album of the year", addedAt: new Date(Date.now()-259200000) },
      { id: 1062, text: "Arooj Aftab — Night Reign",                 done: false, note: "", addedAt: new Date() },
      { id: 1063, text: "Mk.gee — Two Star & The Dream Police",      done: false, note: "", addedAt: new Date() },
    ],
  },
];
