from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from ...db.session import get_db
from ...models.books import Book as BookModel
from ..schemas.books import Book, BookCreate, BookUpdate
from ...repositories.books import BookRepository

router = APIRouter()


@router.get("/", response_model=List[Book])
def read_books(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Récupère la liste des livres.
    """
    repository = BookRepository(BookModel, db)
    books = repository.get_multi(skip=skip, limit=limit)
    return books


@router.post("/", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(
    *,
    db: Session = Depends(get_db),
    book_in: BookCreate
) -> Any:
    """
    Crée un nouveau livre.
    """
    repository = BookRepository(BookModel, db)
    book = repository.create(obj_in=book_in)
    return book


@router.get("/{id}", response_model=Book)
def read_book(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Récupère un livre par son ID.
    """
    repository = BookRepository(BookModel, db)
    book = repository.get(id=id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )
    return book


@router.put("/{id}", response_model=Book)
def update_book(
    *,
    db: Session = Depends(get_db),
    id: int,
    book_in: BookUpdate
) -> Any:
    """
    Met à jour un livre.
    """
    repository = BookRepository(BookModel, db)
    book = repository.get(id=id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )
    book = repository.update(db_obj=book, obj_in=book_in)
    return book


@router.delete("/{id}", response_model=Book)
def delete_book(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Supprime un livre.
    """
    repository = BookRepository(BookModel, db)
    book = repository.get(id=id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )
    book = repository.remove(id=id)
    return book