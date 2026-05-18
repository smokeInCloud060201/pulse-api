export interface EnvVariable {
  id: string;
  environment_id: string;
  key: string;
  value: string;
  var_type: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  variables: EnvVariable[];
}
