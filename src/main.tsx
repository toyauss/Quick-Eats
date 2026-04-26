import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueueProvider } from "./contexts/QueueContext.tsx";

createRoot(document.getElementById("root")!).render(
  <QueueProvider>
    <App />
  </QueueProvider>
);
