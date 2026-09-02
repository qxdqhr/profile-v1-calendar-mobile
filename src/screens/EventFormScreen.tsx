import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EventColor,
  EventPriority,
  allDayBoundsFromDate,
  ensureEndAfterStart,
  type EventFormData,
} from '@profile/calendar-shared';

import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation';
import { Button, Input, Loading } from '../ui';
import { calScreen } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EventForm'>;

const COLOR_OPTIONS = [
  EventColor.BLUE,
  EventColor.GREEN,
  EventColor.PURPLE,
  EventColor.RED,
  EventColor.YELLOW,
  EventColor.PINK,
  EventColor.INDIGO,
  EventColor.GRAY,
];

const PRIORITY_OPTIONS: EventPriority[] = [
  EventPriority.LOW,
  EventPriority.NORMAL,
  EventPriority.HIGH,
  EventPriority.URGENT,
];

const PRIORITY_LABEL: Record<EventPriority, string> = {
  [EventPriority.LOW]: '低',
  [EventPriority.NORMAL]: '普通',
  [EventPriority.HIGH]: '高',
  [EventPriority.URGENT]: '紧急',
};

function defaultForm(initialDate?: string): EventFormData {
  const base = initialDate ? new Date(initialDate) : new Date();
  const { start, end } = allDayBoundsFromDate(base);
  start.setHours(9, 0, 0, 0);
  end.setHours(10, 0, 0, 0);
  const normalized = ensureEndAfterStart(start, end);
  return {
    title: '',
    description: '',
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    allDay: false,
    location: '',
    color: EventColor.BLUE,
    priority: EventPriority.NORMAL,
  };
}

export function EventFormScreen({ navigation, route }: Props) {
  const { calendarApi } = useAuth();
  const editingId = route.params.eventId;
  const [form, setForm] = useState<EventFormData>(() =>
    defaultForm(route.params.initialDate),
  );
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    void (async () => {
      try {
        const event = await calendarApi.fetchEvent(editingId);
        if (cancelled) return;
        setForm({
          title: event.title,
          description: event.description ?? '',
          startTime: event.startTime,
          endTime: event.endTime,
          allDay: event.allDay,
          location: event.location ?? '',
          color: event.color,
          priority: event.priority,
        });
      } catch (err) {
        Alert.alert('加载失败', err instanceof Error ? err.message : '请稍后重试');
        navigation.goBack();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [calendarApi, editingId, navigation]);

  const patch = useCallback((partial: Partial<EventFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...partial };
      if (partial.allDay) {
        const bounds = allDayBoundsFromDate(next.startTime);
        next.startTime = bounds.start;
        next.endTime = bounds.end;
      }
      if (partial.startTime || partial.endTime) {
        const normalized = ensureEndAfterStart(next.startTime, next.endTime);
        next.startTime = normalized.startTime;
        next.endTime = normalized.endTime;
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('请填写标题');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await calendarApi.updateEvent(editingId, form);
      } else {
        await calendarApi.createEvent(form);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('保存失败', err instanceof Error ? err.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className={`${calScreen} items-center justify-center`}>
        <Loading />
      </View>
    );
  }

  return (
    <ScrollView className={calScreen} contentContainerClassName="px-4 py-5 pb-10">
      <Text className="mb-2 text-sm font-semibold text-[#794f27]">标题</Text>
      <Input value={form.title} onChangeText={(title) => patch({ title })} placeholder="事件标题" />

      <Text className="mb-2 mt-4 text-sm font-semibold text-[#794f27]">描述</Text>
      <Input
        value={form.description}
        onChangeText={(description) => patch({ description })}
        placeholder="可选"
        multiline
      />

      <Text className="mb-2 mt-4 text-sm font-semibold text-[#794f27]">地点</Text>
      <Input
        value={form.location}
        onChangeText={(location) => patch({ location })}
        placeholder="可选"
      />

      <View className="mt-4 flex-row items-center justify-between rounded-[18px] border-2 border-[#e8dcc8] bg-white/70 px-4 py-3">
        <Text className="text-sm font-semibold text-[#794f27]">全天</Text>
        <Switch
          value={form.allDay}
          onValueChange={(allDay) => patch({ allDay })}
          trackColor={{ false: '#e8dcc8', true: '#19c8b9' }}
        />
      </View>

      <Text className="mb-2 mt-4 text-sm font-semibold text-[#794f27]">开始</Text>
      <DateTimeField
        value={form.startTime}
        allDay={form.allDay}
        onChange={(startTime) => patch({ startTime })}
      />

      <Text className="mb-2 mt-4 text-sm font-semibold text-[#794f27]">结束</Text>
      <DateTimeField
        value={form.endTime}
        allDay={form.allDay}
        onChange={(endTime) => patch({ endTime })}
      />

      <Text className="mb-2 mt-4 text-sm font-semibold text-[#794f27]">颜色</Text>
      <View className="flex-row flex-wrap gap-2">
        {COLOR_OPTIONS.map((color) => (
          <Pressable
            key={color}
            onPress={() => patch({ color })}
            className={`h-9 w-9 rounded-full border-2 ${
              form.color === color ? 'border-[#794f27]' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </View>

      <Text className="mb-2 mt-4 text-sm font-semibold text-[#794f27]">优先级</Text>
      <View className="flex-row flex-wrap gap-2">
        {PRIORITY_OPTIONS.map((priority) => (
          <Pressable
            key={priority}
            onPress={() => patch({ priority })}
            className={`rounded-[50px] border-2 px-3 py-1.5 ${
              form.priority === priority
                ? 'border-[#19c8b9] bg-[#e6f9f6]'
                : 'border-[#e8dcc8] bg-[#faf8f2]'
            }`}
          >
            <Text className="text-sm font-semibold text-[#794f27]">{PRIORITY_LABEL[priority]}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-8 flex-row gap-3">
        <Button type="primary" loading={saving} onPress={() => void handleSave()}>
          保存
        </Button>
        <Button type="default" onPress={() => navigation.goBack()}>
          取消
        </Button>
      </View>
    </ScrollView>
  );
}

function DateTimeField({
  value,
  allDay,
  onChange,
}: {
  value: Date;
  allDay: boolean;
  onChange: (date: Date) => void;
}) {
  const display = allDay
    ? value.toLocaleDateString('zh-CN')
    : value.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

  const adjust = (field: 'day' | 'hour', delta: number) => {
    const next = new Date(value);
    if (field === 'day') next.setDate(next.getDate() + delta);
    else next.setHours(next.getHours() + delta);
    onChange(next);
  };

  return (
    <View className="rounded-[18px] border-2 border-[#e8dcc8] bg-white/70 px-4 py-3">
      <Text className="text-sm font-medium text-[#725d42]">{display}</Text>
      <View className="mt-2 flex-row gap-2">
        <Button type="default" size="small" onPress={() => adjust('day', -1)}>
          -1天
        </Button>
        <Button type="default" size="small" onPress={() => adjust('day', 1)}>
          +1天
        </Button>
        {!allDay ? (
          <>
            <Button type="default" size="small" onPress={() => adjust('hour', -1)}>
              -1时
            </Button>
            <Button type="default" size="small" onPress={() => adjust('hour', 1)}>
              +1时
            </Button>
          </>
        ) : null}
      </View>
    </View>
  );
}
