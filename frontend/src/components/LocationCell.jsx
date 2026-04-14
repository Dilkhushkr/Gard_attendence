export default function LocationCell({ location, fallbackLabel }) {
  if (!location) return "-";

  const fromServer = location.label && String(location.label).trim();
  const fromLookup =
    typeof fallbackLabel === "string" && fallbackLabel.trim() ? fallbackLabel.trim() : "";
  const text = fromServer || fromLookup;
  const stillLoading = !text && fallbackLabel === undefined;

  return (
    <div className="flex flex-col gap-0.5">
      <span>
        {text || (stillLoading ? "Resolving..." : "Exact address unavailable")}
      </span>
      {location.mapUrl ? (
        <a
          href={location.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-xs font-medium w-fit"
        >
          Open in Google Maps
        </a>
      ) : null}
    </div>
  );
}
