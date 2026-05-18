export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiRequest {
  id: string;
  folder_id: string | null;
  collection_id: string;
  name: string;
  protocol: string;
  method: string;
  url: string;
  headers: string; // JSON string of KeyValuePair[]
  query_params: string; // JSON string of KeyValuePair[]
  body_type: string | null;
  body_content: string | null;
  pre_script: string | null;
  post_script: string | null;
  sort_order: number;
  proto_file: string | null;
  grpc_service: string | null;
  grpc_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse {
  status: number;
  status_text: string;
  latency_ms: number;
  size_bytes: number;
  headers: [string, string][];
  body: string;
  body_type: string;
}
