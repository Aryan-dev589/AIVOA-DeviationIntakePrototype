from sqlalchemy import create_engine, Column, Integer, String, Date, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./deviations.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Deviation(Base):
    __tablename__ = "deviations"

    id = Column(Integer, primary_key=True, index=True)
    site_plant = Column(String)
    date_of_occurrence = Column(String)
    title = Column(String)
    source = Column(String)
    related_product = Column(String)
    batch_lot_number = Column(String)
    detailed_description = Column(Text)
    initial_impact = Column(String)
    initial_severity = Column(String)
    severity_reason = Column(Text)
    status = Column(String, default="draft")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()