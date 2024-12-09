require('dotenv').config();

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;
const FormData = require('form-data');

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

    console.log('Received payload:', { projectId, message, nodeReferences });

    if (!projectId || !message) {
      return res.status(400).send({ error: 'Project ID and message are required.' });
    }

    // Ensure nodeReferences is an array
    const references = Array.isArray(nodeReferences) ? nodeReferences : [];

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
      linkedNodes: references,
    });

    // Step 3: Generate assistant response with emphasis on attached nodes (if any)
    let assistantResponse;
    try {
      assistantResponse = await generateAssistantResponse(message, ontology, references);
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

const generateAssistantResponse = async (message, ontology, nodeReferences) => {
  try {
    let prompt;

    if (nodeReferences && nodeReferences.length > 0) {
      // If nodes are attached, focus on the attached nodes
      prompt = `
        You are an assistant for an art project tool. 

        Below is the current ontology for the project:
        ${JSON.stringify(ontology, null, 2)}

        The user has provided the following message:
        "${message}"

        The user has attached the following nodes:
        ${JSON.stringify(nodeReferences, null, 2)}

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
    const { projectId, prompt, n, attachedNodes } = req.body;

    // Debugging: Log the request body
    console.log('Received image generation request:', { projectId, prompt, n, attachedNodes });

    if (!projectId || !prompt) {
      console.error('Missing projectId or prompt');
      return res.status(400).send({ error: 'Project ID and prompt are required.' });
    }

    // Step 1: Save user message to Firestore
    console.log('Saving user message to Firestore...');
    const chatCollectionRef = db.collection('projects').doc(projectId).collection('chat');
    const userMessageRef = await chatCollectionRef.add({
      messageType: 'user',
      content: `Generate ${n || 1} image(s) based on: "${prompt}"`,
      timestamp: new Date().toISOString(),
      linkedNodes: attachedNodes || [],
    });

    const userMessageId = userMessageRef.id;
    console.log('User message created in Firestore with ID:', userMessageId);

    // Step 2: Generate images with OpenAI
    console.log('Generating images from OpenAI with prompt:', prompt);
    const openaiResponse = await openai.images.generate({
      prompt,
      n: n || 1, // Default to 1 image
      size: '256x256',
      response_format: 'b64_json', // Ensure base64 format
    });

    console.log('OpenAI image generation response received:', openaiResponse);

    // Step 3: Upload images to imgbb and collect URLs
    console.log('Uploading images to imgbb...');
    const imageUrls = await Promise.all(
      openaiResponse.data.map(async (image, index) => {
        try {
          const formData = new FormData();
          formData.append('key', process.env.IMGBB_API_KEY);
          formData.append('image', image.b64_json); // Base64 data from OpenAI

          const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders(),
          });
          console.log(`Image ${index + 1} uploaded to imgbb successfully.`);
          return {
            url: imgbbResponse.data.data.url, // Extract URL from the response
            title: `Image ${index + 1}`,
            liked: false,
          };
        } catch (uploadError) {
          console.error(`Error uploading image ${index + 1} to imgbb:`, uploadError.response?.data || uploadError.message);
          throw uploadError;
        }
      })
    );

    console.log('All images uploaded successfully. Image URLs:', imageUrls);

    // Step 4: Prepare Firestore chat entity for system response
    const chatData = {
      content: `Here are the generated images based on your prompt: "${prompt}"`,
      messageType: 'system',
      timestamp: new Date().toISOString(),
      suggestions: imageUrls.map((image) => ({
        title: image.title,
        description: `Generated based on the prompt: "${prompt}"`,
        id: uuidv4(), // Unique ID
        reasoning: 'Generated by AI based on user input.',
        space: 'material', // Assuming these are related to the material space
        url: image.url,
        liked: image.liked,
      })),
    };

    // Debugging: Log the chatData structure
    console.log('Prepared system message data for Firestore:', chatData);

    // Step 5: Save system response to Firestore
    console.log('Saving generated image data to Firestore...');
    const systemMessageRef = await chatCollectionRef.add(chatData);

    console.log('System message created in Firestore with ID:', systemMessageRef.id);

    // Step 6: Send response back to the client
    res.status(201).send(chatData);
  } catch (error) {
    // Debugging: Log the full error
    console.error('Error handling generate-image request:', error);
    res.status(500).send({ error: 'Failed to generate images.' });
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
