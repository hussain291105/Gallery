 "use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Images, Clock3, Heart, FolderHeart, Search, MoreHorizontal, SlidersHorizontal,
  CloudUpload, Grid2X2, ChevronRight, X, Download, Trash2, Check, Smartphone,
  ImagePlus, Sparkles, Menu, Cloud, CloudOff, LogIn, LogOut, RefreshCw, Settings2,
  Share2, HardDrive, AlertCircle, CheckCircle2,
  Layers3
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { deleteLocalPhotos, listLocalPhotos, saveLocalPhoto, updateLocalPhoto, type GalleryPhoto } from "@/lib/local-db";

type View = "Photos" | "Moments" | "Favorites" | "Albums" | "Collections";
type AutomaticCollection = {
  key: string;
  title: string;
  description: string;
  photos: DisplayPhoto[];
  kind: "month" | "album" | "type";
};
type DisplayPhoto = GalleryPhoto & { src: string; remote?: boolean; remoteUrl?: string };
const ALBUMS = ["Travel", "Nature", "People", "Uploads"];

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function GalleryPage() {
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [photos, setPhotos] = useState<DisplayPhoto[]>([]);
  const [active, setActive] = useState<View>("Photos");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewer, setViewer] = useState<DisplayPhoto | null>(null);
  const [albumFilter, setAlbumFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => getSupabase(), []);

  const refreshPhotos = useCallback(async () => {
    try {
      // Import images bundled in public/photos into the local gallery once per filename.
      // The manifest is generated automatically before dev/build.
      try {
        const response = await fetch("/photos/manifest.json", { cache: "no-store" });
        if (response.ok) {
          const filenames = await response.json() as string[];
          const existing = await listLocalPhotos();
          const existingIds = new Set(existing.map(photo => photo.id));
          for (const filename of filenames) {
            const id = `bundled-${encodeURIComponent(filename)}`;
            if (existingIds.has(id)) continue;
            const imageResponse = await fetch(`/photos/${encodeURIComponent(filename)}`);
            if (!imageResponse.ok) continue;
            const blob = await imageResponse.blob();
            const mimeType = blob.type || `image/${filename.split(".").pop()?.toLowerCase() === "jpg" ? "jpeg" : filename.split(".").pop()?.toLowerCase()}`;
            await saveLocalPhoto({
              id,
              title: filename.replace(/\\.[^.]+$/, ""),
              album: "Uploads",
              createdAt: Date.now(),
              favorite: false,
              blob,
              mimeType,
            });
          }
        }
      } catch {
        // Bundled photos are optional; user-uploaded local photos still load.
      }
      const local = await listLocalPhotos();
      console.log(
        "Saved gallery items:",
        local.map((p) => ({
          title: p.title,
          mimeType: p.mimeType,
          blobType: p.blob?.type,
          size: p.blob?.size,
        }))
      );
      const display = local.map(p => ({ ...p, src: URL.createObjectURL(p.blob) }));
      setPhotos(old => {
        old.forEach(p => { if (!p.remote && p.src.startsWith("blob:")) URL.revokeObjectURL(p.src); });
        return display;
      });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not load local photos.");
    }
  }, []);

  useEffect(() => {
    void refreshPhotos();
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    }
    if (!supabase) return;
    setCloudReady(true);
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setUserEmail(data.session?.user.email ?? "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      setUserEmail(session?.user.email ?? "");
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshPhotos, supabase]);

  const collections = useMemo<AutomaticCollection[]>(() => {
  const groups = new Map<string, AutomaticCollection>();

  function addToCollection(
    photo: DisplayPhoto,
    key: string,
    title: string,
    description: string,
    kind: AutomaticCollection["kind"]
  ) {
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title,
        description,
        photos: [],
        kind,
      });
    }

    groups.get(key)!.photos.push(photo);
  }

  for (const photo of photos) {
    // Group by the date currently stored by the gallery.
    const date = new Date(photo.createdAt);

    if (!Number.isNaN(date.getTime())) {
      const monthKey =
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      addToCollection(
        photo,
        `month:${monthKey}`,
        date.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        }),
        "Photos grouped by recorded date",
        "month"
      );
    }

    // Group by the existing album field.
    const album = photo.album?.trim() || "Unsorted";

    addToCollection(
      photo,
      `album:${album}`,
      album,
      "Photos in this album",
      "album"
    );

    // Group by MIME type already stored for each photo.
    const mime = (photo.mimeType || "").toLowerCase();

    
const extension = mime.startsWith("video/")
  ? mime === "video/mp4"
    ? "MP4 Videos"
    : mime.replace("video/", "").toUpperCase() + " Videos"
  : mime === "image/jpeg" || mime === "image/jpg"
    ? "JPEG"
    : mime === "image/png"
      ? "PNG"
      : mime === "image/webp"
        ? "WebP"
        : mime === "image/gif"
          ? "GIF"
          : mime === "image/avif"
            ? "AVIF"
            : mime.startsWith("image/")
              ? mime.replace("image/", "").toUpperCase()
              : "Other formats";


    addToCollection(
      photo,
      `type:${extension}`,
      extension,
      "Photos grouped by image format",
      "type"
    );
  }

  return Array.from(groups.values())
    .map((collection) => ({
      ...collection,
      photos: [...collection.photos].sort(
        (a, b) => b.createdAt - a.createdAt
      ),
    }))
    .sort((a, b) => {
      const order = { month: 0, album: 1, type: 2 };
      return (
        order[a.kind] - order[b.kind] ||
        a.title.localeCompare(b.title)
      );
    });
}, [photos]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(id);
  }, [notice]);

  const filtered = useMemo(() => {
  return photos.filter((photo) => {
    const sectionMatch =
      active === "Favorites"
        ? photo.favorite
        : active === "Albums"
          ? albumFilter === "All" || photo.album === albumFilter
          : active === "Collections" && collectionFilter
            ? collections
                .find((collection) => collection.key === collectionFilter)
                ?.photos.some((item) => item.id === photo.id) ?? false
            : true;

    const searchMatch =
      `${photo.title} ${photo.album} ${formatDate(photo.createdAt)}`
        .toLowerCase()
        .includes(query.toLowerCase());

    return sectionMatch && searchMatch;
  });
}, [
  photos,
  active,
  query,
  albumFilter,
  collectionFilter,
  collections,
]);

  async function uploadFiles(files?: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let count = 0;
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const isMp4 =
          file.type === "video/mp4" ||
          file.name.toLowerCase().endsWith(".mp4");
        
        if (!isImage && !isMp4) continue;
        console.log("Gallery upload:", {
          name: file.name,
          type: file.type,
          size: file.size,
          isImage,
          isMp4,
        });
        const photo: GalleryPhoto = {
          id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ""),
          album: "Uploads", createdAt: Date.now() + count, favorite: false,
          blob: file,
          mimeType: isMp4 ? "video/mp4" : (file.type || "image/jpeg")
        };
        await saveLocalPhoto(photo);
        count++;
        // If signed in and a bucket is configured, back up each file after the local save.
        if (supabase && signedIn) {
          const path = `${(await supabase.auth.getUser()).data.user?.id}/${photo.id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { error } = await supabase.storage.from("gallery-photos").upload(path, file, { contentType: photo.mimeType, upsert: true });
          if (!error) await updateLocalPhoto(photo.id, { cloudPath: path });
          else setNotice(`Saved locally; cloud backup failed: ${error.message}`);
        }
      }
      await refreshPhotos();
      setShowUpload(false);
      setNotice(`${count} photo${count === 1 ? "" : "s"} added to your local gallery${signedIn ? " (cloud backup attempted)" : ""}.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleFavorite(photo: DisplayPhoto) {
    const favorite = !photo.favorite;
    await updateLocalPhoto(photo.id, { favorite });
    setPhotos(old => old.map(p => p.id === photo.id ? { ...p, favorite } : p));
    if (viewer?.id === photo.id) setViewer({ ...viewer, favorite });
  }

  async function removeSelected() {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} selected photo(s) from this device? This cannot be undone.`)) return;
    const selectedPhotos = photos.filter(p => selected.includes(p.id));
    await deleteLocalPhotos(selected);
    if (supabase && signedIn) {
      for (const p of selectedPhotos) if (p.cloudPath) await supabase.storage.from("gallery-photos").remove([p.cloudPath]);
    }
    setSelected([]);
    await refreshPhotos();
    setViewer(null);
    setNotice("Selected photos deleted.");
  }

  async function auth(action: "signin" | "signup") {
    if (!supabase) { setNotice("Cloud is not configured yet. Add your Supabase URL and anon key to .env.local."); return; }
    setBusy(true);
    const result = action === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setNotice(result.error.message);
    else {
      setNotice(action === "signup" ? "Account created. Check your email if confirmation is enabled." : "Signed in. New uploads can now be backed up.");
      setSignedIn(action === "signin" || Boolean(result.data.session));
      setUserEmail(email);
    }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSignedIn(false); setUserEmail("");
    setNotice("Signed out. Local photos remain on this device.");
  }

  async function backupExisting() {
    if (!supabase || !signedIn) return;
    setBusy(true);
    let success = 0;
    for (const p of photos) {
      if (p.cloudPath) continue;
      const path = `${(await supabase.auth.getUser()).data.user?.id}/${p.id}-${p.title.replace(/[^a-zA-Z0-9._-]/g, "_")}.${p.mimeType.split("/")[1] || "jpg"}`;
      const { error } = await supabase.storage.from("gallery-photos").upload(path, p.blob, { contentType: p.mimeType, upsert: true });
      if (!error) { await updateLocalPhoto(p.id, { cloudPath: path }); success++; }
    }
    await refreshPhotos();
    setBusy(false);
    setNotice(`Cloud backup complete: ${success} new file(s) uploaded.`);
  }

  function toggleSelect(id: string) {
    setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  }

  async function downloadPhoto(photo: DisplayPhoto) {
    const a = document.createElement("a");
    a.href = photo.src;
    a.download = `${photo.title || "photo"}.${photo.mimeType.split("/")[1] || "jpg"}`;
    a.click();
  }

  async function sharePhoto(photo: DisplayPhoto) {
    try {
      if (navigator.share && photo.src.startsWith("blob:")) {
        const response = await fetch(photo.src);
        const blob = await response.blob();
        const file = new File([blob], `${photo.title}.jpg`, { type: photo.mimeType });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: photo.title });
          return;
        }
      }
      await navigator.clipboard.writeText(photo.title);
      setNotice("Photo title copied. Use Download to save the image.");
    } catch {
      setNotice("Sharing was cancelled or is not supported on this device.");
    }
  }

  const sectionTitle =
  active === "Photos"
    ? "All photos"
    : active === "Moments"
      ? "Your moments"
      : active === "Favorites"
        ? "Favorites"
        : active === "Albums"
          ? "Albums"
          : "Collections";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Images size={22} strokeWidth={2.4}/></div><span>Gallery</span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
        <button className="upload-button" onClick={() => setShowUpload(true)}><ImagePlus size={18}/> Add photos <span>＋</span></button>
        <div className="nav-label">LIBRARY</div>
        <nav className="main-nav">
          {([
  { id: "Photos", icon: Images },
  { id: "Moments", icon: Clock3 },
  { id: "Favorites", icon: Heart },
  { id: "Albums", icon: FolderHeart },
  { id: "Collections", icon: Layers3 },
] as const).map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => { setActive(item.id); setCollectionFilter(null); setMobileNav(false); }}><Icon size={19}/><span>{item.id}</span>{item.id === "Photos" && <span className="nav-count">{photos.length}</span>}</button>; })}
        </nav>
        <div className="nav-label album-label">YOUR ALBUMS <button aria-label="More albums" onClick={() => {setActive("Albums");setAlbumFilter("All");}}><MoreHorizontal size={17}/></button></div>
        <div className="album-links">
          {ALBUMS.map((album, i) => <button key={album} className={`album-link ${active === "Albums" && albumFilter === album ? "album-active" : ""}`} onClick={() => { setActive("Albums"); setAlbumFilter(album); }}><span className={`album-dot dot-${i}`}/>{album}<span className="album-count">{photos.filter(p => p.album === album).length}</span></button>)}
        </div>
        <div className="sidebar-bottom"><div className="storage-icon"><Smartphone size={18}/></div><div className="storage-copy"><strong>Local gallery</strong><span>{cloudReady ? (signedIn ? "Cloud backup enabled" : "Cloud not connected") : "Stored on this device"}</span></div><span className={`status-dot ${signedIn ? "" : "status-muted"}`}/></div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button>
          <div className="breadcrumb"><span>Library</span><ChevronRight size={15}/><strong>
  {active === "Collections" && collectionFilter
    ? collections.find((collection) => collection.key === collectionFilter)?.title
      ?? "Collections"
    : active}
</strong></div>
          <div className="top-actions">
            <label className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your photos" aria-label="Search your photos"/><kbd>⌘ K</kbd></label>
            <button className="icon-button filter-button" onClick={() => setShowSettings(true)} aria-label="Settings"><Settings2 size={19}/></button>
            <button className="avatar" title={userEmail || "Profile"} onClick={() => setShowSettings(true)}>{signedIn ? (userEmail[0] || "U").toUpperCase() : "H"}</button>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL SPACE</div><h1>{sectionTitle}<span className="title-period">.</span></h1><p className="subtitle">{active === "Favorites" ? "The moments you want to keep close." : "Every little moment, all in one place."}</p></div><button className="outline-button" onClick={() => setShowUpload(true)}><CloudUpload size={17}/> Import photos</button></div>

          {active === "Albums" && <div className="album-filter-row"><button className={albumFilter === "All" ? "chip chosen" : "chip"} onClick={() => setAlbumFilter("All")}>All albums</button>{ALBUMS.map(a => <button key={a} className={albumFilter === a ? "chip chosen" : "chip"} onClick={() => setAlbumFilter(a)}>{a}</button>)}</div>}
          {active === "Moments" && <div className="moment-banner"><div className="moment-icon"><Clock3 size={21}/></div><div><strong>A little look back</strong><p>Explore your photos grouped by the time they were captured.</p></div><span>{new Date().getFullYear()}</span></div>}
          {selected.length > 0 && <div className="selection-bar"><span><Check size={16}/> {selected.length} selected</span><button onClick={() => void removeSelected()}><Trash2 size={16}/> Delete</button><button onClick={() => setSelected([])}><X size={16}/> Clear selection</button></div>}
          {active === "Collections" && (
  <section className="collections-section">
    <div className="collections-heading">
      <div>
        <span className="eyebrow">
          <Layers3 size={14} /> AUTOMATIC GROUPING
        </span>

        <h2>
          {collectionFilter
            ? collections.find(
                (collection) => collection.key === collectionFilter
              )?.title ?? "Collection"
            : "Your collections"}
        </h2>

        <p>
          {collectionFilter
            ? "Photos in this collection"
            : "Browse your photos by date, album, or file type."}
        </p>
      </div>

      {collectionFilter && (
        <button
          className="outline-button"
          onClick={() => setCollectionFilter(null)}
        >
          All collections
        </button>
      )}
    </div>

    {!collectionFilter ? (
      collections.length ? (
        <div className="collections-grid">
          {collections.map((collection) => (
            <button
              key={collection.key}
              type="button"
              className="collection-card"
              onClick={() => setCollectionFilter(collection.key)}
            >
              <div className="collection-cover">
                {collection.photos[0].mimeType.startsWith("video/") ? (
                  <video
                    src={collection.photos[0].src}
                    muted
                    playsInline
                    preload="metadata"
                    className="gallery-video"
                    aria-label={collection.photos[0].title}
                  />
                ) : (
                  <img
                    src={collection.photos[0].src}
                    alt=""
                    loading="lazy"
                  />
                )}

                <span className="collection-kind">
                  {collection.kind === "month"
                    ? "By date"
                    : collection.kind === "album"
                      ? "By album"
                      : "By format"}
                </span>
              </div>

              <div className="collection-card-info">
                <strong>{collection.title}</strong>
                <span>
                  {collection.photos.length}{" "}
                  {collection.photos.length === 1 ? "photo" : "photos"}
                </span>
              </div>

              <p>{collection.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Layers3 size={32} />
          <h3>No collections yet</h3>
          <p>Add photos to automatically generate collections.</p>
          <button
            className="primary-button"
            onClick={() => setShowUpload(true)}
          >
            Add photos
          </button>
        </div>
      )
    ) : null}
  </section>
)}
          <div className="section-heading"><div><h2>{active === "Moments" ? "Recently captured" : active === "Albums" ? (albumFilter === "All" ? "Browse collection" : albumFilter) : "Recently added"}</h2><span>{filtered.length} items</span></div><button className="view-toggle" aria-label="Grid view"><Grid2X2 size={17}/></button></div>

          {active === "Collections" && !collectionFilter ? null : filtered.length === 0 ? <div className="empty-state"><Images size={32}/><h3>{query ? "No photos found" : "Your gallery is ready"}</h3><p>{query ? "Try another search or add some photos." : "Add photos from this device to get started."}</p><button className="primary-button" onClick={() => setShowUpload(true)}>Add photos</button></div> : <div className="photo-grid">
            {filtered.map((photo, i) => <article key={photo.id} className={`photo-card ${i === 0 ? "photo-wide" : ""} ${i === 5 ? "photo-tall" : ""} ${selected.includes(photo.id) ? "photo-selected" : ""}`}>
              <button className="photo-open" onClick={() => setViewer(photo)} aria-label={`Open ${photo.title}`}>{photo.mimeType.startsWith("video/") ? (<video src={photo.src} muted playsInline preload="metadata" aria-label={photo.title} className="gallery-video"/>) : (<img src={photo.src} alt={photo.title} loading={i > 5 ? "lazy" : "eager"} />)}  <span className="photo-gradient"/><span className="photo-caption"><strong>{photo.title}</strong><small>{formatDate(photo.createdAt)} · {photo.album}</small></span></button>
              <button className={`photo-select ${selected.includes(photo.id) ? "is-selected" : ""}`} onClick={() => toggleSelect(photo.id)} aria-label="Select photo">{selected.includes(photo.id) ? <Check size={15}/> : <span/>}</button>
              <button className={`favorite-button ${photo.favorite ? "is-favorite" : ""}`} onClick={() => void toggleFavorite(photo)} aria-label={photo.favorite ? "Remove from favorites" : "Add to favorites"}><Heart size={17} fill={photo.favorite ? "currentColor" : "none"}/></button>
              {photo.cloudPath && <span className="cloud-badge" title="Backed up to cloud"><Cloud size={13}/></span>}
            </article>)}
          </div>}
          <footer className="gallery-footer"><span>Made for your memories</span><span><span className="footer-dot"/> {photos.length ? "Your gallery is up to date" : "Add your first photo"}</span></footer>
        </div>
      </section>

      {notice && <div className="toast"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15}/></button></div>}

      {showUpload && <div className="modal-backdrop" onClick={() => !busy && setShowUpload(false)}><div className="upload-modal" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowUpload(false)} aria-label="Close"><X size={19}/></button><div className="upload-illustration"><CloudUpload size={30}/></div><h2>Add to your gallery</h2><p>Photos are saved on this device first. When you're signed in and cloud storage is configured, the app can back them up.</p><button className="primary-button full-button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Adding photos…" : "Choose photos"}</button><input ref={fileRef} type="file" accept="image/*,video/mp4,.mp4" multiple hidden onChange={(e: ChangeEvent<HTMLInputElement>) => void uploadFiles(e.target.files)}/><span className="modal-note">JPG, PNG, WEBP, MP4 videos and other image formats</span></div></div>}

      {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="settings-modal" onClick={e => e.stopPropagation()}><div className="settings-head"><div><span className="eyebrow"><Settings2 size={14}/> PREFERENCES</span><h2>Gallery settings</h2></div><button className="icon-button" onClick={() => setShowSettings(false)} aria-label="Close settings"><X size={19}/></button></div><div className="settings-row"><div className="settings-icon"><HardDrive size={19}/></div><div><strong>Local storage</strong><p>Photos are stored in this browser on this device using IndexedDB.</p></div><span className="setting-state">Active</span></div><div className="settings-row"><div className="settings-icon">{cloudReady ? <Cloud size={19}/> : <CloudOff size={19}/>}</div><div><strong>Cloud backup</strong><p>{!cloudReady ? "Add Supabase credentials to enable secure account sign-in and backup." : signedIn ? `Connected as ${userEmail}` : "Sign in or create an account to back up photos."}</p></div><span className={`setting-state ${signedIn ? "" : "state-off"}`}>{signedIn ? "Connected" : "Optional"}</span></div>
        {!signedIn && <div className="auth-form"><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="current-password"/></label><div className="auth-buttons"><button className="primary-button" disabled={busy || !email || password.length < 6} onClick={() => void auth("signin")}><LogIn size={15}/> Sign in</button><button className="secondary-button" disabled={busy || !email || password.length < 6} onClick={() => void auth("signup")}>Create account</button></div></div>}
        {signedIn && <div className="cloud-controls"><button className="primary-button" disabled={busy} onClick={() => void backupExisting()}><RefreshCw size={15}/> {busy ? "Backing up…" : "Back up existing photos"}</button><button className="secondary-button" onClick={() => void signOut()}><LogOut size={15}/> Sign out</button></div>}
        <div className="privacy-note"><AlertCircle size={15}/><span>Cloud backup requires your own Supabase project and storage policies. Never add a Supabase service-role key to this app.</span></div></div></div>}

      {viewer && <div className="viewer-backdrop" onClick={() => setViewer(null)}><div className="viewer" onClick={e => e.stopPropagation()}><div className="viewer-top"><div><strong>{viewer.title}</strong><span>{formatDate(viewer.createdAt)} · {viewer.album}</span></div><div className="viewer-actions"><button className={`icon-button ${viewer.favorite ? "viewer-fav" : ""}`} onClick={() => void toggleFavorite(viewer)} aria-label="Favorite"><Heart size={19} fill={viewer.favorite ? "currentColor" : "none"}/></button><button className="icon-button" onClick={() => void sharePhoto(viewer)} aria-label="Share"><Share2 size={19}/></button><button className="icon-button" onClick={() => setViewer(null)} aria-label="Close viewer"><X size={21}/></button></div></div><div className="viewer-image-wrap"> {viewer.mimeType.startsWith("video/") ? ( <video src={viewer.src} controls autoPlay={false} playsInline preload="metadata" style={{ maxWidth: "100%", maxHeight: "100%" }} /> ) : ( <img src={viewer.src} alt={viewer.title} /> )}</div><div className="viewer-bottom"><span><Images size={16}/> {viewer.album}{viewer.cloudPath ? " · Backed up" : " · On this device"}</span><button onClick={() => void downloadPhoto(viewer)}><Download size={16}/> Download</button></div></div></div>}
    </main>
  );
}
