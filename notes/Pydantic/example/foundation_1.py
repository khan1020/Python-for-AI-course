from pydantic import BaseModel

class User(BaseModel):
    id :int
    name :str
    is_active :bool

user = User(id=1, name="John Doe", is_active=True)

print(user)


class Product(BaseModel):
    id : int
    name :str
    price :float
    in_stock :bool = True
