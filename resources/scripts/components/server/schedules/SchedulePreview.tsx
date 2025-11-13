import React, { useMemo, useState } from 'react';
import tw from 'twin.macro';
import {
    format,
    addHours,
    addDays,
    addWeeks,
    addMonths,
    startOfDay,
    setHours,
    setMinutes,
    setDay,
    setDate,
    addMinutes,
} from 'date-fns';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';

interface CronValues {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}

interface Props {
    cron: CronValues;
}

const SchedulePreview = ({ cron }: Props) => {
    const [numRuns, setNumRuns] = useState(5);

    const preview = useMemo(() => {
        try {
            const now = new Date();
            let description = '';
            const nextRuns: Date[] = [];

            // Parse the cron values
            const { minute, hour, dayOfMonth, month, dayOfWeek } = cron;

            // Helper function to calculate next N runs based on a pattern
            const calculateNextRuns = (firstRun: Date, getNextRun: (lastRun: Date) => Date, count: number): Date[] => {
                const runs: Date[] = [];
                let current = firstRun;
                for (let i = 0; i < count; i++) {
                    runs.push(new Date(current));
                    current = getNextRun(current);
                }
                return runs;
            };

            // Every X minutes: */X * * * *
            if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                const interval = parseInt(minute.substring(2));
                if (!isNaN(interval) && interval > 0) {
                    description = `Every ${interval} minute${interval !== 1 ? 's' : ''}`;
                    // Calculate next run: round up current minute to next interval
                    const currentMinute = now.getMinutes();
                    const currentSecond = now.getSeconds();
                    let nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;
                    let firstRun: Date;
                    if (nextMinute >= 60) {
                        firstRun = addHours(setMinutes(startOfDay(now), 0), now.getHours() + 1);
                    } else {
                        firstRun = setMinutes(now, nextMinute);
                        // If the calculated time is in the past (same minute but seconds have passed), move to next interval
                        if (firstRun <= now || (firstRun.getMinutes() === currentMinute && currentSecond > 0)) {
                            nextMinute = nextMinute + interval;
                            if (nextMinute >= 60) {
                                firstRun = addHours(setMinutes(startOfDay(now), 0), now.getHours() + 1);
                            } else {
                                firstRun = setMinutes(now, nextMinute);
                            }
                        }
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addMinutes(last, interval), numRuns));
                }
            }
            // Every X hours: 0 */X * * *
            else if (
                minute === '0' &&
                hour.startsWith('*/') &&
                dayOfMonth === '*' &&
                month === '*' &&
                dayOfWeek === '*'
            ) {
                const interval = parseInt(hour.substring(2));
                if (!isNaN(interval) && interval > 0) {
                    description = `Every ${interval} hour${interval !== 1 ? 's' : ''} at minute 0`;
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    let nextHour = Math.ceil((currentHour + 1) / interval) * interval;
                    let firstRun: Date;
                    if (nextHour >= 24) {
                        firstRun = addDays(setHours(startOfDay(now), 0), 1);
                    } else {
                        firstRun = setHours(setMinutes(startOfDay(now), 0), nextHour);
                        // If this time is in the past (same hour but we've passed minute 0), move to next interval
                        if (firstRun <= now || (firstRun.getHours() === currentHour && currentMinute > 0)) {
                            nextHour = nextHour + interval;
                            if (nextHour >= 24) {
                                firstRun = addDays(setHours(startOfDay(now), 0), 1);
                            } else {
                                firstRun = setHours(setMinutes(startOfDay(now), 0), nextHour);
                            }
                        }
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addHours(last, interval), numRuns));
                }
            }
            // Every hour at specific minute: M * * * *
            else if (
                !minute.startsWith('*/') &&
                hour === '*' &&
                dayOfMonth === '*' &&
                month === '*' &&
                dayOfWeek === '*'
            ) {
                const m = parseInt(minute);
                if (!isNaN(m) && m >= 0 && m < 60) {
                    description = `Every hour at minute ${m}`;
                    const currentHour = now.getHours();
                    const currentMin = now.getMinutes();
                    let firstRun: Date;
                    // If we haven't passed the minute in the current hour, use current hour
                    if (currentMin < m) {
                        firstRun = setHours(setMinutes(startOfDay(now), m), currentHour);
                    } else {
                        // Otherwise, use next hour
                        const nextHour = currentHour + 1;
                        if (nextHour >= 24) {
                            firstRun = addDays(setHours(setMinutes(startOfDay(now), m), 0), 1);
                        } else {
                            firstRun = setHours(setMinutes(startOfDay(now), m), nextHour);
                        }
                    }
                    // Ensure it's in the future
                    if (firstRun <= now) {
                        const nextHour = firstRun.getHours() + 1;
                        if (nextHour >= 24) {
                            firstRun = addDays(setHours(setMinutes(startOfDay(now), m), 0), 1);
                        } else {
                            firstRun = setHours(setMinutes(startOfDay(now), m), nextHour);
                        }
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addHours(last, 1), numRuns));
                }
            }
            // Specific minute in every X hours: M */X * * *
            else if (
                !minute.startsWith('*/') &&
                hour.startsWith('*/') &&
                dayOfMonth === '*' &&
                month === '*' &&
                dayOfWeek === '*'
            ) {
                const interval = parseInt(hour.substring(2));
                const m = parseInt(minute);
                if (!isNaN(interval) && !isNaN(m) && interval > 0) {
                    description = `Every ${interval} hour${interval !== 1 ? 's' : ''} at minute ${m}`;
                    const currentHour = now.getHours();
                    const currentMin = now.getMinutes();
                    let nextHour = Math.ceil((currentHour + 1) / interval) * interval;
                    let firstRun: Date;
                    if (nextHour >= 24) {
                        firstRun = addDays(setHours(setMinutes(startOfDay(now), m), 0), 1);
                    } else {
                        // Check if we can use the current hour
                        if (currentHour % interval === 0 && currentMin < m) {
                            firstRun = setHours(setMinutes(startOfDay(now), m), currentHour);
                        } else {
                            firstRun = setHours(setMinutes(startOfDay(now), m), nextHour);
                        }
                        // Ensure it's in the future
                        if (firstRun <= now) {
                            nextHour = nextHour + interval;
                            if (nextHour >= 24) {
                                firstRun = addDays(setHours(setMinutes(startOfDay(now), m), 0), 1);
                            } else {
                                firstRun = setHours(setMinutes(startOfDay(now), m), nextHour);
                            }
                        }
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addHours(last, interval), numRuns));
                }
            }
            // Daily: M H * * *
            else if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
                const m = parseInt(minute);
                const h = parseInt(hour);
                if (!isNaN(m) && !isNaN(h)) {
                    description = `Daily at ${format(setHours(setMinutes(startOfDay(now), m), h), 'h:mma')}`;
                    let firstRun = setHours(setMinutes(startOfDay(now), m), h);
                    // Ensure it's in the future
                    if (firstRun <= now) {
                        firstRun = addDays(firstRun, 1);
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addDays(last, 1), numRuns));
                }
            }
            // Weekly: M H * * DOW
            else if (dayOfMonth === '*' && month === '*') {
                const m = parseInt(minute);
                const h = parseInt(hour);
                const dow = parseInt(dayOfWeek);
                if (!isNaN(m) && !isNaN(h) && !isNaN(dow)) {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    description = `Weekly on ${days[dow]} at ${format(
                        setHours(setMinutes(startOfDay(now), m), h),
                        'h:mma'
                    )}`;
                    // setDay finds the next occurrence of the day of week
                    let firstRun = setDay(setHours(setMinutes(startOfDay(now), m), h), dow);
                    // If setDay returned a time in the past (same day but time has passed), move to next week
                    if (firstRun <= now) {
                        firstRun = addWeeks(firstRun, 1);
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addWeeks(last, 1), numRuns));
                }
            }
            // Monthly: M H D * *
            else if (month === '*' && dayOfWeek === '*') {
                const m = parseInt(minute);
                const h = parseInt(hour);
                const dom = parseInt(dayOfMonth);
                if (!isNaN(m) && !isNaN(h) && !isNaN(dom)) {
                    description = `Monthly on day ${dom} at ${format(
                        setHours(setMinutes(startOfDay(now), m), h),
                        'h:mma'
                    )}`;
                    // Try to set the date - if it fails (e.g., Feb 30), setDate will adjust to last day of month
                    let firstRun = setDate(setHours(setMinutes(startOfDay(now), m), h), dom);
                    // If the date was adjusted or is in the past, move to next month
                    if (firstRun.getDate() !== dom || firstRun <= now) {
                        firstRun = addMonths(setDate(setHours(setMinutes(startOfDay(now), m), h), dom), 1);
                        // Handle case where next month doesn't have that day (e.g., Jan 31 -> Feb 28/29)
                        if (firstRun.getDate() !== dom) {
                            // setDate will automatically adjust, but we want the last day of the month
                            firstRun = setDate(setHours(setMinutes(startOfDay(now), m), h), dom);
                            firstRun = addMonths(firstRun, 1);
                        }
                    }
                    nextRuns.push(...calculateNextRuns(firstRun, (last) => addMonths(last, 1), numRuns));
                }
            }
            // Fallback: show cron expression
            else {
                description = `Cron: ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
            }

            return { description, nextRuns };
        } catch (error) {
            return { description: 'Invalid schedule configuration', nextRuns: [] };
        }
    }, [cron, numRuns]);

    return (
        <div css={tw`mt-4 bg-neutral-800 border border-neutral-700 rounded p-4`}>
            <div css={tw`flex items-center justify-between mb-4`}>
                <p css={tw`text-sm text-neutral-300`}>
                    <strong css={tw`text-neutral-100`}>Schedule:</strong> {preview.description}
                </p>
                <div css={tw`flex items-center gap-2`}>
                    <Label css={tw`text-xs text-neutral-400 mb-0`} htmlFor={'num-runs'}>
                        Show:
                    </Label>
                    <Input
                        id={'num-runs'}
                        type={'number'}
                        value={numRuns}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0 && val <= 50) {
                                setNumRuns(val);
                            }
                        }}
                        min={1}
                        max={50}
                        css={tw`w-16 h-8 text-sm`}
                    />
                    <span css={tw`text-xs text-neutral-400`}>runs</span>
                </div>
            </div>
            {preview.nextRuns.length > 0 ? (
                <div css={tw`space-y-2`}>
                    {preview.nextRuns.map((run, index) => {
                        const now = new Date();
                        const minutesUntil = Math.round((run.getTime() - now.getTime()) / 1000 / 60);
                        let timeUntilText = '';
                        if (run > now) {
                            if (minutesUntil < 60) {
                                timeUntilText = `in ${minutesUntil} min${minutesUntil !== 1 ? 's' : ''}`;
                            } else if (minutesUntil < 1440) {
                                const hours = Math.round(minutesUntil / 60);
                                timeUntilText = `in ${hours} hour${hours !== 1 ? 's' : ''}`;
                            } else {
                                const days = Math.round(minutesUntil / 1440);
                                timeUntilText = `in ${days} day${days !== 1 ? 's' : ''}`;
                            }
                        }
                        return (
                            <div
                                key={index}
                                css={tw`text-sm text-neutral-300 flex items-center justify-between py-1 border-b border-neutral-700 last:border-0`}
                            >
                                <span>
                                    <strong css={tw`text-neutral-100`}>
                                        {index === 0 ? 'Next' : `#${index + 1}`}:
                                    </strong>{' '}
                                    {format(run, "MMM do, yyyy 'at' h:mma")}
                                </span>
                                {timeUntilText && <span css={tw`text-neutral-400 text-xs ml-4`}>{timeUntilText}</span>}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p css={tw`text-sm text-neutral-400`}>Unable to calculate next run times</p>
            )}
        </div>
    );
};

export default SchedulePreview;
