# Django-Style Commands for AI Arena

Welcome Django developers! This guide maps familiar Django commands to their AI Arena equivalents using Prisma ORM.

## Command Comparison

| Django Command                    | AI Arena Command         | Description                                |
| --------------------------------- | ------------------------ | ------------------------------------------ |
| `python manage.py help`           | `npm run help`           | Show all available commands                |
| `python manage.py makemigrations` | `npm run makemigrations` | Create migration files from schema changes |
| `python manage.py migrate`        | `npm run migrate`        | Apply migrations to database               |
| `python manage.py showmigrations` | `npm run showmigrations` | Show migration status                      |
| `python manage.py dbshell`        | `npm run dbshell`        | Open database shell/GUI                    |
| `python manage.py shell`          | `npm run shell`          | Open database GUI (Prisma Studio)          |
| `python manage.py runserver`      | `npm run dev`            | Start development server                   |
| `python manage.py test`           | `npm run test:database`  | Run database tests                         |

## Migration Workflow

### Django Way

```bash
# Make changes to models.py
python manage.py makemigrations
python manage.py migrate
python manage.py showmigrations
```

### AI Arena Way

```bash
# Make changes to prisma/schema.prisma
npm run makemigrations
npm run migrate
npm run showmigrations
```

## Database Schema Management

### Django Models → Prisma Schema

**Django (models.py)**

```python
from django.db import models

class Conversation(models.Model):
    title = models.CharField(max_length=200)
    topic = models.TextField()
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    content = models.TextField()
    sender = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_whisper = models.BooleanField(default=False)
```

**Prisma (schema.prisma)**

```prisma
model Conversation {
  id        String   @id @default(cuid())
  title     String
  topic     String
  status    ConversationStatus @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id             String      @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  content        String
  sender         MessageSender
  timestamp      DateTime    @default(now())
  isWhisper      Boolean     @default(false)
}
```

## Database Operations

### Django ORM → Prisma Client

**Django QuerySet**

```python
# Create
conversation = Conversation.objects.create(
    title="AI Debate",
    topic="Climate Change"
)

# Read
conversations = Conversation.objects.all()
conversation = Conversation.objects.get(id=1)

# Update
conversation.status = 'PAUSED'
conversation.save()

# Delete
conversation.delete()

# Filter
active_conversations = Conversation.objects.filter(status='ACTIVE')
```

**Prisma Client**

```javascript
// Create
const conversation = await prisma.conversation.create({
  data: {
    title: 'AI Debate',
    topic: 'Climate Change',
  },
});

// Read
const conversations = await prisma.conversation.findMany();
const conversation = await prisma.conversation.findUnique({
  where: { id: 1 },
});

// Update
const updated = await prisma.conversation.update({
  where: { id: conversation.id },
  data: { status: 'PAUSED' },
});

// Delete
await prisma.conversation.delete({
  where: { id: conversation.id },
});

// Filter
const activeConversations = await prisma.conversation.findMany({
  where: { status: 'ACTIVE' },
});
```

## Environment Setup

### Django Settings → Environment Variables

**Django (settings.py)**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ai_arena',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**AI Arena (.env)**

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_arena"
```

## Migration Files

### Django Migration → Prisma Migration

**Django Migration**

```python
# migrations/0001_initial.py
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('id', models.AutoField(primary_key=True)),
                ('title', models.CharField(max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
```

**Prisma Migration**

```sql
-- prisma/migrations/20231201000000_init/migration.sql
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
```

## Testing

### Django Tests → AI Arena Tests

**Django Test**

```python
from django.test import TestCase
from .models import Conversation

class ConversationTestCase(TestCase):
    def test_create_conversation(self):
        conversation = Conversation.objects.create(
            title="Test Debate",
            topic="Testing"
        )
        self.assertEqual(conversation.title, "Test Debate")
```

**AI Arena Test**

```javascript
// scripts/test-database.js
async function testCreateConversation() {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Debate',
      topic: 'Testing',
    }),
  });
  const data = await response.json();
  console.log('✅ Conversation created:', data.conversation.title);
}
```

## Admin Interface

### Django Admin → Prisma Studio

**Django Admin**

```python
# admin.py
from django.contrib import admin
from .models import Conversation, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'topic']
```

**Prisma Studio**

```bash
# Open visual database editor
npm run dbshell
# or
npm run shell
```

## Production Deployment

### Django → AI Arena

**Django**

```bash
python manage.py collectstatic
python manage.py migrate --run-syncdb
gunicorn myproject.wsgi:application
```

**AI Arena**

```bash
npm run generate
npm run migrate:deploy
npm run build
npm start
```

## Key Differences

| Aspect                | Django            | AI Arena (Prisma)         |
| --------------------- | ----------------- | ------------------------- |
| **Schema Definition** | Python classes    | Prisma Schema Language    |
| **Migrations**        | Python files      | SQL files                 |
| **Query Language**    | Django ORM        | Prisma Client             |
| **Admin Interface**   | Django Admin      | Prisma Studio             |
| **Database Support**  | Multiple backends | PostgreSQL, MySQL, SQLite |
| **Type Safety**       | Runtime           | Compile-time (TypeScript) |

## Tips for Django Developers

1. **Schema First**: Unlike Django's model-first approach, Prisma uses schema-first development
2. **Type Safety**: Prisma generates TypeScript types automatically
3. **Migrations**: Prisma migrations are more explicit and SQL-based
4. **Relationships**: Defined in schema, not in separate model files
5. **Queries**: More functional programming style vs Django's OOP approach

## Getting Help

- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
- **Migration Guide**: See `MIGRATION-TO-POSTGRESQL.md`
- **Django to Prisma**: [prisma.io/docs/guides/migrate-from-django](https://prisma.io/docs/guides/migrate-from-django)

Welcome to the AI Arena! Your Django experience will serve you well here. 🚀
