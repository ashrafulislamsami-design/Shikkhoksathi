import React, { useState, useEffect, useRef } from 'react';

interface DotCardProps {
  target?: number;
  duration?: number;
  label?: string;
  suffix?: string;
  colorClass?: string;
}

export default function DotCard({ 
  target = 777000, 
  duration = 2000, 
  label = 'Views',
  suffix = '',
  colorClass = 'text-emerald-400'
}: DotCardProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setHasAnimated(true);
      return;
    }

    const currentRef = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    let start = 0;
    const end = target;
    const range = end - start;
    if (range <= 0) return;
    const increment = Math.ceil(end / (duration / 50));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, 50);
    return () => clearInterval(timer);
  }, [target, duration, hasAnimated]);

  let display = '';
  if (target >= 1000) {
    display = count < 1000 ? `${Math.floor(count / 1000)}k` : `${Math.floor(count / 1000)}k`;
  } else {
    display = `${count}`;
  }

  const finalDisplay = `${display}${suffix}`;

  return (
    <div ref={containerRef} className="flex flex-col items-start justify-start">
      <p className={`text-2xl font-black italic ${colorClass}`}>{finalDisplay}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}
