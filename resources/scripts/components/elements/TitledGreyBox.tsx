import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <div 
        css={tw`rounded shadow-md border transition-all duration-300`} 
        className={className}
        style={{
            backgroundColor: '#303030',
            borderColor: 'rgba(211, 47, 66, 0.2)',
        }}
    >
        <div 
            css={tw`rounded-t p-3 border-b`}
            style={{
                backgroundColor: '#212121',
                borderBottomColor: 'rgba(211, 47, 66, 0.2)',
            }}
        >
            {typeof title === 'string' ? (
                <p css={tw`text-sm uppercase`} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                    {icon && <FontAwesomeIcon icon={icon} css={tw`mr-2`} style={{ color: 'rgba(222, 62, 76, 0.9)' }} />}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={tw`p-3`} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
