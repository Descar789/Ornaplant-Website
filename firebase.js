import { db } from './config.js';
import {
  collection, doc,
  getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  increment, orderBy, query, serverTimestamp, limit
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

// ── CLOUDINARY (unsigned upload — no API secret needed) ──────────
const CLOUDINARY_CLOUD = 'dfigwymjb';
const CLOUDINARY_PRESET = 'ornaplant_plants';
const CLOUDINARY_FOLDER = 'plantas';

export async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  fd.append('folder', CLOUDINARY_FOLDER);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: fd
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  return (await res.json()).secure_url;
}

// ── PLANTS ───────────────────────────────────────────────────────
export async function getPlants() {
  const snap = await getDocs(collection(db, 'plantas'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPlant(id) {
  const snap = await getDoc(doc(db, 'plantas', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function savePlant(id, data) {
  return setDoc(doc(db, 'plantas', id), data, { merge: true });
}

export async function updatePlant(id, data) {
  return updateDoc(doc(db, 'plantas', id), data);
}

export async function deleteFirestorePlant(id) {
  return deleteDoc(doc(db, 'plantas', id));
}

// ── VIEWS ────────────────────────────────────────────────────────
export async function incrementViews(id) {
  return updateDoc(doc(db, 'plantas', id), { vistas: increment(1) });
}

// ── COMMENTS ─────────────────────────────────────────────────────
export async function getComments(plantId) {
  const q = query(
    collection(db, 'plantas', plantId, 'comentarios'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addComment(plantId, nombre, mensaje) {
  return addDoc(collection(db, 'plantas', plantId, 'comentarios'), {
    nombre: nombre.slice(0, 80),
    mensaje: mensaje.slice(0, 500),
    timestamp: serverTimestamp()
  });
}

export async function deleteComment(plantId, commentId) {
  return deleteDoc(doc(db, 'plantas', plantId, 'comentarios', commentId));
}
