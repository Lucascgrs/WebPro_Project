from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from ...db.session import get_db
from ...models.users import User as UserModel
from ..schemas.users import User, UserCreate, UserUpdate
from ...repositories.users import UserRepository
from ...utils.security import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Récupère la liste des utilisateurs.
    """
    repository = UserRepository(UserModel, db)
    users = repository.get_multi(skip=skip, limit=limit)
    return users


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate
) -> Any:
    """
    Crée un nouvel utilisateur.
    """
    repository = UserRepository(UserModel, db)
    user = repository.get_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'email est déjà utilisé"
        )

    # Hasher le mot de passe
    hashed_password = get_password_hash(user_in.password)
    user_data = user_in.dict()
    del user_data["password"]
    user_data["hashed_password"] = hashed_password

    user = repository.create(obj_in=user_data)
    return user


@router.get("/{id}", response_model=User)
def read_user(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Récupère un utilisateur par son ID.
    """
    repository = UserRepository(UserModel, db)
    user = repository.get(id=id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    return user


@router.put("/{id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_db),
    id: int,
    user_in: UserUpdate
) -> Any:
    """
    Met à jour un utilisateur.
    """
    repository = UserRepository(UserModel, db)
    user = repository.get(id=id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )

    # Si le mot de passe est fourni, le hasher
    if user_in.password:
        hashed_password = get_password_hash(user_in.password)
        user_data = user_in.dict(exclude_unset=True)
        del user_data["password"]
        user_data["hashed_password"] = hashed_password
        user = repository.update(db_obj=user, obj_in=user_data)
    else:
        user = repository.update(db_obj=user, obj_in=user_in)

    return user


@router.delete("/{id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(get_db),
    id: int
) -> Any:
    """
    Supprime un utilisateur.
    """
    repository = UserRepository(UserModel, db)
    user = repository.get(id=id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    user = repository.remove(id=id)
    return user