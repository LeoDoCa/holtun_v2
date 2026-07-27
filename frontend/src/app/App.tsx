import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  Search, X, Menu, ChevronRight, ChevronLeft, ArrowLeft,
  Instagram, Facebook, Phone, Mail, MapPin,
  Check, AlertCircle, Upload, Leaf, Droplets,
  Flame, Star, Shield, Heart, Sparkles,
  Package, Lock, Eye, EyeOff, Sun, Moon,
  UserCircle, Boxes, Plus, Target, Globe,
  Zap, Flower2, FlaskConical, Wind, Amphora,
  TrendingDown, AlertTriangle, CheckCircle2,
  Pencil, Trash2, Tag, Save, Mic,
} from "lucide-react";
import logo2 from "@/imports/2.png";
import logo3 from "@/imports/3.png";
import hero from "@/imports/IMG1.jpeg"
import habitarte from "@/imports/habitarte.png"
import ofrecemos from "@/imports/IMG2.jpeg"
import impi from "@/imports/IMPI-LOGO.jpg"
import orgullo from "@/imports/Orgullo-Morelos-Optiprot-Logo-.png"
import secturismo from "@/imports/secturismo.jpg"

import { productService, categoryService, authService, fileUrl } from "@/app/services/api";

const SUSPICIOUS_PATTERN =
  /(--|;|\/\*|\*\/|\bxp_\w+|\bexec(\s|\()|\bunion\s+select\b|\bselect\s+.+\s+from\b|\binsert\s+into\b|\bdrop\s+(table|database)\b|\bupdate\s+.+\s+set\b|\bdelete\s+from\b|<\s*script|on\w+\s*=)/i;

interface ValidationResult { valid: boolean; error?: string; }

function validateUsername(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Ingresa un usuario" };
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(trimmed)) {
    return { valid: false, error: "El usuario debe tener entre 3 y 32 caracteres, y solo puede contener letras, números, puntos, guiones o guiones bajos" };
  }
  if (SUSPICIOUS_PATTERN.test(trimmed)) {
    return { valid: false, error: "Usuario contiene caracteres no permitidos" };
  }
  return { valid: true };
}

function validatePassword(value: string): ValidationResult {
  if (!value) return { valid: false, error: "Ingresa una contraseña" };
  if (value.length > 128) return { valid: false, error: "La contraseña es demasiado larga" };
  return { valid: true };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = "home" | "catalog" | "product" | "admin-gate" | "admin" | "therapies";
type AdminSection = "inventory" | "add-product" | "categories";

interface Category {
  uuid: string;
  name: string;
  description?: string;
  image?: string;
}

interface Product {
  uuid: string;
  name: string;
  categories: Category[];
  description: string;
  price: number;
  stock: number;
  images: string[];
  rawImages: string[];
}

const normalizeProduct = (p: unknown): Product => {
  const prod = p as any;
  const rawImages = prod.images ?? [];
  return {
    ...prod,
    rawImages,
    images: rawImages.length ? rawImages.map(fileUrl) : [PLACEHOLDER_IMAGE],
  };
};

const normalizeCategory = (c: unknown): Category => {
  const cat = c as Category;
  return { ...cat, image: cat.image ? fileUrl(cat.image) : undefined };
};

interface FormErrors {
  name?: string;
  categories?: string;
  description?: string;
  price?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Todos": Boxes,
  "Aceites de grado alimenticio": Droplets,
  "Aceites de grado cosmético": Sparkles,
  "Sinergias de aceites esenciales": FlaskConical,
  "Sinergias · Línea Holística": Flower2,
  "Aceites para masajes relajantes": Wind,
  "Sinergias para masajes": Zap,
  "Sueros faciales": Star,
  "Aceites vehiculares": Amphora,
  "Mieles": Heart,
  "Velas": Flame,
  "Terapias Holísticas": Flower2,
};

const I = {
  hero: "https://images.unsplash.com/photo-1708667027894-6e9481ae1baf?w=1600&h=900&fit=crop&auto=format",
  about: "https://images.unsplash.com/photo-1647892702739-fd6cda128787?w=1200&h=700&fit=crop&auto=format",
  oilPlant: "https://images.unsplash.com/photo-1699373381616-6133334e754e?w=700&h=800&fit=crop&auto=format",
  oilBlanket: "https://images.unsplash.com/photo-1662467191034-9cc663f1de92?w=700&h=800&fit=crop&auto=format",
  facial: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  corporal: "https://images.unsplash.com/photo-1761718210089-ba3bb5ccb54f?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  skincare: "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?w=700&h=800&fit=crop&auto=format",
  tanatologico: "https://images.pexels.com/photos/6134941/pexels-photo-6134941.jpeg",
  honeyDip: "https://images.unsplash.com/photo-1641878067318-1d1f79a77785?w=700&h=800&fit=crop&auto=format",
  candle1: "https://images.unsplash.com/photo-1636714507452-48716cfa1818?w=700&h=800&fit=crop&auto=format",
  auriculoterapia: "https://plus.unsplash.com/premium_photo-1661869039200-0b1553ced257?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  masaje: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  acupuntura: "https://images.unsplash.com/photo-1598555763574-dca77e10427e?q=80&w=1197&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="700" height="800" viewBox="0 0 700 800">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f2f0ea"/>
          <stop offset="100%" stop-color="#e3ded3"/>
        </linearGradient>
        <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8a9b7d"/>
          <stop offset="100%" stop-color="#5f7052"/>
        </linearGradient>
      </defs>

      <rect width="700" height="800" fill="url(#bg)"/>

      <!-- círculo decorativo detrás (aún más grande) -->
      <circle cx="350" cy="350" r="240" fill="#ffffff" opacity="0.35"/>
      <circle cx="350" cy="350" r="195" fill="none" stroke="#5f7052" stroke-width="1.5" opacity="0.25"/>

      <!-- hoja estilizada (escalada 2.3x) -->
      <g transform="translate(350,350) scale(2.3)">
        <path d="M0,-70 C45,-55 65,-15 55,25 C45,60 15,72 0,72 C-15,72 -45,60 -55,25 C-65,-15 -45,-55 0,-70 Z"
              fill="url(#leaf)"/>
        <path d="M0,-60 C0,-20 0,20 0,68" stroke="#f2f0ea" stroke-width="1.6" fill="none" opacity="0.7"/>
        <path d="M0,-30 C15,-22 25,-12 28,0" stroke="#f2f0ea" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M0,-30 C-15,-22 -25,-12 -28,0" stroke="#f2f0ea" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M0,10 C13,17 21,26 24,36" stroke="#f2f0ea" stroke-width="1" fill="none" opacity="0.5"/>
        <path d="M0,10 C-13,17 -21,26 -24,36" stroke="#f2f0ea" stroke-width="1" fill="none" opacity="0.5"/>
      </g>

      <!-- texto -->
      <text x="350" y="660" font-family="'Roboto', sans-serif" font-size="22" letter-spacing="5"
            fill="#5f7052" text-anchor="middle" opacity="0.75">HÓLTÚN</text>
      <text x="350" y="694" font-family="'Open Sans', sans-serif" font-size="19"
            fill="#8a8378" text-anchor="middle">Imagen no disponible</text>
    </svg>
  `);

// ─── Terapias Holísticas (mock, siempre visible) ──────────────────────────────

interface Therapy {
  slug: string;
  name: string;
  benefits: string;
  image: string;
}

// ⚠️ Reemplaza estas URLs por fotos reales de las terapias cuando las tengas
const THERAPIES: Therapy[] = [
  {
    slug: "acupuntura",
    name: "Acupuntura",
    benefits: "Alivia dolores crónicos, mejora el sistema inmunológico y apoya el tratamiento de diversas enfermedades. Equilibra la energía vital, reduce el estrés y promueve una recuperación más natural y duradera.",
    image: I.acupuntura,
  },
  {
    slug: "masajes",
    name: "Masajes",
    benefits: "Relajan profundamente, liberan tensiones musculares y mejoran la circulación, proporcionando descanso y vitalidad inmediata.",
    image: I.masaje,
  },
  {
    slug: "auriculoterapia",
    name: "Auriculoterapia",
    benefits: "Estimula puntos clave en la oreja para equilibrar emociones, controlar ansiedad y favorecer hábitos saludables de manera natural.",
    image: I.auriculoterapia,
  },
  {
    slug: "tratamientos-faciales",
    name: "Tratamientos faciales",
    benefits: "La radiofrecuencia y microneedling reafirman la piel, reducen líneas de expresión y estimulan la producción de colágeno, logrando un rostro más luminoso y juvenil.",
    image: I.facial,
  },
  {
    slug: "tratamientos-corporales",
    name: "Tratamientos corporales",
    benefits: "Moldean la figura, mejoran la textura de la piel y ayudan a eliminar toxinas, ofreciendo resultados visibles y mayor confianza personal.",
    image: I.corporal,
  },
  {
    slug: "acompanamiento-tanatologico",
    name: "Acompañamiento tanatológico",
    benefits: "Brinda apoyo emocional en procesos de duelo, ayudando a encontrar paz, aceptación y fortaleza para seguir adelante.",
    image: I.tanatologico,
  },
];

// Categoría "falsa" que siempre se muestra junto a las categorías reales del backend.
// No existe en la BD: su uuid empieza con "mock-" y se detecta así en los onClick.
const MOCK_THERAPY_CATEGORY: Category = {
  uuid: "mock-terapias-holisticas",
  name: "Terapias Holísticas",
  description: "Terapias que reconectan cuerpo, mente y energía",
  image: I.oilBlanket, // reemplaza por la foto real del banner cuando la tengas
};

const isMockCategory = (uuid: string | null | undefined) => uuid === MOCK_THERAPY_CATEGORY.uuid;

// ─── Motion preset ────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ─── ImageCarousel ────────────────────────────────────────────────────────────

function ImageCarousel({ images, alt, imgClassName, containerClassName }: {
  images: string[]; alt: string; imgClassName?: string; containerClassName?: string;
}) {
  const [idx, setIdx] = useState(0);
  const safeImages = images.length ? images : [PLACEHOLDER_IMAGE];

  if (safeImages.length === 1) {
    return (
      <div className={containerClassName}>
        <img src={safeImages[0]} alt={alt} className={imgClassName} />
      </div>
    );
  }
  return (
    <div className={`relative group ${containerClassName ?? ""}`}>
      <img src={safeImages[idx]} alt={alt} className={imgClassName} />
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + safeImages.length) % safeImages.length); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ChevronLeft size={13} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % safeImages.length); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <ChevronRight size={13} />
      </button>
      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 z-10">
        {safeImages.map((_, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white" : "bg-white/40"}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({
  page, navigate, isDark, toggleDark,
}: {
  page: Page; navigate: (p: Page, anchor?: string) => void;
  isDark: boolean; toggleDark: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = page === "home";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navBg = isHome && !scrolled
    ? "bg-transparent"
    : "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm shadow-black/5";

  const linkColor = isHome && !scrolled
    ? "text-white/75 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  const activeColor = isHome && !scrolled ? "text-white" : "text-primary";

  const WA_URL = "https://wa.me/525516905076?text=Hola%2C%20me%20gustar%C3%ADa%20pedir%20informes%20sobre%20sus%20productos.";

  const links = [
    { label: "Inicio", page: "home" as Page, anchor: undefined },
    { label: "Catálogo", page: "catalog" as Page, anchor: undefined },
  ];

  const isActive = (l: typeof links[0]) =>
    l.anchor ? false : page === l.page;

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate("home")} className="flex items-center gap-3 group">
          <img
            src={logo3}
            alt="Hóltun"
            className="h-16 w-16 object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
            style={{ filter: isHome && !scrolled ? "drop-shadow(0 1px 6px rgba(0,0,0,0.5)) brightness(1.15)" : "none" }}
          />
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button key={l.label} onClick={() => navigate(l.page, l.anchor)}
              className={`font-opensans text-[11px] tracking-[0.18em] uppercase transition-all duration-300 relative pb-0.5 flex items-center gap-1.5 ${isActive(l) ? activeColor : linkColor
                }`}>
              {l.label}
              {isActive(l) && (
                <motion.div layoutId="nav-ul" className={`absolute -bottom-1 inset-x-0 h-px ${isHome && !scrolled ? "bg-white" : "bg-primary"}`} />
              )}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* WhatsApp */}
          <a href={WA_URL} target="_blank" rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 font-opensans text-[11px] tracking-[0.12em] uppercase px-4 py-2 rounded-full transition-all duration-300 bg-[#25D366] text-white hover:bg-[#1ebe5d] shadow-sm shadow-[#25D366]/30"
            title="Pedir informes por WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
            WhatsApp
          </a>

          {/* Dark mode toggle */}
          <button onClick={toggleDark}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isHome && !scrolled
              ? "text-white/70 hover:text-white hover:bg-white/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Profile / Admin icon */}
          <button onClick={() => navigate("admin-gate")}
            className={`hidden md:flex w-9 h-9 rounded-full items-center justify-center transition-all duration-300 ${isHome && !scrolled
              ? "text-white/60 hover:text-white hover:bg-white/10"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            title="Perfil">
            <UserCircle size={19} />
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)}
            className={`md:hidden w-9 h-9 flex items-center justify-center transition-colors ${isHome && !scrolled ? "text-white" : "text-foreground"}`}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }}
            className="md:hidden bg-background border-t border-border overflow-hidden"
          >
            <div className="flex flex-col px-6 py-5 gap-5">
              {links.map((l) => (
                <button key={l.label} onClick={() => { navigate(l.page, l.anchor); setOpen(false); }}
                  className={`font-opensans text-[11px] tracking-[0.18em] uppercase text-left transition-colors ${isActive(l) ? "text-primary" : "text-muted-foreground"}`}>
                  {l.label}
                </button>
              ))}
              <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                className="font-opensans text-[11px] tracking-[0.18em] uppercase text-left text-[#25D366] flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
                WhatsApp
              </a>
              <button onClick={() => { navigate("admin-gate"); setOpen(false); }}
                className="font-opensans text-[11px] tracking-[0.18em] uppercase text-left text-muted-foreground/50 flex items-center gap-2">
                <UserCircle size={14} /> Perfil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ navigate }: { navigate: (p: Page, anchor?: string) => void }) {
  return (
    <footer className="bg-[#475644] dark:bg-[#2d3829] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={logo2} alt="Hóltun" className="h-16 w-16 object-contain opacity-90" />
            </div>
            <p className="font-opensans text-sm text-white/50 leading-relaxed mb-6">
              Centro holístico comprometido con restaurar el equilibrio a través de la naturaleza y técnicas ancestrales.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/holtun_wellness/" },
                { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61573087637224&locale=es_LA" },
              ].map(({ Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-white/12 flex items-center justify-center text-white/45 hover:border-primary hover:text-primary transition-all duration-300">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">Explorar</h4>
            <div className="flex flex-col gap-3">
              {(["Inicio", "Nosotros", "Comunidad", "Catálogo"] as const).map((l, i) => {
                const pages: Page[] = ["home", "home", "home", "catalog"];
                const anchors: (string | undefined)[] = [undefined, "sobre-nosotros", "comunidad", undefined];
                return (
                  <button key={l} onClick={() => navigate(pages[i], anchors[i])}
                    className="font-opensans text-sm text-white/55 hover:text-primary transition-colors text-left flex items-center gap-2">
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">Contacto</h4>
            <div className="flex flex-col gap-3">
              {[
                { Icon: Mail, text: "holtun01@gmail.com" },
                { Icon: Phone, text: "55 1690 5076" },
                { Icon: MapPin, text: "2da Priv. Tulipanes 21, Hda. de las Flores, Jiutepec, Mor. CP 62573" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon size={13} className="text-primary shrink-0 mt-0.5" />
                  <span className="font-opensans text-sm text-white/55">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">Afiliaciones</h4>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img src={orgullo} alt="Orgullo Morelos - Turismo de Bienestar" className="h-12 w-12 object-contain bg-white/90 rounded-lg p-1" />
                <span className="font-opensans text-sm text-white/55 leading-snug">Orgullo Morelos<br />Turismo de Bienestar</span>
              </div>
              <div className="flex items-center gap-3">
                <img src={secturismo} alt="Turismo de Bienestar" className="h-12 w-12 object-contain bg-white/90 rounded-lg p-1" />
                <span className="font-opensans text-sm text-white/55 leading-snug">Turismo de Bienestar</span>
              </div>
              <div className="flex items-center gap-3">
                <img src={impi} alt="IMPI" className="h-12 w-12 object-contain bg-white/90 rounded-lg p-1" />
                <span className="font-opensans text-sm text-white/55 leading-snug">IMPI</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/8 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-opensans text-xs text-white/25">© 2026 Hóltun Centro Holístico. Todos los derechos reservados.</p>
          <p className="font-opensans text-xs text-white/15">Diseñado con propósito</p>
        </div>
      </div>
    </footer>
  );
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const firstCat = product.categories[0];
  const CatIcon = CATEGORY_ICONS[firstCat?.name ?? ""] ?? Package;
  return (
    <motion.article
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      onClick={onClick}
      className="group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/8 transition-shadow duration-500 cursor-pointer flex flex-col"
    >
      <div className="relative h-52 bg-muted overflow-hidden">
        <ImageCarousel
          images={product.images}
          alt={product.name}
          imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          containerClassName="w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <span className="absolute top-3 left-3 font-opensans text-[9px] tracking-[0.12em] uppercase bg-white/90 dark:bg-card/90 backdrop-blur-sm text-primary px-2.5 py-1.5 rounded-full flex items-center gap-1 pointer-events-none">
          <CatIcon size={9} /> {firstCat?.name.split(" ").slice(0, 2).join(" ")}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="font-opensans text-[10px] tracking-[0.12em] uppercase text-muted-foreground mb-1.5 truncate">{firstCat?.name}</p>
        <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-base font-medium text-foreground mb-2 leading-snug">{product.name}</h3>
        <p className="font-opensans text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span style={{ fontFamily: "'Roboto', sans-serif" }} className="text-base font-light text-primary">
            ${product.price.toLocaleString("es-MX")} <span className="text-xs text-muted-foreground font-normal">MXN</span>
          </span>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/525516905076?text=${encodeURIComponent(`Hola, me gustaría pedir informes sobre el producto: ${product.name}`)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all duration-200"
              title={`Preguntar por ${product.name}`}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
            </a>
            <span className="font-opensans text-[10px] tracking-[0.12em] uppercase text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all">
              Ver más <ChevronRight size={10} />
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── HomePage (merged with Nosotros) ──────────────────────────────────────────

function HomePage({ navigate }: { navigate: (p: Page, anchor?: string) => void }) {
  const [homeCategories, setHomeCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll()
      .then((data) => setHomeCategories(data.map(normalizeCategory)))
      .catch(() => setHomeCategories([]))
      .finally(() => setCatsLoading(false));
  }, []);

  // La categoría "Terapias Holísticas" es un mock: siempre se agrega al final,
  // sin depender de la respuesta del backend.
  const displayCategories = useMemo(
    () => [...homeCategories, MOCK_THERAPY_CATEGORY],
    [homeCategories]
  );

  const PODCAST_URLS = {
    amazon: "https://music.amazon.com/podcasts/d34764ea-672d-41af-8fb5-9943c0ef3769/habit-arte",
    apple: "https://podcasts.apple.com/us/podcast/el-amor-en-tiempos-de-filtros/id1896812626?i=1000775267365",
    spotify: "https://open.spotify.com/show/033mYNbtCHck7reaFpyqrI?si=3b6d18e088af4044",
  };

  const goToCategory = (cat: Category) => {
    if (isMockCategory(cat.uuid)) {
      navigate("therapies");
    } else {
      navigate("catalog");
    }
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero} alt="Naturaleza y bienestar" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto"
        >
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="flex items-center justify-center gap-2 mb-7">
            <Leaf size={13} className="text-primary" />
            <p className="font-opensans text-[10px] tracking-[0.45em] uppercase text-primary">Centro Holístico</p>
          </motion.div>
          <h1 style={{ fontFamily: "'Roboto', sans-serif" }}
            className="text-5xl md:text-[60px] font-extralight tracking-wide leading-[1.15] mb-8">
            El bienestar comienza aquí<br /><em className="not-italic font-light text-white/80">cuando tu vuelves a ti</em>
          </h1>
          <p className="font-opensans text-sm md:text-base text-white/60 max-w-xl mx-auto mb-12 leading-relaxed">
            En HÓLTUN Wellness te acompañamos en un camino de equilibrio y bienestar integral. A través de terapias holísticas, productos naturales y hábitos conscientes, te ayudamos a reconectar con tu cuerpo, tu mente y tu esencia.
          </p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("catalog")}
            className="font-opensans text-[11px] tracking-[0.2em] uppercase bg-primary text-white px-10 py-4 rounded-full hover:bg-accent transition-colors duration-300 shadow-lg shadow-primary/30">
            Explorar catálogo
          </motion.button>
        </motion.div>
        <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-35">
          <div className="w-px h-9 bg-white" />
          <div className="w-1 h-1 rounded-full bg-white" />
        </motion.div>
      </section>

      {/* ── Categories showcase ── */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Boxes size={14} className="text-primary" />
                <p className="font-opensans text-[10px] tracking-[0.4em] uppercase text-primary">Lo que ofrecemos</p>
              </div>
              <h2 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-3xl md:text-4xl font-light text-foreground">Nuestras categorías</h2>
            </motion.div>

            {catsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {displayCategories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.name] ?? Package;
                  return (
                    <motion.div key={cat.uuid} variants={fadeUp} whileHover={{ y: -5, transition: { duration: 0.22 } }}
                      onClick={() => goToCategory(cat)}
                      className="group cursor-pointer bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-shadow duration-400">
                      <div className="h-36 overflow-hidden bg-muted flex items-center justify-center">
                        {cat.image
                          ? <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          : <Icon size={36} className="text-primary/20" />
                        }
                      </div>
                      <div className="p-4 text-center">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Icon size={14} className="text-primary" />
                        </div>
                        <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground leading-tight">{cat.name}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {!catsLoading && (
              <motion.div variants={fadeUp} className="text-center mt-12">
                <button onClick={() => navigate("catalog")}
                  className="font-opensans text-[11px] tracking-[0.2em] uppercase bg-primary text-white px-10 py-4 rounded-full hover:bg-accent transition-colors duration-300">
                  Ver catálogo completo
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Sobre Nosotros (merged) ── */}
      <section id="sobre-nosotros" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={fadeUp} className="text-center mb-20">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Leaf size={14} className="text-primary" />
                <p className="font-opensans text-[10px] tracking-[0.4em] uppercase text-primary">Nuestra historia</p>
              </div>
              <h2 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-3xl md:text-5xl font-light text-foreground mb-6 leading-tight">
                Sobre Nosotros
              </h2>
              <p className="font-opensans text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                HÓLTÚN nace con el propósito de restaurar el equilibrio y la paz que la vida ajetreada quita a nuestra comunidad. Con ayuda de la naturaleza y técnicas ancestrales, ofrecemos la oportunidad de llevar un estilo de vida balanceado.
              </p>
            </motion.div>

            {/* Image + text block */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
              <div className="rounded-3xl overflow-hidden h-72 md:h-96 bg-muted">
                <img src={ofrecemos} alt="Hóltún naturaleza" className="w-full h-full object-cover" />
              </div>
              <div>
                <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl font-light text-foreground leading-relaxed mb-6">
                  Holtún está listo para recibirte y acompañarte en tu día a día.
                </p>
                <p className="font-opensans text-sm text-muted-foreground leading-relaxed">
                  Ofrecemos aceites esenciales, mieles infusionadas, masajes, acupuntura y más. Cada producto y servicio nace del deseo genuino de acompañar a nuestra comunidad hacia una vida más equilibrada y consciente.
                </p>
              </div>
            </motion.div>

            {/* Mission + Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
              {[
                { Icon: Target, title: "Misión", text: "Restaurar el balance del ajetreado estilo de vida que llevamos, ofreciendo servicios y productos de calidad. Ya sea que reserves una cita en nuestro centro holístico o consumas nuestros productos, Holtún traerá de vuelta el equilibrio que necesitabas." },
                { Icon: Globe, title: "Visión", text: "Convertirnos en un centro holístico referente del equilibrio entre el mundo moderno y la sabiduría ancestral, acompañando cada vez a más personas a recuperar el balance vital que les pertenece." },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp}
                  className="bg-secondary rounded-2xl p-8 border border-primary/8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                      <item.Icon size={18} className="text-primary" />
                    </div>
                    <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-xl font-medium text-foreground">{item.title}</h3>
                  </div>
                  <p className="font-opensans text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { Icon: Leaf, title: "100% Natural", desc: "Ingredientes naturales cuidadosamente seleccionados, sin aditivos artificiales." },
                { Icon: Shield, title: "Calidad Premium", desc: "Rigurosos controles de calidad en cada producto que llega a tus manos." },
                { Icon: Heart, title: "Con Propósito", desc: "Creemos en el poder sanador de la naturaleza y la responsabilidad de compartirlo." },
              ].map((v) => (
                <motion.div key={v.title} variants={fadeUp}
                  className="bg-card rounded-2xl p-7 border border-border text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <v.Icon size={20} className="text-primary" />
                  </div>
                  <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-lg font-medium text-foreground mb-3">{v.title}</h3>
                  <p className="font-opensans text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 mt-12">
              {[
                { n: "+5", label: "Años de experiencia" },
                { n: "+20", label: "Productos naturales" },
                { n: "100%", label: "Ingredientes naturales" },
              ].map((s) => (
                <div key={s.label} className="text-center py-7 border border-border rounded-2xl">
                  <div style={{ fontFamily: "'Roboto', sans-serif" }} className="text-3xl font-light text-primary mb-1">{s.n}</div>
                  <p className="font-opensans text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Únete a nuestra comunidad ── */}
      <section id="comunidad" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}>

            <motion.div variants={fadeUp} className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Heart size={14} className="text-primary" />
                <p className="font-opensans text-[10px] tracking-[0.4em] uppercase text-primary">Comunidad</p>
              </div>
              <h2 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl md:text-3xl font-light text-foreground">
                Únete a Nuestra Comunidad
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Podcast card */}
              <motion.div variants={fadeUp}
                className="bg-card rounded-2xl p-6 border border-border text-center flex flex-col items-center">
                <img src={habitarte} alt="Habit-Arte Podcast" className="w-14 h-14 object-cover rounded-full mb-3" />
                <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-base font-medium text-foreground mb-1">
                  Escucha nuestro podcast
                </h3>
                <p className="font-opensans text-xs text-muted-foreground mb-5">
                  Historias que inspiran bienestar
                </p>
                <div className="flex items-center gap-2">
                  <a href="https://podcasts.apple.com/us/podcast/el-amor-en-tiempos-de-filtros/id1896812626?i=1000775267365"
                    target="_blank" rel="noopener noreferrer" title="Apple Music"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground/70 hover:border-primary hover:text-primary transition-all duration-300">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M23.997 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0 0 19.876.312a9.23 9.23 0 0 0-1.877-.253c-.028 0-.056-.007-.084-.012H5.987c-.089.009-.178.021-.267.028a10.32 10.32 0 0 0-1.522.216A5.06 5.06 0 0 0 1.108 2.9a5.033 5.033 0 0 0-.826 1.964 9.4 9.4 0 0 0-.163 1.276c-.007.089-.015.178-.023.267v13.386c.011.135.021.271.029.406a9.29 9.29 0 0 0 .24 1.816 5.036 5.036 0 0 0 3.036 3.556 5.397 5.397 0 0 0 1.879.42c.146.007.291.017.437.026h13.658c.146-.009.291-.019.437-.026a5.397 5.397 0 0 0 1.879-.42 5.036 5.036 0 0 0 3.036-3.556c.101-.454.176-.913.24-1.816.008-.135.018-.271.029-.406V6.124zM12.164 17.42c-.048 1.014-.816 1.83-1.83 1.86a1.923 1.923 0 0 1-1.94-1.86c-.032-.999.75-1.87 1.75-1.9a1.94 1.94 0 0 1 2.02 1.9zm4.6-1.36-6.4 1.36v-8.9l6.4-1.36v8.9z" /></svg>
                  </a>
                  <a href="https://open.spotify.com/show/033mYNbtCHck7reaFpyqrI?si=3b6d18e088af4044"
                    target="_blank" rel="noopener noreferrer" title="Spotify"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground/70 hover:border-primary hover:text-primary transition-all duration-300">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.32 9.719-.66 13.439 1.62.361.181.54.78.301 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                  </a>
                  <a href="https://music.amazon.com/podcasts/d34764ea-672d-41af-8fb5-9943c0ef3769/habit-arte"
                    target="_blank" rel="noopener noreferrer" title="Amazon Music"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground/70 hover:border-primary hover:text-primary transition-all duration-300">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M17.34 15.93c-1.68 1.24-4.11 1.9-6.2 1.9-2.93 0-5.57-1.08-7.57-2.89-.16-.14-.02-.34.17-.23 2.16 1.26 4.83 2.02 7.6 2.02 1.86 0 3.91-.39 5.79-1.18.28-.12.52.19.21.38zm.72-.82c-.21-.27-1.4-.13-1.94-.06-.16.02-.19-.12-.04-.23 1-.7 2.63-.5 2.82-.26.19.24-.05 1.87-1 2.65-.14.12-.28.06-.22-.1.21-.53.68-1.72.38-2z" /><circle cx="12" cy="8" r="3.5" /></svg>
                  </a>
                </div>
              </motion.div>

              {/* Social media card */}
              <motion.div variants={fadeUp}
                className="bg-card rounded-2xl p-6 border border-border text-center flex flex-col items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles size={15} className="text-primary" />
                </div>
                <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-base font-medium text-foreground mb-1">
                  Síguenos en redes
                </h3>
                <p className="font-opensans text-xs text-muted-foreground mb-5">
                  Tips, novedades y bienestar
                </p>
                <div className="flex items-center gap-2">
                  <a href="https://www.instagram.com/holtun_wellness/" target="_blank" rel="noopener noreferrer" title="Instagram"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground/70 hover:border-primary hover:text-primary transition-all duration-300">
                    <Instagram size={14} />
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61573087637224&locale=es_LA" target="_blank" rel="noopener noreferrer" title="Facebook"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground/70 hover:border-primary hover:text-primary transition-all duration-300">
                    <Facebook size={14} />
                  </a>
                  <a href="https://wa.me/525516905076?text=Hola%2C%20me%20gustar%C3%ADa%20unirme%20a%20la%20comunidad%20Holtún."
                    target="_blank" rel="noopener noreferrer" title="WhatsApp"
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground/70 hover:border-primary hover:text-primary transition-all duration-300">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// ─── CatalogPage ──────────────────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function CatalogPage({ navigate, setProduct }: { navigate: (p: Page) => void; setProduct: (p: Product) => void }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [activeCategoryUuid, setActiveCategoryUuid] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [catalogHasProducts, setCatalogHasProducts] = useState<boolean | null>(null);

  useEffect(() => {
    categoryService.getAll()
      .then((cats) => setCategories(cats.map(normalizeCategory)))
      .catch(() => setCategories([]));
  }, []);

  // Categorías reales + la mock "Terapias Holísticas" al final, para sidebar/chips.
  const displayCategories = useMemo(
    () => [...categories, MOCK_THERAPY_CATEGORY],
    [categories]
  );

  useEffect(() => {
    productService.getFiltered({ page: 0, size: 1 })
      .then((res) => setCatalogHasProducts(res.totalElements > 0))
      .catch(() => setCatalogHasProducts(true));
  }, []);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, activeCategoryUuid, minPrice, maxPrice, onlyInStock]);

  useEffect(() => {
    setLoading(true);
    productService.getFiltered({
      name: debouncedSearch.trim() || undefined,
      categoryUuid: activeCategoryUuid ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: onlyInStock ? true : undefined,
      page,
      size: 12,
    })
      .then((res) => {
        setProducts(res.content.map(normalizeProduct));
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, activeCategoryUuid, minPrice, maxPrice, onlyInStock, page]);

  const hasActiveFilters =
    search.trim() !== "" ||
    activeCategoryUuid !== null ||
    minPrice !== "" ||
    maxPrice !== "" ||
    onlyInStock;

  const clearFilters = () => {
    setSearch("");
    setActiveCategoryUuid(null);
    setMinPrice("");
    setMaxPrice("");
    setOnlyInStock(false);
  };

  // Si se selecciona la categoría mock, redirige a la página de terapias
  // en vez de intentar filtrar productos por ella.
  const selectCategory = (uuid: string | null) => {
    if (isMockCategory(uuid)) {
      navigate("therapies");
      return;
    }
    setActiveCategoryUuid(uuid);
  };

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Boxes size={14} className="text-primary" />
            <p className="font-opensans text-[10px] tracking-[0.4em] uppercase text-primary">Nuestros productos</p>
          </div>
          <h1 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-4xl md:text-5xl font-light text-foreground">Catálogo</h1>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4 max-w-lg">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Buscar productos…" value={search} maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            className="font-opensans w-full pl-10 pr-9 py-3.5 bg-card border border-border rounded-full text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtros de precio + stock */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <input type="number" min="0" placeholder="Precio mín." value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="font-opensans w-32 px-3 py-2 bg-card border border-border rounded-full text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25" />
          <input type="number" min="0" placeholder="Precio máx." value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="font-opensans w-32 px-3 py-2 bg-card border border-border rounded-full text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25" />
          <label
            onClick={() => setOnlyInStock(!onlyInStock)}
            className="flex items-center gap-2 font-opensans text-xs text-muted-foreground cursor-pointer select-none"
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${onlyInStock ? "bg-primary border-primary" : "border-border"
              }`}>
              {onlyInStock && <Check size={10} className="text-white" />}
            </div>
            Solo disponibles
          </label>
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="font-opensans text-[10px] tracking-wide text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 ml-1">
              <X size={11} /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar categorías */}
          {displayCategories.length > 0 && (
            <aside className="hidden md:block w-56 shrink-0">
              <div className="bg-card border border-border rounded-2xl p-3 sticky top-28">
                <p className="font-opensans text-[9px] tracking-[0.3em] uppercase text-muted-foreground px-2 py-2 mb-1">Categorías</p>
                <div className="space-y-0.5">
                  <button onClick={() => selectCategory(null)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${activeCategoryUuid === null ? "bg-primary text-white shadow-sm shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    <Boxes size={13} className="shrink-0" />
                    <span className="font-opensans text-xs leading-tight">Todos</span>
                  </button>
                  {displayCategories.map((c) => {
                    const Icon = CATEGORY_ICONS[c.name] ?? Package;
                    return (
                      <button key={c.uuid} onClick={() => selectCategory(c.uuid)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${activeCategoryUuid === c.uuid ? "bg-primary text-white shadow-sm shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                        <Icon size={13} className="shrink-0" />
                        <span className="font-opensans text-xs leading-tight">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Chips móvil */}
            {displayCategories.length > 0 && (
              <div className="flex md:hidden flex-wrap gap-2 mb-5">
                <button onClick={() => selectCategory(null)}
                  className={`font-opensans text-[10px] tracking-wide px-3.5 py-2 rounded-full border transition-all flex items-center gap-1.5 ${activeCategoryUuid === null ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
                  <Boxes size={10} /> Todos
                </button>
                {displayCategories.map((c) => {
                  const Icon = CATEGORY_ICONS[c.name] ?? Package;
                  return (
                    <button key={c.uuid} onClick={() => selectCategory(c.uuid)}
                      className={`font-opensans text-[10px] tracking-wide px-3.5 py-2 rounded-full border transition-all flex items-center gap-1.5 ${activeCategoryUuid === c.uuid ? "bg-primary border-primary text-white shadow-sm shadow-primary/20" : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
                      <Icon size={10} /> {c.name}
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && (
              <p className="font-opensans text-xs text-muted-foreground mb-6">
                {totalElements} {totalElements === 1 ? "producto encontrado" : "productos encontrados"}
              </p>
            )}

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-28 gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="font-opensans text-sm text-muted-foreground">Cargando productos…</p>
                </motion.div>
              ) : products.length === 0 && catalogHasProducts === false ? (
                <motion.div key="no-products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-center py-28">
                  <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-5">
                    <Leaf size={28} className="text-primary/50" />
                  </div>
                  <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-xl font-light text-foreground mb-3">
                    Catálogo en preparación
                  </h3>
                  <p className="font-opensans text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">
                    Por el momento no contamos con productos disponibles en nuestro catálogo digital. ¡Pronto tendremos novedades para ti!
                  </p>
                  <a href="https://wa.me/525516905076?text=Hola%2C%20me%20gustar%C3%ADa%20conocer%20sus%20productos%20disponibles."
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full hover:bg-[#1ebe5d] transition-colors font-opensans text-[10px] tracking-[0.12em] uppercase">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
                    Consultar por WhatsApp
                  </a>
                </motion.div>
              ) : products.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-24">
                  <Package size={36} className="text-muted-foreground/25 mx-auto mb-4" />
                  <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-xl font-light text-muted-foreground mb-2">Sin resultados</h3>
                  <p className="font-opensans text-sm text-muted-foreground/60 mb-6">Intenta con otros filtros de búsqueda</p>
                  <button onClick={clearFilters}
                    className="font-opensans text-[10px] tracking-[0.15em] uppercase text-primary border border-primary/30 px-5 py-2.5 rounded-full hover:bg-primary/10 transition-colors inline-flex items-center gap-2">
                    <X size={11} /> Limpiar filtros
                  </button>
                </motion.div>
              ) : (
                <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, i) => (
                    <motion.div key={product.uuid} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.35) }}>
                      <ProductCard product={product} onClick={() => { setProduct(product); navigate("product"); }} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paginación */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:border-primary/40 hover:text-primary transition-all">
                  <ChevronLeft size={14} />
                </button>
                <span className="font-opensans text-xs text-muted-foreground px-2">
                  Página {page + 1} de {totalPages}
                </span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground disabled:opacity-30 hover:border-primary/40 hover:text-primary transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProductPage ──────────────────────────────────────────────────────────────

function ProductPage({ product, navigate }: { product: Product; navigate: (p: Page) => void }) {
  const firstCat = product.categories[0];
  const CatIcon = CATEGORY_ICONS[firstCat?.name ?? ""] ?? Package;
  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <button onClick={() => navigate("catalog")}
          className="font-opensans text-[10px] tracking-[0.18em] uppercase text-muted-foreground hover:text-primary flex items-center gap-2 mb-10 transition-colors group">
          <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" /> Volver al catálogo
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
            className="rounded-3xl overflow-hidden bg-muted h-[460px] md:h-[540px]">
            <ImageCarousel
              images={product.images}
              alt={product.name}
              imgClassName="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
            className="flex flex-col justify-center">
            <span className="font-opensans text-[9px] tracking-[0.18em] uppercase text-primary bg-primary/10 border border-primary/15 px-4 py-1.5 rounded-full w-fit mb-5 flex items-center gap-1.5">
              <CatIcon size={10} /> {firstCat?.name}
            </span>
            <h1 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-3xl md:text-4xl font-light text-foreground mb-5 leading-tight">{product.name}</h1>
            <p className="font-opensans text-sm text-muted-foreground leading-relaxed mb-7 pb-7 border-b border-border">{product.description}</p>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} className="text-primary" />
                <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">Precio</h3>
              </div>
              <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-3xl font-light text-primary">
                ${product.price.toLocaleString("es-MX")} <span className="text-base text-muted-foreground font-normal">MXN</span>
              </p>
            </div>

            {/* Categories */}
            {product.categories.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Boxes size={14} className="text-primary" />
                  <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">
                    {product.categories.length > 1 ? "Categorías" : "Categoría"}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((c) => (
                    <span key={c.uuid} className="font-opensans text-xs bg-secondary border border-primary/10 text-foreground px-4 py-2 rounded-full">{c.name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={14} className="text-primary" />
                <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">Disponibilidad</h3>
              </div>
              {product.stock === 0 ? (
                <span className="font-opensans text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full inline-flex items-center gap-1.5">
                  <AlertTriangle size={11} /> Agotado
                </span>
              ) : product.stock < 10 ? (
                <span className="font-opensans text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full inline-flex items-center gap-1.5">
                  <TrendingDown size={11} /> Pocas unidades
                </span>
              ) : (
                <span className="font-opensans text-xs text-primary bg-primary/10 border border-primary/20 px-4 py-2 rounded-full inline-flex items-center gap-1.5">
                  <CheckCircle2 size={11} /> En stock
                </span>
              )}
            </div>

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/525516905076?text=${encodeURIComponent(`Hola, me gustaría pedir informes sobre el producto: ${product.name}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-full hover:bg-[#1ebe5d] transition-colors shadow-sm shadow-[#25D366]/20 font-opensans text-[10px] tracking-[0.12em] uppercase w-fit">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
              Informes
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── TherapiesPage (Terapias Holísticas) ──────────────────────────────────────

function TherapiesPage({ navigate }: { navigate: (p: Page) => void }) {
  const WA_AGENDA = "https://wa.me/525516905076?text=" +
    encodeURIComponent("Hola, me gustaría agendar una experiencia de terapias holísticas.");

  const heroPoints = [
    { Icon: Sun, label: "Equilibra tu energía" },
    { Icon: Leaf, label: "Reduce el estrés" },
    { Icon: Moon, label: "Mejora tu descanso" },
    { Icon: Heart, label: "Fortalece tu bienestar" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <button onClick={() => navigate("home")}
          className="font-opensans text-[10px] tracking-[0.18em] uppercase text-muted-foreground hover:text-primary flex items-center gap-2 mb-10 transition-colors group">
          <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" /> Volver al inicio
        </button>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-0 rounded-3xl overflow-hidden border border-border bg-card">
          <div className="h-64 lg:h-full">
            <img src={ofrecemos} alt="Terapias holísticas"
              className="w-full h-full object-cover" />
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <h1 style={{ fontFamily: "'Roboto', sans-serif" }}
              className="text-3xl md:text-4xl font-light text-foreground leading-tight mb-1">
              Terapias que reconectan
            </h1>
            <p style={{ fontFamily: "'Roboto', sans-serif" }}
              className="text-3xl md:text-4xl italic font-light text-primary mb-6">
              cuerpo, mente y energía
            </p>
            <p className="font-opensans text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
              Cada sesión es personalizada y diseñada para ayudarte a liberar tensiones,
              restaurar tu equilibrio y mejorar tu bienestar físico y emocional.
            </p>
            <a href={WA_AGENDA} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full hover:bg-accent transition-colors w-fit font-opensans text-[11px] tracking-[0.18em] uppercase mb-8">
              Agenda tu experiencia
            </a>
            <div className="grid grid-cols-2 gap-4">
              {heroPoints.map((p) => (
                <div key={p.label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <p.Icon size={14} className="text-primary" />
                  </div>
                  <span className="font-opensans text-xs text-foreground">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Grid de terapias ── */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Flower2 size={14} className="text-primary" />
            <p className="font-opensans text-[10px] tracking-[0.4em] uppercase text-primary">Terapias Holísticas</p>
          </div>
          <h2 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-3xl md:text-4xl font-light text-foreground">
            Nuestras terapias
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {THERAPIES.map((t, i) => (
            <motion.article key={t.slug}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3) }}
              whileHover={{ y: -5, transition: { duration: 0.25 } }}
              className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/8 transition-shadow duration-500 flex flex-col"
            >
              <div className="h-52 bg-muted overflow-hidden">
                <img src={t.image} alt={t.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-lg font-medium text-foreground mb-2.5">
                  {t.name}
                </h3>
                <p className="font-opensans text-xs text-muted-foreground leading-relaxed mb-5 flex-1">
                  {t.benefits}
                </p>
                <a
                  href={`https://wa.me/525516905076?text=${encodeURIComponent(`Hola, me gustaría más información sobre la terapia: ${t.name}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-full hover:bg-[#25D366] hover:text-white transition-all duration-200 w-fit font-opensans text-[10px] tracking-[0.12em] uppercase">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.877L.057 23.882l6.19-1.454A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.93 0-3.734-.5-5.31-1.373l-.38-.225-3.676.864.927-3.588-.247-.392A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
                  Preguntar
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── AdminGatePage ────────────────────────────────────────────────────────────

function AdminGatePage({ navigate }: { navigate: (p: Page) => void }) {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const userCheck = validateUsername(user);
    const passCheck = validatePassword(pass);

    if (!userCheck.valid || !passCheck.valid) {
      setError(true);
      setFieldError(userCheck.error ?? passCheck.error);
      toast.error("Datos inválidos", { description: userCheck.error ?? passCheck.error });
      return;
    }

    setFieldError(undefined);
    setLoading(true);
    try {
      await authService.login({ username: user.trim(), password: pass });
      toast.success("Bienvenido, administrador", { description: "Sesión iniciada correctamente." });
      navigate("admin");
    } catch {
      setError(true);
      setPass("");
      toast.error("Credenciales incorrectas", { description: "Verifica tu usuario y contraseña." });
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-6 bg-secondary">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-md w-full">
        <div className="bg-card rounded-3xl p-10 shadow-lg shadow-primary/5 text-center mb-6 border border-border">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <UserCircle size={26} className="text-primary" />
          </div>
          <h1 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl font-light text-foreground mb-4">Área de Perfil</h1>
          <p className="font-opensans text-sm text-muted-foreground leading-relaxed mb-8">
            No contamos con un sistema de cuentas para clientes por el momento. Si deseas explorar nuestros productos puedes regresar al catálogo.
          </p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("catalog")}
            className="font-opensans text-[11px] tracking-[0.18em] uppercase bg-primary text-white px-10 py-4 rounded-full hover:bg-accent transition-colors w-full">
            Volver al catálogo
          </motion.button>
        </div>
        <div className="text-center">
          <p className="font-opensans text-xs text-muted-foreground/40 mb-4">¿Eres administrador?</p>
          <AnimatePresence mode="wait">
            {!showLogin ? (
              <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowLogin(true)}
                className="font-opensans text-[11px] tracking-[0.12em] uppercase text-muted-foreground border border-border px-5 py-2.5 rounded-full hover:border-primary/50 hover:text-primary transition-all inline-flex items-center gap-2">
                <Lock size={11} /> Ingresar al panel administrativo
              </motion.button>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-card rounded-2xl p-5 border border-border space-y-3">
                {/* Username */}
                <div className="relative">
                  <UserCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input type="text" placeholder="Usuario"
                    value={user} maxLength={32}
                    onChange={(e) => { setUser(e.target.value); if (error) { setError(false); setFieldError(undefined); } }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className={`font-opensans w-full pl-9 pr-4 py-3 bg-background border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all ${error ? "border-red-400 focus:ring-red-200" : "border-border focus:ring-primary/25"}`} />
                </div>
                {/* Password */}
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input type={showPass ? "text" : "password"} placeholder="Contraseña"
                    value={pass} maxLength={128}
                    onChange={(e) => { setPass(e.target.value); if (error) { setError(false); setFieldError(undefined); } }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className={`font-opensans w-full pl-9 pr-9 py-3 bg-background border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all ${error ? "border-red-400 focus:ring-red-200" : "border-border focus:ring-primary/25"}`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="font-opensans text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={11} /> {fieldError ?? "Usuario o contraseña incorrectos"}
                  </motion.p>
                )}
                <button onClick={handleLogin} disabled={loading || !pass || !user}
                  className="font-opensans text-[11px] tracking-[0.15em] uppercase bg-[#475644] dark:bg-[#2d3829] text-white px-6 py-3 rounded-xl hover:opacity-90 w-full disabled:opacity-50 transition-all">
                  {loading ? "Verificando…" : "Ingresar"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Product Modal ───────────────────────────────────────────────────────

function EditProductModal({ product, onSave, onClose }: {
  product: Product; onSave: (p: Product) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
  });
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [selectedUuids, setSelectedUuids] = useState<string[]>(product.categories.map((c) => c.uuid));

  // Imágenes que YA existían en el producto (rutas crudas, tal como las espera el backend).
  // Se muestran usando fileUrl(path) solo para el <img>, pero se mandan crudas al guardar.
  const [existingImages, setExistingImages] = useState<string[]>([...product.rawImages]);

  // Imágenes nuevas: archivos reales + sus previews en base64, siempre en el mismo índice.
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoryService.getAll()
      .then((data) => setApiCategories(data.map(normalizeCategory)))
      .catch(() => setApiCategories([]));
  }, []);

  const toggleCat = (uuid: string) =>
    setSelectedUuids((prev) => prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]);

  const inputCls = "font-opensans w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all resize-none";

  const totalImages = existingImages.length + newImagePreviews.length;

  const addImage = (file: File) => {
    if (totalImages >= 5) return;
    setNewImageFiles((prev) => [...prev, file]);
    const r = new FileReader();
    r.onload = (ev) => setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
    r.readAsDataURL(file);
  };

  const removeExistingImage = (path: string) => {
    setExistingImages((prev) => prev.filter((p) => p !== path));
  };

  const removeNewImage = (i: number) => {
    setNewImageFiles((prev) => prev.filter((_, j) => j !== i));
    setNewImagePreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await productService.update(product.uuid, {
        name: form.name.trim() || product.name,
        description: form.description.trim() || product.description,
        price: Number(form.price) || product.price,
        stock: Number(form.stock) ?? product.stock,
        categoryUuids: selectedUuids.length ? selectedUuids : product.categories.map((c) => c.uuid),
        images: newImageFiles,
        existingImagePaths: existingImages,
      });
      const chosenCats = apiCategories.filter((c) => selectedUuids.includes(c.uuid));
      const normalized = normalizeProduct(updated);
      onSave({
        ...normalized,
        categories: chosenCats.length ? chosenCats : normalized.categories,
      });
    } catch {
      toast.error("Error al guardar", { description: "No se pudo actualizar el producto. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <p className="font-opensans text-[9px] tracking-[0.22em] uppercase text-primary mb-0.5">Editando producto</p>
            <h2 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-lg font-medium text-foreground">{product.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>
        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-1.5">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-1.5">Categorías</label>
            {apiCategories.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-background border border-border rounded-xl">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                <p className="font-opensans text-xs text-muted-foreground">Cargando categorías…</p>
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {apiCategories.map((c) => {
                  const checked = selectedUuids.includes(c.uuid);
                  return (
                    <label key={c.uuid}
                      onClick={() => toggleCat(c.uuid)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-border last:border-0 ${checked ? "bg-primary/8" : "hover:bg-secondary"}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                        {checked && <Check size={10} className="text-white" />}
                      </div>
                      <span className="font-opensans text-sm text-foreground">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {selectedUuids.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {apiCategories.filter((c) => selectedUuids.includes(c.uuid)).map((c) => (
                  <span key={c.uuid} className="font-opensans text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    {c.name}
                    <button onClick={() => toggleCat(c.uuid)}><X size={9} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-1.5">Descripción</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-1.5">Precio (MXN)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-1.5">Stock (unidades)</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
            </div>
          </div>
          {/* Images */}
          <div>
            <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-2">
              Imágenes <span className="normal-case opacity-60">(máx. 5)</span>
            </label>
            <div className="flex gap-3 flex-wrap">
              {/* Imágenes existentes */}
              {existingImages.map((path) => (
                <div key={path} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                  <img src={fileUrl(path)} alt="imagen existente" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeExistingImage(path)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {/* Imágenes nuevas */}
              {newImagePreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/40 group">
                  <img src={src} alt={`nueva-${i}`} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full">Nueva</span>
                  <button
                    onClick={() => removeNewImage(i)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {totalImages < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all group">
                  <Upload size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors mb-1" />
                  <p className="font-opensans text-[9px] text-muted-foreground/50">Agregar</p>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ""; }} />
                </label>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end">
          <button onClick={onClose}
            className="font-opensans text-[10px] tracking-[0.15em] uppercase text-muted-foreground border border-border px-5 py-2.5 rounded-xl hover:bg-secondary transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="font-opensans text-[10px] tracking-[0.15em] uppercase bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-accent transition-colors flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Guardando…</> : <><Save size={12} /> Guardar cambios</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inventory Section ────────────────────────────────────────────────────────────

function InventorySection() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    productService.getAll()
      .then((data) => setItems(data.map(normalizeProduct)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const statusOf = (stock: number) =>
    stock === 0
      ? { label: "Agotado", cls: "text-red-500 bg-red-500/10 border-red-500/20", Icon: AlertTriangle }
      : stock < 10
        ? { label: "Bajo stock", cls: "text-amber-500 bg-amber-500/10 border-amber-500/20", Icon: TrendingDown }
        : { label: "En stock", cls: "text-primary bg-primary/10 border-primary/20", Icon: CheckCircle2 };

  const inStock = items.filter((p) => p.stock >= 10).length;
  const lowStock = items.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStock = items.filter((p) => p.stock === 0).length;

  const handleDelete = async (uuid: string) => {
    const name = items.find((p) => p.uuid === uuid)?.name ?? "Producto";
    setDeletingUuid(null);
    setItems((prev) => prev.filter((p) => p.uuid !== uuid));
    try {
      await productService.delete(uuid);
      toast.success("Producto eliminado", { description: `"${name}" fue eliminado del inventario.` });
    } catch {
      setItems((prev) => [...prev]);
      toast.error("Error al eliminar", { description: "No se pudo eliminar el producto. Intenta de nuevo." });
      productService.getAll().then((data) => setItems(data.map(normalizeProduct))).catch(() => { });
    }
  };

  const handleEdit = (updated: Product) => {
    setItems((prev) => prev.map((p) => (p.uuid === updated.uuid ? updated : p)));
    setEditProduct(null);
    toast.success("Cambios guardados", { description: `"${updated.name}" fue actualizado correctamente.` });
  };

  return (
    <>
      {/* Edit modal */}
      <AnimatePresence>
        {editProduct && (
          <EditProductModal product={editProduct} onSave={handleEdit} onClose={() => setEditProduct(null)} />
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: items.length, Icon: Boxes, cls: "text-foreground bg-secondary" },
          { label: "En stock", value: inStock, Icon: CheckCircle2, cls: "text-primary bg-primary/10" },
          { label: "Bajo stock", value: lowStock, Icon: TrendingDown, cls: "text-amber-500 bg-amber-500/10" },
          { label: "Agotados", value: outOfStock, Icon: AlertTriangle, cls: "text-red-500 bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${s.cls}`}>
              <s.Icon size={16} />
            </div>
            <div style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl font-light text-foreground mb-1">{s.value}</div>
            <p className="font-opensans text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Product list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Boxes size={15} className="text-primary" />
          <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">Productos en inventario</h3>
          <span className="font-opensans text-xs text-muted-foreground ml-auto">{items.length} productos</span>
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {items.map((p) => {
              const status = statusOf(p.stock);
              const firstCat = p.categories[0];
              const CatIcon = CATEGORY_ICONS[firstCat?.name ?? ""] ?? Package;
              const isDeleting = deletingUuid === p.uuid;

              return (
                <motion.div key={p.uuid}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isDeleting ? "bg-red-500/5" : "hover:bg-secondary/50"}`}>
                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="font-opensans text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CatIcon size={9} /> {firstCat?.name}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="hidden lg:block shrink-0">
                      <span className="font-opensans text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                        ${p.price.toLocaleString("es-MX")} MXN
                      </span>
                    </div>

                    {/* Stock */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-base font-light text-foreground">{p.stock}</p>
                        <p className="font-opensans text-[9px] text-muted-foreground">uds.</p>
                      </div>
                      <span className={`font-opensans text-[9px] tracking-wide uppercase border px-2 py-1 rounded-full flex items-center gap-1 ${status.cls}`}>
                        <status.Icon size={9} /> {status.label}
                      </span>
                    </div>

                    {/* Actions */}
                    {!isDeleting ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditProduct(p)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeletingUuid(p.uuid)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-opensans text-[10px] text-red-500">¿Eliminar?</p>
                        <button onClick={() => handleDelete(p.uuid)}
                          className="font-opensans text-[10px] tracking-wide bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                          Sí
                        </button>
                        <button onClick={() => setDeletingUuid(null)}
                          className="font-opensans text-[10px] tracking-wide border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-opensans text-sm text-muted-foreground">Cargando inventario…</p>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center py-16">
              <Package size={32} className="text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-opensans text-sm text-muted-foreground">Por el momento no hay productos registrados en el inventario.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Categories Section ───────────────────────────────────────────────────────

interface CatItem {
  uuid: string;
  name: string;
  description: string;
  image?: string;      // transformada con fileUrl, para mostrar
  rawImage?: string;    // cruda del backend, para mandar de vuelta al actualizar
  count: number;
}

function CategoriesSection() {
  const [cats, setCats] = useState<CatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const loadCategories = () => {
    categoryService.getAll()
      .then((data) => setCats(data.map((c) => ({
        uuid: c.uuid,
        name: c.name,
        description: c.description ?? "",
        image: c.image ? fileUrl(c.image) : undefined,
        rawImage: c.image,
        count: c.productCount ?? 0,
      }))))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
    productService.getAll()
      .then((data) => setTotalProducts(data.length))
      .catch(() => setTotalProducts(0));
  }, []);

  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | undefined>(undefined);
  const [editImageFile, setEditImageFile] = useState<File | undefined>(undefined);
  const [editExistingImage, setEditExistingImage] = useState<string | undefined>(undefined);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | undefined>(undefined);
  const [addError, setAddError] = useState("");
  const [imageError, setImageError] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const startEdit = (cat: CatItem) => {
    setEditingUuid(cat.uuid);
    setEditValue(cat.name);
    setEditDesc(cat.description);
    setEditImagePreview(cat.image);
    setEditImageFile(undefined);
    setEditExistingImage(cat.rawImage);
    setDeletingUuid(null);
  };

  const saveEdit = async (uuid: string, oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) { setEditingUuid(null); return; }
    if (!editImageFile && !editExistingImage) {
      toast.error("Falta la imagen", { description: "La categoría debe conservar o tener una imagen." });
      return;
    }
    setEditSaving(true);
    try {
      const updated = await categoryService.update(uuid, {
        name: trimmed,
        description: editDesc.trim(),
        image: editImageFile,
        existingImage: editExistingImage,
      });
      setCats((prev) => prev.map((c) => c.uuid === uuid
        ? {
          ...c,
          name: updated.name,
          description: updated.description ?? "",
          image: updated.image ? fileUrl(updated.image) : undefined,
          rawImage: updated.image,
          count: updated.productCount ?? c.count,
        }
        : c
      ));
      toast.success("Categoría actualizada", { description: `"${oldName}" fue actualizada.` });
    } catch {
      toast.error("Error al actualizar", { description: "No se pudo guardar el cambio. Intenta de nuevo." });
    } finally {
      setEditSaving(false);
      setEditingUuid(null);
    }
  };

  const handleDelete = async (uuid: string, name: string) => {
    setDeletingUuid(null);
    setCats((prev) => prev.filter((c) => c.uuid !== uuid));
    try {
      await categoryService.delete(uuid);
      toast.success("Categoría eliminada", { description: `"${name}" fue eliminada del sistema.` });
    } catch {
      toast.error("Error al eliminar", { description: "No se pudo eliminar la categoría." });
      loadCategories();
    }
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    setImageError("");
    if (!trimmed) { setAddError("Ingresa un nombre para la categoría"); return; }
    if (cats.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setAddError("Ya existe una categoría con ese nombre");
      toast.error("Categoría duplicada", { description: `"${trimmed}" ya existe en el sistema.` });
      return;
    }
    if (!newImageFile) {
      setImageError("La imagen de categoría es obligatoria");
      toast.error("Falta la imagen", { description: "Debes subir una imagen para crear la categoría." });
      return;
    }
    setAddSaving(true);
    try {
      const created = await categoryService.create({ name: trimmed, description: newDesc.trim() || undefined, image: newImageFile });
      setCats((prev) => [...prev, {
        uuid: created.uuid,
        name: created.name,
        description: created.description ?? "",
        image: created.image ? fileUrl(created.image) : undefined,
        rawImage: created.image,
        count: created.productCount ?? 0,
      }]);
      setNewName("");
      setNewDesc("");
      setNewImagePreview(null);
      setNewImageFile(undefined);
      setAddError("");
      setImageError("");
      setAddSuccess(true);
      toast.success("Categoría creada", { description: `"${trimmed}" fue agregada exitosamente.` });
      setTimeout(() => setAddSuccess(false), 3000);
    } catch {
      toast.error("Error al crear", { description: "No se pudo crear la categoría. Intenta de nuevo." });
    } finally {
      setAddSaving(false);
    }
  };

  const CatIconEl = (name: string) => {
    const Icon = CATEGORY_ICONS[name] ?? Tag;
    return <Icon size={14} className="text-primary shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Tag size={16} className="text-primary" />
          </div>
          <div style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl font-light text-foreground mb-1">{cats.length}</div>
          <p className="font-opensans text-xs text-muted-foreground">Categorías activas</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Boxes size={16} className="text-primary" />
          </div>
          <div style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl font-light text-foreground mb-1">
            {totalProducts}
          </div>
          <p className="font-opensans text-xs text-muted-foreground">Productos totales</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <CheckCircle2 size={16} className="text-primary" />
          </div>
          <div style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl font-light text-foreground mb-1">
            {cats.filter((c) => c.count > 0).length}
          </div>
          <p className="font-opensans text-xs text-muted-foreground">Con productos</p>
        </div>
      </div>

      {/* Add new category */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={15} className="text-primary" />
          <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">Nueva categoría</h3>
        </div>

        <AnimatePresence>
          {addSuccess && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary rounded-xl px-4 py-3 mb-4">
              <CheckCircle2 size={14} />
              <span className="font-opensans text-xs">Categoría agregada exitosamente</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                value={newName}
                onChange={(e) => { setNewName(e.target.value); if (addError) setAddError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="Nombre de la categoría…"
                className={`font-opensans w-full px-4 py-2.5 bg-background border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all ${addError ? "border-red-400" : "border-border"
                  }`}
              />
              {addError && (
                <p className="font-opensans text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} /> {addError}
                </p>
              )}
            </div>
            <button onClick={handleAdd} disabled={addSaving}
              className="font-opensans text-[10px] tracking-[0.15em] uppercase bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-accent transition-colors flex items-center gap-1.5 shrink-0 h-fit disabled:opacity-60">
              {addSaving ? <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /></> : <Plus size={13} />} Agregar
            </button>
          </div>
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descripción (opcional)…"
            className="font-opensans w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all"
          />
          {/* Image */}
          <div>
            <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-2">
              Imagen de categoría <span className="text-red-400">*</span>
            </label>
            <label className="relative inline-block cursor-pointer group">
              {newImagePreview ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                  <img src={newImagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => { e.preventDefault(); setNewImagePreview(null); setNewImageFile(undefined); }}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={`w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center hover:border-primary/40 transition-all ${imageError ? "border-red-400" : "border-border"}`}>
                  <Upload size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors mb-1" />
                  <p className="font-opensans text-[9px] text-muted-foreground/50">Subir</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setNewImageFile(f);
                    setImageError(""); // ← limpia el error al subir
                    const r = new FileReader();
                    r.onload = (ev) => setNewImagePreview(ev.target?.result as string);
                    r.readAsDataURL(f);
                  }
                  e.target.value = "";
                }} />
            </label>
            {imageError && (
              <p className="font-opensans text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} /> {imageError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Tag size={15} className="text-primary" />
          <h3 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">Categorías</h3>
          <span className="font-opensans text-xs text-muted-foreground ml-auto">{cats.length} categorías</span>
        </div>

        <div className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {cats.map((cat) => {
              const isEditing = editingUuid === cat.uuid;
              const isDeleting = deletingUuid === cat.uuid;

              return (
                <motion.div key={cat.uuid}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.22 }}
                >
                  <div className={`flex items-center gap-4 px-5 py-4 transition-colors ${isDeleting ? "bg-red-500/5" : "hover:bg-secondary/40"}`}>
                    {/* Icon / image thumbnail */}
                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 overflow-hidden">
                      {cat.image
                        ? <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        : CatIconEl(cat.name)
                      }
                    </div>

                    {/* Name / edit input */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(cat.uuid, cat.name);
                              if (e.key === "Escape") setEditingUuid(null);
                            }}
                            className="font-opensans w-full px-3 py-1.5 bg-background border border-primary/40 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                          />
                          <input
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Descripción…"
                            className="font-opensans w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                          />
                          {/* Edit image */}
                          <div className="flex items-center gap-2">
                            <label className="relative cursor-pointer group">
                              {editImagePreview ? (
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border">
                                  <img src={editImagePreview} alt="edit" className="w-full h-full object-cover" />
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setEditImagePreview(undefined);
                                      setEditImageFile(undefined);
                                      setEditExistingImage(undefined);
                                    }}
                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div className="w-14 h-14 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary/40 transition-all">
                                  <Upload size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                  <p className="font-opensans text-[8px] text-muted-foreground/50 mt-0.5">Imagen</p>
                                </div>
                              )}
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    setEditImageFile(f);
                                    const r = new FileReader();
                                    r.onload = (ev) => setEditImagePreview(ev.target?.result as string);
                                    r.readAsDataURL(f);
                                  }
                                  e.target.value = "";
                                }} />
                            </label>
                            <p className="font-opensans text-[9px] text-muted-foreground/60">Imagen de categoría</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-sm font-medium text-foreground">{cat.name}</p>
                          {cat.description && (
                            <p className="font-opensans text-[10px] text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                          )}
                          <p className="font-opensans text-[10px] text-muted-foreground mt-0.5">
                            {cat.count} {cat.count === 1 ? "producto" : "productos"}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Product count badge */}
                    {!isEditing && !isDeleting && (
                      <span className="hidden md:flex font-opensans text-xs bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-full shrink-0">
                        {cat.count} prods.
                      </span>
                    )}

                    {/* Actions */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => saveEdit(cat.uuid, cat.name)} disabled={editSaving}
                          className="font-opensans text-[10px] tracking-wide bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-1 disabled:opacity-60">
                          {editSaving ? <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save size={11} />} Guardar
                        </button>
                        <button onClick={() => setEditingUuid(null)}
                          className="font-opensans text-[10px] tracking-wide border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                          Cancelar
                        </button>
                      </div>
                    ) : isDeleting ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="font-opensans text-[10px] text-red-500">¿Eliminar?</p>
                        <button onClick={() => handleDelete(cat.uuid, cat.name)}
                          className="font-opensans text-[10px] tracking-wide bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                          Sí
                        </button>
                        <button onClick={() => setDeletingUuid(null)}
                          className="font-opensans text-[10px] tracking-wide border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(cat)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setDeletingUuid(cat.uuid); setEditingUuid(null); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                          title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="font-opensans text-sm text-muted-foreground">Cargando categorías…</p>
            </div>
          )}
          {!loading && cats.length === 0 && (
            <div className="text-center py-16">
              <Tag size={32} className="text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-opensans text-sm text-muted-foreground">Por el momento no hay categorías registradas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Product Form ─────────────────────────────────────────────────────────

interface AddFormData { name: string; description: string; price: string; stock: string; }

function AddProductSection() {
  const [form, setForm] = useState<AddFormData>({ name: "", description: "", price: "", stock: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AddFormData, boolean>>>({});
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsTouched, setCatsTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryService.getAll()
      .then((data) => setApiCategories(data.map(normalizeCategory)))
      .catch(() => setApiCategories([]))
      .finally(() => setCatsLoading(false));
  }, []);

  const toggleCatAdd = (uuid: string) => {
    const updated = selectedUuids.includes(uuid)
      ? selectedUuids.filter((id) => id !== uuid)
      : [...selectedUuids, uuid];

    setSelectedUuids(updated);
    setCatsTouched(true);

    setErrors((prev) => ({
      ...prev,
      categories: updated.length === 0 ? "Selecciona al menos una categoría" : undefined,
    }));
  };

  const validate = (f: AddFormData): FormErrors => {
    const e: FormErrors = {};
    if (!f.name.trim()) e.name = "El nombre es requerido";
    if (selectedUuids.length === 0) e.categories = "Selecciona al menos una categoría";
    if (f.description.trim().length < 20) e.description = "Mínimo 20 caracteres";
    if (!f.price.trim() || isNaN(Number(f.price)) || Number(f.price) <= 0) e.price = "Ingresa un precio válido";
    return e;
  };

  const set = (field: keyof AddFormData, val: string) => {
    const updated = { ...form, [field]: val };
    setForm(updated);
    if (touched[field]) setErrors(validate(updated));
  };
  const blur = (field: keyof AddFormData) => { setTouched((t) => ({ ...t, [field]: true })); setErrors(validate(form)); };

  const handleSubmit = async () => {
    setCatsTouched(true);
    const all = Object.keys(form).reduce((a, k) => ({ ...a, [k]: true }), {} as Record<keyof AddFormData, boolean>);
    setTouched(all);
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Formulario incompleto", { description: "Revisa los campos marcados antes de continuar." });
      return;
    }
    setSubmitting(true);
    try {
      await productService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        categoryUuids: selectedUuids,
        images: imageFiles,
      });
      toast.success("Producto guardado", { description: `"${form.name}" fue agregado al catálogo exitosamente.` });
      setForm({ name: "", description: "", price: "", stock: "" });
      setTouched({});
      setSelectedUuids([]);
      setCatsTouched(false);
      setImagePreviews([]);
      setImageFiles([]);
    } catch {
      toast.error("Error al guardar", { description: "No se pudo crear el producto. Intenta de nuevo." });
    } finally {
      setSubmitting(false);
    }
  };

  const ic = (f: keyof FormErrors) =>
    `font-opensans w-full px-4 py-3 bg-background border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all resize-none ${touched[f as keyof AddFormData] && errors[f] ? "border-red-400 focus:ring-red-200"
      : touched[f as keyof AddFormData] && !errors[f] ? "border-primary/50 focus:ring-primary/20"
        : "border-border focus:ring-primary/20"
    }`;

  const addImage = (file: File) => {
    if (imagePreviews.length >= 5) return;
    setImageFiles((prev) => [...prev, file]);
    const r = new FileReader();
    r.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
    r.readAsDataURL(file);
  };

  const removeImage = (i: number) => {
    setImagePreviews((prev) => prev.filter((_, j) => j !== i));
    setImageFiles((prev) => prev.filter((_, j) => j !== i));
  };

  return (
    <div>
      <div className="bg-card rounded-2xl p-7 shadow-sm border border-border space-y-5">
        {/* Name */}
        <FormField label="Nombre del producto" required error={touched.name ? errors.name : undefined} ok={!!(touched.name && !errors.name && form.name)}>
          <input type="text" placeholder="Ej. Aceite de Lavanda Premium" value={form.name}
            onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} className={ic("name")} />
        </FormField>

        {/* Categories */}
        <FormField label="Categorías" required error={catsTouched ? errors.categories : undefined} ok={!catsTouched ? false : selectedUuids.length > 0}>
          {catsLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-background border border-border rounded-xl">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              <p className="font-opensans text-xs text-muted-foreground">Cargando categorías…</p>
            </div>
          ) : apiCategories.length === 0 ? (
            <div className="px-4 py-3 bg-background border border-border rounded-xl">
              <p className="font-opensans text-xs text-muted-foreground">No hay categorías disponibles. Crea una primero.</p>
            </div>
          ) : (
            <div className={`border rounded-xl overflow-hidden max-h-44 overflow-y-auto ${catsTouched && selectedUuids.length === 0 ? "border-red-400" : "border-border"}`}>
              {apiCategories.map((c) => {
                const checked = selectedUuids.includes(c.uuid);
                return (
                  <label key={c.uuid}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-border last:border-0 ${checked ? "bg-primary/8" : "hover:bg-secondary"}`}
                    onClick={() => toggleCatAdd(c.uuid)}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                      {checked && <Check size={10} className="text-white" />}
                    </div>
                    <span className="font-opensans text-sm text-foreground">{c.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          {selectedUuids.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {apiCategories.filter((c) => selectedUuids.includes(c.uuid)).map((c) => (
                <span key={c.uuid} className="font-opensans text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                  {c.name}
                  <button type="button" onClick={() => toggleCatAdd(c.uuid)}><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
        </FormField>

        {/* Description */}
        <FormField label="Descripción" required error={touched.description ? errors.description : undefined} ok={!!(touched.description && !errors.description && form.description)}>
          <div className="relative">
            <textarea rows={4} placeholder="Describe el producto, sus características y origen…" value={form.description}
              onChange={(e) => set("description", e.target.value)} onBlur={() => blur("description")} className={ic("description")} />
            <span className="absolute bottom-3 right-3 font-opensans text-[10px] text-muted-foreground">{form.description.length}</span>
          </div>
        </FormField>

        {/* Price + Stock */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Precio (MXN)" required error={touched.price ? errors.price : undefined} ok={!!(touched.price && !errors.price && form.price)}>
            <input type="number" min="0" placeholder="Ej. 250" value={form.price}
              onChange={(e) => set("price", e.target.value)} onBlur={() => blur("price")} className={ic("price")} />
          </FormField>
          <FormField label="Stock inicial" error={undefined} ok={false}>
            <input type="number" min="0" placeholder="Ej. 20" value={form.stock}
              onChange={(e) => set("stock", e.target.value)} className={ic("stock")} />
          </FormField>
        </div>

        {/* Images (up to 5) */}
        <div>
          <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-2">
            Imágenes del producto <span className="normal-case opacity-60">(máx. 5)</span>
          </label>
          <div className="flex gap-3 flex-wrap">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={16} />
                </button>
              </div>
            ))}
            {imagePreviews.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all group">
                <Upload size={16} className="text-muted-foreground/35 group-hover:text-primary transition-colors mb-1" />
                <p className="font-opensans text-[9px] text-muted-foreground/50">Subir</p>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) addImage(file); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <p className="font-opensans text-[10px] text-muted-foreground mt-2">PNG, JPG, WebP · máx. 10 MB por imagen</p>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSubmit} disabled={submitting}
          className="font-opensans text-[11px] tracking-[0.18em] uppercase bg-primary text-white w-full py-4 rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Guardando…</> : <><Plus size={14} /> Guardar producto</>}
        </motion.button>
      </div>
    </div>
  );
}

function FormField({ label, required, error, ok, children }: {
  label: string; required?: boolean; error?: string; ok?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-opensans text-[10px] tracking-[0.18em] uppercase text-foreground/55 block mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="font-opensans text-xs text-red-500 mt-1.5 flex items-center gap-1.5"><AlertCircle size={11} />{error}</p>}
      {ok && <p className="font-opensans text-xs text-primary mt-1.5 flex items-center gap-1.5"><Check size={11} />Correcto</p>}
    </div>
  );
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────

function AdminPanel({ navigate, isDark, toggleDark }: {
  navigate: (p: Page) => void;
  isDark: boolean;
  toggleDark: () => void;
}) {
  const [section, setSection] = useState<AdminSection>("inventory");

  const handleLogout = () => {
    toast("¿Cerrar sesión?", {
      description: "Se cerrará tu sesión de administrador.",
      action: {
        label: "Confirmar",
        onClick: async () => {
          await authService.logout();
          toast.success("Sesión cerrada", { description: "Has salido del panel administrativo." });
          navigate("admin-gate");
        },
      },
      cancel: { label: "Cancelar", onClick: () => { } },
      duration: 6000,
    });
  };

  const sidebarLinks: { id: AdminSection; label: string; Icon: React.ElementType }[] = [
    { id: "inventory", label: "Inventario", Icon: Boxes },
    { id: "add-product", label: "Agregar producto", Icon: Plus },
    { id: "categories", label: "Categorías", Icon: Tag },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-[#475644] dark:bg-[#2d3829] flex-col">
        <div className="p-6 border-b border-white/8 flex items-center justify-between">
          <div>
            <p className="font-opensans text-[9px] tracking-[0.3em] uppercase text-white/30 mb-1">Panel</p>
            <p style={{ fontFamily: "'Roboto', sans-serif" }} className="text-lg font-light text-white">Administrador</p>
          </div>
          <button onClick={toggleDark}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 shrink-0"
            title={isDark ? "Modo claro" : "Modo oscuro"}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
        <nav className="p-3 flex-1 space-y-1">
          {sidebarLinks.map((l) => (
            <button key={l.id} onClick={() => setSection(l.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-opensans text-sm ${section === l.id
                ? "bg-primary/20 text-primary"
                : "text-white/55 hover:bg-white/6 hover:text-white/80"
                }`}>
              <l.Icon size={15} />
              {l.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/8">
          <button onClick={handleLogout}
            className="font-opensans text-[10px] tracking-[0.15em] uppercase text-white/30 hover:text-white transition-colors px-3 py-2 w-full text-left">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-secondary overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden bg-[#475644] dark:bg-[#2d3829] px-5 py-4 flex items-center gap-4 overflow-x-auto">
          {sidebarLinks.map((l) => (
            <button key={l.id} onClick={() => setSection(l.id)}
              className={`font-opensans text-[10px] tracking-wide uppercase whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${section === l.id ? "bg-primary/25 text-primary" : "text-white/40"
                }`}>
              <l.Icon size={10} /> {l.label}
            </button>
          ))}
          <button onClick={toggleDark}
            className="text-white/40 hover:text-white transition-colors shrink-0"
            title={isDark ? "Modo claro" : "Modo oscuro"}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={handleLogout} className="ml-auto text-white/30 font-opensans text-[10px] whitespace-nowrap">Salir</button>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Section header */}
              <div className="mb-8">
                <p className="font-opensans text-[10px] tracking-[0.4em] uppercase text-primary mb-2">Panel administrativo</p>
                <h1 style={{ fontFamily: "'Roboto', sans-serif" }} className="text-2xl md:text-3xl font-light text-foreground">
                  {section === "inventory" ? "Inventario" : section === "add-product" ? "Agregar producto" : "Categorías"}
                </h1>
              </div>

              {section === "inventory" && <InventorySection />}
              {section === "add-product" && <AddProductSection />}
              {section === "categories" && <CategoriesSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => { document.title = "Hóltún Centro Holístico"; }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const token = localStorage.getItem("holtun_token");

    if (!token) {
      setCheckingSession(false);
      return;
    }

    authService.validateToken(token)
      .then(() => {
        setPage("admin");
      })
      .catch(() => {
        // Token inválido o expirado — lo limpiamos
        localStorage.removeItem("holtun_token");
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const navigate = (p: Page, anchor?: string) => {
    setPage(p);
    if (anchor) {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const showChrome = page !== "admin";

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: { fontFamily: "'Open Sans', sans-serif", fontSize: "13px" },
        }}
      />
      {showChrome && <Navbar page={page} navigate={navigate} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />}

      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          {page === "home" && <HomePage navigate={navigate} />}
          {page === "catalog" && <CatalogPage navigate={navigate} setProduct={setSelectedProduct} />}
          {page === "product" && selectedProduct && <ProductPage product={selectedProduct} navigate={navigate} />}
          {page === "therapies" && <TherapiesPage navigate={navigate} />}
          {page === "admin-gate" && <AdminGatePage navigate={navigate} />}
          {page === "admin" && <AdminPanel navigate={navigate} isDark={isDark} toggleDark={() => setIsDark(!isDark)} />}
        </motion.div>
      </AnimatePresence>

      {showChrome && <Footer navigate={navigate} />}
    </div>
  );
}
