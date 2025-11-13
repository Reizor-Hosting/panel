import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            <div
                className={'px-6 py-3 flex items-center justify-end space-x-3 rounded-b'}
                style={{
                    background: 'rgba(24, 24, 24, 0.8)',
                    borderTop: '1px solid rgba(211, 47, 66, 0.2)',
                }}
            >
                {children}
            </div>
        );
    }, [children]);

    return null;
};
