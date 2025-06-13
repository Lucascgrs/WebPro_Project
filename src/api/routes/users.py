from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Any

from ...db.session import get_db
from ...models.users import User as UserModel
from ..schemas.users import User, UserCreate, UserUpdate
from ...repositories.users import UserRepository
from ...services.users import UserService
from ..dependencies import get_current_active_user, get_current_admin_user

from fastapi import File, UploadFile
import shutil
import os
from pathlib import Path

router = APIRouter()


@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100 #,
    #current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Récupère la liste des utilisateurs.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    users = service.get_multi(skip=skip, limit=limit)
    return users


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate
    #,
    #current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Crée un nouvel utilisateur.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    
    
    try:
        
        user = service.create(obj_in=user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=User)
def read_user_me(
    current_user = Depends(get_current_active_user),
) -> Any:
    """
    Récupère l'utilisateur connecté.
    """
    return current_user


@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user = Depends(get_current_active_user)
) -> Any:
    """
    Met à jour l'utilisateur connecté.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    
    try:
        user = service.update(db_obj=current_user, obj_in=user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{id}", response_model=User)
def read_user(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Récupère un utilisateur par son ID.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    user = service.get(id=id)
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
    user_in: UserUpdate,
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Met à jour un utilisateur.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    user = service.get(id=id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    try:
        user = service.update(db_obj=user, obj_in=user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Supprime un utilisateur.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    user = service.get(id=id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    # Empêcher la suppression de l'utilisateur connecté
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer l'utilisateur connecté"
        )
    
    user = service.remove(id=id)
    return user


@router.get("/by-email/{email}", response_model=User)
def get_user_by_email(
    email: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Récupère un utilisateur par son email.
    """
    repository = UserRepository(UserModel, db)
    service = UserService(repository)
    user = service.get_by_email(email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    return user


# Add this at the top with your other imports
UPLOAD_DIR = Path("frontend/static/profile_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/me/photo", response_model=User)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Upload a profile photo for the current user.
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Le fichier doit être une image"
            )
        
        # Create unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"user_{current_user.id}{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user profile in database
        repository = UserRepository(UserModel, db)
        service = UserService(repository)
        
        # Create the URL path for the photo
        photo_url = f"/static/profile_photos/{filename}"
        user = service.update(
            db_obj=current_user,
            obj_in={"profile_photo": photo_url}
        )
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du téléchargement de la photo: {str(e)}"
        )