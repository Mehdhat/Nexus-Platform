import React, { useMemo } from 'react';
import Joyride, { ACTIONS, CallBackProps, STATUS, Step } from 'react-joyride';

import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';

export const AppTour: React.FC = () => {
  const { user } = useAuth();
  const { isTourOpen, stopTour } = useTour();

  const steps: Step[] = useMemo(() => {
    const base: Step[] = [
      {
        target: '[data-tour="nav-dashboard"]',
        content: 'This is your dashboard. Use it to monitor activity and access quick actions.',
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-calendar"]',
        content: 'Use Calendar to set availability and schedule meetings.',
      },
      {
        target: '[data-tour="nav-payments"]',
        content: 'Payments is a mock wallet for deposits, transfers, and deal funding.',
      },
      {
        target: '[data-tour="nav-documents"]',
        content: 'Document Chamber lets you upload, preview, and e-sign contracts.',
      },
      {
        target: '[data-tour="nav-video-call"]',
        content: 'Video Call is a WebRTC loopback mock with mic/cam and screen share.',
      },
      {
        target: '[data-tour="nav-messages"]',
        content: 'Messages helps you communicate with investors and entrepreneurs.',
      },
      {
        target: '[data-tour="nav-notifications"]',
        content: 'Notifications keeps you updated on requests, meetings, and activity.',
      },
      {
        target: '[data-tour="nav-profile"]',
        content: 'Your profile shows your details and role-specific info.',
      },
    ];

    if (user?.role === 'entrepreneur') {
      base.splice(2, 0, {
        target: '[data-tour="nav-find"]',
        content: 'Find Investors to connect and start collaboration.',
      });
    }

    if (user?.role === 'investor') {
      base.splice(2, 0, {
        target: '[data-tour="nav-find"]',
        content: 'Find Startups to discover and fund entrepreneurs.',
      });
    }

    return base;
  }, [user?.role]);

  const handleCallback = (data: CallBackProps) => {
    if (data.action === ACTIONS.CLOSE) {
      stopTour();
      return;
    }

    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      stopTour();
      return;
    }

    if (data.type === 'error:target_not_found') {
      stopTour();
    }
  };

  if (!isTourOpen) return null;

  return (
    <Joyride
      steps={steps}
      run
      callback={handleCallback}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      spotlightPadding={4}
      styles={{
        options: {
          primaryColor: '#2563eb',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
    />
  );
};
