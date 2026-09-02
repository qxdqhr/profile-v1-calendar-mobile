import type { CalendarEvent } from '@profile/calendar-shared';
import { Pressable, Text, View } from 'react-native';

type Props = {
  event: CalendarEvent;
  compact?: boolean;
  onPress?: () => void;
};

export function EventChip({ event, compact = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-0.5 rounded-md px-1 py-0.5 active:opacity-80"
      style={{ backgroundColor: `${event.color}33`, borderLeftWidth: 3, borderLeftColor: event.color }}
    >
      <Text
        className={`font-semibold text-[#794f27] ${compact ? 'text-[10px]' : 'text-xs'}`}
        numberOfLines={1}
      >
        {event.title}
      </Text>
    </Pressable>
  );
}
