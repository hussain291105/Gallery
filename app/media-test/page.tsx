
export default function MediaTestPage() {
  const mediaBaseUrl =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

  if (!mediaBaseUrl) {
    return <p>Media URL is not configured.</p>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Gallery Storage Test</h1>

      <img
        src={`${mediaBaseUrl}/images/test.jpg`}
        alt="Gallery test image"
        style={{
          width: "100%",
          maxWidth: 500,
          height: "auto",
        }}
      />
    </main>
  );
}
