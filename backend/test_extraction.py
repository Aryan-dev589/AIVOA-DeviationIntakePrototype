import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from typing import Optional, Literal

load_dotenv()

class DeviationFields(BaseModel):
    site_plant: Optional[str] = Field(description="Site or plant name/unit, e.g. 'API Manufacturing Unit'")
    date_of_occurrence: Optional[str] = Field(description="Date the deviation occurred, format YYYY-MM-DD")
    title: Optional[str] = Field(description="Short title, e.g. 'OOS result for Assay in Batch ABC-001'")
    source: Optional[str] = Field(description="How the deviation was reported, e.g. 'Lab Analyst', 'Operator', 'QA Review'")
    related_product: Optional[str] = Field(description="Product or material name involved")
    batch_lot_number: Optional[str] = Field(description="Batch or lot number")
    detailed_description: Optional[str] = Field(description="Full description of what happened, where, when, how detected")
    initial_impact: Literal["Product Quality", "Patient Safety", "Regulatory Compliance", "Minimal"] = Field(
        description="Primary impact area. Always choose one, even under uncertainty — pick the most likely."
    )
    initial_severity: Literal["Critical", "Major", "Minor"] = Field(
        description="Severity level. Always choose one, even under uncertainty — pick the most likely."
    )
    severity_reason: str = Field(description="Short justification for the severity/impact assessment")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0,
)
structured_llm = llm.with_structured_output(DeviationFields)

SYSTEM_PROMPT = """You are a pharmaceutical quality assurance assistant. Extract deviation
information from the text below and assess its likely impact and severity. Base the
severity_reason on GMP/patient-safety reasoning appropriate for an API manufacturer.
If a field isn't mentioned, leave it null — do not guess. However, initial_impact,
initial_severity, and severity_reason are always required: you must commit to your
best judgment for these even when the source text is ambiguous or sparse."""

TEST_CASES = [
    """During routine monitoring on 15-March-2026 at the API Manufacturing Unit, Batch
    ABC-2024-089 of Ibuprofen API showed a reaction temperature of 82°C against the
    approved range of 65-75°C during the crystallization step. The deviation was
    detected by the shift operator during hourly parameter checks. No immediate
    product release has occurred; batch is on hold pending investigation.""",

    """Lab analyst Priya reported an OOS (out of specification) assay result of 97.2%
    for Batch XYZ-556 (Paracetamol API), against a specification of 98.5-101.5%.
    Sample was tested on the HPLC system in QC Lab 2 on 2026-03-20.""",

    """Operator noted a minor label mismatch on 3 drums of Metformin API batch
    MET-2024-112 — batch number on the drum label read 112 but the paperwork
    said 211. Caught during routine warehouse audit, no product moved yet.""",
]

for i, text in enumerate(TEST_CASES, 1):
    print(f"\n{'='*60}\nTEST CASE {i}\n{'='*60}")
    result = structured_llm.invoke([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": text},
    ])
    print(result.model_dump_json(indent=2))