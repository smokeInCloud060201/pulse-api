import { v4 as uuidv4 } from 'uuid';
import { Collection, Folder } from '../types/collection';
import { ApiRequest, KeyValuePair } from '../types/request';

export interface PostmanImportResult {
  collection?: Collection;
  folders?: Folder[];
  requests?: ApiRequest[];
  error?: string;
}

export function parsePostmanCollection(jsonString: string): PostmanImportResult {
  try {
    const data = JSON.parse(jsonString);

    if (!data.info || !data.item) {
      return { error: 'Invalid Postman Collection format' };
    }

    const collection: Collection = {
      id: uuidv4(),
      name: data.info.name || 'Imported Collection',
      description: data.info.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const folders: Folder[] = [];
    const requests: ApiRequest[] = [];

    const processItem = (item: any, parentFolderId: string | null = null, order: number = 0) => {
      // If it has 'request', it's a request
      if (item.request) {
        const req: ApiRequest = {
          id: uuidv4(),
          collection_id: collection.id,
          folder_id: parentFolderId,
          name: item.name || 'Untitled Request',
          protocol: 'REST',
          method: item.request.method || 'GET',
          url: typeof item.request.url === 'string' ? item.request.url : item.request.url?.raw || '',
          headers: '[]',
          query_params: '[]',
          body_type: item.request.body?.mode || null,
          body_content: item.request.body?.raw || null,
          pre_script: null,
          post_script: null,
          sort_order: order,
          proto_file: null,
          grpc_service: null,
          grpc_method: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Parse headers
        if (Array.isArray(item.request.header)) {
          const headers: KeyValuePair[] = item.request.header.map((h: any) => ({
            key: h.key,
            value: h.value,
            enabled: h.disabled !== true
          }));
          req.headers = JSON.stringify(headers);
        }

        // Extract scripts
        if (Array.isArray(item.event)) {
          for (const ev of item.event) {
            if (ev.listen === 'prerequest' && ev.script?.exec) {
              req.pre_script = ev.script.exec.join('\n');
            } else if (ev.listen === 'test' && ev.script?.exec) {
              req.post_script = ev.script.exec.join('\n');
            }
          }
        }

        requests.push(req);
      } else if (item.item) {
        // It's a folder
        const folder: Folder = {
          id: uuidv4(),
          collection_id: collection.id,
          parent_folder_id: parentFolderId || undefined,
          name: item.name || 'Folder',
          sort_order: order
        };
        folders.push(folder);

        item.item.forEach((childItem: any, idx: number) => {
          processItem(childItem, folder.id, idx);
        });
      }
    };

    data.item.forEach((item: any, idx: number) => {
      processItem(item, null, idx);
    });

    return { collection, folders, requests };
  } catch (err: any) {
    return { error: 'Failed to parse JSON: ' + err.message };
  }
}

export interface PostmanEnvImportResult {
  name?: string;
  variables?: KeyValuePair[];
  error?: string;
}

export function parsePostmanEnvironment(jsonString: string): PostmanEnvImportResult {
  try {
    const data = JSON.parse(jsonString);
    if (!data.name || !Array.isArray(data.values)) {
      return { error: 'Invalid Postman Environment format' };
    }

    const variables: KeyValuePair[] = data.values.map((v: any) => ({
      key: v.key,
      value: v.value,
      enabled: v.enabled !== false
    }));

    return { name: data.name, variables };
  } catch (err: any) {
    return { error: 'Failed to parse Environment JSON: ' + err.message };
  }
}
