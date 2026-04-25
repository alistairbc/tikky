import { EntryType, Priority } from "../constants";
import { ACTION_VERBS, DAYS, DUE_RX } from "../constants_nlp";

export const extractTags     = (t: string) => [...new Set((t.match(/#[\w-]+/g)  || []).map(x => x.toLowerCase()))];
export const extractContexts = (t: string) => [...new Set((t.match(/@[\w-]+/g)  || []).map(x => x.toLowerCase()))];

export const extractDue = (t: string) => { 
  const m = t.match(DUE_RX); 
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null; 
};

export function extractEventTime(text: string) {
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1).toLowerCase();
  const DAY_WORDS = DAYS + "|tomorrow|tonight|today|this morning|this afternoon|this evening|this arvo|next week";
  const atM = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
  const dayM = text.match(new RegExp(`\\b(${DAY_WORDS})\\b`, "i"));
  const timeM = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  const dayStr = dayM ? cap(dayM[1]) : null;
  const timeStr = atM ? atM[1] : (timeM ? timeM[1] : null);
  if (dayStr && timeStr) return `${dayStr} ${timeStr}`;
  if (timeStr) return timeStr;
  if (dayStr) return dayStr;
  return null;
}

export function guessEmoji(text: string): string | null {
  const lo = text.toLowerCase();
  if (/\b(grocery|food|eat|buy|shop|market|apple|banana|milk|bread|egg|cheese|fruit|vege|snack|cook|dinner|lunch|breakfast|meal)\b/.test(lo)) return "🛒";
  if (/\b(travel|pack|trip|flight|plane|airport|hotel|suitcase|vacation|holiday|passport|ticket|tour|visit)\b/.test(lo)) return "✈️";
  if (/\b(read|book|library|kindle|novel|study|learn|paper|article|magazine|blog|write|author|poem|story)\b/.test(lo)) return "📚";
  if (/\b(project|work|code|dev|build|launch|rocket|startup|business|office|meeting|sync|call|zoom|slack|email|mail|task|todo|to-do|complete|success|finish)\b/.test(lo)) return "🚀";
  if (/\b(gym|workout|run|fit|health|exercise|sport|yoga|lift|stretch|walk|bike|swim|cardio|training)\b/.test(lo)) return "💪";
  if (/\b(money|pay|bill|rent|bank|cash|cost|price|budget|invest|save|spend|wallet|crypto|stock)\b/.test(lo)) return "💰";
  if (/\b(idea|thought|think|brain|lightbulb|concept|vision|dream|imagine|creative|art|design|sketch|draw)\b/.test(lo)) return "💡";
  if (/\b(meeting|call|zoom|sync|talk|chat|phone|mobile|ring|message|sms|whatsapp|signal|discord)\b/.test(lo)) return "📞";
  if (/\b(home|house|clean|fix|repair|garden|yard|decor|furniture|kitchen|bedroom|living|bathroom)\b/.test(lo)) return "🏠";
  if (/\b(gift|present|birthday|party|celebrate|anniversary|wedding|event|festival|holiday|christmas|new year)\b/.test(lo)) return "🎁";
  if (/\b(movie|film|watch|netflix|cinema|tv|show|series|video|youtube|twitch|stream)\b/.test(lo)) return "🎬";
  if (/\b(music|song|listen|spotify|concert|instrument|guitar|piano|drums|violin|band|singer|album)\b/.test(lo)) return "🎵";
  if (/\b(game|play|xbox|ps5|switch|gaming|steam|epic|nintendo|board|card|puzzle|chess)\b/.test(lo)) return "🎮";
  if (/\b(coffee|tea|drink|cafe|starbucks|barista|latte|espresso|matcha|water|juice|soda|beer|wine|cocktail)\b/.test(lo)) return "☕";
  if (/\b(pet|dog|cat|animal|vet|bird|fish|hamster|rabbit|horse|zoo|wildlife)\b/.test(lo)) return "🐾";
  if (/\b(car|drive|parking|mechanic|gas|fuel|uber|taxi|bus|train|subway|metro|tram|bike|bicycle|scooter)\b/.test(lo)) return "🚗";
  if (/\b(mail|email|letter|post|package|delivery|shipping|fedex|ups|dhl|courier)\b/.test(lo)) return "✉️";
  if (/\b(alert|warning|danger|urgent|critical|important|emergency|help|sos|fix|broken|error|bug|issue)\b/.test(lo)) return "⚠️";
  if (/\b(note|fyi|reminder|summary|recap|update|heads up|info|fact|data|stat|report|doc|pdf|file|folder)\b/.test(lo)) return "📝";
  return null;
}

export function analyze(text: string) {
  const lo = text.toLowerCase();
  const hasDue  = DUE_RX.test(text);
  const hasVerb = ACTION_VERBS.test(text.trim());
  
  let type: EntryType = "thought";
  // Task: action verb OR "by [day]" / "due [day]"
  if (hasVerb || hasDue || /\btodo[:\s]|\btask[:\s]|\bneed to\b|\bhave to\b|\bremember to\b|\bdon'?t forget\b|\bfollow[- ]?up\b|\baction item/.test(lo)) {
    type = "task";
  } 
  // Event: meeting, sync, call, catch-up, standup, pitch, demo, presentation, lunch, dinner, interview, workshop, webinar, conference, session, appointment OR time expression
  else if (/\bmeeting\b|\bsync\b|\bcall\b|\bcatch-up\b|\bstandup\b|\bstand-up\b|\bpitch\b|\bdemo\b|\bpresentation\b|\blunch\b|\bdinner\b|\binterview\b|\bworkshop\b|\bwebinar\b|\bconference\b|\bsession\b|\bappointment\b|\bat \d+[:\s]|\b\d{1,2}(?:am|pm)\b|\bon (mon|tue|wed|thu|fri|sat|sun|\w+day)\b|\btonight\b|\bthis (?:morning|afternoon|evening|arvo)\b|\btomorrow\b|\bdeadline\b|\bscheduled\b|\bbreakfast\b/.test(lo)) {
    type = "event";
  }
  // Note: note, fyi, reminder, summary, recap, update, heads up, info, etc.
  else if (/^(note[:\s]|fyi[:\s]|btw[:\s]|idea[:\s]|reminder[:\s]|summary[:\s]|recap[:\s]|update[:\s]|heads up[:\s]|info[:\s])/i.test(text)) {
    type = "note";
  }
  
  let priority: Priority = "medium"; // Default is medium
  
  // ! Prefix for priority
  const prioM = text.match(/!([123]|high|med|low|urgent)/i);
  if (prioM) {
    const p = prioM[1].toLowerCase();
    if (p === "1" || p === "high" || p === "urgent") priority = "high";
    else if (p === "2" || p === "med" || p === "medium") priority = "medium";
    else if (p === "3" || p === "low") priority = "low";
  }
  // Fallback to keyword search if no ! prefix
  else if (/\burgent\b|\basap\b|\bcritical\b|\bblocking\b|\bhigh priority\b|\bimmediately\b|\btoday\b|\beod\b|\bend of day\b/.test(lo)) {
    priority = "high";
  }
  else if (/\bwhenever\b|\bno rush\b|\blow priority\b/.test(lo)) {
    priority = "low";
  }
  
  // Any date/time in compose relates to due date
  const dueDate = extractDue(text) || extractEventTime(text);
  const emoji = guessEmoji(text);
  return { type, priority, dueDate, emoji, tags: extractTags(text), contexts: extractContexts(text) };
}

export function findUpdateTarget(text: string, entries: any[]) {
  const lo = text.toLowerCase().trim();
  
  // Semantic Queries (Local Tools)
  if (/^(?:what's next|whats next|what (?:should|can) i do next|next)\??$/i.test(lo)) {
    // Find high priority, then overdue, then soonest due
    const tasks = entries.filter(e => !e.done && (e.type === "task" || e.type === "event"));
    if (tasks.length === 0) return { type: "semantic", message: "You're all caught up! Maybe take a break? ☕" };
    
    const sorted = [...tasks].sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      const ad = a.dueDate ? resolveDueDate(a.dueDate, a.timestamp) : null;
      const bd = b.dueDate ? resolveDueDate(b.dueDate, b.timestamp) : null;
      if (ad && !bd) return -1;
      if (bd && !ad) return 1;
      if (ad && bd) return ad.getTime() - bd.getTime();
      return 0;
    });
    const next = sorted[0];
    return { type: "semantic", message: `You should focus on: **${next.text}** ${next.emoji || ""} (Priority: ${next.priority}${next.dueDate ? `, Due: ${next.dueDate}` : ""})` };
  }

  if (/^rank my tasks(?: in order of importance)?\??$/i.test(lo)) {
    const tasks = entries.filter(e => !e.done && (e.type === "task" || e.type === "event"));
    if (tasks.length === 0) return { type: "semantic", message: "No active tasks to rank." };
    
    const sorted = [...tasks].sort((a, b) => {
      const pMap = { high: 0, medium: 1, low: 2 };
      if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
      const ad = a.dueDate ? resolveDueDate(a.dueDate, a.timestamp) : null;
      const bd = b.dueDate ? resolveDueDate(b.dueDate, b.timestamp) : null;
      if (ad && bd) return ad.getTime() - bd.getTime();
      if (ad) return -1;
      if (bd) return 1;
      return 0;
    });
    
    const list = sorted.slice(0, 5).map((t, i) => `${i+1}. ${t.emoji || "·"} **${t.text}** (${t.priority})`).join("\n");
    return { type: "semantic", message: `### Top Priorities\n${list}` };
  }

  // Update Commands
  const updateVerbs = /^(?:update|change|set|make|mark)\s+/i;
  if (!updateVerbs.test(lo)) return null;

  const cleanCmd = lo.replace(updateVerbs, "");
  
  // Try strict pattern first
  const strictRx = /^(?:the\s+)?(due date|priority|type|emoji|tags?|contexts?|status)\s+(?:of\s+)?(.+?)\s+to\s+(.+)$/i;
  const strictMatch = cleanCmd.match(strictRx);
  
  if (strictMatch) {
    const field = strictMatch[1].toLowerCase();
    const targetName = strictMatch[2].toLowerCase().trim();
    const newValue = strictMatch[3].trim();
    const target = entries.find(e => e.text.toLowerCase().includes(targetName) || e.rawText.toLowerCase().includes(targetName));
    if (target) return { id: target.id, patch: getPatch(field, newValue), type: "update" };
  }

  // Try flexible pattern: [target] to [value]
  const flexRx = /^(.+?)\s+to\s+(.+)$/i;
  const flexMatch = cleanCmd.match(flexRx);
  if (flexMatch) {
    const targetName = flexMatch[1].toLowerCase().trim();
    const newValue = flexMatch[2].trim();
    
    // Find target
    const target = entries.find(e => e.text.toLowerCase().includes(targetName) || e.rawText.toLowerCase().includes(targetName));
    if (target) {
      // Analyze newValue to guess field
      const a = analyze(newValue);
      const patch: any = { updated: true };
      
      if (newValue.toLowerCase().includes("done") || newValue.toLowerCase().includes("complete")) patch.done = true;
      else if (newValue.toLowerCase().includes("todo") || newValue.toLowerCase().includes("open")) patch.done = false;
      else if (a.dueDate) patch.dueDate = a.dueDate;
      else if (a.priority !== "medium" || newValue.match(/!/)) patch.priority = a.priority;
      else if (a.tags.length > 0) patch.tags = [...new Set([...target.tags, ...a.tags])];
      else if (a.contexts.length > 0) patch.contexts = [...new Set([...target.contexts, ...a.contexts])];
      else if (a.emoji) patch.emoji = a.emoji;
      else patch.text = cleanText(newValue, target.type); // Rename if nothing else matches

      return { id: target.id, patch, type: "update" };
    }
  }

  return null;
}

function getPatch(field: string, newValue: string) {
  const patch: any = { updated: true };
  if (field.includes("due")) {
    patch.dueDate = extractDue(newValue) || extractEventTime(newValue) || newValue;
  } else if (field.includes("priority")) {
    if (/(high|1|urgent)/i.test(newValue)) patch.priority = "high";
    else if (/(med|2)/i.test(newValue)) patch.priority = "medium";
    else if (/(low|3)/i.test(newValue)) patch.priority = "low";
  } else if (field.includes("type")) {
    if (/(task|todo)/i.test(newValue)) patch.type = "task";
    else if (/(event|meet)/i.test(newValue)) patch.type = "event";
    else if (/(note)/i.test(newValue)) patch.type = "note";
    else if (/(thought|idea)/i.test(newValue)) patch.type = "thought";
  } else if (field.includes("emoji")) {
    patch.emoji = newValue;
  } else if (field.includes("tag")) {
    patch.tags = extractTags(newValue);
  } else if (field.includes("context")) {
    patch.contexts = extractContexts(newValue);
  } else if (field.includes("status")) {
    if (/(done|complete|finished|closed)/i.test(newValue)) patch.done = true;
    else if (/(open|todo|pending)/i.test(newValue)) patch.done = false;
  }
  return patch;
}

export function cleanText(raw: string, type: EntryType) {
  let t = raw;
  t = t.replace(/#[\w-]+/g, "").replace(/@[\w-]+/g, "");
  t = t.replace(DUE_RX, "");
  
  // Remove priority commands
  t = t.replace(/!([123]|high|med|low|urgent)/gi, "");
  
  // Remove priority keywords if they were used to set priority
  t = t.replace(/\burgent\b|\basap\b|\bcritical\b|\bblocking\b|\bhigh priority\b|\bimmediately\b|\beod\b|\bend of day\b/gi, "");
  t = t.replace(/\bwhenever\b|\bno rush\b|\blow priority\b/gi, "");

  if (type === "task") {
    t = t.replace(/^(todo[:\s]+|task[:\s]+|need to\s+|have to\s+|remember to\s+|don'?t forget(?:\s+to)?\s+|action item[:\s]+|action[:\s]+|follow[- ]?up[:\s]*)/i, "");
  }
  
  // Remove time expressions
  const DAY_WORDS = DAYS + "|tomorrow|tonight|today|this morning|this afternoon|this evening|this arvo|next week";
  t = t.replace(new RegExp(`\\bat\\s+(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm))`, "i"), "");
  t = t.replace(new RegExp(`\\b(${DAY_WORDS})\\b`, "i"), "");
  t = t.replace(new RegExp(`\\b(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm))\\b`, "i"), "");
  
  if (type === "note" || type === "thought") {
    t = t.replace(/^(note[:\s]+|fyi[:\s]+|btw[:\s]+|idea[:\s]+|reminder[:\s]+|summary[:\s]+|recap[:\s]+|update[:\s]+|heads up[:\s]+|info[:\s]+)/i, "");
  }
  t = t.replace(/^[\s\u2013\u2014\-|:]+|[\s\u2013\u2014\-|:]+$/g, "");
  t = t.replace(/\s+(?:to|for|by|with|from|on|at|in|and|or|the|a|an)\.?$/i, "").trim();
  t = t.replace(/\s{2,}/g, " ").trim();
  if (t.length > 0) t = t[0].toUpperCase() + t.slice(1);
  return t || raw.trim();
}

export function resolveDueDate(dueDateStr: string, createdAt: Date | string) {
  if (!dueDateStr) return null;
  const base  = new Date(createdAt);
  const baseD = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const lo    = dueDateStr.toLowerCase().trim();

  if (/^(today|tonight|this morning|this afternoon|this evening|this arvo)/.test(lo))
    return new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate(), 23, 59);

  if (/^tomorrow/.test(lo))
    return new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + 1, 23, 59);

  if (/^eod$|^end of day/.test(lo))
    return new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate(), 23, 59);

  if (/^next week/.test(lo))
    return new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + 7);

  const DAYS_ARR  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const SHORT_ARR = ['sun','mon','tue','wed','thu','fri','sat'];
  for (let i = 0; i < 7; i++) {
    if (lo.startsWith(DAYS_ARR[i]) || lo.startsWith(SHORT_ARR[i])) {
      let diff = i - baseD.getDay();
      if (diff <= 0) diff += 7;
      return new Date(baseD.getFullYear(), baseD.getMonth(), baseD.getDate() + diff, 23, 59);
    }
  }

  const parsed = new Date(dueDateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function isOverdue(entry: { done: boolean, dueDate: string | null, type: EntryType, timestamp: Date | string }) {
  if (entry.done || !entry.dueDate) return false;
  if (entry.type !== "task" && entry.type !== "event") return false;
  const resolved = resolveDueDate(entry.dueDate, entry.timestamp);
  if (!resolved) return false;
  return resolved < new Date();
}

export function relDueLabel(dueDateStr: string, createdAt: Date | string) {
  if (!dueDateStr) return dueDateStr;
  const resolved = resolveDueDate(dueDateStr, createdAt);
  if (!resolved) return dueDateStr;
  const now  = new Date();
  const diffD = Math.ceil((resolved.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffD === 0)  return "today";
  if (diffD === 1)  return "tomorrow";
  if (diffD === -1) return "yesterday";
  if (diffD > 1 && diffD <= 14) return `in ${diffD}d`;
  if (diffD < -1 && diffD >= -14) return `${Math.abs(diffD)}d ago`;
  return dueDateStr;
}
