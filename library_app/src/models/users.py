from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from .base import Base


class User(Base):
    email = Column(String(100), nullable=False, unique=True, index=True)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    # Relations
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")