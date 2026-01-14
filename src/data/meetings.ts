import { AvailabilitySlot, Meeting, MeetingRequest, MeetingRequestStatus } from '../types';

const AVAILABILITY_KEY = 'business_nexus_availability_slots';
const MEETING_REQUESTS_KEY = 'business_nexus_meeting_requests';
const MEETINGS_KEY = 'business_nexus_meetings';

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const getAvailabilitySlots = (userId: string): AvailabilitySlot[] => {
  const slots = readJson<AvailabilitySlot[]>(AVAILABILITY_KEY, []);
  return slots
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

export const getAllAvailabilitySlots = (): AvailabilitySlot[] => {
  return readJson<AvailabilitySlot[]>(AVAILABILITY_KEY, []);
};

export const upsertAvailabilitySlot = (slot: AvailabilitySlot): AvailabilitySlot => {
  const slots = readJson<AvailabilitySlot[]>(AVAILABILITY_KEY, []);
  const idx = slots.findIndex(s => s.id === slot.id);
  if (idx >= 0) {
    slots[idx] = slot;
  } else {
    slots.push({ ...slot, id: slot.id || generateId('avail') });
  }
  writeJson(AVAILABILITY_KEY, slots);
  return slot;
};

export const createAvailabilitySlot = (userId: string, title: string, start: string, end: string): AvailabilitySlot => {
  const slots = readJson<AvailabilitySlot[]>(AVAILABILITY_KEY, []);
  const newSlot: AvailabilitySlot = {
    id: generateId('avail'),
    userId,
    title,
    start,
    end,
  };
  slots.push(newSlot);
  writeJson(AVAILABILITY_KEY, slots);
  return newSlot;
};

export const deleteAvailabilitySlot = (slotId: string): void => {
  const slots = readJson<AvailabilitySlot[]>(AVAILABILITY_KEY, []);
  writeJson(AVAILABILITY_KEY, slots.filter(s => s.id !== slotId));
};

export const getMeetingRequests = (): MeetingRequest[] => {
  return readJson<MeetingRequest[]>(MEETING_REQUESTS_KEY, []);
};

export const getMeetingRequestsForUser = (userId: string): MeetingRequest[] => {
  const requests = readJson<MeetingRequest[]>(MEETING_REQUESTS_KEY, []);
  return requests
    .filter(r => r.toUserId === userId || r.fromUserId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createMeetingRequest = (
  fromUserId: string,
  toUserId: string,
  title: string,
  start: string,
  end: string,
  message?: string
): MeetingRequest => {
  const requests = readJson<MeetingRequest[]>(MEETING_REQUESTS_KEY, []);
  const req: MeetingRequest = {
    id: generateId('mreq'),
    fromUserId,
    toUserId,
    title,
    message,
    start,
    end,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  requests.push(req);
  writeJson(MEETING_REQUESTS_KEY, requests);
  return req;
};

export const getMeetings = (): Meeting[] => {
  return readJson<Meeting[]>(MEETINGS_KEY, []);
};

export const getMeetingsForUser = (userId: string): Meeting[] => {
  const meetings = readJson<Meeting[]>(MEETINGS_KEY, []);
  return meetings
    .filter(m => m.organizerId === userId || m.attendeeId === userId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

export const respondToMeetingRequest = (
  meetingRequestId: string,
  response: MeetingRequestStatus
): { request: MeetingRequest | null; meeting: Meeting | null } => {
  const requests = readJson<MeetingRequest[]>(MEETING_REQUESTS_KEY, []);
  const idx = requests.findIndex(r => r.id === meetingRequestId);
  if (idx === -1) return { request: null, meeting: null };

  const updated: MeetingRequest = {
    ...requests[idx],
    status: response,
    respondedAt: new Date().toISOString(),
  };

  requests[idx] = updated;
  writeJson(MEETING_REQUESTS_KEY, requests);

  if (response !== 'accepted') {
    return { request: updated, meeting: null };
  }

  const meetings = readJson<Meeting[]>(MEETINGS_KEY, []);
  const meeting: Meeting = {
    id: generateId('meet'),
    organizerId: updated.fromUserId,
    attendeeId: updated.toUserId,
    title: updated.title,
    start: updated.start,
    end: updated.end,
    createdAt: new Date().toISOString(),
    requestId: updated.id,
  };

  meetings.push(meeting);
  writeJson(MEETINGS_KEY, meetings);

  const slots = readJson<AvailabilitySlot[]>(AVAILABILITY_KEY, []);
  const newSlots = slots.filter(s => {
    if (s.userId !== updated.toUserId) return true;
    return !(s.start === updated.start && s.end === updated.end);
  });
  writeJson(AVAILABILITY_KEY, newSlots);

  return { request: updated, meeting };
};
