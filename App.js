import { 
  auth, 
  createAccount, 
  loginUser, 
  logoutUser,
  saveMoodEntry,
  getUserMoodEntries,
  updateUserStreak,
  onAuthStateChanged 
} from './firebase-config.js';

import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, Flame, Heart, Users, BookOpen, Cloud, Target } from 'lucide-react';

const RageSpaceApp = () => {
  const [screen, setScreen] = useState('welcome');
  const [stressType, setStressType] = useState(null);
  const [beforeEmotion, setBeforeEmotion] = useState(null);
  const [afterEmotion, setAfterEmotion] = useState(null);
  const [rageMeter, setRageMeter] = useState(0);
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [particles, setParticles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const canvasRef = useRef(null);
  const comboTimerRef = useRef(null);

  const stressTypes = [
    { id: 'academic', label: 'Academic Stress', icon: BookOpen, color: '#ef4444', desc: 'Exams, assignments, deadlines' },
    { id: 'social', label: 'Social Pressure', icon: Users, color: '#8b5cf6', desc: 'Relationships, peer pressure' },
    { id: 'future', label: 'Future Anxiety', icon: Cloud, color: '#06b6d4', desc: 'Career, uncertainty' },
    { id: 'general', label: 'General Overwhelm', icon: Target, color: '#f59e0b', desc: 'Just... everything' }
  ];

  const emotions = [
    { value: 1, label: '😤', desc: 'Very Stressed' },
    { value: 2, label: '😟', desc: 'Stressed' },
    { value: 3, label: '😐', desc: 'Neutral' },
    { value: 4, label: '🙂', desc: 'Calm' },
    { value: 5, label: '😊', desc: 'Very Calm' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('ragespace-sessions');
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  const saveSession = (data) => {
    const newSessions = [...sessions, { ...data, date: new Date().toISOString() }];
    setSessions(newSessions);
    localStorage.setItem('ragespace-sessions', JSON.stringify(newSessions));
  };

  const handleStressSelect = (type) => {
    setStressType(type);
    setScreen('before-emotion');
  };

  const handleBeforeEmotion = (emotion) => {
    setBeforeEmotion(emotion);
    setScreen('rage-room');
  };

  const createParticle = (x, y) => {
    const newParticles = [];
    const particleCount = 5 + Math.floor(combo / 5);
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleCanvasClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left || e.touches?.[0]?.clientX - rect.left;
    const y = e.clientY - rect.top || e.touches?.[0]?.clientY - rect.top;
    
    createParticle(x, y);
    setHits(prev => prev + 1);
    setRageMeter(prev => Math.min(100, prev + 2));
    setShakeIntensity(5);
    
    clearTimeout(comboTimerRef.current);
    setCombo(prev => prev + 1);
    
    comboTimerRef.current = setTimeout(() => {
      setCombo(0);
    }, 1000);

    setTimeout(() => setShakeIntensity(0), 100);
  };

  useEffect(() => {
    if (screen !== 'rage-room') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const stressConfig = stressTypes.find(s => s.id === stressType);
      
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      if (shakeIntensity > 0) {
        ctx.translate(
          (Math.random() - 0.5) * shakeIntensity,
          (Math.random() - 0.5) * shakeIntensity
        );
      }
      
      const damage = hits / 2;
      ctx.globalAlpha = Math.max(0.3, 1 - damage / 50);
      
      if (stressType === 'academic') {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = stressConfig.color;
          ctx.fillRect(-60 + i * 40 - damage, -80 + i * 20, 50, 70);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(-60 + i * 40 - damage, -80 + i * 20, 50, 70);
        }
      } else if (stressType === 'social') {
        ctx.fillStyle = stressConfig.color;
        ctx.beginPath();
        ctx.arc(-50, -30, 30 - damage / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(50, -30, 30 - damage / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 30, 30 - damage / 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (stressType === 'future') {
        ctx.fillStyle = stressConfig.color;
        ctx.globalAlpha = Math.max(0.3, 1 - damage / 100);
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(
            Math.cos(i * Math.PI / 2.5) * (60 + damage),
            Math.sin(i * Math.PI / 2.5) * (60 + damage),
            20 - damage / 10,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } else {
        ctx.fillStyle = stressConfig.color;
        ctx.beginPath();
        ctx.arc(0, 0, 60 - damage / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      setParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          life: p.life - 0.02
        })).filter(p => p.life > 0);
        
        updated.forEach(p => {
          ctx.fillStyle = `rgba(${parseInt(stressConfig.color.slice(1, 3), 16)}, ${parseInt(stressConfig.color.slice(3, 5), 16)}, ${parseInt(stressConfig.color.slice(5, 7), 16)}, ${p.life})`;
          ctx.fillRect(p.x, p.y, 5, 5);
        });
        
        return updated;
      });
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationId);
  }, [screen, stressType, hits, shakeIntensity]);

  const handleSatisfaction = (satisfied) => {
    if (satisfied) {
      setScreen('after-emotion');
    } else {
      setRageMeter(0);
      setScreen('rage-room');
    }
  };

  const handleAfterEmotion = (emotion) => {
    setAfterEmotion(emotion);
    saveSession({
      stressType,
      beforeEmotion,
      afterEmotion: emotion,
      hits,
      duration: rageMeter
    });
    setScreen('analytics');
  };

  const resetApp = () => {
    setScreen('welcome');
    setStressType(null);
    setBeforeEmotion(null);
    setAfterEmotion(null);
    setRageMeter(0);
    setHits(0);
    setCombo(0);
    setParticles([]);
  };

  const getStressTypeStats = () => {
    const counts = {};
    sessions.forEach(s => {
      counts[s.stressType] = (counts[s.stressType] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: stressTypes.find(st => st.id === type)?.label || type,
      count
    }));
  };

  const getEmotionTrend = () => {
    return sessions.slice(-7).map((s, i) => ({
      session: i + 1,
      before: s.beforeEmotion,
      after: s.afterEmotion
    }));
  };

  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6 sm:mb-8">
            <Flame className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-yellow-300 mb-3 sm:mb-4 animate-pulse" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">RageSpace</h1>
            <p className="text-purple-200 text-base sm:text-lg">Your digital stress relief room</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">What's stressing you out?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {stressTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleStressSelect(type.id)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-4 sm:p-6 transition-all transform hover:scale-105 active:scale-95 text-left"
                  >
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 mb-2 sm:mb-3" style={{ color: type.color }} />
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1">{type.label}</h3>
                    <p className="text-purple-100 text-xs sm:text-sm">{type.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
          
          {sessions.length > 0 && (
            <button
              onClick={() => setScreen('analytics')}
              className="text-purple-200 hover:text-white underline text-sm sm:text-base transition-colors"
            >
              View your analytics →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'before-emotion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How are you feeling right now?</h2>
          <p className="text-purple-200 mb-6 sm:mb-8 text-sm sm:text-base">Be honest with yourself</p>
          
          <div className="space-y-3">
            {emotions.map(emotion => (
              <button
                key={emotion.value}
                onClick={() => handleBeforeEmotion(emotion.value)}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-3 sm:p-4 transition-all transform hover:scale-102 active:scale-95 flex items-center gap-3 sm:gap-4"
              >
                <span className="text-3xl sm:text-4xl">{emotion.label}</span>
                <span className="text-white font-medium text-base sm:text-lg">{emotion.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'rage-room') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-800 to-yellow-700 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl w-full">
          <div className="bg-black/30 backdrop-blur rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Release Your Stress</h2>
                <p className="text-orange-200 text-xs sm:text-base">Click/Tap rapidly to let it all out!</p>
              </div>
              <div className="text-right">
                <div className="text-yellow-300 text-2xl sm:text-3xl font-bold">{hits}</div>
                <div className="text-orange-200 text-xs sm:text-sm">hits</div>
              </div>
            </div>
            
            <div className="bg-black/40 rounded-lg p-2 mb-4">
              <div className="h-3 sm:h-4 bg-orange-900 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-300"
                  style={{ width: `${rageMeter}%` }}
                />
              </div>
              <p className="text-white text-xs mt-1">Rage Meter: {rageMeter}%</p>
            </div>
            
            {combo > 0 && (
              <div className="text-center mb-4">
                <span className="text-yellow-300 text-xl sm:text-2xl font-bold animate-pulse">
                  {combo}x COMBO! 🔥
                </span>
              </div>
            )}
          </div>
          
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              onClick={handleCanvasClick}
              onTouchStart={handleCanvasClick}
              className="w-full bg-black/30 backdrop-blur rounded-2xl cursor-crosshair border-2 sm:border-4 border-orange-500/50"
              style={{ maxWidth: '600px', height: 'auto', aspectRatio: '3/2', touchAction: 'none' }}
            />
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 backdrop-blur px-3 py-2 rounded-lg">
              <p className="text-white text-xs sm:text-sm">💡 Tap anywhere to release stress!</p>
            </div>
          </div>
          
          {rageMeter >= 50 && (
            <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">You did great taking out your rage! 👍</h3>
              <p className="text-orange-200 mb-4 sm:mb-6 text-sm sm:text-base">Are you satisfied?</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={() => handleSatisfaction(true)}
                  className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  Yes, I feel better ✨
                </button>
                <button
                  onClick={() => handleSatisfaction(false)}
                  className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  No, continue 💪
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'after-emotion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-600 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-pink-300 mb-3 sm:mb-4 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How are you feeling now?</h2>
            <p className="text-blue-200 text-sm sm:text-base">After releasing all that stress</p>
          </div>
          
          <div className="space-y-3">
            {emotions.map(emotion => (
              <button
                key={emotion.value}
                onClick={() => handleAfterEmotion(emotion.value)}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-3 sm:p-4 transition-all transform hover:scale-102 active:scale-95 flex items-center gap-3 sm:gap-4"
              >
                <span className="text-3xl sm:text-4xl">{emotion.label}</span>
                <span className="text-white font-medium text-base sm:text-lg">{emotion.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'analytics') {
    const stressStats = getStressTypeStats();
    const emotionTrend = getEmotionTrend();
    const avgImprovement = sessions.length > 0 
      ? (sessions.reduce((sum, s) => sum + (s.afterEmotion - s.beforeEmotion), 0) / sessions.length).toFixed(1)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-3 sm:p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Your Emotional Journey</h1>
                <p className="text-purple-200 text-sm sm:text-base">Understanding your stress patterns</p>
              </div>
              <button
                onClick={resetApp}
                className="w-full sm:w-auto bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-6 py-3 rounded-xl transition-all transform hover:scale-105 active:scale-95"
              >
                New Session
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 sm:p-6">
                <div className="text-purple-200 text-xs sm:text-sm mb-1">Total Sessions</div>
                <div className="text-white text-2xl sm:text-3xl font-bold">{sessions.length}</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 sm:p-6">
                <div className="text-purple-200 text-xs sm:text-sm mb-1">Avg Improvement</div>
                <div className="text-white text-2xl sm:text-3xl font-bold">+{avgImprovement}</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 sm:p-6">
                <div className="text-purple-200 text-xs sm:text-sm mb-1">Total Hits</div>
                <div className="text-white text-2xl sm:text-3xl font-bold">
                  {sessions.reduce((sum, s) => sum + s.hits, 0)}
                </div>
              </div>
            </div>

            {sessions.length > 0 && (
              <>
                <div className="bg-white/20 backdrop-blur rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Your Stress Triggers</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stressStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#fff" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {emotionTrend.length > 0 && (
                  <div className="bg-white/20 backdrop-blur rounded-xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Emotion Trend (Last 7 Sessions)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={emotionTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="session" stroke="#fff" tick={{ fontSize: 12 }} />
                        <YAxis domain={[1, 5]} stroke="#fff" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="before" stroke="#ef4444" name="Before" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="after" stroke="#10b981" name="After" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RageSpaceApp;