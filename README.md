<div align="center">
  <img src="client/public/favicon.svg" alt="Nexora Logo" width="120" height="120">
  
  # Nexora - AI Content Creation Platform
  
  <p align="center">
    <strong>Transform your content creation with our suite of premium AI tools</strong>
  </p>
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#demo">Demo</a> •
    <a href="#installation">Installation</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#contributing">Contributing</a>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/React-19.x-blue?style=flat-square&logo=react" alt="React">
    <img src="https://img.shields.io/badge/Node.js-22.x-green?style=flat-square&logo=node.js" alt="Node.js">
    <img src="https://img.shields.io/badge/PostgreSQL-Latest-blue?style=flat-square&logo=postgresql" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
  </p>
</div>

---

## 🌟 **Overview**

Nexora is a comprehensive AI-powered SaaS platform that revolutionizes content creation. Built with modern technologies and powered by cutting-edge AI APIs, Nexora provides users with a suite of tools to generate articles, create images, enhance content, and much more.

### ✨ **Why Nexora?**

- **🤖 AI-Powered**: Leverage the latest AI technologies including Gemini and ClipDrop
- **🎨 Modern UI/UX**: Beautiful, responsive design built with Tailwind CSS
- **🔐 Secure Authentication**: Powered by Clerk with premium plan support
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile
- **⚡ Fast & Reliable**: Built with performance and scalability in mind

---

## 🚀 **Features**

### 📝 **Content Creation**

- **AI Article Writer**: Generate high-quality, engaging articles on any topic
- **Blog Title Generator**: Create catchy, SEO-friendly blog titles
- **Resume Reviewer**: Get AI-powered feedback on your resume

### 🎨 **Image Tools**

- **AI Image Generation**: Create stunning visuals with text prompts
- **Background Removal**: Remove backgrounds from images effortlessly
- **Object Removal**: Seamlessly remove unwanted objects from photos

### 👥 **Community & Social**

- **Community Gallery**: Share and discover AI-generated content
- **Like System**: Engage with community creations
- **User Dashboard**: Track your creations and usage

---

## ⚡ **Quick Start**

### 1. **Clone the Repository**

```bash
git clone https://github.com/yourusername/nexora.git
cd nexora
```

### 2. **Install Dependencies**

Frontend:

```
cd client
npm install
```

Backend:

```
cd server
npm install
```

### 3. **Environment Setup**

Frontend(.env):

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:3000
```

Backend (.env):

```
# Database
DATABASE_URL=your_postgresql_connection_string

# Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Services
NEXORA_GEMINI_API_KEY=your_gemini_api_key
CLIPDROP_API_KEY=your_clipdrop_api_key

# Image Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. **Database Setup**

Create the required tables in your PostgreSQL database:

```
CREATE TABLE creations (
id SERIAL PRIMARY KEY,
user_id VARCHAR(255) NOT NULL,
prompt TEXT NOT NULL,
content TEXT NOT NULL,
type VARCHAR(50) NOT NULL,
publish BOOLEAN DEFAULT FALSE,
likes TEXT[] DEFAULT '{}',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. **Run the Application**

Backend(Terminal 1):

```
cd server
node --watch server.js
```

Frontend(Terminal 2):

```
cd client
npm run dev
```

Visit `http://localhost:5173` to see the application in action! 🎉

### 🔧 **Configuration**

**API Keys Setup**

1. **Clerk Authentication**

   - Create an account at [clerk.com](https://clerk.com)
   - Get your **publishable** and **secret keys**
   - Configure premium plans

2. **Google Gemini AI**

   - Get an API key from [Google AI Studio](https://aistudio.google.com)
   - Add it to your **environment variables**

3. **ClipDrop API**

   - Register at [ClipDrop](https://clipdrop.co)
   - Get your **API key**

4. **Cloudinary**

   - Create an account at [Cloudinary](https://cloudinary.com)
   - Get your **cloud name**, **API key**, and **secret**

5. **Neon Database**
   - Create a database at [Neon](https://neon.tech)
   - Get the **connection string**

---

## 📊 Project Structure

```env
client/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, icons, static data
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route components
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main app component
│   └── main.jsx            # App entry point
└── package.json

server/
├── configs/                # Configuration files
│   ├── cloudinary.js       # Cloudinary setup
│   ├── db.js               # Database connection
│   └── multer.js           # File upload config
├── controllers/            # Route handlers
│   ├── aiController.js     # AI-related endpoints
│   └── userController.js   # User-related endpoints
├── middlewares/            # Custom middleware
│   └── auth.js             # Authentication middleware
├── routes/                 # API routes
│   ├── aiRoutes.js         # AI tool routes
│   └── userRoutes.js       # User routes
├── server.js               # Express server setup
└── package.json
```

---

## 🤝 Contributing

We welcome contributions!

### Development Workflow

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push to the branch:

   ```bash
   git push origin feature/amazing-feature
   ```

5. Open a Pull Request.

### Code Style

- Use ESLint configuration provided
- Follow existing code patterns
- Write meaningful commit messages
- Add comments for complex logic

---

### License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google/) for providing advanced AI capabilities
- [Clerk](https://clerk.com) for seamless authentication
- [Cloudinary](https://cloudinary.com) for reliable image storage
- [Neon](https://neon.tech) for serverless PostgreSQL
- [Vercel](https://vercel.com) & [Render](https://render.com) for hosting solutions

<div align="center"> <p>Made with ❤️ by <a href="https://github.com/sandip387">Sandip Shrestha</a></p> <p>⭐ Star this repo if you found it helpful!</p> </div>
