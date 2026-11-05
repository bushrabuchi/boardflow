import { ValidatorFn } from '@angular/forms';

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const validMeetingTimeRange: ValidatorFn = (form) => {
  const start = form.get('startTime')?.value;
  const end = form.get('endTime')?.value;

  // Individual controls handle missing or malformed values.
  if (
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    !TIME_PATTERN.test(start) ||
    !TIME_PATTERN.test(end)
  ) {
    return null;
  }

  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return toMinutes(end) > toMinutes(start) ? null : { invalidTimeRange: true };
};
