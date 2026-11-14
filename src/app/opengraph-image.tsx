import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LILSURPRIZ – Little gifts, big surprises.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ffe8f0 0%, #fffdf8 50%, #efe8ff 100%)", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 150 }}>🎁</div>
        <div style={{ display: "flex", fontSize: 110, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: "#f45d92" }}>lil</span>
          <span style={{ color: "#9268f2" }}>surpriz</span>
        </div>
        <div style={{ fontSize: 44, color: "#6b5a70", marginTop: 10 }}>Little gifts, big surprises.</div>
      </div>
    ),
    size
  );
}
