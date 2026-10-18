interface JournalSceneProps {
  closed: boolean;
}

export function JournalScene({ closed }: JournalSceneProps) {
  return (
    <div className="cinematic-journal" aria-hidden="true">
      <svg
        className="cinematic-journal__garden"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="journal-ground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#28341b" />
            <stop offset=".45" stopColor="#172312" />
            <stop offset="1" stopColor="#080f0a" />
          </linearGradient>
          <radialGradient id="journal-light" cx=".5" cy=".48" r=".7">
            <stop offset="0" stopColor="#92905c" stopOpacity=".36" />
            <stop offset=".58" stopColor="#45502d" stopOpacity=".16" />
            <stop offset="1" stopColor="#111a10" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="900" fill="url(#journal-ground)" />
        <rect width="1440" height="900" fill="url(#journal-light)" />
        <g fill="none" strokeLinecap="round">
          <path d="M0 900 Q55 744 116 681 M24 900 Q89 766 187 736 M144 900 Q168 765 233 686 M259 900 Q249 783 308 748" stroke="#667248" strokeWidth="9" opacity=".58" />
          <path d="M0 832 Q92 809 144 759 M54 867 Q104 837 178 800 M182 848 Q225 801 292 784 M314 900 Q318 799 393 746" stroke="#a09a62" strokeWidth="4" opacity=".46" />
          <path d="M1440 900 Q1376 744 1323 672 M1419 900 Q1354 777 1268 727 M1297 900 Q1276 778 1204 692 M1182 900 Q1180 798 1119 744" stroke="#667248" strokeWidth="9" opacity=".6" />
          <path d="M1440 839 Q1357 812 1302 754 M1392 872 Q1321 836 1258 794 M1266 856 Q1228 811 1162 782 M1138 900 Q1134 802 1061 748" stroke="#a09a62" strokeWidth="4" opacity=".48" />
          <path d="M125 900 Q208 817 234 754 M286 900 Q352 844 373 775 M1334 900 Q1268 831 1246 765 M1164 900 Q1092 842 1079 779" stroke="#3c5231" strokeWidth="12" opacity=".72" />
          <path d="M100 856 Q153 849 187 811 M238 877 Q290 861 319 826 M1303 860 Q1250 842 1220 805 M1174 875 Q1120 858 1091 823" stroke="#c0aa65" strokeWidth="3" opacity=".38" />
        </g>
        <g fill="#e7d8a8" opacity=".8">
          <ellipse cx="1120" cy="122" rx="42" ry="18" transform="rotate(-24 1120 122)" />
          <ellipse cx="1171" cy="108" rx="39" ry="17" transform="rotate(23 1171 108)" />
          <ellipse cx="1147" cy="76" rx="38" ry="17" transform="rotate(-2 1147 76)" />
          <ellipse cx="1101" cy="87" rx="33" ry="15" transform="rotate(-52 1101 87)" />
          <ellipse cx="1192" cy="80" rx="34" ry="15" transform="rotate(54 1192 80)" />
        </g>
        <circle cx="1148" cy="104" r="15" fill="#c8a449" opacity=".85" />
        <g fill="#d3bc68" opacity=".68">
          <circle cx="101" cy="427" r="5" /><circle cx="127" cy="393" r="4" />
          <circle cx="1312" cy="343" r="5" /><circle cx="1351" cy="389" r="4" />
          <circle cx="247" cy="568" r="4" /><circle cx="1214" cy="564" r="5" />
        </g>
      </svg>

      <div className={`cinematic-journal__book ${closed ? 'cinematic-journal__book--closed' : ''}`}>
        <div className="cinematic-journal__spread">
          <div className="cinematic-journal__page cinematic-journal__page--left">
            <svg className="cinematic-journal__sketch" viewBox="0 0 560 290">
              <g fill="none" stroke="#443b31" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 184 67 145l34 39 48-68 43 68 55-83 55 83 51-52 52 52 48-92 55 92 25-24" strokeWidth="4" />
                <path d="M0 191 Q100 178 177 193 T348 191 T560 188" strokeWidth="3" />
                <path d="M301 190V66h40v124m-50-124 30-30 40 30m-67 0h74M312 105h18m-18 24h18m-18 24h18" strokeWidth="4" />
                <path d="M78 153v-20m-12 20v-17m116 33v-17m63 20v-24m195 6v-27m14 27v-32m78 54v-18" strokeWidth="3" />
                <path d="M332 229 Q356 206 378 227 M372 242 Q405 210 430 238 M45 225 Q71 201 91 225" strokeWidth="3" />
              </g>
              <g fill="#443b31">
                <path d="M39 194h43l-7 12H45zM177 194h43l-7 12h-29zM438 194h44l-7 12h-29z" />
                <circle cx="320" cy="81" r="3" /><circle cx="320" cy="130" r="3" /><circle cx="320" cy="157" r="3" />
              </g>
            </svg>
          </div>
          <div className="cinematic-journal__page cinematic-journal__page--right">
            <p>This is where your story begins.</p>
            <p>I&apos;m sorry I won&apos;t be there to see it. It&apos;s a lot to ask, but I don&apos;t want you to be sad that I&apos;m gone.</p>
            <p>I want you to be amazed that any of us ever had a chance to be here at all.</p>
            <p className="cinematic-journal__signoff">Good luck,</p>
            <p className="cinematic-journal__signature">Edith</p>
            <svg className="cinematic-journal__tower" viewBox="0 0 120 210">
              <path d="M39 194 51 77h20l12 117M45 102h34M48 82l13-31 14 31M51 76h26M56 54V37h10v17M48 194h37M33 194h48M41 111h37M39 133h40M37 156h44M34 179h50" />
              <path d="M27 194h63l-9 9H35zM52 73h18v9H52z" />
              <path d="M48 120h8m18 0h8M46 145h8m20 0h8M44 168h8m24 0h8" />
            </svg>
          </div>
          <span className="cinematic-journal__gutter" />
        </div>
        <div className="cinematic-journal__cover">
          <span className="cinematic-journal__cover-title">Edith<br />Finch</span>
          <span className="cinematic-journal__cover-mark" aria-hidden="true">✳</span>
          <span className="cinematic-journal__cover-caption">A Finch family journal</span>
        </div>
      </div>
    </div>
  );
}
