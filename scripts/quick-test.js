#!/usr/bin/env node

/**
 * Quick test script for specific scenarios
 * Usage: node scripts/quick-test.js [topic] [defender-model] [critic-model]
 */

const BASE_URL = 'http://localhost:3000';

async function quickTest(topic, defenderModel = 'phi3:3.8b', criticModel = 'qwen3:8b') {
  console.log(`🚀 Quick Test: "${topic}"`);
  console.log(`🛡️  Defender (River): ${defenderModel}`);
  console.log(`⚔️  Critic (Sage): ${criticModel}\n`);

  const messages = [
    {
      id: '1',
      content: topic,
      sender: 'user',
      timestamp: new Date().toISOString(),
    },
  ];

  try {
    // Get defender response
    const defenderPayload = {
      messages,
      currentTurn: 'defender',
      topic: topic,
      providers: {
        defender: { provider: 'ollama', model: defenderModel },
        critic: { provider: 'ollama', model: criticModel },
      },
    };

    console.log('🛡️  River is thinking...');
    const defenderResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defenderPayload),
    });

    if (!defenderResponse.ok) {
      throw new Error(`Defender failed: ${defenderResponse.status}`);
    }

    const defenderData = await defenderResponse.json();
    console.log(`🛡️  River: ${defenderData.content}\n`);

    // Add to conversation and get critic response
    messages.push({
      id: '2',
      content: defenderData.content,
      sender: 'defender',
      timestamp: new Date().toISOString(),
    });

    const criticPayload = {
      messages,
      currentTurn: 'critic',
      topic: topic,
      providers: {
        defender: { provider: 'ollama', model: defenderModel },
        critic: { provider: 'ollama', model: criticModel },
      },
    };

    console.log('⚔️  Sage is thinking...');
    const criticResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criticPayload),
    });

    if (!criticResponse.ok) {
      throw new Error(`Critic failed: ${criticResponse.status}`);
    }

    const criticData = await criticResponse.json();
    console.log(`⚔️  Sage: ${criticData.content}\n`);

    console.log('✅ Quick test completed successfully!');
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const topic = args[0] || 'Artificial Intelligence will revolutionize education';
const defenderModel = args[1] || 'phi3:3.8b';
const criticModel = args[2] || 'qwen3:8b';

quickTest(topic, defenderModel, criticModel).catch(console.error);
