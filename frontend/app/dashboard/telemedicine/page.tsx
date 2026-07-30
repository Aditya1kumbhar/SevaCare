'use client'

import React, { useState, useEffect, useRef } from 'react'
import { WebRTCSignalingManager, ICE_SERVERS, BANDWIDTH_PROFILES, BandwidthMode, applyBandwidthConstraints } from '@/lib/webrtc-signaling'
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Copy, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type ConnectionStatus = 'Disconnected' | 'Connecting' | 'Connected'
type QualityIndicator = 'Poor' | 'Fair' | 'Good' | 'Unknown'

export default function TelemedicinePage() {
  const [roomCode, setRoomCode] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('Disconnected')
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [bandwidthMode, setBandwidthMode] = useState<BandwidthMode>('NORMAL')
  const [quality, setQuality] = useState<QualityIndicator>('Unknown')
  const [notes, setNotes] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const signalingManagerRef = useRef<WebRTCSignalingManager | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const generateRoomCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setRoomCode(code)
    return code
  }

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode)
      toast.success('Room code copied to clipboard')
    }
  }

  const getMediaStream = async (mode: BandwidthMode, facing: 'user' | 'environment') => {
    const profile = BANDWIDTH_PROFILES[mode]
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: profile.width },
          height: { ideal: profile.height },
          frameRate: { ideal: profile.frameRate },
          facingMode: facing
        },
        audio: true
      })
      return stream
    } catch (err) {
      toast.error('Could not access camera/microphone')
      console.log(err)
      return null
    }
  }

  const initWebRTC = async () => {
    if (!roomCode) {
      toast.error('Please enter a room code')
      return
    }

    setStatus('Connecting')

    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingManagerRef.current?.sendIceCandidate(event.candidate)
      }
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        setStatus('Connected')
        startStatsPolling()
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setStatus('Disconnected')
        stopStatsPolling()
        toast.error('Connection lost')
      }
    }

    const stream = await getMediaStream(bandwidthMode, facingMode)
    if (!stream) {
      setStatus('Disconnected')
      return
    }
    
    localStreamRef.current = stream
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream
    }

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    const signalingManager = new WebRTCSignalingManager(
      async (offer) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        signalingManager.sendAnswer(answer)
      },
      async (answer) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
      },
      async (candidate) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.log('Error adding ice candidate', e)
        }
      },
      async () => {
        // Peer joined, initiate call
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        signalingManager.sendOffer(offer)
      },
      () => {
        toast.info('Peer left the call')
        endCall()
      }
    )

    signalingManagerRef.current = signalingManager
    await signalingManager.joinRoom(roomCode)
    await applyBandwidthConstraints(pc, bandwidthMode)
  }

  const startStatsPolling = () => {
    stopStatsPolling()
    let lastBytesSent = 0
    let lastTimestamp = 0

    statsIntervalRef.current = setInterval(async () => {
      const pc = peerConnectionRef.current
      if (!pc) return

      const stats = await pc.getStats()
      stats.forEach((report) => {
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          const bytes = report.bytesSent
          const timestamp = report.timestamp
          
          if (lastBytesSent > 0) {
            const bitrate = (8 * (bytes - lastBytesSent)) / (timestamp - lastTimestamp) // kbps
            
            if (bitrate < 100) setQuality('Poor')
            else if (bitrate < 300) setQuality('Fair')
            else setQuality('Good')
          }
          
          lastBytesSent = bytes
          lastTimestamp = timestamp
        }
      })
    }, 3000)
  }

  const stopStatsPolling = () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }
    setQuality('Unknown')
  }

  const endCall = () => {
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null

    localStreamRef.current?.getTracks().forEach(track => track.stop())
    localStreamRef.current = null

    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null

    signalingManagerRef.current?.disconnect()
    signalingManagerRef.current = null

    stopStatsPolling()
    setStatus('Disconnected')
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoMuted(!videoTrack.enabled)
      }
    }
  }

  const switchCamera = async () => {
    if (status !== 'Disconnected') {
      toast.error('Cannot switch camera while in a call. Please end call first.')
      return
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  const handleBandwidthChange = async (checked: boolean) => {
    const newMode = checked ? 'LOW' : 'NORMAL'
    setBandwidthMode(newMode)
    await applyBandwidthConstraints(peerConnectionRef.current, localStreamRef.current, newMode)
    if (checked) {
      toast.success('⚡ Low Bandwidth Mode Active (100kbps, 320x240 @ 15fps)')
    } else {
      toast.info('📶 Normal Bandwidth Mode Active (500kbps, 640x480 @ 30fps)')
    }
  }

  const qualityColor = {
    Poor: 'text-red-500',
    Fair: 'text-yellow-500',
    Good: 'text-green-500',
    Unknown: 'text-gray-400'
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Telemedicine Consultation</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            status === 'Connected' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
            status === 'Connecting' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {status}
          </span>
          {bandwidthMode === 'LOW' && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs">
              ⚡ Low Bandwidth (100kbps)
            </span>
          )}
          {status === 'Connected' && (
            <div className={`flex items-center gap-1 ml-3 ${qualityColor[quality]}`}>
              {quality === 'Poor' || quality === 'Unknown' ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span className="text-xs font-bold">{quality} Quality</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-slate-950 overflow-hidden relative border-0 aspect-video rounded-2xl flex items-center justify-center shadow-xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {status !== 'Connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <VideoOff className="w-16 h-16 opacity-50 mb-3" />
                <p className="font-semibold text-sm">{status === 'Connecting' ? 'Connecting... Waiting for peer to join room' : 'Not in a call. Enter room code and click Start Call.'}</p>
              </div>
            )}
            
            {/* Local Video PIP */}
            <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video bg-slate-900 rounded-xl border-2 border-slate-700 overflow-hidden shadow-2xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </Card>

          {/* Sleek High-Contrast Controls Bar */}
          <div className="flex flex-wrap justify-center items-center gap-4 bg-slate-900 dark:bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <button
              type="button"
              onClick={toggleAudio}
              disabled={status === 'Disconnected'}
              title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
              className={`rounded-full w-12 h-12 flex items-center justify-center transition-all ${
                isAudioMuted 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={toggleVideo}
              disabled={status === 'Disconnected'}
              title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
              className={`rounded-full w-12 h-12 flex items-center justify-center transition-all ${
                isVideoMuted 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={switchCamera}
              disabled={status !== 'Disconnected'}
              title="Switch Camera (Mobile)"
              className="rounded-full w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Smartphone className="w-5 h-5" />
            </button>

            {status === 'Disconnected' ? (
              <button
                type="button"
                onClick={initWebRTC}
                className="rounded-full h-12 px-7 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 cursor-pointer"
              >
                <Phone className="h-4 w-4 fill-current" /> Start Call
              </button>
            ) : (
              <button
                type="button"
                onClick={endCall}
                className="rounded-full h-12 px-7 bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-900/40 transition-all active:scale-95 cursor-pointer"
              >
                <PhoneOff className="h-4 w-4 fill-current" /> End Call
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Join or create a consultation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Room Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="6-digit code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    disabled={status !== 'Disconnected'}
                  />
                  <Button variant="outline" size="icon" onClick={generateRoomCode} disabled={status !== 'Disconnected'}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyRoomCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Low Bandwidth Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Reduces quality for slow connections
                  </p>
                </div>
                <Switch
                  checked={bandwidthMode === 'LOW'}
                  onCheckedChange={handleBandwidthChange}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultation Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Type your notes here..."
                className="min-h-[200px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
