// Simple utility to log telemetry to Google Sheets.
// You will later replace the URL with your Google Apps Script Web App URL.

const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbylCl1lStu_WlYCmNhco2M1zPjCwI6-bAoswx7HsJ97A4Her4OmMrJKQH8dtmpmH3vp/exec";

export async function logTelemetry(eventData) {
  console.log("📊 ANALYTICS LOGGED:", eventData);
  
  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    return; // Just local console logging for now
  }
  
  try {
    fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
  } catch (e) {
    console.error("Failed to send telemetry", e);
  }
}
