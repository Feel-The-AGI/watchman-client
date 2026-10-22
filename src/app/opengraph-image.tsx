import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Watchman. Rotating shifts, leave, and commitments.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const inter = await readFile(join(process.cwd(), 'src/app/fonts/Inter-Regular.ttf'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0A0A0B',
          padding: '80px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 28,
              background: '#10B981',
              color: '#0A0A0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              marginRight: 32,
            }}
          >
            W
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 84, color: '#FAFAFA', lineHeight: 1 }}>Watchman</div>
            <div style={{ fontSize: 32, color: '#2563EB', marginTop: 12 }}>Time under control</div>
          </div>
        </div>
        <div style={{ marginTop: 56, fontSize: 36, color: '#A1A1AA' }}>
          Rotating shifts, leave, and commitments.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: inter,
          style: 'normal',
          weight: 400,
        },
      ],
    },
  )
}
