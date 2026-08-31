// Push notification config. Hardcoded at the user's request (no env var access on the current
// host) instead of read from process.env.VAPID_*/CRON_SECRET. This repo is public, so treat
// these as low-sensitivity: they only sign/gate push notifications, not the database.
export const VAPID_PUBLIC_KEY = "BOXYxE_Pat2udS1AdTeirklIE2VLhCuhRpujBW2AUY93R-Mq4a_AjxvGhdHFEZHOTvdScHx9pZSu2IGxMpZ0Jhs";
export const VAPID_PRIVATE_KEY = "7_wS75Js24FhmeenLu4Ya0L4VPWLU3LLcPEfjiXmkQA";
export const VAPID_SUBJECT = "mailto:mohamedehab567t@gmail.com";
export const CRON_SECRET = "e18095247d8aa41575450743f38893763cb8d355208b978cefb82f4869863cdd";
