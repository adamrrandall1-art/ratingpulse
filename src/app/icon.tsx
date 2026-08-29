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
          background: '#0B0F19',
          borderRadius: 8,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          style={{ width: '85%', height: '85%' }}
          fill="none"
        >
          <path
            d="M22 82V20H54C64 20 72 26 72 37C72 46 66 52 57 54L76 82H58L42 56H38V82H22ZM38 44H52C56 44 60 41 60 37C60 33 56 30 52 30H38V44Z"
            fill="#FFFFFF"
          />
          <path
            d="M26 48L44 66L84 22L75 14L44 48L34 38L26 48Z"
            fill="#22C55E"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
