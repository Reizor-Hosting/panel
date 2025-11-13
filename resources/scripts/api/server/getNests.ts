import http from '@/api/http';
import { FractalResponseData, FractalResponseList } from '@/api/http';

export interface Nest {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    eggs?: Egg[];
}

export interface Egg {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
}

const rawDataToNest = (nestData: FractalResponseData, includedMap?: Map<string, any>): Nest => {
    const { attributes } = nestData;
    const nest: Nest = {
        id: attributes.id,
        uuid: attributes.uuid,
        name: attributes.name,
        description: attributes.description,
    };

    // Try to get eggs from relationships
    let eggsData: FractalResponseList | undefined;
    if (attributes.relationships?.eggs) {
        eggsData = attributes.relationships.eggs as FractalResponseList;
    }

    // Parse eggs from relationships
    if (eggsData && eggsData.data) {
        nest.eggs = eggsData.data.map((egg: any) => {
            // Handle JSON:API format where eggs might be in included array
            let eggAttrs = egg.attributes || egg;

            // If egg is just an ID reference (JSON:API format: { type: 'egg', id: '1' }), look it up in included map
            if (egg.type === 'egg' && egg.id && !egg.attributes && includedMap) {
                const includedEgg = includedMap.get(`egg-${egg.id}`);
                if (includedEgg) {
                    eggAttrs = includedEgg.attributes || includedEgg;
                }
            } else if (typeof egg === 'string' && includedMap) {
                const includedEgg = includedMap.get(egg);
                if (includedEgg) {
                    eggAttrs = includedEgg.attributes || includedEgg;
                }
            } else if (egg.id && !egg.attributes && includedMap) {
                const includedEgg = includedMap.get(`egg-${egg.id}`);
                if (includedEgg) {
                    eggAttrs = includedEgg.attributes || includedEgg;
                }
            }

            return {
                id: eggAttrs.id,
                uuid: eggAttrs.uuid,
                name: eggAttrs.name,
                description: eggAttrs.description,
            };
        });
    }

    return nest;
};

export default async (): Promise<Nest[]> => {
    const { data } = await http.get('/api/client/nests?include=eggs');
    const response = data as FractalResponseList & { included?: any[] };

    // Build a map of included resources for quick lookup (JSON:API format)
    const includedMap = new Map<string, any>();
    if (response.included) {
        response.included.forEach((item: any) => {
            const key = `${item.type}-${item.id || item.attributes?.id}`;
            includedMap.set(key, item);
            // Also index by just the ID for easier lookup
            if (item.id) {
                includedMap.set(item.id.toString(), item);
            }
        });
    }

    // Handle both standard Fractal format and JSON:API format
    const nests = (response.data || []).map((nest: FractalResponseData) => rawDataToNest(nest, includedMap));

    return nests;
};
