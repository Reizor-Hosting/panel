import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded no-underline text-neutral-200 items-center bg-neutral-800 p-4 border transition-all duration-300 overflow-hidden`};
    background-color: #303030;
    border-color: rgba(211, 47, 66, 0.2);
    color: rgba(255, 255, 255, 0.85);

    ${(props) =>
        props.$hoverable !== false &&
        css`
            &:hover {
                border-color: rgba(211, 47, 66, 0.5);
                box-shadow: 0 4px 12px rgba(211, 47, 66, 0.2);
                transform: translateY(-2px);
            }
        `};

    & .icon {
        ${tw`rounded-full w-16 flex items-center justify-center p-3`};
        background-color: rgba(211, 47, 66, 0.15);
        color: rgba(255, 255, 255, 0.9);
    }
`;
