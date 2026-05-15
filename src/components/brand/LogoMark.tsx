// Custom brutalist SVG monograms for Cargobyte.
// Block-C frame with embedded directional chevron — suggests cargo + motion.

export function Monogram({ size = 96, color = "currentColor", accent }: { size?: number; color?: string; accent?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            shapeRendering="crispEdges"
        >
            {/* Block C — three thick slabs */}
            <rect x="8" y="8" width="84" height="18" fill={color} />
            <rect x="8" y="8" width="18" height="84" fill={color} />
            <rect x="8" y="74" width="84" height="18" fill={color} />
            {/* Directional chevron — speaks to cargo + motion */}
            <polygon
                points="42,34 70,50 42,66 42,56 58,50 42,44"
                fill={accent || color}
            />
        </svg>
    );
}

export function Wordmark({ color = "currentColor", accent = "#7dd3fc" }: { color?: string; accent?: string }) {
    return (
        <span className="inline-flex items-baseline font-display tracking-tight" style={{ color }}>
            <span>CARGO</span>
            <span style={{ color: accent, margin: "0 0.06em" }}>▶</span>
            <span>BYTE</span>
        </span>
    );
}

export function Lockup({ color = "currentColor", accent = "#7dd3fc", monoSize = 36 }: { color?: string; accent?: string; monoSize?: number }) {
    return (
        <div className="flex items-center gap-3" style={{ color }}>
            <Monogram size={monoSize} color={color} accent={accent} />
            <div className="leading-none">
                <Wordmark color={color} accent={accent} />
                <div
                    className="mt-1 font-mono tracking-wider"
                    style={{ color, opacity: 0.6, fontSize: monoSize * 0.22 }}
                >
                    FLEET OS · EU
                </div>
            </div>
        </div>
    );
}
