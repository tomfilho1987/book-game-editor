/**
 * @file denormalizeOnStartDataForDownload.tsx
 * @description 
 * @author Airton Filho
 * @date [Data de Criação]
 * @version 1.0
 */

import { OnStartItem } from '../Types/Chapter';

export const denormalizeOnStartDataForDownload = (onStartItems: OnStartItem[] | undefined): Record<string, string> => {
    const denormalized: Record<string, string> = {};

    if (!onStartItems || onStartItems.length === 0) {
        return denormalized;
    }

    onStartItems.forEach(item => {
        let keyToUse = item.key;

        if (item.isHidden) {
            keyToUse = `#${keyToUse}`;
        }

        denormalized[keyToUse] = item.value;
    });

    return denormalized;
};