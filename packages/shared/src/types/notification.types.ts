export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  title_ar?: string;
  body?: string;
  body_ar?: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  comments: boolean;
  replies: boolean;
  favorites: boolean;
  helpful_reactions: boolean;
  follows: boolean;
  system_updates: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}
