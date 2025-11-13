import http from '@/api/http';

export default (uuid: string, nestId: number, eggId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/settings/change-nest-egg`, {
            nest_id: nestId,
            egg_id: eggId,
        })
            .then(() => resolve())
            .catch(reject);
    });
};
