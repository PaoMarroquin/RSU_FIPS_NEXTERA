<<<<<<< HEAD
# RSU-FIPS Backend

REST API built with Django and Django REST Framework for the RSU-FIPS platform.

## Tech Stack

- **Python** 3.11
- **Django** 4.2
- **Django REST Framework** 3.15
- **PostgreSQL** 15
- **JWT Authentication** via `djangorestframework-simplejwt`

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd rsufips-backend
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set the following variables:

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | `True` for development, `False` for production |
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_HOST` | Database host|
| `POSTGRES_PORT` | Database port |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |

---

## Running Options

### I. Full Docker (recommended)

Runs both the database and the Django app in containers.

**Requirements:** Docker, Docker Compose

```bash
docker-compose up --build
```

On the first run, open a second terminal and apply migrations:

```bash
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

Create a superuser (optional):

```bash
docker-compose exec web python manage.py createsuperuser
```

To stop:

```bash
docker-compose down
```

The API will be available at `http://localhost:8000`.

---

### II. DB in Docker, Django locally

Runs only the database in a container and the Django app on your machine.

**Requirements:** Docker, Docker Compose, Python 3.11+

**Step 1 — Start only the database:**

```bash
docker-compose up db
```

**Step 2 — Set up the Python environment:**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

> Make sure `POSTGRES_HOST=localhost` in your `.env` file.

**Step 3 — Apply migrations:**

```bash
python manage.py makemigrations
python manage.py migrate
```

**Step 4 — Create a superuser (optional):**

```bash
python manage.py createsuperuser
```

**Step 5 — Run the development server:**

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

---

## Running Tests

```bash
python manage.py test
```
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> origin/frontend-rsu
