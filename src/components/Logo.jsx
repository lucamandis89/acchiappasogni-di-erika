function Logo({ compact = false }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '8px' : '11px',
      }}
    >
      <svg
        width={compact ? 42 : 52}
        height={compact ? 42 : 52}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="24"
          r="17"
          stroke="var(--terracotta)"
          strokeWidth="2.2"
        />

        <path
          d="M19 14C25 21 39 21 45 14M16 24C24 29 40 29 48 24M19 34C25 28 39 28 45 34"
          stroke="var(--petal)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        <path
          d="M32 7V41M15 24H49M20 12L44 36M44 12L20 36"
          stroke="var(--gold)"
          strokeWidth="1"
          opacity="0.8"
        />

        <path
          d="M23 39C23 46 20 50 17 55"
          stroke="var(--terracotta)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M32 41V58"
          stroke="var(--terracotta)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M41 39C41 46 44 50 47 55"
          stroke="var(--terracotta)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M14 53C19 51 21 54 17 59C14 57 13 55 14 53Z"
          fill="var(--petal)"
        />
        <path
          d="M29 55C34 52 36 56 32 62C29 60 28 57 29 55Z"
          fill="var(--sage)"
        />
        <path
          d="M45 52C50 51 51 55 47 59C44 57 43 54 45 52Z"
          fill="var(--gold)"
        />
      </svg>

      <div>
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: 'var(--terracotta)',
            fontSize: compact ? '19px' : '23px',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Gli Acchiapasogni di Ery
        </div>

        {!compact && (
          <div
            style={{
              marginTop: '4px',
              fontSize: '9px',
              letterSpacing: '1.3px',
              textTransform: 'uppercase',
              color: 'var(--sage)',
            }}
          >
            Acchiappasogni ERY · personalizzati
          </div>
        )}
      </div>
    </div>
  )
}

export default Logo