import http from '@/api/http';
import { Egg } from './getNests';
import { FractalResponseData, FractalResponseList } from '@/api/http';

export default async (nestId: number): Promise<Egg[]> => {
    const { data } = await http.get(`/api/client/nests/${nestId}/eggs`);
    const response = data as FractalResponseList;

    return (response.data || []).map((egg: FractalResponseData) => ({
        id: egg.attributes.id,
        uuid: egg.attributes.uuid,
        name: egg.attributes.name,
        description: egg.attributes.description,
    }));
};
