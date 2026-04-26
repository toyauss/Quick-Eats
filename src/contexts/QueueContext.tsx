import { createContext, useContext, useEffect, useState } from "react";

type QueueContextType = {
  queueNumber: number;
  refreshQueue: () => void;
};

const QueueContext = createContext<QueueContextType | null>(null);

export const QueueProvider = ({ children }: { children: React.ReactNode }) => {
  const [queueNumber, setQueueNumber] = useState<number>(0);

  const refreshQueue = async () => {
    // TEMP dummy queue (later we connect to real DB)
    const random = Math.floor(Math.random() * 20) + 1;
    setQueueNumber(random);
  };

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000); // update every 5 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <QueueContext.Provider value={{ queueNumber, refreshQueue }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext)!;
