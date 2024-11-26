import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase-config';

export const fetchProjects = async () => {
  const projectsCol = collection(db, 'projects');
  const projectsSnapshot = await getDocs(projectsCol);
  return projectsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addProject = async ({ name, description }) => {
  const projectCol = collection(db, 'projects');
  const docRef = await addDoc(projectCol, {
    name,
    description,
    createdAt: new Date().toISOString(),
  });
  return { id: docRef.id, name, description };
};

export const deleteProject = async (id) => {
  const projectDoc = doc(db, 'projects', id);
  await deleteDoc(projectDoc);
};
