import React, { createRef } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';
import { createPortal } from 'react-dom';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`p-2 flex items-center rounded w-full relative overflow-hidden`};
    color: rgba(255, 255, 255, 0.85);
    transition: color 150ms ease;
    cursor: pointer;
    background: transparent;
    border: none;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 100%;
        background: ${(props) => (props.danger ? 'rgba(211, 47, 66, 0.15)' : 'rgba(211, 47, 66, 0.1)')};
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 0;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            90deg,
            transparent,
            ${(props) => (props.danger ? 'rgba(211, 47, 66, 0.3)' : 'rgba(211, 47, 66, 0.25)')},
            transparent
        );
        transition: left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        z-index: 1;
    }

    & > * {
        position: relative;
        z-index: 2;
    }

    &:hover {
        color: rgba(255, 255, 255, 0.95);

        &::before {
            left: 100%;
        }

        &::after {
            width: 100%;
        }
    }

    &:active {
        ${(props) =>
            props.danger
                ? `
            background: rgba(211, 47, 66, 0.25);
        `
                : `
            background: rgba(211, 47, 66, 0.2);
        `};
    }
`;

interface State {
    posX: number;
    posY: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();
    buttonContainer = createRef<HTMLDivElement>();
    menuElement: HTMLDivElement | null = null;

    state: State = {
        posX: 0,
        posY: 0,
        visible: false,
    };

    close = () => {
        this.setState({ visible: false });
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        if (this.state.visible && !prevState.visible) {
            // Use setTimeout to ensure the menu is mounted and ref is set, and to add listener after click
            setTimeout(() => {
                const menu = this.menuElement;
                const button = this.buttonContainer.current;
                if (menu && button) {
                    // Calculate position relative to viewport for fixed positioning
                    const rect = button.getBoundingClientRect();
                    const menuWidth = menu.clientWidth || 192; // 12rem = 192px
                    const menuHeight = menu.clientHeight || 0;

                    // Position to the right of the button, below it
                    let left = rect.right;
                    let top = rect.bottom + 4; // 0.25rem = 4px

                    // Adjust if menu would go off-screen to the right
                    if (left + menuWidth > window.innerWidth) {
                        left = rect.left - menuWidth;
                    }

                    // Adjust if menu would go off-screen to the bottom
                    if (top + menuHeight > window.innerHeight) {
                        top = rect.top - menuHeight - 4;
                    }

                    menu.style.left = `${left}px`;
                    menu.style.top = `${top}px`;

                    document.addEventListener('click', this.windowListener);
                    document.addEventListener('contextmenu', this.contextMenuListener);
                }
            }, 0);
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        const button = this.buttonContainer.current;
        if (button) {
            const rect = button.getBoundingClientRect();
            this.triggerMenu(rect.right, rect.bottom);
        } else {
            this.triggerMenu(e.clientX, e.clientY);
        }
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menuElement;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        // Don't close if clicking inside the menu
        if (menu.contains(e.target as Node)) {
            return;
        }

        // Close if clicking outside
        this.setState({ visible: false });
    };

    triggerMenu = (posX: number, posY: number) => {
        this.setState((s) => ({
            posX: !s.visible ? posX : s.posX,
            posY: !s.visible ? posY : s.posY,
            visible: !s.visible,
        }));
    };

    render() {
        const menuContent = (
            <Fade timeout={150} in={this.state.visible} unmountOnExit>
                <div
                    data-dropdown-menu
                    onMouseDown={(e) => {
                        // Prevent the windowListener from closing the menu when clicking inside
                        e.stopPropagation();
                    }}
                    onClick={(e) => {
                        const target = e.target as HTMLElement;
                        const menu = this.menuElement;

                        if (!menu) return;

                        // Don't close if clicking directly on the menu container (empty padding)
                        if (target === menu) {
                            e.stopPropagation();
                            return;
                        }

                        // Close menu on any click inside
                        // Use setTimeout to allow child onClick handlers to fire first
                        setTimeout(() => {
                            this.setState({ visible: false });
                        }, 0);
                        e.stopPropagation();
                    }}
                    ref={(el) => {
                        this.menuElement = el;
                        if (el) {
                            (el as any).__closeMenu = this.close;
                        }
                    }}
                    style={{
                        width: '12rem',
                        position: 'fixed',
                        zIndex: 9999,
                        background: 'linear-gradient(135deg, rgba(48, 48, 48, 0.95), rgba(33, 33, 33, 0.95))',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(211, 47, 66, 0.3)',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        boxShadow:
                            '0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(211, 47, 66, 0.2), inset 0 1px 0 rgba(211, 47, 66, 0.1)',
                        color: 'rgba(255, 255, 255, 0.85)',
                    }}
                >
                    {this.props.children}
                </div>
            </Fade>
        );

        return (
            <div ref={this.buttonContainer} css={tw`relative inline-block`}>
                {this.props.renderToggle(this.onClickHandler)}
                {this.state.visible && createPortal(menuContent, document.body)}
            </div>
        );
    }
}

export default DropdownMenu;
