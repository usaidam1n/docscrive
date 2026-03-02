import React from 'react';

export const MeshGradientBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#fdfcf8]">
    <div className="animate-blob absolute -left-[10%] -top-[10%] h-[800px] w-[800px] rounded-full bg-purple-100/40 mix-blend-multiply blur-[120px]" />
    <div className="animation-delay-2000 animate-blob absolute -right-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-blue-100/40 mix-blend-multiply blur-[120px]" />
    <div className="animation-delay-4000 animate-blob absolute bottom-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-pink-100/40 mix-blend-multiply blur-[120px]" />
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />
  </div>
);
