'use client';

import React from 'react';
import SettingsModal from './SettingsModal';
import { useSettingsModal } from './providers/SettingsProvider';

/**
 * Global Settings Modal that can be triggered from anywhere in the app
 */
export default function GlobalSettingsModal() {
  const { isModalOpen, modalMessage, closeModal, setModalMessage } =
    useSettingsModal();

  return (
    <SettingsModal
      isOpen={isModalOpen}
      onClose={closeModal}
      message={modalMessage}
    />
  );
}
