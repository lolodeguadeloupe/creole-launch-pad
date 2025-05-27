export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accommodations: {
        Row: {
          amenities: Json
          bathrooms: number
          description: string
          features: Json
          gallery_images: Json
          id: number
          image: string
          location: string
          max_guests: number
          name: string
          price: number
          rating: number
          rooms: number
          rules: Json
          type: string
        }
        Insert: {
          amenities: Json
          bathrooms: number
          description: string
          features: Json
          gallery_images: Json
          id?: number
          image: string
          location: string
          max_guests: number
          name: string
          price: number
          rating: number
          rooms: number
          rules: Json
          type: string
        }
        Update: {
          amenities?: Json
          bathrooms?: number
          description?: string
          features?: Json
          gallery_images?: Json
          id?: number
          image?: string
          location?: string
          max_guests?: number
          name?: string
          price?: number
          rating?: number
          rooms?: number
          rules?: Json
          type?: string
        }
        Relationships: []
      }
      car_client_reviews: {
        Row: {
          avatar: string
          comment: string
          created_at: string | null
          id: number
          location: string
          name: string
          rating: number
          rental_company_name: string
          review_date: string
          updated_at: string | null
        }
        Insert: {
          avatar: string
          comment: string
          created_at?: string | null
          id?: number
          location: string
          name: string
          rating: number
          rental_company_name: string
          review_date: string
          updated_at?: string | null
        }
        Update: {
          avatar?: string
          comment?: string
          created_at?: string | null
          id?: number
          location?: string
          name?: string
          rating?: number
          rental_company_name?: string
          review_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      car_models: {
        Row: {
          air_con: boolean
          category: string
          company_id: number
          created_at: string | null
          id: number
          image: string
          is_active: boolean
          name: string
          price_per_day: number
          seats: number
          transmission: string
          updated_at: string | null
        }
        Insert: {
          air_con?: boolean
          category: string
          company_id: number
          created_at?: string | null
          id?: number
          image: string
          is_active?: boolean
          name: string
          price_per_day: number
          seats: number
          transmission: string
          updated_at?: string | null
        }
        Update: {
          air_con?: boolean
          category?: string
          company_id?: number
          created_at?: string | null
          id?: number
          image?: string
          is_active?: boolean
          name?: string
          price_per_day?: number
          seats?: number
          transmission?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "car_rental_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rental_companies: {
        Row: {
          created_at: string | null
          description: string
          icon_name: string
          id: number
          image: string
          location: string
          name: string
          offer: string
          partner_id: string | null
          rating: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon_name: string
          id?: number
          image: string
          location: string
          name: string
          offer: string
          partner_id?: string | null
          rating: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon_name?: string
          id?: number
          image?: string
          location?: string
          name?: string
          offer?: string
          partner_id?: string | null
          rating?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_rental_companies_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rental_features: {
        Row: {
          company_id: number
          created_at: string | null
          feature: string
          id: number
        }
        Insert: {
          company_id: number
          created_at?: string | null
          feature: string
          id?: number
        }
        Update: {
          company_id?: number
          created_at?: string | null
          feature?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_rental_features_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "car_rental_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rental_reservations: {
        Row: {
          created_at: string
          driver_email: string
          driver_name: string
          driver_phone: string
          end_date: string
          id: string
          notes: string | null
          partner_id: string | null
          rental_company_name: string
          selected_model: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_email: string
          driver_name: string
          driver_phone: string
          end_date: string
          id?: string
          notes?: string | null
          partner_id?: string | null
          rental_company_name: string
          selected_model: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_email?: string
          driver_name?: string
          driver_phone?: string
          end_date?: string
          id?: string
          notes?: string | null
          partner_id?: string | null
          rental_company_name?: string
          selected_model?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_rental_reservations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diving_reservations: {
        Row: {
          created_at: string
          experience_level: string
          id: string
          participant_email: string
          participant_name: string
          participant_phone: string
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          experience_level?: string
          id?: string
          participant_email: string
          participant_name: string
          participant_phone: string
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          experience_level?: string
          id?: string
          participant_email?: string
          participant_name?: string
          participant_phone?: string
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fleet_managers: {
        Row: {
          company_id: number
          created_at: string
          id: string
          permissions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: number
          created_at?: string
          id?: string
          permissions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: number
          created_at?: string
          id?: string
          permissions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_managers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "car_rental_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loisirs: {
        Row: {
          current_participants: number
          description: string
          end_date: string
          gallery_images: Json | null
          id: number
          image: string
          location: string
          max_participants: number
          start_date: string
          title: string
        }
        Insert: {
          current_participants?: number
          description: string
          end_date?: string
          gallery_images?: Json | null
          id?: number
          image: string
          location: string
          max_participants: number
          start_date: string
          title: string
        }
        Update: {
          current_participants?: number
          description?: string
          end_date?: string
          gallery_images?: Json | null
          id?: number
          image?: string
          location?: string
          max_participants?: number
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      loisirs_inscriptions: {
        Row: {
          confirmation_sent: boolean
          email: string
          id: number
          inscription_date: string
          loisir_id: number
          name: string
          phone: string
        }
        Insert: {
          confirmation_sent?: boolean
          email: string
          id?: number
          inscription_date?: string
          loisir_id: number
          name: string
          phone: string
        }
        Update: {
          confirmation_sent?: boolean
          email?: string
          id?: number
          inscription_date?: string
          loisir_id?: number
          name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "loisirs_inscriptions_loisir_id_fkey"
            columns: ["loisir_id"]
            isOneToOne: false
            referencedRelation: "loisirs"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          description: string
          discount_percentage: number | null
          end_date: string | null
          id: string
          is_active: boolean
          partner_id: string
          price: number | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          partner_id: string
          price?: number | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string
          price?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          business_name: string
          business_type: string
          created_at: string
          description: string | null
          id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type: string
          created_at?: string
          description?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string
          created_at?: string
          description?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: number | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string
        }
        Insert: {
          company_id?: number | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          company_id?: number | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "car_rental_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          email: string
          id: string
          item_name: string
          item_type: string
          purchase_date: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          item_name: string
          item_type: string
          purchase_date?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          item_name?: string
          item_type?: string
          purchase_date?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          number_of_people: number | null
          offer_id: string | null
          partner_id: string
          reservation_date: string
          special_requests: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          number_of_people?: number | null
          offer_id?: string | null
          partner_id: string
          reservation_date: string
          special_requests?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          number_of_people?: number | null
          offer_id?: string | null
          partner_id?: string
          reservation_date?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_reservations: {
        Row: {
          created_at: string
          email: string
          guests: number
          id: string
          name: string
          notes: string | null
          phone: string
          reservation_date: string
          reservation_time: string
          restaurant_id: number
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          guests: number
          id?: string
          name: string
          notes?: string | null
          phone: string
          reservation_date: string
          reservation_time: string
          restaurant_id: number
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          guests?: number
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          reservation_date?: string
          reservation_time?: string
          restaurant_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          description: string
          icon: string
          id: number
          image: string
          location: string
          name: string
          offer: string
          rating: number
          type: string
        }
        Insert: {
          description: string
          icon: string
          id?: number
          image: string
          location: string
          name: string
          offer: string
          rating: number
          type: string
        }
        Update: {
          description?: string
          icon?: string
          id?: number
          image?: string
          location?: string
          name?: string
          offer?: string
          rating?: number
          type?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_price: number | null
          subscription_start: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_price?: number | null
          subscription_start?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_price?: number | null
          subscription_start?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
