const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();
const port = process.env.PORT || 4000;

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Firebase Admin setup
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

app.post('/projects', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Add the project document
    const projectRef = await db.collection('projects').add({
      name,
      description,
      createdAt: new Date().toISOString(),
    });

    // Initialize subcollections
    const projectId = projectRef.id;

    // Initialize chat collection with a placeholder message
    const chatRef = db.collection('projects').doc(projectId).collection('chat');
    await chatRef.add({
      messageType: 'system',
      content: 'Welcome to the chat!',
      timestamp: new Date().toISOString(),
      linkedNodes: [],
    });

    // Initialize material collection with a placeholder category
    const materialRef = db.collection('projects').doc(projectId).collection('material');
    await materialRef.add({
      title: 'Example Material',
      description: 'This is a placeholder material.',
      createdAt: new Date().toISOString(),
    });

    // Initialize conceptual collection with a placeholder category
    const conceptualRef = db.collection('projects').doc(projectId).collection('conceptual');
    await conceptualRef.add({
      title: 'Example Conceptual',
      description: 'This is a placeholder conceptual idea.',
      createdAt: new Date().toISOString(),
    });

    res.status(201).send({ id: projectId });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).send({ error: error.message });
  }
});

// Fetch all projects
app.get('/projects', async (req, res) => {
  try {
    const snapshot = await db.collection('projects').get();
    const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete a project
app.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the project document
    await db.collection('projects').doc(id).delete();

    // Delete the sub-collections (chat, material, conceptual)
    const chatRef = db.collection('projects').doc(id).collection('chat');
    const materialRef = db.collection('projects').doc(id).collection('material');
    const conceptualRef = db.collection('projects').doc(id).collection('conceptual');

    // Firestore doesn't natively delete sub-collections; loop through and delete manually
    const deleteSubCollection = async (ref) => {
      const snapshot = await ref.get();
      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);
    };

    await deleteSubCollection(chatRef);
    await deleteSubCollection(materialRef);
    await deleteSubCollection(conceptualRef);

    res.status(200).send({ message: 'Project and its collections deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).send({ error: error.message });
  }
});

// Route to create sample data
app.post('/create-sample-data', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).send({ error: 'Project ID is required' });
    }

    // Sample Chat Data
    const chatRef = db.collection('projects').doc(projectId).collection('chat');
    await chatRef.add({
      messageType: 'user',
      content: "I want to explore the theme of 'loneliness' and how to represent it with colors.",
      timestamp: '2024-11-20T15:00:00Z',
      linkedNodes: [],
    });

    const responseId = 'response12345';
    await chatRef.add({
      messageType: 'system',
      content: `Based on your input, here are some suggestions:
      In the Conceptual Space, you could add a node for 'Loneliness' under 'Themes.'
      In the Material Space, you could add a color palette for 'Melancholy Hues.'`,
      timestamp: '2024-11-20T15:01:00Z',
      linkedNodes: ['Loneliness', 'Melancholy Hues'],
      responseId,
    });

    // Material Collection
    const materialRef = db.collection('projects').doc(projectId).collection('material');
    await materialRef.add({
      title: 'Melancholy Hues',
      description: 'A palette of muted blues, grays, and soft purples.',
      palette: { colors: ['#7F8C8D', '#95A5A6', '#BDC3C7'] },
      responseId,
    });

    // Conceptual Collection
    const conceptualRef = db.collection('projects').doc(projectId).collection('conceptual');
    await conceptualRef.add({
      title: 'Loneliness',
      description: 'The emotional state of being isolated or disconnected.',
      responseId,
    });

    res.status(201).send({ message: 'Sample data created successfully' });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).send({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
