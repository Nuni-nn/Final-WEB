# Recipes Final Project

Backend + frontend web app for managing recipes with authentication, profile management, and private user data.

## Tech stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- Joi validation
- Bootstrap (frontend pages in `public/`)

## Project overview

This project implements a modular Express application with:

- public auth endpoints (`/auth/register`, `/auth/login`)
- private user endpoints (`/users/profile`)
- full CRUD for recipes
- extra MongoDB collections to satisfy final project requirements
- global error handling and validation middleware
- basic RBAC (`user` and `admin`)

### Collections (5+)

1. `users`
2. `recipes`
3. `categories`
4. `comments`
5. `favorites`

## Setup instructions

1. Install dependencies:

```bash
npm install
```

2. Ensure MongoDB is running locally (or set your own URI).

3. Create `.env` file (example):

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/recipesDB
JWT_SECRET=super_secret_key_123
JWT_EXPIRES_IN=7d
```

4. Run app:

```bash
npm run dev
```

or

```bash
npm start
```

5. Open in browser:

`http://localhost:3000`

## API documentation

Base URL: `http://localhost:3000`

### Auth (public)

- `POST /register` (alias)
- `POST /login` (alias)
- `POST /auth/register`
  - body: `{ "username": "name", "email": "user@mail.com", "password": "secret123" }`
- `POST /auth/login`
  - body: `{ "email": "user@mail.com", "password": "secret123" }`
  - response contains JWT token

### Users (private, Bearer token required)

- `GET /users/profile`
- `PUT /users/profile`
  - body: `{ "username": "newName", "email": "new@mail.com" }`
- `GET /users` (admin)
- `DELETE /users/:id` (admin)

### Recipes (private)

- `POST /recipes`
  - body fields: `title`, `description`, `ingredients[]`, `steps[]`, `cookTime`, `isPublic`, `categoryId`
- `GET /recipes`
- `GET /recipes/:id`
- `PUT /recipes/:id`
- `DELETE /recipes/:id` (owner only)
- `DELETE /recipes/:id/admin` (admin only)

### Categories (private, admin CRUD)

- `POST /categories` (admin)
- `GET /categories`
- `GET /categories/:id`
- `PUT /categories/:id` (admin)
- `DELETE /categories/:id` (admin)

### Comments (private)

- `POST /comments`
  - body: `{ "recipeId": "...", "text": "Great", "rating": 5 }`
- `GET /comments/recipe/:recipeId`
- `PUT /comments/:id` (owner or admin)
- `DELETE /comments/:id` (owner or admin)

### Favorites (private)

- `POST /favorites/:recipeId`
- `GET /favorites`
- `DELETE /favorites/:recipeId`

## Error handling and validation

- Joi is used for request validation.
- Global middleware returns consistent JSON errors.
- Typical statuses:
  - `400` validation/bad request
  - `401` unauthorized
  - `403` forbidden
  - `404` not found
  - `500` server error

## Notes

- Roles are stored in `User.role` (`user`, `admin`).
- New users are registered as `user` by default.
