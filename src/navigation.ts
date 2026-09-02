export type RootStackParamList = {
  Login: undefined;
  Calendar: undefined;
  EventDetail: { eventId: number };
  EventForm: { eventId?: number; initialDate?: string };
};
