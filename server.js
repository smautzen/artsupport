require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Firebase Admin setup
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = getFirestore();

// OpenAI API setup
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} - Body:`, req.body);
  next();
});


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

      const createCategoriesAndNodes = async (collectionRef, categoryType, space) => {
        const numCategories = 2;
        const numNodesPerCategory = 2;
        const numChildNodesPerNode = 2;

        for (let i = 0; i < numCategories; i++) {
          const category = generateSampleData(`${categoryType} Category`, i);
          const categoryRef = await collectionRef.add({
            title: category.title,
            description: category.description,
            createdAt: new Date().toISOString(),
            type: 'category',
            space, // Add space property to category
          });

          const nodeRef = categoryRef.collection('nodes');
          for (let j = 0; j < numNodesPerCategory; j++) {
            const node = generateSampleData(`${categoryType} Node`, j);
            const nodeDoc = await nodeRef.add({
              title: node.title,
              description: node.description,
              type: 'text', // Default type
              space, // Add space property to node
            });

            const childNodeRef = nodeDoc.collection('childNodes');
            for (let k = 0; k < numChildNodesPerNode; k++) {
              const childNode = generateSampleData(`${categoryType} Child Node`, k);
              await childNodeRef.add({
                title: childNode.title,
                description: childNode.description,
                type: 'text', // Default type to child nodes
                space, // Add space property to child node
              });
            }
          }
        }
      };

      // Create categories and nodes with their respective spaces
      await createCategoriesAndNodes(materialRef, 'Material', 'material'); // Set space to "material"
      await createCategoriesAndNodes(conceptualRef, 'Conceptual', 'conceptual'); // Set space to "conceptual"
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

app.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const projectDocRef = db.collection('projects').doc(id);
    console.log(`Recursively deleting project: ${projectDocRef.path}`);

    // Automatically deletes subcollections and parent document
    await getFirestore().recursiveDelete(projectDocRef);

    res.status(200).send({ message: 'Project and its subcollections deleted successfully' });
  } catch (error) {
    console.error('Error during recursive deletion:', error);
    res.status(500).send({ error: error.message });
  }
});


app.post('/chat', async (req, res) => {
  try {
    const { projectId, message, nodeReferences } = req.body;

    console.log('Received payload:', { projectId, message, nodeReferences }); // Debug: Log the payload

    if (!projectId || !message) {
      return res.status(400).send({ error: 'Project ID and message are required.' });
    }

    const references = Array.isArray(nodeReferences) ? nodeReferences : [];

    // Step 1: Save user message to Firestore
    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');
    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      linkedNodes: references, // Save the references here
    });

    // Step 2: Send the user message to OpenAI
    let systemResponse;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4', // Specify the model
        messages: [
          { role: 'system', content: 'You are a helpful assistant for an art project tool.' },
          { role: 'user', content: message },
        ],
      });
      systemResponse = response.choices[0].message.content; // Extract OpenAI's response
    } catch (apiError) {
      console.error('Error connecting to OpenAI:', apiError);
      systemResponse = 'Error generating a response. Please try again.';
    }

    // Step 3: Save OpenAI's response to Firestore
    await chatCollectionRef.add({
      messageType: 'system',
      content: systemResponse,
      timestamp: new Date().toISOString(),
      linkedNodes: [], // No references for system messages in this example
    });

    // Step 4: Respond to the frontend
    res.status(201).send({ messageId: userMessageRef.id });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).send({ error: error.message });
  }
});

const { v4: uuidv4 } = require('uuid'); // Use UUID for unique IDs


app.post('/testchat', async (req, res) => {
  try {
    const { projectId, message, nodeReferences } = req.body;

    if (!projectId || !message) {
      return res.status(400).send({ error: 'Project ID and message are required.' });
    }

    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');

    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      linkedNodes: nodeReferences || [],
    });

    const systemResponse = `Responding to: "${message}"`;

    const suggestions = [
      {
        id: uuidv4(), // Unique ID for the suggestion
        space: 'material',
        type: 'category',
        title: 'Brush Styles',
        description: 'Explore different brush techniques',
        nodes: [
          {
            id: uuidv4(), // Unique ID for the node
            type: 'text',
            title: 'Watercolor Brushes',
            description: 'Brushes designed for soft, flowing effects',
          },
          {
            id: uuidv4(), // Unique ID for the node
            type: 'text',
            title: 'Oil Brushes',
            description: 'Thick, textured strokes for oil-like effects',
          },
        ],
      },
      {
        id: uuidv4(), // Unique ID for the suggestion
        space: 'conceptual',
        type: 'category',
        title: 'Mood Inspiration',
        description: 'Concepts for evoking specific emotions',
        nodes: [
          {
            id: uuidv4(), // Unique ID for the node
            type: 'text',
            title: 'Serenity',
            description: 'Ideas for creating a peaceful atmosphere',
          },
          {
            id: uuidv4(), // Unique ID for the node
            type: 'text',
            title: 'Tension',
            description: 'Techniques to depict dramatic or intense moments',
          },
        ],
      },
    ];

    await chatCollectionRef.add({
      messageType: 'system',
      content: systemResponse,
      timestamp: new Date().toISOString(),
      suggestions: suggestions,
    });

    res.status(201).send({ messageId: userMessageRef.id, suggestions });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).send({ error: error.message });
  }
});
app.get('/test-openai', async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Specify the model you want to use
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the capital of France?' },
      ],
    });

    res.status(200).send(response.choices[0].message.content);
  } catch (error) {
    console.error('Error connecting to OpenAI API:', error);
    res.status(500).send({ error: 'Failed to connect to OpenAI API.' });
  }
});

app.post('/likeSuggestion', async (req, res) => {
  try {
    const { projectId, messageId, suggestionIndex, type, title, description, categoryTitle, categoryDescription } = req.body;

    if (!projectId || !messageId || suggestionIndex === undefined) {
      return res.status(400).send({ error: 'Project ID, message ID, and suggestion index are required.' });
    }

    const messageRef = db.collection('projects').doc(projectId).collection('chat').doc(messageId);
    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return res.status(404).send({ error: 'Message not found.' });
    }

    const messageData = messageDoc.data();
    const suggestion = messageData.suggestions[suggestionIndex];

    if (!suggestion) {
      return res.status(400).send({ error: 'Invalid suggestion index.' });
    }

    // Update liked status
    if (type === 'category') {
      suggestion.liked = true;
    } else if (type === 'node') {
      const node = suggestion.nodes.find((n) => n.title === title);
      if (node) node.liked = true;
    }
    await messageRef.update({ suggestions: messageData.suggestions });

    const spaceCollectionRef = db.collection('projects').doc(projectId).collection(suggestion.space);

    if (type === 'category') {
      const categorySnapshot = await spaceCollectionRef.where('title', '==', title).get();

      if (categorySnapshot.empty) {
        console.log('Creating category:', title);
        await spaceCollectionRef.add({
          title,
          description: description || 'No description available',
          type: 'category',
          createdAt: new Date().toISOString(),
        });
      }
    } else if (type === 'node') {
      const categorySnapshot = await spaceCollectionRef.where('title', '==', categoryTitle).get();

      if (categorySnapshot.empty) {
        console.log('Creating parent category for node:', categoryTitle);
        const categoryRef = await spaceCollectionRef.add({
          title: categoryTitle,
          description: categoryDescription || 'No description available',
          type: 'category',
          createdAt: new Date().toISOString(),
        });

        console.log('Adding node to new category:', title);
        await categoryRef.collection('nodes').add({
          title,
          description: description || 'No description provided',
          type: 'text', // Ensure correct type for nodes
          createdAt: new Date().toISOString(),
        });
      } else {
        const categoryDoc = categorySnapshot.docs[0];
        console.log('Adding node to existing category:', title);

        await categoryDoc.ref.collection('nodes').add({
          title,
          description: description || 'No description provided',
          type: 'text', // Ensure correct type for nodes
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error in /likeSuggestion:', error);
    res.status(500).send({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
