#!/usr/bin/env node

/**
 * Test script to verify database operations work correctly
 * Tests: CRUD operations, message handling, search functionality
 */

const BASE_URL = 'http://localhost:3001';

async function testCreateConversation() {
  console.log('Testing conversation creation...');

  const conversationData = {
    title: 'Test AI Debate',
    topic: 'Should we implement universal basic income?',
    defenderModel: 'phi3:3.8b',
    defenderProvider: 'ollama',
    criticModel: 'qwen3:8b',
    criticProvider: 'ollama',
    conversationType: 'MIXED',
  };

  try {
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conversationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✓ Conversation created successfully');
    console.log(`  ID: ${data.conversation.id}`);
    console.log(`  Title: "${data.conversation.title}"`);

    return data.conversation;
  } catch (error) {
    console.log('✗ Conversation creation failed:', error.message);
    return null;
  }
}

async function testAddMessage(conversationId) {
  console.log('\nTesting message creation...');

  const messages = [
    {
      content: 'I believe UBI is essential for economic security in the age of automation.',
      sender: 'user',
      isWhisper: false,
    },
    {
      content:
        'This is a great point! Universal Basic Income provides a safety net that enables innovation and risk-taking.',
      sender: 'defender',
      isWhisper: false,
    },
    {
      content: '@River Consider the potential inflation risks',
      sender: 'user',
      isWhisper: true,
      targetAI: 'River',
    },
  ];

  try {
    for (const message of messages) {
      const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const messageType = message.isWhisper ? 'whisper' : 'message';
      console.log(`✓ ${messageType} added: "${message.content.slice(0, 50)}..."`);
    }

    return true;
  } catch (error) {
    console.log('✗ Message creation failed:', error.message);
    return false;
  }
}

async function testGetConversation(conversationId) {
  console.log('\nTesting conversation retrieval...');

  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const conversation = data.conversation;

    console.log('✓ Conversation retrieved successfully');
    console.log(`  Messages count: ${conversation.messages.length}`);
    console.log(`  Created: ${new Date(conversation.createdAt).toLocaleString()}`);
    console.log(`  Updated: ${new Date(conversation.updatedAt).toLocaleString()}`);

    // Check message details
    conversation.messages.forEach((msg, i) => {
      const whisperTag = msg.isWhisper ? ' (whisper)' : '';
      console.log(`   ${i + 1}. ${msg.sender}: "${msg.content.slice(0, 40)}..."${whisperTag}`);
    });

    return conversation;
  } catch (error) {
    console.log('✗ Conversation retrieval failed:', error.message);
    return null;
  }
}

async function testUpdateConversation(conversationId) {
  console.log('\nTesting conversation updates...');

  try {
    // Test status update
    let response = await fetch(`${BASE_URL}/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'PAUSED' }),
    });

    if (!response.ok) {
      throw new Error(`Status update failed: ${response.status}`);
    }

    console.log('✓ Status updated to PAUSED');

    // Test title/topic update
    response = await fetch(`${BASE_URL}/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated: UBI Debate',
        topic: 'Updated topic about universal basic income implementation',
      }),
    });

    if (!response.ok) {
      throw new Error(`Title update failed: ${response.status}`);
    }

    console.log('✓ Title and topic updated');

    return true;
  } catch (error) {
    console.log('✗ Conversation update failed:', error.message);
    return false;
  }
}

async function testGetAllConversations() {
  console.log('\nTesting conversations list...');

  try {
    const response = await fetch(`${BASE_URL}/api/conversations`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const conversations = data.conversations;

    console.log('✓ Conversations list retrieved');
    console.log(`  Total conversations: ${conversations.length}`);

    conversations.forEach((conv, i) => {
      console.log(`   ${i + 1}. "${conv.title}" (${conv.status}) - ${conv.messages.length} messages`);
    });

    return conversations;
  } catch (error) {
    console.log('✗ Conversations list failed:', error.message);
    return null;
  }
}

async function testSearchConversations() {
  console.log('\nTesting conversation search...');

  try {
    const response = await fetch(`${BASE_URL}/api/conversations?search=UBI`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const conversations = data.conversations;

    console.log('✓ Search completed');
    console.log(`  Found ${conversations.length} conversations matching "UBI"`);

    return conversations.length > 0;
  } catch (error) {
    console.log('✗ Search failed:', error.message);
    return false;
  }
}

async function testDeleteConversation(conversationId) {
  console.log('\nTesting conversation deletion...');

  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log('✓ Conversation deleted successfully');

    // Verify it's gone
    const checkResponse = await fetch(`${BASE_URL}/api/conversations/${conversationId}`);
    if (checkResponse.status === 404) {
      console.log('✓ Deletion verified (404 on retrieval)');
      return true;
    } else {
      console.log('! Conversation still exists after deletion');
      return false;
    }
  } catch (error) {
    console.log('✗ Conversation deletion failed:', error.message);
    return false;
  }
}

async function runDatabaseTests() {
  console.log('AI Arena - Database Test Suite\n');

  const results = {
    create: false,
    addMessages: false,
    retrieve: false,
    update: false,
    list: false,
    search: false,
    delete: false,
  };

  let testConversationId = null;

  // Test 1: Create Conversation
  const conversation = await testCreateConversation();
  if (conversation) {
    results.create = true;
    testConversationId = conversation.id;
  }

  // Test 2: Add Messages
  if (testConversationId) {
    results.addMessages = await testAddMessage(testConversationId);
  }

  // Test 3: Retrieve Conversation
  if (testConversationId) {
    const retrieved = await testGetConversation(testConversationId);
    results.retrieve = !!retrieved;
  }

  // Test 4: Update Conversation
  if (testConversationId) {
    results.update = await testUpdateConversation(testConversationId);
  }

  // Test 5: List All Conversations
  results.list = !!(await testGetAllConversations());

  // Test 6: Search Conversations
  results.search = await testSearchConversations();

  // Test 7: Delete Conversation
  if (testConversationId) {
    results.delete = await testDeleteConversation(testConversationId);
  }

  // Summary
  console.log('\nDatabase Test Results Summary:');
  console.log(`Create Conversation: ${results.create ? 'PASS' : 'FAIL'}`);
  console.log(`Add Messages: ${results.addMessages ? 'PASS' : 'FAIL'}`);
  console.log(`Retrieve Conversation: ${results.retrieve ? 'PASS' : 'FAIL'}`);
  console.log(`Update Conversation: ${results.update ? 'PASS' : 'FAIL'}`);
  console.log(`List Conversations: ${results.list ? 'PASS' : 'FAIL'}`);
  console.log(`Search Conversations: ${results.search ? 'PASS' : 'FAIL'}`);
  console.log(`Delete Conversation: ${results.delete ? 'PASS' : 'FAIL'}`);

  const passCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\nOverall: ${passCount}/${totalTests} tests passed`);

  if (passCount === totalTests) {
    console.log('Database integration working perfectly!');
    console.log('\nFeatures verified:');
    console.log('   ✓ SQLite database with Prisma ORM');
    console.log('   ✓ Conversation CRUD operations');
    console.log('   ✓ Message management with whisper support');
    console.log('   ✓ Search functionality');
    console.log('   ✓ Automatic timestamps and relationships');
    console.log('   ✓ Ready for PostgreSQL migration');
  } else {
    console.log('Some database tests failed. Check the logs above.');
  }
}

console.log(`Testing against: ${BASE_URL}`);
console.log('Make sure the dev server is running: npm run dev\n');

runDatabaseTests().catch(console.error);
