import { Entry, List } from "./types";

export const SEED: Entry[] = [
  {
    id:1,
    rawText: 'Welcome! Type naturally — #tags, @context, action verbs, and "by Tuesday" due dates are all auto-detected. Type /help to see all commands.',
    text:    'Welcome! Type naturally — tags, @context, action verbs, and due dates are all auto-detected. Type /help to see all commands.',
    type:"note", priority:"low", done:false, pinned:false, dueDate:null, comments:[], tags:[], contexts:[], subtasks:[], timestamp: new Date()
  },
  {
    id:2,
    rawText: "ALDI Roadmap - Create a slide by Tuesday that encompasses the AISEO/GEO items and digital evolution coming over 26/27 #aldi #roadmap @aldimobile",
    text:    "ALDI Roadmap: Create slide covering AISEO/GEO items and digital evolution 26/27",
    type:"task", priority:"medium", done:false, pinned:false, dueDate:"Tuesday", comments:[], tags:["#aldi","#roadmap"], contexts:["@aldimobile"], subtasks:[{id:21,text:"Pull AISEO/GEO performance data",done:false},{id:22,text:"Draft slide structure",done:false}], timestamp: new Date(Date.now()-120000)
  },
  {
    id:3,
    rawText: "Team sync meeting tomorrow at 10am — confirm attendees #internal @medion",
    text:    "Team sync tomorrow at 10am — confirm attendees",
    type:"event", priority:"medium", done:false, pinned:false, dueDate:"Tomorrow 10am", comments:[], tags:["#internal"], contexts:["@medion"], subtasks:[], timestamp: new Date(Date.now()-240000)
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
