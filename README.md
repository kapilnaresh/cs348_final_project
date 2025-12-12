# Project Setup Guide

## Clone the Repository
```bash
git clone <repository-url>
cd <project-directory>
```

## Backend Setup

1. Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:
```bash
pip install fastapi uvicorn sqlalchemy pydantic
```

3. Run the backend server:
```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (first run only):
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Notes

- The backend will be available at `http://localhost:8000`
- The frontend will typically run on `http://localhost:3000`
- Make sure both servers are running simultaneously for full functionality
