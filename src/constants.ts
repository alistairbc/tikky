export const CLR = {
  danger:  "#ef4444",
  success: "#10b981",
  warn:    "#f59e0b",
  info:    "#6366f1",
  note:    "#818cf8",
  thought: "#64748b",
  violet:  "#8b5cf6",
  cyan:    "#06b6d4",
  pink:    "#ec4899",
  orange:  "#f97316",
};

export const TM = {
  task:    { label: "Task",    color: CLR.success, icon: "✓" },
  event:   { label: "Event",   color: CLR.warn,    icon: "◈" },
  note:    { label: "Note",    color: CLR.note,    icon: "◉" },
  thought: { label: "Thought", color: CLR.thought, icon: "◎" },
};

export const TYPES = ["task", "event", "note", "thought"] as const;
export type EntryType = typeof TYPES[number];

export const PM = {
  high:   { label: "High", color: CLR.danger },
  medium: { label: "Med",  color: CLR.warn },
  low:    { label: "Low",  color: "#475569" }
};
export type Priority = keyof typeof PM;

export const TIKKY_VERSION = "1.2.0";

export const FONTS = {
  inter:  "'Inter','Segoe UI',system-ui,sans-serif",
  serif:  "Georgia,'Times New Roman',serif",
  mono:   "'JetBrains Mono','Fira Code',Menlo,monospace",
  system: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

export const LIST_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];
export const LIST_ICONS  = ["📋","🎬","📚","🛒","💡","✈","🎯","🏋","🎵","🍿","🌿","💼","🧠","🔖","🗂","⭐"];

export const LIST_TEMPLATES = [
  { name:"Movies to Watch",  icon:"🎬", color:"#6366f1" },
  { name:"TV to Watch",      icon:"📺", color:"#f97316" },
  { name:"Books to Read",    icon:"📚", color:"#10b981" },
  { name:"Shopping",         icon:"🛒", color:"#f59e0b" },
  { name:"Travel Wishlist",  icon:"✈", color:"#06b6d4" },
  { name:"Ideas",            icon:"💡", color:"#8b5cf6" },
  { name:"Goals",            icon:"🎯", color:"#ef4444" },
];
