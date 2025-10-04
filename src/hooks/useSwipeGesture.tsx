// hooks/useSwipeGesture.ts - DENGELİ VE OPTİMİZE VERSİYON

import { useState, useCallback, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enabled?: boolean;
  threshold?: number;
  velocityThreshold?: number;
}

interface TouchStartPosition {
  x: number;
  y: number;
}

type SwipeDirection = 'horizontal' | 'vertical' | null;

const SWIPE_CONFIG = {
  threshold: 25,
  velocityThreshold: 0.15
};

const useSwipeGesture = ({
  onSwipeLeft = undefined,
  onSwipeRight = undefined,
  onSwipeUp = undefined,
  onSwipeDown = undefined,
  enabled = true,
  threshold = SWIPE_CONFIG.threshold,
  velocityThreshold = SWIPE_CONFIG.velocityThreshold
}: SwipeGestureOptions) => {
  const [touchStart, setTouchStart] = useState<TouchStartPosition | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeY, setSwipeY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Refs
  const touchStartTime = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);
  
  // Helper functions
  const getSwipeDirection = (deltaX: number, deltaY: number): SwipeDirection => {
    if (Math.abs(deltaX) > Math.abs(deltaY) * 0.5) {
      return 'horizontal';
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return 'vertical';
    }
    return null;
  };

  const calculateSwipeResistance = (delta: number): number => {
    const absDelta = Math.abs(delta);
    // Balanced resistance
    if (absDelta > 200) return 0.5;
    if (absDelta > 150) return 0.65;
    if (absDelta > 100) return 0.8;
    if (absDelta > 50) return 0.9;
    return 1;
  };

  const vibrate = (duration: number = 8): void => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };
  
  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    setTouchStart({ x: startX, y: startY });
    touchStartTime.current = Date.now();
    lastUpdateTime.current = Date.now();
    setSwipeDirection(null);
    setIsScrolling(false);
    setSwipeX(0);
    setSwipeY(0);
    setIsDragging(true);
  }, [enabled]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStart || !isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Determine direction
    if (!swipeDirection && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      const direction = getSwipeDirection(deltaX, deltaY);
      setSwipeDirection(direction);
      
      if (direction === 'vertical') {
        setIsScrolling(true);
        return;
      }
    }
    
    // Handle horizontal swipe
    if (swipeDirection === 'horizontal') {
      e.preventDefault();
      
      // Throttle updates to 60fps
      const now = Date.now();
      if (now - lastUpdateTime.current < 16) return; // Skip if less than 16ms
      lastUpdateTime.current = now;
      
      // Apply resistance
      const resistance = calculateSwipeResistance(deltaX);
      const resistedDeltaX = deltaX * resistance;
      
      // Direct update - no interpolation for smoother performance
      setSwipeX(resistedDeltaX);
    }
    
    // Handle vertical swipe
    if (swipeDirection === 'vertical') {
      setSwipeY(deltaY);
    }
  }, [enabled, touchStart, swipeDirection, isDragging]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const duration = Date.now() - (touchStartTime.current || 0);
    const velocityX = Math.abs(deltaX) / Math.max(1, duration);
    const velocityY = Math.abs(deltaY) / Math.max(1, duration);
    
    setIsDragging(false);
    setSwipeDirection(null);
    setIsScrolling(false);
    
    // Check for swipe
    if (swipeDirection === 'horizontal' || 
        (Math.abs(deltaX) > Math.abs(deltaY) && !isScrolling)) {
      
      if (Math.abs(deltaX) > threshold || velocityX > velocityThreshold) {
        vibrate();
        
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    } else if (swipeDirection === 'vertical') {
      if (Math.abs(deltaY) > threshold || velocityY > velocityThreshold) {
        if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    }
    
    // Reset
    setSwipeX(0);
    setSwipeY(0);
    setTouchStart(null);
    touchStartTime.current = null;
  }, [enabled, touchStart, swipeDirection, isScrolling, threshold, velocityThreshold, 
      onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
  
  const handleTouchCancel = useCallback(() => {
    setIsDragging(false);
    setSwipeDirection(null);
    setIsScrolling(false);
    setSwipeX(0);
    setSwipeY(0);
    setTouchStart(null);
    touchStartTime.current = null;
  }, []);
  
  // Transform helpers - SİMPLE VE PERFORMANSLI
  const getSwipeTransform = useCallback((baseTransform: string = ''): string => {
    if (!isDragging && swipeX === 0) return baseTransform;
    
    // Simple transform
    const rotateY = swipeX * 0.035;
    return `${baseTransform} translate3d(${swipeX}px, 0, 0) rotateY(${rotateY}deg)`;
  }, [isDragging, swipeX]);
  
  const getSwipeOpacity = useCallback((): number => {
    if (!isDragging) return 1;
    return Math.max(0.75, 1 - Math.abs(swipeX) * 0.001);
  }, [isDragging, swipeX]);
  
  return {
    // State
    swipeX,
    swipeY,
    isDragging,
    swipeDirection,
    isScrolling,
    
    // Handlers
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    },
    
    // Refs
    elementRef,
    
    // Helpers
    getSwipeTransform,
    getSwipeOpacity,
    
    // Info
    isSwipingLeft: swipeX < 0,
    isSwipingRight: swipeX > 0,
    swipeProgress: Math.abs(swipeX) / 100
  };
};

export default useSwipeGesture;