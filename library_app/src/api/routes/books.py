from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from ...db.session import get_db
from ...models.books import Book as BookModel
from ..schemas.books import Book, BookCreate, BookUpdate
from ...repositories.books import BookRepository
from ...services.books import BookService
from ..dependencies import get_current_active_user, get_current_admin_user

router = APIRouter()


@router.get("/", response_model=List[Book])
def read_books(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Récupère la liste des livres.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    books = service.get_multi(skip=skip, limit=limit)
    return books


@router.post("/", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(
    *,
    db: Session = Depends(get_db),
    book_in: BookCreate,
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Crée un nouveau livre.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)

    try:
        book = service.create(obj_in=book_in)
        return book
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{id}", response_model=Book)
def read_book(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Récupère un livre par son ID.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    book = service.get(id=id)
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
    book_in: BookUpdate,
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Met à jour un livre.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    book = service.get(id=id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )

    try:
        book = service.update(db_obj=book, obj_in=book_in)
        return book
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{id}", response_model=Book)
def delete_book(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Supprime un livre.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    book = service.get(id=id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )
    book = service.remove(id=id)
    return book


@router.get("/search/title/{title}", response_model=List[Book])
def search_books_by_title(
    *,
    db: Session = Depends(get_db),
    title: str,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recherche des livres par titre.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    books = service.get_by_title(title=title)
    return books


@router.get("/search/author/{author}", response_model=List[Book])
def search_books_by_author(
    *,
    db: Session = Depends(get_db),
    author: str,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recherche des livres par auteur.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    books = service.get_by_author(author=author)
    return books


@router.get("/search/isbn/{isbn}", response_model=Book)
def search_book_by_isbn(
    *,
    db: Session = Depends(get_db),
    isbn: str,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Recherche un livre par ISBN.
    """
    repository = BookRepository(BookModel, db)
    service = BookService(repository)
    book = service.get_by_isbn(isbn=isbn)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )
    return book