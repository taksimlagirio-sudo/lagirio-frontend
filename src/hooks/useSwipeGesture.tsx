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
  threshold: 30,
  velocityThreshold: 0.25
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
  const initialTouchY = useRef(0);
  const scrollStartY = useRef(0);
  const scrollStartTop = useRef(0);
  const elementRef = useRef<HTMLElement | null>(null);
  
  // Helper functions
  const getSwipeDirection = (deltaX: number, deltaY: number): SwipeDirection => {
    if (Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
      return 'horizontal';
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return 'vertical';
    }
    return null;
  };

  const calculateSwipeResistance = (delta: number): number => {
    const absDelta = Math.abs(delta);
    if (absDelta > 200) return 0.5;
    if (absDelta > 150) return 0.7;
    if (absDelta > 80) return 0.9;
    return 1;
  };

  const shouldTriggerSwipe = (delta: number, velocity: number): boolean => {
    return Math.abs(delta) > threshold || velocity > velocityThreshold;
  };

  const vibrate = (duration: number = 15): void => {
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
    initialTouchY.current = startY;
    touchStartTime.current = Date.now();
    setSwipeDirection(null);
    setIsScrolling(false);
    setSwipeX(0);
    setSwipeY(0);
    
    if (elementRef.current) {
      scrollStartY.current = startY;
      scrollStartTop.current = elementRef.current.scrollTop;
    }
  }, [enabled]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    
    // Determine direction
    if (!swipeDirection && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      const direction = getSwipeDirection(deltaX, deltaY);
      setSwipeDirection(direction);
      
      if (direction === 'vertical') {
        setIsScrolling(true);
      }
    }
    
    // Horizontal swipe
    if (swipeDirection === 'horizontal') {
      e.preventDefault();
      
      const resistance = calculateSwipeResistance(deltaX);
      const resistedDeltaX = deltaX * resistance;
      
      setSwipeX(resistedDeltaX);
      setIsDragging(true);
    }
    
    // Vertical swipe/scroll
    if (swipeDirection === 'vertical') {
      const container = elementRef.current;
      if (container) {
        const isAtTop = container.scrollTop <= 0;
        const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
        const scrollingUp = deltaY > 0;
        const scrollingDown = deltaY < 0;
        
        if ((isAtTop && scrollingUp) || (isAtBottom && scrollingDown)) {
          // Allow parent scroll
        } else {
          e.stopPropagation();
        }
      }
      
      setSwipeY(deltaY);
    }
  }, [enabled, touchStart, swipeDirection]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const duration = Date.now() - (touchStartTime.current || 0);
    const velocityX = Math.abs(deltaX) / (duration || 1);
    const velocityY = Math.abs(deltaY) / (duration || 1);
    
    setIsDragging(false);
    setSwipeDirection(null);
    setIsScrolling(false);
    
    // Check horizontal swipe
    if (swipeDirection === 'horizontal' || 
        (Math.abs(deltaX) > Math.abs(deltaY) && !isScrolling)) {
      
      if (shouldTriggerSwipe(deltaX, velocityX)) {
        vibrate();
        
        if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    } 
    // Check vertical swipe
    else if (swipeDirection === 'vertical') {
      if (shouldTriggerSwipe(deltaY, velocityY)) {
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
  
  // Transform helpers
  const getSwipeTransform = useCallback((baseTransform: string = ''): string => {
    if (!isDragging) return baseTransform;
    
    const rotateY = swipeX * 0.03;
    const scale = 1 - Math.abs(swipeX) * 0.0001;
    
    return `${baseTransform} translateX(${swipeX}px) rotateY(${rotateY}deg) scale(${scale})`;
  }, [isDragging, swipeX]);
  
  const getSwipeOpacity = useCallback((): number => {
    if (!isDragging) return 1;
    
    return Math.max(0.8, 1 - Math.abs(swipeX) * 0.002);
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