"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";

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

export default function Home() {
  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-[#1B198F] text-white">
      {/* Circle Blur */}
      <div className="z-0 absolute top-[-400px] left-[-400px] w-[900px] h-[1000px] bg-[#A9DB1B] rounded-full blur-[150px]"></div>
      <div className="z-0 absolute top-[400px] right-[-400px] w-[900px] h-[1000px] bg-[#A9DB1B] rounded-full blur-[150px]"></div>

      <div className="w-full relative z-10 flex flex-col">
        {/* Hero Section */}
        <section className="w-full min-h-screen flex flex-col">
          <nav className="flex justify-between items-center font-sans p-10 mx-20">
            <h1 className="text-2xl font-bold cursor-pointer">TernakCreator.</h1>
            <ul className="flex flex-row gap-25 font-thin">
              <li className="nav-link cursor-pointer">About Us</li>
              <li className="nav-link cursor-pointer">Pricing</li>
              <li className="nav-link cursor-pointer">Careers</li>
              <li className="nav-link cursor-pointer">Testimonials</li>
            </ul>
            <button className="glass-button font-thin font-sans rounded-full px-5 py-2 cursor-pointer"> Join Now </button>
          </nav>

          <div className="flex flex-col items-center justify-center flex-grow mt-[-550px]">
            <h1 className="font-sans text-md font-bold">
              From Creator to Entrepreneur.
            </h1>
            <p className="z-10 font-sans text-7xl font-thin text-center tracking-tighter mt-[-5px]">
              One System, Thousands of Creators, <br /> Millions of Interactions.
            </p>
            <button className="glass-button font-sans font-thin text-black rounded-full px-5 py-2 cursor-pointer mt-10"> Get Started </button>
          </div>

          <div className="absolute top-55 right-60 flex items-center justify-center">
            <img src="Phone 1.png" alt="Phone" className="z-0 grayscale w-[80%]" />

            {/* Floating Glass Cards */}
            <div className="glass-card absolute top-[20%] right-[40%] z-10 translate-x-10">
              <span className="text-md">1k+ People Just Following You</span>
            </div>

            <div className="glass-card absolute left-[-5%] z-10 -translate-x-10" style={{ animationDelay: '2s' }}>
              <span className="text-md">Your Video Gets 1k+ Likes</span>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="w-full min-h-screen relative flex flex-col items-start justify-center bg-white p-24 overflow-hidden font-sans">
          {/* Decorative Wavy Lines (SVG) */}
          <div className="absolute top-0 right-[-5%] w-[40%] text-[#A9DB1B] opacity-80">
            <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
              <path
                d="M0,100 Q100,50 200,100 T400,100"
                fill="none" stroke="currentColor" strokeWidth="25" strokeLinecap="round"
                className="translate-y-0"
              />
              <path
                d="M0,150 Q100,100 200,150 T400,150"
                fill="none" stroke="currentColor" strokeWidth="25" strokeLinecap="round"
                className="translate-y-10"
              />
              <path
                d="M0,200 Q100,150 200,200 T400,200"
                fill="none" stroke="currentColor" strokeWidth="25" strokeLinecap="round"
                className="translate-y-20"
              />
            </svg>
          </div>

          <div className="z-10 max-w-4xl">
            <h2 className="text-[120px] font-bold leading-[0.9] text-[#A9DB1B] mb-8 tracking-tighter">
              WHO WE <br /> ARE?
            </h2>
            <p className="text-[#A9DB1B] text-5xl font-medium leading-[1.1] tracking-tight max-w-2xl underline decoration-1 underline-offset-8">
              Designed to help your business increase engagement on social media without getting tired.
            </p>
          </div>

          {/* Metrics Section */}
          <div className="w-[75%] mt-32 flex justify-between items-end self-center">
            <div className="flex flex-col items-center">
              <span className="text-7xl font-bold text-[#A9DB1B]">
                <RollingNumber target={100} suffix="M+" />
              </span>
              <span className="text-[#A9DB1B]/60 text-xl font-bold">Viewers</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xl text-[#A9DB1B]/60 mb-4">Chosen by</span>
              <span className="text-7xl font-bold text-[#A9DB1B]">
                <RollingNumber target={500} suffix="+" />
              </span>
              <span className="text-[#A9DB1B]/60 text-xl font-bold">Entrepreneurs</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-7xl font-bold text-[#A9DB1B]">
                <RollingNumber target={1000} suffix="+" />
              </span>
              <span className="text-[#A9DB1B]/60 text-xl font-bold">Content Creators</span>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full min-h-screen relative flex flex-col items-center justify-center bg-[#1B198F] p-24 overflow-hidden font-sans">
          {/* Bottom Glow Effect */}
          <div className="z-0 absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[#A9DB1B] rounded-full blur-[180px] opacity-20"></div>

          <div className="z-10 text-center mb-16">
            <h2 className="text-7xl font-bold text-white mb-6 tracking-tight">
              The Perfect Price for Your Needs
            </h2>
            <p className="text-white/70 text-xl max-w-2xl mx-auto leading-relaxed">
              Our transparent pricing makes it easy to find a plan that works within your financial constraints.
            </p>
          </div>

          <div className="z-10 flex gap-8 w-full max-w-7xl justify-center items-center">
            {/* Best Selling Card */}
            <div className="pricing-card group relative w-[33%] min-h-[550px] bg-white/5 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 flex flex-col overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-white/40">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#A9DB1B]/20 pointer-events-none"></div>

              <div className="self-center bg-[#8CBF00] px-8 py-2 rounded-full mb-10 shadow-lg">
                <span className="text-white font-medium text-sm">Best Selling</span>
              </div>

              <div className="mb-8">
                <span className="text-white/40 line-through text-lg block">Rp1.500.000</span>
                <span className="text-white text-5xl font-bold">Rp999.000</span>
              </div>

              <div className="flex-grow">
                <h3 className="text-white/70 text-xl font-medium mb-4">What You Get:</h3>
                <ul className="space-y-3">
                  {['Exclusive Modul', 'Big Community', 'Monetize Guide', 'Collab Opportunities'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-[#FAFAFA]/70 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#A9DB1B]/20 flex items-center justify-center text-[#A9DB1B]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="self-center flex items-center gap-2 bg-[#8CBF00] text-white px-8 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg">
                Buy Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </button>
            </div>

            {/* Custom Card (Center - Highlighted) */}
            <div className="pricing-card group relative w-[33%] min-h-[600px] bg-white/10 backdrop-blur-2xl border border-white/30 rounded-[32px] p-10 flex flex-col overflow-hidden transition-all duration-500 hover:bg-white/15 hover:border-white/50 scale-105 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#A9DB1B]/30 pointer-events-none"></div>

              <div className="self-center bg-[#A9DB1B] px-10 py-2 rounded-full mb-12 shadow-xl">
                <span className="text-white font-bold text-sm">Custom</span>
              </div>

              <div className="mb-5">
                <span className="text-white/70 text-lg block font-medium">Start From</span>
                <span className="text-white text-5xl font-bold tracking-tight">Rp1.000.000</span>
              </div>

              <div className="flex-grow">
                <h3 className="text-white/70 text-xl font-medium mb-4">What You Get:</h3>
                <ul className="space-y-3">
                  {['Exclusive Modul', 'Big Community', 'Monetize Guide', 'Collab Opportunities'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-[#FAFAFA]/70 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#A9DB1B]/20 flex items-center justify-center text-[#A9DB1B]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="self-center flex justify-between gap-2 bg-[#A9DB1B] text-white px-10 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
                View All
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </button>
            </div>

            {/* Best Seller Card */}
            <div className="pricing-card group relative w-[33%] min-h-[550px] bg-white/5 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 flex flex-col overflow-hidden transition-all duration-500 hover:bg-white/10 hover:border-white/40">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#A9DB1B]/20 pointer-events-none"></div>

              <div className="self-center bg-[#8CBF00] px-8 py-2 rounded-full mb-10 shadow-lg">
                <span className="text-white font-medium text-sm">Best Seller</span>
              </div>

              <div className="mb-5">
                <span className="text-white/40 line-through text-lg block">Rp6.000.000</span>
                <span className="text-white text-5xl font-bold">Rp5.000.000</span>
              </div>

              <div className="flex-grow">
                <h3 className="text-white/70 text-xl font-medium mb-4">What You Get:</h3>
                <ul className="space-y-3">
                  {['Exclusive Modul', 'Big Community', 'Monetize Guide', 'Collab Opportunities'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-[#FAFAFA]/70 font-medium">
                      <div className="w-5 h-5 rounded-full bg-[#A9DB1B]/20 flex items-center justify-center text-[#A9DB1B]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button className="self-center flex items-center gap-2 bg-[#8CBF00] text-white px-8 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-lg">
                Buy Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* Premium Careers Section (AI Version) */}
        <section className="w-full min-h-screen relative flex flex-col items-center justify-center bg-[#FAFAFA] p-24 overflow-hidden font-sans border-t border-black/5">
          {/* Decorative Floating Blobs for Soft Depth */}
          <div className="z-0 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#A9DB1B]/10 rounded-full blur-[120px]"></div>
          <div className="z-0 absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-[#1B198F]/5 rounded-full blur-[100px]"></div>

          <div className="z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-20">
            {/* Left Column: Typography & Title */}
            <div className="w-full lg:w-1/2 flex flex-col items-start">
              <span className="text-[#A9DB1B] font-bold tracking-widest uppercase mb-4 text-sm">Join the Revolution</span>
              <h2 className="text-[100px] font-black leading-[0.8] text-[#1B198F] tracking-tighter mb-10">
                START <br /> YOUR <br /> <span className="text-[#A9DB1B]">CAREER.</span>
              </h2>
              <p className="text-[#1B198F]/60 text-xl font-medium max-w-md leading-relaxed">
                Jadilah bagian dari ekosistem konten kreator. Kami tidak hanya menawarkan pekerjaan, tapi sebuah perjalanan untuk menjadi <span className="text-[#1B198F] font-bold">Creator-Entrepreneur</span> sejati.
              </p>

              <div className="mt-12 flex gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover grayscale" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-[#A9DB1B] flex items-center justify-center text-white font-bold text-xs">
                    +12k
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[#1B198F] font-bold text-sm">Join 12,000+ others</span>
                  <span className="text-[#1B198F]/40 text-xs">already building their future</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium Interactive Card */}
            <div className="w-full lg:w-1/2 relative group">
              {/* Card Shadow/Glow Background */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#A9DB1B]/20 to-[#1B198F]/10 rounded-[48px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative w-full aspect-[4/5] bg-white rounded-[40px] shadow-2xl overflow-hidden border border-black/5 flex flex-col">
                {/* Card Header Gradient */}
                <div className="h-2 w-full bg-gradient-to-r from-[#1B198F] to-[#A9DB1B]"></div>

                <div className="p-12 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex flex-col">
                      <span className="text-[#1B198F] font-bold text-2xl">Ternak Creator.</span>
                      <span className="text-[#1B198F]/40 text-sm font-medium">Professional Access</span>
                    </div>
                    <div className="bg-[#A9DB1B]/10 text-[#A9DB1B] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Special Offer
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col justify-center">
                    <h4 className="text-[#1B198F]/40 text-lg font-medium mb-1">Lifetime Membership</h4>
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-[#1B198F] text-7xl font-black tracking-tight">Rp2.500.000</span>
                    </div>
                    <p className="text-[#1B198F]/50 text-base leading-relaxed mb-8">
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

                  <button className="mt-auto w-full group relative overflow-hidden bg-[#1B198F] text-white py-6 rounded-2xl font-bold text-xl transition-all hover:shadow-[0_20px_40px_rgba(27,25,143,0.3)] hover:-translate-y-1 active:scale-[0.98]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    Dapatkan Akses Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="w-full min-h-screen relative flex flex-col items-center justify-center bg-[#1B198F] p-10 overflow-hidden font-sans">
          {/* Decorative Glows */}
          <div className="z-0 absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#A9DB1B]/20 rounded-full blur-[150px]"></div>
          <div className="z-0 absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]"></div>

          <div className="z-10 text-center mb-20">
            <span className="text-[#A9DB1B] font-bold tracking-[0.2em] uppercase text-sm mb-[-6px] block">Trusted by Entrepreneur</span>
            <h2 className="text-7xl font-bold text-white tracking-tight leading-tight mb-[-24px]">
              What They Say <br /> About Us
            </h2>
          </div>

          <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-7xl px-2">
            {[
              { name: "Andhika Pratama", role: "Owner Business XX", text: "Mantap", rating: 5 },
              { name: "Siti Rahma", role: "Owner Business XX", text: "Terimakasi, sekarang <br/> follower saya nambah <br/> 400 dalam 1 minggu", rating: 5 },
              { name: "Budi Santoso", role: "Owner Business XX", text: "Keren", rating: 5 },
              { name: "Dina Lestari", role: "Owner Business XX", text: "Rame cuy Usaha saya", rating: 5 },
              { name: "Rizky Fauzi", role: "Owner Business XX", text: "Mengerikan", rating: 5 },
              { name: "Maya Indah", role: "Owner Business XX", text: "Sheesh!", rating: 5 }
            ].map((testi, i) => (
              <div key={i} className="glass-card group flex flex-col p-10 rounded-[40px] bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-3 shadow-2xl h-full">
                <div className="flex gap-1.5 mb-8">
                  {[...Array(testi.rating)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 text-[#A9DB1B] drop-shadow-[0_0_8px_rgba(169,219,27,0.5)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p
                  className="text-white/80 text-xl leading-relaxed mb-10 font-medium italic"
                  dangerouslySetInnerHTML={{ __html: `"${testi.text}"` }}
                />

                <div className="mt-auto flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/10 shadow-lg">
                    <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt={testi.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-white font-bold text-lg">{testi.name}</h4>
                    <span className="text-[#A9DB1B] text-sm font-semibold tracking-wider uppercase">{testi.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Section */}
        <footer className="w-full bg-[#1B198F] pt-24 pb-12 px-24 border-t border-white/5 relative overflow-hidden font-sans">
          {/* Subtle Background Detail */}
          <div className="z-0 absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#A9DB1B]/30 to-transparent"></div>

          <div className="z-10 max-w-7xl mx-auto flex flex-col gap-20">
            <div className="flex flex-col lg:flex-row justify-between gap-16">
              {/* Brand Column */}
              <div className="flex flex-col items-start max-w-sm">
                <h2 className="text-3xl font-bold text-white mb-6">TernakCreator.</h2>
                <p className="text-white/50 text-lg leading-relaxed mb-8">
                  Membangun jembatan antara konten kreator dan dunia bisnis. Kami hadir untuk membantu Anda tumbuh lebih cepat dan lebih cerdas.
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: "instagram", link: "#" },
                    { icon: "linkedin", link: "#" },
                    { icon: "youtube", link: "#" }
                  ].map((soc, i) => (
                    <a key={i} href={soc.link} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#A9DB1B] hover:text-[#1B198F] transition-all duration-300">
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

              {/* Links Sections */}
              <div className="flex flex-col items-end">
                {[
                  { title: "Platform", links: ["About Us", "Pricing", "Features"] },
                ].map((group, i) => (
                  <div key={i} className="flex flex-col items-end gap-6">
                    <h4 className="text-white font-bold text-lg">{group.title}</h4>
                    <ul className="flex flex-col items-end gap-4">
                      {group.links.map((link, j) => (
                        <li key={j}>
                          <a href="#" className="text-white/40 hover:text-[#A9DB1B] transition-colors duration-200 text-base font-medium text-right">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
              <span className="text-white/30 text-sm">
                &copy; {new Date().getFullYear()} TernakCreator. All rights reserved.
              </span>
              <div className="flex gap-8">
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

