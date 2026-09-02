import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { CalendarEvent } from '@profile/calendar-shared';
import {
  WEEKDAY_LABELS,
  getMonthStart,
  getMonthViewDates,
  isSameDay,
  isSameMonth,
  isToday,
} from '@profile/calendar-shared';

import { EventChip } from './EventChip';

type Props = {
  currentDate: Date;
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEventPress: (event: CalendarEvent) => void;
};

export function MonthView({
  currentDate,
  events,
  selectedDate,
  onSelectDate,
  onEventPress,
}: Props) {
  const monthDates = useMemo(() => getMonthViewDates(currentDate, 1), [currentDate]);
  const monthStart = getMonthStart(currentDate);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = `${event.startTime.getFullYear()}-${event.startTime.getMonth()}-${event.startTime.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <View className="overflow-hidden rounded-[20px] border-2 border-[#9f927d] bg-[#f7f3df]">
      <View className="flex-row border-b-2 border-[#e8dcc8] bg-white/50">
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center py-2">
            <Text className="text-xs font-bold text-[#8a7b66]">{label}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {monthDates.map((date) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(date, monthStart);
          const selected = isSameDay(date, selectedDate);
          const today = isToday(date);

          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => onSelectDate(date)}
              className={`h-[88px] w-[14.2857%] border-b border-r border-dashed border-[#f0e8d8] p-1 ${
                selected ? 'bg-[rgba(25,200,185,0.12)]' : ''
              }`}
            >
              <Text
                className={`mb-0.5 text-xs font-bold ${
                  !inMonth ? 'text-[#c4b89e]' : today ? 'text-[#0cc0b5]' : 'text-[#794f27]'
                }`}
              >
                {date.getDate()}
              </Text>
              {dayEvents.slice(0, 2).map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  compact
                  onPress={() => onEventPress(event)}
                />
              ))}
              {dayEvents.length > 2 ? (
                <Text className="text-[10px] font-semibold text-[#11a89b]">
                  +{dayEvents.length - 2}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
