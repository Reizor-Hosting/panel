import http from '@/api/http';

export interface GTNHVersion {
    name: string;
    url: string;
    type: 'stable' | 'beta' | 'experimental' | 'daily';
    date?: Date;
    size?: number;
}

// Fetch all versions based on type using backend API
export async function fetchVersionsByType(
    uuid: string,
    type: 'stable' | 'beta' | 'experimental' | 'daily'
): Promise<GTNHVersion[]> {
    try {
        const { data } = await http.get(`/api/client/servers/${uuid}/gtnh/versions`, {
            params: { type },
        });

        return data.map((version: GTNHVersion) => ({
            ...version,
            date: version.date ? new Date(version.date) : undefined,
        }));
    } catch (error) {
        console.error(`Failed to fetch ${type} versions:`, error);
        return [];
    }
}
