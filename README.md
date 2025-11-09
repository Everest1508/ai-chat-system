# AI Chat Portal

A modern, full-stack AI chat application with multi-provider support, conversation intelligence, and a beautiful user interface. Built with Django REST Framework and Next.js.

![AI Chat Portal](https://img.shields.io/badge/AI-Chat%20Portal-blue?style=for-the-badge)
![Django](https://img.shields.io/badge/Django-5.2.8-green?style=for-the-badge&logo=django)
![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

## Features

### Multi-Provider AI Support
- **Google Gemini** - 60 req/min, 1,500/day (free tier)
- **Groq** - 30 req/min, 14,400/day (free tier) **Recommended**
- **Cohere** - 100 req/min (free trial)
- Easy provider switching with user API keys
- Custom model selection per provider

### Conversation Management
- Real-time AI chat with markdown rendering
- Conversation history and persistence
- Edit conversation titles
- Delete conversations with confirmation modals
- Conversation summaries for ended chats
- Search conversations with AI-powered search

### Modern UI/UX
- **Glassmorphism design** with backdrop blur effects
- **Smooth animations** and micro-interactions
- **Gradient buttons** with hover effects
- **Responsive design** - Mobile-optimized
- **Skeleton loaders** for better loading experience
- **Custom scrollbars** with gradient styling
- **Dark/light theme** support

### Authentication & Security
- JWT-based authentication
- Secure session persistence
- User profile management
- API key management per user

### Dashboard & Analytics
- AI configuration management
- Usage statistics
- Profile editing
- Provider preferences

### Intelligence Features
- Conversation summarization
- AI-powered search
- Embedding-based similarity search
- Conversation analysis

## Tech Stack

### Backend
- **Django 5.2.8** - Web framework
- **Django REST Framework** - API development
- **djangorestframework-simplejwt** - JWT authentication
- **Google Generative AI** - Gemini integration
- **Groq** - Fast LLM inference
- **Cohere** - Alternative AI provider
- **SQLite/PostgreSQL** - Database

### Frontend
- **Next.js 15.1.0** - React framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **react-markdown** - Markdown rendering
- **React 18** - UI library

## Prerequisites

- **Python 3.12+**
- **Node.js 18+** and npm
- **API Keys** (at least one):
  - [Google Gemini API Key](https://makersuite.google.com/app/apikey)
  - [Groq API Key](https://console.groq.com/) (Recommended)
  - [Cohere API Key](https://dashboard.cohere.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-chat
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env

# Edit .env file with your API keys
# At minimum, set:
# - SECRET_KEY (generate a random key)
# - AI_PROVIDER (groq, gemini, or cohere)
# - API keys for your chosen provider(s)
```

### 3. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 4. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

## Configuration

### Environment Variables (.env)

Create a `.env` file in the `backend` directory:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# AI Provider (choose one: 'gemini', 'groq', 'cohere')
AI_PROVIDER=groq

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key-here
AI_MODEL=models/gemini-2.5-flash
EMBEDDING_MODEL=models/embedding-001

# Groq (Recommended)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile

# Cohere
COHERE_API_KEY=your-cohere-api-key-here
COHERE_MODEL=command-r-08-2024

# AI Settings
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2048

# Embedding Configuration
ENABLE_EMBEDDINGS=True
EMBEDDINGS_REQUIRED=False

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Generate Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python manage.py runserver
```

Backend will run on `http://localhost:8000`

### Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/users/register/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/users/login/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "access": "jwt-access-token",
  "refresh": "jwt-refresh-token"
}
```

### Conversation Endpoints

#### Create Conversation
```http
POST /api/conversations/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "My New Conversation"
}
```

#### Get Conversations
```http
GET /api/conversations/
Authorization: Bearer {access_token}
```

#### Get Conversation Details
```http
GET /api/conversations/{id}/
Authorization: Bearer {access_token}
```

#### Send Message
```http
POST /api/conversations/{id}/messages/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "Hello, AI!"
}
```

#### End Conversation
```http
POST /api/conversations/{id}/end/
Authorization: Bearer {access_token}
```

#### Search Conversations
```http
GET /api/conversations/search/?query=python&limit=10
Authorization: Bearer {access_token}
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile/
Authorization: Bearer {access_token}
```

#### Update Profile
```http
PUT /api/users/profile/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com"
}
```

#### Set API Key
```http
POST /api/users/api-keys/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "provider": "groq",
  "api_key": "your-api-key-here"
}
```

#### Update Preferences
```http
PUT /api/users/preferences/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "preferred_provider": "groq",
  "preferred_model": "llama-3.3-70b-versatile"
}
```

### Postman Collection

Import the `AI_Chat_Portal.postman_collection.json` file into Postman for easy API testing.

## Project Structure

```
ai-chat/
├── backend/
│   ├── ai_service/          # AI service layer
│   │   ├── services/
│   │   │   ├── chat_service.py
│   │   │   ├── multi_model_service.py
│   │   │   ├── intelligence_service.py
│   │   │   └── embedding_service.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── conversations/        # Conversation management
│   │   ├── models.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── user/                 # User management
│   │   ├── models.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── core/                 # Django settings
│   │   ├── settings.py
│   │   └── urls.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── (auth)/       # Auth pages
│   │   │   ├── chat/         # Chat interface
│   │   │   ├── conversations/# Conversations list
│   │   │   └── dashboard/    # User dashboard
│   │   ├── components/       # React components
│   │   │   ├── SidebarLayout.tsx
│   │   │   └── skeletons/    # Loading skeletons
│   │   ├── features/         # Redux slices
│   │   │   ├── auth/
│   │   │   └── conversations/
│   │   └── lib/              # Utilities
│   │       ├── api.ts
│   │       └── store.ts
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

## Key Features in Detail

### Multi-Provider AI Support

The application supports multiple AI providers, allowing users to:
- Choose their preferred provider (Gemini, Groq, or Cohere)
- Use their own API keys for better rate limits
- Switch providers on the fly
- Select specific models per provider

### Conversation Intelligence

- **Summarization**: Automatically generate summaries for ended conversations
- **Search**: AI-powered semantic search across all conversations
- **Analysis**: Get insights about conversation topics and sentiment

### Modern UI Components

- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Gradient Buttons**: Beautiful gradient buttons with hover animations
- **Skeleton Loaders**: Smooth loading states
- **Responsive Design**: Mobile-first approach
- **Custom Scrollbars**: Styled scrollbars with gradients

## Development

### Running Tests

```bash
# Backend 
cd backend
python manage.py runserver 8000

# Frontend 
cd frontend
npm run dev
```

### Code Formatting

```bash
# Backend (using black if configured)
black backend/

# Frontend
cd frontend
npm run lint
```

## Troubleshooting

### Backend Issues

1. **Module not found errors**: Ensure virtual environment is activated
2. **Database errors**: Run `python manage.py migrate`
3. **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in settings.py
4. **API key errors**: Verify API keys in `.env` file

### Frontend Issues

1. **Build errors**: Delete `node_modules` and `package-lock.json`, then `npm install`
2. **API connection errors**: Verify backend is running on port 8000
3. **Authentication errors**: Check JWT token in localStorage

---

**Built with Django and Next.js**

