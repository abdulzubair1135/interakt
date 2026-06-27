"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdBanner() {
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await axios.get('https://interakt-api.onrender.com/api/auth/ads');
        if (res.data && res.data.success && res.data.data.length > 0) {
          const ads = res.data.data;
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          setAd(randomAd);
        }
      } catch (err) {
        console.error('Failed to fetch feed ad', err);
      }
    };
    fetchAd();
  }, []);

  const handleAdClick = async () => {
    if (!ad || !ad._id) return;
    try {
      const token = localStorage.getItem('campushub_token');
      if (token) {
        await axios.post(`https://interakt-api.onrender.com/api/auth/ads/${ad._id}/click`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Failed to track ad click', err);
    }
  };

  // Fallback ad
  const displayAd = ad ? {
    title: ad.title,
    desc: ad.description,
    image: ad.image,
    link: ad.link,
    company: ad.company
  } : {
    title: "Premium Student Discount",
    desc: "Get 50% off Interakt premium features with your university email. Elevate your campus experience today.",
    image: null,
    link: "#",
    company: "Interakt"
  };

  return (
    <a 
      href={displayAd.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleAdClick}
      className="block w-full glass rounded-2xl p-4 mb-6 border border-yellow-500/30 relative overflow-hidden group hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-shadow cursor-pointer"
    >
      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
        SPONSORED
      </div>
      <div className="flex items-center space-x-4">
        {displayAd.image ? (
          <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <img src={displayAd.image} alt={displayAd.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">Ad</span>
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">{displayAd.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{displayAd.desc}</p>
          <span className="inline-block mt-3 text-sm font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
            {ad ? `Visit ${displayAd.company}` : 'Learn More'} →
          </span>
        </div>
      </div>
    </a>
  );
}
