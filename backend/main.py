from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Event(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    date: str

class Registration(BaseModel):
    event_id: int
    user_name: str
    user_email: str

events_db = [
    {"id": 1, "title": "Tech Talk: Containerization", "description": "Learn about Docker and Kubernetes.", "date": "2026-03-10"},
    {"id": 2, "title": "Campus Hackathon", "description": "48 hours of coding.", "date": "2026-03-15"}
]

registrations_db = []
event_id_counter = 3

@app.get("/api/events", response_model=List[Event])
def get_events():
    return events_db

@app.post("/api/events", response_model=Event)
def create_event(event: Event):
    global event_id_counter
    new_event = event.model_dump()
    new_event["id"] = event_id_counter
    events_db.append(new_event)
    event_id_counter += 1
    return new_event

@app.post("/api/events/register")
def register_for_event(registration: Registration):
    event_exists = any(e["id"] == registration.event_id for e in events_db)
    if not event_exists:
        raise HTTPException(status_code=404, detail="Event not found")
    registrations_db.append(registration.model_dump())
    return {"message": "Successfully registered", "registration": registration.model_dump()}

@app.put("/api/events/{event_id}", response_model=Event)
def edit_event(event_id: int, updated_event: Event):
    for i, e in enumerate(events_db):
        if e["id"] == event_id:
            new_data = updated_event.model_dump()
            new_data["id"] = event_id
            events_db[i] = new_data
            return new_data
    raise HTTPException(status_code=404, detail="Event not found")

@app.get("/api/events/{event_id}/registrations")
def get_event_registrations(event_id: int):
    event_exists = any(e["id"] == event_id for e in events_db)
    if not event_exists:
        raise HTTPException(status_code=404, detail="Event not found")
        
    regs = [r for r in registrations_db if r["event_id"] == event_id]
    return regs
