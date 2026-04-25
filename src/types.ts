import { EntryType, Priority } from "./constants";
export type { Priority };

export interface Subtask {
  id: number;
  text: string;
  done: boolean;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: Date;
}

export interface Entry {
  id: number;
  rawText: string;
  text: string;
  emoji?: string | null;
  type: EntryType;
  priority: Priority;
  done: boolean;
  pinned: boolean;
  dueDate: string | null;
  comments: Comment[];
  tags: string[];
  contexts: string[];
  subtasks: Subtask[];
  images?: string[];
  timestamp: Date;
  isNew?: boolean;
  updated?: boolean;
}

export interface ListItemType {
  id: number;
  text: string;
  emoji?: string | null;
  done: boolean;
  note: string;
  addedAt: Date;
}

export interface List {
  id: number;
  name: string;
  icon: string;
  color: string;
  pinned: boolean;
  createdAt: Date;
  items: ListItemType[];
}

export interface Prefs {
  theme?: string;
  accent?: string;
  font?: string;
  scale?: number;
  bgPreset?: string;
  bgOpacity?: number;
  streamSort?: string;
}
