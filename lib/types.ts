// Shared shapes for the campaign / payout flow, used by both the admin
// panel and the creator dashboard.

export type Platform = "instagram" | "tiktok";
export type CampaignStatus = "open" | "closed";
export type SubmissionStatus = "pending" | "verified" | "rejected";
export type Sector =
  | "fnb"
  | "event-entertainment"
  | "tourism"
  | "retail"
  | "services-lifestyle";

export type Campaign = {
  id: string;
  title: string;
  brand_name: string;
  brand_logo: string | null; // storage path
  brand_logo_url?: string | null; // resolved public URL
  platforms: Platform[];
  sector: Sector;
  brief: string;
  brief_pdf: string | null; // storage path
  brief_pdf_url?: string | null; // resolved public URL
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

export type Gender = "laki-laki" | "perempuan";

export type Niche =
  | "fnb"
  | "fashion-beauty"
  | "travel"
  | "tech-gaming"
  | "edukasi"
  | "hiburan"
  | "olahraga"
  | "lifestyle";

// Filled by the creator on the "Lengkapi Profil" tab, one row per auth user.
export type CreatorProfile = {
  user_id: string;
  user_email: string | null;
  full_name: string;
  instagram: string | null; // username, without the leading @
  tiktok: string | null;    // username, without the leading @
  whatsapp: string;
  age: number;
  gender: Gender;
  niches: Niche[];
  domicile: string;
  avg_views: number;
  avatar_path: string | null; // path inside the public `avatars` bucket
  avatar_seed: string | null; // chosen Voxel Bot variant; null = seeded with the user id
  avatar_url: string;         // resolved by the API: uploaded photo, or the Voxel Bot fallback
  community_joined_at: string | null; // null = still gets the "gabung komunitas" prompt
  created_at: string;
  updated_at: string;
};

// WhatsApp channel every creator is asked to join right after filling in their
// profile. The dashboard keeps prompting until they confirm with "Gabung".
export const COMMUNITY_URL =
  "https://whatsapp.com/channel/0029VbCQ9bxCnA80FBHoFM2y";

// Every creator gets a stable DiceBear "Voxel Bot" until they upload their own
// photo. Seeding keeps the same bot across devices and sessions; the creator can
// swap to another variant by picking a different seed (see avatarSeedFor).
export function voxelAvatar(seed: string): string {
  return `https://api.dicebear.com/10.x/voxel-bot/svg?seed=${encodeURIComponent(seed)}`;
}

// How many bot variants the picker shows at a time.
export const AVATAR_VARIANTS_PER_PAGE = 12;

// Variant seeds are derived from the user id, so every creator sees their own
// set of bots and the choice stays reproducible from the stored seed alone.
export function avatarSeedFor(userId: string, index: number): string {
  return index === 0 ? userId : `${userId}-v${index}`;
}

// Seeds go into a URL and an <img src>, so only this safe charset is accepted.
export function isValidAvatarSeed(seed: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(seed);
}

// The `avatars` bucket is public, so a stored path resolves to a URL with no
// signing. Shared so the browser can show a just-uploaded photo before the
// profile row exists, using the same URL the API will hand back later.
export function avatarPublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
}

// A photo path or a bot seed — the two ways an avatar can be set. Only one is
// ever in effect: choosing a bot clears the photo.
export type AvatarChange = { avatar_path: string } | { avatar_seed: string };

// The one place the avatar precedence lives: uploaded photo, then the chosen
// bot, then a bot seeded with the user id. Used by the profile API and by the
// admin user list.
export function resolveAvatarUrl(
  row: { avatar_path?: string | null; avatar_seed?: string | null } | null,
  userId: string
): string {
  return row?.avatar_path
    ? avatarPublicUrl(row.avatar_path)
    : voxelAvatar(row?.avatar_seed || userId);
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

export const PLATFORMS: Platform[] = ["instagram", "tiktok"];

export const SECTOR_LABEL: Record<Sector, string> = {
  fnb: "F&B",
  "event-entertainment": "Event & Entertainment",
  tourism: "Tourism",
  retail: "Retail",
  "services-lifestyle": "Services & Lifestyle",
};

export const SECTORS: Sector[] = [
  "fnb",
  "event-entertainment",
  "tourism",
  "retail",
  "services-lifestyle",
];

export const GENDER_LABEL: Record<Gender, string> = {
  "laki-laki": "Laki-laki",
  perempuan: "Perempuan",
};

export const GENDERS: Gender[] = ["laki-laki", "perempuan"];

export const NICHE_LABEL: Record<Niche, string> = {
  fnb: "Food & Beverage",
  "fashion-beauty": "Fashion & Beauty",
  travel: "Travel",
  "tech-gaming": "Tech & Gaming",
  edukasi: "Edukasi",
  hiburan: "Hiburan",
  olahraga: "Olahraga",
  lifestyle: "Lifestyle",
};

export const NICHES: Niche[] = [
  "fnb",
  "fashion-beauty",
  "travel",
  "tech-gaming",
  "edukasi",
  "hiburan",
  "olahraga",
  "lifestyle",
];

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
