export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_credits: {
        Row: {
          id: string;
          credits: number;
          referral_code: string;
          referred_by: string | null;
          total_referrals: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          credits?: number;
          referral_code: string;
          referred_by?: string | null;
          total_referrals?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          credits?: number;
          referral_code?: string;
          referred_by?: string | null;
          total_referrals?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
