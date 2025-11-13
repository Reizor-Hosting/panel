import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import { Form, Formik, FormikHelpers, Field as FormikField } from 'formik';
import FormikSwitch from '@/components/elements/FormikSwitch';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import ModalContext from '@/context/ModalContext';
import asModal from '@/hoc/asModal';
import Switch from '@/components/elements/Switch';
import ScheduleCheatsheetCards from '@/components/server/schedules/ScheduleCheatsheetCards';
import Select from '@/components/elements/Select';
import Label from '@/components/elements/Label';
import {
    convertSimpleToCron,
    parseCronToSimple,
    SimpleScheduleValues,
} from '@/components/server/schedules/SimpleScheduleHelper';
import SchedulePreview from '@/components/server/schedules/SchedulePreview';

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
    // Simple mode values
    useSimpleMode: boolean;
    simpleFrequency: 'minutes' | 'hours' | 'daily' | 'weekly' | 'monthly';
    simpleInterval: number;
    simpleHour: number;
    simpleMinute: number;
    simpleDayOfWeek: number;
    simpleDayOfMonth: number;
}

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const [showCheatsheet, setShowCheetsheet] = useState(false);

    // Try to parse existing schedule to simple mode
    const parsedSimple = schedule ? parseCronToSimple(schedule.cron) : null;
    const defaultUseSimpleMode = !schedule || parsedSimple !== null;

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');

        let cronValues: { minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string };

        if (values.useSimpleMode) {
            // Convert simple mode to cron
            const simpleValues: SimpleScheduleValues = {
                frequency: values.simpleFrequency,
                interval: values.simpleInterval,
                time: { hour: values.simpleHour, minute: values.simpleMinute },
                dayOfWeek: values.simpleDayOfWeek,
                dayOfMonth: values.simpleDayOfMonth,
            };
            cronValues = convertSimpleToCron(simpleValues);
        } else {
            // Use advanced mode cron values
            cronValues = {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            };
        }

        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: cronValues,
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    const initialSimpleValues = parsedSimple || {
        frequency: 'minutes' as const,
        interval: 5,
        time: { hour: 0, minute: 0 },
        dayOfWeek: 0,
        dayOfMonth: 1,
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                    useSimpleMode: defaultUseSimpleMode,
                    simpleFrequency: initialSimpleValues.frequency,
                    simpleInterval: initialSimpleValues.interval || 5,
                    simpleHour: initialSimpleValues.time?.hour || 0,
                    simpleMinute: initialSimpleValues.time?.minute || 0,
                    simpleDayOfWeek: initialSimpleValues.dayOfWeek || 0,
                    simpleDayOfMonth: initialSimpleValues.dayOfMonth || 1,
                } as Values
            }
        >
            {({ isSubmitting, values }) => (
                <Form>
                    <h3 css={tw`text-2xl mb-6`}>{schedule ? 'Edit schedule' : 'Create new schedule'}</h3>
                    <FlashMessageRender byKey={'schedule:edit'} css={tw`mb-6`} />
                    <Field
                        name={'name'}
                        label={'Schedule name'}
                        description={'A human readable identifier for this schedule.'}
                    />

                    {/* Mode Toggle */}
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <FormikSwitch
                            name={'useSimpleMode'}
                            description={
                                values.useSimpleMode
                                    ? 'Using simple mode - easier to configure'
                                    : 'Using advanced mode - full cron syntax control'
                            }
                            label={values.useSimpleMode ? 'Simple Mode' : 'Advanced Mode (Cron)'}
                        />
                    </div>

                    {values.useSimpleMode ? (
                        /* Simple Mode */
                        <div css={tw`mt-6`}>
                            <Label>Frequency</Label>
                            <FormikField as={Select} name={'simpleFrequency'}>
                                <option value={'minutes'}>Every X minutes</option>
                                <option value={'hours'}>Every X hours</option>
                                <option value={'daily'}>Daily</option>
                                <option value={'weekly'}>Weekly</option>
                                <option value={'monthly'}>Monthly</option>
                            </FormikField>
                            <p css={tw`text-neutral-400 text-xs mt-1`}>
                                Select how often you want this schedule to run.
                            </p>

                            {(values.simpleFrequency === 'minutes' || values.simpleFrequency === 'hours') && (
                                <div css={tw`mt-4`}>
                                    <Field
                                        name={'simpleInterval'}
                                        type={'number'}
                                        label={
                                            values.simpleFrequency === 'minutes'
                                                ? 'Interval (minutes)'
                                                : 'Interval (hours)'
                                        }
                                        description={
                                            values.simpleFrequency === 'minutes'
                                                ? 'How many minutes between each run'
                                                : 'How many hours between each run'
                                        }
                                        min={1}
                                        max={values.simpleFrequency === 'minutes' ? 59 : 23}
                                    />
                                    {values.simpleFrequency === 'hours' && (
                                        <Field
                                            name={'simpleMinute'}
                                            type={'number'}
                                            label={'Minute'}
                                            description={'The minute of the hour to run (0-59)'}
                                            min={0}
                                            max={59}
                                        />
                                    )}
                                </div>
                            )}

                            {(values.simpleFrequency === 'daily' ||
                                values.simpleFrequency === 'weekly' ||
                                values.simpleFrequency === 'monthly') && (
                                <div css={tw`grid grid-cols-2 gap-4 mt-4`}>
                                    <Field
                                        name={'simpleHour'}
                                        type={'number'}
                                        label={'Hour'}
                                        description={'Hour of day (0-23)'}
                                        min={0}
                                        max={23}
                                    />
                                    <Field
                                        name={'simpleMinute'}
                                        type={'number'}
                                        label={'Minute'}
                                        description={'Minute of hour (0-59)'}
                                        min={0}
                                        max={59}
                                    />
                                </div>
                            )}

                            {values.simpleFrequency === 'weekly' && (
                                <div css={tw`mt-4`}>
                                    <Label>Day of Week</Label>
                                    <FormikField as={Select} name={'simpleDayOfWeek'}>
                                        <option value={0}>Sunday</option>
                                        <option value={1}>Monday</option>
                                        <option value={2}>Tuesday</option>
                                        <option value={3}>Wednesday</option>
                                        <option value={4}>Thursday</option>
                                        <option value={5}>Friday</option>
                                        <option value={6}>Saturday</option>
                                    </FormikField>
                                    <p css={tw`text-neutral-400 text-xs mt-1`}>
                                        Select which day of the week to run this schedule.
                                    </p>
                                </div>
                            )}

                            {values.simpleFrequency === 'monthly' && (
                                <div css={tw`mt-4`}>
                                    <Field
                                        name={'simpleDayOfMonth'}
                                        type={'number'}
                                        label={'Day of Month'}
                                        description={'Day of the month to run (1-31)'}
                                        min={1}
                                        max={31}
                                    />
                                </div>
                            )}

                            {/* Preview for Simple Mode */}
                            <SchedulePreview
                                cron={convertSimpleToCron({
                                    frequency: values.simpleFrequency,
                                    interval: values.simpleInterval,
                                    time: { hour: values.simpleHour, minute: values.simpleMinute },
                                    dayOfWeek: values.simpleDayOfWeek,
                                    dayOfMonth: values.simpleDayOfMonth,
                                })}
                            />
                        </div>
                    ) : (
                        /* Advanced Mode */
                        <>
                            <div css={tw`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                                <Field name={'minute'} label={'Minute'} />
                                <Field name={'hour'} label={'Hour'} />
                                <Field name={'dayOfMonth'} label={'Day of month'} />
                                <Field name={'month'} label={'Month'} />
                                <Field name={'dayOfWeek'} label={'Day of week'} />
                            </div>
                            <p css={tw`text-neutral-400 text-xs mt-2`}>
                                The schedule system supports the use of Cronjob syntax when defining when tasks should
                                begin running. Use the fields above to specify when these tasks should begin running.
                            </p>

                            {/* Preview for Advanced Mode */}
                            <SchedulePreview
                                cron={{
                                    minute: values.minute,
                                    hour: values.hour,
                                    dayOfMonth: values.dayOfMonth,
                                    month: values.month,
                                    dayOfWeek: values.dayOfWeek,
                                }}
                            />
                        </>
                    )}
                    {!values.useSimpleMode && (
                        <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                            <Switch
                                name={'show_cheatsheet'}
                                description={'Show the cron cheatsheet for some examples.'}
                                label={'Show Cheatsheet'}
                                defaultChecked={showCheatsheet}
                                onChange={() => setShowCheetsheet((s) => !s)}
                            />
                            {showCheatsheet && (
                                <div css={tw`block md:flex w-full`}>
                                    <ScheduleCheatsheetCards />
                                </div>
                            )}
                        </div>
                    )}
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <FormikSwitch
                            name={'onlyWhenOnline'}
                            description={'Only execute this schedule when the server is in a running state.'}
                            label={'Only When Server Is Online'}
                        />
                    </div>
                    <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                        <FormikSwitch
                            name={'enabled'}
                            description={'This schedule will be executed automatically if enabled.'}
                            label={'Schedule Enabled'}
                        />
                    </div>
                    <div css={tw`mt-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            {schedule ? 'Save changes' : 'Create schedule'}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default asModal<Props>({
    top: false,
})(EditScheduleModal);
