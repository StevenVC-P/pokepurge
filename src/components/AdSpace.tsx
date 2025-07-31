import React, { useEffect } from 'react';

interface AdSpaceProps {
  slot: string;
  width: number;
  height: number;
  className?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdSpace: React.FC<AdSpaceProps> = ({ 
  slot, 
  width, 
  height, 
  className = '', 
  format = 'auto',
  responsive = true 
}) => {
  useEffect(() => {
    try {
      // Initialize AdSense if not already done
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Development placeholder
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 ${className}`}
        style={{ width: responsive ? '100%' : width, height, maxWidth: width }}
      >
        <div className="text-center p-4">
          <div className="font-medium text-sm">Advertisement</div>
          <div className="text-xs mt-1">{width}x{height}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Slot: {slot}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block',
          width: responsive ? '100%' : width,
          height: height,
          maxWidth: width
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX" // Replace with your AdSense client ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

// Pre-configured ad components for common sizes
export const LeaderboardAd: React.FC<{ slot: string; className?: string }> = ({ slot, className }) => (
  <AdSpace 
    slot={slot} 
    width={728} 
    height={90} 
    format="horizontal"
    className={className}
  />
);

export const RectangleAd: React.FC<{ slot: string; className?: string }> = ({ slot, className }) => (
  <AdSpace 
    slot={slot} 
    width={300} 
    height={250} 
    format="rectangle"
    className={className}
  />
);

export const SkyscraperAd: React.FC<{ slot: string; className?: string }> = ({ slot, className }) => (
  <AdSpace 
    slot={slot} 
    width={160} 
    height={600} 
    format="vertical"
    className={className}
  />
);

export const HalfPageAd: React.FC<{ slot: string; className?: string }> = ({ slot, className }) => (
  <AdSpace 
    slot={slot} 
    width={300} 
    height={600} 
    format="vertical"
    className={className}
  />
);

export const MobileAd: React.FC<{ slot: string; className?: string }> = ({ slot, className }) => (
  <AdSpace 
    slot={slot} 
    width={320} 
    height={50} 
    format="horizontal"
    className={className}
  />
);

export default AdSpace;
