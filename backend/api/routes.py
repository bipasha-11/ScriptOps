"""
REST API routes for the Script Intelligence system.
All endpoints under /api/v1/
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Header, Depends
from ..core.parser import extract_text_from_file, split_into_scenes
from ..core.extractor import analyze_scene
from ..core.risk_engine import analyze_risk_and_cost, get_risk_level
from ..core.simulator import simulate_whatif
from ..core.llm_service import generate_scene_insight, generate_overall_insight
from ..models.schemas import (
    UploadResponse, AnalysisResponse, WhatIfRequest, WhatIfResponse,
    ChatRequest, ChatResponse, MatchRequest, MatchResponse
)
from .auth import get_current_user
from ..core.database import get_db
from ..models.db_models import User, Project, Scene
from sqlalchemy.orm import Session
import json

router = APIRouter(prefix="/api/v1")

def _get_analysis_summary(project: Project, threshold: int = 50) -> dict:
    """Build summary statistics from stored scenes."""
    scenes = project.scenes
    if not scenes:
        return {
            "script_title": project.title,
            "total_scenes": 0,
            "total_budget": 0,
            "avg_risk_score": 0.0,
            "high_risk_scenes": 0,
            "scenes": [],
        }
    
    processed_scenes = []
    for s in scenes:
        # Convert DB model to dict and merge metadata
        s_dict = {
            "scene_number": s.scene_number,
            "slugline": s.slugline,
            "scene_type": s.scene_type,
            "content": s.content,
            "risk_score": s.risk_score,
            "budget": s.budget,
            "risk_level": get_risk_level(s.risk_score, threshold)
        }
        if s.metadata_json:
            s_dict.update(s.metadata_json)
        processed_scenes.append(s_dict)

    total_budget = sum(s["budget"] for s in processed_scenes)
    avg_risk = sum(s["risk_score"] for s in processed_scenes) / len(processed_scenes)
    high_risk = sum(1 for s in processed_scenes if s["risk_score"] >= threshold)
    
    return {
        "script_title": project.title,
        "total_scenes": len(processed_scenes),
        "total_budget": total_budget,
        "avg_risk_score": round(avg_risk, 1),
        "high_risk_scenes": high_risk,
        "scenes": processed_scenes,
    }


# ── Upload ────────────────────────────────────────────────────────────────────
@router.post("/upload", response_model=UploadResponse)
async def upload_script(script: UploadFile = File(...), email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Upload a script file (PDF or text) and process it."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")

    file_bytes = await script.read()
    raw_text = extract_text_from_file(script.filename, file_bytes)
    raw_scenes = split_into_scenes(raw_text)

    # Create Project
    new_project = Project(title=script.filename, raw_text=raw_text, owner_id=user.id)
    db.add(new_project)
    db.flush() # Get ID

    # Process and Store Scenes
    for raw_scene in raw_scenes:
        enriched = analyze_scene(raw_scene)
        enriched = analyze_risk_and_cost(enriched)
        
        # Determine scene type string for DB
        stype = "INT" if enriched["scene_type"]["interior"] else "EXT"
        if enriched["scene_type"]["exterior"] and enriched["scene_type"]["interior"]:
            stype = "INT/EXT"
        
        # Split enriched into DB fields and JSON metadata
        # We map heading -> slugline and body -> content
        meta = {k: v for k, v in enriched.items() if k not in ["scene_number", "heading", "body", "scene_type", "risk_score", "budget"]}
        
        db_scene = Scene(
            project_id=new_project.id,
            scene_number=enriched["scene_number"],
            slugline=enriched["heading"],
            scene_type=stype,
            content=enriched["body"],
            risk_score=enriched["risk_score"],
            budget=enriched["budget"],
            metadata_json=meta
        )
        db.add(db_scene)

    db.commit()

    return UploadResponse(
        status="success",
        total_scenes=len(raw_scenes),
        script_title=script.filename,
    )


# ── Scenes ────────────────────────────────────────────────────────────────────
@router.get("/scenes")
async def get_scenes(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project:
        raise HTTPException(404, "No script uploaded yet")
    
    scenes_data = []
    for s in project.scenes:
        d = {"scene_number": s.scene_number, "slugline": s.slugline, "scene_type": s.scene_type, "content": s.content, "risk_score": s.risk_score, "budget": s.budget}
        if s.metadata_json: d.update(s.metadata_json)
        scenes_data.append(d)
    return {"scenes": scenes_data}


@router.get("/scenes/{scene_id}")
async def get_scene(scene_id: int, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project: raise HTTPException(404, "No script uploaded")
    
    s = db.query(Scene).filter(Scene.project_id == project.id, Scene.scene_number == scene_id).first()
    if not s: raise HTTPException(404, f"Scene {scene_id} not found")
    
    d = {"scene_number": s.scene_number, "slugline": s.slugline, "scene_type": s.scene_type, "content": s.content, "risk_score": s.risk_score, "budget": s.budget}
    if s.metadata_json: d.update(s.metadata_json)
    return d


# ── Analysis ──────────────────────────────────────────────────────────────────
@router.get("/analysis")
async def get_analysis(email: str = Depends(get_current_user), db: Session = Depends(get_db), threshold: int = 50):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project:
        raise HTTPException(404, "No script uploaded yet")
    return _get_analysis_summary(project, threshold)


# ── What-If ───────────────────────────────────────────────────────────────────
@router.post("/whatif/{scene_id}", response_model=WhatIfResponse)
async def whatif_scene(scene_id: int, body: WhatIfRequest, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    
    s = db.query(Scene).filter(Scene.project_id == project.id, Scene.scene_number == scene_id).first()
    if not s: raise HTTPException(404, f"Scene {scene_id} not found")

    original = {"scene_number": s.scene_number, "slugline": s.slugline, "scene_type": s.scene_type, "content": s.content, "risk_score": s.risk_score, "budget": s.budget}
    if s.metadata_json: original.update(s.metadata_json)

    modifications = body.model_dump(exclude_none=True)
    result = simulate_whatif(original, modifications)
    return WhatIfResponse(**result)


# ── LLM Insights ─────────────────────────────────────────────────────────────
@router.get("/insights")
async def get_overall_insights(email: str = Depends(get_current_user), db: Session = Depends(get_db), x_groq_api_key: str = Header(None)):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project: raise HTTPException(404, "No script uploaded")
    
    analysis = _get_analysis_summary(project)
    insights = await generate_overall_insight(analysis, api_key=x_groq_api_key)
    return insights


@router.get("/insights/{scene_id}")
async def get_scene_insight(scene_id: int, email: str = Depends(get_current_user), db: Session = Depends(get_db), x_groq_api_key: str = Header(None)):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    
    s = db.query(Scene).filter(Scene.project_id == project.id, Scene.scene_number == scene_id).first()
    if not s: raise HTTPException(404, f"Scene {scene_id} not found")
    
    scene_dict = {"scene_number": s.scene_number, "slugline": s.slugline, "scene_type": s.scene_type, "content": s.content, "risk_score": s.risk_score, "budget": s.budget}
    if s.metadata_json: scene_dict.update(s.metadata_json)
    
    insight = await generate_scene_insight(scene_dict, api_key=x_groq_api_key)
    return insight

@router.post("/insights/chat", response_model=ChatResponse)
async def chat_interaction(body: ChatRequest, email: str = Depends(get_current_user), db: Session = Depends(get_db), x_groq_api_key: str = Header(None)):
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project: raise HTTPException(404, "No script uploaded")
    
    from ..core.llm_service import chat_with_script
    analysis = _get_analysis_summary(project)
    response_text = await chat_with_script(
        analysis, 
        [m.model_dump() for m in body.messages], 
        body.selected_scene_id,
        api_key=x_groq_api_key
    )
    return ChatResponse(response=response_text)


# ── Talent Matching ──────────────────────────────────────────────────────────
@router.post("/match-creators", response_model=MatchResponse)
async def match_creators_endpoint(body: MatchRequest, user=Depends(get_current_user)):
    """
    Score and rank creators against script requirements.
    Uses HuggingFace SentenceTransformers ML over the technicians CSV dataset.
    """
    from ..core.recommender import calculate_ml_matches
    from ..models.schemas import CreatorMatch, Breakdown, Explanation
    
    script_reqs = body.script_requirements
    
    # 1. Execute ML Model against CSV dataset
    ml_output = calculate_ml_matches(
        script_reqs.keywords, 
        script_reqs.max_budget_usd,
        skill_weight=body.skill_weight,
        social_weight=body.social_weight
    )
    
    # 2. Format outputs natively into Pydantic models for Frontend
    formatted_matches = []
    for i, m in enumerate(ml_output):
        formatted_matches.append(CreatorMatch(
            creator_id=f"ml_match_{i}",
            creator_name=m["creator_name"],
            score=m["score"],
            breakdown=Breakdown(skill=10.0, cost=10.0, experience=10.0, engagement=10.0), # ML does this holistically
            explanation=Explanation(**m["explanation"]),
            raw_data=m["raw_data"]
        ))
        
    return MatchResponse(matches=formatted_matches)
    
from fastapi.responses import FileResponse, StreamingResponse
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

# ── Data Management ──────────────────────────────────────────────────────────
@router.post("/purge")
async def purge_data(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Clear all project data from the DB for this user."""
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(404)
    
    project = db.query(Project).filter(Project.owner_id == user.id).first()
    if project:
        db.delete(project) # Cascades to scenes
        db.commit()
    return {"status": "success", "message": "Project data purged from Neon"}

@router.get("/export/pdf")
async def export_pdf(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate and return a professional PDF report."""
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project: raise HTTPException(404, "No data to export")

    summary = _get_analysis_summary(project)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(f"Script Intelligence Report: {project.title}", styles['Title']))
    elements.append(Spacer(1, 12))

    # Executive Summary
    elements.append(Paragraph("Executive Summary", styles['Heading2']))
    elements.append(Paragraph(f"Total Scenes: {summary['total_scenes']}", styles['Normal']))
    elements.append(Paragraph(f"Estimated Production Cost: ${summary['total_budget']}K", styles['Normal']))
    elements.append(Paragraph(f"Average Risk Score: {summary['avg_risk_score']}/100", styles['Normal']))
    elements.append(Paragraph(f"High Risk Scenes Identified: {summary['high_risk_scenes']}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Scene Table
    elements.append(Paragraph("Scene Breakdown", styles['Heading2']))
    data = [["Scene", "Slugline", "Risk", "Budget"]]
    for s in summary['scenes']:
        data.append([
            str(s['scene_number']),
            s['slugline'][:30] + "..." if len(s['slugline']) > 30 else s['slugline'],
            f"{s['risk_score']}",
            f"${s['budget']}K"
        ])

    t = Table(data, colWidths=[50, 250, 50, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(t)

    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ScriptOps_Report_{project.id}.pdf"}
    )

@router.get("/export/fdx")
async def export_fdx(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return a simple .FDX (Final Draft XML) notes file."""
    user = db.query(User).filter(User.email == email).first()
    project = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).first()
    if not project: raise HTTPException(404, "No data to export")

    # Mock FDX XML structure
    fdx_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Version="4">
    <Content>
        <Paragraph Type="Action">
            <Text>ScriptOps Export: {project.title}</Text>
        </Paragraph>
        <Paragraph Type="Action">
            <Text>Analysis generated at {project.created_at}</Text>
        </Paragraph>
    </Content>
</FinalDraft>"""

    return StreamingResponse(
        io.BytesIO(fdx_content.encode("utf-8")),
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename={project.title}.fdx"}
    )
