"use client";

import { useState } from "react";
import { Sun, Sunset, Moon, Building2, Clock, Check } from "lucide-react";

export default function TimePicker({ value, onChange }) {
  const presets = [
    { id: "morning", label: "Morning", time: "8:00 AM - 12:00 PM", icon: Sun },
    { id: "afternoon", label: "Afternoon", time: "12:00 PM - 4:00 PM", icon: Sunset },
    { id: "evening", label: "Evening", time: "4:00 PM - 8:00 PM", icon: Moon },
    { id: "fullday", label: "Full Day", time: "9:00 AM - 6:00 PM", icon: Building2 },
  ];

  const [isCustom, setIsCustom] = useState(false);

  // Custom time inputs
  const [startHour, setStartHour] = useState("02");
  const [startMin, setStartMin] = useState("00");
  const [startAmPm, setStartAmPm] = useState("PM");

  const [endHour, setEndHour] = useState("05");
  const [endMin, setEndMin] = useState("00");
  const [endAmPm, setEndAmPm] = useState("PM");

  const handleSelectPreset = (presetTime) => {
    setIsCustom(false);
    onChange(presetTime);
  };

  const handleCustomChange = (sH, sM, sAP, eH, eM, eAP) => {
    const formatted = `${parseInt(sH)}:${sM} ${sAP} - ${parseInt(eH)}:${eM} ${eAP}`;
    onChange(formatted);
  };

  const hoursList = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const minutesList = ["00", "15", "30", "45"];

  return (
    <div className="space-y-4">
      {/* Preset Pills Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {presets.map((p) => {
          const Icon = p.icon;
          const isSelected = !isCustom && value === p.time;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPreset(p.time)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold">{p.label}</span>
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-500"}`} />
              </div>
              <span className={`text-[11px] font-mono ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                {p.time}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Duration Toggle & Panel */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            const next = !isCustom;
            setIsCustom(next);
            if (next) {
              handleCustomChange(startHour, startMin, startAmPm, endHour, endMin, endAmPm);
            }
          }}
          className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isCustom ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isCustom ? "Custom Time Selection Active" : "+ Set Custom Start & End Time"}</span>
        </button>

        {isCustom && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
            {/* Start Time Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[75px]">
                Start Time:
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={startHour}
                  onChange={(e) => {
                    setStartHour(e.target.value);
                    handleCustomChange(e.target.value, startMin, startAmPm, endHour, endMin, endAmPm);
                  }}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                >
                  {hoursList.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={startMin}
                  onChange={(e) => {
                    setStartMin(e.target.value);
                    handleCustomChange(startHour, e.target.value, startAmPm, endHour, endMin, endAmPm);
                  }}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                >
                  {minutesList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-950 p-1 border border-slate-300 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setStartAmPm("AM");
                      handleCustomChange(startHour, startMin, "AM", endHour, endMin, endAmPm);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      startAmPm === "AM" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStartAmPm("PM");
                      handleCustomChange(startHour, startMin, "PM", endHour, endMin, endAmPm);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      startAmPm === "PM" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* End Time Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[75px]">
                End Time:
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={endHour}
                  onChange={(e) => {
                    setEndHour(e.target.value);
                    handleCustomChange(startHour, startMin, startAmPm, e.target.value, endMin, endAmPm);
                  }}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                >
                  {hoursList.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={endMin}
                  onChange={(e) => {
                    setEndMin(e.target.value);
                    handleCustomChange(startHour, startMin, startAmPm, endHour, e.target.value, endAmPm);
                  }}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                >
                  {minutesList.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="flex items-center rounded-xl bg-slate-200 dark:bg-slate-950 p-1 border border-slate-300 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEndAmPm("AM");
                      handleCustomChange(startHour, startMin, startAmPm, endHour, endMin, "AM");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      endAmPm === "AM" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEndAmPm("PM");
                      handleCustomChange(startHour, startMin, startAmPm, endHour, endMin, "PM");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      endAmPm === "PM" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Value Badge */}
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Selected Duration: </span>
              <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">{value}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
