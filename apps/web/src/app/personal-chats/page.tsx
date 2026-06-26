"use client";

import { motion } from 'framer-motion';

export default function PersonalChatsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-10 rounded-2xl max-w-md text-center border border-[var(--glass-border)]"
      >
        <h1 className="text-3xl font-bold mb-4 text-gradient">Personal Chats</h1>
        <p className="text-gray-400 mb-6">
          Direct messaging is currently under development. Soon you'll be able to connect privately with your peers!
        </p>
        <div className="w-24 h-24 mx-auto border-4 border-dashed border-[var(--accent-purple)] rounded-full flex items-center justify-center opacity-50">
          <span className="text-3xl">💬</span>
        </div>
      </motion.div>
    </div>
  );
}
