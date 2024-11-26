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
    const { name, description, includeSampleData } = req.body;

    console.log('Request received to create project:', {
      name,
      description,
      includeSampleData,
    }); // Debug log

    // Add the project document
    const projectRef = await db.collection('projects').add({
      name,
      description,
      createdAt: new Date().toISOString(),
    });

    const projectId = projectRef.id;

    // Initialize subcollections
    const chatRef = db.collection('projects').doc(projectId).collection('chat');
    const materialRef = db.collection('projects').doc(projectId).collection('material');
    const conceptualRef = db.collection('projects').doc(projectId).collection('conceptual');

    console.log('includeSampleData flag:', includeSampleData); // Debug log
    if (includeSampleData) {
      console.log('Adding sample data...'); // Debug log
      await chatRef.add({
        messageType: 'system',
        content: 'Welcome to the chat!',
        timestamp: new Date().toISOString(),
        linkedNodes: [],
      });

      const generateSampleData = (type, index) => ({
        title: `${type} ${index + 1}`,
        description: `This is a description for ${type} ${index + 1}.`,
      });

      const createCategoriesAndNodes = async (collectionRef, categoryType) => {
        const numCategories = 2;
        const numNodesPerCategory = 2;
        const numChildNodesPerNode = 2;

        for (let i = 0; i < numCategories; i++) {
          const category = generateSampleData(`${categoryType} Category`, i);
          const categoryRef = await collectionRef.add({
            title: category.title,
            description: category.description,
            createdAt: new Date().toISOString(),
          });

          const nodeRef = categoryRef.collection('nodes');
          for (let j = 0; j < numNodesPerCategory; j++) {
            const node = generateSampleData(`${categoryType} Node`, j);
            const nodeDoc = await nodeRef.add({
              title: node.title,
              description: node.description,
            });

            const childNodeRef = nodeDoc.collection('childNodes');
            for (let k = 0; k < numChildNodesPerNode; k++) {
              const childNode = generateSampleData(`${categoryType} Child Node`, k);
              await childNodeRef.add({
                title: childNode.title,
                description: childNode.description,
              });
            }
          }
        }
      };

      await createCategoriesAndNodes(materialRef, 'Material');
      await createCategoriesAndNodes(conceptualRef, 'Conceptual');
    } else {
      console.log('Creating project without sample data'); // Debug log
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

app.post('/chat', async (req, res) => {
  try {
    const { projectId, message } = req.body;

    if (!projectId || !message) {
      return res.status(400).send({ error: 'Project ID and message are required.' });
    }

    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');

    // Add the user's message to the chat collection
    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      linkedNodes: [], // Include linked nodes or other metadata if needed
    });

    // Automatically add a system response
    await chatCollectionRef.add({
      messageType: 'system',
      content: `Responding to: "${message}"`,
      timestamp: new Date().toISOString(),
      linkedNodes: [], // Include metadata if needed
    });

    res.status(201).send({ messageId: userMessageRef.id });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).send({ error: error.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
