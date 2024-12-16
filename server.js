require('dotenv').config();

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Use UUID for unique IDs

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
    });

    // Add the project document
    const projectRef = await db.collection('projects').add({
      name,
      description,
      createdAt: new Date().toISOString(),
    });

    const projectId = projectRef.id;

    // Add defaultSuggestions document
    const defaultSuggestionsPath = path.join(__dirname, 'defaultSuggestions.json');
    let defaultSuggestionsData;

    try {
      defaultSuggestionsData = JSON.parse(fs.readFileSync(defaultSuggestionsPath, 'utf-8'));
      console.log('Default Suggestions Data:', defaultSuggestionsData); // Debug log
    } catch (error) {
      console.error('Error reading defaultSuggestions.json:', error);
      throw new Error('Failed to load default suggestions');
    }

    const defaultSuggestionsRef = db.collection('projects').doc(projectId).collection('defaultSuggestions');

    for (const [space, suggestions] of Object.entries(defaultSuggestionsData)) {
      const spaceRef = defaultSuggestionsRef.doc(space).collection('items');

      for (const suggestion of suggestions) {
        await spaceRef.add({
          title: suggestion.title,
          description: suggestion.description,
          liked: suggestion.liked,
          show: suggestion.show,
          createdAt: new Date().toISOString(),
        });
      }
    }

    console.log('Default suggestions added to Firestore');

    // Initialize other subcollections
    const chatRef = db.collection('projects').doc(projectId).collection('chat');

    await chatRef.add({
      messageType: 'system',
      content: 'Welcome to your new project! Let’s start creating.',
      timestamp: new Date().toISOString(),
      linkedNodes: [],
    });

    console.log('Chat initialized');

    // Check if sample data should be added
    if (includeSampleData) {
      console.log('Adding sample data...');

      await chatRef.add({
        messageType: 'system',
        content: 'Sample data added to help you get started.',
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
            space,
          });

          const nodeRef = categoryRef.collection('nodes');
          for (let j = 0; j < numNodesPerCategory; j++) {
            const node = generateSampleData(`${categoryType} Node`, j);
            const nodeDoc = await nodeRef.add({
              title: node.title,
              description: node.description,
              type: 'text',
              space,
            });

            const childNodeRef = nodeDoc.collection('childNodes');
            for (let k = 0; k < numChildNodesPerNode; k++) {
              const childNode = generateSampleData(`${categoryType} Child Node`, k);
              await childNodeRef.add({
                title: childNode.title,
                description: childNode.description,
                type: 'text',
                space,
              });
            }
          }
        }
      };

      const materialRef = db.collection('projects').doc(projectId).collection('material');
      const conceptualRef = db.collection('projects').doc(projectId).collection('conceptual');

      await createCategoriesAndNodes(materialRef, 'Material', 'material');
      await createCategoriesAndNodes(conceptualRef, 'Conceptual', 'conceptual');
    } else {
      console.log('Creating project without sample data');
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
    const { projectId, message, hierarchy } = req.body;

    console.log('Received payload:', { projectId, message, hierarchy });

    if (!projectId || !message) {
      return res.status(400).send({ error: 'Project ID and message are required.' });
    }

    // Step 1: Fetch the ontology for the project
    let ontology;
    try {
      ontology = await fetchOntology(projectId);
    } catch (error) {
      return res.status(500).send({ error: 'Failed to fetch project ontology.' });
    }

    // Step 2: Save user message to Firestore
    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');

    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      hierarchy: hierarchy || null, // Save the full hierarchy
    });


    // Step 3: Generate assistant response with emphasis on attached nodes (if any)
    let assistantResponse;
    try {
      assistantResponse = await generateAssistantResponse(message, ontology, hierarchy);
    } catch (error) {
      console.error('Error generating assistant response:', error);
      assistantResponse = {
        responseMessage: 'There was an error processing your request.',
        suggestions: [],
      };
    }

    // Step 4: Ensure the response structure for suggestions
    // Ensure that every node in suggestions has `nodeName`, `description`, `reasoning`, and `id`.
    const suggestions = assistantResponse.suggestions.map((suggestion) => {
      return {
        title: suggestion.title,
        description: suggestion.description,
        reasoning: suggestion.reasoning || 'No reasoning provided',
        space: suggestion.space,
        nodes: suggestion.nodes.map((node) => ({
          title: node.title,
          description: node.description || 'No description available',
          reasoning: node.reasoning || 'No reasoning provided',
          space: suggestion.space,
          id: node.id || uuidv4(), // Generate a unique ID if it's missing
        })),
      };
    });

    // Step 5: Save assistant response to Firestore
    await chatCollectionRef.add({
      messageType: 'system',
      content: assistantResponse.responseMessage,
      timestamp: new Date().toISOString(),
      suggestions: suggestions,
    });

    // Step 6: Respond to the frontend
    res.status(201).send({
      messageId: userMessageRef.id,
      response: assistantResponse.responseMessage,
      suggestions: suggestions,
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).send({ error: error.message });
  }
});

app.post('/testchat', async (req, res) => {
  try {
    const { projectId, message, hierarchy } = req.body;

    if (!projectId || !message) {
      return res.status(400).send({ error: 'Project ID and message are required.' });
    }

    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');
    const entitiesCollectionRef = db.collection('projects').doc(projectId).collection('entities');

    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      hierarchy: hierarchy || null, // Save the full hierarchy
    });

    // If a certain category/node is being explored
    if (hierarchy) {
      console.log('Hierarchy:', hierarchy);

      // If it's a node, provide entity suggestions
      if (hierarchy.node && hierarchy.category) {
        const destination = { hierarchy };

        // Generate new entities
        const entity1Id = uuidv4();
        const entity2Id = uuidv4();
        const entity3Id = uuidv4();

        const newEntities = [
          { id: entity1Id, title: `Entity suggestion ${entity1Id}`, description: 'sample description', liked: false, messageId: userMessageRef.id, origin: 'exploreNode' },
          { id: entity2Id, title: `Entity suggestion ${entity2Id}`, description: 'sample description', liked: false, messageId: userMessageRef.id, origin: 'exploreNode' },
          { id: entity3Id, title: `Entity suggestion ${entity3Id}`, description: 'sample description', liked: false, messageId: userMessageRef.id, origin: 'exploreNode' },
        ];

        // Add entities to the entities collection
        await Promise.all(newEntities.map((entity) => entitiesCollectionRef.doc(entity.id).set(entity)));

        // Replace node's entities array with just IDs
        const spaceCollectionRef = db.collection('projects').doc(projectId).collection(hierarchy.space);
        const nodeRef = spaceCollectionRef.doc(hierarchy.category.id).collection('nodes').doc(hierarchy.node.id);

        const nodeDoc = await nodeRef.get();

        if (!nodeDoc.exists) {
          return res.status(404).send({ error: 'Node not found.' });
        }

        await nodeRef.set(
          {
            entities: admin.firestore.FieldValue.arrayUnion(entity1Id, entity2Id, entity3Id),
          },
          { merge: true }
        );

        // Add system message with suggestions
        await chatCollectionRef.add({
          messageType: 'system',
          content: 'Suggestions for entities for node:',
          timestamp: new Date().toISOString(),
          destination,
          suggestions: newEntities.map((entity) => ({ id: entity.id, messageId: entity.messageId })), // Only store IDs and references
          action: 'entities',
        });

        return res.status(201).send({ messageId: userMessageRef.id, destination, suggestions: newEntities });
      }

      // If it's a category, provide node suggestions (to be implemented)
      if (hierarchy.node === null && hierarchy.category) {
        // TODO: Implement node suggestions
      }
    } else {
      // If no hierarchy is provided, return suggestions for categories with nodes
      const systemResponse = `Responding to: "${message}"`;

      const entity1Id = uuidv4();
      const entity2Id = uuidv4();
      const entity3Id = uuidv4();

      const newEntities = [
        { id: entity1Id, title: `Entity suggestion ${entity1Id}`, description: 'sample description', liked: false, messageId: userMessageRef.id, origin: 'getSuggestions' },
        { id: entity2Id, title: `Entity suggestion ${entity2Id}`, description: 'sample description', liked: false, messageId: userMessageRef.id, origin: 'getSuggestions' },
        { id: entity3Id, title: `Entity suggestion ${entity3Id}`, description: 'sample description', liked: false, messageId: userMessageRef.id, origin: 'getSuggestions' },
      ];

      // Add entities to the entities collection
      await Promise.all(newEntities.map((entity) => entitiesCollectionRef.doc(entity.id).set(entity)));

      const suggestions = [
        {
          id: uuidv4(),
          space: 'material',
          type: 'category',
          title: 'Brush Styles',
          description: 'Explore different brush techniques',
          nodes: [
            {
              id: uuidv4(),
              type: 'text',
              title: 'Watercolor Brushes',
              description: 'Brushes designed for soft, flowing effects',
              entities: [entity1Id, entity2Id, entity3Id], // Only store IDs
            },
            {
              id: uuidv4(),
              type: 'text',
              title: 'Oil Brushes',
              description: 'Thick, textured strokes for oil-like effects',
              entities: [entity1Id, entity2Id, entity3Id], // Only store IDs
            },
          ],
        },
        {
          id: uuidv4(),
          space: 'conceptual',
          type: 'category',
          title: 'Mood Inspiration',
          description: 'Concepts for evoking specific emotions',
          nodes: [
            {
              id: uuidv4(),
              type: 'text',
              title: 'Serenity',
              description: 'Ideas for creating a peaceful atmosphere',
              entities: [entity1Id, entity2Id, entity3Id], // Only store IDs
            },
            {
              id: uuidv4(),
              type: 'text',
              title: 'Tension',
              description: 'Techniques to depict dramatic or intense moments',
              entities: [entity1Id, entity2Id, entity3Id], // Only store IDs
            },
          ],
        },
      ];

      await chatCollectionRef.add({
        messageType: 'system',
        content: systemResponse,
        timestamp: new Date().toISOString(),
        suggestions,
        action: 'nodes',
      });

      return res.status(201).send({ messageId: userMessageRef.id, suggestions });
    }
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
    const {
      projectId,
      messageId,
      suggestionIndex,
      type,
      title,
      description,
      categoryTitle,
      categoryDescription,
    } = req.body;

    console.log('body: ', req.body); // Log the request body for debugging

    // Validate input
    if (!projectId || !messageId || suggestionIndex === undefined) {
      return res
        .status(400)
        .send({ error: 'Project ID, message ID, and suggestion index are required.' });
    }

    // Get the message document from Firestore
    const messageRef = db.collection('projects').doc(projectId).collection('chat').doc(messageId);
    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      return res.status(404).send({ error: 'Message not found.' });
    }

    const messageData = messageDoc.data();
    console.log('Suggestions: ', messageData.suggestions);

    const suggestion = messageData.suggestions[suggestionIndex];
    if (!suggestion) {
      return res.status(400).send({ error: 'Invalid suggestion index.' });
    }

    // Handle liking a category
    if (type === 'category') {
      suggestion.liked = true; // Mark the category suggestion as liked
    }
    // Handle liking a node
    else if (type === 'node') {
      const node = suggestion.nodes.find((n) => n.title === title);
      if (node) {
        node.liked = true; // Mark the node as liked

        // Also mark the parent category (suggestion) as liked
        suggestion.liked = true;

        // Include entities associated with the node (if any)
        const entities = node.entities || [];

        // Process Firestore updates for material or conceptual space
        const spaceCollectionRef = db.collection('projects').doc(projectId).collection(suggestion.space);

        const categorySnapshot = await spaceCollectionRef.where('title', '==', categoryTitle).get();

        if (categorySnapshot.empty) {
          console.log('Creating parent category for node:', categoryTitle);
          const categoryRef = await spaceCollectionRef.add({
            title: categoryTitle,
            description: categoryDescription || 'No description available',
            type: 'category',
            liked: true,
            createdAt: new Date().toISOString(),
          });

          console.log('Adding node to new category:', title);
          await categoryRef.collection('nodes').add({
            title,
            description: description || 'No description provided',
            type: 'text',
            liked: true,
            entities,
            createdAt: new Date().toISOString(),
          });
        } else {
          const categoryDoc = categorySnapshot.docs[0];
          console.log('Adding node to existing category:', title);

          await categoryDoc.ref.collection('nodes').add({
            title,
            description: description || 'No description provided',
            type: 'text',
            liked: true,
            entities,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Update the suggestions array in Firestore
    await messageRef.update({ suggestions: messageData.suggestions });

    // Handle creating a new category if type is 'category'
    if (type === 'category') {
      const spaceCollectionRef = db.collection('projects').doc(projectId).collection(suggestion.space);

      const categorySnapshot = await spaceCollectionRef.where('title', '==', title).get();

      if (categorySnapshot.empty) {
        console.log('Creating category:', title);
        await spaceCollectionRef.add({
          title,
          description: description || 'No description available',
          type: 'category',
          liked: true,
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

app.post('/likeImage', async (req, res) => {
  try {
    // Destructure required fields from the request body
    const { projectId, messageId, suggestionIndex } = req.body;

    console.log('Received /likeImage request:', req.body); // Debug log for incoming request

    // Validate input: Ensure required fields are present
    if (!projectId || !messageId || suggestionIndex === undefined) {
      console.error('Missing required fields:', { projectId, messageId, suggestionIndex });
      return res.status(400).send({ error: 'Project ID, message ID, and suggestion index are required.' });
    }

    // Reference the message document in Firestore
    const messageRef = db.collection('projects').doc(projectId).collection('chat').doc(messageId);
    const messageDoc = await messageRef.get();

    // Check if the message document exists
    if (!messageDoc.exists) {
      console.error(`Message not found: Project ID: ${projectId}, Message ID: ${messageId}`);
      return res.status(404).send({ error: 'Message not found.' });
    }

    // Fetch and validate the suggestion from the message data
    const messageData = messageDoc.data();
    const suggestion = messageData.suggestions[suggestionIndex];

    console.log('Fetched suggestion:', suggestion); // Debug log for suggestion data

    if (!suggestion || !suggestion.id) {
      console.error('Invalid image suggestion:', suggestion);
      return res.status(400).send({ error: 'Invalid image suggestion.' });
    }

    // Mark the image suggestion as liked in the message
    suggestion.liked = true;

    // Reference the image in the images collection
    const imageRef = db.collection('projects').doc(projectId).collection('images').doc(suggestion.id);
    const imageDoc = await imageRef.get();

    // Check if the image exists in the images collection
    if (!imageDoc.exists) {
      console.error(`Image not found in images collection: ${suggestion.id}`);
      return res.status(404).send({ error: 'Image not found in images collection.' });
    }

    // Update the liked attribute in the images collection
    await imageRef.update({ liked: true });
    console.log(`Image marked as liked in images collection: ${suggestion.id}`);

    // Check if the suggestion has a destination (node or category)
    if (!suggestion.destination || suggestion.destination.space === null) {
      // Handle the default case where the image goes into the "Images" category in the conceptual space
      const imagesCollectionRef = db.collection('projects').doc(projectId).collection('conceptual');
      const imagesCategorySnapshot = await imagesCollectionRef.where('title', '==', 'Images').get();

      let imagesCategoryRef;

      if (imagesCategorySnapshot.empty) {
        console.log('Creating "Images" category in conceptual space...');
        imagesCategoryRef = await imagesCollectionRef.add({
          title: 'Images',
          description: 'A collection of liked images.',
          type: 'category',
          createdAt: new Date().toISOString(),
          space: 'conceptual',
          images: [],
        });
      } else {
        imagesCategoryRef = imagesCategorySnapshot.docs[0].ref;
        console.log('"Images" category already exists.');
      }

      console.log('Adding image ID to the images array of "Images" category...');
      await imagesCategoryRef.update({
        images: admin.firestore.FieldValue.arrayUnion(suggestion.id),
      });
    } else {
      // Handle the case where the image is added to a specific node or category
      const { space, categoryId, nodeId } = suggestion.destination;

      if (space && categoryId) {
        const destinationRef = db.collection('projects').doc(projectId).collection(space).doc(categoryId);
        const destinationDoc = await destinationRef.get();

        if (!destinationDoc.exists) {
          console.error('Destination category not found:', suggestion.destination);
          return res.status(404).send({ error: 'Destination category not found.' });
        }

        if (nodeId) {
          // Add to the specified node
          const nodeRef = destinationRef.collection('nodes').doc(nodeId);
          const nodeDoc = await nodeRef.get();

          if (!nodeDoc.exists) {
            console.error('Destination node not found:', suggestion.destination);
            return res.status(404).send({ error: 'Destination node not found.' });
          }

          console.log('Adding image ID to the images array of the specified node...');
          await nodeRef.update({
            images: admin.firestore.FieldValue.arrayUnion(suggestion.id),
          });
        } else {
          // Add to the category directly
          console.log('Adding image ID to the images array of the category...');
          await destinationRef.update({
            images: admin.firestore.FieldValue.arrayUnion(suggestion.id),
          });
        }
      } else {
        console.error('Invalid destination details provided:', suggestion.destination);
        return res.status(400).send({ error: 'Invalid destination details provided.' });
      }
    }

    // Persist the updated suggestions array in the message document
    console.log('Updating suggestions in Firestore...');
    await messageRef.update({ suggestions: messageData.suggestions });

    console.log('Successfully processed /likeImage request.');
    res.status(201).send({ success: true });
  } catch (error) {
    // Handle unexpected errors
    console.error('Error in /likeImage:', error);
    res.status(500).send({ error: error.message });
  }
});



app.post('/likeEntity', async (req, res) => {
  try {
    const { projectId, entityId } = req.body;

    console.log('Received /likeEntity request:', req.body);

    // Validate input
    if (!projectId || !entityId) {
      console.error('Missing required fields:', { projectId, entityId });
      return res.status(400).send({ error: 'Project ID and entity ID are required.' });
    }

    // Reference to the entity document in Firestore
    const entityRef = db.collection('projects').doc(projectId).collection('entities').doc(entityId);

    // Check if the entity exists
    const entityDoc = await entityRef.get();

    if (!entityDoc.exists) {
      console.error(`Entity not found: Project ID: ${projectId}, Entity ID: ${entityId}`);
      return res.status(404).send({ error: 'Entity not found.' });
    }

    // Update the 'liked' attribute to true
    await entityRef.update({ liked: true });

    console.log(`Successfully updated entity with ID ${entityId} to liked.`);
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error in /likeEntity:', error);
    res.status(500).send({ error: error.message });
  }
});


app.post('/likeEntityFromSpace', async (req, res) => {
  try {
    const { projectId, space, categoryId, nodeId, entityIndex } = req.body;

    console.log('Received /likeEntityFromSpace request:', req.body);

    // Validate required fields
    if (!projectId || !space || !categoryId || !nodeId || entityIndex === undefined) {
      console.error('Missing required fields:', { projectId, space, categoryId, nodeId, entityIndex });
      return res.status(400).send({ error: 'Project ID, space, category ID, node ID, and entity index are required.' });
    }

    const nodeRef = db
      .collection('projects')
      .doc(projectId)
      .collection(space)
      .doc(categoryId)
      .collection('nodes')
      .doc(nodeId);

    const nodeDoc = await nodeRef.get();

    if (!nodeDoc.exists) {
      console.error('Node not found:', { space, categoryId, nodeId });
      return res.status(404).send({ error: 'Node not found.' });
    }

    const nodeData = nodeDoc.data();

    if (!nodeData.entities || !Array.isArray(nodeData.entities) || entityIndex >= nodeData.entities.length) {
      console.error('Invalid or missing entities array in node or entity index out of range:', {
        entities: nodeData.entities,
        entityIndex,
      });
      return res.status(400).send({ error: 'Invalid or missing entities array in node or entity index out of range.' });
    }

    const entity = nodeData.entities[entityIndex];

    // Update the 'liked' attribute for the specified entity in the node
    entity.liked = true;

    console.log('Updated entity to liked in node -> entities:', entity);

    // Save the updated entities array back to Firestore
    await nodeRef.update({ entities: nodeData.entities });

    // If the origin is "exploreNode", update the originating message's entities
    if (entity.origin === 'exploreNode') {
      const { messageId, id: entityId } = entity;

      if (!messageId || !entityId) {
        console.error('Missing messageId or entityId for exploreNode origin:', entity);
        return res.status(400).send({ error: 'Invalid entity origin attributes.' });
      }

      const messageRef = db.collection('projects').doc(projectId).collection('chat').doc(messageId);
      const messageDoc = await messageRef.get();

      if (!messageDoc.exists) {
        console.error('Message not found for exploreNode origin:', { messageId, entityId });
        return res.status(404).send({ error: 'Message not found for exploreNode origin.' });
      }

      const messageData = messageDoc.data();

      // Validate the 'entities' field in the message document
      if (!messageData.entities || !Array.isArray(messageData.entities)) {
        console.error('Entities field is missing or not an array in message:', { messageId });
        return res.status(400).send({ error: 'Entities field is missing or not an array in message.' });
      }

      // Locate the entity in the message's 'entities' array
      const entityIndexInMessage = messageData.entities.findIndex(
        (messageEntity) => messageEntity.id === entityId
      );

      if (entityIndexInMessage === -1) {
        console.error('Entity not found in message entities:', { messageId, entityId });
        return res.status(404).send({ error: 'Entity not found in message entities.' });
      }

      // Update the 'liked' attribute in the message's 'entities' array
      messageData.entities[entityIndexInMessage].liked = true;

      console.log(
        'Updated entity in message entities to liked:',
        messageData.entities[entityIndexInMessage]
      );

      // Update the message in Firestore
      await messageRef.update({ entities: messageData.entities });
    }

    console.log('Successfully updated entity in node and, if applicable, in the originating message.');
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error in /likeEntityFromSpace:', error);
    res.status(500).send({ error: error.message });
  }
});


const fetchOntology = async (projectId) => {
  try {
    const materialRef = db.collection('projects').doc(projectId).collection('material');
    const conceptualRef = db.collection('projects').doc(projectId).collection('conceptual');

    // Recursive function to fetch child nodes
    const fetchNodes = async (collectionRef) => {
      const snapshot = await collectionRef.get();
      return Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const childNodesSnapshot = await collectionRef.doc(doc.id).collection('childNodes').get();
          const childNodes = await fetchNodes(collectionRef.doc(doc.id).collection('childNodes')); // Fetch child nodes recursively

          return {
            id: doc.id, // Ensure each node has an ID
            title: data.title,
            description: data.description || '',
            reasoning: data.reasoning || 'No reasoning provided', // Assuming reasoning is available, otherwise fallback
            childNodes, // Include child nodes recursively
          };
        })
      );
    };

    // Fetch categories, nodes, and child nodes for a given reference
    const fetchCategories = async (collectionRef) => {
      const snapshot = await collectionRef.get();
      return Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const nodes = await fetchNodes(collectionRef.doc(doc.id).collection('nodes')); // Fetch nodes for this category
          return {
            title: data.title,
            description: data.description || '',
            nodes, // Include nodes with their child nodes
          };
        })
      );
    };

    // Fetch material and conceptual spaces
    const materialCategories = await fetchCategories(materialRef);
    const conceptualCategories = await fetchCategories(conceptualRef);

    return {
      material: materialCategories,
      conceptual: conceptualCategories,
    };
  } catch (error) {
    console.error('Error fetching ontology:', error);
    throw new Error('Failed to fetch ontology.');
  }
};

const generateAssistantResponse = async (message, ontology, hierarchy) => {
  try {
    let prompt;

    if (hierarchy) {
      // If nodes are attached, focus on the attached nodes
      prompt = `
        You are an assistant for an art project tool. 

        Below is the current ontology for the project:
        ${JSON.stringify(ontology, null, 2)}

        The user has provided the following message:
        "${message}"

        The user has attached the following nodes:
        ${JSON.stringify(hierarchy, null, 2)}

        Your task is to:
        1. Focus strictly on the attached nodes. Your suggestions should be primarily based on how to explore these nodes further in the context of the user's project.
        2. For each attached node, suggest ways to expand or elaborate on it. If the node has child nodes, suggest how they can be explored as well (NEVER make a suggestion with a title that already exists in the ontology).
        3. For each category, node, and child node, assign a "space" attribute:
           - **Material** space should be assigned to tools, mediums, and physical aspects like materials, textures, and art techniques.
           - **Conceptual** space should be assigned to ideas, concepts, emotions, and abstract notions like artistic intent, inspiration, or themes.
           - **If you cannot determine which space it belongs to**, assign it to the **conceptual** space by default.
        4. Ensure that:
           - Any category assigned to the "material" space should contain nodes related to physical aspects or techniques.
           - Any category assigned to the "conceptual" space should contain nodes related to ideas, concepts, or emotional expression.
        5. Return your response in the following JSON format:
        {
          "responseMessage": "Your primary response to the user.",
          "suggestions": [
            {
              "title": "Name of the category",
              "description": "Brief description of the category",
              "reasoning": "Why you suggested this category.",
              "space": "material or conceptual",
              "nodes": [
                {
                  "title": "Name of the node",
                  "description": "Brief description of the node",
                  "reasoning": "Why you suggested this node",
                  "space": "same as parent",
                  "childNodes": [
                    {
                      "title": "Name of the child node",
                      "description": "Brief description of the child node",
                      "reasoning": "Why you suggested this child node",
                      "space": "same as parent"
                    }
                  ]
                }
              ]
            }
          ]
        }
      `;
    } else {
      // If no nodes are attached, focus on the user's message only
      prompt = `
        You are an assistant for an art project tool. 

        Below is the current ontology for the project:
        ${JSON.stringify(ontology, null, 2)}

        The user has provided the following message:
        "${message}"

        Your task is to:
        1. Focus on the user's message and provide suggestions based on the context of the current project.
        2. Suggest categories or nodes that align with the user's message and the existing ontology (NEVER make a suggestion with a title that already exists in the ontology).
        3. For each category, node, and child node, assign a "space" attribute:
           - **Material** space should be assigned to tools, mediums, and physical aspects like materials, textures, and art techniques.
           - **Conceptual** space should be assigned to ideas, concepts, emotions, and abstract notions like artistic intent, inspiration, or themes.
           - **If you cannot determine which space it belongs to**, assign it to the **conceptual** space by default.
        4. Ensure that:
           - Any category assigned to the "material" space should contain nodes related to physical aspects or techniques.
           - Any category assigned to the "conceptual" space should contain nodes related to ideas, concepts, or emotional expression.
        5. Return your response in the following JSON format:
        {
          "responseMessage": "Your primary response to the user.",
          "suggestions": [
            {
              "title": "Name of the category",
              "description": "Brief description of the category",
              "space": "material or conceptual",
              "nodes": [
                {
                  "title": "Name of the node",
                  "description": "Brief description of the node",
                  "reasoning": "Why you suggested this node",
                  "space": "same as parent",
                  "childNodes": [
                    {
                      "title": "Name of the child node",
                      "description": "Brief description of the child node",
                      "reasoning": "Why you suggested this child node",
                      "space": "same as parent"
                    }
                  ]
                }
              ]
            }
          ]
        }
      `;
    }

    // Send the prompt to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: prompt }],
    });

    // Parse and return the assistant's response
    const assistantOutput = response.choices[0].message.content;
    return JSON.parse(assistantOutput);
  } catch (error) {
    console.error('Error generating assistant response:', error);
    throw new Error('Failed to generate assistant response.');
  }
};

app.post('/generate-image', async (req, res) => {
  try {
    const { projectId, prompt, n, attachedHierarchy } = req.body;

    console.log('Received image generation request:', { projectId, prompt, n, attachedHierarchy });

    // Validate required fields
    if (!projectId || !prompt) {
      console.error('Missing projectId or prompt');
      return res.status(400).send({ error: 'Project ID and prompt are required.' });
    }

    // Step 1: Save the user's request message to the Firestore chat collection
    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');
    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: `Generate ${n || 1} image(s) based on: "${prompt}"`,
      timestamp: new Date().toISOString(),
      hierarchy: attachedHierarchy || null, // Save attached hierarchy if provided
    });

    const userMessageId = userMessageRef.id;
    console.log('User message created in Firestore with ID:', userMessageId);

    // Step 2: Generate images using OpenAI API
    console.log('Generating images from OpenAI with prompt:', prompt);
    const openaiResponse = await openai.images.generate({
      prompt,
      n: n || 1,
      size: '256x256',
      response_format: 'b64_json',
    });

    console.log('OpenAI image generation response received:', openaiResponse);

    // Step 3: Upload generated images to imgbb and save metadata
    console.log('Uploading images to imgbb...');
    const imageRecords = await Promise.all(
      openaiResponse.data.map(async (image, index) => {
        try {
          const formData = new FormData();
          formData.append('key', process.env.IMGBB_API_KEY);
          formData.append('image', image.b64_json);

          const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
          });
          console.log(`Image ${index + 1} uploaded to imgbb successfully.`);

          // Generate a unique ID for the image
          const imageId = uuidv4();

          return {
            id: imageId,
            url: imgbbResponse.data.data.url,
            title: `Image ${index + 1}`,
            description: `Generated based on the prompt: "${prompt}"`,
            liked: false,
            reasoning: 'Generated by AI based on user input.',
          };
        } catch (uploadError) {
          console.error(`Error uploading image ${index + 1} to imgbb:`, uploadError.response?.data || uploadError.message);
          throw uploadError;
        }
      })
    );

    console.log('All images uploaded successfully. Image records:', imageRecords);

    // Step 4: Save each image metadata in the `Images` collection under the project
    const imagesCollectionRef = db.collection('projects').doc(projectId).collection('images');
    await Promise.all(
      imageRecords.map((image) =>
        imagesCollectionRef.doc(image.id).set({
          title: image.title,
          description: image.description,
          url: image.url,
          liked: image.liked,
          reasoning: image.reasoning,
          createdAt: new Date().toISOString(),
        })
      )
    );
    console.log('Image metadata saved in the Images collection.');

    // Step 5: Prepare system message with only image references (IDs)
    const systemMessageData = {
      content: `Here are the generated images based on your prompt: "${prompt}"`,
      messageType: 'system',
      timestamp: new Date().toISOString(),
      action: 'images',
      suggestions: imageRecords.map((image) => ({
        id: image.id, // Only include the ID
        destination: attachedHierarchy
          ? {
              space: attachedHierarchy.space || null,
              categoryId: attachedHierarchy.category?.id || null,
              nodeId: attachedHierarchy.node?.id || null,
              childNodeId: attachedHierarchy.childNode?.id || null,
            }
          : null,
      })),
    };

    console.log('Prepared system message data for Firestore:', systemMessageData);

    // Step 6: Save the system message to the Firestore chat collection
    const systemMessageRef = await chatCollectionRef.add(systemMessageData);
    console.log('System message created in Firestore with ID:', systemMessageRef.id);

    // Step 7: Respond with the system message data
    res.status(201).send(systemMessageData);
  } catch (error) {
    console.error('Error handling /generate-image request:', error);
    res.status(500).send({ error: 'Failed to generate images.' });
  }
});


app.post('/likeDefaultSuggestion', async (req, res) => {
  try {
    const { projectId, spaceName, suggestionId, title, description } = req.body;

    if (!projectId || !spaceName || !suggestionId || !title || !description) {
      return res.status(400).send({ error: 'Project ID, space name, suggestion ID, title, and description are required.' });
    }

    // Reference to the suggestion
    const suggestionRef = db
      .collection('projects')
      .doc(projectId)
      .collection('defaultSuggestions')
      .doc(spaceName)
      .collection('items')
      .doc(suggestionId);

    // Fetch the suggestion
    const suggestionDoc = await suggestionRef.get();
    if (!suggestionDoc.exists) {
      return res.status(404).send({ error: 'Suggestion not found.' });
    }

    // Update the 'liked' attribute
    await suggestionRef.update({ liked: true, show: false });

    console.log(`Suggestion ${suggestionId} in ${spaceName} marked as liked.`);

    // Add the category to the appropriate space
    const spaceRef = db.collection('projects').doc(projectId).collection(spaceName);
    const categorySnapshot = await spaceRef.where('title', '==', title).get();

    if (categorySnapshot.empty) {
      // Create a new category if it doesn't exist
      console.log(`Creating category ${title} in ${spaceName}`);
      await spaceRef.add({
        title,
        description,
        type: 'category',
        createdAt: new Date().toISOString(),
      });
    } else {
      console.log(`Category ${title} already exists in ${spaceName}`);
    }

    res.status(200).send({ message: 'Suggestion liked and category added successfully.' });
  } catch (error) {
    console.error('Error in /likeDefaultSuggestion:', error);
    res.status(500).send({ error: error.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
