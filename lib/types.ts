// Shared shapes for the campaign / payout flow, used by both the admin
// panel and the creator dashboard.

export type Platform = "instagram" | "tiktok";
export type CampaignStatus = "open" | "closed";
export type SubmissionStatus = "pending" | "verified" | "rejected";

export type Campaign = {
  id: string;
  title: string;
  brand_name: string;
  brand_logo: string | null; // storage path
  brand_logo_url?: string | null; // resolved public URL
  platform: Platform;
  brief: string;
  reward_note: string | null;
  status: CampaignStatus;
  created_at: string;
};

export type Claim = {
  id: string;
  campaign_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  claim_id: string;
  campaign_id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  video_url: string;
  analytics_path: string;
  analytics_url?: string | null; // resolved signed URL
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: SubmissionStatus;
  reject_reason: string | null;
  payout_amount: number | null;
  payout_proof: string | null;
  payout_proof_url?: string | null; // resolved signed URL
  reviewed_at: string | null;
  created_at: string;
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

export function formatRupiah(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
