# def safe_divide(a,b):
#     try:
#             return a/b
#     except Exception as e:
#         print("the error is: ", e)
#     finally:
#         print("this is the finally block")

# print(safe_divide(10, 0))

while True:
    user_input = input("Enter your age: ")
    try:
        if user_input.isdigit() == True :
            age = int(user_input)
            if age > 0 and age <= 120:
                print("Valid age")
                break
            else:
                raise ValueError("Age must be between 1 and 120.")
    except ValueError as e:
        print(e)
    