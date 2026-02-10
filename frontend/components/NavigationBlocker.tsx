import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NavigationBlocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationHistory = useRef<string[]>([]);
  const isNavigating = useRef(false);
  const currentIndex = useRef(0);

  useEffect(() => {
    const currentPath = location.pathname;
    const lastPath = navigationHistory.current[currentIndex.current];
    
    // Add to history (avoid duplicates) only if it's a new navigation
    if (currentPath !== lastPath && !isNavigating.current) {
      // Remove any history after current index (forward history)
      navigationHistory.current = navigationHistory.current.slice(0, currentIndex.current + 1);
      
      // Add new path
      navigationHistory.current.push(currentPath);
      currentIndex.current = navigationHistory.current.length - 1;
      
      // Keep last 50 pages
      if (navigationHistory.current.length > 50) {
        navigationHistory.current.shift();
        currentIndex.current--;
      }
    }
    
    // Reset navigation flag
    isNavigating.current = false;

    // Push state to block forward navigation
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (isNavigating.current) return;
      
      // Block forward navigation
      window.history.pushState(null, '', window.location.href);
      
      const authPages = ['/login', '/register'];
      const protectedPages = ['/dashboard', '/matchmaking', '/leaderboard', '/profile', '/friends', '/battles'];
      
      const isOnProtectedPage = protectedPages.some(page => currentPath.startsWith(page));
      
      let targetPath = '/';
      let targetIndex = 0;
      
      if (currentIndex.current > 0) {
        // Go back one step in our history
        targetIndex = currentIndex.current - 1;
        let previousPath = navigationHistory.current[targetIndex];
        
        // Skip auth pages when going back from protected pages (in a single click)
        if (isOnProtectedPage && authPages.includes(previousPath)) {
          // Search backwards for the last non-auth page
          for (let i = targetIndex - 1; i >= 0; i--) {
            if (!authPages.includes(navigationHistory.current[i])) {
              previousPath = navigationHistory.current[i];
              targetIndex = i;
              break;
            }
          }
          
          // If still an auth page, go to landing
          if (authPages.includes(previousPath)) {
            previousPath = '/';
            targetIndex = 0;
          }
        }
        
        targetPath = previousPath;
      }
      
      // Update current index and navigate
      isNavigating.current = true;
      currentIndex.current = targetIndex;
      
      requestAnimationFrame(() => {
        navigate(targetPath, { replace: true });
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, navigate]);

  return null;
};

export default NavigationBlocker;
