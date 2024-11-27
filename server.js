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

    // Initialize material collection with 2 categories, each having 2 sample nodes
    const materialRef = db.collection('projects').doc(projectId).collection('material');
    const materialCategories = [
      {
        title: 'Material Category 1',
        description: 'Placeholder category for materials.',
        createdAt: new Date().toISOString(),
        nodes: [
          { title: 'Sample Material 1', description: 'First sample material.' },
          { title: 'Sample Material 2', description: 'Second sample material.' }
        ]
      },
      {
        title: 'Material Category 2',
        description: 'Another placeholder category for materials.',
        createdAt: new Date().toISOString(),
        nodes: [
          { title: 'Sample Material 3', description: 'Third sample material.' },
          { title: 'Sample Material 4', description: 'Fourth sample material.' }
        ]
      }
    ];

    for (const category of materialCategories) {
      const categoryRef = await materialRef.add({
        title: category.title,
        description: category.description,
        createdAt: category.createdAt,
      });

      // Add nodes to each category
      const nodeRef = categoryRef.collection('nodes');
      for (const node of category.nodes) {
        await nodeRef.add({
          title: node.title,
          description: node.description,
        });
      }
    }

    // Initialize conceptual collection with 2 categories, each having 2 sample nodes
    const conceptualRef = db.collection('projects').doc(projectId).collection('conceptual');
    const conceptualCategories = [
      {
        title: 'Conceptual Category 1',
        description: 'Placeholder conceptual category.',
        createdAt: new Date().toISOString(),
        nodes: [
          { title: 'Sample Concept 1', description: 'First sample concept.' },
          { title: 'Sample Concept 2', description: 'Second sample concept.' }
        ]
      },
      {
        title: 'Conceptual Category 2',
        description: 'Another placeholder conceptual category.',
        createdAt: new Date().toISOString(),
        nodes: [
          { title: 'Sample Concept 3', description: 'Third sample concept.' },
          { title: 'Sample Concept 4', description: 'Fourth sample concept.' }
        ]
      }
    ];

    for (const category of conceptualCategories) {
      const categoryRef = await conceptualRef.add({
        title: category.title,
        description: category.description,
        createdAt: category.createdAt,
      });

      // Add nodes to each category
      const nodeRef = categoryRef.collection('nodes');
      for (const node of category.nodes) {
        await nodeRef.add({
          title: node.title,
          description: node.description,
        });
      }
    }

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

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
