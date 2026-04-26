import { createContext, useContext, useState, ReactNode } from "react";

type Notification = {
  id: number;
  message: string;
  type?: "info" | "success" | "error";
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (msg: string, type?: Notification["type"]) => void;
  removeNotification: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: Notification["type"] = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000); // auto remove after 5s
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="fixed top-5 right-5 flex flex-col gap-2 z-50">
        {notifications.map((n) => (
          <div key={n.id} className={`p-2 rounded shadow ${n.type === "error" ? "bg-red-400" : "bg-green-400"}`}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used inside NotificationProvider");
  return context;
};
