from interview.models import Base
from interview.database import engine

Base.metadata.create_all(bind=engine)