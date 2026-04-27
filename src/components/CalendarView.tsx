import React, { useState, useMemo } from 'react';
import { TM } from '../constants';

interface Entry {
  id: number;
  text: string;
  type: string;
  dueDate?: string;
  done?: boolean;
  priority?: string;
}

interface Props {
  entries: Entry[];
  C: Record<string, string>;
  onEntryClick: (id: number) => void;
  isMobile?: boolean;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function CalendarView({ entries, C, onEntryClick, isMobile }: Props) {
  const today = localToday();

  const [pivotDate, setPivotDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [overdueFilter, setOverdueFilter] = useState(false);

  const year  = pivotDate.getFullYear();
  const month = pivotDate.getMonth();

  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Index pending entries by dueDate
  const byDate: Record<string, Entry[]> = {};
  for (const e of entries) {
    if (e.dueDate && !e.done) {
      (byDate[e.dueDate] = byDate[e.dueDate] || []).push(e);
    }
  }

  // Overdue entries (any date before today, not done)
  const overdueEntries = entries.filter(
    e => e.dueDate && !e.done && e.dueDate < today
  );

  function goPrev()  { setPivotDate(new Date(year, month - 1, 1)); }
  function goNext()  { setPivotDate(new Date(year, month + 1, 1)); }
  function goToday() {
    const d = new Date();
    setPivotDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(today);
  }

  // All dated entries sorted by date (for "no selection" view)
  const allDatedEntries = useMemo(() => {
    const result: Entry[] = [];
    Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([, es]) => result.push(...es));
    return result;
  }, [byDate]);

  const selectedEntries: Entry[] = overdueFilter
    ? overdueEntries
    : selectedDay
    ? (byDate[selectedDay] || [])
    : allDatedEntries;

  const selectedIsToday  = !overdueFilter && selectedDay === today;
  const selectedIsPast   = !overdueFilter && !!selectedDay && selectedDay < today;

  const btnBase: React.CSSProperties = {
    background: 'none', border: `1px solid ${C.border}`, color: C.muted,
    cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6,
    padding: '4px 12px', fontSize: 13, lineHeight: 1.4,
  };

  // Month summary by type
  const monthPrefix = `${year}-${String(month+1).padStart(2,'0')}`;
  const monthEntries = Object.entries(byDate)
    .filter(([d]) => d.startsWith(monthPrefix))
    .flatMap(([, es]) => es);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      gap: 20, overflowY: 'auto', background: C.bg,
      padding: isMobile ? '16px 12px 80px' : '28px 32px', minHeight: 0,
    }}>

      {/* ── Left: Calendar grid ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Month header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <button onClick={goPrev} style={{ ...btnBase, padding: '3px 11px', fontSize: 18 }}>‹</button>
          <h2 style={{
            margin: 0, flex: 1, fontSize: 20, fontWeight: 700,
            color: C.text, letterSpacing: '-0.02em',
          }}>
            {MONTHS[month]} {year}
          </h2>
          <button onClick={goNext} style={{ ...btnBase, padding: '3px 11px', fontSize: 18 }}>›</button>
          <button onClick={goToday} style={{ ...btnBase, color: C.accent, borderColor: `${C.accent}55` }}>
            Today
          </button>
        </div>

        {/* Overdue banner */}
        {overdueEntries.length > 0 && (
          <div
            onClick={() => { setOverdueFilter(f => !f); setSelectedDay(null); }}
            style={{
              marginBottom: 14, padding: '8px 14px', borderRadius: 8,
              background: overdueFilter ? '#ef444428' : '#ef444414',
              border: `1px solid ${overdueFilter ? '#ef444480' : '#ef444440'}`,
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              cursor: 'pointer', transition: 'all .15s',
            }}>
            <span style={{
              fontSize: 10, color: '#ef4444', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0,
            }}>
              ⚠ {overdueEntries.length} overdue
            </span>
            <span style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {overdueFilter ? 'Click to clear filter' : overdueEntries.slice(0, 3).map((e: Entry) => e.text).join(' · ') + (overdueEntries.length > 3 ? ` +${overdueEntries.length - 3} more` : '')}
            </span>
          </div>
        )}

        {/* Day-of-week header row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
          {DAYS_SHORT.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 800,
              color: C.dimmer, textTransform: 'uppercase', letterSpacing: '0.07em',
              padding: '4px 0',
            }}>
              {isMobile ? d[0] : d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>

          {/* Leading empty cells */}
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`pre-${i}`} style={{
              minHeight: isMobile ? 52 : 76,
              background: `${C.surface}40`, borderRadius: 6,
              border: `1px solid ${C.border}40`,
            }} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day    = i + 1;
            const dk     = dayKey(year, month, day);
            const dayEnts = byDate[dk] || [];
            const isToday = dk === today;
            const isSel   = dk === selectedDay;
            const isPast  = dk < today;
            const hasEnts = dayEnts.length > 0;
            const maxDots = isMobile ? 3 : 5;

            return (
              <div
                key={day}
                onClick={() => { setSelectedDay(isSel ? null : dk); setOverdueFilter(false); }}
                style={{
                  minHeight: isMobile ? 52 : 76,
                  borderRadius: 6, padding: isMobile ? '5px 6px' : '7px 9px',
                  background: isSel
                    ? `${C.accent}18`
                    : isPast && !hasEnts
                    ? `${C.surface}50`
                    : C.surface,
                  border: `1px solid ${
                    isSel   ? C.accent :
                    isToday ? `${C.accent}66` :
                    C.border
                  }`,
                  cursor: 'pointer',
                  boxShadow: isToday ? `0 0 0 1px ${C.accent}28` : 'none',
                  transition: 'background 0.1s, border-color 0.1s',
                  position: 'relative',
                }}
              >
                {/* Day number */}
                <div style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: isToday ? 800 : 500,
                  color: isToday ? C.accent : isPast ? C.dimmer : C.muted,
                  lineHeight: 1,
                  marginBottom: hasEnts ? 5 : 0,
                }}>
                  {day}
                </div>

                {/* Entry dots */}
                {hasEnts && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    {dayEnts.slice(0, maxDots).map((entry, idx) => {
                      const meta = (TM as any)[entry.type];
                      return (
                        <div key={idx} style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: meta.color, flexShrink: 0,
                          boxShadow: `0 0 3px ${meta.color}88`,
                        }} />
                      );
                    })}
                    {dayEnts.length > maxDots && (
                      <span style={{ fontSize: 9, color: C.dim, lineHeight: 1 }}>
                        +{dayEnts.length - maxDots}
                      </span>
                    )}
                  </div>
                )}

                {/* First entry title — desktop only */}
                {!isMobile && hasEnts && dayEnts[0] && (
                  <div style={{
                    fontSize: 10, color: C.dim, marginTop: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {dayEnts[0].title}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Month type breakdown */}
        {monthEntries.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['task','event','note','thought'] as const).map(type => {
              const count = monthEntries.filter(e => e.type === type).length;
              if (!count) return null;
              const meta = (TM as any)[type];
              return (
                <div key={type} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20,
                  background: `${meta.color}12`, border: `1px solid ${meta.color}30`,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: 11, color: meta.color, fontWeight: 700 }}>{count}</span>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: C.dimmer, alignSelf: 'center', marginLeft: 4 }}>
              this month
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Day detail panel ── */}
      <div style={{
        width: isMobile ? '100%' : 256, flexShrink: 0,
        background: C.surface, borderRadius: 12,
        border: `1px solid ${C.border}`,
        padding: 16, alignSelf: 'flex-start',
        maxHeight: isMobile ? 'none' : 'calc(100vh - 120px)',
        overflowY: 'auto',
        position: isMobile ? 'static' : 'sticky',
        top: 28,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: overdueFilter ? '#ef4444' : selectedIsToday ? C.accent : C.text,
          marginBottom: 2,
        }}>
          {overdueFilter
            ? `⚠ ${overdueEntries.length} overdue`
            : !selectedDay
            ? 'Upcoming'
            : selectedIsToday
            ? '⭑ Today'
            : (() => { const d = new Date(selectedDay + 'T12:00:00'); return isNaN(d.getTime()) ? selectedDay : d.toLocaleDateString('en-AU', {
                weekday: 'long', month: 'long', day: 'numeric',
              }); })()
          }
        </div>
        <div style={{ fontSize: 11, color: C.dim, marginBottom: 14 }}>
          {overdueFilter
            ? 'Click banner to clear'
            : !selectedDay
            ? `${allDatedEntries.length} item${allDatedEntries.length !== 1 ? 's' : ''} with due dates`
            : selectedEntries.length === 0
            ? 'Nothing due'
            : `${selectedEntries.length} item${selectedEntries.length !== 1 ? 's' : ''} due`
          }
        </div>

        {selectedEntries.length === 0 && selectedDay && !overdueFilter && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C.dimmer, fontSize: 12 }}>
            {selectedIsPast ? 'Clear day ✓' : '🗓 Nothing scheduled'}
          </div>
        )}

        {!selectedDay && !overdueFilter && allDatedEntries.length === 0 && (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C.dimmer, fontSize: 12 }}>
            No upcoming items with due dates
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selectedEntries.map(entry => {
            const meta = (TM as any)[entry.type];
            return (
              <div
                key={entry.id}
                onClick={() => onEntryClick(entry.id)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: `${meta.color}0e`, border: `1px solid ${meta.color}28`,
                  transition: 'border-color 0.1s',
                }}
              >
                <div style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: meta.color,
                  marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {meta.icon} {meta.label}
                  {entry.priority === 'high' && (
                    <span style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 9, letterSpacing: '0.04em' }}>
                      HIGH
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4, fontWeight: 500 }}>
                  {entry.text}
                </div>
                {!selectedDay && !overdueFilter && (
                  <div style={{ fontSize: 10, color: entry.dueDate ? C.dim : C.dimmer, marginTop: 3 }}>
                    {entry.dueDate
                      ? (() => { const d = new Date(entry.dueDate + 'T12:00:00'); return isNaN(d.getTime()) ? 'No date' : d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' }); })()
                      : 'No date'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

