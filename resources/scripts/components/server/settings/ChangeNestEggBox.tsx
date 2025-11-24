import React, { useEffect, useState, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Field as FormikField, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Actions, useStoreActions } from 'easy-peasy';
import changeNestEgg from '@/api/server/changeNestEgg';
import getNests, { Nest, Egg } from '@/api/server/getNests';
import getEggs from '@/api/server/getEggs';
import { number, object } from 'yup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import tw from 'twin.macro';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';

interface Values {
    nestId: number;
    eggId: number;
}

const ChangeNestEggBox = () => {
    const { isSubmitting, values, setFieldValue } = useFormikContext<Values>();
    const [nests, setNests] = useState<Nest[]>([]);
    const [loadingNests, setLoadingNests] = useState(true);

    useEffect(() => {
        getNests()
            .then((nestsData) => {
                setNests(nestsData);
                setLoadingNests(false);
            })
            .catch((error) => {
                console.error('Failed to load nests:', error);
                setLoadingNests(false);
            });
    }, []);

    const [fetchedEggs, setFetchedEggs] = useState<Egg[]>([]);
    const [loadingEggs, setLoadingEggs] = useState(false);

    // Get eggs for the selected nest - use eggs from nest if available, otherwise fetch separately
    const eggs = useMemo(() => {
        const selectedNest = nests.find((n) => n.id === values.nestId);
        // If nest has eggs included, use those; otherwise use fetched eggs
        return selectedNest?.eggs && selectedNest.eggs.length > 0 ? selectedNest.eggs : fetchedEggs;
    }, [nests, values.nestId, fetchedEggs]);

    // Fetch eggs separately if they're not included in the nest data
    useEffect(() => {
        if (values.nestId && values.nestId > 0) {
            const selectedNest = nests.find((n) => n.id === values.nestId);
            // Only fetch if eggs aren't already included
            if (!selectedNest?.eggs || selectedNest.eggs.length === 0) {
                setLoadingEggs(true);
                getEggs(values.nestId)
                    .then((eggsData) => {
                        setFetchedEggs(eggsData);
                        setLoadingEggs(false);
                    })
                    .catch((error) => {
                        console.error('Failed to load eggs:', error);
                        setFetchedEggs([]);
                        setLoadingEggs(false);
                    });
            } else {
                setFetchedEggs([]);
            }
        } else {
            setFetchedEggs([]);
        }
    }, [values.nestId, nests]);

    // Get egg IDs as a string for comparison to avoid array reference issues
    const eggIds = useMemo(() => eggs.map((e) => e.id).join(','), [eggs]);

    useEffect(() => {
        if (values.nestId && values.nestId > 0) {
            // Reset egg selection if current egg is not in the new nest
            if (values.eggId && !eggs.find((e) => e.id === values.eggId)) {
                setFieldValue('eggId', eggs[0]?.id || 0);
            }
        } else {
            setFieldValue('eggId', 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values.nestId, eggIds]);

    return (
        <TitledGreyBox title={'Change Game & Subtype'} css={tw`relative`}>
            <SpinnerOverlay visible={isSubmitting || loadingNests || loadingEggs} />
            <Form css={tw`mb-0`}>
                <div>
                    <Label htmlFor={'nestId'}>Game</Label>
                    <FormikField as={Select} id={'nestId'} name={'nestId'} disabled={isSubmitting || loadingNests}>
                        <option value={0}>Select a game...</option>
                        {nests.map((nest) => (
                            <option key={nest.id} value={nest.id}>
                                {nest.name}
                            </option>
                        ))}
                    </FormikField>
                </div>
                <div css={tw`mt-6`}>
                    <Label htmlFor={'eggId'}>Subtype</Label>
                    <FormikField
                        as={Select}
                        id={'eggId'}
                        name={'eggId'}
                        disabled={isSubmitting || loadingNests || !values.nestId || eggs.length === 0}
                    >
                        <option value={0}>Select a subtype...</option>
                        {eggs
                            .filter((egg) => egg.name !== 'Minecraft: Java Edition Modpack Installer')
                            .map((egg) => (
                                <option key={egg.id} value={egg.id}>
                                    {egg.name}
                                </option>
                            ))}
                    </FormikField>
                </div>
                <div css={tw`mt-6 text-right`}>
                    <Button.Danger type={'submit'} disabled={!values.nestId || !values.eggId || isSubmitting}>
                        Change Game & Subtype
                    </Button.Danger>
                </div>
            </Form>
        </TitledGreyBox>
    );
};

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingValues, setPendingValues] = useState<Values | null>(null);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        setPendingValues(values);
        setModalVisible(true);
        setSubmitting(false);
    };

    const confirmChange = () => {
        if (!pendingValues) return;

        clearFlashes('settings');
        changeNestEgg(server.uuid, pendingValues.nestId, pendingValues.eggId)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message:
                        'Your server game and subtype have been changed. All files have been deleted and the server is being reinstalled.',
                });
                // Reload the page to get updated server data
                window.location.reload();
            })
            .catch((error) => {
                console.error(error);
                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setModalVisible(false);
                setPendingValues(null);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm Game & Subtype Change'}
                confirm={'Yes, change game & subtype'}
                onClose={() => {
                    setModalVisible(false);
                    setPendingValues(null);
                }}
                onConfirmed={confirmChange}
            >
                <p css={tw`mb-4`}>
                    <strong>Warning:</strong> Changing the game and subtype will delete all files on your server and
                    reinstall it with the new configuration.
                </p>
                <p css={tw`mb-4`}>This action cannot be undone. Are you sure you want to continue?</p>
            </Dialog.Confirm>
            <Formik
                onSubmit={submit}
                initialValues={{
                    nestId: 0,
                    eggId: 0,
                }}
                validationSchema={object().shape({
                    nestId: number().required().min(1),
                    eggId: number().required().min(1),
                })}
            >
                <ChangeNestEggBox />
            </Formik>
        </>
    );
};
