
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buildPeopleGroups,
  getStoredFaces,
  scanPhotoForFaces,
  type GalleryFacePhoto,
  type PersonGroup,
} from "@/lib/face-people";

type Props = {
  photos: GalleryFacePhoto[];
};

export default function PeopleCollections({ photos }: Props) {
  const [people, setPeople] = useState<PersonGroup[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const [covers, setCovers] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const groups = await buildPeopleGroups();
    setPeople(groups);
  }, []);

  useEffect(() => {
  let cancelled = false;

  async function scanAndGroup() {
    setBusy(true);
    setError("");

    try {
      const stored = await getStoredFaces();
      const processed = new Set(
        stored.map((item) => item.photoId)
      );

      const images = photos.filter(
        (photo) =>
          photo.mimeType.startsWith("image/") &&
          !processed.has(String(photo.id))
      );

      setProgress({ done: 0, total: images.length });

      for (let i = 0; i < images.length; i++) {
        if (cancelled) return;

        try {
          await scanPhotoForFaces(images[i]);
        } catch (error) {
          console.error("Face scan failed:", error);
        }

        if (!cancelled) {
          setProgress({ done: i + 1, total: images.length });
        }
      }

      if (!cancelled) {
        await refresh();
      }
    } catch (error) {
      console.error(error);
      if (!cancelled) {
        setError("Could not automatically group people.");
      }
    } finally {
      if (!cancelled) setBusy(false);
    }
  }

  void scanAndGroup();

  return () => {
    cancelled = true;
  };
}, [photos, refresh]);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];

    const loadCovers = async () => {
      const next: Record<string, string> = {};

      for (const person of people) {
        const photo = photos.find(
          (item) => String(item.id) === person.coverPhotoId,
        );

        if (photo) {
          const url = URL.createObjectURL(photo.blob);
          urls.push(url);
          next[person.id] = url;
        }
      }

      if (active) setCovers(next);
    };

    void loadCovers();

    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [people, photos]);

  const scan = async () => {
    setBusy(true);
    setError("");

    try {
      const stored = await getStoredFaces();
      const processed = new Set(stored.map((item) => item.photoId));

      const images = photos.filter(
        (photo) =>
          photo.mimeType.startsWith("image/") &&
          !processed.has(String(photo.id)),
      );

      setProgress({ done: 0, total: images.length });

      for (let index = 0; index < images.length; index++) {
        try {
          await scanPhotoForFaces(images[index]);
        } catch (err) {
          console.error("Face scan failed:", images[index].id, err);
        }

        setProgress({ done: index + 1, total: images.length });
      }

      await refresh();
    } catch (err) {
      console.error(err);
      setError("Face scanning failed. Check the model files and console.");
    } finally {
      setBusy(false);
    }
  };

  
return (
  <section className="featured-people">
    <h2>Featured</h2>

    <div className="featured-people-card">
  <div className="featured-people-grid">
    {people.slice(0, 4).map((person, index) => (
      <button
        type="button"
        className="featured-person"
        key={person.id}
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent("gallery:person-selected", {
              detail: person,
            })
          );
        }}
        aria-label={`View photos of Person ${index + 1}`}
      >
        {covers[person.id] ? (
          <img
            src={covers[person.id]}
            alt={`Person ${index + 1}`}
          />
        ) : (
          <div className="featured-person-placeholder">?</div>
        )}
      </button>
    ))}

    {Array.from({
      length: Math.max(0, 4 - people.length),
    }).map((_, index) => (
      <div
        className="featured-person featured-person-placeholder"
        key={`empty-${index}`}
      >
        ?
      </div>
    ))}
  </div>

      <div className="featured-people-grid">
        {people.slice(0, 4).map((person, index) => (
          <button
  type="button"
  className="featured-person"
  key={person.id}
  onClick={() => {
    window.dispatchEvent(
      new CustomEvent("gallery:person-selected", {
        detail: person,
      })
    );
  }}
>
            {covers[person.id] ? (
              <img
                src={covers[person.id]}
                alt={`Person ${index + 1}`}
              />
            ) : (
              <div className="featured-person-placeholder">
                ?
              </div>
            )}
          </button>
        ))}

        {Array.from({
          length: Math.max(0, 4 - people.length),
        }).map((_, index) => (
          <div
            className="featured-person featured-person-placeholder"
            key={`empty-${index}`}
          >
            ?
          </div>
        ))}
      </div>
    </div>

    <button
      type="button"
      className="featured-people-label"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent("gallery:show-all-people")
        );
      }}
    >
      People
    </button>

    {busy && (
      <p className="featured-people-status">
        Organizing faces… {progress.done}/{progress.total}
      </p>
    )}

    {error && <p role="alert">{error}</p>}
  </section>
);
}
