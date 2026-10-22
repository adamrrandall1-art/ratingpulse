-- Add notification routing columns to profiles and business_settings tables
alter table public.profiles add column if not exists negative_alert_phone text;
alter table public.profiles add column if not exists negative_alert_email text;
alter table public.profiles add column if not exists negative_alerts_enabled boolean default true;
alter table public.profiles add column if not exists negative_email_alert_enabled boolean default true;
alter table public.profiles add column if not exists negative_sms_alert_enabled boolean default true;
alter table public.profiles add column if not exists positive_alert_phone text;
alter table public.profiles add column if not exists positive_alert_email text;
alter table public.profiles add column if not exists positive_alerts_enabled boolean default true;
alter table public.profiles add column if not exists positive_email_alert_enabled boolean default true;
alter table public.profiles add column if not exists positive_sms_alert_enabled boolean default false;
alter table public.profiles add column if not exists notify_positive_phone text;

alter table public.business_settings add column if not exists negative_alert_phone text;
alter table public.business_settings add column if not exists negative_alert_email text;
alter table public.business_settings add column if not exists negative_alerts_enabled boolean default true;
alter table public.business_settings add column if not exists negative_email_alert_enabled boolean default true;
alter table public.business_settings add column if not exists negative_sms_alert_enabled boolean default true;
alter table public.business_settings add column if not exists positive_alert_phone text;
alter table public.business_settings add column if not exists positive_alert_email text;
alter table public.business_settings add column if not exists positive_alerts_enabled boolean default true;
alter table public.business_settings add column if not exists positive_email_alert_enabled boolean default true;
alter table public.business_settings add column if not exists positive_sms_alert_enabled boolean default false;
alter table public.business_settings add column if not exists notify_positive_phone text;
