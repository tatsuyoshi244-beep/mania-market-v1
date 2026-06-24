export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "buyer" | "seller" | "admin";
export type PlanKey = "free" | "standard" | "premium";
export type ProductStatus = "active" | "hidden";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";
export type BillingEventType =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_canceled"
  | "payment_succeeded"
  | "payment_failed"
  | "checkout_completed";
export type AdPlacement = "home_banner" | "search_sidebar" | "shop_detail";
export type AnalyticsEventType =
  | "shop_view"
  | "product_view"
  | "favorite_add"
  | "follow_add"
  | "external_click";
export type PartnerApplicationStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "rejected"
  | "published";
export type ShopLifecycleStatus = "draft" | "pending_owner" | "active" | "suspended";

export type Database = {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string;
          key: PlanKey;
          name: string;
          monthly_price: number;
          product_limit: number | null;
          stripe_price_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: PlanKey;
          name: string;
          monthly_price?: number;
          product_limit?: number | null;
          stripe_price_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plans"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          avatar_url: string | null;
          plan_key: PlanKey;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          owner_id: string | null;
          slug: string;
          name: string;
          description: string | null;
          website_url: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          twitter_url: string | null;
          instagram_url: string | null;
          location: string | null;
          is_published: boolean;
          status: ShopLifecycleStatus;
          partner_application_id: string | null;
          pending_owner_email: string | null;
          plan_key: PlanKey;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shops"]["Row"]> & {
          slug: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["shops"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shop_categories_shop_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "shop_categories";
            referencedColumns: ["shop_id"];
          }
        ];
      };
      shop_categories: {
        Row: {
          shop_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          shop_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "shop_categories_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shop_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          shop_id: string;
          seller_id: string;
          name: string;
          description: string | null;
          price_label: string | null;
          external_url: string;
          image_url: string | null;
          category_id: string | null;
          status: ProductStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          shop_id: string;
          seller_id: string;
          name: string;
          external_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "product_tags";
            referencedColumns: ["product_id"];
          }
        ];
      };
      product_tags: {
        Row: {
          product_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          product_id: string;
          tag: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: {
          user_id: string;
          product_id: string | null;
          shop_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          product_id?: string | null;
          shop_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      follows: {
        Row: { user_id: string; shop_id: string; created_at: string };
        Insert: { user_id: string; shop_id: string };
        Update: never;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: AnalyticsEventType;
          user_id: string | null;
          shop_id: string | null;
          product_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          event_type: AnalyticsEventType;
          user_id?: string | null;
          shop_id?: string | null;
          product_id?: string | null;
          metadata?: Json;
        };
        Update: never;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: SubscriptionStatus;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          user_id: string | null;
          subscription_id: string | null;
          event_type: BillingEventType;
          stripe_event_id: string | null;
          amount: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          event_type: BillingEventType;
          user_id?: string | null;
          subscription_id?: string | null;
          stripe_event_id?: string | null;
          amount?: number | null;
          metadata?: Json;
        };
        Update: never;
        Relationships: [];
      };
      ads: {
        Row: {
          id: string;
          title: string;
          image_url: string | null;
          link_url: string;
          placement: AdPlacement;
          is_active: boolean;
          sort_order: number;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          link_url: string;
          image_url?: string | null;
          placement?: AdPlacement;
          is_active?: boolean;
          sort_order?: number;
          starts_at?: string | null;
          ends_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ads"]["Insert"]>;
        Relationships: [];
      };
      partner_applications: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          shop_name: string;
          owner_name: string;
          email: string;
          region: string | null;
          website_url: string | null;
          instagram_url: string | null;
          x_url: string | null;
          description: string | null;
          mission: string | null;
          target_user: string | null;
          categories: string[];
          status: PartnerApplicationStatus;
          review_note: string | null;
          reviewed_at: string | null;
          approved_at: string | null;
          published_at: string | null;
          shop_id: string | null;
          pending_owner_email: string | null;
          ai_score: number | null;
          ai_specialty: number | null;
          ai_originality: number | null;
          ai_passion: number | null;
          ai_safety: number | null;
          ai_recommendation: string | null;
          ai_comment: string | null;
          ai_checked_at: string | null;
        };
        Insert: {
          id?: string;
          shop_name: string;
          owner_name: string;
          email: string;
          region?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          x_url?: string | null;
          description?: string | null;
          mission?: string | null;
          target_user?: string | null;
          categories?: string[];
          status?: PartnerApplicationStatus;
          review_note?: string | null;
          reviewed_at?: string | null;
          approved_at?: string | null;
          published_at?: string | null;
          shop_id?: string | null;
          pending_owner_email?: string | null;
          ai_score?: number | null;
          ai_specialty?: number | null;
          ai_originality?: number | null;
          ai_passion?: number | null;
          ai_safety?: number | null;
          ai_recommendation?: string | null;
          ai_comment?: string | null;
          ai_checked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["partner_applications"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Json;
          ip_hash: string | null;
          user_agent_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          ip_hash?: string | null;
          user_agent_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      rate_limit_events: {
        Row: {
          id: string;
          bucket_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket_key: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["rate_limit_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      sync_product_visibility_for_plan: {
        Args: { target_seller_id: string };
        Returns: null;
      };
      plan_product_limit: {
        Args: { target_plan: PlanKey };
        Returns: number | null;
      };
      user_id_by_email: {
        Args: { target_email: string };
        Returns: string | null;
      };
      claim_pending_shop: {
        Args: { target_shop_id: string };
        Returns: string;
      };
      admin_assign_shop_owner: {
        Args: { target_shop_id: string; target_user_id: string };
        Returns: string;
      };
      consume_rate_limit: {
        Args: { p_bucket_key: string; p_max_count: number; p_window_seconds: number };
        Returns: boolean;
      };
      seller_shop_stats: {
        Args: { target_shop_id: string };
        Returns: Array<{
          follower_count: number;
          shop_favorite_count: number;
          product_favorite_count: number;
          shop_view_count: number;
          product_view_count: number;
          total_view_count: number;
        }>;
      };
      seller_shop_analytics: {
        Args: { target_shop_id: string };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      plan_key: PlanKey;
      product_status: ProductStatus;
      subscription_status: SubscriptionStatus;
      billing_event_type: BillingEventType;
      ad_placement: AdPlacement;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type User = Tables<"users">;
export type Shop = Tables<"shops">;
export type Product = Tables<"products">;
export type Category = Tables<"categories">;
export type Plan = Tables<"plans">;
export type PartnerApplication = Tables<"partner_applications">;

export type ShopWithCategories = Shop & {
  shop_categories: Array<{
    category_id: string;
    categories: Pick<Category, "id" | "slug" | "name"> | null;
  }>;
};

export type ProductWithTags = Product & {
  product_tags: Array<{ tag: string }>;
};

export type ProductWithShop = Product & {
  shops: Pick<Shop, "name" | "slug"> | null;
  product_tags?: Array<{ tag: string }>;
};
