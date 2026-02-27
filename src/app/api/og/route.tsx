import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "60px 80px",
          background: "#0a0a0f",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid dots */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Green glow */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "30%",
            width: "40%",
            height: "60%",
            background:
              "radial-gradient(ellipse, rgba(0,255,136,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#00ff88",
              boxShadow: "0 0 12px #00ff88, 0 0 24px rgba(0,255,136,0.3)",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              letterSpacing: "4px",
              color: "rgba(0,255,136,0.7)",
              textTransform: "uppercase",
            }}
          >
            Live Tracking
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "72px", fontWeight: 800, color: "#00ff88", lineHeight: 1 }}>
            Factory Floor
          </span>
          <span style={{ fontSize: "36px", fontWeight: 400, color: "rgba(232,232,237,0.6)", lineHeight: 1.3 }}>
            Autonomous Software Factories
          </span>
        </div>
        <span
          style={{
            marginTop: "32px",
            fontSize: "22px",
            color: "rgba(232,232,237,0.4)",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          AI agents that build and sell real products people pay for. Not speculation. Real revenue.
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
