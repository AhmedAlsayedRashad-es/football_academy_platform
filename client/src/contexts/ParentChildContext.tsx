import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface ParentChildContextType {
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
  linkedPlayers: any[];
  isLoading: boolean;
}

const ParentChildContext = createContext<ParentChildContextType | undefined>(undefined);

export function ParentChildProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  const { data: linkedPlayers, isLoading } = trpc.parentRelations.getLinkedPlayers.useQuery(
    undefined,
    { enabled: user?.role === 'parent' }
  );

  // Auto-select first child if only one child linked
  useEffect(() => {
    if (linkedPlayers && linkedPlayers.length === 1 && !selectedChildId) {
      setSelectedChildId(linkedPlayers[0].id.toString());
    }
  }, [linkedPlayers, selectedChildId]);

  // Persist selected child in localStorage
  useEffect(() => {
    if (selectedChildId) {
      localStorage.setItem('selectedChildId', selectedChildId);
    }
  }, [selectedChildId]);

  // Restore selected child from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedChildId');
    if (saved && linkedPlayers?.some((p: any) => p.id.toString() === saved)) {
      setSelectedChildId(saved);
    }
  }, [linkedPlayers]);

  return (
    <ParentChildContext.Provider
      value={{
        selectedChildId,
        setSelectedChildId,
        linkedPlayers: linkedPlayers || [],
        isLoading,
      }}
    >
      {children}
    </ParentChildContext.Provider>
  );
}

export function useParentChild() {
  const context = useContext(ParentChildContext);
  if (context === undefined) {
    throw new Error('useParentChild must be used within a ParentChildProvider');
  }
  return context;
}
