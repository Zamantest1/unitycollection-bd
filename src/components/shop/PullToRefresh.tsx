import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const pullDistance = useMotionValue(0);
  
  const threshold = 80;
  const maxPull = 120;

  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, threshold * 2], [0, 360]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;
    
    // Only start pull if at top of scroll
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const delta = currentY - startY.current;
    
    if (delta > 0) {
      // Apply resistance as user pulls further
      const resistance = 0.5;
      const adjustedDelta = Math.min(delta * resistance, maxPull);
      pullDistance.set(adjustedDelta);
    }
  }, [isRefreshing, pullDistance, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    
    const currentPull = pullDistance.get();
    startY.current = null;

    if (currentPull >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    animate(pullDistance, 0, { duration: 0.3 });
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ 
          height: pullDistance,
          opacity 
        }}
      >
        <motion.div 
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10"
          style={{ scale }}
        >
          <motion.div style={{ rotate }}>
            <RefreshCw 
              className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
}
