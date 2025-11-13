import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 700px;
    `};
`;

const LoginCard = styled.div`
    ${tw`md:flex w-full rounded-lg p-6 md:pl-0 mx-1`};
    background: rgba(33, 33, 33, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(211, 47, 66, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(211, 47, 66, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        border-color: rgba(211, 47, 66, 0.3);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(211, 47, 66, 0.2);
    }
`;

const LogoContainer = styled.div`
    ${tw`flex-none select-none mb-6 md:mb-0 self-center`};
    position: relative;
    padding: 1rem;

    img {
        ${tw`block w-48 md:w-64 mx-auto`};
        filter: drop-shadow(0 4px 8px rgba(211, 47, 66, 0.3));
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;

const Title = styled.h2`
    ${tw`text-3xl text-center font-medium py-4`};
    color: rgba(255, 255, 255, 0.95);
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(211, 47, 66, 0.8), transparent);
        border-radius: 2px;
    }
`;

const Copyright = styled.p`
    ${tw`text-center text-xs mt-4`};
    color: rgba(255, 255, 255, 0.5);
    transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        color: rgba(255, 255, 255, 0.7);
    }
`;

const FormContent = styled.div`
    ${tw`flex-1`};

    /* Style inputs to match dark theme */
    input {
        background-color: rgba(33, 33, 33, 0.8) !important;
        border-color: rgba(211, 47, 66, 0.3) !important;
        color: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: blur(10px);

        &:hover {
            border-color: rgba(211, 47, 66, 0.4) !important;
        }

        &:focus {
            border-color: rgba(211, 47, 66, 0.6) !important;
            box-shadow: 0 0 0 2px rgba(211, 47, 66, 0.2) !important;
        }

        &::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
        }
    }

    label {
        color: rgba(255, 255, 255, 0.9) !important;
    }

    /* Hide reCAPTCHA badge */
    iframe[title*='reCAPTCHA'] {
        display: none !important;
    }

    /* Hide any visible reCAPTCHA elements */
    .grecaptcha-badge {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
    }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        {title && <Title>{title}</Title>}
        <FlashMessageRender css={tw`mb-2 px-1`} />
        <Form {...props} ref={ref}>
            <LoginCard>
                <LogoContainer>
                    <img src={'/assets/svgs/logo-transparent.png'} alt={'Logo'} />
                </LogoContainer>
                <FormContent>{props.children}</FormContent>
            </LoginCard>
        </Form>
        <Copyright>
            &copy; 2015 - {new Date().getFullYear()}&nbsp;Reizor Hosting
        </Copyright>
    </Container>
));
