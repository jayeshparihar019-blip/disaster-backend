import axios from 'axios';

const {
  FAST2SMS_API_KEY,
  SMS_MODE,
  NDRF_ALERT_PHONE,
  FIRE_ALERT_PHONE,
} = process.env;

// ─── Determine active mode ────────────────────────────────────────────────────
// Real SMS only when FAST2SMS_API_KEY is set AND SMS_MODE is "fast2sms"
const isLive =
  SMS_MODE === 'fast2sms' &&
  FAST2SMS_API_KEY &&
  FAST2SMS_API_KEY !== 'your_fast2sms_api_key';

// ─── Core send helper ─────────────────────────────────────────────────────────
const sendSMS = async (phoneNumber, message) => {
  // Strip country code if present; Fast2SMS accepts 10-digit numbers
  const digits = String(phoneNumber).replace(/\D/g, '').replace(/^91/, '');

  if (!isLive) {
    // ── DEMO MODE: log to console ────────────────────────────────────────────
    console.log(`\n[SMS DEMO MODE]`);
    console.log(`To      : +91${digits}`);
    console.log(`Message :\n${message}\n`);
    return { status: 'demo', to: digits };
  }

  // ── LIVE MODE: call Fast2SMS API ─────────────────────────────────────────
  const response = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route: 'q',
      message,
      language: 'english',
      numbers: digits,
    },
    {
      headers: {
        authorization: FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    }
  );

  console.log(`[SMS SENT] To: +91${digits} | Response: ${JSON.stringify(response.data)}`);
  return response.data;
};

// ─── 1. Citizen Confirmation SMS ─────────────────────────────────────────────
export const sendConfirmationSMS = async (phoneNumber, reportId) => {
  const message =
    `Disaster Report Received\n\n` +
    `Your report has been successfully submitted to the National Disaster Response System.\n\n` +
    `Report ID: ${reportId}\n\n` +
    `Authorities (NDRF / Fire Department) will review your report soon.\n\n` +
    `Emergency contacts:\n` +
    `Police: 100 | Fire: 101 | Ambulance: 108\n\n` +
    `Thank you for helping keep the community safe.\n` +
    `— Disaster Intelligence Platform`;

  try {
    const result = await sendSMS(phoneNumber, message);
    return { sent: true, mode: isLive ? 'fast2sms' : 'demo', result };
  } catch (err) {
    console.error('[SMS] Citizen confirmation failed:', err.message);
    return { sent: false, error: err.message };
  }
};

// ─── 2. Authority Alert SMS (HIGH / CRITICAL reports) ────────────────────────
export const sendAuthorityAlertSMS = async ({
  reportId, disasterType, location, severity, aiPriorityLabel,
}) => {
  const message =
    `New Disaster Report - ${aiPriorityLabel} PRIORITY\n\n` +
    `Type     : ${disasterType}\n` +
    `Location : ${location}\n` +
    `Severity : ${severity}\n\n` +
    `Report ID: ${reportId}\n\n` +
    `Log in to the dashboard to review and act immediately.\n` +
    `— Disaster Intelligence Platform`;

  const targets = [];
  if (NDRF_ALERT_PHONE) targets.push({ label: 'NDRF', phone: NDRF_ALERT_PHONE });
  if (FIRE_ALERT_PHONE) targets.push({ label: 'Fire Dept', phone: FIRE_ALERT_PHONE });

  const results = [];

  for (const { label, phone } of targets) {
    try {
      const result = await sendSMS(phone, message);
      results.push({ to: label, status: 'sent', result });
    } catch (err) {
      console.error(`[SMS] ${label} alert failed:`, err.message);
      results.push({ to: label, status: 'failed', error: err.message });
    }
  }

  return results;
};
