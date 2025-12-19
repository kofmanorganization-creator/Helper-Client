
import React, { useEffect, useRef, useState, memo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { PhoneOff } from 'lucide-react';

const SYSTEM_INSTRUCTION = `
Tu es "HELPER Assistant", une IA futuriste pour l'application de services à domicile Helper.
Ton but est d'assister l'utilisateur par la voix tout en pilotant l'interface graphique.

RÈGLES d'INTERACTION :
1. **Pilotage Interface** : Si l'utilisateur veut réserver, utilise \`start_service_booking\`. S'il donne des détails (adresse, surface, date), utilise \`update_booking_parameters\` pour remplir le formulaire à sa place.
2. **Style** : Professionnel, concis, chaleureux.
3. **Navigation** : Si l'utilisateur veut voir ses messages ou profil, utilise \`navigate_to_page\`.

OUTILS :
- \`start_service_booking(service_name)\`: Ouvre le wizard de réservation.
- \`navigate_to_page(page)\`: Change d'onglet (home, bookings, messages, profile).
- \`update_booking_parameters(address, surface_area, custom_quantity)\`: Remplit les champs du formulaire.
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'start_service_booking',
    description: 'Lance la procédure de réservation pour un service donné.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        service_name: { type: Type.STRING }
      },
      required: ['service_name']
    }
  },
  {
    name: 'navigate_to_page',
    description: 'Change la page affichée.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: { type: Type.STRING, enum: ['home', 'bookings', 'messages', 'profile'] }
      },
      required: ['page']
    }
  },
  {
    name: 'update_booking_parameters',
    description: 'Met à jour les paramètres de la réservation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        address: { type: Type.STRING },
        surface_area: { type: Type.NUMBER },
        custom_quantity: { type: Type.NUMBER }
      }
    }
  }
];

const VoiceAssistant: React.FC<any> = ({ isOpen, onClose, onNavigate, onStartBooking, onUpdateBooking }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) startSession();
    else stopSession();
    return () => stopSession();
  }, [isOpen]);

  const startSession = async () => {
    try {
      setError(null);
      // FIX: Create a new GoogleGenAI instance right before making an API call and use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // FIX: Use sessionPromise to send data to ensure session is resolved and avoid race conditions
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'start_service_booking') onStartBooking((fc.args as any).service_name);
                else if (fc.name === 'navigate_to_page') onNavigate((fc.args as any).page);
                else if (fc.name === 'update_booking_parameters') onUpdateBooking(fc.args);
                
                // FIX: Use sessionPromise to respond to the tool call
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: 'ok' },
                    }
                  });
                });
              }
            }
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const audioData = decode(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, outputAudioContextRef.current!, 24000, 1);
              playAudio(audioBuffer, outputAudioContextRef.current!);
            }
            if (msg.serverContent?.turnComplete) setIsSpeaking(false);
          },
          onerror: () => setError("Connection error")
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: tools }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const stopSession = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    inputSourceRef.current?.disconnect();
    audioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsSpeaking(false);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-[60] flex justify-center pointer-events-none animate-fade-in-down">
      <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-slate-700 px-6 py-3 rounded-full flex items-center space-x-4 shadow-2xl">
        <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-indigo-500 animate-pulse' : 'bg-primary-500'}`}></div>
        <span className="text-white text-xs font-bold">{isSpeaking ? 'Helper Assistant...' : 'Listening...'}</span>
        <button onClick={onClose} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><PhoneOff size={14} /></button>
      </div>
    </div>
  );
};

export default memo(VoiceAssistant);
