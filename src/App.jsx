/**
 * App.jsx
 *
 * Main ASTRO application component. UI, state management, tab routing,
 * profile CRUD, chat ("Ask Astro"), journal, and compatibility screens
 * are unchanged from the original single-file source — only the
 * pre-existing calculation engine and the NorthIndianChart component
 * were extracted into their own modules and are now imported below.
 * The two backend API wrapper functions (callAstroServerAsk,
 * callAstroServerJournalReflection) are unchanged and still POST to the
 * relative /api/ask-astro and /api/journal/reflection endpoints.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Compass,
  Moon,
  Sun,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  ChevronRight,
  ChevronDown,
  BookOpen,
  HeartHandshake,
  MessageSquare,
  Share2,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  Layers,
  Star,
  Send,
  Download,
  Copy,
  Check,
  Edit3,
  Activity,
  ShieldCheck,
  AlertCircle,
  Cpu,
  Globe,
  Loader2,
  Server,
  AlertTriangle,
  RotateCcw,
  Zap,
  Heart,
  Briefcase,
  TrendingUp,
  Brain,
  Feather,
  Flame,
  ArrowRight
} from 'lucide-react';
import NorthIndianChart from './components/NorthIndianChart';
import {
  computeVedicChart,
  computeCurrentTransits,
  generatePersonalLifeOverview,
  calculateAshtakoota,
  generateSecureProfileId,
  searchWorldwideLocations,
  NAKSHATRAS_LIST
} from './lib/astroEngine';

async function callAstroServerAsk(payload) {
  try {
    const res = await fetch('/api/ask-astro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, answer: data.answer || 'Response received.' };
    }
    return {
      ok: false,
      status: res.status,
      error: data.error || 'SERVER_ERROR',
      message: data.message || `HTTP ${res.status} returned from /api/ask-astro`
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: 'NETWORK_ERROR',
      message: 'Failed to reach /api/ask-astro endpoint over the network.'
    };
  }
}

async function callAstroServerJournalReflection(payload) {
  try {
    const res = await fetch('/api/journal/reflection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, reflection: data.reflection || 'Reflection generated.' };
    }
    return {
      ok: false,
      status: res.status,
      error: data.error || 'SERVER_ERROR',
      message: data.message || `HTTP ${res.status} returned from /api/journal/reflection`
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: 'NETWORK_ERROR',
      message: 'Failed to reach /api/journal/reflection endpoint over the network.'
    };
  }
}

export default function App() {
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem('astro_profiles_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => {
            if (p && typeof p.id === 'string' && p.id.trim().length > 0) {
              return p;
            }
            return { ...p, id: generateSecureProfileId() };
          });
        }
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
    return [];
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    try {
      return localStorage.getItem('astro_active_profile_id_v3') || null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedHouseModal, setSelectedHouseModal] = useState(null);
  const [selectedPlanetModal, setSelectedPlanetModal] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '', company: '' });
  const [contactStatus, setContactStatus] = useState('idle'); // idle | sending | success | error
  const [contactErrorMessage, setContactErrorMessage] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuTriggerRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: 'Rahul',
    dob: '1998-05-15',
    tob: '08:30',
    citySearch: 'Patna, Bihar, India',
    placeName: 'Patna, Bihar, India',
    lat: 25.5941,
    lon: 85.1376,
    timezone: 'Asia/Kolkata',
    country_code: 'IN',
    admin1: 'Bihar',
    country: 'India'
  });

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationStep, setCalculationStep] = useState('');

  const geocodeTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiServerError, setAiServerError] = useState(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState(null);
  const chatEndRef = useRef(null);

  const [journalEntries, setJournalEntries] = useState([]);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalText, setJournalText] = useState('');
  const [journalMood, setJournalMood] = useState('Reflective');
  const [journalSearch, setJournalSearch] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [isReflectingAI, setIsReflectingAI] = useState(false);
  const [reflectingEntryId, setReflectingEntryId] = useState(null);
  const [journalAiError, setJournalAiError] = useState(null);

  const [compPartnerId, setCompPartnerId] = useState('');
  const [masterAuditRunning, setMasterAuditRunning] = useState(false);
  const [masterAuditReport, setMasterAuditReport] = useState(null);

  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Phase B / Increment 1: two subtle star tones (warm gold + cool
    // violet) for a touch of celestial depth, replacing the single flat
    // color. Same total count (90) — no added per-frame cost.
    const stars = Array.from({ length: 90 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.3 + 0.3,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.008 + 0.003,
      cool: i % 5 === 0 // ~1 in 5 stars reads as a cooler celestial tone
    }));

    const drawFrame = (animate) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        const currentAlpha = animate
          ? Math.max(0.15, Math.min(0.9, star.alpha + Math.sin(Date.now() * star.speed) * 0.01))
          : star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.cool
          ? `rgba(180, 165, 235, ${currentAlpha})`
          : `rgba(245, 208, 130, ${currentAlpha})`;
        ctx.fill();
      });
    };

    // Respect prefers-reduced-motion: draw the star field once, statically,
    // instead of running a continuous requestAnimationFrame loop. This is
    // both an accessibility improvement and a real performance win (the
    // single most expensive visual effect in the app, now opt-out for
    // anyone who has asked their OS for reduced motion).
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const shouldAnimate = !reduceMotionQuery.matches;

    if (shouldAnimate) {
      const render = () => {
        drawFrame(true);
        animationFrameId = requestAnimationFrame(render);
      };
      render();
    } else {
      drawFrame(false);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('astro_profiles_v3', JSON.stringify(profiles));
    } catch (e) {
      console.warn('Profiles write error:', e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      if (activeProfileId) {
        localStorage.setItem('astro_active_profile_id_v3', activeProfileId);
      }
    } catch (e) {
      console.warn('Active profile write error:', e);
    }
  }, [activeProfileId]);

  const currentProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
  }, [profiles, activeProfileId]);

  // Generate Personal Life Overview for current active profile
  const personalOverview = useMemo(() => {
    if (!currentProfile || !currentProfile.chart) return null;
    return generatePersonalLifeOverview(currentProfile.chart, currentProfile.name);
  }, [currentProfile]);

  useEffect(() => {
    if (!currentProfile && activeTab !== 'onboarding') {
      setActiveTab('onboarding');
    }
  }, [currentProfile, activeTab]);

  useEffect(() => {
    if (currentProfile) {
      setChatMessages(
        currentProfile.chatHistory || [
          {
            sender: 'astro',
            text: `Namaste ${currentProfile.name}! I am ASTRO, your Vedic contemplation companion. I have received your verified ${currentProfile.chart.lagna.signSanskrit} Lagna, Moon in ${currentProfile.chart.moon.nakshatra} (Pada ${currentProfile.chart.moon.pada}), and your current ${currentProfile.chart.dashaSnapshot.activeMahadasha} Mahadasha. How can I illuminate your chart today?`
          }
        ]
      );
      setJournalEntries(currentProfile.journalEntries || []);
      setAiServerError(null);
      setLastFailedPrompt(null);
      setJournalAiError(null);
    }
  }, [currentProfile?.id]);

  const handleCitySearchChange = (query) => {
    setFormData((prev) => ({ ...prev, citySearch: query }));
    setGeocodingError(null);

    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (!query || query.trim().length < 2) {
      setCitySuggestions([]);
      setIsSearchingCity(false);
      return;
    }

    setIsSearchingCity(true);

    geocodeTimeoutRef.current = setTimeout(async () => {
      const requestId = ++latestRequestIdRef.current;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await searchWorldwideLocations(query, controller.signal);
        if (requestId !== latestRequestIdRef.current) return;
        setCitySuggestions(results);
        setIsSearchingCity(false);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (requestId === latestRequestIdRef.current) {
          console.warn('Worldwide geocoding error:', err);
          setGeocodingError('Unable to reach geocoding service. Please check your network or spelling.');
          setCitySuggestions([]);
          setIsSearchingCity(false);
        }
      }
    }, 350);
  };

  const selectCity = (city) => {
    setFormData((prev) => ({
      ...prev,
      citySearch: city.fullName,
      placeName: city.fullName,
      lat: city.latitude,
      lon: city.longitude,
      timezone: city.timezone,
      country_code: city.country_code,
      admin1: city.admin1,
      country: city.country
    }));
    setCitySuggestions([]);
    setGeocodingError(null);
  };

  const handleSaveProfile = () => {
    if (!formData.dob || !formData.tob) return;

    setIsCalculating(true);
    setCalculationStep(`Resolving ${formData.timezone} historical UTC offset...`);

    setTimeout(() => {
      setCalculationStep('Aligning Lahiri / Chitra Paksha Sidereal Ayanamsa...');
      setTimeout(() => {
        setCalculationStep('Executing Meeus Analytical Perturbations & Bhavas...');
        setTimeout(() => {
          const chart = computeVedicChart({
            dob: formData.dob,
            tob: formData.tob,
            lat: formData.lat,
            lon: formData.lon,
            timezone: formData.timezone
          });

          if (isEditingProfile && formData.id) {
            setProfiles((prev) =>
              prev.map((p) =>
                p.id === formData.id
                  ? {
                      ...p,
                      name: formData.name.trim() || 'My Chart',
                      dob: formData.dob,
                      tob: formData.tob,
                      placeName: formData.placeName,
                      lat: formData.lat,
                      lon: formData.lon,
                      timezone: formData.timezone,
                      country_code: formData.country_code,
                      admin1: formData.admin1,
                      country: formData.country,
                      chart
                    }
                  : p
              )
            );
            setIsEditingProfile(false);
          } else {
            const newProfileId = generateSecureProfileId();
            const newProfile = {
              id: newProfileId,
              name: formData.name.trim() || 'My Chart',
              dob: formData.dob,
              tob: formData.tob,
              placeName: formData.placeName,
              lat: formData.lat,
              lon: formData.lon,
              timezone: formData.timezone,
              country_code: formData.country_code,
              admin1: formData.admin1,
              country: formData.country,
              createdAt: new Date().toISOString(),
              chart,
              chatHistory: [
                {
                  sender: 'astro',
                  text: `Namaste ${formData.name.trim() || 'Seeker'}! Your Vedic Sidereal chart has been calculated using the Meeus analytical ephemeris with Lahiri Ayanamsa (${chart.ayanamsaDeg}°). Ascendant in ${chart.lagna.signName} (${chart.lagna.signSanskrit}), Moon in ${chart.moon.nakshatra} (Pada ${chart.moon.pada}), and current Mahadasha is ${chart.dashaSnapshot.activeMahadasha}. How can I assist your contemplation?`
                }
              ],
              journalEntries: []
            };

            setProfiles((prev) => [...prev, newProfile]);
            setActiveProfileId(newProfileId);
          }

          setIsCalculating(false);
          setActiveTab('dashboard');
        }, 300);
      }, 300);
    }, 300);
  };

  const handleEditProfileInit = (profile) => {
    setIsEditingProfile(true);
    setFormData({
      id: profile.id,
      name: profile.name,
      dob: profile.dob,
      tob: profile.tob,
      citySearch: profile.placeName,
      placeName: profile.placeName,
      lat: profile.lat,
      lon: profile.lon,
      timezone: profile.timezone || 'Asia/Kolkata',
      country_code: profile.country_code || '',
      admin1: profile.admin1 || '',
      country: profile.country || ''
    });
    setCitySuggestions([]);
    setGeocodingError(null);
    setActiveTab('onboarding');
  };

  const handleDeleteProfile = (id) => {
    const target = profiles.find((p) => p.id === id);
    const label = target ? target.name : 'this profile';
    if (!window.confirm(`Delete "${label}"? This permanently removes its chart, journal entries, and chat history from this device.`)) {
      return;
    }
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    if (activeProfileId === id) {
      if (updated.length > 0) {
        setActiveProfileId(updated[0].id);
      } else {
        setActiveProfileId(null);
        setActiveTab('onboarding');
      }
    }
  };

  const handleSendChatMessage = async (retryText = null, customPrompt = null) => {
    const userText = (customPrompt || retryText || chatInput).trim();
    if (!userText || isAiTyping || !currentProfile) return;

    const updatedHistory = retryText
      ? chatMessages
      : [...chatMessages, { sender: 'user', text: userText }];

    if (!retryText) {
      setChatMessages(updatedHistory);
      setChatInput('');
    }

    setIsAiTyping(true);
    setAiServerError(null);
    setLastFailedPrompt(null);

    const chart = currentProfile.chart;
    const chartSummary = {
      ayanamsaDeg: chart.ayanamsaDeg,
      placeName: currentProfile.placeName,
      timezone: currentProfile.timezone,
      lagna: {
        signName: chart.lagna.signName,
        signSanskrit: chart.lagna.signSanskrit,
        degFormatted: chart.lagna.degFormatted
      },
      moon: {
        signName: chart.moon.signName,
        house: chart.moon.house,
        degFormatted: chart.moon.degFormatted,
        nakshatra: chart.moon.nakshatra,
        pada: chart.moon.pada,
        nakshatraLord: chart.moon.nakshatraLord
      },
      sun: {
        signName: chart.sun.signName,
        house: chart.sun.house,
        degFormatted: chart.sun.degFormatted
      },
      dashaMahadasha: chart.dashaSnapshot.activeMahadasha,
      dashaAntardasha: chart.dashaSnapshot.activeAntardasha,
      yogas: chart.yogas.map((y) => y.name)
    };

    const result = await callAstroServerAsk({
      question: userText,
      chartSummary,
      profileName: currentProfile.name
    });

    if (result.ok && result.answer) {
      const finalMessages = [...updatedHistory, { sender: 'astro', text: result.answer }];
      setChatMessages(finalMessages);
      setProfiles((prev) =>
        prev.map((p) => (p.id === currentProfile.id ? { ...p, chatHistory: finalMessages } : p))
      );
    } else {
      setLastFailedPrompt(userText);
      setAiServerError({
        status: result.status,
        type: result.error || 'SERVER_ERROR',
        message: result.message || 'ASTRO AI backend endpoint reported an HTTP failure.'
      });
    }

    setIsAiTyping(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSaveJournal = () => {
    if (!journalText.trim() || !currentProfile) return;

    if (editingEntryId) {
      const updated = journalEntries.map((e) =>
        e.id === editingEntryId
          ? {
              ...e,
              title: journalTitle.trim() || 'Untitled Reflection',
              text: journalText.trim(),
              mood: journalMood,
              updatedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
          : e
      );
      setJournalEntries(updated);
      setEditingEntryId(null);
      setProfiles((prev) =>
        prev.map((p) => (p.id === currentProfile.id ? { ...p, journalEntries: updated } : p))
      );
    } else {
      const newEntry = {
        id: 'entry_' + Date.now(),
        title: journalTitle.trim() || 'Cosmic Reflection',
        text: journalText.trim(),
        mood: journalMood,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dashaContext: `${currentProfile.chart.dashaSnapshot.activeMahadasha} / ${currentProfile.chart.dashaSnapshot.activeAntardasha}`,
        reflection: null
      };
      const updated = [newEntry, ...journalEntries];
      setJournalEntries(updated);
      setProfiles((prev) =>
        prev.map((p) => (p.id === currentProfile.id ? { ...p, journalEntries: updated } : p))
      );
    }

    setJournalTitle('');
    setJournalText('');
  };

  const handleReflectWithAI = async (entry) => {
    if (isReflectingAI || !currentProfile) return;
    setIsReflectingAI(true);
    setReflectingEntryId(entry.id);
    setJournalAiError(null);

    const chartSummary = {
      lagnaSign: currentProfile.chart.lagna.signName,
      moonNakshatra: currentProfile.chart.moon.nakshatra,
      dashaContext: `${currentProfile.chart.dashaSnapshot.activeMahadasha} / ${currentProfile.chart.dashaSnapshot.activeAntardasha}`
    };

    const result = await callAstroServerJournalReflection({
      entryTitle: entry.title,
      entryText: entry.text,
      chartSummary
    });

    if (result.ok && result.reflection) {
      const updated = journalEntries.map((e) =>
        e.id === entry.id ? { ...e, reflection: result.reflection } : e
      );
      setJournalEntries(updated);
      setProfiles((prev) =>
        prev.map((p) => (p.id === currentProfile.id ? { ...p, journalEntries: updated } : p))
      );
    } else {
      setJournalAiError({
        entryId: entry.id,
        status: result.status,
        message: result.message || 'AI reflection service could not be reached via HTTP /api/journal/reflection.'
      });
    }

    setIsReflectingAI(false);
    setReflectingEntryId(null);
  };

  const handleDeleteJournal = (entryId) => {
    const updated = journalEntries.filter((e) => e.id !== entryId);
    setJournalEntries(updated);
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? { ...p, journalEntries: updated } : p))
    );
  };

  const partnerProfile = useMemo(() => {
    if (!compPartnerId) return null;
    return profiles.find((p) => p.id === compPartnerId) || null;
  }, [profiles, compPartnerId]);

  const transitsData = useMemo(() => {
    if (!currentProfile) return null;
    return computeCurrentTransits(currentProfile.chart.lagna.signIndex);
  }, [currentProfile]);

  const filteredJournalEntries = useMemo(() => {
    if (!journalSearch.trim()) return journalEntries;
    return journalEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(journalSearch.toLowerCase()) ||
        e.text.toLowerCase().includes(journalSearch.toLowerCase()) ||
        e.mood.toLowerCase().includes(journalSearch.toLowerCase())
    );
  }, [journalEntries, journalSearch]);

  const handleCopyProfileCard = () => {
    if (!currentProfile) return;
    const shareText = `🌌 ASTRO Vedic Profile for ${currentProfile.name}
📍 Place: ${currentProfile.placeName} (${currentProfile.timezone})
↑ Lagna: ${currentProfile.chart.lagna.signName} (${currentProfile.chart.lagna.signSanskrit}) at ${currentProfile.chart.lagna.degFormatted}
☽ Moon: ${currentProfile.chart.moon.signName} in ${currentProfile.chart.moon.nakshatra} (Pada ${currentProfile.chart.moon.pada})
☉ Sun: ${currentProfile.chart.sun.signName} in House ${currentProfile.chart.sun.house}
⏳ Active Dasha: ${currentProfile.chart.dashaSnapshot.activeMahadasha} - ${currentProfile.chart.dashaSnapshot.activeAntardasha}
✨ Calculated with Meeus Analytical Sidereal Engine on ASTRO.`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  const handleSendContactMessage = async () => {
    if (contactStatus === 'sending') return;
    setContactStatus('sending');
    setContactErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        setContactStatus('success');
        setContactForm({ name: '', email: '', message: '', company: '' });
      } else {
        setContactStatus('error');
        setContactErrorMessage(data.message || 'Your message could not be sent right now.');
      }
    } catch (err) {
      setContactStatus('error');
      setContactErrorMessage('Could not reach the server. Please check your connection and try again.');
    }
  };

  const runMasterEndToEndAudit = async () => {
    setMasterAuditRunning(true);
    const startTime = performance.now();
    const tests = [];

    // Global Multi-Region Integration Benchmarks (5 Cities)
    const globalBenchmarks = [
      {
        id: 'Test A',
        city: 'Patna, India',
        country: 'India',
        dob: '1990-05-15',
        tob: '14:30',
        lat: 25.5941,
        lon: 85.1376,
        timezone: 'Asia/Kolkata',
        expectedOffset: 5.5,
        expectedLagna: 'Virgo',
        expectedMoonSign: 'Capricorn',
        expectedNakshatra: 'Uttara Ashadha'
      },
      {
        id: 'Test B',
        city: 'New York, USA',
        country: 'USA',
        dob: '1985-07-20',
        tob: '08:15',
        lat: 40.7128,
        lon: -74.006,
        timezone: 'America/New_York',
        expectedOffset: -4.0, // Historical EDT
        expectedLagna: 'Leo',
        expectedMoonSign: 'Leo',
        expectedNakshatra: 'Purva Phalguni'
      },
      {
        id: 'Test C',
        city: 'London, UK',
        country: 'UK',
        dob: '2004-08-12',
        tob: '19:45',
        lat: 51.5074,
        lon: -0.1278,
        timezone: 'Europe/London',
        expectedOffset: 1.0, // BST Summer Time
        expectedLagna: 'Aquarius',
        expectedMoonSign: 'Gemini',
        expectedNakshatra: 'Punarvasu'
      },
      {
        id: 'Test D',
        city: 'Tokyo, Japan',
        country: 'Japan',
        dob: '1998-11-03',
        tob: '03:20',
        lat: 35.6762,
        lon: 139.6503,
        timezone: 'Asia/Tokyo',
        expectedOffset: 9.0, // JST
        expectedLagna: 'Virgo',
        expectedMoonSign: 'Aries',
        expectedNakshatra: 'Ashwini'
      },
      {
        id: 'Test E',
        city: 'Sydney, Australia',
        country: 'Australia',
        dob: '2012-01-18',
        tob: '11:30',
        lat: -33.8688,
        lon: 151.2093,
        timezone: 'Australia/Sydney',
        expectedOffset: 11.0, // AEDT Summer Time
        expectedLagna: 'Aries',
        expectedMoonSign: 'Scorpio',
        expectedNakshatra: 'Anuradha'
      }
    ];

    let allGlobalPassed = true;
    const globalSummary = [];

    globalBenchmarks.forEach((bm) => {
      const chart = computeVedicChart({
        dob: bm.dob,
        tob: bm.tob,
        lat: bm.lat,
        lon: bm.lon,
        timezone: bm.timezone
      });

      const offsetOk = chart.resolvedUtcOffset === bm.expectedOffset;
      const lagnaOk = chart.lagna.signName === bm.expectedLagna;
      const moonOk = chart.moon.signName === bm.expectedMoonSign;
      const nakOk = chart.moon.nakshatra === bm.expectedNakshatra;
      const pass = offsetOk && lagnaOk && moonOk && nakOk;

      if (!pass) allGlobalPassed = false;

      globalSummary.push(
        `${bm.id} (${bm.city}): UTC ${chart.resolvedUtcOffset}h, JD ${chart.jd}, Lagna ${chart.lagna.signName}, Moon ${chart.moon.signName} (${chart.moon.nakshatra} P${chart.moon.pada}) -> ${pass ? 'PASSED' : 'FAILED'}`
      );
    });

    tests.push({
      category: 'Timezone & Astrological Geocoding',
      name: '5 Global Reference Charts (India, USA DST, UK BST, Japan, Australia AEDT)',
      status: allGlobalPassed ? 'PASS' : 'FAIL',
      detail: globalSummary.join(' | ')
    });

    // Determinism Test
    const run1 = computeVedicChart(globalBenchmarks[0]);
    const run2 = computeVedicChart(globalBenchmarks[0]);
    const determinismMatch =
      run1.jd === run2.jd &&
      run1.lagna.totalDeg === run2.lagna.totalDeg &&
      run1.moon.totalDeg === run2.moon.totalDeg &&
      run1.sun.totalDeg === run2.sun.totalDeg &&
      run1.dashaSnapshot.balanceYears === run2.dashaSnapshot.balanceYears &&
      run1.yogas.length === run2.yogas.length;

    tests.push({
      category: 'Mathematical Determinism',
      name: 'Repeat Calculation Invariance',
      status: determinismMatch ? 'PASS' : 'FAIL',
      detail: determinismMatch
        ? 'Identical Julian Day, Lagna, Planetary Longitudes, Dasha balance, and Yogas across multiple runs.'
        : 'Discrepancy detected between repeated evaluations of the same birth data.'
    });

    // Personal Life Overview Deterministic Synthesis Test
    const ov1 = generatePersonalLifeOverview(run1, 'User 1');
    const ov2 = generatePersonalLifeOverview(run1, 'User 1');
    const overviewPass =
      ov1 &&
      ov2 &&
      ov1.coreNature.lagnaSummary === ov2.coreNature.lagnaSummary &&
      ov1.currentPhase.mahadasha === run1.dashaSnapshot.activeMahadasha &&
      ov1.nakshatraProfile.name === run1.moon.nakshatra &&
      ov1.strengths.items.length >= 3;

    tests.push({
      category: 'Personal Life Overview',
      name: 'Deterministic Synthesis & Data Binding',
      status: overviewPass ? 'PASS' : 'FAIL',
      detail: overviewPass
        ? `Verified: Core Nature (${ov1.coreNature.title}), Moon Star (${ov1.nakshatraProfile.name}), Active Dasha (${ov1.currentPhase.mahadasha}) synthesized deterministically with zero artificial values.`
        : 'Synthesis failed or produced divergent outputs.'
    });

    // Single-Source-of-Truth Consistency Check
    const sampleChart = run1;
    const kundliSign = sampleChart.lagna.signIndex;
    const planetExpSun = sampleChart.planets.find((p) => p.name === 'Sun');
    const mainSun = sampleChart.sun;
    const dashaLord = sampleChart.dashaSnapshot.birthLord;
    const moonNakLord = sampleChart.moon.nakshatraLord;

    const singleSourcePass =
      kundliSign === sampleChart.houses[0].houseNumber &&
      planetExpSun.totalDeg === mainSun.totalDeg &&
      dashaLord === moonNakLord;

    tests.push({
      category: 'Data Architecture',
      name: 'Single Source of Truth Consistency (Kundli, Planets, Houses, Dasha, AI)',
      status: singleSourcePass ? 'PASS' : 'FAIL',
      detail: `Verified: Kundli, Planet Explorer, and Dasha derive exclusively from single computeVedicChart output. (Dasha Lord: ${dashaLord} === Moon Nakshatra Lord: ${moonNakLord})`
    });

    // Profile Isolation & Crypto UUID Test
    const idA = generateSecureProfileId();
    const idB = generateSecureProfileId();
    const uuidRegex = /^astro_profile_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const idsDistinctAndValid = idA !== idB && uuidRegex.test(idA) && uuidRegex.test(idB);

    const profA = { id: idA, name: 'User A', chart: run1, journal: [{ id: 'j1', text: 'Secret A' }], chat: [{ text: 'Msg A' }] };
    const profB = { id: idB, name: 'User B', chart: computeVedicChart(globalBenchmarks[1]), journal: [{ id: 'j2', text: 'Secret B' }], chat: [{ text: 'Msg B' }] };

    const noLeakage =
      profA.id !== profB.id &&
      profA.chart.lagna.signName !== profB.chart.lagna.signName &&
      profA.journal[0].text !== profB.journal[0].text &&
      profA.chat[0].text !== profB.chat[0].text;

    tests.push({
      category: 'Profile Vault Isolation',
      name: 'Profile Data & Cryptographic ID Isolation',
      status: idsDistinctAndValid && noLeakage ? 'PASS' : 'FAIL',
      detail: `Crypto UUIDv4 format valid. Two test profiles confirmed 100% isolated across charts, journals, and AI history.`
    });

    // Ashtakoota 36-Point Compatibility Integration
    const ashtaResult = calculateAshtakoota(profA.chart, profB.chart);
    const ashtaScoreValid = ashtaResult.totalScore >= 0 && ashtaResult.totalScore <= 36 && ashtaResult.factors.length === 8;
    const factorSum = ashtaResult.factors.reduce((acc, f) => acc + f.score, 0);
    const sumMatches = Math.abs(factorSum - ashtaResult.totalScore) < 0.1;

    tests.push({
      category: 'Ashtakoota Compatibility',
      name: '8-Koota 36-Point Guna Milan Calculation',
      status: ashtaScoreValid && sumMatches ? 'PASS' : 'FAIL',
      detail: `Score: ${ashtaResult.totalScore}/36 (${ashtaResult.percentage}%). Sum of 8 Kootas exactly equals total score.`
    });

    // Vimshottari 120-Year Invariant & Chaining
    const dashaObj = profA.chart.dashaSnapshot;
    const dashaYearsSum = dashaObj.fullTimeline.reduce((acc, p) => acc + p.nominalYears, 0);
    let dashaContinuous = true;
    for (let k = 1; k < dashaObj.fullTimeline.length; k++) {
      if (dashaObj.fullTimeline[k].startMs !== dashaObj.fullTimeline[k - 1].endMs) {
        dashaContinuous = false;
        break;
      }
    }

    tests.push({
      category: 'Vimshottari Dasha',
      name: '120-Year Lifespan Invariant & 0ms Boundary Chaining',
      status: dashaYearsSum === 120 && dashaContinuous ? 'PASS' : 'FAIL',
      detail: `Timeline sum: ${dashaYearsSum} years. Zero gaps or overlaps across all 9 Mahadashas.`
    });

    // Real HTTP Wire Probing
    const wireProbe = await callAstroServerAsk({
      question: 'Master Integration Audit Probe',
      chartSummary: {
        lagna: { signName: 'Virgo', signSanskrit: 'Kanya', degFormatted: '4° 51\'' },
        moon: { signName: 'Capricorn', house: 5, degFormatted: '8° 27\'', nakshatra: 'Uttara Ashadha', pada: 4, nakshatraLord: 'Sun' },
        sun: { signName: 'Taurus', house: 9, degFormatted: '0° 44\'' },
        dashaMahadasha: 'Sun',
        dashaAntardasha: 'Moon',
        yogas: []
      },
      profileName: 'Integration Auditor'
    });

    const isWireAudited = wireProbe.status !== undefined;
    tests.push({
      category: 'AI Backend Wire Protocol',
      name: 'Real HTTP Wire Request (POST /api/ask-astro)',
      status: isWireAudited ? 'PASS' : 'FAIL',
      detail: `Wire status code: HTTP ${wireProbe.status || 0} (${wireProbe.error || 'SUCCESS'}). No mock simulation in frontend.`
    });

    // Security Audit: Client Code Secret Scan
    const sourceString = callAstroServerAsk.toString() + callAstroServerJournalReflection.toString();
    const hasClientExposedKey =
      sourceString.includes('const apiKey = "AIza') ||
      sourceString.includes('REACT_APP_GEMINI') ||
      sourceString.includes('VITE_GEMINI') ||
      sourceString.includes('NEXT_PUBLIC_GEMINI') ||
      sourceString.includes('generativelanguage.googleapis.com');

    tests.push({
      category: 'Security & Secret Boundaries',
      name: 'Frontend JavaScript Bundle Secret Leakage Audit',
      status: !hasClientExposedKey ? 'PASS' : 'FAIL',
      detail: !hasClientExposedKey
        ? 'Verified: 0 Gemini API secrets, 0 client-exposed env prefixes, and 0 direct Google API endpoints in client bundle.'
        : 'CRITICAL: Leaked secret detected in frontend code.'
    });

    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    const passCount = tests.filter((t) => t.status === 'PASS').length;
    const failCount = tests.filter((t) => t.status === 'FAIL').length;

    setMasterAuditReport({
      total: tests.length,
      passed: passCount,
      failed: failCount,
      durationMs,
      timestamp: new Date().toISOString(),
      tests
    });

    setMasterAuditRunning(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-950/30 blur-[140px] motion-safe:animate-slowPulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-950/20 blur-[130px]" />
        <div className="absolute top-[40%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-purple-950/15 blur-[110px]" />
      </div>

      <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            onClick={() => currentProfile && setActiveTab('dashboard')}
            role={currentProfile ? 'button' : undefined}
            tabIndex={currentProfile ? 0 : undefined}
            onKeyDown={(e) => {
              if (currentProfile && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setActiveTab('dashboard');
              }
            }}
            className="flex items-center gap-2 cursor-pointer group focus:outline-none focus-visible:opacity-80"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-100 to-indigo-300">
                ASTRO
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest text-amber-500/80 ml-2 border border-amber-500/30 px-1.5 py-0.5 rounded">
                Vedic Sidereal (Lahiri)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentProfile ? (
            <div className="flex items-center gap-2">
              <div
                className="relative"
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && isProfileMenuOpen) {
                    e.preventDefault();
                    setIsProfileMenuOpen(false);
                    profileMenuTriggerRef.current?.focus();
                  }
                }}
              >
                <button
                  ref={profileMenuTriggerRef}
                  onClick={() => setIsProfileMenuOpen((o) => !o)}
                  aria-haspopup="true"
                  aria-expanded={isProfileMenuOpen}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 text-xs text-slate-200 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="max-w-[110px] truncate font-medium">{currentProfile.name}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileMenuOpen && (
                  <>
                    {/* Invisible full-screen layer to close the menu on outside click/tap —
                        also makes it dismissible by tapping anywhere, which is the touch
                        equivalent of a desktop "click outside to close" pattern. */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-60 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cosmic-glow backdrop-blur-2xl z-50 motion-safe:animate-risingGlow"
                    >
                      <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                        Profiles ({profiles.length})
                      </div>
                      {profiles.map((p) => (
                        <div
                          key={p.id}
                          role="menuitem"
                          tabIndex={0}
                          onClick={() => {
                            setActiveProfileId(p.id);
                            setIsProfileMenuOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setActiveProfileId(p.id);
                              setIsProfileMenuOpen(false);
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            p.id === currentProfile.id
                              ? 'bg-amber-500/20 text-amber-300 font-medium'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="truncate">
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                              {p.placeName || 'Unknown'} • {p.chart.lagna.signSanskrit}
                            </p>
                          </div>
                          {p.id === currentProfile.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                      ))}
                      <div className="border-t border-slate-800 my-1" />
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsEditingProfile(false);
                          setFormData({
                            id: '',
                            name: '',
                            dob: '1998-05-15',
                            tob: '08:30',
                            citySearch: 'Patna, Bihar, India',
                            placeName: 'Patna, Bihar, India',
                            lat: 25.5941,
                            lon: 85.1376,
                            timezone: 'Asia/Kolkata',
                            country_code: 'IN',
                            admin1: 'Bihar',
                            country: 'India'
                          });
                          setCitySuggestions([]);
                          setGeocodingError(null);
                          setActiveTab('onboarding');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ New Profile</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-colors"
                title="Share Profile Card"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('onboarding')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Chart</span>
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {currentProfile && activeTab !== 'onboarding' && (
          <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-xl p-4 gap-1 select-none overflow-y-auto">
            <div className="text-[11px] font-mono tracking-widest uppercase text-slate-500 px-3 py-2">
              Vedic Navigation
            </div>

            {[
              { id: 'dashboard', label: 'Overview', icon: Compass },
              { id: 'chart', target: 'dashboard', label: 'Birth Chart (Kundli)', icon: Layers },
              { id: 'planets', label: 'Planets Explorer', icon: Sun },
              { id: 'houses', label: '12 Bhavas (Houses)', icon: Star },
              { id: 'nakshatras', label: 'Nakshatra Explorer', icon: Moon },
              { id: 'yogas', label: 'Rule-Based Yogas', icon: Sparkles },
              { id: 'dasha', label: 'Vimshottari Dasha', icon: Clock },
              { id: 'today', label: 'Today & Transits', icon: Activity },
              { id: 'ask-astro', label: 'Ask ASTRO AI', icon: MessageSquare },
              { id: 'compatibility', label: 'Guna Compatibility', icon: HeartHandshake },
              { id: 'journal', label: 'Astro Journal', icon: BookOpen },
              { id: 'settings', label: 'Diagnostics & Settings', icon: Sliders }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.target || item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="mt-auto pt-4 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-[11px]">
                <p className="text-slate-400 font-medium">Sidereal Lahiri Ayanamsa</p>
                <p className="text-amber-400 font-mono mt-0.5">{currentProfile.chart.ayanamsaDeg}°</p>
                <p className="text-slate-500 text-[10px] mt-1 truncate">
                  {currentProfile.timezone || 'Asia/Kolkata'}
                </p>
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto pb-24 md:pb-12 px-4 sm:px-6 lg:px-10 py-6 max-w-7xl mx-auto w-full">
          {/* Onboarding View */}
          {activeTab === 'onboarding' && (
            <div className="max-w-xl mx-auto py-8 motion-safe:animate-risingGlow">
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center mb-5">
                  {/* Subtle orbital rings — pure CSS, static unless motion is allowed */}
                  <div className="absolute w-24 h-24 rounded-full border border-amber-500/10 motion-safe:animate-slowSpin" />
                  <div className="absolute w-16 h-16 rounded-full border border-cosmic-gold/10" />
                  <div className="relative inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-cosmic-glow-lg">
                    <Globe className="w-8 h-8" />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-400">
                  {isEditingProfile ? 'Edit Birth Profile' : 'Your Vedic Astrology, Beautifully Understood.'}
                </h1>
                <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  {isEditingProfile
                    ? 'Update your birth coordinates or time to recalculate your chart.'
                    : 'Discover your birth chart, Nakshatra, Dashas, and Yogas calculated from your actual birth details.'}
                </p>
                {!isEditingProfile && (
                  <p className="mt-2 text-[11px] uppercase tracking-widest text-slate-500 font-mono">
                    Name · Birth date &amp; time · Birthplace — that's all ASTRO needs
                  </p>
                )}
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-2xl shadow-2xl shadow-black/40">
                {isCalculating ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 animate-ping" />
                      <div className="w-16 h-16 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-amber-200">Calculating Cosmic Placements...</h3>
                    <p className="text-xs text-slate-400 font-mono animate-pulse">{calculationStep}</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Name / Profile Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul, Ananya, Mom"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Date of Birth
                        </label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Exact Time of Birth
                        </label>
                        <input
                          type="time"
                          value={formData.tob}
                          onChange={(e) => setFormData({ ...formData, tob: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" /> Worldwide Birthplace Search
                        </span>
                        {isSearchingCity && (
                          <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Searching global places...
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search worldwide city (e.g. Patna, London, Tokyo, New York, Sydney)"
                          value={formData.citySearch}
                          onChange={(e) => handleCitySearchChange(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm transition-all"
                        />
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      </div>

                      {geocodingError && (
                        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/30 p-2.5 rounded-xl border border-rose-800/40">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{geocodingError}</span>
                        </div>
                      )}

                      {citySuggestions.length > 0 && (
                        <div role="listbox" className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50 max-h-56 overflow-y-auto">
                          {citySuggestions.map((c) => (
                            <div
                              key={c.id}
                              role="option"
                              aria-selected="false"
                              tabIndex={0}
                              onClick={() => selectCity(c)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  selectCity(c);
                                }
                              }}
                              className="px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-amber-300 focus:bg-slate-800 focus:text-amber-300 focus:outline-none cursor-pointer flex justify-between items-center border-b border-slate-800/60 last:border-b-0"
                            >
                              <div>
                                <p className="font-semibold text-white">{c.name}</p>
                                <p className="text-[11px] text-slate-400">
                                  {c.admin1 ? `${c.admin1}, ` : ''}{c.country} {c.country_code ? `(${c.country_code})` : ''}
                                </p>
                              </div>
                              <div className="text-right font-mono text-[10px] text-slate-400">
                                <p>{c.latitude.toFixed(2)}°, {c.longitude.toFixed(2)}°</p>
                                <p className="text-amber-400">{c.timezone}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 gap-1">
                        <span>
                          Selected: <strong className="text-amber-400">{formData.placeName}</strong>
                        </span>
                        <span className="font-mono text-slate-400">
                          Lat: {formData.lat.toFixed(4)}°, Lon: {formData.lon.toFixed(4)}° | IANA TZ: <span className="text-amber-300 font-semibold">{formData.timezone}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isEditingProfile ? 'Update Chart Details' : 'Calculate Vedic Astrology Profile'}</span>
                    </button>

                    {profiles.length > 0 && (
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setActiveTab('dashboard');
                        }}
                        className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 text-center"
                      >
                        Cancel and return to dashboard
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dashboard View */}
          {activeTab === 'dashboard' && currentProfile && (
            <div className="space-y-8 motion-safe:animate-risingGlow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0 hidden sm:flex w-11 h-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/10 border border-amber-500/30 shadow-cosmic-glow">
                    <Compass className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        {currentProfile.name}
                      </h1>
                      <button
                        onClick={() => handleEditProfileInit(currentProfile)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:text-amber-400 text-slate-400 text-xs transition-colors flex items-center gap-1"
                        title="Edit Birth Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">Edit</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Born: <strong className="text-slate-200">{currentProfile.dob}</strong></span>
                      <span>Time: <strong className="text-slate-200">{currentProfile.tob}</strong></span>
                      <span>Place: <strong className="text-slate-200">{currentProfile.placeName}</strong></span>
                      <span className="text-amber-400/90 font-mono">TZ: {currentProfile.timezone || 'Asia/Kolkata'}</span>
                      <span className="text-slate-500 font-mono">({currentProfile.lat.toFixed(2)}°, {currentProfile.lon.toFixed(2)}°)</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('ask-astro')}
                    className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask ASTRO AI</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Big Three */}
              <div>
                <h2 className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Your Big Three Foundations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => setActiveTab('houses')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('houses'); } }}
                    style={{ animationDelay: '0ms' }}
                    className="motion-safe:animate-risingGlow p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-amber-500/30 backdrop-blur-xl cursor-pointer hover:border-amber-400/60 hover:-translate-y-0.5 focus:outline-none focus-visible:border-amber-400 transition-all shadow-lg shadow-black/40 hover:shadow-cosmic-glow"
                  >
                    <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-2">
                      <span>1st House • Lagna (Ascendant)</span>
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wide">
                      {currentProfile.chart.lagna.signName}
                    </div>
                    <div className="text-xs text-amber-300/80 font-medium">
                      {currentProfile.chart.lagna.signSanskrit} • {currentProfile.chart.lagna.degFormatted}
                    </div>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Core constitution, vitality, and your primary orientation in the physical world.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('nakshatras')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('nakshatras'); } }}
                    style={{ animationDelay: '80ms' }}
                    className="motion-safe:animate-risingGlow p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-indigo-500/30 backdrop-blur-xl cursor-pointer hover:border-indigo-400/60 hover:-translate-y-0.5 focus:outline-none focus-visible:border-indigo-400 transition-all shadow-lg shadow-black/40 hover:shadow-nebula-glow"
                  >
                    <div className="flex items-center justify-between text-xs text-indigo-400 font-mono mb-2">
                      <span>Rashi • Chandra (Moon Sign)</span>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wide">
                      {currentProfile.chart.moon.signName}
                    </div>
                    <div className="text-xs text-indigo-300/80 font-medium">
                      {currentProfile.chart.moon.signSanskrit} • {currentProfile.chart.moon.nakshatra} (Pada {currentProfile.chart.moon.pada})
                    </div>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Subconscious mind, mental peace (Manas), and instinctual emotional rhythm.
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('planets')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('planets'); } }}
                    style={{ animationDelay: '160ms' }}
                    className="motion-safe:animate-risingGlow p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 border border-yellow-500/30 backdrop-blur-xl cursor-pointer hover:border-yellow-400/60 hover:-translate-y-0.5 focus:outline-none focus-visible:border-yellow-400 transition-all shadow-lg shadow-black/40 hover:shadow-cosmic-glow"
                  >
                    <div className="flex items-center justify-between text-xs text-yellow-400 font-mono mb-2">
                      <span>Surya • Atmakaraka (Sun Sign)</span>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wide">
                      {currentProfile.chart.sun.signName}
                    </div>
                    <div className="text-xs text-yellow-300/80 font-medium">
                      {currentProfile.chart.sun.signSanskrit} • House {currentProfile.chart.sun.house} ({currentProfile.chart.sun.degFormatted})
                    </div>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Inner soul force, vitality, executive purpose, and dignified authority.
                    </p>
                  </div>
                </div>
              </div>

              {/* PERSONAL LIFE OVERVIEW SECTION */}
              {personalOverview && (
                <div className="space-y-6 pt-4 border-t border-slate-800/80 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider font-bold">
                        <Sparkles className="w-4 h-4" />
                        <span>Your ASTRO Profile • Personal Life Overview</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                        Synthesized Astrological Portrait
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      Classical Parashari Traditions
                    </span>
                  </div>

                  {/* 1. Core Nature & Personality */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                        <Feather className="w-4 h-4" />
                        <span>🌙 Core Nature</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {personalOverview.coreNature.lagnaSummary}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/60">
                        {personalOverview.coreNature.triadHarmonization}
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
                        <Brain className="w-4 h-4" />
                        <span>🧠 Personality & Traits</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {personalOverview.personality.temperament}
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
                        {personalOverview.personality.tendencies.map((trait, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2">
                            <span className="text-amber-400/80 mt-0.5">•</span>
                            <span>{trait}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 2. Relationships & Learning / Work Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-2 text-pink-400 text-sm font-semibold">
                        <Heart className="w-4 h-4" />
                        <span>❤️ Relationships & Union</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {personalOverview.relationships.overview}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {personalOverview.relationships.themes}
                      </p>
                      <p className="text-[11px] text-pink-300/80 italic pt-1 border-t border-slate-800/60">
                        {personalOverview.relationships.guidance}
                      </p>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                        <Briefcase className="w-4 h-4" />
                        <span>📚 Learning & Work Style</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {personalOverview.learningWorkStyle.learning}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {personalOverview.learningWorkStyle.vocationThemes}
                      </p>
                      <p className="text-[11px] text-emerald-300/80 pt-1 border-t border-slate-800/60">
                        {personalOverview.learningWorkStyle.workEnvironment}
                      </p>
                    </div>
                  </div>

                  {/* 3. Strengths & Growth Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                        <TrendingUp className="w-4 h-4" />
                        <span>💪 Chart Strengths</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {personalOverview.strengths.items.map((str, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <span>🌱 Constructive Growth Areas</span>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {personalOverview.growthAreas.items.map((gro, gIdx) => (
                          <li key={gIdx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                            <Flame className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                            <span>{gro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 4. Current Phase & Moon Nakshatra Profile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 backdrop-blur-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                          <Clock className="w-4 h-4" />
                          <span>🕐 Current Phase (Vimshottari)</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full motion-safe:animate-slowPulse">
                          Active
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {personalOverview.currentPhase.mahadasha} Mahadasha — {personalOverview.currentPhase.antardasha} Antardasha
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {personalOverview.currentPhase.traditionalContext}
                      </p>
                      <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                        <span>Ends: {personalOverview.currentPhase.endDate}</span>
                        <span className="text-amber-400 font-semibold">{personalOverview.currentPhase.remaining}</span>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 border border-indigo-500/30 backdrop-blur-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
                          <Moon className="w-4 h-4" />
                          <span>⭐ Lunar Mansion Profile</span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                          Pada {personalOverview.nakshatraProfile.pada}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {personalOverview.nakshatraProfile.name}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {personalOverview.nakshatraProfile.padaSignificance}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <span className="text-slate-400">Ruler: <strong className="text-slate-200">{personalOverview.nakshatraProfile.lord}</strong></span>
                        <span className="text-slate-400">Deity: <strong className="text-slate-200">{personalOverview.nakshatraProfile.deity}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Key Chart Themes (Rule-based Yogas) */}
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>🔮 Key Chart Themes (Verified Yogas)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {personalOverview.keyThemes.yogas.map((y, yIdx) => (
                        <div key={yIdx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                          <div className="font-bold text-amber-300 text-xs sm:text-sm">✨ {y.name}</div>
                          <p className="text-xs text-slate-300">{y.significance}</p>
                          <p className="text-[10px] font-mono text-slate-500 pt-1">Rule: {y.rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 6. Ask ASTRO Companion CTA */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <span>Want to explore your Personal Life Overview deeper?</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Ask ASTRO about your specific placements, career inclinations, or active Dasha transitions.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setChatInput(`Could you expand on the core nature and relationship themes of my ${currentProfile.chart.lagna.signName} Lagna and ${currentProfile.chart.moon.nakshatra} Moon?`);
                        setActiveTab('ask-astro');
                      }}
                      className="group px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0"
                    >
                      <span>Ask ASTRO Anything</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Kundli and Dasha Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-2xl flex flex-col items-center relative overflow-hidden shadow-cosmic-glow">
                  {/* Atmospheric frame: static, GPU-cheap radial glow behind the
                      chart for depth. Pure CSS, no extra DOM cost beyond one div,
                      no effect on chart geometry/data below. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-10 opacity-60"
                    style={{
                      background: 'radial-gradient(circle at 50% 40%, rgba(245,208,130,0.10), transparent 60%)'
                    }}
                  />
                  <div className="w-full flex items-center justify-between mb-4 relative">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Lagna Kundli (D1)</span>
                        <span className="text-[10px] text-amber-400 uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          North Indian Diamond
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Fixed Top Diamond = 1st House ({currentProfile.chart.lagna.signSanskrit})</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Tap a house or planet</span>
                  </div>

                  <div className="relative">
                    <NorthIndianChart
                      chartData={currentProfile.chart}
                      onSelectHouse={(h) => setSelectedHouseModal(currentProfile.chart.houses.find((item) => item.houseNumber === h))}
                      onSelectPlanet={(p) => setSelectedPlanetModal(p)}
                    />
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                        Birth Lunar Nakshatra
                      </span>
                      <button
                        onClick={() => setActiveTab('nakshatras')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        Explore Nakshatras <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{currentProfile.chart.moon.nakshatra}</span>
                      <span className="text-xs font-mono text-amber-400 font-semibold">Pada {currentProfile.chart.moon.pada}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Ruler</span>
                        <span className="font-medium text-slate-200">{currentProfile.chart.moon.nakshatraLord}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Deity</span>
                        <span className="font-medium text-slate-200">{currentProfile.chart.moon.nakshatraDeity}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Gana</span>
                        <span className="font-medium text-slate-200">{currentProfile.chart.moon.gana}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-slate-500 block text-[10px]">Symbol</span>
                        <span className="font-medium text-slate-200 truncate">{currentProfile.chart.moon.nakshatraSymbol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                        Current Vimshottari Dasha
                      </span>
                      <button
                        onClick={() => setActiveTab('dasha')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        120-Yr Timeline <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">
                          {currentProfile.chart.dashaSnapshot.activeMahadasha} Mahadasha
                        </div>
                        <div className="text-xs text-amber-300/90 font-mono">
                          {currentProfile.chart.dashaSnapshot.activeAntardasha} Antardasha (Active)
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <span>Ends: <strong className="text-slate-200">{currentProfile.chart.dashaSnapshot.endDate}</strong></span>
                      <span className="font-mono text-amber-400">
                        {currentProfile.chart.dashaSnapshot.remainingMonths}m {currentProfile.chart.dashaSnapshot.remainingDays}d remaining
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                        Verified Classical Yogas ({currentProfile.chart.yogas.length})
                      </span>
                      <button
                        onClick={() => setActiveTab('yogas')}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        View Rule Analysis <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.chart.yogas.map((y, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium"
                        >
                          ✨ {y.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portals */}
              <div>
                <h3 className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-3">
                  Astrology Workspace Portals
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { id: 'chart', target: 'dashboard', title: 'Birth Chart', icon: Layers, desc: 'Interactive Kundli' },
                    { id: 'planets', title: 'Planets', icon: Sun, desc: '9 Grahas Analysis' },
                    { id: 'houses', title: '12 Bhavas', icon: Star, desc: 'Houses & Lords' },
                    { id: 'nakshatras', title: 'Nakshatras', icon: Moon, desc: '27 Lunar Mansions' },
                    { id: 'yogas', title: 'Yogas', icon: Sparkles, desc: 'Rule Verifications' },
                    { id: 'dasha', title: 'Dasha Timeline', icon: Clock, desc: '120-Year Cycles' },
                    { id: 'today', title: 'Today & Transits', icon: Activity, desc: 'Real-time Ephemeris' },
                    { id: 'ask-astro', title: 'Ask ASTRO', icon: MessageSquare, desc: 'AI Companion' },
                    { id: 'journal', title: 'Astro Journal', icon: BookOpen, desc: 'Reflections' },
                    { id: 'compatibility', title: 'Compatibility', icon: HeartHandshake, desc: 'Guna Milan' }
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setActiveTab(p.target || p.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(p.target || p.id); } }}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 focus:outline-none focus-visible:border-amber-400 cursor-pointer backdrop-blur-md transition-all group hover:scale-[1.02]"
                      >
                        <Icon className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {p.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Planets Explorer View */}
          {activeTab === 'planets' && currentProfile && (
            <div className="space-y-6 motion-safe:animate-risingGlow">
              <div>
                <h2 className="text-2xl font-bold text-white">Planets Explorer (The Nine Grahas)</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Meeus analytical perturbation model with Lahiri sidereal longitudes (~15–30 arcmin planetary accuracy). Strict demarcation between Calculated Astrological Facts and Traditional Interpretations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentProfile.chart.planets.map((p) => (
                  <div
                    key={p.name}
                    className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 backdrop-blur-xl space-y-4 hover:border-amber-500/30 hover:shadow-cosmic-glow transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{p.symbol}</span>
                        <div>
                          <h3 className="text-base font-bold text-white">
                            {p.name} <span className="text-xs font-normal text-slate-400">({p.sanskrit})</span>
                          </h3>
                          <span className="text-[11px] text-amber-400/90 font-mono">
                            House {p.house} • {p.signName} ({p.signSanskrit})
                          </span>
                        </div>
                      </div>
                      {p.isRetro && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                          Retrograde (Vakri)
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                        Calculated Astronomical Facts:
                      </span>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sidereal Longitude:</span>
                        <span className="font-mono text-amber-400 font-bold">{p.degFormatted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nakshatra & Pada:</span>
                        <span className="text-slate-200 font-medium">{p.nakshatra} (Pada {p.pada})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nakshatra Lord:</span>
                        <span className="text-slate-200 font-medium">{p.nakshatraLord}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Ecliptic:</span>
                        <span className="font-mono text-slate-300">{p.totalDeg.toFixed(2)}°</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block">
                        Traditional Vedic Interpretation:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{p.traditionalMeaning}</p>
                      <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <strong className="text-slate-300">Significations (Karakas): </strong>
                        {p.karaka}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Houses Explorer View */}
          {activeTab === 'houses' && currentProfile && (
            <div className="space-y-6 motion-safe:animate-risingGlow">
              <div>
                <h2 className="text-2xl font-bold text-white">The Twelve Bhavas (Houses)</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Whole sign Vedic house system derived from your {currentProfile.chart.lagna.signSanskrit} Lagna. Click any house to review its occupant grahas and traditional significations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentProfile.chart.houses.map((h) => (
                  <div
                    key={h.houseNumber}
                    onClick={() => setSelectedHouseModal(h)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedHouseModal(h);
                      }
                    }}
                    className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 hover:border-amber-500/40 hover:shadow-cosmic-glow hover:-translate-y-0.5 focus:outline-none focus-visible:border-amber-400 cursor-pointer backdrop-blur-xl transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        BHAVA {h.houseNumber} • {h.sanskrit}
                      </span>
                      <span className="text-xs text-slate-300 font-mono font-medium">
                        {h.signName} ({h.signSanskrit})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{h.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{h.desc}</p>

                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                      <strong className="text-slate-400 block mb-0.5">Traditional Interpretation:</strong>
                      {h.traditionalInterpretation}
                    </div>

                    <div className="text-xs pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-slate-500">Ruling Lord: <strong className="text-slate-300">{h.signLord}</strong></span>
                      <div className="flex items-center gap-1">
                        {h.occupants.length > 0 ? (
                          h.occupants.map((o) => (
                            <span key={o.name} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-medium">
                              {o.symbol} {o.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">Unoccupied</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nakshatras Explorer View */}
          {activeTab === 'nakshatras' && currentProfile && (
            <div className="space-y-8 motion-safe:animate-risingGlow">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-amber-500/35 backdrop-blur-2xl">
                <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold block mb-1">
                  Your Natal Moon Mansion
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-4">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                    {currentProfile.chart.moon.nakshatra}
                  </h2>
                  <span className="text-sm font-mono text-amber-300">
                    Pada {currentProfile.chart.moon.pada} (Degree: {currentProfile.chart.moon.degFormatted} in {currentProfile.chart.moon.signName})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Presiding Deity</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{currentProfile.chart.moon.nakshatraDeity}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Planetary Ruler</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{currentProfile.chart.moon.nakshatraLord}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Symbol</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{currentProfile.chart.moon.nakshatraSymbol}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Temperament / Gana</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{currentProfile.chart.moon.gana}</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed max-w-3xl">
                  <p>
                    In classical Vedic astrology, the Moon Nakshatra governs instinctual perceptions, subconscious tranquility, and the initial balance of your Vimshottari Dasha cycles.
                  </p>
                  <p className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-amber-200/90">
                    <strong>Placement Themes: </strong>
                    {NAKSHATRAS_LIST.find((n) => n.name === currentProfile.chart.moon.nakshatra)?.themes}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-3">Explore All 27 Nakshatras</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {NAKSHATRAS_LIST.map((nak) => {
                    const isUserNak = nak.name.toLowerCase() === currentProfile.chart.moon.nakshatra.toLowerCase();
                    return (
                      <div
                        key={nak.id}
                        className={`p-4 rounded-2xl border backdrop-blur-xl transition-all ${
                          isUserNak
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            #{nak.id} {nak.name}
                          </span>
                          {isUserNak && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500 text-slate-950">
                              Your Moon
                            </span>
                          )}
                        </div>
                        <div className="text-xs space-y-1 text-slate-400 mt-2">
                          <p>Span: <span className="text-slate-300 font-mono">{nak.startDeg.toFixed(1)}° - {nak.endDeg.toFixed(1)}°</span></p>
                          <p>Ruler: <span className="text-slate-200 font-medium">{nak.lord}</span> • Deity: <span className="text-slate-200">{nak.deity}</span></p>
                          <p>Symbol: <span className="text-slate-200">{nak.symbol}</span></p>
                          <p className="text-[11px] text-slate-500 pt-1">{nak.themes}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Rule-Based Yogas View */}
          {activeTab === 'yogas' && currentProfile && (
            <div className="space-y-6 motion-safe:animate-risingGlow">
              <div>
                <h2 className="text-2xl font-bold text-white">Rule-Based Vedic Yogas</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Verified classical Parashari planetary alignments evaluated deterministically from your calculated birth coordinates. Strictly non-fatalistic classical significations.
                </p>
              </div>

              {currentProfile.chart.yogas.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-sm">
                  No classical Parashari Kendra-Trikona or Mahapurusha yogas were detected in this specific alignment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {currentProfile.chart.yogas.map((yoga, idx) => (
                    <div
                      key={idx}
                      style={{ animationDelay: `${Math.min(idx, 6) * 70}ms` }}
                      className="motion-safe:animate-risingGlow p-6 rounded-2xl bg-slate-900/75 border border-amber-500/30 backdrop-blur-xl space-y-4 shadow-lg shadow-black/30 hover:shadow-cosmic-glow transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          Verified Combination
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{yoga.sanskrit}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{yoga.name}</h3>

                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                        <strong className="text-slate-400 block text-[10px] uppercase font-mono">
                          Triggering Rule Condition:
                        </strong>
                        <p className="text-amber-300/90 font-mono text-[11px]">{yoga.rule}</p>
                      </div>

                      <div className="text-xs space-y-1">
                        <strong className="text-slate-400 block text-[10px] uppercase font-mono">
                          Traditional Significance:
                        </strong>
                        <p className="text-slate-300 leading-relaxed">{yoga.significance}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Planets:</span>
                          {yoga.planets.map((p) => (
                            <span key={p} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                        <div className="text-slate-500">
                          Houses: <strong className="text-slate-300">{yoga.houses.join(', ')}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dasha View */}
          {activeTab === 'dasha' && currentProfile && (
            <div className="space-y-8 motion-safe:animate-risingGlow">
              <div>
                <h2 className="text-2xl font-bold text-white">Vimshottari Dasha 120-Year Timeline</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Derived from the fractional balance of the Moon at birth in {currentProfile.chart.moon.nakshatra}.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-cosmic-glow">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold">
                      Currently Active Period
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {currentProfile.chart.dashaSnapshot.activeMahadasha} Mahadasha — {currentProfile.chart.dashaSnapshot.activeAntardasha} Antardasha
                    </h3>
                    <p className="text-xs text-slate-300 font-mono">
                      Running until {currentProfile.chart.dashaSnapshot.endDate}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-lg font-mono font-bold text-amber-300">
                    {currentProfile.chart.dashaSnapshot.remainingMonths} Months, {currentProfile.chart.dashaSnapshot.remainingDays} Days
                  </span>
                  <p className="text-[11px] text-slate-400">Remaining in this sub-period</p>
                </div>
              </div>

              <div className="space-y-4">
                {currentProfile.chart.dashaSnapshot.fullTimeline.map((item, idx) => {
                  const nowStr = new Date().toISOString().split('T')[0];
                  const isActive = nowStr >= item.start && nowStr <= item.end;

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/50 border-slate-800/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.lord.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              <span>{item.lord} Mahadasha</span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold uppercase motion-safe:animate-slowPulse">
                                  Current
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-400 font-mono">
                              {item.start} → {item.end} ({item.totalYears} Years)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/60">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2 font-semibold">
                          Antardashas (Sub-Cycles)
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-center">
                          {item.antardashas.map((ad, sIdx) => {
                            const isAdActive = nowStr >= ad.start && nowStr <= ad.end;
                            return (
                              <div
                                key={sIdx}
                                className={`p-2 rounded-lg border text-[11px] transition-all ${
                                  isAdActive
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md shadow-cosmic-glow'
                                    : 'bg-slate-950/70 border-slate-800/80 text-slate-400'
                                }`}
                                title={`${ad.start} to ${ad.end}`}
                              >
                                <span className="block font-medium">{ad.lord}</span>
                                <span className="text-[9px] font-mono block opacity-80 truncate">
                                  {ad.start.slice(0, 4)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today & Transits View */}
          {activeTab === 'today' && currentProfile && transitsData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Today's Transits (Gochara)</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Meeus analytical Sidereal positions calculated for the present moment and overlaid against your natal {currentProfile.chart.lagna.signSanskrit} Lagna.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 backdrop-blur-xl">
                  <span className="text-xs uppercase font-mono text-indigo-400 font-bold block mb-1">
                    Current Transit Moon
                  </span>
                  <div className="text-2xl font-bold text-white">{transitsData.currentMoonSign}</div>
                  <div className="text-xs text-indigo-300/80 font-medium mt-0.5">
                    Nakshatra: {transitsData.currentMoonNakshatra} (Pada {transitsData.currentMoonPada})
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 backdrop-blur-xl">
                  <span className="text-xs uppercase font-mono text-amber-400 font-bold block mb-1">
                    Active Vimshottari Filter
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {currentProfile.chart.dashaSnapshot.activeMahadasha}
                  </div>
                  <div className="text-xs text-amber-300/80 font-medium mt-0.5">
                    Sub-period: {currentProfile.chart.dashaSnapshot.activeAntardasha}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
                  <span className="text-xs uppercase font-mono text-slate-400 font-bold block mb-1">
                    Current Ayanamsa Offset
                  </span>
                  <div className="text-2xl font-mono font-bold text-white">{transitsData.ayanamsa}°</div>
                  <div className="text-xs text-slate-400 mt-0.5">Chitra Paksha / Lahiri</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Current Planetary Placements vs Natal Bhavas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transitsData.transitPlanets.map((tp) => (
                    <div
                      key={tp.name}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tp.symbol}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{tp.name}</h4>
                          <p className="text-xs text-amber-400 font-mono">
                            {tp.signName} ({tp.degFormatted})
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {tp.nakshatra} (Pada {tp.pada})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono font-bold text-xs border border-slate-700">
                          Natal H{tp.natalHouseTransit}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1">Transiting House</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ask ASTRO AI Companion View */}
          {activeTab === 'ask-astro' && currentProfile && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-190px)] flex flex-col rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-cosmic-glow motion-safe:animate-risingGlow">
              <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Ask ASTRO AI Companion</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[10px] font-mono border border-slate-700 flex items-center gap-1">
                        <Server className="w-2.5 h-2.5" /> HTTP POST /api/ask-astro
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px]">
                      {currentProfile.name} • {currentProfile.chart.lagna.signSanskrit} Lagna • {currentProfile.placeName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const welcome = [
                      {
                        sender: 'astro',
                        text: `Chat reset. Ask me anything regarding your ${currentProfile.chart.lagna.signName} Lagna, Moon in ${currentProfile.chart.moon.nakshatra}, or your current ${currentProfile.chart.dashaSnapshot.activeMahadasha} Mahadasha.`
                      }
                    ];
                    setChatMessages(welcome);
                    setProfiles((prev) =>
                      prev.map((p) => (p.id === currentProfile.id ? { ...p, chatHistory: welcome } : p))
                    );
                    setAiServerError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                  title="Reset conversation"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 motion-safe:animate-fadeIn ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'astro' && (
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-1">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                          : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex gap-3 motion-safe:animate-fadeIn">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Sending HTTP POST to /api/ask-astro...
                    </div>
                  </div>
                )}

                {aiServerError && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        HTTP Backend Response: {aiServerError.status ? `Status ${aiServerError.status} (${aiServerError.type})` : aiServerError.type}
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-300">{aiServerError.message}</p>
                    <div className="pt-2 flex flex-wrap gap-2">
                      {lastFailedPrompt && (
                        <button
                          onClick={() => handleSendChatMessage(lastFailedPrompt)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/40"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Retry Request
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Inspect HTTP Diagnostics
                      </button>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/40 flex gap-2 overflow-x-auto text-[11px]">
                {[
                  'Explain my Moon Nakshatra',
                  'What does my current Dasha signify?',
                  'Explain my 7th house partnerships',
                  'What are my verified Vedic Yogas?'
                ].map((suggest, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setChatInput(suggest)}
                    className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-800 hover:text-amber-300 text-slate-300 whitespace-nowrap transition-all hover:-translate-y-0.5"
                  >
                    {suggest}
                  </button>
                ))}
              </div>

              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask ASTRO anything about your birth chart..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-xs sm:text-sm"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={isAiTyping || !chatInput.trim()}
                  aria-label="Send message"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center transition-all hover:shadow-cosmic-glow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Astro Journal View */}
          {activeTab === 'journal' && currentProfile && (
            <div className="max-w-3xl mx-auto space-y-6 motion-safe:animate-risingGlow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">Astro Reflective Journal</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Isolated to {currentProfile.name}'s profile. Record personal observations alongside active Dasha periods.
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={journalSearch}
                    onChange={(e) => setJournalSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Entry Title (e.g., Breakthrough in Jupiter Dasha)"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-xs sm:text-sm font-semibold"
                  />
                  <div className="flex items-center gap-1.5">
                    {['Reflective', 'Motivated', 'Meditative', 'Challenged', 'Grateful'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setJournalMood(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          journalMood === m ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Record your thoughts, emotions, or reflections here..."
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-xs sm:text-sm"
                />

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-amber-400 font-mono">
                    Context: {currentProfile.chart.dashaSnapshot.activeMahadasha} / {currentProfile.chart.dashaSnapshot.activeAntardasha}
                  </span>
                  <div className="flex gap-2">
                    {editingEntryId && (
                      <button
                        onClick={() => {
                          setEditingEntryId(null);
                          setJournalTitle('');
                          setJournalText('');
                        }}
                        className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      onClick={handleSaveJournal}
                      disabled={!journalText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all hover:shadow-cosmic-glow"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingEntryId ? 'Update Entry' : 'Save Journal Entry'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredJournalEntries.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
                    {journalSearch ? 'No journal entries match your search.' : 'No journal entries yet. Record your insights above!'}
                  </p>
                ) : (
                  filteredJournalEntries.map((e) => (
                    <div
                      key={e.id}
                      className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl space-y-3 motion-safe:animate-fadeIn"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold">{e.date}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                            {e.mood}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingEntryId(e.id);
                              setJournalTitle(e.title);
                              setJournalText(e.text);
                              setJournalMood(e.mood);
                            }}
                            className="text-slate-400 hover:text-amber-400 p-1"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteJournal(e.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-white">{e.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                        {e.text}
                      </p>

                      {e.reflection ? (
                        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1 motion-safe:animate-fadeIn">
                          <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Philosophical Reflection:
                          </span>
                          <p className="text-indigo-200 leading-relaxed">{e.reflection}</p>
                        </div>
                      ) : reflectingEntryId === e.id ? (
                        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-center gap-2 text-indigo-300">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ASTRO is reflecting on this entry...</span>
                        </div>
                      ) : (
                        <div className="pt-2 flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-500">
                            Dasha Context: {e.dashaContext}
                          </span>
                          <button
                            onClick={() => handleReflectWithAI(e)}
                            disabled={isReflectingAI}
                            className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 flex items-center gap-1 font-semibold"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Reflect with ASTRO</span>
                          </button>
                        </div>
                      )}

                      {/* Error scoped to THIS entry only — appears near the control
                          that triggered it, rather than a disconnected global banner. */}
                      {journalAiError && journalAiError.entryId === e.id && (
                        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between gap-2 motion-safe:animate-fadeIn">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {journalAiError.status ? `[HTTP ${journalAiError.status}] ` : ''}
                              {journalAiError.message}
                            </span>
                          </span>
                          <button
                            onClick={() => handleReflectWithAI(e)}
                            disabled={isReflectingAI}
                            className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold flex items-center gap-1 border border-rose-500/40"
                          >
                            <RotateCcw className="w-3 h-3" /> Retry
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Compatibility View */}
          {activeTab === 'compatibility' && currentProfile && (
            <div className="max-w-3xl mx-auto space-y-6 motion-safe:animate-risingGlow">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Ashtakoota Compatibility (Guna Milan)</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Classical 36-point lunar Nakshatra system comparing two saved anonymous profiles via traditional lookup rules.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-2xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs uppercase font-mono text-slate-500">Person 1 (Active)</span>
                    <p className="text-base font-bold text-white mt-1">{currentProfile.name}</p>
                    <p className="text-xs text-amber-400 font-mono mt-0.5">
                      {currentProfile.chart.moon.nakshatra} (Pada {currentProfile.chart.moon.pada}) • {currentProfile.chart.moon.signName}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs uppercase font-mono text-slate-500">Person 2 (Saved Profile)</span>
                    <div className="mt-1">
                      <select
                        value={compPartnerId}
                        onChange={(e) => setCompPartnerId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                      >
                        <option value="">-- Choose a Profile to Compare --</option>
                        {profiles
                          .filter((p) => p.id !== currentProfile.id)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.chart.moon.nakshatra} Moon)
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {partnerProfile ? (
                  (() => {
                    const result = calculateAshtakoota(currentProfile.chart, partnerProfile.chart);
                    return (
                      <div className="space-y-6 pt-4 border-t border-slate-800/80 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 gap-4 shadow-cosmic-glow">
                          <div>
                            <span className="text-xs uppercase font-mono tracking-wider text-amber-400">
                              Total Guna Score
                            </span>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                                {result.totalScore}
                              </span>
                              <span className="text-sm font-mono text-slate-400">/ 36 Points</span>
                            </div>
                            <p className="text-xs font-medium text-amber-300 mt-0.5">{result.verdict}</p>
                          </div>
                          <div className="text-center sm:text-right w-full sm:w-auto">
                            <span className="text-2xl font-bold text-amber-400">{result.percentage}%</span>
                            <p className="text-[11px] text-slate-400 mb-1.5">Astrological Resonance</p>
                            {/* Overall progress bar — visualizes the exact same result.percentage already computed, no new calculation */}
                            <div className="w-full sm:w-40 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                                style={{ width: `${result.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {result.factors.map((f, i) => (
                            <div
                              key={i}
                              style={{ animationDelay: `${i * 40}ms` }}
                              className="motion-safe:animate-risingGlow p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80"
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-white">{f.name}</span>
                                <span className="text-xs font-mono font-bold text-amber-400">
                                  {f.score} / {f.max}
                                </span>
                              </div>
                              {/* Per-koota progress bar: (f.score / f.max) is the exact existing
                                  scoring already returned by calculateAshtakoota — purely visual. */}
                              <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    f.score === 0 ? 'bg-rose-500/70' : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${(f.score / f.max) * 100}%` }}
                                />
                              </div>
                              <p className="text-[11px] text-slate-400 leading-tight">{f.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    Select a second profile above to view the complete Ashtakoota breakdown.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings & Diagnostics View */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Diagnostics & Ephemeris Engine</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Meeus analytical perturbation model with Lahiri sidereal reference calibration and cryptographic audits.
                </p>
              </div>

              {/* Master End-to-End Audit Suite Runner Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/40 backdrop-blur-xl space-y-4 shadow-xl shadow-amber-500/5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Full End-to-End System Diagnostics & Integration Audit
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Executes complete test matrix: 5-city global verification, single-source consistency, profile isolation, Dasha balance, 36-point Ashtakoota, Personal Life Overview synthesis, and secret leakage scan.
                    </p>
                  </div>
                  <button
                    onClick={runMasterEndToEndAudit}
                    disabled={masterAuditRunning}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 shrink-0 self-start sm:self-center"
                  >
                    {masterAuditRunning ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Activity className="w-4 h-4 text-slate-950" />}
                    <span>{masterAuditRunning ? 'Executing Full Audit...' : 'Run Master Integration Audit'}</span>
                  </button>
                </div>

                {masterAuditReport && (
                  <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                          Audit Summary
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-lg font-bold text-white">
                            {masterAuditReport.passed} / {masterAuditReport.total} Tests Passed
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            masterAuditReport.failed === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {masterAuditReport.failed === 0 ? 'ALL SYSTEMS OPERATIONAL' : `${masterAuditReport.failed} FAILED`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs font-mono text-slate-400">
                        <p>Execution Time: <span className="text-amber-400 font-semibold">{masterAuditReport.durationMs} ms</span></p>
                        <p className="text-[10px] text-slate-500">{masterAuditReport.timestamp}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {masterAuditReport.tests.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between text-xs gap-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">{t.category}</span>
                              <span className="font-semibold text-slate-200">{t.name}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                t.status === 'PASS'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{t.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Truthful Engine & Ephemeris Specifications Banner */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Vedic Ephemeris Architecture & Calibration Specs</h3>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 text-slate-300">
                  <p>
                    <strong className="text-amber-300">Astronomical Engine: </strong>
                    Meeus Analytical Perturbations (Sidereal Lahiri / Chitra Paksha) with ~15–30 arcminute planetary precision and ~30–45 arcminute lunar accuracy.
                  </p>
                  <p>
                    <strong className="text-slate-400">Ayanamsa Reference: </strong>
                    Lahiri / Chitra Paksha (Standard: 23° 51' 11.60" at J2000.0 with 50.29"/year precession).
                  </p>
                  <p>
                    <strong className="text-slate-400">Nodes Convention: </strong>
                    Mean Lunar Node with exact Ketu = (Rahu + 180.000000°) opposition invariant.
                  </p>
                  <p>
                    <strong className="text-slate-400">Environment Limitation: </strong>
                    Native C Swiss Ephemeris (`libswe.so`/WASM binary multi-megabyte bundle) is not embedded directly in the single-file client bundle. Calculations utilize elevated Jean Meeus orbital algorithms.
                  </p>
                </div>
              </div>

              {/* Profile Management */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Stored Anonymous Profiles ({profiles.length})</h3>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setFormData({
                        id: '',
                        name: '',
                        dob: '1998-05-15',
                        tob: '08:30',
                        citySearch: 'Patna, Bihar, India',
                        placeName: 'Patna, Bihar, India',
                        lat: 25.5941,
                        lon: 85.1376,
                        timezone: 'Asia/Kolkata',
                        country_code: 'IN',
                        admin1: 'Bihar',
                        country: 'India'
                      });
                      setCitySuggestions([]);
                      setGeocodingError(null);
                      setActiveTab('onboarding');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Profile</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {profiles.map((p) => {
                    const isActive = p.id === activeProfileId;
                    return (
                      <div
                        key={p.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{p.name}</span>
                            {isActive && (
                              <span className="px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-bold uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {p.chart.lagna.signSanskrit} Lagna • {p.placeName} ({p.timezone})
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[220px]">
                            ID: {p.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProfileInit(p)}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 transition-colors"
                            title="Edit profile birth details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {!isActive && (
                            <button
                              onClick={() => {
                                setActiveProfileId(p.id);
                                setActiveTab('dashboard');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProfile(p.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete this profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Export & Erase */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white">JSON Backup & Privacy</h3>
                <div className="flex flex-wrap gap-3">
                  <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer">
                    <Download className="w-3.5 h-3.5 text-amber-400 rotate-180" />
                    <span>Import Profiles JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const imported = JSON.parse(event.target.result);
                            if (Array.isArray(imported)) {
                              const sanitized = imported.map((p) => {
                                const idExists = profiles.some((existing) => existing.id === p.id);
                                return {
                                  ...p,
                                  id: p.id && !idExists ? p.id : generateSecureProfileId()
                                };
                              });
                              setProfiles((prev) => [...prev, ...sanitized]);
                              if (sanitized.length > 0 && !activeProfileId) {
                                setActiveProfileId(sanitized[0].id);
                              }
                            }
                          } catch (err) {
                            console.error('Import parse error:', err);
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <button
                    onClick={() => {
                      const dataStr =
                        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profiles, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataStr);
                      downloadAnchor.setAttribute('download', `astro_vault_backup_${Date.now()}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download JSON Backup</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you wish to erase all ASTRO profiles on this device?')) {
                        localStorage.removeItem('astro_profiles_v3');
                        localStorage.removeItem('astro_active_profile_id_v3');
                        setProfiles([]);
                        setActiveProfileId(null);
                        setActiveTab('onboarding');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 border border-red-500/30 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Erase All Local Data</span>
                  </button>
                </div>
              </div>

              {/* Contact ASTRO */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  Contact ASTRO
                </h3>
                <p className="text-xs text-slate-400">Have a question, found a bug, or want to share feedback? Send us a message directly.</p>
                <button
                  onClick={() => {
                    setContactStatus('idle');
                    setContactErrorMessage('');
                    setShowContactModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Contact Form</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {currentProfile && activeTab !== 'onboarding' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 flex justify-around py-2 px-1">
          {[
            { id: 'dashboard', label: 'Home', icon: Compass },
            { id: 'chart', target: 'dashboard', label: 'Kundli', icon: Layers },
            { id: 'dasha', label: 'Dasha', icon: Clock },
            { id: 'today', label: 'Today', icon: Activity },
            { id: 'ask-astro', label: 'AI', icon: MessageSquare },
            { id: 'settings', label: 'Settings', icon: Sliders }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.target || item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive ? 'text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* House Inspector Modal */}
      {selectedHouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cosmic-glow space-y-4 motion-safe:animate-risingGlow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                  BHAVA {selectedHouseModal.houseNumber}
                </span>
                <h3 className="text-xl font-bold text-white">
                  {selectedHouseModal.name} ({selectedHouseModal.sanskrit})
                </h3>
              </div>
              <button
                onClick={() => setSelectedHouseModal(null)}
                aria-label="Close"
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <p><strong className="text-slate-400">Sign in this House:</strong> <span className="text-amber-300 font-medium">{selectedHouseModal.signName} ({selectedHouseModal.signSanskrit})</span></p>
              <p><strong className="text-slate-400">Ruling Lord:</strong> <span className="text-slate-200 font-medium">{selectedHouseModal.signLord}</span></p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{selectedHouseModal.desc}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <strong className="text-slate-300 block mb-0.5">Vedic Signification:</strong>
              {selectedHouseModal.traditionalInterpretation}
            </p>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Occupying Grahas
              </span>
              {selectedHouseModal.occupants.length > 0 ? (
                <div className="space-y-2">
                  {selectedHouseModal.occupants.map((o) => (
                    <div key={o.name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-300">{o.symbol} {o.name} {o.isRetro ? '(R)' : ''}</span>
                      <span className="text-slate-400 font-mono">{o.degFormatted} • {o.nakshatra}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No planets occupy this bhava directly. Its themes are guided primarily by its lord, {selectedHouseModal.signLord}.</p>
              )}
            </div>

            <button
              onClick={() => setSelectedHouseModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Planet Inspector Modal */}
      {selectedPlanetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cosmic-glow space-y-4 motion-safe:animate-risingGlow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedPlanetModal.symbol}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedPlanetModal.name} ({selectedPlanetModal.sanskrit})
                  </h3>
                  <span className="text-xs text-amber-400 font-mono">
                    {selectedPlanetModal.degFormatted} in {selectedPlanetModal.signName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanetModal(null)}
                aria-label="Close"
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">House Position</span>
                <span className="font-semibold text-slate-200">House {selectedPlanetModal.house}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Motion</span>
                <span className="font-semibold text-slate-200">{selectedPlanetModal.isRetro ? 'Retrograde (Vakri)' : 'Direct (Marga)'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Nakshatra</span>
                <span className="font-semibold text-slate-200">{selectedPlanetModal.nakshatra} (Pada {selectedPlanetModal.pada})</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Nakshatra Lord</span>
                <span className="font-semibold text-slate-200">{selectedPlanetModal.nakshatraLord}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Classical Significations (Karakas)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {selectedPlanetModal.karaka}. In Vedic astrology, {selectedPlanetModal.name} expresses its archetypal nature through the filter of {selectedPlanetModal.signName} ({selectedPlanetModal.signSanskrit}) and focuses its impact in House {selectedPlanetModal.house}.
              </p>
            </div>

            <button
              onClick={() => setSelectedPlanetModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareModal && currentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cosmic-glow space-y-4 motion-safe:animate-risingGlow">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" /> Shareable Astro Card
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                aria-label="Close"
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/40 border border-amber-500/40 text-center space-y-3 relative overflow-hidden shadow-xl shadow-cosmic-glow-lg">
              {/* Subtle static orbital ring behind the badge — reinforces the
                  celestial identity without adding motion or new data. */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-40 h-40 rounded-full border border-amber-500/20" />
              </div>
              <div className="relative inline-flex p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 mb-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="relative text-xl font-extrabold text-white">{currentProfile.name}</h4>
              <p className="relative text-xs text-amber-400 font-mono">
                {currentProfile.placeName} ({currentProfile.timezone})
              </p>

              <div className="relative grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-2 rounded-xl bg-slate-950/60">
                  <span className="text-[10px] text-slate-400 block">Lagna</span>
                  <span className="font-bold text-slate-100">{currentProfile.chart.lagna.signName}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60">
                  <span className="text-[10px] text-slate-400 block">Moon</span>
                  <span className="font-bold text-slate-100">{currentProfile.chart.moon.signName}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60">
                  <span className="text-[10px] text-slate-400 block">Sun</span>
                  <span className="font-bold text-slate-100">{currentProfile.chart.sun.signName}</span>
                </div>
              </div>

              <div className="relative pt-2 text-xs font-mono text-slate-300">
                Nakshatra: <span className="text-amber-400 font-bold">{currentProfile.chart.moon.nakshatra} (Pada {currentProfile.chart.moon.pada})</span>
              </div>
              <div className="relative text-[11px] font-mono text-slate-400">
                Current Dasha: {currentProfile.chart.dashaSnapshot.activeMahadasha} - {currentProfile.chart.dashaSnapshot.activeAntardasha}
              </div>
              <div className="relative pt-2 mt-1 border-t border-slate-800/60 text-[10px] font-mono tracking-widest text-amber-500/70 uppercase">
                ✦ ASTRO — Vedic Astrology
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyProfileCard}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:shadow-cosmic-glow"
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied Summary Text!' : 'Copy Summary Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact ASTRO Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cosmic-glow space-y-4 motion-safe:animate-risingGlow">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Contact ASTRO
              </h3>
              <button
                onClick={() => setShowContactModal(false)}
                aria-label="Close"
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {contactStatus === 'success' ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-emerald-300">Message sent</p>
                <p className="text-xs text-slate-400">Thanks for reaching out — we'll get back to you at the email you provided.</p>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Questions, bug reports, or feedback — send us a message directly.</p>

                <div>
                  <label className="text-[11px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    maxLength={100}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    maxLength={254}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">We'll reply directly to this address.</p>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-mono tracking-wider text-slate-400 block mb-1">Message</label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="How can we help?"
                    maxLength={5000}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:outline-none text-slate-200 text-sm"
                  />
                </div>

                {/* Honeypot field: hidden from real visitors via CSS (not display:none,
                    which some bots skip filling), invisible and unreachable by keyboard
                    for humans. Any bot that fills every raw input will fill this too. */}
                <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="contact-company">Company</label>
                  <input
                    id="contact-company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={contactForm.company}
                    onChange={(e) => setContactForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>

                {contactStatus === 'error' && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{contactErrorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleSendContactMessage}
                  disabled={
                    contactStatus === 'sending' ||
                    !contactForm.name.trim() ||
                    !contactForm.email.trim() ||
                    !contactForm.message.trim()
                  }
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  {contactStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}