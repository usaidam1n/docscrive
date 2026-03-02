'use client';

import { analytics } from '../lib/config';
import Script from 'next/script';

export function UmamiScript() {
  if (!analytics.isUmamiEnabled) {
    return null;
  }

  return (
    <Script
      src={analytics.umamiScriptUrl!}
      data-website-id={analytics.umamiWebsiteId!}
      data-auto-track="true"
      data-do-not-track="true"
      data-cache="true"
      data-domains="docscrive.com,localhost"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('Umami analytics loaded successfully');
        console.log('Umami website ID:', analytics.umamiWebsiteId);

        // Check if umami is available after a short delay
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.umami) {
            console.log('✅ Umami tracking is ready!');
            // Test track a page view
            window.umami.track('page_view', { path: window.location.pathname });
          } else {
            console.warn('❌ Umami object not found on window');
          }
        }, 100);
      }}
      onError={error => {
        console.error('Umami analytics failed to load:', error);
      }}
    />
  );
}
