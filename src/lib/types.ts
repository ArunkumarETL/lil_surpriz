export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  storage_path: string | null;
  is_main: boolean;
  sort_order: number;
};

export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type Availability = "in_stock" | "out_of_stock" | "preorder";

export type Product = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description: string;
  category_id: string | null;
  regular_price: number;
  discount_price: number | null;
  stock: number;
  features: string[];
  items_included: string[];
  size: string | null;
  weight: string | null;
  availability: Availability;
  is_featured: boolean;
  is_new_arrival: boolean;
  allow_customisation: boolean;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  categories?: Pick<Category, "id" | "name" | "slug"> | null;
};

export type StoreSettings = {
  id: number;
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  pinterest_url: string | null;
  shipping_charge: number;
  free_shipping_threshold: number;
  announcement: string | null;
  announcement_enabled: boolean;
  custom_box_base_price: number;
  box_colours: string[];
  occasions: string[];
};

export const ORDER_STATUSES = ["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string | null;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: ShippingAddress;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  status: OrderStatus;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  cashfree_order_id: string | null;
  cf_order_id: string | null;
  cf_payment_id: string | null;
  paid_amount: number | null;
  paid_at: string | null;
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  cancel_reason: string | null;
  custom_enquiry_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  customisation: Record<string, unknown> | null;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

export type CustomEnquiry = {
  id: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  recipient_name: string | null;
  occasion: string | null;
  box_colour: string | null;
  personal_message: string | null;
  special_instructions: string | null;
  items: { product_id: string; name: string; quantity: number; unit_price: number }[];
  estimated_total: number;
  channel: "whatsapp" | "online";
  status: "new" | "contacted" | "converted" | "closed";
  order_id: string | null;
  admin_notes: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
};
