import React, { useEffect } from 'react';
import { IoInformationCircleOutline } from 'react-icons/io5';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 transform items-center gap-2 rounded bg-red-500 px-4 py-2 text-white shadow-lg">
      <IoInformationCircleOutline size={24} className="text-white" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
