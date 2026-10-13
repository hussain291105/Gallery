
export type GalleryFacePhoto = {
  id: string | number;
  blob: Blob;
  mimeType: string;
};

export type StoredPhotoFaces = {
  photoId: string;
  descriptors: number[][];
  processedAt: number;
};

export type PersonGroup = {
  id: string;
  photoIds: string[];
  faceCount: number;
  coverPhotoId: string;
};

const DB_NAME = "gallery-face-groups";
const STORE_NAME = "photo-faces";
const MATCH_THRESHOLD = 0.48;

function openFaceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "photoId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredFaces(): Promise<StoredPhotoFaces[]> {
  const db = await openFaceDB();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();

    request.onsuccess = () => {
      resolve(request.result as StoredPhotoFaces[]);
      db.close();
    };

    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

async function savePhotoFaces(record: StoredPhotoFaces) {
  const db = await openFaceDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };

    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

type FaceApiModule = typeof import("@vladmandic/face-api");

let modelPromise: Promise<FaceApiModule> | null = null;

async function loadModels(): Promise<FaceApiModule> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);

      return faceapi;
    })();
  }

  try {
    return await modelPromise;
  } catch (error) {
    modelPromise = null;
    throw error;
  }
}

async function detectFaces(blob: Blob): Promise<number[][]> {
  const faceapi = await loadModels();
  const url = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.src = url;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not load image"));
    });

    const results = await faceapi
      .detectAllFaces(
        image,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5,
        }),
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    return results.map((result) =>
      Array.from(result.descriptor),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function scanPhotoForFaces(
  photo: GalleryFacePhoto,
): Promise<void> {
  if (!photo.mimeType.startsWith("image/")) return;

  const existing = await getStoredFaces();
  const photoId = String(photo.id);

  if (existing.some((record) => record.photoId === photoId)) {
    return;
  }

  const descriptors = await detectFaces(photo.blob);

  await savePhotoFaces({
    photoId,
    descriptors,
    processedAt: Date.now(),
  });
}

function distance(a: number[], b: number[]): number {
  let sum = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    sum += (a[i] - b[i]) ** 2;
  }

  return Math.sqrt(sum);
}

export async function buildPeopleGroups(): Promise<PersonGroup[]> {
  const records = (await getStoredFaces()).sort((a, b) =>
    a.photoId.localeCompare(b.photoId, undefined, {
      numeric: true,
    }),
  );

  const clusters: {
    id: string;
    descriptors: number[][];
    photoIds: Set<string>;
  }[] = [];

  for (const record of records) {
    for (const descriptor of record.descriptors) {
      let bestCluster: (typeof clusters)[number] | undefined;
      let bestDistance = Infinity;

      for (const cluster of clusters) {
        const mean = descriptorMean(cluster.descriptors);
        const score = distance(descriptor, mean);

        if (score < bestDistance) {
          bestDistance = score;
          bestCluster = cluster;
        }
      }

      if (bestCluster && bestDistance < MATCH_THRESHOLD) {
        bestCluster.descriptors.push(descriptor);
        bestCluster.photoIds.add(record.photoId);
      } else {
        clusters.push({
          id: `person-${record.photoId}-${clusters.length + 1}`,
          descriptors: [descriptor],
          photoIds: new Set([record.photoId]),
        });
      }
    }
  }

  return clusters
    .filter((cluster) => cluster.photoIds.size > 0)
    .map((cluster) => {
      const photoIds = Array.from(cluster.photoIds);

      return {
        id: cluster.id,
        photoIds,
        faceCount: cluster.descriptors.length,
        coverPhotoId: photoIds[0],
      };
    })
    .sort((a, b) => b.photoIds.length - a.photoIds.length);
}

function descriptorMean(descriptors: number[][]): number[] {
  if (!descriptors.length) return [];

  return descriptors[0].map((_, index) => {
    const sum = descriptors.reduce(
      (total, descriptor) => total + descriptor[index],
      0,
    );

    return sum / descriptors.length;
  });
}
