import React, { useState } from 'react';
import { IKwitterDialogProps } from './IDialogProps';
import {
    TextField, 
    DefaultButton, PrimaryButton,
    DialogFooter, DialogContent
} from '@fluentui/react/lib';
import { getSP } from '../pnpjsConfig';
import { Logger, LogLevel } from "@pnp/logging";

const KwitterDialogContent: React.FC<IKwitterDialogProps> = (props) => {
    const [header] = useState('');
    const [content, setContent] = useState('');
    const [hashtagString, setHashtagString] = useState('');
    const [hashtagError, setHashtagError] = useState<string | undefined>();

    const validateHashtags = (value: string) => {
        // Regular expression to match strings that do not contain spaces
        // and are comma-separated. This will also exclude trailing commas.
        const regex = /^#?[^\s,]+(,#?[^\s,]+)*$/;
        if (value && !regex.test(value)) {
            setHashtagError("Hashtags ska vara kommaseparerade och får inte innehålla mellanslag.");
        } else {
            setHashtagError(undefined);
        }
    };

    return (
        <div>
            <DialogContent title="Skriv nytt inlägg" onDismiss={props.onClose}>
                <div>
                    <TextField
                        label="Innehåll"
                        rows={10}
                        multiline
                        onChange={(e, newValue) => setContent(newValue || '')}
                        value={content}
                    />
                    <TextField
                        label="Hashtags (kommaseparerade)"
                        onChange={(e, newValue) => {
                            setHashtagString(newValue || '');
                            validateHashtags(newValue || '');
                        }}
                        onBlur={(e) => validateHashtags((e.target as HTMLInputElement).value)}
                        value={hashtagString}
                        errorMessage={hashtagError}
                        placeholder="ex. #pengar,#problem (gemener)"
                    />
                </div>
                <DialogFooter>
                    <DefaultButton text="Avbryt" title="Cancel" onClick={props.onClose} />
                    <PrimaryButton
                        text="Skapa inlägg"
                        title="Skapa inlägg"
                        style={{ backgroundColor: '#00453C' }}
                        onClick={async () => {
                            await props.onSave(header, content, hashtagString, props.list, props.currentUser);
                        }}
                    />
                </DialogFooter>
            </DialogContent>
        </div>
    );
}

const KwitterDialog = ({ onSave, onClose, ...props }: IKwitterDialogProps) => {
    const _sp = getSP();
    const LOG_SOURCE = "🅿PnPjsExample";


    const _saveToList = async (header: string, content: string, hashtagString: string, list: string, currentUser: any) => {
        try {
            const hashtagsArray = hashtagString.split(',').map(tag => tag.trim().replace(/^#/, ''));
            await _sp.web.lists.getByTitle(list).items.add({
                Title: currentUser.displayName,
                Text: content || "Unknown",
                Likes: 0,
                hashtag: JSON.stringify(hashtagsArray),
                profileimage: currentUser.displayName
            });
        } catch (err) {
            Logger.write(`${LOG_SOURCE} (_saveToList) - ${JSON.stringify(err)} - `, LogLevel.Error);
        }
        await onSave(header, content, hashtagString, list, currentUser);
    }
    
    return (
        <KwitterDialogContent
            onSave={_saveToList}
            onClose={onClose}
            list={props.list}
            currentUser={props.currentUser}
        />
    ); 
}

export default KwitterDialog;
