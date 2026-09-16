import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Users,
  FileText,
  Trash2,
  Edit2,
  X,
  List,
  Grid,
  Tag,
  Briefcase,
  Flag,
  CheckSquare,
  Search,
} from "lucide-react";
import { api } from "../lib/api.js";

const CATEGORIES = [
  { id: "all", label: "All Events", color: "bg-dark/10 text-dark border-dark/20" },
  { id: "meeting", label: "Meetings", color: "bg-purple/10 text-purple border-purple/20", dot: "bg-purple" },
  { id: "follow_up", label: "Follow-ups", color: "bg-orange/10 text-orange border-orange/20", dot: "bg-orange" },
  { id: "deadline", label: "Deadlines", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  { id: "milestone", label: "Milestones", color: "bg-brand/10 text-emerald-800 border-brand/20", dot: "bg-brand" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCategoryMeta(type) {
  switch (type) {
    case "meeting":
      return {
        label: "Meeting",
        chipBg: "bg-purple/15 text-purple border-purple/20 hover:bg-purple/25",
        badgeBg: "bg-purple/10 text-purple border-purple/20",
        dotColor: "bg-purple",
        icon: Users,
      };
    case "follow_up":
      return {
        label: "Follow-up",
        chipBg: "bg-orange/15 text-orange border-orange/20 hover:bg-orange/25",
        badgeBg: "bg-orange/10 text-orange border-orange/20",
        dotColor: "bg-orange",
        icon: Clock,
      };
    case "deadline":
      return {
        label: "Deadline",
        chipBg: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
        badgeBg: "bg-red-50 text-red-700 border-red-200",
        dotColor: "bg-red-500",
        icon: AlertCircle,
      };
    case "milestone":
      return {
        label: "Milestone",
        chipBg: "bg-brand/15 text-emerald-800 border-brand/20 hover:bg-brand/25",
        badgeBg: "bg-brand/10 text-emerald-800 border-brand/20",
        dotColor: "bg-brand",
        icon: Flag,
      };
    default:
      return {
        label: "Event",
        chipBg: "bg-gray-100 text-dark/70 border-dark/10 hover:bg-gray-200",
        badgeBg: "bg-dark/10 text-dark border-dark/20",
        dotColor: "bg-dark",
        icon: CalendarIcon,
      };
  }
}

export default function Calendar() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'agenda'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editingFollowup, setEditingFollowup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: formatDateISO(new Date()),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    attendees: "",
  });

  const [followupForm, setFollowupForm] = useState({
    title: "",
    date: formatDateISO(new Date()),
    client: "",
    notes: "",
    status: "pending",
  });

  // Fetch all calendar events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getCalendarEvents();
      setEvents(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
      setError(
        err.response?.data?.error ||
          "Unable to load calendar events from the database. Please verify your connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((e) => e.type === selectedCategory);
  }, [events, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: events.length,
      meeting: 0,
      follow_up: 0,
      deadline: 0,
      milestone: 0,
    };
    for (const e of events) {
      if (counts[e.type] !== undefined) {
        counts[e.type]++;
      }
    }
    return counts;
  }, [events]);

  // Calendar Grid calculation for Month View
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayIndex = firstDayOfMonth.getDay(); // 0 = Sunday

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);
      days.push({
        date,
        dayNum,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        dayNum: i,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
      });
    }

    // Trailing days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dayNum: i,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
      });
    }

    return days;
  }, [currentDate]);

  // Agenda View Grouping
  const agendaEventsGrouped = useMemo(() => {
    const sorted = [...filteredEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = {};

    for (const e of sorted) {
      if (!e.date) continue;
      const dateKey = formatDateISO(e.date);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(e.date),
          items: [],
        };
      }
      groups[dateKey].items.push(e);
    }

    return Object.values(groups);
  }, [filteredEvents]);

  // Handle Meeting Submit (Create or Update)
  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    if (!meetingForm.title.trim() || !meetingForm.date || !meetingForm.startTime || !meetingForm.endTime) {
      alert("Please fill in the title, date, start time, and end time.");
      return;
    }

    setActionLoading(true);
    try {
      if (editingMeeting) {
        await api.updateMeeting(editingMeeting.rawId, meetingForm);
      } else {
        await api.createMeeting(meetingForm);
      }
      setShowMeetingModal(false);
      setEditingMeeting(null);
      resetMeetingForm();
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save meeting.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Followup Submit (Create or Update)
  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!followupForm.title.trim() || !followupForm.date) {
      alert("Please fill in the title and date.");
      return;
    }

    setActionLoading(true);
    try {
      if (editingFollowup) {
        await api.updateFollowup(editingFollowup.rawId, followupForm);
      } else {
        await api.createFollowup(followupForm);
      }
      setShowFollowupModal(false);
      setEditingFollowup(null);
      resetFollowupForm();
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save follow-up.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (event) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    setActionLoading(true);
    try {
      if (event.type === "meeting") {
        await api.deleteMeeting(event.rawId);
      } else if (event.type === "follow_up") {
        await api.deleteFollowup(event.rawId);
      }
      setSelectedEvent(null);
      await loadEvents();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete item.");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditMeeting = (event) => {
    setEditingMeeting(event);
    setMeetingForm({
      title: event.title,
      date: formatDateISO(event.date),
      startTime: event.startTime || "09:00",
      endTime: event.endTime || "10:00",
      location: event.location || "",
      attendees: event.attendees || "",
    });
    setSelectedEvent(null);
    setShowMeetingModal(true);
  };

  const openEditFollowup = (event) => {
    setEditingFollowup(event);
    setFollowupForm({
      title: event.title,
      date: formatDateISO(event.date),
      client: event.client || "",
      notes: event.notes || "",
      status: event.status || "pending",
    });
    setSelectedEvent(null);
    setShowFollowupModal(true);
  };

  const resetMeetingForm = () => {
    setMeetingForm({
      title: "",
      date: formatDateISO(new Date()),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      attendees: "",
    });
    setEditingMeeting(null);
  };

  const resetFollowupForm = () => {
    setFollowupForm({
      title: "",
      date: formatDateISO(new Date()),
      client: "",
      notes: "",
      status: "pending",
    });
    setEditingFollowup(null);
  };

  const openCreateForDate = (date) => {
    const formatted = formatDateISO(date);
    setMeetingForm((prev) => ({ ...prev, date: formatted }));
    setFollowupForm((prev) => ({ ...prev, date: formatted }));
    setShowMeetingModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
            Calendar & Scheduling
          </h1>
          <p className="mt-1 text-sm text-dark/60">
            Track meetings, client follow-ups, milestones, and project deadlines in one unified schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              resetMeetingForm();
              setShowMeetingModal(true);
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white shadow-sm transition-all hover:opacity-95"
            style={{ backgroundColor: "#7C3AED", fontWeight: 600 }}
          >
            <Plus size={16} />
            Add Meeting
          </button>
          <button
            onClick={() => {
              resetFollowupForm();
              setShowFollowupModal(true);
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-white shadow-sm transition-all hover:opacity-95"
            style={{ backgroundColor: "#FF6A3D", fontWeight: 600 }}
          >
            <Plus size={16} />
            Add Follow-up
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadEvents}
            className="rounded-lg bg-red-100 px-3 py-1 font-semibold hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Control Bar: View Switcher, Month Nav, Category Filter */}
      <div className="flex flex-col gap-4 rounded-2xl border border-dark/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Navigation & Current Month */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-dark/10 bg-cream/30 p-1">
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-dark/70 hover:bg-white hover:text-dark"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs text-dark hover:bg-white rounded-lg transition-colors"
              style={{ fontWeight: 600 }}
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="rounded-lg p-1.5 text-dark/70 hover:bg-white hover:text-dark"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 className="text-lg text-dark" style={{ fontWeight: 700 }}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                  active
                    ? "border-dark bg-dark text-white shadow-sm"
                    : "border-dark/10 bg-white text-dark/70 hover:bg-dark/5"
                }`}
                style={{ fontWeight: 600 }}
              >
                {cat.dot && <span className={`h-2 w-2 rounded-full ${cat.dot}`} />}
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-dark/10 text-dark"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: Month / Agenda */}
        <div className="flex items-center rounded-xl border border-dark/10 bg-cream/30 p-1">
          <button
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              viewMode === "month"
                ? "bg-white text-dark shadow-sm"
                : "text-dark/60 hover:text-dark"
            }`}
            style={{ fontWeight: 600 }}
          >
            <Grid size={15} />
            <span>Month</span>
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              viewMode === "agenda"
                ? "bg-white text-dark shadow-sm"
                : "text-dark/60 hover:text-dark"
            }`}
            style={{ fontWeight: 600 }}
          >
            <List size={15} />
            <span>Agenda</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Loading or Views */}
      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-dark/10 bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-sm text-dark/60" style={{ fontWeight: 500 }}>
              Loading schedule events...
            </p>
          </div>
        </div>
      ) : viewMode === "month" ? (
        /* ================= MONTH VIEW ================= */
        <div className="overflow-hidden rounded-2xl border border-dark/10 bg-white shadow-sm">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-dark/10 bg-cream/20 text-center text-xs text-dark/70" style={{ fontWeight: 700 }}>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-2.5">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-dark/5">
            {calendarDays.map((cell, idx) => {
              // Match events for this day
              const dayEvents = filteredEvents.filter((e) => e.date && isSameDay(e.date, cell.date));
              const isToday = cell.isToday;

              return (
                <div
                  key={idx}
                  className={`group relative flex min-h-[120px] flex-col p-2 transition-colors ${
                    cell.isCurrentMonth ? "bg-white" : "bg-cream/10 text-dark/30"
                  } hover:bg-cream/20`}
                >
                  {/* Top row of cell: date number & add button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday
                          ? "bg-brand text-emerald-950 font-bold shadow-sm"
                          : cell.isCurrentMonth
                          ? "text-dark font-semibold"
                          : "text-dark/40"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <button
                      onClick={() => openCreateForDate(cell.date)}
                      title="Add event on this date"
                      className="opacity-0 transition-opacity group-hover:opacity-100 rounded p-1 text-dark/50 hover:bg-dark/10 hover:text-dark"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Day Event Chips */}
                  <div className="mt-1.5 flex flex-1 flex-col gap-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => {
                      const meta = getCategoryMeta(event.type);
                      const Icon = meta.icon;
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`flex items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-left text-[11px] transition-all ${meta.chipBg}`}
                          style={{ fontWeight: 600 }}
                          title={`${meta.label}: ${event.title}`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotColor}`} />
                          <span className="truncate">{event.title}</span>
                        </button>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <button
                        onClick={() => {
                          setViewMode("agenda");
                        }}
                        className="text-left text-[10px] text-dark/60 hover:text-dark hover:underline"
                        style={{ fontWeight: 600 }}
                      >
                        +{dayEvents.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= AGENDA VIEW ================= */
        <div className="space-y-6">
          {agendaEventsGrouped.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dark/10 bg-white p-6 text-center">
              <CalendarIcon size={36} className="text-dark/20" />
              <h3 className="mt-3 text-base text-dark" style={{ fontWeight: 700 }}>
                No events found
              </h3>
              <p className="mt-1 text-xs text-dark/50 max-w-sm">
                There are no scheduled meetings, follow-ups, milestones, or deadlines matching your current category filter.
              </p>
            </div>
          ) : (
            agendaEventsGrouped.map((group) => {
              const isGroupToday = isSameDay(group.date, new Date());
              return (
                <div
                  key={group.date.toISOString()}
                  className="rounded-2xl border border-dark/10 bg-white p-5 shadow-sm"
                >
                  {/* Date Heading */}
                  <div className="flex items-center gap-3 border-b border-dark/5 pb-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${
                        isGroupToday ? "bg-brand text-emerald-950 font-bold" : "bg-dark/5 text-dark"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider font-semibold">
                        {group.date.toLocaleString("default", { weekday: "short" })}
                      </span>
                      <span className="text-base leading-none font-bold">
                        {group.date.getDate()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm text-dark" style={{ fontWeight: 700 }}>
                        {group.date.toLocaleString("default", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {isGroupToday && (
                          <span className="ml-2 rounded-md bg-brand/20 px-2 py-0.5 text-[10px] text-emerald-800 font-bold">
                            Today
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-dark/50">
                        {group.items.length} {group.items.length === 1 ? "item scheduled" : "items scheduled"}
                      </p>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="mt-3 divide-y divide-dark/5">
                    {group.items.map((event) => {
                      const meta = getCategoryMeta(event.type);
                      const Icon = meta.icon;

                      return (
                        <div
                          key={event.id}
                          className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${meta.badgeBg}`} style={{ fontWeight: 600 }}>
                                <Icon size={13} />
                                <span>{meta.label}</span>
                              </span>
                            </div>

                            <div>
                              <h4
                                onClick={() => setSelectedEvent(event)}
                                className="cursor-pointer text-sm text-dark hover:text-brand transition-colors"
                                style={{ fontWeight: 700 }}
                              >
                                {event.title}
                              </h4>

                              {/* Metadata chips */}
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-dark/60">
                                {event.type === "meeting" && (
                                  <>
                                    <span className="flex items-center gap-1 font-medium">
                                      <Clock size={12} className="text-purple" />
                                      {event.startTime} - {event.endTime}
                                    </span>
                                    {event.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={12} className="text-dark/40" />
                                        {event.location}
                                      </span>
                                    )}
                                    {event.attendees && (
                                      <span className="flex items-center gap-1">
                                        <Users size={12} className="text-dark/40" />
                                        {event.attendees}
                                      </span>
                                    )}
                                  </>
                                )}

                                {event.type === "follow_up" && (
                                  <>
                                    {event.client && (
                                      <span className="flex items-center gap-1 font-medium text-dark">
                                        <Briefcase size={12} className="text-orange" />
                                        Client: {event.client}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      Status:{" "}
                                      <span
                                        className={`capitalize font-semibold ${
                                          event.status === "completed"
                                            ? "text-emerald-700"
                                            : event.status === "cancelled"
                                            ? "text-red-600"
                                            : "text-orange"
                                        }`}
                                      >
                                        {event.status}
                                      </span>
                                    </span>
                                    {event.notes && (
                                      <span className="truncate max-w-xs text-dark/50">
                                        "{event.notes}"
                                      </span>
                                    )}
                                  </>
                                )}

                                {event.type === "deadline" && (
                                  <>
                                    {event.projectName && (
                                      <span className="flex items-center gap-1 font-medium text-dark">
                                        <Briefcase size={12} className="text-dark/50" />
                                        {event.projectName}
                                      </span>
                                    )}
                                    {event.priority && (
                                      <span className="uppercase text-[10px] font-bold text-red-600">
                                        {event.priority} Priority
                                      </span>
                                    )}
                                    {event.status && (
                                      <span className="capitalize font-medium text-dark/60">
                                        Status: {event.status.replace("_", " ")}
                                      </span>
                                    )}
                                  </>
                                )}

                                {event.type === "milestone" && (
                                  <>
                                    {event.projectName && (
                                      <span className="flex items-center gap-1 font-medium text-dark">
                                        <Briefcase size={12} className="text-brand" />
                                        {event.projectName}
                                      </span>
                                    )}
                                    {event.status && (
                                      <span className="capitalize font-medium text-emerald-800">
                                        Status: {event.status.replace("_", " ")}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            {event.type === "meeting" && (
                              <>
                                <button
                                  onClick={() => openEditMeeting(event)}
                                  className="rounded-lg p-1.5 text-dark/60 hover:bg-dark/5 hover:text-dark"
                                  title="Edit meeting"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event)}
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                  title="Delete meeting"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}

                            {event.type === "follow_up" && (
                              <>
                                <button
                                  onClick={() => openEditFollowup(event)}
                                  className="rounded-lg p-1.5 text-dark/60 hover:bg-dark/5 hover:text-dark"
                                  title="Edit follow-up"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event)}
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                  title="Delete follow-up"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}

                            {(event.type === "deadline" || event.type === "milestone") && (
                              <button
                                onClick={() => setSelectedEvent(event)}
                                className="rounded-lg border border-dark/10 px-2.5 py-1 text-xs text-dark hover:bg-dark/5"
                                style={{ fontWeight: 600 }}
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= MODAL: EVENT DETAILS ================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              {(() => {
                const meta = getCategoryMeta(selectedEvent.type);
                const Icon = meta.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${meta.badgeBg}`} style={{ fontWeight: 600 }}>
                    <Icon size={14} />
                    <span>{meta.label}</span>
                  </span>
                );
              })()}

              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-dark/40 hover:bg-dark/5 hover:text-dark"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="mt-3 text-lg text-dark" style={{ fontWeight: 800 }}>
              {selectedEvent.title}
            </h3>

            <div className="mt-4 space-y-2.5 text-xs text-dark/70 border-t border-dark/5 pt-3">
              <div className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-dark/40" />
                <span className="font-semibold text-dark">Date:</span>
                <span>
                  {new Date(selectedEvent.date).toLocaleDateString("default", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {selectedEvent.type === "meeting" && (
                <>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-purple" />
                    <span className="font-semibold text-dark">Time:</span>
                    <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-dark/40" />
                      <span className="font-semibold text-dark">Location:</span>
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  {selectedEvent.attendees && (
                    <div className="flex items-start gap-2">
                      <Users size={15} className="text-dark/40 mt-0.5" />
                      <div>
                        <span className="font-semibold text-dark">Attendees:</span>
                        <p className="mt-0.5">{selectedEvent.attendees}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedEvent.type === "follow_up" && (
                <>
                  {selectedEvent.client && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={15} className="text-orange" />
                      <span className="font-semibold text-dark">Client:</span>
                      <span>{selectedEvent.client}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-dark">Status:</span>
                    <span className="capitalize font-semibold text-orange">{selectedEvent.status}</span>
                  </div>
                  {selectedEvent.notes && (
                    <div className="rounded-xl bg-cream/40 p-3 mt-2">
                      <span className="font-semibold text-dark block mb-1">Notes:</span>
                      <p className="text-dark/80 whitespace-pre-wrap">{selectedEvent.notes}</p>
                    </div>
                  )}
                </>
              )}

              {selectedEvent.type === "deadline" && (
                <>
                  {selectedEvent.projectName && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={15} className="text-dark/40" />
                      <span className="font-semibold text-dark">Project:</span>
                      <span>{selectedEvent.projectName}</span>
                    </div>
                  )}
                  {selectedEvent.priority && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark">Priority:</span>
                      <span className="uppercase font-bold text-red-600">{selectedEvent.priority}</span>
                    </div>
                  )}
                  {selectedEvent.status && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark">Status:</span>
                      <span className="capitalize font-semibold">{selectedEvent.status.replace("_", " ")}</span>
                    </div>
                  )}
                </>
              )}

              {selectedEvent.type === "milestone" && (
                <>
                  {selectedEvent.projectName && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={15} className="text-brand" />
                      <span className="font-semibold text-dark">Project:</span>
                      <span>{selectedEvent.projectName}</span>
                    </div>
                  )}
                  {selectedEvent.status && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark">Status:</span>
                      <span className="capitalize font-semibold text-emerald-800">{selectedEvent.status.replace("_", " ")}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-dark/5 pt-4">
              {selectedEvent.type === "meeting" && (
                <>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    onClick={() => openEditMeeting(selectedEvent)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white"
                    style={{ backgroundColor: "#7C3AED", fontWeight: 600 }}
                  >
                    <Edit2 size={14} />
                    Edit Meeting
                  </button>
                </>
              )}

              {selectedEvent.type === "follow_up" && (
                <>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    onClick={() => openEditFollowup(selectedEvent)}
                    className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs text-white"
                    style={{ backgroundColor: "#FF6A3D", fontWeight: 600 }}
                  >
                    <Edit2 size={14} />
                    Edit Follow-up
                  </button>
                </>
              )}

              {selectedEvent.type === "deadline" && (
                <Link
                  to="/tasks"
                  className="flex items-center gap-1 rounded-xl bg-dark px-3 py-1.5 text-xs text-white"
                  style={{ fontWeight: 600 }}
                >
                  <CheckSquare size={14} />
                  Go to Tasks
                </Link>
              )}

              {selectedEvent.type === "milestone" && (
                <Link
                  to="/projects"
                  className="flex items-center gap-1 rounded-xl bg-dark px-3 py-1.5 text-xs text-white"
                  style={{ fontWeight: 600 }}
                >
                  <Briefcase size={14} />
                  Go to Projects
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT MEETING ================= */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-dark/5 pb-3">
              <h3 className="text-lg text-dark" style={{ fontWeight: 800 }}>
                {editingMeeting ? "Edit Meeting" : "Schedule New Meeting"}
              </h3>
              <button
                onClick={() => {
                  setShowMeetingModal(false);
                  resetMeetingForm();
                }}
                className="rounded-lg p-1 text-dark/40 hover:bg-dark/5 hover:text-dark"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sprint Planning, Client Sync, Design Review"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-purple"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-dark">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingForm.startTime}
                    onChange={(e) => setMeetingForm({ ...meetingForm, startTime: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingForm.endTime}
                    onChange={(e) => setMeetingForm({ ...meetingForm, endTime: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-purple"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark">
                  Location or Video Link
                </label>
                <input
                  type="text"
                  placeholder="e.g., Google Meet, Zoom, Boardroom B"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark">
                  Attendees (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Alice Smith, Bob Johnson, client@company.com"
                  value={meetingForm.attendees}
                  onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-purple"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-dark/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMeetingModal(false);
                    resetMeetingForm();
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-dark/70 hover:bg-dark/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                  style={{ backgroundColor: "#7C3AED" }}
                >
                  {actionLoading ? "Saving..." : editingMeeting ? "Update Meeting" : "Schedule Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT FOLLOW-UP ================= */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-dark/5 pb-3">
              <h3 className="text-lg text-dark" style={{ fontWeight: 800 }}>
                {editingFollowup ? "Edit Follow-up" : "Schedule Client Follow-up"}
              </h3>
              <button
                onClick={() => {
                  setShowFollowupModal(false);
                  resetFollowupForm();
                }}
                className="rounded-lg p-1 text-dark/40 hover:bg-dark/5 hover:text-dark"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFollowup} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark">
                  Follow-up Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Check proposal feedback, Contract renewal review"
                  value={followupForm.title}
                  onChange={(e) => setFollowupForm({ ...followupForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-orange"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-dark">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={followupForm.date}
                    onChange={(e) => setFollowupForm({ ...followupForm, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-orange"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark">
                    Status
                  </label>
                  <select
                    value={followupForm.status}
                    onChange={(e) => setFollowupForm({ ...followupForm, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-orange"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark">
                  Client or Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Acme Corp, Apex Solutions"
                  value={followupForm.client}
                  onChange={(e) => setFollowupForm({ ...followupForm, client: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark">
                  Notes & Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Key talking points, unresolved questions, or deliverables..."
                  value={followupForm.notes}
                  onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-dark/15 px-3 py-2 text-sm text-dark outline-none focus:border-orange"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-dark/5 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFollowupModal(false);
                    resetFollowupForm();
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-dark/70 hover:bg-dark/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                  style={{ backgroundColor: "#FF6A3D" }}
                >
                  {actionLoading ? "Saving..." : editingFollowup ? "Update Follow-up" : "Save Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

