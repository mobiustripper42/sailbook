export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      codes: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      course_types: {
        Row: {
          certification_body: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_students: number | null
          min_hours: number | null
          name: string
          short_code: string
          updated_at: string | null
        }
        Insert: {
          certification_body?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          min_hours?: number | null
          name: string
          short_code: string
          updated_at?: string | null
        }
        Update: {
          certification_body?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_students?: number | null
          min_hours?: number | null
          name?: string
          short_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          capacity: number
          course_type_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          instructor_id: string | null
          member_price: number | null
          notes: string | null
          price: number | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          course_type_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          instructor_id?: string | null
          member_price?: number | null
          notes?: string | null
          price?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          course_type_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          instructor_id?: string | null
          member_price?: number | null
          notes?: string | null
          price?: number | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_course_type_id_fkey"
            columns: ["course_type_id"]
            isOneToOne: false
            referencedRelation: "course_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          hold_expires_at: string | null
          id: string
          status: string | null
          stripe_checkout_session_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          hold_expires_at?: string | null
          id?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          hold_expires_at?: string | null
          id?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          created_by: string | null
          last_accepted_at: string | null
          last_accepted_by: string | null
          role: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          last_accepted_at?: string | null
          last_accepted_by?: string | null
          role: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          last_accepted_at?: string | null
          last_accepted_by?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_last_accepted_by_fkey"
            columns: ["last_accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string
          enrollment_id: string
          id: string
          payment_method: string
          refund_amount_cents: number | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string
          enrollment_id: string
          id?: string
          payment_method?: string
          refund_amount_cents?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string
          enrollment_id?: string
          id?: string
          payment_method?: string
          refund_amount_cents?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          asa_number: string | null
          auth_source: string
          created_at: string | null
          email: string
          experience_level: string | null
          first_name: string
          id: string
          instructor_notes: string | null
          is_active: boolean | null
          is_admin: boolean
          is_instructor: boolean
          is_member: boolean
          is_student: boolean
          last_name: string
          notification_preferences: Json | null
          phone: string | null
          stripe_customer_id: string | null
          theme_preference: string
          updated_at: string | null
        }
        Insert: {
          asa_number?: string | null
          auth_source?: string
          created_at?: string | null
          email: string
          experience_level?: string | null
          first_name: string
          id: string
          instructor_notes?: string | null
          is_active?: boolean | null
          is_admin?: boolean
          is_instructor?: boolean
          is_member?: boolean
          is_student?: boolean
          last_name: string
          notification_preferences?: Json | null
          phone?: string | null
          stripe_customer_id?: string | null
          theme_preference?: string
          updated_at?: string | null
        }
        Update: {
          asa_number?: string | null
          auth_source?: string
          created_at?: string | null
          email?: string
          experience_level?: string | null
          first_name?: string
          id?: string
          instructor_notes?: string | null
          is_active?: boolean | null
          is_admin?: boolean
          is_instructor?: boolean
          is_member?: boolean
          is_student?: boolean
          last_name?: string
          notification_preferences?: Json | null
          phone?: string | null
          stripe_customer_id?: string | null
          theme_preference?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          created_at: string | null
          enrollment_id: string
          id: string
          makeup_session_id: string | null
          notes: string | null
          session_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enrollment_id: string
          id?: string
          makeup_session_id?: string | null
          notes?: string | null
          session_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enrollment_id?: string
          id?: string
          makeup_session_id?: string | null
          notes?: string | null
          session_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_makeup_session_id_fkey"
            columns: ["makeup_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          cancel_reason: string | null
          course_id: string
          created_at: string | null
          date: string
          end_time: string
          id: string
          instructor_id: string | null
          location: string | null
          notes: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_reason?: string | null
          course_id: string
          created_at?: string | null
          date: string
          end_time: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          notes?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_reason?: string | null
          course_id?: string
          created_at?: string | null
          date?: string
          end_time?: string
          id?: string
          instructor_id?: string | null
          location?: string | null
          notes?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { p_role: string; p_token: string }
        Returns: boolean
      }
      get_all_course_enrollment_counts: {
        Args: never
        Returns: {
          active_count: number
          course_id: string
        }[]
      }
      get_course_active_enrollment_count: {
        Args: { p_course_id: string }
        Returns: number
      }
      get_enrolled_course_ids: { Args: { user_id: string }; Returns: string[] }
      get_instructor_course_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_instructor_session_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_instructor_student_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_student_enrollment_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      profile_auth_source_unchanged: {
        Args: { p_auth_source: string; p_id: string }
        Returns: boolean
      }
      profile_role_flags_unchanged: {
        Args: {
          p_id: string
          p_is_active: boolean
          p_is_admin: boolean
          p_is_instructor: boolean
          p_is_member: boolean
          p_is_student: boolean
        }
        Returns: boolean
      }
      update_session_notes: {
        Args: { p_notes: string; p_session_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

