import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Brain, 
  Wind, 
  Sparkles, 
  Trophy, 
  Settings, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Star, 
  Smile, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  HelpCircle, 
  Eye,
  Lock,
  Compass,
  Play,
  RotateCcw,
  MessageSquare,
  Handshake,
  ClipboardList,
  Trash2,
  Plus,
  Users,
  Printer,
  Cloud,
  Search,
  Clipboard,
  RefreshCw,
  FileText
} from 'lucide-react';

// Theme customization based on age groups
interface AgeGroup {
  id: string;
  label: string;
  icon: string;
  themeColor: string;
  gradient: string;
  characterMsg: string;
}

// Patient interface representing clinic patients / school profiles (NeuroPlaneta Enterprise)
interface Patient {
  id: string;
  name: string;
  avatar: string; // Emoji
  selectedAge: string;
  stars: number;
  unlockedAchievements: string[];
  completedRoutineTasks: string[];
  routineTasks?: RoutineSchedule;
  emotionJournal: { date: string; emotion: string; note: string }[];
  customPictogramImages: Record<string, string>;
  customPictogramVoices: Record<string, string>;
  therapeuticObjective?: string;
  attentionHighScore?: number;
}

// Neutral fallback while a new profile is being created.
const EMPTY_PROFILE: Patient = {
  id: 'preview', name: 'Explorador', avatar: '⭐', selectedAge: '6-8',
  stars: 0, unlockedAchievements: [], completedRoutineTasks: [],
  emotionJournal: [], customPictogramImages: {}, customPictogramVoices: {}
};

type RoutineTab = 'Mañana' | 'Tarde' | 'Noche';
type RoutineTask = { id: string; name: string; emoji: string };
type RoutineSchedule = Record<RoutineTab, RoutineTask[]>;

const ROUTINE_TASKS: RoutineSchedule = {
  'Mañana': [
    { id: 'despertar', name: 'Despertar a tiempo', emoji: '☀️' },
    { id: 'lavarse', name: 'Lavarse dientes y cara', emoji: '🪥' },
    { id: 'vestirse', name: 'Vestirse solo/a', emoji: '👕' },
    { id: 'desayuno', name: 'Tomar desayuno nutritivo', emoji: '🥛' }
  ],
  'Tarde': [
    { id: 'tareas', name: 'Hacer mis deberes', emoji: '📝' },
    { id: 'ordenar', name: 'Ordenar mi cuarto y juguetes', emoji: '🧸' },
    { id: 'juego', name: 'Tiempo de juego recreativo', emoji: '🎮' },
    { id: 'merienda', name: 'Comer merienda saludable', emoji: '🍎' }
  ],
  'Noche': [
    { id: 'bano', name: 'Un baño tibio y relajante', emoji: '🛁' },
    { id: 'cena', name: 'Cena en familia', emoji: '🍲' },
    { id: 'dientes_noche', name: 'Cepillarse dientes de noche', emoji: '🪥' },
    { id: 'dormir', name: 'Cuento estelar y a dormir', emoji: '🌙' }
  ]
};
const routineTabs: RoutineTab[] = ['Mañana', 'Tarde', 'Noche'];
const currentRoutineTab = (): RoutineTab => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Mañana' : hour < 19 ? 'Tarde' : 'Noche';
};
const MATCH_ROUNDS = [
  { word: 'perro', answer: '🐶', choices: ['🐶', '🐱', '🐰'] },
  { word: 'manzana', answer: '🍎', choices: ['🍌', '🍎', '🍐'] },
  { word: 'sol', answer: '☀️', choices: ['☀️', '🌙', '⭐'] },
  { word: 'auto', answer: '🚗', choices: ['🚲', '🚌', '🚗'] }
] as const;
const MATCH_LABELS: Record<string, string> = { '🐶': 'perro', '🐱': 'gato', '🐰': 'conejo', '🍌': 'banana', '🍎': 'manzana', '🍐': 'pera', '☀️': 'sol', '🌙': 'luna', '⭐': 'estrella', '🚲': 'bici', '🚌': 'colectivo', '🚗': 'auto' };
const copyDefaultRoutine = (): RoutineSchedule => ({
  Mañana: ROUTINE_TASKS.Mañana.map(task => ({ ...task })),
  Tarde: ROUTINE_TASKS.Tarde.map(task => ({ ...task })),
  Noche: ROUTINE_TASKS.Noche.map(task => ({ ...task }))
});
const readRoutineTasks = (value: unknown): RoutineSchedule => {
  if (!value || typeof value !== 'object') return copyDefaultRoutine();
  const saved = value as Partial<RoutineSchedule>;
  const defaults = copyDefaultRoutine();
  for (const tab of routineTabs) {
    if (Array.isArray(saved[tab])) {
      defaults[tab] = saved[tab].filter((task): task is RoutineTask =>
        !!task && typeof task.id === 'string' && typeof task.name === 'string' && typeof task.emoji === 'string'
      ).slice(0, 12).map(task => ({ id: task.id, name: task.name.slice(0, 60), emoji: task.emoji.slice(0, 8) }));
    }
  }
  return defaults;
};

// Unified & Proprietary Pictograms Database (Rediseñado con Código de Color Fitzgerald para TEA/TDAH y compatible con AsTeRICS OBF)
const ALL_DEFAULT_PICTOGRAMS = [
  // necesidades
  { id: 'tengo_hambre', category: 'necesidades', fitzgerald: 'Acción', word: 'Tengo Hambre', emoji: '🍎', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'tengo_sed', category: 'necesidades', fitzgerald: 'Acción', word: 'Tengo Sed', emoji: '💧', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-blue-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'ir_al_banio', category: 'necesidades', fitzgerald: 'Acción', word: 'Ir al Baño', emoji: '🚽', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-indigo-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'tengo_suenio', category: 'necesidades', fitzgerald: 'Acción', word: 'Tengo Sueño', emoji: '😴', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-purple-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'un_abrazo', category: 'necesidades', fitzgerald: 'Social', word: 'Un Abrazo', emoji: '🫂', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-teal-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'frio_calor', category: 'necesidades', fitzgerald: 'Social', word: 'Frío o Calor', emoji: '🌡️', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-amber-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  // emociones
  { id: 'siento_feliz', category: 'emociones', fitzgerald: 'Social', word: 'Me siento Feliz', emoji: '😊', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-amber-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'siento_triste', category: 'emociones', fitzgerald: 'Social', word: 'Me siento Triste', emoji: '😢', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-blue-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'siento_enojado', category: 'emociones', fitzgerald: 'Social', word: 'Me siento Enojado', emoji: '😠', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-red-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'siento_asustado', category: 'emociones', fitzgerald: 'Social', word: 'Me siento Asustado', emoji: '😰', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-indigo-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'siento_cansado', category: 'emociones', fitzgerald: 'Social', word: 'Me siento Cansado', emoji: '🥱', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-zinc-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'siento_bien', category: 'emociones', fitzgerald: 'Social', word: 'Me siento Bien', emoji: '👍', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-emerald-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  // acciones
  { id: 'quiero_jugar', category: 'acciones', fitzgerald: 'Acción', word: 'Quiero Jugar', emoji: '🧸', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-rose-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'quiero_salir', category: 'acciones', fitzgerald: 'Acción', word: 'Quiero Salir', emoji: '🚪', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-orange-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'quiero_pintar', category: 'acciones', fitzgerald: 'Acción', word: 'Quiero Pintar', emoji: '🎨', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-pink-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { id: 'favor_parar', category: 'acciones', fitzgerald: 'Social', word: 'Por favor, Parar', emoji: '🛑', color: 'border-2 border-pink-500 bg-pink-500/5 hover:border-pink-400 text-red-400 shadow-[0_0_12px_rgba(236,72,153,0.1)]' },
  { id: 'necesito_ayuda', category: 'acciones', fitzgerald: 'Persona', word: 'Necesito Ayuda', emoji: '🙋', color: 'border-2 border-yellow-500 bg-yellow-500/5 hover:border-yellow-400 text-sky-400 shadow-[0_0_12px_rgba(234,179,8,0.1)]' },
  { id: 'quiero_musica', category: 'acciones', fitzgerald: 'Acción', word: 'Quiero Música', emoji: '🎵', color: 'border-2 border-emerald-500 bg-emerald-500/5 hover:border-emerald-400 text-violet-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  // objetos
  { id: 'la_tablet', category: 'objetos', fitzgerald: 'Objeto', word: 'La Tablet', emoji: '📱', color: 'border-2 border-orange-500 bg-orange-500/5 hover:border-orange-400 text-teal-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]' },
  { id: 'mi_juguete', category: 'objetos', fitzgerald: 'Objeto', word: 'Mi Juguete', emoji: '🏎️', color: 'border-2 border-orange-500 bg-orange-500/5 hover:border-orange-400 text-yellow-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]' },
  { id: 'un_libro', category: 'objetos', fitzgerald: 'Objeto', word: 'Un Libro', emoji: '📖', color: 'border-2 border-orange-500 bg-orange-500/5 hover:border-orange-400 text-cyan-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]' },
  { id: 'mi_cobija', category: 'objetos', fitzgerald: 'Objeto', word: 'Mi Cobija', emoji: '🛌', color: 'border-2 border-orange-500 bg-orange-500/5 hover:border-orange-400 text-pink-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]' },
  { id: 'mis_auriculares', category: 'objetos', fitzgerald: 'Objeto', word: 'Mis Auriculares', emoji: '🎧', color: 'border-2 border-orange-500 bg-orange-500/5 hover:border-orange-400 text-sky-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]' },
  { id: 'mis_colores', category: 'objetos', fitzgerald: 'Objeto', word: 'Mis Colores', emoji: '✏️', color: 'border-2 border-orange-500 bg-orange-500/5 hover:border-orange-400 text-lime-400 shadow-[0_0_12px_rgba(249,115,22,0.1)]' }
];

export default function ImportedApp() {
  // --- NeuroPlaneta Enterprise Multi-Patient State Architecture ---
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('np_patients');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('np_active_patient_id');
      return saved || '';
    } catch (e) {
      return '';
    }
  });

  // Save additions and profile switches even before the child earns any progress.
  useEffect(() => {
    try {
      localStorage.setItem('np_patients', JSON.stringify(patients));
    } catch (e) {
      console.error('No se pudieron guardar los perfiles.', e);
    }
  }, [patients]);

  // Onboarding & Device selection states
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('np_onboarding_completed');
      return saved === 'true';
    } catch (e) {
      return false;
    }
  });

  const [appDeviceMode, setAppDeviceMode] = useState<'movil' | 'tablet'>(() => {
    try {
      const saved = localStorage.getItem('np_app_device_mode');
      return saved === 'tablet' ? 'tablet' : 'movil';
    } catch (e) {
      return 'movil';
    }
  });

  // Onboarding wizard input states
  const [onboardingChildName, setOnboardingChildName] = useState<string>('');
  const [onboardingAgeRange, setOnboardingAgeRange] = useState<string>('6-8');
  const [onboardingDeviceMode, setOnboardingDeviceMode] = useState<'movil' | 'tablet'>('movil');
  const [onboardingGender, setOnboardingGender] = useState<'niño' | 'niña' | 'estelar'>('niño');
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

  // Clinician dashboard tab selection
  const [parentsActiveTab, setParentsActiveTab] = useState<'pacientes' | 'rutinas' | 'pictogramas' | 'sonido' | 'reportes'>('pacientes');

  // Client demo mode states
  const [clientDemoMessage, setClientDemoMessage] = useState<string>('');
  const [showClientDemoModal, setShowClientDemoModal] = useState<boolean>(false);

  // New patient form states
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientAge, setNewPatientAge] = useState<string>('6-8');
  const [newPatientAvatar, setNewPatientAvatar] = useState<string>('👦');
  const [newPatientObjective, setNewPatientObjective] = useState<string>('');

  // Searches and filters
  const [pictogramSearchQuery, setPictogramSearchQuery] = useState<string>('');
  const [parentsPicSearchQuery, setParentsPicSearchQuery] = useState<string>('');
  const [parentsPicCategoryFilter, setParentsPicCategoryFilter] = useState<'all' | 'necesidades' | 'emociones' | 'acciones' | 'objetos'>('all');

  // App Navigation States
  const [currentTab, setCurrentTab] = useState<'inicio' | 'logros'>('inicio');
  const [selectedAge, setSelectedAge] = useState<string>('6-8');
  const [showAgeSelector, setShowAgeSelector] = useState<boolean>(false);
  const [cosmoGreeted, setCosmoGreeted] = useState(false);
  useEffect(() => setCosmoGreeted(false), [activePatientId]);
  
  // Game/Module States
  const [activeModule, setActiveModule] = useState<'emociones' | 'atencion' | 'zona_calma' | 'sensorial' | 'sos' | 'comunicar' | 'social' | 'rutinas' | null>(null);
  const [calmStep, setCalmStep] = useState(0);
  const [stars, setStars] = useState<number>(0);
  const [attentionHighScore, setAttentionHighScore] = useState<number>(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // Mapeos personalizados de pictogramas (guardados en localStorage)
  const [customPictogramImages, setCustomPictogramImages] = useState<Record<string, string>>({});
  const [customPictogramVoices, setCustomPictogramVoices] = useState<Record<string, string>>({});

  // Estados de grabación y personalización
  const [selectedPicToCustomize, setSelectedPicToCustomize] = useState<string>('tengo_hambre');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  // Estados del Temporizador Visual para Rutinas
  const [activeTimerTask, setActiveTimerTask] = useState<{ id: string, name: string, emoji: string } | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [timerIsActive, setTimerIsActive] = useState<boolean>(false);
  const timerOwnerIdRef = useRef<string | null>(null);
  const rewardedTimerRef = useRef<string | null>(null);

  // Comunicar (AAC Pictograms) States
  const [constructedPhrase, setConstructedPhrase] = useState<{ id: string, word: string, emoji: string }[]>([]);
  const [activePictogramCategory, setActivePictogramCategory] = useState<'necesidades' | 'emociones' | 'acciones' | 'objetos'>('necesidades');

  // Social Stories States
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [storyStep, setStoryStep] = useState<'intro' | 'feedback'>('intro');
  const [storyFeedback, setStoryFeedback] = useState<{ isCorrect: boolean, text: string } | null>(null);

  // Rutinas Checklist States
  const [activeRoutineTab, setActiveRoutineTab] = useState<RoutineTab>(currentRoutineTab);
  const [routineTasks, setRoutineTasks] = useState<RoutineSchedule>(copyDefaultRoutine);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineEmoji, setNewRoutineEmoji] = useState('⭐');
  const [completedRoutineTasks, setCompletedRoutineTasks] = useState<string[]>([]);
  
  // Settings & Parents Mode with Sensory Sound Engine & ARASAAC Integration
  const [sensoryAudioMode, setSensoryAudioMode] = useState<'soft' | 'silent' | 'masking'>(() => {
    try {
      const saved = localStorage.getItem('np_sensory_audio_mode');
      return saved === 'silent' || saved === 'masking' ? saved : 'soft';
    } catch (e) {
      return 'soft';
    }
  });
  const [audioVolume, setAudioVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('np_audio_volume');
      return saved ? Number(saved) : 40;
    } catch (e) {
      return 40;
    }
  });
  const [audioLowpass, setAudioLowpass] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('np_audio_lowpass');
      return saved ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [maskingActive, setMaskingActive] = useState<boolean>(false);
  const maskingSourceRef = useRef<any>(null);
  const maskingAudioCtxRef = useRef<any>(null);

  // ARASAAC Integration States
  const [arasaacQuery, setArasaacQuery] = useState<string>('');
  const [arasaacResults, setArasaacResults] = useState<any[]>([]);
  const [arasaacLoading, setArasaacLoading] = useState<boolean>(false);
  const [arasaacFeedback, setArasaacFeedback] = useState<string>('');

  const soundEnabled = sensoryAudioMode !== 'silent';
  useEffect(() => {
    try {
      localStorage.setItem('np_sensory_audio_mode', sensoryAudioMode);
    } catch (e) {
      // El modo de sonido sigue funcionando si el almacenamiento está desactivado.
    }
  }, [sensoryAudioMode]);
  const setSoundEnabled = (val: boolean) => {
    setSensoryAudioMode(val ? 'soft' : 'silent');
  };
  const [showParentsMode, setShowParentsMode] = useState<boolean>(false);
  const [parentsAuthenticated, setParentsAuthenticated] = useState<boolean>(false);
  const [parentsAnswer, setParentsAnswer] = useState<string>('');
  const [parentsMathQuestion, setParentsMathQuestion] = useState<{q: string, a: number}>({q: '7 x 8', a: 56});
  const [parentsFeedback, setParentsFeedback] = useState<string>('');
  
  // Emotion Module State
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [emotionJournal, setEmotionJournal] = useState<{date: string, emotion: string, note: string}[]>([]);
  const [journalNote, setJournalNote] = useState<string>('');

  // Breathing (Zona Calma) State
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhala' | 'exhala'>('idle');
  const [breathingSeconds, setBreathingSeconds] = useState<number>(4);
  const [breathingCycles, setBreathingCycles] = useState<number>(0);
  
  // Active patient profile helper
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0] || EMPTY_PROFILE;
  const allRoutineTasks = routineTabs.flatMap(tab => routineTasks[tab]);
  const completedRoutineCount = allRoutineTasks.filter(task => completedRoutineTasks.includes(task.id)).length;
  const nextRoutineTasks = routineTasks[activeRoutineTab].filter(task => !completedRoutineTasks.includes(task.id)).slice(0, 2);

  // --- Check for Client Direct Access Parameters (e.g. ?demo=true&client=Mateo&age=6-8&focus=Atencion&msg=...) ---
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isDemo = params.get('demo') === 'true';
      if (isDemo) {
        const clientNameVal = params.get('client') || 'Invitado';
        const clientAgeVal = params.get('age') || '6-8';
        const clientFocusVal = params.get('focus') || 'Entrenamiento de Atención y Coordinación';
        const customWelcome = params.get('msg') || '';
        
        // Reopening the same shared link should reuse its profile and progress.
        const demoIdentity = JSON.stringify([clientNameVal, clientAgeVal, clientFocusVal]);
        let demoHash = 2166136261;
        for (let i = 0; i < demoIdentity.length; i++) {
          demoHash = Math.imul(demoHash ^ demoIdentity.charCodeAt(i), 16777619);
        }
        const demoId = `demo_${(demoHash >>> 0).toString(36)}`;
        const newDemoPatient: Patient = {
          id: demoId,
          name: `${clientNameVal} (Demo Cliente)`,
          avatar: clientAgeVal === '3-5' ? '🌱' : clientAgeVal === '6-8' ? '👦' : '⭐',
          selectedAge: clientAgeVal,
          stars: 12, // start with some stars for immediate engagement
          unlockedAchievements: ['Aventura Iniciada 🚀', 'Explorador Estelar'],
          completedRoutineTasks: [],
          emotionJournal: [
            { date: new Date().toLocaleString(), emotion: '😊 Feliz', note: `Perfil creado automáticamente para el demo de terapia: ${clientFocusVal}` }
          ],
          customPictogramImages: {},
          customPictogramVoices: {},
          therapeuticObjective: `Demostración de NeuroPlanet enfocada en: ${clientFocusVal}`,
          attentionHighScore: 0
        };

        // Add this demo patient and set as active
        setPatients(prev => {
          if (prev.some(p => p.id === demoId)) return prev;
          const updated = [newDemoPatient, ...prev];
          return updated;
        });
        
        setActivePatientId(demoId);
        setOnboardingCompleted(true);
        localStorage.setItem('np_onboarding_completed', 'true');
        localStorage.setItem('np_active_patient_id', demoId);
        
        if (customWelcome) {
          setClientDemoMessage(decodeURIComponent(customWelcome));
        } else {
          setClientDemoMessage(`¡Bienvenido/a a tu demo interactiva en NeuroPlanet! Esta sesión ha sido configurada especialmente para enfocarse en "${clientFocusVal}" de forma divertida, adaptado para la edad de ${clientAgeVal} años.`);
        }
        setShowClientDemoModal(true);
      }
    } catch (e) {
      console.error("Error parsing demo query params", e);
    }
  }, []);

  // A profile switch must survive reload even if the child has made no edits.
  useEffect(() => {
    if (!activePatientId) return;
    try {
      localStorage.setItem('np_active_patient_id', activePatientId);
    } catch (e) {
      console.error('No se pudo guardar el perfil activo.', e);
    }
  }, [activePatientId]);

  // Wait for profile hydration before saving. Otherwise switching profiles can
  // overwrite the newly selected child's progress with the previous profile.
  const [loadedPatientId, setLoadedPatientId] = useState<string | null>(null);

  // --- Sync individual states FROM active patient when activePatientId loads ---
  useEffect(() => {
    if (activePatient && activePatientId) {
      setSelectedAge(activePatient.selectedAge);
      setStars(activePatient.stars);
      setAttentionHighScore(activePatient.attentionHighScore || 0);
      setUnlockedAchievements(activePatient.unlockedAchievements || []);
      setCompletedRoutineTasks(activePatient.completedRoutineTasks || []);
      setRoutineTasks(readRoutineTasks(activePatient.routineTasks));
      setActiveTimerTask(null);
      setEmotionJournal(activePatient.emotionJournal || []);
      setCustomPictogramImages(activePatient.customPictogramImages || {});
      setCustomPictogramVoices(activePatient.customPictogramVoices || {});
      setLoadedPatientId(activePatientId);
    }
  }, [activePatientId]);

  // --- Sync individual state updates TO patients array and localStorage ---
  useEffect(() => {
    if (loadedPatientId !== activePatientId || !activePatientId) return;
    setPatients(prev => {
      const index = prev.findIndex(p => p.id === activePatientId);
      if (index === -1) return prev;
      
      const current = prev[index];
      const hasChanged = 
        current.selectedAge !== selectedAge ||
        current.stars !== stars ||
        (current.attentionHighScore || 0) !== attentionHighScore ||
        JSON.stringify(current.unlockedAchievements) !== JSON.stringify(unlockedAchievements) ||
        JSON.stringify(current.completedRoutineTasks) !== JSON.stringify(completedRoutineTasks) ||
        JSON.stringify(readRoutineTasks(current.routineTasks)) !== JSON.stringify(routineTasks) ||
        JSON.stringify(current.emotionJournal) !== JSON.stringify(emotionJournal) ||
        JSON.stringify(current.customPictogramImages) !== JSON.stringify(customPictogramImages) ||
        JSON.stringify(current.customPictogramVoices) !== JSON.stringify(customPictogramVoices);

      if (!hasChanged) return prev;

      const updatedPatients = [...prev];
      updatedPatients[index] = {
        ...updatedPatients[index],
        selectedAge,
        stars,
        attentionHighScore,
        unlockedAchievements,
        completedRoutineTasks,
        routineTasks,
        emotionJournal,
        customPictogramImages,
        customPictogramVoices
      };
      
      return updatedPatients;
    });
  }, [activePatientId, loadedPatientId, selectedAge, stars, attentionHighScore, unlockedAchievements, completedRoutineTasks, routineTasks, emotionJournal, customPictogramImages, customPictogramVoices]);

  
  // Attention Game State
  const [attentionGameState, setAttentionGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [attentionActivity, setAttentionActivity] = useState<'numbers' | 'matching' | null>(null);
  const [matchingRound, setMatchingRound] = useState(0);
  const [matchingHint, setMatchingHint] = useState(false);
  const [attentionScore, setAttentionScore] = useState<number>(0);
  const attentionScoreRef = useRef(0);
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [attentionGrid, setAttentionGrid] = useState<number[]>([]);
  const [attentionHint, setAttentionHint] = useState(false);
  
  // Sensorial State
  const [sensorialColor, setSensorialColor] = useState<string>('from-indigo-600 to-pink-500');
  const [sensorialNotes, setSensorialNotes] = useState<{id: number, x: number, y: number, color: string}[]>([]);
  const sensoryTapCountRef = useRef(0);

  // Switching children ends activities in progress without touching saved progress.
  useEffect(() => {
    if (!activePatientId) return;
    setTimerIsActive(false);
    setTimerSecondsLeft(0);
    setTimerDuration(0);
    setActiveTimerTask(null);
    setCurrentTab('inicio');
    setActiveModule(null);
    setActiveRoutineTab(currentRoutineTab());
    setShowAgeSelector(false);
    setAttentionGameState('idle');
    setAttentionActivity(null);
    setMatchingRound(0);
    setMatchingHint(false);
    setAttentionHint(false);
    setConstructedPhrase([]);
    setSelectedStoryId(null);
    setCurrentEmotion(null);
    setJournalNote('');
    setBreathingPhase('idle');
    setBreathingCycles(0);
    setSensorialNotes([]);
  }, [activePatientId]);

  // Sound generator helper (Web Audio API) for therapeutic ambient or feedback tones with Sensory adaptation
  const startMaskingNoise = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      maskingAudioCtxRef.current = ctx;
      
      const bufferSize = 10 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise mathematical integration
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }
      
      const whiteNoiseSource = ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime); // Extra low lowpass for warm ambient feel
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime((audioVolume / 100) * 0.08, ctx.currentTime);
      
      whiteNoiseSource.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      whiteNoiseSource.start();
      maskingSourceRef.current = whiteNoiseSource;
      setMaskingActive(true);
    } catch (e) {
      console.error("Masking noise error:", e);
    }
  };

  const stopMaskingNoise = () => {
    try {
      if (maskingSourceRef.current) {
        maskingSourceRef.current.stop();
        maskingSourceRef.current = null;
      }
      if (maskingAudioCtxRef.current && maskingAudioCtxRef.current.state !== 'closed') {
        maskingAudioCtxRef.current.close();
      }
      setMaskingActive(false);
    } catch (e) {
      console.error("Stop masking error:", e);
    }
  };

  useEffect(() => {
    if (sensoryAudioMode === 'masking') {
      if (!maskingActive) {
        startMaskingNoise();
      } else {
        // Adjust volume on the fly
        try {
          if (maskingAudioCtxRef.current) {
            stopMaskingNoise();
            startMaskingNoise();
          }
        } catch(err){}
      }
    } else {
      if (maskingActive) {
        stopMaskingNoise();
      }
    }
    return () => {
      if (maskingSourceRef.current) {
        try {
          maskingSourceRef.current.stop();
        } catch(e){}
      }
    };
  }, [sensoryAudioMode, audioVolume]);

  const playTherapeuticTone = (freq: number, type: 'sine' | 'triangle' | 'sine-soft' = 'sine', duration: number = 0.3) => {
    if (sensoryAudioMode === 'silent') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Hyperacusis frequency adaptation: shift down octaves to keep it warm and low
      let adaptedFreq = freq;
      if (audioLowpass && adaptedFreq > 400) {
        while (adaptedFreq > 400) {
          adaptedFreq = adaptedFreq / 2;
        }
      }
      
      osc.type = type === 'sine-soft' ? 'sine' : type;
      osc.frequency.setValueAtTime(adaptedFreq, ctx.currentTime);
      
      // Slow, click-free attack and decay envelopes
      const targetGain = (audioVolume / 100) * 0.15;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignore restrictive browser blockages
    }
  };

  // Reproducir voz grabada de mamá/papá/terapeuta
  const playCustomVoice = (base64Data: string) => {
    if (sensoryAudioMode === 'silent') return;
    try {
      const audio = new Audio(base64Data);
      audio.volume = audioVolume / 100;
      audio.play().catch(e => console.log("Permiso de reproducción de audio:", e));
    } catch (err) {
      console.error("Error reproduciendo voz:", err);
    }
  };

  // Keep the countdown free of state updates with side effects.
  useEffect(() => {
    if (!timerIsActive || timerSecondsLeft <= 0) return;
    const intervalId = window.setInterval(() => {
      if (timerOwnerIdRef.current !== activePatientId) {
        setTimerIsActive(false);
        return;
      }
      setTimerSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timerIsActive, timerSecondsLeft, activePatientId]);

  // Complete a task only while its original child is still selected.
  useEffect(() => {
    if (!timerIsActive || timerSecondsLeft !== 0 || !activeTimerTask) return;
    setTimerIsActive(false);
    setActiveTimerTask(null);
    if (timerOwnerIdRef.current !== activePatientId) return;

    const rewardKey = `${activePatientId}:${activeTimerTask.id}`;
    if (completedRoutineTasks.includes(activeTimerTask.id) || rewardedTimerRef.current === rewardKey) return;
    rewardedTimerRef.current = rewardKey;
    setCompletedRoutineTasks(current => current.includes(activeTimerTask.id) ? current : [...current, activeTimerTask.id]);
    awardStars(12, 'Guardián de Rutinas');
  }, [timerIsActive, timerSecondsLeft, activeTimerTask, activePatientId, completedRoutineTasks]);

  // Sound effects with adaptive sensory controls
  const playSuccessSound = () => {
    playTherapeuticTone(523.25, 'triangle', 0.2); // C5 (adjusted automatically below 400Hz if lowpass is on)
    setTimeout(() => playTherapeuticTone(659.25, 'triangle', 0.2), 100); // E5
    setTimeout(() => playTherapeuticTone(783.99, 'triangle', 0.4), 200); // G5
  };

  const playClickSound = () => {
    playTherapeuticTone(440, 'sine', 0.08); // A4
  };

  const playCalmSound = () => {
    playTherapeuticTone(293.66, 'sine-soft', 1.0); // D4 deep soft
  };

  // Generate math question for Parents Mode verification
  const generateParentsMath = () => {
    const num1 = Math.floor(Math.random() * 8) + 3; // 3 to 10
    const num2 = Math.floor(Math.random() * 8) + 3; // 3 to 10
    setParentsMathQuestion({
      q: `${num1} x ${num2}`,
      a: num1 * num2
    });
    setParentsAnswer('');
    setParentsFeedback('');
  };

  // Verify parent answer
  const handleVerifyParents = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(parentsAnswer) === parentsMathQuestion.a) {
      setParentsAuthenticated(true);
      playSuccessSound();
    } else {
      setParentsFeedback('Respuesta incorrecta. Inténtalo de nuevo.');
      generateParentsMath();
    }
  };

  const searchARASAAC = async (query: string) => {
    if (!query.trim()) return;
    setArasaacLoading(true);
    setArasaacFeedback('');
    try {
      const res = await fetch(`https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('No se encontraron resultados o hubo un problema de red.');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setArasaacResults(data.slice(0, 10)); // Get top 10 results
        if (data.length === 0) {
          setArasaacFeedback('No se encontraron pictogramas en ARASAAC.');
        }
      } else {
        setArasaacResults([]);
        setArasaacFeedback('Formato de respuesta desconocido de ARASAAC.');
      }
    } catch (err: any) {
      setArasaacResults([]);
      setArasaacFeedback('Error al consultar ARASAAC: ' + (err.message || err));
    } finally {
      setArasaacLoading(false);
    }
  };

  const handleExportAsTeRICS_OBF = () => {
    try {
      // Build a full Open Board Format (OBF) compliant representation of the client's current pictograms
      const obfButtons = ALL_DEFAULT_PICTOGRAMS.map((pic) => {
        const customImg = customPictogramImages[pic.id];
        const colorHex = pic.color.includes('green') ? '#22c55e' :
                         pic.color.includes('orange') ? '#f97316' :
                         pic.color.includes('pink') ? '#ec4899' : '#eab308';
        return {
          id: pic.id,
          label: pic.word,
          border_color: colorHex,
          bg_color: `${colorHex}22`,
          image_url: customImg || `https://api.arasaac.org/api/pictograms/${pic.id}`,
          vocalize_text: pic.word,
          fitzgerald_key: pic.fitzgerald,
          emoji: pic.emoji
        };
      });

      const obfData = {
        format: "open-board-v1",
        id: `neuroplaneta_board_${activePatientId}`,
        locale: "es",
        name: `Tablero de ${activePatient.name} - NeuroPlaneta`,
        grid: {
          rows: 4,
          columns: Math.ceil(obfButtons.length / 4)
        },
        buttons: obfButtons,
        customVoicesCount: Object.keys(customPictogramVoices).length
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obfData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `neuroplaneta_asterics_${activePatientId}.obf`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      playSuccessSound();
    } catch (err) {
      console.error("Error exporting OBF:", err);
    }
  };

  const handleImportAsTeRICS_OBF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.format === 'open-board-v1' && Array.isArray(parsed.buttons)) {
          // Import custom image configurations back into state
          const importedImages: Record<string, string> = {};
          parsed.buttons.forEach((btn: any) => {
            if (btn.image_url && (btn.image_url.startsWith('data:image') || btn.image_url.startsWith('http'))) {
              importedImages[btn.id] = btn.image_url;
            }
          });
          setCustomPictogramImages(prev => ({ ...prev, ...importedImages }));
          playSuccessSound();
          alert("¡Tablero OBF de AsTeRICS importado con éxito! Se han restaurado las configuraciones de pictograma.");
        } else {
          alert("El archivo no parece ser un formato Open Board (.obf) de AsTeRICS válido.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON/OBF.");
      }
    };
    reader.readAsText(file);
  };

  // Age group definitions
  const ageGroups: { [key: string]: AgeGroup } = {
    '3-5': {
      id: '3-5',
      label: '3-5 años',
      icon: '🌱',
      themeColor: 'emerald-400',
      gradient: 'from-emerald-500 to-teal-600',
      characterMsg: '¡Hola peque! Soy Cosmo, tu guía estelar. ¡Vamos a divertirnos y respirar hondo como globitos!'
    },
    '6-8': {
      id: '6-8',
      label: '6-8 años',
      icon: '🚀',
      themeColor: 'blue-400',
      gradient: 'from-blue-500 to-indigo-600',
      characterMsg: '¡Modo 6-8 años activado! Listo para la exploración mental del NeuroPlaneta. ¿Cómo están tus niveles de energía hoy?'
    },
    '9-10': {
      id: '9-10',
      label: '9-10 años',
      icon: '⭐',
      themeColor: 'amber-400',
      gradient: 'from-amber-500 to-orange-600',
      characterMsg: '¡Saludos, Comandante Estelar! Iniciando calibración de foco, manejo emocional y relajación neuro-sensorial.'
    }
  };

  const activeAgeConfig = ageGroups[selectedAge] || ageGroups['6-8'];

  // Award stars with floating sfx/vibe
  const awardStars = (amount: number, achievementName?: string) => {
    setStars(prev => prev + amount);
    playSuccessSound();
    
    if (achievementName && !unlockedAchievements.includes(achievementName)) {
      setUnlockedAchievements(prev => [...prev, achievementName]);
    }
  };

  // Trigger breathing loops
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeModule === 'zona_calma' && breathingPhase !== 'idle') {
      interval = setInterval(() => {
        setBreathingSeconds(prev => {
          if (prev <= 1) {
            // The visual cue is optional and never requires holding one's breath.
            if (breathingPhase === 'inhala') {
              setBreathingPhase('exhala');
              return 4;
            } else {
              setBreathingPhase('inhala');
              setBreathingCycles(c => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeModule, breathingPhase]);

  // Start Attention Game
  const startAttentionGame = () => {
    playClickSound();
    setAttentionActivity('numbers');
    const correctNum = Math.floor(Math.random() * 9) + 1;
    setTargetNumber(correctNum);
    
    // Generate grid of numbers with exactly one or more matches
    const grid: number[] = [];
    for (let i = 0; i < 16; i++) {
      grid.push(Math.floor(Math.random() * 9) + 1);
    }
    // Ensure at least one target exists
    if (!grid.includes(correctNum)) {
      grid[Math.floor(Math.random() * 16)] = correctNum;
    }
    
    setAttentionGrid(grid);
    attentionScoreRef.current = 0;
    setAttentionScore(0);
    setAttentionHint(false);
    setAttentionGameState('playing');
  };

  const startMatchingGame = () => {
    setAttentionActivity('matching');
    setMatchingRound(0);
    setMatchingHint(false);
    setAttentionGameState('playing');
  };

  const handleMatchingChoice = (choice: string) => {
    if (attentionGameState !== 'playing' || attentionActivity !== 'matching') return;
    if (choice !== MATCH_ROUNDS[matchingRound].answer) {
      setMatchingHint(true);
      return;
    }
    setMatchingHint(false);
    playSuccessSound();
    if (matchingRound === MATCH_ROUNDS.length - 1) {
      setAttentionGameState('gameover');
      if (!unlockedAchievements.includes('Parejas Visuales')) awardStars(5, 'Parejas Visuales');
    } else {
      setMatchingRound(round => round + 1);
    }
  };

  // Click cell in Attention game
  const handleCellClick = (num: number) => {
    if (attentionGameState !== 'playing') return;
    
    if (num === targetNumber) {
      playSuccessSound();
      const nextScore = attentionScoreRef.current + 1;
      attentionScoreRef.current = nextScore;
      setAttentionScore(nextScore);
      setAttentionHighScore(previous => Math.max(previous, nextScore));
      setAttentionHint(false);
      
      // Award star and achievement milestones
      if (nextScore === 5) {
        awardStars(10, 'Foco Láser');
      } else {
        setStars(s => s + 1);
      }

      if (nextScore >= 5) {
        setAttentionGameState('gameover');
        return;
      }

      // Generate new targets
      const nextCorrect = Math.floor(Math.random() * 9) + 1;
      setTargetNumber(nextCorrect);
      const nextGrid: number[] = [];
      for (let i = 0; i < 16; i++) {
        nextGrid.push(Math.floor(Math.random() * 9) + 1);
      }
      if (!nextGrid.includes(nextCorrect)) {
        nextGrid[Math.floor(Math.random() * 16)] = nextCorrect;
      }
      setAttentionGrid(nextGrid);
    } else {
      setAttentionHint(true);
    }
  };

  // Handle tap in Sensory Color Canvas
  const handleSensoryTap = (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = 'clientX' in e ? e.clientX - rect.left : rect.width / 2;
    const y = 'clientY' in e ? e.clientY - rect.top : rect.height / 2;
    
    const colors = [
      '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#C084FC', '#F472B6'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Play pentatonic therapeutic frequency based on horizontal coordinate for calming interaction
    const notesFreqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // Pentatonic scale (C, D, E, G, A, C)
    const relativeX = x / rect.width;
    const noteIndex = Math.floor(relativeX * notesFreqs.length);
    playTherapeuticTone(notesFreqs[noteIndex], 'sine', 0.6);

    const newNote = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: randomColor
    };
    
    setSensorialNotes(prev => [...prev, newNote]);
    setTimeout(() => {
      setSensorialNotes(prev => prev.filter(n => n.id !== newNote.id));
    }, 1000);

    // Count touches across the session, not just simultaneous one-second effects.
    sensoryTapCountRef.current += 1;
    if (sensoryTapCountRef.current === 10) {
      awardStars(5, 'Explorador Sensorial');
    }
  };

  // ONBOARDING WIZARD RENDER
  if (!onboardingCompleted) {
    return (
      <div id="neuroplaneta-onboarding-wrapper" className="np-theme min-h-dvh stitch-grid flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glowing atmospheric nebula */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 ambient-glow-violet rounded-full opacity-50"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 ambient-glow-cyan rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 ambient-glow-pink rounded-full opacity-35"></div>

        <div className="max-w-xl w-full bg-[#0B0F19]/90 border border-white/10 rounded-[32px] p-6 md:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden text-slate-100 font-sans backdrop-blur-xl">
          {/* Subtle glowing planet in background */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#186EF3]/15 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl"></div>

          {/* Stepper indicator */}
          <div className="flex justify-center items-center gap-2 mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  onboardingStep === step
                    ? 'w-8 bg-blue-500'
                    : onboardingStep > step
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* STEP 1: DEVICE MODE QUESTION */}
          {onboardingStep === 1 && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="text-center">
                <span className="text-4xl animate-pulse inline-block">🚀</span>
                <h2 className="text-xl font-extrabold text-white mt-3">¡Bienvenidos a NeuroPlaneta!</h2>
                <p className="text-xs text-slate-400 mt-1">Tu espacio estelar de aprendizaje, calma y comunicación adaptada.</p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-4">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block text-center">
                  📱 ¿Cómo vas a usar la aplicación?
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tablet option card */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setOnboardingDeviceMode('tablet');
                    }}
                    className={`p-5 rounded-2xl border transition-all text-left space-y-3 cursor-pointer ${
                      onboardingDeviceMode === 'tablet'
                        ? 'bg-[#186EF3]/10 border-[#186EF3] shadow-[0_0_20px_rgba(24,110,243,0.25)] text-white'
                        : 'bg-slate-950/60 border-white/5 hover:border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">💻</span>
                      {onboardingDeviceMode === 'tablet' && <CheckCircle2 className="w-4 h-4 text-[#186EF3]" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100">Dispositivo Tablet</h4>
                      <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                        Optimiza la interfaz con grids de 3 a 5 columnas, botones más espaciosos y controles táctiles más grandes para terapias y el hogar.
                      </p>
                    </div>
                  </button>

                  {/* Mobile option card */}
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setOnboardingDeviceMode('movil');
                    }}
                    className={`p-5 rounded-2xl border transition-all text-left space-y-3 cursor-pointer ${
                      onboardingDeviceMode === 'movil'
                        ? 'bg-[#186EF3]/10 border-[#186EF3] shadow-[0_0_20px_rgba(24,110,243,0.25)] text-white'
                        : 'bg-slate-950/60 border-white/5 hover:border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">📱</span>
                      {onboardingDeviceMode === 'movil' && <CheckCircle2 className="w-4 h-4 text-[#186EF3]" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100">Dispositivo Celular</h4>
                      <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                        Diseño de columna única adaptado a pantallas de celulares, ideal para sostener con una mano durante transiciones rápidas.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setOnboardingStep(2); }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mx-auto"
                >
                  <span>Siguiente Paso</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHILD DATA */}
          {onboardingStep === 2 && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="text-center">
                <span className="text-4xl inline-block font-sans">👦</span>
                <h2 className="text-lg font-extrabold text-white mt-2">Perfil del Pequeño Explorador</h2>
                <p className="text-xs text-slate-400">Puedes usar un apodo. Los avances quedan en este navegador y no se sincronizan.</p>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#186EF3] font-extrabold uppercase tracking-widest">
                    ✍️ Nombre del Niño / Niña
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre aquí..."
                    value={onboardingChildName}
                    onChange={(e) => setOnboardingChildName(e.target.value)}
                    className="w-full bg-[#03060E] border border-white/10 rounded-2xl py-3 px-4 text-white font-bold text-sm focus:outline-none focus:border-[#186EF3] focus:ring-1 focus:ring-[#186EF3] transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-[#186EF3] font-extrabold uppercase tracking-widest block">
                    🤖 Selecciona su Avatar Favorito
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { id: '👦', label: 'Niño' },
                      { id: '👧', label: 'Niña' },
                      { id: '🦊', label: 'Zorrito' },
                      { id: '🐨', label: 'Koala' }
                    ].map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setOnboardingGender(av.id === '👦' ? 'niño' : av.id === '👧' ? 'niña' : 'estelar');
                          setNewPatientAvatar(av.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer ${
                          newPatientAvatar === av.id
                            ? 'bg-[#186EF3]/10 border-[#186EF3] shadow-[0_0_15px_rgba(24,110,243,0.2)] text-white'
                            : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <span className="text-2xl mb-1">{av.id}</span>
                        <span className="text-[9px] font-black">{av.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setOnboardingStep(1); }}
                  className="bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-slate-300 font-extrabold text-xs py-3 px-5 rounded-2xl transition-all"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  disabled={!onboardingChildName.trim()}
                  onClick={() => { playClickSound(); setOnboardingStep(3); }}
                  className="bg-[#186EF3] hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs py-3 px-8 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continuar</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AGE RANGE & FINISH */}
          {onboardingStep === 3 && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="text-center">
                <span className="text-4xl inline-block">🌱</span>
                <h2 className="text-lg font-extrabold text-white mt-2">Dificultad y Adaptación por Edad</h2>
                <p className="text-xs text-slate-400">Selecciona el rango para habilitar las sugerencias y servicios recomendados.</p>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-3">
                {[
                  {
                    id: '3-5',
                    title: '3-5 años',
                    icon: '🌱',
                    desc: 'Calma Semilla: Simplifica la comunicación, incentiva la regulación sensorial y respiración lúdica con globos.'
                  },
                  {
                    id: '6-8',
                    title: '6-8 años',
                    icon: '🚀',
                    desc: 'Explorador Mental: Habilita rutinas visuales, diario emocional asistido y ejercicios de memoria/concentración.'
                  },
                  {
                    id: '9-10',
                    title: '9-10 años',
                    icon: '⭐',
                    desc: 'Comandante Estelar: Desafíos cognitivos de foco, historias sociales de transiciones y autogestión de crisis.'
                  }
                ].map((age) => (
                  <button
                    key={age.id}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setOnboardingAgeRange(age.id);
                    }}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex gap-4 items-start cursor-pointer ${
                      onboardingAgeRange === age.id
                        ? 'bg-[#186EF3]/10 border-[#186EF3] shadow-[0_0_20px_rgba(24,110,243,0.2)] text-white'
                        : 'bg-slate-950/60 border-white/5 hover:border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="text-2xl mt-1">{age.icon}</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-100">{age.title}</h4>
                      <p className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                        {age.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-between gap-4">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setOnboardingStep(2); }}
                  className="bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-slate-300 font-extrabold text-xs py-3 px-5 rounded-2xl transition-all"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Create and add patient
                    const newId = 'nino_' + Date.now();
                    const newPatientObj: Patient = {
                      id: newId,
                      name: onboardingChildName.trim(),
                      avatar: newPatientAvatar,
                      selectedAge: onboardingAgeRange,
                      stars: 0,
                      unlockedAchievements: ['¡Bienvenido Explorador! ✨'],
                      completedRoutineTasks: [],
                      emotionJournal: [
                        { date: new Date().toLocaleTimeString(), emotion: '😊 Feliz', note: `¡Hola ${onboardingChildName}! Cosmo te da la bienvenida al NeuroPlaneta.` }
                      ],
                      customPictogramImages: {},
                      customPictogramVoices: {},
                      therapeuticObjective: `Autonomía, autorregulación y comunicación adaptada para el rango de ${onboardingAgeRange} años.`,
                      attentionHighScore: 0
                    };

                    setPatients([newPatientObj, ...patients]);
                    setActivePatientId(newId);
                    setSelectedAge(onboardingAgeRange);
                    setAppDeviceMode(onboardingDeviceMode);
                    
                    // persist onboarding success
                    localStorage.setItem('np_onboarding_completed', 'true');
                    localStorage.setItem('np_app_device_mode', onboardingDeviceMode);
                    localStorage.setItem('np_active_patient_id', newId);
                    localStorage.setItem('np_patients', JSON.stringify([newPatientObj, ...patients]));
                    
                    setOnboardingCompleted(true);
                    playSuccessSound();
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs py-3 px-6 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>¡Iniciar Aventura Estelar! 🚀</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // CORE APP RENDER
  return (
    <div className="min-h-dvh stitch-grid flex items-center justify-center p-0 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Glowing atmospheric nebula */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 ambient-glow-violet rounded-full opacity-45"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ambient-glow-cyan rounded-full opacity-35"></div>
      <div className="absolute top-1/3 right-1/3 w-72 h-72 ambient-glow-pink rounded-full opacity-30"></div>

      <div id="neuroplaneta-workspace" className={`np-theme mx-auto h-dvh sm:h-[92vh] sm:min-h-[600px] shadow-2xl relative flex flex-col justify-between overflow-hidden rounded-none sm:rounded-[32px] border text-slate-100 font-sans transition-all duration-300 ${appDeviceMode === 'tablet' ? 'max-w-4xl w-full' : 'max-w-md w-full'}`}>
      
      {/* HEADER SECTION (Like the screenshot) */}
      <header className="px-4 sm:px-6 py-3 sm:py-5 bg-[#03060E]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Hola, {activePatient.name.split(' (')[0]}!</h1>
            <span className="animate-bounce text-sm">✨</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs mt-0.5">
            <span className="text-slate-400">Nivel:</span>
            <button 
              onClick={() => { playClickSound(); setShowAgeSelector(true); }}
              className="font-bold text-yellow-400 underline hover:text-yellow-300 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              {activeAgeConfig.label}
              <span className="text-[10px]">▼</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            aria-pressed={!soundEnabled}
            title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 transition-all"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          {/* LOGROS HEADS-UP DISPLAY */}
        <button 
          onClick={() => { playClickSound(); setCurrentTab('logros'); }}
          className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 px-2 sm:px-4 py-2 min-h-11 rounded-full flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-spin-slow" />
          <span className="text-xs font-bold text-yellow-300">{stars} logros</span>
        </button>
        </div>
      </header>

      {/* PERSONALIZED CLIENT DEMO WELCOME MODAL */}
      {showClientDemoModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B0F19] border border-blue-500/30 rounded-[32px] p-6 w-full max-w-sm text-center shadow-[0_0_50px_rgba(24,110,243,0.25)] space-y-6 relative overflow-hidden">
            
            {/* Ambient decorative glowing particles */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>

            <div className="space-y-2 relative z-10">
              <span className="text-5xl animate-pulse block">🚀</span>
              <h3 className="font-extrabold text-lg text-white tracking-wide">¡Espacio Personalizado Listo!</h3>
              <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                🌌 Demo de NeuroPlanet
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 text-left space-y-3 relative z-10">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-xl">🧑‍⚕️</span>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wide">Mensaje del Especialista:</span>
                  <span className="text-xs text-blue-400 font-extrabold">Invitación Especial</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {clientDemoMessage}
              </p>
            </div>

            <div className="space-y-3 text-left bg-blue-950/20 p-4 rounded-2xl border border-blue-500/10 relative z-10">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-blue-400">Parámetros de esta sesión:</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[9px] font-bold">Paciente:</span>
                  <span className="text-white font-extrabold">{activePatient.name.split(' (')[0]}</span>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[9px] font-bold">Nivel / Edad:</span>
                  <span className="text-amber-400 font-extrabold">{activePatient.selectedAge} años</span>
                </div>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5">
                <span className="text-slate-400 block text-[9px] font-bold">Objetivo de esta actividad:</span>
                <span className="text-emerald-400 font-bold text-[10.5px] leading-tight block mt-0.5">{activePatient.therapeuticObjective}</span>
              </div>
            </div>

            <button
              onClick={() => {
                playSuccessSound();
                setShowClientDemoModal(false);
              }}
              className="w-full bg-[#186EF3] hover:bg-blue-500 text-white font-extrabold text-sm py-3 rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(24,110,243,0.3)] active:scale-95 cursor-pointer relative z-10"
            >
              Comenzar Exploración Estelar 🌌
            </button>
          </div>
        </div>
      )}

      {/* PARENTS MODE GATEWAY MODAL */}
      {showAgeSelector && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl">
            <h3 className="font-extrabold text-base text-white mb-2">Selecciona la Edad</h3>
            <p className="text-xs text-slate-400 mb-4">Adaptaremos los juegos y el lenguaje del asistente Cosmo.</p>
            
            <div className="space-y-2.5">
              {Object.values(ageGroups).map(g => (
                <button
                  key={g.id}
                  onClick={() => {
                    playSuccessSound();
                    setSelectedAge(g.id);
                    setShowAgeSelector(false);
                  }}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between font-bold text-sm transition-all ${
                    selectedAge === g.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{g.icon}</span>
                    {g.label}
                  </span>
                  {selectedAge === g.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>

            <button 
              onClick={() => { playClickSound(); setShowAgeSelector(false); }}
              className="mt-4 text-xs text-slate-500 hover:text-slate-300 font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* CORE CONTENT SWITCHER */}
      <main className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto pb-24">
        
        {currentTab === 'inicio' && !activeModule && (
          <div className="space-y-5 animate-fade-in">
            
            {/* COSMO INTERACTIVE ROBOT ASSISTANT */}
            <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5 opacity-20">
                <Brain className="w-12 h-12 text-blue-500" />
              </div>
              
              {/* Animated Floating Planet */}
              <button type="button" aria-label="Saludar a Cosmo" className="shrink-0 w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800 shadow-inner relative group cursor-pointer"
                onClick={() => {
                  playCalmSound();
                  setCosmoGreeted(true);
                }}
              >
                <span className="text-3xl animate-pulse">🪐</span>
                {/* Floating orbital glow */}
                <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/30 animate-spin-slow"></div>
              </button>

              {/* Cosmo speech bubble */}
              <div className="flex-1 bg-white text-slate-900 p-3.5 rounded-2xl rounded-tl-none relative shadow-md">
                <div className="absolute left-0 top-0 -ml-2 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent"></div>
                <p className="text-xs font-bold leading-relaxed">
                  {cosmoGreeted ? `¡Hola, ${activePatient.name.split(' (')[0]}! Elegí lo que más te guste para empezar.` : activeAgeConfig.characterMsg}
                </p>
                <div className="text-[9px] text-blue-600 font-bold mt-1 text-right animate-pulse">
                  {cosmoGreeted ? '¡Gracias por saludarme!' : '¡Tócame para saludar!'}
                </div>
              </div>
            </div>

            {/* AGE INDICATOR BANNER (matching screenshot) */}
            <div className={`bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪐</span>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Modo {activeAgeConfig.label} activado!</h3>
                  <p className="text-[11px] text-slate-400">Elige una actividad a tu ritmo.</p>
                </div>
              </div>
              <button 
                onClick={() => { playClickSound(); setShowAgeSelector(true); }}
                className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-slate-700 hover:text-white"
              >
                Cambiar
              </button>
            </div>

            {/* MAIN 4 CORE THERAPEUTIC MODULES GRID */}
            <section aria-labelledby="next-steps-title" className="rounded-2xl border border-[#b9ccc1] bg-[#e8f0e8] p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 id="next-steps-title" className="font-extrabold text-base text-[#27665e]">Mi rutina: {activeRoutineTab}</h2>
                <button type="button" onClick={() => setActiveModule('rutinas')} className="font-bold text-sm text-[#27665e] underline">Ver rutina</button>
              </div>
              {nextRoutineTasks.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {nextRoutineTasks.map((task, index) => (
                    <div key={task.id} className="rounded-xl border border-[#c6d5c9] bg-[#fcf7ed] p-3 min-h-24 flex flex-col justify-center gap-1">
                      <span className="text-xs font-bold text-[#27665e]">{index === 0 ? 'Primero' : 'Después'}</span>
                      <span className="text-xl" aria-hidden="true">{task.emoji}</span>
                      <span className="font-semibold text-sm leading-tight text-[#293b3a]">{task.name}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-[#435e55]">Ya marcaste las tareas de {activeRoutineTab.toLowerCase()}. Podés elegir otra actividad.</p>}
            </section>

            <div className={`np-modules grid gap-3 sm:gap-4 ${appDeviceMode === 'tablet' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
              
              {/* Emociones (Mood and Emotional Regulation) */}
              <button
                onClick={() => { playClickSound(); setActiveModule('emociones'); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-amber-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '6-8' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-amber-500/10 text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-amber-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-amber-500/20 shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                  <Smile className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-amber-400 tracking-wide">Emociones</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Reconoce cómo te sientes en el día</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-300"></div>
              </button>

              {/* Atencion (Attention, Focus, Prefrontal Training) */}
              <button
                onClick={() => { setAttentionGameState('idle'); setAttentionActivity(null); setActiveModule('atencion'); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-blue-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '9-10' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-blue-500/10 text-blue-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-blue-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-blue-400 tracking-wide">Atención</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Busca números y juega a observar</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
              </button>

              {/* Zona Calma (Guided Breathing & Self-Regulation) */}
              <button
                onClick={() => { playClickSound(); setActiveModule('zona_calma'); setBreathingPhase('idle'); setBreathingCycles(0); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-purple-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '3-5' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-purple-500/10 text-purple-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-purple-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-purple-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                  <Wind className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-purple-400 tracking-wide">Zona Calma</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Respira hondo y equilibra tu mente</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
              </button>

              {/* Sensorial (Sensory Regulation, Color, Sound Therapy) */}
              <button
                onClick={() => { playClickSound(); setActiveModule('sensorial'); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-pink-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '3-5' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-pink-500/10 text-pink-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-pink-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-pink-400 tracking-wide">Sensorial</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Explora colores y sonidos suaves</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-pink-500/5 rounded-full blur-xl group-hover:bg-pink-500/10 transition-all duration-300"></div>
              </button>

              {/* Comunicar (AAC Pictograms) */}
              <button
                onClick={() => { playClickSound(); setActiveModule('comunicar'); setConstructedPhrase([]); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-sky-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '3-5' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-sky-500/10 text-sky-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-sky-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-sky-400 tracking-wide">Comunicar</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Forma frases con pictogramas</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-all duration-300"></div>
              </button>

              {/* Social (Social Stories and Situations) */}
              <button
                onClick={() => { playClickSound(); setActiveModule('social'); setSelectedStoryId(null); setStoryStep('intro'); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-rose-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '9-10' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-rose-500/10 text-rose-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-rose-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-[#F43F5E]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                  <Handshake className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-rose-400 tracking-wide">Social</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Practica situaciones del día a día</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all duration-300"></div>
              </button>

              {/* Rutinas (Visual Scheduler) */}
              <button
                onClick={() => { playClickSound(); setActiveModule('rutinas'); }}
                className="bg-[#0B0F19]/80 border border-white/5 hover:border-emerald-500/30 text-left p-5 rounded-[24px] relative group overflow-hidden transition-all hover:scale-[1.03] shadow-lg flex flex-col justify-between min-h-[155px] cursor-pointer"
              >
                {selectedAge === '6-8' && (
                  <span className="absolute top-2 right-2 text-[8px] bg-emerald-500/10 text-emerald-400 font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    ⭐ Recomendado
                  </span>
                )}
                <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-400 tracking-wide">Rutinas</h3>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">Organiza tu día y gana estrellas</p>
                </div>
                {/* Radial corner ambient glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
              </button>

            </div>

            {/* ADULT / THERAPIST CONTROL SECTION */}
            <div className="pt-4">
              <button
                onClick={() => {
                  playClickSound();
                  setShowParentsMode(true);
                  if (!parentsAuthenticated) {
                    generateParentsMath();
                  }
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition-all active:scale-98"
              >
                <Lock className="w-4 h-4 text-blue-400" />
                <span>👨‍👩‍👧 Modo Padres / Terapeutas</span>
              </button>
            </div>

          </div>
        )}

        {/* 1. EMOCIONES MODULE */}
        {activeModule === 'emociones' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { playClickSound(); setActiveModule(null); }}
                className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-amber-500">¿Cómo te sientes en este momento?</h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Toca la carita que represente mejor tu emoción. Cosmo te dará un valioso consejo regulador.
            </p>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Feliz', emoji: '😊', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', tip: '¡Increíble! Guarda esta energía feliz. ¿Quieres dibujarla o saltar de alegría?' },
                { label: 'Triste', emoji: '😢', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', tip: 'Está bien sentirse triste a veces. ¿Quieres respirar despacio conmigo o hablar con alguien?' },
                { label: 'Enojado', emoji: '😠', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', tip: 'El enojo es una emoción fuerte. Vamos a soplar como un dragón de fuego muy suave.' },
                { label: 'Ansioso', emoji: '😮', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', tip: 'Si tu cuerpo se siente inquieto, intentemos buscar 3 cosas de color azul a tu alrededor.' }
              ].map((em) => (
                <button
                  key={em.label}
                  onClick={() => {
                    playSuccessSound();
                    setCurrentEmotion(em.label);
                    // Add to log
                    setEmotionJournal(prev => [
                      { date: new Date().toLocaleTimeString(), emotion: em.emoji + ' ' + em.label, note: em.tip },
                      ...prev
                    ]);
                    awardStars(2);
                  }}
                  className={`border-2 p-3.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                    currentEmotion === em.label ? 'border-amber-500 bg-amber-500/10 scale-105' : em.bg
                  }`}
                >
                  <span className="text-3xl">{em.emoji}</span>
                  <span className="text-[10px] font-black">{em.label}</span>
                </button>
              ))}
            </div>

            {/* Coping Advice Box */}
            {currentEmotion && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-fade-in">
                <div className="flex gap-3 items-start">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Consejo de Cosmo:</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {currentEmotion === 'Feliz' && '¡Increíble! Guarda esta energía feliz. ¿Quieres dar 3 aplausos gigantes?'}
                      {currentEmotion === 'Triste' && 'Está bien sentirse triste a veces. Hagamos una respiración pausada o demos un abrazo tierno.'}
                      {currentEmotion === 'Enojado' && 'El enojo es una emoción fuerte. Intenta apretar tus puños como piedras y luego soltarlos suavemente, sintiendo la calma.'}
                      {currentEmotion === 'Ansioso' && 'Si tu cuerpo se siente inquieto, respira como si soplaras burbujas gigantes. Todo va a estar bien.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Therapeutic Note */}
            <div className="bg-[#111827]/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Escribe o dibuja algo que te gustaría contarle a tu terapeuta:
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  placeholder="Ej: Hoy dormí genial..." 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    if (!journalNote.trim()) return;
                    playSuccessSound();
                    setEmotionJournal(prev => [
                      { date: new Date().toLocaleTimeString(), emotion: '✍️ Nota', note: journalNote },
                      ...prev
                    ]);
                    setJournalNote('');
                    awardStars(5, 'Diario Estelar');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 2. ATENCION MODULE (Foco) */}
        {activeModule === 'atencion' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { playClickSound(); setActiveModule(null); }}
                  className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-blue-400">Atención Cósmica</h2>
              </div>

              {attentionGameState === 'playing' && <span className="text-sm font-bold text-blue-400">{attentionActivity === 'matching' ? matchingRound + 1 : attentionScore} de {attentionActivity === 'matching' ? MATCH_ROUNDS.length : 5}</span>}
            </div>

            {attentionGameState === 'idle' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-4">
                <span className="text-4xl">🚀</span>
                <h3 className="font-extrabold text-base text-white">Elegí un juego</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Sin reloj. Podés probar otra vez cuantas veces quieras.
                </p>
                <div className="grid gap-2">
                  <button onClick={startAttentionGame} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl">🔢 Buscar números</button>
                  <button onClick={startMatchingGame} className="bg-[#e5eef1] text-[#355f80] border border-[#a9c4d0] font-extrabold text-sm py-3 px-4 rounded-xl">🧩 Parejas de imágenes</button>
                </div>
              </div>
            )}

            {attentionGameState === 'playing' && attentionActivity === 'numbers' && (
              <div className="space-y-4">
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                  <span className="text-sm text-blue-400 font-bold">Buscá el número</span>
                  <div className="text-4xl font-extrabold text-white mt-1">
                    {targetNumber}
                  </div>
                </div>

                {attentionHint && <p role="status" className="text-sm text-blue-400 font-semibold text-center">Probá con otro número. Podés tomarte tu tiempo.</p>}

                <div className="grid grid-cols-4 gap-2.5">
                  {attentionGrid.map((num, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(num)}
                      aria-label={`Número ${num}`}
                      className="aspect-square bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-lg font-extrabold text-white transition-all active:scale-90 flex items-center justify-center shadow-inner"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <div className="text-center text-xs text-slate-400 font-bold">
                  Aciertos: <span className="text-green-400 text-sm font-black">{attentionScore}</span>
                </div>
              </div>
            )}

            {attentionGameState === 'playing' && attentionActivity === 'matching' && (
              <div className="space-y-4">
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                  <p className="text-sm text-blue-400 font-bold">Buscá el dibujo igual</p>
                  <span className="block text-5xl mt-2" role="img" aria-label={MATCH_ROUNDS[matchingRound].word}>{MATCH_ROUNDS[matchingRound].answer}</span>
                </div>
                {matchingHint && <p role="status" className="text-sm text-blue-400 font-semibold text-center">Probá con otra imagen. No hay apuro.</p>}
                <div className="grid grid-cols-3 gap-2">
                  {MATCH_ROUNDS[matchingRound].choices.map(choice => (
                    <button key={choice} type="button" onClick={() => handleMatchingChoice(choice)} aria-label={`Elegir ${MATCH_LABELS[choice]}`} className="min-h-24 rounded-2xl border border-[#a9c4d0] bg-[#fcf7ed] text-4xl hover:border-[#355f80] focus-visible:outline-2 focus-visible:outline-[#355f80] flex items-center justify-center">
                      <span aria-hidden="true">{choice}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {attentionGameState === 'gameover' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-4">
                <span className="text-4xl">🏆</span>
                <h3 className="font-extrabold text-sm text-white">¡Misión Completada!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {attentionActivity === 'matching' ? 'Completaste las parejas de imágenes.' : 'Encontraste cinco números.'} Podés jugar de nuevo o elegir otra actividad.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={attentionActivity === 'matching' ? startMatchingGame : startAttentionGame}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl active:scale-95 transition-all"
                  >
                    Jugar de nuevo
                  </button>
                  <button onClick={() => { setAttentionGameState('idle'); setAttentionActivity(null); }} className="flex-1 bg-slate-800 text-slate-300 font-extrabold text-xs py-2.5 rounded-xl">Otro juego</button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 3. ZONA CALMA MODULE */}
        {activeModule === 'zona_calma' && (
          <div className="space-y-5 animate-fade-in text-center">
            <div className="flex items-center gap-2 text-left">
              <button 
                onClick={() => { playClickSound(); setActiveModule(null); }}
                className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-purple-400">Zona Calma</h2>
            </div>

            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed text-left">
              Si querés, acompañá el círculo con tu respiración. Podés seguir tu propio ritmo y parar cuando quieras.
            </p>

            {breathingPhase === 'idle' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="text-4xl animate-pulse">🌬️</span>
                <h3 className="font-extrabold text-base text-white">Una pausa tranquila</h3>
                <p className="text-sm text-slate-400">
                  Mirá cómo el círculo crece y se achica. No hace falta contener el aire.
                </p>
                <button
                  onClick={() => {
                    setBreathingPhase('inhala');
                    setBreathingSeconds(4);
                    setBreathingCycles(0);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-3 rounded-xl"
                >
                  Empezar la pausa
                </button>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* Expanding circle animation mapped to state */}
                <div className="flex justify-center items-center h-48">
                  <div className={`rounded-full flex flex-col justify-center items-center transition-all duration-1000 border-4 border-purple-500/50 shadow-2xl relative ${
                    breathingPhase === 'inhala' ? 'w-44 h-44 bg-purple-500/20 scale-110 shadow-purple-500/20' :
                    'w-28 h-28 bg-purple-800/10 scale-90 shadow-transparent'
                  }`}>
                    <span className="text-xl font-bold uppercase text-white tracking-widest animate-pulse">
                      {breathingPhase === 'inhala' && 'Inhala'}
                      {breathingPhase === 'exhala' && 'Exhala'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300 mt-1">
                      {breathingSeconds}s
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 inline-block text-sm font-bold text-purple-400">
                  Vueltas: {breathingCycles}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setBreathingPhase('idle');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs py-2.5 px-6 rounded-xl"
                  >
                    Detener la pausa
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 4. SENSORIAL MODULE */}
        {activeModule === 'sensorial' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { playClickSound(); setActiveModule(null); }}
                  className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-base font-extrabold text-pink-400">Regulación Sensorial</h2>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Tocá el espacio para crear colores. Podés activar o silenciar los sonidos cuando quieras.
            </p>

            {/* Tap canvas */}
            <div 
              role="button"
              tabIndex={0}
              aria-label="Crear un destello de color"
              onClick={handleSensoryTap}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSensoryTap(e);
                }
              }}
              className="np-sensory-canvas relative w-full h-80 bg-gradient-to-b from-[#090D1A] to-[#121A33] border-2 border-slate-800 rounded-2xl overflow-hidden cursor-crosshair flex items-center justify-center text-center p-4 shadow-inner"
            >
              {sensorialNotes.length === 0 && (
                <div className="space-y-2 pointer-events-none opacity-45">
                  <span className="text-3xl animate-bounce">✨</span>
                  <p className="text-xs font-bold text-slate-400 font-sans">¡Toca en cualquier parte para crear magia!</p>
                </div>
              )}

              {/* Render dynamic floating elements */}
              {sensorialNotes.map(n => (
                <div
                  key={n.id}
                  className="absolute rounded-full w-8 h-8 opacity-90 transition-all pointer-events-none flex items-center justify-center animate-ping"
                  style={{
                    left: n.x - 16,
                    top: n.y - 16,
                    backgroundColor: n.color,
                    boxShadow: `0 0 20px ${n.color}`
                  }}
                >
                  <span className="text-[10px]">✨</span>
                </div>
              ))}
            </div>

            {/* Sensory options */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Modo de Sonido:</span>
              <button
                onClick={() => {
                  playClickSound();
                  setSoundEnabled(!soundEnabled);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  soundEnabled ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-400 border border-transparent'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {soundEnabled ? 'Tono Activo' : 'Silencio'}
              </button>
            </div>
          </div>
        )}

        {/* 4.5. COMUNICAR MODULE (AAC Pictograms with Smart Search) */}
        {activeModule === 'comunicar' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { playClickSound(); setActiveModule(null); }}
                className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-[#FF7A59]">Tablero de Comunicación (SACS)</h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Toca los pictogramas para construir tu frase. Cosmo la leerá en voz alta para ayudarte a expresarte.
            </p>

            {/* Smart Unified Search bar inside children SACS module */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar pictograma... (ej: agua, abrazo, feliz)"
                value={pictogramSearchQuery}
                onChange={(e) => setPictogramSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-8 text-slate-200 text-xs focus:outline-none focus:border-sky-500/50"
              />
              {pictogramSearchQuery && (
                <button
                  onClick={() => setPictogramSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Active phrase bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 min-h-[70px] flex flex-wrap items-center gap-2 shadow-inner">
              {constructedPhrase.length === 0 ? (
                <span className="text-[11px] text-slate-500 font-bold italic ml-2">Tu frase aparecerá aquí...</span>
              ) : (
                constructedPhrase.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound();
                      setConstructedPhrase(p => p.filter((_, i) => i !== idx));
                    }}
                    className="flex items-center gap-1.5 bg-[#111827] border border-sky-500/30 text-white rounded-xl px-2.5 py-1.5 text-xs font-black shadow-md animate-scale-up hover:border-red-500 transition-all"
                  >
                    {customPictogramImages[item.id] ? (
                      <img src={customPictogramImages[item.id]} alt={item.word} className="w-5 h-5 rounded object-cover border border-slate-800" />
                    ) : (
                      <span className="text-lg">{item.emoji}</span>
                    )}
                    <span>{item.word}</span>
                    <span className="text-[9px] text-red-400 ml-1">×</span>
                  </button>
                ))
              )}
            </div>

            {/* Phrase control buttons */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (constructedPhrase.length === 0) return;
                  playSuccessSound();
                  
                  // Sequential audio playback: custom voice -> fallback to synthesis
                  for (let i = 0; i < constructedPhrase.length; i++) {
                    const item = constructedPhrase[i];
                    const customVoice = customPictogramVoices[item.id];
                    
                    if (customVoice) {
                      await new Promise<void>((resolve) => {
                        try {
                          const audio = new Audio(customVoice);
                          audio.onended = () => resolve();
                          audio.onerror = () => resolve();
                          audio.play().catch(() => resolve());
                        } catch (e) {
                          resolve();
                        }
                      });
                    } else {
                      await new Promise<void>((resolve) => {
                        try {
                          const utterance = new SpeechSynthesisUtterance(item.word);
                          utterance.lang = 'es-ES';
                          utterance.rate = 0.85;
                          utterance.onend = () => resolve();
                          utterance.onerror = () => resolve();
                          window.speechSynthesis.speak(utterance);
                        } catch (e) {
                          resolve();
                        }
                      });
                    }
                    // delay between words
                    await new Promise(r => setTimeout(r, 200));
                  }

                  if (constructedPhrase.length >= 2) {
                    awardStars(5, 'Comunicación Estelar');
                  }
                }}
                disabled={constructedPhrase.length === 0}
                className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-40 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>🔊 Escuchar Frase</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setConstructedPhrase([]);
                }}
                disabled={constructedPhrase.length === 0}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-400 hover:text-white px-4 rounded-xl text-xs font-bold transition-all"
              >
                Borrar
              </button>
            </div>

            {/* Category tabs */}
            {!pictogramSearchQuery && (
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 text-xs overflow-x-auto gap-1">
                {[
                  { id: 'necesidades', label: '🌱 Necesidades', color: 'text-emerald-400' },
                  { id: 'emociones', label: '😊 Siento', color: 'text-amber-400' },
                  { id: 'acciones', label: '🧸 Acciones', color: 'text-pink-400' },
                  { id: 'objetos', label: '📱 Objetos', color: 'text-teal-400' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      playClickSound();
                      setActivePictogramCategory(cat.id as any);
                    }}
                    className={`px-3 py-2 rounded-lg font-black transition-all shrink-0 ${
                      activePictogramCategory === cat.id
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Pictograms grid */}
            <div className="grid grid-cols-3 gap-2 pb-4">
              {(() => {
                const filteredPics = ALL_DEFAULT_PICTOGRAMS.filter(pic => {
                  if (pictogramSearchQuery) {
                    return pic.word.toLowerCase().includes(pictogramSearchQuery.toLowerCase());
                  }
                  return pic.category === activePictogramCategory;
                });

                if (filteredPics.length === 0) {
                  return (
                    <div className="col-span-3 text-center py-8 text-xs text-slate-500 font-bold">
                      Ningún pictograma coincide con tu búsqueda.
                    </div>
                  );
                }

                return filteredPics.map((pic) => {
                  const customImg = customPictogramImages[pic.id];
                  const customVoice = customPictogramVoices[pic.id];
                  return (
                    <button
                      key={pic.id}
                      onClick={() => {
                        if (customVoice) {
                          playCustomVoice(customVoice);
                        } else {
                          playTherapeuticTone(330, 'sine', 0.15);
                          // Speak individual pictogram
                          try {
                            const individualUtterance = new SpeechSynthesisUtterance(pic.word);
                            individualUtterance.lang = 'es-ES';
                            window.speechSynthesis.speak(individualUtterance);
                          } catch (e) {}
                        }

                        setConstructedPhrase(p => {
                          if (p.some(item => item.id === pic.id)) return p;
                          return [...p, { id: pic.id, word: pic.word, emoji: pic.emoji }];
                        });
                      }}
                      className={`border-2 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 text-center min-h-[105px] ${pic.color}`}
                    >
                      {customImg ? (
                        <img src={customImg} alt={pic.word} className="w-12 h-12 rounded-xl object-cover border border-slate-700/50 shadow-sm" />
                      ) : (
                        <span className="text-3xl filter drop-shadow-sm">{pic.emoji}</span>
                      )}
                      <span className="text-[10px] font-extrabold text-slate-200 leading-tight flex items-center justify-center gap-1">
                        {pic.word}
                        {customVoice && <span className="text-[10px] text-pink-400">🎤</span>}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* 4.6. SOCIAL MODULE (Social Stories and Situations) */}
        {activeModule === 'social' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { playClickSound(); setActiveModule(null); }}
                className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-pink-400">Historias Sociales y Situaciones</h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Practica cómo actuar en situaciones reales. Cosmo te dará sabios consejos para mejorar tus habilidades de empatía y calma.
            </p>

            {selectedStoryId === null ? (
              <div className="space-y-3">
                {[
                  { id: 'compartir', title: '🤝 Compartir un Juguete', desc: 'Aprende a negociar de forma asertiva con amigos.', badge: 'Socialización' },
                  { id: 'ruido', title: '🎧 Ruido Fuerte en Clase', desc: 'Gestiona la sobrecarga sensorial auditiva.', badge: 'Calma' },
                  { id: 'esperar', title: '⏱️ Esperar mi Turno', desc: 'Desarrolla la paciencia de forma lúdica.', badge: 'Autocontrol' }
                ].map(story => (
                  <button
                    key={story.id}
                    onClick={() => {
                      playClickSound();
                      setSelectedStoryId(story.id);
                      setStoryStep('intro');
                      setStoryFeedback(null);
                    }}
                    className="w-full bg-[#111827] border border-slate-800 hover:border-pink-500/30 p-4 rounded-2xl text-left flex justify-between items-center group transition-all hover:translate-x-1"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">{story.badge}</span>
                      <h3 className="font-extrabold text-sm text-white pt-1 group-hover:text-pink-400 transition-colors">{story.title}</h3>
                      <p className="text-[11px] text-slate-400">{story.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-pink-400 transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 animate-scale-up">
                {/* Story details */}
                {(() => {
                  const storiesData: Record<string, {
                    title: string;
                    setup: string;
                    choices: { text: string, feedback: string, correct: boolean }[];
                  }> = {
                    compartir: {
                      title: 'Compartir un Juguete',
                      setup: 'Estás en el parque divirtiéndote mucho con un cohete estelar brillante. Otro niño se acerca y te dice amablemente si pueden jugar juntos.',
                      choices: [
                        {
                          text: 'Dices "¡No, es mío!" y te alejas enojado.',
                          feedback: 'Cosmo dice: El juguete es tuyo y tienes derecho a usarlo, pero si lo alejas de mala manera, el otro niño se sentirá triste. Compartir o proponer un turno ("un minuto tú, un minuto yo") es genial para hacer nuevos amigos y divertirse al doble.',
                          correct: false
                        },
                        {
                          text: 'Sonríes y dices: "Podemos turnarnos. ¿Qué tal si tú lo lanzas al espacio y yo lo atrapo?"',
                          feedback: '¡Excelente decisión estelar! Proponer un juego cooperativo evita peleas, hace sentir bien a tu amigo y te convierte en un magnífico comandante del respeto.',
                          correct: true
                        }
                      ]
                    },
                    ruido: {
                      title: 'Ruido Fuerte en Clase',
                      setup: 'De repente, suena una alarma escolar o hay ruidos de obras de construcción muy ruidosos en la ventana. Te sientes muy abrumado y tus oídos duelen.',
                      choices: [
                        {
                          text: 'Gritas muy fuerte para tapar el sonido y sales corriendo de la clase sin avisar.',
                          feedback: 'Cosmo dice: Salir corriendo de repente puede ser muy peligroso. En lugar de huir, intenta cruzar tus brazos o apretar una pelota antiestrés, y avísale suavemente a tu terapeuta o maestro para que te ayude.',
                          correct: false
                        },
                        {
                          text: 'Te pones tus audífonos de reducción de ruido o le haces la señal visual a tu maestra para pedir ir a la "Zona Calma".',
                          feedback: '¡Impresionante superpoder de autoregulación! Usar herramientas táctiles o pedir ayuda visualmente es una forma fantástica de cuidar tu mente y tus sentidos sin asustarte.',
                          correct: true
                        }
                      ]
                    },
                    esperar: {
                      title: 'Esperar mi Turno',
                      setup: 'Quieres tirarte por la resbaladilla más alta, pero hay tres niños esperando delante de ti. Te dan muchas ganas de empujarlos para ir más rápido.',
                      choices: [
                        {
                          text: 'Te metes a la fuerza y empujas a los de adelante para pasar primero.',
                          feedback: 'Cosmo dice: Empujar puede lastimar a tus compañeros y causar accidentes en los juegos. Todos los niños merecen divertirse seguros. ¡Entrenemos esa paciencia de astronauta!',
                          correct: false
                        },
                        {
                          text: 'Respiras hondo contando estrellas del 1 al 5 en tu mente y esperas feliz a que llegue tu turno.',
                          feedback: '¡Sublime paciencia cósmica! Contar estrellas o dar pasitos suaves en tu lugar hace que esperar sea un juego divertido de autocontrol mental.',
                          correct: true
                        }
                      ]
                    }
                  };

                  const currentStory = storiesData[selectedStoryId];

                  return (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wide">Escenario:</span>
                        <h3 className="font-extrabold text-sm text-white">{currentStory.title}</h3>
                      </div>

                      {storyStep === 'intro' ? (
                        <>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                            {currentStory.setup}
                          </p>

                          <div className="space-y-2.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">¿Qué decides hacer?</span>
                            {currentStory.choices.map((choice, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  if (choice.correct) {
                                    playSuccessSound();
                                    awardStars(10, 'Empatía Cósmica');
                                    setStoryFeedback({ isCorrect: true, text: choice.feedback });
                                  } else {
                                    playTherapeuticTone(240, 'sine', 0.4);
                                    setStoryFeedback({ isCorrect: false, text: choice.feedback });
                                  }
                                  setStoryStep('feedback');
                                }}
                                className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-xs text-slate-200 font-extrabold active:scale-98 transition-all hover:border-pink-500/20"
                              >
                                {choice.text}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4 animate-scale-up">
                          <div className={`p-4 rounded-2xl border ${
                            storyFeedback?.isCorrect 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            <div className="flex gap-2 items-start text-xs">
                              <span className="text-lg">{storyFeedback?.isCorrect ? '✅' : '💡'}</span>
                              <div className="space-y-1">
                                <h4 className="font-black">{storyFeedback?.isCorrect ? '¡Decisión Fabulosa!' : 'Aprende con Cosmo'}</h4>
                                <p className="text-slate-300 leading-relaxed">{storyFeedback?.text}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!storyFeedback?.isCorrect && (
                              <button
                                onClick={() => {
                                  playClickSound();
                                  setStoryStep('intro');
                                }}
                                className="flex-1 bg-amber-500 text-slate-950 font-black text-xs py-2.5 rounded-xl hover:bg-amber-400 transition-all active:scale-95"
                              >
                                Intentar de Nuevo
                              </button>
                            )}
                            <button
                              onClick={() => {
                                playClickSound();
                                setSelectedStoryId(null);
                              }}
                              className="flex-1 bg-slate-800 text-slate-300 font-black text-xs py-2.5 rounded-xl hover:bg-slate-750 transition-all"
                            >
                              Ver otras historias
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 4.7. RUTINAS MODULE (Visual Schedule Checklist) */}
        {activeModule === 'rutinas' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { playClickSound(); setActiveModule(null); }}
                className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-emerald-400">Mis Rutinas Diarias</h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Completa las rutinas de tu día para ganar estrellas brillantes. ¡La constancia es la clave!
            </p>

            {/* Routine tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 text-xs gap-1">
              {(['Mañana', 'Tarde', 'Noche'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    playClickSound();
                    setActiveRoutineTab(tab);
                  }}
                  className={`flex-1 py-2 rounded-lg font-black transition-all ${
                    activeRoutineTab === tab
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'Mañana' && '☀️ Mañana'}
                  {tab === 'Tarde' && '🌤️ Tarde'}
                  {tab === 'Noche' && '🌙 Noche'}
                </button>
              ))}
            </div>

            {/* Routine Progress and tasks */}
            {(() => {
              const currentTasks = routineTasks[activeRoutineTab];
              const completedInTab = currentTasks.filter(t => completedRoutineTasks.includes(t.id)).length;
              const percent = currentTasks.length ? Math.round((completedInTab / currentTasks.length) * 100) : 0;

              if (activeTimerTask) {
                const radius = 60;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = timerDuration > 0 
                  ? circumference - (timerSecondsLeft / timerDuration) * circumference 
                  : circumference;

                return (
                  <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl animate-scale-up relative overflow-hidden">
                    <div className="space-y-1.5">
                      <span className="text-4xl animate-bounce inline-block">{activeTimerTask.emoji}</span>
                      <h3 className="font-extrabold text-sm text-white">Temporizador Estelar</h3>
                      <p className="text-xs text-[#FF7A59] font-black">{activeTimerTask.name}</p>
                      <p className="text-[11px] text-slate-400">
                        ¡Realiza la actividad con calma antes de que se acabe el tiempo!
                      </p>
                    </div>

                    {/* VISUAL DIMINISHING COLOR CIRCLE */}
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          className="stroke-slate-900"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r={radius}
                          className={`transition-all duration-1000 stroke-linecap-round ${
                            (timerSecondsLeft / timerDuration) > 0.5 
                              ? 'stroke-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                              : (timerSecondsLeft / timerDuration) > 0.25
                                ? 'stroke-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                : 'stroke-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                          }`}
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        />
                      </svg>
                      {/* Digital Clock in the center */}
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-white font-mono tracking-tight">
                          {Math.floor(timerSecondsLeft / 60)}:{(timerSecondsLeft % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black mt-1">
                          {timerIsActive ? 'EN PROGRESO' : 'PAUSADO'}
                        </span>
                      </div>
                    </div>

                    {/* HOURGLASS GRAPHICAL BAR */}
                    <div className="flex justify-center items-center gap-2 text-xs text-slate-400">
                      <span>⏳</span>
                      <div className="w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900/60">
                        <div 
                          className="bg-emerald-400 h-full transition-all duration-1000"
                          style={{ width: `${(timerSecondsLeft / timerDuration) * 100}%` }}
                        ></div>
                      </div>
                      <span>⌛</span>
                    </div>

                    {/* TIMER CONTROLS */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        {/* Pause / Play */}
                        <button
                          onClick={() => {
                            playClickSound();
                            setTimerIsActive(!timerIsActive);
                          }}
                          className={`flex-1 font-extrabold text-xs py-2.5 rounded-xl border transition-all ${
                            timerIsActive
                              ? 'bg-amber-600/20 text-amber-400 border-amber-500/20 hover:bg-amber-600/30'
                              : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/30'
                          }`}
                        >
                          {timerIsActive ? '⏸️ Pausar' : '▶️ Reanudar'}
                        </button>

                        {/* Quick Adjustments */}
                        <button
                          onClick={() => {
                            playClickSound();
                            setTimerSecondsLeft(prev => Math.min(timerDuration, prev + 30));
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-xs px-2.5 rounded-xl hover:bg-slate-850"
                          title="Agregar 30 segundos"
                        >
                          +30s
                        </button>

                        <button
                          onClick={() => {
                            playClickSound();
                            setTimerSecondsLeft(prev => Math.max(10, prev - 30));
                          }}
                          className="bg-slate-900 border border-slate-800 text-slate-300 font-extrabold text-xs px-2.5 rounded-xl hover:bg-slate-850"
                          title="Quitar 30 segundos"
                        >
                          -30s
                        </button>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {/* Skip and mark as complete */}
                        <button
                          onClick={() => {
                            setTimerIsActive(false);
                            if (timerOwnerIdRef.current === activePatientId && !completedRoutineTasks.includes(activeTimerTask.id)) {
                              const rewardKey = `${activePatientId}:${activeTimerTask.id}`;
                              if (rewardedTimerRef.current !== rewardKey) {
                                rewardedTimerRef.current = rewardKey;
                                setCompletedRoutineTasks(current => current.includes(activeTimerTask.id) ? current : [...current, activeTimerTask.id]);
                                awardStars(12, 'Guardián de Rutinas');
                              }
                            }
                            setActiveTimerTask(null);
                          }}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md"
                        >
                          ¡Completar Actividad! 🚀
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={() => {
                            playClickSound();
                            setTimerIsActive(false);
                            setActiveTimerTask(null);
                          }}
                          className="px-4 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Progress tracker */}
                  <div className="bg-[#111827]/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">Progreso de la {activeRoutineTab}:</span>
                      <span className="font-black text-emerald-400">{completedInTab} / {currentTasks.length} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tasks list */}
                  <div className="space-y-2">
                    {currentTasks.length === 0 && <p className="rounded-2xl border border-slate-800 p-5 text-sm text-slate-400">Todavía no hay tareas. Una persona adulta puede agregarlas desde el panel de configuración.</p>}
                    {currentTasks.map(task => {
                      const isDone = completedRoutineTasks.includes(task.id);
                      
                      // Custom default duration mapped to each specific activity
                      let duration = 60; // default 1 min
                      if (task.id === 'lavarse' || task.id === 'dientes_noche') duration = 120; // 2 min
                      if (task.id === 'tareas') duration = 900; // 15 min
                      if (task.id === 'bano') duration = 600; // 10 min
                      if (task.id === 'ordenar') duration = 300; // 5 min
                      if (task.id === 'juego') duration = 600; // 10 min

                      return (
                        <div
                          key={task.id}
                          className={`w-full p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all duration-200 ${
                            isDone
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-inner'
                              : 'bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {/* Left: Complete toggle Area */}
                          <button
                            onClick={() => {
                              if (isDone) {
                                playClickSound();
                                setCompletedRoutineTasks(prev => prev.filter(id => id !== task.id));
                              } else {
                                playSuccessSound();
                                setCompletedRoutineTasks(prev => [...prev, task.id]);
                                
                                // Check routine milestone
                                const updatedDone = [...completedRoutineTasks, task.id];
                                const allDone = currentTasks.every(t => updatedDone.includes(t.id));
                                if (allDone) {
                                  awardStars(15, 'Guardián de Rutinas');
                                } else {
                                  setStars(s => s + 3);
                                }
                              }
                            }}
                            className="flex-1 flex items-center gap-3 text-left py-2 px-1.5 focus:outline-none"
                            aria-pressed={isDone}
                          >
                            <span className="text-2xl filter drop-shadow-sm">{task.emoji}</span>
                            <span className={`text-xs font-black ${isDone ? 'line-through text-slate-400' : ''}`}>
                              {task.name}
                            </span>
                          </button>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2">
                            {/* Visual timer clock button (Only shown if not completed yet) */}
                            {!isDone && (
                              <button
                                onClick={() => {
                                  playClickSound();
                                  timerOwnerIdRef.current = activePatientId;
                                  setActiveTimerTask(task);
                                  setTimerDuration(duration);
                                  setTimerSecondsLeft(duration);
                                  setTimerIsActive(true);
                                }}
                                className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 scale-95 hover:scale-100"
                                aria-label={`Iniciar temporizador para ${task.name}`}
                                title="Iniciar temporizador visual"
                              >
                                ⏱️ <span className="text-[9px] font-extrabold uppercase hidden sm:inline">Reloj</span>
                              </button>
                            )}

                            {/* Standard Check box */}
                            <button
                              onClick={() => {
                                if (isDone) {
                                  playClickSound();
                                  setCompletedRoutineTasks(prev => prev.filter(id => id !== task.id));
                                } else {
                                  playSuccessSound();
                                  setCompletedRoutineTasks(prev => [...prev, task.id]);
                                  
                                  const updatedDone = [...completedRoutineTasks, task.id];
                                  const allDone = currentTasks.every(t => updatedDone.includes(t.id));
                                  if (allDone) {
                                    awardStars(15, 'Guardián de Rutinas');
                                  } else {
                                    setStars(s => s + 3);
                                  }
                                }
                              }}
                              aria-label={`${isDone ? 'Marcar pendiente' : 'Marcar completada'}: ${task.name}`}
                              aria-pressed={isDone}
                              className={`w-11 h-11 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${
                                isDone 
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                                  : 'border-slate-700 bg-slate-950 hover:border-slate-600'
                              }`}
                            >
                              {isDone && <span className="text-[10px] font-black">✓</span>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick reset option */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        playClickSound();
                        setCompletedRoutineTasks(prev => prev.filter(id => !currentTasks.some(ct => ct.id === id)));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-850"
                    >
                      Reiniciar Rutina de la {activeRoutineTab}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* A quiet, optional pause with one instruction at a time. */}
        {activeModule === 'sos' && (
          <div className="space-y-4 animate-fade-in py-2">
            <section aria-labelledby="calm-title" className="bg-[#e6eee9] border border-[#b2c8bc] rounded-3xl p-5 sm:p-6 text-center space-y-5 shadow-sm">
              <div className="w-16 h-16 bg-[#d2e5dc] rounded-2xl flex items-center justify-center mx-auto text-[#27665e]">
                <Heart className="w-8 h-8" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 id="calm-title" className="text-xl font-extrabold text-[#293b3a]">Un momento de calma</h2>
                <p className="text-sm text-[#435e55] leading-relaxed">Vamos de a un paso. Podés parar cuando quieras.</p>
              </div>
              <div aria-live="polite" className="bg-[#fcf7ed] border border-[#b2c8bc] rounded-2xl px-5 py-6 min-h-40 flex flex-col items-center justify-center gap-3">
                <span className="text-xs text-[#27665e] font-bold uppercase tracking-wide">Paso {calmStep + 1} de 3</span>
                <p className="text-lg font-bold text-[#293b3a] leading-snug">
                  {['Mirá a tu alrededor y elegí algo que te guste.', 'Sentí tus pies apoyados en el suelo.', 'Si querés, escuchá un sonido cercano.'][calmStep]}
                </p>
              </div>
              <div className="flex gap-3" aria-label="Progreso de la pausa">
                {[0, 1, 2].map(step => <span key={step} className={`h-2 flex-1 rounded-full ${step <= calmStep ? 'bg-[#27665e]' : 'bg-[#c7d7ca]'}`} />)}
              </div>
              <button
                type="button"
                onClick={() => setCalmStep(step => step === 2 ? 0 : step + 1)}
                className="w-full bg-[#27665e] text-white font-bold text-base py-3 rounded-xl"
              >
                {calmStep === 2 ? 'Empezar de nuevo' : 'Siguiente paso'}
              </button>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => { setBreathingPhase('idle'); setBreathingCycles(0); setActiveModule('zona_calma'); }} className="text-[#27665e] font-bold text-sm py-2">
                  Ir a respiración tranquila
                </button>
                <button type="button" onClick={() => setActiveModule(null)} className="text-[#435e55] font-bold text-sm py-2">
                  Volver al inicio
                </button>
              </div>
            </section>
          </div>
        )}

        {/* LOGROS / UNLOCKED ACHIEVEMENTS TAB */}
        {currentTab === 'logros' && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="text-base font-extrabold text-yellow-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Trophy className="w-5 h-5" /> Mis Logros Estelares
            </h2>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold">ESTRELLAS REUNIDAS</span>
                <div className="text-xl font-extrabold text-white">{stars} Estrellas</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase pl-1">Insignias por entrenar:</h3>
              
              {[
                { name: 'Diario Estelar', desc: 'Guardaste una nota de tu estado emocional.', icon: '✍️', reward: 5 },
                { name: 'Respiración Estelar', desc: 'Completaste ciclos de respiración guiada.', icon: '🌬️', reward: 5 },
                { name: 'Explorador Sensorial', desc: 'Interactuaste con el lienzo de tonos relajantes.', icon: '✨', reward: 5 },
                { name: 'Foco Láser', desc: 'Superaste un nivel alto de atención concentrada.', icon: '🎯', reward: 10 },
                { name: 'Comunicación Estelar', desc: 'Creaste y hablaste una frase completa usando el tablero de pictogramas.', icon: '💬', reward: 5 },
                { name: 'Empatía Cósmica', desc: 'Completaste con éxito una historia de interacciones sociales.', icon: '🤝', reward: 10 },
                { name: 'Guardián de Rutinas', desc: 'Completaste exitosamente una rutina diaria (mañana, tarde o noche).', icon: '📅', reward: 15 }
              ].map((ach) => {
                const isUnlocked = unlockedAchievements.includes(ach.name);
                return (
                  <div 
                    key={ach.name}
                    className={`border rounded-2xl p-3.5 flex items-center gap-4 transition-all ${
                      isUnlocked 
                        ? 'bg-[#111827] border-yellow-500/20' 
                        : 'bg-slate-900/40 border-slate-800/50 opacity-55'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                      isUnlocked ? 'bg-yellow-500/10' : 'bg-slate-950'
                    }`}>
                      {isUnlocked ? ach.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                          {ach.name}
                        </h4>
                        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-yellow-300 font-bold border border-slate-800">
                          +{ach.reward} Estrellas
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { playClickSound(); setCurrentTab('inicio'); }}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold py-3 rounded-2xl"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {/* 👨‍👩‍👧 PARENTS AND THERAPEUTIC GATEWAY DASHBOARD (NEUROPLANETA ENTERPRISE) */}
        {showParentsMode && (
          <div id="adult-panel-overlay" className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div id="adult-panel-dialog" className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🩺</span>
                  <div>
                    <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-widest leading-none">Panel de adultos</h2>
                    <p className="text-[10px] text-slate-400 mt-1">Configuración y resumen de actividades</p>
                  </div>
                </div>
                <button 
                  onClick={() => { playClickSound(); setShowParentsMode(false); }}
                  className="text-slate-400 hover:text-white font-bold p-1 hover:bg-slate-800 rounded"
                >
                  ✖️
                </button>
              </div>

              {!parentsAuthenticated ? (
                <div className="space-y-4 py-8 max-w-sm mx-auto w-full">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-900 text-center">
                    <span className="text-2xl">🔒</span>
                    <h3 className="font-bold text-xs text-white mt-2">Control de Acceso Adulto</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Resuelve esta operación para abrir la configuración en este dispositivo. Esta operación no protege datos confidenciales.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyParents} className="space-y-4">
                    <div className="text-center py-2 text-2xl font-black text-white bg-slate-950/50 rounded-xl border border-slate-900">
                      ¿Cuánto es {parentsMathQuestion.q}?
                    </div>
                    <input
                      type="number"
                      value={parentsAnswer}
                      onChange={(e) => setParentsAnswer(e.target.value)}
                      placeholder="Escribe la respuesta..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-center text-white text-sm focus:outline-none focus:border-blue-500 font-bold"
                      autoFocus
                    />
                    {parentsFeedback && (
                      <p className="text-[11px] text-rose-400 text-center font-bold">{parentsFeedback}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-[#186EF3] hover:bg-blue-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer"
                    >
                      Abrir configuración
                    </button>

                  </form>
                </div>
              ) : (
                /* Authenticated Enterprise Dashboard Tabs and views */
                <div className="flex-1 flex flex-col overflow-hidden mt-4">
                  {/* Selected Patient Status Banner */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-900 flex items-center justify-between gap-3 shrink-0 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl bg-slate-900 p-1.5 rounded-xl border border-slate-800">{activePatient.avatar}</span>
                      <div className="text-left">
                        <span className="text-[9px] text-blue-400 uppercase font-black tracking-widest">Perfil activo</span>
                        <h4 className="text-xs font-black text-white leading-none mt-0.5">{activePatient.name}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Mejor partida de números: {attentionHighScore} aciertos • Estrellas: {stars} ⭐</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                        Perfil abierto
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-300 bg-blue-950/30 border border-blue-500/20 rounded-xl p-2.5 mb-3">
                    Los perfiles y registros quedan en este navegador. No hay respaldo entre dispositivos; si se borran los datos del navegador, se perderán. Usa apodos y evita ingresar información clínica sensible.
                  </p>

                  {/* High fidelity enterprise navigation tabs */}
                  <div className="flex border-b border-slate-800/80 gap-1 pb-2 shrink-0 overflow-x-auto">
                    {[
                      { id: 'pacientes', label: '👥 Perfiles', desc: 'Familia / Escuela' },
                      { id: 'rutinas', label: '📅 Rutinas', desc: 'Editar tareas' },
                      { id: 'pictogramas', label: '🎨 Pictogramas', desc: 'Biblioteca' },
                      { id: 'sonido', label: '🔊 Audio Sensorial', desc: 'Hipersensibilidad' },
                      { id: 'reportes', label: '📋 Resumen', desc: 'Uso local' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { playClickSound(); setParentsActiveTab(tab.id as any); }}
                        className={`flex-1 min-w-[90px] py-2 px-2 rounded-xl text-left transition-all relative ${
                          parentsActiveTab === tab.id
                            ? 'bg-slate-900/80 border border-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{tab.label}</div>
                        <div className="text-[8px] text-slate-500 mt-0.5 leading-none">{tab.desc}</div>
                        {parentsActiveTab === tab.id && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full"></span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable Dashboard Viewport */}
                  <div id="adult-panel-scroll" className="flex-1 overflow-y-auto py-3 pr-1 min-h-0 text-left text-xs">

                    {parentsActiveTab === 'rutinas' && (
                      <section className="space-y-4" aria-label="Editar rutinas del perfil activo">
                        <div>
                          <h3 className="font-extrabold text-sm text-white">Rutinas de {activePatient.name}</h3>
                          <p className="text-slate-400 mt-1">Las tareas se guardan solo en este perfil y en este navegador. Puedes agregar hasta 12 por momento del día.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Momento del día">
                          {routineTabs.map(tab => (
                            <button key={tab} type="button" onClick={() => setActiveRoutineTab(tab)}
                              aria-pressed={activeRoutineTab === tab}
                              className={`rounded-xl border p-2 font-bold ${activeRoutineTab === tab ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                              {tab}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {routineTasks[activeRoutineTab].map((task, index) => (
                            <div key={task.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2 flex flex-wrap items-center gap-2">
                              <span aria-hidden="true" className="text-xl">{task.emoji}</span>
                              <label className="sr-only" htmlFor={`routine-${task.id}`}>Nombre de la tarea {index + 1}</label>
                              <input id={`routine-${task.id}`} type="text" maxLength={60} value={task.name}
                                onChange={event => {
                                  const name = event.target.value;
                                  setRoutineTasks(prev => ({ ...prev, [activeRoutineTab]: prev[activeRoutineTab].map(item => item.id === task.id ? { ...item, name } : item) }));
                                }}
                                onBlur={() => {
                                  if (!task.name.trim()) setRoutineTasks(prev => ({ ...prev, [activeRoutineTab]: prev[activeRoutineTab].map(item => item.id === task.id ? { ...item, name: 'Actividad' } : item) }));
                                }}
                                className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white" />
                              <button type="button" disabled={index === 0} aria-label={`Subir ${task.name}`} title="Subir tarea"
                                onClick={() => setRoutineTasks(prev => {
                                  const next = [...prev[activeRoutineTab]];
                                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                  return { ...prev, [activeRoutineTab]: next };
                                })} className="rounded-lg bg-slate-800 px-2 py-2 disabled:opacity-40">↑</button>
                              <button type="button" disabled={index === routineTasks[activeRoutineTab].length - 1} aria-label={`Bajar ${task.name}`} title="Bajar tarea"
                                onClick={() => setRoutineTasks(prev => {
                                  const next = [...prev[activeRoutineTab]];
                                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                  return { ...prev, [activeRoutineTab]: next };
                                })} className="rounded-lg bg-slate-800 px-2 py-2 disabled:opacity-40">↓</button>
                              <button type="button" aria-label={`Eliminar ${task.name}`} title="Eliminar tarea"
                                onClick={() => {
                                  setRoutineTasks(prev => ({ ...prev, [activeRoutineTab]: prev[activeRoutineTab].filter(item => item.id !== task.id) }));
                                  setCompletedRoutineTasks(prev => prev.filter(id => id !== task.id));
                                  if (activeTimerTask?.id === task.id) { setActiveTimerTask(null); setTimerIsActive(false); }
                                }} className="rounded-lg bg-rose-950/40 px-2 py-2 text-rose-300">Eliminar</button>
                            </div>
                          ))}
                          {routineTasks[activeRoutineTab].length === 0 && <p className="text-slate-400 rounded-xl border border-slate-800 p-3">Agrega una tarea para comenzar.</p>}
                        </div>
                        <form className="flex flex-wrap gap-2 rounded-2xl bg-slate-950 border border-slate-800 p-3"
                          onSubmit={event => {
                            event.preventDefault();
                            const name = newRoutineName.trim();
                            if (!name || routineTasks[activeRoutineTab].length >= 12) return;
                            setRoutineTasks(prev => ({ ...prev, [activeRoutineTab]: [...prev[activeRoutineTab], { id: `custom_${crypto.randomUUID()}`, name, emoji: newRoutineEmoji }] }));
                            setNewRoutineName('');
                          }}>
                          <label className="sr-only" htmlFor="new-routine-emoji">Imagen de la tarea</label>
                          <select id="new-routine-emoji" value={newRoutineEmoji} onChange={event => setNewRoutineEmoji(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-900 p-2" aria-label="Imagen de la tarea">
                            {['⭐', '🪥', '👕', '🍎', '📚', '🧸', '🛁', '🌙', '☀️', '🎨'].map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                          </select>
                          <label className="sr-only" htmlFor="new-routine-name">Nueva tarea</label>
                          <input id="new-routine-name" type="text" value={newRoutineName} maxLength={60} placeholder="Nueva tarea..." onChange={event => setNewRoutineName(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-900 p-2" />
                          <button type="submit" disabled={!newRoutineName.trim() || routineTasks[activeRoutineTab].length >= 12} className="rounded-xl bg-blue-600 px-4 py-2 text-white font-bold disabled:opacity-40">Agregar</button>
                        </form>
                      </section>
                    )}
                    
                    {/* TAB 1: PATIENTS / MULTI-USER MANAGEMENT */}
                    {parentsActiveTab === 'pacientes' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Patients switcher */}
                          <div className="space-y-2">
                            <h3 className="font-extrabold text-white text-xs flex items-center gap-1">👥 Perfiles del dispositivo</h3>
                            <p className="text-[10px] text-slate-400 mb-2">Selecciona el perfil para cargar automáticamente su historial, configuraciones, imágenes y voces.</p>
                            
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                              {patients.map(p => (
                                <button
                                  type="button"
                                  key={p.id}
                                  onClick={() => { playClickSound(); setActivePatientId(p.id); }}
                                  aria-pressed={activePatientId === p.id}
                                  aria-label={`Activar perfil de ${p.name}`}
                                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                    activePatientId === p.id
                                      ? 'bg-blue-950/20 border-blue-500/50 shadow-md'
                                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg bg-slate-900 p-1 rounded-lg">{p.avatar}</span>
                                    <div>
                                      <h4 className="font-extrabold text-slate-200 text-xs leading-none">{p.name}</h4>
                                      <p className="text-[9px] text-slate-500 mt-0.5">{p.selectedAge} años • {p.stars} ⭐ • {p.unlockedAchievements?.length || 0} logros</p>
                                    </div>
                                  </div>
                                  {activePatientId === p.id ? (
                                    <span className="bg-blue-500/20 text-blue-400 font-extrabold text-[8px] px-2 py-0.5 rounded-full border border-blue-500/30">Activo</span>
                                  ) : (
                                    <span className="text-[9px] text-slate-500 font-bold">Tocar para activar</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Add New Profile form */}
                          <div className="bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl space-y-2">
                            <h3 className="font-extrabold text-white text-xs">➕ Registrar Nuevo Paciente</h3>
                            
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Nombre Completo</label>
                              <input
                                type="text"
                                placeholder="ej: Lucas Martínez"
                                value={newPatientName}
                                onChange={(e) => setNewPatientName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-700"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">Edad</label>
                                <select
                                  value={newPatientAge}
                                  onChange={(e) => setNewPatientAge(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none"
                                >
                                  <option value="3-5">3 a 5 años</option>
                                  <option value="6-8">6 a 8 años</option>
                                  <option value="9-10">9 a 10 años</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">Avatar</label>
                                <select
                                  value={newPatientAvatar}
                                  onChange={(e) => setNewPatientAvatar(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none"
                                >
                                  <option value="👦">👦 Niño</option>
                                  <option value="👧">👧 Niña</option>
                                  <option value="🦁">🦁 León</option>
                                  <option value="🦊">🦊 Zorro</option>
                                  <option value="🐨">🐨 Koala</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Objetivo Terapéutico</label>
                              <input
                                type="text"
                                placeholder="ej: Reducir frustración de transiciones"
                                value={newPatientObjective}
                                onChange={(e) => setNewPatientObjective(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-700"
                              />
                            </div>

                            <button
                              onClick={() => {
                                if (!newPatientName.trim()) return;
                                const newId = newPatientName.trim().toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
                                const patientObj: Patient = {
                                  id: newId,
                                  name: newPatientName,
                                  avatar: newPatientAvatar,
                                  selectedAge: newPatientAge,
                                  stars: 0,
                                  unlockedAchievements: [],
                                  completedRoutineTasks: [],
                                  emotionJournal: [],
                                  customPictogramImages: {},
                                  customPictogramVoices: {},
                                  therapeuticObjective: newPatientObjective || 'Desarrollo integral y socialización'
                                };
                                setPatients(prev => [...prev, patientObj]);
                                setNewPatientName('');
                                setNewPatientObjective('');
                                setActivePatientId(newId);
                                playSuccessSound();
                              }}
                              disabled={!newPatientName.trim()}
                              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white font-black text-[10px] py-1.5 rounded-lg transition-all"
                            >
                              ✓ Añadir perfil
                            </button>
                          </div>
                        </div>

                        {/* Adaptive layout & Global preferences config panel */}
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 mt-3 space-y-3">
                          <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                            ⚙️ Preferencias de Visualización y Adaptación
                          </h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Ajusta el modo de visualización de la interfaz estelar para adaptarlo al tamaño de este dispositivo (tablet o móvil) y regula el rango de edad.
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Display Device Layout Switcher */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest block">Diseño de Interfaz</label>
                              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => { playClickSound(); setAppDeviceMode('tablet'); localStorage.setItem('np_app_device_mode', 'tablet'); }}
                                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg text-center transition-all ${
                                    appDeviceMode === 'tablet' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  💻 Tablet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { playClickSound(); setAppDeviceMode('movil'); localStorage.setItem('np_app_device_mode', 'movil'); }}
                                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg text-center transition-all ${
                                    appDeviceMode === 'movil' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  📱 Móvil
                                </button>
                              </div>
                            </div>

                            {/* Range Selector */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest block">Rango de Edad Activo</label>
                              <select
                                value={selectedAge}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  playClickSound();
                                  setSelectedAge(val);
                                  // sync with active patient
                                  setPatients(prev => prev.map(p => p.id === activePatientId ? { ...p, selectedAge: val } : p));
                                }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs font-bold focus:outline-none"
                              >
                                <option value="3-5">🌱 3 a 5 años (Simple / Sensorial)</option>
                                <option value="6-8">🚀 6 a 8 años (Autonomía / Rutinas)</option>
                                <option value="9-10">⭐ 9 a 10 años (Foco Avanzado / Social)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: UNIFIED PICTOGRAM LIBRARY CUSTOMIZATION */}
                    {parentsActiveTab === 'pictogramas' && (
                      <div className="space-y-3">
                        <h3 className="font-extrabold text-white text-xs">🎨 Biblioteca Unificada de Pictogramas Propietaria</h3>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Sube fotos reales desde la cámara de tu celular o graba voces reales de familiares. La voz familiar disminuye la ansiedad y mejora exponencialmente la respuesta al tratamiento.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-900">
                          {/* Left Column: Pictogram Selector with Filter & Search */}
                          <div className="md:col-span-7 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Buscar pictograma..."
                                value={parentsPicSearchQuery}
                                onChange={(e) => setParentsPicSearchQuery(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                              />
                              <select
                                value={parentsPicCategoryFilter}
                                onChange={(e) => setParentsPicCategoryFilter(e.target.value as any)}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
                              >
                                <option value="all">Todas</option>
                                <option value="necesidades">🌱 Necesidades</option>
                                <option value="emociones">😊 Siento</option>
                                <option value="acciones">🧸 Acciones</option>
                                <option value="objetos">📱 Objetos</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-4 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                              {ALL_DEFAULT_PICTOGRAMS.filter(p => {
                                const matchSearch = p.word.toLowerCase().includes(parentsPicSearchQuery.toLowerCase());
                                const matchCategory = parentsPicCategoryFilter === 'all' || p.category === parentsPicCategoryFilter;
                                return matchSearch && matchCategory;
                              }).map(p => {
                                const hasImage = customPictogramImages[p.id];
                                const hasVoice = customPictogramVoices[p.id];
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      playClickSound();
                                      setSelectedPicToCustomize(p.id);
                                      setPreviewAudioUrl(customPictogramVoices[p.id] || null);
                                    }}
                                    className={`p-1 border rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                                      selectedPicToCustomize === p.id
                                        ? 'bg-blue-900/40 border-blue-500 text-white'
                                        : 'bg-slate-900/60 border-slate-850 hover:border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    <div className="text-base flex items-center justify-center min-h-[22px]">
                                      {hasImage ? (
                                        <img src={hasImage} alt={p.word} className="w-5 h-5 rounded object-cover" />
                                      ) : (
                                        <span>{p.emoji}</span>
                                      )}
                                    </div>
                                    <span className="text-[7.5px] font-bold truncate w-full leading-none mt-1">{p.word}</span>
                                    <div className="flex gap-0.5 mt-0.5">
                                      {hasImage && <span className="text-[6.5px]">📸</span>}
                                      {hasVoice && <span className="text-[6.5px]">🎤</span>}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Column: Customization Actions */}
                          <div className="md:col-span-5 bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
                            {(() => {
                              const activePicObj = ALL_DEFAULT_PICTOGRAMS.find(p => p.id === selectedPicToCustomize) || ALL_DEFAULT_PICTOGRAMS[0];
                              return (
                                <>
                                  <div className="space-y-1.5 text-center">
                                    <span className="text-[8px] font-extrabold text-blue-400 uppercase tracking-widest leading-none block">Personalizando</span>
                                    <h4 className="font-extrabold text-white text-xs leading-none">{activePicObj.word}</h4>
                                    
                                    <div className="flex items-center justify-center py-2">
                                      <div className="w-16 h-16 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                                        {customPictogramImages[selectedPicToCustomize] ? (
                                          <img src={customPictogramImages[selectedPicToCustomize]} alt="custom-upload" className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="text-3xl">{activePicObj.emoji}</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-[8px] text-slate-400 space-y-0.5">
                                      <div>Imagen: {customPictogramImages[selectedPicToCustomize] ? '✅ Personalizada' : '❌ Predeterminada'}</div>
                                      <div>Voz familiar: {customPictogramVoices[selectedPicToCustomize] ? '✅ Grabada' : '❌ Sintética'}</div>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 shrink-0">
                                    {/* Capture Action */}
                                    <input
                                      id="custom-img-upload-enterprise"
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            const base64 = reader.result as string;
                                            setCustomPictogramImages(prev => {
                                              return { ...prev, [selectedPicToCustomize]: base64 };
                                            });
                                            playSuccessSound();
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <label
                                      htmlFor="custom-img-upload-enterprise"
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-lg text-center cursor-pointer shadow active:scale-95 transition-all flex items-center justify-center gap-1"
                                    >
                                      📷 Tomar Foto Familiar
                                    </label>

                                    {/* Voice recording Action */}
                                    {isRecording ? (
                                      <button
                                        onClick={() => {
                                          if (mediaRecorder) {
                                            mediaRecorder.stop();
                                            setIsRecording(false);
                                          }
                                        }}
                                        className="w-full bg-rose-600 animate-pulse text-white font-extrabold text-[10px] py-1.5 px-2 rounded-lg text-center"
                                      >
                                        ⏹️ Detener Grabación
                                      </button>
                                    ) : (
                                      <button
                                        onClick={async () => {
                                          try {
                                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                            const recorder = new MediaRecorder(stream);
                                            const chunks: Blob[] = [];
                                            
                                            recorder.ondataavailable = (e) => {
                                              if (e.data.size > 0) chunks.push(e.data);
                                            };

                                            recorder.onstop = () => {
                                              const blob = new Blob(chunks, { type: 'audio/webm' });
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                const base64 = reader.result as string;
                                                setCustomPictogramVoices(prev => {
                                                  return { ...prev, [selectedPicToCustomize]: base64 };
                                                });
                                                setPreviewAudioUrl(base64);
                                                playSuccessSound();
                                              };
                                              reader.readAsDataURL(blob);
                                              stream.getTracks().forEach(t => t.stop());
                                            };

                                            recorder.start();
                                            setMediaRecorder(recorder);
                                            setIsRecording(true);
                                            setPreviewAudioUrl(null);
                                          } catch (err) {
                                            alert("Otorga permisos de micrófono para grabar.");
                                          }
                                        }}
                                        className="w-full bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-[10px] py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1"
                                      >
                                        🎤 Grabar Voz Familiar
                                      </button>
                                    )}

                                    {/* Play preview or remove customized elements */}
                                    <div className="grid grid-cols-2 gap-1 mt-1">
                                      {previewAudioUrl && (
                                        <button
                                          onClick={() => playCustomVoice(previewAudioUrl)}
                                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[9px] py-1 rounded"
                                        >
                                          🔈 Oír Prueba
                                        </button>
                                      )}
                                      {(customPictogramImages[selectedPicToCustomize] || customPictogramVoices[selectedPicToCustomize]) && (
                                        <button
                                          onClick={() => {
                                            playClickSound();
                                            setCustomPictogramImages(prev => {
                                              const copy = { ...prev };
                                              delete copy[selectedPicToCustomize];
                                              return copy;
                                            });
                                            setCustomPictogramVoices(prev => {
                                              const copy = { ...prev };
                                              delete copy[selectedPicToCustomize];
                                              return copy;
                                            });
                                            setPreviewAudioUrl(null);
                                          }}
                                          className="col-span-2 bg-rose-950/40 hover:bg-rose-950/60 text-rose-300 border border-rose-500/20 text-[9px] py-1 rounded font-bold"
                                        >
                                          Quitar Ajustes
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* AsTeRICS Grid (OBF) & ARASAAC AAC Integration Panel */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {/* AsTeRICS Grid Board Connection */}
                          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-900 space-y-2 text-left">
                            <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                              <span className="text-sm">🌐</span>
                              <div>
                                <h4 className="font-extrabold text-white text-[11px] leading-none uppercase tracking-wider">Integración AsTeRICS Grid</h4>
                                <p className="text-[8.5px] text-slate-500 mt-0.5">Sincroniza tableros de comunicación en formato Open Board (.obf)</p>
                              </div>
                            </div>

                            <p className="text-[9.5px] text-slate-400 leading-tight">
                              Exporta este tablero para usarlo en AsTeRICS Grid o importa un archivo de cuadrícula de comunicación AAC estándar desde tu terapeuta.
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                onClick={handleExportAsTeRICS_OBF}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] py-2 px-2.5 rounded-xl text-center shadow active:scale-95 transition-all flex items-center justify-center gap-1"
                              >
                                📤 Exportar a AsTeRICS (.obf)
                              </button>

                              <div>
                                <input
                                  id="obf-import-input"
                                  type="file"
                                  accept=".json,.obf"
                                  onChange={handleImportAsTeRICS_OBF}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="obf-import-input"
                                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-black text-[9px] py-2 px-2.5 rounded-xl text-center cursor-pointer shadow active:scale-95 transition-all flex items-center justify-center gap-1"
                                >
                                  📥 Importar desde AsTeRICS
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* ARASAAC Pictogram Finder */}
                          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-900 space-y-2 text-left flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                                <span className="text-sm">🔍</span>
                                <div>
                                  <h4 className="font-extrabold text-white text-[11px] leading-none uppercase tracking-wider">Buscador Oficial ARASAAC</h4>
                                  <p className="text-[8.5px] text-slate-500 mt-0.5">Base de datos mundial de pictogramas para autismo</p>
                                </div>
                              </div>

                              <p className="text-[9.5px] text-slate-400 leading-tight">
                                Busca cualquier pictograma oficial en los servidores de ARASAAC y asígnalo instantáneamente al pictograma seleccionado arriba.
                              </p>
                              <p className="text-[9.5px] text-slate-400 leading-tight">
                                Pictogramas de <a className="text-blue-300 underline" href="https://arasaac.org" target="_blank" rel="noopener noreferrer">ARASAAC</a>, Gobierno de Aragón. La búsqueda requiere internet. Antes de un uso comercial, revisa sus <a className="text-blue-300 underline" href="https://aulaabierta.arasaac.org/en/terms-of-use" target="_blank" rel="noopener noreferrer">condiciones de uso y atribución</a>.
                              </p>

                              <div className="flex gap-1.5 pt-1.5">
                                <input
                                  type="text"
                                  placeholder="ej: Manzana, cepillar, baño..."
                                  value={arasaacQuery}
                                  onChange={(e) => setArasaacQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      searchARASAAC(arasaacQuery);
                                    }
                                  }}
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-[10px] focus:outline-none focus:border-slate-700 font-bold"
                                />
                                <button
                                  onClick={() => searchARASAAC(arasaacQuery)}
                                  disabled={arasaacLoading}
                                  className="bg-pink-600 hover:bg-pink-500 disabled:opacity-45 text-white font-black text-[9px] py-1 px-3 rounded-lg"
                                >
                                  {arasaacLoading ? 'Buscando...' : 'Buscar'}
                                </button>
                              </div>
                            </div>

                            {arasaacFeedback && (
                              <p className="text-[9px] text-amber-400 font-extrabold leading-none">{arasaacFeedback}</p>
                            )}

                            {arasaacResults.length > 0 && (
                              <div className="space-y-1.5 mt-1">
                                <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Resultados (Toca para asignar a {ALL_DEFAULT_PICTOGRAMS.find(p => p.id === selectedPicToCustomize)?.word}):</span>
                                <div className="grid grid-cols-5 gap-1 bg-[#090D16] p-1.5 rounded-xl border border-slate-900/80 max-h-[85px] overflow-y-auto">
                                  {arasaacResults.map((res: any) => {
                                    const imgUrl = `https://api.arasaac.org/api/pictograms/${res.idPictogram}`;
                                    return (
                                      <button
                                        key={res.idPictogram}
                                        onClick={() => {
                                          setCustomPictogramImages(prev => ({
                                            ...prev,
                                            [selectedPicToCustomize]: imgUrl
                                          }));
                                          playSuccessSound();
                                        }}
                                        className="bg-slate-950 p-1 border border-slate-850 hover:border-pink-500 rounded-lg flex items-center justify-center transition-all group relative"
                                        title="Asignar este pictograma"
                                      >
                                        <img src={imgUrl} alt="arasaac-result" className="w-8 h-8 object-contain rounded" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB 2.5: SENSORY AUDIO CONTROL PANEL */}
                    {parentsActiveTab === 'sonido' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-3">
                          <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                            🔊 Control Sensorial de Hipersensibilidad Auditiva
                          </h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Ajusta el sonido de la aplicación según las preferencias del niño. Puedes elegir silencio, tonos suaves o un sonido de fondo y probar el volumen.
                          </p>

                          {/* Sound Mode Selector */}
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <label className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest block">Modo de Sonido Activo</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'soft', label: '🌱 Suave / Calmo', desc: 'Tonos graves amortiguados y envolventes.' },
                                { id: 'silent', label: '🔇 Silencio Total', desc: 'Silencia la app para momentos de sobrecarga.' },
                                { id: 'masking', label: '🌊 Ruido Marrón', desc: 'Zumbido bajo para bloquear ruidos externos.' }
                              ].map(mode => (
                                <button
                                  key={mode.id}
                                  aria-pressed={sensoryAudioMode === mode.id}
                                  onClick={() => {
                                    playClickSound();
                                    setSensoryAudioMode(mode.id as any);
                                  }}
                                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                    sensoryAudioMode === mode.id
                                      ? 'bg-blue-950/30 border-blue-500 text-white shadow-lg'
                                      : 'bg-slate-900/40 border-slate-850 hover:border-slate-800 text-slate-400'
                                  }`}
                                >
                                  <span className="text-xs font-black">{mode.label}</span>
                                  <span className="text-[8px] mt-1 text-slate-500 leading-tight">{mode.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Volume Cap Slider */}
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest">Límite de Volumen General</label>
                              <span className="text-xs font-mono text-white font-bold">{audioVolume}%</span>
                            </div>
                            <input
                              type="range"
                              aria-label="Volumen de la aplicación"
                              min="0"
                              max="100"
                              value={audioVolume}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setAudioVolume(val);
                                localStorage.setItem('np_audio_volume', String(val));
                              }}
                              className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-[8.5px] text-slate-500">Prueba un nivel cómodo antes de usar la app con el niño.</p>
                          </div>

                          {/* Lowpass Filter Switch */}
                          <div className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-850 rounded-xl pt-2 border-t border-slate-900">
                            <div className="space-y-0.5 text-left max-w-[80%]">
                              <label className="text-[10px] text-white font-extrabold flex items-center gap-1">
                                🛡️ Filtro de tonos agudos
                              </label>
                              <p className="text-[9px] text-slate-400 leading-tight">
                                Suaviza los tonos generados por la app. No modifica sonidos de otras aplicaciones ni del entorno.
                              </p>
                            </div>
                            <button
                              type="button"
                              aria-label="Filtro de tonos agudos"
                              aria-pressed={audioLowpass}
                              onClick={() => {
                                playClickSound();
                                const newVal = !audioLowpass;
                                setAudioLowpass(newVal);
                                localStorage.setItem('np_audio_lowpass', String(newVal));
                              }}
                              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                                audioLowpass ? 'bg-blue-600' : 'bg-slate-800'
                              }`}
                            >
                              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                                audioLowpass ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Sound Sensory Room */}
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-2 text-center">
                          <span className="text-2xl">🎹</span>
                          <h4 className="font-extrabold text-xs text-white">Sala de Pruebas Auditivas Calmas</h4>
                          <p className="text-[10px] text-slate-400">Toca los botones para oír la diferencia del volumen y filtro de paso bajo activo en tiempo real.</p>
                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {[
                              { label: 'Do (Grave)', freq: 261.63, color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20' },
                              { label: 'Mi (Calmo)', freq: 329.63, color: 'bg-blue-600/20 text-blue-400 border-blue-500/20' },
                              { label: 'Sol (Melódico)', freq: 392.00, color: 'bg-purple-600/20 text-purple-400 border-purple-500/20' },
                              { label: 'La (Foco)', freq: 440.00, color: 'bg-amber-600/20 text-amber-400 border-amber-500/20' }
                            ].map(note => (
                              <button
                                key={note.label}
                                type="button"
                                onClick={() => playTherapeuticTone(note.freq, 'sine-soft', 0.4)}
                                className={`py-2 px-1 text-[9px] font-black rounded-xl border transition-all active:scale-90 ${note.color}`}
                              >
                                {note.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: MEDICAL & CLINICAL PROGRESS REPORTS */}
                    {parentsActiveTab === 'reportes' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-white text-xs">📋 Resumen de actividades</h3>
                          <button
                            onClick={() => {
                              playSuccessSound();
                              window.print();
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow"
                          >
                            <Printer className="w-3 h-3" /> Imprimir / Exportar PDF
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                          Este resumen muestra registros guardados en este navegador. No es una evaluación clínica ni mide cambios en la atención fuera de la app.
                        </p>

                        {/* Printable activity summary */}
                        <div id="printable-activity-summary" className="bg-white text-slate-900 p-5 rounded-2xl border border-slate-300 shadow space-y-4 text-left">
                          {/* Official Letterhead */}
                          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                            <div>
                              <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1">
                                NEUROPLANETA
                              </h1>
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Resumen local de actividades</p>
                            </div>
                            <div className="text-right text-[8px] text-slate-500">
                              <p>Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</p>
                              <p>Origen: este dispositivo</p>
                            </div>
                          </div>

                          {/* Patient metadata */}
                          <div className="grid grid-cols-2 gap-3 text-[9px] bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                            <div>
                              <p><strong>Perfil:</strong> {activePatient.name}</p>
                              <p><strong>Rango Etario:</strong> {activePatient.selectedAge} años</p>
                            </div>
                            <div>
                              <p><strong>Objetivo anotado:</strong> {activePatient.therapeuticObjective || 'Sin objetivo anotado'}</p>
                            </div>
                          </div>

                          {/* Performance Stats */}
                          <div className="space-y-1">
                            <h3 className="font-black text-[10px] text-slate-850 uppercase tracking-wide">1. Actividad registrada en este perfil</h3>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-center">
                                <div className="text-[14px] font-black text-yellow-600">{stars}</div>
                                <div className="text-[7.5px] text-slate-500">Estrellas Recogidas</div>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-center">
                                <div className="text-[14px] font-black text-blue-600">{completedRoutineCount} / {allRoutineTasks.length}</div>
                                <div className="text-[7.5px] text-slate-500">Tareas marcadas</div>
                              </div>
                              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-center">
                                <div className="text-[14px] font-black text-indigo-600">{attentionHighScore}</div>
                                <div className="text-[7.5px] text-slate-500">Mejor partida de números</div>
                              </div>
                            </div>
                          </div>

                          {/* Achieved Milestones */}
                          <div className="space-y-1">
                            <h3 className="font-black text-[10px] text-slate-850 uppercase tracking-wide">2. Logros Estelares e Insignias Desbloqueadas</h3>
                            <div className="flex flex-wrap gap-1">
                              {unlockedAchievements.length === 0 ? (
                                <span className="text-[8px] text-slate-500 italic">No se desbloquearon insignias en este lapso.</span>
                              ) : (
                                unlockedAchievements.map((ach, idx) => (
                                  <span key={idx} className="bg-blue-100 text-blue-800 text-[8px] font-bold px-2 py-0.5 rounded border border-blue-200">
                                    ★ {ach}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Emotion Log */}
                          <div className="space-y-1">
                            <h3 className="font-black text-[10px] text-slate-850 uppercase tracking-wide">3. Emociones anotadas</h3>
                            {emotionJournal.length === 0 ? (
                              <p className="text-[8px] text-slate-500 italic">Aún no se anotaron emociones en este perfil.</p>
                            ) : (
                              <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                                {emotionJournal.map((journal, i) => (
                                  <div key={i} className="bg-slate-50 p-2 rounded border border-slate-200 text-[8px] space-y-0.5">
                                    <div className="flex justify-between font-bold text-slate-600">
                                      <span>{journal.emotion}</span>
                                      <span>{journal.date}</span>
                                    </div>
                                    <p className="text-slate-800">{journal.note}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-dashed border-slate-300 text-[8px] text-slate-500">
                            Registro orientativo de uso de la app. Las estrellas, tareas marcadas y partidas no equivalen a un diagnóstico ni a una medición clínica.
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Clinician secure log-out section */}
                  <div className="border-t border-slate-800/85 pt-3 mt-2 shrink-0">
                    <button
                      onClick={() => {
                        playClickSound();
                        setParentsAuthenticated(false);
                        generateParentsMath();
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white font-bold text-xs py-2.5 rounded-xl border border-slate-800/60 transition-all active:scale-98"
                    >
                      Cerrar panel
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* Persistent navigation keeps the calming exercise within the phone frame. */}
      <nav className="absolute bottom-0 left-0 right-0 bg-[#060913]/95 backdrop-blur-xl border-t border-white/10 py-2.5 px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] z-40 shrink-0">
        <div className="max-w-md mx-auto flex items-center justify-around gap-2">
          <button
            onClick={() => { playClickSound(); setCurrentTab('inicio'); setActiveModule(null); }}
            className={`flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all duration-200 cursor-pointer ${
              currentTab === 'inicio' && !activeModule
                ? 'text-white bg-[#186EF3]/20 border border-[#186EF3]/30 font-bold shadow-[0_0_15px_rgba(24,110,243,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[10px] tracking-wide font-extrabold uppercase">Inicio</span>
          </button>

          <button
            onClick={() => { playClickSound(); setCurrentTab('logros'); setActiveModule(null); }}
            className={`flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all duration-200 cursor-pointer ${
              currentTab === 'logros' 
                ? 'text-white bg-[#186EF3]/20 border border-[#186EF3]/30 font-bold shadow-[0_0_15px_rgba(24,110,243,0.15)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] border border-transparent'
            }`}
          >
            <span className="text-lg">🏆</span>
            <span className="text-[10px] tracking-wide font-extrabold uppercase">Logros</span>
          </button>
          <button
            type="button"
            aria-label="Abrir ejercicio SOS Calma"
            onClick={() => { setCalmStep(0); setCurrentTab('inicio'); setActiveModule('sos'); }}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl transition-colors cursor-pointer ${
              activeModule === 'sos'
                ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30 font-bold'
                : 'text-rose-400 hover:bg-rose-500/10 border border-transparent'
            }`}
          >
            <Heart className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] tracking-wide font-extrabold uppercase">SOS Calma</span>
          </button>
        </div>
      </nav>

    </div>
    </div>
  );
}
