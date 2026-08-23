"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export default function CalendarPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const containerRef = useRef(null);

  // Parse current selected date
  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();

  // Active view month & year
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside listener to close popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowMonthGrid(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const shortMonthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Helper to format Date object to YYYY-MM-DD
  const formatDateStr = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (dayNumber) => {
    const newDate = new Date(viewYear, viewMonth, dayNumber);
    const dateStr = formatDateStr(newDate);
    onChange(dateStr);
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(formatDateStr(today));
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  // Generate calendar grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = formatDateStr(new Date());

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowMonthGrid(false);
        }}
        className="flex items-center gap-2.5 glass-sheet hover:border-cyan-500/50 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white shadow-md spring-press transition-all"
      >
        <CalendarIcon className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="font-mono tracking-wide">{value ? value : "Select Date"}</span>
      </button>

      {/* Calendar Dropdown Modal - Liquid Glass Elevated */}
      {isOpen && (
        <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-72 sm:w-80 glass-floating rounded-3xl p-4 sm:p-5 shadow-2xl z-50 space-y-4 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-200">
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors spring-press"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Custom Interactive Month & Year Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMonthGrid(!showMonthGrid)}
                className="px-3 py-1 rounded-xl glass-pill hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors spring-press"
                title="Click to choose Month"
              >
                <span>{monthNames[viewMonth]}</span>
                <span className="text-[10px] text-cyan-400">▾</span>
              </button>

              <div className="flex items-center glass-pill rounded-xl px-1.5 py-0.5">
                <input
                  type="number"
                  min="1950"
                  max="2100"
                  value={viewYear}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setViewYear(val);
                  }}
                  className="w-14 bg-transparent border-0 text-center text-xs font-mono font-bold text-white focus:outline-none"
                  title="Type any Year"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors spring-press"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Selector Grid Modal Overlay */}
          {showMonthGrid ? (
            <div className="space-y-3 py-1 animate-fadeIn">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Select Month
              </span>
              <div className="grid grid-cols-3 gap-2">
                {shortMonthNames.map((m, idx) => {
                  const isCurrent = viewMonth === idx;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setShowMonthGrid(false);
                      }}
                      className={`py-2.5 rounded-2xl text-xs font-bold transition-all spring-press ${
                        isCurrent
                          ? "btn-liquid-primary text-white font-bold"
                          : "glass-pill text-slate-300 hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                {daysOfWeek.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}

                {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const cellDate = new Date(viewYear, viewMonth, dayNum);
                  const cellDateStr = formatDateStr(cellDate);
                  const isSelected = value === cellDateStr;
                  const isToday = todayStr === cellDateStr;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition-all spring-press ${
                        isSelected
                          ? "btn-liquid-primary text-white font-extrabold"
                          : isToday
                          ? "border border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10"
                          : "hover:bg-white/10 text-slate-200"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Clean Footer with Gatify Branding */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-cyan-400 hover:underline font-semibold text-[11px] flex items-center gap-1.5 spring-press"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Today
            </button>
            <span className="text-[10px] text-slate-400 font-mono tracking-tight">Gatify Calendar</span>
          </div>
        </div>
      )}
    </div>
  );
}
