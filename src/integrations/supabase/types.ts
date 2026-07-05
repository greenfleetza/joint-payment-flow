export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_id: string | null
          actor_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          from_state: string | null
          id: string
          merchant_id: string | null
          payload: Json
          session_id: string | null
          to_state: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          from_state?: string | null
          id?: string
          merchant_id?: string | null
          payload?: Json
          session_id?: string | null
          to_state?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          from_state?: string | null
          id?: string
          merchant_id?: string | null
          payload?: Json
          session_id?: string | null
          to_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_allocations: {
        Row: {
          amount_cents: number
          card_label: string | null
          created_at: string
          id: string
          last4: string | null
          sequence: number
          session_id: string
          state: Database["public"]["Enums"]["card_allocation_state"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          card_label?: string | null
          created_at?: string
          id?: string
          last4?: string | null
          sequence: number
          session_id: string
          state?: Database["public"]["Enums"]["card_allocation_state"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          card_label?: string | null
          created_at?: string
          id?: string
          last4?: string | null
          sequence?: number
          session_id?: string
          state?: Database["public"]["Enums"]["card_allocation_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_allocations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      contributors: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invite_token: string
          invited_at: string
          is_initiator: boolean
          name: string
          paid_at: string | null
          session_id: string
          share_amount_cents: number
          state: Database["public"]["Enums"]["contributor_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invite_token: string
          invited_at?: string
          is_initiator?: boolean
          name: string
          paid_at?: string | null
          session_id: string
          share_amount_cents: number
          state?: Database["public"]["Enums"]["contributor_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invite_token?: string
          invited_at?: string
          is_initiator?: boolean
          name?: string
          paid_at?: string | null
          session_id?: string
          share_amount_cents?: number
          state?: Database["public"]["Enums"]["contributor_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributors_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          environment: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          environment?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          environment?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchant_settings: {
        Row: {
          brand_color: string
          contributor_split_enabled: boolean
          created_at: string
          id: string
          logo_url: string | null
          merchant_id: string
          multi_card_split_enabled: boolean
          refund_window_days: number
          session_ttl_seconds: number
          updated_at: string
        }
        Insert: {
          brand_color?: string
          contributor_split_enabled?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          merchant_id: string
          multi_card_split_enabled?: boolean
          refund_window_days?: number
          session_ttl_seconds?: number
          updated_at?: string
        }
        Update: {
          brand_color?: string
          contributor_split_enabled?: boolean
          created_at?: string
          id?: string
          logo_url?: string | null
          merchant_id?: string
          multi_card_split_enabled?: boolean
          refund_window_days?: number
          session_ttl_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          contact_email: string
          created_at: string
          display_name: string
          id: string
          owner_user_id: string
          slug: string
          status: Database["public"]["Enums"]["merchant_status"]
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          display_name: string
          id?: string
          owner_user_id: string
          slug: string
          status?: Database["public"]["Enums"]["merchant_status"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          display_name?: string
          id?: string
          owner_user_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          failure_reason: string | null
          id: string
          merchant_id: string | null
          payload: Json
          recipient: string
          sent_at: string | null
          session_id: string | null
          state: Database["public"]["Enums"]["notification_state"]
          template: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          failure_reason?: string | null
          id?: string
          merchant_id?: string | null
          payload?: Json
          recipient: string
          sent_at?: string | null
          session_id?: string | null
          state?: Database["public"]["Enums"]["notification_state"]
          template: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          failure_reason?: string | null
          id?: string
          merchant_id?: string | null
          payload?: Json
          recipient?: string
          sent_at?: string | null
          session_id?: string | null
          state?: Database["public"]["Enums"]["notification_state"]
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          authorized_at: string | null
          captured_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          session_id: string
          source_id: string
          source_type: Database["public"]["Enums"]["payment_source_type"]
          state: Database["public"]["Enums"]["payment_state"]
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          authorized_at?: string | null
          captured_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          session_id: string
          source_id: string
          source_type: Database["public"]["Enums"]["payment_source_type"]
          state?: Database["public"]["Enums"]["payment_state"]
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          authorized_at?: string | null
          captured_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          session_id?: string
          source_id?: string
          source_type?: Database["public"]["Enums"]["payment_source_type"]
          state?: Database["public"]["Enums"]["payment_state"]
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          merchant_id: string
          payment_id: string
          processed_at: string | null
          reason: string | null
          session_id: string
          state: Database["public"]["Enums"]["refund_state"]
          stripe_refund_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          merchant_id: string
          payment_id: string
          processed_at?: string | null
          reason?: string | null
          session_id: string
          state?: Database["public"]["Enums"]["refund_state"]
          stripe_refund_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          merchant_id?: string
          payment_id?: string
          processed_at?: string | null
          reason?: string | null
          session_id?: string
          state?: Database["public"]["Enums"]["refund_state"]
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "split_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      split_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          external_transaction_id: string | null
          id: string
          initiator_email: string | null
          initiator_name: string | null
          merchant_id: string
          metadata: Json
          method: Database["public"]["Enums"]["split_method"] | null
          order_reference: string | null
          state: Database["public"]["Enums"]["session_state"]
          total_amount_cents: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_transaction_id?: string | null
          id?: string
          initiator_email?: string | null
          initiator_name?: string | null
          merchant_id: string
          metadata?: Json
          method?: Database["public"]["Enums"]["split_method"] | null
          order_reference?: string | null
          state?: Database["public"]["Enums"]["session_state"]
          total_amount_cents: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          external_transaction_id?: string | null
          id?: string
          initiator_email?: string | null
          initiator_name?: string | null
          merchant_id?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["split_method"] | null
          order_reference?: string | null
          state?: Database["public"]["Enums"]["session_state"]
          total_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_sessions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          merchant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          received_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          received_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          received_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_merchant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "merchant"
      card_allocation_state:
        | "pending"
        | "authorizing"
        | "authorized"
        | "captured"
        | "failed"
        | "voided"
      contributor_state:
        | "invited"
        | "viewed"
        | "authorizing"
        | "authorized"
        | "captured"
        | "failed"
        | "expired"
        | "refunded"
      merchant_status: "pending" | "active" | "suspended"
      notification_channel: "email" | "sms"
      notification_state: "queued" | "sent" | "failed"
      payment_source_type: "contributor" | "card_allocation"
      payment_state:
        | "pending"
        | "authorizing"
        | "authorized"
        | "captured"
        | "failed"
        | "voided"
        | "refunded"
      refund_state: "pending" | "succeeded" | "failed"
      session_state:
        | "created"
        | "awaiting_method"
        | "collecting"
        | "processing"
        | "authorized"
        | "captured"
        | "completed"
        | "expired"
        | "failed"
        | "canceled"
        | "refunded"
      split_method: "contributor" | "multi_card"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "merchant"],
      card_allocation_state: [
        "pending",
        "authorizing",
        "authorized",
        "captured",
        "failed",
        "voided",
      ],
      contributor_state: [
        "invited",
        "viewed",
        "authorizing",
        "authorized",
        "captured",
        "failed",
        "expired",
        "refunded",
      ],
      merchant_status: ["pending", "active", "suspended"],
      notification_channel: ["email", "sms"],
      notification_state: ["queued", "sent", "failed"],
      payment_source_type: ["contributor", "card_allocation"],
      payment_state: [
        "pending",
        "authorizing",
        "authorized",
        "captured",
        "failed",
        "voided",
        "refunded",
      ],
      refund_state: ["pending", "succeeded", "failed"],
      session_state: [
        "created",
        "awaiting_method",
        "collecting",
        "processing",
        "authorized",
        "captured",
        "completed",
        "expired",
        "failed",
        "canceled",
        "refunded",
      ],
      split_method: ["contributor", "multi_card"],
    },
  },
} as const
