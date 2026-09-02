import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CalendarEvent } from '@profile/calendar-shared';
import {
  addMonths,
  formatDateTime,
  getDayStart,
  getMonthEnd,
  getMonthStart,
  isSameDay,
} from '@profile/calendar-shared';

import { CalendarToolbar } from '../components/CalendarToolbar';
import { EventChip } from '../components/EventChip';
import { MonthView } from '../components/MonthView';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation';
import { Button, Loading, Title } from '../ui';
import { calDesc, calScreen, calTitle } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;
type ViewMode = 'month' | 'agenda';

export function CalendarScreen({ navigation }: Props) {
  const { user, isLoading: authLoading, calendarApi, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setError(null);
    try {
      const start = getMonthStart(addMonths(currentDate, -1));
      const end = getMonthEnd(addMonths(currentDate, 1));
      const items = await calendarApi.fetchEvents(start, end);
      setEvents(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    }
  }, [calendarApi, currentDate]);

  useEffect(() => {
    if (authLoading || !user) return;
    setLoading(true);
    void loadEvents().finally(() => setLoading(false));
  }, [authLoading, user, loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((event) => isSameDay(event.startTime, selectedDate))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [events, selectedDate],
  );

  const agendaEvents = useMemo(
    () => [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [events],
  );

  if (authLoading) {
    return (
      <View className={`${calScreen} items-center justify-center`}>
        <Loading />
      </View>
    );
  }

  return (
    <View className={`${calScreen} px-4 py-4`}>
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-2">
          <Title color="app-teal" size="small">
            日历
          </Title>
          <Text className={calTitle}>我的日程</Text>
          <Text className={calDesc}>查看月历、管理事件，与 Web 端数据同步。</Text>
        </View>
        {user ? (
          <Pressable onPress={() => void logout()}>
            <Text className="text-sm font-semibold text-[#19c8b9]">退出</Text>
          </Pressable>
        ) : null}
      </View>

      {user ? (
        <Text className="mb-3 text-sm font-medium text-[#794f27]">{user.name || user.email}</Text>
      ) : null}

      <CalendarToolbar
        currentDate={currentDate}
        onPrev={() => setCurrentDate((d) => addMonths(d, -1))}
        onNext={() => setCurrentDate((d) => addMonths(d, 1))}
        onToday={() => {
          const today = new Date();
          setCurrentDate(today);
          setSelectedDate(today);
        }}
      />

      <View className="mb-3 flex-row rounded-[50px] border-2 border-[#c4b89e] bg-white/65 p-[3px]">
        {(['month', 'agenda'] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            className={`flex-1 items-center rounded-[50px] py-2 ${
              viewMode === mode ? 'bg-[#0cc0b5]' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                viewMode === mode ? 'text-[#fff9e3]' : 'text-[#8a7b66]'
              }`}
            >
              {mode === 'month' ? '月视图' : '列表'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-center text-red-600">{error}</Text>
          {!user ? (
            <Button type="primary" onPress={() => navigation.navigate('Login')}>
              去登录
            </Button>
          ) : (
            <Button type="primary" onPress={() => void loadEvents()}>
              重试
            </Button>
          )}
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'month' ? (
            <>
              <MonthView
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onEventPress={(event) =>
                  navigation.navigate('EventDetail', { eventId: event.id })
                }
              />

              <View className="mt-4 rounded-[20px] border-2 border-[#9f927d] bg-[#f7f3df] p-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-base font-bold text-[#794f27]">
                    {selectedDate.toLocaleDateString('zh-CN', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </Text>
                  <Button
                    type="default"
                    size="small"
                    onPress={() =>
                      navigation.navigate('EventForm', {
                        initialDate: selectedDate.toISOString(),
                      })
                    }
                  >
                    + 新建
                  </Button>
                </View>

                {selectedDayEvents.length === 0 ? (
                  <Text className="text-center text-sm text-[#9f927d]">当天暂无事件</Text>
                ) : (
                  selectedDayEvents.map((event) => (
                    <Pressable
                      key={event.id}
                      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                      className="mb-2 rounded-[14px] border border-[#e8dcc8] bg-white/60 px-3 py-2.5 active:opacity-90"
                    >
                      <Text className="font-bold text-[#794f27]">{event.title}</Text>
                      <Text className="mt-1 text-xs text-[#9f927d]">
                        {event.allDay
                          ? '全天'
                          : `${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}`}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            </>
          ) : (
            <FlatList
              data={agendaEvents}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text className="py-10 text-center text-sm text-[#9f927d]">暂无事件</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                  className="mb-2 rounded-[18px] border-2 border-[#e8dcc8] bg-[#faf8f2] px-4 py-3 active:opacity-90"
                >
                  <EventChip event={item} />
                  <Text className="mt-2 text-xs text-[#9f927d]">
                    {item.allDay ? '全天' : formatDateTime(item.startTime)}
                  </Text>
                  {item.location ? (
                    <Text className="mt-1 text-xs text-[#11a89b]">{item.location}</Text>
                  ) : null}
                </Pressable>
              )}
            />
          )}
        </ScrollView>
      )}

      <View className="absolute bottom-6 right-4">
        <Button
          type="primary"
          onPress={() =>
            navigation.navigate('EventForm', {
              initialDate: getDayStart(selectedDate).toISOString(),
            })
          }
        >
          + 新建事件
        </Button>
      </View>
    </View>
  );
}
