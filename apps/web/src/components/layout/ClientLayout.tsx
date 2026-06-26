"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import BottomNav from "@/components/layout/BottomNav";
import AuthProvider from "@/components/providers/AuthProvider";
import { Menu, Search, X } from "lucide-react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Close drawers on route change (mobile UX)
  useEffect(() => {
    setLeftOpen(false);
    setRightOpen(false);
    
    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, [pathname]);

  // Lock body scroll when a drawer is open on mobile
  useEffect(() => {
    if (leftOpen || rightOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [leftOpen, rightOpen]);

  // Z-Plus Hacker/Inspect Prevention & Tracking
  useState(() => {
    if (typeof window === "undefined") return;
    
    const handleInspect = async (method: string) => {
      let username = "Guest";
      try {
        const token = localStorage.getItem("campushub_token");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          username = payload.username || payload.id || "Logged In User";
        }
      } catch (e) {}

      const axios = require("axios");
      axios.post("https://interakt-api.onrender.com/api/auth/log-inspect", {
        username,
        details: `Inspect attempt detected via: ${method}`
      }).catch(() => {});

      alert("⚠️ SECURITY WARNING: Inspecting or debugging this application is strictly prohibited! Your IP, location, and device details have been logged and reported to the Administrator.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isF12 = e.keyCode === 123;
      const isInspectShortcut = e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67);
      const isMacInspect = e.metaKey && e.altKey && e.keyCode === 73;
      
      if (isF12 || isInspectShortcut || isMacInspect) {
        e.preventDefault();
        handleInspect("Keyboard shortcut (" + (isF12 ? "F12" : "Inspect Menu Combo") + ")");
      }
    };

    let resizeThreshold = 250;
    const handleResize = () => {
      // Ignore mobile devices entirely for resize detection to prevent keyboard triggering it
      if (window.innerWidth <= 768) return;

      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > resizeThreshold || heightDiff > resizeThreshold) {
        handleInspect("DevTools window resize detection");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  });

  return (
    <AuthProvider>
      {isAuthRoute ? (
        <main className="w-full min-h-screen">
          {children}
        </main>
      ) : (
        <div className="min-h-screen w-full max-w-[1600px] mx-auto flex justify-center relative overflow-x-hidden">
          {/* ── Mobile Top Header ── */}
          <header className="lg:hidden fixed top-0 left-0 w-full h-14 bg-black/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[60] safe-area-top">
            <button 
              onClick={() => { setLeftOpen(!leftOpen); setRightOpen(false); }} 
              className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white active:bg-white/10 rounded-xl transition-all"
              aria-label="Toggle navigation menu"
            >
              {leftOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex flex-col items-center justify-center select-none mt-1">
              <span className="text-lg font-black text-gradient leading-none">Interakt</span>
              <span className="text-[9px] text-gray-400 font-medium tracking-widest uppercase mt-0.5">by project x²</span>
            </div>
            <button 
              onClick={() => { setRightOpen(!rightOpen); setLeftOpen(false); }} 
              className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white active:bg-white/10 rounded-xl transition-all"
              aria-label="Toggle search panel"
            >
              {rightOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </header>

          {/* ── Dark Overlay (behind drawers, above content) ── */}
          <div 
            onClick={() => { setLeftOpen(false); setRightOpen(false); }} 
            className={`lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] transition-opacity duration-300 ${
              (leftOpen || rightOpen) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* ── Left Sidebar Drawer ── */}
          <Sidebar 
            isOpen={leftOpen} 
            onClose={() => setLeftOpen(false)} 
            onSwitchToRight={() => {
              setLeftOpen(false);
              setTimeout(() => setRightOpen(true), 200);
            }}
          />
          
          {/* ── Main Content ── */}
          <main className="w-full lg:ml-64 lg:mr-80 min-h-screen pt-14 lg:pt-0 pb-24 lg:pb-0">
            {children}
          </main>
          
          {/* ── Right Sidebar Drawer ── */}
          <RightSidebar 
            isOpen={rightOpen} 
            onClose={() => setRightOpen(false)} 
            onSwitchToLeft={() => {
              setRightOpen(false);
              setTimeout(() => setLeftOpen(true), 200);
            }}
          />

          {/* ── Bottom Navigation (mobile only) ── */}
          <BottomNav />
        </div>
      )}
    </AuthProvider>
  );
}
