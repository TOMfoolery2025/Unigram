/** @format */

// Activity types for social features

export type ActivityType = 'post' | 'event_registration' | 'friendship';

export interface Activity {
  activity_type: ActivityType;
  activity_id: string;
  user_id: string;
  activity_title: string;
  activity_description: string | null;
  context_name: string | null;
  created_at: string;
  actor_id: string;
  actor_name: string | null;
  actor_avatar: string | null;
}

export interface ActivityResponse {
  data: Activity | null;
  error: Error | null;
}

export interface ActivitiesResponse {
  data: Activity[] | null;
  error: Error | null;
}
