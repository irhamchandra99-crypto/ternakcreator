"use client";

import CreatorReviewVideo from "./component/CreatorReviewVideo";
import FeedbackForm from "./component/FeedbackForm";
import { useEffect, useState, useRef } from "react";

// Brand logos shown in the About-section marquee. Files live in
// public/Collaborator/ — spaces are percent-encoded for the URL.
const COLLABORATORS = [
  { name: "Daruma", src: "/Collaborator/DARUMA.png" },
  { name: "Donat Raya", src: "/Collaborator/DONAT%20RAYA.png" },
  { name: "D'Shaka", src: "/Collaborator/D'SHAKA.png" },
  { name: "Festive Coffee", src: "/Collaborator/FESTIVE%20COFFE.png" },
  { name: "Fil Coffee", src: "/Collaborator/FIL%20COFFE.png" },
  { name: "Pecel Yojo", src: "/Collaborator/PECEL%20YOJO.png" },
  { name: "Piezzo Coffee", src: "/Collaborator/PIEZZO%20COFFE.webp" },
  { name: "Posetraits", src: "/Collaborator/POSETRAITS.png" },
  { name: "Probosiwi Resort", src: "/Collaborator/PROBOSIWI%20RESORT.png" },
];

function RollingNumber({ target, duration = 2000, suffix = "" }: { target: number, duration?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return <span ref={elementRef}>{count}{suffix}</span>;
}

// ── PRICING DATA ──
const pricingData = {
  instagram: [
    {
      name: "Paket Spark",
      views: "10.000+ Views",
      price: "Rp200.000",
      oldPrice: null,
      featured: false,
      features: [
        
        "Maks. 2 Creator Visit (opsional)",
        "Organic Content",
        "100% Safe",
        "No Banned",
      ],
    },
    {
      name: "Paket Boost",
      views: "30.000+ Views",
      price: "Rp350.000",
      oldPrice: null,
      featured: true,
      features: [
        
        "Maks. 5 Creator Visit (opsional)",
        "Organic Content",
        "100% Safe",
        "No Banned",
      ],
    },
    {
      name: "Paket Impact",
      views: "50.000+ Views",
      price: "Rp475.000",
      oldPrice: null,
      featured: false,
      features: [
        
        "Maks. 10 Creator Visit (opsional)",
        "Organic Content",
        "100% Safe",
        "No Banned",
      ],
    },
  ],

  tiktok: [
    {
      name: "Paket Spark",
      views: "10.000+ Views",
      price: "Rp225.000",
      oldPrice: null,
      featured: false,
      features: [
        
        "Maks. 2 Creator Visit (opsional)",
        "Organic Content",
        "100% Safe",
        "No Banned",
      ],
    },
    {
      name: "Paket Boost",
      views: "30.000+ Views",
      price: "Rp375.000",
      oldPrice: null,
      featured: true,
      features: [
        
        "Maks. 5 Creator Visit (opsional)",
        "Organic Content",
        "100% Safe",
        "No Banned",
      ],
    },
    {
      name: "Paket Impact",
      views: "50.000+ Views",
      price: "Rp500.000",
      oldPrice: null,
      featured: false,
      features: [
        
        "Maks. 10 Creator Visit (opsional)",
        "Organic Content",
        "100% Safe",
        "No Banned",
      ],
    },
  ],
};

const CheckIcon = () => (
  <div className="w-5 h-5 rounded-full bg-[#A9DB1B]/20 flex items-center justify-center text-[#A9DB1B]">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
  </div>
);

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<"instagram" | "tiktok">("instagram");

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-[#1B198F] text-white">
      {/* Circle Blur — smaller on mobile so green doesn't flood the screen */}
      
      

      <div className="w-full relative z-10 flex flex-col">
        {/* ── HERO SECTION ── */}
        <section className="w-full min-h-screen flex flex-col relative z-10">

          {/* NAVBAR */}
          <nav className="flex justify-between items-center font-sans px-5 py-5 sm:px-10 sm:py-8">
            <h1 className="text-xl sm:text-2xl font-bold cursor-pointer">TernakCreator.</h1>

            {/* Desktop nav links */}
            <ul className="hidden lg:flex flex-row gap-12 font-light text-white/80">
              <li className="nav-link cursor-pointer hover:text-white transition-colors"><a href="#about">About Us</a></li>
              <li className="nav-link cursor-pointer hover:text-white transition-colors"><a href="#pricing">Pricing</a></li>
              <li className="nav-link cursor-pointer hover:text-white transition-colors"><a href="#careers">Careers</a></li>
              <li className="nav-link cursor-pointer hover:text-white transition-colors"><a href="#testimonials">Testimonials</a></li>
            </ul>

            {/* Desktop Join Now + Login — hidden on mobile, visible only on desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <a href="/login" className="font-light font-sans rounded-full px-6 py-2.5 cursor-pointer text-white/80 border border-white/20 hover:border-white/40 hover:text-white transition-colors">Login</a>
              <a href="#careers" className="glass-button font-light font-sans rounded-full px-6 py-2.5 cursor-pointer">Join Now</a>
            </div>

            {/* Mobile: hamburger */}
            <button
              className="lg:hidden flex flex-col gap-1.5 p-2 focus:outline-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </nav>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="lg:hidden absolute top-[72px] left-0 right-0 z-50 bg-[#1B198F]/95 backdrop-blur-md border-b border-white/10 px-6 py-6 flex flex-col gap-5">
              {[
                { label: 'About Us', href: '#about' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Careers', href: '#careers' },
                { label: 'Testimonials', href: '#testimonials' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/80 hover:text-white text-lg font-medium transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 flex flex-row gap-3 self-start">
                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="border border-white/30 text-white font-medium px-7 py-3 rounded-full text-base transition-all"
                >
                  Login
                </a>
                <a
                  href="#careers"
                  onClick={() => setMenuOpen(false)}
                  className="bg-[#A9DB1B] text-[#1B198F] font-bold px-7 py-3 rounded-full text-base transition-all"
                >
                  Join Now
                </a>
              </div>
            </div>
          )}

          {/* Hero Content */}
          <div className="relative flex flex-col items-center justify-center flex-grow text-center px-5 sm:px-8 pb-16 pt-6">

            {/* Decorative orbit rings — hidden on very small screens */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full border border-white/5 animate-[spin_30s_linear_infinite]"></div>
              <div className="absolute w-[420px] sm:w-[700px] h-[420px] sm:h-[700px] rounded-full border border-white/[0.03] animate-[spin_45s_linear_infinite_reverse]"></div>
              <div className="absolute w-[540px] sm:w-[900px] h-[540px] sm:h-[900px] rounded-full border border-white/[0.02]"></div>
              <div className="absolute w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] animate-[spin_30s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#A9DB1B]"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#A9DB1B]/50"></div>
              </div>
              <div className="absolute w-[420px] sm:w-[700px] h-[420px] sm:h-[700px] animate-[spin_45s_linear_infinite_reverse]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/30"></div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#A9DB1B]/60"></div>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="relative z-10 font-sans font-black tracking-tighter leading-[1.0] mb-5 text-5xl sm:text-6xl lg:text-[6rem] xl:text-[7rem] max-w-5xl">
              Kolaborasi
              <br />
              <span
                className="text-transparent"
                style={{
                  WebkitTextStroke: '2px #A9DB1B',
                  textShadow: '0 0 80px rgba(169,219,27,0.3)',
                }}
              >
                UMKM
              </span>
              {" "}
              <span className="text-[#A9DB1B]">&</span>
              {" "}
              <span className="text-white">Kreator.</span>
            </h2>

            {/* Subtitle */}
            <p className="relative z-10 font-sans text-base sm:text-xl md:text-2xl font-light leading-relaxed text-white/60 max-w-xl sm:max-w-2xl mb-9">
              Tingkatkan visibilitas produk dan buat{" "}
              <span className="text-white font-medium">campaign marketing</span> yang efektif dan terukur bersama ribuan{" "}
              <span className="text-[#A9DB1B] font-medium">nano-micro creator.</span>
            </p>

            {/* CTA Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 w-full">
              <a href="#pricing" className="w-full sm:w-auto bg-[#A9DB1B] hover:bg-[#c8f020] text-[#1B198F] font-bold px-10 py-4 rounded-full text-base sm:text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(169,219,27,0.35)] text-center">
                Mulai Campaign
              </a>
              <a
                href="https://www.instagram.com/reel/DVkpyzFEZSU/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 border border-white/20 hover:border-white/40 text-white font-medium px-8 py-4 rounded-full text-base sm:text-lg transition-all duration-300 hover:bg-white/5 backdrop-blur-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                Lihat Demo
              </a>
            </div>

            {/* Bottom decorative line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] sm:w-[600px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
          </div>

        </section>

        {/* ── ABOUT US SECTION ── */}
        <section id="about" className="w-full relative flex flex-col items-center justify-center bg-white overflow-hidden font-sans py-16 sm:py-24 px-5 sm:px-8 lg:px-24">
          {/* Decorative blobs */}
          <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] bg-[#A9DB1B] rounded-full blur-[180px] opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#1B198F] rounded-full blur-[150px] opacity-5 pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-7xl flex flex-col gap-12 sm:gap-20">

            {/* Top: Label + Heading + Description */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 sm:gap-10">
              <div className="flex flex-col">
                <span className="text-[#A9DB1B] text-sm font-bold tracking-[0.25em] uppercase mb-4 sm:mb-5">
                  Who We Are
                </span>
                <h2 className="text-4xl sm:text-6xl lg:text-[90px] font-black text-[#1B198F] leading-[0.9] tracking-tighter">
                  WHO WE <br />
                  <span className="text-[#A9DB1B]">ARE?</span>
                </h2>
              </div>
              <p className="text-[#1B198F]/50 text-lg sm:text-xl lg:text-2xl font-light leading-relaxed max-w-xl lg:text-right">
                Designed to help your business{" "}
                <span className="text-[#1B198F] font-medium">increase engagement</span> on social media
                without getting tired.
              </p>
            </div>

            {/* Middle: Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {[
                {
                  icon: (
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  ),
                  title: "Organic Growth",
                  desc: "Semua pertumbuhan audiens Anda terjadi secara alami — tanpa bot, tanpa risiko banned."
                },
                {
                  icon: (
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  ),
                  title: "Efisien & Cepat",
                  desc: "Hemat waktu dan tenaga. Sistem kami bekerja 24/7 sehingga Anda bisa fokus berkreasi."
                },
                {
                  icon: (
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                  title: "Komunitas Besar",
                  desc: "Bergabunglah bersama ribuan entrepreneur dan creator yang sudah membuktikan hasilnya."
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="group flex flex-col gap-5 p-6 sm:p-8 rounded-3xl border border-[#1B198F]/10 bg-white shadow-sm hover:shadow-md hover:border-[#A9DB1B]/60 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#A9DB1B]/15 flex items-center justify-center text-[#A9DB1B] group-hover:bg-[#A9DB1B]/25 transition-colors duration-300">
                    {card.icon}
                  </div>
                  <h3 className="text-[#1B198F] font-bold text-xl">{card.title}</h3>
                  <p className="text-[#1B198F]/50 text-base leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Bottom: Metric Counters */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#1B198F]/10 pt-8 sm:pt-12">
              {[
                { target: 10000, suffix: "+", label: "Total Viewers", sub: "Jangkauan konten kreator kami" },
                { target: 50, suffix: "+", label: "Entrepreneurs", sub: "Dipercaya oleh ratusan pebisnis" },
                { target: 100, suffix: "+", label: "Content Creators", sub: "Creator aktif di platform kami" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-0.5 sm:gap-1 group">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#A9DB1B] tabular-nums transition-transform group-hover:scale-105 duration-300">
                    <RollingNumber target={stat.target} suffix={stat.suffix} />
                  </span>
                  <span className="text-[#1B198F] font-bold text-xs sm:text-sm lg:text-base">{stat.label}</span>
                  <span className="text-[#1B198F]/40 text-[11px] sm:text-xs hidden sm:block">{stat.sub}</span>
                </div>
              ))}
            </div>

            {/* Collaborator logo marquee */}
            <div className="flex flex-col items-center gap-6 sm:gap-8 border-t border-[#1B198F]/10 pt-8 sm:pt-12">
              <span className="text-[#1B198F]/45 text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase">
                Our Collaborator
              </span>

              <div className="marquee w-full">
                <div className="marquee-track">
                  {/* Rendered twice so the loop is seamless; the copy is hidden from screen readers. */}
                  {[0, 1].map((copy) => (
                    <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                      {COLLABORATORS.map((brand) => (
                        <div
                          key={brand.name}
                          className="shrink-0 flex items-center justify-center h-10 sm:h-14 w-24 sm:w-32 px-3 sm:px-5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={brand.src}
                            alt={brand.name}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── PRICING SECTION ── */}
        <section id="pricing" className="w-full relative flex flex-col items-center justify-center bg-[#1B198F] py-16 sm:py-24 px-5 sm:px-8 lg:p-24 overflow-hidden font-sans">
          {/* Bottom Glow Effect */}
          <div className="z-0 absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[#A9DB1B] rounded-full blur-[180px] opacity-20"></div>

          <div className="z-10 text-center mb-10 sm:mb-12 px-2">
            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
              The Perfect Price for Your Needs
            </h2>
            <p className="text-white/70 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Our transparent pricing makes it easy to find a plan that works within your financial constraints.
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="z-10 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1.5 mb-10 sm:mb-16 backdrop-blur-sm">
            {(["instagram", "tiktok"] as const).map((platform) => (
              <button
                key={platform}
                onClick={() => setActivePlatform(platform)}
                className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${activePlatform === platform
                  ? "bg-[#A9DB1B] text-[#1B198F] shadow-lg"
                  : "text-white/60 hover:text-white"
                  }`}
              >
                {platform === "instagram" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"></path>
                  </svg>
                )}
                {platform === "instagram" ? "Instagram" : "TikTok"}
              </button>
            ))}
          </div>

          {/* Pricing Cards — stack on mobile, row on lg */}
          <div className="z-10 flex flex-col lg:flex-row gap-6 sm:gap-8 w-full max-w-5xl justify-center items-stretch lg:items-center">
            {pricingData[activePlatform].map((plan, idx) => (
              <div
                key={plan.name}
                className={`pricing-card group relative w-full lg:w-[33%] backdrop-blur-xl border rounded-[32px] flex flex-col overflow-hidden transition-all duration-500 ${plan.featured
                  ? "bg-white/10 border-white/30 p-8 sm:p-10 hover:bg-white/15 hover:border-white/50 lg:scale-105 shadow-2xl"
                  : "bg-white/5 border-white/20 p-7 sm:p-8 hover:bg-white/10 hover:border-white/40"
                  }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-transparent pointer-events-none ${plan.featured ? "to-[#A9DB1B]/30" : "to-[#A9DB1B]/20"}`}></div>

                <div className={`self-center px-8 py-2 rounded-full shadow-lg ${plan.featured ? "bg-[#A9DB1B] px-10 mb-10 shadow-xl" : "bg-[#8CBF00] mb-8"}`}>
                  <span className={`text-white text-sm ${plan.featured ? "font-bold" : "font-medium"}`}>{plan.name}</span>
                </div>

                <div className={plan.featured ? "mb-5" : "mb-6"}>
                  {plan.oldPrice && (
                    <span className="text-white/40 line-through text-lg block">{plan.oldPrice}</span>
                  )}
                  {plan.featured && (
                    <span className="text-white/70 text-lg block font-medium">Only With</span>
                  )}
                  <span className={`text-white font-bold ${plan.featured ? "text-4xl sm:text-5xl tracking-tight" : "text-4xl sm:text-5xl"}`}>{plan.price}</span>
                </div>

                <div className="flex-grow">
                  <h3 className="text-white/70 text-xl font-medium mb-4">What You Get:</h3>
                  <ul className="space-y-3">
                    {[plan.views, ...plan.features].map((item, i2) => (
                      <li key={i2} className="flex items-center gap-3 text-[#FAFAFA]/70 font-medium">
                        <CheckIcon />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href="https://wa.me/6289685482928"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 self-center flex items-center gap-2 text-white rounded-full transition-all hover:scale-105 active:scale-95 ${plan.featured
                    ? "justify-between bg-[#A9DB1B] px-10 py-3 font-bold shadow-xl"
                    : "bg-[#8CBF00] px-8 py-3 font-medium shadow-lg"
                    }`}
                >
                  Buy Now
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── CAREERS SECTION ── */}
        <section id="careers" className="w-full relative flex flex-col items-center justify-center bg-[#FAFAFA] py-16 sm:py-24 px-5 sm:px-8 lg:p-24 overflow-hidden font-sans border-t border-black/5">
          {/* Decorative Floating Blobs */}
          <div className="z-0 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#A9DB1B]/10 rounded-full blur-[120px]"></div>
          <div className="z-0 absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-[#1B198F]/5 rounded-full blur-[100px]"></div>

          <div className="z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12 sm:gap-20">
            {/* Left Column */}
            <div className="w-full lg:w-1/2 flex flex-col items-start">
              <span className="text-[#A9DB1B] font-bold tracking-widest uppercase mb-3 text-sm">Join the Revolution</span>
              <h2 className="text-6xl sm:text-7xl lg:text-[100px] font-black leading-[0.85] text-[#1B198F] tracking-tighter mb-8 sm:mb-10">
                START <br /> YOUR <br /> <span className="text-[#A9DB1B]">CAREER.</span>
              </h2>
              <p className="text-[#1B198F]/60 text-base sm:text-xl font-medium max-w-md leading-relaxed">
                Jadilah bagian dari ekosistem konten kreator. Kami tidak hanya menawarkan pekerjaan, tapi sebuah perjalanan untuk menjadi <span className="text-[#1B198F] font-bold">Creator-Entrepreneur</span> sejati.
              </p>
            </div>

            {/* Right Column: Membership Card */}
            <div className="w-full lg:w-1/2 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#A9DB1B]/20 to-[#1B198F]/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-black/5 flex flex-col">
                <div className="h-2 w-full bg-gradient-to-r from-[#1B198F] to-[#A9DB1B]"></div>

                <div className="p-8 sm:p-12 flex flex-col">
                  <div className="flex justify-between items-start mb-8 sm:mb-12">
                    <div className="flex flex-col">
                      <span className="text-[#1B198F] font-bold text-xl sm:text-2xl">Ternak Creator.</span>
                      <span className="text-[#1B198F]/40 text-sm font-medium">Professional Access</span>
                    </div>
                    <div className="bg-[#A9DB1B]/10 text-[#A9DB1B] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Special Offer
                    </div>
                  </div>

                  <div className="flex flex-col mb-6">
                    <h4 className="text-[#1B198F]/40 text-lg font-medium mb-1">Lifetime Membership</h4>
                    <div className="flex flex-col mb-4">
                      <span className="text-[#1B198F]/40 line-through text-2xl sm:text-3xl font-bold">Rp999.000</span>
                      <span className="text-[#1B198F] text-6xl sm:text-7xl font-black tracking-tight">Free</span>
                    </div>
                    <p className="text-[#1B198F]/50 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                      Dapatkan akses penuh ke komunitas eksklusif, dan Modul Pembelajaran Eksklusif seumur hidup.
                    </p>

                    <ul className="space-y-3">
                      {['Exclusive Modul', 'Big Community', 'Monetize Guide', 'Collab Opportunities'].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[#1B198F]/70 font-medium">
                          <div className="w-5 h-5 rounded-full bg-[#A9DB1B]/20 flex items-center justify-center text-[#A9DB1B]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSdFJyxcZ1cudvbxsje1iHcGH7me8rlAdqQGHi4j3UnnKtEupA/viewform" target="_blank" rel="noopener noreferrer" className="block w-full group relative overflow-hidden bg-[#1B198F] text-white py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all hover:shadow-[0_20px_40px_rgba(27,25,143,0.3)] hover:-translate-y-1 active:scale-[0.98] text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    Dapatkan Akses Sekarang
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ── CREATOR VIDEO REVIEWS SECTION ── */}
        <section className="w-full relative flex flex-col items-center justify-center bg-[#FAFAFA] py-16 sm:py-24 px-5 sm:px-8 lg:px-20 overflow-hidden font-sans border-t border-black/5">
          {/* Decorative Blobs */}
          <div className="z-0 absolute top-[-15%] right-[-10%] w-[550px] h-[550px] bg-[#1B198F]/5 rounded-full blur-[130px] pointer-events-none"></div>
          <div className="z-0 absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] bg-[#A9DB1B]/10 rounded-full blur-[110px] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-7xl flex flex-col gap-10 sm:gap-16">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[#1B198F] font-bold tracking-[0.2em] uppercase text-sm">Real Story</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#1B198F] tracking-tighter leading-[0.95]">
                Cerita Langsung <br />
                dari <span className="text-[#A9DB1B] italic">Creator</span> Kami.
              </h2>
              <p className="text-[#1B198F]/50 text-base sm:text-lg font-medium max-w-lg">
                Dengar sendiri pengalaman para content creator setelah bergabung dan berkembang bersama Ternak Creator.
              </p>
            </div>

            {/* Video Grid */}
            <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 max-w-3xl mx-auto">
              <CreatorReviewVideo
                src="/review-1.webm"
                // poster="/reviews/poster-1.jpg"
                name="Gilang Hanansyah"
                role="Content Creator"
              />
              <CreatorReviewVideo
                src="/review-2.webm"
                // poster="/reviews/poster-2.jpg"
                name="Nisa Chandra"
                role="Content Creator"
              />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS SECTION ── */}
        <section id="testimonials" className="w-full relative flex flex-col items-center justify-center bg-[#1B198F] py-16 sm:py-32 px-5 sm:px-6 lg:px-20 overflow-hidden font-sans">
          {/* Decorative Background Elements */}
          <div className="absolute top-10 right-10 w-[600px] h-[600px] bg-[#A9DB1B] rounded-full blur-[200px] opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-white rounded-full blur-[180px] opacity-[0.05] pointer-events-none"></div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>

          <div className="relative z-10 w-full max-w-7xl flex flex-col gap-12 sm:gap-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 sm:gap-10 border-b border-white/10 pb-8 sm:pb-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[#A9DB1B] font-bold tracking-[0.2em] uppercase text-sm">Trusted</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[1]">
                  What They <span className="text-[#A9DB1B] italic pr-2">Say</span> <br />
                  About Us
                </h2>
              </div>
              <div className="max-w-xs md:text-right">
                <p className="text-white/60 text-base sm:text-lg font-light">
                  <span className="text-white font-medium"></span> Banyak dari mereka telah membuktikan bagaimana sistem kami mengubah interaksi menjadi konversi nyata.
                </p>
              </div>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 items-stretch max-w-5xl mx-auto">
              {[
                { name: "Tim Pecel Yojo", role: "Pecel Yojo", logo: "/logo pecel yojo.jpg", logoClass: "", text: "Awalnya coba-coba doang, eh ternyata hasilnya beneran kerasa. Yang order pecel jadi makin rame, banyak juga yang tau dari konten creator-nya. Enak, ga ribet, tinggal terima jadi.", rating: 5, offset: "" },
                { name: "Tim Donat Raya", role: "Donat Raya", logo: "/Logo Donat Raya.jpg", logoClass: "", text: "Seneng banget bisa gabung, soalnya biasa promosi sendiri capek dan hasilnya gitu-gitu aja. Sekarang donat kita jadi sering muncul di FYP, orderan online juga ikut naik.", rating: 5, offset: "" },
                { name: "Tim Wiraadventure Tour and Travel", role: "Wiraadventure Tour and Travel", logo: "/Logo Wira Adventure.jpg", logoClass: "scale-[1] object-[28%_61%]", text: "Buat usaha travel kayak kita, konten itu penting banget buat bangun kepercayaan calon customer. Alhamdulillah setelah pakai jasa creator dari sini, banyak yang tanya-tanya paket trip terus akhirnya booking.", rating: 4.5, offset: "" }
              ].map((testi, i) => (
                <div
                  key={i}
                  className={`relative group flex flex-col h-full p-6 sm:p-8 lg:p-10 rounded-[24px] sm:rounded-[32px] bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-md border border-white/10 hover:border-[#A9DB1B]/50 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_40px_-20px_rgba(169,219,27,0.15)] ${testi.offset}`}
                >
                  <div className="absolute top-6 right-8 opacity-10 text-[80px] font-serif leading-none group-hover:text-[#A9DB1B] group-hover:opacity-20 transition-all duration-500 pointer-events-none">
                    "
                  </div>

                  <div className="flex gap-1 mb-6 sm:mb-8 z-10">
                    {[...Array(5)].map((_, idx) => {
                      const starValue = idx + 1;
                      if (starValue <= Math.floor(testi.rating)) {
                        return (
                          <svg key={idx} className="w-4 h-4 sm:w-5 sm:h-5 text-[#A9DB1B]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        );
                      } else if (starValue - 0.5 === testi.rating) {
                        return (
                          <div key={idx} className="relative w-4 h-4 sm:w-5 sm:h-5">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#A9DB1B]/30 absolute inset-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#A9DB1B] absolute inset-0 overflow-hidden" fill="currentColor" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        );
                      } else {
                        return (
                          <svg key={idx} className="w-4 h-4 sm:w-5 sm:h-5 text-[#A9DB1B]/30" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        );
                      }
                    })}
                  </div>

                  <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 font-light z-10">
                    &ldquo;{testi.text}&rdquo;
                  </p>

                  <div className="mt-auto w-full flex items-center gap-4 pt-5 sm:pt-6 border-t border-white/10 z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden p-[2px] bg-gradient-to-br from-[#A9DB1B] to-transparent shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <img src={testi.logo} alt={testi.name} className={`w-full h-full object-cover object-center ${testi.logoClass ?? ""}`} />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-white font-bold tracking-wide text-sm sm:text-base">{testi.name}</h4>
                      <span className="text-white/50 text-xs font-semibold uppercase tracking-wider mt-0.5">{testi.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── FEEDBACK FORM SECTION ── */}
        <FeedbackForm />

        {/* ── FOOTER ── */}
        <footer className="w-full bg-[#1B198F] pt-14 sm:pt-24 pb-10 sm:pb-12 px-5 sm:px-12 lg:px-24 border-t border-white/5 relative overflow-hidden font-sans">
          <div className="z-0 absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#A9DB1B]/30 to-transparent"></div>

          <div className="z-10 max-w-7xl mx-auto flex flex-col gap-12 sm:gap-20">
            <div className="flex flex-col sm:flex-row justify-between gap-10 sm:gap-16">
              {/* Brand Column */}
              <div className="flex flex-col items-start max-w-sm">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Ternak Creator.</h2>
                <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                  Membangun jembatan antara konten kreator dan dunia bisnis. Kami hadir untuk membantu Anda tumbuh lebih cepat dan lebih cerdas.
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: "instagram", link: "https://www.instagram.com/ternakcreator/" },
                    { icon: "linkedin", link: "#" },
                    { icon: "youtube", link: "#" }
                  ].map((soc, i) => (
                    <a key={i} href={soc.link} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#A9DB1B] hover:text-[#1B198F] transition-all duration-300">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="capitalize">
                        {soc.icon === 'instagram' && <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>}
                        {soc.icon === 'instagram' && <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>}
                        {soc.icon === 'instagram' && <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>}
                        {soc.icon === 'linkedin' && <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>}
                        {soc.icon === 'linkedin' && <rect x="2" y="9" width="4" height="12"></rect>}
                        {soc.icon === 'linkedin' && <circle cx="4" cy="4" r="2"></circle>}
                        {soc.icon === 'youtube' && <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.11 1 12 1 12s0 3.89.46 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.89 23 12 23 12s0-3.89-.46-5.58z"></path>}
                        {soc.icon === 'youtube' && <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>}
                      </svg>
                    </a>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex flex-col items-start sm:items-end">
                {[
                  { title: "Platform", links: ["About Us", "Pricing", "Features"] },
                ].map((group, i) => (
                  <div key={i} className="flex flex-col items-start sm:items-end gap-4 sm:gap-6">
                    <h4 className="text-white font-bold text-lg">{group.title}</h4>
                    <ul className="flex flex-col items-start sm:items-end gap-3 sm:gap-4">
                      {group.links.map((link, j) => (
                        <li key={j}>
                          <a href="#" className="text-white/40 hover:text-[#A9DB1B] transition-colors duration-200 text-base font-medium">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Lokasi Usaha — peta dan alamat dalam satu kartu */}
            <div className="rounded-3xl overflow-hidden border border-white/15 bg-white/[0.04]">
              <iframe
                title="Peta lokasi Ternak Creator"
                src="https://maps.google.com/maps?q=-7.7820755,110.3892965&z=17&hl=id&output=embed"
                className="w-full h-64 sm:h-80 border-0 block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />

              <div className="border-t border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#A9DB1B"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-1"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A9DB1B] text-xs font-bold tracking-[0.25em] uppercase">
                      Lokasi Usaha
                    </span>
                    <address className="not-italic text-white/60 text-sm sm:text-base leading-relaxed">
                      Jl. Pringgodani GK I No.173, RT.007/RW.03, Demangan,
                      <br className="hidden sm:block" /> Kec. Gondokusuman, Kota Yogyakarta,
                      Daerah Istimewa Yogyakarta 55221
                    </address>
                  </div>
                </div>

                <a
                  href="https://www.google.com/maps/place/Jl.+Pringgodani+GK+I+No.173,+RT.007%2FRW.03,+Demangan,+Kec.+Gondokusuman,+Kota+Yogyakarta,+Daerah+Istimewa+Yogyakarta+55221/@-7.7821181,110.3890872,18.59z/data=!4m6!3m5!1s0x2e7a59cf9e0e1de1:0xdc68ce9873f89a0e!8m2!3d-7.7820755!4d110.3892965"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-[#A9DB1B] hover:text-[#A9DB1B] text-white text-sm font-semibold px-5 py-3 transition-all duration-300"
                >
                  Buka di Google Maps
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 sm:pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-8">
              <span className="text-white/30 text-sm text-center md:text-left">
                &copy; {new Date().getFullYear()} Ternak Creator. All rights reserved.
              </span>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <a href="#" className="text-white/30 hover:text-white transition-colors text-sm">Privacy Policy</a>
                <a href="#" className="text-white/30 hover:text-white transition-colors text-sm">Terms of Service</a>
                <a href="#" className="text-white/30 hover:text-white transition-colors text-sm">Cookies Settings</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
