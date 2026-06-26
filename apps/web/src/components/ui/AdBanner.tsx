export default function AdBanner() {
  return (
    <div className="w-full glass rounded-2xl p-4 mb-6 border border-yellow-500/30 relative overflow-hidden group hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-shadow">
      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
        SPONSORED
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">Ad</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Premium Student Discount</h3>
          <p className="text-sm text-gray-400 mt-1">
            Get 50% off Interakt premium features with your university email. Elevate your campus experience today.
          </p>
          <button className="mt-3 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}
