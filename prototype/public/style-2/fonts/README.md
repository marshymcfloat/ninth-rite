# Ninth Rite typography

Downloaded unchanged from the official Google Fonts repository on 31 October 2026. Files remain under their bundled SIL Open Font License 1.1 notices.

| File | Family / weight | Role |
|---|---|---|
| Cinzel-Variable.ttf | Cinzel, 400–900 | Inscription-style headings, multiplier values, major amount displays |
| CinzelDecorative-Bold.ttf | Cinzel Decorative, 700 | Logo only; decorative forms are not used for instructions or small counters |
| SourceSans3-Variable.ttf | Source Sans 3, 200–900 | Interface labels, body copy and compact money displays |

Cinzel's Roman inscription proportions match the carved architectural treatment. Source Sans 3 keeps small controls and explanations legible. Do not track money amounts widely or apply decorative lettering to body copy.

## Sources

- https://github.com/google/fonts/tree/main/ofl/cinzel
- https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf
- https://github.com/google/fonts/tree/main/ofl/cinzeldecorative
- https://raw.githubusercontent.com/google/fonts/main/ofl/cinzeldecorative/CinzelDecorative-Bold.ttf
- https://github.com/google/fonts/tree/main/ofl/sourcesans3
- https://raw.githubusercontent.com/google/fonts/main/ofl/sourcesans3/SourceSans3%5Bwght%5D.ttf

Licenses: `cinzel-OFL.txt`, `cinzeldecorative-OFL.txt`, `sourcesans3-OFL.txt`. No glyphs or font data were modified. CSS aliases `Rite` and `Interface` preserve the existing presentation's family names; they do not rename the font files internally.

Load `typography.css` after the existing scene styles so its family declarations replace the earlier shared fonts. All requests remain local; no Google-hosted font requests occur at runtime.

The three bundled fonts total **834,108 bytes**. Digits, decimal/group separators, multiplication sign, minus, dollar/euro/pound/yen and percent are present in all three families. Cinzel lacks the Philippine peso sign; the CSS stack and `Rite` alias explicitly fall back to Source Sans 3 for that glyph. Source Sans 3 covers the complete tested character set. See `font-audit.json` for files, hashes and glyph coverage.
