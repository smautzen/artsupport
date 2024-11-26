import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-config';

export const fetchProjects = async () => {
  const projectsCol = collection(db, 'projects');
  const projectsSnapshot = await getDocs(projectsCol);
  const projectsList = projectsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return projectsList;
};
