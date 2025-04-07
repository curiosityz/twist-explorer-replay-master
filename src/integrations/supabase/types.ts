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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
