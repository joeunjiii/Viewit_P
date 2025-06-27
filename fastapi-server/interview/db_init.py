from interview.uploads.models import Base
from interview.uploads.database import engine

Base.metadata.create_all(bind=engine)