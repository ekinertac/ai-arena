const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const conversationId = 'cmccyzt2z0003jjekqe01eckb';

  console.log(`🔍 Searching for the first message from River (defender) in conversation ${conversationId}...`);

  const message = await prisma.message.findFirst({
    where: {
      conversationId: conversationId,
      sender: 'DEFENDER', // River is the defender
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  if (message) {
    console.log('✅ Found message. Raw content:');
    console.log('--- START OF MESSAGE ---');
    console.log(message.content);
    console.log('--- END OF MESSAGE ---');
  } else {
    console.log(`❌ Message not found for conversation ${conversationId} from sender 'DEFENDER'.`);
  }
}

main()
  .catch((e) => {
    console.error('An error occurred while fetching the message:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
