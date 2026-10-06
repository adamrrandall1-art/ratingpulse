/**
 * Checks if the current time falls within TCPA quiet hours (strictly allows 8:00 AM - 9:00 PM)
 * @param timeZone - IANA timezone string (defaulting to 'America/New_York')
 * @returns { isWithinAllowedWindow: boolean, currentHour: number }
 */
export function checkQuietHours(timeZone: string = 'America/New_York'): {
  isWithinAllowedWindow: boolean;
  currentHour: number;
} {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    });
    const currentHour = parseInt(formatter.format(now), 10);
    // Allowed window: 8 AM (08:00) to 8:59 PM (20:59). Hour 21 (9 PM) and later are quiet hours.
    const isWithinAllowedWindow = currentHour >= 8 && currentHour < 21;
    return { isWithinAllowedWindow, currentHour };
  } catch (e) {
    console.error('[QuietHours Check Error]:', e);
    // Fail-safe: allow during standard daytime if timezone is malformed
    return { isWithinAllowedWindow: true, currentHour: 12 };
  }
}
