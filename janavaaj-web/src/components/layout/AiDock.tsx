import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  X,
  Mic,
  MicOff,
  Send,
  Camera,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/authStore';
import { aiApi } from '../../api/endpoints';
import { toast } from '../../lib/toast';

export type VoiceState =
  | 'idle'
  | 'requesting-permission'
  | 'listening'
  | 'transcribing'
  | 'transcript-ready'
  | 'analyzing'
  | 'detected'
  | 'error';

export interface AiDockProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'chat' | 'voice';
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: Array<{ type: string; label: string; payload?: any; to?: string }>;
  detectedDraft?: any;
}

export function AiDock({ isOpen, onClose }: AiDockProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'CITIZEN';

  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>((i18n.language as any) || 'en');
  const [inputMessage, setInputMessage] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text:
        role === 'CITIZEN'
          ? 'Namaste! I am Janavaaj AI. Speak or type your civic problem, upload photos, or track live resolution status.'
          : role === 'NGO'
          ? 'Welcome to Social Impact Intelligence. Ask me about project demographics, milestone releases, or CSR impact metrics.'
          : 'Civic Intelligence Command Center AI online. 24,680 signals analyzed across Pune. How can I assist municipal planning?',
      actions:
        role === 'CITIZEN'
          ? [
              { type: 'VOICE', label: '🎙 Speak Complaint' },
              { type: 'PROMPT', label: 'Track complaint JNV-1042' },
              { type: 'NAVIGATE', label: 'Raise Civic Issue', to: '/app/citizen/report' },
            ]
          : role === 'NGO'
          ? [
              { type: 'PROMPT', label: 'Projects benefiting > 50,000 people' },
              { type: 'NAVIGATE', label: 'Generate CSR Report', to: '/app/ngo/reports' },
            ]
          : [
              { type: 'PROMPT', label: 'Emerging hotspots in Pune' },
              { type: 'PROMPT', label: 'High-impact unassigned issues' },
              { type: 'NAVIGATE', label: 'Open Verification Center', to: '/app/policy/verification' },
            ],
    },
  ]);

  // Voice State Machine
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [detectedIssue, setDetectedIssue] = useState<any | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState]);

  // Handle Voice Recognition
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Browser speech recognition not supported. Using simulation fallback.');
      simulateVoiceFlow();
      return;
    }

    try {
      setVoiceState('requesting-permission');
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = true;

      // Locale mapping
      rec.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

      rec.onstart = () => {
        setVoiceState('listening');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript;
            setVoiceTranscript(final);
            setVoiceState('transcript-ready');
            analyzeSpokenText(final);
          } else {
            interim += event.results[i][0].transcript;
            setVoiceTranscript(interim);
          }
        }
      };

      rec.onerror = () => {
        setVoiceState('error');
      };

      rec.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('transcript-ready');
        }
      };

      rec.start();
    } catch {
      simulateVoiceFlow();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (voiceTranscript.trim().length > 0) {
      setVoiceState('transcript-ready');
      analyzeSpokenText(voiceTranscript);
    } else {
      setVoiceState('idle');
    }
  };

  const simulateVoiceFlow = () => {
    setVoiceState('listening');
    let sample = 'There is a deep dangerous pothole near Hadapsar Flyover causing severe traffic congestion.';
    if (language === 'hi') {
      sample = 'हडपसर फ्लाईओवर के पास सड़क पर एक बहुत बड़ा गड्ढा है जिससे गाड़ियाँ टकरा रही हैं।';
    } else if (language === 'mr') {
      sample = 'हडपसर पुलाजवळ रस्त्यावर मोठा जीवघेणा खड्डा पडला असून वाहतुकीची मोठी कोंडी होत आहे.';
    }

    setTimeout(() => {
      setVoiceTranscript(sample);
      setVoiceState('transcript-ready');
      analyzeSpokenText(sample);
    }, 2500);
  };

  const analyzeSpokenText = async (text: string) => {
    setVoiceState('analyzing');
    try {
      const res = await aiApi.analyzeComplaint({
        description: text,
        latitude: 18.5089,
        longitude: 73.926,
        language,
      });

      const analysis = res.data;
      setDetectedIssue({
        ...analysis,
        originalText: text,
      });
      setVoiceState('detected');
    } catch (err: any) {
      toast.error('AI classification failed, falling back to manual review.');
      setVoiceState('transcript-ready');
    }
  };

  const sendChatMessage = async (overrideText?: string) => {
    const text = overrideText || inputMessage;
    if (!text.trim() || loadingReply) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoadingReply(true);

    try {
      const res = await aiApi.chat({
        message: text,
        context: { role },
        language,
      });

      const botMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: res.data.reply,
        actions: res.data.actions,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      toast.error('Janavaaj AI is temporarily unreachable.');
    } finally {
      setLoadingReply(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: '📷 Uploaded photo for civic analysis',
      },
    ]);
    setLoadingReply(true);

    try {
      const res = await aiApi.analyzeImage(form);
      const data = res.data;

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: `🔍 **Image Analysis Complete**:\n- Detected Issue: **${data.category} (${data.subCategory})**\n- Confidence: **${Math.round(data.confidence * 100)}%**\n- Severity: **${data.severity}**\n- Note: ${data.description}`,
          actions: [
            {
              type: 'CREATE_DRAFT',
              label: 'Proceed to Report with this Photo',
              payload: { category: data.category, description: data.description },
            },
          ],
        },
      ]);
    } catch {
      toast.error('Image analysis failed');
    } finally {
      setLoadingReply(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-300 sm:max-w-[420px]'
      )}
    >
      {/* Panel Header */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-gradient-to-r from-primary-soft/40 to-surface px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900">Janavaaj AI</h3>
              <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                CivicSetu
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {role === 'CITIZEN'
                ? 'Voice & Multimodal Citizen Assistant'
                : role === 'NGO'
                ? 'Social Impact Intelligence'
                : 'Command Center AI'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector chips */}
          <div className="flex rounded-md border border-border bg-bg p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                i18n.changeLanguage('en');
              }}
              className={cn(
                'rounded px-1.5 py-0.5 transition-colors',
                language === 'en' ? 'bg-surface text-primary shadow-xs' : 'text-slate-500'
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('hi');
                i18n.changeLanguage('hi');
              }}
              className={cn(
                'rounded px-1.5 py-0.5 transition-colors',
                language === 'hi' ? 'bg-surface text-primary shadow-xs' : 'text-slate-500'
              )}
            >
              हिं
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('mr');
                i18n.changeLanguage('mr');
              }}
              className={cn(
                'rounded px-1.5 py-0.5 transition-colors',
                language === 'mr' ? 'bg-surface text-primary shadow-xs' : 'text-slate-500'
              )}
            >
              मरा
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-input p-1.5 text-slate-400 hover:bg-bg-alt hover:text-slate-700"
            aria-label="Close Janavaaj AI"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Voice Stepper Block (Active when voice is in progress) */}
      {voiceState !== 'idle' && (
        <div className="border-b border-border bg-primary-soft/30 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Volume2 className="h-4 w-4" /> 8-Step Voice Complaint Flow
            </span>
            <button
              type="button"
              onClick={() => setVoiceState('idle')}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span className={voiceState === 'listening' ? 'text-primary font-bold' : ''}>1 Speak</span>
            <span>→</span>
            <span className={voiceState === 'transcript-ready' ? 'text-primary font-bold' : ''}>2 STT</span>
            <span>→</span>
            <span className={voiceState === 'analyzing' ? 'text-primary font-bold' : ''}>3 AI Classify</span>
            <span>→</span>
            <span className={voiceState === 'detected' ? 'text-primary font-bold' : ''}>4 Review</span>
            <span>→</span>
            <span>5 ID</span>
          </div>

          {/* Dynamic Voice UI State Content */}
          <div className="mt-3 rounded-card border border-border bg-surface p-3 shadow-xs">
            {voiceState === 'listening' && (
              <div className="flex flex-col items-center py-2 text-center">
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white shadow-lg animate-pulse">
                  <Mic className="h-7 w-7" />
                  <span className="absolute -inset-1 rounded-full border-2 border-danger opacity-75 animate-ping" />
                </span>
                <p className="mt-2 text-xs font-bold text-slate-900">Listening to your complaint...</p>
                <p className="text-[11px] text-slate-500">Describe the location and problem clearly</p>
                {voiceTranscript && (
                  <p className="mt-2 rounded bg-bg p-2 text-xs italic text-slate-700">
                    "{voiceTranscript}"
                  </p>
                )}
                <button
                  type="button"
                  onClick={stopListening}
                  className="mt-3 rounded-full bg-slate-900 px-4 py-1 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Done Speaking
                </button>
              </div>
            )}

            {voiceState === 'analyzing' && (
              <div className="flex flex-col items-center py-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="mt-2 text-xs font-bold text-slate-800">
                  AI Identifying Department & Priority...
                </p>
              </div>
            )}

            {voiceState === 'detected' && detectedIssue && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Issue Classified by AI
                </div>
                <div className="mt-2 space-y-1.5 text-xs">
                  <p>
                    <span className="text-slate-500">Category:</span>{' '}
                    <strong className="text-slate-900">{detectedIssue.category}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Department:</span>{' '}
                    <strong className="text-slate-900">{detectedIssue.department}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Priority:</span>{' '}
                    <span className="rounded bg-danger/10 px-1.5 py-0.5 font-bold text-danger">
                      {detectedIssue.priority}
                    </span>
                  </p>
                  <p className="rounded bg-bg p-2 text-[11px] text-slate-600">
                    "{detectedIssue.originalText}"
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/app/citizen/report', {
                        state: {
                          prefillCategory: detectedIssue.category,
                          prefillDescription: detectedIssue.originalText,
                        },
                      });
                    }}
                    className="flex-1 rounded-input bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-sm"
                  >
                    Review Complaint Screen →
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceState('listening')}
                    className="rounded-input border border-border p-1.5 text-slate-500 hover:bg-bg-alt"
                    title="Retry voice"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {voiceState === 'error' && (
              <div className="py-2 text-center text-xs">
                <AlertTriangle className="mx-auto h-5 w-5 text-warning" />
                <p className="mt-1 font-bold text-slate-800">Voice capture interrupted</p>
                <button
                  type="button"
                  onClick={() => setVoiceState('listening')}
                  className="mt-2 text-xs font-semibold text-primary underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages Thread */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex flex-col',
              msg.sender === 'user' ? 'items-end' : 'items-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed shadow-xs',
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'border border-border bg-surface text-slate-800 rounded-bl-none'
              )}
            >
              <div className="whitespace-pre-line text-xs sm:text-sm">{msg.text}</div>
            </div>

            {/* Structured action chips */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.actions.map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (act.type === 'VOICE') {
                        startListening();
                      } else if (act.type === 'PROMPT') {
                        sendChatMessage(act.label);
                      } else if (act.type === 'NAVIGATE' && act.to) {
                        onClose();
                        navigate(act.to);
                      } else if (act.type === 'CREATE_COMPLAINT_DRAFT' || act.type === 'CREATE_DRAFT') {
                        onClose();
                        navigate('/app/citizen/report', { state: act.payload });
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    {act.label}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loadingReply && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Janavaaj AI is analyzing...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Voice Trigger Banner when idle */}
      {voiceState === 'idle' && (
        <div className="border-t border-border bg-bg/60 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-slate-600 font-medium">Voice Mode Ready</span>
          </div>
          <button
            type="button"
            onClick={startListening}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <Mic className="h-3.5 w-3.5" /> Tap to Speak
          </button>
        </div>
      )}

      {/* Composer Input Bar */}
      <div className="border-t border-border bg-surface p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChatMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Image attach button */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-input p-2 text-slate-400 hover:bg-bg-alt hover:text-slate-700"
            title="Attach image for AI analysis"
          >
            <Camera className="h-5 w-5" />
          </button>

          {/* Mic quick toggle */}
          <button
            type="button"
            onClick={voiceState === 'listening' ? stopListening : startListening}
            className={cn(
              'rounded-input p-2 transition-colors',
              voiceState === 'listening'
                ? 'bg-danger text-white'
                : 'text-slate-400 hover:bg-bg-alt hover:text-slate-700'
            )}
            title="Speak into microphone"
          >
            {voiceState === 'listening' ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'समस्या लिखें या पूछें...'
                : language === 'mr'
                ? 'समस्या लिहा किंवा विचारा...'
                : 'Ask Janavaaj AI or describe issue...'
            }
            className="flex-1 rounded-input border border-border bg-bg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-primary focus:bg-surface focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || loadingReply}
            className="rounded-input bg-primary p-2 text-white transition-opacity disabled:opacity-40 hover:bg-primary-hover shadow-sm"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
