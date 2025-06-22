import React from 'react';

const ArchitecturalElement: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
      <svg
        viewBox="0 0 500 500"
        className="w-[800px] h-[800px] opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: 'rgb(50,50,50)', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: 'rgb(0,0,0)', stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        <circle cx="250" cy="250" r="240" fill="url(#grad1)" />
        {[...Array(12)].map((_, i) => (
          <path
            key={i}
            d={`M ${50 + i * 35}, 250 A 200,${150 - i * 5} 0 0,0 ${450 - i * 35}, 250`}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
};

export default ArchitecturalElement; 