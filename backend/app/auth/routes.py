from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth import schemas, utils, dependencies
from app.auth.models import User

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(dependencies.get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    print(user.password)
    print(type(user.password))
    print(len(user.password))
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = utils.get_password_hash(user.password)
    new_user = User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    # Create access token
    access_token = utils.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(dependencies.get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    
    print("INPUT USERNAME:", user.username)
    print("DB USER:", db_user)
    
    
    if not db_user or not utils.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = utils.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}