/**
 * User Models
 * Customer and user authentication
 */

import { MetaData } from './common.model';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  avatar_url: string;
  billing: UserAddress;
  shipping: UserAddress;
  customer_id?: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  is_paying_customer?: boolean;
  role: string;
  meta_data: MetaData[];
}

export interface UserAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface UserLogin {
  username: string;
  password: string;
  remember?: boolean;
}

export interface AuthToken {
  token: string;
  expires_in: number;
  refresh_token?: string;
  user: User;
}

export interface UserProfile extends User {
  phone: string;
  date_of_birth?: string;
  preferences: UserPreferences;
  notifications: UserNotifications;
}

export interface UserPreferences {
  newsletter: boolean;
  notifications: boolean;
  language: 'fa' | 'en';
  currency: string;
  theme: 'light' | 'dark';
}

export interface UserNotifications {
  order_updates: boolean;
  new_products: boolean;
  promotions: boolean;
  consultation_reminders: boolean;
}

export interface UserFilter {
  search?: string;
  email?: string;
  role?: string;
  page?: number;
  per_page?: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  password_confirm: string;
}

export interface Customer extends User {
  is_paying_customer: boolean;
  total_spent: string;
  orders_count: number;
}
