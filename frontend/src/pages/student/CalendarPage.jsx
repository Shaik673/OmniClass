import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/calendar');
      setEvents(data?.data?.events || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  // Next month padding to fill 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getEventsForDay = (date) => {
    return events.filter((ev) => {
      const evDate = new Date(ev.start);
      return isSameDay(evDate, date);
    });
  };

  const selectedDayEvents = events.filter((ev) => {
    const evDate = new Date(ev.start);
    const matchesDay = isSameDay(evDate, selectedDate);
    const matchesFilter = filterType === 'all' || ev.type === filterType;
    return matchesDay && matchesFilter;
  });

  return (
    <div className="page-enter p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-kicker">ACADEMIC SCHEDULE</div>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Calendar</h1>
          <p className="text-sm opacity-70">
            Track assignment deadlines, exam assessment windows, and planned study sessions in one unified agenda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'deadline', 'quiz', 'study-session'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterType === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'all' ? 'All Events' : t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 panel p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-100">{monthYearStr}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dayEvents = getEventsForDay(cell.date);
              const isSelected = isSameDay(cell.date, selectedDate);
              const isToday = isSameDay(cell.date, new Date());

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[76px] p-2 rounded-xl text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-2 border-indigo-500 shadow-md'
                      : cell.isCurrentMonth
                      ? 'bg-slate-800/30 hover:bg-slate-800/60 border border-slate-800'
                      : 'bg-slate-900/20 text-slate-600 border border-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono text-indigo-400 font-semibold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Dot pills */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        title={ev.title}
                        className={`w-2 h-2 rounded-full ${
                          ev.type === 'deadline'
                            ? 'bg-rose-500'
                            : ev.type === 'quiz'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda (4 cols) */}
        <div className="lg:col-span-4 panel p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {selectedDate.toLocaleDateString('default', { weekday: 'long' })}
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-100">
              {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading academic schedule...</div>
            ) : selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                    ev.type === 'deadline'
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : ev.type === 'quiz'
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        ev.type === 'deadline'
                          ? 'bg-rose-500/20 text-rose-400'
                          : ev.type === 'quiz'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {ev.type.replace('-', ' ')}
                    </span>
                    {ev.link && (
                      <Link to={ev.link} className="hover:text-white flex items-center gap-1">
                        Open <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{ev.title}</h4>
                    <p className="text-xs text-slate-400">{ev.courseTitle}</p>
                  </div>
                  {ev.details && <div className="text-xs text-slate-500">{ev.details}</div>}
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500 space-y-2">
                <CalendarIcon size={32} className="mx-auto opacity-30" />
                <p className="text-sm font-medium">No deadlines or events scheduled</p>
                <p className="text-xs opacity-70">Enjoy your learning or plan a self-directed study session.</p>
                <Link to="/planner" className="button button-soft inline-flex items-center gap-1 text-xs mt-2">
                  Plan Study Session
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
