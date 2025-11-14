import http from '@/api/http';

export default async (uuid: string, key: string, value: string): Promise<void> => {
    await http.put(`/api/client/servers/${uuid}/startup/variable`, {
        key,
        value,
    });
};

