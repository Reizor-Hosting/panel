import React, { useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { join } from 'path';
import renameFiles from '@/api/server/files/renameFiles';
import { ServerContext } from '@/state/server';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import MoveFileBrowser from '@/components/server/files/MoveFileBrowser';

// Calculate relative path with ../ notation for moving up directories
const calculateRelativePath = (from: string, to: string): string => {
    // Normalize paths - remove leading slashes and trailing slashes, but keep track if root
    const fromNormalized = from === '/' ? '' : from.replace(/^\/+|\/+$/g, '');
    const toNormalized = to === '/' ? '' : to.replace(/^\/+|\/+$/g, '');

    // Split into parts
    const fromParts = fromNormalized ? fromNormalized.split('/').filter((p) => p) : [];
    const toParts = toNormalized ? toNormalized.split('/').filter((p) => p) : [];

    // If paths are the same
    if (fromNormalized === toNormalized) {
        return '.';
    }

    // Find common prefix
    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);
    while (commonLength < minLength && fromParts[commonLength] === toParts[commonLength]) {
        commonLength++;
    }

    // Calculate how many ../ needed to go up from 'from' directory
    const upLevels = fromParts.length - commonLength;
    // Get the remaining path parts in 'to' directory after common prefix
    const downPath = toParts.slice(commonLength);

    // Build relative path
    const upPath = upLevels > 0 ? Array(upLevels).fill('..') : [];
    const relativeParts = [...upPath, ...downPath];

    // If result is empty, return '.'
    if (relativeParts.length === 0) {
        return '.';
    }

    const result = relativeParts.join('/');
    return result;
};

interface FormikValues {
    name: string;
}

type OwnProps = RequiredModalProps & { files: string[]; useMoveTerminology?: boolean };

const RenameFileModal = ({ files, useMoveTerminology, ...props }: OwnProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const [browserPath, setBrowserPath] = useState(directory);
    const [showBrowser, setShowBrowser] = useState(useMoveTerminology);

    const submit = ({ name }: FormikValues, { setSubmitting }: FormikHelpers<FormikValues>) => {
        clearFlashes('files');

        const len = name.split('/').length;
        if (files.length === 1) {
            if (!useMoveTerminology && len === 1) {
                // Rename the file within this directory.
                mutate((data) => data.map((f) => (f.name === files[0] ? { ...f, name } : f)), false);
            } else if (useMoveTerminology || len > 1) {
                // Remove the file from this directory since they moved it elsewhere.
                mutate((data) => data.filter((f) => f.name !== files[0]), false);
            }
        }

        let data;
        if (useMoveTerminology && files.length > 1) {
            data = files.map((f) => ({ from: f, to: join(name, f) }));
        } else {
            data = files.map((f) => ({ from: f, to: name }));
        }

        renameFiles(uuid, directory, data)
            .then((): Promise<any> => (files.length > 0 ? mutate() : Promise.resolve()))
            .then(() => setSelectedFiles([]))
            .catch((error) => {
                mutate();
                setSubmitting(false);
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => props.onDismissed());
    };

    const getInitialName = () => {
        if (files.length > 1) return '';
        if (!useMoveTerminology) return files[0] || '';
        // For move, return just the filename without path
        const file = files[0] || '';
        return file.split('/').pop() || file;
    };

    const updatePathFromBrowser = (path: string, setFieldValue: (field: string, value: any) => void) => {
        if (useMoveTerminology) {
            const relativePath = calculateRelativePath(directory, path);
            if (files.length === 1) {
                const fileName = files[0].split('/').pop() || files[0];
                if (relativePath && relativePath !== '.') {
                    // Combine relative path with filename - always add / between them
                    const finalPath = `${relativePath}/${fileName}`;
                    setFieldValue('name', finalPath);
                } else {
                    setFieldValue('name', fileName);
                }
            } else if (relativePath && relativePath !== '.') {
                setFieldValue('name', relativePath);
            } else {
                // If same directory, just set empty or current file name
                const defaultName = files.length === 1 ? files[0].split('/').pop() || files[0] : '';
                setFieldValue('name', defaultName);
            }
        }
    };

    const handleBrowserPathNavigate = (path: string, setFieldValue: (field: string, value: any) => void) => {
        setBrowserPath(path);
        updatePathFromBrowser(path, setFieldValue);
    };

    return (
        <Formik onSubmit={submit} initialValues={{ name: getInitialName() }} enableReinitialize>
            {({ isSubmitting, values, setFieldValue }) => {
                return (
                    <Modal {...props} dismissable={!isSubmitting} showSpinnerOverlay={isSubmitting}>
                        <Form css={tw`m-0`}>
                            {useMoveTerminology && (
                                <div css={tw`mb-4`}>
                                    <div css={tw`flex items-center justify-between mb-2`}>
                                        <label css={tw`text-sm font-medium text-neutral-200`}>
                                            Browse Destination Folder
                                        </label>
                                        <button
                                            type={'button'}
                                            onClick={() => setShowBrowser(!showBrowser)}
                                            css={tw`text-xs text-neutral-400 hover:text-neutral-200 transition-colors`}
                                        >
                                            {showBrowser ? 'Hide Browser' : 'Show Browser'}
                                        </button>
                                    </div>
                                    {showBrowser && (
                                        <MoveFileBrowser
                                            currentPath={browserPath}
                                            onPathNavigate={(path) => handleBrowserPathNavigate(path, setFieldValue)}
                                        />
                                    )}
                                </div>
                            )}
                            <div css={[tw`flex flex-wrap`, useMoveTerminology ? tw`items-center` : tw`items-end`]}>
                                <div css={tw`w-full sm:flex-1 sm:mr-4`}>
                                    <Field
                                        type={'string'}
                                        id={'file_name'}
                                        name={'name'}
                                        label={useMoveTerminology ? 'Destination Path' : 'File Name'}
                                        description={
                                            useMoveTerminology
                                                ? 'Enter the destination path relative to the current directory, or use the browser above to select a folder.'
                                                : undefined
                                        }
                                        autoFocus={!showBrowser}
                                    />
                                </div>
                                <div css={tw`w-full sm:w-auto mt-4 sm:mt-0`}>
                                    <Button css={tw`w-full`}>{useMoveTerminology ? 'Move' : 'Rename'}</Button>
                                </div>
                            </div>
                            {useMoveTerminology && (
                                <p css={tw`text-xs mt-2 text-neutral-400`}>
                                    <strong css={tw`text-neutral-200`}>New location:</strong>
                                    &nbsp;/home/container/{join(directory, values.name).replace(/^(\.\.\/|\/)+/, '')}
                                </p>
                            )}
                        </Form>
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default RenameFileModal;
