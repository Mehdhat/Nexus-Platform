import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { findUserById, getUsersByRole } from '../../data/users';
import {
  createAvailabilitySlot,
  createMeetingRequest,
  deleteAvailabilitySlot,
  getAvailabilitySlots,
  getMeetingRequestsForUser,
  getMeetingsForUser,
  respondToMeetingRequest,
} from '../../data/meetings';
import { AvailabilitySlot, MeetingRequest } from '../../types';

type SelectionDraft = {
  start: string;
  end: string;
};

type ClickedAvailability = {
  slot: AvailabilitySlot;
  ownerName: string;
};

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState<boolean>(() => window.matchMedia('(max-width: 639px)').matches);
  const [activeUserId, setActiveUserId] = useState<string>('');

  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [otherAvailability, setOtherAvailability] = useState<AvailabilitySlot[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [meetingsCount, setMeetingsCount] = useState<number>(0);

  const [availabilityTitle, setAvailabilityTitle] = useState<string>('Available');
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);

  const [clickedAvailability, setClickedAvailability] = useState<ClickedAvailability | null>(null);
  const [requestTitle, setRequestTitle] = useState<string>('Meeting');
  const [requestMessage, setRequestMessage] = useState<string>('');

  const oppositeRoleUsers = useMemo(() => {
    if (!user) return [];
    const otherRole = user.role === 'entrepreneur' ? 'investor' : 'entrepreneur';
    return getUsersByRole(otherRole);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (!activeUserId && oppositeRoleUsers.length > 0) {
      setActiveUserId(oppositeRoleUsers[0].id);
    }

    setAvailability(getAvailabilitySlots(user.id));
    setMeetingRequests(getMeetingRequestsForUser(user.id));
    setMeetingsCount(getMeetingsForUser(user.id).length);
  }, [user, activeUserId, oppositeRoleUsers.length]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!activeUserId) {
      setOtherAvailability([]);
      return;
    }
    setOtherAvailability(getAvailabilitySlots(activeUserId));
  }, [user, activeUserId]);

  const refresh = () => {
    if (!user) return;
    setAvailability(getAvailabilitySlots(user.id));
    setMeetingRequests(getMeetingRequestsForUser(user.id));
    setMeetingsCount(getMeetingsForUser(user.id).length);
    if (activeUserId) {
      setOtherAvailability(getAvailabilitySlots(activeUserId));
    }
  };

  const handleSelect = (arg: DateSelectArg) => {
    if (!user) return;

    setClickedAvailability(null);
    setSelectionDraft({
      start: arg.start.toISOString(),
      end: arg.end.toISOString(),
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    if (!user) return;

    const eventType = arg.event.extendedProps?.type as string | undefined;

    if (eventType === 'my_availability') {
      const slotId = arg.event.extendedProps?.slotId as string | undefined;
      if (!slotId) return;

      const slot = availability.find(s => s.id === slotId);
      if (!slot) return;

      setSelectionDraft(null);
      setClickedAvailability({ slot, ownerName: user.name });
      return;
    }

    if (eventType === 'other_availability') {
      const slotId = arg.event.extendedProps?.slotId as string | undefined;
      if (!slotId) return;

      const slot = otherAvailability.find(s => s.id === slotId);
      if (!slot) return;

      const owner = findUserById(slot.userId);
      setSelectionDraft(null);
      setClickedAvailability({ slot, ownerName: owner?.name || 'User' });
      setRequestTitle('Meeting');
      setRequestMessage('');
      return;
    }
  };

  const calendarEvents: EventInput[] = useMemo(() => {
    if (!user) return [];

    const confirmedMeetings = getMeetingsForUser(user.id);

    const meetingEvents: EventInput[] = confirmedMeetings.map(m => ({
      id: m.id,
      title: m.title,
      start: m.start,
      end: m.end,
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      textColor: '#111827',
      extendedProps: { type: 'meeting' },
    }));

    const myAvailabilityEvents: EventInput[] = availability.map(s => ({
      id: s.id,
      title: s.title,
      start: s.start,
      end: s.end,
      backgroundColor: '#14B8A6',
      borderColor: '#0D9488',
      textColor: '#ffffff',
      extendedProps: { type: 'my_availability', slotId: s.id },
    }));

    const otherAvailabilityEvents: EventInput[] = otherAvailability.map(s => ({
      id: s.id,
      title: s.title,
      start: s.start,
      end: s.end,
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      textColor: '#ffffff',
      extendedProps: { type: 'other_availability', slotId: s.id },
    }));

    return [...meetingEvents, ...myAvailabilityEvents, ...otherAvailabilityEvents];
  }, [availability, otherAvailability, user]);

  if (!user) return null;

  const incomingRequests = meetingRequests.filter(r => r.toUserId === user.id && r.status === 'pending');
  const outgoingRequests = meetingRequests.filter(r => r.fromUserId === user.id && r.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage availability and schedule meetings</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent">Meetings: {meetingsCount}</Badge>
          <Badge variant="primary">Incoming: {incomingRequests.length}</Badge>
          <Badge variant="secondary">Outgoing: {outgoingRequests.length}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">View availability of</span>
                <select
                  value={activeUserId}
                  onChange={(e) => setActiveUserId(e.target.value)}
                  className="text-sm rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {oppositeRoleUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardBody>
              <style>
                {`@media (max-width: 639px) {
  .fc .fc-toolbar-title { font-size: 1rem; }
  .fc .fc-button { padding: 0.25rem 0.4rem; font-size: 0.75rem; }
  .fc .fc-toolbar.fc-header-toolbar { margin-bottom: 0.5rem; }
  .fc .fc-col-header-cell-cushion { font-size: 0.75rem; }
  .fc .fc-timegrid-slot-label-cushion { font-size: 0.7rem; }
  .fc .fc-event-title { font-size: 0.75rem; }
}`}
              </style>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={isMobile ? 'timeGridDay' : 'timeGridWeek'}
                  headerToolbar={
                    isMobile
                      ? { left: 'prev,next', center: 'title', right: 'today' }
                      : { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay,dayGridMonth' }
                  }
                  height="auto"
                  selectable
                  selectMirror
                  select={handleSelect}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  nowIndicator
                  allDaySlot={false}
                  slotMinTime="08:00:00"
                  slotMaxTime="20:00:00"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Availability</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Default title"
                value={availabilityTitle}
                onChange={(e) => setAvailabilityTitle(e.target.value)}
                fullWidth
              />

              {selectionDraft ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">Selected time</div>
                    <div className="text-gray-600 break-all">{selectionDraft.start} - {selectionDraft.end}</div>
                  </div>

                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => {
                      try {
                        createAvailabilitySlot(user.id, availabilityTitle || 'Available', selectionDraft.start, selectionDraft.end);
                        toast.success('Availability added');
                        setSelectionDraft(null);
                        refresh();
                      } catch {
                        toast.error('Could not add availability');
                      }
                    }}
                  >
                    Add availability slot
                  </Button>

                  <Button
                    fullWidth
                    variant="outline"
                    onClick={() => setSelectionDraft(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Select a time range on the calendar to add availability.
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="text-sm font-medium text-gray-900">Your slots</div>

                {availability.length === 0 ? (
                  <div className="text-sm text-gray-600">No availability slots yet.</div>
                ) : (
                  <div className="space-y-2">
                    {availability.slice(0, 5).map(s => (
                      <div key={s.id} className="flex items-start justify-between gap-2 rounded-md border border-gray-200 p-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{s.title}</div>
                          <div className="text-xs text-gray-600 break-all">{s.start} - {s.end}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            deleteAvailabilitySlot(s.id);
                            toast.success('Availability removed');
                            refresh();
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Meeting requests</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-900">Incoming</div>
                {incomingRequests.length === 0 ? (
                  <div className="text-sm text-gray-600 mt-2">No incoming requests.</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    {incomingRequests.map(r => {
                      const from = findUserById(r.fromUserId);
                      return (
                        <div key={r.id} className="rounded-md border border-gray-200 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">{r.title}</div>
                            <Badge variant="primary">Pending</Badge>
                          </div>
                          <div className="text-xs text-gray-600">From: {from?.name || r.fromUserId}</div>
                          <div className="text-xs text-gray-600 break-all">{r.start} - {r.end}</div>
                          {r.message && <div className="text-sm text-gray-700">{r.message}</div>}
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                respondToMeetingRequest(r.id, 'accepted');
                                toast.success('Meeting accepted');
                                refresh();
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="error"
                              size="sm"
                              onClick={() => {
                                respondToMeetingRequest(r.id, 'declined');
                                toast.success('Meeting declined');
                                refresh();
                              }}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm font-medium text-gray-900">Send request</div>

                {clickedAvailability && clickedAvailability.slot.userId !== user.id ? (
                  <div className="mt-2 space-y-3">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">Selected availability</div>
                      <div className="text-gray-600">{clickedAvailability.ownerName}</div>
                      <div className="text-xs text-gray-600 break-all">{clickedAvailability.slot.start} - {clickedAvailability.slot.end}</div>
                    </div>

                    <Input
                      label="Title"
                      value={requestTitle}
                      onChange={(e) => setRequestTitle(e.target.value)}
                      fullWidth
                    />

                    <Input
                      label="Message (optional)"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      fullWidth
                    />

                    <Button
                      fullWidth
                      onClick={() => {
                        if (!clickedAvailability) return;
                        createMeetingRequest(
                          user.id,
                          clickedAvailability.slot.userId,
                          requestTitle || 'Meeting',
                          clickedAvailability.slot.start,
                          clickedAvailability.slot.end,
                          requestMessage || undefined
                        );
                        toast.success('Meeting request sent');
                        setClickedAvailability(null);
                        refresh();
                      }}
                    >
                      Send request
                    </Button>

                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => setClickedAvailability(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-600">
                    Click an availability slot of the other user (blue) on the calendar to request a meeting.
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
