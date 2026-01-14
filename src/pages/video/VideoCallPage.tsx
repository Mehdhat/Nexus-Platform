import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Mic, MicOff, Video, VideoOff, PhoneCall, PhoneOff, MonitorUp } from 'lucide-react';

import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type CallStatus = 'idle' | 'starting' | 'in_call' | 'ending';

type SenderRefs = {
  video?: RTCRtpSender;
  audio?: RTCRtpSender;
};

export const VideoCallPage: React.FC = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const pc1Ref = useRef<RTCPeerConnection | null>(null);
  const pc2Ref = useRef<RTCPeerConnection | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const sendersRef = useRef<SenderRefs>({});

  const [status, setStatus] = useState<CallStatus>('idle');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCamEnabled, setIsCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const canStart = status === 'idle';
  const canEnd = status === 'in_call' || status === 'starting';

  const statusBadge = useMemo(() => {
    if (status === 'in_call') return <Badge variant="success">In call</Badge>;
    if (status === 'starting') return <Badge variant="warning">Starting</Badge>;
    if (status === 'ending') return <Badge variant="gray">Ending</Badge>;
    return <Badge variant="gray">Idle</Badge>;
  }, [status]);

  const attachVideo = (el: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!el) return;
    el.srcObject = stream;
  };

  const stopStream = (stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
  };

  const cleanupConnections = () => {
    try {
      pc1Ref.current?.close();
      pc2Ref.current?.close();
    } catch {
      // ignore
    }
    pc1Ref.current = null;
    pc2Ref.current = null;
    sendersRef.current = {};
  };

  const endCall = useCallback(async () => {
    if (status === 'idle' || status === 'ending') return;

    setStatus('ending');

    try {
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      stopStream(localStreamRef.current);
      stopStream(remoteStreamRef.current);

      localStreamRef.current = null;
      remoteStreamRef.current = null;

      attachVideo(localVideoRef.current, null);
      attachVideo(remoteVideoRef.current, null);

      cleanupConnections();

      setIsMicEnabled(true);
      setIsCamEnabled(true);

      toast.success('Call ended');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setStatus('idle');
    }
  }, [status]);

  const startCall = useCallback(async () => {
    if (!canStart) return;

    setStatus('starting');

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = localStream;
      attachVideo(localVideoRef.current, localStream);

      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      attachVideo(remoteVideoRef.current, remoteStream);

      const pc1 = new RTCPeerConnection();
      const pc2 = new RTCPeerConnection();
      pc1Ref.current = pc1;
      pc2Ref.current = pc2;

      pc1.onicecandidate = (event) => {
        if (event.candidate) pc2.addIceCandidate(event.candidate).catch(() => undefined);
      };

      pc2.onicecandidate = (event) => {
        if (event.candidate) pc1.addIceCandidate(event.candidate).catch(() => undefined);
      };

      pc2.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
      };

      localStream.getTracks().forEach(track => {
        const sender = pc1.addTrack(track, localStream);
        if (track.kind === 'video') sendersRef.current.video = sender;
        if (track.kind === 'audio') sendersRef.current.audio = sender;
      });

      const offer = await pc1.createOffer();
      await pc1.setLocalDescription(offer);
      await pc2.setRemoteDescription(offer);

      const answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc1.setRemoteDescription(answer);

      setIsMicEnabled(true);
      setIsCamEnabled(true);
      setStatus('in_call');
      toast.success('Call started');
    } catch (e) {
      toast.error((e as Error).message);
      await endCall();
    }
  }, [canStart, endCall]);

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) return;

    const next = !isMicEnabled;
    tracks.forEach(t => (t.enabled = next));
    setIsMicEnabled(next);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const tracks = stream.getVideoTracks();
    if (tracks.length === 0) return;

    const next = !isCamEnabled;
    tracks.forEach(t => (t.enabled = next));
    setIsCamEnabled(next);
  };

  const startScreenShare = async () => {
    if (status !== 'in_call') return;
    if (isScreenSharing) return;

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = displayStream;

      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = sendersRef.current.video;
      if (!screenTrack || !sender) {
        stopStream(displayStream);
        screenStreamRef.current = null;
        return;
      }

      const originalTrack = localStreamRef.current?.getVideoTracks()[0] || null;

      screenTrack.onended = async () => {
        if (!originalTrack) {
          setIsScreenSharing(false);
          return;
        }
        try {
          await sender.replaceTrack(originalTrack);
          attachVideo(localVideoRef.current, localStreamRef.current);
        } finally {
          setIsScreenSharing(false);
          stopStream(screenStreamRef.current);
          screenStreamRef.current = null;
        }
      };

      await sender.replaceTrack(screenTrack);
      attachVideo(localVideoRef.current, displayStream);
      setIsScreenSharing(true);
      toast.success('Screen sharing started');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const stopScreenShare = async () => {
    if (!isScreenSharing) return;

    const sender = sendersRef.current.video;
    const originalTrack = localStreamRef.current?.getVideoTracks()[0] || null;

    try {
      if (sender && originalTrack) {
        await sender.replaceTrack(originalTrack);
      }
      attachVideo(localVideoRef.current, localStreamRef.current);
    } finally {
      setIsScreenSharing(false);
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;
      toast.success('Screen sharing stopped');
    }
  };

  useEffect(() => {
    return () => {
      stopStream(screenStreamRef.current);
      stopStream(localStreamRef.current);
      stopStream(remoteStreamRef.current);
      cleanupConnections();
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Call</h1>
          <p className="text-gray-600">Frontend mock using WebRTC (loopback)</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-medium text-gray-900">Call</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={canStart ? 'primary' : 'outline'}
                  disabled={!canStart}
                  leftIcon={<PhoneCall size={18} />}
                  onClick={startCall}
                >
                  Start
                </Button>

                <Button
                  variant={canEnd ? 'error' : 'outline'}
                  disabled={!canEnd}
                  leftIcon={<PhoneOff size={18} />}
                  onClick={endCall}
                >
                  End
                </Button>

                <Button
                  variant="outline"
                  disabled={status !== 'in_call'}
                  leftIcon={isMicEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                  onClick={toggleMic}
                >
                  {isMicEnabled ? 'Mute' : 'Unmute'}
                </Button>

                <Button
                  variant="outline"
                  disabled={status !== 'in_call'}
                  leftIcon={isCamEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                  onClick={toggleCamera}
                >
                  {isCamEnabled ? 'Camera off' : 'Camera on'}
                </Button>

                <Button
                  variant={isScreenSharing ? 'secondary' : 'outline'}
                  disabled={status !== 'in_call'}
                  leftIcon={<MonitorUp size={18} />}
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                >
                  {isScreenSharing ? 'Stop share' : 'Share screen'}
                </Button>
              </div>
            </CardHeader>

            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-black overflow-hidden">
                  <div className="px-3 py-2 bg-gray-900 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">You</span>
                    <Badge variant="secondary">Local</Badge>
                  </div>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-black overflow-hidden">
                  <div className="px-3 py-2 bg-gray-900 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Peer</span>
                    <Badge variant="primary">Remote</Badge>
                  </div>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Notes</h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-gray-700">
              <div className="text-gray-600">
                This is a frontend-only mock: it uses two in-browser WebRTC peer connections (loopback) instead of real signaling.
              </div>
              <div className="text-gray-600">
                To test:
                <div className="mt-1">
                  - Start call (allow camera/mic)
                  - Toggle mic/camera
                  - Share screen
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
