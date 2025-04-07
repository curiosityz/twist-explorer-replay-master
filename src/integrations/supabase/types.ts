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
      blockchain_transactions: {
        Row: {
          chain: string
          created_at: string
          decoded_json: Json | null
          id: string
          processed: boolean | null
          raw_hex: string | null
          txid: string
        }
        Insert: {
          chain: string
          created_at?: string
          decoded_json?: Json | null
          id?: string
          processed?: boolean | null
          raw_hex?: string | null
          txid: string
        }
        Update: {
          chain?: string
          created_at?: string
          decoded_json?: Json | null
          id?: string
          processed?: boolean | null
          raw_hex?: string | null
          txid?: string
        }
        Relationships: []
      }
      private_key_fragments: {
        Row: {
          combined_fragments: string | null
          completed: boolean | null
          created_at: string
          id: string
          modulo_values: Json
          public_key_hex: string
          updated_at: string
        }
        Insert: {
          combined_fragments?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          modulo_values: Json
          public_key_hex: string
          updated_at?: string
        }
        Update: {
          combined_fragments?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          modulo_values?: Json
          public_key_hex?: string
          updated_at?: string
        }
        Relationships: []
      }
      vulnerability_analyses: {
        Row: {
          created_at: string
          id: string
          message: string | null
          prime_factors: Json | null
          private_key_modulo: Json | null
          public_key: Json
          recovered_private_key: string | null
          signature: Json | null
          status: string
          twist_order: string | null
          txid: string
          updated_at: string
          vulnerability_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          prime_factors?: Json | null
          private_key_modulo?: Json | null
          public_key: Json
          recovered_private_key?: string | null
          signature?: Json | null
          status: string
          twist_order?: string | null
          txid: string
          updated_at?: string
          vulnerability_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          prime_factors?: Json | null
          private_key_modulo?: Json | null
          public_key?: Json
          recovered_private_key?: string | null
          signature?: Json | null
          status?: string
          twist_order?: string | null
          txid?: string
          updated_at?: string
          vulnerability_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vulnerability_analyses_txid_fkey"
            columns: ["txid"]
            isOneToOne: false
            referencedRelation: "blockchain_transactions"
            referencedColumns: ["txid"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
