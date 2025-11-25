import React from 'react';
import { CLIModal } from './CLIModal';
import { WhyModal } from './WhyModal';
import { POAMModal } from './POAMModal';
import { EnhancementModal } from './EnhancementModal';
import { RegistrationModal } from './RegistrationModal';
import { AccessRequiredModal } from './AccessRequiredModal';
import { MarkdownModal } from './MarkdownModal';

export const ModalContainer = () => {
  return (
    <>
      <CLIModal />
      <WhyModal />
      <POAMModal />
      <EnhancementModal />
      <RegistrationModal />
      <AccessRequiredModal />
      <MarkdownModal />
    </>
  );
};