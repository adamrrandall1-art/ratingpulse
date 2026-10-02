import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563EB',
          borderRadius: 8,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          style={{ width: '68%', height: '68%' }}
          fill="none"
        >
          <path
            d="M12 3 L10.088 8.813 C9.664 10.098 8.653 11.109 7.368 11.533 L1.555 13.445 L7.368 15.357 C8.653 15.781 9.664 16.792 10.088 18.077 L12 23.89 L13.912 18.077 C14.336 16.792 15.347 15.781 16.632 15.357 L22.445 13.445 L16.632 11.533 C15.347 11.109 14.336 10.098 13.912 8.813 Z"
            fill="#FFFFFF"
          />
          <path
            d="M5 2 V6 M3 4 H7"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M19 18 V22 M17 20 H21"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
