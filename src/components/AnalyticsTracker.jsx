import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/api';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent({
      type: 'page_view',
      path: `${location.pathname}${location.search}`,
      metadata: {
        title: document.title,
        referrer: document.referrer || ''
      }
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target.closest('a, button, input, textarea, select');
      trackEvent({
        type: 'click',
        path: `${window.location.pathname}${window.location.search}`,
        x: event.clientX,
        y: event.clientY,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        metadata: {
          tag: target?.tagName?.toLowerCase() || event.target.tagName?.toLowerCase(),
          label: target?.innerText?.trim()?.slice(0, 80) || target?.getAttribute?.('aria-label') || ''
        }
      });
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
};

export default AnalyticsTracker;
