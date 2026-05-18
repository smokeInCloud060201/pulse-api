export interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  collection_id: string;
  parent_folder_id?: string;
  name: string;
  sort_order: number;
}
