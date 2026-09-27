# backend/graph.py
import os
from dotenv import load_dotenv
from typing import Optional, Literal, TypedDict
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, END

load_dotenv()

class DeviationFields(BaseModel):
    site_plant: Optional[str] = Field(description="Site or plant name/unit")
    date_of_occurrence: Optional[str] = Field(description="Date the deviation occurred, format YYYY-MM-DD")
    title: Optional[str] = Field(description="Short title")
    source: Optional[str] = Field(description="How the deviation was reported")
    related_product: Optional[str] = Field(description="Product or material name involved")
    batch_lot_number: Optional[str] = Field(description="Batch or lot number")
    detailed_description: Optional[str] = Field(description="Full description of what happened")
    initial_impact: Literal["Product Quality", "Patient Safety", "Regulatory Compliance", "Minimal"] = Field(
        description="Primary impact area. Always choose one, even under uncertainty."
    )
    initial_severity: Literal["Critical", "Major", "Minor"] = Field(
        description="Severity level. Always choose one, even under uncertainty."
    )
    severity_reason: str = Field(description="Short justification for the severity/impact assessment")


class GraphState(TypedDict):
    raw_text: str
    extracted: Optional[dict]


llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"), temperature=0)
structured_llm = llm.with_structured_output(DeviationFields)

EXTRACTION_PROMPT = """You are a pharmaceutical quality assurance assistant. Extract deviation
information from the text below and assess its likely impact and severity. Base the
severity_reason on GMP/patient-safety reasoning appropriate for an API manufacturer.
If a field isn't mentioned, leave it null — do not guess. However, initial_impact,
initial_severity, and severity_reason are always required: you must commit to your
best judgment for these even when the source text is ambiguous or sparse."""


def extract_fields(state: GraphState) -> GraphState:
    result = structured_llm.invoke([
        {"role": "system", "content": EXTRACTION_PROMPT},
        {"role": "user", "content": state["raw_text"]},
    ])
    return {"raw_text": state["raw_text"], "extracted": result.model_dump()}


# Build the graph — a single node is enough given extraction already produces
# impact/severity/reason together in one structured call. A second node would
# only be needed if you wanted a separate model pass to re-evaluate severity
# independently, which the brief doesn't require.
workflow = StateGraph(GraphState)
workflow.add_node("extract_fields", extract_fields)
workflow.set_entry_point("extract_fields")
workflow.add_edge("extract_fields", END)

deviation_graph = workflow.compile()


def run_deviation_pipeline(raw_text: str) -> dict:
    result = deviation_graph.invoke({"raw_text": raw_text, "extracted": None})
    return result["extracted"]

def run_edit_interaction(current_form: dict, message: str) -> dict:
    context = (
        f"Current deviation form state (JSON): {current_form}\n\n"
        f"User correction/instruction: {message}\n\n"
        "Apply the user's correction to the form above and return the complete, "
        "updated form. Keep every field the user did not mention unchanged. If the "
        "correction changes a fact that also appears in detailed_description, update "
        "that fact there too while preserving the rest of the description. Do not "
        "change unrelated facts or add details. If the "
        "correction affects severity or impact, update severity_reason to explain why."
    )
    result = structured_llm.invoke([
        {
            "role": "system",
            "content": (
                "You are editing an existing deviation form, not extracting a new one. "
                "Return the complete updated form and preserve existing values unless "
                "the user corrects them. Apply each correction wherever the same fact "
                "appears, including detailed_description, while preserving unrelated "
                "details. Never infer new facts."
            ),
        },
        {"role": "user", "content": context},
    ])
    return result.model_dump()