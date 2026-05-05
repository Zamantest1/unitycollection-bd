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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link: string | null
          overlay_type: string | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link?: string | null
          overlay_type?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link?: string | null
          overlay_type?: string | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expiry_date: string | null
          id: string
          is_active: boolean | null
          min_purchase: number | null
          usage_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          min_purchase?: number | null
          usage_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          min_purchase?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          created_at: string | null
          discount_type: string
          discount_value: number
          email: string | null
          id: string
          is_active: boolean | null
          member_code: string
          name: string
          order_count: number
          phone: string
          total_purchases: number
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          email?: string | null
          id?: string
          is_active?: boolean | null
          member_code: string
          name: string
          order_count?: number
          phone: string
          total_purchases?: number
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          email?: string | null
          id?: string
          is_active?: boolean | null
          member_code?: string
          name?: string
          order_count?: number
          phone?: string
          total_purchases?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notice_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          coupon_code: string | null
          created_at: string
          custom_discount: number | null
          customer_name: string
          delivery_area: string
          delivery_charge: number | null
          discount_amount: number | null
          id: string
          items: Json
          member_id: string | null
          order_id: string
          phone: string
          referral_code: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address: string
          coupon_code?: string | null
          created_at?: string
          custom_discount?: number | null
          customer_name: string
          delivery_area: string
          delivery_charge?: number | null
          discount_amount?: number | null
          id?: string
          items?: Json
          member_id?: string | null
          order_id: string
          phone: string
          referral_code?: string | null
          status?: string
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          address?: string
          coupon_code?: string | null
          created_at?: string
          custom_discount?: number | null
          customer_name?: string
          delivery_area?: string
          delivery_charge?: number | null
          discount_amount?: number | null
          id?: string
          items?: Json
          member_id?: string | null
          order_id?: string
          phone?: string
          referral_code?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: number
          path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          visited_at: string
        }
        Insert: {
          id?: number
          path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          visited_at?: string
        }
        Update: {
          id?: number
          path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_number: string
          created_at: string
          display_order: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          key: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          account_number: string
          created_at?: string
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          key: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          created_at?: string
          display_order?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          key?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          admin_note: string | null
          amount: number | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          method_key: string
          order_id: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          method_key: string
          order_id: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          amount?: number | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          method_key?: string
          order_id?: string
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discount_price: number | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          product_code: string
          size_guide_url: string | null
          size_stock: Json
          sizes: string[] | null
          sold_count: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          product_code: string
          size_guide_url?: string | null
          size_stock?: Json
          sizes?: string[] | null
          sold_count?: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          product_code?: string
          size_guide_url?: string | null
          size_stock?: Json
          sizes?: string[] | null
          sold_count?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string
          commission_type: string
          commission_value: number
          created_at: string | null
          id: string
          is_active: boolean | null
          referrer_name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          commission_type: string
          commission_value: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          referrer_name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          commission_type?: string
          commission_value?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          referrer_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      get_order_tracking: {
        Args: { p_order_id: string }
        Returns: {
          order_id: string
          status: string
          delivery_area: string
          delivery_charge: number
          subtotal: number
          discount_amount: number
          total: number
          items: Json
          customer_name_initial: string
          phone_masked: string
          created_at: string
          updated_at: string
        }[]
      }
      create_customer_order: {
        Args: {
          p_customer_name: string
          p_phone: string
          p_address: string
          p_delivery_area: string
          p_delivery_charge: number
          p_items: Json
          p_subtotal: number
          p_discount_amount: number
          p_coupon_code: string | null
          p_referral_code: string | null
          p_member_id: string | null
          p_total: number
        }
        Returns: string
      }
      track_page_view: {
        Args: {
          p_path: string
          p_session_id: string
          p_user_agent: string | null
          p_referrer: string | null
        }
        Returns: undefined
      }
      get_visit_stats: {
        Args: never
        Returns: {
          visits_today: number
          visits_7d: number
          visits_30d: number
          unique_visitors_today: number
          unique_visitors_7d: number
          unique_visitors_30d: number
        }[]
      }
      get_top_pages: {
        Args: { p_days: number; p_limit: number }
        Returns: { path: string; views: number; unique_visitors: number }[]
      }
      get_visits_by_day: {
        Args: { p_days: number }
        Returns: { day: string; views: number; unique_visitors: number }[]
      }
      submit_payment: {
        Args: {
          p_order_id: string
          p_method_key: string
          p_customer_name: string | null
          p_customer_phone: string | null
          p_transaction_id: string
          p_amount: number | null
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
