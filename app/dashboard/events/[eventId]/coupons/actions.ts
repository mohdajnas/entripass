"use server";

import { createClient } from "@/utils/supabase/server";

export interface CouponInput {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_uses: number | null;
  expires_at: string | null;
}

export async function createCoupon(eventId: string, coupon: CouponInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      event_id: eventId,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      expires_at: coupon.expires_at,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating coupon:", error);
    return { success: false, error: error.message };
  }

  return { success: true, coupon: data };
}

export async function updateCoupon(couponId: string, coupon: Partial<CouponInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("coupons")
    .update({
      ...coupon,
    })
    .eq("id", couponId);

  if (error) {
    console.error("Error updating coupon:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCoupon(couponId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);

  if (error) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
