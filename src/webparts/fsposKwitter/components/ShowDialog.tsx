import React, { useState } from 'react';
import { PrimaryButton } from '@fluentui/react/lib';
import KwitterDialog from './Dialog';

export interface IKwitterDialogProps {
  updatePosts: () => void;
  onClose: () => void;
  onSave: () => void;
  items?: any[];
  errors?: string[];
  list: string;
  currentUser: string;
}

const ShowDialog: React.FC<IKwitterDialogProps> = ({ updatePosts, onClose, onSave, ...props }) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleDialogClose = async () => {
    onClose();
    setShowDialog(false);
};

  const handleDialogSave = async (header: string, content: string) => {
    await updatePosts();
    setShowDialog(false);
  };
  return (
    <section>
      <div style={{ textAlign: 'center', marginBottom: '8px', marginTop:'8px' }}>
        <PrimaryButton text='Skriv inlägg' style={{ backgroundColor: '#00453C' }} onClick={() => setShowDialog(true)} />
      </div>
      {showDialog && <KwitterDialog onSave={handleDialogSave} onClose={handleDialogClose} list={props.list} currentUser={props.currentUser} />}
    </section>
  );
}

export default ShowDialog;
