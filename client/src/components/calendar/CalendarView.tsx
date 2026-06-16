import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import type { Task } from '@/types/task';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type Event = { id: string; title: string; start: Date; end: Date; resource: Task };

const colorByPriority = (p: Task['priority']) =>
  p === 'High' ? 'rgb(220 38 38)' : p === 'Medium' ? 'rgb(245 158 11)' : 'rgb(22 163 74)';

type Props = {
  tasks: Task[];
  date: Date;
  onNavigate: (d: Date) => void;
  selectedDate: Date | null;
  view: View; onViewChange: (v: View) => void;
  onSelectDay: (d: Date) => void;
  onSelectTask: (t: Task) => void;
};

export function CalendarView({
  tasks, date, onNavigate, selectedDate, view, onViewChange, onSelectDay, onSelectTask,
}: Props) {
  const { t } = useTranslation('calendar');
  const events: Event[] = tasks.map((task) => {
    const start = new Date(task.deadline);
    return { id: task._id, title: task.title, start, end: start, resource: task };
  });

  const messages = {
    today: t('toolbar.today'),
    previous: t('toolbar.back'),
    next: t('toolbar.next'),
    month: t('views.month'),
    week: t('views.week'),
    day: t('views.day'),
    agenda: t('views.agenda'),
    date: t('messages.date'),
    time: t('messages.time'),
    event: t('messages.event'),
    noEventsInRange: t('messages.noEventsInRange'),
    showMore: (count: number) => t('messages.showMore', { count }),
  };

  return (
    <Calendar
      localizer={localizer}
      messages={messages}
      events={events}
      views={['month', 'week']}
      view={view}
      onView={onViewChange}
      date={date}
      onNavigate={onNavigate}
      style={{ height: 600 }}
      selectable
      onSelectSlot={(s) => onSelectDay(s.start)}
      onSelectEvent={(e) => onSelectTask((e as Event).resource)}
      dayPropGetter={(d) =>
        selectedDate && isSameDay(d, selectedDate)
          ? { style: { background: 'rgba(99,102,241,0.12)' } } : {}
      }
      eventPropGetter={(e) => ({
        style: { backgroundColor: colorByPriority((e as Event).resource.priority), color: 'white' },
      })}
    />
  );
}
