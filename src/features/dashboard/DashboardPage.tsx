import { AnalogClock } from '../../components/AnalogClock';
import { useOccurrences, useSettings } from '../../hooks/useData';
import { useNow } from '../../hooks/useNow';
import { isHolidayOn } from '../../services/calendar';
import { getDayPhase } from '../../services/dayPhase';
import { addDaysKey, formatDayMonth, formatWeekday, toDateKey } from '../../utils/dates';
import { timeInWords } from '../../utils/timePhrase';
import { ChildrenOverview } from './ChildrenOverview';
import { DayOverview } from './DayOverview';
import { NextEventCard } from './NextEventCard';
import { QuickTimers } from './QuickTimers';
import { TodayEssentials } from './TodayEssentials';
import { BirthdayNote } from './BirthdayNote';
import { CurrentRoutine } from './CurrentRoutine';
import { WorldTeaser } from './WorldTeaser';
import { FamilyTimeNote } from './FamilyTimeNote';
import { ExplorerNote } from './ExplorerNote';
import { SpecialDayNote } from './SpecialDayNote';
import { MealToday } from './MealToday';
import './dashboard.css';

const PHASE_EMOJI = { night: '🌙', morning: '☀️', kindergarten: '🎒', afternoon: '🌿', evening: '🌆' } as const;

export function DashboardPage() {
  const settings = useSettings();
  const now = useNow(settings?.showSeconds ? 1000 : 15_000);
  const today = toDateKey(now);
  const tomorrow = addDaysKey(today, 1);
  const occurrences = useOccurrences(today, addDaysKey(today, 7));
  const holiday = occurrences ? isHolidayOn(occurrences, today) : false;
  const publicHoliday = occurrences?.find((o) => o.date === today && o.generated === 'public-holiday');
  const info = settings ? getDayPhase(now, today, settings, holiday) : undefined;

  if (!settings || !info || !occurrences) return null;

  const calm = info.phase === 'kindergarten' || info.phase === 'night';
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="dash">
      <section className="dash__left">
        <div className="card dash__hello">
          <p className="card__eyebrow">Unsere kleine große Welt</p>
          <h1 className="dash__greeting">{info.greeting}! <span aria-hidden="true">{PHASE_EMOJI[info.phase]}</span></h1>
          <p className="dash__date">Heute ist {formatWeekday(today)}, {formatDayMonth(today)}</p>
          <div className="dash__clock">
            <AnalogClock now={now} size={250} showSeconds={settings.showSeconds} learningMode={settings.clockLearningMode} />
          </div>
          <p className="dash__time">{time}</p>
          {settings.clockLearningMode && <p className="dash__words">Es ist {timeInWords(now.getHours(), now.getMinutes())}.</p>}
          <p className="chip dash__phase">{info.title}{publicHoliday ? ` · ${publicHoliday.event.title}` : holiday ? ' · Ferien' : ''}</p>
        </div>
        <NextEventCard occurrences={occurrences} now={now} />
        <MealToday today={today} />
      </section>

      <section className="dash__right">
        <SpecialDayNote today={today} />
        {calm ? (
          <DayOverview
            title={info.phase === 'night' && now.getHours() >= 12 ? 'Morgen' : 'Heute'}
            date={info.phase === 'night' && now.getHours() >= 12 ? tomorrow : today}
            occurrences={occurrences}
            settings={settings}
            note={info.phase === 'kindergarten' ? `Kindergartenzeit bis ca. ${settings.kindergartenReturn} Uhr` : `Schlafenszeit ab ${info.bedtime} Uhr. Gute Nacht!`}
          />
        ) : (
          <>
            {info.phase !== 'afternoon' && <CurrentRoutine date={today} phase={info.routinePhase} />}
            <TodayEssentials date={today} />
          </>
        )}
        <FamilyTimeNote now={now} today={today} />
        <ExplorerNote today={today} />
        <ChildrenOverview date={today} focusPhase={info.routinePhase} />
        <div className="dash__row">
          <QuickTimers />
          <BirthdayNote today={today} />
          <WorldTeaser />
        </div>
      </section>
    </div>
  );
}
