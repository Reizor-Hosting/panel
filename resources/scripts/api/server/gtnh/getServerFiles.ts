import http from '@/api/http';

export interface ServerFile {
    name: string;
    mode: string;
    size: number;
    isFile: boolean;
    isSymlink: boolean;
    mimetype: string;
    createdAt: Date;
    modifiedAt: Date;
}

export default async (uuid: string, directory: string = '/'): Promise<ServerFile[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/files/list`, {
        params: { directory },
    });

    return data.data.map((file: any) => ({
        name: file.attributes.name,
        mode: file.attributes.mode,
        size: file.attributes.size,
        isFile: file.attributes.is_file,
        isSymlink: file.attributes.is_symlink,
        mimetype: file.attributes.mimetype,
        createdAt: new Date(file.attributes.created_at),
        modifiedAt: new Date(file.attributes.modified_at),
    }));
};

