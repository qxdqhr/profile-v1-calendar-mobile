import { Pressable, Text, View } from 'react-native';
import { formatViewTitleMonth } from '@profile/calendar-shared';

import { Button } from '../ui';

type Props = {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function CalendarToolbar({ currentDate, onPrev, onNext, onToday }: Props) {
  return (
    <View className="mb-3 flex-row items-center justify-between gap-2 px-1">
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={onPrev}
          className="h-9 min-w-9 items-center justify-center rounded-[50px] border-2 border-[#c4b89e] bg-white/65 active:opacity-80"
        >
          <Text className="text-base font-bold text-[#794f27]">‹</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          className="h-9 min-w-9 items-center justify-center rounded-[50px] border-2 border-[#c4b89e] bg-white/65 active:opacity-80"
        >
          <Text className="text-base font-bold text-[#794f27]">›</Text>
        </Pressable>
      </View>

      <Text className="min-w-0 flex-1 text-center text-base font-bold text-[#794f27]">
        {formatViewTitleMonth(currentDate)}
      </Text>

      <Button type="default" size="small" onPress={onToday}>
        今天
      </Button>
    </View>
  );
}
