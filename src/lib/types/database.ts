export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'owner' | 'cashier';
export type DrugClass = 'bebas' | 'bebas_terbatas' | 'keras' | 'psikotropika' | 'narkotika' | 'alkes' | 'suplemen';
export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'opname' | 'void';
export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit';
export type PurchasePaymentMethod = 'cash' | 'transfer' | 'giro';
export type SaleStatus = 'completed' | 'voided';
export type ShiftStatus = 'open' | 'closed';
export type PurchaseStatus = 'draft' | 'received' | 'partial' | 'paid' | 'cancelled';
export type CashFlowType = 'income' | 'expense';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          name: string;
          type: CashFlowType;
          is_system: boolean;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type?: CashFlowType;
          is_system?: boolean;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: CashFlowType;
          is_system?: boolean;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          generic_name: string | null;
          active_ingredients: string | null;
          sku: string | null;
          barcode: string | null;
          category_id: string | null;
          dosage_form: string | null;
          manufacturer: string | null;
          drug_class: DrugClass;
          shelf_location: string | null;
          stock_minimum: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          generic_name?: string | null;
          active_ingredients?: string | null;
          sku?: string | null;
          barcode?: string | null;
          category_id?: string | null;
          dosage_form?: string | null;
          manufacturer?: string | null;
          drug_class?: DrugClass;
          shelf_location?: string | null;
          stock_minimum?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          generic_name?: string | null;
          active_ingredients?: string | null;
          sku?: string | null;
          barcode?: string | null;
          category_id?: string | null;
          dosage_form?: string | null;
          manufacturer?: string | null;
          drug_class?: DrugClass;
          shelf_location?: string | null;
          stock_minimum?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_units: {
        Row: {
          id: string;
          product_id: string;
          unit_name: string;
          conversion_factor: number;
          sell_price: number;
          is_default: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          unit_name: string;
          conversion_factor?: number;
          sell_price?: number;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          unit_name?: string;
          conversion_factor?: number;
          sell_price?: number;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_units_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_batches: {
        Row: {
          id: string;
          product_id: string;
          batch_number: string;
          expiry_date: string;
          buy_price: number;
          current_stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          batch_number: string;
          expiry_date: string;
          buy_price?: number;
          current_stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          batch_number?: string;
          expiry_date?: string;
          buy_price?: number;
          current_stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string;
          batch_id: string | null;
          movement_type: MovementType;
          quantity: number;
          stock_before: number;
          stock_after: number;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          batch_id?: string | null;
          movement_type: MovementType;
          quantity: number;
          stock_before: number;
          stock_after: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          batch_id?: string | null;
          movement_type?: MovementType;
          quantity?: number;
          stock_before?: number;
          stock_after?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          performed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "product_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_performed_by_fkey";
            columns: ["performed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          payment_terms_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          payment_terms_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          payment_terms_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          purchase_number: string;
          supplier_id: string;
          purchase_date: string;
          due_date: string | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          paid_amount: number;
          status: PurchaseStatus;
          invoice_number: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_number: string;
          supplier_id: string;
          purchase_date?: string;
          due_date?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          status?: PurchaseStatus;
          invoice_number?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          purchase_number?: string;
          supplier_id?: string;
          purchase_date?: string;
          due_date?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          paid_amount?: number;
          status?: PurchaseStatus;
          invoice_number?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      purchase_items: {
        Row: {
          id: string;
          purchase_id: string;
          product_id: string;
          product_unit_id: string | null;
          batch_id: string | null;
          batch_number: string;
          expiry_date: string;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_id: string;
          product_id: string;
          product_unit_id?: string | null;
          batch_id?: string | null;
          batch_number: string;
          expiry_date: string;
          quantity: number;
          unit_price: number;
          discount_amount?: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          purchase_id?: string;
          product_id?: string;
          product_unit_id?: string | null;
          batch_id?: string | null;
          batch_number?: string;
          expiry_date?: string;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_items_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "product_batches";
            referencedColumns: ["id"];
          }
        ];
      };
      purchase_payments: {
        Row: {
          id: string;
          purchase_id: string;
          amount: number;
          payment_method: PurchasePaymentMethod;
          notes: string | null;
          payment_date: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_id: string;
          amount: number;
          payment_method?: PurchasePaymentMethod;
          notes?: string | null;
          payment_date?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          purchase_id?: string;
          amount?: number;
          payment_method?: PurchasePaymentMethod;
          notes?: string | null;
          payment_date?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_payments_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchase_payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      shifts: {
        Row: {
          id: string;
          cashier_id: string;
          opening_cash: number;
          closing_cash: number | null;
          system_cash: number | null;
          difference: number | null;
          status: ShiftStatus;
          opened_at: string;
          closed_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          cashier_id: string;
          opening_cash?: number;
          closing_cash?: number | null;
          system_cash?: number | null;
          difference?: number | null;
          status?: ShiftStatus;
          opened_at?: string;
          closed_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          cashier_id?: string;
          opening_cash?: number;
          closing_cash?: number | null;
          system_cash?: number | null;
          difference?: number | null;
          status?: ShiftStatus;
          opened_at?: string;
          closed_at?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shifts_cashier_id_fkey";
            columns: ["cashier_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          id: string;
          sale_number: string;
          shift_id: string | null;
          cashier_id: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          status: SaleStatus;
          prescription_doctor: string | null;
          prescription_number: string | null;
          notes: string | null;
          voided_by: string | null;
          void_reason: string | null;
          voided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_number: string;
          shift_id?: string | null;
          cashier_id: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: SaleStatus;
          prescription_doctor?: string | null;
          prescription_number?: string | null;
          notes?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_number?: string;
          shift_id?: string | null;
          cashier_id?: string;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: SaleStatus;
          prescription_doctor?: string | null;
          prescription_number?: string | null;
          notes?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_cashier_id_fkey";
            columns: ["cashier_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_voided_by_fkey";
            columns: ["voided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_shift_id_fkey";
            columns: ["shift_id"];
            isOneToOne: false;
            referencedRelation: "shifts";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          product_unit_id: string | null;
          batch_id: string;
          product_name_snapshot: string;
          unit_name_snapshot: string;
          quantity: number;
          quantity_base: number;
          unit_price: number;
          discount_amount: number;
          subtotal: number;
          hpp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          product_unit_id?: string | null;
          batch_id: string;
          product_name_snapshot: string;
          unit_name_snapshot: string;
          quantity: number;
          quantity_base: number;
          unit_price: number;
          discount_amount?: number;
          subtotal: number;
          hpp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          product_unit_id?: string | null;
          batch_id?: string;
          product_name_snapshot?: string;
          unit_name_snapshot?: string;
          quantity?: number;
          quantity_base?: number;
          unit_price?: number;
          discount_amount?: number;
          subtotal?: number;
          hpp?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "product_batches";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_payments: {
        Row: {
          id: string;
          sale_id: string;
          amount: number;
          payment_method: PaymentMethod;
          change_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          amount: number;
          payment_method?: PaymentMethod;
          change_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          amount?: number;
          payment_method?: PaymentMethod;
          change_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          }
        ];
      };
      held_sales: {
        Row: {
          id: string;
          cashier_id: string;
          label: string;
          cart_data: Json;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          cashier_id: string;
          label?: string;
          cart_data: Json;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          cashier_id?: string;
          label?: string;
          cart_data?: Json;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "held_sales_cashier_id_fkey";
            columns: ["cashier_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      cash_transactions: {
        Row: {
          id: string;
          type: CashFlowType;
          expense_category_id: string | null;
          amount: number;
          description: string;
          transaction_date: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: CashFlowType;
          expense_category_id?: string | null;
          amount: number;
          description: string;
          transaction_date?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: CashFlowType;
          expense_category_id?: string | null;
          amount?: number;
          description?: string;
          transaction_date?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cash_transactions_expense_category_id_fkey";
            columns: ["expense_category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_transactions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      v_batches_cashier: {
        Row: {
          id: string;
          product_id: string;
          batch_number: string;
          expiry_date: string;
          current_stock: number;
          is_active: boolean;
          created_at: string;
        };
        Relationships: [];
      };
      v_products_with_stock: {
        Row: {
          id: string;
          name: string;
          generic_name: string | null;
          active_ingredients: string | null;
          sku: string | null;
          barcode: string | null;
          category_id: string | null;
          dosage_form: string | null;
          manufacturer: string | null;
          drug_class: DrugClass;
          shelf_location: string | null;
          stock_minimum: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          total_stock: number;
          nearest_expiry: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      generate_sale_number: {
        Args: { sale_date?: string };
        Returns: string;
      };
      generate_purchase_number: {
        Args: { purchase_date?: string };
        Returns: string;
      };
      checkout_sale: {
        Args: {
          p_shift_id: string;
          p_cashier_id: string;
          p_items: {
            product_id: string;
            product_unit_id: string;
            quantity: number;
            unit_price: number;
            discount_amount: number;
            product_name: string;
            unit_name: string;
            conversion_factor: number;
          }[];
          p_payments: {
            payment_method: PaymentMethod;
            amount: number;
            change_amount: number;
          }[];
          p_discount_amount?: number;
          p_tax_amount?: number;
          p_prescription_doctor?: string | null;
          p_prescription_number?: string | null;
          p_notes?: string | null;
        };
        Returns: string;
      };
      void_sale: {
        Args: {
          p_sale_id: string;
          p_voided_by: string;
          p_reason: string;
        };
        Returns: boolean;
      };
      stock_adjustment: {
        Args: {
          p_product_id: string;
          p_batch_id: string;
          p_new_quantity: number;
          p_reason: string;
          p_performed_by: string;
        };
        Returns: boolean;
      };
      stock_opname: {
        Args: {
          p_items: {
            product_id: string;
            batch_id: string;
            physical_count: number;
          }[];
          p_performed_by: string;
          p_notes?: string | null;
        };
        Returns: number;
      };
      receive_purchase: {
        Args: {
          p_purchase_id: string;
          p_items: {
            product_id: string;
            product_unit_id: string;
            batch_number: string;
            expiry_date: string;
            quantity: number;
            conversion_factor: number;
            unit_price: number;
            buy_price_base: number;
          }[];
          p_received_by: string;
        };
        Returns: boolean;
      };
      close_shift: {
        Args: {
          p_shift_id: string;
          p_closing_cash: number;
          p_notes?: string | null;
        };
        Returns: {
          system_cash: number;
          difference: number;
        }[];
      };
      get_product_stock: {
        Args: { p_product_id: string };
        Returns: {
          total_stock: number;
          batch_count: number;
          nearest_expiry: string | null;
          has_expiring_soon: boolean;
        }[];
      };
    };
  };
}
