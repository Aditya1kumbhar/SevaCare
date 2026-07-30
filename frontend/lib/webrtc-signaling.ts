import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export const ICE_SERVERS = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302']
    }
  ]
}

export type BandwidthMode = 'LOW' | 'NORMAL'

export const BANDWIDTH_PROFILES = {
  LOW: { maxBitrate: 100000, width: 320, height: 240, frameRate: 15 },
  NORMAL: { maxBitrate: 500000, width: 640, height: 480, frameRate: 30 }
}

export class WebRTCSignalingManager {
  private channel: RealtimeChannel | null = null
  private supabase = createClient()
  private roomCode: string | null = null

  constructor(
    private onOffer: (offer: RTCSessionDescriptionInit) => void,
    private onAnswer: (answer: RTCSessionDescriptionInit) => void,
    private onIceCandidate: (candidate: RTCIceCandidateInit) => void,
    private onPeerJoined: () => void,
    private onPeerLeft: () => void
  ) {}

  async joinRoom(roomCode: string) {
    this.roomCode = roomCode
    this.channel = this.supabase.channel(`telemedicine-${roomCode}`, {
      config: {
        broadcast: { ack: false }
      }
    })

    this.channel
      .on('broadcast', { event: 'offer' }, ({ payload }) => this.onOffer(payload))
      .on('broadcast', { event: 'answer' }, ({ payload }) => this.onAnswer(payload))
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => this.onIceCandidate(payload))
      .on('broadcast', { event: 'peer-joined' }, () => this.onPeerJoined())
      .on('broadcast', { event: 'peer-left' }, () => this.onPeerLeft())
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.send({
            type: 'broadcast',
            event: 'peer-joined',
            payload: {}
          })
        }
      })
  }

  async sendOffer(offer: RTCSessionDescriptionInit) {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'offer',
        payload: offer
      })
    }
  }

  async sendAnswer(answer: RTCSessionDescriptionInit) {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'answer',
        payload: answer
      })
    }
  }

  async sendIceCandidate(candidate: RTCIceCandidate) {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'ice-candidate',
        payload: candidate.toJSON()
      })
    }
  }

  async disconnect() {
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'peer-left',
        payload: {}
      })
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this.roomCode = null
  }
}

export async function applyBandwidthConstraints(
  peerConnection: RTCPeerConnection | null,
  localStream: MediaStream | null,
  mode: BandwidthMode
) {
  const profile = BANDWIDTH_PROFILES[mode]

  // 1. Hardware track resolution & framerate constraints
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack && videoTrack.applyConstraints) {
      try {
        await videoTrack.applyConstraints({
          width: { ideal: profile.width, max: profile.width },
          height: { ideal: profile.height, max: profile.height },
          frameRate: { ideal: profile.frameRate, max: profile.frameRate }
        })
      } catch (e) {
        console.log('Failed to apply video track constraints', e)
      }
    }
  }

  // 2. WebRTC sender bitrate & resolution scaling constraints
  if (peerConnection) {
    const senders = peerConnection.getSenders()
    for (const sender of senders) {
      if (sender.track?.kind === 'video') {
        const parameters = sender.getParameters()
        if (!parameters.encodings || parameters.encodings.length === 0) {
          parameters.encodings = [{}]
        }
        
        parameters.encodings[0].maxBitrate = profile.maxBitrate
        parameters.encodings[0].maxFramerate = profile.frameRate
        parameters.encodings[0].scaleResolutionDownBy = mode === 'LOW' ? 2.0 : 1.0

        try {
          await sender.setParameters(parameters)
        } catch (e) {
          console.log('Failed to set bandwidth sender parameters', e)
        }
      }
    }
  }
}
