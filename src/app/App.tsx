import { useLiveQuery } from 'dexie-react-hooks';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { db } from '../database/db';
import { FirstRunSetup } from './FirstRunSetup';
import { AppShell } from './AppShell';
import { ParentSessionProvider } from './ParentSession';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ChildPickerPage } from '../features/children/ChildPickerPage';
import { ChildBoardPage } from '../features/children/ChildBoardPage';
import { WeekPage } from '../features/calendar/WeekPage';
import { DayPage } from '../features/calendar/DayPage';
import { WorldPage } from '../features/world-adventure/WorldPage';
import { FamilyTimePage } from '../features/family-time/FamilyTimePage';
import { TimerPage } from '../features/timers/TimerPage';
import { ParentLayout } from '../features/parent-settings/ParentLayout';
import { ParentHome } from '../features/parent-settings/ParentHome';
import { FamilySettings } from '../features/parent-settings/FamilySettings';
import { CalendarSettings } from '../features/parent-settings/CalendarSettings';
import { RoutineSettings } from '../features/parent-settings/RoutineSettings';
import { ChoreSettings } from '../features/parent-settings/ChoreSettings';
import { TimeSettings } from '../features/parent-settings/TimeSettings';
import { TimerSettings } from '../features/parent-settings/TimerSettings';
import { DataSettings } from '../features/parent-settings/DataSettings';
import { PinSettings } from '../features/parent-settings/PinSettings';
import { LearningSettings } from '../features/learning/LearningSettings';
import { LearningPackPage } from '../features/learning/LearningPackPage';
import { MathSettings } from '../features/learning/MathSettings';
import { DiscoverPage, DiscoverPickerPage } from '../features/learning/DiscoverPage';

export function App() {
  const pinCount = useLiveQuery(() => db.parentAuth.count(), []);
  if (pinCount === undefined) return null;
  if (pinCount === 0) return <FirstRunSetup onDone={() => undefined} />;

  return (
    <ParentSessionProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="aufgaben" element={<ChildPickerPage />} />
            <Route path="aufgaben/:childId" element={<ChildBoardPage />} />
            <Route path="lernen" element={<DiscoverPickerPage />} />
            <Route path="lernen/:childId" element={<DiscoverPage />} />
            <Route path="woche" element={<WeekPage />} />
            <Route path="woche/:date" element={<DayPage />} />
            <Route path="weltreise" element={<WorldPage />} />
            <Route path="familienzeit" element={<FamilyTimePage />} />
            <Route path="timer/:presetId" element={<TimerPage />} />
            <Route path="eltern" element={<ParentLayout />}>
              <Route index element={<ParentHome />} />
              <Route path="familie" element={<FamilySettings />} />
              <Route path="lernen" element={<LearningSettings />} />
              <Route path="rechnen" element={<MathSettings />} />
              <Route path="lernpaket" element={<LearningPackPage />} />
              <Route path="kalender" element={<CalendarSettings />} />
              <Route path="routinen" element={<RoutineSettings />} />
              <Route path="haushalt" element={<ChoreSettings />} />
              <Route path="zeiten" element={<TimeSettings />} />
              <Route path="timer" element={<TimerSettings />} />
              <Route path="daten" element={<DataSettings />} />
              <Route path="pin" element={<PinSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ParentSessionProvider>
  );
}
