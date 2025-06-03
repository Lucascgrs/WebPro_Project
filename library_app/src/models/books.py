from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base


class Book(Base):
    title = Column(String(100), nullable=False, index=True)
    author = Column(String(100), nullable=False, index=True)
    isbn = Column(String(13), nullable=False, unique=True, index=True)
    publication_year = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False, default=0)

    # Relations
    loans = relationship("Loan", back_populates="book", cascade="all, delete-orphan")