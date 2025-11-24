import http from '@/api/http';

export interface CosmicFrontiersVersion {
    name: string;
    url: string;
    type: 'stable' | 'nightly';
    date?: Date;
    size?: number;
}

// Fetch all versions based on type using backend API
export async function fetchVersionsByType(
    uuid: string,
    type: 'stable' | 'nightly'
): Promise<CosmicFrontiersVersion[]> {
    try {
        const { data } = await http.get(`/api/client/servers/${uuid}/cosmic-frontiers/versions`, {
            params: { type },
        });

        return data.map((version: CosmicFrontiersVersion) => ({
            ...version,
            date: version.date ? new Date(version.date) : undefined,
        }));
    } catch (error) {
        console.error(`Failed to fetch ${type} versions:`, error);
        return [];
    }
}

