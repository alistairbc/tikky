import { CLR } from "./constants";

export const CHANGELOG = [
  { version:"1.6.0", date:"2026-04-27", label:"Polish + Themes", items:[
    "Calendar entry cards now show entry title and formatted due date",
    "Consistent diamond ◆ logo icon on desktop and mobile",
    "Mobile header: SVG search/filter/settings icons replace emoji",
    "Stream overdue banner: unified dark style matching calendar",
    "Compose buttons: standardised to 28px · camera SVG · Add spec",
    "Add/remove custom image: layout fixed on mobile",
    "11 new themes: Paper, Sage, Daylight, Hi-Contrast Dark/Light, Color-blind Safe, Low Stim, Night Shift, Sunshine, Terminal",
  ]},
  { version:"1.5.0", date:"2026-04-27", label:"UX Polish", items:[
    "Renamed to Ticky Notes",
    "Desktop nav: consistent SVG outline icons (no more colored calendar emoji)",
    "Sidebar Done tab: label tightened to prevent layout overflow",
    "Emoji section in expanded card collapsed by default — click to expand",
    "Calendar: right panel shows all upcoming dated entries when no day selected",
    "Calendar: overdue banner is now clickable to filter to overdue entries",
    "List items: blank items now show placeholder text and are click-to-edit",
  ]},
  { version:"1.4.0", date:"2026-04-27", label:"Design System Complete", items:[
    "Correct type colors: Event → sky blue (#0ea5e9), Thought → slate (#64748b), violet reserved for AI",
    "New CSS tokens: --event-ink, --thought-ink, --ai, --ai-light, --glow-event, --glow-thought, --glow-ai",
    "Mobile bottom nav redesigned: SVG icons, raised yellow + button, 52px height, yellow active state",
    "Mobile scroll padding adjusted for new nav height",
  ]},
  { version:"1.3.0", date:"2026-04-27", label:"Calendar View", items:[
    "New Calendar tab (📅) — full month-grid view of all entries that have a due date",
    "Overdue banner at the top of the calendar when you have past-due items, with a live summary",
    "Day detail panel — click any date to see all entries due that day, color-coded by type",
    "Jump to any entry from the calendar — clicking a day entry switches to Stream and expands that card",
    "Month type breakdown — shows a count of tasks / events / notes / thoughts scheduled this month",
    "Today is highlighted with an accent ring; past days with no entries are visually muted",
  ]},
  { version:"1.2.0", date:"2026-04-05", label:"Insights · Markdown · Alerts · Saved filters", items:[
    "Insights tab (✦) — streak counter, entries-per-day bar chart, tag frequency, type breakdown, and completion rate, all computed live from your stream",
    "Markdown rendering in entry text — use **bold**, *italic*, `code`, and [text](url) anywhere in your entries",
    "Due-date alerts on load — a dismissible banner appears at the top of the stream when you have overdue or due-today tasks/events",
    "Saved filter combos — while any filter is active, click ⭐ Save in the filter bar to bookmark type+tag+due combinations for one-click recall",
  ]},
  { version:"1.1.0", date:"2026-04-05", label:"Multi-select · Grouping · Duplicate", items:[
    "Multi-select mode — click ☑ in the toolbar to enter select mode, then click cards to select them",
    "Bulk actions — complete, reopen, set priority (H/M/L), or delete an entire selection at once; bulk delete supports undo",
    "Stream grouping — 'Group' dropdown groups the stream by type, priority, context, or due date with collapsible section headers",
    "Entry duplication — ⎘ Duplicate button in the expanded panel clones a card with a fresh timestamp",
    "Collapsible What's New / Coming Soon / Shipped sections in Preference Centre — collapsed by default to keep settings clean",
  ]},
  { version:"1.0.0", date:"2026-04-05", label:"Search & filter upgrades", items:[
    "Type filter chips in the stream header — click Tasks, Events, Notes, or Thoughts to narrow the stream instantly",
    "Due-status quick filters — Overdue, Today, and This week buttons filter by resolved due date",
    "Search now scans comments and subtask text, not just the entry title — a card surfaces if any part of it matches",
    "Search highlighting extends into the expanded panel — matching text in comments and subtasks is highlighted in amber",
    "Unified active-filter bar — when any filter is active, a compact strip shows all active filters as chips with individual ✕ dismiss and a Clear all button",
    "Escape key now peels filters in order: due → type → tag → search → compose",
  ]},
  { version:"0.9.16", date:"2026-04-05", label:"Fix: due date editing now works", items:[
    "Due date inline editing no longer closes itself immediately — the onBlur auto-save was racing with the autoFocus and firing before you could type",
    "Now works like a proper editor: click ⏱ badge or '+ due' → type your date → press Enter or click ✓ to save, Escape or ✕ to cancel",
    "Fixed in both the stream card header and the dashboard sidebar",
  ]},
  { version:"0.9.15", date:"2026-04-05", label:"Relative dates · Priority everywhere · Highlights", items:[
    "Priority is now a clickable cycling badge in the stream card header — click H/M/L to cycle through high → medium → low (no need to use the dashboard panel)",
    "Priority buttons in the dashboard card are promoted to the top badge row — always visible without expanding the card",
    "Due dates now show as relative labels: 'today', 'tomorrow', 'in 3d', '2d ago' — hover for the original full date string",
    "Search results highlight the matching text in amber directly on the stream card",
    "Subtask progress pill (☑ 2/5) appears in the stream card header when a card has subtasks and is collapsed",
    "Keyboard shortcuts: n = focus compose, / = focus search, Esc = dismiss modals/filters/compose in order",
  ]},
  { version:"0.9.14", date:"2026-04-05", label:"Fix: priority & date click", items:[
    "Drag-and-drop now activates only from the ⠿ handle — clicking due-date badges, priority buttons, and all other interactive elements works reliably again",
    "Priority buttons (H/M/L) in the dashboard sidebar are larger with visible borders so they're easier to target",
    "'+ due date' button is bigger and visible in dashboard cards",
  ]},
  { version:"0.9.13", date:"2026-04-05", label:"Polish · Contrast · Emoji · Close", items:[
    "Stream cards are now always draggable — no need to activate Manual sort first; dragging any card auto-engages manual order",
    "Tag chip background opacity increased so distinct colours are clearly visible per-card; each tag keeps its persistent colour",
    "Theme contrast audit — dim/dimmer values raised across all 5 themes so secondary text meets basic readability guidelines (≥3:1 on bg)",
    "Emoji is now editable from the expanded card panel — type or paste any emoji, or click ✕ Remove to clear it",
    "Expanded card panel now has ↑ Close buttons at the top and bottom — no more needing to know to click the card body to close",
  ]},
  { version:"0.9.12", date:"2026-04-05", label:"Card drag handles", items:[
    "Stream cards show a ⠿ drag handle in the card header when Manual sort is active — makes draggable cards visually obvious at a glance",
  ]},
  { version:"0.9.11", date:"2026-04-05", label:"Search UX", items:[
    "Search input shows a ✕ clear button when text is present — no need to manually backspace",
    "Stream header shows result count (e.g. '3 results for \"ALDI\"') while searching; shows 'N shown' when a space filter or tag filter is active",
  ]},
  { version:"0.9.10", date:"2026-04-05", label:"Manual sort persistence", items:[
    "Manual sort order now persists across page refreshes (saved to localStorage as tikky_stream_order)",
    "Sort mode preference (newest/oldest/priority/manual) is also saved — reload picks up where you left off",
    "New entries added while in Manual mode are inserted at the top of the custom order",
  ]},
  { version:"0.9.3", date:"2026-04-05", label:"DnD everywhere · Filter banner · Scroll fix", items:[
    "Active tag-filter banner — a coloured strip appears whenever the stream is filtered by a tag, with a one-click clear button so it's always obvious and dismissible",
    "Stream card drag-and-drop — switch to ⠿ Manual sort mode and drag any card to reorder; ghost opacity shows what's being moved; 'Reset to newest' restores date order",
    "List item drag-and-drop — grab the ⠿ handle on any list item and drop it to reorder within the list; works on both open and completed sections",
    "Scroll no longer jumps when cycling entry type or editing — stream only auto-scrolls when a brand-new entry is added",
  ]},
  { version:"0.9.2", date:"2026-04-04", label:"DnD · Tags · Voice · Image drop", items:[
    "List sidebar: drag-and-drop reorder — grab the ⠿ handle and drag to reorder, ▲▼ still available as keyboard fallback",
    "Tag filter row moved below the search bar so clicking tags no longer shifts the sort/compact controls",
    "Comments with #tags or @contexts now merge those labels into the parent entry automatically",
    "Drag an image file into the compose area to attach it — blue drop overlay shows on hover",
    "Voice button replaced with a clear SVG mic icon and 'Voice' label — no longer just an emoji",
    "Voice errors (permission denied, no-speech, unsupported browser) shown as inline red message instead of a blocking alert()",
  ]},
  { version:"0.9.1", date:"2026-04-04", label:"Bugfixes", items:[
    "List deletion now shows a 5-second undo toast — no more accidental permanent deletes",
    "Compose bar no longer clips below the fold when font scale is changed from 100%",
    "Active priority button (H/M/L) now toggles off when clicked again — resets to Low",
    "Compact view now hides the raw-text subtitle, giving meaningfully denser layout",
    "Lists sidebar: ↑↓ reorder arrows appear on hover to manually sort your lists",
  ]},
  { version:"0.9.0", date:"2026-04-04", label:"Pin · Sort · Compact · Archive", items:[
    "Pin entries — click 📌 on any card to float it to the top of the stream permanently",
    "Sort toggle — switch between Newest / Oldest / Priority order from the filter bar",
    "Compact view — ⊟ button tightens card padding and font size for higher density",
    "Archive completed — done entries hidden by default; '✓ N completed — show' disclosure at stream bottom",
  ]},
  { version:"0.8.2", date:"2026-04-04", label:"Bugfixes: settings crash + compose bar", items:[
    "Fixed crash when opening ⚙ Settings: auto theme has colors:null which blew up the theme grid render",
    "Compose bar moved inside the stream column (last flex child) so it is always visible on desktop regardless of viewport height or zoom level",
  ]},
  { version:"0.8.1", date:"2026-04-04", label:"Structural refactor · White-screen hardening", items:[
    "Extracted StreamCard (~215 lines) into a named module-level component",
    "Extracted DashboardCard (~100 lines) into a named module-level component",
    "Introduced makeSumCp() helper; reformatted 700-char SumSection one-liners",
    "JSX depth imbalance inside .map() callbacks is now impossible by construction",
  ]},
  { version:"0.8.0", date:"2026-04-04", label:"Overdue · Auto theme · Changelog", items:[
    "Overdue highlighting — past-due open tasks/events get a red tint in the stream",
    "Auto theme — new option that follows your system light/dark preference",
    "Version number and this changelog are now visible in the Preference Centre",
    "Coming Soon roadmap updated — photos shipped, list refreshed",
  ]},
  { version:"0.7.1", date:"2026-04-04", label:"Bugfix", items:[
    "Fixed white screen caused by a missing </div> in the stream card JSX tree",
  ]},
  { version:"0.7.0", date:"2026-04-03", label:"Voice · Photos · Swipe · Persistence", items:[
    "Voice input via Web Speech API (en-AU), with live interim transcript preview",
    "Photo attachments — attach images when composing or from any expanded entry",
    "Swipe gestures on mobile — swipe left to delete, right to toggle done",
    "Full localStorage persistence for entries, lists, and all preferences",
  ]},
  { version:"0.6.0", date:"2026-04-02", label:"Preference Centre", items:[
    "6 themes, custom accent colour with hex picker, 4 font families, text scale",
    "5 background presets: none, mesh gradient, film grain, grid, and custom image",
  ]},
  { version:"0.5.0", date:"2026-04-01", label:"Lists · Export · Import", items:[
    "Lists feature — colour-coded named lists with checklist items and per-item notes",
    "Export as JSON (/export), import (/import), download plain .txt",
  ]},
  { version:"0.4.0", date:"2026-03-31", label:"Summary · Help", items:[
    "Summary view: /summary, /summary today, /summary week, /summary last week",
    "Help view (/help) with command reference and auto-detect documentation",
  ]},
  { version:"0.3.0", date:"2026-03-30", label:"Comments · Subtasks · Spaces", items:[
    "Comments on entries — add, edit, delete, undo",
    "Subtasks per entry — add, toggle, delete",
    "@context tags auto-create Space filter tabs",
    "Dashboard column with priority/type breakdown and filters",
  ]},
  { version:"0.2.0", date:"2026-03-29", label:"NLP · Mobile · Dashboard", items:[
    "Stronger NLP: event time extraction, action-verb detection, emoji auto-detect",
    "Tag pills, TypeBadge cycling, mobile responsive layout with bottom nav",
  ]},
  { version:"0.1.0", date:"2026-03-28", label:"Initial release", items:[
    "Stream with NLP auto-classify: task, event, note, thought",
    "Priority, due dates, #tags, @contexts — full CRUD, search, undo toast",
  ]},
];

export const THEMES = [
  { id:"auto",         name:"Auto",          desc:"Follows system light/dark",        dark:null,  colors:null },
  { id:"midnight",     name:"Midnight",      desc:"Standard dark · clean & neutral",  dark:true,  colors:{ bg:"#111111", surface:"#1c1c1c", border:"#2c2c2c", text:"#f0f0f0", muted:"#b0b0b0", dim:"#888888", dimmer:"#666666", accent:"#6366f1", input:"#0a0a0a" } },
  { id:"light",        name:"Executive",     desc:"Clean light · high contrast",      dark:false, colors:{ bg:"#f5f5f5", surface:"#ffffff", border:"#d1d5db", text:"#111111", muted:"#374151", dim:"#4b5563", dimmer:"#6b7280", accent:"#6366f1", input:"#ffffff" } },
  { id:"galaxy",       name:"Glass Galaxy",  desc:"Deep space, violet nebula",        dark:true,  colors:{ bg:"#06040d", surface:"#110d1e", border:"#2b1f50", text:"#ede8ff", muted:"#c0b0f0", dim:"#a090e0", dimmer:"#6a58a0", accent:"#9c6dff", input:"#060311" } },
  { id:"ember",        name:"Ember",         desc:"Warm dark, amber & orange",        dark:true,  colors:{ bg:"#120a05", surface:"#1c1108", border:"#3a1f0a", text:"#fde8d8", muted:"#e4b08a", dim:"#b07045", dimmer:"#7a4a28", accent:"#f97316", input:"#0a0502" } },
  { id:"kaleidoscope", name:"Kaleidoscope",  desc:"Bold, vibrant & alive",            dark:true,  colors:{ bg:"#0d0014", surface:"#1a0828", border:"#4a1060", text:"#fdf4ff", muted:"#e8c4fe", dim:"#c888f8", dimmer:"#7a38a0", accent:"#e879f9", input:"#090010" } },
  // Light themes
  { id:"paper",        name:"Paper",          desc:"Cream paper · low glare",           dark:false, colors:{ bg:"#faf7f0", surface:"#fffef9", border:"#d8cfc0", text:"#1a1410", muted:"#5a4a38", dim:"#7a6a56", dimmer:"#a09080", accent:"#8b6914", input:"#f5f0e8" } },
  { id:"sage",         name:"Sage",           desc:"Soft green · low arousal",          dark:false, colors:{ bg:"#f0f5f0", surface:"#fafffe", border:"#c0d4c0", text:"#0f200f", muted:"#345a34", dim:"#527a52", dimmer:"#7aaa7a", accent:"#2d7a2d", input:"#e8f2e8" } },
  { id:"daylight",     name:"Daylight",       desc:"Crisp · cool grey",                 dark:false, colors:{ bg:"#f2f5f8", surface:"#ffffff", border:"#cdd6e0", text:"#1a222c", muted:"#445566", dim:"#667788", dimmer:"#99aabb", accent:"#0284c7", input:"#edf2f7" } },
  // Accessibility
  { id:"hc-dark",      name:"Hi-Contrast Dark",  desc:"Pure B/W · low vision",         dark:true,  colors:{ bg:"#000000", surface:"#0a0a0a", border:"#404040", text:"#ffffff", muted:"#dddddd", dim:"#aaaaaa", dimmer:"#666666", accent:"#fde047", input:"#050505" } },
  { id:"hc-light",     name:"Hi-Contrast Light", desc:"Pure W/B · low vision",         dark:false, colors:{ bg:"#ffffff", surface:"#f8f8f8", border:"#000000", text:"#000000", muted:"#111111", dim:"#333333", dimmer:"#555555", accent:"#0000cc", input:"#ffffff" } },
  { id:"cvd",          name:"Color-blind Safe",  desc:"Blue/orange · no R/G",          dark:true,  colors:{ bg:"#0a0e1a", surface:"#141828", border:"#283048", text:"#e0e8ff", muted:"#a0b0d0", dim:"#7090b0", dimmer:"#405070", accent:"#f59e0b", input:"#080c18" } },
  { id:"lowstim",      name:"Low Stim",           desc:"Muted · ADHD / sensory",        dark:true,  colors:{ bg:"#1c1a18", surface:"#252320", border:"#383634", text:"#e0dcd6", muted:"#9c9890", dim:"#78746e", dimmer:"#565450", accent:"#b8a878", input:"#141210" } },
  // Specialised
  { id:"nightshift",   name:"Night Shift",        desc:"Sleep-safe · warm red-light",   dark:true,  colors:{ bg:"#0d0804", surface:"#1c1008", border:"#3c2010", text:"#ffd090", muted:"#c07840", dim:"#905030", dimmer:"#602010", accent:"#e04010", input:"#080400" } },
  { id:"sunshine",     name:"Sunshine",            desc:"Max-bright · outdoor use",      dark:false, colors:{ bg:"#fffef0", surface:"#fffffc", border:"#ddd890", text:"#181800", muted:"#3a3800", dim:"#5a5800", dimmer:"#787600", accent:"#6b5900", input:"#fffef8" } },
  { id:"terminal",     name:"Terminal",            desc:"Phosphor · power user",         dark:true,  colors:{ bg:"#000d00", surface:"#001800", border:"#003800", text:"#00ee44", muted:"#00bb33", dim:"#008822", dimmer:"#005511", accent:"#00ff44", input:"#000900" } },
  { id:"sticky",      name:"Yellow Pad",          desc:"Sticky-note warmth · sunlit",    dark:false, colors:{ bg:"#fffde7", surface:"#fff9c4", border:"#f9e04b", text:"#1a1600", muted:"#4a4000", dim:"#7a6f00", dimmer:"#b09a00", accent:"#e65100", input:"#fffde7" } },
];

