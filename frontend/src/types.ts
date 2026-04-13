export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  owner_id: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}