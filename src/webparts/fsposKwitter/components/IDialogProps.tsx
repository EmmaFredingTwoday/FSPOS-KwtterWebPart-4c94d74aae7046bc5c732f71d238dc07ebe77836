export interface IKwitterDialogProps {
    onSave: (header: string, content: string, hashtags: any, list: string, currentUser: string) => Promise<void>;
    onClose: () => Promise<void>;
    list: string;
    currentUser: string;
}