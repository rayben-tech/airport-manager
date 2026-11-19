# Airport Manager

A demo app for **Mohammed V International Airport (CMN, Casablanca)**: a mobile web app for passengers (next flight, flight search, my flights, baggage, interactive terminal map with walking directions, shops and services, profile) and a desktop dashboard for administrators. All screens are in French.

## Tech stack

| Part | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, lucide-react |
| Backend | Python, FastAPI, SQLAlchemy 2, PyMySQL, Pydantic 2, JWT authentication (bcrypt passwords) |
| Database | MySQL 5.7 or 8.x |

## Prerequisites

- **MySQL** 5.7 or 8.x (MySQL Workbench or the `mysql` command line)
- **Python 3.11+**
- **Node.js** 20+ (with npm)

## Getting started

1. **Clone the repository**

   ```bash
   git clone <repository-url> airport-manager
   cd airport-manager
   ```

2. **Create the database**: run the 6 SQL files of `database/` **in order** (01 to 06). In MySQL Workbench, open each file and click the lightning bolt. From a terminal:

   ```bash
   mysql -u root -p < database/01_schema.sql
   mysql -u root -p < database/02_reference_data.sql
   mysql -u root -p < database/03_map_and_places.sql
   mysql -u root -p < database/04_flights.sql
   mysql -u root -p < database/05_users_and_bookings.sql
   mysql -u root -p < database/06_extras.sql
   ```

   `01_schema.sql` drops and recreates the `airport_manager` database. Each of the next files ends with the row counts you should get. `database/queries.sql` contains 12 example queries.

3. **Configure the backend**: copy `backend/.env.example` to `backend/.env`, then fill in:

   - `DATABASE_URL`: your MySQL connection, for example `mysql://root:your-password@localhost:3306/airport_manager`
   - `JWT_SECRET`: any long random string
   - keep `APP_NOW=2026-11-18T08:00:00`: the demo data is centered on 18 November 2026, so this fixes the backend's "now" (next flight, upcoming flights, dashboard)

4. **Install the backend** (from `backend/`):

   ```bash
   cd backend
   python -m venv .venv
   # Windows:      .venv\Scripts\activate
   # macOS/Linux:  source .venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Start the backend** (still in `backend/`, with the virtualenv active):

   ```bash
   uvicorn app.main:app --reload
   ```

6. **Check the API**: open <http://localhost:8000/docs>. `GET /api/health` must answer `{"status": "ok"}`.

7. **Start the frontend** (in a second terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The frontend calls `http://localhost:8000/api` by default. To use another backend, create `frontend/.env.local` with `VITE_API_URL=https://your-backend/api`.

8. **Open the app**: <http://localhost:5173>

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Passenger | `wissal@email.com` | `demo1234` |
| Administrator (dashboard at `/admin`) | `admin@airport.ma` | `admin1234` |

## Project structure

```text
airport-manager/
├── database/              MySQL scripts, run in order
│   ├── 01_schema.sql          tables and views
│   ├── 02_reference_data.sql  terminals, airlines, aircraft, airports
│   ├── 03_map_and_places.sql  map graph, places, gates, shops, belts
│   ├── 04_flights.sql
│   ├── 05_users_and_bookings.sql
│   ├── 06_extras.sql          favorites, saved places, notifications, offers
│   └── queries.sql            12 example queries
├── backend/               FastAPI API (prefix /api)
│   ├── app/
│   │   ├── main.py            app, CORS, /api/health
│   │   ├── models.py          SQLAlchemy mapping of the schema
│   │   ├── schemas.py         JSON shapes (camelCase)
│   │   ├── navigation.py      walking routes (Dijkstra)
│   │   └── routers/           auth, flights, me, locations, offers, navigation, admin
│   ├── requirements.txt
│   ├── .env.example
│   └── railway.json
└── frontend/              React app
    ├── public/                background and offer photos
    └── src/
        ├── pages/             one file per screen
        ├── components/        shared UI (navbar, frosted cards, map plan, states)
        ├── lib/               API client, auth, formatting
        └── types.ts           API types
```
