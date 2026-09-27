from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Depends

from models import init_db, get_db, Deviation
from graph import run_deviation_pipeline, run_edit_interaction
import pypdf
import io

app = FastAPI()

class EditRequest(BaseModel):
    message: str
    current_form: dict

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.post("/deviations/extract")
async def extract(text: str = Form(None), file: UploadFile = File(None)):
    if file:
        raw_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            content = "\n".join(page.extract_text() or "" for page in reader.pages)
        else:
            content = raw_bytes.decode("utf-8", errors="ignore")
    else:
        content = text
    return run_deviation_pipeline(content)

@app.post("/deviations/edit")
def edit_deviation(payload: EditRequest):
    return run_edit_interaction(payload.current_form, payload.message)

@app.post("/deviations")
def save_deviation(payload: dict, db: Session = Depends(get_db)):
    deviation = Deviation(
        site_plant=payload.get("site_plant"),
        date_of_occurrence=payload.get("date_of_occurrence"),
        title=payload.get("title"),
        source=payload.get("source"),
        related_product=payload.get("related_product"),
        batch_lot_number=payload.get("batch_lot_number"),
        detailed_description=payload.get("detailed_description"),
        initial_impact=payload.get("initial_impact"),
        initial_severity=payload.get("initial_severity"),
        severity_reason=payload.get("severity_reason"),
    )
    db.add(deviation)
    db.commit()
    db.refresh(deviation)
    return {"id": deviation.id, "status": "saved"}

@app.get("/deviations/{id}")
def get_deviation(id: int, db: Session = Depends(get_db)):
    return db.query(Deviation).filter(Deviation.id == id).first()