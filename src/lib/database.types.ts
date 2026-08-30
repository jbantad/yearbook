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
      block_people: {
        Row: {
          block_id: string
          person_id: string
        }
        Insert: {
          block_id: string
          person_id: string
        }
        Update: {
          block_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_people_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "block_people_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "movie_shelf"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "block_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          captured_at: string
          created_at: string
          data: Json
          id: string
          lat: number | null
          layout: Json
          lng: number | null
          movie_id: string | null
          page_id: string | null
          place_id: string | null
          quest_id: string | null
          starred: boolean
          type: Database["public"]["Enums"]["block_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          data?: Json
          id?: string
          lat?: number | null
          layout?: Json
          lng?: number | null
          movie_id?: string | null
          page_id?: string | null
          place_id?: string | null
          quest_id?: string | null
          starred?: boolean
          type: Database["public"]["Enums"]["block_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          data?: Json
          id?: string
          lat?: number | null
          layout?: Json
          lng?: number | null
          movie_id?: string | null
          page_id?: string | null
          place_id?: string | null
          quest_id?: string | null
          starred?: boolean
          type?: Database["public"]["Enums"]["block_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movie_shelf"
            referencedColumns: ["movie_id"]
          },
          {
            foreignKeyName: "blocks_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_visits"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "blocks_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          rule: Json
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          rule?: Json
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          rule?: Json
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      day_summaries: {
        Row: {
          block_count: number
          cover_media_id: string | null
          dominant_color: string | null
          mood: string | null
          photo_count: number
          summary_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_count?: number
          cover_media_id?: string | null
          dominant_color?: string | null
          mood?: string | null
          photo_count?: number
          summary_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_count?: number
          cover_media_id?: string | null
          dominant_color?: string | null
          mood?: string | null
          photo_count?: number
          summary_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_summaries_cover_media_id_fkey"
            columns: ["cover_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      earned_stickers: {
        Row: {
          earned_at: string
          id: string
          layout: Json
          page_id: string | null
          quest_id: string | null
          sticker_id: string
          user_id: string
        }
        Insert: {
          earned_at?: string
          id?: string
          layout?: Json
          page_id?: string | null
          quest_id?: string | null
          sticker_id: string
          user_id: string
        }
        Update: {
          earned_at?: string
          id?: string
          layout?: Json
          page_id?: string | null
          quest_id?: string | null
          sticker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earned_stickers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earned_stickers_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earned_stickers_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          block_id: string | null
          created_at: string
          dominant_color: string | null
          height: number | null
          id: string
          sort_order: number
          storage_path: string
          taken_at: string | null
          thumb_path: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          dominant_color?: string | null
          height?: number | null
          id?: string
          sort_order?: number
          storage_path: string
          taken_at?: string | null
          thumb_path?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          block_id?: string | null
          created_at?: string
          dominant_color?: string | null
          height?: number | null
          id?: string
          sort_order?: number
          storage_path?: string
          taken_at?: string | null
          thumb_path?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "movie_shelf"
            referencedColumns: ["block_id"]
          },
        ]
      }
      movies: {
        Row: {
          created_at: string
          genres: string[] | null
          id: string
          poster_path: string | null
          rating: number | null
          release_year: number | null
          runtime_min: number | null
          title: string
          tmdb_id: number | null
        }
        Insert: {
          created_at?: string
          genres?: string[] | null
          id?: string
          poster_path?: string | null
          rating?: number | null
          release_year?: number | null
          runtime_min?: number | null
          title: string
          tmdb_id?: number | null
        }
        Update: {
          created_at?: string
          genres?: string[] | null
          id?: string
          poster_path?: string | null
          rating?: number | null
          release_year?: number | null
          runtime_min?: number | null
          title?: string
          tmdb_id?: number | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          ends_on: string | null
          id: string
          kind: Database["public"]["Enums"]["page_kind"]
          locked: boolean
          page_date: string
          page_number: number | null
          template: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["page_kind"]
          locked?: boolean
          page_date: string
          page_number?: number | null
          template?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["page_kind"]
          locked?: boolean
          page_date?: string
          page_number?: number | null
          template?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name: string
          id?: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          address: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          provider_id: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          provider_id?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          provider_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quest_items: {
        Row: {
          block_id: string | null
          completed_at: string | null
          id: string
          label: string
          quest_id: string
          sort_order: number
        }
        Insert: {
          block_id?: string | null
          completed_at?: string | null
          id?: string
          label: string
          quest_id: string
          sort_order?: number
        }
        Update: {
          block_id?: string | null
          completed_at?: string | null
          id?: string
          label?: string
          quest_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_items_block_fk"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_items_block_fk"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "movie_shelf"
            referencedColumns: ["block_id"]
          },
          {
            foreignKeyName: "quest_items_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["quest_kind"]
          rule: Json
          started_at: string
          status: Database["public"]["Enums"]["quest_status"]
          sticker_id: string | null
          target: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["quest_kind"]
          rule?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["quest_status"]
          sticker_id?: string | null
          target?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["quest_kind"]
          rule?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["quest_status"]
          sticker_id?: string | null
          target?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
        ]
      }
      stickers: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          palette: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          name: string
          palette?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          palette?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      movie_shelf: {
        Row: {
          block_id: string | null
          captured_at: string | null
          genres: string[] | null
          movie_id: string | null
          page_id: string | null
          poster_path: string | null
          rating: number | null
          release_year: number | null
          rewatch: boolean | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      place_visits: {
        Row: {
          first_visit_at: string | null
          last_visit_at: string | null
          name: string | null
          place_id: string | null
          user_id: string | null
          visit_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_day_summary: {
        Args: { p_date: string; p_user: string }
        Returns: undefined
      }
    }
    Enums: {
      block_type:
        | "photo"
        | "note"
        | "place"
        | "meal"
        | "movie"
        | "person"
        | "voice"
        | "gratitude"
        | "text"
        | "sticker"
        | "journal"
      page_kind: "day" | "event"
      quest_kind: "count" | "checklist"
      quest_status: "active" | "complete" | "abandoned"
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
      block_type: [
        "photo",
        "note",
        "place",
        "meal",
        "movie",
        "person",
        "voice",
        "gratitude",
        "text",
        "sticker",
        "journal",
      ],
      page_kind: ["day", "event"],
      quest_kind: ["count", "checklist"],
      quest_status: ["active", "complete", "abandoned"],
    },
  },
} as const
