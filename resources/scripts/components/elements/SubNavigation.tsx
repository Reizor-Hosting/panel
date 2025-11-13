import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto`};
    background: rgba(48, 48, 48, 0.6);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(211, 47, 66, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    & > div {
        ${tw`flex items-center text-sm mx-auto`};
        max-width: 1400px;
        padding: 0.5rem 1.5rem;
        gap: 0.5rem;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: rgba(211, 47, 66, 0.3) transparent;

        &::-webkit-scrollbar {
            height: 4px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(211, 47, 66, 0.3);
            border-radius: 2px;

            &:hover {
                background: rgba(211, 47, 66, 0.5);
            }
        }

        @media (max-width: 640px) {
            padding: 0.5rem 1rem;
            gap: 0.375rem;
        }

        & > a,
        & > div {
            ${tw`inline-flex items-center py-2.5 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-200 rounded-lg relative`};
            font-weight: 500;
            position: relative;
            flex-shrink: 0;

            @media (max-width: 640px) {
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
            }

            &:not(:first-of-type) {
                margin-left: 0;
            }

            &::before {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: 0.5rem;
                background: rgba(211, 47, 66, 0.1);
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            &:hover {
                ${tw`text-neutral-100`};
                background: rgba(211, 47, 66, 0.1);
                transform: translateY(-1px);

                &::before {
                    opacity: 1;
                }
            }

            &:active {
                transform: translateY(0);
            }

            &.active {
                ${tw`text-white`};
                background: rgba(211, 47, 66, 0.2);
                box-shadow: 0 0 0 2px rgba(211, 47, 66, 0.3), inset 0 -2px 0 0 #d32f42;

                &::before {
                    opacity: 1;
                }
            }

            svg {
                ${tw`mr-2`};
                font-size: 0.875rem;
            }
        }
    }
`;

export default SubNavigation;
