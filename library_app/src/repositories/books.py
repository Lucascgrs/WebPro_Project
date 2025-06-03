from sqlalchemy.orm import Session
from typing import List

from .base import BaseRepository
from ..models.books import Book


class BookRepository(BaseRepository[Book, None, None]):
    def get_by_isbn(self, db: Session, *, isbn: str) -> Book:
        """
        Récupère un livre par son ISBN.
        """
        return db.query(Book).filter(Book.isbn == isbn).first()

    def get_by_title(self, db: Session, *, title: str) -> List[Book]:
        """
        Récupère des livres par leur titre (recherche partielle).
        """
        return db.query(Book).filter(Book.title.ilike(f"%{title}%")).all()

    def get_by_author(self, db: Session, *, author: str) -> List[Book]:
        """
        Récupère des livres par leur auteur (recherche partielle).
        """
        return db.query(Book).filter(Book.author.ilike(f"%{author}%")).all()