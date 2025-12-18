import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { PhoneOff, Mic, Sparkles } from 'lucide-react';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onStartBooking: (categoryName?: string) => void;
  onUpdateBooking: (params: any) => void;
}

// --- CONFIGURATION DE L'IA (PERSONA & VENTE & FORMULAIRE) ---

const SYSTEM_INSTRUCTION = `
Tu es "HELPER Assistant", une IA futuriste pour l'application de services à domicile Helper.
Ton but est d'assister l'utilisateur par la voix tout en pilotant l'interface graphique.

RÈGLES D'INTERACTION :
1. **Pilotage Interface** : Si l'utilisateur veut réserver, utilise \`start_service_booking\`. S'il donne des détails (adresse, surface, date), utilise \`update_booking_parameters\` pour remplir le formulaire à sa place.
2. **Style** : Professionnel, concis, chaleureux. Tu es un expert en services.
3. **Vente** : Si l'utilisateur hésite, rassure-le sur la qualité (pros vérifiés) et la sécurité (paiement bloqué jusqu'à la fin).
4. **Navigation** : Si l'utilisateur veut voir ses messages ou profil, utilise \`navigate_to_page\`.

OUTILS :
- \`start_service_booking(service_name)\`: Ouvre le wizard de réservation.
- \`navigate_to_page(page)\`: Change d'onglet (home, bookings, messages, profile).
- \`update_booking_parameters(address, surface_area, custom_quantity)\`: Remplit les champs du formulaire en cours.

Exemple : Client "Je veux nettoyer ma villa de 200m2 à Cocody" -> Appelle \`start_service_booking('Villa')\` PUIS \`update_booking_parameters({address: 'Cocody', surface_area: 200})\`.
`;

const tools: FunctionDeclaration[] = [
  {
    name: 'start_service_booking',
    description: 'Lance la procédure de réservation pour un service donné.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        service_name: {
          type: Type.STRING,
          description: 'Le nom ou le type de service (ex: Nettoyage, Plomberie, Cuisine, Gaz).'
        }
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
        page: {
          type: Type.STRING,
          enum: ['home', 'bookings', 'messages', 'profile'],
          description: 'La page de destination.'
        }
      },
      required: ['page']
    }
  },
  {
    name: 'update_booking_parameters',
    description: 'Met à jour les paramètres de la réservation en cours (Remplissage formulaire).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        address: { type: Type.STRING, description: 'L\'adresse ou le lieu de la prestation.' },
        surface_area: { type: Type.NUMBER, description: 'La surface en m² (pour les services au m²).' },
        custom_quantity: { type: Type.NUMBER, description: 'La quantité (nombre de pièces, nombre d\'unités).' }
      }
    }
  }
];

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, onNavigate, onStartBooking, onUpdateBooking }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const ai = useMemo(() => {
    // As per project guidelines, the API key is expected to be in process.env.API_KEY.
    if (!process.env.API_KEY) {
      console.error("CRITICAL: process.env.API_KEY is not defined. Voice Assistant will not work.");
      return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);

  useEffect(() => {
    if (!ai) {
      setError("Clé API Gemini manquante.");
      return;
    }

    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen, ai]);

  const startSession = async () => {
    if (!ai) return; // Guard in case the effect runs before ai is checked
    stopSession();

    try {
      setError(null);
      setIsListening(true);
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = audioContextRef.current;
      
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
             throw new Error("Microphone bloqué.");
        }
        throw e;
      }
      
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
                console.log("Tool Call:", msg.toolCall);
                for (const fc of msg.toolCall.functionCalls) {
                    let result: Record<string, any> = { status: 'ok' };
                    
                    if (fc.name === 'start_service_booking') {
                        const serviceName = (fc.args as any).service_name;
                        onStartBooking(serviceName); 
                        result = { status: 'wizard_opened', service: serviceName };
                    } 
                    else if (fc.name === 'navigate_to_page') {
                        const page = (fc.args as any).page;
                        onNavigate(page);
                        result = { status: 'navigated', page: page };
                    }
                    else if (fc.name === 'update_booking_parameters') {
                        onUpdateBooking(fc.args);
                        result = { status: 'parameters_updated', updated_fields: Object.keys(fc.args as object) };
                    }

                    sessionPromise.then((session) => {
                        session.sendToolResponse({
                            functionResponses: {
                                id: fc.id,
                                name: fc.name,
                                response: { result: result }
                            }
                        });
                    });
                }
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            const outputCtx = outputAudioContextRef.current; // Read the latest ref value.

            if (base64Audio && outputCtx && outputCtx.state === 'running') {
              setIsSpeaking(true);
              const audioData = decode(base64Audio);
              const audioBuffer = await decodeAudioData(audioData, outputCtx, 24000, 1);
              playAudio(audioBuffer, outputCtx);
            }

            if (msg.serverContent?.turnComplete) {
               setIsSpeaking(false);
            }
          },
          onclose: () => setIsListening(false),
          onerror: (err) => {
            console.error(err);
            setError("Erreur connexion");
            setIsListening(false);
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: tools }],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
      });

    } catch (e: any) {
      console.error(e);
      setError(e.message);
      setIsListening(false);
    }
  };

  const stopSession = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
        }
        audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        if (outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(err => console.error("Error closing output AudioContext:", err));
        }
        outputAudioContextRef.current = null;
    }
    setIsSpeaking(false);
    setIsListening(false);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  };

  const playAudio = (buffer: AudioBuffer, ctx: AudioContext) => {
      if (ctx.state === 'closed') return;
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
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed top-6 left-0 right-0 z-[60] flex justify-center pointer-events-none animate-fade-in-down">
        <div className="pointer-events-auto relative group">
            <button 
                onClick={onClose}
                className={`
                    flex items-center gap-3 pl-4 pr-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all duration-300 transform hover:scale-105
                    ${error 
                        ? 'bg-red-500/90 border-red-400 text-white' 
                        : isSpeaking
                            ? 'bg-indigo-600/90 border-indigo-400 text-white ring-2 ring-indigo-400/50'
                            : 'bg-slate-900/90 border-slate-700 text-slate-200'
                    }
                `}
            >
                {error ? (
                    <span className="text-xs font-bold">{error}</span>
                ) : (
                    <>
                        <div className="relative flex items-center justify-center w-5 h-5">
                             {/* Visualizer Effect */}
                             {isSpeaking ? (
                                <div className="flex space-x-[2px] items-center h-4">
                                    <div className="w-1 bg-white rounded-full animate-[music_0.8s_ease-in-out_infinite]"></div>
                                    <div className="w-1 bg-white rounded-full animate-[music_0.8s_ease-in-out_infinite_0.2s]"></div>
                                    <div className="w-1 bg-white rounded-full animate-[music_0.8s_ease-in-out_infinite_0.4s]"></div>
                                    <div className="w-1 bg-white rounded-full animate-[music_0.8s_ease-in-out_infinite_0.1s]"></div>
                                </div>
                             ) : (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative bg-primary-500 rounded-full p-1">
                                        <Mic size={12} className="text-white" />
                                    </div>
                                </div>
                             )}
                        </div>

                        <div className="flex flex-col text-left">
                            <span className="text-xs font-bold tracking-wide leading-none">
                                {isSpeaking ? 'Helper parle...' : 'Je vous écoute'}
                            </span>
                            <span className="text-[9px] opacity-70 leading-none mt-0.5 font-medium">
                                IA Vocale Active
                            </span>
                        </div>

                        <div className="h-4 w-[1px] bg-white/20 mx-1"></div>
                        
                        <div className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <PhoneOff size={14} className="opacity-90" />
                        </div>
                    </>
                )}
            </button>
        </div>
        
        <style>{`
            @keyframes music {
                0%, 100% { height: 20%; }
                50% { height: 100%; }
            }
        `}</style>
    </div>
  );
};

export default memo(VoiceAssistant);