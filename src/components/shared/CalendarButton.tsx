'use client';

import { useState, useRef, useEffect } from 'react';

type CalendarButtonProps = {
  slug: string;
  title: string;
  description: string;
  startDate: string; // ISO string
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
};

/** Format: 20260322T090000 (no separators, no timezone suffix for Google) */
function toGoogleDate(isoDate: string, time: string | null): string {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  if (time) {
    const [h, m] = time.split(':');
    return `${yyyy}${mm}${dd}T${h.padStart(2, '0')}${(m ?? '00').padStart(2, '0')}00`;
  }
  return `${yyyy}${mm}${dd}`;
}

/** Format: 2026-03-22T09:00:00 for Outlook */
function toOutlookDate(isoDate: string, time: string | null): string {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  if (time) {
    const [h, m] = time.split(':');
    return `${yyyy}-${mm}-${dd}T${h.padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}:00`;
  }
  return `${yyyy}-${mm}-${dd}T00:00:00`;
}

export default function CalendarButton({
  slug,
  title,
  description,
  startDate,
  endDate,
  startTime,
  endTime,
  location,
}: CalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const eventUrl = `https://www.eventosdemarketing.com.br/evento/${slug}`;
  const footer = `\n\n---\n\u{1F517} Saiba mais sobre este evento:\n${eventUrl}\n\n\u{1F4C5} Encontre mais eventos de marketing em:\nhttps://www.eventosdemarketing.com.br`;
  const desc = description.slice(0, 500) + footer;

  // Compute effective end date/time
  const effectiveEndDate = endDate ?? startDate;
  const effectiveEndTime = endTime ?? (startTime ? null : null);

  // Google Calendar
  const gStart = toGoogleDate(startDate, startTime);
  const gEnd = effectiveEndTime
    ? toGoogleDate(effectiveEndDate, effectiveEndTime)
    : startTime
      ? toGoogleDate(effectiveEndDate, startTime) // same as start if no end time
      : toGoogleDate(effectiveEndDate, null);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${gStart}/${gEnd}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}&sf=true`;

  // Outlook
  const oStart = toOutlookDate(startDate, startTime);
  const oEnd = effectiveEndTime
    ? toOutlookDate(effectiveEndDate, effectiveEndTime)
    : startTime
      ? toOutlookDate(effectiveEndDate, startTime)
      : toOutlookDate(effectiveEndDate, null);

  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${oStart}&enddt=${oEnd}&body=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;

  // .ics download
  const icsUrl = `/api/events/${slug}/calendar`;

  const options = [
    {
      label: 'Google Calendar',
      href: googleUrl,
      external: true,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24v-5.684h12.632V24H5.684zM18.316 5.684V0H5.684v5.684h12.632zM5.684 18.316H0V5.684h5.684v12.632zM7.579 14.105l-1.263-1.01 1.684-2.105L6.316 9.58l1.263-.947L9.474 11.2l1.894-2.568 1.264.947L10.737 11.99l1.895 2.41-1.264.948-1.894-2.569-1.895 2.326z" />
        </svg>
      ),
    },
    {
      label: 'Outlook',
      href: outlookUrl,
      external: true,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 7.875v8.4a1.47 1.47 0 0 1-.9 1.35 1.2 1.2 0 0 1-.6.15h-8.55a.23.23 0 0 1-.075-.15V7.65l.225.075L23.1 6.6a1.47 1.47 0 0 1 .9 1.275zM14.1 5.025v1.65l-1.35.525a.15.15 0 0 1-.075 0L0 2.1a1.5 1.5 0 0 1 .975-.975h12.15a1.5 1.5 0 0 1 .975.975v2.925zm0 2.625v10.125a.23.23 0 0 1-.075.15 1.47 1.47 0 0 1-.9.45H0V4.05l14.1 3.6zM9 9a2.58 2.58 0 0 0-2.175 1.125 4.65 4.65 0 0 0-.825 2.775A4.2 4.2 0 0 0 6.75 15.6 2.4 2.4 0 0 0 8.85 16.8 2.58 2.58 0 0 0 11.1 15.6a4.95 4.95 0 0 0 .75-2.7 4.35 4.35 0 0 0-.675-2.7A2.4 2.4 0 0 0 9 9zm-.225 1.35a1.2 1.2 0 0 1 1.125.825 4.35 4.35 0 0 1 .375 1.8 4.65 4.65 0 0 1-.375 1.95 1.2 1.2 0 0 1-1.125.825 1.275 1.275 0 0 1-1.125-.825A4.35 4.35 0 0 1 7.2 13.05a4.5 4.5 0 0 1 .45-1.875 1.2 1.2 0 0 1 1.125-.825z" />
        </svg>
      ),
    },
    {
      label: 'Baixar .ics',
      href: icsUrl,
      external: false,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border border-gray-200 px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
        Adicionar ao Calendario
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-[var(--radius-card)] border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              {...(opt.external ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              {opt.icon}
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
