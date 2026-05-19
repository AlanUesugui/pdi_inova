import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Immersive Neural Network Background Canvas Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const settings = {
      pointDensity: 7,
      connections: 5,
      sizeVariation: 0.8,
      velocity: 0.00003,
      maxMovement: 80,
      attractionRange: 150,
      attractionFactor: 0.35,
      lineColor: "rgba(168, 85, 247, 0.12)", // Elegant violet lines
      particleDensity: 0.04,
      particleChance: 0.15,
      particleVelocity: 80,
      particleColor: "rgba(216, 180, 254, 0.6)", // Lilac firing synapses
      particleLength: 20,
      flashRadius: 30,
      flashOpacity: 0.12,
      flashDecay: 0.1
    };

    let points: any[] = [];
    let particles: any[] = [];
    let mousePoint = { x: -1000, y: -1000 };

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth * 0.46;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      createPoints();
    };

    const getDistance = (p1: any, p2: any) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    const contains = (a: any[], obj: any) => {
      if (a !== undefined) {
        for (let i = 0; i < a.length; i++) {
          if (a[i] === obj) return true;
        }
      }
      return false;
    };

    const between = (p1: any, p2: any, t: any) => {
      return (p1.x - p2.x) * (p2.x - t.x) > 0;
    };

    const createPoints = () => {
      points = [];
      particles = [];
      const densityWidth = 1000 / settings.pointDensity;
      
      for (let x = -100; x < canvas.width + 100; x += densityWidth) {
        for (let y = -100; y < canvas.height + 100; y += densityWidth) {
          const px = Math.floor(x + Math.random() * densityWidth);
          const py = Math.floor(y + Math.random() * densityWidth);
          const sizeMod = Math.random() * settings.sizeVariation + 0.6;
          const animOffset = Math.random() * 2 * Math.PI;
          points.push({
            x: px,
            originX: px,
            y: py,
            originY: py,
            radius: 2 * sizeMod,
            sizeMod,
            animOffset,
            flashOpacity: 0,
            closest: []
          });
        }
      }

      // Find closest connections
      for (let i = 0; i < points.length; i++) {
        const closest: any[] = [];
        const p1 = points[i];
        for (let j = 0; j < points.length; j++) {
          const p2 = points[j];
          if (p1 !== p2 && !contains(p2.closest, p1)) {
            let placed = false;
            for (let k = 0; k < settings.connections; k++) {
              if (!placed && closest[k] === undefined) {
                closest[k] = p2;
                placed = true;
              }
            }
            for (let k = 0; k < settings.connections; k++) {
              if (!placed && getDistance(p1, p2) < getDistance(p1, closest[k])) {
                closest[k] = p2;
                placed = true;
              }
            }
          }
        }
        p1.closest = closest.filter(Boolean);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePoint.x = e.clientX - rect.left;
      mousePoint.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mousePoint.x = -1000;
      mousePoint.y = -1000;
    };

    window.addEventListener('resize', resizeCanvas);
    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    resizeCanvas();

    let start: number | null = null;
    let lasttimestamp = 0;

    const animate = (timestamp: number) => {
      if (!start) {
        start = timestamp;
        lasttimestamp = timestamp;
      }
      const elapsed = timestamp - start;
      const delta = (timestamp - lasttimestamp) / 100;
      lasttimestamp = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move Nodes
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const attractionOffset = { x: 0, y: 0 };
        const distanceToMouse = getDistance({ x: point.originX, y: point.originY }, mousePoint);
        
        if (distanceToMouse <= settings.attractionRange) {
          const displacementFactor = 
            ((Math.cos((distanceToMouse / settings.attractionRange) * Math.PI) + 1) / 2) * 
            settings.attractionFactor;
          attractionOffset.x = displacementFactor * (mousePoint.x - point.x);
          attractionOffset.y = displacementFactor * (mousePoint.y - point.y);
        }

        point.x = point.originX + Math.sin(elapsed * settings.velocity + point.animOffset) * settings.maxMovement * point.sizeMod + attractionOffset.x;
        point.y = point.originY - Math.cos(elapsed * settings.velocity + point.animOffset) * settings.maxMovement * point.sizeMod + attractionOffset.y;
        point.flashOpacity = Math.max(0, point.flashOpacity - settings.flashDecay * delta);
      }

      // Move Synaptic Particles
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const origin = points[particle.origin];
        const target = origin.closest[particle.target];

        if (!target) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        const distance = getDistance({ x: origin.x, y: origin.y }, { x: target.x, y: target.y });
        const direction = { x: (target.x - origin.x) / distance, y: (target.y - origin.y) / distance };

        particle.traveled += settings.particleVelocity * delta;
        particle.direction = direction;
        particle.x = origin.x + direction.x * particle.traveled;
        particle.y = origin.y + direction.y * particle.traveled;

        if (!between(origin, { x: particle.x }, target)) {
          particles.splice(i, 1);
          i--;
        }
      }

      // Spawn Synaptic Signals
      for (let i = 0; i < settings.particleDensity * points.length; i++) {
        if (Math.random() < settings.particleChance * delta) {
          const pOriginNum = Math.floor(Math.random() * points.length);
          const pOrigin = points[pOriginNum];
          if (pOrigin && pOrigin.closest.length > 0) {
            const pTargetNum = Math.floor(Math.random() * pOrigin.closest.length);
            particles.push({
              origin: pOriginNum,
              target: pTargetNum,
              x: pOrigin.x,
              y: pOrigin.y,
              traveled: 0,
              direction: { x: 0, y: 0 }
            });
            pOrigin.flashOpacity = settings.flashOpacity;
          }
        }
      }

      // Draw Connections (Lines)
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        for (let j = 0; j < p.closest.length; j++) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.closest[j].x, p.closest[j].y);
          ctx.strokeStyle = settings.lineColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw Synapses (Glowing Particles)
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
          particle.x - particle.direction.x * settings.particleLength, 
          particle.y - particle.direction.y * settings.particleLength
        );
        ctx.strokeStyle = settings.particleColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw Neural Nodes (Circles)
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        // Node Glow Flash
        if (point.flashOpacity > 0) {
          ctx.beginPath();
          const gradient = ctx.createRadialGradient(point.x, point.y, settings.flashRadius, point.x, point.y, 1);
          gradient.addColorStop(0, "rgba(168, 85, 247, 0)");
          gradient.addColorStop(1, `rgba(168, 85, 247, ${point.flashOpacity})`);
          ctx.arc(point.x, point.y, settings.flashRadius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
        ctx.fillStyle = point.flashOpacity > 0 ? "rgba(255, 255, 255, 1)" : "rgba(168, 85, 247, 0.45)";
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3001/api/login', { email, password });
      if (response.data.success) {
        onLoginSuccess(response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar ao servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50/50">

      {/* ── Left panel: navy with neural net canvas overlay ─────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
        className="hidden lg:flex w-[46%] bg-navy-900 flex-col relative overflow-hidden"
      >
        {/* Canvas background for neuron particles */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block pointer-events-none" />

        {/* Soft violet radial overlay gradient */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(168, 85, 247, 0) 10%, rgba(91, 47, 140, 0.2) 100%)'
          }}
        />

        {/* Top gradient border bar */}
        <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-primary-600 via-purple-600 to-pink-500 z-10" />

        {/* Watermark logo */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          aria-hidden
        >
          <span
            className="font-black text-white leading-none tracking-tighter"
            style={{ fontSize: 'clamp(180px, 26vw, 380px)', opacity: 0.02 }}
          >
            PDI
          </span>
        </div>

        <div className="flex flex-col h-full p-16 relative z-10 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-extrabold text-lg leading-none">Inova Skill</p>
              <p className="text-primary-400 text-[10px] uppercase tracking-widest font-black mt-1">HR Platform</p>
            </div>
          </div>

          {/* Headline (Enlarged / Amplified) */}
          <div className="my-auto py-16">
            <p className="text-primary-400 text-[10px] font-black tracking-[0.3em] uppercase mb-6 animate-pulse">
              Plataforma de Desenvolvimento
            </p>
            <h2
              className="text-white font-black leading-[0.96] tracking-tighter"
              style={{ fontSize: 'clamp(36px, 4.5vw, 62px)' }}
            >
              Conectando<br />talentos com<br />inteligência.
            </h2>
          </div>

        </div>
      </motion.div>

      {/* ── Right panel: Login form ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-white relative overflow-hidden">

        {/* Watermark mobile */}
        <div
          className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          aria-hidden
        >
          <span
            className="font-black text-[#1A1A17] leading-none tracking-tighter"
            style={{ fontSize: '70vw', opacity: 0.015 }}
          >
            PDI
          </span>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Logo mobile */}
          <motion.div variants={item} className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <p className="text-[#1A1A17] font-black text-lg">Inova Skill</p>
          </motion.div>

          <motion.div variants={item} className="mb-12">
            <h1
              className="font-black text-[#1A1A17] leading-[1.02] tracking-tight"
              style={{ fontSize: 'clamp(34px, 5vw, 44px)' }}
            >
              Bem-vindo<br />de volta.
            </h1>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[12px] font-bold text-rose-600 border-l-2 border-rose-500 pl-3 py-0.5"
              >
                {error}
              </motion.p>
            )}

            <motion.div variants={item} className="space-y-8">
              {/* Email */}
              <div>
                <label
                  className="block text-[9px] font-black tracking-[0.28em] uppercase mb-3 transition-colors duration-200"
                  style={{ color: focused === 'email' ? '#5B2F8C' : 'rgba(26,26,23,0.38)' }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full py-3 bg-transparent text-[#1A1A17] text-[15px] font-medium placeholder-[rgba(26,26,23,0.2)] focus:outline-none transition-colors duration-200"
                  style={{ borderBottom: `1px solid ${focused === 'email' ? '#5B2F8C' : 'rgba(26,26,23,0.14)'}` }}
                  placeholder="executivo@empresa.com"
                />
              </div>

              {/* Senha */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label
                    className="text-[9px] font-black tracking-[0.28em] uppercase transition-colors duration-200"
                    style={{ color: focused === 'password' ? '#5B2F8C' : 'rgba(26,26,23,0.38)' }}
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-[9px] font-black tracking-[0.16em] uppercase text-[rgba(26,26,23,0.28)] hover:text-primary-600 transition-colors duration-200"
                  >
                    Esqueci
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full py-3 bg-transparent text-[#1A1A17] text-[15px] font-medium placeholder-[rgba(26,26,23,0.2)] focus:outline-none transition-colors duration-200"
                  style={{ borderBottom: `1px solid ${focused === 'password' ? '#5B2F8C' : 'rgba(26,26,23,0.14)'}` }}
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            <motion.div variants={item} className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full flex justify-between items-center py-[18px] px-6 bg-primary-600 text-white text-[12px] font-black tracking-[0.1em] uppercase hover:bg-primary-700 transition-colors duration-300 disabled:opacity-50 rounded-xl shadow-md shadow-primary-600/10 active:scale-95 transition-all"
              >
                <span>{isLoading ? 'Autenticando...' : 'Entrar no Dashboard'}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                type="button"
                className="w-full py-[14px] px-6 border border-[rgba(26,26,23,0.12)] text-[12px] font-black tracking-[0.1em] uppercase text-[rgba(26,26,23,0.4)] hover:text-[rgba(26,26,23,0.65)] hover:border-[rgba(26,26,23,0.24)] rounded-xl transition-all duration-200"
              >
                Acesso via SSO
              </button>
            </motion.div>
          </form>

          <motion.p variants={item} className="mt-12 text-[9px] text-[rgba(26,26,23,0.25)] tracking-[0.1em] font-bold">
            © 2026 Inova Skill · Grupo Jacto
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
