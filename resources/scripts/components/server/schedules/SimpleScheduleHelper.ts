/**
 * Converts simple schedule settings to cron syntax
 */
export interface SimpleScheduleValues {
    frequency: 'minutes' | 'hours' | 'daily' | 'weekly' | 'monthly';
    interval?: number; // For minutes/hours
    time?: { hour: number; minute: number }; // For daily/weekly/monthly
    dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
    dayOfMonth?: number; // 1-31 for monthly
}

export const convertSimpleToCron = (values: SimpleScheduleValues): {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
} => {
    switch (values.frequency) {
        case 'minutes':
            return {
                minute: `*/${values.interval || 5}`,
                hour: '*',
                dayOfMonth: '*',
                month: '*',
                dayOfWeek: '*',
            };

        case 'hours':
            return {
                minute: values.time?.minute?.toString() || '0',
                hour: `*/${values.interval || 1}`,
                dayOfMonth: '*',
                month: '*',
                dayOfWeek: '*',
            };

        case 'daily':
            return {
                minute: values.time?.minute?.toString() || '0',
                hour: values.time?.hour?.toString() || '0',
                dayOfMonth: '*',
                month: '*',
                dayOfWeek: '*',
            };

        case 'weekly':
            // Convert day of week: 0=Sunday -> cron uses 0=Sunday, 1=Monday, etc.
            const cronDayOfWeek = values.dayOfWeek?.toString() || '0';
            return {
                minute: values.time?.minute?.toString() || '0',
                hour: values.time?.hour?.toString() || '0',
                dayOfMonth: '*',
                month: '*',
                dayOfWeek: cronDayOfWeek,
            };

        case 'monthly':
            return {
                minute: values.time?.minute?.toString() || '0',
                hour: values.time?.hour?.toString() || '0',
                dayOfMonth: values.dayOfMonth?.toString() || '1',
                month: '*',
                dayOfWeek: '*',
            };

        default:
            return {
                minute: '*/5',
                hour: '*',
                dayOfMonth: '*',
                month: '*',
                dayOfWeek: '*',
            };
    }
};

/**
 * Attempts to parse cron syntax back to simple mode values
 * Returns null if it can't be converted to simple mode
 */
export const parseCronToSimple = (cron: {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
}): SimpleScheduleValues | null => {
    // Try to detect patterns
    const { minute, hour, dayOfMonth, month, dayOfWeek } = cron;

    // Every X minutes: */X * * * *
    if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        const interval = parseInt(minute.substring(2));
        if (!isNaN(interval)) {
            return { frequency: 'minutes', interval };
        }
    }

    // Every X hours: 0 */X * * *
    if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        const interval = parseInt(hour.substring(2));
        if (!isNaN(interval)) {
            return { frequency: 'hours', interval, time: { hour: 0, minute: 0 } };
        }
    }

    // Daily: X Y * * *
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        const m = parseInt(minute);
        const h = parseInt(hour);
        if (!isNaN(m) && !isNaN(h)) {
            return { frequency: 'daily', time: { hour: h, minute: m } };
        }
    }

    // Weekly: X Y * * Z
    if (dayOfMonth === '*' && month === '*') {
        const m = parseInt(minute);
        const h = parseInt(hour);
        const dow = parseInt(dayOfWeek);
        if (!isNaN(m) && !isNaN(h) && !isNaN(dow)) {
            return { frequency: 'weekly', time: { hour: h, minute: m }, dayOfWeek: dow };
        }
    }

    // Monthly: X Y Z * *
    if (month === '*' && dayOfWeek === '*') {
        const m = parseInt(minute);
        const h = parseInt(hour);
        const dom = parseInt(dayOfMonth);
        if (!isNaN(m) && !isNaN(h) && !isNaN(dom)) {
            return { frequency: 'monthly', time: { hour: h, minute: m }, dayOfMonth: dom };
        }
    }

    return null;
};

