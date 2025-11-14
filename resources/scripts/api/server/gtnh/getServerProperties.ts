import http from '@/api/http';

export default async (uuid: string): Promise<string | null> => {
    try {
        const { data } = await http.get(`/api/client/servers/${uuid}/files/contents`, {
            params: {
                file: '/server.properties',
            },
        });

        // Parse server.properties to find level-name
        const lines = data.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('level-name=')) {
                return trimmed.substring('level-name='.length).trim();
            }
        }

        return null;
    } catch (error) {
        console.error('Failed to read server.properties:', error);
        return null;
    }
};

