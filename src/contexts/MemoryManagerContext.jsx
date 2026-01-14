import React, { createContext, useContext, useEffect, useRef } from 'react';
import { PeriodicMemoryManager } from '../utils/periodicMemoryManager';

// Create the context
const MemoryManagerContext = createContext(null);

// Provider component
export const MemoryManagerProvider = ({ 
  children, 
  cleanupInterval = 60000, 
  memoryThreshold = 500, 
  enableLogging = true 
}) => {
  const managerRef = useRef(null);

  useEffect(() => {
    // Create a new instance of the memory manager
    managerRef.current = new PeriodicMemoryManager({
      cleanupInterval,
      memoryThreshold,
      enableLogging
    });

    // Start the manager
    managerRef.current.start();

    // Cleanup on unmount
    return () => {
      if (managerRef.current) {
        managerRef.current.stop();
      }
    };
  }, [cleanupInterval, memoryThreshold, enableLogging]);

  return (
    <MemoryManagerContext.Provider value={managerRef.current}>
      {children}
    </MemoryManagerContext.Provider>
  );
};

// Custom hook to use the memory manager
export const useMemoryManager = () => {
  const context = useContext(MemoryManagerContext);
  if (!context) {
    throw new Error('useMemoryManager must be used within a MemoryManagerProvider');
  }
  return context;
};

// Enhanced hook for React components to register cleanup callbacks
export const useMemoryCleanup = (callback) => {
  const manager = useMemoryManager();
  
  useEffect(() => {
    if (typeof callback === 'function') {
      const unregister = manager.registerCleanup(callback);
      return unregister;
    }
    return () => {};
  }, [manager, callback]);
};

export default MemoryManagerContext;