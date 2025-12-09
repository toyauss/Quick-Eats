import React from "react";

interface QueueDisplayProps {
  queueNumber?: number;
  etaMinutes?: number;
  status?: string;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ queueNumber, etaMinutes, status }) => {
  if (queueNumber === undefined || queueNumber === null) {
    return <div className="p-4 bg-gray-200 text-gray-700 rounded">No active queue</div>;
  }

  return (
    <div className="p-4 bg-primary text-white rounded shadow-md">
      <p className="text-lg font-bold">Queue Number: {queueNumber}</p>
      <p>ETA: {etaMinutes ?? "-"} mins</p>
      <p>Status: {status ?? "-"}</p>
    </div>
  );
};

export default QueueDisplay;
