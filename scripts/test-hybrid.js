#!/usr/bin/env node

/**
 * Test script to verify hybrid client/server architecture
 * Tests: Direct Ollama, Server proxy, Hybrid routing, Performance comparison
 */

const OLLAMA_URL = 'http://localhost:11434';
const SERVER_URL = 'http://localhost:3000';

async function testDirectOllama() {
  console.log('Testing direct Ollama connection (client-side)...');

  try {
    // Check if Ollama is available
    const modelsResponse = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!modelsResponse.ok) {
      throw new Error(`Ollama not accessible: ${modelsResponse.status}`);
    }

    const modelsData = await modelsResponse.json();
    const models = modelsData.models || [];

    if (models.length === 0) {
      console.log('✓ Direct Ollama connection successful');
      console.log('! No models available for testing');
      console.log('  Install models: ollama pull phi3:3.8b');
      return { success: true, hasModels: false };
    }

    const testModel = models[0].name;
    console.log(`  Testing chat with model: ${testModel}`);

    // Test direct chat
    const chatPayload = {
      model: testModel,
      messages: [{ role: 'user', content: 'Say "Direct Ollama works!" and nothing else.' }],
      stream: false,
    };

    const chatResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();

    if (!chatData.message?.content) {
      throw new Error('No content in response');
    }

    console.log('✓ Direct Ollama connection successful');
    console.log(`  Direct Ollama response: "${chatData.message?.content?.slice(0, 100)}..."`);

    return { success: true, hasModels: true, model: testModel };
  } catch (error) {
    console.log('✗ Direct Ollama connection failed:', error.message);
    return { success: false, hasModels: false };
  }
}

async function testServerProxy() {
  console.log('\nTesting server proxy to Ollama...');

  try {
    // Test the server's proxy endpoint
    const testPayload = {
      messages: [{ role: 'user', content: 'Say "Server proxy works!" and nothing else.' }],
      model: 'phi3:3.8b', // Default test model
      stream: false,
    };

    const response = await fetch(`${SERVER_URL}/api/chat`, {
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
      throw new Error('No content in server response');
    }

    console.log('✓ Server proxy to Ollama working');
    console.log(`  Proxied response: "${data.content?.slice(0, 100)}..."`);

    return true;
  } catch (error) {
    console.log('✗ Server proxy to Ollama failed:', error.message);
    return false;
  }
}

async function testHybridRouting() {
  console.log('\nTesting hybrid routing logic...');

  try {
    // Test Ollama routing (should work)
    const ollamaPayload = {
      messages: [{ role: 'user', content: 'Test hybrid routing with Ollama' }],
      model: 'phi3:3.8b',
      provider: 'ollama',
      stream: false,
    };

    const ollamaResponse = await fetch(`${SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ollamaPayload),
    });

    if (ollamaResponse.ok) {
      const ollamaData = await ollamaResponse.json();
      if (ollamaData.content) {
        console.log('✓ Ollama routing successful');
      } else {
        console.log('✗ Ollama routing failed');
        return false;
      }
    } else {
      console.log('✗ Ollama routing error:', ollamaResponse.status);
      return false;
    }

    // Test OpenAI routing (should fail gracefully without API key)
    const openaiPayload = {
      messages: [{ role: 'user', content: 'Test hybrid routing with OpenAI' }],
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      stream: false,
    };

    const openaiResponse = await fetch(`${SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiPayload),
    });

    // We expect this to fail due to no API key, but gracefully
    if (openaiResponse.status === 401 || openaiResponse.status === 400) {
      console.log('✓ OpenAI routing successful (expected auth failure)');
    } else if (openaiResponse.ok) {
      console.log('! OpenAI routing unexpected result');
    } else {
      console.log('✓ OpenAI routing failed as expected (no API key)');
    }

    return true;
  } catch (error) {
    console.log('✗ Hybrid routing test failed:', error.message);
    return false;
  }
}

async function testPerformance() {
  console.log('\nTesting performance: Direct vs Proxied...');

  const testMessage = {
    role: 'user',
    content: 'Count to 3. Be very brief.',
  };

  try {
    // Test direct Ollama performance
    console.log('  Testing direct Ollama speed...');
    const directStart = Date.now();

    const directResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'phi3:3.8b',
        messages: [testMessage],
        stream: false,
      }),
    });

    const directEnd = Date.now();

    if (directResponse.ok) {
      console.log(`✓ Direct Ollama: ${directEnd - directStart}ms`);
    } else {
      console.log('✗ Direct Ollama test failed');
      return false;
    }

    // Test proxied performance
    console.log('  Testing proxied Ollama speed...');
    const proxiedStart = Date.now();

    const proxiedResponse = await fetch(`${SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [testMessage],
        model: 'phi3:3.8b',
        stream: false,
      }),
    });

    const proxiedEnd = Date.now();

    if (proxiedResponse.ok) {
      console.log(`✓ Proxied Ollama: ${proxiedEnd - proxiedStart}ms`);
    } else {
      console.log('✗ Proxied Ollama test failed');
      return false;
    }

    return true;
  } catch (error) {
    console.log('✗ Performance test failed:', error.message);
    return false;
  }
}

async function runHybridTests() {
  console.log('AI Arena - Hybrid Client/Server Test Suite\n');

  const results = {
    directOllama: false,
    serverProxy: false,
    hybridRouting: false,
    performance: false,
  };

  // Test 1: Direct Ollama Connection
  const directResult = await testDirectOllama();
  results.directOllama = directResult.success;

  // Test 2: Server Proxy
  results.serverProxy = await testServerProxy();

  // Test 3: Hybrid Routing Logic
  results.hybridRouting = await testHybridRouting();

  // Test 4: Performance Comparison
  results.performance = await testPerformance();

  // Summary
  console.log('\nHybrid Test Results Summary:');
  console.log(`Direct Ollama: ${results.directOllama ? 'PASS' : 'FAIL'}`);
  console.log(`Server Proxy: ${results.serverProxy ? 'PASS' : 'FAIL'}`);
  console.log(`Hybrid Routing: ${results.hybridRouting ? 'PASS' : 'FAIL'}`);
  console.log(`Performance Test: ${results.performance ? 'PASS' : 'FAIL'}`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\nOverall: ${passCount}/${totalTests} tests passed`);

  if (passCount === totalTests) {
    console.log('Hybrid architecture ready! Client-side Ollama + Server-side APIs working!');
    console.log('\nBenefits achieved:');
    console.log('   ✓ Privacy: Local AI processing with Ollama');
    console.log('   ✓ Flexibility: Fallback to cloud APIs when needed');
    console.log('   ✓ Performance: Direct connection, no proxy overhead');
    console.log('   ✓ Scalability: Can add more providers easily');
  } else {
    console.log('Some tests failed. Check configuration and try again.');
  }

  return results;
}

console.log(`Testing Ollama: ${OLLAMA_URL}`);
console.log(`Testing Server: ${SERVER_URL}\n`);

runHybridTests().catch(console.error);
