import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { Task } from '@/types/task';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type Event = { id: string; title: string; start: Date; end: Date; resource: Task };

const colorByPriority = (p: Task['priority']) =>
  p === 'High' ? 'rgb(220 38 38)' : p === 'Medium' ? 'rgb(245 158 11)' : 'rgb(22 163 74)';

type Props = {
  tasks: Task[];
  selectedDate: Date | null;
  view: View; onViewChange: (v: View) => void;
  onSelectDay: (d: Date) => void;
  onSelectTask: (t: Task) => void;
};

export function CalendarView({ tasks, selectedDate, view, onViewChange, onSelectDay, onSelectTask }: Props) {
  const events: Event[] = tasks.map((t) => {
    const start = new Date(t.deadline);
    return { id: t._id, title: t.title, start, end: start, resource: t };
  });

  return (
    <Calendar
      localizer={localizer}
      events={events}
      views={['month', 'week']}
      view={view}
      onView={onViewChange}
      style={{ height: 600 }}
      selectable
      onSelectSlot={(s) => onSelectDay(s.start)}
      onSelectEvent={(e) => onSelectTask((e as Event).resource)}
      dayPropGetter={(date) =>
        selectedDate && isSameDay(date, selectedDate)
          ? { style: { background: 'rgba(99,102,241,0.12)' } } : {}
      }
      eventPropGetter={(e) => ({
        style: { backgroundColor: colorByPriority((e as Event).resource.priority), color: 'white' },
      })}
    />
  );
}
