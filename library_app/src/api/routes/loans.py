from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime, timedelta

from ...db.session import get_db
from ...models.loans import Loan as LoanModel
from ...models.books import Book as BookModel
from ...models.users import User as UserModel
from ..schemas.loans import Loan, LoanCreate, LoanUpdate
from ...repositories.loans import LoanRepository
from ...repositories.books import BookRepository
from ...repositories.users import UserRepository

router = APIRouter()


@router.get("/", response_model=List[Loan])
def read_loans(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Récupère la liste des emprunts.
    """
    repository = LoanRepository(LoanModel, db)
    loans = repository.get_multi(skip=skip, limit=limit)
    return loans


@router.post("/", response_model=Loan, status_code=status.HTTP_201_CREATED)
def create_loan(
    *,
    db: Session = Depends(get_db),
    loan_in: LoanCreate
) -> Any:
    """
    Crée un nouvel emprunt.
    """
    # Vérifier que l'utilisateur existe
    user_repository = UserRepository(UserModel, db)
    user = user_repository.get(id=loan_in.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Vérifier que le livre existe et est disponible
    book_repository = BookRepository(BookModel, db)
    book = book_repository.get(id=loan_in.book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Livre non trouvé"
        )

    if book.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Livre non disponible"
        )

    # Créer l'emprunt
    repository = LoanRepository(LoanModel, db)

    # Si la date d'échéance n'est pas spécifiée, la définir à 2 semaines
    if not loan_in.due_date:
        loan_data = loan_in.dict()
        loan_data["due_date"] = datetime.utcnow() + timedelta(days=14)
        loan = repository.create(obj_in=loan_data)
    else:
        loan = repository.create(obj_in=loan_in)

    # Mettre à jour la quantité de livres disponibles
    book.quantity -= 1
    book_repository.update(db_obj=book, obj_in={"quantity": book.quantity})

    return loan


@router.get("/{id}", response_model=Loan)
def read_loan(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Récupère un emprunt par son ID.
    """
    repository = LoanRepository(LoanModel, db)
    loan = repository.get(id=id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emprunt non trouvé"
        )
    return loan


@router.put("/{id}", response_model=Loan)
def update_loan(
    *,
    db: Session = Depends(get_db),
    id: int,
    loan_in: LoanUpdate
) -> Any:
    """
    Met à jour un emprunt.
    """
    repository = LoanRepository(LoanModel, db)
    loan = repository.get(id=id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emprunt non trouvé"
        )

    # Si l'emprunt est retourné, mettre à jour la quantité de livres disponibles
    if loan_in.return_date and not loan.return_date:
        book_repository = BookRepository(BookModel, db)
        book = book_repository.get(id=loan.book_id)
        if book:
            book.quantity += 1
            book_repository.update(db_obj=book, obj_in={"quantity": book.quantity})

    loan = repository.update(db_obj=loan, obj_in=loan_in)
    return loan


@router.delete("/{id}", response_model=Loan)
def delete_loan(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Supprime un emprunt.
    """
    repository = LoanRepository(LoanModel, db)
    loan = repository.get(id=id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emprunt non trouvé"
        )

    # Si l'emprunt n'a pas été retourné, mettre à jour la quantité de livres disponibles
    if not loan.return_date:
        book_repository = BookRepository(BookModel, db)
        book = book_repository.get(id=loan.book_id)
        if book:
            book.quantity += 1
            book_repository.update(db_obj=book, obj_in={"quantity": book.quantity})

    loan = repository.remove(id=id)
    return loan