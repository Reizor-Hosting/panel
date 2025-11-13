import React, { useEffect, useMemo, useRef, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import styled, { css } from 'styled-components/macro';
import { breakpoint } from '@/theme';
import Fade from '@/components/elements/Fade';
import { createPortal } from 'react-dom';

export interface RequiredModalProps {
    visible: boolean;
    onDismissed: () => void;
    appear?: boolean;
    top?: boolean;
}

export interface ModalProps extends RequiredModalProps {
    dismissable?: boolean;
    closeOnEscape?: boolean;
    closeOnBackground?: boolean;
    showSpinnerOverlay?: boolean;
}

export const ModalMask = styled.div`
    ${tw`fixed z-50 overflow-auto flex w-full inset-0`};
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div<{ alignTop?: boolean }>`
    max-width: 95%;
    max-height: calc(100vh - 8rem);
    ${breakpoint('md')`max-width: 75%`};
    ${breakpoint('lg')`max-width: 50%`};

    ${tw`relative flex flex-col w-full m-auto`};
    ${(props) =>
        props.alignTop &&
        css`
            margin-top: 20%;
            ${breakpoint('md')`margin-top: 10%`};
        `};

    margin-bottom: auto;

    & > .close-icon {
        ${tw`absolute right-0 p-2 cursor-pointer transition-all duration-300`};
        top: -2.5rem;
        color: rgba(255, 255, 255, 0.7);
        background: rgba(33, 33, 33, 0.8);
        border: 1px solid rgba(211, 47, 66, 0.3);
        border-radius: 0.5rem;
        backdrop-filter: blur(10px);

        &:hover {
            ${tw`transform rotate-90`};
            color: rgba(255, 255, 255, 1);
            background: rgba(211, 47, 66, 0.2);
            border-color: rgba(211, 47, 66, 0.5);
        }

        & > svg {
            ${tw`w-6 h-6`};
        }
    }
`;

const Modal: React.FC<ModalProps> = ({
    visible,
    appear,
    dismissable,
    showSpinnerOverlay,
    top = true,
    closeOnBackground = true,
    closeOnEscape = true,
    onDismissed,
    children,
}) => {
    const [render, setRender] = useState(visible);

    const isDismissable = useMemo(() => {
        return (dismissable || true) && !(showSpinnerOverlay || false);
    }, [dismissable, showSpinnerOverlay]);

    useEffect(() => {
        if (!isDismissable || !closeOnEscape) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setRender(false);
        };

        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
        };
    }, [isDismissable, closeOnEscape, render]);

    useEffect(() => setRender(visible), [visible]);

    return (
        <Fade in={render} timeout={150} appear={appear || true} unmountOnExit onExited={() => onDismissed()}>
            <ModalMask
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                    if (isDismissable && closeOnBackground) {
                        e.stopPropagation();
                        if (e.target === e.currentTarget) {
                            setRender(false);
                        }
                    }
                }}
            >
                <ModalContainer alignTop={top}>
                    {isDismissable && (
                        <div className={'close-icon'} onClick={() => setRender(false)}>
                            <svg
                                xmlns={'http://www.w3.org/2000/svg'}
                                fill={'none'}
                                viewBox={'0 0 24 24'}
                                stroke={'currentColor'}
                            >
                                <path
                                    strokeLinecap={'round'}
                                    strokeLinejoin={'round'}
                                    strokeWidth={'2'}
                                    d={'M6 18L18 6M6 6l12 12'}
                                />
                            </svg>
                        </div>
                    )}
                    {showSpinnerOverlay && (
                        <Fade timeout={150} appear in>
                            <div
                                css={tw`absolute w-full h-full rounded flex items-center justify-center`}
                                style={{
                                    background: 'rgba(33, 33, 33, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    zIndex: 9999,
                                }}
                            >
                                <Spinner />
                            </div>
                        </Fade>
                    )}
                    <div
                        css={tw`p-3 sm:p-4 md:p-6 rounded overflow-y-scroll transition-all duration-300`}
                        style={{
                            background: 'rgba(33, 33, 33, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(211, 47, 66, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(211, 47, 66, 0.1)',
                        }}
                    >
                        {children}
                    </div>
                </ModalContainer>
            </ModalMask>
        </Fade>
    );
};

const PortaledModal: React.FC<ModalProps> = ({ children, ...props }) => {
    const element = useRef(document.getElementById('modal-portal'));

    return createPortal(<Modal {...props}>{children}</Modal>, element.current!);
};

export default PortaledModal;
