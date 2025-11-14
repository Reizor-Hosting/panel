import http from '@/api/http';

export default async (uuid: string, files: string[]): Promise<void> => {
    await http.post(`/api/client/servers/${uuid}/files/delete`, {
        root: '/',
        files,
    });
};

