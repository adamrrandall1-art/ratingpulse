export interface FunnelBusiness {
  id: string;
  name: string;
  placeId: string | null;
  googleReviewUrl: string | null;
  address: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

export interface FunnelInvite {
  id?: string;
  token?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  service_type?: string | null;
  business?: FunnelBusiness;
  destinationUrl?: string | null;
  [key: string]: any;
}

export interface FunnelSettings {
  place_id?: string | null;
  google_review_url?: string | null;
  business_name?: string | null;
  [key: string]: any;
}

export interface FunnelData {
  destinationUrl: string | null;
  business: FunnelBusiness;
  invite: FunnelInvite | null;
  settings?: FunnelSettings | null;
  placeId?: string | null;
}
