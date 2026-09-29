import { ImageResponse } from "next/og";

export const alt = "Sanchay — smart money for everyone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social preview card shown when a Sanchay link is shared.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.85 }}>Sanchay</div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 24, maxWidth: 900 }}>Your money, finally in focus.</div>
        <div style={{ fontSize: 32, marginTop: 32, opacity: 0.85, maxWidth: 950 }}>
          Accounts, bKash, budgets, goals and bills in one place — made for Bangladesh.
        </div>
      </div>
    ),
    size
  );
}
