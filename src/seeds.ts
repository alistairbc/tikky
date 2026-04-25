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
    id: 101, name: "Movies to Watch", icon: "🎬", color: "#6366f1", pinned: false, createdAt: new Date(),
    items: [
      { id: 1011, text: "The Brutalist", done: false, note: "", addedAt: new Date() },
      { id: 1012, text: "Dune: Prophecy",  done: false, note: "", addedAt: new Date() },
      { id: 1013, text: "Conclave",        done: true,  note: "Watched — great ending", addedAt: new Date(Date.now()-86400000) },
    ],
  },
  {
    id: 102, name: "Books to Read", icon: "📚", color: "#10b981", pinned: false, createdAt: new Date(),
    items: [
      { id: 1021, text: "Clear Thinking — Shane Parrish",    done: false, note: "", addedAt: new Date() },
      { id: 1022, text: "The Creative Act — Rick Rubin",     done: false, note: "", addedAt: new Date() },
      { id: 1023, text: "Build — Tony Fadell",               done: true,  note: "Finished Mar 2026", addedAt: new Date(Date.now()-604800000) },
    ],
  },
];
