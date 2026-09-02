import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CalendarEvent } from '@profile/calendar-shared';
import { formatDateTime } from '@profile/calendar-shared';

import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation';
import { Button, Loading } from '../ui';
import { calDesc, calScreen, calTitle } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

const PRIORITY_LABEL: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
};

export function EventDetailScreen({ navigation, route }: Props) {
  const { calendarApi } = useAuth();
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calendarApi.fetchEvent(route.params.eventId);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [calendarApi, route.params.eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = () => {
    Alert.alert('删除事件', '确定要删除这个事件吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeleting(true);
            try {
              await calendarApi.deleteEvent(route.params.eventId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('删除失败', err instanceof Error ? err.message : '请稍后重试');
            } finally {
              setDeleting(false);
            }
          })();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className={`${calScreen} items-center justify-center`}>
        <Loading />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View className={`${calScreen} items-center justify-center gap-3 px-4`}>
        <Text className="text-center text-red-600">{error ?? '事件不存在'}</Text>
        <Button type="primary" onPress={() => void load()}>
          重试
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className={calScreen} contentContainerClassName="px-4 py-5 pb-10">
      <View
        className="mb-4 rounded-[20px] border-2 border-[#9f927d] bg-[#f7f3df] p-5"
        style={{ borderLeftWidth: 6, borderLeftColor: event.color }}
      >
        <Text className={calTitle}>{event.title}</Text>
        <Text className={`mt-2 ${calDesc}`}>
          {event.allDay
            ? '全天'
            : `${formatDateTime(event.startTime)} — ${formatDateTime(event.endTime)}`}
        </Text>
      </View>

      <View className="mb-4 gap-3 rounded-[20px] border-2 border-[#e8dcc8] bg-white/70 p-4">
        <Row label="优先级" value={PRIORITY_LABEL[event.priority] ?? event.priority} />
        {event.location ? <Row label="地点" value={event.location} /> : null}
        {event.description ? <Row label="描述" value={event.description} multiline /> : null}
      </View>

      <View className="flex-row gap-3">
        <Button
          type="primary"
          onPress={() => navigation.navigate('EventForm', { eventId: event.id })}
        >
          编辑
        </Button>
        <Button type="default" danger loading={deleting} onPress={handleDelete}>
          删除
        </Button>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="text-xs font-semibold text-[#9f927d]">{label}</Text>
      <Text className={`mt-1 text-sm text-[#725d42] ${multiline ? '' : ''}`}>{value}</Text>
    </View>
  );
}
