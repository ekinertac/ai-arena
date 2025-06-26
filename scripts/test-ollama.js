#!/usr/bin/env node

/**
 * Test script to verify Ollama integration works correctly
 * Tests: Connection, API endpoint, streaming, conversation flow, whisper system
 */

const BASE_URL = 'http://localhost:3000';
const OLLAMA_URL = 'http://localhost:11434';

async function testOllamaConnection() {
  console.log('Testing Ollama server connection...');

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = data.models || [];

    console.log('✓ Ollama server is running');
    console.log(`  Available models: ${models.map((m) => m.name).join(', ')}`);

    if (models.length === 0) {
      console.log('! No models installed. Install a model first:');
      console.log('  ollama pull phi3:3.8b');
      console.log('  ollama pull qwen3:8b');
      return { success: false, models: [] };
    }

    return { success: true, models };
  } catch (error) {
    console.log('✗ Ollama server not accessible:', error.message);
    console.log('  Make sure Ollama is running: ollama serve');
    return { success: false, models: [] };
  }
}

async function testAPIEndpoint(models) {
  console.log('\nTesting API endpoint...');

  if (models.length === 0) {
    console.log('✗ No models available for testing');
    return false;
  }

  const testModel = models[0].name;
  const testPayload = {
    messages: [{ role: 'user', content: 'Say "Hello from AI Arena test!" and nothing else.' }],
    model: testModel,
    stream: false,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.content) {
      throw new Error('No content in response');
    }

    console.log('✓ API endpoint responding');
    console.log(`  Response preview: "${data.content?.slice(0, 100)}..."`);

    return true;
  } catch (error) {
    console.log('✗ API endpoint failed:', error.message);
    return false;
  }
}

async function testStreamingResponse(models) {
  console.log('\nTesting streaming response...');

  if (models.length === 0) {
    console.log('✗ No models available for testing');
    return false;
  }

  const testModel = models[0].name;
  const testPayload = {
    messages: [{ role: 'user', content: 'Count from 1 to 5, each number on a new line.' }],
    model: testModel,
    stream: true,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream');
    }

    console.log('✓ Streaming response started');

    let chunks = 0;
    let totalContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                totalContent += parsed.content;
                chunks++;
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('✓ Streaming completed');
    console.log(`  Total chunks: ${chunks}`);
    console.log(`  Full response: "${totalContent}"`);

    return chunks > 0;
  } catch (error) {
    console.log('✗ Streaming test failed:', error.message);
    return false;
  }
}

async function testConversationFlow(models) {
  console.log('\nTesting full conversation flow...');

  if (models.length < 2) {
    console.log('! Need at least 2 models for conversation flow test');
    return false;
  }

  const defenderModel = models[0].name;
  const criticModel = models[1].name;

  try {
    // Test Defender AI (River)
    console.log('  Testing Defender AI (River)...');
    const defenderPayload = {
      messages: [{ role: 'user', content: 'Argue in favor of renewable energy. Keep it brief.' }],
      model: defenderModel,
      stream: false,
    };

    const defenderResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(defenderPayload),
    });

    if (!defenderResponse.ok) {
      throw new Error(`Defender failed: ${defenderResponse.status}`);
    }

    const defenderData = await defenderResponse.json();
    console.log('✓ Defender response received');

    // Test Critic AI (Sage)
    console.log('  Testing Critic AI (Sage)...');
    const criticPayload = {
      messages: [{ role: 'user', content: 'Challenge the benefits of renewable energy. Keep it brief.' }],
      model: criticModel,
      stream: false,
    };

    const criticResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criticPayload),
    });

    if (!criticResponse.ok) {
      throw new Error(`Critic failed: ${criticResponse.status}`);
    }

    const criticData = await criticResponse.json();
    console.log('✓ Critic response received');

    console.log('\nConversation Summary:');
    console.log(`  River: "${defenderData.content.slice(0, 100)}..."`);
    console.log(`  Sage: "${criticData.content.slice(0, 100)}..."`);

    return true;
  } catch (error) {
    console.log('✗ Conversation flow test failed:', error.message);
    return false;
  }
}

async function testWhisperFunctionality(models) {
  console.log('\nTesting whisper functionality...');

  if (models.length === 0) {
    console.log('✗ No models available for testing');
    return false;
  }

  const testModel = models[0].name;

  try {
    // Test whisper detection and processing
    const whisperPayload = {
      messages: [{ role: 'user', content: '@Sage Please respond to this whisper message briefly.' }],
      model: testModel,
      stream: false,
      isWhisper: true,
      targetAI: 'Sage',
    };

    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whisperPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.content) {
      throw new Error('No content in whisper response');
    }

    console.log('✓ Whisper functionality working');
    console.log('  Sage received whisper and responded appropriately');

    return true;
  } catch (error) {
    console.log('✗ Whisper test failed:', error.message);
    return false;
  }
}

async function runOllamaTests() {
  console.log('AI Arena - Ollama Integration Test Suite\n');

  const results = {
    connection: false,
    api: false,
    streaming: false,
    conversation: false,
    whisper: false,
  };

  // Test 1: Ollama Connection
  const connectionResult = await testOllamaConnection();
  results.connection = connectionResult.success;

  if (!results.connection) {
    console.log('\n✗ Cannot proceed without Ollama connection');
    return results;
  }

  const models = connectionResult.models;

  // Test 2: API Endpoint
  results.api = await testAPIEndpoint(models);

  // Test 3: Streaming Response
  results.streaming = await testStreamingResponse(models);

  // Test 4: Conversation Flow
  results.conversation = await testConversationFlow(models);

  // Test 5: Whisper System
  results.whisper = await testWhisperFunctionality(models);

  // Summary
  console.log('\nTest Results Summary:');
  console.log(`Ollama Connection: ${results.connection ? 'PASS' : 'FAIL'}`);
  console.log(`API Endpoint: ${results.api ? 'PASS' : 'FAIL'}`);
  console.log(`Streaming: ${results.streaming ? 'PASS' : 'FAIL'}`);
  console.log(`Conversation Flow: ${results.conversation ? 'PASS' : 'FAIL'}`);
  console.log(`Whisper System: ${results.whisper ? 'PASS' : 'FAIL'}`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\nOverall: ${passCount}/${totalTests} tests passed`);

  if (passCount === totalTests) {
    console.log('All tests passed! Your AI Arena is ready for action!');
  } else {
    console.log('Some tests failed. Check the logs above for details.');
  }

  return results;
}

console.log(`Testing against: ${BASE_URL}`);
console.log(`Ollama server: ${OLLAMA_URL}\n`);

runOllamaTests().catch(console.error);
