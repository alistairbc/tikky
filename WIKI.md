# Tikky Project Wiki

## 1. Project Overview
**Tikky** is a sophisticated, high-density task management and productivity application designed around a continuous "stream" paradigm. Unlike traditional list-based task managers, Tikky unifies tasks, events, notes, and thoughts into a single chronological feed, emphasizing rapid capture, contextual tagging, and deep focus.

## 2. Core Features & Capabilities
*   **The Stream:** A unified feed supporting multiple entry types (Task, Event, Note, Thought).
*   **Smart Compose & NLP:** An intelligent input bar featuring contextual auto-completion for `#tags` and `@spaces`, and an NLP-driven date engine that parses relative dates (e.g., "today", "next week").
*   **Nested Data Arrays:** Each entry supports nested sub-tasks (with progress bars), threaded multi-line comments, and image attachments.
*   **Bulk Action Engine:** A powerful "Select Mode" allowing users to perform batch operations (Delete, Pin, Context Move, Priority shift) across multiple entries simultaneously.
*   **Focus / Pomodoro Engine:** A built-in, state-managed productivity timer that tracks focus sessions independently of the main stream.
*   **Tikky Semantic Assistant:** An AI-driven assistant layer providing natural language processing commands and rendering markdown-based insights.
*   **Insights & Summary:** Top-level data analysis views filtering stream content by specific temporal conditions (Today, Week, All).
*   **Advanced Theming Engine:** A robust personalization engine allowing accent color overrides, font-scale adjustments, and dynamic background presets (Mesh, Film Grain, Blueprint Grid).
*   **Product Pulse:** A built-in roadmap tracker documenting version history, active development, and upcoming features.

## 3. Technical Architecture & Choices
*   **Framework:** React 18, Vite, and TypeScript.
*   **Styling Strategy:** A hybrid approach using structural classes combined with dynamic inline styling (`style={{...}}`) to facilitate the highly reactive Custom Theme Engine (accent colors, opacity sliders, background images).
*   **Animations:** `motion/react` (Framer Motion) is used extensively for layout transitions, exit animations, and micro-interactions (e.g., celebration confetti).
*   **State Management:** Heavily reliant on React Hooks to handle complex UI states, modal visibilities, and drag-and-drop context.
*   **Data Persistence:** Opted for a localized data strategy leveraging HTML5 `localStorage` (e.g., caching background images via base64, storing entry arrays).
*   **Icons & Assets:** Utilization of Lucide-react (where applicable), native emojis for lightweight asset management, and SVG implementations for custom UI elements.

## 4. Design Philosophy & Evolution
The application's design underwent significant changes, specifically regarding the **Mobile UI**.

*   **Initial State:** The mobile application initially mirrored the desktop density, resulting in cramped layouts. Too much vertical space was consumed by filter rows, space selectors (All/Work/Personal), and duplicate compose areas.
*   **The "Radical Simplification":** 
    *   *Content-First Focus:* Re-architected the mobile view so 90% of the viewport is dedicated to active user content.
    *   *Consolidated Navigation:* Removed floating "Quick Add" bars and integrated the primary "Add" action directly into a compact (64px) bottom navigation bar.
    *   *Filter Modal:* Moved all spatial filtering, sorting, grouping, and due-date filters into a single, lazy-loaded modal triggered by a discreet header icon.

## 5. Challenges & Learnings
*   **Managing UI Density:** Balancing high-density information (tags, contexts, sub-tasks, comments, due dates) inside a single card component (`StreamCard`) required meticulous padding adjustments and conditional rendering for mobile views.
*   **Touch Interactions vs. Mouse Events:** Implementing a native-feeling "Swipe-to-Action" (swipe right for done, left for delete) gesture required manually calculating touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`) to prevent conflict with standard vertical scrolling.
*   **Monolithic File Maintenance:** As the application scaled, the core `App.tsx` file grew significantly (>2000 lines). Managing JSX complexity required careful chunking and disciplined tag pairing to prevent "Internal Server Errors" related to invalid markup.
*   **Scrollbar Intrusion:** Mobile browsers (specifically Webkit/Firefox implementations) introduced persistent vertical scrollbars that ruined the "app-like" aesthetic. This was resolved by creating custom CSS `.no-scrollbar` utility classes and ensuring precise overflow states.

## 6. Outcomes
Tikky currently stands as a highly responsive, feature-rich productivity environment. It successfully bridges the gap between a rapid-capture notepad and a strict project management tool. The recent spatial optimizations have ensured that the mobile experience is as powerful and seamless as the desktop application, free from UI clutter and focused entirely on the user's data stream.
