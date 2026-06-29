"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SecurityWrapper({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    // 1. Right Click Prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setWarningMessage('Right-click context menu is disabled to prevent image and content saving.');
      setShowWarning(true);
    };

    // 2. Drag Start Prevention (prevents dragging images out of page)
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        setWarningMessage('Image drag and drop is restricted to protect user photos.');
        setShowWarning(true);
      }
    };

    // 3. Screenshot key combination listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard
        setWarningMessage('Screen capture detected! Storing screenshots is restricted on Interakt for user privacy.');
        setShowWarning(true);
      }

      // Ctrl+Shift+S or Cmd+Shift+S (Snipping tools / screenshots)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        setWarningMessage('Snipping tool key combination detected! Please respect user privacy.');
        setShowWarning(true);
      }

      // Ctrl+P / Cmd+P (Print page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setWarningMessage('Printing page content is disabled.');
        setShowWarning(true);
      }

      // Ctrl+S / Cmd+S (Save page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setWarningMessage('Saving page source/media is disabled.');
        setShowWarning(true);
      }
    };

    // 4. Focus loss event (usually triggers when screenshot overlays open)
    const handleWindowBlur = () => {
      // We don't trigger warning popup directly to prevent false positives when switching tabs,
      // but we can black out sensitive sections if needed.
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  return (
    <>
      {/* Inject styles globally to prevent selection on critical elements */}
      <style jsx global>{`
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        input, textarea {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        img {
          pointer-events: none;
          -webkit-touch-callout: none;
        }
      `}</style>

      {children}

      <AnimatePresence>
        {showWarning && (
          <div className="fixed bottom-6 right-6 z-[200] max-w-sm w-full p-1">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-black/80 backdrop-blur-md border border-red-500/30 text-white p-4 rounded-2xl flex items-start gap-3 shadow-[0_10px_30px_rgba(239,68,68,0.2)]"
            >
              <div className="p-1.5 bg-red-500/20 rounded-xl text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-red-400">Privacy Security Shield</h4>
                <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">{warningMessage}</p>
              </div>
              <button 
                onClick={() => setShowWarning(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
